// Sivun vaihtaminen (SPA-logiikka)
function showPage(pageId) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
    }
}

// MK Kuvageneraattorin TÄYDELLINEN logiikka
function generoiKuvat() {
    const nimi = document.getElementById('nimimerkki').value.trim();
    const alue = document.getElementById('kuva-alue');
    
    if (!nimi) {
        alert("Syötä kätköilijän nimimerkki!");
        return;
    }

    const geocacheFiBase = "https://www.geocache.fi/stat/mk_stats.php?n=" + nimi;
    const tilastoSivu = "https://www.geocache.fi/stat/tilastot.php?n=" + nimi;

    let html = `
        <div class="card" style="margin-bottom: 20px;">
            <h3>Linkit kätköilijälle: ${nimi}</h3>
            <p>
                <a href="https://www.geocaching.com/profile/?u=${nimi}" target="_blank">GC.com Profiili</a> | 
                <a href="${tilastoSivu}" target="_blank">Geocache.fi Tilastot</a> | 
                <a href="https://project-gc.com/Statistics/ProfileStats?profile_name=${nimi}" target="_blank">Project-GC</a>
            </p>
        </div>
    `;

    // 1. Perustilastot (Kuvat 1-7)
    const perusKuvat = [
        { id: 1, nimi: "Löydetyt kuukausittain" },
        { id: 2, nimi: "Löydetyt vuosittain" },
        { id: 3, nimi: "Löydetyt tänään" },
        { id: 4, nimi: "Löytöjen määrä kätkötyypeittäin" },
        { id: 5, nimi: "Päivälöydöt" },
        { id: 6, nimi: "Löytyneet kätköt (viimeiset 30 vrk)" },
        { id: 7, nimi: "FTF-kuva" }
    ];

    html += `<h3>Perustilastot</h3>`;
    perusKuvat.forEach(k => html += luoKuvaElementti(k.nimi, `${geocacheFiBase}&s=${k.id}`, tilastoSivu));

    // 2. Maakuntatilastot (m=1-19)
    html += `<h3>Maakuntatilastot</h3>`;
    for (let i = 1; i <= 19; i++) {
        html += luoKuvaElementti(`Maakunta ${i}`, `${geocacheFiBase}&m=${i}`, tilastoSivu);
    }

    // 3. Kuntatarkistimet ja muut (t=1-5)
    const muut = [
        { id: 1, nimi: "Kuntatarkistin" },
        { id: 2, nimi: "Maakuntatarkistin" },
        { id: 3, nimi: "Mitalitaulukko" },
        { id: 4, nimi: "Löytöputki" },
        { id: 5, nimi: "Kuntatarkistin (pieni)" }
    ];

    html += `<h3>Kuntatarkistimet ja muut</h3>`;
    muut.forEach(k => html += luoKuvaElementti(k.nimi, `${geocacheFiBase}&t=${k.id}`, tilastoSivu));

    alue.innerHTML = html;
}

// Apufunktio kuvaelementtien ja koodien luontiin (kuten alkuperäisessä)
function luoKuvaElementti(otsikko, imgUrl, linkUrl) {
    const bbCode = `[URL=${linkUrl}][IMG]${imgUrl}[/IMG][/URL]`;
    const htmlCode = `<a href="${linkUrl}"><img src="${imgUrl}" border="0"></a>`;

    return `
        <div class="card" style="margin-bottom: 20px;">
            <details>
                <summary><strong>${otsikko}</strong> (Klikkaa nähdäksesi koodit)</summary>
                <div style="margin-top:10px;">
                    <img src="${imgUrl}" alt="${otsikko}" style="max-width:100%; height:auto; display:block; margin-bottom:10px;">
                    <label>BBCode:</label>
                    <input type="text" value='${bbCode}' readonly style="width:100%; font-size:11px; margin-bottom:5px;">
                    <label>HTML:</label>
                    <input type="text" value='${htmlCode}' readonly style="width:100%; font-size:11px;">
                </div>
            </details>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
});
