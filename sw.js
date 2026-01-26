const CACHE_NAME = 'mk-porttaali-v35'; // PÄIVITETTY: v34 -> v35
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './auth.js',
  './admin.js',
  './settings.js',
  './data.js',
  './generator.js',
  './help.js',
  './stats.js',
  './map.js',
  './map_all.js',
  './links.js',          // <--- UUSI TIEDOSTO LISÄTTY
  './manifest.json',
  './muuntimet.html',
  './muuntimet_style.css',
  './muuntimet_script.js',
  './reissuapuri.html',
  './reissuapuri-style.css',
  './reissuapuri-script.js',
  './yksikot.json',
  './mikkokalevi.png',
  './mklogo.png',  
  './kunnat.json'
];

// Asennus: Ladataan tiedostot välimuistiin
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets (v19)');
      // Lisätty virheenkäsittely, jotta yksi puuttuva tiedosto ei kaada koko asennusta
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => {
                console.warn('[SW] Tiedostoa ei voitu välimuistitallentaa:', url);
            });
        })
      );
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

// Haku: Verkko ensin, sitten välimuisti (Network First strategy)
self.addEventListener('fetch', (event) => {
  // Ohitetaan ulkoiset pyynnöt ja Firestore
  if (event.request.url.includes('firestore') || 
      event.request.url.includes('geocache.fi') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('basemaps.cartocdn.com')) {
      return; 
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jos saadaan vastaus verkosta, tallennetaan se välimuistiin tulevaa varten
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
