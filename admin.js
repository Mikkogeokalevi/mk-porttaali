import { 
    collection, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, orderBy, Timestamp 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const PRODUCTS = [
    { code: 'T-1VK',  name: 'Testi (1 vko)',   days: 7,     price: '1 €',  color: '#89dceb' },
    { code: 'T-3KK',  name: 'Jakso (3 kk)',    days: 90,    price: '3 €',  color: '#89b4fa' },
    { code: 'T-1V',   name: 'Vuosi (12 kk)',   days: 365,   price: '10 €', color: '#fab387' },
    { code: 'LIFE',   name: '👑 Frendi / Ikuinen', days: 36500, price: '0 €',  color: '#cba6f7' }
];

export const renderAdminView = async (content, db, currentUser) => {
    if (!currentUser) return;
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

        <div id="adminTabUsers" class="admin-tab-content" style="margin-top:20px;"><p>Ladataan...</p></div>

        <div id="adminTabData" class="admin-tab-content hidden" style="margin-top:20px;">
            <h3>Datan päivitys (Geocache.fi)</h3>
            
            <div style="background:rgba(66, 135, 245, 0.1); border:1px solid #4287f5; padding:15px; border-radius:8px; margin-bottom:15px; font-size:0.9em; line-height:1.5;">
                <strong style="color:#89b4fa;">💡 Ohje:</strong>
                <ol style="margin:5px 0 10px 20px; padding:0; color:#cdd6f4;">
                    <li style="margin-bottom:5px;">Avaa Geocache.fi: <a href="https://www.geocache.fi/stat/other/jakauma.php" target="_blank" style="color:#89b4fa; font-weight:bold; text-decoration:underline;">Löytötilasto paikkakunnittain ↗</a></li>
                    <li style="margin-bottom:5px;"><strong>Maalaa taulukko</strong> hiirellä. Aloita vasemmasta yläkulmasta sanasta <em>"Paikkakunta"</em> ja vedä alas asti.</li>
                    <li>Kopioi (Ctrl+C) ja liitä (Ctrl+V) alla olevaan laatikkoon.</li>
                </ol>
            </div>

            <details style="margin-bottom:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;">
                <summary style="cursor:pointer; color:#fab387; font-weight:bold;">⚙️ Sarakkeiden asetukset</summary>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
                    <div><label>Tradi:</label><input type="number" id="colTradi" value="1" style="width:50px;"></div>
                    <div><label>Multi:</label><input type="number" id="colMulti" value="2" style="width:50px;"></div>
                    <div><label>Mysse:</label><input type="number" id="colMysse" value="4" style="width:50px;"></div>
                </div>
            </details>

            <textarea id="statInput" rows="10" style="width:100%; background:#181825; color:#cdd6f4; border:1px solid #45475a; padding:10px;" placeholder="Liitä taulukko tähän..."></textarea>
            <button class="btn btn-primary" id="processBtn" style="margin-top:10px;">Prosessoi & Tallenna</button>
            <div id="processLog" style="margin-top:10px; font-family:monospace; font-size:0.8em; white-space: pre-wrap;"></div>
        </div>

        <div id="adminTabSettings" class="admin-tab-content hidden" style="margin-top:20px;">
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
            <p id="premiumTargetUser" style="opacity:0.7; margin-bottom:20px;">...</p>
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
        .modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:none; align-items:center; justify-content:center; z-index:9999; }
        .modal-overlay.open { display:flex; }
        .product-btn { padding:15px; border:none; border-radius:8px; font-weight:bold; color:#1e1e2e; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
    </style>
    `;

    window.app.adminSwitchTab = (tabName) => {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('adminTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    };

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
                    const isLife = expDate.getFullYear() > 2090;
                    planBadge += ` <span style="font-size:0.8em;">(-> ${isLife ? "Toistaiseksi" : expDate.toLocaleDateString()})</span>`;
                }
                html += `
                <div class="user-row">
                    <div class="user-header"><span>${u.nickname} <span style="color:var(--accent-color);">[${u.shortId || '-'}]</span></span><div>${statusBadge} ${planBadge}</div></div>
                    <div class="user-meta"><span>📧 ${u.email}</span><span>📅 ${u.createdAt ? u.createdAt.toDate().toLocaleDateString() : '-'}</span></div>
                    <div class="user-actions">
                        <select onchange="app.adminChangeStatus('${uid}', this.value)" style="padding:5px;">
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
        } catch (e) { container.innerHTML = `<p style="color:red">Virhe: ${e.message}</p>`; }
    };

    // --- PROSESSOI DATA ---
    document.getElementById('processBtn').onclick = async () => {
        const raw = document.getElementById('statInput').value;
        const log = document.getElementById('processLog');
        
        // Luetaan asetukset
        const idxTradi = parseInt(document.getElementById('colTradi').value) - 1;
        const idxMulti = parseInt(document.getElementById('colMulti').value) - 1;
        const idxMysse = parseInt(document.getElementById('colMysse').value) - 1;

        log.innerHTML = "Aloitetaan...";
        try {
            const lines = raw.split('\n');
            const result = {};
            let count = 0;
            
            lines.forEach(line => {
                const parts = line.split('\t'); 
                if (parts.length > 5) {
                    const kunta = parts[0].trim();
                    if (kunta && kunta !== 'Paikkakunta' && kunta !== 'Summa' && isNaN(parseInt(kunta))) {
                        const vals = parts.slice(1).map(v => parseInt(v.replace(/\s/g, '')) || 0);
                        result[kunta] = { s: vals };
                        count++;
                    }
                }
            });

            if (count === 0) throw new Error("Ei dataa tunnistettu. Varmista että kopioit taulukon oikein.");
            
            await setDoc(doc(db, "stats", currentUser.uid), { municipalities: result, updatedAt: Timestamp.now() });
            
            const firstKey = Object.keys(result)[0];
            const s = result[firstKey].s;
            log.innerHTML = `✅ Valmis! ${count} kuntaa tallennettu.\n\nTarkistus (${firstKey}):\nTradi: ${s[idxTradi]} (sarake ${idxTradi+1})\nMulti: ${s[idxMulti]} (sarake ${idxMulti+1})\nMysse: ${s[idxMysse]} (sarake ${idxMysse+1})`;

        } catch (e) { log.innerHTML = `❌ Virhe: ${e.message}`; }
    };

    const settingsRef = doc(db, "settings", "global");
    getDoc(settingsRef).then(snap => { if(snap.exists()) document.getElementById('settingRequireApproval').checked = snap.data().requireApproval || false; });
    document.getElementById('saveSettingsBtn').onclick = async () => { await setDoc(settingsRef, { requireApproval: document.getElementById('settingRequireApproval').checked }, { merge: true }); alert("Asetukset tallennettu."); };
    
    window.app.adminChangeStatus = async (uid, newStatus) => { await updateDoc(doc(db, "users", uid), { status: newStatus }); loadUsers(); };
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
    window.app.adminApplyPremium = async (uid, product) => {
        const uSnap = await getDoc(doc(db, "users", uid));
        let currentExp = uSnap.data().premiumExpires ? uSnap.data().premiumExpires.toDate() : new Date();
        if (currentExp < new Date()) currentExp = new Date();
        currentExp.setDate(currentExp.getDate() + product.days);
        await updateDoc(doc(db, "users", uid), { plan: 'premium', premiumExpires: Timestamp.fromDate(currentExp) });
        document.getElementById('premiumModal').classList.remove('open');
        alert(`✅ Lisätty ${product.name}!`);
        loadUsers();
    };
    window.app.adminDeleteUser = async (uid) => { if(!confirm("Poistetaanko käyttäjä?")) return; await deleteDoc(doc(db, "stats", uid)); await deleteDoc(doc(db, "users", uid)); loadUsers(); };

    loadUsers();
};
