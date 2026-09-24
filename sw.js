/* Damit der Trainer auch ohne Netz laeuft.
   Bei jeder Aenderung die Nummer hochzaehlen, sonst behaelt das Handy die alte Fassung. */
const LAGER = 'sv-trainer-11';
const DATEIEN = ['./', 'index.html?v=11', 'stil.css?v=11', 'daten-pruefung.js?v=11', 'daten-rechenwege.js?v=11',
                 'daten-palast.js?v=11', 'daten-gesetz.js?v=11', 'daten-bauleitplanung.js?v=11', 'planer.js?v=11', 'karten.js?v=11', 'app.js?v=11', 'manifest.webmanifest?v=11', 'cover.png?v=11'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(LAGER).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== LAGER).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(a => {
      if (a && a.status === 200 && a.type === 'basic') {
        const kopie = a.clone();
        caches.open(LAGER).then(c => c.put(e.request, kopie));
      }
      return a;
    }).catch(() => caches.match(e.request).then(a => a || caches.match('index.html?v=11')))
  );
});
