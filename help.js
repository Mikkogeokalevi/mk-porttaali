export const renderHelp = (content, app) => {
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
        <p>Osa toiminnoista (Tilastot, Kartat) vaatii aktiivisen Premium-tilauksen. Näin tilaat:</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border-left:4px solid #fab387;">
            <ol style="margin-left:15px; padding-left:0; line-height:1.6;">
                <li>Mene sovelluksessa kohtaan <strong>⚙️ Asetukset</strong>.</li>
                <li>Etsi kohdasta "Käyttäjätili" oma <strong>MK-tunnuksesi</strong> (esim. <code>AB123</code>).</li>
                <li>Suorita maksu (esim. MobilePay) ja kirjoita viestiin tuo tunnuksesi.</li>
                <li>Kun ylläpito on käsitellyt maksun, Premium-ominaisuudet aukeavat automaattisesti.</li>
            </ol>
        </div>

        <p style="font-size:0.9em; margin-top:10px;">
            <strong>Hinnasto (esimerkki):</strong><br>
            • 1 Viikko: 1 €<br>
            • 1 Vuosi: 10 €<br>
            • Toistaiseksi voimassa: Sopimuksen mukaan
        </p>

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
        <p>Kun Premium on aktiivinen, pääset käyttämään interaktiivisia karttoja:</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li style="margin-bottom:10px;">
                <strong>Triplettijahti:</strong> Kartta näyttää kunnat, joista puuttuu jokin kolmesta peruskätkötyypistä (Tradi, Multi, Mysteeri).
                <br><span style="color:#a6e3a1;">■ Vihreä</span> = Valmis
                <br><span style="color:#f38ba8;">■ Punainen</span> = Puuttuu jotain
            </li>
            <li style="margin-bottom:10px;">
                <strong>Löydöt maakunnittain:</strong> Yleiskartta kaikista löydetyistä kunnista.
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
