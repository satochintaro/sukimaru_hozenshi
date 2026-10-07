const CACHE="skimaru-live-20261007-v16-grade1";
self.addEventListener("install",event=>{
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith("skimaru-")&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  // HTML/navigation must always come from the network so practical.html cannot stay on an old screen.
  if(event.request.mode==="navigate"||url.pathname.endsWith(".html")||url.pathname.endsWith("/")){
    event.respondWith(
      fetch(event.request,{cache:"no-store"}).then(async response=>{if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}catch{}}return response;}).catch(async()=>await caches.match(event.request)||new Response("<!doctype html><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1><p>この画面はまだ端末に保存されていません。通信が戻ってから開いてください。</p><a href=./index.html>トップへ戻る</a>",{headers:{"Content-Type":"text/html;charset=utf-8"}}))
    );
    return;
  }

  // Static assets may be cached, but refresh them from network when possible.
  if(/\.(?:js|css|webmanifest)$/.test(url.pathname)){
    event.respondWith(
      fetch(event.request,{cache:"no-store"}).then(async response=>{
        if(response&&response.ok){
          const cache=await caches.open(CACHE);
          cache.put(event.request,response.clone());
        }
        return response;
      }).catch(()=>caches.match(event.request))
    );
    return;
  }

  if(/\.(?:png|jpg|jpeg|webp|svg)$/.test(url.pathname)){
    event.respondWith(
      caches.open(CACHE).then(async cache=>{
        const hit=await cache.match(event.request);
        if(hit)return hit;
        const response=await fetch(event.request);
        if(response&&response.ok)cache.put(event.request,response.clone());
        return response;
      })
    );
  }
});
