import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Tuodaan moduulit
import * as Auth from "./auth.js";
import * as Gen from "./generator.js";
import * as Stats from "./stats.js";
import { renderHelp } from "./help.js";
import * as MapView from "./map.js";
import * as MapAllView from "./map_all.js";
import { renderAdminView } from "./admin.js";
import { renderSettingsView } from "./settings.js"; 

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

window.app = {
  currentUser: null,
  savedNickname: null,
  savedId: null,
  friendsList: [],
  userRole: 'guest', 
  userPlan: 'free',  
  shortId: '',       

  router: (view) => {
    // SULJE VALIKKO AUTOMAATTISESTI MOBIILISSA
    const nav = document.getElementById('mainNav');
    if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
    }

    const content = document.getElementById('appContent');
    const protectedViews = ['stats', 'stats_triplet', 'stats_map', 'stats_map_all', 'stats_all', 'stats_top', 'stats_external', 'admin', 'generator', 'settings'];
    
    if (protectedViews.includes(view) && !window.app.currentUser) {
        window.app.router('login_view');
        return;
    }

    switch(view) {
      case 'home':
        if (!window.app.currentUser) {
            content.innerHTML = `
              <div class="card" style="text-align:center; padding: 40px 20px;">
                <div style="font-size:3em; margin-bottom:10px;">🔐</div>
                <h1>MK Porttaali</h1>
                <p>Kirjaudu sisään käyttääksesi työkaluja.</p>
                <div style="margin-top:30px;">
                    <button class="btn btn-primary" onclick="app.router('login_view')">Kirjaudu sisään</button>
                    <p style="margin-top:15px; font-size:0.9em; opacity:0.7;">tai</p>
                    <button class="btn" onclick="app.router('login_view')">Luo uusi tunnus</button>
                </div>
              </div>
            `;
            return;
        }

        let adminButton = '';
        if (window.app.userRole === 'admin') {
            adminButton = `<button class="btn" style="background-color:#f38ba8; color:#1e1e2e; font-weight:bold;" onclick="app.router('admin')">🔧 Ylläpito</button>`;
        }
        
        // --- PÄIVITETTY BADGE-LOGIIKKA (Admin > Premium) ---
        let statusBadge = '';
        if (window.app.userRole === 'admin') {
            statusBadge = '<span style="background:#cba6f7; color:#1e1e2e; padding:2px 6px; border-radius:4px; font-size:0.7em; font-weight:bold; margin-left:5px; vertical-align:middle;">ADMIN</span>';
        } else if (window.app.userPlan === 'premium') {
            statusBadge = '<span style="background:#fab387; color:#1e1e2e; padding:2px 6px; border-radius:4px; font-size:0.7em; font-weight:bold; margin-left:5px; vertical-align:middle;">PREMIUM</span>';
        }

        content.innerHTML = `
          <div class="card">
            <h1>MK Porttaali v2.6 ${statusBadge}</h1>
            <div style="display:grid; gap:10px; margin-top:15px;">
                <button class="btn btn-primary" onclick="app.router('generator')">Avaa Kuvageneraattori</button>
                <button class="btn" style="background-color: #a6e3a1; color:#1e1e2e; font-weight:bold;" onclick="app.router('stats')">Tilastot ${window.app.userPlan === 'free' && window.app.userRole !== 'admin' ? '🔒' : ''}</button>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <a href="muuntimet.html" class="btn" style="background-color: #fab387; color:#1e1e2e; font-weight:bold; text-decoration:none; display:flex; align-items:center; justify-content:center;">Muuntimet ↗</a>
                    <button class="btn" style="background-color: #89b4fa; color:#1e1e2e; font-weight:bold;" onclick="app.router('settings')">⚙️ Asetukset</button>
                </div>
                <button class="btn" style="background-color: #cba6f7; color:#1e1e2e; font-weight:bold;" onclick="app.router('help')">Ohjeet</button>
                ${adminButton}
            </div>
          </div>
        `;
        break;

      case 'settings': renderSettingsView(content, db, window.app.currentUser, window.app); break;
      case 'admin': renderAdminView(content, db, window.app.currentUser); break;
      case 'locked_view': content.innerHTML = `<div class="card" style="text-align:center;"><h1 style="color:#fab387;">⏳ Odottaa hyväksyntää</h1><button class="btn" onclick="app.logout()">Kirjaudu ulos</button></div>`; break;

      case 'stats': if (checkPremium(content)) Stats.renderStatsDashboard(content, window.app); break;
      case 'stats_triplet': if (checkPremium(content)) Stats.loadTripletData(db, window.app.currentUser, content); break;
      case 'stats_map': if (checkPremium(content)) MapView.renderTripletMap(content, db, window.app.currentUser, window.app); break;
      case 'stats_map_all': if (checkPremium(content)) MapAllView.renderAllFindsMap(content, db, window.app.currentUser, window.app); break;
      case 'stats_all': if (checkPremium(content)) Stats.loadAllStats(db, window.app.currentUser, content); break;
      case 'stats_top': if (checkPremium(content)) Stats.loadTopStats(db, window.app.currentUser, content); break;
      case 'stats_external': if (checkPremium(content)) Stats.loadExternalStats(content); break;

      case 'generator': renderGeneratorView(content); break;
      case 'help': renderHelp(content, window.app); break;

      case 'login_view':
        content.innerHTML = `
          <div class="card" style="max-width: 400px; margin: 0 auto;">
            <h1 id="authTitle">Kirjaudu</h1>
            <input type="email" id="email" placeholder="Sähköposti" style="margin-bottom:10px;">
            <input type="password" id="password" placeholder="Salasana" style="margin-bottom:10px;">
            <div id="registerFields" class="hidden">
                <input type="text" id="regNick" placeholder="Nimimerkki" style="margin-bottom:10px; border-color:var(--accent-color);">
            </div>
            <button id="btnLogin" class="btn btn-primary" onclick="app.handleEmailLogin()">Kirjaudu sisään</button>
            <button id="btnRegister" class="btn hidden" style="background-color:#a6e3a1; color:#1e1e2e;" onclick="app.handleRegister()">Luo uusi tili</button>
            <div id="loginError" class="error-msg"></div>
            <div class="divider"><span>TAI</span></div>
            <button class="btn btn-google" onclick="app.loginGoogle()">Kirjaudu Googlella</button>
            <p style="text-align:center; margin-top:20px; font-size:0.9em;">
                <span id="toggleText">Eikö sinulla ole tiliä?</span> 
                <a href="#" onclick="app.toggleAuthMode()" style="color:var(--accent-color); font-weight:bold;"><span id="toggleLink">Rekisteröidy tästä</span></a>
            </p>
          </div>
        `;
        break;

      default: content.innerHTML = '<div class="card"><h1>404</h1></div>';
    }
  },

  toggleAuthMode: () => {
      const isLogin = !document.getElementById('registerFields').classList.contains('hidden');
      if (isLogin) {
          document.getElementById('authTitle').textContent = "Kirjaudu";
          document.getElementById('registerFields').classList.add('hidden');
          document.getElementById('btnLogin').classList.remove('hidden');
          document.getElementById('btnRegister').classList.add('hidden');
          document.getElementById('toggleText').textContent = "Eikö sinulla ole tiliä?";
          document.getElementById('toggleLink').textContent = "Rekisteröidy tästä";
      } else {
          document.getElementById('authTitle').textContent = "Luo uusi tili";
          document.getElementById('registerFields').classList.remove('hidden');
          document.getElementById('btnLogin').classList.add('hidden');
          document.getElementById('btnRegister').classList.remove('hidden');
          document.getElementById('toggleText').textContent = "Onko sinulla jo tili?";
          document.getElementById('toggleLink').textContent = "Kirjaudu sisään";
      }
  },
  
  toggleMenu: () => document.getElementById('mainNav').classList.toggle('open'),
  loginGoogle: () => Auth.loginGoogle(auth, (v) => window.app.router(v)),
  logout: () => Auth.logout(auth, (v) => window.app.router(v)),
  handleEmailLogin: () => {
      const e = document.getElementById('email').value;
      const p = document.getElementById('password').value;
      Auth.handleEmailLogin(auth, e, p, (msg) => { const d=document.getElementById('loginError'); d.style.display='block'; d.textContent=msg; }, (v) => window.app.router(v));
  },
  handleRegister: () => {
      const e = document.getElementById('email').value;
      const p = document.getElementById('password').value;
      const n = document.getElementById('regNick').value;
      if(!e || !p) { alert("Täytä sähköposti ja salasana!"); return; }
      if(!n) { alert("Anna nimimerkki!"); return; }
      Auth.handleRegister(auth, db, e, p, n, (v) => window.app.router(v));
  },
  deleteMyAccount: () => Auth.deleteMyAccount(auth, db),
  saveNickname: () => { /* Vanha */ },
  
  loadFriends: () => Auth.loadFriends(db, window.app.currentUser?.uid, 'friendListContainer', 'friendSelect'),
  addFriend: () => {
      const name = document.getElementById('newFriendName').value.trim();
      const id = document.getElementById('newFriendId').value.trim();
      Auth.addFriend(db, window.app.currentUser?.uid, name, id, () => {
          document.getElementById('newFriendName').value = ''; document.getElementById('newFriendId').value = ''; app.loadFriends();
      });
  },
  removeFriend: (name) => Auth.removeFriend(db, window.app.currentUser?.uid, name, () => app.loadFriends()),

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

function checkPremium(content) {
    if (window.app.userPlan === 'premium' || window.app.userRole === 'admin') return true;
    const idCode = window.app.shortId || "VIRHE";
    content.innerHTML = `
        <div class="card" style="text-align:center; padding:40px 20px;">
            <div style="font-size:3em; margin-bottom:10px;">💎</div>
            <h2>Premium-ominaisuus</h2>
            <p>Tilastot ja kartat vaativat aktiivisen Premium-tilauksen.</p>
            <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:10px; margin:20px 0; border:1px dashed #fab387;">
                <p style="margin:0; font-size:0.9em; opacity:0.8;">Sinun MK-tunnuksesi:</p>
                <h3 style="margin:5px 0; letter-spacing:2px; color:#fab387; font-size:1.5em;">${idCode}</h3>
            </div>
            <p style="font-size:0.9em;">Maksa MobilePaylla ja kirjoita viestiin koodisi <strong>${idCode}</strong>.</p>
            <button class="btn" onclick="app.router('home')">⬅ Palaa etusivulle</button>
        </div>
    `;
    return false;
}

function renderGeneratorView(content) {
    let defaultUser = '';
    if (window.app.currentUser) {
        if (window.app.savedNickname) defaultUser = window.app.savedNickname;
        else if (window.app.currentUser.email === 'toni@kauppinen.info') defaultUser = 'mikkokalevi';
        else defaultUser = window.app.currentUser.displayName || '';
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
        
        <select id="friendSelect" style="width:100%; margin-bottom:5px; padding:8px; background:#313244; color:#fff; border:1px solid #45475a; border-radius:4px; display:none;" onchange="if(this.value) document.getElementById('genUser').value = this.value">
            <option value="">-- Valitse tallennettu kaveri --</option>
        </select>

        <div class="input-group">
            <input type="text" id="genUser" value="${defaultUser}" placeholder="esim. mikkokalevi" oninput="app.updateProfileLink()" autocomplete="off">
        </div>
        <a id="gcProfileLink" href="#" target="_blank" style="display:block; margin-bottom:15px; font-size:0.9em; color:var(--accent-color); text-decoration:none;" class="hidden"></a>

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

Auth.initAuth(auth, db, window.app);
document.addEventListener('DOMContentLoaded', () => { app.router('home'); });
