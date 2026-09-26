const CACHE="skimaru-v5-9-3-layout-r19";

const CORE=[
  "./","./index.html","./player.html","./practical.html",
  "./styles.css","./theme-v58.css","./app-polish.css","./coach.css",
  "./academic-ui-v56.css","./quiz-static.css","./layout-safety.css",
  "./questions.js","./app.js","./supabase-config.js",
  "./mode-swipe.js","./ui-v58.js",
  "./year-mode-core.js","./year-question-data.js","./year-mode.js",
  "./academic-remove-practical.js","./academic-ui-v56.js","./quiz-static.js","./game-effects.js","./layout-safety.js",
  "./coach-shared.js","./coach-player.js","./coach-sync.js",
  "./practical-questions.js","./practical.js",
  "./practical-year-data.js","./practical-year-data-v58.js",
  "./practical-year-mode.js","./practical-v58.js",
  "./manifest.webmanifest",
  "./icon-v59-192.png","./icon-v59-512.png",
  "./icon-v59-maskable-512.png","./apple-touch-icon-v59.png"
];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("message",e=>{
  if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting();
});

function cleanRequest(req){
  const u=new URL(req.url);
  return new Request(u.origin+u.pathname,{method:"GET",credentials:"same-origin"});
}

async function cacheFirst(req){
  const clean=cleanRequest(req);
  const cache=await caches.open(CACHE);
  const hit=await cache.match(clean);
  if(hit)return hit;

  const res=await fetch(req,{cache:"no-cache"});
  if(res&&res.ok)cache.put(clean,res.clone());
  return res;
}

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;

  const isAppAsset=e.request.mode==="navigate"||
    /\.(?:html|js|css|webmanifest|png|svg)$/.test(u.pathname);

  if(isAppAsset){
    e.respondWith(
      cacheFirst(e.request).catch(async()=>{
        const cache=await caches.open(CACHE);
        return (await cache.match("./index.html"))||Response.error();
      })
    );
  }
});
