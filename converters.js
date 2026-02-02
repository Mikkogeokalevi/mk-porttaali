// Muuntimet-moduuli MK Porttaaliin
export function renderConvertersView(content) {
    content.innerHTML = `
        <div class="card">
            <h2>🔄 Yksikönmuuntimet</h2>
            <p style="color: var(--subtext-color); margin-bottom: 20px;">
                Muunna eri yksiköitä toisikseen. Hyödyllinen geokätköilyssä.
            </p>
            
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
            
            #convertersContainer {
                margin-top: 20px;
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
        
        // Alustetaan muuntimet
        if (window.initializeConverters) {
            window.initializeConverters(units);
        } else {
            throw new Error('Muuntimet-skripti ei latautunut oikein');
        }
        
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

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
