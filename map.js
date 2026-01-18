import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// KORJATTU URL: Käytetään vakaampaa lähdettä Suomen kunnille
const GEOJSON_URL = 'https://raw.githubusercontent.com/Mmmmon/Suomi-geojson/master/suomi.json';

export const renderTripletMap = async (content, db, user, app) => {
    if (!user) { app.router('login_view'); return; }

    content.innerHTML = `
        <div class="card" style="height: 90vh; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
            <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); border-bottom: 1px solid var(--border-color); z-index: 1001;">
                <h2 style="margin:0; font-size: 1.2em;">Triplettikartta</h2>
                <button class="btn" onclick="app.router('stats_triplet')" style="margin:0; padding: 5px 10px;">⬅ Takaisin</button>
            </div>
            
            <div id="map" style="flex: 1; width: 100%; background: #aad3df;"></div>
            
            <div style="padding: 10px; background: var(--card-bg); font-size: 0.8em; text-align: center; border-top: 1px solid var(--border-color);">
                <span style="color:#a6e3a1;">■ Valmis</span> &nbsp;
                <span style="color:#f9e2af;">■ Puuttuu 1</span> &nbsp;
                <span style="color:#fab387;">■ Puuttuu 2</span> &nbsp;
                <span style="color:#f38ba8;">■ Puuttuu 3/Ei löytöjä</span>
            </div>
        </div>
    `;

    // 1. Haetaan käyttäjän tilastot
    let statsData = {};
    try {
        const docSnap = await getDoc(doc(db, "stats", user.uid));
        if (docSnap.exists()) {
            statsData = docSnap.data().municipalities || {};
        }
    } catch (e) {
        console.error("Virhe tilastojen haussa:", e);
        alert("Tilastojen lataus epäonnistui.");
        return;
    }

    // 2. Alustetaan kartta
    const map = L.map('map').setView([65.0, 26.0], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 3. Haetaan kuntarajat ja piirretään ne
    try {
        const response = await fetch(GEOJSON_URL);
        
        // Tarkistetaan onko vastaus onnistunut (status 200)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const geoData = await response.json();

        L.geoJSON(geoData, {
            style: (feature) => getStyle(feature, statsData),
            onEachFeature: (feature, layer) => onEachFeature(feature, layer, statsData)
        }).addTo(map);

    } catch (e) {
        console.error("Karttadatan haku epäonnistui:", e);
        document.getElementById('map').innerHTML = `<div style="padding:20px; color:black; background:white;">Karttadatan lataus epäonnistui: ${e.message}.<br>Yritä myöhemmin uudelleen.</div>`;
    }
};

// --- APUFUNKTIOT ---

// Apufunktio nimen hakemiseen eri GeoJSON-formaateista
function getMunicipalityName(feature) {
    if (feature.properties.Name) return feature.properties.Name;
    if (feature.properties.name) return feature.properties.name;
    if (feature.properties.NAMEFIN) return feature.properties.NAMEFIN; // Yleinen suomalaisessa datassa
    return "Tuntematon";
}

function getStatsForMunicipality(name, statsData) {
    // Yritetään löytää kunta. 
    // Trimmataan välilyönnit varmuuden vuoksi
    const cleanName = name.trim();
    const data = statsData[cleanName];
    
    if (!data || !data.s) return { t: 0, m: 0, q: 0, total: 0 };
    
    return {
        t: data.s[0] || 0, // Tradi
        m: data.s[1] || 0, // Multi
        q: data.s[3] || 0, // Mysteeri
        total: data.s.reduce((a,b) => a+b, 0)
    };
}

function getStyle(feature, statsData) {
    const name = getMunicipalityName(feature);
    const s = getStatsForMunicipality(name, statsData);
    
    // Lasketaan montako puuttuu (Tradi, Multi, Mysteeri)
    let missingCount = 0;
    if (s.t === 0) missingCount++;
    if (s.m === 0) missingCount++;
    if (s.q === 0) missingCount++;

    let color = '#f38ba8'; // Oletus: Punainen (Kaikki puuttuu / ei löytöjä)
    let fillOpacity = 0.6;

    if (missingCount === 0 && s.t > 0) {
        color = '#a6e3a1'; // Vihreä: Valmis!
        fillOpacity = 0.5;
    } else if (missingCount === 1) {
        color = '#f9e2af'; // Keltainen: 1 puuttuu
        fillOpacity = 0.7;
    } else if (missingCount === 2) {
        color = '#fab387'; // Oranssi: 2 puuttuu
        fillOpacity = 0.7;
    }

    // Jos ei ole yhtään löytöä koko kunnasta, pidetään tummana
    if (s.total === 0) {
        color = '#313244'; 
        fillOpacity = 0.4;
    }

    return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: 'rgba(255,255,255,0.2)', // Rajaviiva
        fillOpacity: fillOpacity
    };
}

function onEachFeature(feature, layer, statsData) {
    const name = getMunicipalityName(feature);
    const s = getStatsForMunicipality(name, statsData);

    let popupContent = `<strong>${name}</strong><br>`;
    
    if (s.t > 0 && s.m > 0 && s.q > 0) {
        popupContent += `<span style="color:#2e7d32; font-weight:bold;">Tripletti VALMIS! 🏆</span>`;
    } else {
        popupContent += `Puuttuu:<br>`;
        if (s.t === 0) popupContent += `❌ Tradi<br>`;
        if (s.m === 0) popupContent += `❌ Multi<br>`;
        if (s.q === 0) popupContent += `❌ Mysteeri<br>`;
        
        if (s.total === 0) popupContent = `<strong>${name}</strong><br>Ei löytöjä lainkaan.`;
    }

    // Lisätään nykyiset määrät infoon
    popupContent += `<hr style="margin:5px 0; border:0; border-top:1px solid #ccc;">`;
    popupContent += `Löydöt: T=${s.t}, M=${s.m}, ?=${s.q}`;

    layer.bindPopup(popupContent);
    
    layer.on({
        mouseover: (e) => {
            const l = e.target;
            l.setStyle({ weight: 3, color: '#fff' });
            l.bringToFront();
        },
        mouseout: (e) => {
            layer.resetStyle(e.target); 
            layer.setStyle({ weight: 1, color: 'rgba(255,255,255,0.2)' });
        }
    });
}
