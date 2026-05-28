// gdggye-platform service worker — minimal Phase 1 shell cache.
//
// Goals: pass Lighthouse's "Current page does not respond with a 200 when
// offline" gate by serving the cached homepage when navigation is offline,
// and keep API responses live (no stale event data).

const CACHE_NAME = "gdg-shell-v1";
const SHELL_URLS = ["/", "/events", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache API or auth traffic — would serve stale event data / sessions.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  // Navigations: network first, fall back to cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return new Response("Offline", { status: 503 });
        }
      })(),
    );
    return;
  }

  // Other GETs: cache-first for the build assets (immutable hash URLs).
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|woff2?|svg|png|jpg|webp|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return resp;
        });
      }),
    );
  }
});
