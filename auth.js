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

function generateShortId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

// UI-päivitysfunktio (KORJATTU NÄYTTÄMÄÄN NIMI TAI SÄHKÖPOSTI)
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

export const initAuth = (auth, db, appState) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                
                if (data.status === 'pending' || data.status === 'blocked') {
                    appState.currentUser = null;
                    appState.userRole = 'guest';
                    appState.router('locked_view');
                    return;
                }

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

                // Premium check
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
                // Uusi käyttäjä ilman docia (esim. Google login ekaa kertaa)
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
            appState.currentUser = null;
            appState.userRole = 'guest';
            updateUI(null, appState); // UI päivitys uloskirjautuneelle
            
            const currentHash = window.location.hash.replace('#', '');
            if (['stats', 'generator', 'settings', 'admin'].includes(currentHash)) {
                appState.router('login_view');
            }
        }
    });
};

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

        if (initialStatus === 'pending') alert("Tili luotu! Odottaa hyväksyntää.");
        else alert(`Tervetuloa! ID: ${shortId}`);
        
        if(onSuccess) onSuccess('home');
    } catch (error) { alert("Virhe: " + error.message); }
};

export const handleEmailLogin = async (auth, email, password, onError, onSuccess) => {
    try { await signInWithEmailAndPassword(auth, email, password); if(onSuccess) onSuccess('home'); } 
    catch (error) { if(onError) onError("Virhe: " + error.message); }
};

export const loginGoogle = (auth, callback) => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then(() => callback('home')).catch((e) => alert(e.message));
};

export const logout = (auth, callback) => {
    signOut(auth).then(() => window.location.reload());
};

export const deleteMyAccount = async (auth, db) => {
    const user = auth.currentUser;
    if (!user) return;
    if (!confirm("Poistetaanko tili pysyvästi?")) return;
    try {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteDoc(doc(db, "stats", user.uid));
        await deleteUser(user);
        alert("Tili poistettu.");
        window.location.reload();
    } catch (e) { alert("Virhe: " + e.message); }
};

export const saveGCNickname = async (db, uid, nickname, gcId) => {
    if(!uid) return;
    try { await updateDoc(doc(db, "users", uid), { nickname: nickname, gcId: gcId }); alert("Tallennettu!"); window.location.reload(); } 
    catch (e) { alert("Virhe tallennuksessa."); }
};

export const addFriend = async (db, uid, name, id, onSuccess) => {
    if(!uid || !name) return;
    try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        // KORJAUS: Luetaan saved_usernames
        let list = snap.data().saved_usernames || snap.data().friends || [];
        if(!list.find(f => f.name.toLowerCase() === name.toLowerCase())) {
            list.push({ name: name, id: id || "" });
            await updateDoc(ref, { saved_usernames: list });
            if(onSuccess) onSuccess();
        } else alert("On jo listalla.");
    } catch (e) { console.error(e); }
};

export const removeFriend = async (db, uid, name, onSuccess) => {
    if(!uid) return;
    try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        let list = snap.data().saved_usernames || snap.data().friends || [];
        list = list.filter(f => f.name !== name);
        await updateDoc(ref, { saved_usernames: list });
        if(onSuccess) onSuccess();
    } catch (e) { console.error(e); }
};

export const loadFriends = async (db, uid, containerId, datalistId) => {
    if (!uid) return;
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const list = snap.data().saved_usernames || snap.data().friends || [];
            window.app.friendsList = list;
            const container = document.getElementById(containerId);
            const datalist = document.getElementById(datalistId);
            if (container) {
                container.innerHTML = list.length ? '' : '<span style="opacity:0.5; font-size:0.9em;">Ei tallennettuja kavereita.</span>';
                list.forEach(f => {
                    const div = document.createElement('div');
                    div.className = 'friend-item';
                    div.innerHTML = `<span>${f.name} <span style="font-size:0.8em; opacity:0.6;">(${f.id || '-'})</span></span><button class="btn-delete" onclick="app.removeFriend('${f.name}')">✕</button>`;
                    container.appendChild(div);
                });
            }
            if (datalist) {
                datalist.innerHTML = '';
                list.forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f.name;
                    datalist.appendChild(opt);
                });
            }
        }
    } catch (e) { console.error(e); }
};
