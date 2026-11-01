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
            <h3 style="margin-top:0; color:var(--c-green);">🚀 Uutta versiossa 2.18.52</h3>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>LAB-löydöt tilastoissa yhtenäisesti</b>: löytölistoissa näkyvät 🧪-merkillä ja nimellä (ei enää rikkinäistä LAB-linkkiä), D/T-keskiarvo jättää ne pois (ei D/T-arvoja), Eka &amp; vika -ryhmittelyssä ne muodostavat oman "LAB"-ryhmän, D/T-matriisit ohittavat ne jo aiemmin. Päivämääräpohjaisiin tilastoihin (Päivälöydöt, kalenterit, putket) ne lasketaan normaalisti.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.51</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Vuodet × tyypit: Lab-sarake</b> — LAB-löydöt näkyvät nyt omassa sarakkeessaan violettina (kuten geocache.fi:n tilastossa). Vuoden summa on edelleen kokonaislukumäärä labeineen — nyt näkyy myös eriteltynä.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.50</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Löytöpäivien aikavyöhykevalinta</b>: GPX-tuonnin asetuksiin "Suomen aika" -vaihtoehto — löytöpäivät lasketaan Europe/Helsinki-ajalla PT:n sijaan. <b>Vaatii GPX-uudelleentuonnin.</b></li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.44–2.18.49</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> LAB:t jätettiin pois "tuntemattomat tyypit" -varoituksesta; Päivälöydöt-listaan (josta LAB: N)-erittely + lab-nimet; LAB-tuonti raportoi tunnistamattomat rivit ääneen; otsikkoon LAB-erittely ja varoitus jos kytkin päällä mutta data puuttuu; <b>korjaus: labit ohittavat tyyppi- ja maasuodattimet</b> (karsiutuivat aiemmin joka haussa vaikka ☑ oli päällä).</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.43</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>LAB-tuonti: samannimisten päätösmodaali</b> — kun tuonnissa on samana päivänä samannimisiä labeja, avautuu erillinen näkymä jossa jokaisen ryhmän kohdalla voi valita "Pidä 1, poista N" tai "Poista kaikki". Varoitustekstistä pääsee avaamaan näkymän myös jälkikäteen.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.42</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>LAB-tuonti: samannimiset sallitaan</b> — samalla päivällä useammat samannimiset labit tallentuvat kaikki (eri kätköjä). Duplikaattisuoja estää edelleen saman tiedoston uudelleenliittämisen. Tuonnin lopussa näytetään huomautus samannimisistä — käyttäjä päättää poistaako ylimääräiset 📋-listasta.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.41</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>LAB-löytöjen tuonti</b>: Adventure Lab -löydöt eivät tule My Finds -GPX:ssä — nyt ne voi liittää copy/pastena Asetuksiin (geocache.fi / Project-GC -lista, muoto "2019-09-27 Kätkön nimi"). Tallennetut löydöt näkyvät hallittavana listana (per-päivä-ryhmitelty, yksittäinen ✕-poisto + "poista kaikki"). Löytöhaut-sivun <b>☑ Sisällytä LAB-löydöt</b> -kytkin laskee ne mukaan tilastoihin: Päivälöydöt, vuosikalenterit, D/T-jakaumat jne. — määrä näkyy löytöjen kokonaismäärässä. Kytkin muistetaan laitteella.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.40</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Päivälöydöt mobiilisti tiiviiksi</b>: rivit renderöidään nyt inline-tyyleillä (vanha välimuistitettu CSS ei enää ylikirjoita niitä) — jokainen rivi on yksi kompakti vaakarivi: määrä | päiväluku+% | ensimmäinen pvm. Ei enää isoja laatikoita eikä pitkää vieritystä.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.39</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Päivälöydöt: järjestyskytkin</b> — tuloslistan yläreunassa on nyt "▲ pienin ensin" / "▼ suurin ensin" -nappi joka kääntää listan järjestyksen lennosta ilman uutta hakua.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.38</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Päivälöydöt: puuttuvat määrät näkyvät</b> — geocache.fi:n tapaan listassa näkyy nyt ohut "⋮ — 30 puuttuu" -välirivi kun jokin päiväkohtainen löytömäärä loikkaa (esim. 31 löytöä → 29 löytöä muttei koskaan 30). Himmennysteksti, ei vie tilaa.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.37</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Päivälöydöt-näkymä tiivistetty</b>: rivit eivät enää peri yleistä korttitilaustyyliä — ne ovat nyt tiiviitä taulukkorivejä (ei isoja laatikoita), joten pitkä lista vierittyy kevyesti mobiilissakin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.36</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Vuodet × tyypit -haku</b>: löytömäärät vuosittain ja kätkötyypeittäin prosentteineen — geocache.fi:n "Löytömäärät vuosittain ja tyypeittäin" -tilaston vastaava. Vuosikohtaiset ja tyyppikohtaiset yhteenvedot + kokonais-%:t, värikoodatut tyyppipäättööt. Tukee suodattimia, taulukko vierittyy vaakasuunnassa mobiilissa.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.35</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Päivälöydöt-haku</b>: geocache.fi:n päivälöytötilasto parannettuna — jokainen löytömäärärivi (1 löytö, 2 löytöä…) on <b>klikattava</b> ja paljastaa tarkat päivät viikonpäivineen. .fi:ssä näkyy vain ensimmäinen päivä per määrä — täällä kaikki. Tukee kaikkia suodattimia.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.34</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Piilottaja-tieto korjattu</b>: käytetään nyt GPX:n <code>&lt;owner&gt;</code>-kenttää (todellinen omistajatili, yksi tunnus per kätkö) eikä <code>&lt;placed_by&gt;</code>-tekstiä joka voi sisältää useita nimiä ("eukka, missävallu"). Piilottaja-haut tarkentuvat — <b>vaatii GPX-uudelleentuonnin</b> jotta arvot päivittyvät.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.33</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Kuusi uutta löytöhakua</b>: <b>Eka &amp; vika</b> (ensimmäinen/viimeisin löytö per kunta, maakunta tai vuosi), <b>Pisin putki</b> (peräkkäiset löytöpäivät + pisin löytötako), <b>Attribuuttijakso</b> (attribuuttien esiintymismäärät top-listana), <b>D/T-keskiarvo</b> (keskiarvot ryhmittäin: vuosi/kunta/maakunta/tyyppi), <b>Vuosivertailu</b> (kuukausimäärät eri vuosina rinnakkain) ja <b>Maat × kuukaudet</b> (missä maissa löydöt jakautuvat kuukausille). Kaikki tukevat yhteisiä suodattimia (tyypit, attribuutit, paikka, aika, piilottaja) ja ovat mobiiliystävällisiä vieritettävine taulukkoineen.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.32</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Löytöhaut-käytettävyysparannukset</b>: ⚠️-varoituslaatikko näkyy vain kun korjattavia kunta-määrityksiä on (ei enää turhaa tilankulutusta). Sovellus muistaa viimeksi käytetyn haun — avautuu aina samaan hakuun kuin jäitkään. <b>⭐ Pikapohjat</b>: tallenna nykyinen haku + kaikki suodattimet nimetyksi pohjaksi ja palauta ne yhdellä klikkauksella (sama konsepti kuin Kuvageneraattorin pikapohjat). <b>⚙️ Kuntapoimija</b>: Paikkakunta-kentissä uusi valitsin — valitse maakunta → ruksi kunnat → "Lisää valitut", ei enää käsin kirjoitettavaa. Mobiiliystävällinen modaali.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.31</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Firestore-indeksivapautus</b>: isot löytödokumentit (findsdata/vuosi ym.) ylittivät 40 000 indeksientryn rajan ja tuonti kaatui virheeseen "too many index entries". Repossa on nyt <code>firestore.indexes.json</code> joka vapauttaa suuret löytömapit indeksoinnista — <b>vaatii kertaluonteisen aktivoinnin Firebase Consolessa tai <code>firebase deploy --only firestore:indexes</code></b>. Samalla estää saman rajan ylittymisen tulevaisuudessa myös kunta/maa-karttojen datassa.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.30</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Piilottaja-suodatin</b>: GPX:n placed_by-tieto (kätkön piilottaja) tallennetaan nyt löytödataan ja sitä voi käyttää suodattimena melkein kaikissa löytöhaussa — Paikkakunta, Maakunta, Kuntakartta, Monihaku, D/T- ja attribuuttihaut jne. Kentässä on datalist-ehdotukset (esim. "Miittiakat"). <b>Vaatii GPX-uudelleentuonnin</b> — vanhoissa merkinnöissä ei ole piilottajaa.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.29</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Kuntakartan maa-klikkaukset + zoomaus</b>: maatason löydetyt maat (Latvia, Kreikka, Islanti…) reagoivat klikkaukseen samoin kuin kunnat — löytölista aukeaa kartan alle. Kartta zoomaa nyt myös maatason löydettyihin kohteisiin, ei vain kuntiin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.28</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>1.11.2026:</strong> <b>Kuntakartan löytölista</b>: kunnan tai maan klikkaus kartalla näyttää sen löydöt suoraan kartan alla sortattavana taulukkona (Piteå → 68 mysseä listattuna). Tyhjennä-nappi sulkee listan.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.27</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Kuntakartan korjaukset</b>: kuntien klikkaus toimii nyt (maailmankarttakerros söi klikkaukset — siirretty alimmaiseksi ja osumattomat maat eivät enää jää bittiin). Värit vahvennettu vaalealle OSM-pohjalle — löydetyt kunnat erottuvat selvästi.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.26</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Kuntakartta laajennettu</b>: samalle kartalle tulevat nyt myös Ruotsin, Norjan ja Viron kunnat (omat kuntarajat) sekä muut maat maatasona — uusi Maat-suodatin valitsee mitä näytetään. <b>Karttapohjat korjattu</b>: CARTO-ruudut alkoivat vaatia API-avainta (vesileimat) → kaikki sovelluksen kartat siirretty OpenStreetMap-ruutuihin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.25</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Uusi haku: Kuntakartta</b> — löytöhaut-sivulle tuli interaktiivinen Suomen kuntakartta joka värjää vain ne kunnat joissa on suodatusta vastaavia löytöjä. Suodattimina kätkötyypit (esim. pelkät letterit), useampi attribuutti kerrallaan (AND), paikkakunta, maakunta ja aikarajaus. Napauta kuntaa → näet lukumäärät tyypeittäin. Mukana myös kuntalistaus ja löytölista.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.24</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Kunta-määritysten jatkokorjaus</b>: Muut maat -näkymässä avoinna ollut maa/maakunta-rivi ja sen "merkitse käsin" -valikko avautuvat automaattisesti uudelleen määrityksen jälkeen — monta korjausta peräkkäin ilman että valikkoa tarvitse avata joka välissä. Sama pätee määrityslistan muokkauksiin, poistoihin ja lisäyksiin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.23</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>geocache.fi-linkit korjauslistoihin</b>: pitkänmatkan-multien, osumattomien ja käsin määritysten GC-koodit ovat nyt linkkejä geocache.fi:n kätkösivulle — sieltä näet suoraan .fi:n kunta-määrityksen (esim. "Lappeenranta (Etelä-Karjala)") ja voit valita saman kunnan pudotusvalikosta.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.22</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Pitkänmatkan-multien tunnistus</b>: GPX:n maakuntatieto (state) säilyy julkaisumaakuntana — jos se eroaa koordinaattien kunnasta, kyseessä on valekoordinaatti ja löytö merkitään maakuntatasolle korjattavaksi (ei enää vääriä kuntaosumia). Tuontiraportti listaa ne korjausvalikoineen. Löytöhaut-sivulla uusi näkyvä huomautus rajoituksesta, ja Muut maat -näkymän kunta-määrityksiin lisätty "Lisää GC-koodi" -toiminto jolla minkä tahansa löydön voi siirtää oikeaan kuntaan pysyvästi.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.21</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Käsin määrityt kunnat -hallinta</b>: Muut maat -näkymän alalaitaan uusi osio joka listaa kaikki tekemäsi kunta-määritykset (esim. pitkänmatkan-multit). Voit korjata väärän valinnan pudotusvalikosta tai poistaa määrityksen — muutokset ovat pysyviä ja jokainen GPX-tuonti noudattaa niitä automaattisesti.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.20</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Muut maat -kaatuminen korjattu</b>: "Data päivitetty" -aikaleiman laskenta kaatoi näkymän (null.toMillis-bugi versiosta 2.18.12 asti). Näkymä toimii nyt — mukaan lukien Ahvenanmaa-rivi jossa voi myös merkitä pitkänmatkan-multien oikeat kunnat.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.19</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Muut maat -näkymän virheensieto</b>: näkymä ei enää kaadu null-maakirjauksiin tai puuttuviin aikaleimoihin — ja virhetilanteessa näytetään nyt oikea virhesanoma (aiemmin vain yleinen "Lataus epäonnistui").</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.18</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Åland-valekoordinaattikorjaus</b>: Åland-maaksi merkityt kätköt joiden koordinaatit ovat mantereella (myssyn/multin julkaisupiste) eivät enää mene väärään mannerkuntaan — ne merkitään maakuntatasolle (Maakuntahaku → Ahvenanmaa näyttää ne). Toteutuksessa korjaantuu myös mannerkuntien löytömäärät. Vaatii GPX-uudelleentuonnin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.17</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Kuntakattavuus diagnostiikka</b> — "tunnistamattomat sijainnit" listaa nyt ryhmiteltynä maittain KAIKEN sijaintiarvon joka ei ole tunnettu kunta (FI/SE/NO/EE). Aiemmin Åland/legacy-arvot jäivät näkymättä koska niiden maaksi oli kirjattu Ahvenanmaa, ei Suomi.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.16</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Kuntakattavuus-haku</b> — uusi löytöhaku: kaikki 308 kuntaa maakunnittain chippeinä (vihreä = löydetty lukumärineen), ja "tunnistamattomat sijainnit" -lista joka paljastaa nimivariaatiot ja vanhat tuonnit. <b>Nimikorjaukset</b>: Pedersören kunta → Pedersöre ja Mariehamn → Maarianhamina nyt kunta/mappauksissa tuonnissa, löytökartassa ja löytöhaussa.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.15</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Maakuntahaun tarkennus</b>: maakunnan valinta rajaa Paikkakunta-kentän ehdotukset ko. maakunnan kuntiin, kenttä tukee <b>useita kuntia pilkulla</b> ("Lahti, Hollola") kuten kuvageneraattorissa — sama moni-kunta-logiikka toimii kaikissa hauissa. <b>Ahvenanmaa-korjaus</b>: maakuntahaku tunnistaa nyt myös vanhan tuonnin sijainnit ("Aland Islands", "Åland") ja ruotsinkieliset rinnakkaisnimet (Mariehamn → Maarianhamina); löydöt ilman kuntaa listataan erikseen huomautuksena. Paikkakunta-kenttä sai teeman mukaisen tummaa muotoilua.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.14</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Maakuntahaku</b> — uusi kysely Löytöhauissa: valitse maakunta ja näet kuntakattavuuden (esim. Päijät-Häme 8/10 kuntaa löydettynä), löydöt, tyypit, D/T-ruudukon ja vuosikalenterin. <b>Maakunta-suodatin</b> lisätty kaikkiin hajoihin (kuten geocache.fi:n mkunta-parametri). Aikarajaukseen lisättiin <b>"Tietty kuukausi"</b> -vaihtoehto (vuosi + kuukausi, kuten kuvageneraattorin year/month). Maakuntahakuun voi lisäksi rajata yksittäiseen kuntaan ja aikaväliin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.13</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>Hakujen aikarajaus</b> (geocache.fi-malli): "Kaikki ajat / Tietty vuosi / Vapaa aikaväli" (pvm-kentät) nyt saatavilla Paikkakuntahaussa, Monihaussa, kuukausi-/viikonpäivä-D/T-haussa, attribuuttihaussa ja koko D/T-matriisissa. <b>Paikkakuntasuodatin</b> lisätty Monihakuun ja kaikkiin muihin hajoihin — esim. "mitä löysin Lahdesta juhannuksena". Monihakun erilliset vuosi-alkaen/asti -kentät korvautuivat yhtenäisellä aikarajauksella.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.12</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>31.10.2026:</strong> <b>"Data päivitetty" -aikaleima</b> näkyy nyt myös Löytöhaut- ja Muut maat -näkymissä (kuten Löydöt maakunnittain -näkymässä). Löytötaulukoiden päivämäärät suomalaiseen muotoon <b>pp.kk.vvvv</b> — ja Pvm-sarakkeen sorttaus korjattu (saman vuoden päivät järjestyivät aiemmin virheellisesti).</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.11</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>29.9.2026:</strong> <b>Karttapopupit teemaan</b>: karttojen infokuplat ovat nyt tumman teeman mukaiset (myös Reissuapurissa). <b>Mobiilivalikko sulkeutuu</b> nyt myös valikon ulkopuolelle klikatessa ja ESC-näppäimellä. <b>Ei enää tarttuvaa hover-tilaa</b> kosketuslaitteilla — napautettu nappi ei jää "osoitetun" näköiseksi. <b>Reissuapuri</b>: disabloidut napit näkyvät nyt selkeästi, pienet ikoninapit ja checkboxit suurennettu kosketuskohteiksi, safe-area ja modaalin vieritysrajat kuntoon. <b>Lataus- ja tyhjätilat yhtenäistetty</b>: spinneri näkyy kaikissa näkymissä ja "ei löytynyt" -tekstit saivat visuaalisen ilmeen. Löytötaulukoiden otsakkeet toimivat nyt myös näppäimistöllä (Enter/välilyönti). Jakometatiedot (Open Graph) lisätty linkkien esikatseluun.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.10</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>29.9.2026:</strong> <b>Vuosikalenteri täydennetty</b>: uusi <b>vrk</b>-sarake kuukausiriveillä (montako päivää täynnä — vihreä kun koko kuukausi täynnä) ja <b>vrk</b>-rivi alalaidassa (monessako kuukaudessa päivänumero on täynnä — vihreä kun kaikki mahdolliset). Kalenterin alle yhteenveto: <b>"löytöjä X päivänä (Y%) 366:sta mahdollisesta"</b> — geocache.fi-tyylinen 366-päivähaasteen seuranta. Kalenterin päiväpopup ei enää sulkeudu vieritettäessä/klikattaessa sen sisältä (✕-nappi + muualta klikkaus sulkee) ja näyttää löytövuoden.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.9</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>29.9.2026:</strong> <b>Mobiili-UX-kiillotus</b>: kaikki selaimen omat alert/confirm/prompt-ikkunat korvattu sovelluksen teemaan sopivilla ilmoituksilla (toastit) ja vahvistusdialogeilla — myös Reissuapurissa ja suosikkihakujen muokkauksessa. <b>Safe-area-tuki</b>: notch-lovet ja kotipalkki otettu huomioon (viewport-fit=cover, yläpalkki ja alareunan bannerit työntyvät turva-alueelle). <b>Kosketuskohteet suurennettu</b>: pienet napit, chip-valitsimet ja hampurilaisvalikko ovat nyt väh. ~36-44px. Ei enää vahinkotuplapainallus-zoomia (touch-action: manipulation). <b>Modaalien scroll-lukitus</b>: tausta ei enää vieritä modaalin alla. Muuntimet-iframe käyttää dvh-korkeutta. Manifest ja theme-color yhtenäistetty. <b>Kalenterin päiväpopup</b>: ei enää sulkeudu vieritettäessä tai klikatessa sen sisällä — sulkeutuu ✕-napista tai muualta klikatessa; riveillä näkyy nyt myös löytövuosi.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.8</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>29.9.2026:</strong> <b>Päivitysilmoitus</b>: kun uusi versio on asennettu taustalla, ruudun alalaitaan ilmestyy "Päivitä"-banneri — ei enää tarvetta tyhjentää välimuistia käsin. <b>Navigaation korostus korjattu</b>: Tilastot/Linkkikirjasto näyttävät nyt aktiivisen sivun oikein (myös tilastojen alinäkymät ja maakartat). <b>Löytöhaut päivittyvät heti</b> GPX-tuonnin jälkeen ilman sivun uudelleenlatausta. <b>Tietoturva</b>: kaverinimet renderöidään turvallisesti; käyttäjän poisto siivoaa nyt myös löytödata-alikokoelmat (myös admin-poisto). <b>Ulkomaiden karttojen GPX-tuonti</b> käyttää nyt samaa kätkötyyppitaulukkoa kuin päätuonti (Giga/Juhla/Block Party -määritykset korjattu) ja popup näyttää kaikki 14 tyyppiä. Manuaalinen kunta-määritys poistaa löydön aiemmasta kunnasta heti.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.7</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> <b>Tarkat kuntarajat (MML 1:100&nbsp;000)</b>: aiempi kunta-aineisto oli ~23-kulmainen yleistys, joka sijoitti rajojen lähellä olevat kätköt naapurikuntiin (esim. Lahti +45). Nyt käytössä Maanmittauslaitoksen virallinen kuntajako — korjaa sekä kuntamääritykset että piirretyt rajat kuntakartoilla. Vaatii ZIP-uudelleentuonnin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.6</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> <b>Löytöpäivät Pacific Timeen</b>: GPX:n lokipäivämäärät ovat UTC-aikaleimoja — geocaching.com/geocache.fi näyttävät ne PT-vyöhykkeellä (Seattle). <b>Kuntamääritys korjattu</b>: lähimmän kunnan "napautus" oli 10 km (naapurikunnan kätköjä lipsui väärälle) → nyt 2 km + raportti listaa ohjatut; koodi poistetaan vanhasta sijainnista kun se siirtyy toiseen kuntaan/maahan (aiemmin saattoi olla molemmissa). D/T-ruudukon legenda näyttää kaikki esiintyvät tyypit. Paikkakunta-hakuun vuosikalenteri.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.5</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> Vuosikalenteri <b>tiivistetty staattiseksi ruudukoksi</b> (kuten geocache.fi) — kaikki solut samankokoisia, mahtuu mobiilinäytölle ilman scrollausta. Eventtien päivät korjattu: tapahtumapäivä otetaan kätkön aikaleimasta, ei login UTC-ajankohdasta (miitit olijat vääriä). Vuosikalenteri lisätty myös Paikkakunta-haun tuloksiin.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.4</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> <b>Tärkeä löytöpäiväkorjaus</b>: pocket query -tiedostoissa käyttäjän omaa logia ei ole — päiväksi tuli virheellisesti kätkön piilotuspäivä. Nyt päivä jätetään tyhjäksi eikä tallennettuja päiviä ylikirjoiteta; eventeille käytetään tapahtumapäivää. Raportti varoittaa jos tiedosto ei ole My Finds -muotoa. Vuosikalenterin solut klikattavissa — popup listaa päivän kätköt ja suodattaa löytölistan. Tyypittömien löytöjen varoitus + 'Lost and Found Event Cache' -mäppäys.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.3</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> Löytöhaut näyttää nyt <b>varoituksen päivättömistä löydöistä</b> (koodilistalla) — jos GPX-tuonnissa on löytöjä ilman päivämäärää, ne eivät ilmesty kalenteriin ennen kuin tuot tiedoston uudelleen.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.2</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> <b>Korjaus löytöpäivien parsintaan</b>: GPX-tiedostoissa event-logit voivat olla "Unknown"-tyyppisiä — ne jäivät aiemmin päivättömiksi ja puuttuivat kalenterista. Uudelleenajo korjaa päivät ja siirtää löydöt oikeille vuosille (vana väärä merkintä siivotaan pois).</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.1</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> Löytöhaut-valitsimet uusittu <b>samaan tyyliin kuin kuvageneraattori</b>: tyylitellyt accordion-valikot natiivien tilalle, päiväväli + vuosirajaus aukeaa "Aikarajaus"-valinnasta. Vuosikalenteriin: <b>kuluva päivä punaisella</b>, "Kaikki vuodet" -valinta (esim. Miitti-aukot) ja lista päivistä joilta löytö puuttuu.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;"><strong>2.18.0</strong></div>
            <ul style="margin:0; padding-left:20px; line-height:1.6;">
                <li><strong>28.9.2026:</strong> Löytöhaut-uudistus: <b>hakuvalitsimet nyt mobiiliystävällisinä nappuloita</b> (ei enää puhelimen omaa valikkoa). Uudet haut: <b>Paikkakuntahaku</b> (kunnan löydöt + D/T), <b>Vuosikalenteri</b> (kk x päivä -ruudukko geocache.fi-tyyliin) ja <b>Monihaku</b> (kaikki ehdot vapaasti + löytöpäiväjakauma). Tyyppi/maa-suodattimiin "Kaikki / Ei mitään" -napit. Löytölistaan "Näytä kaikki" -nappi — ei enää 300 löydön kattoa.</li>
            </ul>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;">2.17.2: D/T-ruudukon ruudun klikkaus suodattaa löytölistan.</div>
            <div style="margin-top:10px; opacity:0.65; font-size:0.8em;">2.17.1: D/T-ruudukon klikattava tyyppijakauma-popup (mobiiliystävällinen).</div>




            <details style="margin-top:15px; margin-bottom:0;">
                <summary style="font-size:0.9em;">Näytä aiempi historia</summary>
                <div style="padding:0 14px 14px; font-size:0.9em; color:var(--subtext-color);">
                    <strong>v2.17.0</strong><br>
                    - 27.9.2026: Maailmankartta Muut maat -näkymään (löydetyt maat vihreällä + löytömäärä-tooltip).<br><br>
                    <strong>v2.16.2</strong><br>
                    - 27.9.2026: Muut maat kompaktiksi maalistaksi lipuilla; Ruotsi/Norja/Viro mukana + kartta-linkit.<br><br>
                    <strong>v2.16.1</strong><br>
                    - 27.9.2026: Sortattavat löytölistat kaikissa näkymissä; korjaus ulkomaiden karttojen löytölistan layoutiin.<br><br>
                    <strong>v2.16.0</strong><br>
                    - 27.9.2026: Maakohtaiset löytölistat: Muut maat -kortit avautuvat löytölistaksiin; "Näytä löydöt maassa" myös Ruotsi/Norja/Viro-kartoissa.<br><br>
                    <strong>v2.15.8</strong><br>
                    - 27.9.2026: Etusivun Kuvageneraattori-nappiin "geocache.fi"-alateksti.<br><br>
                    <strong>v2.15.7</strong><br>
                    - 27.9.2026: D/T-ruudukon rivi-/sarakesummat + kokonaissumma; GC-koodit linkeiksi; asetukset-sivun spinneri korjattu; löytöhaut-mobiilikorjauksia.<br><br>
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
