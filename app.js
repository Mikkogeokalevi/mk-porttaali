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

// MÄÄRITELLÄÄN KÄTKÖTYYPIT TÄSSÄ (Ei erillistä tiedostoa)
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
    { index: 11, name: "Mega", icon: "mega.png" }
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

    // Tarkistetaan kirjautuminen suojatuille sivuille
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
                  🏆 Triplettilista
                </button>
                <button class="btn" style="background-color: #a6e3a1; color:#1e1e2e; font-weight:bold;" onclick="app.router('allstats')">
                  📋 Kaikki löydöt
                </button>
                <button class="btn" style="background-color: #fab387; color:#1e1e2e; font-weight:bold;" onclick="app.router('summary')">
                  📊 Yhteenveto & Kartat
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
        // --- TÄMÄ ON SE VANHA TOIMIVA GENERAATTORI ---
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

  // --- 1. TRIPLET LISTA (SE TOIMIVA LOGIIKKA + HAKU) ---
  loadTripletData: async () => {
      const content = document.getElementById('appContent');
      if (!window.app.currentUser) return;

      try {
          const docRef = doc(db, "stats", window.app.currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists() || !docSnap.data().municipalities) {
              document.getElementById('tripletContent').innerHTML = '<p>Ei dataa. Käytä Admin-työkalua.</p>';
              return;
          }

          const fullData = docSnap.data().municipalities;
          let updatedString = '-';
          if (docSnap.data().updatedAt) {
              updatedString = docSnap.data().updatedAt.toDate().toLocaleDateString('fi-FI');
          }

          // Renderöidään pohja (haku + listalaatikko)
          document.getElementById('tripletContent').innerHTML = `
            <p style="font-size:0.9em; color:var(--success-color); border-bottom:1px solid var(--border-color); padding-bottom:10px;">
               ✅ Data päivitetty: <b>${updatedString}</b>
            </p>
            <input type="text" id="tripletSearch" placeholder="Hae kuntaa..." 
                   style="width:100%; padding:12px; margin-bottom:15px; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:8px; font-size:16px;">
            <div id="tripletResults"></div>
          `;

          // Funktio listan piirtämiseen
          const renderList = (filterText) => {
              const filter = filterText.toLowerCase();
              const triplets = [];

              // Etsitään tripletit
              Object.keys(fullData).sort().forEach(kunta => {
                  if (kunta.toLowerCase().includes(filter)) {
                      const stats = fullData[kunta].s || [];
                      // Tripletti ehto: Tradi(0)>0, Multi(1)>0, Mysse(3)>0
                      if (stats[0] > 0 && stats[1] > 0 && stats[3] > 0) {
                          triplets.push(kunta);
                      }
                  }
              });

              let html = `<p>Löydetty: <b>${triplets.length}</b> kpl</p>`;
              html += `<div style="display:flex; flex-wrap:wrap; gap:8px;">`;
              triplets.forEach(kunta => {
                  html += `<span style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px; font-size:0.95em;">${kunta}</span>`;
              });
              html += `</div>`;
              document.getElementById('tripletResults').innerHTML = html;
          };

          renderList('');
          document.getElementById('tripletSearch').addEventListener('input', (e) => renderList(e.target.value));

      } catch (e) {
          console.error(e);
          document.getElementById('tripletContent').innerHTML = `<p>Virhe: ${e.message}</p>`;
      }
  },

  // --- 2. KAIKKI LÖYDÖT (IKONEILLA) ---
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
                  // Etsitään löydetyt tyypit
                  const found = CACHE_TYPES.filter(t => stats[t.index] > 0);
                  
                  if (found.length === 0) return;

                  html += `
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:10px; margin-bottom:8px;">
                        <div style="font-weight:bold; color:var(--accent-color); margin-bottom:5px;">${kunta}</div>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">`;
                  
                  found.forEach(t => {
                      // KUVAT KANSIOSTA kuvat/
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

  // --- 3. YHTEENVETO (STATS & REGIONS) ---
  loadSummaryData: async () => {
      if (!window.app.currentUser) return;
      try {
          const docSnap = await getDoc(doc(db, "stats", window.app.currentUser.uid));
          if (!docSnap.exists() || !docSnap.data().municipalities) {
              document.getElementById('summaryContent').innerHTML = '<p>Ei dataa.</p>';
              return;
          }
          const data = docSnap.data().municipalities;

          // Lasketaan tilastot tässä (ei erillistä helperiä)
          let totalMun = 0, foundMun = 0;
          let regionStats = {};
          let diversityList = [];

          Object.keys(data).forEach(kunta => {
              totalMun++;
              const d = data[kunta];
              const stats = d.s || [];
              const totalFinds = stats.reduce((a,b)=>a+b, 0);
              if (totalFinds > 0) foundMun++;

              // Diversity (montako eri tyyppiä)
              let typeCount = 0;
              CACHE_TYPES.forEach(t => { if(stats[t.index] > 0) typeCount++; });
              diversityList.push({ name: kunta, count: typeCount });

              // Maakunnat
              const region = d.r || "Muu";
              if (!regionStats[region]) {
                  regionStats[region] = { types: {} };
                  CACHE_TYPES.forEach(t => regionStats[region].types[t.name] = 0);
              }
              CACHE_TYPES.forEach(t => {
                  regionStats[region].types[t.name] += (stats[t.index] || 0);
              });
          });

          // Järjestetään diversity
          diversityList.sort((a,b) => b.count - a.count);
          const percentage = totalMun > 0 ? ((foundMun / totalMun) * 100).toFixed(1) : 0;

          // Renderöinti
          let html = `
            <div style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:20px;">
                <h3>Suomen Valloitus</h3>
                <div style="font-size:2.5em; font-weight:bold; color:var(--accent-color);">${percentage}%</div>
                <div>${foundMun} / ${totalMun} kuntaa</div>
            </div>
            
            <h3>Värisuorat (Top 5)</h3>
            <ul style="list-style:none; padding:0; margin-bottom:20px;">`;

          diversityList.slice(0, 5).forEach((item, i
