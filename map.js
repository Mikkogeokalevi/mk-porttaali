import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// KARTTALÄHTEET
const GEOJSON_URLS = [
    // Lähde 1: Sami Laine (Vakaa)
    'https://raw.githubusercontent.com/samilaine/hallinnollisetrajat/master/kuntarajat.json',
    // Lähde 2: Teemu Koivisto (Vara)
    'https://raw.githubusercontent.com/TeemuKoivisto/map-of-finland/master/kuntarajat-2018-raw.json',
    // Lähde 3: Paikallinen
    './kunnat.json'
];

export const renderTripletMap = async (content, db, user, app) => {
    if (!user) { app.router('login_view'); return; }

    content.innerHTML = `
        <div class="card" style="height: 90vh; display: flex; flex-direction: column; padding: 0; overflow: hidden; position: relative;">
            <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); border-bottom: 1px solid var(--border-color); z-index: 1001;">
                <h2 style="margin:0; font-size: 1.2em;">Triplettikartta</h2>
                <div style="display:flex; gap:10px;">
                    <button id="locateBtn" class="btn" style="margin:0; padding: 5px 10px; font-size:1.2em;" title="Paikanna minut">📍</button>
                    <button class="btn" onclick="app.router('stats_triplet')" style="margin:0; padding: 5px 10px;">⬅ Takaisin</button>
                </div>
            </div>
            
            <div id="map" style="flex: 1; width: 100%; background: #aad3df;">
                <div id="mapLoading" style="padding:20px; color:black; background:white; opacity:0.8; text-align:center; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000; border-radius:8px;">
                    Ladataan karttaa...
                </div>
            </div>
            
            <div style="padding: 10px; background: var(--card-bg); font-size: 0.8em; text-align: center; border-top: 1px solid var(--border-color);">
                <span style="color:#a6e3a1;">■ Valmis</span> &nbsp;
                <span style="color:#f9e2af;">■ Puuttuu 1</span> &nbsp;
                <span style="color:#fab387;">■ Puuttuu 2</span> &nbsp;
                <span style="color:#f38ba8;">■ 0 löytöä</span>
            </div>
        </div>
    `;

    // 1. Haetaan tilastot
    let statsData = {};
    try {
        const docSnap = await getDoc(doc(db, "stats", user.uid));
        if (docSnap.exists()) {
            statsData = docSnap.data().municipalities || {};
        }
    } catch (e) {
        console.error("Virhe tilastojen haussa:", e);
    }

    // 2. Alustetaan kartta - TÄRKEÄ: preferCanvas: true nopeuttaa mobiililla!
    const map = L.map('map', {
        preferCanvas: true,
        zoomControl: false // Siirretään zoom-napit jos tarvis, nyt pois tieltä
    }).setView([65.0, 26.0], 5);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM & CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 3. PAIKANNUS: Etsitään käyttäjä heti
    const userMarker = L.layerGroup().addTo(map);
    
    function locateUser() {
        map.locate({ setView: true, maxZoom: 9, timeout: 10000 });
    }

    map.on('locationfound', (e) => {
        userMarker.clearLayers();
        const radius = e.accuracy / 2;
        L.circle(e.latlng, radius, { color: '#89b4fa', fillOpacity: 0.1 }).addTo(userMarker);
        L.circleMarker(e.latlng, { radius: 8, color: '#fff', fillColor: '#0077cc', fillOpacity: 1 }).addTo(userMarker)
            .bindPopup("Olet tässä").openPopup();
    });

    map.on('locationerror', (e) => {
        console.log("Sijaintia ei löytynyt", e.message);
    });

    // Käynnistetään paikannus heti
    locateUser();

    // Liitetään nappiin toiminto
    document.getElementById('locateBtn').onclick = locateUser;

    // 4. Ladataan kartta-aineisto
    let geoData = null;
    for (const url of GEOJSON_URLS) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                geoData = await response.json();
                break;
            }
        } catch (e) { console.warn("Latausvirhe:", e); }
    }

    const loadingEl = document.getElementById('mapLoading');
    if (loadingEl) loadingEl.remove();

    if (geoData) {
        // Luodaan GeoJSON-kerros
        const geoJsonLayer = L.geoJSON(geoData, {
            style: (feature) => getStyle(feature, statsData),
            onEachFeature: (feature, layer) => onEachFeature(feature, layer, statsData)
        }).addTo(map);

        // Jos sijaintia ei löydy, keskitetään Suomeen, muuten annetaan paikannuksen hoitaa
        // map.fitBounds(geoJsonLayer.getBounds()); 
    } else {
        document.getElementById('map').innerHTML = `<div style="padding:20px; color:black; background:white;">Kartan lataus epäonnistui.</div>`;
    }
};

// --- APUFUNKTIOT ---

function getMunicipalityName(feature) {
    return feature.properties.Name || feature.properties.name || feature.properties.NAMEFIN || feature.properties.nimi || "Tuntematon";
}

function getStatsForMunicipality(name, statsData) {
    if (!name) return { t: 0, m: 0, q: 0, total: 0 };
    const cleanName = name.trim();
    const data = statsData[cleanName];
    if (!data || !data.s) return { t: 0, m: 0, q: 0, total: 0 };
    return {
        t: data.s[0] || 0, m: data.s[1] || 0, q: data.s[3] || 0,
        total: data.s.reduce((a,b) => a+b, 0)
    };
}

function getStyle(feature, statsData) {
    const name = getMunicipalityName(feature);
    const s = getStatsForMunicipality(name, statsData);
    
    let missingCount = 0;
    if (s.t === 0) missingCount++;
    if (s.m === 0) missingCount++;
    if (s.q === 0) missingCount++;

    let color = '#f38ba8'; // Punainen (0 löytöä tai 3 puuttuu)
    let fillOpacity = 0.5;

    if (s.total > 0) {
        // Jos on jotain löytöjä, mutta tripletti puuttuu
        if (missingCount === 2) { color = '#fab387'; fillOpacity = 0.6; } // Oranssi
        else if (missingCount === 1) { color = '#f9e2af'; fillOpacity = 0.6; } // Keltainen
        else if (missingCount === 0) { color = '#a6e3a1'; fillOpacity = 0.4; } // Vihreä
    } else {
        color = '#313244'; // Ei mitään löytöjä (tumma)
        fillOpacity = 0.4;
    }

    return { fillColor: color, weight: 1, opacity: 1, color: 'rgba(255,255,255,0.1)', fillOpacity: fillOpacity };
}

function onEachFeature(feature, layer, statsData) {
    const name = getMunicipalityName(feature);
    const s = getStatsForMunicipality(name, statsData);

    let popupContent = `<div style="text-align:center;"><strong>${name}</strong></div>`;
    
    if (s.t > 0 && s.m > 0 && s.q > 0) {
        popupContent += `<div style="color:#2e7d32; font-weight:bold; margin:5px 0;">Tripletti VALMIS! 🏆</div>`;
    } else {
        popupContent += `<div style="margin:5px 0; font-weight:bold;">Puuttuu:</div>`;
        if (s.t === 0) popupContent += `❌ Tradi<br>`;
        if (s.m === 0) popupContent += `❌ Multi<br>`;
        if (s.q === 0) popupContent += `❌ Mysteeri<br>`;
        if (s.total === 0) popupContent = `<div style="margin-top:5px; color:#cc0000;">Ei löytöjä lainkaan</div>`;
    }
    
    // Klikkaus tuo popupin esiin (Leafletin oletus)
    layer.bindPopup(popupContent);
}
