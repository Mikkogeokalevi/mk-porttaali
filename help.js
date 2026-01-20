export const renderHelp = (content, app) => {
    // Haetaan käyttäjän tiedot viestimallia varten
    const mkCode = app.shortId || "MK-KOODI";
    const nick = app.savedNickname || "Nimimerkki";

    content.innerHTML = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>Ohjeet & Tuki</h1>
            <button class="btn" onclick="app.router('home')" style="padding:5px 10px;">⬅ Etusivulle</button>
        </div>
        
        <h3>📱 1. Asenna sovellukseksi</h3>
        <p>Saat parhaan käyttökokemuksen lisäämällä MK Porttaalin aloitusnäytölle:</p>
        <ul style="line-height:1.6; padding-left:20px; color:var(--text-color);">
            <li style="margin-bottom:10px;">
                <strong>Android (Chrome):</strong><br>
                Avaa valikko (kolme pistettä) -> <span style="color:var(--accent-color);">"Asenna sovellus"</span> tai "Lisää aloitusnäytölle".
            </li>
            <li>
                <strong>iOS (Safari):</strong><br>
                Paina Jaa-painiketta (nuoli laatikosta) -> <span style="color:var(--accent-color);">"Lisää Koti-valikkoon"</span> (Add to Home Screen).
            </li>
        </ul>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>💎 2. Premium-tilaus</h3>
        <p>Osa toiminnoista (Tilastot, Kartat, Muuntimet) vaatii aktiivisen Premium-tilauksen.</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border-left:4px solid #fab387; margin-bottom:20px;">
            <h4 style="margin-top:0; color:#fab387;">Hinnasto</h4>
            <ul style="list-style:none; padding:0; margin:0; line-height:1.8;">
                <li>• <strong>Testi (1 vko):</strong> 1 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1VK)</span></li>
                <li>• <strong>Jakso (3 kk):</strong> 3 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-3KK)</span></li>
                <li>• <strong>Kausi (6 kk):</strong> 5 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-6KK)</span></li>
                <li>• <strong>Vuosi (12 kk):</strong> 10 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1V)</span></li>
                <li style="margin-top:5px; color:#cba6f7;">• <strong>👑 Frendi-jäsenyys:</strong> Kysy tarjous (Ikuinen käyttöoikeus)</li>
            </ul>
        </div>

        <div style="background:#181825; padding:15px; border-radius:8px; border:1px solid #45475a;">
            <strong style="color:#fab387;">Kuinka tilaan?</strong>
            <ol style="margin-left:15px; padding-left:0; line-height:1.6; margin-bottom:15px;">
                <li>Mene sovelluksessa kohtaan <strong>⚙️ Asetukset</strong> ja tarkista oma <strong>MK-tunnuksesi</strong> (esim. <code>${mkCode}</code>).</li>
                <li>Suorita maksu <strong>MobilePaylla</strong> numeroon <strong>[NUMERO]</strong>.</li>
                <li><strong>TÄRKEÄÄ:</strong> Kirjoita viestikenttään seuraavat tiedot:</li>
            </ol>
            
            <div style="background:#000; padding:10px; font-family:monospace; margin:10px 0; border-radius:4px; border-left:3px solid #a6e3a1;">
                ${nick} ${mkCode} [TUOTEKOODI]
            </div>
            <p style="font-size:0.9em; opacity:0.8;">Esimerkki: <em>${nick} ${mkCode} T-6KK</em></p>
            <p style="font-size:0.8em; margin-top:5px;">Kun ylläpito on käsitellyt maksun, Premium-ominaisuudet aukeavat automaattisesti.</p>
        </div>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>⚙️ 3. Omat tiedot ja Kaverit</h3>
        <p>Voit hallita tietojasi <strong>Asetukset</strong>-sivulla:</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li style="margin-bottom:10px;">
                <strong>Nimimerkki & ID:</strong> Tallenna oma geocaching-nimimerkkisi ja Geocache.fi ID-numerosi. ID-numeroa tarvitaan, jotta karttalinkit toimivat oikein.
            </li>
            <li>
                <strong>Kaverilista:</strong> Voit lisätä kavereiden nimimerkkejä muistiin. Nämä ilmestyvät ehdotuksina, kun käytät Kuvageneraattoria.
            </li>
        </ul>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🗺️ 4. Kartat & Tilastot (Premium)</h3>
        <p>Kun Premium on aktiivinen, saat käyttöösi laajat työkalut:</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li style="margin-bottom:10px;">
                <strong>Triplettijahti:</strong> Kartta näyttää kunnat, joista puuttuu jokin kolmesta peruskätkötyypistä (Tradi, Multi, Mysteeri).
                <br><span style="color:#a6e3a1;">■ Vihreä</span> = Valmis
                <br><span style="color:#f38ba8;">■ Punainen</span> = Puuttuu jotain
            </li>
            <li style="margin-bottom:10px;">
                <strong>Löydöt maakunnittain:</strong> Yleiskartta kaikista löydetyistä kunnista.
            </li>
            <li style="margin-bottom:10px;">
                <strong>Muuntimet:</strong> Laaja valikoima koordinaattimuuntimia kätköilyn tarpeisiin.
            </li>
            <li style="margin-bottom:10px;">
                <strong>Datan tuonti:</strong> Voit tuoda omat löytötilastosi suoraan Geocache.fi-palvelusta (copy-paste) Asetukset-sivun kautta.
            </li>
        </ul>
        <p><strong>Vinkki:</strong> Klikkaa kartalla olevaa kuntaa nähdäksesi tarkemmat tiedot ja linkin <em>Project-GC</em> -karttapalveluun.</p>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🖼️ 5. Kuvageneraattori</h3>
        <p>Luo tilastokuvia suoraan Geocache.fi-datasta. Tämä toiminto on kaikille avoin.</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li>Valitse kuvan tyyppi (esim. Kuntakartta tai Vuosikalenteri).</li>
            <li>Kirjoita käyttäjänimi (tai valitse kaverilistasta).</li>
            <li>Voit rajata hakua vuodella, kuukaudella tai kätkötyypillä.</li>
        </ul>

        <p style="text-align:center; margin-top:30px; font-size:0.8em; opacity:0.5;">
            MK Porttaali v2.6
        </p>
    </div>
    `;
};
