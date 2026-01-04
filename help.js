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
           <br>👉 <strong>Vinkki:</strong> Voit tallentaa oman nimimerkkisi oletukseksi painamalla "Tallenna"-nappia generaattorissa.</p>

        <h3>2. Tilastot (Omat löydöt)</h3>
        <p>Tämä osio näyttää edistyneitä tilastoja (kuten Tripletit ja Maakunnat) omien löytöjesi perusteella.</p>
        <p>Toisin kuin Geocache.fi, tämä työkalu mahdollistaa esimerkiksi puuttuvien kuntien helpon suodatuksen ja "nollakerhon" tarkastelun.</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-top:20px;">
            <h3>🛠️ Datan päivitys (Admin)</h3>
            <p>Jotta tilastot toimivat, sinun täytyy tuoda omat löytösi tietokantaan.</p>
            <p>Tämä toimenpide kannattaa tehdä <strong>tietokoneella</strong>.</p>
            
            <p style="text-align:center; margin: 20px 0;">
                <a href="admin.html" target="_blank" class="btn btn-primary">
                    Avaa Admin-työkalu ↗
                </a>
            </p>
            
            <p style="font-size:0.9em; opacity:0.8;">
                <strong>Ohje:</strong> 
                1. Mene Admin-sivulle tietokoneella.<br>
                2. Kopioi löytösi Geocache.fi:stä (tai My Finds -tiedostosta).<br>
                3. Paina "Tallenna pilveen".<br>
                4. Palaa tähän sovellukseen ja päivitä sivu.
            </p>
        </div>
    </div>
    `;
};
