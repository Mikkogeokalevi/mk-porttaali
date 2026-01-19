import { doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import * as Auth from "./auth.js"; 

export const renderSettingsView = (content, db, user, app) => {
    if (!user) { app.router('login_view'); return; }

    const shortId = app.shortId || "Ladataan...";
    const nickname = app.savedNickname || user.displayName || "Nimetön";
    const gcId = app.savedId || "";
    const email = user.email;
    const plan = app.userPlan === 'premium' ? '💎 Premium' : 'Ilmainen';

    // Piilotetaan poistonappi Adminilta
    let dangerZoneHtml = '';
    if (app.userRole !== 'admin') {
        dangerZoneHtml = `
            <h3 style="color:#f38ba8;">⚠️ Vaaravyöhyke</h3>
            <p style="font-size:0.9em; opacity:0.7; margin-bottom:10px;">Toimintoa ei voi peruuttaa.</p>
            <button class="btn" style="background:#f38ba8; color:#1e1e2e; border:none;" onclick="app.deleteMyAccount()">❌ Poista käyttäjätilini pysyvästi</button>
        `;
    } else {
        dangerZoneHtml = `
            <h3 style="color:#f38ba8;">⚠️ Vaaravyöhyke</h3>
            <p style="font-size:0.9em; opacity:0.7;">Ylläpitäjän tiliä ei voi poistaa asetuksista.</p>
        `;
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
            <p><strong>Tilaus:</strong> ${plan}</p>
            
            <div style="margin:15px 0; padding:10px; background:#181825; border:1px dashed #fab387; border-radius:6px;">
                <p style="margin:0; font-size:0.8em; color:#fab387;">Sinun MK-tunnuksesi (Maksukoodi):</p>
                <strong style="font-size:1.5em; letter-spacing:1px;">${shortId}</strong>
            </div>
        </div>

        <div style="margin-top:20px;">
            <h3>🏷️ Omat tiedot</h3>
            <p style="font-size:0.9em; opacity:0.8;">Näitä käytetään oletuksena kuvageneraattorissa ja linkeissä.</p>
            
            <label>Nimimerkki (Geocaching.com):</label>
            <input type="text" id="setNick" value="${nickname}">
            
            <label>Geocache.fi ID-numero:</label>
            <input type="number" id="setGcId" value="${gcId}" placeholder="esim. 306478">
            <p style="font-size:0.8em; opacity:0.6; margin-top:-5px;">Löydät tämän profiilisivusi osoiteriviltä (userid=...).</p>
            
            <button class="btn btn-primary" onclick="app.saveSettings()">Tallenna tiedot</button>
        </div>

        <hr style="margin:25px 0; border-color:var(--border-color);">

        <h3>👥 Kaverilista</h3>
        <p style="font-size:0.9em; opacity:0.8;">Tallenna kavereiden tiedot nopeaa käyttöä varten.</p>
        
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <input type="text" id="newFriendName" placeholder="Nimimerkki" style="flex:2;">
            <input type="number" id="newFriendId" placeholder="ID (valinnainen)" style="flex:1;">
            <button class="btn btn-primary" style="flex:0;" onclick="app.addFriend()">Lisää</button>
        </div>
        
        <div id="friendListContainer" style="max-height:300px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">
            Ladataan...
        </div>

        <hr style="margin:25px 0; border-color:var(--border-color);">

        ${dangerZoneHtml}
    </div>
    `;

    // Ladataan kaverit
    Auth.loadFriends(db, user.uid, 'friendListContainer', null);

    // Tallennusfunktio
    window.app.saveSettings = async () => {
        const newNick = document.getElementById('setNick').value.trim();
        const newId = document.getElementById('setGcId').value.trim();
        
        if(!newNick) return alert("Nimimerkki ei voi olla tyhjä.");

        try {
            await updateDoc(doc(db, "users", user.uid), {
                nickname: newNick,
                gcId: newId
            });
            
            // Päivitetään paikallinen tila
            app.savedNickname = newNick;
            app.savedId = newId;
            
            alert("Tiedot tallennettu! ✅");
        } catch(e) {
            console.error(e);
            alert("Virhe tallennuksessa.");
        }
    };
};
