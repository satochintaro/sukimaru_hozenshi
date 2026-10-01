const CACHE="skimaru-A-only-20261001";
self.addEventListener("install",()=>self.skipWaiting());
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
async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }catch(error){
    const hit=await cache.match(request);
    if(hit)return hit;
    throw error;
  }
}
async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const hit=await cache.match(request);
  if(hit)return hit;
  const response=await fetch(request,{cache:"no-cache"});
  if(response&&response.ok)cache.put(request,response.clone());
  return response;
}
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==="navigate"||url.pathname.endsWith(".html")||url.pathname.endsWith("/")){
    event.respondWith(networkFirst(event.request));return;
  }
  if(/\.(?:js|css|webmanifest|png|jpg|jpeg|webp|svg)$/.test(url.pathname)){
    event.respondWith(cacheFirst(event.request));
  }
});