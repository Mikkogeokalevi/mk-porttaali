function showPage(pageId) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove('hidden');
}

// Alkuperäinen logiikka suoraan MKkuvakeneraattori.html-tiedostosta
function generoiKuvat() {
    var nimi = document.getElementById('nimimerkki').value;
    var alue = document.getElementById('kuva-alue');
    var valitut = document.querySelectorAll('input[name="kuva"]:checked');
    var maakunnat = document.querySelectorAll('input[name="maakunta"]:checked');
    var tarkistimet = document.querySelectorAll('input[name="tarkistin"]:checked');

    if (nimi === "") {
        alert("Syötä kätköilijän nimi!");
        return;
    }

    var html = '<div class="card"><h3>Linkit kätköilijälle: ' + nimi + '</h3>';
    html += '<p><a href="https://www.geocaching.com/profile/?u=' + nimi + '" target="_blank">Geocaching.com profiili</a> | ';
    html += '<a href="https://www.geocache.fi/stat/tilastot.php?n=' + nimi + '" target="_blank">Geocache.fi tilastot</a> | ';
    html += '<a href="https://project-gc.com/Statistics/ProfileStats?profile_name=' + nimi + '" target="_blank">Project-GC</a></p></div>';

    // Perustilastot
    valitut.forEach(function(cb) {
        var imgUrl = "https://www.geocache.fi/stat/mk_stats.php?n=" + nimi + "&s=" + cb.value;
        html += luoKuvaBlock(cb.nextSibling.textContent.trim(), imgUrl, nimi);
    });

    // Maakunnat
    maakunnat.forEach(function(cb) {
        var imgUrl = "https://www.geocache.fi/stat/mk_stats.php?n=" + nimi + "&m=" + cb.value;
        html += luoKuvaBlock(cb.nextSibling.textContent.trim(), imgUrl, nimi);
    });

    // Tarkistimet
    tarkistimet.forEach(function(cb) {
        var imgUrl = "https://www.geocache.fi/stat/mk_stats.php?n=" + nimi + "&t=" + cb.value;
        html += luoKuvaBlock(cb.nextSibling.textContent.trim(), imgUrl, nimi);
    });

    alue.innerHTML = html;
}

function luoKuvaBlock(otsikko, imgUrl, nimi) {
    var linkUrl = "https://www.geocache.fi/stat/tilastot.php?n=" + nimi;
    var bbCode = "[URL=" + linkUrl + "][IMG]" + imgUrl + "[/IMG][/URL]";
    var htmlCode = '<a href="' + linkUrl + '"><img src="' + imgUrl + '" border="0"></a>';
    
    return '<div class="card" style="margin-top:20px;">' +
           '<h4>' + otsikko + '</h4>' +
           '<img src="' + imgUrl + '" style="max-width:100%; border-radius:5px;"><br><br>' +
           '<label>BBCode:</label><input type="text" value=\'' + bbCode + '\' readonly style="width:100%; font-size:11px; margin-bottom:5px;">' +
           '<label>HTML-koodi:</label><input type="text" value=\'' + htmlCode + '\' readonly style="width:100%; font-size:11px;">' +
           '</div>';
}

document.addEventListener('DOMContentLoaded', () => { showPage('home'); });
