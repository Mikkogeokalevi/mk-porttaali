import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// TUODAAN DATA ULKOISESTA TIEDOSTOSTA
import { suomenMaakunnat, maakuntienKunnat } from "./data.js";

// --- UUSI: MÄÄRITELLÄÄN KÄTKÖTYYPIT UUSIA TILASTOJA VARTEN ---
// Indeksit vastaavat Admin-työkalun tallentamaa järjestystä
const CACHE_TYPES = [
    { index: 0, name: "Tradi", icon: "tradi.png" },
    { index: 1, name: "Multi", icon: "multi.png" },
    { index: 2, name: "Webbikamera", icon: "webcam.png" },
    { index: 3, name: "Mysteeri", icon: "mysse.png" },
    { index: 4, name: "Letterbox", icon: "letter.png" },
    { index: 5, name: "Earthcache", icon: "earth.png" },
    { index: 6, name: "Eventti", icon: "event.png" },
    { index: 7, name: "Virtuaali", icon: "virtual.png" },
    { index: 8, name: "CITO", icon: "cito.png" },
    { index: 9, name: "Wherigo", icon: "wherigo.png" },
    { index: 10, name: "Comm. Celeb.", icon: "commu.png" },
    { index: 11, name: "Mega", icon: "mega.png" },
    { index: 12, name: "Giga", icon: "giga.png" },
    { index: 13, name: "Block Party", icon: "block.png" },
    { index: 14, name: "Maze", icon: "maze.png" }
];

const firebaseConfig = {
  apiKey: "AIzaSyDxDmo274iZuwufe4meobYPoablUNinZGY",
  authDomain: "mk-porttaali.firebaseapp.com",
  projectId: "mk-porttaali",
  storageBucket: "mk-porttaali.firebasestorage.app",
  messagingSenderId: "220899819334",
  appId: "1:220899819334:web:6662b7b1519f4c89c32f47"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();

function formatDate(input) {
  const parts = input.split("-");
  if (!parts || parts.length !== 3) return "";
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

window.app = {
  currentUser: null,

  router: (view) => {
    const content = document.getElementById('appContent');
    const nav = document.getElementById('mainNav');
    if(nav) nav.classList.remove('open');

    // Suojatut sivut vaativat kirjautumisen
    if (['triplet', 'allstats', 'summary'].includes(view) && !window.app.currentUser) {
        app.router('login_view');
        return;
    }

    switch(view) {
      case 'home':
        content.innerHTML = `
          <div class="card">
            <h1>Tervetuloa MK Porttaaliin</h1>
            <p>Mobiiliystävällinen geokätköilytyökalupakki.</p>
            
            <div style="display:grid; gap:10px; margin-top:20px;">
                <button class="btn btn-primary" onclick="app.router('generator')">
                  🎨 Avaa Kuvageneraattori (Live)
                </button>
                
                <h3 style="margin-top:15px; border-bottom:1px solid #45475a; color:#a6adc8;">Omat Tilastot (Tietokanta)</h3>
                
                <button class="btn" style="background-color: #89b4fa; color:#1e1e2e; font-weight:bold;" onclick="app.router('triplet')">
                  🏆 Triplettilista (T+M+?)
                </button>
                <button class="btn" style="background-color: #a6e3a1; color:#1e1e2e; font-weight:bold;" onclick="app.router('allstats')">
                  📋 Kaikki löydöt
                </button>
                <button class="btn" style="background-color: #fab387; color:#1e1e2e; font-weight:bold;" onclick="app.router('summary')">
                  📊 Yhteenveto & Värisuorat
                </button>
            </div>
          </div>
          <div class="card">
            <h2>Linkit</h2>
            <ul>
              <li><a href="https://www.geocache.fi/" target="_blank">Geocache.fi</a></li>
              <li><a href="https://project-gc.com/" target="_blank">Project-GC</a></li>
            </ul>
          </div>
        `;
        break;

      case 'triplet':
        content.innerHTML = `
            <div class="card">
                <h1>Triplettilista</h1>
                <p>Kunnat, joista löytyy vähintään Tradi, Multi ja Mysteeri.</p>
                <div id="tripletContent">Ladataan...</div>
            </div>`;
        app.loadTripletData();
        break;

      case 'allstats':
        content.innerHTML = `
            <div class="card">
                <h1>Kaikki löydöt</h1>
                <p>Kaikki löydetyt kätkötyypit kunnittain.</p>
                <input type="text" id="statSearch" placeholder="Hae kuntaa..." 
                       style="width:100%; padding:12px; margin-bottom:15px; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:8px;">
                <div id="allStatsContent">Ladataan...</div>
            </div>`;
        app.loadAllStatsData();
        break;

      case 'summary':
        content.innerHTML = `
            <div class="card">
                <h1>Tilastoyhteenveto</h1>
                <div id="summaryContent">Ladataan...</div>
            </div>`;
        app.loadSummaryData();
        break;

      case 'generator':
        let defaultUser = '';
        if (window.app.currentUser) {
            if (window.app.currentUser.email === 'toni@kauppinen.info') {
                defaultUser = 'mikkokalevi';
            } else {
                defaultUser = window.app.currentUser.displayName || window.app.currentUser.email.split('@')[0];
            }
        }

        const currentYear = new Date().getFullYear();
        let yearOptions = '<option value="current">— Vuosi —</option>';
        for (let y = currentYear; y >= 2000; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        const months = ["Tammi","Helmi","Maalis","Huhti","Touko","Kesä","Heinä","Elo","Syys","Loka","Marras","Joulu"];
        let monthOptions = '<option value="current">— Kk —</option>';
        months.forEach((m, i) => {
            monthOptions += `<option value="${(i+1).toString().padStart(2,'0')}">${m}</option>`;
        });

        content.innerHTML = `
          <div class="card">
            <h1>Kuvageneraattori</h1>
            
            <label>Käyttäjätunnus:</label>
            <div class="input-group">
                <input type="text" id="genUser" list="friendListOptions" value="${defaultUser}" placeholder="esim. mikkokalevi" oninput="app.updateProfileLink()">
                <datalist id="friendListOptions"></datalist>
                <button class="btn-icon" onclick="app.toggleFriendManager()" title="Hallitse kavereita">⚙️</button>
            </div>
            
            <a id="gcProfileLink" href="#" target="_blank" style="display:block; margin-bottom:15px; font-size:0.9em; color:var(--accent-color); text-decoration:none;" class="hidden">
                Avaa profiili Geocaching.comissa ↗
            </a>

            <div id="friendManager" class="hidden">
                <h3>Hallitse nimimerkkejä</h3>
                <div id="friendListContainer">Ladataan...</div>
                <div class="friend-add-row">
                    <input type="text" id="newFriendName" placeholder="Uusi nimimerkki" style="margin:0;">
                    <button class="btn btn-primary" style="margin:0;" onclick="app.addFriend()">Lisää</button>
                </div>
            </div>

            <label>Kuvan tyyppi:</label>
            <select id="genType" onchange="app.handleTypeChange()">
              <option value="matrix">T/D-taulukko</option>
              <option value="kunta">Kuntakartta</option>
              <option value="year">Vuosikalenteri</option>
              <option value="ftfkunta">FTF kuntakartta</option>
              <option value="hiddenday">Jasmer</option>
              <option value="saari">Saarilöydöt</option>
            </select>

            <div id="yearSpecificFilters" class="hidden" style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px dashed var(--border-color); margin-bottom:15px;">
                <label>Sijainnin tyyppi:</label>
                <select id="genLocType" onchange="app.handleLocTypeChange()">
                    <option value="none">Ei rajoitusta</option>
                    <option value="pkunta">Paikkakunta</option>
                    <option value="mkunta">Maakunta</option>
                </select>
                
                <div style="position:relative;">
                    <div class="input-group" style="margin-top:5px;">
                        <input type="text" id="genLocValue" placeholder="Valitse tyyppi ensin" disabled>
                        <button id="regionInfoIcon" class="btn-icon hidden" onclick="app.toggleRegionList()" title="Valitse maakunta">ⓘ</button>
                        <button id="munSelectIcon" class="btn-icon hidden" onclick="app.openPaikkakuntaModal()" title="Valitse kunnat">⚙️</button>
                    </div>
                    <div id="regionListContainer" class="hidden"></div>
                </div>
            </div>

            <label>Aikarajaus:</label>
            <select id="genTimeSelect" onchange="app.toggleTimeFields()">
              <option value="ei">Ei aikarajausta</option>
              <option value="kylla">Valitse aikaväli</option>
            </select>

            <div id="timeFields" class="hidden">
              <div style="display:flex; gap:10px;">
                  <select id="genYear" style="flex:1;">${yearOptions}</select>
                  <select id="genMonth" style="flex:1;">${monthOptions}</select>
              </div>
              <label>Tai tarkka väli:</label>
              <div style="display:flex; gap:10px;">
                <input type="date" id="genStart" style="flex:1;">
                <input type="date" id="genEnd" style="flex:1;">
              </div>
            </div>

            <label>Kätkötyyppi:</label>
            <select id="genCacheType">
              <option value="">— Kaikki —</option>
              <option value="1">Traditional Cache</option>
              <option value="2">Multi-cache</option>
              <option value="3">Unknown Cache</option>
              <option value="4">Letterbox Hybrid</option>
              <option value="5">Event Cache</option>
              <option value="6">Earthcache</option>
              <option value="7">Virtual Cache</option>
              <option value="8">Webcam Cache</option>
              <option value="9">Wherigo Cache</option>
              <option value="10">Community Celebration Event</option>
              <option value="11">Mega-Event Cache</option>
              <option value="12">Cache In Trash Out Event</option>
              <option value="13">Giga-Event Cache</option>
              <option value="14">Groundspeak Block Party</option>
              <option value="98">Muut paitsi tradit</option>
              <option value="99">Kaikki event-tyypit</option>
            </select>

            <button class="btn btn-primary" onclick="app.generateStatImage()">Luo kuva</button>
          </div>

          <div id="resultArea" class="card hidden" style="text-align:center;">
             <img id="generatedImg" src="">
             <br>
             <a id="openLink" href="#" target="_blank" class="btn">Avaa isona</a>
          </div>

          <div id="paikkakuntaModal" class="modal-overlay">
            <div id="paikkakuntaSelectorModal">
                <div class="modal-header" id="modalHeaderText">Valitse maakunta</div>
                <div class="modal-content">
                    <ul id="modalRegionList"></ul>
                    <div id="modalMunicipalityListContainer" class="hidden">
                        <div class="municipality-item" style="padding:10px; background:rgba(0,0,0,0.2); margin-bottom:10px;">
                             <label><input type="checkbox" id="selectAllMunicipalities" onchange="app.toggleSelectAll(this)"> Valitse kaikki / Poista valinnat</label>
                        </div>
                        <ul id="modalMunicipalityList"></ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="modalBackButton" class="btn hidden" onclick="app.showModalRegionSelection()">Takaisin</button>
                    <button id="modalAddButton" class="btn btn-primary hidden" onclick="app.confirmMunicipalities()">Lisää valitut</button>
                    <button class="btn" onclick="app.closePaikkakuntaModal()">Sulje</button>
                </div>
            </div>
          </div>
        `;
        
        app.loadFriends();
        app.updateProfileLink();
        break;

      case 'login_view':
        content.innerHTML = `
          <div class="card" style="max-width: 400px; margin: 0 auto;">
            <h1>Kirjaudu</h1>
            <input type="email" id="email" placeholder="Sähköposti">
            <input type="password" id="password" placeholder="Salasana">
            <button class="btn btn-primary" onclick="app.handleEmailLogin()">Kirjaudu</button>
            <button class="btn" style="width:100%" onclick="app.handleRegister()">Luo uusi</button>
            <div id="loginError" class="error-msg"></div>
            <div class="divider"><span>TAI</span></div>
            <button class="btn btn-google" onclick="app.loginGoogle()">Kirjaudu Googlella</button>
          </div>
        `;
        break;

      default:
        content.innerHTML = '<div class="card"><h1>404</h1></div>';
    }
  },

  // --- TRIPLETTI LOGIIKKA (Tämä on sama toimiva versio alkuperäisestä) ---
  loadTripletData: async () => {
      const content = document.getElementById('appContent');
      if (!window.app.currentUser) return;

      try {
          const docRef = doc(db, "stats", window.app.currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists() || !docSnap.data().municipalities) {
              content.innerHTML = `
                <div class="card">
                    <h1>Kuntatilastot</h1>
                    <p>Ei tallennettuja tilastoja. Käytä tietokoneella <a href="admin.html" target="_blank" style="color:var(--accent-color)">Admin-työkalua</a> tietojen päivittämiseen.</p>
                </div>`;
              return;
          }

          const fullData = docSnap.data().municipalities;
          
          let updatedString = '-';
          if (docSnap.data().updatedAt) {
              const date = docSnap.data().updatedAt.toDate();
              updatedString = date.toLocaleString('fi-FI', { 
                  day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              });
          }

          // Renderöidään pohja
          document.getElementById('tripletContent').innerHTML = `
            <p style="font-size:0.9em; color:var(--success-color); border-bottom:1px solid var(--border-color); padding-bottom:10px;">
                   ✅ Data päivitetty: <b>${updatedString}</b>
            </p>
            
            <input type="text" id="tripletSearch" placeholder="Hae kuntaa..." 
                   style="width:100%; padding:12px; margin-bottom:15px; box-sizing:border-box; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:8px; font-size:16px;">

            <div id="tripletStatsSummary" style="display:flex; gap:10px; margin-bottom:15px;">
                </div>

            <div id="tripletResults">
                </div>`;

          // Funktio listan piirtämiseen
          const renderLists = (filterText) => {
              const filter = filterText.toLowerCase();
              const cats = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[] };
              const titles = {
                  1: "1. Ei löytöjä (0/0/0)",
                  2: "2. Vain Tradi",
                  3: "3. Vain Multi",
                  4: "4. Vain Mysteeri",
                  5: "5. Tradi + Multi",
                  6: "6. Multi + Mysteeri",
                  7: "7. Tradi + Mysteeri",
                  8: "8. Triplettikunnat (T+M+Q)"
              };

              // Suodatetaan ja lajitellaan data
              Object.keys(fullData).sort().forEach(kunta => {
                  if (kunta.toLowerCase().includes(filter)) {
                      const d = fullData[kunta];
                      const stats = d.s || [];
                      
                      const t = stats[0] || 0;
                      const m = stats[1] || 0;
                      const q = stats[3] || 0; // Mysteeri (4. sarake)

                      const itemHTML = `<li><b>${kunta}</b>: T=${t}, M=${m}, ?=${q}</li>`;

                      if(!t && !m && !q) cats[1].push(itemHTML);
                      else if(t && !m && !q) cats[2].push(itemHTML);
                      else if(!t && m && !q) cats[3].push(itemHTML);
                      else if(!t && !m && q) cats[4].push(itemHTML);
                      else if(t && m && !q) cats[5].push(itemHTML);
                      else if(!t && m && q) cats[6].push(itemHTML);
                      else if(t && !m && q) cats[7].push(itemHTML);
                      else if(t && m && q) cats[8].push(itemHTML);
                  }
              });

              // Päivitetään yläosan laatikot
              const summaryContainer = document.getElementById('tripletStatsSummary');
              if(summaryContainer) {
                  summaryContainer.innerHTML = `
                    <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                        <div style="font-size:2em; color:var(--success-color);">${cats[8].length}</div>
                        <div style="font-size:0.8em;">Triplettiä</div>
                    </div>
                    <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                        <div style="font-size:2em; color:var(--error-color);">${cats[1].length}</div>
                        <div style="font-size:0.8em;">Ei löytöjä</div>
                    </div>
                  `;
              }

              // Rakennetaan HTML
              let html = '';
              let totalShown = 0;
              for(let i=1; i<=8; i++) {
                  const count = cats[i].length;
                  totalShown += count;
                  
                  const isSearching = filter.length > 0;
                  const isOpen = (isSearching && count > 0) || (!isSearching && (i === 8 || i === 1)) ? 'open' : ''; 
                  const style = (i === 8) ? 'border-color:var(--success-color);' : '';
                  const displayStyle = (isSearching && count === 0) ? 'display:none;' : ''; 

                  html += `
                    <details ${isOpen} style="margin-bottom:10px; background:rgba(0,0,0,0.1); border-radius:8px; border:1px solid var(--border-color); ${style} ${displayStyle}">
                        <summary style="padding:10px; cursor:pointer; font-weight:bold; list-style:none;">
                            ${titles[i]} <span style="float:right; opacity:0.7;">(${count})</span>
                        </summary>
                        <div style="padding:10px; border-top:1px solid var(--border-color);">
                            <ul style="margin:0; padding-left:20px; font-size:0.9em;">
                                ${count > 0 ? cats[i].join('') : '<li style="list-style:none; opacity:0.5;">Ei kuntia.</li>'}
                            </ul>
                        </div>
                    </details>
                  `;
              }
              
              if(totalShown === 0) {
                  html = '<p style="text-align:center; opacity:0.6; margin-top:20px;">Ei hakutuloksia.</p>';
              }

              document.getElementById('tripletResults').innerHTML = html;
          };

          renderLists('');
          document.getElementById('tripletSearch').addEventListener('input', (e) => {
              renderLists(e.target.value);
          });

      } catch (e) {
          console.error(e);
          content.innerHTML = `<div class="card"><h1 style="color:var(--error-color)">Virhe</h1><p>${e.message}</p></div>`;
      }
  },

  // --- UUSI: KAIKKI LÖYDÖT (LISTA IKONEILLA) ---
  loadAllStatsData: async () => {
      if (!window.app.currentUser) return;
      try {
          const docSnap = await getDoc(doc(db, "stats", window.app.currentUser.uid));
          if (!docSnap.exists() || !docSnap.data().municipalities) {
              document.getElementById('allStatsContent').innerHTML = '<p>Ei dataa.</p>';
              return;
          }
          const data = docSnap.data().municipalities;
          
          const render = (filter) => {
              let html = '';
              const filterLow = filter.toLowerCase();
              
              Object.keys(data).sort().forEach(kunta => {
                  if (filter && !kunta.toLowerCase().includes(filterLow)) return;
                  
                  const stats = data[kunta].s || [];
                  const found = CACHE_TYPES.filter(t => stats[t.index] > 0);
                  
                  if (found.length === 0) return;

                  html += `
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:10px; margin-bottom:8px;">
                        <div style="font-weight:bold; color:var(--accent-color); margin-bottom:5px;">${kunta}</div>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">`;
                  
                  found.forEach(t => {
                      // KUVAT HAETAAN kuvat/ KANSIOSTA
                      html += `
                        <div style="display:flex; align-items:center; background:rgba(0,0,0,0.2); padding:3px 8px; border-radius:4px; font-size:0.85em;">
                            <img src="kuvat/${t.icon}" style="width:16px; height:16px; margin-right:5px;" onerror="this.style.display='none'">
                            <span>${stats[t.index]}</span>
                        </div>`;
                  });
                  html += `</div></div>`;
              });
              document.getElementById('allStatsContent').innerHTML = html;
          };

          render('');
          document.getElementById('statSearch').addEventListener('input', (e) => render(e.target.value));

      } catch (e) {
          console.error(e);
          document.getElementById('allStatsContent').innerHTML = `<p>Virhe: ${e.message}</p>`;
      }
  },

  // --- UUSI: YHTEENVETO (PROSENTIT & VÄRISUORAT) ---
  loadSummaryData: async () => {
      if (!window.app.currentUser) return;
      try {
          const docSnap = await getDoc(doc(db, "stats", window.app.currentUser.uid));
          if (!docSnap.exists() || !docSnap.data().municipalities) {
              document.getElementById('summaryContent').innerHTML = '<p>Ei dataa.</p>';
              return;
          }
          const data = docSnap.data().municipalities;

          // Lasketaan tilastot
          let totalMun = 0, foundMun = 0;
          let regionStats = {};
          let diversityList = [];

          Object.keys(data).forEach(kunta => {
              totalMun++;
              const d = data[kunta];
              const stats = d.s || [];
              
              // Onko kunnasta löydetty mitään?
              const totalFinds = stats.reduce((a,b)=>a+b, 0);
              if (totalFinds > 0) foundMun++;

              // Diversity (montako eri tyyppiä)
              let typeCount = 0;
              CACHE_TYPES.forEach(t => { if(stats[t.index] > 0) typeCount++; });
              diversityList.push({ name: kunta, count: typeCount });

              // Maakuntatilastot
              const region = d.r || "Muu";
              if (!regionStats[region]) {
                  regionStats[region] = { types: {} };
                  CACHE_TYPES.forEach(t => regionStats[region].types[t.name] = 0);
              }
              CACHE_TYPES.forEach(t => {
                  regionStats[region].types[t.name] += (stats[t.index] || 0);
              });
          });

          // Järjestetään värisuora
          diversityList.sort((a,b) => b.count - a.count);
          const percentage = totalMun > 0 ? ((foundMun / totalMun) * 100).toFixed(1) : 0;

          // Renderöinti
          let html = `
            <div style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:20px;">
                <h3>Suomen Valloitus</h3>
                <div style="font-size:2.5em; font-weight:bold; color:var(--accent-color);">${percentage}%</div>
                <div>${foundMun} / ${totalMun} kuntaa</div>
            </div>
            
            <h3>Värisuorat (Top 10)</h3>
            <ul style="list-style:none; padding:0; margin-bottom:20px;">`;

          diversityList.slice(0, 10).forEach((item, i) => {
              html += `<li style="padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between;">
                <span>${i+1}. ${item.name}</span>
                <span style="font-weight:bold; color:var(--success-color);">${item.count} tyyppiä</span>
              </li>`;
          });

          html += `</ul><h3>Maakuntien suosikit</h3><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">`;
          
          Object.keys(regionStats).sort().forEach(r => {
              // Etsi suosituin tyyppi maakunnassa
              let max = -1, winner = "-";
              Object.entries(regionStats[r].types).forEach(([t, c]) => {
                  if (c > max) { max = c; winner = t; }
              });
              
              html += `<div style="background:var(--input-bg); padding:8px; border-radius:4px; font-size:0.9em;">
                <div style="font-weight:bold;">${r}</div>
                <div style="color:var(--accent-color);">Eniten: ${winner}</div>
              </div>`;
          });
          html += `</div>`;
          
          document.getElementById('summaryContent').innerHTML = html;

      } catch (e) {
          console.error(e);
          document.getElementById('summaryContent').innerHTML = `<p>Virhe: ${e.message}</p>`;
      }
  },

  // --- KUVAGENERATOR UI LOGIIKKA (ALKUPERÄINEN JA TOIMIVA) ---

  handleTypeChange: () => {
      const type = document.getElementById('genType').value;
      const yearFilters = document.getElementById('yearSpecificFilters');
      if (type === 'year') {
          yearFilters.classList.remove('hidden');
      } else {
          yearFilters.classList.add('hidden');
          document.getElementById('genLocType').value = 'none';
          app.handleLocTypeChange();
      }
  },

  handleLocTypeChange: () => {
      const locType = document.getElementById('genLocType').value;
      const locInput = document.getElementById('genLocValue');
      const iconRegion = document.getElementById('regionInfoIcon');
      const iconMun = document.getElementById('munSelectIcon');

      locInput.disabled = true;
      iconRegion.classList.add('hidden');
      iconMun.classList.add('hidden');
      document.getElementById('regionListContainer').classList.add('hidden');

      if (locType === 'mkunta') {
          locInput.disabled = false;
          locInput.placeholder = 'Valitse maakunta ⓘ';
          iconRegion.classList.remove('hidden');
      } else if (locType === 'pkunta') {
          locInput.disabled = false;
          locInput.placeholder = 'Valitse kunnat ⚙️';
          iconMun.classList.remove('hidden');
      } else {
          locInput.value = '';
          locInput.placeholder = 'Valitse tyyppi ensin';
      }
  },

  toggleRegionList: () => {
      const container = document.getElementById('regionListContainer');
      if (!container.classList.contains('hidden')) {
          container.classList.add('hidden');
          return;
      }
      
      container.innerHTML = '';
      suomenMaakunnat.forEach(maakunta => {
          const div = document.createElement('div');
          div.textContent = maakunta;
          div.className = 'region-list-item';
          div.onclick = () => {
              const input = document.getElementById('genLocValue');
              if (input.value) input.value += `, ${maakunta}`;
              else input.value = maakunta;
              container.classList.add('hidden');
          };
          container.appendChild(div);
      });
      container.classList.remove('hidden');
  },

  openPaikkakuntaModal: () => {
      document.getElementById('paikkakuntaModal').style.display = 'flex';
      app.showModalRegionSelection();
  },

  closePaikkakuntaModal: () => {
      document.getElementById('paikkakuntaModal').style.display = 'none';
  },

  showModalRegionSelection: () => {
      document.getElementById('modalHeaderText').textContent = 'Valitse maakunta';
      document.getElementById('modalRegionList').classList.remove('hidden');
      document.getElementById('modalMunicipalityListContainer').classList.add('hidden');
      document.getElementById('modalBackButton').classList.add('hidden');
      document.getElementById('modalAddButton').classList.add('hidden');

      const ul = document.getElementById('modalRegionList');
      ul.innerHTML = '';
      suomenMaakunnat.forEach(region => {
          if (maakuntienKunnat[region]) {
              const li = document.createElement('li');
              li.textContent = region;
              li.onclick = () => app.showModalMunicipalitySelection(region);
              ul.appendChild(li);
          }
      });
  },

  showModalMunicipalitySelection: (region) => {
      document.getElementById('modalHeaderText').textContent = `Valitse kunnat (${region})`;
      document.getElementById('modalRegionList').classList.add('hidden');
      document.getElementById('modalMunicipalityListContainer').classList.remove('hidden');
      document.getElementById('modalBackButton').classList.remove('hidden');
      document.getElementById('modalAddButton').classList.remove('hidden');
      document.getElementById('selectAllMunicipalities').checked = false;

      const ul = document.getElementById('modalMunicipalityList');
      ul.innerHTML = '';
      
      const kunnat = maakuntienKunnat[region] || [];
      kunnat.forEach(kunta => {
          const li = document.createElement('li');
          li.className = 'municipality-item';
          li.innerHTML = `<label><input type="checkbox" value="${kunta}" name="mun_checkbox"> ${kunta}</label>`;
          ul.appendChild(li);
      });
  },

  toggleSelectAll: (source) => {
      const checkboxes = document.getElementsByName('mun_checkbox');
      for(let i=0; i<checkboxes.length; i++) {
          checkboxes[i].checked = source.checked;
      }
  },

  confirmMunicipalities: () => {
      const checkboxes = document.querySelectorAll('input[name="mun_checkbox"]:checked');
      const input = document.getElementById('genLocValue');
      let currentVal = input.value.split(',').map(s => s.trim()).filter(s => s);
      
      checkboxes.forEach(cb => {
          if (!currentVal.includes(cb.value)) {
              currentVal.push(cb.value);
          }
      });

      input.value = currentVal.join(',');
      app.showModalRegionSelection();
  },

  toggleFriendManager: () => document.getElementById('friendManager').classList.toggle('hidden'),
  
  updateProfileLink: () => {
      const user = document.getElementById('genUser').value;
      const link = document.getElementById('gcProfileLink');
      if(user) {
          link.href = `https://www.geocaching.com/p/?u=${encodeURIComponent(user)}`;
          link.textContent = `Avaa ${user} profiili Geocaching.comissa ↗`;
          link.classList.remove('hidden');
      } else { link.classList.add('hidden'); }
  },

  toggleTimeFields: () => {
      const val = document.getElementById('genTimeSelect').value;
      const fields = document.getElementById('timeFields');
      if(val === 'kylla') fields.classList.remove('hidden');
      else fields.classList.add('hidden');
  },

  loadFriends: async () => {
    if (!window.app.currentUser) return;
    const uid = window.app.currentUser.uid;
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        const container = document.getElementById('friendListContainer');
        const datalist = document.getElementById('friendListOptions');
        if (!container) return;
        container.innerHTML = ''; datalist.innerHTML = '';
        if (docSnap.exists() && docSnap.data().saved_usernames) {
            docSnap.data().saved_usernames.sort().forEach(name => {
                container.innerHTML += `<div class="friend-item"><span>${name}</span><button class="btn-delete" onclick="app.removeFriend('${name}')">✕</button></div>`;
                datalist.innerHTML += `<option value="${name}"></option>`;
            });
        } else { container.innerHTML = '<p style="font-size:0.9em;">Ei nimiä.</p>'; }
    } catch (e) { console.error(e); }
  },

  addFriend: async () => {
      if (!window.app.currentUser) return;
      const name = document.getElementById('newFriendName').value.trim();
      if (!name) return;
      try {
          await setDoc(doc(db, "users", window.app.currentUser.uid), { saved_usernames: arrayUnion(name) }, { merge: true });
          document.getElementById('newFriendName').value = ''; app.loadFriends();
      } catch (e) { alert(e.message); }
  },

  removeFriend: async (name) => {
      if (!window.app.currentUser || !confirm(`Poista ${name}?`)) return;
      try {
          await updateDoc(doc(db, "users", window.app.currentUser.uid), { saved_usernames: arrayRemove(name) });
          app.loadFriends();
      } catch (e) { console.error(e); }
  },

  generateStatImage: () => {
    const baseUrl = "https://www.geocache.fi/stat/";
    const user = document.getElementById("genUser").value.trim();
    const type = document.getElementById("genType").value;
    const timeMode = document.getElementById("genTimeSelect").value;
    const year = document.getElementById("genYear").value;
    const month = document.getElementById("genMonth").value;
    const start = document.getElementById("genStart").value;
    const end = document.getElementById("genEnd").value;
    const cacheType = document.getElementById("genCacheType").value;
    const locType = document.getElementById('genLocType').value;
    const locValue = document.getElementById('genLocValue').value.trim();

    if (!user) { alert("Syötä käyttäjätunnus!"); return; }

    let params = `?user=${encodeURIComponent(user)}`;
    if (type === "hiddenday") params += `&type=2`;

    if (timeMode === "kylla") {
        if (start && end) {
           params += `&startdate=${formatDate(start)}&enddate=${formatDate(end)}`;
        } else {
           if (year && year !== "current") params += `&year=${year}`;
           if (month && month !== "current") params += `&month=${month}`;
        }
    }

    if (cacheType) params += `&cachetype=${cacheType}`;

    if (type === 'year' && locType !== 'none' && locValue) {
        if (locType === 'pkunta') params += `&pkunta=${encodeURIComponent(locValue)}`;
        if (locType === 'mkunta') params += `&mkunta=${encodeURIComponent(locValue)}`;
    }

    const finalUrl = `${baseUrl}${type}.php${params}`;
    const img = document.getElementById('generatedImg');
    const link = document.getElementById('openLink');

    img.src = finalUrl;
    link.href = finalUrl;
    document.getElementById('resultArea').classList.remove('hidden');
  },

  // Auth
  loginGoogle: () => signInWithPopup(auth, provider).then(() => app.router('home')).catch(e=>alert(e.message)),
  handleEmailLogin: () => {
      const e = document.getElementById('email').value, p = document.getElementById('password').value;
      signInWithEmailAndPassword(auth, e, p).then(() => app.router('home')).catch(err => {
          document.getElementById('loginError').style.display='block'; document.getElementById('loginError').textContent=err.message;
      });
  },
  handleRegister: () => {
      const e = document.getElementById('email').value, p = document.getElementById('password').value;
      if(p.length<6) return alert("Salasana liian lyhyt");
      createUserWithEmailAndPassword(auth, e, p).then(() => { alert("Luotu!"); app.router('home'); }).catch(err => {
          document.getElementById('loginError').style.display='block'; document.getElementById('loginError').textContent=err.message;
      });
  },
  logout: () => signOut(auth).then(() => app.router('home'))
};

onAuthStateChanged(auth, (user) => {
  window.app.currentUser = user;
  const authBtn = document.getElementById('authButton');
  const logoutBtn = document.getElementById('logoutButton');
  const userDisplay = document.getElementById('userNameDisplay');
  if(authBtn) {
      if (user) {
          authBtn.classList.add('hidden'); logoutBtn.classList.remove('hidden'); userDisplay.textContent = user.displayName || user.email; userDisplay.classList.remove('hidden');
      } else {
          authBtn.classList.remove('hidden'); logoutBtn.classList.add('hidden'); userDisplay.classList.add('hidden');
      }
  }
});

document.addEventListener('DOMContentLoaded', () => { app.router('home'); });
