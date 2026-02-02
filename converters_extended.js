// Erikoismuuntimet - lisäosat converters.js:lle

// Koordinaatit
function createCoordinateConverter() {
    return `
        <div class="converter-section">
            <div class="converter-title">📍 Koordinaatit</div>
            <div class="converter-input-group">
                <input type="text" id="coord-dd" class="converter-input" placeholder="60.1699, 24.9384" style="grid-column: 1;">
                <button class="btn" onclick="convertDDtoDMS()" style="grid-column: 2;">DD → DMS</button>
            </div>
            <div class="converter-input-group">
                <input type="text" id="coord-dms" class="converter-input" placeholder="60°10'11.6\"N 24°56'18.2\"E" style="grid-column: 1;">
                <button class="btn" onclick="convertDMStoDD()" style="grid-column: 2;">DMS → DD</button>
            </div>
            <div style="margin-top: 10px; font-size: 0.85em; color: var(--subtext-color);">
                💡 DD = Desimaalimuoto, DMS = Asteet minuutit sekunnit
            </div>
        </div>
    `;
}

function initializeCoordinateConverter() {
    window.convertDDtoDMS = function() {
        const input = document.getElementById('coord-dd').value;
        const parts = input.split(',');
        if (parts.length !== 2) return;
        
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        
        const latAbs = Math.abs(lat);
        const lngAbs = Math.abs(lng);
        
        const latDeg = Math.floor(latAbs);
        const latMin = Math.floor((latAbs - latDeg) * 60);
        const latSec = ((latAbs - latDeg) * 60 - latMin) * 60;
        
        const lngDeg = Math.floor(lngAbs);
        const lngMin = Math.floor((lngAbs - lngDeg) * 60);
        const lngSec = ((lngAbs - lngDeg) * 60 - lngMin) * 60;
        
        const dms = `${latDeg}°${latMin}'${latSec.toFixed(1)}"${latDir} ${lngDeg}°${lngMin}'${lngSec.toFixed(1)}"${lngDir}`;
        document.getElementById('coord-dms').value = dms;
    };
    
    window.convertDMStoDD = function() {
        const input = document.getElementById('coord-dms').value;
        // Tämä vaatisi monimutkaisen regex-parsinnan, yksinkertaistettu esimerkki
        document.getElementById('coord-dd').value = "Syötä DMS-muoto ja muunna";
    };
}

// Lämpötila
function createTemperatureConverter() {
    return `
        <div class="converter-section">
            <div class="converter-title">🌡️ Lämpötila</div>
            <div class="converter-input-group">
                <input type="number" id="temp-input" class="converter-input" value="20" step="any">
                <select id="temp-from" class="converter-input">
                    <option value="celsius">Celsius</option>
                    <option value="fahrenheit">Fahrenheit</option>
                    <option value="kelvin">Kelvin</option>
                    <option value="rankine">Rankine</option>
                </select>
                <div class="converter-arrow">→</div>
                <input type="text" id="temp-to" class="converter-result" readonly>
                <select id="temp-to-unit" class="converter-input">
                    <option value="celsius">Celsius</option>
                    <option value="fahrenheit">Fahrenheit</option>
                    <option value="kelvin">Kelvin</option>
                    <option value="rankine">Rankine</option>
                </select>
            </div>
        </div>
    `;
}

function initializeTemperatureConverter() {
    const input = document.getElementById('temp-input');
    const from = document.getElementById('temp-from');
    const to = document.getElementById('temp-to-unit');
    const result = document.getElementById('temp-to');
    
    const updateTemperature = () => {
        const value = parseFloat(input.value) || 0;
        const fromUnit = from.value;
        const toUnit = to.value;
        
        // Muunnos Celsius-asteiksi
        let celsius = value;
        if (fromUnit === 'fahrenheit') celsius = (value - 32) * 5/9;
        else if (fromUnit === 'kelvin') celsius = value - 273.15;
        else if (fromUnit === 'rankine') celsius = (value - 491.67) * 5/9;
        
        // Muunnos kohdeyksikköön
        let resultValue = celsius;
        if (toUnit === 'fahrenheit') resultValue = celsius * 9/5 + 32;
        else if (toUnit === 'kelvin') resultValue = celsius + 273.15;
        else if (toUnit === 'rankine') resultValue = (celsius + 273.15) * 9/5;
        
        result.value = resultValue.toFixed(2).replace(/\.?0+$/, '');
    };
    
    input.addEventListener('input', updateTemperature);
    from.addEventListener('change', updateTemperature);
    to.addEventListener('change', updateTemperature);
    updateTemperature();
}

// Roomalaiset numerot
function createRomanConverter() {
    return `
        <div class="converter-section">
            <div class="converter-title">🏛️ Roomalaiset numerot</div>
            <div class="converter-input-group">
                <input type="number" id="roman-arabic" class="converter-input" placeholder="1984">
                <button class="btn" onclick="convertToRoman()">→</button>
                <input type="text" id="roman-roman" class="converter-input" placeholder="MCMLXXXIV">
            </div>
            <div style="margin-top: 10px; font-size: 0.85em; color: var(--subtext-color);">
                💡 Syötä numero (1-3999) tai roomalinen numero
            </div>
        </div>
    `;
}

function initializeRomanConverter() {
    window.convertToRoman = function() {
        const arabic = parseInt(document.getElementById('roman-arabic').value);
        if (arabic < 1 || arabic > 3999) return;
        
        const romanNumerals = [
            {value: 1000, numeral: 'M'},
            {value: 900, numeral: 'CM'},
            {value: 500, numeral: 'D'},
            {value: 400, numeral: 'CD'},
            {value: 100, numeral: 'C'},
            {value: 90, numeral: 'XC'},
            {value: 50, numeral: 'L'},
            {value: 40, numeral: 'XL'},
            {value: 10, numeral: 'X'},
            {value: 9, numeral: 'IX'},
            {value: 5, numeral: 'V'},
            {value: 4, numeral: 'IV'},
            {value: 1, numeral: 'I'}
        ];
        
        let result = '';
        let remaining = arabic;
        
        for (const {value, numeral} of romanNumerals) {
            while (remaining >= value) {
                result += numeral;
                remaining -= value;
            }
        }
        
        document.getElementById('roman-roman').value = result;
    };
    
    document.getElementById('roman-roman').addEventListener('input', function() {
        const roman = this.value.toUpperCase();
        // Yksinkertaistettu roomalaisen numeron validointi
        const validRoman = /^[IVXLCDM]+$/.test(roman);
        if (validRoman) {
            // Tässä voisi olla roomalaisen -> arabialainen muunnos
        }
    });
}

// BMI-laskuri
function createBMICalculator() {
    return `
        <div class="converter-section">
            <div class="converter-title">⚖️ Painoindeksi (BMI)</div>
            <div class="converter-input-group">
                <input type="number" id="bmi-height" class="converter-input" placeholder="Pituus (cm)" value="170">
                <input type="number" id="bmi-weight" class="converter-input" placeholder="Paino (kg)" value="70">
            </div>
            <button class="btn" onclick="calculateBMI()" style="width: 100%; margin-top: 10px;">Laske BMI</button>
            <div id="bmi-result" style="margin-top: 15px; padding: 15px; border-radius: var(--border-radius); display: none;"></div>
        </div>
    `;
}

function initializeBMICalculator() {
    window.calculateBMI = function() {
        const height = parseFloat(document.getElementById('bmi-height').value) / 100; // cm -> m
        const weight = parseFloat(document.getElementById('bmi-weight').value);
        
        if (!height || !weight || height <= 0 || weight <= 0) return;
        
        const bmi = weight / (height * height);
        let category, color;
        
        if (bmi < 18.5) { category = "Merkittävä alipaino"; color = "#0d6efd"; }
        else if (bmi < 25) { category = "Normaali paino"; color = "#90EE90"; }
        else if (bmi < 30) { category = "Lievä ylipaino"; color = "#FFD700"; }
        else { category = "Merkittävä ylipaino"; color = "#dc3545"; }
        
        const resultDiv = document.getElementById('bmi-result');
        resultDiv.innerHTML = `
            <div style="font-size: 1.2em; font-weight: bold;">${bmi.toFixed(1)}</div>
            <div style="font-size: 0.9em;">${category}</div>
        `;
        resultDiv.style.backgroundColor = color;
        resultDiv.style.color = (bmi >= 18.5 && bmi < 30) ? 'var(--bg-color)' : 'var(--text-color)';
        resultDiv.style.display = 'block';
    };
}

// Verensokeri
function createBloodSugarConverter() {
    return `
        <div class="converter-section">
            <div class="converter-title">🩸 Verensokeri</div>
            <div class="converter-input-group">
                <input type="number" id="bs-value" class="converter-input" value="5.5" step="0.1">
                <select id="bs-from" class="converter-input">
                    <option value="mmol">mmol/L</option>
                    <option value="mg">mg/dL</option>
                </select>
                <div class="converter-arrow">→</div>
                <input type="text" id="bs-result" class="converter-result" readonly>
                <select id="bs-to" class="converter-input">
                    <option value="mg">mg/dL</option>
                    <option value="mmol">mmol/L</option>
                </select>
            </div>
            <div style="margin-top: 10px; font-size: 0.85em; color: var(--subtext-color);">
                💡 Normaali paastoverensokeri: 4.0-6.0 mmol/L (72-108 mg/dL)
            </div>
        </div>
    `;
}

function initializeBloodSugarConverter() {
    const input = document.getElementById('bs-value');
    const from = document.getElementById('bs-from');
    const to = document.getElementById('bs-to');
    const result = document.getElementById('bs-result');
    
    const updateBloodSugar = () => {
        const value = parseFloat(input.value) || 0;
        const fromUnit = from.value;
        const toUnit = to.value;
        
        let resultValue = value;
        if (fromUnit === 'mmol' && toUnit === 'mg') {
            resultValue = value * 18.0182;
        } else if (fromUnit === 'mg' && toUnit === 'mmol') {
            resultValue = value / 18.0182;
        }
        
        result.value = resultValue.toFixed(1).replace(/\.?0+$/, '');
    };
    
    input.addEventListener('input', updateBloodSugar);
    from.addEventListener('change', updateBloodSugar);
    to.addEventListener('change', updateBloodSugar);
    updateBloodSugar();
}

// Yksikkösanasto
function createUnitDictionary(units) {
    let html = `
        <div class="converter-section">
            <div class="converter-title">📚 Yksikkösanasto</div>
            <input type="text" id="dict-search" class="converter-input" placeholder="Hae yksiköitä..." style="margin-bottom: 15px;">
            <div id="dict-results">
    `;
    
    const categories = {
        pituus: 'Pituus',
        massa: 'Massa',
        pinta_ala: 'Pinta-ala',
        tilavuus: 'Tilavuus',
        voima: 'Voima',
        nopeus: 'Nopeus',
        aika: 'Aika',
        paine: 'Paine',
        energia: 'Energia',
        teho: 'Teho',
        kulma: 'Kulma',
        sahko: 'Sähkö',
        sateily: 'Säteily',
        valo: 'Valo',
        data: 'Data',
        apteekkari_massa: 'Apteekkarin mitat',
        ruoanlaitto: 'Ruoanlaitto',
        typografia: 'Typografia'
    };
    
    for (const [key, name] of Object.entries(categories)) {
        if (units[key] && units[key].length > 0) {
            html += `<h4 style="margin: 15px 0 5px 0; color: var(--accent-color);">${name}</h4><ul style="margin: 0; padding-left: 20px;">`;
            units[key].forEach(unit => {
                html += `<li><strong>${unit.sym}</strong> - ${unit.name}${unit.selite ? ': ' + unit.selite : ''}</li>`;
            });
            html += '</ul>';
        }
    }
    
    html += '</div></div>';
    return html;
}

function initializeUnitDictionary(units) {
    const searchInput = document.getElementById('dict-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const items = document.querySelectorAll('#dict-results li');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

// Placeholder-funktiot muille muuntimille
function createDateCalculator() { return '<div class="converter-section"><div class="converter-title">📅 Päivämäärät</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeDateCalculator() {}
function createTextConverter() { return '<div class="converter-section"><div class="converter-title">📝 Teksti</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeTextConverter() {}
function createNumberSystemConverter() { return '<div class="converter-section"><div class="converter-title">🔢 Lukujärjestelmät</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeNumberSystemConverter() {}
function createFuelConverter() { return '<div class="converter-section"><div class="converter-title">⛽ Polttoaine</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeFuelConverter() {}
function createNumberTools() { return '<div class="converter-section"><div class="converter-title">🔢 Numerotyökalut</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeNumberTools() {}
function createResistorCodeConverter() { return '<div class="converter-section"><div class="converter-title">📊 Vastuskoodi</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeResistorCodeConverter() {}
function createColorConverter() { return '<div class="converter-section"><div class="converter-title">🎨 Värimuunnin</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeColorConverter() {}
function createPercentageCalculator() { return '<div class="converter-section"><div class="converter-title">📊 Prosenttilaskuri</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializePercentageCalculator() {}
function createCalorieCalculator() { return '<div class="converter-section"><div class="converter-title">🔥 Kalorilaskuri</div><p>Tämä muunnin on kehitteillä...</p></div>'; }
function initializeCalorieCalculator() {}
