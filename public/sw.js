const CACHE = 'kkb-v19';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'data.js', 'i18n.js', 'providers.js', 'emoji.js', 'theme-boot.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'lang/en.js', 'lang/hi.js', 'lang/bn.js', 'lang/mr.js', 'lang/te.js', 'lang/ta.js', 'lang/gu.js', 'lang/kn.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    // the bundled emoji (~120 tiny SVGs) are precached best-effort so the first offline visit is complete too
    try { const list = await (await fetch('emoji/list.json')).json(); await c.addAll(list.map(f => 'emoji/' + f)); } catch { /* runtime caching picks them up */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// stale-while-revalidate for the shell + fonts; never touch the Claude API
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).hostname === 'api.anthropic.com') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(request);
    const net = fetch(request).then(r => { if (r.ok || r.type === 'opaque') c.put(request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
