// Ruotsin kuntakartta - interaktiivinen löytökartta
// Käyttäjä voi merkitä kunnan löydetyksi klikkaamalla, paikantaa itsensä ja tuoda GPX-tiedoston löydöt.

import { doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const GEOJSON_URL = './sverige_kommuner.geojson';
const STORAGE_KEY = 'mk_sweden_found_v1';

function getStorageKey(uid) {
  return `${STORAGE_KEY}_${uid}`;
}

// Kätkötyypit Suomen karttojen tyyliin (mukautettu Ruotsia varten)
const CACHE_TYPES = [
  { index: 0, name: 'Tradi', icon: 'kuvat/tradi.gif' },
  { index: 1, name: 'Multi', icon: 'kuvat/multi.gif' },
  { index: 2, name: 'Webcam', icon: 'kuvat/webcam.gif' },
  { index: 3, name: 'Mysse', icon: 'kuvat/mysse.gif' },
  { index: 4, name: 'Letteri', icon: 'kuvat/letteri.gif' },
  { index: 5, name: 'Earthcache', icon: 'kuvat/oortti.gif' },
  { index: 6, name: 'Miitti', icon: 'kuvat/miitti.gif' },
  { index: 7, name: 'Virtu', icon: 'kuvat/virtu.gif' },
  { index: 8, name: 'Cito', icon: 'kuvat/cito.gif' },
  { index: 9, name: 'Wherigo', icon: 'kuvat/wherigo.gif' },
  { index: 10, name: 'Com.Cel', icon: 'kuvat/ccemiitti.gif' },
  { index: 11, name: 'Mega', icon: 'kuvat/mega.gif' }
];

// GPX:n englanninkieliset kätkötyypit -> CACHE_TYPES-indeksi
const GPX_TYPE_TO_INDEX = {
  'Traditional Cache': 0,
  'Multi-cache': 1,
  'Webcam Cache': 2,
  'Unknown Cache': 3,
  'Letterbox Hybrid': 4,
  'Earthcache': 5,
  'Event Cache': 6,
  'Virtual Cache': 7,
  'Cache In Trash Out Event': 8,
  'Wherigo Cache': 9,
  'Community Celebration Event': 10,
  'Mega-Event': 11,
  'Giga-Event': 11,
  'Lost and Found Event': 6,
  'Groundspeak Block Party': 6
};

function createEmptyStats() {
  return new Array(CACHE_TYPES.length).fill(0);
}

function migrateListToObject(list) {
  const obj = {};
  for (const name of list) {
    obj[name] = { s: createEmptyStats() };
  }
  return obj;
}

async function loadFound(uid, db) {
  let data = {};
  if (db && uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'sweden', 'finds'));
      if (snap.exists()) {
        const d = snap.data();
        let municipalities = d.municipalities;
        if (municipalities) {
          if (Array.isArray(municipalities)) {
            municipalities = migrateListToObject(municipalities);
          }
          data = municipalities;
          try { localStorage.setItem(getStorageKey(uid), JSON.stringify({ municipalities: data })); } catch {}
          return data;
        }
      }
    } catch (e) {
      console.warn('Ruotsin löytöjen lataus Firestoresta epäonnistui:', e);
    }
  }
  try {
    const raw = JSON.parse(localStorage.getItem(getStorageKey(uid)) || '{}');
    if (Array.isArray(raw)) return migrateListToObject(raw);
    if (raw && typeof raw === 'object') {
      return raw.municipalities || {};
    }
  } catch {
    // Ei dataa
  }
  return {};
}

async function saveFound(uid, data, db) {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify({ municipalities: data }));
  } catch {
    // Ei tallennustilaa
  }
  if (db && uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'sweden', 'finds'), {
        municipalities: data,
        updatedAt: Timestamp.now()
      });
    } catch (e) {
      console.warn('Ruotsin löytöjen tallennus Firestoreen epäonnistui:', e);
    }
  }
}

function getName(feature) {
  const props = feature?.properties || {};
  return props.kom_namn || props.name || props.Name || props.NAMEFIN || 'Tuntematon';
}

// -------- Pisteen sijainti polygonin sisällä (ray casting) --------

function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonCoords(point, polygon) {
  if (!pointInRing(point, polygon[0])) return false;
  // Varmistetaan, ettei piste ole aukossa
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
}

function isPointInFeature(point, feature) {
  const geom = feature?.geometry;
  if (!geom) return false;
  if (geom.type === 'Polygon') {
    return pointInPolygonCoords(point, geom.coordinates);
  }
  if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      if (pointInPolygonCoords(point, polygon)) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------

export const renderSwedenMap = async (content, db, user, app) => {
  if (!user) {
    app.router('login_view');
    return;
  }

  const foundStats = await loadFound(user.uid, db);
  const found = new Set(Object.keys(foundStats));
  let selectedLayer = null;
  let currentLayer = null;
  let watching = false;
  let geoLayer;

  content.innerHTML = `
    <div class="card" style="height: 90vh; display: flex; flex-direction: column; padding: 0; overflow: hidden; position: relative;">
      <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); border-bottom: 1px solid var(--border-color); z-index: 1001; flex-wrap: wrap; gap: 8px;">
        <h2 style="margin: 0; font-size: 1.2em;">🇸🇪 Ruotsi-kuntakartta</h2>
        <span id="swedenLocationStatus" style="font-size: 0.85em; opacity: 0.9; margin-left: auto; padding-right: 6px; color: var(--success-color);"></span>
        <div style="display: flex; gap: 10px;">
          <button id="swedenImportBtn" class="btn" style="margin: 0; padding: 5px 10px;" title="Tuo löydöt GPX-tiedostosta">📁 Tuo GPX</button>
          <input type="file" id="swedenGpxInput" accept=".gpx,.xml" style="display:none">
          <button id="swedenLocateBtn" class="btn" style="margin: 0; padding: 5px 10px; font-size: 1.2em;" title="Paikanna ja seuraa sijaintia">📍</button>
          <button id="swedenClearBtn" class="btn" style="margin: 0; padding: 5px 10px;" title="Tyhjennä löydöt">🗑️</button>
          <button class="btn" onclick="app.router('stats')" style="margin: 0; padding: 5px 10px;">⬅ Takaisin</button>
        </div>
      </div>

      <div style="padding: 8px 10px; background: var(--input-bg); border-bottom: 1px solid var(--border-color); font-size: 0.85em; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <span>Klikkaa kuntaa merkitäksesi löydetyksi. Voit myös tuoda löydöt GPX-tiedostosta.</span>
        <span id="swedenStats" style="font-weight: bold;"></span>
      </div>

      <div id="swedenMap" style="flex: 1; width: 100%; background: #aad3df;">
        <div id="swedenMapLoading" style="padding: 20px; color: black; background: white; opacity: 0.9; text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; border-radius: 8px;">
          Ladataan Ruotsin kuntakarttaa...
        </div>
      </div>

      <div style="padding: 10px; background: var(--card-bg); font-size: 0.8em; text-align: center; border-top: 1px solid var(--border-color);">
        <span style="color: #a6e3a1;">■ Löydetty</span> &nbsp;
        <span style="color: #f38ba8;">■ Etsittävä</span> &nbsp;
        <span style="color: #f9e2af;">■ Nykyinen kunta</span>
      </div>
    </div>
  `;

  const map = L.map('swedenMap', { preferCanvas: true, zoomControl: false }).setView([62.5, 16.5], 5);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM & CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  const statsEl = document.getElementById('swedenStats');
  const loadingEl = document.getElementById('swedenMapLoading');
  const locationStatusEl = document.getElementById('swedenLocationStatus');
  const userMarker = L.layerGroup().addTo(map);
  const nameToLayer = new Map();

  function updateLocationStatus(text) {
    if (!locationStatusEl) return;
    locationStatusEl.textContent = text || '';
  }

  function updateLocateButton() {
    if (!locateBtn) return;
    locateBtn.textContent = watching ? '⏹️' : '📍';
    locateBtn.title = watching ? 'Lopeta paikannus' : 'Paikanna ja seuraa sijaintia';
  }

  function updateStats() {
    if (!statsEl) return;
    statsEl.textContent = `${found.size} / 290 kuntaa`;
  }

  function getBaseStyle(name) {
    return {
      fillColor: found.has(name) ? '#a6e3a1' : '#f38ba8',
      weight: 1,
      opacity: 1,
      color: 'rgba(255,255,255,0.15)',
      fillOpacity: 0.5
    };
  }

  function setLayerStyle(layer) {
    const name = getName(layer.feature);
    const isFound = found.has(name);
    const isCurrent = currentLayer === layer;
    const isSelected = selectedLayer === layer;
    layer.setStyle({
      fillColor: isFound ? '#a6e3a1' : '#f38ba8',
      weight: isCurrent || isSelected ? 3 : 1,
      color: isCurrent ? '#f9e2af' : isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)',
      opacity: 1,
      fillOpacity: 0.5
    });
  }

  function refreshStyle() {
    if (!geoLayer) return;
    geoLayer.eachLayer(layer => setLayerStyle(layer));
  }

  async function toggleFound(name) {
    if (found.has(name)) {
      found.delete(name);
      delete foundStats[name];
    } else {
      found.add(name);
      foundStats[name] = { s: createEmptyStats() };
    }
    await saveFound(user.uid, foundStats, db);
    updateStats();
    refreshStyle();
  }

  function bindPopupForLayer(layer, name) {
    layer.bindPopup(() => {
      const data = foundStats[name];
      const s = data?.s || createEmptyStats();
      const total = s.reduce((a, b) => a + b, 0);
      const isFound = found.has(name);
      const div = document.createElement('div');
      div.style.textAlign = 'center';
      div.style.minWidth = '220px';
      div.style.maxWidth = '280px';

      let foundHtml = '';
      let missingHtml = '';
      CACHE_TYPES.forEach(t => {
        const count = s[t.index] || 0;
        if (count > 0) {
          foundHtml += `<div style="display:inline-block;margin:2px 6px 2px 0;white-space:nowrap;"><img src="${t.icon}" style="width:14px;vertical-align:middle;margin-right:3px;"> <b>${t.name}:</b> ${count}</div>`;
        } else {
          missingHtml += `<span style="display:inline-block;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:0.8em;margin:2px;">${t.name}</span>`;
        }
      });

      const hasGpxFinds = total > 0;
      const statusText = isFound ? (hasGpxFinds ? '✅ Löydetty (GPX)' : '✅ Löydetty (käsin)') : '🔴 Etsittävä';
      const showButton = !hasGpxFinds; // GPX-tuotuja kunta ei voi poistaa yksittäin tästä
      div.innerHTML = `
        <strong style="font-size:1.1em;display:block;margin-bottom:6px;">${name}</strong>
        <div id="swedenPopupStatus" style="margin-bottom:8px;">${statusText}</div>
        ${hasGpxFinds ? `<div style="text-align:left;margin-bottom:8px;"><div style="margin-bottom:4px;"><strong>Löydetyt (${total}):</strong></div><div style="display:flex;flex-wrap:wrap;gap:2px;">${foundHtml}</div></div>` : ''}
        ${isFound && missingHtml ? `<div style="text-align:left;margin-top:6px;border-top:1px dotted #555;padding-top:4px;"><strong style="font-size:0.9em;">Puuttuu:</strong><div style="display:flex;flex-wrap:wrap;gap:2px;">${missingHtml}</div></div>` : ''}
        ${showButton ? `<button class="btn btn-primary" style="padding:5px 10px;font-size:0.85em;margin-top:6px;">${isFound ? 'Poista löytö' : 'Merkitse löydetyksi'}</button>` : ''}
      `;

      const btn = div.querySelector('button');
      if (btn) {
        btn.onclick = async () => {
          await toggleFound(name);
          layer.closePopup();
          layer.openPopup();
        };
      }
      return div;
    });
  }

  let geoData;
  try {
    const response = await fetch(GEOJSON_URL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    geoData = await response.json();
  } catch (e) {
    console.error('Ruotsin kuntakartan lataus epäonnistui:', e);
    if (loadingEl) {
      loadingEl.textContent = 'Kartan lataus epäonnistui. Tarkista verkkoyhteys.';
    } else {
      document.getElementById('swedenMap').innerHTML = '<div style="padding:20px; color:black; background:white;">Kartan lataus epäonnistui.</div>';
    }
    return;
  }

  if (loadingEl) loadingEl.remove();

  geoLayer = L.geoJSON(geoData, {
    style: (feature) => getBaseStyle(getName(feature)),
    onEachFeature: (feature, layer) => {
      const name = getName(feature);
      nameToLayer.set(name, layer);

      bindPopupForLayer(layer, name);

      layer.on('click', () => {
        selectedLayer = layer;
        refreshStyle();
      });
    }
  }).addTo(map);

  refreshStyle();
  updateStats();

  // Paikannus
  const locateBtn = document.getElementById('swedenLocateBtn');
  if (locateBtn) {
    updateLocateButton();
    locateBtn.onclick = () => {
      watching = !watching;
      updateLocateButton();
      if (watching) {
        updateLocationStatus('Haetaan sijaintia...');
        currentLayer = null;
        selectedLayer = null;
        refreshStyle();
        map.locate({ watch: true, enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
      } else {
        map.stopLocate();
        userMarker.clearLayers();
        currentLayer = null;
        updateLocationStatus('');
        refreshStyle();
      }
    };
  }

  map.on('locationfound', (e) => {
    userMarker.clearLayers();
    L.circleMarker(e.latlng, { radius: 7, color: '#1e1e2e', fillColor: '#f9e2af', fillOpacity: 1, weight: 2 }).addTo(userMarker);

    const matchLayer = findMunicipalityLayerByPoint(e.latlng.lat, e.latlng.lng);
    if (matchLayer) {
      if (currentLayer !== matchLayer) {
        currentLayer = matchLayer;
        updateLocationStatus('Olet nyt: ' + getName(matchLayer.feature));
        refreshStyle();
      }
      if (watching) {
        map.panTo(e.latlng);
      } else {
        if (matchLayer.getBounds) map.fitBounds(matchLayer.getBounds());
        matchLayer.openPopup();
      }
    } else {
      updateLocationStatus('Sijainti ei osunut kunnan rajoille');
    }
  });

  map.on('locationerror', () => {
    watching = false;
    updateLocateButton();
    updateLocationStatus('');
    alert('Paikannus epäonnistui. Varmista, että sijainti on sallittu selaimessa.');
  });

  // Tyhjennys
  const clearBtn = document.getElementById('swedenClearBtn');
  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (confirm('Tyhjennätkö kaikki Ruotsin kartalle merkityt löydöt?')) {
        found.clear();
        for (const key in foundStats) delete foundStats[key];
        await saveFound(user.uid, foundStats, db);
        selectedLayer = null;
        currentLayer = null;
        updateLocationStatus('');
        updateStats();
        refreshStyle();
      }
    };
  }

  // GPX-tuonti
  const importBtn = document.getElementById('swedenImportBtn');
  const gpxInput = document.getElementById('swedenGpxInput');
  if (importBtn && gpxInput) {
    importBtn.onclick = () => gpxInput.click();
    gpxInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const xml = new DOMParser().parseFromString(text, 'application/xml');
        const parserError = xml.querySelector('parsererror');
        if (parserError) throw new Error('Tiedosto ei ole kelvollinen XML/GPX');

        const points = [];
        xml.querySelectorAll('wpt').forEach(wpt => {
          const lat = parseFloat(wpt.getAttribute('lat'));
          const lon = parseFloat(wpt.getAttribute('lon'));
          const sym = wpt.querySelector('sym')?.textContent || '';
          if (isNaN(lat) || isNaN(lon)) return;
          if (!sym.includes('Found')) return; // vain löydetyt kätköt
          const type = getCacheTypeFromWpt(wpt);
          points.push({ lat, lon, type });
        });

        if (points.length === 0) {
          alert('GPX-tiedostosta ei löytynyt löydettyjä kätköjä.');
          return;
        }

        updateLocationStatus(`Tuodaan ${points.length} kätköä...`);
        let addedMunicipalities = 0;
        let typeHits = 0;
        for (let i = 0; i < points.length; i++) {
          if (i % 25 === 0) updateLocationStatus(`Tuodaan... ${i} / ${points.length}`);
          const p = points[i];
          const layer = findMunicipalityLayerByPoint(p.lat, p.lon);
          if (layer) {
            const name = getName(layer.feature);
            if (!found.has(name)) {
              found.add(name);
              foundStats[name] = { s: createEmptyStats() };
              addedMunicipalities++;
            }
            if (p.type && GPX_TYPE_TO_INDEX[p.type] !== undefined) {
              const idx = GPX_TYPE_TO_INDEX[p.type];
              foundStats[name].s[idx] = (foundStats[name].s[idx] || 0) + 1;
              typeHits++;
            } else if (p.type) {
              console.warn('Tuntematon kätkötyyppi GPX:ssä:', p.type);
            }
          }
          if (i % 75 === 0) await new Promise(r => setTimeout(r, 0));
        }

        await saveFound(user.uid, foundStats, db);
        updateStats();
        refreshStyle();
        updateLocationStatus(`${addedMunicipalities} uutta kuntaa, ${typeHits} tyyppiä merkitty (yht. ${found.size} / 290)`);
        alert(`GPX-tuonti valmis.\n\n${addedMunicipalities} uutta kuntaa merkittiin löydetyksi.\n${typeHits} kätkölle tunnistettiin tyyppi.\nYhteensä ${found.size} / 290 kuntaa.`);
      } catch (err) {
        console.error('GPX-tuonti epäonnistui:', err);
        alert('GPX-tiedoston lukeminen epäonnistui: ' + err.message);
        updateLocationStatus('');
      } finally {
        gpxInput.value = '';
      }
    };
  }

  function getCacheTypeFromWpt(wpt) {
    const gsType = wpt.getElementsByTagNameNS('http://www.groundspeak.com/cache/1/0/1', 'type')[0];
    if (gsType?.textContent) return gsType.textContent.trim();
    const t = wpt.querySelector('type');
    if (t?.textContent) {
      const parts = t.textContent.split('|');
      return parts[parts.length - 1].trim();
    }
    return null;
  }

  function findMunicipalityLayerByPoint(lat, lon) {
    if (!geoLayer) return null;
    const latlng = L.latLng(lat, lon);
    const layers = geoLayer.getLayers();
    for (const layer of layers) {
      if (layer.getBounds && layer.getBounds().contains(latlng)) {
        if (isPointInFeature([lon, lat], layer.feature)) return layer;
      }
    }
    return null;
  }
};
