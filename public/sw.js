const CACHE = "urbareport-v1";
const PRECACHE = ["/", "/login", "/mis-reportes", "/nuevo-reporte", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? fetchPromise;
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "UrbaReport", body: "Actualización de tu reporte" };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "UrbaReport", {
      body: data.body ?? "",
      icon: "/globe.svg",
      badge: "/globe.svg",
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-reports") {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SYNC_REPORTS" }));
      })
    );
  }
});
