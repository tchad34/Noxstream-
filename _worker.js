const UQLOAD_API = "https://uqload.vc/api/file/direct_link";
const EMBED_RE = /^https?:\/\/(?:www\.)?uqload\.vc\/embed-([^/?#]+)\.html(?:[?#].*)?$/i;

function getFileCode(value) {
  try { const match = new URL(value).href.match(EMBED_RE); return match ? match[1] : null; }
  catch { return null; }
}
async function resolveUqload(embedUrl) {
  const fileCode = getFileCode(embedUrl); if (!fileCode) return null;
  const api = new URL(UQLOAD_API);
  api.searchParams.set("key", "45eo2waz0k7v9x8v5"); api.searchParams.set("file_code", fileCode); api.searchParams.set("q", "h");
  const response = await fetch(api,{headers:{Accept:"application/json","User-Agent":"Mozilla/5.0"}});
  if(!response.ok) return null;
  const data=await response.json(); const versions=Array.isArray(data?.result?.versions)?data.result.versions:[];
  for(const quality of ["h","n","l","o"]){const v=versions.find(x=>x?.name===quality&&typeof x?.url==="string"&&/^https?:\/\//i.test(x.url));if(v)return v.url;}
  return versions.find(x=>typeof x?.url==="string"&&/^https?:\/\//i.test(x.url))?.url||null;
}
function copyMediaHeaders(upstream){
  const headers=new Headers();
  for(const name of ["content-type","content-length","content-range","accept-ranges","etag","last-modified"]){const value=upstream.headers.get(name);if(value)headers.set(name,value);}
  headers.set("Accept-Ranges","bytes"); headers.set("Cache-Control","no-store"); headers.set("Access-Control-Allow-Origin","*"); headers.set("Cross-Origin-Resource-Policy","cross-origin"); return headers;
}
async function handleVideo(request){
  const embedUrl=new URL(request.url).searchParams.get("url"); if(!embedUrl)return new Response("Missing video URL",{status:400});
  const mediaUrl=await resolveUqload(embedUrl); if(!mediaUrl)return new Response("Video source unavailable",{status:502});
  const upstreamUrl=new URL(mediaUrl); if(!/^https?:$/.test(upstreamUrl.protocol))return new Response("Unsupported video protocol",{status:502});
  const headers=new Headers({"User-Agent":request.headers.get("User-Agent")||"Mozilla/5.0","Accept":"*/*","Referer":embedUrl});
  const range=request.headers.get("Range"); if(range)headers.set("Range",range);
  const upstream=await fetch(upstreamUrl,{method:request.method==="HEAD"?"HEAD":"GET",headers,redirect:"follow"});
  return new Response(request.method==="HEAD"?null:upstream.body,{status:upstream.status,headers:copyMediaHeaders(upstream)});
}

const KFP_INJECT=`
<style id="nox-kfp-preview-style">
#detailArt.nox-kfp-art{position:relative!important;overflow:hidden!important}
#detailArt .nox-kfp-preview{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;z-index:20!important;display:block!important;background:#000!important;border:0!important;border-radius:inherit!important;overflow:hidden!important;opacity:0!important;transition:opacity .35s ease!important}
#detailArt .nox-kfp-preview.visible{opacity:1!important}
#detailArt .nox-kfp-preview iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;display:block!important}
#detailArt .nox-kfp-mute{position:absolute!important;right:10px!important;bottom:10px!important;z-index:30!important;width:38px!important;height:38px!important;padding:0!important;border:1px solid rgba(255,255,255,.25)!important;border-radius:50%!important;background:rgba(0,0,0,.72)!important;color:#fff!important;font-size:16px!important;line-height:38px!important;text-align:center!important;cursor:pointer!important}
</style>
<script id="nox-kfp-preview-script">
(function(){'use strict';
var NAME='Kung Fu Panda 2',TRAILER='FQ63rqSRrEI',timer=null,observer=null,currentArt=null,currentPreview=null,currentFrame=null,currentTitle='';
function title(){var e=document.getElementById('detailTitle');return e?e.textContent.trim():''}
function open(){var m=document.getElementById('modal');return !!(m&&!m.hidden&&title()===NAME)}
function restore(){if(timer){clearTimeout(timer);timer=null}if(currentFrame){try{currentFrame.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'*')}catch(e){}}if(currentPreview){currentPreview.remove();currentPreview=null}if(currentArt){currentArt.classList.remove('nox-kfp-art')}currentArt=null;currentFrame=null;currentTitle=''}
function create(){if(!open())return;var art=document.getElementById('detailArt');if(!art||currentPreview)return;currentArt=art;currentTitle=art.getAttribute('data-title')||'';art.classList.add('nox-kfp-art');var p=document.createElement('div');p.className='nox-kfp-preview';var f=document.createElement('iframe');f.title='Bande-annonce Kung Fu Panda 2';f.allow='autoplay; fullscreen; picture-in-picture';f.setAttribute('allowfullscreen','');f.src='https://www.youtube.com/embed/'+TRAILER+'?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1';var b=document.createElement('button');b.type='button';b.className='nox-kfp-mute';b.textContent='🔇';b.title='Activer le son';b.setAttribute('aria-label','Activer le son');b.onclick=function(e){e.preventDefault();e.stopPropagation();try{var u=b.getAttribute('data-unmuted')==='1';f.contentWindow.postMessage(JSON.stringify({event:'command',func:u?'mute':'unMute',args:[]}),'*');b.setAttribute('data-unmuted',u?'0':'1');b.textContent=u?'🔇':'🔊';b.title=u?'Activer le son':'Couper le son'}catch(e){}};p.append(f,b);art.appendChild(p);currentPreview=p;currentFrame=f;requestAnimationFrame(function(){if(currentPreview)currentPreview.classList.add('visible')});
function message(e){if(e.source!==f.contentWindow)return;var d;try{d=typeof e.data==='string'?JSON.parse(e.data):e.data}catch(x){return}if(d&&d.event==='onStateChange'&&Number(d.info)===0){window.removeEventListener('message',message);restore()}}
window.addEventListener('message',message);
}
function schedule(){if(timer||currentPreview||!open())return;timer=setTimeout(function(){timer=null;create()},3000)}
function check(){if(open())schedule();else restore()}
observer=new MutationObserver(check);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});setTimeout(check,0);window.addEventListener('pagehide',restore);window.addEventListener('beforeunload',restore);
})();
</script>`;

async function injectKungFuPanda(request,response){
  const url=new URL(request.url); if(url.pathname!=="/"&&url.pathname!=="/index.html")return response;
  const type=response.headers.get("content-type")||""; if(!type.includes("text/html"))return response;
  const html=await response.text(); if(html.includes('id="nox-kfp-preview-script"'))return new Response(html,response);
  const injected=html.replace(/<\/body>/i,KFP_INJECT+"</body>"); const headers=new Headers(response.headers); headers.delete("content-length");
  return new Response(injected,{status:response.status,statusText:response.statusText,headers});
}
export default{async fetch(request,env){const url=new URL(request.url);if(url.pathname==="/api/video")return handleVideo(request);const assetUrl=new URL(request.url);if(assetUrl.pathname==="/")assetUrl.pathname="/index.html";const assetRequest=new Request(assetUrl.toString(),request);const response=await env.ASSETS.fetch(assetRequest);return injectKungFuPanda(request,response)}};