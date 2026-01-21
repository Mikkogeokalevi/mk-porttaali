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
            }
        ]
    }
];

export const renderLinksView = (content) => {
    let html = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h1>Linkkikirjasto</h1>
                <button class="btn" onclick="app.router('home')" style="padding:5px 10px;">⬅ Takaisin</button>
            </div>
            
            <style>
                .link-grid { display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
                
                .link-category { 
                    margin: 30px 0 15px 0; 
                    border-bottom: 2px solid var(--border-color); 
                    padding-bottom: 5px; 
                    color: var(--accent-color); 
                    font-size: 1.2em; 
                    font-weight: bold; 
                    display: flex; align-items: center; gap: 10px; 
                }
                
                .link-card {
                    background: rgba(255,255,255,0.03); 
                    border: 1px solid var(--border-color);
                    border-radius: 12px; 
                    padding: 15px; 
                    text-decoration: none; 
                    color: var(--text-color);
                    display: flex; 
                    align-items: center; 
                    gap: 15px; 
                    transition: all 0.2s ease;
                    position: relative; 
                    overflow: hidden;
                }
                
                /* Hover-efekti tietokoneella */
                .link-card:hover { 
                    background: rgba(255,255,255,0.08); 
                    transform: translateY(-2px); 
                    border-color: var(--accent-color); 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                /* Aktiivinen efekti mobiilissa (kun painetaan) */
                .link-card:active {
                    transform: scale(0.98);
                    background: rgba(255,255,255,0.1); 
                }
                
                .link-icon { font-size: 2em; opacity: 0.9; width: 40px; text-align: center; flex-shrink: 0; }
                .link-info { flex: 1; min-width: 0; /* Estää tekstin leviämisen */ }
                .link-title { display: block; font-weight: bold; font-size: 1.1em; color: var(--text-color); margin-bottom: 3px; }
                .link-desc { display: block; font-size: 0.85em; opacity: 0.7; line-height: 1.3; }
                .link-arrow { opacity: 0.3; font-size: 1.2em; margin-left: 5px; }
                .link-card:hover .link-arrow { opacity: 1; color: var(--accent-color); }
            </style>
    `;

    LINKS.forEach(cat => {
        html += `<div class="link-category"><span style="font-size:1.3em;">${cat.icon}</span> ${cat.category}</div>`;
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
