// Muiden maiden kuntakartat - yleiskäyttöinen interaktiivinen löytökartta
// Tukee Ruotsin, Norjan ja Viron kuntia/valdoja/kommuuneja.

import { doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getZoomBySpeed, requestScreenWakeLock, releaseScreenWakeLock } from "./locationHelpers.js";
import { loadFinds, findsList } from "./findsQuery.js";

// Kätkötyypit Suomen karttojen tyyliin
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

export const COUNTRY_CONFIGS = {
  sweden: {
    id: 'sweden',
    flag: '🇸🇪',
    name: 'Ruotsi',
    geoJsonUrl: './sverige_kommuner.geojson',
    storageKey: 'mk_sweden_found_v1',
    firestorePath: 'sweden',
    totalMunicipalities: 290,
    center: [62.5, 16.5],
    zoom: 5,
    label: 'kuntaa',
    nameProperty: (props) => props.kom_namn || props.name || props.Name || props.NAMEFIN
  },
  norway: {
    id: 'norway',
    flag: '🇳🇴',
    name: 'Norja',
    geoJsonUrl: './norge_kommuner.geojson',
    storageKey: 'mk_norway_found_v1',
    firestorePath: 'norway',
    totalMunicipalities: 357,
    center: [65, 14],
    zoom: 5,
    label: 'kommunia',
    nameProperty: (props) => props.kommunenavn || props.name || props.Name || props.kom_namn
  },
  estonia: {
    id: 'estonia',
    flag: '🇪🇪',
    name: 'Viro',
    geoJsonUrl: './viro_vald.geojson',
    storageKey: 'mk_estonia_found_v1',
    firestorePath: 'estonia',
    totalMunicipalities: 79,
    center: [58.7, 25.5],
    zoom: 7,
    label: 'valda',
    nameProperty: (props) => props.ONIMI || props.name || props.Name || props.kom_namn
  }
};

// Lippu-SVG:t — Windows ei renderöi lippu-emojeja (näkyy vain SE/NO/EE-kirjaimet)
const FLAG_SVGS = {
  sweden: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10" width="34" height="22" style="border-radius:3px; vertical-align:middle;"><rect width="16" height="10" fill="#006AA7"/><rect x="5" width="2" height="10" fill="#FECC02"/><rect y="4" width="16" height="2" fill="#FECC02"/></svg>',
  norway: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 16" width="34" height="25" style="border-radius:3px; vertical-align:middle;"><rect width="22" height="16" fill="#BA0C2F"/><rect x="6" width="4" height="16" fill="#fff"/><rect y="6" width="22" height="4" fill="#fff"/><rect x="7" width="2" height="16" fill="#00205B"/><rect y="7" width="22" height="2" fill="#00205B"/></svg>',
  estonia: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 21" width="34" height="22" style="border-radius:3px; vertical-align:middle;"><rect width="33" height="7" fill="#0072CE"/><rect y="7" width="33" height="7" fill="#000"/><rect y="14" width="33" height="7" fill="#fff"/></svg>'
};

function createEmptyStats() {
  return new Array(CACHE_TYPES.length).fill(0);
}

function migrateListToObject(list) {
  const obj = {};
  for (const name of list) {
    obj[name] = { s: createEmptyStats(), ids: [] };
  }
  return obj;
}

function ensureIds(data) {
  for (const key in data) {
    if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key].ids)) {
      data[key].ids = [];
    }
  }
  return data;
}

function getStorageKey(uid, config) {
  return `${config.storageKey}_${uid}`;
}

function getName(feature, config) {
  const props = feature?.properties || {};
  return config.nameProperty(props) || 'Tuntematon';
}

function normalizeGpxTime(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate().toISOString();
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d) ? null : d.toISOString();
  }
  return null;
}

async function loadFound(uid, db, config) {
  let municipalities = {};
  let lastGpxImport = null;
  if (db && uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, config.firestorePath, 'finds'));
      if (snap.exists()) {
        const d = snap.data();
        if (d.lastGpxImport) lastGpxImport = normalizeGpxTime(d.lastGpxImport);
        let ms = d.municipalities;
        if (ms) {
          if (Array.isArray(ms)) ms = migrateListToObject(ms);
          municipalities = ensureIds(ms);
        }
        try { localStorage.setItem(getStorageKey(uid, config), JSON.stringify({ municipalities, lastGpxImport })); } catch {}
        return { municipalities, lastGpxImport };
      }
    } catch (e) {
      console.warn(`${config.name}-löytöjen lataus Firestoresta epäonnistui:`, e);
    }
  }
  try {
    const raw = JSON.parse(localStorage.getItem(getStorageKey(uid, config)) || '{}');
    if (Array.isArray(raw)) return { municipalities: migrateListToObject(raw), lastGpxImport: null };
    if (raw && typeof raw === 'object') {
      return {
        municipalities: ensureIds(raw.municipalities || {}),
        lastGpxImport: normalizeGpxTime(raw.lastGpxImport)
      };
    }
  } catch {
    // Ei dataa
  }
  return { municipalities, lastGpxImport };
}

async function saveFound(uid, data, db, config, lastGpxImport = null) {
  const payload = { municipalities: data, updatedAt: Timestamp.now() };
  const localPayload = { municipalities: data };
  if (lastGpxImport) {
    payload.lastGpxImport = lastGpxImport;
    localPayload.lastGpxImport = lastGpxImport;
  }
  try {
    localStorage.setItem(getStorageKey(uid, config), JSON.stringify(localPayload));
  } catch {
    // Ei tallennustilaa
  }
  if (db && uid) {
    try {
      await setDoc(doc(db, 'users', uid, config.firestorePath, 'finds'), payload);
    } catch (e) {
      console.warn(`${config.name}-löytöjen tallennus Firestoreen epäonnistui:`, e);
    }
  }
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

function toRad(deg) {
  return deg * Math.PI / 180;
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistMeters(lat, lon, lat1, lon1, lat2, lon2) {
  const avgLat = toRad((lat1 + lat2) / 2);
  const cosLat = Math.cos(avgLat);
  const R = 6371000;
  const deg2rad = Math.PI / 180;
  // Equirectangular approximation for the nearest-point-on-segment computation
  const x0 = lon * deg2rad * R * cosLat;
  const y0 = lat * deg2rad * R;
  const x1 = lon1 * deg2rad * R * cosLat;
  const y1 = lat1 * deg2rad * R;
  const x2 = lon2 * deg2rad * R * cosLat;
  const y2 = lat2 * deg2rad * R;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const segLenSq = dx * dx + dy * dy;
  let t = 0;
  if (segLenSq !== 0) {
    t = Math.max(0, Math.min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / segLenSq));
  }
  const projLat = (y1 + t * dy) / (deg2rad * R);
  const projLon = (x1 + t * dx) / (deg2rad * R * cosLat);
  return distanceMeters(lat, lon, projLat, projLon);
}

function minDistanceToFeature(lat, lon, feature) {
  const geom = feature?.geometry;
  if (!geom) return Infinity;
  let best = Infinity;
  const processRing = (ring) => {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const p1 = ring[i];
      const p2 = ring[j];
      const d = pointToSegmentDistMeters(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (d < best) best = d;
      if (best === 0) return;
    }
  };
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) processRing(ring);
  } else if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      for (const ring of polygon) processRing(ring);
    }
  }
  return best;
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

function getCacheIdFromWpt(wpt) {
  const name = wpt.querySelector('name')?.textContent?.trim();
  if (name) return name;
  const gsCode = wpt.getElementsByTagNameNS('http://www.groundspeak.com/cache/1/0/1', 'code')[0];
  if (gsCode?.textContent) return gsCode.textContent.trim();
  return null;
}

export function renderCountrySelector(content, app) {
  content.innerHTML = `
    <div class="card">
      <div class="view-header">
        <h1>Ulkomaiden kuntakartat</h1>
        <button class="btn btn-sm" onclick="app.router('stats')">⬅ Tilastot</button>
      </div>
      <p>Valitse maa, jonka kuntakartan haluat avata:</p>
      <div class="launcher-grid">
        <button class="launcher-btn btn-yellow" onclick="app.router('sweden_map')">
          <span class="launcher-icon">${FLAG_SVGS.sweden}</span>Ruotsi
        </button>
        <button class="launcher-btn btn-blue" onclick="app.router('norway_map')">
          <span class="launcher-icon">${FLAG_SVGS.norway}</span>Norja
        </button>
        <button class="launcher-btn btn-green" onclick="app.router('estonia_map')">
          <span class="launcher-icon">${FLAG_SVGS.estonia}</span>Viro
        </button>
      </div>
    </div>
  `;
}

export const renderSwedenMap = async (content, db, user, app) => renderCountryMap(content, db, user, app, COUNTRY_CONFIGS.sweden);
export const renderNorwayMap = async (content, db, user, app) => renderCountryMap(content, db, user, app, COUNTRY_CONFIGS.norway);
export const renderEstoniaMap = async (content, db, user, app) => renderCountryMap(content, db, user, app, COUNTRY_CONFIGS.estonia);

async function renderCountryMap(content, db, user, app, config) {
  if (!user) {
    app.router('login_view');
    return;
  }

  const { municipalities: foundStats, lastGpxImport: initialLastGpxImport } = await loadFound(user.uid, db, config);
  let lastGpxImport = initialLastGpxImport;
  const found = new Set(Object.keys(foundStats));
  let selectedLayer = null;
  let currentLayer = null;
  let watching = false;
  let manualOverrideUntil = 0;
  let geoLayer;
  let countryBounds;

  content.innerHTML = `
    <div class="card map-shell">
      <div class="map-toolbar">
        <h2>${FLAG_SVGS[config.id] || config.flag} ${config.name}-kuntakartta</h2>
        <span id="${config.id}LocationStatus" style="font-size: 0.85em; margin-left: auto; padding-right: 6px; color: var(--success-color);"></span>
        <div class="toolbar-actions">
          <button id="${config.id}ImportBtn" class="btn btn-sm" title="Tuo löydöt GPX-tiedostosta">📁 Tuo GPX</button>
          <input type="file" id="${config.id}GpxInput" accept=".gpx,.xml" style="display:none">
          <button id="${config.id}LocateBtn" class="btn btn-sm" style="font-size: 1.1em;" title="Paikanna ja seuraa sijaintia" aria-label="Paikanna ja seuraa sijaintia">📍</button>
          <button id="${config.id}ClearBtn" class="btn btn-sm" title="Tyhjennä löydöt" aria-label="Tyhjennä löydöt">🗑️</button>
          <button class="btn btn-sm" onclick="app.router('country_maps')">⬅ Takaisin</button>
        </div>
      </div>

      <div class="map-subbar">
        <span>Klikkaa kuntaa merkitäksesi löydetyksi. Voit myös tuoda löydöt GPX-tiedostosta.</span>
        <span id="${config.id}Stats" style="font-weight: bold; color: var(--text-color);"></span>
      </div>
      <div id="${config.id}GpxTime" class="map-subbar" style="padding: 4px 12px; font-size: 0.8em; justify-content: flex-end;"></div>

      <div id="${config.id}Map" class="map-area">
        <div id="${config.id}MapLoading" class="map-loading">
          Ladataan ${config.name}-kuntakarttaa...
        </div>
      </div>

      <div class="map-footer">
        <span style="color: #a6e3a1;">■ Löydetty</span> &nbsp;
        <span style="color: #f38ba8;">■ Etsittävä</span> &nbsp;
        <span style="color: #f9e2af;">■ Nykyinen kunta</span>
      </div>
    </div>

    <div class="card" style="margin-top:12px;">
      <details id="${config.id}FindsDetails">
        <summary style="cursor:pointer; font-size:0.9em; color:var(--subtext-color);">📋 Näytä löydöt maassa</summary>
        <div id="${config.id}FindsList" style="margin-top:8px;"></div>
      </details>
    </div>
  `;

  const map = L.map(`${config.id}Map`, { preferCanvas: true, zoomControl: false }).setView(config.center, config.zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM & CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  const statsEl = document.getElementById(`${config.id}Stats`);
  const loadingEl = document.getElementById(`${config.id}MapLoading`);
  const locationStatusEl = document.getElementById(`${config.id}LocationStatus`);
  const gpxTimeEl = document.getElementById(`${config.id}GpxTime`);
  const userMarker = L.layerGroup().addTo(map);
  const nameToLayer = new Map();

  // Löytölistan laiska lataus: avataan vasta kun käyttäjä klikkaa
  const findsDetails = document.getElementById(`${config.id}FindsDetails`);
  findsDetails?.addEventListener('toggle', async () => {
    if (!findsDetails.open || findsDetails.dataset.loaded) return;
    findsDetails.dataset.loaded = '1';
    const listEl = document.getElementById(`${config.id}FindsList`);
    listEl.innerHTML = '<p style="font-size:0.85em; opacity:0.7;">Ladataan löytöjä…</p>';
    try {
      const finds = await loadFinds(db, user.uid);
      const hits = finds.filter(f => f.country === config.name);
      listEl.innerHTML = hits.length
        ? `<p style="font-size:0.8em; opacity:0.7; margin:0 0 6px;">${hits.length} löytöä maassa ${config.name}</p>` + findsList(hits, 500)
        : '<p style="font-size:0.85em; opacity:0.7;">Ei kätkökohtaista löytödataa. Tuo löydöt GPX-tiedostosta, niin ne listautuvat tänne.</p>';
    } catch (e) {
      console.error('Maakohtainen löytölista:', e);
      listEl.innerHTML = '<p style="color:var(--c-red); font-size:0.85em;">Lataus epäonnistui.</p>';
    }
  });

  // Jos käyttäjä zoomaa/panoroi manuaalisesti, keskeytetään automaattinen seuranta 10 s ajaksi
  map.on('dragstart', () => { manualOverrideUntil = Date.now() + 10000; });
  L.DomEvent.on(map.getContainer(), 'wheel touchstart pointerdown', () => {
    manualOverrideUntil = Date.now() + 10000;
  });

  function updateLocationStatus(text) {
    if (!locationStatusEl) return;
    locationStatusEl.textContent = text || '';
  }

  function updateGpxTime() {
    if (!gpxTimeEl) return;
    gpxTimeEl.textContent = lastGpxImport
      ? 'Viimeisin GPX-tuonti: ' + new Date(lastGpxImport).toLocaleString('fi-FI', { dateStyle: 'short', timeStyle: 'short' })
      : '';
  }

  function updateLocateButton() {
    if (!locateBtn) return;
    locateBtn.textContent = watching ? '⏹️' : '📍';
    locateBtn.title = watching ? 'Lopeta paikannus' : 'Paikanna ja seuraa sijaintia';
  }

  function updateStats() {
    if (!statsEl) return;
    statsEl.textContent = `${found.size} / ${config.totalMunicipalities} ${config.label}`;
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
    const name = getName(layer.feature, config);
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
      foundStats[name] = { s: createEmptyStats(), ids: [] };
    }
    await saveFound(user.uid, foundStats, db, config, lastGpxImport);
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
      const showButton = !hasGpxFinds; // GPX-tuotuja kuntaa ei voi poistaa yksittäin tästä
      div.innerHTML = `
        <strong style="font-size:1.1em;display:block;margin-bottom:6px;">${name}</strong>
        <div id="${config.id}PopupStatus" style="margin-bottom:8px;">${statusText}</div>
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
    const response = await fetch(config.geoJsonUrl);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    geoData = await response.json();
  } catch (e) {
    console.error(`${config.name}-kuntakartan lataus epäonnistui:`, e);
    if (loadingEl) {
      loadingEl.textContent = 'Kartan lataus epäonnistui. Tarkista verkkoyhteys.';
    } else {
      document.getElementById(`${config.id}Map`).innerHTML = '<div style="padding:20px; color:black; background:white;">Kartan lataus epäonnistui.</div>';
    }
    return;
  }

  if (loadingEl) loadingEl.remove();

  geoLayer = L.geoJSON(geoData, {
    style: (feature) => getBaseStyle(getName(feature, config)),
    onEachFeature: (feature, layer) => {
      const name = getName(feature, config);
      nameToLayer.set(name, layer);

      bindPopupForLayer(layer, name);

      layer.on('click', () => {
        selectedLayer = layer;
        refreshStyle();
      });
    }
  }).addTo(map);
  countryBounds = geoLayer.getBounds();

  refreshStyle();
  updateStats();
  updateGpxTime();

  // Paikannus
  const locateBtn = document.getElementById(`${config.id}LocateBtn`);
  if (locateBtn) {
    updateLocateButton();
    locateBtn.onclick = () => {
      watching = !watching;
      updateLocateButton();
      if (watching) {
        manualOverrideUntil = 0;
        updateLocationStatus('Haetaan sijaintia...');
        currentLayer = null;
        selectedLayer = null;
        refreshStyle();
        requestScreenWakeLock();
        map.locate({ watch: true, enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      } else {
        map.stopLocate();
        currentLayer = null;
        updateLocationStatus('');
        refreshStyle();
        releaseScreenWakeLock();
      }
    };
  }

  map.on('locationfound', (e) => {
    userMarker.clearLayers();
    L.circleMarker(e.latlng, { radius: 7, color: '#fff', fillColor: '#ff0000', fillOpacity: 1, weight: 2 }).addTo(userMarker);

    const matchLayer = findMunicipalityLayerByPoint(e.latlng.lat, e.latlng.lng);
    if (matchLayer) {
      if (currentLayer !== matchLayer) {
        currentLayer = matchLayer;
        updateLocationStatus('Olet nyt: ' + getName(matchLayer.feature, config));
        refreshStyle();
      }
      if (watching && Date.now() > manualOverrideUntil) {
        const zoom = getZoomBySpeed(e.speed);
        map.setView(e.latlng, zoom, { animate: true, duration: 0.3 });
      } else {
        if (matchLayer.getBounds) map.fitBounds(matchLayer.getBounds());
        matchLayer.openPopup();
      }
    } else {
      updateLocationStatus('Sijainti ei osunut kunnan rajoille');
      if (watching && Date.now() > manualOverrideUntil) {
        const zoom = getZoomBySpeed(e.speed);
        map.setView(e.latlng, zoom, { animate: true, duration: 0.3 });
      }
    }
  });

  map.on('locationerror', () => {
    watching = false;
    updateLocateButton();
    updateLocationStatus('');
    alert('Paikannus epäonnistui. Varmista, että sijainti on sallittu selaimessa.');
  });

  // Tyhjennys
  const clearBtn = document.getElementById(`${config.id}ClearBtn`);
  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (confirm(`Tyhjennätkö kaikki ${config.name}-kartalle merkityt löydöt?`)) {
        found.clear();
        for (const key in foundStats) delete foundStats[key];
        lastGpxImport = null;
        await saveFound(user.uid, foundStats, db, config, lastGpxImport);
        selectedLayer = null;
        currentLayer = null;
        updateLocationStatus('');
        updateStats();
        updateGpxTime();
        refreshStyle();
      }
    };
  }

  // GPX-tuonti
  const importBtn = document.getElementById(`${config.id}ImportBtn`);
  const gpxInput = document.getElementById(`${config.id}GpxInput`);
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
          const code = getCacheIdFromWpt(wpt) || `${lat}|${lon}`;
          points.push({ lat, lon, type, code });
        });

        if (points.length === 0) {
          alert('GPX-tiedostosta ei löytynyt löydettyjä kätköjä.');
          return;
        }

        updateLocationStatus(`Tuodaan ${points.length} kätköä...`);
        let addedMunicipalities = 0;
        let typeHits = 0;
        let duplicateCaches = 0;
        let fallbackMatches = 0;
        let outOfBounds = 0;
        for (let i = 0; i < points.length; i++) {
          if (i % 25 === 0) updateLocationStatus(`Tuodaan... ${i} / ${points.length}`);
          const p = points[i];
          let layer = findMunicipalityLayerByPoint(p.lat, p.lon);
          if (!layer) {
            layer = findNearestMunicipalityLayerByPoint(p.lat, p.lon, 10000);
            if (layer) {
              fallbackMatches++;
            } else {
              outOfBounds++;
              console.warn('GPX-piste kartan ulkopuolella:', p.code, p.lat, p.lon);
              if (i % 75 === 0) await new Promise(r => setTimeout(r, 0));
              continue;
            }
          }
          const name = getName(layer.feature, config);
          if (!found.has(name)) {
            found.add(name);
            foundStats[name] = { s: createEmptyStats(), ids: [] };
            addedMunicipalities++;
          }
          const entry = foundStats[name];
          if (!Array.isArray(entry.ids)) entry.ids = [];
          if (entry.ids.includes(p.code)) {
            duplicateCaches++;
            if (i % 75 === 0) await new Promise(r => setTimeout(r, 0));
            continue;
          }
          entry.ids.push(p.code);
          if (p.type && GPX_TYPE_TO_INDEX[p.type] !== undefined) {
            const idx = GPX_TYPE_TO_INDEX[p.type];
            entry.s[idx] = (entry.s[idx] || 0) + 1;
            typeHits++;
          } else if (p.type) {
            console.warn('Tuntematon kätkötyyppi GPX:ssä:', p.type);
          }
          if (i % 75 === 0) await new Promise(r => setTimeout(r, 0));
        }
        lastGpxImport = new Date().toISOString();
        await saveFound(user.uid, foundStats, db, config, lastGpxImport);
        updateStats();
        updateGpxTime();
        refreshStyle();
        updateLocationStatus(`${addedMunicipalities} uutta kuntaa, ${typeHits} tyyppiä merkitty, ${duplicateCaches} duplikaatti, ${fallbackMatches} lähimpään kuntaan, ${outOfBounds} kartan ulkopuolella (yht. ${found.size} / ${config.totalMunicipalities})`);
        alert(`GPX-tuonti valmis.\n\n${addedMunicipalities} uutta kuntaa merkittiin löydetyksi.\n${typeHits} kätkölle tunnistettiin tyyppi.\n${duplicateCaches} kätköä oli jo aiemmin lisätty.\n${fallbackMatches} kätköä osui saarelle tai kunnan reunan tuntumaan ja merkittiin lähimpään kuntaan (10 km raja).\n${outOfBounds} kätköä jäi tämän maan kunnan ulkopuolelle.\nYhteensä ${found.size} / ${config.totalMunicipalities} ${config.label}.`);
      } catch (err) {
        console.error('GPX-tuonti epäonnistui:', err);
        alert('GPX-tiedoston lukeminen epäonnistui: ' + err.message);
        updateLocationStatus('');
      } finally {
        gpxInput.value = '';
      }
    };
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

  function findNearestMunicipalityLayerByPoint(lat, lon, thresholdM = 10000) {
    if (!geoLayer) return null;
    const latlng = L.latLng(lat, lon);
    if (!countryBounds || !countryBounds.contains(latlng)) return null;
    let bestLayer = null;
    let bestDist = thresholdM;
    const layers = geoLayer.getLayers();
    for (const layer of layers) {
      const d = minDistanceToFeature(lat, lon, layer.feature);
      if (d < bestDist) {
        bestDist = d;
        bestLayer = layer;
      }
    }
    return bestLayer;
  }
}
