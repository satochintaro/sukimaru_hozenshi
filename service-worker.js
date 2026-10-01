const CACHE="skimaru-live-20261002-v2";
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
      fetch(event.request,{cache:"no-store"}).catch(()=>caches.match(event.request))
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