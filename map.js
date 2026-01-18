import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// PÄIVITETTY LISTA KARTTALÄHTEISTÄ (2026)
// Koodi kokeilee näitä järjestyksessä.
const GEOJSON_URLS = [
    // Lähde 1: Sami Laine / Hallinnolliset rajat (Tuorein ja luotettavin)
    'https://raw.githubusercontent.com/samilaine/hallinnollisetrajat/master/kuntarajat.json',
    // Lähde 2: Teemu Koivisto (Hieman vanhempi, mutta vakaa)
    'https://raw.githubusercontent.com/TeemuKoivisto/map-of-finland/master/kuntarajat-2018-raw.json',
    // Lähde 3: Varmais (Vanha, varalla)
    'https://raw.githubusercontent.com/varmais/maakunnat/master/suomi.geojson',
    // Lähde 4: Paikallinen tiedosto (Jos lataat tiedoston itse projektikansioon)
    './kunnat.json'
];

export const renderTripletMap = async (content, db, user, app) => {
    if (!user) { app.router('login_view'); return; }

    content.innerHTML = `
        <div class="card" style="height: 90vh; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
            <div style="padding: 10px; display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); border-bottom: 1px solid var(--border-color); z-index: 1001;">
                <h2 style="margin:0; font-size: 1.2em;">Triplettikartta</h2>
                <button class="btn" onclick="app.router('stats_triplet')" style="margin:0; padding: 5px 10px;">⬅ Takaisin</button>
            </div>
            
            <div id="map" style="flex: 1; width: 100%; background: #aad3df;">
                <div id="mapLoading" style="padding:20px; color:black; background:white; opacity:0.8; text-align:center; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000; border-radius:8px;">
                    Ladataan karttaa...<br><span style="font-size:0.8em;">(Tämä voi kestää hetken)</span>
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

    // 1. Haetaan käyttäjän tilastot
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
    const map = L.map('map').setView([65.0, 26.0], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 3. Haetaan kuntarajat (Loopataan lähteet läpi)
    let geoData = null;

    for (const url of GEOJSON_URLS) {
        try {
            console.log(`Yritetään ladata: ${url}`);
            const response = await fetch(url);
            if (response.ok) {
                geoData = await response.json();
                console.log(`Kartta ladattu onnistuneesti: ${url}`);
                break; // Lopetetaan, kun toimiva löytyi
            } else {
                console.warn(`Lataus epäonnistui (${response.status}): ${url}`);
            }
        } catch (e) {
            console.warn(`Verkkovirhe lähteessä ${url}:`, e);
        }
    }

    // Poistetaan latausilmoitus
    const loadingEl = document.getElementById('mapLoading');
    if (loadingEl) loadingEl.remove();

    if (geoData) {
        L.geoJSON(geoData, {
            style: (feature) => getStyle(feature, statsData),
            onEachFeature: (feature, layer) => onEachFeature(feature, layer, statsData)
        }).addTo(map);
    } else {
        document.getElementById('map').innerHTML = `
            <div style="padding:20px; color:black; background:white; text-align:center; height:100%; display:flex; flex-direction:column; justify-content:center;">
                <h3 style="color:#cc0000;">Kartan lataus epäonnistui</h3>
                <p>Yhteyttä karttapalvelimiin ei saatu.</p>
                <p style="font-size:0.9em;">Vinkki: Lataa 'kunnat.json' GitHubista ja tallenna se projektikansioon.</p>
                <button class="btn" onclick="app.router('stats_map')">Yritä uudelleen</button>
            </div>`;
    }
};

// --- APUFUNKTIOT ---

function getMunicipalityName(feature) {
    // Eri lähteissä nimi on eri kentässä
    return feature.properties.Name || feature.properties.name || feature.properties.NAMEFIN || feature.properties.nimi || "Tuntematon";
}

function getStatsForMunicipality(name, statsData) {
    if (!name) return { t: 0, m: 0, q: 0, total: 0 };
    const cleanName = name.trim();
    // Yritetään löytää kunta suoraan tai ilman "City of" -etuliitteitä jos datassa on eroja
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
    
    let missingCount = 0;
    if (s.t === 0) missingCount++;
    if (s.m === 0) missingCount++;
    if (s.q === 0) missingCount++;

    let color = '#f38ba8'; // Punainen (ei löytöjä / kaikki puuttuu)
    let fillOpacity = 0.6;

    if (missingCount === 0 && s.t > 0) {
        color = '#a6e3a1'; // Vihreä (Valmis)
        fillOpacity = 0.5;
    } else if (missingCount === 1) {
        color = '#f9e2af'; // Keltainen (1 puuttuu)
        fillOpacity = 0.7;
    } else if (missingCount === 2) {
        color = '#fab387'; // Oranssi (2 puuttuu)
        fillOpacity = 0.7;
    }

    if (s.total === 0) {
        color = '#313244'; // Tumma (Ei mitään löytöjä)
        fillOpacity = 0.4;
    }

    return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: 'rgba(255,255,255,0.2)', 
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
