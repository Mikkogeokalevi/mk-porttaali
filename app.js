import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Tuodaan moduulit
import * as Auth from "./auth.js";
import * as Gen from "./generator.js";
import * as Stats from "./stats.js";
import { renderHelp } from "./help.js";
import { renderLinksView } from "./links.js"; 
import { renderConvertersView } from "./converters.js";
import * as MapView from "./map.js";
import * as MapAllView from "./map_all.js";
import * as MapCountriesView from "./map_countries.js";
import * as FindsQuery from "./findsQuery.js";
import { renderAdminView } from "./admin.js";
import { renderSettingsView } from "./settings.js"; 

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyDxDmo274iZuwufe4meobYPoablUNinZGY",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "mk-porttaali.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "mk-porttaali",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "mk-porttaali.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "220899819334",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:220899819334:web:6662b7b1519f4c89c32f47"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Auth persistence setup failed:", error);
});
const db = getFirestore(firebaseApp);

const APP_VERSION = 'v75';
const APP_DISPLAY_VERSION = '2.15.5';
const APP_SW_CACHE = 'mk-porttaali-v75';
const APP_UPDATED_AT = '27.9.2026';

document.title = `MK Porttaali v${APP_DISPLAY_VERSION}`;

window.app = {
  db,
  currentUser: null,
  savedNickname: null,
  savedId: null,
  friendsList: [],
  userRole: 'guest', 
  userPlan: 'free',  
  shortId: '',       
  currentView: null,
  reissuapuriEnabled: false,
  previewAs: null, // Admin-esikatselu: { nickname, role, plan, reissuapuriEnabled }

  // Esikatselun huomioivat oikeustarkistukset
  effRole: () => window.app.previewAs ? window.app.previewAs.role : window.app.userRole,
  effPlan: () => window.app.previewAs ? window.app.previewAs.plan : window.app.userPlan,
  effReissuapuri: () => window.app.previewAs ? !!window.app.previewAs.reissuapuriEnabled : window.app.reissuapuriEnabled,

  previewAsUser: (nickname, role, plan, reissuapuriEnabled) => {
      window.app.previewAs = { nickname, role: role || 'user', plan: plan || 'free', reissuapuriEnabled: !!reissuapuriEnabled };
      window.app.router('home');
  },

  exitPreview: () => {
      window.app.previewAs = null;
      window.app.router('home');
  },

  router: (view, options = {}) => {
    const { fromHash = false, replaceHash = false } = options;
    const targetView = view || 'home';
    
    // Näytetään latausindikaattori
    const content = document.getElementById('appContent');
    if (content) {
      content.innerHTML = `
        <div class="loading-wrap">
          <div class="spinner"></div>
          <p class="muted" style="margin-top:15px;">Ladataan...</p>
        </div>
      `;
    }

    if (!fromHash) {
        const hashValue = `#${targetView}`;
        if (replaceHash) {
            history.replaceState(null, '', hashValue);
        } else {
            history.pushState(null, '', hashValue);
        }
    }

    // Päivitetään navigaation aktiivinen tila
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(targetView) || 
            (targetView === 'home' && btn.textContent === 'Etusivu') ||
            (targetView === 'generator' && btn.textContent === 'Kuvageneraattori') ||
            (targetView === 'help' && btn.textContent === 'Ohjeet & Tuki'));
    });

    // Suoritetaan näkymän renderöinti virheenkäsittelyllä
    try {
      window.app.currentView = targetView;
      updatePreviewBanner();

      const nav = document.getElementById('mainNav');
      if (nav) nav.classList.remove('open');

      const protectedViews = ['stats', 'stats_triplet', 'stats_map', 'stats_map_all', 'stats_all', 'stats_top', 'stats_external', 'stats_other', 'stats_queries', 'country_maps', 'sweden_map', 'norway_map', 'estonia_map', 'admin', 'generator', 'settings', 'converters', 'links', 'reissuapuri'];
      
      if (protectedViews.includes(targetView) && !window.app.currentUser) {
          sessionStorage.setItem('mk_post_login_view', targetView);
          window.app.router('login_view', { replaceHash: true });
          return;
      }

      const isLocked = window.app.effPlan() === 'free' && window.app.effRole() !== 'admin';
      const lockIcon = isLocked ? ' 🔒' : '';

      switch(targetView) {
      case 'home':
        // GUEST VIEW (KIRJAUTUMATON)
        if (!window.app.currentUser) {
            content.innerHTML = `
              <div class="card home-card">
                <img src="mklogo.png" alt="MK Porttaali" class="app-logo">
                <div><span class="version-pill" onclick="app.router('help')" title="Katso ohjeet ja versiohistoria">v${APP_DISPLAY_VERSION}</span></div>
                <p class="muted" style="margin-top:15px;">Geokätköilijän työkalupakki: tilastot, kartat, kuvageneraattori ja muuntimet.</p>
                <div class="divider"><span>Kirjaudu jatkaaksesi</span></div>
                <button class="btn btn-primary btn-block" onclick="app.router('login_view')">Kirjaudu sisään</button>
                <button class="btn btn-block" onclick="app.router('login_view')">Luo uusi tunnus</button>
              </div>
            `;
            return;
        }

        // LOGGED IN VIEW (KIRJAUTUNUT)
        let adminButton = '';
        if (window.app.effRole() === 'admin') {
            adminButton = `<button class="launcher-btn btn-red" onclick="app.router('admin')"><span class="launcher-icon">🔧</span>Ylläpito</button>`;
        }

        let reissuapuriButton = '';
        if (window.app.effRole() === 'admin' || window.app.effReissuapuri()) {
            reissuapuriButton = `<button class="launcher-btn btn-teal" onclick="app.router('reissuapuri')"><span class="launcher-icon">🧭</span>Reissuapuri</button>`;
        }

        let statusBadge = '';
        if (window.app.effRole() === 'admin') statusBadge = '<span class="badge badge-admin" style="font-size:0.85em;">ADMIN</span>';
        else if (window.app.effPlan() === 'premium') statusBadge = '<span class="badge badge-premium" style="font-size:0.85em;">PREMIUM</span>';

        content.innerHTML = `
          <div class="card">
            <div class="home-card" style="padding-bottom:5px;">
                <img src="mklogo.png" alt="MK Porttaali" class="app-logo">
                <div>${statusBadge}</div>
                <div><span class="version-pill" onclick="app.router('help')" title="Katso ohjeet ja versiohistoria">v${APP_DISPLAY_VERSION}</span></div>
            </div>

            <div class="launcher-grid">
                <button class="launcher-btn btn-primary" onclick="app.router('generator')"><span class="launcher-icon">🖼️</span>Kuvageneraattori</button>
                <button class="launcher-btn btn-green" onclick="app.router('stats')"><span class="launcher-icon">📊</span>Tilastot${lockIcon}</button>
                <button class="launcher-btn btn-teal" onclick="app.router('stats_queries')"><span class="launcher-icon">🔍</span>Löytöhaut${lockIcon}</button>
                <button class="launcher-btn btn-peach" onclick="app.router('converters')"><span class="launcher-icon">🧮</span>Muuntimet${isLocked ? ' 🔒' : ''}</button>
                <button class="launcher-btn btn-sky" onclick="app.router('links')"><span class="launcher-icon">🌐</span>Linkkikirjasto</button>
                <button class="launcher-btn btn-blue" onclick="app.router('settings')"><span class="launcher-icon">⚙️</span>Asetukset</button>
                <button class="launcher-btn btn-mauve" onclick="app.router('help')"><span class="launcher-icon">📖</span>Ohjeet &amp; Tuki</button>
                ${reissuapuriButton}
                ${adminButton}
            </div>
          </div>
        `;
        break;

      case 'settings': renderSettingsView(content, db, window.app.currentUser, window.app); break;
      case 'admin':
        if (window.app.previewAs) { app.router('home'); break; }
        renderAdminView(content, db, window.app.currentUser);
        break;
      case 'reissuapuri':
        if (!(window.app.effRole() === 'admin' || window.app.effReissuapuri())) { app.router('home'); break; }
        content.innerHTML = `
          <div class="card" style="padding:0; overflow:hidden;">
            <iframe src="reissuapuri.html" title="MK Reissuapuri" style="width:100%; height:90vh; border:0;"></iframe>
          </div>
        `;
        break;
      case 'locked_view': content.innerHTML = `<div class="card home-card"><h1 style="color:var(--c-peach);">⏳ Odottaa hyväksyntää</h1><p>Tilisi odottaa ylläpitäjän hyväksyntää.</p><button class="btn" onclick="app.logout()">Kirjaudu ulos</button></div>`; break;

      case 'stats': if (checkPremium(content)) Stats.renderStatsDashboard(content, window.app); break;
      case 'stats_triplet': if (checkPremium(content)) Stats.loadTripletData(db, window.app.currentUser, content); break;
      case 'stats_map': if (checkPremium(content)) MapView.renderTripletMap(content, db, window.app.currentUser, window.app); break;
      case 'stats_map_all': if (checkPremium(content)) MapAllView.renderAllFindsMap(content, db, window.app.currentUser, window.app); break;
      case 'country_maps': if (checkPremium(content)) MapCountriesView.renderCountrySelector(content, window.app); break;
      case 'sweden_map': if (checkPremium(content)) MapCountriesView.renderSwedenMap(content, db, window.app.currentUser, window.app); break;
      case 'norway_map': if (checkPremium(content)) MapCountriesView.renderNorwayMap(content, db, window.app.currentUser, window.app); break;
      case 'estonia_map': if (checkPremium(content)) MapCountriesView.renderEstoniaMap(content, db, window.app.currentUser, window.app); break;
      case 'stats_all': if (checkPremium(content)) Stats.loadAllStats(db, window.app.currentUser, content); break;
      case 'stats_top': if (checkPremium(content)) Stats.loadTopStats(db, window.app.currentUser, content); break;
      case 'stats_external': if (checkPremium(content)) Stats.loadExternalStats(content); break;
      case 'stats_other': if (checkPremium(content)) Stats.loadOtherCountries(db, window.app.currentUser, content); break;
      case 'stats_queries': if (checkPremium(content)) FindsQuery.renderFindsQueries(db, window.app.currentUser, content); break;
      
      case 'converters': 
        if (checkPremium(content)) {
            renderConvertersView(content);
        }
        break;

      case 'links':
        renderLinksView(content); 
        break;

      case 'generator': renderGeneratorView(content); break;
      case 'help': renderHelp(content, window.app); break;

      case 'login_view':
        content.innerHTML = `
          <div class="card auth-card">
            <img src="mklogo.png" alt="MK Porttaali" class="app-logo" style="margin-top:10px;">
            <h1 id="authTitle" style="margin-bottom:20px;">Kirjaudu</h1>

            <div style="text-align:left;">
                <input type="email" id="email" placeholder="Sähköposti" style="margin-bottom:10px;">
                <input type="password" id="password" placeholder="Salasana" style="margin-bottom:10px;">
                <div id="registerFields" class="hidden">
                    <input type="text" id="regNick" placeholder="Nimimerkki" style="margin-bottom:10px; border-color:var(--accent-color);">
                </div>
                <button id="btnLogin" class="btn btn-primary btn-block" onclick="app.handleEmailLogin()">Kirjaudu sisään</button>
                <button id="btnRegister" class="btn btn-green btn-block hidden" onclick="app.handleRegister()">Luo uusi tili</button>
                <div id="loginError" class="error-msg"></div>
                <div class="divider"><span>TAI</span></div>
                <button class="btn btn-google" onclick="app.loginGoogle()">Kirjaudu Googlella</button>
                <p style="text-align:center; margin-top:20px; font-size:0.9em;">
                    <span id="toggleText">Eikö sinulla ole tiliä?</span>
                    <a href="#" onclick="app.toggleAuthMode(); return false;" style="font-weight:bold;"><span id="toggleLink">Rekisteröidy tästä</span></a>
                </p>
            </div>
          </div>
        `;
        break;

      default: 
        if (content) content.innerHTML = '<div class="card"><h1>404</h1></div>';
    }

    window.app.currentView = targetView;
    const storedScroll = sessionStorage.getItem(`mk_scroll_${targetView}`) || localStorage.getItem(`mk_scroll_${targetView}`);
    if (storedScroll !== null) {
        requestAnimationFrame(() => window.scrollTo(0, parseInt(storedScroll, 10) || 0));
    } else {
        window.scrollTo(0, 0);
    }
    
    } catch (error) {
      console.error('Virhe näkymän lataamisessa:', error);
      if (content) {
        content.innerHTML = `
          <div class="card home-card" style="padding: 40px;">
            <h2 style="color: var(--error-color);">❌ Virhe</h2>
            <p>Näkymän lataaminen epäonnistui.</p>
            <button class="btn" onclick="location.reload()">Lataa sivu uudelleen</button>
          </div>
        `;
      }
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
  toggleGeneratorQuickPanel: Gen.toggleGeneratorQuickPanel,
  clearGeneratorRecents: Gen.clearGeneratorRecents,
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
  initGeneratorAccordions: Gen.initGeneratorAccordions,
  initGeneratorPersistence: Gen.initGeneratorPersistence,
  refreshGeneratorPresets: Gen.refreshGeneratorPresets,
  applySelectedGeneratorPreset: Gen.applySelectedGeneratorPreset,
  refreshGeneratorRecents: Gen.refreshGeneratorRecents,
  applySelectedGeneratorRecent: Gen.applySelectedGeneratorRecent,
  resetGeneratorForm: Gen.resetGeneratorForm,
  openGeneratorPresetManager: Gen.openGeneratorPresetManager,
  closeGeneratorPresetManager: Gen.closeGeneratorPresetManager,
  saveGeneratorPreset: Gen.saveGeneratorPreset,
  moveSelectedGeneratorPreset: Gen.moveSelectedGeneratorPreset,
  updateSelectedGeneratorPreset: Gen.updateSelectedGeneratorPreset,
  renameSelectedGeneratorPreset: Gen.renameSelectedGeneratorPreset,
  deleteSelectedGeneratorPreset: Gen.deleteSelectedGeneratorPreset
};

// --- ADMIN-ESIKATSELUN BANNERI ---
function updatePreviewBanner() {
    let el = document.getElementById('previewBanner');
    const p = window.app.previewAs;
    if (!p || !window.app.currentUser) {
        if (el) el.remove();
        document.body.style.paddingBottom = '';
        return;
    }
    if (!el) {
        el = document.createElement('div');
        el.id = 'previewBanner';
        el.className = 'preview-banner';
        document.body.appendChild(el);
    }
    document.body.style.paddingBottom = '70px';
    const safeNick = String(p.nickname).replace(/</g, '&lt;');
    const extras = `${p.plan}${p.role === 'admin' ? ' + admin' : ''}${p.reissuapuriEnabled ? ' + Reissuapuri' : ''}`;
    el.innerHTML = `👁 Esikatselu: <strong>${safeNick}</strong> (${extras}) — näet käyttäjän oikeudet, data on sinun <button class="btn btn-sm btn-red" style="margin:0 0 0 8px;" onclick="app.exitPreview()">Lopeta</button>`;
}

// --- UUSITTU PREMIUM-MARKKINOINTISIVU ---
function checkPremium(content) {
    if (window.app.effPlan() === 'premium' || window.app.effRole() === 'admin') return true;
    const idCode = window.app.shortId || "VIRHE";
    const nick = window.app.savedNickname || "Nimetön";

    content.innerHTML = `
        <div class="card" style="text-align:center;">
            <div style="font-size:3.5em; margin-bottom:10px; filter: drop-shadow(0 0 10px rgba(250, 179, 135, 0.3));">💎</div>
            <h2 style="color:var(--c-peach); margin-top:0;">Premium-ominaisuus</h2>
            <p style="margin-bottom:25px;">Tämä toiminto vaatii aktiivisen Premium-tilauksen.</p>

            <div class="panel" style="text-align:left;">
                <strong style="display:block; margin-bottom:10px; color:var(--text-color);">Mitä saat Premiumilla?</strong>
                <ul style="margin:0; padding-left:20px; line-height:1.6;">
                    <li>🗺️ <strong>Interaktiiviset kartat</strong> (Tripletti, kunnat)</li>
                    <li>📊 <strong>Tarkat tilastot</strong> (Top-listat, puutteet)</li>
                    <li>🧮 <strong>Laajat koordinaattimuuntimet</strong></li>
                    <li>💾 <strong>Omien löytöjen tuonti</strong></li>
                </ul>
            </div>

            <h3 style="margin-bottom:10px;">Hinnasto</h3>
            <div class="price-grid">
                <div class="price-card" style="--pc:#94e2d5;">
                    <div class="price-name">1 VKO</div>
                    <div class="price-value">1 €</div>
                    <div class="price-code">Koodi: T-1VK</div>
                </div>
                <div class="price-card" style="--pc:#89dceb;">
                    <div class="price-name">1 KK</div>
                    <div class="price-value">2 €</div>
                    <div class="price-code">Koodi: T-1KK</div>
                </div>
                <div class="price-card" style="--pc:#89b4fa;">
                    <div class="price-name">3 KK</div>
                    <div class="price-value">3 €</div>
                    <div class="price-code">Koodi: T-3KK</div>
                </div>
                <div class="price-card" style="--pc:#a6e3a1;">
                    <div class="price-name">6 KK</div>
                    <div class="price-value">5 €</div>
                    <div class="price-code">Koodi: T-6KK</div>
                </div>
                <div class="price-card" style="--pc:#fab387; grid-column: 1 / -1;">
                    <div class="price-name">12 KK (Vuosi)</div>
                    <div class="price-value">10 €</div>
                    <div class="price-code">Koodi: T-1V</div>
                </div>
            </div>

            <div class="panel panel-dashed" style="border-color:var(--c-peach);">
                <p style="margin:0 0 10px 0; font-size:0.9em;">Maksa MobilePaylla ja kirjoita viestiin:</p>
                <div style="background:var(--bg-mantle); padding:10px; border-radius:4px; font-family:monospace; font-size:1.05em; color:var(--c-peach);">
                    ${nick} ${idCode} [TUOTEKOODI]
                </div>
                <p style="margin:8px 0 0 0; font-size:0.8em; color:var(--subtext-color);">Esim: ${nick} ${idCode} T-1V</p>
            </div>
            <p style="font-size:0.85em; margin-top:5px;">MK Porttaali on harrasteprojekti ja tarjotaan sellaisena kuin se on. Toimivuutta ei taata, ja palvelu voi muuttua, olla tilapäisesti pois käytöstä tai päättyä kokonaan ilman ennakkoilmoitusta. Premium-maksut ovat vapaaehtoinen tuki projektille, eikä maksuja palauteta.</p>

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
        <h1>Kuvageneraattori <span class="badge badge-extra" style="font-size:0.4em; vertical-align:middle;">Geocache.fi</span></h1>
        <div style="margin:0 0 8px; font-size:0.75em; opacity:0.6;">Luo tilastokuvia Geocache.fi-palvelun kuvageneraattorilla • v${APP_DISPLAY_VERSION} • ${APP_UPDATED_AT}</div>

        <div class="gen-form">
        <div class="gen-quick-links">
          <a href="#" onclick="app.toggleGeneratorQuickPanel('preset'); return false;" style="color:var(--accent-color); text-decoration:none;">Pikapohjat</a>
          <a href="#" onclick="app.toggleGeneratorQuickPanel('recent'); return false;" style="color:var(--accent-color); text-decoration:none;">Viimeksi käytetyt</a>
          <a href="#" onclick="app.toggleGeneratorQuickPanel('friend'); return false;" style="color:var(--accent-color); text-decoration:none;">Valitse tallennettu kaveri</a>
          <button class="btn" type="button" onclick="app.resetGeneratorForm()" style="padding:6px 10px; font-size:0.85em;">Nollaa</button>
        </div>

        <div id="genQuickFriendPanel" class="panel panel-dashed hidden">
          <label style="display:block; margin-bottom:6px;">Valitse tallennettu kaveri:</label>
          <select id="friendSelect" onchange="if(this.value) document.getElementById('genUser').value = this.value">
              <option value="">-- Valitse tallennettu kaveri --</option>
          </select>
        </div>

        <div id="genQuickRecentPanel" class="panel panel-dashed hidden">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
            <label style="margin:0;">Viimeksi käytetyt:</label>
            <button class="btn btn-sm" type="button" onclick="app.clearGeneratorRecents()">Tyhjennä</button>
          </div>
          <select id="genRecentSelect">
            <option value="">-- Valitse viimeksi käytetty --</option>
          </select>
        </div>

        <div id="genQuickPresetPanel" class="panel panel-dashed hidden">
          <label style="display:block; margin-bottom:6px;">Pikapohjat:</label>
          <div style="display:grid; grid-template-columns: 1fr auto; gap:10px; align-items:center;">
            <select id="genPresetSelect" style="margin-bottom:0;">
              <option value="">-- Valitse pikapohja --</option>
            </select>
            <button class="btn btn-sm" type="button" title="Hallinnoi pikapohjia" onclick="app.openGeneratorPresetManager()">✎</button>
          </div>
          <button class="btn btn-primary" type="button" onclick="app.saveGeneratorPreset()" style="margin-top:10px;">Tallenna nykyinen pohjaksi</button>
          <p style="margin:10px 0 0 0; font-size:0.8em; opacity:0.7;">Vinkki: viimeisin haku palautuu automaattisesti, vaikka et tallentaisi sitä pohjaksi.</p>
        </div>

        <label>Käyttäjätunnus:</label>
        <div class="input-group">
            <input type="text" id="genUser" value="${defaultUser}" placeholder="esim. mikkokalevi" oninput="app.updateProfileLink()" autocomplete="off">
        </div>
        <a id="gcProfileLink" href="#" target="_blank" style="display:block; margin-bottom:8px; font-size:0.85em; color:var(--accent-color); text-decoration:none;" class="hidden"></a>

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
        
        <div id="yearSpecificFilters" class="panel panel-dashed hidden">
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

        <button class="btn btn-primary btn-block" onclick="app.generateStatImage()">Luo kuva</button>
        </div>
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

      <div id="genPresetModal" class="modal-overlay" style="display:none;">
        <div class="modal-box" style="max-width:700px; overflow:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
            <div>
              <div style="font-weight:bold; font-size:1.1em;">Muokkaa suosikkihakuja</div>
              <div style="opacity:0.7; font-size:0.85em;">Tallennus: kirjautuneena Firestore, muuten paikallisesti laitteelle.</div>
            </div>
            <button class="btn btn-sm" type="button" onclick="app.closeGeneratorPresetManager()">Sulje</button>
          </div>

          <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-bottom:10px;">
            <button class="btn btn-primary" type="button" onclick="app.saveGeneratorPreset()">Tallenna nykyinen uusi suosikiksi</button>
          </div>

          <div id="genPresetManagerList" style="display:grid; gap:10px;"></div>
        </div>
      </div>
    `;
    
    app.loadFriends();
    app.updateProfileLink();
    app.initGeneratorAccordions();
    app.initGeneratorPersistence();
}

Auth.initAuth(auth, db, window.app);
document.addEventListener('DOMContentLoaded', () => {
    const hashView = window.location.hash.replace('#', '');
    let storedView = sessionStorage.getItem('mk_last_view') || localStorage.getItem('mk_last_view');
    if (storedView === 'converters') {
        storedView = 'home';
        sessionStorage.setItem('mk_last_view', 'home');
        localStorage.setItem('mk_last_view', 'home');
    }
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
