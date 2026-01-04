// Sivun vaihtaminen (SPA-logiikka)
function showPage(pageId) {
    // Piilotetaan kaikki osiot
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    // Näytetään valittu osio
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
    }

    // Jos mobiilivalikko on auki, sen voisi sulkea tässä (lisätään myöhemmin)
    console.log("Näytetään sivu: " + pageId);
}

// MK Kuvageneraattorin toiminnallisuus
function generoiKuvat() {
    const nimi = document.getElementById('nimimerkki').value.trim();
    const alue = document.getElementById('kuva-alue');
    
    if (!nimi) {
        alert("Syötä kätköilijän nimimerkki!");
        return;
    }

    // Luodaan kuvat geocache.fi stat-palvelusta
    // s=1: Löydetyt per kk, s=2: Löydetyt per vuosi
    alue.innerHTML = `
        <div class="card">
            <h3>Löydetyt kuukausittain - ${nimi}</h3>
            <img src="https://www.geocache.fi/stat/mk_stats.php?n=${nimi}&s=1" alt="Löydetyt per kk" style="width: 100%; height: auto;">
        </div>
        <div class="card" style="margin-top: 20px;">
            <h3>Löydetyt vuosittain - ${nimi}</h3>
            <img src="https://www.geocache.fi/stat/mk_stats.php?n=${nimi}&s=2" alt="Löydetyt per vuosi" style="width: 100%; height: auto;">
        </div>
    `;
}

// Kun sivu on ladattu, varmistetaan että ollaan etusivulla
document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
});
