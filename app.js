import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Tuodaan moduulit
import * as Auth from "./auth.js";
import * as Gen from "./generator.js";
import * as Stats from "./stats.js";
import { renderHelp } from "./help.js";
import { renderLinksView } from "./links.js"; 
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
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Auth persistence setup failed:", error);
});
const db = getFirestore(firebaseApp);

window.app = {
  currentUser: null,
  savedNickname: null,
  savedId: null,
  friendsList: [],
  userRole: 'guest', 
  userPlan: 'free',  
  shortId: '',       
  currentView: null,
  reissuapuriEnabled: false,

  router: (view, options = {}) => {
    const { fromHash = false, replaceHash = false } = options;
    const targetView = view || 'home';

    if (!fromHash) {
        const hashValue = `#${targetView}`;
        if (replaceHash) {
            history.replaceState(null, '', hashValue);
        } else if (location.hash !== hashValue) {
            location.hash = targetView;
        }
    }

    if (window.app.currentView) {
        const scrollValue = String(window.scrollY || 0);
        sessionStorage.setItem(`mk_scroll_${window.app.currentView}`, scrollValue);
        localStorage.setItem(`mk_scroll_${window.app.currentView}`, scrollValue);
    }

    sessionStorage.setItem('mk_last_view', targetView);
    localStorage.setItem('mk_last_view', targetView);

    // SULJE VALIKKO AUTOMAATTISESTI MOBIILISSA
    const nav = document.getElementById('mainNav');
    if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
    }

    const content = document.getElementById('appContent');
    const protectedViews = ['stats', 'stats_triplet', 'stats_map', 'stats_map_all', 'stats_all', 'stats_top', 'stats_external', 'admin', 'generator', 'settings', 'converters', 'links', 'reissuapuri'];
    
    if (protectedViews.includes(targetView) && !window.app.currentUser) {
        sessionStorage.setItem('mk_post_login_view', targetView);
        window.app.router('login_view', { replaceHash: true });
        return;
    }

    // YHTEINEN TYYLI LOGOLLE (App Icon -tyyli: pyöristys + varjo)
    const logoStyle = "height: 120px; width: auto; border-radius: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); margin-bottom: 15px;";

    switch(targetView) {
      case 'home':
        // GUEST VIEW (KIRJAUTUMATON)
        if (!window.app.currentUser) {
            content.innerHTML = `
              <div class="card" style="text-align:center; padding: 40px 20px;">
                <img src="mklogo.png" alt="MK Porttaali" style="${logoStyle}">
                <div style="font-size:3em; margin: 10px 0;">🔐</div>
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

        // LOGGED IN VIEW (KIRJAUTUNUT)
        let adminButton = '';
        if (window.app.userRole === 'admin') {
            adminButton = `
                <button class="btn" style="background-color:#f38ba8; color:#1e1e2e; font-weight:bold;" onclick="app.router('admin')">🔧 Ylläpito</button>
            `;
        }

        let reissuapuriButton = '';
        if (window.app.userRole === 'admin' || window.app.reissuapuriEnabled) {
            reissuapuriButton = `<button class="btn" style="background-color:#94e2d5; color:#1e1e2e; font-weight:bold;" onclick="app.router('reissuapuri')">🧭 Reissuapuri</button>`;
        }
        
        let statusBadge = '';
        if (window.app.userRole === 'admin') statusBadge = '<div style="background:#cba6f7; color:#1e1e2e; padding:4px 8px; border-radius:4px; font-size:0.8em; font-weight:bold; display:inline-block; margin-top:5px;">ADMIN</div>';
        else if (window.app.userPlan === 'premium') statusBadge = '<div style="background:#fab387; color:#1e1e2e; padding:4px 8px; border-radius:4px; font-size:0.8em; font-weight:bold; display:inline-block; margin-top:5px;">PREMIUM</div>';

        content.innerHTML = `
          <div class="card">
            <div style="text-align:center; padding: 10px 0 20px 0;">
                <img src="mklogo.png" alt="MK Porttaali" style="${logoStyle}">
                <br>
                ${statusBadge}
            </div>
            
            <div style="display:grid; gap:10px; margin-top:15px;">
                <button class="btn btn-primary" onclick="app.router('generator')">Avaa Kuvageneraattori</button>
                <button class="btn" style="background-color: #a6e3a1; color:#1e1e2e; font-weight:bold;" onclick="app.router('stats')">Tilastot ${window.app.userPlan === 'free' && window.app.userRole !== 'admin' ? '🔒' : ''}</button>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn" style="background-color: #fab387; color:#1e1e2e; font-weight:bold;" onclick="app.router('converters')">Muuntimet ${window.app.userPlan === 'free' && window.app.userRole !== 'admin' ? '🔒' : '↗'}</button>
                    <button class="btn" style="background-color: #89dceb; color:#1e1e2e; font-weight:bold;" onclick="app.router('links')">Linkkikirjasto 🌐</button>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn" style="background-color: #89b4fa; color:#1e1e2e; font-weight:bold;" onclick="app.router('settings')">⚙️ Asetukset</button>
                    <button class="btn" style="background-color: #cba6f7; color:#1e1e2e; font-weight:bold;" onclick="app.router('help')">Ohjeet & Tuki</button>
                </div>
                ${reissuapuriButton}
                ${adminButton}
            </div>
          </div>
        `;
        break;

      case 'settings': renderSettingsView(content, db, window.app.currentUser, window.app); break;
      case 'admin': renderAdminView(content, db, window.app.currentUser); break;
      case 'reissuapuri':
        if (!(window.app.userRole === 'admin' || window.app.reissuapuriEnabled)) { app.router('home'); break; }
        content.innerHTML = `
          <div class="card" style="padding:0; overflow:hidden;">
            <iframe src="reissuapuri.html" title="MK Reissuapuri" style="width:100%; height:90vh; border:0;"></iframe>
          </div>
        `;
        break;
      case 'locked_view': content.innerHTML = `<div class="card" style="text-align:center;"><h1 style="color:#fab387;">⏳ Odottaa hyväksyntää</h1><button class="btn" onclick="app.logout()">Kirjaudu ulos</button></div>`; break;

      case 'stats': if (checkPremium(content)) Stats.renderStatsDashboard(content, window.app); break;
      case 'stats_triplet': if (checkPremium(content)) Stats.loadTripletData(db, window.app.currentUser, content); break;
      case 'stats_map': if (checkPremium(content)) MapView.renderTripletMap(content, db, window.app.currentUser, window.app); break;
      case 'stats_map_all': if (checkPremium(content)) MapAllView.renderAllFindsMap(content, db, window.app.currentUser, window.app); break;
      case 'stats_all': if (checkPremium(content)) Stats.loadAllStats(db, window.app.currentUser, content); break;
      case 'stats_top': if (checkPremium(content)) Stats.loadTopStats(db, window.app.currentUser, content); break;
      case 'stats_external': if (checkPremium(content)) Stats.loadExternalStats(content); break;
      
      case 'converters': 
        if (checkPremium(content)) {
            window.location.href = 'muuntimet.html';
        }
        break;

      case 'links':
        renderLinksView(content); 
        break;

      case 'generator': renderGeneratorView(content); break;
      case 'help': renderHelp(content, window.app); break;

      case 'login_view':
        content.innerHTML = `
          <div class="card" style="max-width: 400px; margin: 0 auto; text-align: center;">
            <img src="mklogo.png" alt="MK Porttaali" style="${logoStyle} margin-top:10px;">
            <h1 id="authTitle" style="margin-bottom:20px;">Kirjaudu</h1>
            
            <div style="text-align:left;">
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
          </div>
        `;
        break;

      default: content.innerHTML = '<div class="card"><h1>404</h1></div>';
    }

    window.app.currentView = targetView;
    const storedScroll = sessionStorage.getItem(`mk_scroll_${targetView}`) || localStorage.getItem(`mk_scroll_${targetView}`);
    if (storedScroll !== null) {
        requestAnimationFrame(() => window.scrollTo(0, parseInt(storedScroll, 10) || 0));
    } else {
        window.scrollTo(0, 0);
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
  generateStatImage: Gen.generateStatImage,
  initGeneratorAccordions: Gen.initGeneratorAccordions
};

// --- UUSITTU PREMIUM-MARKKINOINTISIVU ---
function checkPremium(content) {
    if (window.app.userPlan === 'premium' || window.app.userRole === 'admin') return true;
    const idCode = window.app.shortId || "VIRHE";
    const nick = window.app.savedNickname || "Nimetön";

    content.innerHTML = `
        <div class="card" style="text-align:center; padding:30px 20px;">
            <div style="font-size:3.5em; margin-bottom:10px; filter: drop-shadow(0 0 10px rgba(250, 179, 135, 0.3));">💎</div>
            <h2 style="color:#fab387; margin-top:0;">Premium-ominaisuus</h2>
            <p style="opacity:0.8; margin-bottom:25px;">Tämä toiminto vaatii aktiivisen Premium-tilauksen.</p>
            
            <div style="text-align:left; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; margin-bottom:20px;">
                <strong style="display:block; margin-bottom:10px; color:#cdd6f4;">Mitä saat Premiumilla?</strong>
                <ul style="margin:0; padding-left:20px; line-height:1.6; color:#a6adc8;">
                    <li>🗺️ <strong>Interaktiiviset kartat</strong> (Tripletti, kunnat)</li>
                    <li>📊 <strong>Tarkat tilastot</strong> (Top-listat, puutteet)</li>
                    <li>🧮 <strong>Laajat koordinaattimuuntimet</strong></li>
                    <li>💾 <strong>Omien löytöjen tuonti</strong></li>
                </ul>
            </div>

            <h3 style="margin-bottom:10px;">Hinnasto</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px;">
                <div style="background:#313244; padding:10px; border-radius:6px; border:1px solid #94e2d5;">
                    <div style="font-weight:bold; color:#94e2d5;">1 VKO</div>
                    <div style="font-size:1.2em;">1 €</div>
                    <div style="font-size:0.7em; opacity:0.6;">Koodi: T-1VK</div>
                </div>
                <div style="background:#313244; padding:10px; border-radius:6px; border:1px solid #89dceb;">
                    <div style="font-weight:bold; color:#89dceb;">1 KK</div>
                    <div style="font-size:1.2em;">2 €</div>
                    <div style="font-size:0.7em; opacity:0.6;">Koodi: T-1KK</div>
                </div>
                <div style="background:#313244; padding:10px; border-radius:6px; border:1px solid #89b4fa;">
                    <div style="font-weight:bold; color:#89b4fa;">3 KK</div>
                    <div style="font-size:1.2em;">3 €</div>
                    <div style="font-size:0.7em; opacity:0.6;">Koodi: T-3KK</div>
                </div>
                <div style="background:#313244; padding:10px; border-radius:6px; border:1px solid #a6e3a1;">
                    <div style="font-weight:bold; color:#a6e3a1;">6 KK</div>
                    <div style="font-size:1.2em;">5 €</div>
                    <div style="font-size:0.7em; opacity:0.6;">Koodi: T-6KK</div>
                </div>
                <div style="background:#313244; padding:10px; border-radius:6px; border:1px solid #fab387;">
                    <div style="font-weight:bold; color:#fab387;">12 KK (Vuosi)</div>
                    <div style="font-size:1.2em;">10 €</div>
                    <div style="font-size:0.7em; opacity:0.6;">Koodi: T-1V</div>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; margin:20px 0; border:1px dashed #fab387;">
                <p style="margin:0 0 10px 0; font-size:0.9em; opacity:0.8;">Maksa MobilePaylla ja kirjoita viestiin:</p>
                <div style="background:#181825; padding:10px; border-radius:4px; font-family:monospace; font-size:1.1em; color:#fab387;">
                    ${nick} ${idCode} [TUOTEKOODI]
                </div>
                <p style="margin:5px 0 0 0; font-size:0.8em; opacity:0.5;">Esim: ${nick} ${idCode} T-1V</p>
            </div>
            <p style="font-size:0.85em; opacity:0.7; margin-top:5px;">MK Porttaali on harrasteprojekti ja tarjotaan sellaisena kuin se on. Toimivuutta ei taata, ja palvelu voi muuttua, olla tilapäisesti pois käytöstä tai päättyä kokonaan ilman ennakkoilmoitusta. Premium-maksut ovat vapaaehtoinen tuki projektille, eikä maksuja palauteta.</p>
            
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
        <div class="gen-accordion-field">
          <select id="genType" onchange="app.handleTypeChange()">
            <option value="matrix">T/D-taulukko</option>
            <option value="kunta">Kuntakartta</option>
            <option value="year">Vuosikalenteri</option>
            <option value="ftfkunta">FTF kuntakartta</option>
            <option value="hiddenday">Jasmer</option>
            <option value="saari">Saarilöydöt</option>
          </select>
          <div class="gen-accordion" data-select="genType">
            <button type="button" class="gen-accordion-toggle">
              <span class="gen-accordion-label">Valitse</span>
              <span class="gen-accordion-caret">▾</span>
            </button>
            <div class="gen-accordion-panel">
              <ul class="gen-accordion-options"></ul>
            </div>
          </div>
        </div>
        
        <div id="yearSpecificFilters" class="hidden" style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px dashed var(--border-color); margin-bottom:15px;">
            <label>Sijainnin tyyppi:</label>
            <div class="gen-accordion-field">
              <select id="genLocType" onchange="app.handleLocTypeChange()">
                  <option value="none">Ei rajoitusta</option>
                  <option value="pkunta">Paikkakunta</option>
                  <option value="mkunta">Maakunta</option>
              </select>
              <div class="gen-accordion" data-select="genLocType">
                <button type="button" class="gen-accordion-toggle">
                  <span class="gen-accordion-label">Valitse</span>
                  <span class="gen-accordion-caret">▾</span>
                </button>
                <div class="gen-accordion-panel">
                  <ul class="gen-accordion-options"></ul>
                </div>
              </div>
            </div>
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
        <div class="gen-accordion-field">
          <select id="genTimeSelect" onchange="app.toggleTimeFields()">
            <option value="ei">Ei aikarajausta</option>
            <option value="kylla">Valitse aikaväli</option>
          </select>
          <div class="gen-accordion" data-select="genTimeSelect">
            <button type="button" class="gen-accordion-toggle">
              <span class="gen-accordion-label">Valitse</span>
              <span class="gen-accordion-caret">▾</span>
            </button>
            <div class="gen-accordion-panel">
              <ul class="gen-accordion-options"></ul>
            </div>
          </div>
        </div>

        <div id="timeFields" class="hidden">
          <div class="gen-accordion-row">
              <div class="gen-accordion-field">
                <select id="genYear">${yearOptions}</select>
                <div class="gen-accordion" data-select="genYear">
                  <button type="button" class="gen-accordion-toggle">
                    <span class="gen-accordion-label">— Vuosi —</span>
                    <span class="gen-accordion-caret">▾</span>
                  </button>
                  <div class="gen-accordion-panel">
                    <ul class="gen-accordion-options"></ul>
                  </div>
                </div>
              </div>
              <div class="gen-accordion-field">
                <select id="genMonth">${monthOptions}</select>
                <div class="gen-accordion" data-select="genMonth">
                  <button type="button" class="gen-accordion-toggle">
                    <span class="gen-accordion-label">— Kk —</span>
                    <span class="gen-accordion-caret">▾</span>
                  </button>
                  <div class="gen-accordion-panel">
                    <ul class="gen-accordion-options"></ul>
                  </div>
                </div>
              </div>
          </div>
          <label>Tai tarkka väli:</label>
          <div style="display:flex; gap:10px;">
            <input type="date" id="genStart" style="flex:1;">
            <input type="date" id="genEnd" style="flex:1;">
          </div>
        </div>

        <label>Kätkötyyppi:</label>
        <div class="gen-accordion-field">
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
          <div class="gen-accordion" data-select="genCacheType">
            <button type="button" class="gen-accordion-toggle">
              <span class="gen-accordion-label">— Kaikki —</span>
              <span class="gen-accordion-caret">▾</span>
            </button>
            <div class="gen-accordion-panel">
              <ul class="gen-accordion-options"></ul>
            </div>
          </div>
        </div>

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

      <div id="genTypeModal" class="modal-overlay">
        <div class="gen-type-sheet">
            <div class="modal-header">
                Valitse kuvan tyyppi
                <button class="btn-icon" id="genTypeClose" type="button">✕</button>
            </div>
            <div class="modal-content">
                <ul id="genTypeOptions" class="gen-type-options"></ul>
            </div>
        </div>
      </div>
    `;
    
    app.loadFriends();
    app.updateProfileLink();
    app.initGeneratorAccordions();
}

Auth.initAuth(auth, db, window.app);
document.addEventListener('DOMContentLoaded', () => {
    const hashView = window.location.hash.replace('#', '');
    const storedView = sessionStorage.getItem('mk_last_view') || localStorage.getItem('mk_last_view');
    if (hashView) {
        app.router(hashView, { fromHash: true });
    } else if (storedView) {
        app.router(storedView, { replaceHash: true });
    } else {
        app.router('home', { replaceHash: true });
    }
});

window.addEventListener('hashchange', () => {
    const view = window.location.hash.replace('#', '');
    if (!view) {
        history.replaceState(null, '', '#home');
        app.router('home', { fromHash: true });
        return;
    }
    app.router(view, { fromHash: true });
});
