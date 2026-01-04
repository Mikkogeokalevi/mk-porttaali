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
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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
        // Haetaan käyttäjänimi valmiiksi, jos kirjautunut
        const defaultUser = window.app.currentUser ? (window.app.currentUser.displayName || window.app.currentUser.email.split('@')[0]) : '';
        
        // Luodaan vuosivalinnat dynaamisesti
        const currentYear = new Date().getFullYear();
        let yearOptions = '<option value="current">—</option>';
        for (let y = currentYear; y >= 2000; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        content.innerHTML = `
          <div class="card">
            <h1>Kuvageneraattori</h1>
            
            <label>Käyttäjätunnus:</label>
            <input type="text" id="genUser" value="${defaultUser}" placeholder="esim. mikkokalevi">

            <label>Kuvan tyyppi:</label>
            <select id="genType" style="width:100%; padding:10px; margin: 8px 0; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:8px;">
              <option value="matrix">T/D-taulukko</option>
              <option value="kunta">Kuntakartta</option>
              <option value="year">Vuosikalenteri</option>
              <option value="ftfkunta">FTF kuntakartta</option>
              <option value="hiddenday">Jasmer</option>
              <option value="saari">Saarilöydöt</option>
            </select>

            <label>Aikarajaus:</label>
            <select id="genTimeSelect" onchange="app.toggleTimeFields()" style="width:100%; padding:10px; margin: 8px 0; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:8px;">
              <option value="ei">Ei aikarajausta</option>
              <option value="kylla">Valitse aikaväli</option>
            </select>

            <div id="timeFields" class="hidden" style="border: 1px solid var(--border-color); padding: 10px; margin-bottom: 10px; border-radius: 8px;">
              <label>Vuosi:</label>
              <select id="genYear" style="width:100%; padding:10px; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color);">${yearOptions}</select>
              
              <label>Tai tarkka väli:</label>
              <input type="date" id="genStart">
              <input type="date" id="genEnd">
            </div>

            <label>Kätkötyyppi:</label>
            <select id="genCacheType" style="width:100%; padding:10px; margin: 8px 0; background:var(--input-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:8px;">
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
             <img id="generatedImg" src="" style="max-width:100%; height:auto; border:1px solid var(--border-color); border-radius:8px;">
             <br>
             <a id="openLink" href="#" target="_blank" class="btn" style="margin-top:10px;">Avaa isona</a>
          </div>
        `;
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
    
    // Jasmer-spesifinen
    if (type === "hiddenday") params += `&type=2`;

    // Aikavalinnat
    if (timeMode === "kylla") {
        if (start && end) {
           params += `&startdate=${formatDate(start)}&enddate=${formatDate(end)}`;
        } else if (year && year !== "current") {
           params += `&year=${year}`;
        }
    }

    if (cacheType) params += `&cachetype=${cacheType}`;

    const finalUrl = `${baseUrl}${type}.php${params}`;
    
    // Näytä tulos
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

// Auth Listener
onAuthStateChanged(auth, (user) => {
  window.app.currentUser = user;
  const authBtn = document.getElementById('authButton');
  const logoutBtn = document.getElementById('logoutButton');
  const userDisplay = document.getElementById('userNameDisplay');

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
