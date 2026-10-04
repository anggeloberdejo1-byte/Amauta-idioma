// Amauta Idioma — service worker
// Cada vez que subas cambios, sube también este archivo con un número nuevo de versión.
const CACHE = "amauta-idioma-v3";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fuentes de Google: usa la copia guardada y la actualiza en segundo plano
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((guardada) => {
          const red = fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => guardada);
          return guardada || red;
        })
      )
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Página: primero la red (para recibir actualizaciones), si no hay internet usa la copia
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copia)); } return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Íconos y demás archivos: primero la copia guardada
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
