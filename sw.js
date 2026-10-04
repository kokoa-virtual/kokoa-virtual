const V = "kokoa-v5";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./vendor/supabase.js", "./vendor/jspdf.min.js", "./icons/icon-192.png", "./icons/apple-touch-icon.png"];
const ESPERA_RED = 3000; // ms antes de usar la copia guardada si la red está lenta

self.addEventListener("install", e => {
  // add() por separado: si falta un archivo no se cae toda la instalación
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});

// Librerías, iconos y fuentes: se sirven al instante desde la copia y se actualizan en segundo plano
async function rapido(e) {
  const c = await caches.open(V), hit = await c.match(e.request);
  const red = fetch(e.request).then(r => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }).catch(() => null);
  if (hit) { e.waitUntil(red); return hit; }
  return (await red) || Response.error();
}

// Página y datos propios: red primero, pero si tarda más de 3 s se usa la copia guardada
async function conRed(e) {
  const q = e.request, c = await caches.open(V);
  const red = fetch(q).then(r => { if (r.ok) c.put(q, r.clone()); return r; });
  try {
    const r = await Promise.race([red, new Promise(ok => setTimeout(() => ok(null), ESPERA_RED))]);
    if (r) return r;
  } catch (_) {}
  const hit = (await c.match(q)) || (q.mode === "navigate" ? await c.match("./index.html") : null);
  if (hit) { e.waitUntil(red.catch(() => {})); return hit; }
  return red.catch(() => Response.error());
}

self.addEventListener("fetch", e => {
  const q = e.request;
  if (q.method !== "GET") return;
  const u = new URL(q.url);
  const fuente = u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (u.origin !== location.origin && !fuente) return;
  if (fuente || /\/(vendor|icons)\//.test(u.pathname)) e.respondWith(rapido(e));
  else e.respondWith(conRed(e));
});

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Kokoa Virtual", {
    body: d.body || "Hay alertas nuevas del inventario.",
    icon: "icons/icon-192.png", badge: "icons/icon-192.png",
    tag: d.tag || "kokoa", renotify: !!d.tag, data: { url: d.url || "./index.html" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => {
    for (const c of l) if ("focus" in c) return c.focus();
    return clients.openWindow(e.notification.data.url);
  }));
});
