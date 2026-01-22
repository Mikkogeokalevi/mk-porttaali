# AI-ohjeet (Cursor)

- `help.js`: Ohjetta ja versiotietoja ei saa tiivistaa, lyhentaa tai poistaa ilman erillista pyyntoa.
- `help.js`: Jos paivitys vaikuttaa ohjeisiin tai versiotietoihin, lisaa uusi tieto ohjeeseen (ilman tiivistamista).
- `help.js`: Kun versio pysyy samana, lisaa paivitykselle paivays versiohistoriaan.
- `help.js`: "Uutta versiossa" -listassa pidetaan vain 5 uusinta; vanhemmat saman version kohdat siirretaan aiempaan historiaan.
- `app.js` ja `index.html`: Ohje-nakyma nimetaan yhtenaeisesti "Ohjeet & Tuki".
- `sw.js`: Kun nakyviin tulee muutoksia mobiilissa, paivita `CACHE_NAME` jotta uusi versio latautuu.
