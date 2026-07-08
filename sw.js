/* ==========================================================
   サービスワーカー（オフライン対応）
   HTMLはネット優先、画像などはキャッシュ優先
   更新時は CACHE_VERSION を上げる
   ========================================================== */

const CACHE_VERSION = "v4";
const CACHE_NAME = "hozen-oxdojo-" + CACHE_VERSION;

const ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

// インストール時：必要ファイルをキャッシュ
// ※1つファイルが無くても失敗しないようにしている
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.allSettled(
        ASSETS.map(async (url) => {
          const res = await fetch(url, { cache: "reload" });
          if (res.ok) {
            await cache.put(url, res);
          }
        })
      );
    })()
  );

  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key.startsWith("hozen-oxdojo-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

// 取得時：HTMLはネット優先、その他はキャッシュ優先
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // 別ドメインは対象外
  if (url.origin !== location.origin) return;

  // HTMLページはネット優先
  if (
    e.request.mode === "navigate" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html")
  ) {
    e.respondWith(
      fetch(e.request, { cache: "reload" })
        .then((res) => {
          const copy = res.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, copy);
          });

          return res;
        })
        .catch(() => {
          return caches.match(e.request).then((cached) => {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  // 画像・manifestなどはキャッシュ優先
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request).then((res) => {
        const copy = res.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, copy);
        });

        return res;
      });
    })
  );
});
