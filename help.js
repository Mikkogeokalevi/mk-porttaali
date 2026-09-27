export const renderHelp = (content, app) => {
    // Haetaan käyttäjän tiedot viestimallia varten
    const mkCode = app.shortId || "MK-KOODI";
    const nick = app.savedNickname || "Nimimerkki";

    content.innerHTML = `
    <div class="card">
        <div class="view-header" style="margin-bottom:20px;">
            <h1>Ohjeet & Tuki</h1>
            <button class="btn btn-sm" onclick="app.router('home')">⬅ Etusivulle</button>
        </div>

        <div class="panel panel-success" style="margin-bottom:30px;">
            <h3 style="margin-top:0; color:var(--c-green);">🚀 Uutta versiossa 2.15.7</h3>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>27.9.2026:</strong> D/T-ruudukkoon <b>rivi- ja sarakekohtaiset yhteensä-summat</b> + kokonaismäärä oikeaan alakulmaan (kuten geocache.fi-taulukoissa).</li>
            </ul>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>27.9.2026:</strong> <b>🔍 Löytöhaut</b> — uusi näkymä Tilastot-osiossa. Kyselyjä GPX-tuotuun löytödataan: <b>Kalenteripäivähaku</b> (mitä löysit tiettynä päivänä kaikkina vuosina + puuttuvat tyypit + D/T-kattavuus), <b>Kuukauden D/T-taulukko</b>, <b>Viikonpäivän D/T-taulukko</b> ja <b>Attribuuttihaku</b>. Kaikissa näytetään klassinen 9×9 D/T-ruudukko ja/tai löytölista. Rakenne on tehty laajennettavaksi — uusia hakuja on helppo lisätä toiveiden mukaan.</li>
                <li><strong>27.9.2026:</strong> <b>Osumattomien käsin merkintä:</b> jos GPX-kätkö ei osu kuntapolygoniin (esim. rajalla tai merellä oleva), sen voi nyt merkitä oikeaan kuntaan tuontiraportin listasta tai myöhemmin 🌐 Muut maat -näkymästä. Merkintä tallentuu pysyvästi — seuraavat tuonnit käyttävät sitä automaattisesti.</li>
            </ul>

            <details style="margin-top:15px; margin-bottom:0;">
                <summary style="font-size:0.9em;">Näytä aiempi historia</summary>
                <div style="padding:0 14px 14px; font-size:0.9em; color:var(--subtext-color);">
                    <strong>v2.15.6</strong><br>
                    - 27.9.2026: Attribuutit virallisilla englanninkielisillä nimillä + negatiiviset valittavissa; D/T-ruudukon monityyppiväripalkit.<br><br>
                    <strong>v2.15.5</strong><br>
                    - 27.9.2026: Löytöhaut: maasuuodatin kaikkiin hakuihin.<br><br>
                    <strong>v2.15.4</strong><br>
                    - 27.9.2026: Kalenteripäivähakuun päiväväli (alkaa–asti) + vuosirajaus.<br><br>
                    <strong>v2.15.3</strong><br>
                    - 27.9.2026: Löytöhaut: kätkötyyppi- ja attribuuttisuodattimet, D/T-ruudukon tyyppivärit + legenda, Koko D/T-matriisi -haku.<br><br>
                    <strong>v2.15.2</strong><br>
                    - 27.9.2026: Löytöhaut avautuu etusivulta; Kuvageneraattoriin Geocache.fi-tunnus.<br><br>
                    <strong>v2.15.1</strong><br>
                    - 27.9.2026: Korjaus Löytöhauille: findsdata kirjataan nyt kaikista löydöistä (ei vain uusista), joten keskeytyneen tuonnin jälkeen uudelleenajo täydentää puuttuvat löydöt.<br><br>
                    <strong>v2.15.0</strong><br>
                    - 27.9.2026: Löytöhaut-näkymä Tilastoissa (kalenteripäivähaku, kuukausi-/viikonpäivä-D/T, attribuuttihaku) + osumattomien käsin merkintä kuntaan pysyvästi.<br><br>
                    <strong>v2.14.2</strong><br>
                    - 27.9.2026: Ahvenanmaan GPX-löydöt reititetään nyt Suomen kuntatilastoihin; tuontiraportti listaa tasan mitkä kätköt jäivät kuntarajojen ulkopuolelle.<br><br>
                    <strong>v2.14.1</strong><br>
                    - 27.9.2026: GPX-tuonnin korjauksia: Mega-Event/Giga-Event -tyyppivaihtoehdot lisätty; tuontiraportti näyttää maiden kokonaislukumäärät eikä vain uusia.<br><br>
                    <strong>v2.14.0</strong><br>
                    - 27.9.2026: GPX-tuonti Suomen tilastoihin ja kaikkiin maihin kerralla (zip tai gpx, toimii puhelimella). Tallentaa per löytö: tyyppi, oma löytöpäivä (omasta "Found it"-lokista), D/T ja attribuutit — vuosittain tallennettuna, skaalautuu yli 20 000 löytöön. Uusi "Muut maat" -näkymä Tilastoissa.<br><br>
                    <strong>v2.13.3</strong><br>
                    - 27.9.2026: Kuvageneraattori tiivistetty mobiilikäyttöön: pienemmät välit ja kenttien otsikot, vähemmän selaamista ennen "Luo kuva" -painiketta. Pikapohjat ja suosikkihaut olivat käytännössä samaa listaa, joten ne yhdistettiin yhdeksi "Pikapohjat"-toiminnoksi. Versiotiedot yhdistetty yhdeksi riviksi yläosaan.<br><br>
                    <strong>v2.13.2</strong><br>
                    - 27.9.2026: Mobiilikäytettävyyttä parannettu: karttojen korkeus mukautuu nyt selaimen osoitepalkin liikkeisiin (ei enää hyppimistä), pienet painikkeet ovat suurempia kosketuskohteita, pitkät tekstit mahtuvat etusivun nappeihin, admin-välilehdet murtuvat tarvittaessa ja sivua voi zoomata sormin.<br><br>
                    <strong>v2.13.1</strong><br>
                    - 27.9.2026: Ylläpitäjän uusi esikatselu: Admin → Käyttäjät -listalla jokaisella käyttäjällä on nyt <b>👁 Näytä</b> -painike, jolla voit katsoa sovellusta kyseisen käyttäjän oikeuksilla (free/premium, Reissuapuri, admin-näkyvyys). Esikatselun aikana näytön alareunassa näkyy keltainen palkki, josta esikatselun voi lopettaa.<br>
                    - 27.9.2026: Korjattu tilastovalikon Kuntakartat-painikkeen rikkinäinen kuvake. Painike nimettiin uudelleen <b>🌍 Ulkomaiden kuntakartat</b> -nimiseksi ja se siirrettiin pois etusivulta — ulkomaan kuntakartat avautuvat nyt Tilastot-osion kautta. Suomen kunnat löytyvät edelleen Triplettijahti- ja Maakunnat &amp; Löydöt -osioista. Maiden liput näkyvät nyt myös tietokoneella (Windows ei näytä lippu-emojeja, joten liput on piirretty kuvina).<br><br>
                    <strong>v2.13.0</strong><br>
                    - 27.9.2026: Uudistettu ulkoasu koko sovellukseen: yhtenäinen ja selkeämpi design, etusivun ikoniruudukko, siistitty navigaatio (aktiivinen sivu korostuu valikossa), uusittu kirjautumissivu ja Premium-hinnasto sekä yhtenäiset yläpalkit tilastoissa, asetuksissa, ylläpidossa, linkkikirjastossa ja karttanäkymissä. Toiminnot pysyvät ennallaan.<br><br>
                    <strong>v2.12.2</strong><br>
                    - 5.9.2026: Paikannuksen zoom-tasot päivitetty vastaamaan vertailupalvelua: ≤40 km/h → 18, 40–70 km/h → 17, 70–100 km/h → 16, yli 100 km/h → 14.<br><br>
                    <strong>v2.12.1</strong><br>
                    - 5.9.2026: Paikannuksen zoom-tasoja säädetty lähemmäs erityisesti alle 60 km/h nopeuksissa, jotta kartta näyttää tarkemmin.<br><br>
                    <strong>v2.12.0</strong><br>
                    - 3.9.2026: Kuntakarttojen paikannus seuraa sijaintiasi automaattisesti kun liikut. Kartta zoomaa nopeuden mukaan: lähellä paikallaan ollessa ja laajemmin esimerkiksi 100 km/h nopeudessa. Jos zoomaat tai panoroit karttaa käsin, automaattinen seuranta keskeytyy 10 sekunniksi, jotta voit tutkilla rajoja vapaasti. Sammutettaessa paikannus viimeisin sijainti jää kartalle punaiseksi palloksi. Paikannus myös pitää näytön päällä Androidilla, iPhone/iPadillä ja muilla mobiililaitteilla, joissa selain tukee Wake Lock -rajapintaa.<br>
                    - 3.9.2026: GPX-tuonti Viron kuntakartalle osaa nyt löytää saarilta olevat kätköt lähimmän kunnan kaaren perusteella ja ilmoittaa tarkemmin, mitkä kätköt jäävät kuntarajojen ulkopuolelle.<br><br>
                    <strong>v2.11.0</strong><br>
                    - 2.9.2026: Uusi Kuntakartat-sivu, jolta avautuvat Ruotsin, Norjan ja Viron kuntakartat. Jokaiselle maalle voi merkitä löydetyt kunnat, paikantaa itsensä ja tuoda löydöt GPX-tiedostosta.<br>
                    - 2.9.2026: GPX-tuonti tunnistaa kätkötyypit kaikilla kuntakartoilla, joten näet mitä eri tyyppejä kussakin kunnassa on jo löydetty ja mitkä puuttuvat.<br><br>
                    <strong>v2.10.0</strong><br>
                    - 2.9.2026: Lisätty interaktiivinen Ruotsi-kuntakartta, jossa voi merkitä löydetyt kunnat, paikantaa itsensä ja tuoda löydöt GPX-tiedostosta.<br>
                    - 2.9.2026: GPX-tuonti tunnistaa kätkötyypit kunnittain; popup näyttää löydetyt ja puuttuvat tyypit.<br><br>
                    <strong>v2.9.1</strong><br>
                    - 10.7.2026: Karttapohja vaihdettu selkeämpään Voyager-pohjaan, jossa tiet ja paikannimet näkyvät paremmin reissujen suunnittelua varten.<br>
                    - 10.7.2026: Löytökarttaan ja Löydöt maakunnittain -listaan lisätty kaikkien kätkötyyppien puutefiltterit sekä vaihtoehdot “puuttuu vähintään yksi” ja “puuttuvat kaikki valitut”.<br>
                    - 10.7.2026: Mobiilissa kartan kätkötyyppifiltterit on tiivistetty avattavaan paneeliin, jotta kartalle jää enemmän tilaa.<br>
                    - 10.7.2026: Kuvageneraattorin pikapohjat muutettu käyttäjän omiksi tallennettaviksi ja hallittaviksi pohjiksi; valmiita oletuspohjia ei enää ole pakko käyttää.<br>
                    - 10.7.2026: Kuvageneraattorin suosikki- ja viimeksi käytettyjen hakujen käsittelyä parannettu: duplikaatit poistuvat, viimeksi käytetty nousee ylimmäksi ja listan voi tyhjentää.<br><br>
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

        <hr>

        <h3>⚙️ 2. Asetukset & Datan tuonti</h3>
        
        <h4>Perustiedot <span class="badge badge-free">FREE</span></h4>
        <p>Asetukset-sivulla hallinnoit profiiliasi. Tärkeimmät kohdat:</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li><strong>Geocache.fi ID:</strong> Pakollinen, jotta linkit (esim. profiiliin tai kuntakarttaan) ohjautuvat oikein. Löydät tämän Geocache.fi-profiilisi osoiteriviltä (id=...).</li>
            <li><strong>Kaverilista:</strong> Tallenna kavereiden nimimerkkejä, jotta voit generoida heille kuvia nopeasti.</li>
        </ul>

        <h4>Omien löytöjen tuonti <span class="badge badge-premium">PREMIUM</span></h4>
        <p>Jotta kartat toimivat, sovelluksen täytyy tietää löytösi. Datan tuonti tapahtuu <strong>Asetukset</strong>-sivun alalaidasta:</p>
        
        <div class="panel panel-success" style="margin-bottom:10px;">
            <strong>Vaihtoehto A: GPX-tuonti (suositeltu, toimii puhelimella):</strong>
            <ol style="margin-left:15px; padding-left:0; line-height:1.6;">
                <li>Lataa geocaching.com:sta <strong>My Finds</strong> -kysely tai Pocket Query (zip tai .gpx).</li>
                <li>Palaa MK Porttaaliin → <strong>Asetukset</strong> → <strong>📁 Valitse GPX/ZIP-tiedosto</strong>.</li>
                <li>Tuonti päivittää kerralla: Suomen kuntatilastot + Ruotsin, Norjan ja Viron kuntakartat + "Muut maat" -yhteenvedon.</li>
            </ol>
        </div>
        <div class="panel panel-accent">
            <strong>Vaihtoehto B: Geocache.fi-taulukko (vain Suomi, helpoin tietokoneella):</strong>
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

        <hr>

        <h3>🗺️ 3. Kartat & Tilastot <span class="badge badge-premium">PREMIUM</span></h3>
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
        <p><strong>Paikannus:</strong> Paina 📍-nappia. Kartta seuraa sijaintiasi automaattisesti ja zoomaa nopeuden mukaan. Paikannus pitää näytön päällä mobiililaitteilla.</p>
        <p><strong>Kätkötyyppifiltterit:</strong> Kartan ja tekstimuotoisen kuntalistan suodattimesta voit valita minkä tahansa tuetun kätkötyypin. Näkymiin jäävät tällöin vain kunnat, joista valittu tyyppi puuttuu. Usean tyypin kohdalla voit valita joko <em>Puuttuu vähintään yksi</em> tai <em>Puuttuvat kaikki valitut</em>. Maakunnat, joihin ei jää yhtään sopivaa kuntaa, piilotetaan automaattisesti.</p>
        <p><strong>Mobiilissa:</strong> Suodattimet ovat avattavan <em>Suodattimet</em>-painikkeen takana, jotta kartalle ja listalle jää enemmän näkyvää tilaa. Kannettavalla kaikki suodattimet näkyvät suoraan.</p>

        <h4>Ulkomaiden kuntakartat (Ruotsi, Norja, Viro)</h4>
        <p>Tilastot-sivun <strong>🌍 Ulkomaiden kuntakartat</strong> -valinnasta avautuu maa-valitsin. Valitse maa ja merkitse löydetyt kunnat.</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li><strong>Kunnan merkitseminen:</strong> Klikkaa kuntaa kartalta. Jos kuntaan ei ole tuotu GPX-löytöjä, voit vaihtaa sen löydetyksi / etsittäväksi nappia painamalla.</li>
            <li><strong>Paikannus:</strong> Paina 📍-nappia. Sovellus seuraa sijaintiasi automaattisesti, kun liikut kartalla. Kartta zoomaa nopeuden mukaan: lähellä paikallaan ollessa ja laajemmin nopeammassa liikkeessä (esim. 100 km/h). Jos zoomaat tai panoroit karttaa käsin, automaattinen seuranta keskeytyy 10 sekunniksi, jotta voit tutkia kuntarajoja vapaasti. Sammutettaessa paikannus viimeisin sijainti jää kartalle punaiseksi palloksi. Paikannus pitää lisäksi näytön päällä mobiililaitteilla, jotta ruutu ei mene pimeäksi kesken ajon. Klikkaamalla kuntaa voit edelleen merkitä sen löydetyksi.</li>
            <li><strong>GPX-tuonti:</strong> Paina 📁-nappia ja valitse löydettyjä kätköjä sisältävä GPX-tiedosto. Sovellus laskee koordinaateista kunnan, merkitsee sen löydetyksi ja jakaa kätkötyypit kunnittain. Samat kätköt eivät tuplaannu, vaikka tuot saman tiedoston uudelleen. Kätköt, jotka osuvat valitun maan kuntarajojen ulkopuolelle, ilmoitetaan erikseen.</li>
            <li><strong>Popup-tiedot:</strong> Klikkaamalla kuntaa näet löydetyt kätkötyypit (kuvakkeet ja lukumäärät) ja puuttuvat tyypit. Jos kunnan löydöt on tuotu GPX:stä, “Poista löytö” -nappia ei näy; voit tyhjentää koko maan kartalta 🗑️-painikkeella.</li>
            <li><strong>Tyhjennys:</strong> 🗑️-nappi poistaa kaikki valitun maan kuntakartan merkinnät.</li>
        </ul>

        <hr>

        <h3>🧭 Reissuapuri <span class="badge badge-extra">EXTRA</span></h3>
        <p>Reissuapuri on matkakohtainen työkalu reissukuntien, löydettyjen kätköjen ja reissulistojen hallintaan kartalla. Se on erillinen lisäominaisuus, jonka ylläpito voi halutessaan kytkeä käyttöön käyttäjäkohtaisesti.</p>

        <hr>

        <h3>🖼️ 4. Kuvageneraattori <span class="badge badge-free">FREE</span></h3>
        <p>Luo visuaalisia tilastoja jaettavaksi somessa tai profiilisivulla. Generaattori hakee kuvat suoraan Geocache.fi:n rajapinnasta.</p>
        <ul>
            <li><strong>Matriisi:</strong> D/T-taulukko väritettynä.</li>
            <li><strong>Kuntakartta:</strong> Koko Suomi tai tarkka maakuntarjaus.</li>
            <li><strong>Vuosikalenteri:</strong> Löydöt kalenterimuodossa.</li>
            <li><strong>Jasmer:</strong> Kätköjen piilotuskuukaudet.</li>
            <li><strong>Saarilöydöt:</strong> Saarilöytöjen tilastokuva.</li>
        </ul>
        <p><strong>Pikapohjat:</strong> Määritä itse pohjan asetukset generaattorissa ja paina <em>Tallenna nykyinen pikapohjaksi</em>. Anna pohjalle nimi. Omia pikapohjia voi käyttää, nimetä uudelleen, päivittää, järjestää ja poistaa suosikkihakujen hallinnassa.</p>
        <p><strong>Suosikkihaut:</strong> Tallenna usein käyttämäsi haku suosikiksi ja hallitse niitä <em>Suosikkihaut</em>-valikosta. Voit käyttää, nimetä uudelleen, päivittää, järjestää ja poistaa suosikkeja.</p>
        <p><strong>Viimeksi käytetyt:</strong> Generaattori muistaa enintään kahdeksan viimeisintä hakua käyttäjäkohtaisesti. Sama haku ei synny listalle duplikaattina, vaan sen käyttöaika päivittyy. Listan voi tyhjentää <em>Tyhjennä</em>-painikkeella.</p>

        <hr>

        <h3>🧮 5. Muuntimet & Työkalut <span class="badge badge-premium">PREMIUM</span></h3>
        <p>Sisältää <strong>yli 20 erilaista työkalua</strong> ja satoja yksiköitä mysteerien ratkointiin ja kenttätyöskentelyyn. Työkalut toimivat myös offline-tilassa.</p>
        
        <ul style="line-height:1.6; padding-left:20px;">
            <li><strong>Koordinaattimuuntimet:</strong> Muunna WGS84, EUREF-FIN ja YKJ -koordinaattien välillä.</li>
            <li><strong>Tekstityökalut:</strong> ROT13, Käänteinen teksti, Sanalaskuri.</li>
            <li><strong>Numerot:</strong> Roomalaiset numerot, Lukujärjestelmämuuntimet (BIN, HEX, OCT).</li>
            <li><strong>Mittayksiköt:</strong> Pituus, Pinta-ala, Tilavuus, Lämpötila.</li>
            <li><strong>Sähkö & Fysiikka:</strong> Ohmin laki, Teho, Energia.</li>
        </ul>

        <hr>

        <h3>🌐 6. Linkkikirjasto</h3>
        <p>Linkkikirjastosta löydät kootusti tärkeimmät ulkoiset palvelut:</p>
        <ul>
            <li><strong>Geocache.fi & Geocaching.com:</strong> Suorat linkit pääsivustoille.</li>
            <li><strong>Project-GC:</strong> Tilastot ja haasteet.</li>
            <li><strong>Checkerit & Ratkojat:</strong> Geocheck, Jigidi-ratkojat ja muut apuvälineet.</li>
        </ul>

        <hr>

        <h3>⚠️ Vastuuvapaus & Käyttöehdot</h3>
        <p>MK Porttaali on harrasteprojekti ja tarjotaan sellaisena kuin se on. Toimivuutta ei taata, ja palvelu voi muuttua, olla tilapäisesti pois käytöstä tai päättyä kokonaan ilman ennakkoilmoitusta.</p>
        <ul style="line-height:1.6; padding-left:20px;">
            <li>En vastaa palvelun keskeytyksistä, virheistä tai tietojen puutteista.</li>
            <li>Premium-tilaukset ovat vapaaehtoinen tuki projektille, eikä maksuja palauteta.</li>
        </ul>

        <hr>

        <h3>💎 Premium-tilaus</h3>
        <p>MK Porttaalin kehitys ja ylläpito vaatii resursseja. Premium-tilauksella tuet palvelua ja saat käyttöösi kaikki tehotyökalut.</p>
        
        <div class="panel panel-warn">
            <h4 style="margin-top:0; color:var(--c-peach);">Hinnasto</h4>
            <ul style="list-style:none; padding:0; margin:0; line-height:1.8;">
                <li>• <strong>Testi (1 vko):</strong> 1 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1VK)</span></li>
                <li>• <strong>Jakso (1 kk):</strong> 2 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1KK)</span></li>
                <li>• <strong>Jakso (3 kk):</strong> 3 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-3KK)</span></li>
                <li>• <strong>Kausi (6 kk):</strong> 5 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-6KK)</span></li>
                <li>• <strong>Vuosi (12 kk):</strong> 10 € <span style="opacity:0.6; font-size:0.9em;">(Koodi: T-1V)</span></li>
            </ul>
        </div>

        <div class="panel" style="background:var(--bg-mantle);">
            <strong style="color:var(--c-peach);">Kuinka tilaan?</strong>
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
