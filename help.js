// Ohjesivun sisältö
export const renderHelp = (content, app) => {
    content.innerHTML = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>Ohjeet</h1>
            <button class="btn" onclick="app.router('home')" style="padding:5px 10px;">⬅ Etusivulle</button>
        </div>
        
        <h3>📱 1. Asenna sovellukseksi</h3>
        <p>Saat MK Porttaalin toimimaan kuin oikea sovellus (koko näytön tila, oma kuvake) lisäämällä sen aloitusnäytölle:</p>
        <ul style="line-height:1.6; padding-left:20px; color:var(--text-color);">
            <li style="margin-bottom:10px;">
                <strong>Android (Chrome):</strong><br>
                Paina selaimen valikosta (kolme pistettä) <span style="color:var(--accent-color);">"Asenna sovellus"</span> tai "Lisää aloitusnäytölle".
            </li>
            <li>
                <strong>iOS (Safari):</strong><br>
                Paina Jaa-painiketta (nuoli laatikosta) ja valitse listasta <span style="color:var(--accent-color);">"Lisää Koti-valikkoon"</span> (Add to Home Screen).
            </li>
        </ul>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>👥 2. Kaverit & ID-numerot</h3>
        <p>Voit tallentaa kavereiden nimimerkit muistiin Kuvageneraattorissa. <strong>Miksi lisätä myös ID-numero?</strong></p>
        <p>Kun ID on tallennettu, Kuvatilastot-sivun kartat muuttuvat <strong>interaktiivisiksi linkeiksi</strong>, jotka vievät suoraan Geocache.fi:n klikattavaan karttaan!</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border-left:4px solid var(--accent-color);">
            <strong>Näin lisäät kaverin:</strong>
            <ol style="margin-left:15px; padding-left:0;">
                <li>Mene <strong>Kuvageneraattori</strong>-sivulle.</li>
                <li>Paina ratas-ikonia (⚙️) käyttäjäkentän vieressä.</li>
                <li>Kirjoita <strong>Nimimerkki</strong>.</li>
                <li>Kirjoita <strong>ID-numero</strong> (vapaaehtoinen, mutta suositeltava).
                    <br><span style="font-size:0.8em; opacity:0.7;">(Löydät ID:n kaverin Geocache.fi-profiilisivun osoiteriviltä: userid=12345)</span>
                </li>
                <li>Paina <strong>Lisää</strong>.</li>
            </ol>
        </div>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>📊 3. Omat Tilastot (Päivitys)</h3>
        <p>Jotta "Tilastot"-osion tarkat analyysit (kuten Tripletit ja puuttuvat kunnat) toimivat, sinun täytyy tuoda omat löytösi tietokantaan.</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-top:10px;">
            <h4 style="margin-top:0; color:#fab387;">🛠️ Datan tuonti (Tee tietokoneella)</h4>
            
            <div style="background:#1e1e2e; padding:15px; border-radius:6px; margin:10px 0; border-left:4px solid #fab387;">
                <strong>Toimi näin:</strong>
                <ol style="margin-left:15px; padding-left:0; line-height:1.6;">
                    <li style="margin-bottom:8px;">
                        Mene Geocache.fi -sivulle: <a href="https://www.geocache.fi/stat/other/jakauma.php" target="_blank" style="color:var(--accent-color); font-weight:bold;">Löytötilasto paikkakunnittain ↗</a>
                        <br><span style="font-size:0.85em; opacity:0.7;">(Polku: Tilastot -> Lisätilastot -> Löytötilasto paikkakunnittain)</span>
                    </li>
                    <li style="margin-bottom:8px;">
                        <strong>Maalaa taulukko:</strong> Aloita maalaaminen hiirellä vasemmasta yläkulmasta sanasta <em>"Paikkakunta"</em>. Vedä maalaus alas asti aivan viimeisen kunnan rivin loppuun saakka.
                    </li>
                    <li style="margin-bottom:8px;">
                        Kopioi valinta (Ctrl + C).
                    </li>
                    <li style="margin-bottom:8px;">
                        Avaa <a href="admin.html" target="_blank" style="color:var(--accent-color); font-weight:bold;">Admin-työkalu ↗</a>.
                    </li>
                    <li>
                        Liitä data laatikkoon (Ctrl + V) ja paina "1. Prosessoi data".
                    </li>
                </ol>
            </div>
            
            <p style="text-align:center; margin-top: 20px;">
                <a href="admin.html" target="_blank" class="btn btn-primary" style="text-decoration:none;">
                    Avaa Admin-työkalu ↗
                </a>
            </p>
        </div>

        <p style="text-align:center; margin-top:30px; font-size:0.8em; opacity:0.5;">
            MK Porttaali v2.6
        </p>
    </div>
    `;
};
