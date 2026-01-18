// Ohjesivun sisältö
export const renderHelp = (content, app) => {
    content.innerHTML = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>Ohjeet</h1>
            <button class="btn" onclick="app.router('home')" style="padding:5px 10px;">⬅ Etusivulle</button>
        </div>
        
        <h3>1. Kuvageneraattori</h3>
        <p>Luo tilastokuvia Geocache.fi-palvelun datasta. 
           <br>👉 <strong>Vinkki:</strong> Voit tallentaa oman nimimerkkisi ja ID-numerosi oletukseksi painamalla "Tallenna"-nappia (💾) generaattorissa.</p>

        <h3>2. Tilastot (Omat löydöt)</h3>
        <p>Tämä osio näyttää edistyneitä tilastoja (kuten Tripletit ja Maakunnat) omien löytöjesi perusteella.</p>
        <p>Toisin kuin Geocache.fi, tämä työkalu mahdollistaa esimerkiksi puuttuvien kuntien helpon suodatuksen ja "nollakerhon" tarkastelun.</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-top:20px;">
            <h3 style="margin-top:0; color:#fab387;">🛠️ Datan päivitys (Admin)</h3>
            <p>Jotta tilastot toimivat, sinun täytyy tuoda omat löytösi tietokantaan. Tämä kannattaa tehdä <strong>tietokoneella</strong>.</p>
            
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

        <h3>3. Tietoturva</h3>
        <p style="font-size:0.9em; opacity:0.8;">
            Tämä sovellus on rakennettu yksityisyyttä kunnioittaen. 
            Vain sinä näet omat tilastosi, jotka tuot Admin-työkalulla. 
            Kuvageneraattori käyttää julkisia Geocache.fi-linkkejä.
        </p>
        
        <p style="text-align:center; margin-top:30px; font-size:0.8em; opacity:0.5;">
            MK Porttaali v2.6
        </p>
    </div>
    `;
};
