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

// Tämä funktio käynnistää kuuntelijan, joka päivittää yläpalkin
export function initAuth(auth, db, appState) {
    onAuthStateChanged(auth, (user) => {
        appState.currentUser = user;
        updateAuthUI(user);
        
        // Jos ollaan "triplet"-näkymässä ja kirjaudutaan sisään, ladataan data heti
        if (user && document.getElementById('tripletResults')) {
             // Tässä voisi kutsua datan latausta, mutta hoidetaan se routerin kautta
             console.log("Käyttäjä tunnistettu, valmis lataamaan dataa.");
        }
    });
}

// Päivittää yläpalkin napit (Kirjaudu vs Ulos)
function updateAuthUI(user) {
    const authBtn = document.getElementById('authButton');
    const logoutBtn = document.getElementById('logoutButton');
    const userDisplay = document.getElementById('userNameDisplay');
    const authContainer = document.getElementById('authContainer');

    if (user) {
        // Kirjautunut sisään
        if(authBtn) authBtn.classList.add('hidden');
        if(logoutBtn) logoutBtn.classList.remove('hidden');
        
        if(userDisplay) {
            userDisplay.textContent = user.displayName || user.email;
            userDisplay.classList.remove('hidden');
        }
    } else {
        // Kirjautunut ulos
        if(authBtn) authBtn.classList.remove('hidden');
        if(logoutBtn) logoutBtn.classList.add('hidden');
        if(userDisplay) {
            userDisplay.textContent = '';
            userDisplay.classList.add('hidden');
        }
    }
}

// Kirjautumisfunktiot
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

// Kaverilistan hallinta (Database-toiminnot)
export const loadFriends = async (db, userId, containerId, datalistId) => {
    if (!userId) return;
    try {
        const docSnap = await getDoc(doc(db, "users", userId));
        const container = document.getElementById(containerId);
        const datalist = document.getElementById(datalistId);
        
        if (!container) return;
        container.innerHTML = ''; 
        if(datalist) datalist.innerHTML = '';
        
        if (docSnap.exists() && docSnap.data().saved_usernames) {
            docSnap.data().saved_usernames.sort().forEach(name => {
                container.innerHTML += `<div class="friend-item"><span>${name}</span><button class="btn-delete" onclick="app.removeFriend('${name}')">✕</button></div>`;
                if(datalist) datalist.innerHTML += `<option value="${name}"></option>`;
            });
        } else { 
            container.innerHTML = '<p style="font-size:0.9em;">Ei tallennettuja nimiä.</p>'; 
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
