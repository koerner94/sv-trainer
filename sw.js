/* Damit der Trainer auch ohne Netz laeuft.
   Bei jeder Aenderung die Nummer hochzaehlen, sonst behaelt das Handy die alte Fassung. */
const LAGER = 'sv-trainer-14';
const DATEIEN = ['./', 'index.html?v=14', 'stil.css?v=14', 'daten-pruefung.js?v=14', 'daten-rechenwege.js?v=14',
                 'daten-palast.js?v=14', 'daten-gesetz.js?v=14', 'daten-bauleitplanung.js?v=14', 'planer.js?v=14', 'karten.js?v=14', 'app.js?v=14', 'ertragswert.html', 'manifest.webmanifest?v=14', 'cover.png?v=14'];

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
    }).catch(() => caches.match(e.request).then(a => a || caches.match('index.html?v=14')))
  );
});
