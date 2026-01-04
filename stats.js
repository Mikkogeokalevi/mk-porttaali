import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

/* KONFIGURAATIO: Määritellään kätkötyyppien indeksit ja ikonit.
   TARKISTA NÄMÄ: Indeksi (index) viittaa datan sarakkeeseen (0=eka, 1=toka...).
   Jos joku tyyppi näkyy väärin (esim. Earth onkin Virtuaali), vaihda numeroa tässä. */
const CACHE_TYPES = [
    { index: 0, name: 'Tradi', icon: 'kuvat/tradi.gif' },
    { index: 1, name: 'Multi', icon: 'kuvat/multi.gif' },
    { index: 3, name: 'Mysse', icon: 'kuvat/mysse.gif' }, // Oletus: index 3
    { index: 4, name: 'Letteri', icon: 'kuvat/letteri.gif' },
    { index: 5, name: 'Öörtti', icon: 'kuvat/oortti.gif' }, // Earth
    { index: 6, name: 'Miitti', icon: 'kuvat/miitti.gif' },
    { index: 7, name: 'Virtu', icon: 'kuvat/virtu.gif' },
    { index: 8, name: 'Cito', icon: 'kuvat/cito.gif' },
    { index: 9, name: 'Webcam', icon: 'kuvat/webcam.gif' },
    { index: 10, name: 'Wherigo', icon: 'kuvat/wherigo.gif' },
    { index: 11, name: 'Mega', icon: 'kuvat/mega.gif' },
    { index: 12, name: 'Juhla', icon: 'kuvat/juhla.gif' }, // Giga/Block/yms
    { index: 13, name: 'No Location', icon: 'kuvat/noloc.gif' }
];

// Päävalikko
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
                <span style="font-size:2em;">📊</span><br>Kaikki löydöt
            </button>
        </div>
    </div>`;
};

// UUSI: Kaikki löydöt (Malli: kaikki_katkot.html)
export const loadAllStats = async (db, user, content) => {
    if (!user) return;
    content.innerHTML = `<div class="card"><h1>Kaikki löydöt</h1><p>Ladataan...</p></div>`;
    try {
        const fullData = await fetchData(db, user.uid);
        if (!fullData) { content.innerHTML = `<div class="card"><p>Ei dataa. Käytä Admin-työkalua.</p></div>`; return; }

        let html = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <h2 style="margin:0;">Kuntien Kätkölöydöt</h2>
                <button class="btn" onclick="app.router('stats')" style="margin:0;">⬅ Takaisin</button>
            </div>
            <input type="text" id="munSearch" placeholder="Hae kuntaa..." style="margin-bottom:15px;">
            <div id="munList"></div>
        </div>`;
        content.innerHTML = html;

        const renderMunicipalityList = (filter = "") => {
            const container = document.getElementById('munList');
            container.innerHTML = "";
            const term = filter.toLowerCase();
            
            Object.keys(fullData).sort().forEach(kunta => {
                if (!kunta.toLowerCase().startsWith(term)) return;
                const stats = fullData[kunta].s || [];
                
                // Jaetaan tyypit kahteen listaan
                let foundList = "";
                let notFoundList = "";

                CACHE_TYPES.forEach(type => {
                    const count = stats[type.index] || 0;
                    const li = `<li><img src="${type.icon}" alt="${type.name}"> <span>${type.name}: ${count}</span></li>`;
                    if (count > 0) foundList += li;
                    else notFoundList += li;
                });

                // Luodaan HTML-laatikko (style.css .municipality-box hoitaa ulkoasun)
                const pgcLink = `https://project-gc.com/Tools/MapCompare?profile_name=${user.displayName || 'user'}&country[]=Finland&county[]=${kunta}&nonefound=on&submit=Filter`;
                const gcfiLink = `https://www.geocache.fi/stat/other/jakauma.php?kuntalista=${kunta}`;
                
                container.innerHTML += `
                <div class="municipality-box">
                    <h3>
                        <span>
                            <a href="${gcfiLink}" target="_blank">${kunta}</a> 
                            <a href="${pgcLink}" target="_blank" style="font-size:0.8em; opacity:0.7;">(Pgc)</a>
                        </span>
                    </h3>
                    <h4>Löydetyt kätkötyypit:</h4>
                    <ul class="cache-list">${foundList || '<li style="opacity:0.5">Ei löytöjä</li>'}</ul>
                    ${notFoundList ? `<h4>Ei löytöjä (tyypit):</h4><ul class="cache-list">${notFoundList}</ul>` : ''}
                </div>`;
            });
        };
        renderMunicipalityList();
        document.getElementById('munSearch').addEventListener('input', (e) => renderMunicipalityList(e.target.value));

    } catch (e) { console.error(e); content.innerHTML = `<div class="card"><h1>Virhe</h1><p>${e.message}</p></div>`; }
};

// VANHA: Tripletti (Tiivistetty)
export const loadTripletData = async (db, user, content) => {
    if (!user) return;
    content.innerHTML = `<div class="card"><h1>Triplettitarkistus</h1><p>Ladataan...</p></div>`;
    try {
        const fullData = await fetchData(db, user.uid);
        if (!fullData) { content.innerHTML += `<p>Ei dataa.</p>`; return; }

        content.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <h1 style="margin:0;">Triplettitarkistus</h1>
                <button class="btn" onclick="app.router('stats')" style="margin:0;">⬅ Takaisin</button>
            </div>
            <input type="text" id="tripletSearch" placeholder="Hae kuntaa...">
            <div id="tripletStatsSummary" style="display:flex; gap:10px; margin:15px 0;"></div>
            <div id="tripletResults"></div>
        </div>`;
        initTripletLogic(fullData);
    } catch (e) { content.innerHTML = `<div class="card"><h1 style="color:var(--error-color)">Virhe</h1><p>${e.message}</p></div>`; }
};

async function fetchData(db, uid) {
    const s = await getDoc(doc(db, "stats", uid));
    return (s.exists() && s.data().municipalities) ? s.data().municipalities : null;
}

function initTripletLogic(fullData) {
    const renderLists = (filterText) => {
        const filter = filterText.toLowerCase();
        const cats = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[] };
        const titles = { 1:"1. Ei löytöjä (0/0/0)", 2:"2. Vain Tradi", 3:"3. Vain Multi", 4:"4. Vain Mysteeri", 5:"5. Tradi + Multi", 6:"6. Multi + Mysteeri", 7:"7. Tradi + Mysteeri", 8:"8. Triplettikunnat (T+M+?)" };

        Object.keys(fullData).sort().forEach(kunta => {
            if (!kunta.toLowerCase().includes(filter)) return;
            const s = fullData[kunta].s || [];
            const t = s[0]||0, m = s[1]||0, q = s[3]||0; // HUOM: Indexit täällä. Q=3 (Mysteeri)
            const item = `<li><b>${kunta}</b>: T=${t}, M=${m}, ?=${q}</li>`;

            if(!t && !m && !q) cats[1].push(item);
            else if(t && !m && !q) cats[2].push(item);
            else if(!t && m && !q) cats[3].push(item);
            else if(!t && !m && q) cats[4].push(item);
            else if(t && m && !q) cats[5].push(item);
            else if(!t && m && q) cats[6].push(item);
            else if(t && !m && q) cats[7].push(item);
            else if(t && m && q) cats[8].push(item);
        });

        const sumDiv = document.getElementById('tripletStatsSummary');
        if(sumDiv) sumDiv.innerHTML = `
            <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:2em; color:var(--success-color);">${cats[8].length}</div><div style="font-size:0.8em;">Triplettiä</div>
            </div>
            <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:2em; color:var(--error-color);">${cats[1].length}</div><div style="font-size:0.8em;">Ei löytöjä</div>
            </div>`;

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
