import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { maakuntienKunnat } from "./data.js";
import { assignFindToFinnishMunicipality, countryNameFi } from "./gpxImport.js";
import { loadFinds, findsList } from "./findsQuery.js";

// Maanimet jotka reititetään Suomeen — näille voi tehdä käsin kunta-määrityksen
const FI_COUNTRY_ALIASES = new Set(['Finland', 'Aland Islands', 'Åland Islands', 'Åland', 'Ahvenanmaa']);
const FI_KUNTA_OPTIONS = [...new Set(Object.values(maakuntienKunnat).flat())]
    .sort((a, b) => a.localeCompare(b, 'fi'))
    .map(k => `<option value="${k}">${k}</option>`).join('');

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

// AHVENANMAAN ALUEET (PGC LINKKEJÄ VARTEN)
const ALAND_REGIONS = {
    "Maarianhamina": "Mariehamn",
    "Brändö": "Ålands skärgård",
    "Föglö": "Ålands skärgård",
    "Kumlinge": "Ålands skärgård",
    "Kökar": "Ålands skärgård",
    "Sottunga": "Ålands skärgård",
    "Vårdö": "Ålands skärgård",
    // Loput menevät oletuksena "Ålands landsbygd"
};

// VARMUUSVERKKO: Nämä toimivat aina
const HARDCODED_IDS = {
    "mikkokalevi": 306478,
    "eukka": 36206,
    "Tiltu": 309395,
    "lahjemies": 308779,
    "milde04": 29523,
    "mkivimaki": 134775,
    "E5kimo": 39732
};

// --- PÄÄVALIKKO ---
export const renderStatsDashboard = (content, app) => {
    content.innerHTML = `
    <div class="card">
        <h1>Tilastot</h1>
        <p>Valitse tarkasteltava tilasto:</p>
        <div class="launcher-grid">
            <button class="launcher-btn btn-green" onclick="app.router('stats_triplet')">
                <span class="launcher-icon">🏆</span>Triplettijahti
            </button>
            <button class="launcher-btn btn-blue" onclick="app.router('stats_all')">
                <span class="launcher-icon">🗺️</span>Maakunnat &amp; Löydöt
            </button>
            <button class="launcher-btn btn-yellow" onclick="app.router('country_maps')">
                <span class="launcher-icon">🌍</span>Ulkomaiden kuntakartat
            </button>
            <button class="launcher-btn btn-mauve" onclick="app.router('stats_top')">
                <span class="launcher-icon">📊</span>Top-listat
            </button>
            <button class="launcher-btn btn-peach" onclick="app.router('stats_external')">
                <span class="launcher-icon">📈</span>Kuvatilastot (Geocache.fi)
            </button>
            <button class="launcher-btn btn-sky" onclick="app.router('stats_other')">
                <span class="launcher-icon">🌐</span>Muut maat
            </button>
            <button class="launcher-btn btn-teal" onclick="app.router('stats_queries')">
                <span class="launcher-icon">🔍</span>Löytöhaut
            </button>
        </div>
    </div>`;
};

// --- MUUT MAAT (GPX-tuotavat löydöt maittain, SE/NO/EE mukana) ---
// Maanimi -> ISO2 (lippu-emoji). Windows ei renderöi lippuja, mutta näyttää ISO-kirjaimet.
const COUNTRY_ISO = {
    'Finland':'FI','Sweden':'SE','Norway':'NO','Estonia':'EE','Latvia':'LV','Lithuania':'LT',
    'Denmark':'DK','Germany':'DE','Poland':'PL','Russia':'RU','Iceland':'IS','United Kingdom':'GB',
    'Ireland':'IE','France':'FR','Spain':'ES','Portugal':'PT','Italy':'IT','Greece':'GR','Malta':'MT',
    'Cyprus':'CY','Croatia':'HR','Slovenia':'SI','Czechia':'CZ','Czech Republic':'CZ','Slovakia':'SK',
    'Hungary':'HU','Romania':'RO','Bulgaria':'BG','Serbia':'RS','North Macedonia':'MK','Albania':'AL',
    'Montenegro':'ME','Bosnia and Herzegovina':'BA','Kosovo':'XK','Ukraine':'UA','Belarus':'BY',
    'Moldova':'MD','Austria':'AT','Switzerland':'CH','Netherlands':'NL','Belgium':'BE',
    'Luxembourg':'LU','Aland Islands':'AX','Åland Islands':'AX','Turkey':'TR','Georgia':'GE',
    'Armenia':'AM','Azerbaijan':'AZ','Kazakhstan':'KZ','United States':'US','Canada':'CA','Mexico':'MX',
    'Thailand':'TH','Japan':'JP','South Korea':'KR','China':'CN','India':'IN','Australia':'AU',
    'New Zealand':'NZ','Egypt':'EG','South Africa':'ZA','Israel':'IL','United Arab Emirates':'AE',
    'Morocco':'MA','Kenya':'KE','Brazil':'BR','Argentina':'AR','Chile':'CL','Peru':'PE',
    'Colombia':'CO','Cuba':'CU','Dominican Republic':'DO','Singapore':'SG','Malaysia':'MY',
    'Indonesia':'ID','Vietnam':'VN','Hong Kong':'HK','Taiwan':'TW','Philippines':'PH','Nepal':'NP',
    'Sri Lanka':'LK','Qatar':'QA','Saudi Arabia':'SA','Jordan':'JO','Oman':'OM','Bahrain':'BH',
    'Kuwait':'KW','Tunisia':'TN','Algeria':'DZ','Jamaica':'JM','Mongolia':'MN','Lebanon':'LB',
    'Andorra':'AD','Monaco':'MC','Liechtenstein':'LI','San Marino':'SM','Vatican City':'VA',
    'Isle of Man':'IM','Jersey':'JE','Guernsey':'GG','Gibraltar':'GI','Faroe Islands':'FO',
    'Greenland':'GL','Puerto Rico':'PR','Panama':'PA','Costa Rica':'CR','Uruguay':'UY'
};
function flagEmoji(name) {
    const iso = COUNTRY_ISO[name];
    if (!iso) return '🌐';
    return String.fromCodePoint(...iso.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

export const loadOtherCountries = async (db, user, content) => {
    content.innerHTML = `<div class="card"><h1>Muut maat</h1><p>Ladataan...</p></div>`;
    try {
        const [otherSnap, seSnap, noSnap, eeSnap] = await Promise.all([
            getDoc(doc(db, 'users', user.uid, 'other_countries', 'finds')),
            getDoc(doc(db, 'users', user.uid, 'sweden', 'finds')),
            getDoc(doc(db, 'users', user.uid, 'norway', 'finds')),
            getDoc(doc(db, 'users', user.uid, 'estonia', 'finds'))
        ]);
        const countries = otherSnap.exists() ? (otherSnap.data().countries || {}) : {};

        // Kuntakarttamaat ensin — samassa listassa, laajennettavat + kartta-linkki
        const countMunis = snap => Object.values(snap.exists() ? (snap.data().municipalities || {}) : {})
            .reduce((a, e) => a + ((e?.ids || []).length || (e?.s || []).reduce((x, y) => x + y, 0)), 0);
        const mapCountries = [
            { name: 'Ruotsi', router: 'sweden_map', snap: seSnap },
            { name: 'Norja', router: 'norway_map', snap: noSnap },
            { name: 'Viro', router: 'estonia_map', snap: eeSnap }
        ].map(c => ({ ...c, count: countMunis(c.snap) })).filter(c => c.count > 0);

        const entries = Object.entries(countries)
            .map(([name, e]) => ({ name, ids: e.ids || [], count: (e.ids || []).length || (e.s || []).reduce((a, b) => a + b, 0), types: (e.s || []).map((v, i) => v > 0 ? i : -1).filter(i => i >= 0) }))
            .sort((a, b) => b.count - a.count);

        if (!entries.length && !mapCountries.length) {
            content.innerHTML = `
            <div class="card">
                <div class="view-header"><h1>Muut maat</h1>
                <button class="btn btn-sm" onclick="app.router('stats')">⬅ Tilastot</button></div>
                <p>Ei löytöjä Suomen ulkopuolelta. Tuo löytösi GPX-tiedostosta Asetukset-sivulla — löydöt tallentuvat tänne automaattisesti maittain.</p>
            </div>`;
            return;
        }

        const TYPE_NAMES = ['Tradi','Multi','Webcam','Mysse','Letteri','Öörtti','Miitti','Virtu','Cito','Wherigo','Com.Cel','Mega','No Loc','Juhla'];

        // Ruotsi/Norja/Viro: laajennettava rivi + linkki kuntakarttaan
        const mapRows = mapCountries.map(c => `
            <details class="oc-country" data-name="${c.name}" data-kind="map" data-router="${c.router}">
                <summary class="oc-row">
                    <span class="oc-flag">${flagEmoji({Ruotsi:'Sweden',Norja:'Norway',Viro:'Estonia'}[c.name])}</span>
                    <span class="oc-name">${c.name}</span>
                    <span class="oc-count">${c.count} löytöä</span>
                    <span class="oc-caret">▸</span>
                </summary>
                <div class="oc-body">
                    <button class="btn btn-sm" onclick="app.router('${c.router}')" style="margin:4px 0 8px;">🗺️ Avaa ${c.name}-kuntakartta</button>
                    <div class="oc-list"></div>
                </div>
            </details>`).join('');

        const otherRows = entries.map(e => {
            // Suomeksi merkityt mutta kuntaa puuttuvat löydöt voi merkitä käsin kuntaan
            const fixable = FI_COUNTRY_ALIASES.has(e.name) && e.ids.length;
            const fixBlock = fixable ? `
                <details style="margin-top:8px;">
                    <summary style="font-size:0.8em; color:var(--warning-color);">Kuntaa ei tunnistettu — merkitse käsin:</summary>
                    <div style="margin-top:6px;">
                        ${e.ids.map(code => `<div style="display:flex; gap:8px; align-items:center; margin:5px 0; font-size:0.85em;">
                            <strong>${code}</strong>
                            <select class="fix-kunta-other" data-code="${code}" data-cname="${e.name}" style="flex:1; margin:0; padding:6px;">
                                <option value="">→ valitse kunta…</option>${FI_KUNTA_OPTIONS}
                            </select>
                        </div>`).join('')}
                    </div>
                </details>` : '';
            const typesLine = e.types.length ? `<div style="font-size:0.75em; opacity:0.6; margin:4px 0 6px;">${e.types.map(i => TYPE_NAMES[i] || '?').join(' • ')}</div>` : '';
            return `
            <details class="oc-country" data-name="${e.name}" data-kind="other">
                <summary class="oc-row">
                    <span class="oc-flag">${flagEmoji(e.name)}</span>
                    <span class="oc-name">${countryNameFi(e.name)}</span>
                    <span class="oc-count">${e.count} löytöä</span>
                    <span class="oc-caret">▸</span>
                </summary>
                <div class="oc-body">
                    ${typesLine}
                    <div class="oc-list"></div>
                    ${fixBlock}
                </div>
            </details>`;
        }).join('');

        content.innerHTML = `
        <div class="card">
            <div class="view-header"><h1>Muut maat</h1>
            <button class="btn btn-sm" onclick="app.router('stats')">⬅ Tilastot</button></div>
            <p style="font-size:0.85em; opacity:0.75;">Löydöt maittain — avaa maa nähdäksesi löytölistan. Kuntataso lisätään tarvittaessa — pyydä adminia, jos haluat jonkin maan kartaksi.</p>
            <div class="oc-table">${mapRows}${otherRows}</div>
        </div>`;

        // Maarivin avaus -> laiska löytölistan lataus
        const idsByName = {};
        for (const e of entries) idsByName[e.name] = new Set(e.ids);
        content.querySelectorAll('details.oc-country').forEach(det => {
            det.addEventListener('toggle', async () => {
                if (!det.open || det.dataset.loaded) return;
                det.dataset.loaded = '1';
                const name = det.dataset.name;
                const listEl = det.querySelector('.oc-list');
                listEl.innerHTML = '<p style="font-size:0.85em; opacity:0.7;">Ladataan löytöjä…</p>';
                try {
                    const finds = await loadFinds(db, user.uid);
                    const idSet = idsByName[name];
                    const hits = det.dataset.kind === 'map'
                        ? finds.filter(f => f.country === name) // Ruotsi/Norja/Viro (suomenkielinen nimi)
                        : (idSet && idSet.size
                            ? finds.filter(f => idSet.has(f.code))
                            : finds.filter(f => f.country === countryNameFi(name)));
                    listEl.innerHTML = hits.length
                        ? findsList(hits, 500)
                        : '<p style="font-size:0.85em; opacity:0.7;">Ei kätkökohtaista dataa — aja GPX-tuonti uudelleen, niin löydöt listautuvat tänne.</p>';
                } catch (err) {
                    console.error('Maakohtainen löytölista:', err);
                    listEl.innerHTML = '<p style="color:var(--c-red); font-size:0.85em;">Lataus epäonnistui.</p>';
                }
            });
        });

        // Käsin tehtävät kunta-määritykset (Suomen aliakset, esim. kuntaa puuttuva löytö)
        content.querySelectorAll('select.fix-kunta-other').forEach(sel => {
            sel.onchange = async () => {
                const kunta = sel.value;
                if (!kunta) return;
                sel.disabled = true;
                try {
                    await assignFindToFinnishMunicipality(db, user.uid, {
                        code: sel.dataset.code,
                        fromCname: sel.dataset.cname,
                        kunta
                    });
                    loadOtherCountries(db, user, content); // päivitä näkymä
                } catch (err) {
                    console.error('Kunta-määritys:', err);
                    sel.disabled = false;
                    alert('Merkintä epäonnistui: ' + err.message);
                }
            };
        });
    } catch (e) {
        console.error(e);
        content.innerHTML = `<div class="card"><h1>Muut maat</h1><p>Lataus epäonnistui.</p></div>`;
    }
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
            <div class="view-header" style="margin-bottom:5px;">
                <h2>Ranking</h2>
                <button class="btn btn-sm" onclick="app.router('stats')">⬅ Takaisin</button>
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
        <style>
            #regionMissingFilterPanel { padding:8px 10px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:8px; margin-bottom:15px; font-size:0.85em; }
            #regionMissingFilterToggle { display:none; }
            #regionMissingFilterSummary { display:none; }
            #regionMissingTypeOptions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
            @media (max-width: 767px) {
                #regionMissingFilterPanel { padding:0; }
                #regionMissingFilterToolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 10px; }
                #regionMissingFilterToolbar strong { display:none; }
                #regionMissingFilterToggle { display:inline-block; padding:5px 9px; margin:0; }
                #regionMissingFilterSummary { display:block; flex:1; opacity:0.75; font-size:0.9em; }
                #regionMissingFilterControls { display:none; padding:0 10px 9px 10px; }
                #regionMissingFilterPanel.filters-open #regionMissingFilterControls { display:block; }
                #regionMissingTypeOptions { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px 6px; padding:3px 0 9px 0; }
                #regionMissingTypeOptions label { white-space:nowrap; }
                #regionMissingFilterMode { width:100% !important; margin:0 0 8px 0 !important; }
                #clearRegionMissingFilters { width:100%; }
            }
        </style>
        <div class="card">
            <div class="view-header" style="margin-bottom:5px;">
                <h2>Löydöt maakunnittain</h2>
                <div class="toolbar-actions" style="display:flex; gap:8px;">
                    <button class="btn btn-primary btn-sm" onclick="app.router('stats_map_all')">🗺️ Avaa Kartta</button>
                    <button class="btn btn-sm" onclick="app.router('stats')">⬅ Takaisin</button>
                </div>
            </div>
            <p style="font-size:0.85em; color:var(--success-color); margin-bottom:15px;">📅 Data päivitetty: <b>${updateTime}</b></p>
            <input type="text" id="regionSearch" placeholder="Hae kuntaa (esim. Lahti)..." style="margin-bottom:15px;">
            <div id="regionMissingFilterPanel">
                <div id="regionMissingFilterToolbar">
                    <strong>Suodata puuttuvien mukaan:</strong>
                    <span id="regionMissingFilterSummary">Kaikki näkyvissä</span>
                    <button id="regionMissingFilterToggle" class="btn" type="button">Suodattimet ▾</button>
                </div>
                <div id="regionMissingFilterControls">
                    <div id="regionMissingTypeOptions"></div>
                    <select id="regionMissingFilterMode" style="width:auto; padding:4px; margin:0;">
                        <option value="any">Puuttuu vähintään yksi</option>
                        <option value="all">Puuttuvat kaikki valitut</option>
                    </select>
                    <button id="clearRegionMissingFilters" class="btn" type="button" style="padding:4px 8px;">Näytä kaikki</button>
                </div>
            </div>
            <div id="regionList"></div>
        </div>`;

        const regionFilterState = { types: [], mode: 'any' };
        const regionFilterPanel = document.getElementById('regionMissingFilterPanel');
        const regionFilterSummary = document.getElementById('regionMissingFilterSummary');
        const regionFilterOptions = document.getElementById('regionMissingTypeOptions');

        if (regionFilterOptions) {
            regionFilterOptions.innerHTML = CACHE_TYPES.map(type => `
                <label title="Näytä kunnat, joissa ${type.name} puuttuu">
                    <input type="checkbox" class="regionMissingTypeFilter" value="${type.index}"> ${type.name}
                </label>
            `).join('');
        }

        const updateRegionFilterSummary = () => {
            if (!regionFilterSummary) return;
            regionFilterSummary.textContent = regionFilterState.types.length
                ? `${regionFilterState.types.length} tyyppiä valittu`
                : 'Kaikki näkyvissä';
        };

        const municipalityMatchesMissingFilter = (kunta) => {
            if (!regionFilterState.types.length) return true;
            const stats = fullData[kunta]?.s || [];
            const missing = regionFilterState.types.map(index => (stats[index] || 0) === 0);
            return regionFilterState.mode === 'all' ? missing.every(Boolean) : missing.some(Boolean);
        };

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
                    const matchesMissingFilter = municipalityMatchesMissingFilter(kunta);
                    return hasData && matchesSearch && matchesMissingFilter;
                });

                if (matchingMunicipalities.length === 0) return;
                totalRegionsShown++;

                let municipalitiesHtml = "";
                matchingMunicipalities.forEach(kunta => {
                    const stats = fullData[kunta].s || [];
                    let foundList = "", notFoundList = "";
                    
                    let displayTotal = 0;

                    CACHE_TYPES.forEach(type => {
                        const count = stats[type.index] || 0;
                        if (count > 0) {
                            displayTotal += count;
                            foundList += `<li><img src="${type.icon}" alt="${type.name}"> <span>${type.name}: ${count}</span></li>`;
                        } else {
                            notFoundList += `<li><img src="${type.icon}" alt="${type.name}"> <span>${type.name}: 0</span></li>`;
                        }
                    });

                    // --- PGC LINKIN LOGIIKKA ---
                    let pgcCountry = "Finland";
                    let pgcRegion = maakunta;
                    let pgcCounty = kunta;

                    if (maakunta === "Ahvenanmaa") {
                        pgcCountry = "Åland Islands";
                        pgcRegion = ALAND_REGIONS[kunta] || "Ålands landsbygd";
                        if (kunta === "Maarianhamina") {
                            pgcRegion = "Mariehamn";
                            pgcCounty = "Mariehamn";
                        }
                    }

                    const pgcLink = `https://project-gc.com/Tools/MapCompare?player_prc_profileName=${encodeURIComponent(pgcUser)}&geocache_mc_show%5B%5D=found-none&geocache_crc_country=${encodeURIComponent(pgcCountry)}&geocache_crc_region=${encodeURIComponent(pgcRegion)}&geocache_crc_county=${encodeURIComponent(pgcCounty)}&submit=Filter`;
                    const gcfiLink = `https://www.geocache.fi/stat/other/jakauma.php?kuntalista=${kunta}`;

                    municipalitiesHtml += `<div class="municipality-box">
                        <h3><span><a href="${gcfiLink}" target="_blank">${kunta}</a> <a href="${pgcLink}" target="_blank" style="font-size:0.7em; opacity:0.6; text-decoration:none;">(Pgc)</a></span></h3>
                        
                        <h4>LÖYDETYT (${displayTotal}):</h4>
                        <ul class="cache-list">${foundList || '<li style="opacity:0.5">-</li>'}</ul>
                        
                        ${notFoundList ? `<h4>EI LÖYTÖJÄ:</h4><ul class="cache-list" style="opacity:0.7;">${notFoundList}</ul>` : ''}
                    </div>`;
                });
                
                const isOpen = term.length > 0 ? "open" : "";
                container.innerHTML += `<details ${isOpen} class="region-accordion"><summary><span style="font-size:1.1em;">${maakunta}</span><span style="float:right; font-weight:normal; opacity:0.7; font-size:0.9em;">${matchingMunicipalities.length} kuntaa</span></summary><div class="region-content">${municipalitiesHtml}</div></details>`;
            });
            if (totalRegionsShown === 0) container.innerHTML = `<p style="text-align:center; margin-top:20px; opacity:0.6;">Ei osumia haulla "${filter}".</p>`;
        };
        document.getElementById('regionMissingFilterToggle')?.addEventListener('click', () => {
            regionFilterPanel?.classList.toggle('filters-open');
        });

        document.querySelectorAll('.regionMissingTypeFilter').forEach(input => {
            input.addEventListener('change', () => {
                regionFilterState.types = Array.from(document.querySelectorAll('.regionMissingTypeFilter:checked'))
                    .map(item => Number(item.value));
                updateRegionFilterSummary();
                renderRegions(document.getElementById('regionSearch')?.value || '');
            });
        });

        document.getElementById('regionMissingFilterMode')?.addEventListener('change', (event) => {
            regionFilterState.mode = event.target.value;
            renderRegions(document.getElementById('regionSearch')?.value || '');
        });

        document.getElementById('clearRegionMissingFilters')?.addEventListener('click', () => {
            document.querySelectorAll('.regionMissingTypeFilter').forEach(input => { input.checked = false; });
            regionFilterState.types = [];
            updateRegionFilterSummary();
            regionFilterPanel?.classList.remove('filters-open');
            renderRegions(document.getElementById('regionSearch')?.value || '');
        });

        updateRegionFilterSummary();
        renderRegions();
        document.getElementById('regionSearch').addEventListener('input', (e) => renderRegions(e.target.value));
    } catch (e) { console.error(e); content.innerHTML = `<div class="card"><h1>Virhe</h1><p>${e.message}</p></div>`; }
};

// --- 3. TRIPLETTIJAHTI ---
export const loadTripletData = async (db, user, content) => {
    if (!user) return;
    content.innerHTML = `<div class="card"><h1>Triplettijahti</h1><p>Ladataan...</p></div>`;
    try {
        const docData = await fetchFullDoc(db, user.uid);
        if (!docData || !docData.municipalities) { content.innerHTML += `<p>Ei dataa.</p>`; return; }
        const fullData = docData.municipalities;
        const updateTime = formatUpdateDate(docData.updatedAt);

        content.innerHTML = `
        <div class="card">
            <div class="view-header" style="margin-bottom:5px;">
                <h1>Triplettijahti</h1>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-primary btn-sm" onclick="app.router('stats_map')">🗺️ Avaa Kartta</button>
                    <button class="btn btn-sm" onclick="app.router('stats')">⬅ Takaisin</button>
                </div>
            </div>
            <p style="font-size:0.85em; color:var(--success-color); margin-bottom:15px;">📅 Data päivitetty: <b>${updateTime}</b></p>
            <p style="font-size:0.9em; opacity:0.8;">Tämä lista näyttää mitä kätkötyyppejä (Tradi, Multi, Mysteeri) puuttuu kultakin paikkakunnalta.</p>
            
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="text" id="tripletSearch" placeholder="Hae kuntaa..." style="flex:2;">
                <select id="tripletFilter" style="flex:1;">
                    <option value="all">Kaikki</option>
                    <option value="missing">Vain puuttuvat</option>
                    <option value="complete">Vain valmiit</option>
                </select>
            </div>

            <div id="tripletStatsSummary" style="display:flex; gap:10px; margin:15px 0;"></div>
            <div id="tripletResults"></div>
        </div>`;
        initTripletLogic(fullData);
    } catch (e) { content.innerHTML = `<div class="card"><h1 style="color:var(--error-color)">Virhe</h1><p>${e.message}</p></div>`; }
};

function initTripletLogic(fullData) {
    const renderLists = () => {
        const filterText = document.getElementById('tripletSearch').value.toLowerCase();
        const filterType = document.getElementById('tripletFilter').value;
        const container = document.getElementById('tripletResults');
        
        let completedCount = 0;
        let missingCount = 0;
        let html = "";

        const sortedKunnat = Object.keys(fullData).sort();

        sortedKunnat.forEach(kunta => {
            if (!kunta.toLowerCase().includes(filterText)) return;

            const s = fullData[kunta].s || [];
            const t = s[0] || 0; // Tradi
            const m = s[1] || 0; // Multi
            const q = s[3] || 0; // Mysteeri

            const isComplete = (t > 0 && m > 0 && q > 0);
            
            if (isComplete) completedCount++;
            else missingCount++;

            if (filterType === 'missing' && isComplete) return;
            if (filterType === 'complete' && !isComplete) return;

            let missingIcons = "";
            let statusClass = "triplet-complete";
            let statusText = "Valmis! 🎉";

            if (!isComplete) {
                statusClass = "triplet-missing";
                statusText = "Puuttuu:";
                if (t === 0) missingIcons += `<span class="missing-badge" style="border-color:#a6e3a1; color:#a6e3a1;">Tradi</span> `;
                if (m === 0) missingIcons += `<span class="missing-badge" style="border-color:#89b4fa; color:#89b4fa;">Multi</span> `;
                if (q === 0) missingIcons += `<span class="missing-badge" style="border-color:#f9e2af; color:#f9e2af;">Mysse</span> `;
                
                const totalFinds = s.reduce((a,b)=>a+b, 0);
                if (totalFinds === 0) {
                    missingIcons = `<span style="color:#f38ba8; font-weight:bold;">Ei löytöjä lainkaan</span>`;
                }
            }

            html += `
            <div class="municipality-box ${statusClass}" style="display:flex; justify-content:space-between; align-items:center; padding:10px; margin-bottom:5px; background:rgba(255,255,255,0.05); border-left:4px solid ${isComplete ? '#a6e3a1' : '#f38ba8'};">
                <div style="font-weight:bold; font-size:1.1em;">${kunta}</div>
                <div style="text-align:right;">
                    <div style="font-size:0.8em; opacity:0.7; margin-bottom:2px;">${statusText}</div>
                    <div>${missingIcons}</div>
                </div>
            </div>`;
        });

        const sumDiv = document.getElementById('tripletStatsSummary');
        if(sumDiv) sumDiv.innerHTML = `
            <div class="stat-box" style="flex:1; border-color:var(--c-green); color:var(--c-green);">Valmiit <span>${completedCount}</span></div>
            <div class="stat-box" style="flex:1; border-color:var(--c-red); color:var(--c-red);">Puuttuvat <span>${missingCount}</span></div>`;

        container.innerHTML = html || '<p style="text-align:center; opacity:0.5;">Ei osumia.</p>';
    };

    renderLists();
    document.getElementById('tripletSearch').addEventListener('input', renderLists);
    document.getElementById('tripletFilter').addEventListener('change', renderLists);
}

// --- 4. EXTERNAL STATS (Kuvatilastot) ---
export const loadExternalStats = async (content) => {
    // 1. Pakotetaan kaverilistan lataus
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

    // Luodaan datalist-optiot kavereista
    let savedUsers = window.app.friendsList || [];
    let options = savedUsers.map(u => `<option value="${u.name}">${u.name}</option>`).join('');

    content.innerHTML = `
    <div class="card">
        <div class="view-header">
            <h1>Kuvatilastot</h1>
            <button class="btn btn-sm" onclick="app.router('stats')">⬅ Takaisin</button>
        </div>
        <div class="input-group" style="margin-top:15px;">
            <label style="flex:1;">Käyttäjä:</label>
            <input type="text" id="statUser" list="statUserList" value="${defaultUser}" style="flex:3;">
            <datalist id="statUserList">${options}</datalist>
            <button class="btn btn-primary" id="refreshStats" style="flex:1; margin:8px 0 16px;">Päivitä</button>
            </div>
        <div style="font-size: 0.85em; color: var(--subtext-color); margin-bottom: 15px; text-align: right;">
            Geocache.fi ID: <span id="activeIdDisplay" style="color: var(--accent-color); font-weight: bold;">-</span>
        </div>
    </div>
    
    <div id="statsContainer">Ladataan kuvia...</div>
    `;

    // Funktio, joka renderöi kuvat
    const renderImages = (user) => {
        const container = document.getElementById('statsContainer');
        const currentYear = new Date().getFullYear();
        const userLower = user.toLowerCase();
        
        let userId = null;

        // 1. HARDCODED LISTA
        if (HARDCODED_IDS[user]) userId = HARDCODED_IDS[user];
        // 2. Omat tiedot
        else if (window.app.savedNickname?.toLowerCase() === userLower && window.app.savedId) userId = window.app.savedId;
        // 3. Kaverilista
        else if (window.app.friendsList) {
            const f = window.app.friendsList.find(f => f.name.toLowerCase() === userLower);
            if (f && f.id) userId = f.id;
        }

        const idDisplay = document.getElementById('activeIdDisplay');
        if (idDisplay) {
            idDisplay.textContent = userId ? userId : "(Ei tiedossa - linkit eivät toimi)";
            idDisplay.style.color = userId ? "var(--success-color)" : "var(--subtext-color)";
        }

        const img = (url, id = "") => `<img ${id ? `id="${id}"` : ""} src="${url}" loading="lazy" style="max-width:100%; height:auto; border-radius:8px; margin-bottom:10px; display:block;">`;
        
        // Linkkifunktio ottaa huomioon tyypin
        const mapLink = (typeId, text) => {
            if (!userId) return `<span style="font-size:0.8em; opacity:0.5;">(Linkki vaatii ID:n)</span>`;
            let url = `https://www.geocache.fi/stat/kunta/?userid=${userId}&names=1`;
            if (typeId) url += `&cachetype=${typeId}`;
            return `<a id="kuntaMapLink" href="${url}" target="_blank" class="btn" style="padding:5px 10px; font-size:0.9em; margin-bottom:10px;">${text} ↗</a>`;
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
            { id: '98', name: 'Muut paitsi Tradit' },
            { id: '99', name: 'Kaikki Eventit' }
        ];

        let yearOptions = `<option value="">Elinikäinen</option>`;
        for (let y = currentYear; y >= 2000; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        let tdYearHtml = `
            <div style="margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                <label>Valitse vuosi:</label>
                <select id="tdYearSelector" style="padding:5px; border-radius:4px;">${yearOptions}</select>
            </div>
            <div id="tdYearContainer"></div>
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

        // Dynaaminen Kuntakartta
        let kuntaMapHtml = `
            <div style="margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                <label>Valitse vuosi:</label>
                <select id="kuntaYearSelector" style="padding:5px; border-radius:4px;">${yearOptions}</select>
            </div>
            <div id="kuntaMapContainer"></div>
        `;

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

            <details class="region-accordion"><summary>Kuntakartat (Dynaaminen)</summary>
                <div class="region-content">${kuntaMapHtml}</div>
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

        // LOGIIKKA: T/D Vuosipäivitys
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

        // LOGIIKKA: Kuntakartta päivitys
        const kuntaYearSelector = document.getElementById('kuntaYearSelector');
        const kuntaMapContainer = document.getElementById('kuntaMapContainer');

        const updateKuntaMap = () => {
            const y = kuntaYearSelector.value;
            let html = "";
            
            matrixTypes.forEach(t => {
                let url = `https://www.geocache.fi/stat/kunta.php?la=&slide=1&user=${user}`;
                if (y) url += `&year=${y}`;
                if (t.id) url += `&cachetype=${t.id}`;
                
                const titleText = y ? `${t.name} (${y})` : `${t.name} (Elinikäinen)`;
                html += `<h4>${titleText}</h4>`;
                html += img(url);
                html += mapLink(t.id, 'Avaa interaktiivinen kartta');
                html += `<br><br>`;
            });
            kuntaMapContainer.innerHTML = html;
        };

        // Alustukset
        tdYearSelector.value = currentYear;
        updateTdImages(currentYear);
        tdYearSelector.addEventListener('change', (e) => updateTdImages(e.target.value));

        updateKuntaMap();
        kuntaYearSelector.addEventListener('change', updateKuntaMap);
    };

    document.getElementById('refreshStats').addEventListener('click', () => {
        renderImages(document.getElementById('statUser').value.trim());
    });

    renderImages(defaultUser);
};
