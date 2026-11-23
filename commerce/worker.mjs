/**
 * Central 360 Games • backend independente para Cloudflare Workers.
 * D1: produtos/pedidos | R2 privado: PDFs e outros digitais autorizados.
 * Mercado Pago Payments API + Payment Brick; Resend: email de entrega.
 * IMPORTANTÍSSIMO: cobranças ficam BLOQUEADAS até STORE_ENABLED=true.
 */
const apiHeaders = {
  "Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store",
  "Referrer-Policy":"no-referrer",
  "X-Content-Type-Options":"nosniff"
};
const encode = new TextEncoder();
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:apiHeaders})}
function fail(msg,status=400){return json({error:msg},status)}
function cents(v){return Math.round(Number(v)*100)}
function validEmail(s){return typeof s==="string"&&s.length<=180&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)}
function money(v){return Number((v/100).toFixed(2))}
function enabled(env){return env.STORE_ENABLED==="true"&&!!(env.DB&&env.DELIVERY_BUCKET&&env.MP_ACCESS_TOKEN&&env.MP_PUBLIC_KEY&&env.MP_WEBHOOK_SECRET&&env.PUBLIC_ORIGIN&&env.RESEND_API_KEY&&env.FROM_EMAIL)}
function hex(u8){return [...u8].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function hash(input){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",encode.encode(input))))}
function authToken(req){let s=req.headers.get("authorization")||"";return /^Bearer [a-z0-9]{64}$/i.test(s)?s.slice(7):""}
function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return hex(b)}
async function readBody(req){if(Number(req.headers.get("content-length")||"0")>32000)throw Error("Corpo muito grande");const text=await req.text();if(text.length>32000)throw Error("Corpo muito grande");return JSON.parse(text||"{}")}
function normalizedUrl(v){try{let u=new URL(v);if(u.protocol==="https:"&&!u.username&&!u.password)return u.origin}catch{}return ""}
function safeProduct(p){return {id:p.id,title:p.title,description:p.description,category:p.category,price_cents:p.price_cents,currency:"BRL",image:p.image||"",digital:true}}
async function authOrder(req,env,id){
 const token=authToken(req);if(!token)return null;
 const order=await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
 if(!order)return null;
 const expected=await hash(token);
 return order.access_hash===expected?order:null;
}
async function orderLines(env,id){const r=await env.DB.prepare("SELECT product_id,title,price_cents,asset_key,download_name FROM order_items WHERE order_id=? ORDER BY product_id").bind(id).all();return r.results||[]}
async function paymentsApi(env,path,method="GET",body=null,idempotency=null){
 const headers={"Authorization":"Bearer "+env.MP_ACCESS_TOKEN,"Content-Type":"application/json"};
 if(idempotency)headers["X-Idempotency-Key"]=idempotency;
 const response=await fetch("https://api.mercadopago.com"+path,{method,headers,body:body?JSON.stringify(body):undefined});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok)throw Error("mercado_pago_"+response.status);
 return data;
}
async function applyPayment(env,payment){
 const orderId=String(payment.external_reference||"");
 if(!/^[a-f0-9-]{36}$/i.test(orderId))return null;
 const order=await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(orderId).first();
 if(!order)return null;
 const paymentId=String(payment.id||"");
 const total=cents(payment.transaction_amount);
 const email=String(payment.payer?.email||"").trim().toLowerCase();
 if(!paymentId||total!==order.amount_cents||email!==order.email||String(payment.currency_id||"BRL")!=="BRL")return null;
 if(order.payment_id&&String(order.payment_id)!==paymentId)return null;
 const status=payment.status==="approved"?"paid":payment.status==="rejected"?"rejected":payment.status==="cancelled"?"cancelled":"pending";
 // Nunca rebaixe um pedido confirmado para pending/rejected por notificações atrasadas.
 if(order.status==="paid")return order;
 await env.DB.prepare("UPDATE orders SET payment_id=COALESCE(payment_id,?),payment_status=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND (payment_id IS NULL OR payment_id=?) AND status!='paid'")
 .bind(paymentId,String(payment.status||""),status,orderId,paymentId).run();
 return await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(orderId).first();
}
async function sendDelivery(env,order){
 if(!order||order.status!=="paid"||!env.RESEND_API_KEY||!env.FROM_EMAIL||!env.PUBLIC_ORIGIN)return;
 // Token necessário para reabrir pedido e baixar arquivo. Guardamos apenas o hash.
 // Ele fica disponível nesta execução via ticket pré-gerado de entrega.
 const ticket=await env.DB.prepare("SELECT delivery_token FROM order_delivery_tickets WHERE order_id=?").bind(order.id).first();
 if(!ticket)return; // sem ticket: não envie link inválido
 const claim=await env.DB.prepare("UPDATE orders SET email_sent_at=CURRENT_TIMESTAMP WHERE id=? AND email_sent_at IS NULL AND status='paid'").bind(order.id).run();
 if(!(claim.meta?.changes>0))return;
 const u=env.PUBLIC_ORIGIN+"/#/pedido/"+order.id+"?chave="+ticket.delivery_token;
 const items=await orderLines(env,order.id);
 const text="Seu pagamento na Central 360 foi confirmado.\n\nItens:\n"+items.map(x=>"- "+x.title).join("\n")+"\n\nAcesse seus arquivos: "+u+"\n\nGuarde esta mensagem e não compartilhe o link.";
 try{
  const resp=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"c360-email-"+order.id},body:JSON.stringify({from:env.FROM_EMAIL,to:[order.email],subject:"Central 360 Games — seu pedido foi aprovado",text})});
  if(!resp.ok)throw Error("resend_"+resp.status);
 }catch(e){await env.DB.prepare("UPDATE orders SET email_sent_at=NULL WHERE id=?").bind(order.id).run();throw e}
}
async function isValidWebhook(req,env,dataId){
 const sig=req.headers.get("x-signature")||"";
 const requestId=req.headers.get("x-request-id")||"";
 const ts=/[,\s]ts=(\d+)/.exec(","+sig)?.[1]||(/^ts=(\d+)/.exec(sig)||[])[1];
 const v1=/[,\s]v1=([a-f0-9]{64})/i.exec(","+sig)?.[1]||(/^v1=([a-f0-9]{64})/i.exec(sig)||[])[1];
 if(!ts||!v1||!requestId||!/^\d+$/.test(dataId))return false;
 const epoch=Number(ts),millis=epoch<100000000000?epoch*1000:epoch;
 if(!Number.isFinite(millis)||Math.abs(Date.now()-millis)>15*60*1000)return false;
 const message="id:"+dataId+";request-id:"+requestId+";ts:"+ts+";";
 const key=await crypto.subtle.importKey("raw",encode.encode(env.MP_WEBHOOK_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const expected=hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,encode.encode(message))));
 let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^v1.toLowerCase().charCodeAt(i);
 return diff===0;
}
async function handler(req,env,ctx){
 const path=new URL(req.url).pathname;
 if(!path.startsWith("/api/"))return env.ASSETS?env.ASSETS.fetch(req):fail("Site estático não configurado",503);
 const origin=new URL(req.url).origin;
 const targetOrigin=normalizedUrl(env.PUBLIC_ORIGIN);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Allow":"GET, POST, OPTIONS"}});
 if(req.method==="GET"&&path==="/api/health")return json({service:"Central 360 Games",status:enabled(env)?"ready":"setup_required",commerce:"cloudflare-worker"});
 if(req.method==="GET"&&path==="/api/config")return json({ready:enabled(env),public_key:enabled(env)?env.MP_PUBLIC_KEY:null,currency:"BRL",checkout:"payment-brick"});
 if(req.method==="GET"&&path==="/api/products"){
  if(!env.DB)return json({products:[],ready:false});
  const r=await env.DB.prepare("SELECT id,title,description,category,price_cents,image FROM products WHERE active=1 AND rights_verified=1 AND asset_key IS NOT NULL AND asset_key!='' ORDER BY title LIMIT 100").all();
  return json({products:(r.results||[]).map(safeProduct),ready:enabled(env)});
 }
 if(req.method==="POST"&&path==="/api/webhooks/mercadopago"){
  if(!enabled(env))return fail("Integração não configurada",503);
  const url=new URL(req.url);
  const body=await readBody(req).catch(()=>({}));
  const id=String(url.searchParams.get("data.id")||body?.data?.id||"");
  if(!await isValidWebhook(req,env,id))return fail("Assinatura inválida",401);
  if(String(body.type||url.searchParams.get("type")||"")!=="payment")return json({ok:true,ignored:true});
  const payment=await paymentsApi(env,"/v1/payments/"+encodeURIComponent(id));
  const order=await applyPayment(env,payment);
  if(order?.status==="paid"&&ctx?.waitUntil)ctx.waitUntil(sendDelivery(env,order).catch(()=>{}));
  return json({ok:true});
 }
 if(req.method==="POST"&&path==="/api/orders"){
  if(!enabled(env)||origin!==targetOrigin)return fail("Loja aguardando configuração segura",503);
  const body=await readBody(req);
  const email=String(body.email||"").trim().toLowerCase();
  if(!validEmail(email))return fail("Informe um e-mail válido");
  const ids=body.items;
  if(!Array.isArray(ids)||ids.length<1||ids.length>8||ids.some(x=>typeof x!=="string"||x.length>90)||new Set(ids).size!==ids.length)return fail("Carrinho inválido");
  const rows=[];
  for(const id of ids){
   const p=await env.DB.prepare("SELECT * FROM products WHERE id=? AND active=1 AND rights_verified=1 AND asset_key IS NOT NULL AND asset_key!=''").bind(id).first();
   if(!p||!Number.isInteger(p.price_cents)||p.price_cents<=0)return fail("Um item não está disponível",409);
   rows.push(p);
  }
  const amount=rows.reduce((n,p)=>n+p.price_cents,0);
  if(amount>3000000)return fail("Limite do pedido excedido");
  const id=crypto.randomUUID(),token=randomToken(),h=await hash(token);
  const statements=[env.DB.prepare("INSERT INTO orders(id,email,access_hash,amount_cents,status) VALUES(?,?,?,?, 'created')").bind(id,email,h,amount)];
  for(const p of rows)statements.push(env.DB.prepare("INSERT INTO order_items(order_id,product_id,title,price_cents,asset_key,download_name) VALUES(?,?,?,?,?,?)").bind(id,p.id,p.title,p.price_cents,p.asset_key,p.download_name||"material.pdf"));
  // Ticket privado é armazenado em tabela restrita somente ao Worker.
  statements.push(env.DB.prepare("INSERT INTO order_delivery_tickets(order_id,delivery_token) VALUES(?,?)").bind(id,token));
  await env.DB.batch(statements);
  return json({order_id:id,token,amount:money(amount),total_cents:amount,items:rows.map(safeProduct)},201);
 }
 if(req.method==="POST"&&path==="/api/payments"){
  if(!enabled(env)||origin!==targetOrigin)return fail("Checkout indisponível",503);
  const body=await readBody(req);
  const orderId=String(body.order_id||"");
  const order=await authOrder(req,env,orderId);
  if(!order)return fail("Pedido não autorizado",403);
  if(order.status==="paid")return json({status:"approved",payment_id:order.payment_id});
  if(order.status!=="created"&&order.status!=="pending")return fail("Pedido não pode ser cobrado",409);
  if(order.payment_id){
    const existing=await paymentsApi(env,"/v1/payments/"+encodeURIComponent(order.payment_id));
    return json({status:existing.status,payment_id:String(existing.id),pix:existing.point_of_interaction?.transaction_data?.qr_code||null,qr_base64:existing.point_of_interaction?.transaction_data?.qr_code_base64||null});
  }
  const f=body.formData||{};
  const method=String(f.payment_method_id||"");
  if(!/^[a-z0-9_]{2,30}$/.test(method))return fail("Meio de pagamento inválido");
  if(method==="account_money"||method==="consumer_credits")return fail("Método não habilitado neste checkout");
  const payment={
    transaction_amount:money(order.amount_cents),
    description:"Central 360 Games — Pedido "+order.id.slice(0,8),
    external_reference:order.id,
    payment_method_id:method,
    payer:{email:order.email}
  };
  if(f.token){if(typeof f.token!=="string"||f.token.length>2048)return fail("Token de cartão inválido");payment.token=f.token}
  if(f.installments){const n=Number(f.installments);if(!Number.isInteger(n)||n<1||n>12)return fail("Parcelamento inválido");payment.installments=n}
  if(f.issuer_id&&/^\d{1,12}$/.test(String(f.issuer_id)))payment.issuer_id=String(f.issuer_id);
  if(f.payer?.identification?.type&&f.payer?.identification?.number){
    const type=String(f.payer.identification.type),number=String(f.payer.identification.number);
    if(["CPF","CNPJ"].includes(type)&&/^\d{11,14}$/.test(number))payment.payer.identification={type,number};
  }
  if(method!=="pix"&&!payment.token)return fail("Cartão sem token válido");
  payment.notification_url=env.PUBLIC_ORIGIN+"/api/webhooks/mercadopago";
  // Uma tentativa por pedido; chave estável evita duplicar cobranças em retry.
  const mp=await paymentsApi(env,"/v1/payments","POST",payment,order.id);
  const confirmed=await applyPayment(env,mp);
  if(confirmed?.status==="paid"&&ctx?.waitUntil)ctx.waitUntil(sendDelivery(env,confirmed).catch(()=>{}));
  return json({status:mp.status,payment_id:String(mp.id||""),pix:mp.point_of_interaction?.transaction_data?.qr_code||null,qr_base64:mp.point_of_interaction?.transaction_data?.qr_code_base64||null});
 }
 const match=path.match(/^\/api\/orders\/([a-f0-9-]{36})$/i);
 if(req.method==="GET"&&match){
  if(!env.DB)return fail("Banco não disponível",503);
  const order=await authOrder(req,env,match[1]);if(!order)return fail("Pedido não encontrado",404);
  // Consulta oficial permite atualizar eventual webhook atrasado.
  let current=order;
  if(order.payment_id&&order.status!=="paid"&&env.MP_ACCESS_TOKEN){
    try{const mp=await paymentsApi(env,"/v1/payments/"+encodeURIComponent(order.payment_id));current=await applyPayment(env,mp)||order;
      if(current.status==="paid"&&ctx?.waitUntil)ctx.waitUntil(sendDelivery(env,current).catch(()=>{}));
    }catch{}
  }
  const lines=await orderLines(env,current.id);
  return json({id:current.id,status:current.status,amount:money(current.amount_cents),payment_id:current.payment_id,items:lines.map(x=>({id:x.product_id,title:x.title,price_cents:x.price_cents,download:current.status==="paid"?"/api/download/"+encodeURIComponent(current.id)+"/"+encodeURIComponent(x.product_id):null}))});
 }
 const dl=path.match(/^\/api\/download\/([a-f0-9-]{36})\/([a-z0-9_-]{1,90})$/i);
 if(req.method==="GET"&&dl){
  const token=new URL(req.url).searchParams.get("chave");
  if(!token||!/^[a-f0-9]{64}$/.test(token))return fail("Acesso inválido",403);
  const authReq=new Request(req.url,{headers:{"authorization":"Bearer "+token}});
  const order=await authOrder(authReq,env,dl[1]);
  if(!order||order.status!=="paid")return fail("Pagamento ainda não confirmado",403);
  const item=await env.DB.prepare("SELECT * FROM order_items WHERE order_id=? AND product_id=?").bind(order.id,dl[2]).first();
  if(!item)return fail("Arquivo não encontrado",404);
  const object=await env.DELIVERY_BUCKET.get(item.asset_key);
  if(!object)return fail("Arquivo temporariamente indisponível",503);
  const safeName=String(item.download_name||"arquivo.pdf").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,120);
  return new Response(object.body,{headers:{"Content-Type":object.httpMetadata?.contentType||"application/octet-stream","Content-Disposition":'attachment; filename="'+safeName+'"',"Cache-Control":"no-store, private","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
 }
 return fail("Rota não encontrada",404);
}
export default {async fetch(req,env,ctx){try{return await handler(req,env,ctx)}catch(e){console.error("C360 backend",e?.message||e);return fail("Não foi possível concluir a operação. Tente novamente ou contate o suporte.",503)}}};
export const internals={enabled,validEmail,cents,money,hash,isValidWebhook,applyPayment};
