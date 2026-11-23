/* Biblioteca de vídeos oficiais da Central 360, integrada ao portal sem dependências. */
(function(){
"use strict";
var videos=window.C360_VIDEOS||[];
var channel=window.C360_CHANNEL||{url:"https://www.youtube.com/@central_360",handle:"@central_360"};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function cleanId(v){return /^[a-zA-Z0-9_-]{11}$/.test(v&&v.id||"")?v.id:""}
function url(v){var id=cleanId(v);return id?"https://www.youtube.com/watch?v="+id:""}
function thumb(v){var id=cleanId(v);return id?"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg":""}
function card(v){
var link=url(v);if(!link)return "";
return '<article class="video-card"><a class="video-thumb-link" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" aria-label="Assistir '+esc(v.title)+' no YouTube (abre em nova aba)"><img src="'+esc(thumb(v))+'" alt="" loading="lazy" decoding="async"><span class="video-play" aria-hidden="true">▶</span><span class="video-duration">'+esc(v.duration)+'</span></a><div class="video-info"><span class="video-category">'+esc(v.category)+'</span><h3><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">'+esc(v.title)+'</a></h3><p>'+esc(v.description)+'</p><div class="video-bottom"><span>Central 360 • YouTube</span><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">ASSISTIR ↗</a></div></div></article>';
}
function grid(arr){return '<div class="video-grid">'+arr.map(card).join("")+'</div>'}

var topics=window.C360_TOPICS||[];
function topicLink(slug){return "#/biblioteca/"+encodeURIComponent(slug)}
function topicBySlug(slug){return topics.find(function(t){return t.slug===slug})}
function videosByIds(ids){return (ids||[]).map(function(id){return videos.find(function(v){return v.id===id})}).filter(Boolean)}
function archiveVideos(){return videos.filter(function(v){return v.archive===true}).slice().sort(function(a,b){return String(a.publishedAt||"").localeCompare(String(b.publishedAt||""))})}
function topicCard(t){
var n=videosByIds(t.videoIds).length;
return '<a class="topic-card" href="'+topicLink(t.slug)+'"><span class="topic-icon">'+esc(t.icon)+'</span><span class="topic-copy"><strong>'+esc(t.title)+'</strong><small>'+esc(t.subtitle)+'</small><span class="topic-count">'+(n?n+' vídeo'+(n===1?"":"s"):'Guia em preparação')+'</span></span><span class="topic-arrow" aria-hidden="true">↗</span></a>';
}
function topicsGrid(){return '<div class="topics-grid">'+topics.map(topicCard).join("")+'</div>'}
function topicLanding(){
return '<section class="section topics-landing">'+sectionHead("GUIAS POR ASSUNTO","Explore por ferramenta ou tema","#/biblioteca","BIBLIOTECA")+'<p class="video-section-desc">Páginas dedicadas ao Aurora, Horizon, DashLaunch, kernel, HDs e outros assuntos do Xbox 360. Cada uma reúne vídeos do canal e orientações introdutórias.</p>'+topicsGrid()+'</section>';
}
function archiveTeaser(){
var old=archiveVideos().slice(0,6);
return '<section class="section archive-teaser">'+sectionHead("VIAGEM NO TEMPO","Clássicos do nosso canal","#/biblioteca/acervo","VER ACERVO COMPLETO")+'<p class="video-section-desc">Reunimos também vídeos antigos que marcaram a trajetória da Central 360, preservando os links de origem no YouTube.</p>'+grid(old)+'</section>';
}
function breadcrumbs(name){
return '<nav class="breadcrumb" aria-label="Você está aqui"><a href="#/">Início</a><span>›</span><a href="#/biblioteca">Biblioteca de vídeos</a><span>›</span><span>'+esc(name)+'</span></nav>';
}
function topicPage(slug){
if(slug==="acervo")return archivePage();
var t=topicBySlug(slug);
if(!t)return '<main class="container content-layout">'+breadcrumbs("Não encontrado")+'<div class="topic-missing"><h1>Assunto não encontrado</h1><p>Confira os guias disponíveis na biblioteca.</p><a href="#/biblioteca" class="btn">VER ASSUNTOS</a></div></main>';
var featured=videosByIds(t.videoIds),rel=videosByIds(t.relatedIds);
return '<main class="container content-layout">'+breadcrumbs(t.title)+
'<section class="topic-header"><span class="eyebrow">BIBLIOTECA DE FERRAMENTAS • CENTRAL 360</span><div class="topic-heading"><span class="topic-header-icon">'+esc(t.icon)+'</span><div><h1>'+esc(t.title)+'</h1><p class="topic-subtitle">'+esc(t.subtitle)+'</p></div></div><p class="topic-description">'+esc(t.description)+'</p><div class="hero-actions"><a class="btn btn-outline" href="#/biblioteca">← TODOS OS ASSUNTOS</a><a class="btn" href="'+esc(channel.url)+'" target="_blank" rel="noopener noreferrer">CANAL CENTRAL 360 ↗</a></div></section>'+
'<div class="topic-page-layout"><article class="topic-body"><h2>Conheça o assunto</h2><p>'+esc(t.intro)+'</p><h2>Cuidados importantes</h2><ul class="topic-tips">'+(t.tips||[]).map(function(tip){return '<li>'+esc(tip)+'</li>'}).join("")+'</ul><h2>Vídeos do canal sobre '+esc(t.title)+'</h2>'+(featured.length?grid(featured):'<div class="topic-no-video"><strong>Tutorial específico ainda não localizado.</strong><p>Não encontramos um vídeo público da Central 360 dedicado exclusivamente a '+esc(t.title)+'. Esta página fica preparada para quando houver conteúdo confirmado.</p></div>')+
(rel.length?'<h2>Conteúdos gerais relacionados</h2><p class="topic-related-note">Estes vídeos tratam de assuntos próximos; não são tutoriais exclusivos de '+esc(t.title)+'.</p>'+grid(rel):"")+
'</article><aside class="topic-sidebar"><div class="topic-sidebar-panel"><h3>Outros assuntos</h3><div class="topic-side-links">'+topics.filter(function(x){return x.slug!==t.slug}).map(function(x){return '<a href="'+topicLink(x.slug)+'"><span>'+esc(x.title)+'</span><span>→</span></a>'}).join("")+'</div></div><div class="topic-sidebar-panel"><h3>Assista no canal original</h3><p>Os vídeos desta biblioteca pertencem à Central 360 e abrem diretamente no YouTube.</p><a class="btn btn-sm" href="'+esc(channel.url)+'" target="_blank" rel="noopener noreferrer">ACESSAR CANAL ↗</a></div></aside></div></main>';
}
function archivePage(){
var old=archiveVideos();
return '<main class="container content-layout">'+breadcrumbs("Clássicos do canal")+'<section class="archive-header"><span class="eyebrow">ACERVO HISTÓRICO • CENTRAL 360</span><h1>Clássicos do nosso canal</h1><p>Um passeio pelas publicações mais antigas da Central 360: clássicos de futebol, games do Xbox 360, Bomba Patch, personalizações e nostalgia. Todas as miniaturas e links levam aos vídeos originais.</p><div class="archive-stats"><strong>'+old.length+'</strong> vídeos antigos verificados · publicações de 2024 a 2026</div><a class="btn btn-outline" href="#/biblioteca">← VOLTAR À BIBLIOTECA</a></section>'+sectionHead("NOSTALGIA EM VÍDEO","Explore o acervo","#/biblioteca","BIBLIOTECA COMPLETA")+grid(old)+'</main>';
}

function sectionHead(caption,title,target,label){return '<div class="section-head"><div><div class="eyebrow">'+caption+'</div><h2>'+title+'</h2></div><a class="section-link" href="'+target+'"'+(target.indexOf("https://")===0?' target="_blank" rel="noopener noreferrer"':"")+'>'+label+' ↗</a></div>'}
function teaserSection(){
return '<section class="section container video-teaser">'+sectionHead("CENTRAL 360 NO YOUTUBE","Nossa biblioteca de vídeos","#/biblioteca","VER BIBLIOTECA")+'<p class="video-section-desc">Tutorial de Aurora, desbloqueio do Xbox 360 e patches. Assista aos conteúdos no nosso canal.</p>'+grid(videos.slice(0,3))+'</section>';
}
function tutorialSection(){
var list=videos.filter(function(v){return ["Aurora","Desbloqueio","Sistema","Patches"].includes(v.category)}).slice(0,3);
return '<section class="section">'+sectionHead("ASSISTA E APRENDA","Tutoriais em vídeo","#/biblioteca","TODOS OS VÍDEOS")+grid(list)+'</section>';
}
function page(){
var examples=videos.slice(0,3).map(function(v,i){return '<div class="video-hero-tile tile-'+(i+1)+'"><img src="'+esc(thumb(v))+'" alt="" loading="eager" decoding="async"></div>'}).join("");
return '<main class="container content-layout"><nav class="breadcrumb" aria-label="Você está aqui"><a href="#/">Início</a><span>›</span><span>Biblioteca de vídeos</span></nav>'+
'<section class="video-hero"><div class="video-hero-copy"><span class="eyebrow">CENTRAL 360 • CANAL OFICIAL</span><h1>UMA BIBLIOTECA PARA <span>QUEM VIVE O XBOX 360.</span></h1><p>Tutoriais sobre Aurora, desbloqueio, kernel, patches e HDs. Encontre o assunto e assista ao vídeo completo no nosso canal.</p><div class="hero-actions"><button type="button" id="video-explore" class="btn">EXPLORAR VÍDEOS ↓</button><a href="'+esc(channel.url)+'" class="btn btn-outline" target="_blank" rel="noopener noreferrer">CONHECER O CANAL ↗</a></div><span class="video-hero-sub"><strong>'+videos.length+'</strong> vídeos selecionados • Biblioteca em crescimento</span></div><div class="video-hero-gallery" aria-hidden="true">'+examples+'</div></section>'+
topicLanding()+archiveTeaser()+
'<section class="section video-library" id="video-results">'+sectionHead("ASSISTA E APRENDA","Encontre seu próximo tutorial",esc(channel.url),"VER CANAL NO YOUTUBE")+
'<div class="video-filters"><label class="video-search" for="video-query"><span aria-hidden="true">⌕</span><input type="search" id="video-query" placeholder="Pesquisar Aurora, kernel, Horizon..." autocomplete="off"></label><label class="video-sort" for="video-sort">Ordenar <select id="video-sort" class="filter-select"><option value="destaques">Destaques</option><option value="az">Título A–Z</option><option value="za">Título Z–A</option></select></label></div>'+
'<div id="video-categories" class="video-categories" aria-label="Filtrar por categoria"></div><p id="video-count" class="video-count" role="status"></p><div id="video-grid"></div></section>'+
'<section class="section"><div class="video-promo"><div><div class="eyebrow">ACOMPANHE NOSSOS CONTEÚDOS</div><h2>Aulas novas, gameplays e novidades.</h2><p>Os vídeos continuam hospedados no YouTube. Inscreva-se para acompanhar as publicações da Central 360.</p></div><a class="btn" target="_blank" rel="noopener noreferrer" href="'+esc(channel.url)+'">VISITAR '+esc(channel.handle)+' ↗</a></div></section></main>';
}
var state=null;
function mount(params){
state={q:params.get("q")||"",category:params.get("categoria")||"",sort:params.get("ordem")||"destaques"};
var q=document.getElementById("video-query"),s=document.getElementById("video-sort"),c=document.getElementById("video-categories");
if(!q||!s||!c)return;
q.value=state.q;s.value=state.sort;
var explore=document.getElementById("video-explore");if(explore)explore.addEventListener("click",function(){document.getElementById("video-results").scrollIntoView({behavior:"smooth"})});
q.addEventListener("input",function(){state.q=this.value;update()});
s.addEventListener("change",function(){state.sort=this.value;update()});
c.addEventListener("click",function(e){var btn=e.target.closest("button[data-category]");if(!btn)return;state.category=btn.getAttribute("data-category");update()});
update();
}
function update(){
if(!state)return;
var ps=new URLSearchParams(),q=state.q.trim().toLocaleLowerCase("pt-BR");
if(state.q.trim())ps.set("q",state.q.trim());
if(state.category)ps.set("categoria",state.category);
if(state.sort!=="destaques")ps.set("ordem",state.sort);
history.replaceState(null,"",location.pathname+location.search+"#/biblioteca"+(ps.toString()?"?"+ps.toString():""));
var cats=["Todos"].concat(Array.from(new Set(videos.map(function(v){return v.category}))));
document.getElementById("video-categories").innerHTML=cats.map(function(c){var v=c==="Todos"?"":c,on=state.category===v;return '<button type="button" data-category="'+esc(v)+'" aria-pressed="'+on+'" class="video-chip'+(on?' on':'')+'">'+esc(c)+'</button>'}).join("");
var selected=videos.filter(function(v){return (!state.category||v.category===state.category)&&(!q||(v.title+" "+v.description+" "+v.category+" "+(v.tags||[]).join(" ")).toLocaleLowerCase("pt-BR").includes(q))});
if(state.sort==="az")selected.sort(function(a,b){return a.title.localeCompare(b.title,"pt-BR")});
if(state.sort==="za")selected.sort(function(a,b){return b.title.localeCompare(a.title,"pt-BR")});
document.getElementById("video-count").textContent=selected.length+" vídeo"+(selected.length===1?"":"s")+" encontrado"+(selected.length===1?"":"s");
document.getElementById("video-grid").innerHTML=selected.length?grid(selected):'<div class="video-empty"><strong>Nenhum vídeo encontrado.</strong><p>Tente outro assunto ou remova o filtro.</p><button id="video-clear" type="button" class="btn btn-sm">LIMPAR FILTROS</button></div>';
var clear=document.getElementById("video-clear");if(clear)clear.addEventListener("click",function(){state={q:"",category:"",sort:"destaques"};document.getElementById("video-query").value="";document.getElementById("video-sort").value="destaques";update()});
}
window.C360_LIB={page:page,mount:mount,teaserSection:teaserSection,tutorialSection:tutorialSection,videoCard:card,topicPage:topicPage,archiveVideos:archiveVideos,topicsGrid:topicsGrid};
})();
