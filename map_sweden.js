// Ruotsin kuntakartta - interaktiivinen löytökartta
// Käyttäjä voi merkitä kunnan löydetyksi klikkaamalla ja paikantaa itsensä kartalta.

const GEOJSON_URL = './sverige_kommuner.geojson';
const STORAGE_KEY = 'mk_sweden_found_v1';

function getStorageKey(uid) {
  return `${STORAGE_KEY}_${uid}`;
}

function loadFound(uid) {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(uid)) || '[]');
  } catch {
    return [];
  }
}

function saveFound(uid, list) {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(list));
  } catch {
    // Ei tallennustilaa
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

  const found = new Set(loadFound(user.uid));
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
          <button id="swedenLocateBtn" class="btn" style="margin: 0; padding: 5px 10px; font-size: 1.2em;" title="Paikanna ja seuraa sijaintia">📍</button>
          <button id="swedenClearBtn" class="btn" style="margin: 0; padding: 5px 10px;" title="Tyhjennä löydöt">🗑️</button>
          <button class="btn" onclick="app.router('stats')" style="margin: 0; padding: 5px 10px;">⬅ Takaisin</button>
        </div>
      </div>

      <div style="padding: 8px 10px; background: var(--input-bg); border-bottom: 1px solid var(--border-color); font-size: 0.85em; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <span>Klikkaa kuntaa merkitäksesi löydetyksi.</span>
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

  function toggleFound(name) {
    if (found.has(name)) found.delete(name);
    else found.add(name);
    saveFound(user.uid, [...found]);
    updateStats();
    refreshStyle();
  }

  function bindPopupForLayer(layer, name) {
    layer.bindPopup(() => {
      const isFound = found.has(name);
      const div = document.createElement('div');
      div.style.textAlign = 'center';
      div.style.minWidth = '160px';
      div.innerHTML = `
        <strong style="font-size:1.1em; display:block; margin-bottom:6px;">${name}</strong>
        <div id="swedenPopupStatus" style="margin-bottom:8px;">${isFound ? '✅ Löydetty' : '🔴 Etsittävä'}</div>
        <button class="btn btn-primary" style="padding:5px 10px; font-size:0.85em;">${isFound ? 'Poista löytö' : 'Merkitse löydetyksi'}</button>
      `;
      const status = div.querySelector('#swedenPopupStatus');
      const btn = div.querySelector('button');
      btn.onclick = () => {
        toggleFound(name);
        const nowFound = found.has(name);
        if (status) status.textContent = nowFound ? '✅ Löydetty' : '🔴 Etsittävä';
        btn.textContent = nowFound ? 'Poista löytö' : 'Merkitse löydetyksi';
      };
      return div;
    });
  }

  function findMunicipalityLayer(latlng) {
    const point = [latlng.lng, latlng.lat];
    for (const feature of geoLayer.toGeoJSON().features || []) {
      if (isPointInFeature(point, feature)) {
        return nameToLayer.get(getName(feature)) || null;
      }
    }
    return null;
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

    const matchLayer = findMunicipalityLayer(e.latlng);
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
    clearBtn.onclick = () => {
      if (confirm('Tyhjennätkö kaikki Ruotsin kartalle merkityt löydöt?')) {
        found.clear();
        saveFound(user.uid, []);
        selectedLayer = null;
        updateStats();
        refreshStyle();
      }
    };
  }
};
