import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// --- APUFUNKTIOT ---

// Luo lyhyt ID (esim. "K8J2M")
function generateShortId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Ei I, 1, O, 0 sekaannusten välttämiseksi
    let result = "";
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// --- PÄÄFUNKTIOT ---

export const initAuth = (auth, db, appState) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // 1. Haetaan käyttäjän tiedot kannasta
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                
                // TARKISTETAAN ONKO TILI LUKITTU/ODOTTAA
                if (data.status === 'pending' || data.status === 'blocked') {
                    appState.currentUser = null;
                    appState.userRole = 'guest';
                    appState.router('locked_view'); // Ohjataan "Odottaa hyväksyntää" -sivulle
                    return;
                }

                appState.currentUser = user;
                appState.savedNickname = data.nickname || user.displayName;
                appState.savedId = data.gcId || "";
                appState.userRole = data.role || 'user'; // 'admin' tai 'user'
                appState.userPlan = data.plan || 'free'; // 'free' tai 'premium'
                appState.shortId = data.shortId; // Tärkeä maksuja varten

                // Tarkistetaan onko Premium voimassa
                if (data.premiumExpires) {
                    const now = new Date();
                    const expiry = data.premiumExpires.toDate();
                    if (now > expiry && data.plan === 'premium') {
                        // Premium vanhentunut -> palautetaan free
                        await updateDoc(userRef, { plan: 'free' });
                        appState.userPlan = 'free';
                        alert("Premium-tilauksesi on päättynyt.");
                    }
                }

                console.log(`Kirjautunut: ${appState.savedNickname} (${appState.userRole})`);
                
                // Ohjataan etusivulle jos ei olla siellä
                const currentHash = window.location.hash.replace('#', '');
                if (!currentHash || currentHash === 'login_view') {
                    appState.router('home');
                }
                
                updateUI(appState.savedNickname, true);
            } else {
                // Vanha käyttäjä ilman docia tai Google-kirjautuminen ekaa kertaa
                // Luodaan doc oletusarvoilla
                const shortId = generateShortId();
                await setDoc(userRef, {
                    email: user.email,
                    nickname: user.displayName || "Nimetön",
                    role: 'user',
                    status: 'approved', // Google-kirjautujat oletuksena approved? Tai 'pending'
                    plan: 'free',
                    shortId: shortId,
                    createdAt: serverTimestamp()
                });
                // Ladataan sivu uudestaan jotta tiedot päivittyvät
                window.location.reload();
            }
        } else {
            appState.currentUser = null;
            appState.savedNickname = null;
            appState.userRole = 'guest';
            console.log("Ei kirjautunutta käyttäjää");
            updateUI("", false);
            // Jos ollaan suojatulla sivulla, heitetään login-ruutuun
            const currentHash = window.location.hash.replace('#', '');
            if (['stats', 'generator'].includes(currentHash)) {
                appState.router('login_view');
            }
        }
    });
};

function updateUI(name, isLoggedIn) {
    const nameDisplay = document.getElementById('userNameDisplay');
    const loginBtn = document.getElementById('authButton');
    const logoutBtn = document.getElementById('logoutButton');

    if (isLoggedIn) {
        nameDisplay.textContent = name;
        nameDisplay.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        nameDisplay.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

// --- REKISTERÖINTI (UUSI LOGIIKKA) ---
export const handleRegister = async (auth, db, email, password, nickname, onSuccess) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const shortId = generateShortId();

        // Haetaan järjestelmän asetukset (onko rekisteröinti lukossa?)
        // Oletus: Jos asetusta ei ole, kaikki hyväksytään.
        let initialStatus = 'approved';
        try {
            const settingsSnap = await getDoc(doc(db, "settings", "global"));
            if (settingsSnap.exists() && settingsSnap.data().requireApproval) {
                initialStatus = 'pending';
            }
        } catch(e) { console.log("Asetuksia ei löytynyt, käytetään oletusta."); }

        // Tallennetaan käyttäjän tiedot Firestoreen
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            nickname: nickname || "Nimetön",
            shortId: shortId,
            role: 'user',
            status: initialStatus, // 'pending' tai 'approved'
            plan: 'free',
            createdAt: serverTimestamp()
        });

        if (initialStatus === 'pending') {
            alert("Tili luotu! Odottaa ylläpitäjän hyväksyntää.");
        } else {
            alert(`Tervetuloa! Sinun ID:si on ${shortId}`);
        }
        
        if(onSuccess) onSuccess('home');

    } catch (error) {
        console.error(error);
        alert("Rekisteröinti epäonnistui: " + error.message);
    }
};

export const handleEmailLogin = async (auth, email, password, onError, onSuccess) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        if(onSuccess) onSuccess('home');
    } catch (error) {
        if(onError) onError("Virhe: " + error.message);
    }
};

export const loginGoogle = (auth, callback) => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(() => callback('home'))
        .catch((error) => alert(error.message));
};

export const logout = (auth, callback) => {
    signOut(auth).then(() => {
        window.location.reload(); // Ladataan sivu uusiksi tyhjentämään muistit
    });
};

// --- OMAN TILIN POISTO ---
export const deleteMyAccount = async (auth, db) => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = confirm("Oletko varma? Tämä poistaa kaikki tietosi ja tilastosi pysyvästi. Tätä ei voi perua.");
    if (!confirmDelete) return;

    try {
        // 1. Poistetaan tiedot Firestoresta
        await deleteDoc(doc(db, "users", user.uid));
        await deleteDoc(doc(db, "stats", user.uid)); // Jos on tilastoja

        // 2. Poistetaan käyttäjä Authista
        await deleteUser(user);
        
        alert("Tili poistettu.");
        window.location.reload();
    } catch (error) {
        console.error(error);
        // Jos istunto on vanhentunut, vaaditaan uusi kirjautuminen ennen poistoa
        if (error.code === 'auth/requires-recent-login') {
            alert("Tietoturvasyistä kirjaudu sisään uudelleen ja yritä poistoa heti sen jälkeen.");
            logout(auth, () => {});
        } else {
            alert("Virhe poistossa: " + error.message);
        }
    }
};

// --- KAVERILISTA (Pysyy samana) ---
export const saveGCNickname = async (db, uid, nickname, gcId) => {
    if(!uid) return alert("Kirjaudu ensin!");
    try {
        await updateDoc(doc(db, "users", uid), {
            nickname: nickname,
            gcId: gcId
        });
        alert("Tallennettu!");
        window.location.reload();
    } catch (e) { console.error(e); alert("Virhe tallennuksessa."); }
};

export const addFriend = async (db, uid, name, id, onSuccess) => {
    if(!uid || !name) return;
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        let friends = userSnap.data().friends || [];
        
        // Estetään duplikaatit
        if(!friends.find(f => f.name.toLowerCase() === name.toLowerCase())) {
            friends.push({ name: name, id: id || "" });
            await updateDoc(userRef, { friends: friends });
            if(onSuccess) onSuccess();
        } else {
            alert("Kaveri on jo listalla.");
        }
    } catch (e) { console.error(e); }
};

export const removeFriend = async (db, uid, name, onSuccess) => {
    if(!uid) return;
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        let friends = userSnap.data().friends || [];
        friends = friends.filter(f => f.name !== name);
        await updateDoc(userRef, { friends: friends });
        if(onSuccess) onSuccess();
    } catch (e) { console.error(e); }
};

export const loadFriends = async (db, uid, containerId, datalistId) => {
    if (!uid) return;
    try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
            const friends = userSnap.data().friends || [];
            window.app.friendsList = friends; // Tallennetaan globaalisti
            
            // Päivitetään UI jos elementit on olemassa
            const container = document.getElementById(containerId);
            const datalist = document.getElementById(datalistId);
            
            if (container) {
                container.innerHTML = friends.length ? '' : '<span style="opacity:0.5; font-size:0.9em;">Ei tallennettuja kavereita.</span>';
                friends.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'friend-item';
                    div.innerHTML = `
                        <span>${f.name} <span style="font-size:0.8em; opacity:0.6;">(${f.id || '-'})</span></span>
                        <button class="btn-delete" onclick="app.removeFriend('${f.name}')">✕</button>
                    `;
                    container.appendChild(div);
                });
            }
            if (datalist) {
                datalist.innerHTML = '';
                friends.forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f.name;
                    datalist.appendChild(opt);
                });
            }
        }
    } catch (e) { console.error("Kaverilistan latausvirhe", e); }
};
