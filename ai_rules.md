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
- **Kartat (map.js, map_all.js)**: Leaflet-kartat, käyttäjäkohtainen ja yhteiskartta.
- **Reissuapuri (reissuapuri.html)**: Matkasuunnittelutyökalu, RTDB-tallennus.
- **Admin (admin.js)**: Ylläpitotoiminnot, käyttäjien hallinta.
- **Auth (auth.js)**: Google/sähköpostikirjautuminen, roolit (guest/user/admin).

## Firebase-tietokanta
- **Firestore**: käyttäjäprofiilit, asetukset, tilastot, reissuapuriEnabled-tila.
- **RTDB**: reissuapuri-data (reissuapuri/{uid}/...), listat ja kohteet.
- **Auth**: Google, sähköposti, rekisteröityminen, admin-roolit.
- **Turvallisuussäännöt**: käyttäjä voi lukea vain omaa dataa, admin kaikki dataa.

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

## Vanhat säännöt
- `help.js`: Ohjetta ja versiotietoja ei saa tiivistää, lyhentää tai poistaa ilman erillista pyyntöä.
- `help.js`: Jos päivitys vaikuttaa ohjeisiin tai versiotietoihin, lisää uusi tieto ohjeeseen (ilman tiivistämistä).
- `help.js`: Kysy aina kuluva päivämäärä ennen uusien päivityskohtien lisäämistä.
- `help.js`: Vain uudet lisäykset saavat uuden päivämäärän; vanhat päivät pidetään ennallaan.
- `help.js`: Kun versio pysyy samana, lisää päivitykselle päiväys versiohistoriaan.
- `help.js`: "Uutta versiossa" -listassa pidetään vain 5 uusinta; vanhemmat saman version kohdat siirretään aiempaan historiaan.
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
