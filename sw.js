const CACHE_NAME = 'mk-porttaali-v97'; // PÄIVITETTY: v96 -> v97
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
  './map_countries.js',     // <--- UUSI TIEDOSTO LISÄTTY (Ruotsi/Norja/Viro-kuntakartat)
  './locationHelpers.js',  // <--- UUSI TIEDOSTO LISÄTTY (paikannus-zoom ja wake lock)
  './gpxImport.js',        // <--- UUSI TIEDOSTO LISÄTTY (GPX/ZIP -tuonti Suomi + ulkomaat + muut maat)
  './findsQuery.js',       // <--- UUSI TIEDOSTO LISÄTTY (Löytöhaut -kyselyt findsdata-datan päälle)
  './ui.js',               // <--- UUSI TIEDOSTO LISÄTTY (toast/confirm/prompt -komponentit)
  './maailma.geojson',     // <--- UUSI TIEDOSTO LISÄTTY (maailmankartta Muut maat -näkymään)
  './sverige_kommuner.geojson',
  './norge_kommuner.geojson',
  './viro_vald.geojson',
  './links.js',          // <--- UUSI TIEDOSTO LISÄTTY
  './converters.js',     // <--- UUSI TIEDOSTO LISÄTTY (muuntimet-integraatio)
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
  './kuntarajat_100k.geojson',  // <--- UUSI: tarkat MML 1:100k kuntarajat (korvaa ~23-kulmaisen raakileaineiston)
  './kunnat.json'
];

// Asennus: Ladataan tiedostot välimuistiin
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets (' + CACHE_NAME + ')');
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

// Viesti sivulta: aktivoidaan odottava uusi versio heti
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
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
