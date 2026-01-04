import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const provider = new GoogleAuthProvider();

// Käynnistää kuuntelijan ja päivittää UI:n
export function initAuth(auth, db, appState) {
    onAuthStateChanged(auth, async (user) => {
        appState.currentUser = user;
        
        if (user) {
            // Kun käyttäjä kirjautuu, haetaan heti hänen tallennettu nimimerkkinsä
            const profile = await getUserProfile(db, user.uid);
            if (profile && profile.gc_nickname) {
                // Tallennetaan se sovelluksen tilaan, jotta generaattori löytää sen
                appState.savedNickname = profile.gc_nickname;
            }
        } else {
            appState.savedNickname = null;
        }
        
        updateAuthUI(user);
    });
}

// Päivittää yläpalkin napit
function updateAuthUI(user) {
    const authBtn = document.getElementById('authButton');
    const logoutBtn = document.getElementById('logoutButton'); // Jos on erillinen nappi jossain
    const userDisplay = document.getElementById('userNameDisplay');
    const authContainer = document.getElementById('authContainer');

    // Koska meillä on navigaatiossa "Kirjaudu" nappi, muutetaan sen tekstiä
    if (authBtn) {
        if (user) {
            authBtn.textContent = "Kirjaudu ulos";
            authBtn.onclick = () => window.app.logout();
            
            if(userDisplay) {
                userDisplay.textContent = user.displayName || user.email;
                userDisplay.classList.remove('hidden');
            }
        } else {
            authBtn.textContent = "Kirjaudu";
            authBtn.onclick = () => window.app.router('login_view');
            
            if(userDisplay) userDisplay.classList.add('hidden');
        }
    }
}

// --- KIRJAUTUMISTOIMINNOT ---

export const loginGoogle = (auth, onSuccess) => {
    signInWithPopup(auth, provider)
        .then(() => onSuccess('home'))
        .catch(e => alert(e.message));
};

export const handleEmailLogin = (auth, email, password, onError, onSuccess) => {
    signInWithEmailAndPassword(auth, email, password)
        .then(() => onSuccess('home'))
        .catch(err => onError(err.message));
};

export const handleRegister = (auth, email, password, onError, onSuccess) => {
    if(password.length < 6) return alert("Salasana liian lyhyt (min 6 merkkiä)");
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => { 
            alert("Tunnus luotu! Olet nyt kirjautunut."); 
            onSuccess('home'); 
        })
        .catch(err => onError(err.message));
};

export const logout = (auth, onSuccess) => {
    signOut(auth)
        .then(() => onSuccess('home'))
        .catch(e => console.error(e));
};

// --- TIETOKANTA: KAVERIT & PROFIILI ---

// Hakee käyttäjän profiilin (sis. nimimerkin ja kaverit)
export const getUserProfile = async (db, userId) => {
    if (!userId) return null;
    try {
        const docSnap = await getDoc(doc(db, "users", userId));
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
        console.error("Profiilin haku epäonnistui:", e);
        return null;
    }
};

// Tallentaa oman kätkönimen oletukseksi
export const saveGCNickname = async (db, userId, name) => {
    if (!userId) return alert("Kirjaudu ensin!");
    if (!name) return alert("Nimi ei voi olla tyhjä.");
    
    try {
        await setDoc(doc(db, "users", userId), { gc_nickname: name }, { merge: true });
        alert(`Nimimerkki "${name}" tallennettu oletukseksi! Se täytetään automaattisesti jatkossa.`);
        // Päivitetään heti tilaan myös
        if (window.app) window.app.savedNickname = name;
    } catch (e) {
        alert("Virhe tallennuksessa: " + e.message);
    }
};

// Lataa kaverilistan ja renderöi sen (käytetään generaattorissa)
export const loadFriends = async (db, userId, containerId, datalistId) => {
    if (!userId) return;
    try {
        const data = await getUserProfile(db, userId);
        const container = document.getElementById(containerId);
        const datalist = document.getElementById(datalistId);
        
        if (!container) return;
        container.innerHTML = ''; 
        if(datalist) datalist.innerHTML = '';
        
        if (data && data.saved_usernames) {
            data.saved_usernames.sort().forEach(name => {
                // UI-lista hallintaan
                container.innerHTML += `<div class="friend-item"><span>${name}</span><button class="btn-delete" onclick="app.removeFriend('${name}')">✕</button></div>`;
                // Datalist inputille
                if(datalist) datalist.innerHTML += `<option value="${name}"></option>`;
            });
        } else { 
            container.innerHTML = '<p style="font-size:0.9em; opacity:0.7;">Ei tallennettuja kavereita.</p>'; 
        }
    } catch (e) { console.error(e); }
};

export const addFriend = async (db, userId, name, onSuccess) => {
    if (!userId || !name) return;
    try {
        await setDoc(doc(db, "users", userId), { saved_usernames: arrayUnion(name) }, { merge: true });
        onSuccess();
    } catch (e) { alert(e.message); }
};

export const removeFriend = async (db, userId, name, onSuccess) => {
    if (!userId || !confirm(`Poista ${name}?`)) return;
    try {
        await updateDoc(doc(db, "users", userId), { saved_usernames: arrayRemove(name) });
        onSuccess();
    } catch (e) { console.error(e); }
};
