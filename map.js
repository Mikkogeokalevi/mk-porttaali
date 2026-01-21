import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { maakuntienKunnat } from "./data.js"; // Tarvitaan maakuntatietoa linkkeihin

// KARTTALÄHTEET
const GEOJSON_URLS = [
    'https://raw.githubusercontent.com/samilaine/hallinnollisetrajat/master/kuntarajat.json',
    'https://raw.githubusercontent.com/TeemuKoivisto/map-of-finland/master/kuntarajat-2018-raw.json',
    './kunnat.json'
];

// AHVENANMAAN ALUEET (PGC)
const ALAND_REGIONS = {
    "Maarianhamina": "Mariehamn",
    "Brändö": "Ålands skärgård",
    "Föglö": "Ålands skärgård",
    "Kumlinge": "Ålands skärgård",
    "Kökar": "Ålands skärgård",
    "Sottunga": "Ålands skärgård",
    "Vårdö": "Ålands skärgård",
};

// KUNTALIITOKSET
const MUNICIPALITY_MAPPING = {
    "Pertunmaa": "Mäntyharju"
};

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
                <span style="color:#f38ba8;">■ Puuttuu 3/Ei löytöjä</span>
            </div>
        </div>
    `;

    let statsData = {};
    try {
        const docSnap = await getDoc(doc(db, "stats", user.uid));
        if (docSnap.exists()) {
            statsData = docSnap.data().municipalities || {};
        }
    } catch (e) {
        console.error("Virhe tilastojen haussa:", e);
    }

    const map = L.map('map', { preferCanvas: true, zoomControl: false }).setView([65.0, 26.0], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM & CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    const userMarker = L.layerGroup().addTo(map);
    function locateUser() { map.locate({ setView: true, maxZoom: 9, timeout: 10000 }); }
    
    map.on('locationfound', (e) => {
        userMarker.clearLayers();
        L.circle(e.latlng, e.accuracy / 2, { color: '#89b4fa', fillOpacity: 0.1 }).addTo(userMarker);
        L.circleMarker(e.latlng, { radius: 8, color: '#fff', fillColor: '#0077cc', fillOpacity: 1 }).addTo(userMarker).bindPopup("Olet tässä").openPopup();
    });
    locateUser();
    document.getElementById('locateBtn').onclick = locateUser;

    let geoData = null;
    for (const url of GEOJSON_URLS) {
        try {
            const response = await fetch(url);
            if (response.ok) { geoData = await response.json(); break; }
        } catch (e) {}
    }

    document.getElementById('mapLoading')?.remove();

    if (geoData) {
        const pgcUser = window.app.savedNickname || user.displayName || 'user';
        
        L.geoJSON(geoData, {
            style: (feature) => getStyle(feature, statsData),
            onEachFeature: (feature, layer) => onEachFeature(feature, layer, statsData, pgcUser)
        }).addTo(map);
    } else {
        document.getElementById('map').innerHTML = `<div style="padding:20px; color:black; background:white;">Kartan lataus epäonnistui.</div>`;
    }
};

// --- APUFUNKTIOT ---

function getMunicipalityName(feature) {
    let name = feature.properties.Name || feature.properties.name || feature.properties.NAMEFIN || feature.properties.nimi || "Tuntematon";
    if (MUNICIPALITY_MAPPING[name]) {
        return MUNICIPALITY_MAPPING[name]; 
    }
    return name;
}

function findRegionForMunicipality(kuntaName) {
    for (const [maakunta, kunnat] of Object.entries(maakuntienKunnat)) {
        if (kunnat.includes(kuntaName)) return maakunta;
    }
    return null;
}

function getPGCLink(pgcUser, kuntaName, region) {
    let country = "Finland";
    let pgcRegion = region;
    let pgcCounty = kuntaName;

    if (region === "Ahvenanmaa") {
        country = "Åland Islands";
        pgcRegion = ALAND_REGIONS[kuntaName] || "Ålands landsbygd"; 
        if (kuntaName === "Maarianhamina") {
            pgcRegion = "Mariehamn";
            pgcCounty = "Mariehamn";
        }
    }
    
    return `https://project-gc.com/Tools/MapCompare?player_prc_profileName=${encodeURIComponent(pgcUser)}&geocache_mc_show%5B%5D=found-none&geocache_crc_country=${encodeURIComponent(country)}&geocache_crc_region=${encodeURIComponent(pgcRegion)}&geocache_crc_county=${encodeURIComponent(pgcCounty)}&submit=Filter`;
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

    let color = '#f38ba8'; // Punainen
    let fillOpacity = 0.5;

    if (s.total > 0) {
        if (missingCount === 2) { color = '#fab387'; fillOpacity = 0.6; } // Oranssi
        else if (missingCount === 1) { color = '#f9e2af'; fillOpacity = 0.6; } // Keltainen
        else if (missingCount === 0) { color = '#a6e3a1'; fillOpacity = 0.4; } // Vihreä
    } else {
        color = '#313244'; // Ei löytöjä
        fillOpacity = 0.4;
    }

    return { fillColor: color, weight: 1, opacity: 1, color: 'rgba(255,255,255,0.1)', fillOpacity: fillOpacity };
}

function onEachFeature(feature, layer, statsData, pgcUser) {
    const originalName = feature.properties.Name || feature.properties.name || feature.properties.NAMEFIN || feature.properties.nimi;
    const name = getMunicipalityName(feature);
    const s = getStatsForMunicipality(name, statsData);
    const region = findRegionForMunicipality(name);

    let title = name;
    if (originalName && originalName !== name) {
        title = `${name} <span style="font-size:0.8em; opacity:0.7;">(${originalName})</span>`;
    }

    // --- KORJATTU POPUP-SISÄLTÖ (PAREMPI KONTRASTI) ---
    let popupContent = `<div style="text-align:center; min-width:200px;">
        <strong style="font-size:1.1em; color:#333;">${title}</strong>
        <div style="font-size:0.8em; opacity:0.7; color:#555;">${region || ''}</div>
        <hr style="margin:5px 0; border-top:1px solid #555;">`;
    
    if (s.t > 0 && s.m > 0 && s.q > 0) {
        popupContent += `<div style="color:#2e7d32; font-weight:bold; margin:5px 0;">Tripletti VALMIS! 🏆</div>`;
    } else {
        popupContent += `<div style="margin:5px 0; font-weight:bold; color:#333;">Puuttuu:</div>
                         <div style="display:flex; justify-content:center; gap:5px; flex-wrap:wrap;">`;
        
        // Tummempi teksti, selkeä tausta ja reunus
        if (s.t === 0) popupContent += `<span style="background:#d1e7dd; color:#0f5132; padding:4px 8px; border-radius:4px; font-weight:bold; border:1px solid #0f5132;">Tradi</span>`;
        if (s.m === 0) popupContent += `<span style="background:#cfe2ff; color:#084298; padding:4px 8px; border-radius:4px; font-weight:bold; border:1px solid #084298;">Multi</span>`;
        if (s.q === 0) popupContent += `<span style="background:#fff3cd; color:#856404; padding:4px 8px; border-radius:4px; font-weight:bold; border:1px solid #856404;">Mysse</span>`;
        
        popupContent += `</div>`;
        
        if (s.total === 0) popupContent += `<div style="margin-top:10px; color:#842029; background:#f8d7da; padding:5px; border-radius:4px; font-weight:bold; text-align:center; border:1px solid #f5c6cb;">Ei löytöjä lainkaan</div>`;
    }
    
    popupContent += `<div style="margin-top:5px; font-size:0.9em; color:#333;">Löydöt: T=${s.t}, M=${s.m}, ?=${s.q}</div>`;

    // UUSI: PGC Linkki
    if (region) {
        const pgcLink = getPGCLink(pgcUser, name, region);
        popupContent += `<a href="${pgcLink}" target="_blank" class="btn" style="display:block; font-size:0.8em; padding:5px; margin-top:10px; text-decoration:none; background-color:#585b70; color:white;">Avaa PGC Kartta ↗</a>`;
    }

    popupContent += `</div>`;

    layer.bindPopup(popupContent);
    
    layer.on({
        mouseover: (e) => { e.target.setStyle({ weight: 3, color: '#fff' }); e.target.bringToFront(); },
        mouseout: (e) => { layer.resetStyle(e.target); layer.setStyle({ weight: 1, color: 'rgba(255,255,255,0.1)' }); }
    });
}
