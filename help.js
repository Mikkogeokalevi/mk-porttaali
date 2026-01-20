export const renderHelp = (content, app) => {
    // Haetaan käyttäjän tiedot viestimallia varten
    const mkCode = app.shortId || "MK-KOODI";
    const nick = app.savedNickname || "Nimimerkki";

    content.innerHTML = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h1>Ohjeet & Tuki</h1>
            <button class="btn" onclick="app.router('home')" style="padding:5px 10px;">⬅ Etusivulle</button>
        </div>
        
        <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; margin-bottom:20px; border-left:4px solid var(--accent-color);">
            <p style="margin:0; font-size:0.9em;">Tämä ohje kattaa MK Porttaalin version <strong>2.6</strong> toiminnot.</p>
        </div>

        <h3>📱 1. Asennus (Kaikille)</h3>
        <p>Saat parhaan käyttökokemuksen lisäämällä MK Porttaalin puhelimen aloitusnäytölle (ns. App-tila).</p>
        <ul style="line-height:1.6; padding-left:20px; color:var(--text-color);">
            <li style="margin-bottom:10px;">
                <strong>Android (Chrome):</strong><br>
                Avaa selaimen valikko (kolme pistettä ylhäällä) -> Valitse <span style="color:var(--accent-color);">"Asenna sovellus"</span> tai "Lisää aloitusnäytölle".
            </li>
            <li>
                <strong>iOS (Safari):</strong><br>
                Paina Jaa-painiketta (nuoli laatikosta alhaalla) -> Etsi listasta <span style="color:var(--accent-color);">"Lisää Koti-valikkoon"</span> (Add to Home Screen).
            </li>
        </ul>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>⚙️ 2. Asetukset & Omat tiedot</h3>
        
        <h4>A. Perustiedot <span style="font-size:0.7em; background:#bac2de; color:#1e1e2e; padding:2px 5px; border-radius:4px;">FREE</span></h4>
        <p>Asetukset-sivulla voit hallita seuraavia:</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li><strong>Nimimerkki:</strong> Aseta geokätköily-nimimerkkisi. Tätä käytetään oletuksena kuvageneraattorissa.</li>
            <li><strong>Geocache.fi ID:</strong> Tärkeä numero, jotta linkit (esim. profiiliin tai kuntakarttaan) toimivat oikein. Löydät tämän Geocache.fi-profiilisi osoiteriviltä (id=...).</li>
            <li><strong>Kaverilista:</strong> Tallenna kavereiden nimimerkkejä muistiin, jotta voit nopeasti generoida heille kuvia ilman kirjoittamista.</li>
        </ul>

        <h4>B. Omien löytöjen tuonti <span style="font-size:0.7em; background:#fab387; color:#1e1e2e; padding:2px 5px; border-radius:4px;">PREMIUM</span></h4>
        <p>Jotta kartat (Tripletti, Löydöt) toimivat, sovelluksen täytyy tietää löytösi. Datan tuonti tapahtuu <strong>Asetukset</strong>-sivun alalaidasta:</p>
        
        <div style="background:#313244; padding:15px; border-radius:8px; border:1px solid #45475a;">
            <strong>Näin tuot tiedot (Askel askeleelta):</strong>
            <ol style="margin-left:15px; padding-left:0; line-height:1.6;">
                <li>Avaa <strong>Geocache.fi</strong> ja kirjaudu sisään.</li>
                <li>Mene omaan profiiliisi ja valitse välilehti <strong>Tilastot</strong>.</li>
                <li>Etsi sivu, jossa on taulukko <em>"Löydöt kunnittain"</em> (Listassa on kunnan nimi ja löytömäärät sarakkeissa Tradi, Multi, jne).</li>
                <li><strong>Maalaa ja kopioi</strong> koko taulukon sisältö (voit ottaa mukaan otsikot tai olla ottamatta, MK osaa lukea ne).</li>
                <li>Palaa MK Porttaaliin -> <strong>Asetukset</strong>.</li>
                <li>Liitä teksti isoon tekstikenttään "Liitä taulukko tähän...".</li>
                <li>Paina <strong>Prosessoi & Tallenna</strong>.</li>
            </ol>
            <p style="font-size:0.9em; opacity:0.8;">⚠️ Huom: Jos taulukon muotoilu on muuttunut Geocache.fi:ssä, ilmoita ylläpidolle.</p>
        </div>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🗺️ 3. Kartat & Työkalut</h3>

        <h4>Kuvageneraattori <span style="font-size:0.7em; background:#bac2de; color:#1e1e2e; padding:2px 5px; border-radius:4px;">FREE</span></h4>
        <p>Luo visuaalisia tilastoja jaettavaksi somessa tai profiilisivulla. Generaattori hakee kuvat suoraan Geocache.fi:n rajapinnasta.</p>
        <ul>
            <li>Voit rajata hakua vuodella, kuukaudella tai kätkötyypillä.</li>
            <li>Jos valitset "Kuntakartta", voit valita näyttääkö se koko Suomen, yksittäisen maakunnan vai tietyt kunnat.</li>
        </ul>

        <h4>Triplettijahti <span style="font-size:0.7em; background:#fab387; color:#1e1e2e; padding:2px 5px; border-radius:4px;">PREMIUM</span></h4>
        <p>Tämä kartta on suunniteltu erityisesti "Tripletti"-haasteen suorittamiseen (Löydä Tradi, Multi ja Mysteeri samasta kunnasta).</p>
        <ul style="list-style:none; padding-left:10px;">
            <li><span style="color:#a6e3a1;">■ Vihreä</span> = Kunta on valmis (kaikki 3 tyyppiä löydetty).</li>
            <li><span style="color:#f9e2af;">■ Keltainen</span> = Yksi tyyppi puuttuu.</li>
            <li><span style="color:#fab387;">■ Oranssi</span> = Kaksi tyyppiä puuttuu.</li>
            <li><span style="color:#f38ba8;">■ Punainen</span> = Kaikki puuttuu tai ei löytöjä.</li>
        </ul>
        <p>Klikkaamalla kuntaa näet tarkalleen mitä puuttuu ja saat suoran linkin <em>Project-GC Map Compare</em> -työkaluun kyseiselle alueelle.</p>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>💎 4. Premium-tilaus</h3>
        <p>MK Porttaalin kehitys ja ylläpito vaatii resursseja. Premium-tilauksella tuet palvelua ja saat käyttöösi kaikki tehotyökalut.</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border-left:4px solid #fab387; margin-bottom:20px;">
            <h4 style="margin-top:0; color:#fab387;">Hinnasto</h4>
            <ul style="list-style:none; padding:0; margin:0; line-height:1.8;">
                <li>• <strong>Testi (1 vko):</strong> 1 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1VK)</span></li>
                <li>• <strong>Jakso (3 kk):</strong> 3 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-3KK)</span></li>
                <li>• <strong>Kausi (6 kk):</strong> 5 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-6KK)</span></li>
                <li>• <strong>Vuosi (12 kk):</strong> 10 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1V)</span></li>
            </ul>
        </div>

        <div style="background:#181825; padding:15px; border-radius:8px; border:1px solid #45475a;">
            <strong style="color:#fab387;">Kuinka tilaan?</strong>
            <ol style="margin-left:15px; padding-left:0; line-height:1.6; margin-bottom:15px;">
                <li>Mene sovelluksessa kohtaan <strong>⚙️ Asetukset</strong> ja tarkista oma <strong>MK-tunnuksesi</strong> (esim. <code>${mkCode}</code>).</li>
                <li>Suorita maksu <strong>MobilePaylla</strong> numeroon <strong>[NUMERO PUUTTUU]</strong>.</li>
                <li>Kirjoita viestikenttään: <code>${nick} ${mkCode} [TUOTEKOODI]</code></li>
            </ol>
            <p style="font-size:0.8em;">Kun ylläpito on käsitellyt maksun, Premium-ominaisuudet aukeavat automaattisesti.</p>
        </div>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>📜 Versiohistoria & Muutosloki</h3>
        <div style="font-size:0.9em; opacity:0.8; font-family:monospace; background:rgba(0,0,0,0.1); padding:10px; border-radius:6px;">
            <div style="margin-bottom:10px;">
                <strong style="color:var(--accent-color);">v2.6 (Nykyinen)</strong>
                <ul style="margin:5px 0 0 20px; padding:0;">
                    <li>Graafinen ilme uusittu (Logot lisätty kirjautumiseen ja etusivulle).</li>
                    <li>Ohjesivu kirjoitettu kokonaan uusiksi yksityiskohtaisemmaksi.</li>
                    <li>Premium-ominaisuuksien näkyvyyttä parannettu.</li>
                    <li>Koodipohjan optimointia ja siivousta.</li>
                </ul>
            </div>
            <div style="margin-bottom:10px; opacity:0.5;">
                <strong>v2.0 - v2.5</strong>
                <ul style="margin:5px 0 0 20px; padding:0;">
                    <li>Triplettikartat julkaistu.</li>
                    <li>Kuvageneraattori lisätty.</li>
                    <li>Firebase-tietokanta integroitu.</li>
                </ul>
            </div>
        </div>

        <p style="text-align:center; margin-top:30px; font-size:0.8em; opacity:0.5;">
            MK Porttaali &copy; 2025
        </p>
    </div>
    `;
};
