// links.js - Linkkikirjasto

// TÄHÄN LISTAAN VOI LISÄTÄ UUSIA LINKKEJÄ HELPOSTI
const LINKS = [
    {
        category: "🌍 Viralliset & Yhteisö",
        icon: "🌍",
        items: [
            { 
                title: "Geocaching.com", 
                url: "https://www.geocaching.com/", 
                desc: "Maailmanlaajuinen pääsivusto. Kätkökuvaukset ja loggaukset.",
                icon: "🟢" 
            },
            { 
                title: "Geocache.fi", 
                url: "https://www.geocache.fi/", 
                desc: "Suomen oma kätköilykeskus. Tilastot, foorumi ja kartat.",
                icon: "🇫🇮" 
            },
            {
                title: "Geocaching.com Blog",
                url: "https://www.geocaching.com/blog/",
                desc: "Viralliset uutiset, vinkit ja tarinat.",
                icon: "📰"
            },
            {
                title: "Geocaching.com Help Center",
                url: "https://www.geocaching.com/help/",
                desc: "Ohjeet, säännöt ja tukisivut.",
                icon: "🆘"
            }
        ]
    },
    {
        category: "📊 Tilastot & Kartat",
        icon: "📊",
        items: [
            { 
                title: "Project-GC", 
                url: "https://project-gc.com/", 
                desc: "Syvälliset tilastot, haasteiden tarkistimet ja virtuaaliset työkalut.",
                icon: "📈" 
            },
            { 
                title: "MML Karttapaikka", 
                url: "https://asiointi.maanmittauslaitos.fi/karttapaikka/", 
                desc: "Maanmittauslaitoksen tarkimmat maastokartat. Välttämätön maastossa.",
                icon: "🗺️" 
            },
            {
                title: "Paikkatietoikkuna",
                url: "https://kartta.paikkatietoikkuna.fi/",
                desc: "Karttanäkymä ja paikkatietokerrokset (maasto, ilmakuvat, rajat).",
                icon: "🧭"
            },
            {
                title: "OpenStreetMap",
                url: "https://www.openstreetmap.org/",
                desc: "Yhteisön ylläpitämä karttapohja. Hyvä taustakartta.",
                icon: "🌐"
            },
            {
                title: "OpenTopoMap",
                url: "https://opentopomap.org/",
                desc: "Topografinen kartta, korkeuskäyrät ja maastomuodot.",
                icon: "⛰️"
            }
        ]
    },
    {
        category: "🧩 Mysteerinmurskaajat",
        icon: "🧩",
        items: [
            { 
                title: "Geocaching Toolbox", 
                url: "https://www.geocachingtoolbox.com/", 
                desc: "Kaikki perusmuuntimet: koordinaattimuunnokset, tekstit ja salakirjoitukset.",
                icon: "🧰" 
            },
            { 
                title: "dCode.fr", 
                url: "https://www.dcode.fr/en", 
                desc: "Maailman kattavin salauksenpurkaja. Kun mikään muu ei auta.",
                icon: "🔓" 
            },
            { 
                title: "6123 Tampere", 
                url: "https://www.6123.fi/", 
                desc: "Legendaarinen suomalainen tietopankki mysteerien ratkontaan.",
                icon: "💡" 
            },
            { 
                title: "Geocalcing2", 
                url: "https://xiit.dy.fi/gc/", 
                desc: "Suomalainen klassikko koordinaattilaskuihin ja projektiolle.",
                icon: "🔢" 
            },
            {
                title: "GC Wizard",
                url: "https://gcwizard.net/",
                desc: "Kattava työkalupakki mysteereihin, koodeihin ja koordinaatteihin.",
                icon: "🧙"
            }
        ]
    },
    {
        category: "🛠️ Erikoistyökalut & Checkerit",
        icon: "🛠️",
        items: [
            { 
                title: "Reverse Wherigo", 
                url: "https://gc.de/gc/reversewherigo/", 
                desc: "Dekooderi käänteisille Wherigo-kaseteille.",
                icon: "⏪" 
            },
            { 
                title: "Solved Jigidi", 
                url: "https://solvedjigidi.com/", 
                desc: "Tietokanta ratkaistuille Jigidi-palapeleille.",
                icon: "🧩" 
            },
            { 
                title: "GeoCheck", 
                url: "https://geocheck.org/", 
                desc: "Yleinen koordinaattien tarkistin (Checker).",
                icon: "✅" 
            },
            { 
                title: "Certitude", 
                url: "https://www.certitudes.org/", 
                desc: "Avainsana-pohjainen tarkistin, yleinen mysteereissä.",
                icon: "🎯" 
            },
            {
                title: "Cachetur.no Checker",
                url: "https://www.cachetur.no/koord/",
                desc: "Koordinaattien tarkistin, käytössä monissa mysteereissä.",
                icon: "🧪"
            }
        ]
    },
    {
        category: "📱 Sovellukset & Ohjelmat",
        icon: "📱",
        items: [
            {
                title: "c:geo",
                url: "https://www.cgeo.org/",
                desc: "Suosittu Android-sovellus geokätköilyyn.",
                icon: "🤖"
            },
            {
                title: "Cachly",
                url: "https://www.cachly.com/",
                desc: "iOS-sovellus geokätköilyyn, nopea ja selkeä.",
                icon: "🍎"
            },
            {
                title: "Geooh GO",
                url: "https://geooh.com/",
                desc: "Monipuolinen mobiilisovellus geokätköilyyn.",
                icon: "📲"
            },
            {
                title: "GSAK",
                url: "https://gsak.net/",
                desc: "Geocaching Swiss Army Knife: PC-työkalu kätköjen hallintaan.",
                icon: "💻"
            }
        ]
    },
    {
        category: "🧭 Wherigo & Playerit",
        icon: "🧭",
        items: [
            {
                title: "Wherigo Foundation",
                url: "https://www.wherigofoundation.com/",
                desc: "Wherigo-tietokanta ja kasetit.",
                icon: "🗂️"
            },
            {
                title: "Urwigo",
                url: "http://www.urwigo.cz/",
                desc: "Wherigo-kasettien editori.",
                icon: "🧰"
            },
            {
                title: "Wherigo.com",
                url: "http://www.wherigo.com/",
                desc: "Virallinen Wherigo-sivusto ja kasettien hallinta.",
                icon: "🛰️"
            }
        ]
    }
];

export const renderLinksView = (content) => {
    let html = `
        <div class="card">
            <div class="view-header">
                <h1>Linkkikirjasto</h1>
                <button class="btn btn-sm" onclick="app.router('home')">⬅ Takaisin</button>
            </div>
    `;

    LINKS.forEach(cat => {
        html += `<div class="link-category">${cat.category}</div>`;
        html += `<div class="link-grid">`;
        
        cat.items.forEach(item => {
            html += `
                <a href="${item.url}" target="_blank" class="link-card">
                    <span class="link-icon">${item.icon}</span>
                    <div class="link-info">
                        <span class="link-title">${item.title}</span>
                        <span class="link-desc">${item.desc}</span>
                    </div>
                    <span class="link-arrow">↗</span>
                </a>
            `;
        });
        
        html += `</div>`;
    });

    html += `</div>`; // Suljetaan card
    content.innerHTML = html;
};
