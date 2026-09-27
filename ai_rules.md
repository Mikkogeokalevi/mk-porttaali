# AI-ohjeet (Cursor)

- Olet MK Porttaalin Lead Developer ja geokätköily-asiantuntija. Tunnet projektin ladattujen tiedostojen perusteella.
- Projekti: Vanilla JS SPA, Firebase v11 (Auth + Firestore + RTDB), Leaflet-kartat, geokätköilijöille suunnatut työkalut ja tilastot.
- Ympäristö: GitHub Pages + Firebase Hosting, staattinen SPA-dynamiikalla.
- Käytä ES Modules -syntaksia (import/export).
- Käytä Firebase v11 modulaarista SDK:ta (getDoc, doc, collection, addDoc, jne.).
- UI:ssa hyödynnä olemassa olevia CSS-muuttujia (esim. var(--card-bg)).
- Tila on globaalissa `window.app` -objektissa.
- Ei arvailua: jos tietoa ei voi lukea, pyydä se ensin.
- Kunnioita alkuperaista: älä vaihda rakenteita tai muuttujia ilman pyyntöä.
- Kieli: kommunikoi suomeksi; koodin kielilinja pidetaan ennallaan.

## Olemassa olevat ominaisuudet
- **Tilastot (stats.js)**: Geokätkötilastot PGC:n kautta, 14 kätkötyyppiä, maakuntatilastot, kunta-analyysi.
- **Kuvageneraattori (generator.js)**: Geokätkökuvien luonti eri tyyleillä ja teksteillä.
- **Linkkikirjasto (links.js)**: Geokätköilyyn liittyvät linkit ja resurssit.
- **Muuntimet (converters.js + muuntimet.html)**: 33 kategoriaa, 200+ yksikköä, iframe-integraatio.
- **Kartat (map.js, map_all.js, map_countries.js)**: Leaflet-kartat, käyttäjäkohtainen ja yhteiskartta, sekä Kuntakartat-valitsimella avautuvat Ruotsin, Norjan ja Viron kuntakartat.
- **Reissuapuri (reissuapuri.html)**: Matkasuunnittelutyökalu, RTDB-tallennus.
- **Admin (admin.js)**: Ylläpitotoiminnot, käyttäjien hallinta.
- **Auth (auth.js)**: Google/sähköpostikirjautuminen, roolit (guest/user/admin).

## Firebase-tietokanta
- **Firestore**: käyttäjäprofiilit, asetukset, tilastot, reissuapuriEnabled-tila.
- **RTDB**: reissuapuri-data (reissuapuri/{uid}/...), listat ja kohteet.
- **Auth**: Google, sähköposti, rekisteröityminen, admin-roolit.
- **Turvallisuussäännöt**: käyttäjä voi lukea vain omaa dataa, admin kaikki dataa.

## Versiointi ja julkaisut
- Käytä käyttäjälle näkyvässä versiossa semanttista mallia `major.minor.patch`.
- **Minor-versio** (esim. `2.9`): uusi käyttäjälle näkyvä ominaisuuskokonaisuus tai useita samaan kokonaisuuteen liittyviä toimintoja.
- **Patch-versio** (esim. `2.9.1`): pieni korjaus, käyttöliittymän hienosäätö tai yksittäinen pieni lisäys ilman uutta pääominaisuutta.
- **Major-versio** (esim. `3.0`): suuri rakenteellinen muutos tai taaksepäin yhteensopivuutta rikkova muutos.
- Kartta- ja kuvageneraattoripäivitysten muodostama kokonaisuus julkaistaan versiona `2.9`; seuraavat pienet korjaukset käyttävät muotoa `2.9.1`, `2.9.2` jne.
- Ruotsin kuntakartta -kokonaisuus julkaistaan uutena minor-versiona `2.10.0`.
- Norjan ja Viron kuntakartat yhdistetään kuntakarttoihin versiona `2.11.0`.
- Kuntakarttojen paikannus seuraa sijaintia jatkuvasti, zoomaa nopeuden mukaan ja pitää näytön päällä versiona `2.12.0`.
- Koko sovelluksen ulkoasu-uudistus (yhtenäinen design system `style.css`:ssä) julkaistaan versiona `2.13.0`.
- Kun käyttäjänäkyvä versio muuttuu, päivitä vähintään `index.html`, `app.js`:n `APP_DISPLAY_VERSION`, etusivun logon alainen versionumero, `help.js`:n version otsikko/historia ja tarvittaessa sovelluksen tekninen cache-versio erikseen.
- Etusivulla näytetään `APP_DISPLAY_VERSION` logon alla ja siitä pääsee Ohjeet & Tuki -sivulle.
- Kuntakarttojen GPX-tuonnin viimeisin ajankohta tallennetaan `lastGpxImport`-kenttään ja näytetään karttanäkymässä.

## GitHub Pages -integraatio
- Staattinen SPA GitHub Pages:ssä, dynaamisuus Firebasen kautta.
- Build-prosessi: ei tarvita, suora deploy.
- Service Worker: PWA-toiminnallisuus, välimuistitus.
- Ympäristömuuttujat: Firebase-config .env-tuella (kehitys) ja kovakoodattu (produktio).
- URL-routaus: hash-based (#/home, #/stats, #/reissuapuri, jne.).

## UI/UX-säännöt
- Vastuullisuus: käyttäjien data on yksityistä, ei jaeta kolmansille.
- Suorituskyky: isot datamäärät ladataan osissa, käytetään välimuistia.
- Virheenkäsittely: selkeät virheilmoitukset käyttäjälle.
- PWA: toimii myös offline-tilassa Service Workerin avulla.
- UI: käytä style.css:n yhteisiä luokkia, älä lisää uusia inline-<style>-blokkeja näkymiin.
- UI-luokat (style.css): `.view-header` (otsikko + takaisin-nappi), `.btn-sm`, `.btn-block`, värinapit `.btn-green/-yellow/-peach/-sky/-blue/-mauve/-teal/-red/-danger`, `.launcher-grid` + `.launcher-btn` + `.launcher-icon` (ikoniruudukot), `.panel` (+ `-dashed/-accent/-success/-warn/-danger/-info`), `.badge-free/-premium/-extra/-admin/-pending/-approved/-blocked`, karttanäkymille `.map-shell/.map-toolbar/.toolbar-actions/.map-subbar/.map-area/.map-loading/.map-footer`.
- Header pysyy mustana (`#000`), koska logossa (`mklogo.png`) on kiinteä musta tausta.

## Vanhat säännöt
- `help.js`: Ohjetta ja versiotietoja ei saa tiivistää, lyhentää tai poistaa ilman erillista pyyntöä.
- `help.js`: Jokaisesta käyttäjälle näkyvästä muutoksesta lisätään tieto `Uutta versiossa` -kohtaan; jos muutos vaikuttaa käyttöön, päivitetään myös varsinainen ohje.
- `help.js`: Jos päivitys vaikuttaa ohjeisiin tai versiotietoihin, lisää uusi tieto ohjeeseen (ilman tiivistämistä).
- `help.js`: Kysy aina kuluva päivämäärä ennen uusien päivityskohtien lisäämistä.
- `help.js`: Vain uudet lisäykset saavat uuden päivämäärän; vanhat päivät pidetään ennallaan.
- `help.js`: Kun versio pysyy samana, lisää päivitykselle päiväys versiohistoriaan.
- `help.js` VERSIOHISTORIA — pakollinen ja saumaton AINA: "Uutta versiossa"-osiossa näytetään VAIN uusimman julkaistun version kohdat. Kaikki aiemmat versiot ovat historialistassa omalla `<strong>vX.Y.Z</strong>`-otsikollaan, uusin ensin. ÄLÄ KOSKAAN sekoita eri versioiden muutoksia samaan listaan tai otsikon alle — jokaisen version sisältö on luettavissa erikseen. Kun uusi versio julkaistaan: siirrä edellisen version kohdat historiaan omana versiona ja kirjoita uudet kohdat vain uudelle versiolle.
- `app.js` ja `index.html`: Ohje-näkyma nimetään yhtenäisesti "Ohjeet & Tuki".
- `sw.js`: Kun näkyviin tulee muutoksia mobiilissa, päivitä `CACHE_NAME` jotta uusi versio latautuu.
- Reissuapuri integroidaan MK Porttaaliin SPA-näkymänä ja näytetään käyttäjille, joilla on Firestoressa reissuapuriEnabled=true (admin voi myös käyttää).
- Reissuapurin data tallennetaan RTDB-polkuun reissuapuri/{uid}/... (käyttäjäkohtainen).
- AiRules: Päivitä ai_rules.md automaattisesti aina, kun tehdään päätöksiä joita tulee muistaa jatkossa.

## Päivityshistoria (AI Rules)
- **7.2.2026**: ai_rules.md korjattu vastaamaan olemassa olevaa kokonaisuutta (poistettu keksityt CSV-ominaisuudet).
- **2.2.2026**: Versio 2.8: Muuntimet integroitu SPA:han (merkittävä muutos)
- **2.2.2026**: Service Worker päivitetty v46 (versio 2.8)
- **2.2.2026**: index.html päivitetty versioon 2.8
- **2.2.2026**: help.js versiohistoria korjattu sääntöjen mukaisesti (5 uusinta)
- **2.2.2026**: Firebase-config siirretty ympäristömuuttujiin (.env-tuki)
- **2.2.2026**: Debug-koodi siivottu (17 TODO/FIXME poistettu)
- **2.2.2026**: Parempi virheenkäsittely ja latausindikaattorit
- **10.7.2026**: `help.js` päivitetty vastaamaan kartan ja kuvageneraattorin uusia ominaisuuksia; dokumentointisääntöä täsmennetty.
- **10.7.2026**: Semanttinen versiointikäytäntö otettu käyttöön; kartta- ja kuvageneraattorikokonaisuus määritelty versioksi 2.9.
- **10.7.2026**: Versio 2.9.1: kuvageneraattorin kovakoodatut pikapohjat korvattu käyttäjän omilla hallittavilla pikapohjilla.
- **27.9.2026**: Versio 2.15.1: korjaus — findsdata-kirjaukset tehdään nyt KAIKISTA löydöistä (aiemmin vain uusista ei-duplikaateista), joten keskeytyneen ensimmäisen tuonnin jälkeen uudelleenajo täydentää puuttuvat löydöt. Vaikutti Löytöhaut-näkymään (vain 7 löytöä näkyi).
- **27.9.2026**: Versio 2.15.0 (jatkuu): käsin tehtävät kunta-määritykset — `assignFindToFinnishMunicipality(db,uid,{code,typeName,fromCname,kunta,day})` gpxImport.js:ssä; tallentuu `stats/{uid}.fixes = {GCxxxx: 'Kunta'}` ja tuonti käyttää sitä automaattisesti (ohittaa polygon-osumatteilyn). UI: tuontiraportin osumattomat-rivit (settings.js select.fix-kunta) + Muut maat -näkymän Suomen-aliakset (stats.js select.fix-kunta-other, kuntaa ei tunnistettu → laajennettava lista). Vain Suomen kunnat tuettu, ulkomaiden osumattomat jäävät other-dataan.
- **27.9.2026**: Versio 2.15.0: Löytöhaut-näkymä Tilastoissa (uusi `findsQuery.js` + reitti `stats_queries` + launcher). Laajennettava kyselyrekisteri `FINDS_QUERIES`: jokainen haku = {id,title,desc,input,run}; jaetut renderöijät dtMatrix (9×9 D/T-ruudukko), typeCoverage (14 tyyppiä), findsList. Data ladataan getDocs(collection 'findsdata') ja välimuistitetaan istunnon ajaksi. Vakiokyselyt: Kalenteripäivähaku (pp.kk → tyypit+D/T+lista), Kuukauden D/T, Viikonpäivän D/T, Attribuuttihaku (ATTR_FI). Uudet haut lisätään rekisteriin ilman UI-muutoksia.
- **27.9.2026**: Versio 2.14.2: Ahvenanmaan GPX-löydöt ('Aland Islands'/'Åland Islands'/'Åland'/'Ahvenanmaa') reititetään Suomen kuntaosumatteilyyn kuten geocache.fi — vanhat Åland-merkinnät siivotaan other_countries-datasta tuonnin yhteydessä; uudelleentuonti siirtää ne kuntiin.
- **27.9.2026**: Versio 2.14.1: GPX-tuonnin korjauksia — 'Mega-Event Cache'/'Giga-Event Cache' -tyyppivaihtoehdot lisätty (Giga→Juhla-idx13); tuontiraportti näyttää maiden kokonaismäärät (countryTotals/otherTotals) eikä vain uusia; attribuutit tallentuvat pilkkomerkkijonona (Firestore ei salli sisäkkäisiä taulukoita).
- **27.9.2026**: Versio 2.14.0: GPX/ZIP -tuonti kaikkien maiden löydöille (uusi `gpxImport.js`): zip-purku DecompressionStreamilla (ei ulkoisia riippuvuuksia), sujuva wpt-parsinta, osumatteily Suomen kuntarajoihin (NAMEFIN + kuntaliitos-fix Pertunmaa→Mäntyharju) + SE/NO/EE-polygoneihin. Maa tunnistetaan `<groundspeak:country>`-tagista. Uusi `stats_other`-reitti ja "Muut maat" -näkymä (`users/{uid}/other_countries/finds` + `users/{uid}/findsdata/{vuosi|'unknown'}` — vuositasoinen jakaminen koska 20k+ löytöä ei mahdu yhteen 1 Mt dokumenttiin; kompakti per-kätkö-data: tyyppi, löytöpvm (oman "Found it"-login päivä, EI wpt `<time>` joka on piilotuspäivä), D/T, attribuutit kompaktisti (positiivinen id=inc1, negatiivinen=inc0). Ensimmäinen GPX-tuonti KORVAA copy/paste-datan (ei ids-taulukoita → duplikaattiriski); jälkeenpäin merge ids-dedupilla. `COUNTRY_CONFIGS` exportattu map_countries.js:stä.
- **27.9.2026**: Versio 2.13.3: kuvageneraattorin lomake tiivistetty (`.gen-form`-luokka: pienemmät labelit/välit, kompakti `.gen-quick-links`); help.js:n versiohistoria järjestetty versionumeroittain (v2.13.1, v2.13.0, v2.12.2...) ja sääntö "vain uusin versio Uutta-osiossa" vahvistettu. SW cache v66.
- **27.9.2026**: Versio 2.13.2: mobiilikorjauksia — karttanäkymät ja modaalit käyttävät `dvh`-yksikköä (`vh` fallbackina), `user-scalable=no` poistettu viewportista (nipistyszoomaus sallittu), pienet painikkeet suurennettu kosketuskohteiksi ≤600px-näytöillä, `.user-actions .btn`-marginaali korjattu, aria-labelit ikoni-napeille; help.js "Uutta versiossa"-lista siistitty 5 uusimpaan. SW cache v65.
- **27.9.2026**: Versio 2.13.1 jatkuu: admin-esikatselu lisätty — admin voi nähdä sovelluksen toisen käyttäjän oikeuksilla (`window.app.previewAs` + `effRole()/effPlan()/effReissuapuri()`-apufunktiot app.js:ssä; oikeustarkistukset käyttävät niitä suoran `userPlan`/`userRole`-luvun sijaan; banneri `.preview-banner`).
- **27.9.2026**: Versio 2.13.1: korjattu tilastovalikon rikkinäinen emojikuvake; "Kuntakartat" uudelleennimetty "Ulkomaiden kuntakartat" -nimiseksi ja poistettu etusivulta (avautuu vain Tilastot-osiosta, koska Suomen kunnat ovat Triplettijahti- ja Maakunnat & Löydöt -osioissa); maavalitsimen takaisin-nappi vie Tilastoihin; maiden liput vaihdettu lippu-emojeista inline-SVG-kuviksi (Windows ei renderöi lippu-emojeja) — `FLAG_SVGS` map_countries.js:ssä. Ulkoasu säilyy 2.13.0-ilmeenä käyttäjän toivomuksesta. SW cache v64.
- **27.9.2026**: Versio 2.13.0: ulkoasu-uudistus. `style.css` kirjoitettu uusiksi (poistettu tuplakoodi, lisätty yhteiset komponenttiluokat); näkymien inline-`<style>`-blokit poistettu (settings, admin, links, stats) ja yläpalkit, napit, paneelit ja badget yhtenäistetty; etusivu ja maa-/tilastovalitsimet ikoniruudukoiksi; SW cache v63.
- **5.9.2026**: Versio 2.12.2: paikannuksen zoom-tasot päivitetty vastaamaan vertailupalvelua (≤40→18, 40–70→17, 70–100→16, >100→14).
- **5.9.2026**: Versio 2.12.1: paikannuksen zoom-tasoja säädetty lähemmäs erityisesti alle 60 km/h nopeuksissa.
- **3.9.2026**: Versio 2.12.0: kuntakarttojen paikannus seuraa sijaintia automaattisesti, zoomaa nopeuden mukaan ja pitää näytön päällä mobiililaitteilla Wake Lock API:lla; paikannuksen sammutuksen jälkeen viimeisin sijainti jää punaiseksi palloksi ja manuaalinen zoom/pan keskeyttää automaattisen seurannan 10 sekunniksi; Viron kuntakartan GPX-tuonti tunnistaa saarilla olevat kätköt lähimmän kunnan kaaren avulla.
- **2.9.2026**: Versio 2.11.0: kuntakartat laajennettu kattamaan Norjan ja Viron kuntakartat yhteisellä Kuntakartat-valitsimella; aiempi Ruotsi-kuntakartta siirretty uuteen yhteiseen moduuliin.
- **2.9.2026**: Versio 2.10.0: lisätty interaktiivinen Ruotsi-kuntakartta, jossa voi merkitä löydetyt kunnat, paikantaa itsensä ja tuoda löydöt GPX-tiedostosta; tuonti erottelee kätkötyypit kunnittain.
