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

      case 'triplet':
        // TÄMÄ ON SE UUSI OSIO, JOKA LUKEE TIETOKANTAA
        if (!window.app.currentUser) { app.router('login_view'); return; }
        content.innerHTML = `
            <div class="card">
                <h1>Kuntatilastot</h1>
                <p>Ladataan tietoja...</p>
            </div>`;
        app.loadTripletData();
        break;

      case 'generator':
        // TÄMÄ ON SE VANHA "LIVE" GENERATOR - TÄHÄN EI OLE KOSKETTU
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
            <p style="font-size:0.8em; opacity:0.7;">Hakee kuvat suoraan Geocache.fi-palvelusta.</p>
            
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

  // --- TRIPLETTI LOGIIKKA (LUKEE DATABASEA) ---
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

          const data = docSnap.data().municipalities;
          
          // AIKALEIMAN HAKU JA MUOTOILU
          let updatedString = '-';
          if (docSnap.data().updatedAt) {
              const date = docSnap.data().updatedAt.toDate(); // Muunna Firestore Timestamp JS Dateksi
              updatedString = date.toLocaleString('fi-FI', { 
                  day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              });
          }
          
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

          Object.keys(data).sort().forEach(kunta => {
              const d = data[kunta];
              const stats = d.s || []; 
              
              const t = stats[0] || 0;
              const m = stats[1] || 0;
              const q = stats[3] || 0; // Mysteeri on 4. sarake (index 3)

              const itemHTML = `<li><b>${kunta}</b>: T=${t}, M=${m}, ?=${q}</li>`;

              if(!t && !m && !q) cats[1].push(itemHTML);
              else if(t && !m && !q) cats[2].push(itemHTML);
              else if(!t && m && !q) cats[3].push(itemHTML);
              else if(!t && !m && q) cats[4].push(itemHTML);
              else if(t && m && !q) cats[5].push(itemHTML);
              else if(!t && m && q) cats[6].push(itemHTML);
              else if(t && !m && q) cats[7].push(itemHTML);
              else if(t && m && q) cats[8].push(itemHTML);
          });

          let html = `
            <div class="card">
                <h1>Kuntatilastot</h1>
                <p style="font-size:0.9em; color:var(--success-color); border-bottom:1px solid var(--border-color); padding-bottom:10px;">
                   ✅ Data päivitetty: <b>${updatedString}</b>
                </p>
                
                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                        <div style="font-size:2em; color:var(--success-color);">${cats[8].length}</div>
                        <div style="font-size:0.8em;">Triplettiä</div>
                    </div>
                    <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                        <div style="font-size:2em; color:var(--error-color);">${cats[1].length}</div>
                        <div style="font-size:0.8em;">Ei löytöjä</div>
                    </div>
                </div>
            `;

          for(let i=1; i<=8; i++) {
              const count = cats[i].length;
              const isOpen = (i === 8 || i === 1) ? 'open' : ''; 
              const style = (i === 8) ? 'border-color:var(--success-color);' : '';
              
              html += `
                <details ${isOpen} style="margin-bottom:10px; background:rgba(0,0,0,0.1); border-radius:8px; border:1px solid var(--border-color); ${style}">
                    <summary style="padding:10px; cursor:pointer; font-weight:bold; list-style:none;">
                        ${titles[i]} <span style="float:right; opacity:0.7;">(${count})</span>
                    </summary>
                    <div style="padding:10px; border-top:1px solid var(--border-color);">
                        <ul style="margin:0; padding-left:20px; font-size:0.9em;">
                            ${count > 0 ? cats[i].join('') : '<li style="list-style:none; opacity:0.5;">Ei kuntia tässä kategoriassa.</li>'}
                        </ul>
                    </div>
                </details>
              `;
          }
          html += `</div>`;
          content.innerHTML = html;

      } catch (e) {
          console.error(e);
          content.innerHTML = `<div class="card"><h1 style="color:var(--error-color)">Virhe</h1><p>${e.message}</p></div>`;
      }
  },

  // --- UI LOGIIKKA (KUVAGENERATOR - EI MUUTOKSIA TOIMINNASSA) ---

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
          if (!currentVal.includes(cb.value)) currentVal.push(cb.value);
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
        if (start && end) params += `&startdate=${formatDate(start)}&enddate=${formatDate(end)}`;
        else {
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
});

document.addEventListener('DOMContentLoaded', () => { app.router('home'); });
