import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Tuodaan uudet moduulit
import * as Auth from "./auth.js";
import * as Gen from "./generator.js";

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

// Alustetaan ikkuna-objekti, jota HTML (index.html) kutsuu
window.app = {
  currentUser: null,

  // --- NAVIGOINTI JA ROUTER ---
  router: (view) => {
    const content = document.getElementById('appContent');
    const nav = document.getElementById('mainNav');
    if(nav) nav.classList.remove('open'); // Sulje mobiilivalikko vaihdettaessa sivua

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
                <button class="btn" style="background-color: #a6e3a1; color:#1e1e2e; font-weight:bold;" onclick="app.router('triplet')">
                  Omat Kuntatilastot
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

      // KORJAUS: Ohjataan "stats" suoraan "triplet"-näkymään
      case 'stats':
        app.router('triplet');
        break;

      case 'triplet':
        if (!window.app.currentUser) { app.router('login_view'); return; }
        content.innerHTML = `
            <div class="card">
                <h1>Kuntatilastot</h1>
                <p>Ladataan tietoja...</p>
            </div>`;
        app.loadTripletData();
        break;

      case 'generator':
        renderGeneratorView(content);
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
        content.innerHTML = '<div class="card"><h1>404 - Sivua ei löydy</h1></div>';
    }
  },

  // Mobiilivalikon avaus/sulku
  toggleMenu: () => {
      document.getElementById('mainNav').classList.toggle('open');
  },

  // --- AUTH-TOIMINNOT (Kutsuu auth.js) ---
  loginGoogle: () => Auth.loginGoogle(auth, (v) => window.app.router(v)),
  logout: () => Auth.logout(auth, (v) => window.app.router(v)),
  
  handleEmailLogin: () => {
      const e = document.getElementById('email').value;
      const p = document.getElementById('password').value;
      Auth.handleEmailLogin(auth, e, p, 
        (msg) => {
            const errDiv = document.getElementById('loginError');
            errDiv.style.display = 'block';
            errDiv.textContent = msg;
        }, 
        (v) => window.app.router(v)
      );
  },

  handleRegister: () => {
      const e = document.getElementById('email').value;
      const p = document.getElementById('password').value;
      Auth.handleRegister(auth, e, p,
        (msg) => {
            const errDiv = document.getElementById('loginError');
            errDiv.style.display = 'block';
            errDiv.textContent = msg;
        },
        (v) => window.app.router(v)
      );
  },

  // Kaverilistan toiminnot (Kutsuu auth.js)
  loadFriends: () => Auth.loadFriends(db, window.app.currentUser?.uid, 'friendListContainer', 'friendListOptions'),
  addFriend: () => {
      const name = document.getElementById('newFriendName').value.trim();
      Auth.addFriend(db, window.app.currentUser?.uid, name, () => {
          document.getElementById('newFriendName').value = '';
          app.loadFriends();
      });
  },
  removeFriend: (name) => Auth.removeFriend(db, window.app.currentUser?.uid, name, () => app.loadFriends()),

  // --- KUVAGENERATTORIN TOIMINNOT (Kutsuu generator.js) ---
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

  // --- TRIPLETTIDATA (Tämä pidetään toistaiseksi tässä, kunnes siirretään omaan tiedostoon) ---
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
          content.innerHTML = `
            <div class="card">
                <h1>Kuntatilastot</h1>
                <p style="font-size:0.9em; color:var(--success-color); border-bottom:1px solid var(--border-color); padding-bottom:10px;">
                   ✅ Data päivitetty: <b>${updatedString}</b>
                </p>
                
                <input type="text" id="tripletSearch" placeholder="Hae kuntaa..." 
                       style="width:100%; padding:12px; margin-bottom:15px; box-sizing:border-box; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:8px; font-size:16px;">

                <div id="tripletStatsSummary" style="display:flex; gap:10px; margin-bottom:15px;">
                </div>

                <div id="tripletResults">
                </div>
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

              Object.keys(fullData).sort().forEach(kunta => {
                  if (kunta.toLowerCase().includes(filter)) {
                      const d = fullData[kunta];
                      const stats = d.s || [];
                      const t = stats[0] || 0;
                      const m = stats[1] || 0;
                      const q = stats[3] || 0;

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

              // Yhteenvetolaatikot
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

              // Listat HTML
              let html = '';
              let totalShown = 0;
              for(let i=1; i<=8; i++) {
                  const count = cats[i].length;
                  totalShown += count;
                  const isSearching = filter.length > 0;
                  // Avataan tripletit (8) ja nollat (1) oletuksena, tai haun mukaan
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
              if(totalShown === 0) html = '<p style="text-align:center; opacity:0.6; margin-top:20px;">Ei hakutuloksia.</p>';
              document.getElementById('tripletResults').innerHTML = html;
          };

          renderLists('');
          document.getElementById('tripletSearch').addEventListener('input', (e) => renderLists(e.target.value));

      } catch (e) {
          console.error(e);
          content.innerHTML = `<div class="card"><h1 style="color:var(--error-color)">Virhe</h1><p>${e.message}</p></div>`;
      }
  }
};

// Apufunktio: Generaattorin HTML (siirretty selkeyden vuoksi tänne alas)
function renderGeneratorView(content) {
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
}

// Käynnistetään Auth-kuuntelija ja sovellus
Auth.initAuth(auth, db, window.app);
document.addEventListener('DOMContentLoaded', () => { app.router('home'); });
