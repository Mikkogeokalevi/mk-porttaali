import { doc, updateDoc, deleteDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import * as Auth from "./auth.js"; 

// Kopioitu admin.js:stä datan tuontia varten
const SUOMEN_MAAKUNNAT = [
    "Ahvenanmaa", "Etelä-Karjala", "Etelä-Pohjanmaa", "Etelä-Savo", "Kainuu", "Kanta-Häme",
    "Keski-Pohjanmaa", "Keski-Suomi", "Kymenlaakso", "Lappi", "Pirkanmaa", "Pohjanmaa",
    "Pohjois-Karjala", "Pohjois-Pohjanmaa", "Pohjois-Savo", "Päijät-Häme", "Satakunta",
    "Uusimaa", "Varsinais-Suomi"
];

export const renderSettingsView = (content, db, user, app) => {
    if (!user) { app.router('login_view'); return; }

    const shortId = app.shortId || "Ladataan...";
    const nickname = app.savedNickname || user.displayName || "Nimetön";
    const gcId = app.savedId || "";
    const email = user.email;
    const isPremium = app.userPlan === 'premium' || app.userRole === 'admin';

    const inputStyle = "width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 15px; background: #181825; border: 1px solid #45475a; color: white; border-radius: 4px; font-size: 16px;";

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

    // --- IMPORT-OSIO ---
    let importHtml = '';
    
    if (isPremium) {
        importHtml = `
        <div style="margin-top:25px; border-top:1px solid var(--border-color); padding-top:20px;">
            <h3>📥 Tuo omat tilastot</h3>
            
            <div style="background:rgba(66, 135, 245, 0.1); border:1px solid #4287f5; padding:15px; border-radius:8px; margin-bottom:15px; font-size:0.9em; line-height:1.5;">
                <strong style="color:#89b4fa;">💡 Vinkki: Tämä on helpointa tehdä tietokoneella!</strong>
                <p style="margin:5px 0 10px 0; opacity:0.9;">Data synkronoituu automaattisesti tähän puhelimeen, kun tallennat sen PC:llä.</p>
                
                <strong style="color:#cdd6f4;">Ohje:</strong>
                <ol style="margin:5px 0 10px 20px; padding:0; color:#cdd6f4;">
                    <li style="margin-bottom:5px;">Avaa Geocache.fi: <a href="https://www.geocache.fi/stat/other/jakauma.php" target="_blank" style="color:#89b4fa; font-weight:bold; text-decoration:underline;">Löytötilasto paikkakunnittain ↗</a></li>
                    <li style="margin-bottom:5px;"><strong>Maalaa taulukko</strong> hiirellä (Paikkakunta-sanasta alas asti).</li>
                    <li>Kopioi (Ctrl+C) ja liitä (Ctrl+V) alla olevaan laatikkoon.</li>
                </ol>
            </div>
            
            <details style="margin-bottom:10px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;">
                <summary style="cursor:pointer; color:#fab387; font-size:0.9em;">⚙️ Sarakkeiden asetukset (Jos tripletti on väärin)</summary>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
                    <div><label style="font-size:0.8em;">Tradi:</label><input type="number" id="impColTradi" value="1" style="width:50px; padding:5px; border-radius:4px; border:1px solid #555; background:#222; color:white;"></div>
                    <div><label style="font-size:0.8em;">Multi:</label><input type="number" id="impColMulti" value="2" style="width:50px; padding:5px; border-radius:4px; border:1px solid #555; background:#222; color:white;"></div>
                    <div><label style="font-size:0.8em;">Mysse:</label><input type="number" id="impColMysse" value="4" style="width:50px; padding:5px; border-radius:4px; border:1px solid #555; background:#222; color:white;"></div>
                </div>
            </details>

            <textarea id="impInput" rows="5" style="width:100%; background:#181825; color:#cdd6f4; border:1px solid #45475a; padding:10px; font-size:16px; border-radius:4px; white-space:pre;" placeholder="Liitä taulukko tähän..."></textarea>
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

    let dangerZoneHtml = '';
    if (app.userRole !== 'admin') {
        dangerZoneHtml = `<h3 style="color:#f38ba8;">⚠️ Vaaravyöhyke</h3><button class="btn" style="background:#f38ba8; color:#1e1e2e; border:none; width:100%; padding:12px;" onclick="app.deleteMyAccount()">❌ Poista käyttäjätilini pysyvästi</button>`;
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
            <div style="margin:15px 0; padding:15px; background:#181825; border:1px dashed #fab387; border-radius:6px; text-align:center;">
                <p style="margin:0; font-size:0.8em; color:#fab387; text-transform:uppercase; letter-spacing:1px;">Sinun MK-tunnuksesi</p>
                <strong style="font-size:2em; letter-spacing:2px; display:block; margin-top:5px;">${shortId}</strong>
                <p style="margin:5px 0 0 0; font-size:0.7em; opacity:0.5;">Käytä tätä maksuviestissä</p>
            </div>
        </div>

        <div style="margin-top:20px;">
            <h3>🏷️ Omat tiedot</h3>
            <label>Nimimerkki (Geocaching.com):</label>
            <input type="text" id="setNick" value="${nickname}" style="${inputStyle}">
            
            <label>Geocache.fi ID-numero:</label>
            <input type="number" id="setGcId" value="${gcId}" placeholder="esim. 306478" style="${inputStyle}">
            
            <button class="btn btn-primary" style="width:100%;" onclick="app.saveSettings()">Tallenna tiedot</button>
        </div>

        ${importHtml}

        <hr style="margin:25px 0; border-color:var(--border-color);">
        <h3>👥 Kaverilista</h3>
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <input type="text" id="newFriendName" placeholder="Nimimerkki" style="${inputStyle} margin-bottom:0;">
            <input type="number" id="newFriendId" placeholder="ID" style="${inputStyle} margin-bottom:0; width:80px;">
        </div>
        <button class="btn btn-primary" style="width:100%; margin-bottom:15px;" onclick="app.addFriend()">Lisää kaveri</button>
        
        <div id="friendListContainer" style="max-height:300px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">Ladataan...</div>
        
        <hr style="margin:25px 0; border-color:var(--border-color);">
        ${dangerZoneHtml}
    </div>
    `;

    Auth.loadFriends(db, user.uid, 'friendListContainer', null);
    window.app.saveSettings = async () => { 
        const newNick = document.getElementById('setNick').value.trim();
        const newId = document.getElementById('setGcId').value.trim();
        if(!newNick) return alert("Nimimerkki ei voi olla tyhjä.");
        try {
            await updateDoc(doc(db, "users", user.uid), { nickname: newNick, gcId: newId });
            app.savedNickname = newNick; app.savedId = newId; alert("Tiedot tallennettu! ✅");
        } catch(e) { alert("Virhe tallennuksessa."); }
    };

    if (isPremium) {
        document.getElementById('impBtn').onclick = async () => {
            const raw = document.getElementById('impInput').value;
            const log = document.getElementById('impLog');
            const idxTradi = parseInt(document.getElementById('impColTradi').value) - 1;
            const idxMulti = parseInt(document.getElementById('impColMulti').value) - 1;
            const idxMysse = parseInt(document.getElementById('impColMysse').value) - 1;

            log.innerHTML = "Aloitetaan...";
            try {
                const lines = raw.split('\n');
                const result = {};
                let count = 0;
                const sortedRegions = [...SUOMEN_MAAKUNNAT].sort((a, b) => b.length - a.length);

                lines.forEach(line => {
                    let clean = line.trim();
                    if(!clean || clean.startsWith("Paikkakunta") || clean.length < 5) return;

                    let kunta = "", numsPart = "";
                    let found = false;

                    // 1. Etsitään maakunta
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
