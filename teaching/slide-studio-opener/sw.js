/* Slide Studio Opener: keeps the opener's own files on the device so it starts without a connection.
   Decks are not handled here; they live in the page's own storage (IndexedDB). */
const V = "opener-1.0.0-beta.1-b";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-512.png", "space-grotesk.woff2", "jetbrains-mono.woff2"];

self.addEventListener("install", e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));

/* answer from the cache at once (a slow lecture room network never holds the opener up), and refresh the cache in the background */
self.addEventListener("fetch", e => {
  const r = e.request;
  /* only the opener's own files: anything else on the same site (with or without ?query) goes to the network untouched */
  const u = new URL(r.url), own = FILES.map(f => new URL(f, self.registration.scope).href);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  const nav = r.mode === "navigate" && u.href.startsWith(self.registration.scope);
  if (!nav && !own.includes(u.origin + u.pathname)) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(nav ? "./" : u.origin + u.pathname);
    const net = fetch(r).then(res => { if (res.ok && !res.redirected) c.put(nav ? "./" : u.origin + u.pathname, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response("Offline", { status: 503 });
  }));
});
