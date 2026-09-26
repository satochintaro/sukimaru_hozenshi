const CACHE="skimaru-v5-9-1-fast-r17";

const CORE=[
  "./","./index.html","./player.html","./practical.html",
  "./styles.css","./theme-v58.css","./app-polish.css","./coach.css",
  "./academic-ui-v56.css","./answer-animation-off.css","./quiz-static.css",
  "./questions.js","./app.js","./supabase-config.js",
  "./mode-swipe.js","./ui-v58.js",
  "./year-mode-core.js","./year-question-data.js","./year-mode.js",
  "./academic-remove-practical.js","./academic-ui-v56.js","./quiz-static.js",
  "./coach-shared.js","./coach-player.js",
  "./practical-questions.js","./practical.js","./practical-year-data.js",
  "./practical-year-data-v58.js","./practical-year-mode.js","./practical-v58.js",
  "./manifest.webmanifest",
  "./icon-v59-192.png","./icon-v59-512.png","./icon-v59-maskable-512.png","./apple-touch-icon-v59.png"
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

async function cacheFirstRefresh(req){
  const clean=cleanRequest(req);
  const cache=await caches.open(CACHE);
  const cached=await cache.match(clean);

  const refresh=fetch(req,{cache:"no-cache"})
    .then(r=>{
      if(r&&r.ok)cache.put(clean,r.clone());
      return r;
    })
    .catch(()=>null);

  // 端末にあれば即返し、更新は裏で実施。
  if(cached){
    refresh.catch(()=>{});
    return cached;
  }

  const fresh=await refresh;
  if(fresh)return fresh;
  throw new Error("offline");
}

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;

  const isAppAsset=/\.(?:html|js|css|webmanifest|png|svg)$/.test(u.pathname)
    || e.request.mode==="navigate";

  if(isAppAsset){
    e.respondWith(
      cacheFirstRefresh(e.request).catch(async()=>{
        const cache=await caches.open(CACHE);
        return (await cache.match("./index.html")) || Response.error();
      })
    );
  }
});
