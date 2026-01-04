// Sivun vaihtaminen (SPA-logiikka)
function showPage(pageId) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
    }
    console.log("Näytetään sivu: " + pageId);
}

// MK Kuvageneraattorin täydellinen logiikka
function generoiKuvat() {
    const nimi = document.getElementById('nimimerkki').value.trim();
    const alue = document.getElementById('kuva-alue');
    
    if (!nimi) {
        alert("Syötä kätköilijän nimimerkki!");
        return;
    }

    // Alkuperäiset linkit ja osoitteet
    const profiiliLinkki = `https://www.geocaching.com/profile/?u=${nimi}`;
    const geocacheFiLinkki = `https://www.geocache.fi/stat/tilastot.php?n=${nimi}`;
    
    // Kuvatyyppien asetukset
    const kuvat = [
        { id: 1, otsikko: "Löydetyt kuukausittain", kuvaus: "mk_stats.php?n=" + nimi + "&s=1" },
        { id: 2, otsikko: "Löydetyt vuosittain", kuvaus: "mk_stats.php?n=" + nimi + "&s=2" },
        { id: 3, otsikko: "Löydetyt tänään", kuvaus: "mk_stats.php?n=" + nimi + "&s=3" }
    ];

    let html = `
        <div class="card" style="margin-bottom: 20px; border-left: 5px solid var(--accent);">
            <p><strong>Linkit:</strong> 
                <a href="${profiiliLinkki}" target="_blank" style="color: var(--accent);">Geocaching.com profiili</a> | 
                <a href="${geocacheFiLinkki}" target="_blank" style="color: var(--accent);">Geocache.fi tilastot</a>
            </p>
        </div>
    `;

    kuvat.forEach(kuva => {
        const imgUrl = `https://www.geocache.fi/stat/${kuva.kuvaus}`;
        const bbCode = `[URL=${geocacheFiLinkki}][IMG]${imgUrl}[/IMG][/URL]`;
        const htmlCode = `<a href="${geocacheFiLinkki}"><img src="${imgUrl}" border="0"></a>`;

        html += `
            <div class="card" style="margin-bottom: 25px;">
                <h3>${kuva.otsikko}</h3>
                <img src="${imgUrl}" alt="${kuva.otsikko}" style="max-width: 100%; height: auto; margin-bottom: 15px;">
                
                <div style="font-size: 0.85em; background: #1e1e2e; padding: 10px; border-radius: 5px;">
                    <label><strong>BBCode (Foorumeille):</strong></label>
                    <input type="text" value='${bbCode}' readonly style="width: 100%; max-width: none; font-family: monospace; font-size: 11px; margin-bottom: 10px;">
                    
                    <label><strong>HTML-koodi:</strong></label>
                    <input type="text" value='${htmlCode}' readonly style="width: 100%; max-width: none; font-family: monospace; font-size: 11px;">
                </div>
            </div>
        `;
    });

    alue.innerHTML = html;
}

// Alustus
document.addEventListener('DOMContentLoaded', () => {
    // Jos haluat, että nimimerkki muistetaan, voit lisätä sen tähän myöhemmin (localStorage)
    showPage('home');
});
