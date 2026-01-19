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

                // TARKISTUS: Jos vanhalla käyttäjällä ei ole shortId:tä, luodaan se nyt
                if (!data.shortId) {
                    const newShortId = generateShortId();
                    await updateDoc(userRef, { shortId: newShortId });
                    data.shortId = newShortId; // Päivitetään paikalliseen muuttujaan heti
                    console.log("Luotiin puuttuva Short ID vanhalle käyttäjälle.");
                }

                appState.currentUser = user;
                appState.savedNickname = data.nickname || user.displayName;
                appState.savedId = data.gcId || "";
                appState.userRole = data.role || 'user';
                appState.userPlan = data.plan || 'free';
                appState.shortId = data.shortId; 

                // Premium-tarkistus
                if (data.premiumExpires) {
                    const now = new Date();
                    const expiry = data.premiumExpires.toDate();
                    if (now > expiry && data.plan === 'premium') {
                        await updateDoc(userRef, { plan: 'free' });
                        appState.userPlan = 'free';
                        alert("Premium-tilauksesi on päättynyt.");
                    }
                }

                console.log(`Kirjautunut: ${appState.savedNickname} (${appState.userRole})`);
                
                const currentHash = window.location.hash.replace('#', '');
                if (!currentHash || currentHash === 'login_view') {
                    appState.router('home');
                }
            } else {
                // Uusi käyttäjä (esim. Google-login ekaa kertaa)
                const shortId = generateShortId();
                await setDoc(userRef, {
                    email: user.email,
                    nickname: user.displayName || "Nimetön",
                    role: 'user',
                    status: 'approved', 
                    plan: 'free',
                    shortId: shortId,
                    saved_usernames: [], // Alustetaan kaverilista
                    createdAt: serverTimestamp()
                });
                window.location.reload();
            }
        } else {
            appState.currentUser = null;
            appState.savedNickname = null;
            appState.userRole = 'guest';
            const currentHash = window.location.hash.replace('#', '');
            if (['stats', 'generator', 'settings', 'admin'].includes(currentHash)) {
                appState.router('login_view');
            }
        }
    });
};

// --- REKISTERÖINTI ---
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
            saved_usernames: [], // Tyhjä kaverilista
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

// --- KAVERILISTA (KORJATTU KENTÄN NIMI: saved_usernames) ---

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
        // KORJAUS: Käytetään 'saved_usernames' kenttää 'friends' sijaan
        let friends = userSnap.data().saved_usernames || userSnap.data().friends || [];
        
        if(!friends.find(f => f.name.toLowerCase() === name.toLowerCase())) {
            friends.push({ name: name, id: id || "" });
            // Tallennetaan nimellä saved_usernames
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

export const loadFriends = async (db, uid, containerId, datalistId) => {
    if (!uid) return;
    try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
            // KORJAUS: Luetaan saved_usernames
            const friends = userSnap.data().saved_usernames || userSnap.data().friends || [];
            window.app.friendsList = friends; 
            
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
