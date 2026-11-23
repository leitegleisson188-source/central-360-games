"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {createHmac}=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
let backend;
async function load(){if(!backend)backend=await import("../commerce/worker.mjs");return backend}
function req(p,method="GET",body=null,headers={}){
 return new Request("https://loja.central360.exemplo"+p,{method,headers:{"content-type":"application/json",...headers},body:body?JSON.stringify(body):undefined});
}
test("backend é módulo JavaScript carregável sem credenciais",async()=>{
 const w=await load();
 assert.equal(typeof w.default.fetch,"function");
 assert.equal(typeof w.internals.isValidWebhook,"function");
 assert.equal(typeof w.internals.applyPayment,"function");
});
test("saúde da API bloqueia cobranças antes de ativação explícita",async()=>{
 const w=await load(), env={STORE_ENABLED:"false"};
 const h=await w.default.fetch(req("/api/health"),env,{});
 assert.equal(h.status,200);
 assert.equal((await h.json()).status,"setup_required");
 const p=await w.default.fetch(req("/api/orders","POST",{email:"comprador@example.com",items:["ia-do-seu-jeito"]}),env,{});
 assert.equal(p.status,503);
 const cfg=await w.default.fetch(req("/api/config"),env,{});
 assert.equal((await cfg.json()).ready,false);
});
test("API pública não inventa produtos se o banco não estiver disponível",async()=>{
 const w=await load();
 const r=await w.default.fetch(req("/api/products"),{},{});
 const json=await r.json();
 assert.deepEqual(json.products,[]);
 assert.equal(json.ready,false);
});
test("variáveis secretas exigidas antes de habilitar checkout",async()=>{
 const w=await load();
 const env={STORE_ENABLED:"true",MP_PUBLIC_KEY:"APP_USR-public"};
 assert.equal(w.internals.enabled(env),false);
 assert.equal(w.internals.validEmail("a@example.com"),true);
 assert.equal(w.internals.validEmail("invalid-email"),false);
 assert.equal(w.internals.cents(32.90),3290);
 assert.equal(w.internals.money(2990),29.90);
});
test("assinatura HMAC Mercado Pago é verificada e não aceita alteração",async()=>{
 const w=await load();
 const id="123456789";
 const requestId="req-central-360";
 const ts=String(Date.now());
 const message="id:"+id+";request-id:"+requestId+";ts:"+ts+";";
 const secret="segredo-somente-servidor";
 const signature=createHmac("sha256",secret).update(message).digest("hex");
 const headers={"x-signature":"ts="+ts+",v1="+signature,"x-request-id":requestId};
 const request=req("/api/webhooks/mercadopago?data.id="+id,"POST",{type:"payment",data:{id}},headers);
 assert.equal(await w.internals.isValidWebhook(request,{MP_WEBHOOK_SECRET:secret},id),true);
 assert.equal(await w.internals.isValidWebhook(request,{MP_WEBHOOK_SECRET:"chave-errada"},id),false);
 assert.equal(await w.internals.isValidWebhook(request,{MP_WEBHOOK_SECRET:secret},"123456780"),false);
});
test("token público do comprador não é armazenado em claro",async()=>{
 const w=await load();
 const hashed=await w.internals.hash("test-token-123");
 assert.match(hashed,/^[0-9a-f]{64}$/);
 assert.notEqual(hashed,"test-token-123");
 const schema=fs.readFileSync(path.join(root,"commerce/schema.sql"),"utf8");
 assert.match(schema,/access_hash TEXT NOT NULL/);
 assert.doesNotMatch(schema,/delivery_token TEXT/);
});
test("mercado pago só libera pagamento com ID, valor e email conferidos",async()=>{
 const w=await load();
 const order={id:"b4c170d8-d5f9-4c16-8580-10adf0ab482d",email:"cliente@example.com",amount_cents:3290,status:"pending",payment_id:null};
 const statements=[];
 const DB={prepare(sql){
   return {bind(...args){
     statements.push({sql,args});
     return {
       async first(){return {...order}},
       async run(){const [pid,raw,status]=args;order.payment_id=pid;order.payment_status=raw;order.status=status;return {meta:{changes:1}}}
     };
   }};
 }};
 const env={DB};
 const good={id:123,external_reference:order.id,transaction_amount:32.90,currency_id:"BRL",payer:{email:order.email},status:"approved"};
 const badPrice={...good,transaction_amount:1};
 const badEmail={...good,payer:{email:"fraude@example.com"}};
 assert.equal(await w.internals.applyPayment(env,badPrice),null);
 assert.equal(await w.internals.applyPayment(env,badEmail),null);
 assert.equal(order.status,"pending");
 const paid=await w.internals.applyPayment(env,good);
 assert.equal(paid.status,"paid");
 assert.equal(order.payment_id,"123");
 const refund=await w.internals.applyPayment(env,{...good,status:"refunded"});
 assert.equal(refund.status,"revoked");
});
test("schema de produtos exige direitos verificados e default desativado",()=>{
 const sql=fs.readFileSync(path.join(root,"commerce/schema.sql"),"utf8");
 const worker=fs.readFileSync(path.join(root,"commerce/worker.mjs"),"utf8");
 assert.match(sql,/rights_verified INTEGER NOT NULL DEFAULT 0/);
 assert.match(sql,/active INTEGER NOT NULL DEFAULT 0/);
 assert.match(worker,/rights_verified=1/);
 assert.match(worker,/DELIVERY_BUCKET\.get/);
 assert.match(worker,/payment\.status==="approved"/);
 assert.match(worker,/notification_url/);
});
test("deploy usa pasta isolada, sem expor backend nem dados de clientes",()=>{
 const script=fs.readFileSync(path.join(root,"commerce/scripts/prepare-assets.mjs"),"utf8");
 const wrangler=fs.readFileSync(path.join(root,"commerce/wrangler.toml"),"utf8");
 assert.match(script,/copyFile\(join\(root,"index\.html"\)/);
 assert.match(script,/join\(root,"assets",file\)/);
 assert.doesNotMatch(script,/worker\.mjs.*copyFile/);
 assert.match(wrangler,/directory = "\.\/public"/);
 assert.match(wrangler,/run_worker_first = \["\/api\/\*"\]/);
});
