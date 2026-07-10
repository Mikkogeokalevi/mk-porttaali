import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { maakuntienKunnat } from "./data.js"; 

// Käytetään samoja varmoja karttalähteitä
const GEOJSON_URLS = [
    'https://raw.githubusercontent.com/samilaine/hallinnollisetrajat/master/kuntarajat.json',
    'https://raw.githubusercontent.com/TeemuKoivisto/map-of-finland/master/kuntarajat-2018-raw.json',
    './kunnat.json'
];

// MÄÄRITELLÄÄN PGC-ALUEET AHVENANMAALLE
const ALAND_REGIONS = {
    "Maarianhamina": "Mariehamn",
    "Brändö": "Ålands skärgård",
    "Föglö": "Ålands skärgård",
    "Kumlinge": "Ålands skärgård",
    "Kökar": "Ålands skärgård",
    "Sottunga": "Ålands skärgård",
    "Vårdö": "Ålands skärgård",
    // Loput menevät "Ålands landsbygd" -kategoriaan, jos maa on Åland
};

// KUNTALIITOKSET (Vanha nimi -> Uusi nimi)
// Karttapohja voi olla vanha, mutta tilastot ovat uusia.
const MUNICIPALITY_MAPPING = {
    "Pertunmaa": "Mäntyharju"
};

// Kätkötyypit ikoneineen
const CACHE_TYPES = [
    { index: 0, name: 'Tradi', icon: 'kuvat/tradi.gif' },
    { index: 1, name: 'Multi', icon: 'kuvat/multi.gif' },
    { index: 2, name: 'Webcam', icon: 'kuvat/webcam.gif' },
    { index: 3, name: 'Mysse', icon: 'kuvat/mysse.gif' },
    { index: 4, name: 'Letteri', icon: 'kuvat/letteri.gif' },
    { index: 5, name: 'Öörtti', icon: 'kuvat/oortti.gif' },
    { index: 6, name: 'Miitti', icon: 'kuvat/miitti.gif' },
    { index: 7, name: 'Virtu', icon: 'kuvat/virtu.gif' },
    { index: 8, name: 'Cito', icon: 'kuvat/cito.gif' },
    { index: 9, name: 'Wherigo', icon: 'kuvat/wherigo.gif' },
    { index: 10, name: 'Com.Cel', icon: 'kuvat/miitti.gif' }, 
    { index: 11, name: 'Mega', icon: 'kuvat/mega.gif' },
    { index: 12, name: 'No Loc', icon: 'kuvat/noloc.gif' },
    { index: 13, name: 'Juhla', icon: 'kuvat/juhla.gif' }
];

export const renderAllFindsMap = async (content, db, user, app) => {
    if (!user) { app.router('login_view'); return; }

    content.innerHTML = `
        <style>
            #missingFilterPanel { padding:8px 10px; background:var(--input-bg); border-bottom:1px solid var(--border-color); font-size:0.85em; }
            #missingFilterToggle { display:none; }
            #missingFilterSummary { display:none; }
            #missingTypeFilterOptions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
            @media (max-width: 767px) {
                #missingFilterPanel { padding:0; }
                #missingFilterToolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 10px; }
                #missingFilterToolbar strong { display:none; }
                #missingFilterToggle { display:inline-block; padding:5px 9px; margin:0; }
                #missingFilterSummary { display:block; flex:1; opacity:0.75; font-size:0.9em; }
                #missingFilterControls { display:none; padding:0 10px 9px 10px; }
                #missingFilterPanel.filters-open #missingFilterControls { display:block; }
                #missingTypeFilterOptions { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px 6px; padding:3px 0 9px 0; }
                #missingTypeFilterOptions label { white-space:nowrap; }
                #missingFilterMode { width:100% !important; margin:0 0 8px 0 !important; }
                #clearMissingFilters { width:100%; }
            }
        </style>
        <div class="card" style="height: 90vh; display: flex; flex-direction: column; padding: 0; overflow: hidden; position: relative;">
            <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); border-bottom: 1px solid var(--border-color); z-index: 1001;">
                <h2 style="margin:0; font-size: 1.2em;">Löytökartta</h2>
                <div style="display:flex; gap:10px;">
                    <button id="locateBtn" class="btn" style="margin:0; padding: 5px 10px; font-size:1.2em;" title="Paikanna minut">📍</button>
                    <button class="btn" onclick="app.router('stats_all')" style="margin:0; padding: 5px 10px;">⬅ Takaisin</button>
                </div>
            </div>
            
            <div id="missingFilterPanel">
                <div id="missingFilterToolbar">
                    <strong>Suodata puuttuvien mukaan:</strong>
                    <span id="missingFilterSummary">Kaikki näkyvissä</span>
                    <button id="missingFilterToggle" class="btn" type="button">Suodattimet ▾</button>
                </div>
                <div id="missingFilterControls">
                    <div id="missingTypeFilterOptions"></div>
                    <select id="missingFilterMode" style="width:auto; padding:4px; margin:0;">
                        <option value="any">Puuttuu vähintään yksi</option>
                        <option value="all">Puuttuvat kaikki valitut</option>
                    </select>
                    <button id="clearMissingFilters" class="btn" type="button" style="padding:4px 8px;">Näytä kaikki</button>
                </div>
            </div>

            <div id="map" style="flex: 1; width: 100%; background: #aad3df;">
                <div id="mapLoading" style="padding:20px; color:black; background:white; opacity:0.8; text-align:center; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000; border-radius:8px;">
                    Ladataan karttaa...
                </div>
            </div>
            
            <div style="padding: 10px; background: var(--card-bg); font-size: 0.8em; text-align: center; border-top: 1px solid var(--border-color);">
                <span style="color:#a6e3a1;">■ Löydetty</span> &nbsp;
                <span style="color:#f38ba8;">■ Ei löytöjä</span>
            </div>
        </div>
    `;

    // 1. Haetaan data
    let statsData = {};
    try {
        const docSnap = await getDoc(doc(db, "stats", user.uid));
        if (docSnap.exists()) {
            statsData = docSnap.data().municipalities || {};
        }
    } catch (e) {
        console.error("Virhe tilastojen haussa:", e);
    }

    const filterOptions = document.getElementById('missingTypeFilterOptions');
    if (filterOptions) {
        filterOptions.innerHTML = CACHE_TYPES.map(type => `
            <label title="Näytä kunnat, joissa ${type.name} puuttuu">
                <input type="checkbox" class="missingTypeFilter" value="${type.index}"> ${type.name}
            </label>
        `).join('');
    }

    // 2. Alustetaan kartta
    const map = L.map('map', { preferCanvas: true, zoomControl: false }).setView([65.0, 26.0], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM & CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 3. Paikannus
    const userMarker = L.layerGroup().addTo(map);
    const locateBtn = document.getElementById('locateBtn');
    let locateEnabled = false;

    function updateLocateButton() {
        if (!locateBtn) return;
        locateBtn.style.backgroundColor = locateEnabled ? '#a6e3a1' : '#f38ba8';
        locateBtn.style.color = '#1e1e2e';
    }

    function locateUser() { map.locate({ setView: true, maxZoom: 9, timeout: 10000 }); }
    
    map.on('locationfound', (e) => {
        if (!locateEnabled) return;
        userMarker.clearLayers();
        L.circle(e.latlng, e.accuracy/2, { color: '#89b4fa', fillOpacity: 0.1 }).addTo(userMarker);
        L.circleMarker(e.latlng, { radius: 8, color: '#fff', fillColor: '#0077cc', fillOpacity: 1 }).addTo(userMarker).bindPopup("Olet tässä").openPopup();
    });

    if (locateBtn) {
        updateLocateButton();
        locateBtn.onclick = () => {
            locateEnabled = !locateEnabled;
            updateLocateButton();
            if (locateEnabled) {
                locateUser();
            } else {
                map.stopLocate();
                userMarker.clearLayers();
            }
        };
    }

    // 4. Ladataan GeoJSON
    let geoData = null;
    for (const url of GEOJSON_URLS) {
        try {
            const response = await fetch(url);
            if (response.ok) { geoData = await response.json(); break; }
        } catch (e) {}
    }

    document.getElementById('mapLoading')?.remove();

    if (geoData) {
        // Määritetään PGC-käyttäjä linkkejä varten
        const pgcUser = window.app.savedNickname || user.displayName || 'user';

        const geoLayer = L.geoJSON(geoData, {
            style: (feature) => getStyle(feature, statsData),
            onEachFeature: (feature, layer) => onEachFeature(feature, layer, statsData, pgcUser)
        }).addTo(map);

        const labelLayer = L.layerGroup().addTo(map);
        const filterState = { types: [], mode: 'any' };

        const matchesMissingFilter = (layer) => {
            if (!filterState.types.length) return true;
            const name = getMunicipalityName(layer.feature);
            const data = statsData[name.trim()];
            const stats = data && Array.isArray(data.s) ? data.s : [];
            const missing = filterState.types.map(typeIndex => (stats[typeIndex] || 0) === 0);
            return filterState.mode === 'all' ? missing.every(Boolean) : missing.some(Boolean);
        };

        const applyMissingFilter = () => {
            geoLayer.eachLayer(layer => {
                const visible = matchesMissingFilter(layer);
                layer.setStyle({
                    opacity: visible ? 1 : 0,
                    fillOpacity: visible ? getStyle(layer.feature, statsData).fillOpacity : 0,
                    weight: visible ? 1 : 0
                });
                if (visible) layer.bringToBack();
            });
            refreshLabels();
        };

        const refreshLabels = () => {
            labelLayer.clearLayers();
            geoLayer.eachLayer(layer => {
                if (!layer.getBounds || !matchesMissingFilter(layer)) return;
                const bounds = layer.getBounds();
                const sw = map.latLngToLayerPoint(bounds.getSouthWest());
                const ne = map.latLngToLayerPoint(bounds.getNorthEast());
                const width = Math.abs(ne.x - sw.x);
                const height = Math.abs(sw.y - ne.y);
                if (width < 80 || height < 24) return;
                const name = getMunicipalityName(layer.feature);
                const center = bounds.getCenter();
                L.marker(center, {
                    icon: L.divIcon({
                        className: 'map-label',
                        html: `<div>${name}</div>`
                    }),
                    interactive: false
                }).addTo(labelLayer);
            });
        };

        const filterPanel = document.getElementById('missingFilterPanel');
        const filterSummary = document.getElementById('missingFilterSummary');
        const updateFilterSummary = () => {
            if (!filterSummary) return;
            filterSummary.textContent = filterState.types.length
                ? `${filterState.types.length} tyyppiä valittu`
                : 'Kaikki näkyvissä';
        };

        document.getElementById('missingFilterToggle')?.addEventListener('click', () => {
            filterPanel?.classList.toggle('filters-open');
        });

        document.querySelectorAll('.missingTypeFilter').forEach(input => {
            input.addEventListener('change', () => {
                filterState.types = Array.from(document.querySelectorAll('.missingTypeFilter:checked'))
                    .map(item => Number(item.value));
                updateFilterSummary();
                applyMissingFilter();
            });
        });

        document.getElementById('missingFilterMode')?.addEventListener('change', (event) => {
            filterState.mode = event.target.value;
            applyMissingFilter();
        });

        document.getElementById('clearMissingFilters')?.addEventListener('click', () => {
            document.querySelectorAll('.missingTypeFilter').forEach(input => { input.checked = false; });
            filterState.types = [];
            updateFilterSummary();
            filterPanel?.classList.remove('filters-open');
            applyMissingFilter();
        });

        updateFilterSummary();
        refreshLabels();
        map.on('zoomend moveend', refreshLabels);
    } else {
        document.getElementById('map').innerHTML = `<div style="padding:20px; color:black; background:white;">Kartan lataus epäonnistui.</div>`;
    }
};

// --- APUFUNKTIOT ---

function getMunicipalityName(feature) {
    let name = feature.properties.Name || feature.properties.name || feature.properties.NAMEFIN || feature.properties.nimi || "Tuntematon";
    // Kuntaliitoskorjaus (Kartta -> Tilasto)
    if (MUNICIPALITY_MAPPING[name]) {
        return MUNICIPALITY_MAPPING[name]; 
    }
    return name;
}

// Etsii mihin maakuntaan kunta kuuluu (PGC-linkkiä varten)
function findRegionForMunicipality(kuntaName) {
    for (const [maakunta, kunnat] of Object.entries(maakuntienKunnat)) {
        if (kunnat.includes(kuntaName)) return maakunta;
    }
    return null;
}

// Apufunktio Ahvenanmaan linkeille
function getPGCLink(pgcUser, kuntaName, region) {
    let country = "Finland";
    let pgcRegion = region;
    let pgcCounty = kuntaName;

    // Ahvenanmaan erityiskäsittely
    if (region === "Ahvenanmaa") {
        country = "Åland Islands";
        // Määritetään PGC:n käyttämä region (esim. Ålands landsbygd)
        pgcRegion = ALAND_REGIONS[kuntaName] || "Ålands landsbygd"; 
        
        // PGC:ssä Maarianhamina on sekä region että county
        if (kuntaName === "Maarianhamina") {
            pgcRegion = "Mariehamn";
            pgcCounty = "Mariehamn";
        }
    }

    // Pertunmaa korjaus linkkiin (jos halutaan että vanha nimi ohjaa uuteen PGC:ssä)
    // PGC luultavasti on päivittänyt, joten käytetään sitä nimeä mikä saatiin getMunicipalityName:sta (Mäntyharju)
    
    return `https://project-gc.com/Tools/MapCompare?player_prc_profileName=${encodeURIComponent(pgcUser)}&geocache_mc_show%5B%5D=found-none&geocache_crc_country=${encodeURIComponent(country)}&geocache_crc_region=${encodeURIComponent(pgcRegion)}&geocache_crc_county=${encodeURIComponent(pgcCounty)}&submit=Filter`;
}

function getStyle(feature, statsData) {
    const name = getMunicipalityName(feature);
    const data = statsData[name.trim()];
    const total = data && data.s ? data.s.reduce((a,b)=>a+b, 0) : 0;

    return {
        fillColor: total > 0 ? '#a6e3a1' : '#f38ba8', // Vihreä jos löytöjä, Punainen jos ei
        weight: 1,
        opacity: 1,
        color: 'rgba(255,255,255,0.15)',
        fillOpacity: 0.5
    };
}

function onEachFeature(feature, layer, statsData, pgcUser) {
    const originalName = feature.properties.Name || feature.properties.name || feature.properties.NAMEFIN || feature.properties.nimi;
    const name = getMunicipalityName(feature); // Tämä palauttaa esim "Mäntyharju" vaikka kartta olisi "Pertunmaa"
    
    const data = statsData[name.trim()];
    const s = data && data.s ? data.s : [];
    
    // KORJAUS 1: Lasketaan vain näytettävät tyypit yhteensä
    let displayTotal = 0;
    
    // Etsitään maakunta
    const region = findRegionForMunicipality(name);
    
    // Otsikko (Näytetään suluissa vanha nimi jos kartta ja data eri)
    let title = name;
    if (originalName && originalName !== name) {
        title = `${name} <span style="font-size:0.8em; opacity:0.7;">(${originalName})</span>`;
    }

    let popupContent = `<div style="text-align:center; min-width:200px; max-width:250px;">
        <strong style="font-size:1.1em;">${title}</strong>
        <div style="font-size:0.8em; opacity:0.7;">${region || ''}</div>
        <hr style="margin:5px 0; border-top:1px solid #555;">`;

    let foundHtml = "";
    let missingHtml = "";

    CACHE_TYPES.forEach(t => {
        const count = s[t.index] || 0;
        if (count > 0) {
            displayTotal += count;
            foundHtml += `<div style="display:inline-block; margin-right:8px; white-space:nowrap;"><img src="${t.icon}" style="width:14px; vertical-align:middle;"> <b>${t.name}:</b> ${count}</div> `;
        } else {
            // KORJAUS 2: "Puuttuu" -lista pillereinä
            missingHtml += `<span style="display:inline-block; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-size:0.8em; margin:2px;">${t.name}</span>`;
        }
    });

    if (displayTotal > 0) {
        popupContent += `<div style="text-align:left; margin-bottom:10px;">
            <div style="margin-bottom:5px;"><strong>Löydetyt (${displayTotal}):</strong></div>
            <div style="display:flex; flex-wrap:wrap; gap:2px;">${foundHtml}</div>
            `;
        
        if (missingHtml) {
            popupContent += `<div style="margin-top:8px; border-top:1px dotted #555; padding-top:5px;">
                <strong style="font-size:0.9em;">Puuttuu:</strong><br>
                <div style="display:flex; flex-wrap:wrap; gap:2px;">${missingHtml}</div>
            </div>`;
        }
        popupContent += `</div>`;
    } else {
        popupContent += `<div style="color:#f38ba8; font-weight:bold; margin:10px 0;">Ei löytöjä</div>`;
    }

    // KORJAUS 3: PGC Linkki (Ahvenanmaa fix)
    if (region) {
        const pgcLink = getPGCLink(pgcUser, name, region);
        popupContent += `<a href="${pgcLink}" target="_blank" class="btn" style="display:block; font-size:0.8em; padding:5px; margin-top:5px; text-decoration:none; background-color:#585b70;">Avaa PGC Kartta ↗</a>`;
    }
    
    popupContent += `</div>`;

    layer.bindPopup(popupContent);

    layer.on({
        mouseover: (e) => { e.target.setStyle({ weight: 3, color: '#fff' }); e.target.bringToFront(); },
        mouseout: (e) => { layer.resetStyle(e.target); layer.setStyle({ weight: 1, color: 'rgba(255,255,255,0.15)' }); }
    });
}
