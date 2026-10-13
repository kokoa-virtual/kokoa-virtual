self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  const abiertas = await self.clients.matchAll({ type: 'window' });
  await self.registration.unregister();
  await Promise.allSettled(abiertas.map(c => c.navigate(c.url)));
})()));
