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
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; margin-bottom:30px; border-left:4px solid #a6e3a1;">
            <h3 style="margin-top:0; color:#a6e3a1;">🚀 Uutta versiossa 2.9</h3>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>10.7.2026:</strong> Karttapohja vaihdettu selkeämpään Voyager-pohjaan, jossa tiet ja paikannimet näkyvät paremmin reissujen suunnittelua varten.</li>
                <li><strong>10.7.2026:</strong> Löytökarttaan ja Löydöt maakunnittain -listaan lisätty kaikkien kätkötyyppien puutefiltterit sekä vaihtoehdot “puuttuu vähintään yksi” ja “puuttuvat kaikki valitut”.</li>
                <li><strong>10.7.2026:</strong> Mobiilissa kartan kätkötyyppifiltterit on tiivistetty avattavaan paneeliin, jotta kartalle jää enemmän tilaa.</li>
                <li><strong>10.7.2026:</strong> Kuvageneraattoriin lisätty pikapohjat reissukuntakartalle, vuosilöydöille, Jasmerille ja saarilöydöille.</li>
                <li><strong>10.7.2026:</strong> Kuvageneraattorin suosikki- ja viimeksi käytettyjen hakujen käsittelyä parannettu: duplikaatit poistuvat, viimeksi käytetty nousee ylimmäksi ja listan voi tyhjentää.</li>
            </ul>

            <details style="margin-top:15px; cursor:pointer;">
                <summary style="opacity:0.7; font-size:0.9em;">Näytä aiempi historia</summary>
                <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #555; font-size:0.9em; opacity:0.8;">
                    <strong>v2.8 (aiemmat päivitykset)</strong><br>
                    - 2.2.2026: Muuntimet integroitu SPA:han: kaikki 32 kategoriaa iframe-ratkaisulla.<br>
                    - 2.2.2026: Välilehdet vaakarivissä kuten kannettavassa näkymässä.<br>
                    - 2.2.2026: Koodin parannukset: debug-koodi siivottu, virheenkäsittely parannettu.<br>
                    - 2.2.2026: Firebase-config siirretty ympäristömuuttujiin (turvallisuusparannus).<br>
                    - 2.2.2026: Latausindikaattorit näkymän vaihdossa ja parempi UX.<br><br>
                    <strong>v2.7 (lisäpäivitykset)</strong><br>
                    - 28.1.2026: Uusien käyttäjien hyväksyntä toimii myös Google-rekisteröinneissä.<br>
                    - 26.1.2026: Reissuapuri (EXTRA) lisätty ja admin voi kytkeä sen käyttöön käyttäjäkohtaisesti.<br>
                    - 25.1.2026: Kartat: paikannus on valinnainen ja kuntanimet näkyvät zoomilla.<br>
                    - 25.1.2026: Mobiilinäkymän päivitys ja takaisin-navigointi korjattu.<br>
                    - 23.1.2026: Vastuuvapaus ja Premium-ehdot selkeytetty ohjesivulle.<br>
                    - Linkkikirjasto: Linkit eriytetty omaksi, selkeäksi näkymäkseen.<br>
                    - Linkkikirjasto sai uusia geokätkölinkkejä (kartat, sovellukset, Wherigo).<br>
                    - Kartat: Paikannus toggle ja kuntanimet zoomilla.<br>
                    - Kattavat ohjeet: Ohjesivu kirjoitettu kokonaan uusiksi.<br>
                    - Suorituskyky: Koodia optimoitu nopeammaksi.<br>
                    - Premium: Selkeytetty ominaisuuksien näkyvyyttä.<br>
                    - Kuvageneraattori: Mobiilivalikon ulkoasu parannettu.<br>
                    - Admin-työkalut: Parannettu massamuokkaus ja käyttäjähallinta.<br><br>
                    <strong>v2.5</strong><br>
                    - Kuvageneraattoriin lisätty vuosifiltterit.<br>
                    - Karttojen latausnopeutta parannettu.<br><br>
                    <strong>v2.4</strong><br>
                    - Triplettikartta julkaistu.<br>
                    - PGC-linkitys lisätty kuntiin.<br><br>
                    <strong>v2.0</strong><br>
                    - Siirtyminen Firebase-tietokantaan.<br>
                    - Reaaliaikainen datan synkronointi.
                </div>
            </details>
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

        <h3>⚙️ 2. Asetukset & Datan tuonti</h3>
        
        <h4>Perustiedot <span style="font-size:0.7em; background:#bac2de; color:#1e1e2e; padding:2px 5px; border-radius:4px;">FREE</span></h4>
        <p>Asetukset-sivulla hallinnoit profiiliasi. Tärkeimmät kohdat:</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li><strong>Geocache.fi ID:</strong> Pakollinen, jotta linkit (esim. profiiliin tai kuntakarttaan) ohjautuvat oikein. Löydät tämän Geocache.fi-profiilisi osoiteriviltä (id=...).</li>
            <li><strong>Kaverilista:</strong> Tallenna kavereiden nimimerkkejä, jotta voit generoida heille kuvia nopeasti.</li>
        </ul>

        <h4>Omien löytöjen tuonti <span style="font-size:0.7em; background:#fab387; color:#1e1e2e; padding:2px 5px; border-radius:4px;">PREMIUM</span></h4>
        <p>Jotta kartat toimivat, sovelluksen täytyy tietää löytösi. Datan tuonti tapahtuu <strong>Asetukset</strong>-sivun alalaidasta:</p>
        
        <div style="background:#313244; padding:15px; border-radius:8px; border:1px solid #45475a;">
            <strong>Näin tuot tiedot (Askel askeleelta):</strong>
            <ol style="margin-left:15px; padding-left:0; line-height:1.6;">
                <li>Avaa <strong>Geocache.fi</strong> ja kirjaudu sisään.</li>
                <li>Mene omaan profiiliisi ja valitse välilehti <strong>Tilastot</strong>.</li>
                <li>Etsi sivu, jossa on taulukko <em>"Löydöt kunnittain"</em>.</li>
                <li><strong>Maalaa ja kopioi</strong> koko taulukon sisältö (Ctrl+A, Ctrl+C).</li>
                <li>Palaa MK Porttaaliin -> <strong>Asetukset</strong>.</li>
                <li>Liitä teksti isoon tekstikenttään "Liitä taulukko tähän...".</li>
                <li>Paina <strong>Prosessoi & Tallenna</strong>.</li>
            </ol>
        </div>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🗺️ 3. Kartat & Tilastot <span style="font-size:0.7em; background:#fab387; color:#1e1e2e; padding:2px 5px; border-radius:4px;">PREMIUM</span></h3>
        <p>MK Porttaali tarjoaa edistyneitä karttoja haasteiden suorittamiseen.</p>

        <h4>Triplettijahti</h4>
        <p>Kartta "Tripletti"-haasteeseen (Tradi + Multi + Mysteeri samasta kunnasta).</p>
        <ul style="list-style:none; padding-left:10px;">
            <li><span style="color:#a6e3a1;">■ Vihreä</span> = Kunta on valmis.</li>
            <li><span style="color:#f9e2af;">■ Keltainen</span> = Yksi tyyppi puuttuu.</li>
            <li><span style="color:#fab387;">■ Oranssi</span> = Kaksi tyyppiä puuttuu.</li>
            <li><span style="color:#f38ba8;">■ Punainen</span> = Ei suorituksia.</li>
        </ul>
        <p>Klikkaamalla kuntaa saat suoran linkin <em>Project-GC Map Compare</em> -työkaluun, joka hakee puuttuvat kätkötyypit kyseiseltä alueelta.</p>

        <h4>Löydöt maakunnittain</h4>
        <p>Yleiskartta, joka näyttää missä kunnissa olet löytänyt <em>mitä tahansa</em> kätköjä. Hyvä työkalu yleisen kuntakartan värittämiseen.</p>
        <p><strong>Kätkötyyppifiltterit:</strong> Kartan ja tekstimuotoisen kuntalistan suodattimesta voit valita minkä tahansa tuetun kätkötyypin. Näkymiin jäävät tällöin vain kunnat, joista valittu tyyppi puuttuu. Usean tyypin kohdalla voit valita joko <em>Puuttuu vähintään yksi</em> tai <em>Puuttuvat kaikki valitut</em>. Maakunnat, joihin ei jää yhtään sopivaa kuntaa, piilotetaan automaattisesti.</p>
        <p><strong>Mobiilissa:</strong> Suodattimet ovat avattavan <em>Suodattimet</em>-painikkeen takana, jotta kartalle ja listalle jää enemmän näkyvää tilaa. Kannettavalla kaikki suodattimet näkyvät suoraan.</p>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🧭 Reissuapuri <span style="font-size:0.7em; background:#b4befe; color:#1e1e2e; padding:2px 5px; border-radius:4px;">EXTRA</span></h3>
        <p>Reissuapuri on matkakohtainen työkalu reissukuntien, löydettyjen kätköjen ja reissulistojen hallintaan kartalla. Se on erillinen lisäominaisuus, jonka ylläpito voi halutessaan kytkeä käyttöön käyttäjäkohtaisesti.</p>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🖼️ 4. Kuvageneraattori <span style="font-size:0.7em; background:#bac2de; color:#1e1e2e; padding:2px 5px; border-radius:4px;">FREE</span></h3>
        <p>Luo visuaalisia tilastoja jaettavaksi somessa tai profiilisivulla. Generaattori hakee kuvat suoraan Geocache.fi:n rajapinnasta.</p>
        <ul>
            <li><strong>Matriisi:</strong> D/T-taulukko väritettynä.</li>
            <li><strong>Kuntakartta:</strong> Koko Suomi tai tarkka maakuntarjaus.</li>
            <li><strong>Vuosikalenteri:</strong> Löydöt kalenterimuodossa.</li>
            <li><strong>Jasmer:</strong> Kätköjen piilotuskuukaudet.</li>
            <li><strong>Saarilöydöt:</strong> Saarilöytöjen tilastokuva.</li>
        </ul>
        <p><strong>Pikapohjat:</strong> Avaa generaattorin <em>Pikapohjat</em>-valikko ja valitse esimerkiksi reissun kuntakartta, vuosilöydöt, Jasmer tai saarilöydöt. Pohja täyttää generaattorin asetukset automaattisesti.</p>
        <p><strong>Suosikkihaut:</strong> Tallenna usein käyttämäsi haku suosikiksi ja hallitse niitä <em>Suosikkihaut</em>-valikosta. Voit käyttää, nimetä uudelleen, päivittää, järjestää ja poistaa suosikkeja.</p>
        <p><strong>Viimeksi käytetyt:</strong> Generaattori muistaa enintään kahdeksan viimeisintä hakua käyttäjäkohtaisesti. Sama haku ei synny listalle duplikaattina, vaan sen käyttöaika päivittyy. Listan voi tyhjentää <em>Tyhjennä</em>-painikkeella.</p>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🧮 5. Muuntimet & Työkalut <span style="font-size:0.7em; background:#fab387; color:#1e1e2e; padding:2px 5px; border-radius:4px;">PREMIUM</span></h3>
        <p>Sisältää <strong>yli 20 erilaista työkalua</strong> ja satoja yksiköitä mysteerien ratkointiin ja kenttätyöskentelyyn. Työkalut toimivat myös offline-tilassa.</p>
        
        <ul style="line-height:1.6; padding-left:20px;">
            <li><strong>Koordinaattimuuntimet:</strong> Muunna WGS84, EUREF-FIN ja YKJ -koordinaattien välillä.</li>
            <li><strong>Tekstityökalut:</strong> ROT13, Käänteinen teksti, Sanalaskuri.</li>
            <li><strong>Numerot:</strong> Roomalaiset numerot, Lukujärjestelmämuuntimet (BIN, HEX, OCT).</li>
            <li><strong>Mittayksiköt:</strong> Pituus, Pinta-ala, Tilavuus, Lämpötila.</li>
            <li><strong>Sähkö & Fysiikka:</strong> Ohmin laki, Teho, Energia.</li>
        </ul>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>🌐 6. Linkkikirjasto</h3>
        <p>Linkkikirjastosta löydät kootusti tärkeimmät ulkoiset palvelut:</p>
        <ul>
            <li><strong>Geocache.fi & Geocaching.com:</strong> Suorat linkit pääsivustoille.</li>
            <li><strong>Project-GC:</strong> Tilastot ja haasteet.</li>
            <li><strong>Checkerit & Ratkojat:</strong> Geocheck, Jigidi-ratkojat ja muut apuvälineet.</li>
        </ul>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>⚠️ Vastuuvapaus & Käyttöehdot</h3>
        <p>MK Porttaali on harrasteprojekti ja tarjotaan sellaisena kuin se on. Toimivuutta ei taata, ja palvelu voi muuttua, olla tilapäisesti pois käytöstä tai päättyä kokonaan ilman ennakkoilmoitusta.</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li>En vastaa palvelun keskeytyksistä, virheistä tai tietojen puutteista.</li>
            <li>Premium-tilaukset ovat vapaaehtoinen tuki projektille, eikä maksuja palauteta.</li>
        </ul>

        <hr style="border-color:var(--border-color); margin:20px 0;">

        <h3>💎 Premium-tilaus</h3>
        <p>MK Porttaalin kehitys ja ylläpito vaatii resursseja. Premium-tilauksella tuet palvelua ja saat käyttöösi kaikki tehotyökalut.</p>
        
        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border-left:4px solid #fab387; margin-bottom:20px;">
            <h4 style="margin-top:0; color:#fab387;">Hinnasto</h4>
            <ul style="list-style:none; padding:0; margin:0; line-height:1.8;">
                <li>• <strong>Testi (1 vko):</strong> 1 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1VK)</span></li>
                <li>• <strong>Jakso (1 kk):</strong> 2 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1KK)</span></li>
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
            
            <div style="margin-top:15px; padding-top:10px; border-top:1px solid #45475a; font-size:0.9em; opacity:0.8; display:flex; gap:10px; align-items:start;">
                <span style="font-size:1.2em;">ℹ️</span>
                <span>Huomioithan, että maksut tarkistetaan ja aktivoidaan manuaalisesti. Ominaisuudet kytkeytyvät päälle heti, kun ylläpito on ehtinyt käsitellä suorituksen.</span>
            </div>
            <div style="margin-top:10px; font-size:0.9em; opacity:0.8;">
                Premium-maksut ovat vapaaehtoinen tuki projektille, eikä maksuja palauteta.
            </div>
        </div>
    </div>
    `;
};
