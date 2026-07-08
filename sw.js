/* ==========================================================
   サービスワーカー（オフライン対応）
   アプリを更新したら CACHE_VERSION の数字を上げてください。
   → 古いキャッシュが破棄され、新しいHTMLが配信されます。
   ========================================================== */
const CACHE_VERSION = "v3";
const CACHE_NAME = "hozen-oxdojo-" + CACHE_VERSION;

// オフラインで動かすために保存するファイル一式
const ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

// インストール時：必要ファイルをキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 有効化時：古いバージョンのキャッシュを削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 取得時：キャッシュ優先、なければネットワーク（cache-first）
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          // 同一オリジンの取得は動的にキャッシュへ
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => {
            try { c.put(e.request, copy); } catch (_) {}
          });
          return res;
        })
        .catch(() => cached);
    })
  );
});
