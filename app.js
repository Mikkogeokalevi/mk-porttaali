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

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDxDmo274iZuwufe4meobYPoablUNinZGY",
  authDomain: "mk-porttaali.firebaseapp.com",
  projectId: "mk-porttaali",
  storageBucket: "mk-porttaali.firebasestorage.app",
  messagingSenderId: "220899819334",
  appId: "1:220899819334:web:6662b7b1519f4c89c32f47"
};

// Alustukset
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();

// Apufunktio päivämäärien muotoiluun
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
            <button class="btn btn-primary" onclick="app.router('generator')" style="width:100%; margin-top:15px;">
              Avaa Kuvageneraattori
            </button>
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

      case 'generator':
        let defaultUser = '';
        if (window.app.currentUser) {
            if (window.app.currentUser.email === 'toni@kauppinen.info') {
                defaultUser = 'mikkokalevi';
            } else {
                defaultUser = window.app.currentUser.displayName || window.app.currentUser.email.split('@')[0];
            }
        }

        // Vuodet
        const currentYear = new Date().getFullYear();
        let yearOptions = '<option value="current">— Vuosi —</option>';
        for (let y = currentYear; y >= 2000; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        // Kuukaudet
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
                <input type="text" id="genLocValue" placeholder="Esim. Lahti tai Päijät-Häme" disabled>
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
        `;
        
        app.loadFriends();
        app.updateProfileLink(); // Päivitä linkki heti latauksessa
        break;

      case 'stats':
        if (!window.app.currentUser) { app.router('login'); return; }
        content.innerHTML = `<div class="card"><h1>Tilastot</h1><p>🚧 Tulossa.</p></div>`;
        break;

      case 'login':
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

  // --- KAVERILISTA & PROFIILILINKKI ---
  
  toggleFriendManager: () => {
      document.getElementById('friendManager').classList.toggle('hidden');
  },

  updateProfileLink: () => {
      const user = document.getElementById('genUser').value;
      const link = document.getElementById('gcProfileLink');
      if(user) {
          link.href = `https://www.geocaching.com/p/?u=${encodeURIComponent(user)}`;
          link.textContent = `Avaa ${user} profiili Geocaching.comissa ↗`;
          link.classList.remove('hidden');
      } else {
          link.classList.add('hidden');
      }
  },

  loadFriends: async () => {
    if (!window.app.currentUser) return;
    const uid = window.app.currentUser.uid;
    const docRef = doc(db, "users", uid);
    try {
        const docSnap = await getDoc(docRef);
        const container = document.getElementById('friendListContainer');
        const datalist = document.getElementById('friendListOptions');
        if (!container || !datalist) return;
        container.innerHTML = '';
        datalist.innerHTML = '';
        if (docSnap.exists() && docSnap.data().saved_usernames) {
            const friends = docSnap.data().saved_usernames.sort();
            friends.forEach(name => {
                const div = document.createElement('div');
                div.className = 'friend-item';
                div.innerHTML = `<span>${name}</span><button class="btn-delete" onclick="app.removeFriend('${name}')">✕</button>`;
                container.appendChild(div);
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);
            });
        } else {
             container.innerHTML = '<p style="font-size:0.9em;">Ei nimiä.</p>';
        }
    } catch (e) { console.error(e); }
  },

  addFriend: async () => {
      if (!window.app.currentUser) return;
      const input = document.getElementById('newFriendName');
      const newName = input.value.trim();
      if (!newName) return;
      const uid = window.app.currentUser.uid;
      const docRef = doc(db, "users", uid);
      try {
          await setDoc(docRef, { saved_usernames: arrayUnion(newName) }, { merge: true });
          input.value = ''; 
          app.loadFriends(); 
      } catch (e) { alert("Virhe: " + e.message); }
  },

  removeFriend: async (name) => {
      if (!window.app.currentUser || !confirm(`Poistetaanko ${name}?`)) return;
      const uid = window.app.currentUser.uid;
      const docRef = doc(db, "users", uid);
      try {
          await updateDoc(docRef, { saved_usernames: arrayRemove(name) });
          app.loadFriends(); 
      } catch (e) { console.error(e); }
  },

  // --- KÄYTTÖLIITTYMÄLOGIIKKA ---
  
  toggleMenu: () => {
    document.getElementById('mainNav').classList.toggle('open');
  },

  toggleTimeFields: () => {
    const val = document.getElementById('genTimeSelect').value;
    const fields = document.getElementById('timeFields');
    if(val === 'kylla') fields.classList.remove('hidden');
    else fields.classList.add('hidden');
  },

  handleTypeChange: () => {
      const type = document.getElementById('genType').value;
      const yearFilters = document.getElementById('yearSpecificFilters');
      
      // Näytä lisäsuodatus vain jos "Vuosikalenteri" on valittu
      if (type === 'year') {
          yearFilters.classList.remove('hidden');
      } else {
          yearFilters.classList.add('hidden');
          // Nollaa valinnat kun piilotetaan
          document.getElementById('genLocType').value = 'none';
          app.handleLocTypeChange();
      }
  },

  handleLocTypeChange: () => {
      const locType = document.getElementById('genLocType').value;
      const locInput = document.getElementById('genLocValue');
      
      if (locType === 'none') {
          locInput.disabled = true;
          locInput.value = '';
      } else {
          locInput.disabled = false;
          locInput.placeholder = locType === 'pkunta' ? 'Esim. Lahti' : 'Esim. Päijät-Häme';
      }
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

    // Vuosikalenterin spesifit
    const locType = document.getElementById('genLocType').value;
    const locValue = document.getElementById('genLocValue').value.trim();

    if (!user) { alert("Syötä käyttäjätunnus!"); return; }

    let params = `?user=${encodeURIComponent(user)}`;
    
    if (type === "hiddenday") params += `&type=2`;

    // Aikavalinnat
    if (timeMode === "kylla") {
        if (start && end) {
           params += `&startdate=${formatDate(start)}&enddate=${formatDate(end)}`;
        } else {
           if (year && year !== "current") params += `&year=${year}`;
           if (month && month !== "current") params += `&month=${month}`;
        }
    }

    // Kätkötyyppi
    if (cacheType) params += `&cachetype=${cacheType}`;

    // Vuosikalenterin lisäsuodatus
    if (type === 'year' && locType !== 'none' && locValue) {
        if (locType === 'pkunta') params += `&pkunta=${encodeURIComponent(locValue)}`;
        if (locType === 'mkunta') params += `&mkunta=${encodeURIComponent(locValue)}`;
    }

    const finalUrl = `${baseUrl}${type}.php${params}`;
    const resultArea = document.getElementById('resultArea');
    const img = document.getElementById('generatedImg');
    const link = document.getElementById('openLink');

    img.src = finalUrl;
    link.href = finalUrl;
    resultArea.classList.remove('hidden');
  },

  // --- AUTH ---
  loginGoogle: () => {
    signInWithPopup(auth, provider).then(() => app.router('home')).catch(e => alert(e.message));
  },
  handleEmailLogin: () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, pass).then(() => app.router('home')).catch(e => {
        document.getElementById('loginError').textContent = e.message;
        document.getElementById('loginError').style.display = 'block';
    });
  },
  handleRegister: () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if(pass.length < 6) { alert("Salasana liian lyhyt"); return; }
    createUserWithEmailAndPassword(auth, email, pass).then(() => {
         alert("Tunnus luotu!"); app.router('home');
    }).catch(e => {
        document.getElementById('loginError').textContent = e.message;
        document.getElementById('loginError').style.display = 'block';
    });
  },
  logout: () => {
    signOut(auth).then(() => app.router('home'));
  }
};

onAuthStateChanged(auth, (user) => {
  window.app.currentUser = user;
  const authBtn = document.getElementById('authButton');
  const logoutBtn = document.getElementById('logoutButton');
  const userDisplay = document.getElementById('userNameDisplay');
  if(authBtn) {
      if (user) {
        authBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        userDisplay.textContent = user.displayName || user.email;
        userDisplay.classList.remove('hidden');
      } else {
        authBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        userDisplay.classList.add('hidden');
      }
  }
});

document.addEventListener('DOMContentLoaded', () => { app.router('home'); });
