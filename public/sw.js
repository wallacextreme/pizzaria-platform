const CACHE_NAME = "pizzaria-forno-massa-v1.1";

function getBasePath() {
  const path = self.location.pathname || "/sw.js";
  return path.replace(/\/sw\.js$/, "");
}

self.addEventListener("install", (event) => {
  const base = getBasePath();
  const coreAssets = [
    `${base}/`,
    `${base}/demo/`,
    `${base}/icon.svg`,
    `${base}/icon-192.png`,
    `${base}/icon-512.png`,
  ];
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(coreAssets).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Nunca interceptar ou cachear rotas de API ou dados autenticados
  if (url.pathname.includes("/api/") || url.pathname.includes("/admin")) {
    return;
  }

  // Navegações HTML: Network-First com fallback offline no cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const base = getBasePath();
          return (await caches.match(`${base}/`)) || Response.error();
        })
    );
    return;
  }

  // Assets estáticos (imagens WebP, fontes, CSS, JS, ícones): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
