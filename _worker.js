const UQLOAD_API = "https://uqload.vc/api/file/direct_link";
const UQLOAD_HOST = /(^|\.)uqload\.vc$/i;
const EMBED_RE = /^https?:\/\/(?:www\.)?uqload\.vc\/embed-([^/?#]+)\.html(?:[?#].*)?$/i;

function getFileCode(value) {
  try {
    const match = new URL(value).href.match(EMBED_RE);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function resolveUqload(embedUrl) {
  const fileCode = getFileCode(embedUrl);
  if (!fileCode) return null;

  const api = new URL(UQLOAD_API);
  api.searchParams.set("key", "45eo2waz0k7v9x8v5");
  api.searchParams.set("file_code", fileCode);
  api.searchParams.set("q", "h");

  const response = await fetch(api, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) return null;

  const data = await response.json();
  const versions = Array.isArray(data?.result?.versions)
    ? data.result.versions
    : [];

  const order = ["h", "n", "l", "o"];
  for (const quality of order) {
    const version = versions.find(item =>
      item?.name === quality &&
      typeof item?.url === "string" &&
      /^https?:\/\//i.test(item.url)
    );
    if (version) return version.url;
  }

  const fallback = versions.find(item =>
    typeof item?.url === "string" &&
    /^https?:\/\//i.test(item.url)
  );

  return fallback?.url || null;
}

function copyMediaHeaders(upstream) {
  const headers = new Headers();

  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified"
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  return headers;
}

async function handleVideo(request) {
  const requestUrl = new URL(request.url);
  const embedUrl = requestUrl.searchParams.get("url");

  if (!embedUrl) {
    return new Response("Missing video URL", { status: 400 });
  }

  const mediaUrl = await resolveUqload(embedUrl);
  if (!mediaUrl) {
    return new Response("Video source unavailable", { status: 502 });
  }

  const upstreamUrl = new URL(mediaUrl);

  // Never turn this endpoint into an open proxy.
  // Only the URL returned by the UQLoad API is accepted.
  if (upstreamUrl.protocol !== "http:" && upstreamUrl.protocol !== "https:") {
    return new Response("Unsupported video protocol", { status: 502 });
  }

  const headers = new Headers();
  headers.set(
    "User-Agent",
    request.headers.get("User-Agent") || "Mozilla/5.0"
  );
  headers.set("Accept", "*/*");
  headers.set("Referer", embedUrl);

  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);

  const upstream = await fetch(upstreamUrl, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers,
    redirect: "follow"
  });

  return new Response(
    request.method === "HEAD" ? null : upstream.body,
    {
      status: upstream.status,
      headers: copyMediaHeaders(upstream)
    }
  );
}

const KFP_INJECT = `
<style id="nox-kfp-preview">
.nox-kfp-preview{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  z-index:50!important;
  display:block!important;
  background:#000!important;
  border:0!important;
  overflow:hidden!important;
  opacity:0;
  transition:opacity .45s ease;
}
.nox-kfp-preview.is-visible{opacity:1}
.nox-kfp-preview iframe{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  border:0!important;
  display:block!important;
}
.nox-kfp-preview button{
  position:absolute;
  right:12px;
  bottom:12px;
  z-index:3;
  border:1px solid rgba(255,255,255,.25);
  background:rgba(0,0,0,.72);
  color:#fff;
  border-radius:999px;
  width:40px;
  height:40px;
  font-size:17px;
  cursor:pointer;
  backdrop-filter:blur(8px);
}
</style>
<script id="nox-kfp-preview-script">
(function(){
'use strict';

var KFP_NAME='Kung Fu Panda 2';
var KFP_POSTER='https://www.impawards.com/2011/posters/kung_fu_panda_two.jpg';
var KFP_TRAILER='FQ63rqSRrEI';
var kfpTimer=null;
var kfpObserver=null;
var kfpFrame=null;
var kfpWrap=null;
var kfpOriginalBg='';
var kfpOriginalTitle='';

var kfpFilm={
  name:KFP_NAME,
  year:2011,
  genre:'animation arts-martiaux aventure famille comédie action',
  time:'1h 35',
  release:2011,
  lang:'TrueFrench',
  origin:'U.S.A.',
  tag:'TEST APERÇU',
  wiki:'Kung Fu Panda 2',
  desc:"Le rêve de Po s'est réalisé : il est devenu le Guerrier Dragon. Mais un nouvel ennemi menace la Chine avec une arme secrète et indestructible. Pour le vaincre, Po doit se tourner vers son passé et découvrir le secret de ses origines.",
  poster:KFP_POSTER
};

function kfpAddFilm(){
  if(typeof films==='undefined') return false;
  if(!films.some(function(f){return f && f.name===KFP_NAME;})) films.unshift(kfpFilm);
  if(typeof cinemaMeta!=='undefined'){
    cinemaMeta[KFP_NAME]=['U.S.A.','Jennifer Yuh','Manu Payet, Marie Gillain, Pierre Arditi'];
  }
  if(typeof posterMap!=='undefined' && !posterMap[KFP_NAME]) posterMap[KFP_NAME]=KFP_POSTER;
  if(typeof render==='function'){
    try{ currentPage=1; render('all'); }catch(e){}
  }
  return true;
}

function kfpCleanup(){
  if(kfpTimer){clearTimeout(kfpTimer);kfpTimer=null;}
  if(kfpWrap){kfpWrap.remove();kfpWrap=null;}
  kfpFrame=null;
  var art=document.getElementById('detailArt');
  if(art){
    art.style.backgroundImage=kfpOriginalBg || 'var(--detail-poster),linear-gradient(145deg,#20252d,#080a0e)';
    art.setAttribute('data-title',kfpOriginalTitle||KFP_NAME);
  }
}

function kfpShowPreview(){
  var modal=document.getElementById('modal');
  var art=document.getElementById('detailArt');
  var title=document.getElementById('detailTitle');
  if(!modal || modal.hidden || !art || !title || title.textContent.trim()!==KFP_NAME) return;
  kfpOriginalBg=art.style.backgroundImage || getComputedStyle(art).backgroundImage;
  kfpOriginalTitle=art.getAttribute('data-title') || KFP_NAME;
  art.setAttribute('data-title','');
  kfpWrap=document.createElement('div');
  kfpWrap.className='nox-kfp-preview';
  kfpFrame=document.createElement('iframe');
  kfpFrame.title='Aperçu Kung Fu Panda 2';
  kfpFrame.allow='autoplay; fullscreen; picture-in-picture';
  kfpFrame.allowFullscreen=true;
  kfpFrame.src='https://www.youtube.com/embed/'+KFP_TRAILER+'?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&modestbranding=1';
  var mute=document.createElement('button');
  mute.type='button';
  mute.textContent='🔇';
  mute.setAttribute('aria-label','Activer le son');
  mute.onclick=function(){
    try{
      var command=mute.dataset.unmuted==='1'?'mute':'unMute';
      kfpFrame.contentWindow.postMessage(JSON.stringify({event:'command',func:command,args:[]}), '*');
      mute.dataset.unmuted=mute.dataset.unmuted==='1'?'0':'1';
      mute.textContent=mute.dataset.unmuted==='1'?'🔊':'🔇';
      mute.setAttribute('aria-label',mute.dataset.unmuted==='1'?'Couper le son':'Activer le son');
    }catch(e){}
  };
  kfpWrap.appendChild(kfpFrame);
  kfpWrap.appendChild(mute);
  art.appendChild(kfpWrap);
  requestAnimationFrame(function(){if(kfpWrap)kfpWrap.classList.add('is-visible');});
}

function kfpSchedule(){
  if(kfpTimer) clearTimeout(kfpTimer);
  kfpTimer=setTimeout(kfpShowPreview,3000);
}

function kfpWatch(){
  var modal=document.getElementById('modal');
  if(!modal) return;
  var title=document.getElementById('detailTitle');
  var isKfp=!modal.hidden && title && title.textContent.trim()===KFP_NAME;
  if(isKfp){
    if(!kfpWrap && !kfpTimer) kfpSchedule();
  }else{
    kfpCleanup();
  }
}

kfpAddFilm();
kfpObserver=new MutationObserver(kfpWatch);
kfpObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
setInterval(kfpWatch,500);
window.addEventListener('pagehide',kfpCleanup);
window.addEventListener('beforeunload',kfpCleanup);
})();
</script>`;

async function injectKungFuPanda(request, response) {
  const url = new URL(request.url);
  if (url.pathname !== "/" && url.pathname !== "/index.html") return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const html = await response.text();
  if (html.includes('id="nox-kfp-preview-script"')) return new Response(html, response);
  const injected = html.replace(/<\/body>/i, KFP_INJECT + "</body>");
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(injected, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/video") {
      return handleVideo(request);
    }

    const response = await env.ASSETS.fetch(request);
    return injectKungFuPanda(request, response);
  }
};
