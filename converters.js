// Muuntimet-moduuli MK Porttaaliin
export function renderConvertersView(content) {
    content.innerHTML = `
        <div class="card">
            <h2>🔄 Yksikönmuuntimet</h2>
            <p style="color: var(--subtext-color); margin-bottom: 20px;">
                Muunna eri yksiköitä toisikseen. Hyödyllinen geokätköilyssä.
            </p>
            
            <!-- Välilehtinavigaatio -->
            <div class="converter-tabs" id="converterTabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="pituus">📏 Pituus</button>
                    <button class="tab-btn" data-tab="massa">⚖️ Massa</button>
                    <button class="tab-btn" data-tab="pinta_ala">📐 Pinta-ala</button>
                    <button class="tab-btn" data-tab="tilavuus">🥤 Tilavuus</button>
                    <button class="tab-btn" data-tab="voima">💪 Voima</button>
                    <button class="tab-btn" data-tab="nopeus">⚡ Nopeus</button>
                    <button class="tab-btn" data-tab="aika">⏰ Aika</button>
                    <button class="tab-btn" data-tab="paine">🔵 Paine</button>
                    <button class="tab-btn" data-tab="energia">⚡ Energia</button>
                    <button class="tab-btn" data-tab="teho">🔥 Teho</button>
                    <button class="tab-btn" data-tab="kulma">📐 Kulma</button>
                    <button class="tab-btn" data-tab="sahko">⚡ Sähkö</button>
                    <button class="tab-btn" data-tab="sateily">☢️ Säteily</button>
                    <button class="tab-btn" data-tab="valo">💡 Valo</button>
                    <button class="tab-btn" data-tab="data">💾 Data</button>
                    <button class="tab-btn" data-tab="apteekkari_massa">💊 Apteekkari</button>
                    <button class="tab-btn" data-tab="ruoanlaitto">🍳 Ruoanlaitto</button>
                    <button class="tab-btn" data-tab="typografia">📝 Typografia</button>
                </div>
            </div>
            
            <!-- Sisältöalue -->
            <div id="convertersContainer">
                <div style="text-align: center; padding: 40px;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid var(--accent-color); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 15px; color: var(--subtext-color);">Ladataan muuntimia...</p>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .converter-tabs {
                margin-bottom: 20px;
            }
            
            .tab-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 20px;
                padding: 10px;
                background: var(--card-bg);
                border-radius: var(--border-radius);
                border: 1px solid var(--border-color);
            }
            
            .tab-btn {
                background: var(--button-bg);
                color: var(--text-color);
                border: 1px solid var(--border-color);
                padding: 8px 12px;
                border-radius: var(--border-radius);
                cursor: pointer;
                font-size: 0.85em;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .tab-btn:hover {
                background: var(--button-hover-bg);
                transform: translateY(-1px);
            }
            
            .tab-btn.active {
                background: var(--accent-color);
                color: var(--bg-color);
                border-color: var(--accent-color);
            }
            
            .converter-section {
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 20px;
                margin-bottom: 15px;
            }
            
            .converter-title {
                font-size: 1.1em;
                font-weight: bold;
                margin-bottom: 15px;
                color: var(--accent-color);
            }
            
            .converter-input-group {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 10px;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .converter-input {
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                color: var(--text-color);
                padding: 10px;
                border-radius: var(--border-radius);
                font-size: 1em;
            }
            
            .converter-arrow {
                text-align: center;
                color: var(--accent-color);
                font-size: 1.2em;
            }
            
            .converter-result {
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                color: var(--text-color);
                padding: 10px;
                border-radius: var(--border-radius);
                font-size: 1em;
                font-weight: bold;
            }
            
            .converter-unit {
                font-size: 0.9em;
                color: var(--subtext-color);
                margin-left: 5px;
            }
            
            @media (max-width: 768px) {
                .converter-input-group {
                    grid-template-columns: 1fr;
                    gap: 5px;
                }
                
                .converter-arrow {
                    transform: rotate(90deg);
                }
                
                .tab-buttons {
                    gap: 3px;
                    padding: 8px;
                }
                
                .tab-btn {
                    padding: 6px 10px;
                    font-size: 0.8em;
                }
            }
        </style>
    `;
    
    // Ladataan muuntimet dynaamisesti
    loadConverters();
}

async function loadConverters() {
    try {
        // Ladataan yksikötiedot
        const response = await fetch('./yksikot.json');
        const units = await response.json();
        
        // Ladataan muuntimet-skripti
        await loadScript('./muuntimet_script.js');
        
        // Alustetaan välilehtitoiminnot
        initializeTabs(units);
        
        // Näytetään oletusvälilehti (pituus)
        showConverter('pituus', units);
        
    } catch (error) {
        console.error('Virhe muuntimien lataamisessa:', error);
        document.getElementById('convertersContainer').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--error-color);">
                <p>❌ Virhe muuntimien lataamisessa</p>
                <button class="btn" onclick="loadConverters()" style="margin-top: 10px;">Yritä uudelleen</button>
            </div>
        `;
    }
}

function initializeTabs(units) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Poistetaan aktiivinen luokka kaikilta nappeilta
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Lisätään aktiivinen luokka klikatulle napille
            button.classList.add('active');
            
            // Näytetään vastaava muunnin
            const tabName = button.dataset.tab;
            showConverter(tabName, units);
        });
    });
}

function showConverter(tabName, units) {
    const container = document.getElementById('convertersContainer');
    
    if (!units[tabName] || !Array.isArray(units[tabName])) {
        container.innerHTML = `
            <div class="converter-section">
                <div class="converter-title">❌ Virhe</div>
                <p>Muuntimen "${tabName}" dataa ei löytynyt.</p>
            </div>
        `;
        return;
    }
    
    const categoryNames = {
        'pituus': '📏 Pituus',
        'massa': '⚖️ Massa',
        'pinta_ala': '📐 Pinta-ala',
        'tilavuus': '🥤 Tilavuus',
        'voima': '💪 Voima',
        'nopeus': '⚡ Nopeus',
        'aika': '⏰ Aika',
        'paine': '🔵 Paine',
        'energia': '⚡ Energia',
        'teho': '🔥 Teho',
        'kulma': '📐 Kulma',
        'sahko': '⚡ Sähkö',
        'sateily': '☢️ Säteily',
        'valo': '💡 Valo',
        'data': '💾 Data',
        'apteekkari_massa': '💊 Apteekkarin mitat',
        'ruoanlaitto': '🍳 Ruoanlaitto',
        'typografia': '📝 Typografia'
    };
    
    const categoryName = categoryNames[tabName] || tabName;
    const unitList = units[tabName];
    
    container.innerHTML = `
        <div class="converter-section">
            <div class="converter-title">${categoryName}</div>
            <div class="converter-input-group">
                <input type="number" id="${tabName}-input" class="converter-input" value="1" step="any">
                <select id="${tabName}-from" class="converter-input">
                    ${unitList.map(unit => `<option value="${unit.kerroin}">${unit.name}</option>`).join('')}
                </select>
                <div class="converter-arrow">→</div>
                <input type="text" id="${tabName}-to" class="converter-result" readonly>
                <select id="${tabName}-to-unit" class="converter-input">
                    ${unitList.map(unit => `<option value="${unit.kerroin}">${unit.name}</option>`).join('')}
                </select>
            </div>
            ${unitList[0].selite ? `<div style="margin-top: 10px; font-size: 0.85em; color: var(--subtext-color); font-style: italic;">💡 ${unitList[0].selite}</div>` : ''}
        </div>
    `;
    
    // Alustetaan tapahtumankuuntelijat tälle muuntimelle
    initializeConverter(tabName);
}

function initializeConverter(tabName) {
    const input = document.getElementById(`${tabName}-input`);
    const from = document.getElementById(`${tabName}-from`);
    const to = document.getElementById(`${tabName}-to-unit`);
    const result = document.getElementById(`${tabName}-to`);
    
    if (input && from && to && result) {
        const updateConverter = () => {
            const value = parseFloat(input.value) || 0;
            const fromFactor = parseFloat(from.value);
            const toFactor = parseFloat(to.value);
            const converted = (value * fromFactor) / toFactor;
            result.value = converted.toFixed(8).replace(/\.?0+$/, '');
        };
        
        input.addEventListener('input', updateConverter);
        from.addEventListener('change', updateConverter);
        to.addEventListener('change', updateConverter);
        updateConverter();
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
