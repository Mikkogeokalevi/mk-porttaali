import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { maakuntienKunnat } from "./data.js";

/* KONFIGURAATIO */
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

// --- PÄÄVALIKKO ---
export const renderStatsDashboard = (content, app) => {
    content.innerHTML = `
    <div class="card">
        <h1>Tilastot</h1>
        <p>Valitse tarkasteltava tilasto:</p>
        <div class="stats-dashboard-grid">
            <button class="btn" style="background-color: #a6e3a1; color:#1e1e2e; font-weight:bold; height:100px;" onclick="app.router('stats_triplet')">
                <span style="font-size:2em;">🏆</span><br>Triplettitarkistus
            </button>
            <button class="btn" style="background-color: #89b4fa; color:#1e1e2e; font-weight:bold; height:100px;" onclick="app.router('stats_all')">
                <span style="font-size:2em;">🗺️</span><br>Maakunnat & Löydöt
            </button>
            <button class="btn" style="background-color: #f9e2af; color:#1e1e2e; font-weight:bold; height:100px;" onclick="app.router('stats_top')">
                <span style="font-size:2em;">📊</span><br>Top-listat
            </button>
            <button class="btn" style="background-color: #fab387; color:#1e1e2e; font-weight:bold; height:100px;" onclick="app.router('stats_external')">
                <span style="font-size:2em;">📈</span><br>Kuvatilastot (Geocache.fi)
            </button>
        </div>
    </div>`;
};

// --- APUFUNKTIOT ---
async function fetchFullDoc(db, uid) {
    const s = await getDoc(doc(db, "stats", uid));
    return s.exists() ? s.data() : null;
}

function formatUpdateDate(timestamp) {
    if (!timestamp) return 'Ei tietoa';
    const d = timestamp.toDate();
    return d.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- 1. TOP-LISTAT ---
export const loadTopStats = async (db, user, content) => {
    if (!user) return;
    content.innerHTML = `<div class="card"><h1>Top-listat</h1><p>Ladataan...</p></div>`;

    try {
        const docData = await fetchFullDoc(db, user.uid);
        if (!docData || !docData.municipalities) { content.innerHTML = `<div class="card"><p>Ei dataa.</p></div>`; return; }
        
        const fullData = docData.municipalities;
        const updateTime = formatUpdateDate(docData.updatedAt);

        let typeOptions = '';
        CACHE_TYPES.forEach(t => { typeOptions += `<option value="${t.index}">${t.name}</option>`; });

        content.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <h2 style="margin:0;">Ranking</h2>
                <button class="btn" onclick="app.router('stats')" style="margin:0; padding:5px 10px;">⬅ Takaisin</button>
            </div>
            <p style="font-size:0.85em; color:var(--success-color); margin-bottom:15px;">📅 Data päivitetty: <b>${updateTime}</b></p>
            <label>Järjestä:</label>
            <select id="sortCriteria">
                <option value="total">Löydöt yhteensä</option>
                <option value="variety">Kätkötyyppien määrä</option>
                <optgroup label="Tietty kätkötyyppi">${typeOptions}</optgroup>
            </select>
            <div style="display:flex; gap:10px;">
                <div style="flex:1;"><label>Suunta:</label><select id="sortOrder"><option value="desc">Eniten ensin</option><option value="asc">Vähiten ensin</option></select></div>
                <div style="flex:1;"><label>Näytä:</label><select id="limitCount"><option value="10">Top 10</option><option value="50">Top 50</option><option value="1000">Kaikki</option></select></div>
            </div>
            <div id="topListResult"></div>
        </div>`;

        const updateList = () => {
            const criteria = document.getElementById('sortCriteria').value;
            const order = document.getElementById('sortOrder').value;
            const limit = parseInt(document.getElementById('limitCount').value);
            const container = document.getElementById('topListResult');

            let list = Object.keys(fullData).map(kunta => {
                const s = fullData[kunta].s || [];
                let total = 0;
                CACHE_TYPES.forEach(t => total += (s[t.index] || 0));
                const variety = CACHE_TYPES.filter(t => (s[t.index] || 0) > 0).length;
                let specificVal = 0;
                if (!isNaN(criteria)) specificVal = s[parseInt(criteria)] || 0;
                return { name: kunta, total, variety, specificVal, stats: s };
            });

            list.sort((a, b) => {
                let valA, valB;
                if (criteria === 'total') { valA = a.total; valB = b.total; }
                else if (criteria === 'variety') { valA = a.variety; valB = b.variety; }
                else { valA = a.specificVal; valB = b.specificVal; }
                if (valA === valB) return a.name.localeCompare(b.name);
                return order === 'desc' ? valB - valA : valA - valB;
            });

            const slicedList = list.slice(0, limit);
            let html = '<ol style="padding-left:20px; margin-top:10px;">';
            slicedList.forEach(item => {
                let detailText = "";
                if (criteria === 'total') detailText = `<b>${item.total}</b> löytöä`;
                else if (criteria === 'variety') detailText = `<b>${item.variety}</b> eri tyyppiä`;
                else {
                    const typeName = CACHE_TYPES.find(t => t.index == criteria)?.name || 'Löytöä';
                    detailText = `<b>${item.specificVal}</b> ${typeName}`;
                }
                if (item.total === 0) detailText = `<span style="color:var(--subtext-color)">Ei löytöjä</span>`;
                html += `<li style="margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px;"><div style="display:flex; justify-content:space-between;"><span style="font-size:1.1em;">${item.name}</span><span style="color:var(--accent-color);">${detailText}</span></div></li>`;
            });
            html += '</ol>';
            if (slicedList.length === 0) html = '<p>Ei tuloksia.</p>';
            container.innerHTML = html;
        };
        ['sortCriteria', 'sortOrder', 'limitCount'].forEach(id => document.getElementById(id).addEventListener('change', updateList));
        updateList();
    } catch (e) { console.error(e); content.innerHTML = `<div class="card"><h1>Virhe</h1><p>${e.message}</p></div>`; }
};

// --- 2. MAAKUNNAT & LÖYDÖT ---
export const loadAllStats = async (db, user, content) => {
    if (!user) return;
    content.innerHTML = `<div class="card"><h1>Maakunnat & Löydöt</h1><p>Ladataan...</p></div>`;
    
    try {
        const docData = await fetchFullDoc(db, user.uid);
        if (!docData || !docData.municipalities) { content.innerHTML = `<div class="card"><p>Ei dataa. Käytä Admin-työkalua.</p></div>`; return; }
        
        const fullData = docData.municipalities;
        const updateTime = formatUpdateDate(docData.updatedAt);
        const pgcUser = window.app.savedNickname || user.displayName || 'user';

        content.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <h2 style="margin:0;">Löydöt maakunnittain</h2>
                <button class="btn" onclick="app.router('stats')" style="margin:0; padding:5px 10px;">⬅ Takaisin</button>
            </div>
            <p style="font-size:0.85em; color:var(--success-color); margin-bottom:15px;">📅 Data päivitetty: <b>${updateTime}</b></p>
            <input type="text" id="regionSearch" placeholder="Hae kuntaa (esim. Lahti)..." style="margin-bottom:15px;">
            <div id="regionList"></div>
        </div>`;

        const renderRegions = (filter = "") => {
            const container = document.getElementById('regionList');
            container.innerHTML = "";
            const term = filter.toLowerCase();
            let totalRegionsShown = 0;

            Object.keys(maakuntienKunnat).sort().forEach(maakunta => {
                const kunnatMaakunnassa = maakuntienKunnat[maakunta];
                const matchingMunicipalities = kunnatMaakunnassa.filter(kunta => {
                    const hasData = fullData[kunta]; 
                    const matchesSearch = kunta.toLowerCase().includes(term); 
                    return hasData && matchesSearch;
                });

                if (matchingMunicipalities.length === 0) return;
                totalRegionsShown++;

                let municipalitiesHtml = "";
                matchingMunicipalities.forEach(kunta => {
                    const stats = fullData[kunta].s || [];
                    let foundList = "", notFoundList = "";
                    CACHE_TYPES.forEach(type => {
                        const count = stats[type.index] || 0;
                        const li = `<li><img src="${type.icon}" alt="${type.name}"> <span>${type.name}: ${count}</span></li>`;
                        if (count > 0) foundList += li; else notFoundList += li;
                    });
                    const pgcLink = `https://project-gc.com/Tools/MapCompare?player_prc_profileName=${encodeURIComponent(pgcUser)}&geocache_mc_show%5B%5D=found-none&geocache_crc_country=Finland&geocache_crc_region=${encodeURIComponent(maakunta)}&geocache_crc_county=${encodeURIComponent(kunta)}&submit=Filter`;
                    const gcfiLink = `https://www.geocache.fi/stat/other/jakauma.php?kuntalista=${kunta}`;

                    municipalitiesHtml += `<div class="municipality-box"><h3><span><a href="${gcfiLink}" target="_blank">${kunta}</a> <a href="${pgcLink}" target="_blank" style="font-size:0.7em; opacity:0.6; text-decoration:none;">(Pgc)</a></span></h3><h4>Löydetyt:</h4><ul class="cache-list">${foundList || '<li style="opacity:0.5">-</li>'}</ul>${notFoundList ? `<h4>Ei löytöjä:</h4><ul class="cache-list" style="opacity:0.7;">${notFoundList}</ul>` : ''}</div>`;
                });
                const isOpen = term.length > 0 ? "open" : "";
                container.innerHTML += `<details ${isOpen} class="region-accordion"><summary><span style="font-size:1.1em;">${maakunta}</span><span style="float:right; font-weight:normal; opacity:0.7; font-size:0.9em;">${matchingMunicipalities.length} kuntaa</span></summary><div class="region-content">${municipalitiesHtml}</div></details>`;
            });
            if (totalRegionsShown === 0) container.innerHTML = `<p style="text-align:center; margin-top:20px; opacity:0.6;">Ei osumia haulla "${filter}".</p>`;
        };
        renderRegions();
        document.getElementById('regionSearch').addEventListener('input', (e) => renderRegions(e.target.value));
    } catch (e) { console.error(e); content.innerHTML = `<div class="card"><h1>Virhe</h1><p>${e.message}</p></div>`; }
};

// --- 3. TRIPLETTITARKISTUS ---
export const loadTripletData = async (db, user, content) => {
    if (!user) return;
    content.innerHTML = `<div class="card"><h1>Triplettitarkistus</h1><p>Ladataan...</p></div>`;
    try {
        const docData = await fetchFullDoc(db, user.uid);
        if (!docData || !docData.municipalities) { content.innerHTML += `<p>Ei dataa.</p>`; return; }
        const fullData = docData.municipalities;
        const updateTime = formatUpdateDate(docData.updatedAt);

        content.innerHTML = `<div class="card"><div style="display:flex; justify-content:space-between; margin-bottom:5px;"><h1 style="margin:0;">Triplettitarkistus</h1><button class="btn" onclick="app.router('stats')" style="margin:0;">⬅ Takaisin</button></div><p style="font-size:0.85em; color:var(--success-color); margin-bottom:15px;">📅 Data päivitetty: <b>${updateTime}</b></p><input type="text" id="tripletSearch" placeholder="Hae kuntaa..."><div id="tripletStatsSummary" style="display:flex; gap:10px; margin:15px 0;"></div><div id="tripletResults"></div></div>`;
        initTripletLogic(fullData);
    } catch (e) { content.innerHTML = `<div class="card"><h1 style="color:var(--error-color)">Virhe</h1><p>${e.message}</p></div>`; }
};

function initTripletLogic(fullData) {
    const renderLists = (filterText) => {
        const filter = filterText.toLowerCase();
        const cats = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[] };
        const titles = { 1:"1. Ei löytöjä (0/0/0)", 2:"2. Vain Tradi", 3:"3. Vain Multi", 4:"4. Vain Mysteeri", 5:"5. Tradi + Multi", 6:"6. Multi + Mysteeri", 7:"7. Tradi + Mysteeri", 8:"8. Triplettikunnat (T+M+?)" };

        Object.keys(fullData).sort().forEach(kunta => {
            if (!kunta.toLowerCase().includes(filter)) return;
            const s = fullData[kunta].s || [];
            const t = s[0]||0, m = s[1]||0, q = s[3]||0; 
            const item = `<li><b>${kunta}</b>: T=${t}, M=${m}, ?=${q}</li>`;
            if(!t && !m && !q) cats[1].push(item); else if(t && !m && !q) cats[2].push(item); else if(!t && m && !q) cats[3].push(item); else if(!t && !m && q) cats[4].push(item); else if(t && m && !q) cats[5].push(item); else if(!t && m && q) cats[6].push(item); else if(t && !m && q) cats[7].push(item); else if(t && m && q) cats[8].push(item);
        });

        const sumDiv = document.getElementById('tripletStatsSummary');
        if(sumDiv) sumDiv.innerHTML = `<div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;"><div style="font-size:2em; color:var(--success-color);">${cats[8].length}</div><div style="font-size:0.8em;">Triplettiä</div></div><div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;"><div style="font-size:2em; color:var(--error-color);">${cats[1].length}</div><div style="font-size:0.8em;">Ei löytöjä</div></div>`;

        let html = '';
        for(let i=1; i<=8; i++) {
            const count = cats[i].length;
            const isOpen = (filter.length>0 && count>0) || (!filter && (i===8 || i===1)) ? 'open' : '';
            const st = (i===8) ? 'border-color:var(--success-color);' : '';
            const disp = (filter.length>0 && count===0) ? 'display:none;' : '';
            html += `<details ${isOpen} style="${st} ${disp}"><summary>${titles[i]} <span style="float:right; opacity:0.7;">(${count})</span></summary><div style="padding:10px; border-top:1px solid var(--border-color);"><ul style="margin:0; padding-left:20px;">${count>0?cats[i].join(''):'<li style="opacity:0.5;">Ei kuntia.</li>'}</ul></div></details>`;
        }
        document.getElementById('tripletResults').innerHTML = html || '<p>Ei tuloksia.</p>';
    };
    renderLists('');
    document.getElementById('tripletSearch').addEventListener('input', (e) => renderLists(e.target.value));
}

// --- 4. UUSI: EXTERNAL STATS (Kuvatilastot) ---
export const loadExternalStats = async (content) => {
    // 1. TÄRKEÄÄ: Pakotetaan kaverilistan lataus, jotta ID:t ovat käytettävissä
    // Vaikka käyttäjä tulisi suoraan tälle sivulle.
    if (window.app.loadFriends) {
        await window.app.loadFriends(); 
    }

    // Haetaan oletuskäyttäjä
    let defaultUser = 'mikkokalevi';
    if (window.app.currentUser) {
        if (window.app.savedNickname) defaultUser = window.app.savedNickname;
        else if (window.app.currentUser.email === 'toni@kauppinen.info') defaultUser = 'mikkokalevi';
        else if (window.app.currentUser.displayName) defaultUser = window.app.currentUser.displayName;
    }

    content.innerHTML = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>Kuvatilastot</h1>
            <button class="btn" onclick="app.router('stats')" style="margin:0;">⬅ Takaisin</button>
        </div>
        <div class="input-group" style="margin-top:15px;">
            <label style="flex:1;">Käyttäjä:</label>
            <input type="text" id="statUser" list="statsFriendOptions" value="${defaultUser}" style="flex:3;">
            <button class="btn btn-primary" id="refreshStats" style="flex:1; margin:8px 0 16px;">Päivitä</button>
        </div>
        <div style="font-size: 0.85em; color: var(--subtext-color); margin-bottom: 15px; text-align: right;">
            Geocache.fi ID: <span id="activeIdDisplay" style="color: var(--accent-color); font-weight: bold;">-</span>
        </div>
        <datalist id="statsFriendOptions"></datalist>
    </div>
    
    <div id="statsContainer">Ladataan kuvia...</div>
    `;

    // Täytetään lista (Nyt kun loadFriends on ajettu, tämän pitäisi toimia)
    const datalist = document.getElementById('statsFriendOptions');
    if (window.app.friendsList) {
        window.app.friendsList.sort((a,b) => a.name.localeCompare(b.name)).forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.name;
            datalist.appendChild(opt);
        });
    }

    // Funktio, joka renderöi kuvat
    const renderImages = (user) => {
        const container = document.getElementById('statsContainer');
        const currentYear = new Date().getFullYear();
        
        // Etsitään käyttäjän ID automaattisesti yhteisestä listasta
        let userId = null;
        if (window.app.savedNickname?.toLowerCase() === user.toLowerCase()) {
            userId = window.app.savedId;
        } else {
            const f = window.app.friendsList?.find(f => f.name.toLowerCase() === user.toLowerCase());
            if (f) userId = f.id;
        }

        // PÄIVITETÄÄN ID NÄKYVIIN
        const idDisplay = document.getElementById('activeIdDisplay');
        if (idDisplay) {
            idDisplay.textContent = userId ? userId : "(Ei tiedossa - linkit eivät toimi)";
            idDisplay.style.color = userId ? "var(--success-color)" : "var(--subtext-color)";
        }

        const img = (url, id = "") => `<img ${id ? `id="${id}"` : ""} src="${url}" loading="lazy" style="max-width:100%; height:auto; border-radius:8px; margin-bottom:10px; display:block;">`;
        
        const mapLink = (typeId, text) => {
            if (!userId) return `<span style="font-size:0.8em; opacity:0.5;">(Linkki vaatii ID:n)</span>`;
            let url = `https://www.geocache.fi/stat/kunta/?userid=${userId}&names=1`;
            if (typeId) url += `&cachetype=${typeId}`;
            return `<a href="${url}" target="_blank" class="btn" style="padding:5px 10px; font-size:0.9em; margin-bottom:10px;">${text} ↗</a>`;
        };

        const matrixTypes = [
            { id: '', name: 'Kaikki' },
            { id: '1', name: 'Tradi' },
            { id: '2', name: 'Multi' },
            { id: '3', name: 'Mysteeri' },
            { id: '4', name: 'Letterbox' },
            { id: '5', name: 'Event' },
            { id: '6', name: 'Earthcache' },
            { id: '7', name: 'Virtual' },
            { id: '8', name: 'Webcam' },
            { id: '9', name: 'Wherigo' },
            { id: '10', name: 'Comm. Cel.' },
            { id: '11', name: 'Mega' },
            { id: '12', name: 'CITO' },
            { id: '13', name: 'Giga' },
            { id: '14', name: 'Block Party' },
            { id: '20', name: 'LAB' },
            { id: '96', name: 'Muut paitsi Labit' },
            { id: '98', name: 'Muut paitsi Tradit' },
            { id: '99', name: 'Kaikki Eventit' }
        ];

        // 1. Luodaan Vuosi-valikko T/D -taulukoille
        let yearOptions = "";
        for (let y = currentYear; y >= 2000; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        // 2. Rakennetaan HTML
        let tdYearHtml = `
            <div style="margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                <label>Valitse vuosi:</label>
                <select id="tdYearSelector" style="padding:5px; border-radius:4px;">${yearOptions}</select>
            </div>
            <div id="tdYearContainer">
                </div>
        `;

        let tdFullHtml = "";
        matrixTypes.forEach(t => {
            let urlFull = `https://www.geocache.fi/stat/matrix.php?la=&user=${user}`;
            if(t.id) urlFull += `&cachetype=${t.id}`;
            tdFullHtml += `<h4>${t.name}</h4>${img(urlFull)}`;
        });

        let monthsHtml = "";
        const monthNames = ["Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"];
        monthNames.forEach((mName, i) => {
            const mNum = (i + 1).toString().padStart(2, '0');
            monthsHtml += `<h4>${mName}</h4>${img(`https://www.geocache.fi/stat/matrix.php?la=&user=${user}&month=${mNum}`)}`;
        });

        container.innerHTML = `
        <div class="card">
            <details open class="region-accordion"><summary>T/D Vuosittain</summary>
                <div class="region-content">${tdYearHtml}</div>
            </details>

            <details class="region-accordion"><summary>T/D Full</summary>
                <div class="region-content">${tdFullHtml}</div>
            </details>

            <details class="region-accordion"><summary>T/D Kuukaudet</summary>
                <div class="region-content">${monthsHtml}</div>
            </details>

            <details class="region-accordion"><summary>Vuosikalenterit</summary>
                <div class="region-content">
                    <h3>Yleiskalenterit</h3>
                    ${img(`https://www.geocache.fi/stat/year.php?&user=${user}`)}
                    ${img(`https://www.geocache.fi/stat/year.php?&user=${user}&year=${currentYear}`)}
                    
                    <h3>Kätkötyypit</h3>
                    <h4>Tradi</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=1`)}
                    <h4>Multi</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=2`)}
                    <h4>Mysteeri</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=3`)}
                    <h4>Letterbox</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=4`)}
                    <h4>Event</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=5`)}
                    <h4>Earthcache</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=6`)}
                    <h4>Virtual</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=7`)}
                    <h4>Webcam</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=8`)}
                    <h4>Wherigo</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=9`)}
                    <h4>CCE (Comm. Celebration)</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=10`)}
                    <h4>Mega-Event</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=11`)}
                    <h4>CITO</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=12`)}
                    <h4>Giga-Event</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=13`)}
                    <h4>Block Party</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=14`)}
                    <h4>LAB Cache</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=20`)}
                    
                    <h3>Ryhmät</h3>
                    <h4>Muut paitsi Labit</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=96`)}
                    <h4>Muut paitsi Tradit</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=98`)}
                    <h4>Kaikki Eventit</h4>${img(`https://www.geocache.fi/stat/year.php?&user=${user}&cachetype=99`)}
                </div>
            </details>

            <details class="region-accordion"><summary>Kuntakartat</summary>
                <div class="region-content">
                    <h3>Yleiskartta</h3>
                    ${img(`https://www.geocache.fi/stat/kunta.php?la=&slide=1&user=${user}`)}
                    ${mapLink('', 'Avaa interaktiivinen')}
                    
                    <h3>Tradit</h3>
                    ${img(`https://www.geocache.fi/stat/kunta.php?la=&slide=1&user=${user}&cachetype=1`)}
                    ${mapLink('1', 'Avaa interaktiivinen')}

                    <h3>Multit</h3>
                    ${img(`https://www.geocache.fi/stat/kunta.php?la=&slide=1&user=${user}&cachetype=2`)}
                    ${mapLink('2', 'Avaa interaktiivinen')}

                    <h3>Mysteerit</h3>
                    ${img(`https://www.geocache.fi/stat/kunta.php?la=&slide=1&user=${user}&cachetype=3`)}
                    ${mapLink('3', 'Avaa interaktiivinen')}
                </div>
            </details>

            <details class="region-accordion"><summary>Erikoiskartat (Tripletti, FTF...)</summary>
                <div class="region-content">
                    <h3>Tripletti</h3>
                    ${img(`https://www.geocache.fi/stat/kunta.php?la=&user=${user}&slide=0&cachetype=90`)}
                    
                    <h3>FTF Kunnat</h3>
                    ${img(`https://www.geocache.fi/stat/ftfkunta.php?la=&slide=1&user=${user}`)}

                    <h3>Graticule</h3>
                    ${img(`https://www.geocache.fi/stat/grat.php?la=&user=${user}`)}
                </div>
            </details>

            <details class="region-accordion"><summary>Jasmer & Muut</summary>
                <div class="region-content">
                    <h3>Jasmer</h3>
                    ${img(`https://www.geocache.fi/stat/hiddenday.php?la=&type=2&user=${user}`)}
                    <h3>Löydöt (Vuosi/Tyyppi)</h3>
                    ${img(`https://www.geocache.fi/stat/yeartype.php?la=&user=${user}`)}
                    <h3>Päivälöydöt</h3>
                    ${img(`https://www.geocache.fi/stat/day.php?la=&user=${user}`)}
                </div>
            </details>
        </div>`;

        // 3. Logiikka vuositilaston päivittämiseen
        const tdYearSelector = document.getElementById('tdYearSelector');
        const tdYearContainer = document.getElementById('tdYearContainer');

        const updateTdImages = (selectedYear) => {
            let html = "";
            matrixTypes.forEach(t => {
                let urlYear = `https://www.geocache.fi/stat/matrix.php?la=&user=${user}&year=${selectedYear}`;
                if(t.id) urlYear += `&cachetype=${t.id}`;
                html += `<h4>${t.name} (${selectedYear})</h4>${img(urlYear)}`;
            });
            tdYearContainer.innerHTML = html;
        };

        // Alusta nykyisellä vuodella ja lisää kuuntelija
        updateTdImages(currentYear);
        tdYearSelector.addEventListener('change', (e) => updateTdImages(e.target.value));
    };

    document.getElementById('refreshStats').addEventListener('click', () => {
        renderImages(document.getElementById('statUser').value.trim());
    });

    renderImages(defaultUser);
};
