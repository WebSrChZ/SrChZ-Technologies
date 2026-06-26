/* ─── SERVICE WORKER — SrChZ Technologies ─── */
/* Bump CACHE a cada deploy para entregar a versão nova aos usuários recorrentes. */
const CACHE = 'srchz-v20260626-1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/main.js',
  './manifest.webmanifest',
  './assets/logo-mark.png',
  './assets/logo-icon.png',
  './assets/favicon-32.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // add individual (não addAll) p/ não falhar tudo se 1 recurso faltar
      .then((c) => Promise.allSettled(ASSETS.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Cross-origin (Google Fonts, Supabase, badges): deixa passar direto, sem cache
  if (url.origin !== self.location.origin) return;

  // Navegação: network-first → pega o deploy mais novo, cai pro cache se offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', clone));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Estáticos same-origin: stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
