import { doc, updateDoc, deleteDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import * as Auth from "./auth.js"; 

export const renderSettingsView = (content, db, user, app) => {
    if (!user) { app.router('login_view'); return; }

    const shortId = app.shortId || "Ladataan...";
    const nickname = app.savedNickname || user.displayName || "Nimetön";
    const gcId = app.savedId || "";
    const email = user.email;
    const isPremium = app.userPlan === 'premium' || app.userRole === 'admin';

    let planDisplay = 'Ilmainen';
    if (app.userPlan === 'premium') {
        planDisplay = '💎 Premium';
        if (app.premiumExpires) {
            const expDate = app.premiumExpires;
            if (expDate.getFullYear() > 2090) {
                planDisplay += ' <span style="font-size:0.8em; opacity:0.8; margin-left:5px;">(Toistaiseksi voimassa)</span>';
            } else {
                planDisplay += ` <br><span style="font-size:0.8em; opacity:0.7; margin-left:25px;">Päättyy: ${expDate.toLocaleDateString('fi-FI')}</span>`;
            }
        }
    }

    // Luodaan HTML
    let importHtml = '';
    
    // --- IMPORT-OSIO VAIN PREMIUMILLE ---
    if (isPremium) {
        importHtml = `
        <div style="margin-top:25px; border-top:1px solid var(--border-color); padding-top:20px;">
            <h3>📥 Tuo omat tilastot</h3>
            <p style="font-size:0.9em; opacity:0.8;">Päivitä löytötilastosi Geocache.fi:stä, jotta kartat toimivat.</p>
            
            <details style="margin-bottom:10px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;">
                <summary style="cursor:pointer; color:#fab387; font-size:0.9em;">⚙️ Sarakkeiden asetukset (Jos tripletti on väärin)</summary>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
                    <div><label style="font-size:0.8em;">Tradi:</label><input type="number" id="impColTradi" value="1" style="width:40px; padding:2px;"></div>
                    <div><label style="font-size:0.8em;">Multi:</label><input type="number" id="impColMulti" value="2" style="width:40px; padding:2px;"></div>
                    <div><label style="font-size:0.8em;">Mysse:</label><input type="number" id="impColMysse" value="4" style="width:40px; padding:2px;"></div>
                </div>
            </details>

            <textarea id="impInput" rows="5" style="width:100%; background:#181825; color:#cdd6f4; border:1px solid #45475a; padding:10px; font-size:0.8em;" placeholder="Maalaa Geocache.fi:n 'Kuntatilasto'-taulukko ja liitä tähän..."></textarea>
            <button class="btn btn-primary" id="impBtn" style="margin-top:10px; width:100%;">Prosessoi & Tallenna</button>
            <div id="impLog" style="margin-top:10px; font-family:monospace; font-size:0.8em; white-space: pre-wrap;"></div>
        </div>
        `;
    } else {
        importHtml = `
        <div style="margin-top:25px; border-top:1px solid var(--border-color); padding-top:20px; opacity:0.5;">
            <h3>📥 Tuo omat tilastot</h3>
            <p>Vaatii Premium-tilauksen.</p>
        </div>`;
    }

    // VAARAVYÖHYKE
    let dangerZoneHtml = '';
    if (app.userRole !== 'admin') {
        dangerZoneHtml = `<h3 style="color:#f38ba8;">⚠️ Vaaravyöhyke</h3><button class="btn" style="background:#f38ba8; color:#1e1e2e; border:none;" onclick="app.deleteMyAccount()">❌ Poista käyttäjätilini pysyvästi</button>`;
    }

    content.innerHTML = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>Omat Asetukset</h1>
            <button class="btn" onclick="app.router('home')">⬅ Etusivulle</button>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-top:20px; border-left:4px solid var(--accent-color);">
            <h3 style="margin-top:0;">👤 Käyttäjätili</h3>
            <p><strong>Sähköposti:</strong> ${email}</p>
            <p><strong>Tilaus:</strong> ${planDisplay}</p>
            <div style="margin:15px 0; padding:10px; background:#181825; border:1px dashed #fab387; border-radius:6px;">
                <p style="margin:0; font-size:0.8em; color:#fab387;">Sinun MK-tunnuksesi (Maksukoodi):</p>
                <strong style="font-size:1.5em; letter-spacing:1px;">${shortId}</strong>
            </div>
        </div>

        <div style="margin-top:20px;">
            <h3>🏷️ Omat tiedot</h3>
            <label>Nimimerkki:</label><input type="text" id="setNick" value="${nickname}">
            <label>Geocache.fi ID:</label><input type="number" id="setGcId" value="${gcId}">
            <button class="btn btn-primary" onclick="app.saveSettings()">Tallenna tiedot</button>
        </div>

        ${importHtml}

        <hr style="margin:25px 0; border-color:var(--border-color);">
        <h3>👥 Kaverilista</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <input type="text" id="newFriendName" placeholder="Nimimerkki" style="flex:2;">
            <input type="number" id="newFriendId" placeholder="ID" style="flex:1;">
            <button class="btn btn-primary" style="flex:0;" onclick="app.addFriend()">Lisää</button>
        </div>
        <div id="friendListContainer" style="max-height:300px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">Ladataan...</div>
        <hr style="margin:25px 0; border-color:var(--border-color);">
        ${dangerZoneHtml}
    </div>
    `;

    Auth.loadFriends(db, user.uid, 'friendListContainer', null);
    window.app.saveSettings = async () => { /* ... (sama tallennus kuin ennen) ... */ 
        const newNick = document.getElementById('setNick').value.trim();
        const newId = document.getElementById('setGcId').value.trim();
        if(!newNick) return alert("Nimimerkki ei voi olla tyhjä.");
        try {
            await updateDoc(doc(db, "users", user.uid), { nickname: newNick, gcId: newId });
            app.savedNickname = newNick; app.savedId = newId; alert("Tiedot tallennettu! ✅");
        } catch(e) { alert("Virhe tallennuksessa."); }
    };

    // --- IMPORT LOGIIKKA (Jos Premium) ---
    if (isPremium) {
        document.getElementById('impBtn').onclick = async () => {
            const raw = document.getElementById('impInput').value;
            const log = document.getElementById('impLog');
            
            // Luetaan asetukset
            const idxTradi = parseInt(document.getElementById('impColTradi').value) - 1;
            const idxMulti = parseInt(document.getElementById('impColMulti').value) - 1;
            const idxMysse = parseInt(document.getElementById('impColMysse').value) - 1;

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

                if (count === 0) throw new Error("Ei dataa tunnistettu. Kopioi taulukko Geocache.fi sivulta.");
                
                await setDoc(doc(db, "stats", user.uid), { municipalities: result, updatedAt: Timestamp.now() });
                
                const firstKey = Object.keys(result)[0];
                const s = result[firstKey].s;
                log.innerHTML = `✅ Valmis! ${count} kuntaa tallennettu.\n\nTarkistus (${firstKey}):\nTradi: ${s[idxTradi]} | Multi: ${s[idxMulti]} | Mysse: ${s[idxMysse]}`;

            } catch (e) { log.innerHTML = `❌ Virhe: ${e.message}`; }
        };
    }
};
