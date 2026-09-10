const UQLOAD_API = "https://uqload.vc/api/file/direct_link";
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
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" }
  });
  if (!response.ok) return null;

  const data = await response.json();
  const versions = Array.isArray(data?.result?.versions) ? data.result.versions : [];
  for (const quality of ["h", "n", "l", "o"]) {
    const version = versions.find(item =>
      item?.name === quality && typeof item?.url === "string" && /^https?:\/\//i.test(item.url)
    );
    if (version) return version.url;
  }
  return versions.find(item => typeof item?.url === "string" && /^https?:\/\//i.test(item.url))?.url || null;
}

function copyMediaHeaders(upstream) {
  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
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
  const embedUrl = new URL(request.url).searchParams.get("url");
  if (!embedUrl) return new Response("Missing video URL", { status: 400 });

  const mediaUrl = await resolveUqload(embedUrl);
  if (!mediaUrl) return new Response("Video source unavailable", { status: 502 });

  const upstreamUrl = new URL(mediaUrl);
  if (upstreamUrl.protocol !== "http:" && upstreamUrl.protocol !== "https:") {
    return new Response("Unsupported video protocol", { status: 502 });
  }

  const headers = new Headers({
    "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0",
    "Accept": "*/*",
    "Referer": embedUrl
  });
  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);

  const upstream = await fetch(upstreamUrl, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers,
    redirect: "follow"
  });

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: copyMediaHeaders(upstream)
  });
}

/*
 * Kung Fu Panda 2 — aperçu de fiche uniquement.
 * IMPORTANT : on ne masque jamais #modal, .dialog ou .detail.
 * La bande-annonce est ajoutée uniquement DANS #detailArt, par-dessus l'affiche.
 */
const KFP_INJECT = `
<style id="nox-kfp-preview-style">
#detailArt.nox-kfp-art{
  position:relative !important;
  overflow:hidden !important;
}
#detailArt .nox-kfp-preview{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  margin:0 !important;
  padding:0 !important;
  z-index:20 !important;
  display:block !important;
  background:#000 !important;
  border:0 !important;
  border-radius:inherit !important;
  overflow:hidden !important;
  opacity:0 !important;
  transition:opacity .35s ease !important;
}
#detailArt .nox-kfp-preview.visible{opacity:1 !important;}
#detailArt .nox-kfp-preview iframe{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  min-width:0 !important;
  min-height:0 !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
  display:block !important;
}
#detailArt .nox-kfp-mute{
  position:absolute !important;
  right:10px !important;
  bottom:10px !important;
  z-index:30 !important;
  width:38px !important;
  height:38px !important;
  padding:0 !important;
  border:1px solid rgba(255,255,255,.25) !important;
  border-radius:50% !important;
  background:rgba(0,0,0,.72) !important;
  color:#fff !important;
  font-size:16px !important;
  line-height:38px !important;
  text-align:center !important;
  cursor:pointer !important;
}
</style>
<script id="nox-kfp-preview-script">
(function(){
'use strict';

var NAME='Kung Fu Panda 2';
var TRAILER='FQ63rqSRrEI';
var timer=null;
var observer=null;
var currentArt=null;
var currentPreview=null;
var currentFrame=null;
var currentMute=null;
var currentTitle='';

function getTitle(){
  var el=document.getElementById('detailTitle');
  return el ? el.textContent.trim() : '';
}

function isOpen(){
  var modal=document.getElementById('modal');
  return !!(modal && !modal.hidden && getTitle()===NAME);
}

function stopPreview(){
  if(timer){ clearTimeout(timer); timer=null; }
  if(currentPreview){ currentPreview.remove(); currentPreview=null; }
  currentFrame=null;
  currentMute=null;
  if(currentArt){
    currentArt.classList.remove('nox-kfp-art');
    if(currentTitle) currentArt.setAttribute('data-title',currentTitle);
  }
  currentArt=null;
  currentTitle='';
}

function createPreview(){
  if(!isOpen()) return;
  var art=document.getElementById('detailArt');
  if(!art || currentPreview) return;

  currentArt=art;
  currentTitle=art.getAttribute('data-title') || '';
  art.classList.add('nox-kfp-art');

  var preview=document.createElement('div');
  preview.className='nox-kfp-preview';

  var frame=document.createElement('iframe');
  frame.title='Bande-annonce Kung Fu Panda 2';
  frame.setAttribute('allow','autoplay; fullscreen; picture-in-picture');
  frame.setAttribute('allowfullscreen','');
  frame.src='https://www.youtube.com/embed/'+TRAILER+'?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1';

  var mute=document.createElement('button');
  mute.type='button';
  mute.className='nox-kfp-mute';
  mute.textContent='🔇';
  mute.title='Activer le son';
  mute.setAttribute('aria-label','Activer le son');

  mute.addEventListener('click',function(ev){
    ev.preventDefault();
    ev.stopPropagation();
    try{
      var unmuted=mute.getAttribute('data-unmuted')==='1';
      frame.contentWindow.postMessage(JSON.stringify({event:'command',func:unmuted?'mute':'unMute',args:[]}),'*');
      mute.setAttribute('data-unmuted',unmuted?'0':'1');
      mute.textContent=unmuted?'🔇':'🔊';
      mute.title=unmuted?'Activer le son':'Couper le son';
      mute.setAttribute('aria-label',unmuted?'Activer le son':'Couper le son');
    }catch(e){}
  });

  preview.appendChild(frame);
  preview.appendChild(mute);
  art.appendChild(preview);
  currentPreview=preview;
  currentFrame=frame;
  currentMute=mute;

  requestAnimationFrame(function(){
    if(currentPreview) currentPreview.classList.add('visible');
  });
}

function schedule(){
  if(timer || currentPreview || !isOpen()) return;
  timer=setTimeout(function(){
    timer=null;
    createPreview();
  },3000);
}

function check(){
  if(isOpen()) schedule();
  else stopPreview();
}

/* On ne touche ni à films, ni à render(), ni au contenu de la fiche. */
observer=new MutationObserver(function(){
  check();
});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});

setTimeout(check,0);
window.addEventListener('pagehide',stopPreview);
window.addEventListener('beforeunload',stopPreview);
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
  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/video") return handleVideo(request);

    const response = await env.ASSETS.fetch(request);
    return injectKungFuPanda(request, response);
  }
};
