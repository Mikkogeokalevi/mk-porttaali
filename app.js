import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Tuodaan moduulit
import * as Auth from "./auth.js";
import * as Gen from "./generator.js";
import * as Stats from "./stats.js";

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

// Alustetaan sovellus
window.app = {
  currentUser: null,

  // --- NAVIGOINTI JA ROUTER ---
  router: (view) => {
    const content = document.getElementById('appContent');
    const nav = document.getElementById('mainNav');
    if(nav) nav.classList.remove('open'); // Sulje mobiilivalikko

    switch(view) {
      case 'home':
        content.innerHTML = `
          <div class="card">
            <h1>Tervetuloa MK Porttaaliin</h1>
            <p>Mobiiliystävällinen geokätköilytyökalupakki.</p>
            <div style="display:grid; gap:10px; margin-top:15px;">
                <button class="btn btn-primary" onclick="app.router('generator')">
                  Avaa Kuvageneraattori (Live)
                </button>
                <button class="btn" style="background-color: #a6e3a1; color:#1e1e2e; font-weight:bold;" onclick="app.router('stats')">
                  Tilastot
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

      // --- UUDET TILASTOREITIT (Kutsuu stats.js) ---
      case 'stats':
        // Avaa tilastojen päävalikon (laatikot)
        Stats.renderStatsDashboard(content, window.app);
        break;

      case 'stats_triplet':
        if (!window.app.currentUser) { app.router('login_view'); return; }
        Stats.loadTripletData(db, window.app.currentUser, content);
        break;

      case 'stats_all':
        if (!window.app.currentUser) { app.router('login_view'); return; }
        Stats.loadAllStats(db, window.app.currentUser, content);
        break;

      // --- KUVAGENERATTORI ---
      case 'generator':
        renderGeneratorView(content);
        break;

      // --- KIRJAUTUMINEN ---
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
        content.innerHTML = '<div class="card"><h1>404 - Sivua ei löydy</h1></div>';
    }
  },

  toggleMenu: () => document.getElementById('mainNav').classList.toggle('open'),

  // --- AUTH-TOIMINNOT ---
  loginGoogle: () => Auth.loginGoogle(auth, (v) => window.app.router(v)),
  logout: () => Auth.logout(auth, (v) => window.app.router(v)),
  
  handleEmailLogin: () => {
      const e = document.getElementById('email').value;
      const p = document.getElementById('password').value;
      Auth.handleEmailLogin(auth, e, p, 
        (msg) => { const d=document.getElementById('loginError'); d.style.display='block'; d.textContent=msg; }, 
        (v) => window.app.router(v)
      );
  },

  handleRegister: () => {
      const e = document.getElementById('email').value;
      const p = document.getElementById('password').value;
      Auth.handleRegister(auth, e, p,
        (msg) => { const d=document.getElementById('loginError'); d.style.display='block'; d.textContent=msg; },
        (v) => window.app.router(v)
      );
  },

  // Kaverilistan toiminnot
  loadFriends: () => Auth.loadFriends(db, window.app.currentUser?.uid, 'friendListContainer', 'friendListOptions'),
  addFriend: () => {
      const name = document.getElementById('newFriendName').value.trim();
      Auth.addFriend(db, window.app.currentUser?.uid, name, () => {
          document.getElementById('newFriendName').value = '';
          app.loadFriends();
      });
  },
  removeFriend: (name) => Auth.removeFriend(db, window.app.currentUser?.uid, name, () => app.loadFriends()),

  // --- KUVAGENERATTORIN TOIMINNOT ---
  toggleFriendManager: Gen.toggleFriendManager,
  handleTypeChange: Gen.handleTypeChange,
  handleLocTypeChange: Gen.handleLocTypeChange,
  toggleRegionList: Gen.toggleRegionList,
  openPaikkakuntaModal: Gen.openPaikkakuntaModal,
  closePaikkakuntaModal: Gen.closePaikkakuntaModal,
  showModalRegionSelection: Gen.showModalRegionSelection,
  showModalMunicipalitySelection: Gen.showModalMunicipalitySelection,
  toggleSelectAll: Gen.toggleSelectAll,
  confirmMunicipalities: Gen.confirmMunicipalities,
  updateProfileLink: Gen.updateProfileLink,
  toggleTimeFields: Gen.toggleTimeFields,
  generateStatImage: Gen.generateStatImage
};

// Generaattorin HTML (siirretty tänne selkeyden vuoksi)
function renderGeneratorView(content) {
    let defaultUser = '';
    if (window.app.currentUser) {
        // Jos tarvitset kovia koodauksia tietyille sähköposteille, ne voi tehdä tässä
        defaultUser = (window.app.currentUser.email === 'toni@kauppinen.info') ? 'mikkokalevi' : (window.app.currentUser.displayName || '');
    }

    const currentYear = new Date().getFullYear();
    let yearOptions = '<option value="current">— Vuosi —</option>';
    for (let y = currentYear; y >= 2000; y--) yearOptions += `<option value="${y}">${y}</option>`;

    const months = ["Tammi","Helmi","Maalis","Huhti","Touko","Kesä","Heinä","Elo","Syys","Loka","Marras","Joulu"];
    let monthOptions = '<option value="current">— Kk —</option>';
    months.forEach((m, i) => monthOptions += `<option value="${(i+1).toString().padStart(2,'0')}">${m}</option>`);

    content.innerHTML = `
      <div class="card">
        <h1>Kuvageneraattori</h1>
        <p style="font-size:0.8em; opacity:0.7;">Hakee kuvat suoraan Geocache.fi-palvelusta.</p>
        
        <label>Käyttäjätunnus:</label>
        <div class="input-group">
            <input type="text" id="genUser" list="friendListOptions" value="${defaultUser}" placeholder="esim. mikkokalevi" oninput="app.updateProfileLink()">
            <datalist id="friendListOptions"></datalist>
            <button class="btn-icon" onclick="app.toggleFriendManager()" title="Hallitse kavereita">⚙️</button>
        </div>
        <a id="gcProfileLink" href="#" target="_blank" style="display:block; margin-bottom:15px; font-size:0.9em; color:var(--accent-color); text-decoration:none;" class="hidden"></a>

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
            <div class="modal-header" id="modalHeaderText">
                Valitse maakunta
                <button class="btn-icon" onclick="app.closePaikkakuntaModal()">✕</button>
            </div>
            <div class="modal-content">
                <ul id="modalRegionList"></ul>
                <div id="modalMunicipalityListContainer" class="hidden">
                    <div class="municipality-item" style="padding:10px; background:rgba(0,0,0,0.2); margin-bottom:10px; border-radius:4px;">
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
}

// Käynnistetään Auth-kuuntelija ja sovellus
Auth.initAuth(auth, db, window.app);
document.addEventListener('DOMContentLoaded', () => { app.router('home'); });
