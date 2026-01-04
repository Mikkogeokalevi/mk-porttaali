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

// Pääsovellusolio
window.app = {
  currentUser: null,

  // Reititin
  router: (view) => {
    const content = document.getElementById('appContent');
    const nav = document.getElementById('mainNav');
    
    // Sulje mobiilivalikko jos se on auki
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
        // 1. Määritetään oletuskäyttäjänimi
        let defaultUser = '';
        if (window.app.currentUser) {
            // ADMIN-SÄÄNTÖ: Jos toni@kauppinen.info -> mikkokalevi
            if (window.app.currentUser.email === 'toni@kauppinen.info') {
                defaultUser = 'mikkokalevi';
            } else {
                // Muuten käytetään DisplayNamea tai sähköpostin alkuosaa
                defaultUser = window.app.currentUser.displayName || window.app.currentUser.email.split('@')[0];
            }
        }

        // 2. Luodaan vuosilista
        const currentYear = new Date().getFullYear();
        let yearOptions = '<option value="current">—</option>';
        for (let y = currentYear; y >= 2000; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        // 3. Generoidaan HTML
        content.innerHTML = `
          <div class="card">
            <h1>Kuvageneraattori</h1>
            
            <label>Käyttäjätunnus:</label>
            <div class="input-group">
                <input type="text" id="genUser" list="friendListOptions" value="${defaultUser}" placeholder="esim. mikkokalevi">
                <datalist id="friendListOptions"></datalist>
                <button class="btn-icon" onclick="app.toggleFriendManager()" title="Hallitse kavereita">⚙️</button>
            </div>

            <div id="friendManager" class="hidden">
                <h3>Hallitse nimimerkkejä</h3>
                <div id="friendListContainer">Ladataan...</div>
                <div class="friend-add-row">
                    <input type="text" id="newFriendName" placeholder="Uusi nimimerkki" style="margin:0;">
                    <button class="btn btn-primary" style="margin:0;" onclick="app.addFriend()">Lisää</button>
                </div>
            </div>

            <label>Kuvan tyyppi:</label>
            <select id="genType">
              <option value="matrix">T/D-taulukko</option>
              <option value="kunta">Kuntakartta</option>
              <option value="year">Vuosikalenteri</option>
              <option value="ftfkunta">FTF kuntakartta</option>
              <option value="hiddenday">Jasmer</option>
              <option value="saari">Saarilöydöt</option>
            </select>

            <label>Aikarajaus:</label>
            <select id="genTimeSelect" onchange="app.toggleTimeFields()">
              <option value="ei">Ei aikarajausta</option>
              <option value="kylla">Valitse aikaväli</option>
            </select>

            <div id="timeFields" class="hidden">
              <label>Vuosi:</label>
              <select id="genYear">${yearOptions}</select>
              <label>Tai tarkka väli:</label>
              <input type="date" id="genStart">
              <input type="date" id="genEnd">
            </div>

            <label>Kätkötyyppi:</label>
            <select id="genCacheType">
              <option value="">— Kaikki —</option>
              <option value="1">Tradi</option>
              <option value="2">Multi</option>
              <option value="3">Mysse</option>
              <option value="6">Earthcache</option>
              <option value="7">Virtual</option>
              <option value="99">Kaikki eventit</option>
            </select>

            <button class="btn btn-primary" onclick="app.generateStatImage()">Luo kuva</button>
          </div>

          <div id="resultArea" class="card hidden" style="text-align:center;">
             <img id="generatedImg" src="">
             <br>
             <a id="openLink" href="#" target="_blank" class="btn">Avaa isona</a>
          </div>
        `;
        
        // Lataa kaverilista tietokannasta heti
        app.loadFriends();
        break;

      case 'stats':
        if (!window.app.currentUser) {
          app.router('login'); 
          return;
        }
        content.innerHTML = `
          <div class="card">
            <h1>Tilastot</h1>
            <p>Kirjautunut: <b>${window.app.currentUser.email}</b></p>
            <p>🚧 Tilastot tulevat tähän myöhemmin.</p>
          </div>
        `;
        break;

      case 'login':
        content.innerHTML = `
          <div class="card" style="max-width: 400px; margin: 0 auto;">
            <h1>Kirjaudu sisään</h1>
            <input type="email" id="email" placeholder="Sähköposti">
            <input type="password" id="password" placeholder="Salasana">
            
            <button class="btn btn-primary" onclick="app.handleEmailLogin()">Kirjaudu sisään</button>
            <button class="btn" style="width:100%" onclick="app.handleRegister()">Luo uusi tunnus</button>
            
            <div id="loginError" class="error-msg"></div>

            <div class="divider"><span>TAI</span></div>

            <button class="btn btn-google" onclick="app.loginGoogle()">Kirjaudu Googlella</button>
          </div>
        `;
        break;

      default:
        content.innerHTML = '<div class="card"><h1>404</h1><p>Sivua ei löytynyt.</p></div>';
    }
  },

  // --- KAVERILISTA TOIMINNOT (Firestore) ---

  toggleFriendManager: () => {
      const el = document.getElementById('friendManager');
      el.classList.toggle('hidden');
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
            
            if (friends.length === 0) {
                container.innerHTML = '<p style="font-size:0.9em; opacity:0.7;">Ei tallennettuja nimiä.</p>';
            }

            friends.forEach(name => {
                // 1. Lisää hallintalistaan (poistonapilla)
                const div = document.createElement('div');
                div.className = 'friend-item';
                div.innerHTML = `
                    <span>${name}</span>
                    <button class="btn-delete" onclick="app.removeFriend('${name}')">✕</button>
                `;
                container.appendChild(div);

                // 2. Lisää datalist-ehdotuksiin (hakukenttää varten)
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);
            });
        } else {
             container.innerHTML = '<p style="font-size:0.9em; opacity:0.7;">Ei tallennettuja nimiä.</p>';
        }
    } catch (e) {
        console.error("Virhe kaverilistan haussa:", e);
        const c = document.getElementById('friendListContainer');
        if(c) c.innerHTML = '<p class="error-msg" style="display:block">Virhe listan latauksessa.</p>';
    }
  },

  addFriend: async () => {
      if (!window.app.currentUser) return;
      const input = document.getElementById('newFriendName');
      const newName = input.value.trim();
      
      if (!newName) return;

      const uid = window.app.currentUser.uid;
      const docRef = doc(db, "users", uid);

      try {
          await setDoc(docRef, { 
              saved_usernames: arrayUnion(newName) 
          }, { merge: true });
          
          input.value = ''; 
          app.loadFriends(); 
      } catch (e) {
          console.error("Virhe lisäyksessä:", e);
          alert("Virhe tallennuksessa: " + e.message);
      }
  },

  removeFriend: async (nameToRemove) => {
      if (!window.app.currentUser) return;
      if (!confirm(`Poistetaanko ${nameToRemove} listalta?`)) return;

      const uid = window.app.currentUser.uid;
      const docRef = doc(db, "users", uid);

      try {
          await updateDoc(docRef, {
              saved_usernames: arrayRemove(nameToRemove)
          });
          app.loadFriends(); 
      } catch (e) {
          console.error("Virhe poistossa:", e);
      }
  },

  // --- UI APUFUNKTIOT ---
  toggleMenu: () => {
    const nav = document.getElementById('mainNav');
    nav.classList.toggle('open');
  },

  toggleTimeFields: () => {
    const val = document.getElementById('genTimeSelect').value;
    const fields = document.getElementById('timeFields');
    if(val === 'kylla') fields.classList.remove('hidden');
    else fields.classList.add('hidden');
  },

  generateStatImage: () => {
    const baseUrl = "https://www.geocache.fi/stat/";
    const user = document.getElementById("genUser").value.trim();
    const type = document.getElementById("genType").value;
    const timeMode = document.getElementById("genTimeSelect").value;
    const year = document.getElementById("genYear").value;
    const start = document.getElementById("genStart").value;
    const end = document.getElementById("genEnd").value;
    const cacheType = document.getElementById("genCacheType").value;

    if (!user) { alert("Syötä käyttäjätunnus!"); return; }

    let params = `?user=${encodeURIComponent(user)}`;
    
    if (type === "hiddenday") params += `&type=2`;

    if (timeMode === "kylla") {
        if (start && end) {
           params += `&startdate=${formatDate(start)}&enddate=${formatDate(end)}`;
        } else if (year && year !== "current") {
           params += `&year=${year}`;
        }
    }

    if (cacheType) params += `&cachetype=${cacheType}`;

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
    signInWithPopup(auth, provider)
      .then(() => app.router('home'))
      .catch((error) => alert(error.message));
  },

  handleEmailLogin: () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    signInWithEmailAndPassword(auth, email, pass)
      .then(() => app.router('home'))
      .catch((error) => {
        errorDiv.textContent = "Virhe: " + error.message;
        errorDiv.style.display = 'block';
      });
  },

  handleRegister: () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if(pass.length < 6) {
       errorDiv.textContent = "Salasanan pitää olla vähintään 6 merkkiä.";
       errorDiv.style.display = 'block';
       return;
    }

    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => {
         alert("Tunnus luotu onnistuneesti!");
         app.router('home');
      })
      .catch((error) => {
        errorDiv.textContent = "Virhe luonnissa: " + error.message;
        errorDiv.style.display = 'block';
      });
  },

  logout: () => {
    signOut(auth).then(() => {
      app.router('home');
    });
  }
};

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  window.app.currentUser = user;
  const authBtn = document.getElementById('authButton');
  const logoutBtn = document.getElementById('logoutButton');
  const userDisplay = document.getElementById('userNameDisplay');

  // Varmistetaan, että DOM on latautunut
  if(authBtn && logoutBtn && userDisplay) {
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

document.addEventListener('DOMContentLoaded', () => {
    app.router('home');
});
