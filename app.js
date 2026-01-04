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
        content.innerHTML = `
          <div class="card">
            <h1>Kuvageneraattori</h1>
            <p>🚧 Siirretään seuraavaksi.</p>
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
            <p>🚧 Tilastot tulevat tähän.</p>
          </div>
        `;
        break;

      case 'login':
        content.innerHTML = `
          <div class="card" style="max-width: 400px; margin: 0 auto;">
            <h1>Kirjaudu sisään</h1>
            <p>Pääsy omiin työkaluihin ja tilastoihin.</p>
            
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

  // UI Toiminnot
  toggleMenu: () => {
    const nav = document.getElementById('mainNav');
    nav.classList.toggle('open');
  },

  // Auth Toiminnot
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

  // Varmistetaan että elementit ovat olemassa ennen muokkausta (ettei tule virheitä latauksessa)
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

// Käynnistys: odotetaan että DOM on valmis
document.addEventListener('DOMContentLoaded', () => {
    app.router('home');
});
