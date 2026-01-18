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

export function initAuth(auth, db, appState) {
    onAuthStateChanged(auth, async (user) => {
        appState.currentUser = user;
        if (user) {
            const profile = await getUserProfile(db, user.uid);
            if (profile && profile.gc_nickname) {
                appState.savedNickname = profile.gc_nickname;
                // Tallennetaan myös oma ID jos se on olemassa
                appState.savedId = profile.gc_id || null;
            }
        } else {
            appState.savedNickname = null;
            appState.savedId = null;
        }
        updateAuthUI(user);
    });
}

function updateAuthUI(user) {
    const authBtn = document.getElementById('authButton');
    const userDisplay = document.getElementById('userNameDisplay');
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

export const loginGoogle = (auth, onSuccess) => {
    signInWithPopup(auth, provider).then(() => onSuccess('home')).catch(e => alert(e.message));
};

export const handleEmailLogin = (auth, email, password, onError, onSuccess) => {
    signInWithEmailAndPassword(auth, email, password).then(() => onSuccess('home')).catch(err => onError(err.message));
};

export const handleRegister = (auth, email, password, onError, onSuccess) => {
    if(password.length < 6) return alert("Salasana liian lyhyt");
    createUserWithEmailAndPassword(auth, email, password).then(() => { alert("Luotu!"); onSuccess('home'); }).catch(err => onError(err.message));
};

export const logout = (auth, onSuccess) => {
    signOut(auth).then(() => onSuccess('home')).catch(e => console.error(e));
};

export const getUserProfile = async (db, userId) => {
    if (!userId) return null;
    try {
        const docSnap = await getDoc(doc(db, "users", userId));
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) { return null; }
};

// PÄIVITETTY: Tallentaa nimen JA id:n
export const saveGCNickname = async (db, userId, name, id) => {
    if (!userId) return alert("Kirjaudu ensin!");
    if (!name) return alert("Nimi ei voi olla tyhjä.");
    try {
        const data = { gc_nickname: name };
        if (id) data.gc_id = id; // Tallenna ID jos annettu
        
        await setDoc(doc(db, "users", userId), data, { merge: true });
        alert(`Tallennettu: ${name} (ID: ${id || '-'})`);
        
        if (window.app) {
            window.app.savedNickname = name;
            window.app.savedId = id;
        }
    } catch (e) { alert("Virhe: " + e.message); }
};

// PÄIVITETTY: Lataa kaverit ja tallentaa ne globaaliin muuttujaan
export const loadFriends = async (db, userId, containerId, datalistId) => {
    if (!userId) return;
    try {
        const data = await getUserProfile(db, userId);
        const container = document.getElementById(containerId);
        const datalist = document.getElementById(datalistId);
        
        if (!container) return;
        container.innerHTML = ''; 
        if(datalist) datalist.innerHTML = '';
        
        // Tallennetaan kaverilista muistiin generaattoria varten
        window.app.friendsList = [];

        if (data && data.saved_usernames) {
            // Järjestetään aakkosjärjestykseen
            data.saved_usernames.sort((a, b) => {
                const nameA = (typeof a === 'object' ? a.name : a).toLowerCase();
                const nameB = (typeof b === 'object' ? b.name : b).toLowerCase();
                return nameA.localeCompare(nameB);
            });

            data.saved_usernames.forEach(item => {
                // Käsitellään sekä vanhaa (string) että uutta (object) formaattia
                const name = typeof item === 'object' ? item.name : item;
                const id = typeof item === 'object' ? item.id : null;
                
                window.app.friendsList.push({ name, id });

                // UI
                const idText = id ? `<span style="font-size:0.8em; color:var(--accent-color); margin-left:5px;">(#${id})</span>` : '';
                container.innerHTML += `
                    <div class="friend-item">
                        <div>
                            <span>${name}</span>
                            ${idText}
                        </div>
                        <button class="btn-delete" onclick="app.removeFriend('${name}')">✕</button>
                    </div>`;
                
                if(datalist) datalist.innerHTML += `<option value="${name}"></option>`;
            });
        } else { 
            container.innerHTML = '<p style="font-size:0.9em; opacity:0.7;">Ei tallennettuja kavereita.</p>'; 
        }
    } catch (e) { console.error(e); }
};

// PÄIVITETTY: Lisää kaverin objektina {name, id}
export const addFriend = async (db, userId, name, id, onSuccess) => {
    if (!userId || !name) return;
    try {
        const friendObj = { name: name, id: id || null };
        await setDoc(doc(db, "users", userId), { saved_usernames: arrayUnion(friendObj) }, { merge: true });
        onSuccess();
    } catch (e) { alert(e.message); }
};

// PÄIVITETTY: Poistaa kaverin (etsii nimen perusteella listasta)
export const removeFriend = async (db, userId, nameToRemove, onSuccess) => {
    if (!userId || !confirm(`Poista ${nameToRemove}?`)) return;
    try {
        // Koska arrayRemove vaatii tarkan objektin, meidän pitää ensin hakea se
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const list = docSnap.data().saved_usernames || [];
            // Etsitään poistettava (joko string tai objekti)
            const itemToRemove = list.find(item => {
                const n = typeof item === 'object' ? item.name : item;
                return n === nameToRemove;
            });

            if (itemToRemove) {
                await updateDoc(docRef, { saved_usernames: arrayRemove(itemToRemove) });
                onSuccess();
            }
        }
    } catch (e) { console.error(e); }
};
