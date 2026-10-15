const RELEASE='1663',CACHE='skimaru-live-20261014-v16-63-manager-scores';
const SCOPE=new URL(self.registration.scope),ROOT=SCOPE.pathname.endsWith('/app/')?new URL('../',SCOPE):SCOPE;
const home=new URL('index.html',ROOT),appHome=new URL('app/index.html',ROOT);
function isHome(url){return [ROOT.pathname,home.pathname,new URL('app/',ROOT).pathname,appHome.pathname].includes(url.pathname);}
async function usable(response,html=false){if(!response?.ok)return false;try{const text=await response.clone().text();return !!text.trim()&&(!html||/<(?:html|body|main|section|script)\b/i.test(text));}catch{return false;}}
async function remember(request,response){try{await(await caches.open(CACHE)).put(request,response.clone());}catch{}}
async function cachedPage(request){const names=await caches.keys(),ordered=[CACHE,...names.filter(n=>n!==CACHE&&n.startsWith('skimaru-')).reverse()];for(const name of ordered){const cache=await caches.open(name);for(const options of [{},{ignoreSearch:true}]){const hit=await cache.match(request,options);if(await usable(hit,true))return hit;}}return null;}
function recoveryPage(){return new Response(`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>スキマル保全士</title><body style="margin:0;padding:32px 20px;background:#f7f6f1;color:#173d32;font-family:sans-serif;line-height:1.8"><h1>スキマル保全士</h1><p>画面を読み込めませんでした。通信が戻ったら、もう一度開いてください。</p><p>学習記録は端末に残っています。</p><p><a href="${home.href}?reload=${RELEASE}">もう一度開く</a></p><p><a href="${new URL('app/player.html',ROOT).href}">2級へ進む</a></p><p><a href="${new URL('app/grade1.html',ROOT).href}">1級へ進む</a></p></body></html>`,{status:200,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'}});}
async function prepareHome(){try{const response=await fetch(home.href,{cache:'no-store'});if(!await usable(response,true))return false;for(const path of [home.href,ROOT.href,home.href+'?launch=home'])await remember(path,response);return true;}catch{return false;}}
self.addEventListener('install',event=>{event.waitUntil(prepareHome());self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
 await self.clients.claim();
 // Refresh title windows once per release, including a blank document with no startup script.
 // Exercises and settings stay in place. LocalStorage and IndexedDB are never cleared.
 for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})){
  const url=new URL(client.url);if(url.origin!==ROOT.origin||!isHome(url)||url.searchParams.get('_boot')===RELEASE)continue;
  url.searchParams.set('_boot',RELEASE);client.navigate(url.href).catch(()=>{});
 }
 // Keep previously downloaded pages available offline during the release transition.
})());});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==ROOT.origin)return;
 if(event.request.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname.endsWith('/')){
  event.respondWith((async()=>{try{const response=await fetch(event.request,{cache:'no-store'});if(await usable(response,true)){await remember(event.request,response);return response;}if(response.status>=400)return response;}catch{}
   try{const hit=await cachedPage(event.request);if(hit)return hit;}catch{}return recoveryPage();
  })());return;
 }
 if(url.pathname.endsWith('.webmanifest')){event.respondWith(fetch(event.request,{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('Manifest unavailable');await remember(event.request,response);return response;}).catch(()=>caches.match(event.request).then(hit=>hit||new Response('Unavailable offline',{status:503}))));return;}
 if(/\.(?:js|css|webmanifest)$/.test(url.pathname)){
  const update=fetch(event.request,{cache:'no-cache'}).then(async response=>{if(await usable(response)){await remember(event.request,response);return response;}throw Error('Empty or unavailable asset');});
  event.waitUntil(update.then(()=>{}).catch(()=>{}));
  event.respondWith((async()=>{try{const hit=await(await caches.open(CACHE)).match(event.request);if(await usable(hit))return hit;}catch{}
   try{return await update;}catch{try{const hit=await caches.match(event.request);if(await usable(hit))return hit;}catch{}return new Response('Unavailable offline',{status:503});}
  })());return;
 }
 if(/\.(?:png|jpg|jpeg|webp|svg)$/.test(url.pathname))event.respondWith((async()=>{try{const hit=await caches.match(event.request);if(hit?.ok)return hit;}catch{}const response=await fetch(event.request);if(response.ok)await remember(event.request,response);return response;})());
});
