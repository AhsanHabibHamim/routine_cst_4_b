const V = "cst-matrix-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./routine.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(V)
      .then((c) =>
        Promise.all(
          ASSETS.map((u) =>
            c.add(new Request(u, { cache: "reload" })).catch(() => {}),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))))
      .then(() => self.clients.claim()),
  );
});

// Cache first, refresh in background, fall back to the app shell when offline
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  const shell = caches.match("./index.html");
  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r)
        .then((res) => {
          if (res.ok) caches.open(V).then((c) => c.put("./", res.clone()));
          return res;
        })
        .catch(() => caches.match(r, { ignoreSearch: true }).then((h) => h || shell)),
    );
    return;
  }
  e.respondWith(
    caches.match(r, { ignoreSearch: true }).then((hit) => {
      const net = fetch(r)
        .then((res) => {
          if (res.ok) caches.open(V).then((c) => c.put(r, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});

// Tapping a class notification opens (or focuses) the app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if ("focus" in c) return c.focus();
        }
        return clients.openWindow("./");
      }),
  );
});
