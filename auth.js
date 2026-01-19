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

function generateShortId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// UI-päivitysfunktio: Hoitaa yläpalkin napit ja nimen näytön
function updateUI(user, appState) {
    const nameDisplay = document.getElementById('userNameDisplay');
    const loginBtn = document.getElementById('authButton');
    const logoutBtn = document.getElementById('logoutButton');

    if (user) {
        // Päätellään näytettävä nimi: Tallennettu nikki -> Googlen nimi -> Sähköposti
        let displayName = appState.savedNickname;
        if (!displayName || displayName === 'Nimetön') {
            displayName = user.displayName || user.email.split('@')[0];
        }

        if (nameDisplay) {
            nameDisplay.textContent = displayName;
            nameDisplay.classList.remove('hidden');
        }
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (nameDisplay) nameDisplay.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

// --- PÄÄFUNKTIOT ---

export const initAuth = (auth, db, appState) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                
                // TARKISTUS: Jos tili on lukittu
                if (data.status === 'pending' || data.status === 'blocked') {
                    appState.currentUser = null;
                    appState.userRole = 'guest';
                    appState.router('locked_view');
                    return;
                }

                // TARKISTUS: Jos vanhalla käyttäjällä ei ole shortId:tä, luodaan se
                if (!data.shortId) {
                    const newShortId = generateShortId();
                    await updateDoc(userRef, { shortId: newShortId });
                    data.shortId = newShortId;
                }

                appState.currentUser = user;
                appState.savedNickname = data.nickname || "";
                appState.savedId = data.gcId || "";
                appState.userRole = data.role || 'user';
                appState.userPlan = data.plan || 'free';
                appState.shortId = data.shortId;
                
                // Tallennetaan premium-päättymispäivä muistiin asetuksia varten
                appState.premiumExpires = data.premiumExpires ? data.premiumExpires.toDate() : null;

                // Premium-tarkistus (onko aika kulunut umpeen)
                if (data.premiumExpires) {
                    const now = new Date();
                    if (now > data.premiumExpires.toDate() && data.plan === 'premium') {
                        await updateDoc(userRef, { plan: 'free' });
                        appState.userPlan = 'free';
                    }
                }

                console.log("Kirjautunut:", appState.savedNickname || user.email);
                
                // PÄIVITETÄÄN UI HETI KIRJAUTUMISEN JÄLKEEN
                updateUI(user, appState);

                const currentHash = window.location.hash.replace('#', '');
                if (!currentHash || currentHash === 'login_view') {
                    appState.router('home');
                }
            } else {
                // Uusi käyttäjä ilman tietokantamerkintää (esim. Google-login ekaa kertaa)
                const shortId = generateShortId();
                await setDoc(userRef, {
                    email: user.email,
                    nickname: user.displayName || "Nimetön",
                    role: 'user',
                    status: 'approved',
                    plan: 'free',
                    shortId: shortId,
                    saved_usernames: [],
                    createdAt: serverTimestamp()
                });
                window.location.reload();
            }
        } else {
            // Uloskirjautunut
            appState.currentUser = null;
            appState.userRole = 'guest';
            updateUI(null, appState);
            
            const currentHash = window.location.hash.replace('#', '');
            if (['stats', 'generator', 'settings', 'admin'].includes(currentHash)) {
                appState.router('login_view');
            }
        }
    });
};

// --- REKISTERÖINTI JA KIRJAUTUMINEN ---

export const handleRegister = async (auth, db, email, password, nickname, onSuccess) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const shortId = generateShortId();

        let initialStatus = 'approved';
        try {
            const settingsSnap = await getDoc(doc(db, "settings", "global"));
            if (settingsSnap.exists() && settingsSnap.data().requireApproval) {
                initialStatus = 'pending';
            }
        } catch(e) {}

        await setDoc(doc(db, "users", user.uid), {
            email: email,
            nickname: nickname || "Nimetön",
            shortId: shortId,
            role: 'user',
            status: initialStatus,
            plan: 'free',
            saved_usernames: [],
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
        window.location.reload();
    });
};

export const deleteMyAccount = async (auth, db) => {
    const user = auth.currentUser;
    if (!user) return;
    const confirmDelete = confirm("Oletko varma? Tämä poistaa kaikki tietosi ja tilastosi pysyvästi.");
    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteDoc(doc(db, "stats", user.uid));
        await deleteUser(user);
        alert("Tili poistettu.");
        window.location.reload();
    } catch (error) {
        alert("Virhe poistossa: " + error.message);
    }
};

// --- KAVERILISTA JA TIETOJEN TALLENNUS ---

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
        let friends = userSnap.data().saved_usernames || userSnap.data().friends || [];
        
        if(!friends.find(f => f.name.toLowerCase() === name.toLowerCase())) {
            friends.push({ name: name, id: id || "" });
            await updateDoc(userRef, { saved_usernames: friends });
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
        let friends = userSnap.data().saved_usernames || userSnap.data().friends || [];
        
        friends = friends.filter(f => f.name !== name);
        
        await updateDoc(userRef, { saved_usernames: friends });
        if(onSuccess) onSuccess();
    } catch (e) { console.error(e); }
};

export const loadFriends = async (db, uid, containerId, selectId) => {
    if (!uid) return;
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const list = snap.data().saved_usernames || snap.data().friends || [];
            window.app.friendsList = list;
            
            // 1. Hallintalista (Asetukset-sivu)
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = list.length ? '' : '<span style="opacity:0.5; font-size:0.9em;">Ei tallennettuja kavereita.</span>';
                list.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'friend-item';
                    div.innerHTML = `
                        <span>${f.name} <span style="font-size:0.8em; opacity:0.6;">(${f.id || '-'})</span></span>
                        <button class="btn-delete" onclick="app.removeFriend('${f.name}')">✕</button>
                    `;
                    container.appendChild(div);
                });
            }

            // 2. Pudotusvalikko (Generaattori-sivu)
            const select = document.getElementById(selectId);
            if (select) {
                // Tyhjennetään ja lisätään oletusvalinta
                select.innerHTML = '<option value="">-- Valitse tallennettu kaveri --</option>';
                
                list.forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f.name;
                    // Lisätään teksti, jotta se näkyy valikossa
                    opt.textContent = f.name + (f.id ? ` (${f.id})` : ''); 
                    select.appendChild(opt);
                });

                // Jos listalla on kavereita, näytetään pudotusvalikko
                if (list.length > 0) {
                    select.style.display = 'block';
                } else {
                    select.style.display = 'none';
                }
            }
        }
    } catch (e) { console.error(e); }
};
