import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    setDoc, 
    query, 
    orderBy,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Tuotekoodit ja niiden kestot (päivinä)
const PRODUCTS = {
    'T-1VK': 7,
    'T-3KK': 90,
    'T-6KK': 180,
    'T-1V': 365,
    'T-LIFE': 36500 // 100 vuotta
};

export const renderAdminView = async (content, db, currentUser) => {
    // 1. Turvatarkistus: Onko käyttäjä admin?
    if (!currentUser) return;
    
    // Haetaan käyttäjän rooli varmistukseksi kannasta
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (!userSnap.exists() || userSnap.data().role !== 'admin') {
        content.innerHTML = `<div class="card"><h1 style="color:red;">Pääsy evätty ⛔</h1><p>Sinulla ei ole ylläpitäjän oikeuksia.</p></div>`;
        return;
    }

    content.innerHTML = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>Ylläpito 🛠️</h1>
            <button class="btn" onclick="app.router('home')">⬅ Etusivulle</button>
        </div>
        
        <div class="tabs" style="margin-top:20px; border-bottom:1px solid #444; display:flex; gap:10px;">
            <button class="tab-btn active" onclick="app.adminSwitchTab('users')">Käyttäjät</button>
            <button class="tab-btn" onclick="app.adminSwitchTab('data')">Datan tuonti</button>
            <button class="tab-btn" onclick="app.adminSwitchTab('settings')">Asetukset</button>
        </div>

        <div id="adminTabUsers" class="admin-tab-content" style="margin-top:20px;">
            <p>Ladataan käyttäjiä...</p>
        </div>

        <div id="adminTabData" class="admin-tab-content hidden" style="margin-top:20px;">
            <h3>Datan päivitys (Geocache.fi)</h3>
            <p style="font-size:0.9em;">Kopioi taulukko "Löytötilasto paikkakunnittain" -sivulta ja liitä tähän.</p>
            <textarea id="statInput" rows="10" style="width:100%; background:#181825; color:#cdd6f4; border:1px solid #45475a; padding:10px;" placeholder="Paikkakunta Tradi Multi..."></textarea>
            <button class="btn btn-primary" id="processBtn" style="margin-top:10px;">Prosessoi & Tallenna</button>
            <div id="processLog" style="margin-top:10px; font-family:monospace; font-size:0.8em;"></div>
        </div>

        <div id="adminTabSettings" class="admin-tab-content hidden" style="margin-top:20px;">
            <h3>Yleiset asetukset</h3>
            <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
                <span>🔒 <strong>Vaadi hyväksyntä uusille käyttäjille</strong><br><span style="font-size:0.8em; opacity:0.7;">Jos päällä, uudet tilit menevät tilaan 'pending'.</span></span>
                <input type="checkbox" id="settingRequireApproval" style="transform:scale(1.5);">
            </div>
            <button class="btn btn-primary" id="saveSettingsBtn" style="margin-top:15px;">Tallenna asetukset</button>
        </div>
    </div>
    
    <style>
        .tab-btn { background:none; border:none; color:#aaa; padding:10px 15px; cursor:pointer; font-weight:bold; }
        .tab-btn.active { color:#fff; border-bottom:2px solid var(--accent-color); }
        .user-row { background:rgba(255,255,255,0.05); padding:10px; margin-bottom:10px; border-radius:6px; display:flex; flex-direction:column; gap:5px; }
        .user-header { display:flex; justify-content:space-between; font-weight:bold; }
        .user-meta { font-size:0.85em; opacity:0.7; display:flex; gap:15px; }
        .user-actions { display:flex; gap:10px; margin-top:5px; flex-wrap:wrap; }
        .badge { padding:2px 6px; border-radius:4px; font-size:0.8em; font-weight:bold; }
        .badge-pending { background:#f9e2af; color:#1e1e2e; }
        .badge-approved { background:#a6e3a1; color:#1e1e2e; }
        .badge-blocked { background:#f38ba8; color:#1e1e2e; }
        .badge-premium { background:#fab387; color:#1e1e2e; }
        .badge-free { background:#bac2de; color:#1e1e2e; }
    </style>
    `;

    // --- LOGIIKKA: Välilehdet ---
    window.app.adminSwitchTab = (tabName) => {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('adminTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    };

    // --- LOGIIKKA: Lataa käyttäjät ---
    const loadUsers = async () => {
        const container = document.getElementById('adminTabUsers');
        container.innerHTML = 'Ladataan...';
        
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            
            let html = '';
            snapshot.forEach(docSnap => {
                const u = docSnap.data();
                const uid = docSnap.id;
                
                // Status badge
                let statusBadge = `<span class="badge badge-${u.status}">${u.status.toUpperCase()}</span>`;
                
                // Plan badge
                let planBadge = `<span class="badge badge-${u.plan}">${u.plan.toUpperCase()}</span>`;
                if (u.plan === 'premium' && u.premiumExpires) {
                    const expDate = u.premiumExpires.toDate().toLocaleDateString();
                    planBadge += ` <span style="font-size:0.8em;">(-> ${expDate})</span>`;
                }

                html += `
                <div class="user-row">
                    <div class="user-header">
                        <span>${u.nickname} <span style="color:var(--accent-color); font-family:monospace;">[${u.shortId || '-'}]</span></span>
                        <div>${statusBadge} ${planBadge}</div>
                    </div>
                    <div class="user-meta">
                        <span>📧 ${u.email}</span>
                        <span>📅 ${u.createdAt ? u.createdAt.toDate().toLocaleDateString() : '-'}</span>
                    </div>
                    <div class="user-actions">
                        <select onchange="app.adminChangeStatus('${uid}', this.value)" style="padding:5px; border-radius:4px;">
                            <option value="pending" ${u.status==='pending'?'selected':''}>Pending</option>
                            <option value="approved" ${u.status==='approved'?'selected':''}>Approved</option>
                            <option value="blocked" ${u.status==='blocked'?'selected':''}>Blocked</option>
                        </select>
                        <button class="btn" style="padding:5px 10px; font-size:0.8em; background:#fab387; color:black;" onclick="app.adminAddPremium('${uid}')">💎 Lisää Premium</button>
                        <button class="btn" style="padding:5px 10px; font-size:0.8em; background:#f38ba8; color:black;" onclick="app.adminDeleteUser('${uid}')">🗑️ Poista</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html || '<p>Ei käyttäjiä.</p>';

        } catch (e) {
            console.error(e);
            container.innerHTML = `<p style="color:red">Virhe: ${e.message}</p>`;
        }
    };

    // --- LOGIIKKA: Datan prosessointi (Vanha admin.html toiminnallisuus) ---
    document.getElementById('processBtn').onclick = async () => {
        const raw = document.getElementById('statInput').value;
        const log = document.getElementById('processLog');
        log.innerHTML = "Aloitetaan...";
        
        try {
            const lines = raw.split('\n');
            const result = {};
            let count = 0;

            lines.forEach(line => {
                const parts = line.split('\t');
                if (parts.length > 5) {
                    const kunta = parts[0].trim();
                    if (kunta && kunta !== 'Paikkakunta' && kunta !== 'Summa') {
                        // Parsitaan arvot (Tradi, Multi, Webcam, Mysse...)
                        const vals = parts.slice(1).map(v => parseInt(v) || 0);
                        result[kunta] = { s: vals };
                        count++;
                    }
                }
            });

            if (count === 0) throw new Error("Ei dataa tunnistettu. Varmista että kopioit taulukon oikein.");

            // Tallennetaan adminin omiin tilastoihin (Admin voi sitten katsella niitä)
            // HUOM: Jos haluat päivittää *toisen* käyttäjän tilastoja, tämä logiikka pitää muuttaa.
            // Nyt tämä päivittää "logged in user" eli sinun omat tilastosi.
            await setDoc(doc(db, "stats", currentUser.uid), {
                municipalities: result,
                updatedAt: Timestamp.now()
            });

            log.innerHTML = `✅ Valmis! ${count} kuntaa päivitetty tietokantaan (Sinun tilillesi).`;

        } catch (e) {
            log.innerHTML = `❌ Virhe: ${e.message}`;
        }
    };

    // --- LOGIIKKA: Asetukset (Require Approval) ---
    const settingsRef = doc(db, "settings", "global");
    
    // Lataa nykyiset asetukset
    getDoc(settingsRef).then(snap => {
        if(snap.exists()) {
            document.getElementById('settingRequireApproval').checked = snap.data().requireApproval || false;
        }
    });

    document.getElementById('saveSettingsBtn').onclick = async () => {
        const val = document.getElementById('settingRequireApproval').checked;
        await setDoc(settingsRef, { requireApproval: val }, { merge: true });
        alert("Asetukset tallennettu.");
    };

    // --- GLOBAALIT ADMIN-FUNKTIOT (Kutsutaan HTML:stä) ---
    
    window.app.adminChangeStatus = async (uid, newStatus) => {
        await updateDoc(doc(db, "users", uid), { status: newStatus });
        loadUsers(); // Päivitä lista
    };

    window.app.adminAddPremium = async (uid) => {
        const code = prompt("Syötä tuotekoodi (esim. T-1V, T-6KK):").toUpperCase();
        if (!PRODUCTS[code]) return alert("Virheellinen koodi!");

        const days = PRODUCTS[code];
        
        // Haetaan nykyinen expiraatio
        const uSnap = await getDoc(doc(db, "users", uid));
        let currentExp = uSnap.data().premiumExpires ? uSnap.data().premiumExpires.toDate() : new Date();
        
        // Jos vanha aika on mennyt jo umpeen, aloitetaan tästä hetkestä
        if (currentExp < new Date()) currentExp = new Date();

        // Lisätään päivät
        currentExp.setDate(currentExp.getDate() + days);

        await updateDoc(doc(db, "users", uid), {
            plan: 'premium',
            premiumExpires: Timestamp.fromDate(currentExp)
        });
        
        alert(`Premium lisätty! Uusi päättymispäivä: ${currentExp.toLocaleDateString()}`);
        loadUsers();
    };

    window.app.adminDeleteUser = async (uid) => {
        if(!confirm("Haluatko varmasti poistaa tämän käyttäjän ja hänen tilastonsa?")) return;
        
        // Poistetaan stats ja user doc. (Huom: Auth-käyttäjää ei voi poistaa tästä suoraan ilman Cloud Functionsia,
        // mutta poistamalla docin estämme kirjautumisen 'auth.js' tarkistuksessa)
        await deleteDoc(doc(db, "stats", uid));
        await deleteDoc(doc(db, "users", uid));
        loadUsers();
    };

    // Käynnistetään listan lataus
    loadUsers();
};
