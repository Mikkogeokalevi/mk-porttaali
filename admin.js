import { 
    collection, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, orderBy, limit, Timestamp 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { toast, confirmDialog } from "./ui.js";

// --- TUOTEHALLINTA ---
const PRODUCTS = [
    { code: 'T-1VK',  name: 'Testi (1 vko)',   days: 7,     price: '1 €',  color: '#89dceb' },
    { code: 'T-3KK',  name: 'Jakso (3 kk)',    days: 90,    price: '3 €',  color: '#89b4fa' },
    { code: 'T-6KK',  name: 'Kausi (6 kk)',    days: 180,   price: '5 €',  color: '#a6e3a1' },
    { code: 'T-1V',   name: 'Vuosi (12 kk)',   days: 365,   price: '10 €', color: '#fab387' },
    { code: 'LIFE',   name: '👑 Frendi / Ikuinen', days: 36500, price: '0 €',  color: '#cba6f7' }
];

const SUOMEN_MAAKUNNAT = [
    "Ahvenanmaa", "Etelä-Karjala", "Etelä-Pohjanmaa", "Etelä-Savo", "Kainuu", "Kanta-Häme",
    "Keski-Pohjanmaa", "Keski-Suomi", "Kymenlaakso", "Lappi", "Pirkanmaa", "Pohjanmaa",
    "Pohjois-Karjala", "Pohjois-Pohjanmaa", "Pohjois-Savo", "Päijät-Häme", "Satakunta",
    "Uusimaa", "Varsinais-Suomi"
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
        <div class="view-header">
            <h1>Ylläpito <span class="badge badge-admin">ADMIN</span></h1>
            <button class="btn btn-sm" onclick="app.router('home')">⬅ Etusivulle</button>
        </div>
        <div class="tabs">
            <button class="tab-btn active" onclick="app.adminSwitchTab('users')">Käyttäjät</button>
            <button class="tab-btn" onclick="app.adminSwitchTab('data')">Datan tuonti</button>
            <button class="tab-btn" onclick="app.adminSwitchTab('settings')">Asetukset</button>
        </div>

        <div id="adminTabUsers" class="admin-tab-content" style="margin-top:20px;">
            <input type="text" id="userSearch" placeholder="🔍 Etsi käyttäjää nimellä tai sähköpostilla...">
            <div id="usersContainer"><p>Ladataan...</p></div>
        </div>

        <div id="adminTabData" class="admin-tab-content hidden" style="margin-top:20px;">
            <h3>Datan päivitys (Geocache.fi)</h3>
            
            <details>
                <summary style="color:var(--c-peach);">⚙️ Sarakkeiden asetukset</summary>
                <div style="display:flex; gap:10px; flex-wrap:wrap; padding:0 14px 10px;">
                    <div><label>Tradi:</label><input type="number" id="colTradi" value="1" style="width:70px; padding:6px; margin:4px 0;"></div>
                    <div><label>Multi:</label><input type="number" id="colMulti" value="2" style="width:70px; padding:6px; margin:4px 0;"></div>
                    <div><label>Mysse:</label><input type="number" id="colMysse" value="4" style="width:70px; padding:6px; margin:4px 0;"></div>
                </div>
            </details>

            <textarea id="statInput" rows="10" style="white-space:pre;" placeholder="Liitä taulukko tähän..."></textarea>
            <button class="btn btn-primary" id="processBtn" style="margin-top:10px;">Prosessoi & Tallenna</button>
            
            <div id="processLog" style="margin-top:20px;"></div>
        </div>

        <div id="adminTabSettings" class="admin-tab-content hidden" style="margin-top:20px;">
            <div class="panel" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0;">
                <span>🔒 <strong>Vaadi hyväksyntä uusille</strong></span>
                <input type="checkbox" id="settingRequireApproval" style="transform:scale(1.5);">
            </div>
            <button class="btn btn-primary" id="saveSettingsBtn" style="margin-top:15px;">Tallenna asetukset</button>
        </div>
    </div>

    <div id="premiumModal" class="modal-overlay">
        <div class="modal-box" style="border-color:var(--c-peach); max-width:400px;">
            <h2 style="margin-top:0;">Lisää Premium 💎</h2>
            <p id="premiumTargetUser" style="opacity:0.7; margin-bottom:20px;">...</p>
            <div id="productList" style="display:grid; gap:10px;"></div>
            <button class="btn" style="margin-top:20px; width:100%;" onclick="document.getElementById('premiumModal').classList.remove('open'); document.body.classList.remove('modal-open')">Peruuta</button>
        </div>
    </div>
    `;

    window.app.adminSwitchTab = (tabName) => {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('adminTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    };

    const users = []; // renderAdminView-tason taulukko -> adminOpenPremium löytää nimen uid:lla

    const loadUsers = async () => {
        const container = document.getElementById('usersContainer');
        container.innerHTML = 'Ladataan uusimmat 100 käyttäjää...';
        try {
            // Rajoitetaan kysely 100 uusimpaan
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100));
            const snapshot = await getDocs(q);
            
            users.length = 0;
            snapshot.forEach(docSnap => {
                users.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Renderöintifunktio (kutsutaan myös haussa)
            const renderList = (filterText = "") => {
                let html = '';
                const lowerFilter = filterText.toLowerCase();
                
                users.forEach(u => {
                    const searchStr = `${u.nickname} ${u.email} ${u.shortId}`.toLowerCase();
                    if (filterText && !searchStr.includes(lowerFilter)) return;

                    const uid = u.id;
                    let statusBadge = `<span class="badge badge-${u.status}">${u.status.toUpperCase()}</span>`;
                    let planBadge = '';

                    // --- ADMIN BADGE LOGIIKKA ---
                    if (u.role === 'admin') {
                        planBadge = `<span class="badge badge-admin">ADMIN 🛠️</span>`;
                    } else {
                        planBadge = `<span class="badge badge-${u.plan}">${u.plan.toUpperCase()}</span>`;
                        
                        if (u.plan === 'premium' && u.premiumExpires) {
                            const expDate = u.premiumExpires.toDate();
                            const isLife = expDate.getFullYear() > 2090;
                            const dateStr = isLife ? "∞ Ikuinen" : expDate.toLocaleDateString();
                            planBadge += ` <span style="font-size:0.8em;">(-> ${dateStr})</span>`;
                        }
                    }

                    // PÄIVÄMÄÄRÄT
                    const joined = u.createdAt ? u.createdAt.toDate().toLocaleDateString('fi-FI') + " " + u.createdAt.toDate().toLocaleTimeString('fi-FI', {hour:'2-digit', minute:'2-digit'}) : '-';
                    
                    // Viimeksi paikalla (lastLogin)
                    let lastSeen = '-';
                    let lastSeenColor = '#aaa';
                    
                    if (u.lastLogin) {
                        const d = u.lastLogin.toDate();
                        lastSeen = d.toLocaleDateString('fi-FI') + " " + d.toLocaleTimeString('fi-FI', {hour:'2-digit', minute:'2-digit'});
                        
                        // Korostetaan jos on ollut paikalla tänään
                        const today = new Date();
                        if (d.toDateString() === today.toDateString()) {
                            lastSeen = "Tänään " + d.toLocaleTimeString('fi-FI', {hour:'2-digit', minute:'2-digit'});
                            lastSeenColor = '#a6e3a1'; // Vihreä
                        }
                    }

                    html += `
                    <div class="user-row">
                        <div class="user-header">
                            <span>${u.nickname} <span style="color:var(--accent-color);">[${u.shortId || '-'}]</span></span>
                            <div>${statusBadge} ${planBadge}</div>
                        </div>
                        <div class="user-meta">
                            <div>📧 ${u.email}</div>
                            <div>📅 Liittyi: ${joined}</div>
                            <div style="color:${lastSeenColor}">👁️ Viimeksi: ${lastSeen}</div>
                        </div>
                        <div class="user-actions">
                            <select onchange="app.adminChangeStatus('${uid}', this.value)">
                                <option value="pending" ${u.status==='pending'?'selected':''}>Pending</option>
                                <option value="approved" ${u.status==='approved'?'selected':''}>Approved</option>
                                <option value="blocked" ${u.status==='blocked'?'selected':''}>Blocked</option>
                            </select>
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.85em;">
                                <input type="checkbox" ${u.reissuapuriEnabled ? 'checked' : ''} onchange="app.adminToggleReissuapuri('${uid}', this.checked)">
                                Reissuapuri
                            </label>
                            <button class="btn btn-sm btn-sky" onclick="app.previewAsUser('${String(u.nickname||'').replace(/'/g,"\\'")}', '${u.role||'user'}', '${u.plan||'free'}', ${!!u.reissuapuriEnabled})">👁 Näytä</button>
                            <button class="btn btn-sm btn-peach" onclick="app.adminOpenPremium('${uid}')">💎 Lisää Premium</button>
                            <button class="btn btn-sm btn-danger" onclick="app.adminDeleteUser('${uid}')">🗑️ Poista</button>
                        </div>
                    </div>`;
                });
                
                if (html === '') html = '<p style="opacity:0.6; text-align:center;">Ei tuloksia.</p>';
                container.innerHTML = html;
            };

            // Alustus
            renderList();

            // Hakukentän kuuntelija
            document.getElementById('userSearch').addEventListener('input', (e) => {
                renderList(e.target.value);
            });

        } catch (e) { container.innerHTML = `<p style="color:red">Virhe: ${e.message}</p>`; }
    };

    // --- PROSESSOI DATA (ÄLYKÄS LOGIIKKA + RAPORTTI) ---
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
            const sortedRegions = [...SUOMEN_MAAKUNNAT].sort((a, b) => b.length - a.length);
            
            // Tilastot raporttia varten
            const stats = { trip: 0, tradi: 0, none: 0 };
            let firstRowStats = null;
            let firstRowName = "";

            lines.forEach(line => {
                let clean = line.trim();
                if(!clean || clean.startsWith("Paikkakunta") || clean.length < 5) return;

                let kunta = "", numsPart = "";
                let found = false;

                // 1. Etsitään maakunta tekstin seasta
                for(const r of sortedRegions) {
                    const idx = clean.indexOf(r);
                    if(idx > 0) {
                        kunta = clean.substring(0, idx).trim();
                        numsPart = clean.substring(idx + r.length).trim();
                        found = true;
                        break;
                    }
                }

                // 2. Varasuunnitelma tab
                if(!found && clean.includes('\t')) {
                    const parts = clean.split('\t');
                    if(parts.length > 4) {
                        let offset = isNaN(parseInt(parts[0])) ? 0 : 1;
                        kunta = parts[offset];
                        numsPart = parts.slice(offset+2).join(' ');
                        found = true;
                    }
                }

                if(found) {
                    kunta = kunta.replace(/^\d+\s+/, ''); 
                    const numStrings = numsPart.replace(/\s+/g, ' ').trim().split(' ');
                    const allStats = numStrings.map(s => parseInt(s) || 0);

                    result[kunta] = { s: allStats };
                    count++;

                    // Tallennetaan eka rivi tarkistusta varten
                    if(!firstRowStats) { firstRowStats = allStats; firstRowName = kunta; }

                    // Lasketaan tilastot
                    const t = allStats[idxTradi] || 0;
                    const m = allStats[idxMulti] || 0;
                    const q = allStats[idxMysse] || 0;

                    if(t > 0 && m > 0 && q > 0) stats.trip++;
                    else if(t > 0 && m === 0 && q === 0) stats.tradi++;
                    else if(t === 0 && m === 0 && q === 0) stats.none++;
                }
            });

            if (count === 0) throw new Error("Ei dataa tunnistettu. Varmista että kopioit taulukon oikein.");
            
            await setDoc(doc(db, "stats", currentUser.uid), { municipalities: result, updatedAt: Timestamp.now() });
            
            // --- RAPORTIN RAKENTAMINEN ---
            let reportHtml = `
            <div style="background:rgba(166, 227, 161, 0.1); border:1px solid #a6e3a1; padding:15px; border-radius:8px;">
                <h3 style="margin:0 0 10px 0; color:#a6e3a1;">✅ Tallennettu onnistuneesti!</h3>
                
                <div class="stat-summary">
                    <div class="stat-box">Kunnat <span>${count}</span></div>
                    <div class="stat-box" style="border-color:#a6e3a1; color:#a6e3a1;">Triplettikunnat <span>${stats.trip}</span></div>
                    <div class="stat-box" style="border-color:#89b4fa; color:#89b4fa;">Vain Tradi <span>${stats.tradi}</span></div>
                    <div class="stat-box" style="border-color:#f38ba8; color:#f38ba8;">Ei löytöjä <span>${stats.none}</span></div>
                </div>`;

            if(firstRowStats) {
                reportHtml += `
                <div style="margin-top:15px; border-top:1px dashed #555; padding-top:10px;">
                    <p style="font-size:0.9em; opacity:0.8; margin-bottom:5px;">Tarkistus (${firstRowName}):<br>
                    <span style="color:#a6e3a1">Tradi (${firstRowStats[idxTradi]})</span> | 
                    <span style="color:#89b4fa">Multi (${firstRowStats[idxMulti]})</span> | 
                    <span style="color:#f38ba8">Mysse (${firstRowStats[idxMysse]})</span></p>
                </div>`;
            }
            
            reportHtml += `</div>`;
            log.innerHTML = reportHtml;

        } catch (e) { log.innerHTML = `<div style="background:rgba(243, 139, 168, 0.1); border:1px solid #f38ba8; padding:15px; border-radius:8px; color:#f38ba8;">❌ Virhe: ${e.message}</div>`; }
    };

    const settingsRef = doc(db, "settings", "global");
    getDoc(settingsRef).then(snap => { if(snap.exists()) document.getElementById('settingRequireApproval').checked = snap.data().requireApproval || false; });
    document.getElementById('saveSettingsBtn').onclick = async () => { await setDoc(settingsRef, { requireApproval: document.getElementById('settingRequireApproval').checked }, { merge: true }); toast("Asetukset tallennettu.", 'ok'); };
    
    window.app.adminChangeStatus = async (uid, newStatus) => { await updateDoc(doc(db, "users", uid), { status: newStatus }); loadUsers(); };
    window.app.adminToggleReissuapuri = async (uid, enabled) => { await updateDoc(doc(db, "users", uid), { reissuapuriEnabled: enabled }); loadUsers(); };
    window.app.adminOpenPremium = (uid) => {
        const target = users.find(u => u.id === uid);
        document.getElementById('premiumTargetUser').textContent = `Lisätään käyttäjälle: ${target?.nickname || uid}`;
        const list = document.getElementById('productList'); list.innerHTML = '';
        PRODUCTS.forEach(prod => {
            const btn = document.createElement('button'); btn.className = 'product-btn'; btn.style.backgroundColor = prod.color; btn.innerHTML = `<span>${prod.name}</span> <span>${prod.price}</span>`;
            btn.onclick = () => app.adminApplyPremium(uid, prod); list.appendChild(btn);
        });
        document.getElementById('premiumModal').classList.add('open');
        document.body.classList.add('modal-open');
    };
    window.app.adminApplyPremium = async (uid, product) => {
        const uSnap = await getDoc(doc(db, "users", uid));
        let currentExp = uSnap.data().premiumExpires ? uSnap.data().premiumExpires.toDate() : new Date();
        if (currentExp < new Date()) currentExp = new Date();
        currentExp.setDate(currentExp.getDate() + product.days);
        await updateDoc(doc(db, "users", uid), { plan: 'premium', premiumExpires: Timestamp.fromDate(currentExp) });
        document.getElementById('premiumModal').classList.remove('open');
        document.body.classList.remove('modal-open');
        toast(`Lisätty ${product.name}!`, 'ok');
        loadUsers();
    };
    window.app.adminDeleteUser = async (uid) => {
        if(!await confirmDialog("Poistetaanko käyttäjä ja KAIKKI hänen tietonsa (löydöt, tilastot, maakartat)?", { okText: 'Poista käyttäjä' })) return;
        // Alikokoelmat eivät poistu päädokumentin mukana — siivotaan erikseen.
        try {
            const fds = await getDocs(collection(db, "users", uid, "findsdata"));
            for (const d of fds.docs) await deleteDoc(d.ref);
            for (const p of ["sweden", "norway", "estonia", "other_countries"])
                await deleteDoc(doc(db, "users", uid, p, "finds"));
        } catch (e) { console.warn("Alikokoelmien siivous epäonnistui:", e); }
        await deleteDoc(doc(db, "stats", uid));
        await deleteDoc(doc(db, "users", uid));
        loadUsers();
    };

    loadUsers();
};
