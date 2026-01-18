import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { maakuntienKunnat } from "./data.js"; 

// Käytetään samoja varmoja karttalähteitä
const GEOJSON_URLS = [
    'https://raw.githubusercontent.com/samilaine/hallinnollisetrajat/master/kuntarajat.json',
    'https://raw.githubusercontent.com/TeemuKoivisto/map-of-finland/master/kuntarajat-2018-raw.json',
    './kunnat.json'
];

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
        <div class="card" style="height: 90vh; display: flex; flex-direction: column; padding: 0; overflow: hidden; position: relative;">
            <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); border-bottom: 1px solid var(--border-color); z-index: 1001;">
                <h2 style="margin:0; font-size: 1.2em;">Löytökartta</h2>
                <div style="display:flex; gap:10px;">
                    <button id="locateBtn" class="btn" style="margin:0; padding: 5px 10px; font-size:1.2em;" title="Paikanna minut">📍</button>
                    <button class="btn" onclick="app.router('stats_all')" style="margin:0; padding: 5px 10px;">⬅ Takaisin</button>
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

    // 2. Alustetaan kartta
    const map = L.map('map', { preferCanvas: true, zoomControl: false }).setView([65.0, 26.0], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM & CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 3. Paikannus
    const userMarker = L.layerGroup().addTo(map);
    function locateUser() { map.locate({ setView: true, maxZoom: 9, timeout: 10000 }); }
    
    map.on('locationfound', (e) => {
        userMarker.clearLayers();
        L.circle(e.latlng, e.accuracy/2, { color: '#89b4fa', fillOpacity: 0.1 }).addTo(userMarker);
        L.circleMarker(e.latlng, { radius: 8, color: '#fff', fillColor: '#0077cc', fillOpacity: 1 }).addTo(userMarker).bindPopup("Olet tässä").openPopup();
    });
    locateUser();
    document.getElementById('locateBtn').onclick = locateUser;

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
    return feature.properties.Name || feature.properties.name || feature.properties.NAMEFIN || feature.properties.nimi || "Tuntematon";
}

// Etsii mihin maakuntaan kunta kuuluu (PGC-linkkiä varten)
function findRegionForMunicipality(kuntaName) {
    for (const [maakunta, kunnat] of Object.entries(maakuntienKunnat)) {
        if (kunnat.includes(kuntaName)) return maakunta;
    }
    return "Finland"; // Fallback
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
    const name = getMunicipalityName(feature);
    const data = statsData[name.trim()];
    const s = data && data.s ? data.s : [];
    const total = s.reduce((a,b)=>a+b, 0);
    const region = findRegionForMunicipality(name);

    let popupContent = `<div style="text-align:center; min-width:200px;">
        <strong style="font-size:1.1em;">${name}</strong>
        <div style="font-size:0.8em; opacity:0.7;">${region}</div>
        <hr style="margin:5px 0; border-top:1px solid #555;">`;

    if (total > 0) {
        popupContent += `<div style="text-align:left; margin-bottom:10px;">`;
        let foundList = "";
        let missingList = "";

        CACHE_TYPES.forEach(t => {
            const count = s[t.index] || 0;
            if (count > 0) {
                foundList += `<div><img src="${t.icon}" style="width:14px; vertical-align:middle;"> <b>${t.name}:</b> ${count}</div>`;
            } else {
                missingList += `<span style="opacity:0.6; font-size:0.9em; margin-right:5px;">${t.name}</span>`;
            }
        });

        popupContent += `<div style="margin-bottom:5px;"><strong>Löydetyt (${total}):</strong></div>${foundList}`;
        
        if (missingList) {
            popupContent += `<div style="margin-top:8px; border-top:1px dotted #555; padding-top:5px;"><strong>Puuttuu:</strong><br>${missingList}</div>`;
        }
        popupContent += `</div>`;
    } else {
        popupContent += `<div style="color:#f38ba8; font-weight:bold; margin:10px 0;">Ei löytöjä</div>`;
    }

    // PGC Linkki
    const pgcLink = `https://project-gc.com/Tools/MapCompare?player_prc_profileName=${encodeURIComponent(pgcUser)}&geocache_mc_show%5B%5D=found-none&geocache_crc_country=Finland&geocache_crc_region=${encodeURIComponent(region)}&geocache_crc_county=${encodeURIComponent(name)}&submit=Filter`;
    
    popupContent += `<a href="${pgcLink}" target="_blank" class="btn" style="display:block; font-size:0.8em; padding:5px; margin-top:5px; text-decoration:none;">Avaa PGC Kartta ↗</a>`;
    popupContent += `</div>`;

    layer.bindPopup(popupContent);

    layer.on({
        mouseover: (e) => { e.target.setStyle({ weight: 3, color: '#fff' }); e.target.bringToFront(); },
        mouseout: (e) => { layer.resetStyle(e.target); layer.setStyle({ weight: 1, color: 'rgba(255,255,255,0.15)' }); }
    });
}
