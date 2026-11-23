/* Promoções editoriais originais da Central 360 — sem anúncios externos,
 * sem cookies de rastreamento e sem links de downloads comerciais.
 * Alterar este arquivo para adicionar/remover campanhas.
 */
(function(){
"use strict";
var items=[
  {id:"biblioteca",kicker:"NOVIDADE • CENTRAL 360",title:"Sua biblioteca gamer ficou maior.",body:"39 vídeos do nosso canal e 9 guias para explorar tutoriais, patches, Aurora e muito mais.",image:"./assets/art-tutoriais.svg",link:"#/biblioteca",cta:"EXPLORAR BIBLIOTECA",theme:"cyan"},
  {id:"classico",kicker:"FUTEBOL VIRTUAL • 2006/07",title:"A nostalgia entra em campo.",body:"Conheça nosso espaço dedicado ao PES 2021 Classic Patch 2006/2007, com informações e novidades.",image:"./assets/art-patch-classico.svg",link:"#/jogo/pes-2021-classic-patch-2006-2007",cta:"CONHECER O PATCH",theme:"green"},
  {id:"aurora",kicker:"GUIAS • XBOX 360 RGH",title:"Aurora: aprenda com a Central 360.",body:"Veja o tutorial do canal sobre configuração e atualização do Aurora no Xbox 360 RGH.",image:"./assets/art-xbox-biblioteca.svg",link:"#/biblioteca/aurora",cta:"VER TUTORIAL",theme:"mint"}
];
function escapeHtml(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function featureSection(){
return '<section class="section container feature-promo-section" aria-labelledby="feature-promos-title"><div class="section-head"><div><div class="eyebrow">EXCLUSIVOS CENTRAL 360</div><h2 id="feature-promos-title">Confira os destaques</h2></div><a class="section-link" href="#/biblioteca">BIBLIOTECA COMPLETA ↗</a></div><div class="feature-promo-grid">'+
items.map(function(p){return '<a class="feature-promo-card theme-'+escapeHtml(p.theme)+'" href="'+escapeHtml(p.link)+'"><img src="'+escapeHtml(p.image)+'" alt="" loading="lazy" decoding="async"><span class="feature-promo-shade"></span><span class="feature-promo-content"><span class="feature-promo-kicker">'+escapeHtml(p.kicker)+'</span><strong>'+escapeHtml(p.title)+'</strong><span class="feature-promo-link">'+escapeHtml(p.cta)+' <span aria-hidden="true">↗</span></span></span></a>'}).join("")+
'</div></section>';
}
window.C360_PROMOS={items:items,featureSection:featureSection};
var root,active=0,lastManualTrigger=null;
var storageKey="c360-promos-last-auto-v1",cooldownMs=7*24*60*60*1000;
function safeRead(){try{return Number(window.localStorage.getItem(storageKey)||0)}catch(e){return Date.now()}}
function safeWrite(v){try{window.localStorage.setItem(storageKey,String(v))}catch(e){}}
function chosen(){return Math.floor(Date.now()/(7*24*60*60*1000))%items.length}
function renderPopup(){
if(!root)return;
var p=items[active];
root.innerHTML='<div class="promo-popup-image"><img src="'+escapeHtml(p.image)+'" alt="" decoding="async"><span class="promo-popup-image-shade"></span><span class="promo-popup-counter">'+(active+1)+' / '+items.length+'</span></div>'+
'<div class="promo-popup-body"><div class="promo-popup-top"><span class="promo-popup-kicker">'+escapeHtml(p.kicker)+'</span><button class="promo-popup-close" type="button" aria-label="Fechar a novidade" title="Fechar">×</button></div>'+
'<h2 id="promo-popup-title">'+escapeHtml(p.title)+'</h2><p>'+escapeHtml(p.body)+'</p>'+
'<div class="promo-popup-bottom"><a class="promo-popup-cta" href="'+escapeHtml(p.link)+'">'+escapeHtml(p.cta)+' <span aria-hidden="true">↗</span></a><button class="promo-popup-next" type="button" aria-label="Ver a próxima novidade">Próximo ›</button></div></div>';
root.querySelector(".promo-popup-close").addEventListener("click",closePopup);
root.querySelector(".promo-popup-next").addEventListener("click",function(){active=(active+1)%items.length;renderPopup()});
root.querySelector(".promo-popup-cta").addEventListener("click",function(){closePopup()});
}
function showPopup(manual){
if(!root)return;
if(manual)lastManualTrigger=document.activeElement;
active=manual?0:chosen();
renderPopup();root.hidden=false;
if(manual){var close=root.querySelector(".promo-popup-close");if(close)close.focus()}
}
function closePopup(){
if(!root)return;
root.hidden=true;
if(lastManualTrigger&&typeof lastManualTrigger.focus==="function")lastManualTrigger.focus();
lastManualTrigger=null;
}
function init(){
if(document.getElementById("promo-popup"))return;
root=document.createElement("aside");
root.id="promo-popup";
root.className="promo-popup";
root.setAttribute("role","region");
root.setAttribute("aria-label","Novidades da Central 360");
root.setAttribute("aria-labelledby","promo-popup-title");
root.hidden=true;
document.body.appendChild(root);
["open-promos","open-promos-mobile"].forEach(function(id){var btn=document.getElementById(id);if(btn)btn.addEventListener("click",function(){showPopup(true)})});
document.addEventListener("keydown",function(event){if(event.key==="Escape"&&root&&!root.hidden)closePopup()});
var delay=(window.matchMedia&&window.matchMedia("(max-width: 640px)").matches)?14000:10500;
if(typeof window.setTimeout==="function")window.setTimeout(function(){
if(!root||!root.hidden||document.visibilityState==="hidden")return;
var hash=String(window.location.hash||"#/");
if(hash!=="#/"&&hash!=="#"&&hash!=="")return;
var last=safeRead();
if(last&&Date.now()-last<cooldownMs)return;
safeWrite(Date.now());
showPopup(false);
},delay);
}
if(typeof document!=="undefined"&&typeof document.addEventListener==="function"){
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
}
})();