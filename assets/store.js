/* Central 360 • Loja própria (frontend). Não usa Nuvemshop.
 * Em GitHub Pages: apenas prévia (API indisponível, zero cobranças).
 * Em Cloudflare Worker: lista produtos publicados em D1 e integra Payment Brick.
 */
(function(){
"use strict";
var products=[],ready=false,publicKey="",cart=new Set(),activeBrick=null,pollTimer=null;
var planned=[
 {name:"PES 2021 PC",kind:"PC • Produto digital",image:"./assets/art-patch-classico.svg",note:"Aguardando verificação da licença e do arquivo autorizado."},
 {name:"PES 2021 Classic Patch 2006/2007",kind:"Patch clássico",image:"./assets/art-patch-classico.svg",note:"Catalogação e permissão de distribuição em revisão."},
 {name:"Dragon Ball Budokai Tenkaichi 3",kind:"Clássico do PlayStation 2",image:"./assets/art-xbox-biblioteca.svg",note:"Disponibilidade comercial e direitos ainda precisam ser confirmados."},
 {name:"IA do Seu Jeito",kind:"E-book autoral",image:"./assets/art-tutoriais.svg",note:"Nova edição do livro em revisão editorial antes de iniciar vendas."}
];
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function brl(cents){return (Number(cents)/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function api(path,options){return fetch(path,{...options,headers:{"Content-Type":"application/json",...(options?.headers||{})},cache:"no-store"}).then(async function(response){const data=await response.json();if(!response.ok)throw Error(data.error||"Não foi possível concluir.");return data})}
function breadcrumbs(name){return '<nav class="breadcrumb" aria-label="Você está aqui"><a href="#/">Início</a><span>›</span><span>'+esc(name)+'</span></nav>'}
function preview(){
return '<div class="store-grid">'+planned.map(function(p){return '<article class="store-product is-preview"><div class="store-cover"><img src="'+esc(p.image)+'" alt="" loading="lazy"></div><div class="store-product-content"><span class="store-category">'+esc(p.kind)+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.note)+'</p><span class="store-not-yet">EM REVISÃO • SEM COBRANÇA</span></div></article>'}).join("")+'</div>';
}
function page(){
return '<main class="container content-layout">'+breadcrumbs("Loja")+
'<section class="store-hero"><div class="store-hero-copy"><span class="eyebrow">Loja Central 360 • LOJA PRÓPRIA</span><h1>Seu próximo conteúdo, <span>direto da Central 360.</span></h1><p>Estamos criando uma loja independente para produtos digitais autorizados, e-books e conteúdos próprios. Carrinho, pagamento e entrega acontecerão na nossa plataforma, após a implantação segura.</p><span class="store-hero-tag">Sem Nuvemshop • Checkout Mercado Pago planejado</span></div><img src="./assets/art-xbox-biblioteca.svg" alt="" decoding="async"></section>'+
'<section class="store-catalog-section" aria-labelledby="store-title"><div class="section-head"><div><div class="eyebrow">CATÁLOGO EM CONSTRUÇÃO</div><h2 id="store-title">Produtos e lançamentos</h2></div><a class="section-link" href="#/biblioteca">VER VÍDEOS ↗</a></div><p id="store-message" role="status" class="store-message">Consultando disponibilidade da loja segura…</p><div id="store-products">'+preview()+'</div></section>'+
'<section id="store-cart" class="store-cart" hidden aria-label="Carrinho de compras"></section>'+
'<section class="store-security"><h2>Como será sua compra?</h2><div class="store-steps"><div><b>01</b><strong>Escolha</strong><span>Selecione materiais publicados e licenciados.</span></div><div><b>02</b><strong>Pague com segurança</strong><span>Pix ou cartão por componentes oficiais do Mercado Pago.</span></div><div><b>03</b><strong>Receba</strong><span>Após confirmação bancária, download privado e aviso por e-mail.</span></div></div><p>Produtos físicos e mídias com direitos de terceiros exigem fluxos próprios e validação de licenças. Nenhum material em revisão pode ser comprado nesta prévia.</p></section></main>';
}
function orderPage(id){
return '<main class="container content-layout">'+breadcrumbs("Pedido")+'<section class="store-order"><span class="eyebrow">COMPRA DIRETO NA CENTRAL 360</span><h1>Seu pedido</h1><p>Número do pedido: <code>'+esc(id)+'</code></p><p id="order-message" role="status">Verificando a compra com segurança…</p><div id="order-content"></div><div id="paymentBrick_container"></div><div id="store-pix"></div><div id="store-downloads"></div><a class="section-link" href="#/loja">← VOLTAR À LOJA</a></section></main>';
}
function productCard(p){
var image=/^\.\/assets\/[a-zA-Z0-9./_-]+$/.test(p.image||"")?p.image:"./assets/art-tutoriais.svg";
return '<article class="store-product"><div class="store-cover"><img src="'+esc(image)+'" alt="" loading="lazy"></div><div class="store-product-content"><span class="store-category">'+esc(p.category)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.description)+'</p><strong class="store-price">'+esc(brl(p.price_cents))+'</strong><button type="button" class="store-add" data-add="'+esc(p.id)+'">'+(cart.has(p.id)?"RETIRAR DO CARRINHO":"ADICIONAR AO CARRINHO")+'</button></div></article>';
}
function renderCatalog(){
var target=document.getElementById("store-products");if(!target)return;
target.innerHTML=products.length?'<div class="store-grid">'+products.map(productCard).join("")+'</div>':preview();
const message=document.getElementById("store-message");
if(message)message.textContent=ready&&products.length?"Produtos disponíveis para compra na loja segura.": "O checkout ainda está em preparação. Os itens abaixo não estão à venda nem podem ser cobrados.";
target.addEventListener("click",function(e){const btn=e.target.closest("button[data-add]");if(!btn)return;const id=btn.getAttribute("data-add");if(cart.has(id))cart.delete(id);else cart.add(id);renderCatalog();renderCart()},{once:true});
renderCart();
}
function renderCart(){
const node=document.getElementById("store-cart");if(!node)return;
const chosen=products.filter(p=>cart.has(p.id));
node.hidden=!(ready&&chosen.length);
if(node.hidden){node.innerHTML="";return}
const total=chosen.reduce((n,p)=>n+p.price_cents,0);
node.innerHTML='<div class="store-cart-heading"><h2>Seu carrinho</h2><strong>'+brl(total)+'</strong></div><ul>'+chosen.map(function(p){return '<li>'+esc(p.title)+' <strong>'+brl(p.price_cents)+'</strong></li>'}).join("")+'</ul><form id="store-checkout-form"><label for="store-email">E-mail para receber seu pedido</label><input id="store-email" name="email" type="email" autocomplete="email" placeholder="seu@email.com" maxlength="180" required><p class="store-small">O pagamento e a entrega estarão disponíveis somente após ativação do serviço seguro, com as verificações concluídas.</p><button type="submit" class="btn">CONTINUAR PARA PAGAMENTO →</button></form><p class="store-feedback" id="store-checkout-feedback" role="status"></p>';
node.querySelector("form").addEventListener("submit",checkout);
}
async function checkout(event){
event.preventDefault();
if(!ready)return;
const form=event.currentTarget,feedback=document.getElementById("store-checkout-feedback"),button=form.querySelector("button");
button.disabled=true;feedback.textContent="Preparando pedido…";
try{
const email=String(form.elements.namedItem("email")?.value||"").trim();
const created=await api("/api/orders",{method:"POST",body:JSON.stringify({email,items:[...cart]})});
try{sessionStorage.setItem("c360-order-"+created.order_id,JSON.stringify({token:created.token,amount:created.amount,email}))}catch{}
location.hash="#/pedido/"+created.order_id+"?chave="+encodeURIComponent(created.token);
}catch(error){feedback.textContent=error.message;button.disabled=false}
}
function getOrderToken(id,params){
const direct=params.get("chave")||"";
if(/^[a-f0-9]{64}$/.test(direct))return direct;
try{return JSON.parse(sessionStorage.getItem("c360-order-"+id)||"{}").token||""}catch{return ""}
}
async function readOrder(id,token){
return api("/api/orders/"+encodeURIComponent(id),{headers:{Authorization:"Bearer "+token}});
}
function showStatus(data,token,id){
const message=document.getElementById("order-message"),box=document.getElementById("order-content"),downloads=document.getElementById("store-downloads");
if(!message||!box||!downloads)return;
const label={created:"Aguardando início do pagamento",pending:"Aguardando confirmação do pagamento",paid:"Pagamento confirmado",rejected:"Pagamento não aprovado",cancelled:"Pagamento cancelado",revoked:"Pedido estornado ou contestado"};
message.textContent=label[data.status]||"Pedido em análise";
box.innerHTML='<div class="store-order-summary"><div><strong>Total do pedido</strong><b>'+brl(Math.round(data.amount*100))+'</b></div><ul>'+data.items.map(p=>'<li>'+esc(p.title)+'</li>').join("")+'</ul></div>';
downloads.innerHTML=data.status==="paid"?
'<div class="store-success"><h2>Arquivos liberados</h2><p>Seu material está disponível para download privado. O acesso também será encaminhado por e-mail.</p>'+data.items.map(p=>p.download?'<a class="btn" href="'+esc(p.download)+'?chave='+encodeURIComponent(token)+'">BAIXAR '+esc(p.title)+' ↓</a>':"").join("")+'</div>':"";
}
function loadSdk(){
if(window.MercadoPago)return Promise.resolve();
if(window.c360LoadingSdk)return window.c360LoadingSdk;
window.c360LoadingSdk=new Promise(function(resolve,reject){
var s=document.createElement("script");s.src="https://sdk.mercadopago.com/js/v2";s.async=true;s.onload=resolve;s.onerror=function(){reject(Error("Não foi possível carregar o formulário do Mercado Pago."))};document.head.appendChild(s);
});
return window.c360LoadingSdk;
}
async function initBrick(order,token,id){
const root=document.getElementById("paymentBrick_container");if(!root||!publicKey)return;
await loadSdk();
if(activeBrick&&typeof activeBrick.unmount==="function"){try{await activeBrick.unmount()}catch{}activeBrick=null}
const mp=new window.MercadoPago(publicKey,{locale:"pt-BR"}),bricks=mp.bricks();
activeBrick=await bricks.create("payment","paymentBrick_container",{
 initialization:{amount:order.amount},
 customization:{paymentMethods:{bankTransfer:"all",creditCard:"all",debitCard:"all"}},
 callbacks:{
 onReady:function(){},
 onSubmit:async function({formData}){
  const result=await api("/api/payments",{method:"POST",headers:{Authorization:"Bearer "+token},body:JSON.stringify({order_id:id,formData})});
  showPix(result);
  const updated=await readOrder(id,token);showStatus(updated,token,id);
  if(updated.status==="paid"&&activeBrick){await activeBrick.unmount();activeBrick=null}
 },
 onError:function(err){const el=document.getElementById("order-message");if(el)el.textContent="Erro no formulário de pagamento. Revise os dados e tente novamente."}
 }});
}
function showPix(payment){
const root=document.getElementById("store-pix");if(!root)return;
const text=String(payment.pix||"");
const qr=String(payment.qr_base64||"");
if(!text)return;
root.innerHTML='<div class="store-pix-panel"><h2>Pagamento por Pix</h2><p>Copie o código abaixo para pagar pelo aplicativo do seu banco. O material será liberado somente após confirmação.</p>'+(qr&&/^[a-zA-Z0-9+/=]+$/.test(qr)?'<img alt="QR Code Pix" src="data:image/png;base64,'+qr+'">':"")+'<textarea id="store-pix-code" readonly aria-label="Código Pix">'+esc(text)+'</textarea><button id="store-copy-pix" class="btn btn-outline" type="button">COPIAR CÓDIGO PIX</button></div>';
const btn=document.getElementById("store-copy-pix");btn?.addEventListener("click",function(){const el=document.getElementById("store-pix-code");if(navigator.clipboard?.writeText)navigator.clipboard.writeText(el.value).then(()=>btn.textContent="CÓDIGO COPIADO");else{el.select();btn.textContent="SELECIONE E COPIE O CÓDIGO"}});
}
async function mountOrder(id,params){
if(typeof fetch!=="function")return;
const token=getOrderToken(id,params);
if(!token){const m=document.getElementById("order-message");if(m)m.textContent="Link sem chave de acesso. Abra a mensagem de entrega que você recebeu por e-mail.";return}
try{
const [cfg,status]=await Promise.all([api("/api/config"),readOrder(id,token)]);
ready=cfg.ready;publicKey=cfg.public_key||"";
showStatus(status,token,id);
if(!cfg.ready)return;
if(status.status==="created"||status.status==="pending"){
 if(status.payment_id){
  const payment=await api("/api/payments",{method:"POST",headers:{Authorization:"Bearer "+token},body:JSON.stringify({order_id:id,formData:{}})});
  showPix(payment);
 }else await initBrick(status,token,id);
 if(pollTimer)clearInterval(pollTimer);
 pollTimer=setInterval(async function(){if(!document.getElementById("order-message")){clearInterval(pollTimer);return}try{const next=await readOrder(id,token);showStatus(next,token,id);if(next.status==="paid"||next.status==="revoked"){clearInterval(pollTimer);if(activeBrick?.unmount){await activeBrick.unmount();activeBrick=null}}}catch{}},12000);
}
}catch(e){const m=document.getElementById("order-message");if(m)m.textContent=e.message}
}
async function mount(){
if(typeof fetch!=="function"){renderCatalog();return}
try{
const [cfg,list]=await Promise.all([api("/api/config"),api("/api/products")]);
ready=Boolean(cfg.ready);publicKey=cfg.public_key||"";products=Array.isArray(list.products)?list.products:[];
}catch(e){ready=false;products=[]}
renderCatalog();
}
window.C360_STORE={page,mount,orderPage,mountOrder,preview,planned,brl};
})();