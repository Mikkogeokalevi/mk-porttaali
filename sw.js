const CACHE_NAME = 'mk-porttaali-v9'; // PÄIVITETTY: v6 -> v7
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './auth.js',
  './admin.js',
  './settings.js', // Mukana
  './data.js',
  './generator.js',
  './help.js',
  './stats.js',
  './map.js',
  './map_all.js',
  './manifest.json',
  './muuntimet.html',
  './muuntimet_style.css',
  './muuntimet_script.js',
  './yksikot.json',
  './mikkokalevi.png',
  './kunnat.json'
];

// Asennus: Ladataan tiedostot välimuistiin
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Pakotetaan uusi SW käyttöön heti
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets (v7)');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Aktivointi: Siivotaan vanhat välimuistit
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Haku: Verkko ensin, sitten välimuisti (Network First)
self.addEventListener('fetch', (event) => {
  // Ohitetaan Firestore ja ulkoiset kartat välimuistista
  if (event.request.url.includes('firestore') || 
      event.request.url.includes('geocache.fi') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('basemaps.cartocdn.com')) {
      return; 
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jos verkkohaku onnistuu, päivitetään välimuisti taustalla
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Jos verkko ei toimi, palautetaan välimuistista
        return caches.match(event.request);
      })
  );
});
