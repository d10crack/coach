// Coach: app shell cached, the data file network-first (falls back to the last copy offline).
const C = 'coach-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  const isData = u.pathname.endsWith('coach.enc.json');
  const isPage = e.request.mode === 'navigate' || u.pathname.endsWith('index.html');
  if (isData || isPage) {
    e.respondWith(fetch(e.request).then(r => {
      if (!r.ok) return caches.match(isData ? 'coach.enc.json' : 'index.html').then(c => c || r);   // never cache an error page
      const copy = r.clone(); caches.open(C).then(c => c.put(isData ? 'coach.enc.json' : 'index.html', copy)); return r;
    }).catch(() => caches.match(isData ? 'coach.enc.json' : 'index.html')));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
