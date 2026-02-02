import { doc, updateDoc, deleteDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import * as Auth from "./auth.js"; 

// Kopioitu admin.js:stä datan tuontia varten (tarvitaan "älykkääseen" parsintaan)
const SUOMEN_MAAKUNNAT = [
    "Ahvenanmaa", "Etelä-Karjala", "Etelä-Pohjanmaa", "Etelä-Savo", "Kainuu", "Kanta-Häme",
    "Keski-Pohjanmaa", "Keski-Suomi", "Kymenlaakso", "Lappi", "Pirkanmaa", "Pohjanmaa",
    "Pohjois-Karjala", "Pohjois-Pohjanmaa", "Pohjois-Savo", "Päijät-Häme", "Satakunta",
    "Uusimaa", "Varsinais-Suomi"
];

export const renderSettingsView = (content, db, user, app) => {
    // 1. Kirjautumistarkistus
    if (!user) { 
        app.router('login_view'); 
        return; 
    }

    // 2. Alustetaan muuttujat
    const shortId = app.shortId || "Ladataan...";
    const nickname = app.savedNickname || user.displayName || "Nimetön";
    const gcId = app.savedId || "";
    const email = user.email;
    
    // Tarkistetaan onko käyttäjällä oikeus tuoda dataa
    const isPremium = app.userPlan === 'premium' || app.userRole === 'admin';

    // Tyylit input-kentille (16px estää zoomauksen mobiilissa)
    const inputStyle = "width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 15px; background: #181825; border: 1px solid #45475a; color: white; border-radius: 4px; font-size: 16px;";

    // 3. Tilauksen tilan näyttäminen
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

    // 4. Injektoidaan CSS-tyylit raporttia varten (vain tälle sivulle)
    const style = document.createElement('style');
    style.innerHTML = `
        .stat-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 15px; }
        .stat-box { background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; border: 1px solid #45475a; text-align:center; }
        .stat-box span { display:block; font-size:1.4em; font-weight:bold; margin-top:5px; }
        .col-val { display: block; font-weight: bold; color: #fab387; font-size: 1.1em; }
    `;
    content.appendChild(style);

    // 5. Rakennetaan Import-osion HTML (näkyy vain Premiumille)
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
                    <li style="margin-bottom:5px;"><strong>Maalaa taulukko</strong> hiirellä. Aloita vasemmasta yläkulmasta sanasta <em>"Paikkakunta"</em> ja vedä alas asti.</li>
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
            
            <div id="impLog" style="margin-top:20px;"></div>
        </div>
        `;
    } else {
        importHtml = `
        <div style="margin-top:25px; border-top:1px solid var(--border-color); padding-top:20px; opacity:0.5;">
            <h3>📥 Tuo omat tilastot</h3>
            <p>Vaatii Premium-tilauksen.</p>
        </div>`;
    }

    // Vaaravyöhyke-HTML (piilotettu adminilta)
    let dangerZoneHtml = '';
    if (app.userRole !== 'admin') {
        dangerZoneHtml = `
            <h3 style="color:#f38ba8;">⚠️ Vaaravyöhyke</h3>
            <button class="btn" style="background:#f38ba8; color:#1e1e2e; border:none; width:100%; padding:12px;" onclick="app.deleteMyAccount()">❌ Poista käyttäjätilini pysyvästi</button>
        `;
    }

    // 6. Kootaan koko sivun HTML
    content.innerHTML += `
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
        
        <div id="friendListContainer" style="max-height:300px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">
            Ladataan...
        </div>
        
        <hr style="margin:25px 0; border-color:var(--border-color);">

        ${dangerZoneHtml}
    </div>
    `;

    // 7. Ladataan kaverilista
    Auth.loadFriends(db, user.uid, 'friendListContainer', null);

    // 8. Tallennusfunktio
    window.app.saveSettings = async () => { 
        const newNick = document.getElementById('setNick').value.trim();
        const newId = document.getElementById('setGcId').value.trim();
        
        if(!newNick) return alert("Nimimerkki ei voi olla tyhjä.");

        try {
            await updateDoc(doc(db, "users", user.uid), {
                nickname: newNick,
                gcId: newId
            });
            
            app.savedNickname = newNick;
            app.savedId = newId;
            
            alert("Tiedot tallennettu! ✅");
        } catch(e) {
            console.error(e);
            alert("Virhe tallennuksessa.");
        }
    };

    // 9. Datan tuonnin logiikka (Vain jos premium)
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
                
                // Järjestetään maakunnat pituuden mukaan, jotta "Pohjois-Savo" löytyy ennen "Savo" (jos sellaista olisi)
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

                    // 1. Älykäs haku: Etsitään maakunta tekstin seasta
                    for(const r of sortedRegions) {
                        const idx = clean.indexOf(r);
                        if(idx > 0) {
                            kunta = clean.substring(0, idx).trim();
                            numsPart = clean.substring(idx + r.length).trim();
                            found = true;
                            break;
                        }
                    }

                    // 2. Varasuunnitelma: sarkainerotin (tab)
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

                        // Tallennetaan eka rivi raporttia varten
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

                if (count === 0) throw new Error("Ei dataa tunnistettu. Kopioi taulukko Geocache.fi sivulta.");
                
                // Tallennus Firebaseen
                await setDoc(doc(db, "stats", user.uid), {
                    municipalities: result,
                    updatedAt: Timestamp.now()
                });
                
                // Rakennetaan visuaalinen raportti (Green box + Stats grid)
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

            } catch (e) {
                log.innerHTML = `<div style="background:rgba(243, 139, 168, 0.1); border:1px solid #f38ba8; padding:15px; border-radius:8px; color:#f38ba8;">❌ Virhe: ${e.message}</div>`;
            }
        };
    }
};
