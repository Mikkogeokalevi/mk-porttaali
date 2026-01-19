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

// --- 1. TUOTEHALLINTA & HINNASTO ---
// Voit muokata hintoja ja kestoja tästä:
const PRODUCTS = [
    { code: 'T-1VK',  name: 'Testi (1 vko)',   days: 7,     price: '1 €',  color: '#89dceb' },
    { code: 'T-3KK',  name: 'Jakso (3 kk)',    days: 90,    price: '3 €',  color: '#89b4fa' },
    { code: 'T-1V',   name: 'Vuosi (12 kk)',   days: 365,   price: '10 €', color: '#fab387' },
    { code: 'LIFE',   name: '👑 Frendi / Ikuinen', days: 36500, price: '0 €',  color: '#cba6f7' } // 100 vuotta
];

export const renderAdminView = async (content, db, currentUser) => {
    if (!currentUser) return;
    
    // Tarkistetaan admin-oikeus
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (!userSnap.exists() || userSnap.data().role !== 'admin') {
        content.innerHTML = `<div class="card"><h1 style="color:red;">Pääsy evätty ⛔</h1></div>`;
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
            <textarea id="statInput" rows="10" style="width:100%; background:#181825; color:#cdd6f4; border:1px solid #45475a; padding:10px;" placeholder="Paikkakunta Tradi Multi..."></textarea>
            <button class="btn btn-primary" id="processBtn" style="margin-top:10px;">Prosessoi & Tallenna</button>
            <div id="processLog" style="margin-top:10px; font-family:monospace; font-size:0.8em;"></div>
        </div>

        <div id="adminTabSettings" class="admin-tab-content hidden" style="margin-top:20px;">
            <h3>Yleiset asetukset</h3>
            <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
                <span>🔒 <strong>Vaadi hyväksyntä uusille</strong></span>
                <input type="checkbox" id="settingRequireApproval" style="transform:scale(1.5);">
            </div>
            <button class="btn btn-primary" id="saveSettingsBtn" style="margin-top:15px;">Tallenna asetukset</button>
        </div>
    </div>

    <div id="premiumModal" class="modal-overlay">
        <div class="modal-box" style="background:#1e1e2e; padding:20px; border-radius:10px; border:1px solid #fab387; max-width:400px; width:90%;">
            <h2 style="margin-top:0;">Lisää Premium 💎</h2>
            <p id="premiumTargetUser" style="opacity:0.7; margin-bottom:20px;">Käyttäjälle...</p>
            <div id="productList" style="display:grid; gap:10px;"></div>
            <button class="btn" style="margin-top:20px; width:100%;" onclick="document.getElementById('premiumModal').classList.remove('open')">Peruuta</button>
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
        /* Modal tyylit */
        .modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:none; align-items:center; justify-content:center; z-index:9999; }
        .modal-overlay.open { display:flex; }
        .product-btn { padding:15px; border:none; border-radius:8px; font-weight:bold; color:#1e1e2e; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
        .product-btn:hover { opacity:0.9; transform:scale(1.02); }
    </style>
    `;

    // --- TAB LOGIC ---
    window.app.adminSwitchTab = (tabName) => {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('adminTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    };

    // --- LATAA KÄYTTÄJÄT ---
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
                
                let statusBadge = `<span class="badge badge-${u.status}">${u.status.toUpperCase()}</span>`;
                let planBadge = `<span class="badge badge-${u.plan}">${u.plan.toUpperCase()}</span>`;
                
                if (u.plan === 'premium' && u.premiumExpires) {
                    const expDate = u.premiumExpires.toDate();
                    // Tarkistetaan onko "IKUINEN" (yli 50 vuotta tulevaisuudessa)
                    const isLife = expDate.getFullYear() > 2050;
                    const dateStr = isLife ? "∞ Ikuinen" : expDate.toLocaleDateString();
                    planBadge += ` <span style="font-size:0.8em;">(-> ${dateStr})</span>`;
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
                        <button class="btn" style="padding:5px 10px; font-size:0.8em; background:#fab387; color:black;" onclick="app.adminOpenPremium('${uid}', '${u.nickname}')">💎 Lisää Premium</button>
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

    // --- PROSESSOI DATA ---
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
                        const vals = parts.slice(1).map(v => parseInt(v) || 0);
                        result[kunta] = { s: vals };
                        count++;
                    }
                }
            });
            if (count === 0) throw new Error("Ei dataa tunnistettu.");
            await setDoc(doc(db, "stats", currentUser.uid), { municipalities: result, updatedAt: Timestamp.now() });
            log.innerHTML = `✅ Valmis! ${count} kuntaa päivitetty sinun tilillesi.`;
        } catch (e) { log.innerHTML = `❌ Virhe: ${e.message}`; }
    };

    // --- ASETUKSET ---
    const settingsRef = doc(db, "settings", "global");
    getDoc(settingsRef).then(snap => {
        if(snap.exists()) document.getElementById('settingRequireApproval').checked = snap.data().requireApproval || false;
    });
    document.getElementById('saveSettingsBtn').onclick = async () => {
        await setDoc(settingsRef, { requireApproval: document.getElementById('settingRequireApproval').checked }, { merge: true });
        alert("Asetukset tallennettu.");
    };

    // --- GLOBAALIT ADMIN-FUNKTIOT ---
    
    window.app.adminChangeStatus = async (uid, newStatus) => {
        await updateDoc(doc(db, "users", uid), { status: newStatus });
        loadUsers();
    };

    // AVAA PREMIUM-VALIKKO
    window.app.adminOpenPremium = (uid, name) => {
        document.getElementById('premiumTargetUser').textContent = `Lisätään käyttäjälle: ${name}`;
        const list = document.getElementById('productList');
        list.innerHTML = '';

        PRODUCTS.forEach(prod => {
            const btn = document.createElement('button');
            btn.className = 'product-btn';
            btn.style.backgroundColor = prod.color;
            btn.innerHTML = `<span>${prod.name}</span> <span>${prod.price}</span>`;
            btn.onclick = () => app.adminApplyPremium(uid, prod);
            list.appendChild(btn);
        });

        document.getElementById('premiumModal').classList.add('open');
    };

    // TOTEUTA PREMIUM LISÄYS
    window.app.adminApplyPremium = async (uid, product) => {
        const uSnap = await getDoc(doc(db, "users", uid));
        let currentExp = uSnap.data().premiumExpires ? uSnap.data().premiumExpires.toDate() : new Date();
        
        // Jos vanha aika mennyt, aloitetaan tästä hetkestä
        if (currentExp < new Date()) currentExp = new Date();

        // Lisätään päivät
        currentExp.setDate(currentExp.getDate() + product.days);

        await updateDoc(doc(db, "users", uid), {
            plan: 'premium',
            premiumExpires: Timestamp.fromDate(currentExp)
        });
        
        document.getElementById('premiumModal').classList.remove('open');
        alert(`✅ Lisätty ${product.name}! Uusi päättymispäivä: ${currentExp.toLocaleDateString()}`);
        loadUsers();
    };

    window.app.adminDeleteUser = async (uid) => {
        if(!confirm("Poistetaanko käyttäjä ja tilastot pysyvästi?")) return;
        await deleteDoc(doc(db, "stats", uid));
        await deleteDoc(doc(db, "users", uid));
        loadUsers();
    };

    loadUsers();
};
