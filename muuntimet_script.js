/*
  MK MUUNTIMET
  Versio 18.0 - Loogisempi rakenne ja uudet yksiköt
*/

// Globaali alustusfunktio SPA-integraatiota varten
window.initializeConverters = async function(yksikot) {
    try {
        await initializeMuuntimet(yksikot);
    } catch (error) {
        console.error('Virhe muuntimien alustuksessa:', error);
        throw error;
    }
};

// Alustetaan muuntimet containerissa
async function initializeMuuntimet(yksikot) {
    const container = document.getElementById('convertersContainer');
    if (!container) {
        throw new Error('convertersContainer ei löytynyt');
    }

    // Luodaan muunnin-rakenne
    container.innerHTML = await createConverterHTML(yksikot);
    
    // Alustetaan tapahtumankuuntelijat
    initializeEventListeners(yksikot);
}

// Luodaan HTML-rakenne muuntimille
async function createConverterHTML(yksikot) {
    let html = '';
    
    // Etäisyysmuunnin
    html += createDistanceConverter(yksikot.etäisyys);
    
    // Lämpötilamuunnin
    html += createTemperatureConverter(yksikot.lämpötila);
    
    // Painomuunnin
    html += createPressureConverter(yksikot.paine);
    
    // Nopeusmuunnin
    html += createSpeedConverter(yksikot.nopeus);
    
    return html;
}

function createDistanceConverter(units) {
    return `
        <div class="converter-section">
            <div class="converter-title">📏 Etäisyys</div>
            <div class="converter-input-group">
                <input type="number" id="dist-input" class="converter-input" value="1" step="any">
                <select id="dist-from" class="converter-input">
                    ${units.map(unit => `<option value="${unit.kerroin}">${unit.nimi}</option>`).join('')}
                </select>
                <div class="converter-arrow">→</div>
                <input type="text" id="dist-to" class="converter-result" readonly>
                <select id="dist-to-unit" class="converter-input">
                    ${units.map(unit => `<option value="${unit.kerroin}">${unit.nimi}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
}

function createTemperatureConverter(units) {
    return `
        <div class="converter-section">
            <div class="converter-title">🌡️ Lämpötila</div>
            <div class="converter-input-group">
                <input type="number" id="temp-input" class="converter-input" value="20" step="any">
                <select id="temp-from" class="converter-input">
                    ${units.map(unit => `<option value="${unit.nimi}">${unit.nimi}</option>`).join('')}
                </select>
                <div class="converter-arrow">→</div>
                <input type="text" id="temp-to" class="converter-result" readonly>
                <select id="temp-to-unit" class="converter-input">
                    ${units.map(unit => `<option value="${unit.nimi}">${unit.nimi}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
}

function createPressureConverter(units) {
    return `
        <div class="converter-section">
            <div class="converter-title">🔵 Paine</div>
            <div class="converter-input-group">
                <input type="number" id="pressure-input" class="converter-input" value="1013" step="any">
                <select id="pressure-from" class="converter-input">
                    ${units.map(unit => `<option value="${unit.kerroin}">${unit.nimi}</option>`).join('')}
                </select>
                <div class="converter-arrow">→</div>
                <input type="text" id="pressure-to" class="converter-result" readonly>
                <select id="pressure-to-unit" class="converter-input">
                    ${units.map(unit => `<option value="${unit.kerroin}">${unit.nimi}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
}

function createSpeedConverter(units) {
    return `
        <div class="converter-section">
            <div class="converter-title">⚡ Nopeus</div>
            <div class="converter-input-group">
                <input type="number" id="speed-input" class="converter-input" value="5" step="any">
                <select id="speed-from" class="converter-input">
                    ${units.map(unit => `<option value="${unit.kerroin}">${unit.nimi}</option>`).join('')}
                </select>
                <div class="converter-arrow">→</div>
                <input type="text" id="speed-to" class="converter-result" readonly>
                <select id="speed-to-unit" class="converter-input">
                    ${units.map(unit => `<option value="${unit.kerroin}">${unit.nimi}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
}

function initializeEventListeners(yksikot) {
    // Etäisyysmuunnin
    const distInput = document.getElementById('dist-input');
    const distFrom = document.getElementById('dist-from');
    const distTo = document.getElementById('dist-to-unit');
    const distResult = document.getElementById('dist-to');
    
    if (distInput && distFrom && distTo && distResult) {
        const updateDistance = () => {
            const value = parseFloat(distInput.value) || 0;
            const fromFactor = parseFloat(distFrom.value);
            const toFactor = parseFloat(distTo.value);
            const result = (value * fromFactor) / toFactor;
            distResult.value = result.toFixed(6).replace(/\.?0+$/, '');
        };
        
        distInput.addEventListener('input', updateDistance);
        distFrom.addEventListener('change', updateDistance);
        distTo.addEventListener('change', updateDistance);
        updateDistance();
    }
    
    // Lämpötilamuunnin
    const tempInput = document.getElementById('temp-input');
    const tempFrom = document.getElementById('temp-from');
    const tempTo = document.getElementById('temp-to-unit');
    const tempResult = document.getElementById('temp-to');
    
    if (tempInput && tempFrom && tempTo && tempResult) {
        const updateTemperature = () => {
            const value = parseFloat(tempInput.value) || 0;
            const fromUnit = tempFrom.value;
            const toUnit = tempTo.value;
            
            // Muunnos Celsius-asteiksi
            let celsius = value;
            if (fromUnit === 'Fahrenheit') celsius = (value - 32) * 5/9;
            else if (fromUnit === 'Kelvin') celsius = value - 273.15;
            else if (fromUnit === 'Rankine') celsius = (value - 491.67) * 5/9;
            
            // Muunnos kohdeyksikköön
            let result = celsius;
            if (toUnit === 'Fahrenheit') result = celsius * 9/5 + 32;
            else if (toUnit === 'Kelvin') result = celsius + 273.15;
            else if (toUnit === 'Rankine') result = (celsius + 273.15) * 9/5;
            
            tempResult.value = result.toFixed(2).replace(/\.?0+$/, '');
        };
        
        tempInput.addEventListener('input', updateTemperature);
        tempFrom.addEventListener('change', updateTemperature);
        tempTo.addEventListener('change', updateTemperature);
        updateTemperature();
    }
    
    // Painemuunnin
    const pressureInput = document.getElementById('pressure-input');
    const pressureFrom = document.getElementById('pressure-from');
    const pressureTo = document.getElementById('pressure-to-unit');
    const pressureResult = document.getElementById('pressure-to');
    
    if (pressureInput && pressureFrom && pressureTo && pressureResult) {
        const updatePressure = () => {
            const value = parseFloat(pressureInput.value) || 0;
            const fromFactor = parseFloat(pressureFrom.value);
            const toFactor = parseFloat(pressureTo.value);
            const result = (value * fromFactor) / toFactor;
            pressureResult.value = result.toFixed(2).replace(/\.?0+$/, '');
        };
        
        pressureInput.addEventListener('input', updatePressure);
        pressureFrom.addEventListener('change', updatePressure);
        pressureTo.addEventListener('change', updatePressure);
        updatePressure();
    }
    
    // Nopeusmuunnin
    const speedInput = document.getElementById('speed-input');
    const speedFrom = document.getElementById('speed-from');
    const speedTo = document.getElementById('speed-to-unit');
    const speedResult = document.getElementById('speed-to');
    
    if (speedInput && speedFrom && speedTo && speedResult) {
        const updateSpeed = () => {
            const value = parseFloat(speedInput.value) || 0;
            const fromFactor = parseFloat(speedFrom.value);
            const toFactor = parseFloat(speedTo.value);
            const result = (value * fromFactor) / toFactor;
            speedResult.value = result.toFixed(4).replace(/\.?0+$/, '');
        };
        
        speedInput.addEventListener('input', updateSpeed);
        speedFrom.addEventListener('change', updateSpeed);
        speedTo.addEventListener('change', updateSpeed);
        updateSpeed();
    }
}

// Vanha DOMContentLoaded-tapahtuma säilytetään erillistä sivua varten
document.addEventListener('DOMContentLoaded', async () => {
    
    async function main() {
        let yksikot;
        try {
            const response = await fetch('yksikot.json');
            if (!response.ok) {
                throw new Error(`Verkkovirhe: ${response.statusText}`);
            }
            yksikot = await response.json();
        } catch (error) {
            console.error('Kriittinen virhe: Yksikködatan lataus epäonnistui.', error);
            const container = document.querySelector('.sisalto-laatikko');
            if(container) container.innerHTML = '<h2>Virhe</h2><p>Muuntimien dataa ei voitu ladata. Tarkista, että <code>yksikot.json</code>-tiedosto on olemassa ja oikein muotoiltu.</p>';
            return; 
        }

        const valilehtiContainer = document.querySelector('.valilehdet');
        const valilehtiPaneelit = document.querySelectorAll('.valilehti-paneeli');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        mobileMenuToggle.addEventListener('click', () => valilehtiContainer.classList.toggle('active-menu-class'));

        const vaihdaValilehtea = (kohde) => {
            valilehtiContainer.querySelectorAll('.valilehti-nappi').forEach(nappi => nappi.classList.toggle('aktiivinen', nappi.dataset.valilehti === kohde));
            valilehtiPaneelit.forEach(paneeli => paneeli.classList.toggle('aktiivinen', paneeli.id === kohde));
        };

        valilehtiContainer.addEventListener('click', (e) => {
            const klikattuNappi = e.target.closest('.valilehti-nappi');
            if (klikattuNappi) {
                vaihdaValilehtea(klikattuNappi.dataset.valilehti);
                if (window.innerWidth <= 800) valilehtiContainer.classList.remove('active-menu-class');
            }
        });

        const alustaVakioMuunnin = (id, yksikkoData) => {
            const container = document.getElementById(id);
            if (!container || !yksikkoData) return;
            container.innerHTML = `<div class="yksikko-muunnin">
                <div class="muunnin-ryhma grid-item-arvo"><label for="${id}-arvo">Arvo</label><input type="number" id="${id}-arvo" value="1"></div>
                <div class="muunnin-ryhma grid-item-tulos"><label for="${id}-tulos">Tulos</label><div class="input-wrapper"><input type="text" id="${id}-tulos" readonly><button class="copy-btn" title="Kopioi">📋</button></div></div>
                <div class="muunnin-ryhma grid-item-mista"><label for="${id}-yksikko-mista">Mistä</label><select id="${id}-yksikko-mista"></select></div>
                <button class="swap-btn grid-item-swap" title="Vaihda">↔</button>
                <div class="muunnin-ryhma grid-item-mihin"><label for="${id}-yksikko-mihin">Mihin</label><select id="${id}-yksikko-mihin"></select></div>
            </div>
            <div class="selite-laatikko" id="${id}-selite-mista"></div>
            <div class="selite-laatikko" id="${id}-selite-mihin"></div>`;

            const arvoInput = document.getElementById(`${id}-arvo`), tulosInput = document.getElementById(`${id}-tulos`), mistaSelect = document.getElementById(`${id}-yksikko-mista`), mihinSelect = document.getElementById(`${id}-yksikko-mihin`), swapBtn = container.querySelector('.swap-btn'), copyBtn = container.querySelector('.copy-btn');
            const seliteMista = document.getElementById(`${id}-selite-mista`);
            const seliteMihin = document.getElementById(`${id}-selite-mihin`);
            
            if (yksikkoData.length > 0) {
                 const hasSubTypes = yksikkoData.every(y => y.tyyppi) && new Set(yksikkoData.map(y => y.tyyppi)).size > 1 && !yksikkoData.some(y => y.tyyppi === 'harvinainen');

                [mistaSelect, mihinSelect].forEach(select => {
                    select.innerHTML = '';
                    if (hasSubTypes) {
                        const groups = {};
                        yksikkoData.forEach(y => {
                            if (!groups[y.tyyppi]) { groups[y.tyyppi] = []; }
                            groups[y.tyyppi].push(y);
                        });
                        for (const groupName in groups) {
                            const optgroup = document.createElement('optgroup');
                            optgroup.label = groupName;
                            groups[groupName].sort((a, b) => a.kerroin - b.kerroin).forEach(y => {
                                const option = new Option(`${y.name} (${y.sym})`, y.sym);
                                if (y.selite) { option.title = y.selite; }
                                optgroup.appendChild(option);
                            });
                            select.appendChild(optgroup);
                        }
                    } else {
                        yksikkoData.sort((a, b) => {
                            const aHarvinainen = a.tyyppi === 'harvinainen', bHarvinainen = b.tyyppi === 'harvinainen';
                            if (aHarvinainen && !bHarvinainen) return 1; if (!aHarvinainen && bHarvinainen) return -1;
                            return a.kerroin - b.kerroin;
                        });
                        const yleisetGroup = document.createElement('optgroup'); yleisetGroup.label = 'Yleiset yksiköt';
                        const harvinaisetGroup = document.createElement('optgroup'); harvinaisetGroup.label = 'Harvinaiset / Erikoiset';
                        let onHarvinaisia = false;
                        yksikkoData.forEach(y => {
                            const option = new Option(y.name, y.sym);
                            if (y.selite) { option.title = y.selite; }
                            if (y.tyyppi === 'harvinainen') { harvinaisetGroup.appendChild(option); onHarvinaisia = true; } else { yleisetGroup.appendChild(option); }
                        });
                        select.appendChild(yleisetGroup);
                        if (onHarvinaisia) select.appendChild(harvinaisetGroup);
                    }
                });
                if(mihinSelect.options.length > 1) mihinSelect.selectedIndex = 1;
            }

            const paivitaSelitteet = () => {
                const mistaYksikko = yksikkoData.find(y => y.sym === mistaSelect.value);
                const mihinYksikko = yksikkoData.find(y => y.sym === mihinSelect.value);
                seliteMista.innerHTML = mistaYksikko?.selite ? `<strong>${mistaYksikko.name}:</strong> ${mistaYksikko.selite}` : '';
                seliteMihin.innerHTML = mihinYksikko?.selite ? `<strong>${mihinYksikko.name}:</strong> ${mihinYksikko.selite}` : '';
            };

            const laskeJaPaivita = () => {
                const arvo = parseFloat(arvoInput.value) || 0;
                const mistaKerroin = (yksikkoData.find(y => y.sym === mistaSelect.value) || {}).kerroin || 1;
                const mihinKerroin = (yksikkoData.find(y => y.sym === mihinSelect.value) || {}).kerroin || 1;
                tulosInput.value = (arvo * mistaKerroin / mihinKerroin).toLocaleString('fi-FI', { maximumFractionDigits: 10 });
                paivitaSelitteet();
            };

            swapBtn.addEventListener('click', () => { const temp = mistaSelect.selectedIndex; mistaSelect.selectedIndex = mihinSelect.selectedIndex; mihinSelect.selectedIndex = temp; laskeJaPaivita(); });
            copyBtn.addEventListener('click', () => { navigator.clipboard.writeText(tulosInput.value).then(() => { const originalText = copyBtn.textContent; copyBtn.textContent = '✅'; setTimeout(() => copyBtn.textContent = originalText, 1500); }); });
            [arvoInput, mistaSelect, mihinSelect].forEach(el => el.addEventListener('input', laskeJaPaivita));
            laskeJaPaivita();
        };
        
        const alustaKoordinaattiMuunnin = () => {
            const container = document.getElementById('koordinaatit');
            container.innerHTML = `<div class="muunnin-ryhma"><label for="dd-input">Desimaaliasteet (DD)</label><input type="text" id="dd-input" placeholder="esim. 60.9814, 25.6601"></div><div class="muunnin-ryhma"><label for="ddm-input">Asteet & Desimaaliminuutit (DDM)</label><input type="text" id="ddm-input" placeholder="esim. N 60° 58.884' E 025° 39.606'"></div><div class="muunnin-ryhma"><label for="dms-input">Asteet, Minuutit & Sekunnit (DMS)</label><input type="text" id="dms-input" placeholder="esim. 60°58'53.0&quot;N 25°39'36.4&quot;E"></div>`;
            const ddInput=document.getElementById('dd-input'),ddmInput=document.getElementById('ddm-input'),dmsInput=document.getElementById('dms-input');const paivitaKoordinaatit=(lat,lon,source)=>{if(isNaN(lat)||isNaN(lon))return;if(source!=='dd')ddInput.value=`${lat.toFixed(6)}, ${lon.toFixed(6)}`;if(source!=='ddm')ddmInput.value=muotoileDDM(lat,lon);if(source!=='dms')dmsInput.value=muotoileDMS(lat,lon)};const kasittele=e=>{const coords=parseKoordinaatit(e.target.value);if(coords)paivitaKoordinaatit(coords.lat,coords.lon,e.target.id.split('-')[0])};[ddInput,ddmInput,dmsInput].forEach(input=>input.addEventListener('input',kasittele));const parseKoordinaatit=input=>{input=input.trim().replace(/,/g,' ');const dmsRegex=/(\d{1,3})[°\s]+(\d{1,2})['\s]+([\d\.]+)"?\s*([ns])[\s,]+(\d{1,3})[°\s]+(\d{1,2})['\s]+([\d\.]+)"?\s*([ew])/i;const dmsMatch=input.match(dmsRegex);if(dmsMatch){let lat=parseFloat(dmsMatch[1])+parseFloat(dmsMatch[2])/60+parseFloat(dmsMatch[3])/3600;if(dmsMatch[4].toUpperCase()==='S')lat=-lat;let lon=parseFloat(dmsMatch[5])+parseFloat(dmsMatch[6])/60+parseFloat(dmsMatch[7])/3600;if(dmsMatch[8].toUpperCase()==='W')lon=-lon;if(!isNaN(lat)&&!isNaN(lon))return{lat,lon}}const ddmRegex=/([ns])\s*(\d{1,3})[°\s]+([\d.]+)'?[\s,]*([ew])\s*(\d{1,3})[°\s]+([\d.]+)'?/i;const ddmMatch=input.match(ddmRegex);if(ddmMatch){let lat=parseFloat(ddmMatch[2])+parseFloat(ddmMatch[3])/60;if(ddmMatch[1].toUpperCase()==='S')lat=-lat;let lon=parseFloat(ddmMatch[5])+parseFloat(ddmMatch[6])/60;if(ddmMatch[4].toUpperCase()==='W')lon=-lon;if(!isNaN(lat)&&!isNaN(lon))return{lat,lon}}const parts=input.split(/\s+/).filter(Boolean);if(parts.length===2){const lat=parseFloat(parts[0]),lon=parseFloat(parts[1]);if(!isNaN(lat)&&!isNaN(lon))return{lat,lon}}return null};const muotoileDDM=(lat,lon)=>{const f=(v,h1,h2)=>`${v>=0?h1:h2} ${Math.floor(Math.abs(v))}° ${((Math.abs(v)-Math.floor(Math.abs(v)))*60).toFixed(3)}'`;return`${f(lat,'N','S')} ${f(lon,'E','W')}`};const muotoileDMS=(lat,lon)=>{const f=(v,h1,h2)=>{const deg=Math.floor(Math.abs(v)),min=Math.floor((Math.abs(v)-deg)*60),sec=(((Math.abs(v)-deg)*60-min)*60).toFixed(1);return`${deg}°${min}'${sec}"${v>=0?h1:h2}`};return`${f(lat,'N','S')} ${f(lon,'E','W')}`};
        };

        const alustaPaivamaaraLaskuri = () => {
            const container = document.getElementById('paivamaarat');
            container.innerHTML = `<h4>Laske aikaväli</h4><div class="muunnin-ryhma"><label for="date-start">Alkaa</label><input type="datetime-local" id="date-start"></div><div class="muunnin-ryhma"><label for="date-end">Päättyy</label><input type="datetime-local" id="date-end"></div><div id="date-diff-result" class="tulos-box" style="display: none;"></div><hr style="margin: 30px 0; border-color: var(--color-border);"><h4>Laske päivämäärä</h4><div class="muunnin-ryhma"><label for="calc-date-start">Päivämäärä</label><input type="date" id="calc-date-start"></div><div class="muunnin-ryhma"><label for="calc-days">Päivien lukumäärä (+/-)</label><input type="number" id="calc-days" value="100"></div><div id="calc-date-result" class="tulos-box" style="display: none;"></div>`;
            const dateStart=document.getElementById('date-start'),dateEnd=document.getElementById('date-end'),diffResult=document.getElementById('date-diff-result');const calcDateStart=document.getElementById('calc-date-start'),calcDays=document.getElementById('calc-days'),calcResult=document.getElementById('calc-date-result');function getPreciseDateDiff(d1,d2){let months=(d2.getFullYear()-d1.getFullYear())*12+(d2.getMonth()-d1.getMonth());let tempD1=new Date(d1);tempD1.setMonth(tempD1.getMonth()+months);if(tempD1>d2){months--;tempD1.setMonth(tempD1.getMonth()-1)}const remainingMs=d2-tempD1;const years=Math.floor(months/12);months%=12;const days=Math.floor(remainingMs/864e5);const hours=Math.floor((remainingMs%864e5)/36e5);const minutes=Math.floor((remainingMs%36e5)/6e4);const seconds=Math.floor((remainingMs%6e4)/1000);return{years,months,days,hours,minutes,seconds}}const calculateDiff=()=>{if(dateStart.value&&dateEnd.value){const start=new Date(dateStart.value);const end=new Date(dateEnd.value);if(start>=end){diffResult.innerHTML="Loppupäivän on oltava alkupäivän jälkeen.";diffResult.style.display='block';return}const breakdown=getPreciseDateDiff(start,end);const totalMs=end-start;const totalDays=totalMs/864e5;const totalHours=totalMs/36e5;const totalMinutes=totalMs/6e4;const totalSeconds=totalMs/1000;let breakdownHtml=`<strong>Tarkka erotus:</strong> ${breakdown.years}v, ${breakdown.months}kk, ${breakdown.days}pv, ${breakdown.hours}h, ${breakdown.minutes}min, ${breakdown.seconds}s`;let totalsHtml=`<hr style="border-color: var(--color-border); margin: 10px 0;"><p style="margin: 5px 0;"><strong>Yhteensä päivinä:</strong> ${totalDays.toLocaleString('fi-FI',{maximumFractionDigits:2})}</p><p style="margin: 5px 0;"><strong>Yhteensä tunteina:</strong> ${totalHours.toLocaleString('fi-FI',{maximumFractionDigits:2})}</p><p style="margin: 5px 0;"><strong>Yhteensä minuutteina:</strong> ${totalMinutes.toLocaleString('fi-FI',{maximumFractionDigits:0})}</p><p style="margin: 5px 0;"><strong>Yhteensä sekunteina:</strong> ${totalSeconds.toLocaleString('fi-FI',{maximumFractionDigits:0})}</p>`;diffResult.innerHTML=breakdownHtml+totalsHtml;diffResult.style.display='block'}};const calculateDate=()=>{if(calcDateStart.value&&calcDays.value){const start=new Date(calcDateStart.value),days=parseInt(calcDays.value,10);start.setDate(start.getDate()+days);calcResult.textContent=`Tulos: ${start.toLocaleDateString('fi-FI')}`;calcResult.style.display='block'}};[dateStart,dateEnd].forEach(el=>el.addEventListener('input',calculateDiff));[calcDateStart,calcDays].forEach(el=>el.addEventListener('input',calculateDate));
        };

        const alustaTekstiMuunnin = () => {
            const container = document.getElementById('teksti');
            container.innerHTML = `<div class="muunnin-ryhma"><label for="teksti-tyyppi">Muunnos</label><select id="teksti-tyyppi"><option value="a1z26">A1Z26</option><option value="rot13">ROT13</option><option value="atbash">Atbash</option><option value="phonepad">Puhelinnäppäimistö</option><option value="base64">Base64</option><option value="morse">Morse-koodi</option><option value="binary">Teksti ↔ Binääri (ASCII)</option><option value="hex">Teksti ↔ Heksa (ASCII)</option><option value="vigenere">Vigenère-salakirjoitus</option></select></div><div id="vigenere-key-wrapper" class="muunnin-ryhma" style="display:none;"><label for="vigenere-key">Avainsana</label><input type="text" id="vigenere-key"></div><div class="muunnin-ryhma"><label>Selkokieli</label><textarea id="teksti-input" rows="4"></textarea></div><div style="text-align: center; margin-bottom: 15px;"><button class="swap-btn" id="teksti-swap" title="Vaihda suunta">↑↓</button></div><div class="muunnin-ryhma"><label>Salakieli</label><textarea id="teksti-output" rows="4"></textarea></div>`;
            const elements={input:document.getElementById('teksti-input'),output:document.getElementById('teksti-output'),type:document.getElementById('teksti-tyyppi'),swap:document.getElementById('teksti-swap'),vigenereWrapper:document.getElementById('vigenere-key-wrapper'),vigenereKey:document.getElementById('vigenere-key')};const morseMap={'a':'.-','b':'-...','c':'-.-.','d':'-..','e':'.','f':'..-.','g':'--.','h':'....','i':'..','j':'.---','k':'-.-','l':'.-..','m':'--','n':'-.','o':'---','p':'.--.','q':'--.-','r':'.-.','s':'...','t':'-','u':'..-','v':'...-','w':'.--','x':'-..-','y':'-.--','z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};const revMorseMap=Object.fromEntries(Object.entries(morseMap).map(a=>a.reverse()));const phoneMap={'a':'2','b':'22','c':'222','d':'3','e':'33','f':'333','g':'4','h':'44','i':'444','j':'5','k':'55','l':'555','m':'6','n':'66','o':'666','p':'7','q':'77','r':'777','s':'7777','t':'8','u':'88','v':'888','w':'9','x':'99','y':'999','z':'9999',' ':'0'};const revPhoneMap=Object.fromEntries(Object.entries(phoneMap).map(a=>a.reverse()));const fns={a1z26:{e:s=>s.toLowerCase().split('').map(c=>(c>='a'&&c<='z')?c.charCodeAt(0)-96:c).join(' '),d:s=>s.split(' ').map(n=>(n>0&&n<27)?String.fromCharCode(parseInt(n)+96):n).join('')},rot13:{e:s=>s.replace(/[a-zA-Z]/g,c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<'n'?13:-13)))},atbash:{e:s=>s.replace(/[a-zA-Z]/g,c=>{const base=c<='Z'?'A'.charCodeAt(0):'a'.charCodeAt(0);return String.fromCharCode(base*2+25-c.charCodeAt(0));})},phonepad:{e:s=>s.toLowerCase().split('').map(c=>phoneMap[c]||c).join(' '),d:s=>s.split(' ').map(c=>revPhoneMap[c]||c).join('')},base64:{e:s=>btoa(unescape(encodeURIComponent(s))),d:s=>{try{return decodeURIComponent(escape(atob(s)))}catch(e){return"Virheellinen Base64"}}},morse:{e:s=>s.toLowerCase().split('').map(c=>morseMap[c]||'').join(' '),d:s=>s.split(' ').map(c=>revMorseMap[c]||'').join('')},binary:{e:s=>s.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '),d:s=>s.split(/[\s\r\n]+/).filter(Boolean).map(b=>String.fromCharCode(parseInt(b,2))).join('')},hex:{e:s=>s.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase()).join(' '),d:s=>s.replace(/[\s\r\n]+/g,'').split(/(..)/).filter(Boolean).map(h=>String.fromCharCode(parseInt(h,16))).join('')},vigenere:{run:(str,key,decode)=>{if(!key)return"Avainsana puuttuu.";key=key.toLowerCase().replace(/[^a-z]/g,'');if(!key)return"Avainsana virheellinen.";let keyIndex=0;let result='';for(let i=0;i<str.length;i++){const charCode=str.charCodeAt(i);if(charCode>=65&&charCode<=90){const keyShift=key.charCodeAt(keyIndex%key.length)-97;const shift=decode?(26-keyShift):keyShift;result+=String.fromCharCode(((charCode-65+shift)%26)+65);keyIndex++}else if(charCode>=97&&charCode<=122){const keyShift=key.charCodeAt(keyIndex%key.length)-97;const shift=decode?(26-keyShift):keyShift;result+=String.fromCharCode(((charCode-97+shift)%26)+97);keyIndex++}else{result+=str[i]}}return result}}};fns.rot13.d=fns.rot13.e;fns.atbash.d=fns.atbash.e;fns.vigenere.e=(s,k)=>fns.vigenere.run(s,k,false);fns.vigenere.d=(s,k)=>fns.vigenere.run(s,k,true);let currentDirection='e';const muunna=()=>{const typeVal=elements.type.value;elements.vigenereWrapper.style.display=typeVal==='vigenere'?'block':'none';const fn=fns[typeVal];const key=elements.vigenereKey.value;if(currentDirection==='e'){elements.output.value=fn.e?fn.e(elements.input.value,key):'Suunta ei tuettu'}else{elements.input.value=fn.d?fn.d(elements.output.value,key):'Suunta ei tuettu'}};elements.input.addEventListener('input',()=>{currentDirection='e';muunna()});elements.output.addEventListener('input',()=>{currentDirection='d';muunna()});elements.type.addEventListener('change',muunna);elements.vigenereKey.addEventListener('input',muunna);elements.swap.addEventListener('click',()=>{const temp=elements.input.value;elements.input.value=elements.output.value;elements.output.value=temp;muunna()});
        };

        const alustaTypografiaMuunnin = () => {
            const id = 'typografia'; const container = document.getElementById(id);
            container.innerHTML = `<div class="yksikko-muunnin"><div class="muunnin-ryhma grid-item-arvo" style="grid-column: 1 / -1;"><label for="typo-base">Perusfonttikoko (px)</label><input type="number" id="typo-base" value="16" style="max-width: 150px;"></div><div class="muunnin-ryhma grid-item-arvo"><label for="typografia-arvo">Arvo</label><input type="number" id="typografia-arvo" value="1"></div><div class="muunnin-ryhma grid-item-tulos"><label for="typografia-tulos">Tulos</label><div class="input-wrapper"><input type="text" id="typografia-tulos" readonly><button class="copy-btn" title="Kopioi">📋</button></div></div><div class="muunnin-ryhma grid-item-mista"><label for="typografia-yksikko-mista">Mistä</label><select id="typografia-yksikko-mista"></select></div><button class="swap-btn grid-item-swap" title="Vaihda">↔</button><div class="muunnin-ryhma grid-item-mihin"><label for="typografia-yksikko-mihin">Mihin</label><select id="typografia-yksikko-mihin"></select></div></div>`;
            const arvoInput=document.getElementById(`typografia-arvo`),tulosInput=document.getElementById(`typografia-tulos`),mistaSelect=document.getElementById(`typografia-yksikko-mista`),mihinSelect=document.getElementById(`typografia-yksikko-mihin`),baseInput=document.getElementById('typo-base'),swapBtn=container.querySelector('.swap-btn'),copyBtn=container.querySelector('.copy-btn');
            const typoYksikot = yksikot.typografia;
            [mistaSelect, mihinSelect].forEach(select => {
                typoYksikot.forEach(u => {
                    const option = new Option(u.name, u.sym);
                    if (u.selite) option.title = u.selite;
                    select.add(option);
                });
            });
            mihinSelect.selectedIndex=1;
            const laske=()=>{
                const baseSize=parseFloat(baseInput.value)||16;
                let arvo=parseFloat(arvoInput.value)||0;
                switch(mistaSelect.value){
                    case 'pt': arvo = arvo * 4 / 3; break;
                    case 'em': case 'rem': arvo = arvo * baseSize; break;
                    case 'cic': arvo = arvo * 17.1; break;
                }
                let tulos;
                switch(mihinSelect.value){
                    case 'px': tulos=arvo; break;
                    case 'pt': tulos=arvo * 3 / 4; break;
                    case 'em': case 'rem': tulos = arvo / baseSize; break;
                    case 'cic': tulos = arvo / 17.1; break;
                    default: tulos=arvo;
                }
                tulosInput.value=tulos.toLocaleString('fi-FI',{maximumFractionDigits:3})
            };
            swapBtn.addEventListener('click',()=>{const temp=mistaSelect.selectedIndex;mistaSelect.selectedIndex=mihinSelect.selectedIndex;mihinSelect.selectedIndex=temp;laske()});
            copyBtn.addEventListener('click',()=>{navigator.clipboard.writeText(tulosInput.value).then(()=>{const originalText=copyBtn.textContent;copyBtn.textContent='✅';setTimeout(()=>copyBtn.textContent=originalText,1500)})});
            [arvoInput,mistaSelect,mihinSelect,baseInput].forEach(el=>el.addEventListener('input',laske));
            laske();
        };
        
        const alustaAikaMuunnin = () => {
            const container = document.getElementById('aika');
            container.innerHTML = `<div class="muunnin-ryhma"><label for="aika-arvo">Arvo</label><input type="number" id="aika-arvo" value="1"></div><div class="muunnin-ryhma"><label for="aika-yksikko-mista">Yksikkö</label><select id="aika-yksikko-mista"></select></div><div id="aika-tulokset" class="tulos-box"></div>`;
            const arvoInput=document.getElementById('aika-arvo'),yksikkoSelect=document.getElementById('aika-yksikko-mista'),tuloksetDiv=document.getElementById('aika-tulokset');yksikot.aika.forEach(y=>yksikkoSelect.add(new Option(`${y.plural||y.name} (${y.sym})`,y.sym)));yksikkoSelect.value='h';const laske=()=>{const arvo=parseFloat(arvoInput.value)||0;const mistaKerroin=yksikot.aika.find(y=>y.sym===yksikkoSelect.value)?.kerroin||1;const sekunteina=arvo*mistaKerroin;const d=Math.floor(sekunteina/86400),h=Math.floor((sekunteina%86400)/3600),m=Math.floor((sekunteina%3600)/60),s=sekunteina%60;let html=`<p style="margin: 5px 0;"><strong>Yhteensä:</strong> ${d} pv, ${h} h, ${m} min ja ${s.toFixed(1)} s</p><hr style="border-color: var(--color-border); margin: 10px 0;">`;yksikot.aika.slice().reverse().forEach(y=>{html+=`<p style="margin: 5px 0;"><strong>${y.plural||y.name}:</strong> ${(sekunteina/y.kerroin).toLocaleString('fi-FI',{maximumFractionDigits:4})} ${y.sym}</p>`});tuloksetDiv.innerHTML=html};[arvoInput,yksikkoSelect].forEach(el=>el.addEventListener('input',laske));laske();
        };

        const alustaLampotilaMuunnin = () => {
            const id = 'lampotila';
            alustaVakioMuunnin(id, []); // Käytetään tätä luomaan perus-HTML
            const arvoInput = document.getElementById(`${id}-arvo`), tulosInput = document.getElementById(`${id}-tulos`), mistaSelect = document.getElementById(`${id}-yksikko-mista`), mihinSelect = document.getElementById(`${id}-yksikko-mihin`);
            
            const units = [
                { sym: 'C', name: 'Celsius' },
                { sym: 'F', name: 'Fahrenheit' },
                { sym: 'K', name: 'Kelvin' },
                { sym: 'R', name: 'Rankine' },
                { sym: 'Re', name: 'Réaumur' }
            ];

            // Täytä select-kentät
            [mistaSelect, mihinSelect].forEach(select => {
                select.innerHTML = '';
                units.forEach(u => select.add(new Option(u.name, u.sym)));
            });
            mihinSelect.value = 'F';

            const muunnokset = {
                'C': { toBase: c => c, fromBase: c => c },
                'F': { toBase: f => (f - 32) * 5 / 9, fromBase: c => c * 9 / 5 + 32 },
                'K': { toBase: k => k - 273.15, fromBase: c => c + 273.15 },
                'R': { toBase: r => (r - 491.67) * 5 / 9, fromBase: c => (c + 273.15) * 9 / 5 },
                'Re': { toBase: re => re * 1.25, fromBase: c => c * 0.8 }
            };

            const laske = () => {
                const arvo = parseFloat(arvoInput.value) || 0;
                const mista = mistaSelect.value;
                const mihin = mihinSelect.value;
                if (!muunnokset[mista] || !muunnokset[mihin]) return;

                const arvoCelsius = muunnokset[mista].toBase(arvo);
                const tulos = muunnokset[mihin].fromBase(arvoCelsius);
                
                tulosInput.value = tulos.toLocaleString('fi-FI', { maximumFractionDigits: 2 });
            };

            [arvoInput, mistaSelect, mihinSelect].forEach(el => el.addEventListener('input', laske));
            laske();
        };

        const alustaPolttoaineMuunnin = () => {
            const id = 'polttoaine';
            alustaVakioMuunnin(id, []);
            const arvoInput=document.getElementById(`${id}-arvo`),tulosInput=document.getElementById(`${id}-tulos`),mistaSelect=document.getElementById(`${id}-yksikko-mista`),mihinSelect=document.getElementById(`${id}-yksikko-mihin`);
            mistaSelect.innerHTML='';mihinSelect.innerHTML='';
            const units=[{sym:'l100km',name:'L/100km'},{sym:'mpg_us',name:'MPG (US)'},{sym:'mpg_uk',name:'MPG (UK)'}];
            units.forEach(u=>{mistaSelect.add(new Option(u.name,u.sym));mihinSelect.add(new Option(u.name,u.sym))});
            mihinSelect.selectedIndex=1;
            const laske=()=>{const arvo=parseFloat(arvoInput.value);if(isNaN(arvo)||arvo===0){tulosInput.value='0';return}const mista=mistaSelect.value,mihin=mihinSelect.value;let tulos;if(mista===mihin)tulos=arvo;else if(mista==='l100km'){if(mihin==='mpg_us')tulos=235.214/arvo;else tulos=282.481/arvo}else if(mista==='mpg_us'){if(mihin==='l100km')tulos=235.214/arvo;else tulos=arvo*1.20095}else{if(mihin==='l100km')tulos=282.481/arvo;else tulos=arvo/1.20095}tulosInput.value=tulos.toLocaleString('fi-FI',{maximumFractionDigits:2})};
            [arvoInput,mistaSelect,mihinSelect].forEach(el=>el.addEventListener('input',laske));
            laske();
        };

        const alustaRoomalainenMuunnin = () => {
            const container = document.getElementById('roomalaiset');
            container.innerHTML = `<div class="yksikko-muunnin"><div class="muunnin-ryhma grid-item-arvo"><label for="rooma-arabialainen">Numero</label><input type="number" id="rooma-arabialainen" placeholder="esim. 1984"></div><button class="swap-btn grid-item-swap" title="Vaihda">↔</button><div class="muunnin-ryhma grid-item-tulos"><label for="rooma-roomalainen">Roomalainen numero</label><input type="text" id="rooma-roomalainen" placeholder="esim. MCMLXXXIV"></div></div>`;
            const arabInput=document.getElementById('rooma-arabialainen'),roomaInput=document.getElementById('rooma-roomalainen');const arabToRoman=num=>{if(isNaN(num)||num<1||num>3999)return'';const map={M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};let r='';for(let k in map){while(num>=map[k]){r+=k;num-=map[k]}}return r};const romanToArab=str=>{str=str.toUpperCase();const map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let r=0;for(let i=0;i<str.length;i++){const c=map[str[i]],n=map[str[i+1]];if(n&&c<n)r-=c;else r+=c}return isNaN(r)||r>3999?'':r};arabInput.addEventListener('input',()=>roomaInput.value=arabToRoman(parseInt(arabInput.value,10)));roomaInput.addEventListener('input',()=>arabInput.value=romanToArab(roomaInput.value));
        };

        const alustaLukujarjestelmaMuunnin = () => {
            const container = document.getElementById('luvut');
            container.innerHTML = `<div class="muunnin-ryhma"><label for="luku-dec">Desimaali (10)</label><input type="text" id="luku-dec" placeholder="esim. 42"></div><div class="muunnin-ryhma"><label for="luku-bin">Binääri (2)</label><input type="text" id="luku-bin" placeholder="esim. 101010"></div><div class="muunnin-ryhma"><label for="luku-oct">Oktaali (8)</label><input type="text" id="luku-oct" placeholder="esim. 52"></div><div class="muunnin-ryhma"><label for="luku-hex">Heksadesimaali (16)</label><input type="text" id="luku-hex" placeholder="esim. 2A"></div>`;
            const inputs={dec:10,bin:2,oct:8,hex:16};Object.keys(inputs).forEach(key=>{document.getElementById(`luku-${key}`).addEventListener('input',e=>{const arvo=e.target.value;const pohja=inputs[key];if(arvo===''){Object.keys(inputs).forEach(otherKey=>{document.getElementById(`luku-${otherKey}`).value=''});return}const desimaaliArvo=parseInt(arvo,pohja);if(isNaN(desimaaliArvo))return;Object.keys(inputs).forEach(otherKey=>{if(key!==otherKey)document.getElementById(`luku-${otherKey}`).value=desimaaliArvo.toString(inputs[otherKey]).toUpperCase()})})});
        };

        const alustaRuoanlaittoMuunnin = () => {
            const id = 'ruoanlaitto';
            const container = document.getElementById(id);
            if (!container) return;
            container.innerHTML = `<div class="muunnin-ryhma"><label for="${id}-ainesosa">Ainesosa</label><select id="${id}-ainesosa"></select></div>
                <div class="yksikko-muunnin" style="grid-template-columns: 1fr 1fr;">
                    <div class="muunnin-ryhma" style="grid-column: 1;"><label for="${id}-dl">Tilavuus (dl)</label><input type="number" id="${id}-dl" value="1"></div>
                    <div class="muunnin-ryhma" style="grid-column: 2;"><label for="${id}-g">Paino (g)</label><input type="number" id="${id}-g"></div>
                </div>`;
            const ainesosaSelect = document.getElementById(`${id}-ainesosa`), dlInput = document.getElementById(`${id}-dl`), gInput = document.getElementById(`${id}-g`);
            yksikot.ruoanlaitto.forEach((item, index) => ainesosaSelect.add(new Option(item.name, index)));
            const laske = (source) => {
                const ainesosa = yksikot.ruoanlaitto[ainesosaSelect.value];
                if (!ainesosa) return;
                if (source === 'dl') {
                    const dl = parseFloat(dlInput.value) || 0;
                    gInput.value = (dl * ainesosa.g_per_dl).toFixed(1);
                } else {
                    const g = parseFloat(gInput.value) || 0;
                    dlInput.value = (g / ainesosa.g_per_dl).toFixed(2);
                }
            };
            [dlInput, ainesosaSelect].forEach(el => el.addEventListener('input', () => laske('dl')));
            gInput.addEventListener('input', () => laske('g'));
            laske('dl');
        };

        const alustaVerensokeriMuunnin = () => {
            const id = 'verensokeri';
            const container = document.getElementById(id);
            if (!container) return;
            container.innerHTML = `<div class="yksikko-muunnin" style="grid-template-columns: 1fr 1fr;">
                <div class="muunnin-ryhma" style="grid-column: 1;"><label for="sokeri-mmol">mmol/L</label><input type="number" id="sokeri-mmol"></div>
                <div class="muunnin-ryhma" style="grid-column: 2;"><label for="sokeri-mgdl">mg/dL</label><input type="number" id="sokeri-mgdl"></div>
            </div>`;
            const mmolInput = document.getElementById('sokeri-mmol'), mgdlInput = document.getElementById('sokeri-mgdl'), KERROIN = 18.018;
            mmolInput.addEventListener('input', () => {
                const arvo = parseFloat(mmolInput.value);
                mgdlInput.value = isNaN(arvo) ? '' : (arvo * KERROIN).toFixed(1);
            });
            mgdlInput.addEventListener('input', () => {
                const arvo = parseFloat(mgdlInput.value);
                mmolInput.value = isNaN(arvo) ? '' : (arvo / KERROIN).toFixed(1);
            });
        };

        const alustaBmiLaskuri = () => {
            const id = 'bmi';
            const container = document.getElementById(id);
            if (!container) return;
            container.innerHTML = `<div class="yksikko-muunnin" style="grid-template-columns: 1fr 1fr;">
                <div class="muunnin-ryhma" style="grid-column: 1;"><label for="bmi-pituus">Pituus (cm)</label><input type="number" id="bmi-pituus"></div>
                <div class="muunnin-ryhma" style="grid-column: 2;"><label for="bmi-paino">Paino (kg)</label><input type="number" id="bmi-paino"></div>
            </div>
            <div id="bmi-tulos" class="bmi-result-box" style="display: none;"></div>`;
            const pituusInput = document.getElementById('bmi-pituus'), painoInput = document.getElementById('bmi-paino'), tulosBox = document.getElementById('bmi-tulos');
            const laske = () => {
                const pituus = parseFloat(pituusInput.value), paino = parseFloat(painoInput.value);
                if (isNaN(pituus) || isNaN(paino) || pituus <= 0 || paino <= 0) {
                    tulosBox.style.display = 'none'; return;
                }
                const pituusM = pituus / 100;
                const bmi = paino / (pituusM * pituusM);
                let selite, color;
                if (bmi < 18.5) { selite = "Merkittävä alipaino"; color = "#0d6efd"; }
                else if (bmi < 25) { selite = "Normaali paino"; color = "#90EE90"; }
                else if (bmi < 30) { selite = "Lievä ylipaino"; color = "#FFD700"; }
                else { selite = "Merkittävä ylipaino"; color = "#dc3545"; }
                tulosBox.innerHTML = `${bmi.toFixed(1)} <span>${selite}</span>`;
                tulosBox.style.backgroundColor = color;
                tulosBox.style.color = (bmi >= 18.5 && bmi < 30) ? 'var(--color-bg)' : 'var(--color-text-primary)';
                tulosBox.style.display = 'block';
            };
            [pituusInput, painoInput].forEach(el => el.addEventListener('input', laske));
        };

        const alustaYksikkoSanasto = () => {
            const container = document.getElementById('yksikkosanasto');
            if (!container) return;
            
            const kategoriat = {
                pituus: 'Pituus', massa: 'Massa', apteekkari_massa: 'Massa (Apteekkarin mitat)',
                voima: 'Voima', pinta_ala: 'Pinta-ala', tilavuus: 'Tilavuus', nopeus: 'Nopeus', aika: 'Aika', data: 'Data',
                paine: 'Paine', energia: 'Energia', teho: 'Teho', kulma: 'Kulma', sahko: 'Sähkö', sateily: 'Säteily',
                valo: 'Valo ja Valaistus'
            };

            let html = `<input type="text" id="sanasto-haku" placeholder="Hae yksiköitä nimellä tai lyhenteellä...">`;
            html += '<div id="sanasto-lista">';

            for (const avain in kategoriat) {
                if (yksikot[avain] && yksikot[avain].length > 0) {
                    html += `<div class="yksikko-lista-osio"><h3>${kategoriat[avain]}</h3><ul>`;
                    const sortedUnits = [...yksikot[avain]].sort((a,b) => (a.name > b.name) ? 1 : -1);
                    sortedUnits.forEach(y => {
                        html += `<li data-nimi="${y.name.toLowerCase()} ${y.sym?.toLowerCase()}"><strong>${y.name} (${y.sym || '–'})</strong><span>${y.selite || 'Ei selitettä.'}</span></li>`;
                    });
                    html += '</ul></div>';
                }
            }
            html += '</div>';
            container.innerHTML = html;

            const hakuInput = document.getElementById('sanasto-haku');
            const listanOsat = container.querySelectorAll('#sanasto-lista li');
            hakuInput.addEventListener('input', (e) => {
                const hakusana = e.target.value.toLowerCase();
                listanOsat.forEach(li => {
                    const onOsuma = li.dataset.nimi.includes(hakusana);
                    li.style.display = onOsuma ? '' : 'none';
                });
            });
        };
        
        const alustaProsenttiLaskuri = () => {
            const container = document.getElementById('prosentti');
            if (!container) return;
            container.innerHTML = `
                <div class="muunnin-ryhma" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label for="prosentti-tyyppi">Laskentatapa</label>
                        <select id="prosentti-tyyppi">
                            <option value="lisays">Lisäys (esim. ALV)</option>
                            <option value="alennus">Alennus</option>
                        </select>
                    </div>
                    <div>
                        <label for="prosentti-kanta">Prosentti (%)</label>
                        <input type="number" id="prosentti-kanta" value="25.5" step="0.1">
                    </div>
                </div>
                <div class="muunnin-ryhma" style="margin-top: 20px;">
                    <label for="prosentti-alkuperainen">Alkuperäinen hinta</label>
                    <input type="number" id="prosentti-alkuperainen" placeholder="100.00">
                </div>
                <div class="muunnin-ryhma">
                    <label for="prosentti-loppuhinta">Loppuhinta</label>
                    <input type="number" id="prosentti-loppuhinta" placeholder="125.50">
                </div>
                <div class="tulos-box" style="margin-top: 20px;">
                    <strong>Muutoksen (alennus/vero) määrä:</strong> <span id="prosentti-erotus">25.50</span> €
                </div>
            `;

            const tyyppiSelect = document.getElementById('prosentti-tyyppi');
            const kantaInput = document.getElementById('prosentti-kanta');
            const alkuperainenInput = document.getElementById('prosentti-alkuperainen');
            const loppuInput = document.getElementById('prosentti-loppuhinta');
            const erotusSpan = document.getElementById('prosentti-erotus');

            const laske = (muutoksenLahde) => {
                const onLisays = tyyppiSelect.value === 'lisays';
                const kanta = parseFloat(kantaInput.value) / 100 || 0;
                let alku = parseFloat(alkuperainenInput.value) || 0;
                let loppu = parseFloat(loppuInput.value) || 0;

                if (muutoksenLahde === 'alkuperainen') {
                    if (alku > 0) {
                        loppu = onLisays ? alku * (1 + kanta) : alku * (1 - kanta);
                        loppuInput.value = loppu.toFixed(2);
                    } else {
                        loppuInput.value = '';
                        loppu = 0;
                    }
                } else {
                    if (loppu > 0) {
                         alku = onLisays ? loppu / (1 + kanta) : loppu / (1 - kanta);
                         alkuperainenInput.value = alku.toFixed(2);
                    } else {
                        alkuperainenInput.value = '';
                        alku = 0;
                    }
                }
                
                const erotus = Math.abs(loppu - alku);
                erotusSpan.textContent = erotus.toFixed(2);
            };

            [tyyppiSelect, kantaInput].forEach(el => el.addEventListener('input', () => laske(alkuperainenInput.value ? 'alkuperainen' : 'loppuhinta')));
            alkuperainenInput.addEventListener('input', () => laske('alkuperainen'));
            loppuInput.addEventListener('input', () => laske('loppuhinta'));
            
            laske('loppuhinta');
        };
        
        const alustaKaloriLaskuri = () => {
            const container = document.getElementById('kalorit');
            if(!container) return;
            container.innerHTML = `
                <div class="yksikko-muunnin" style="grid-template-columns: 1fr 1fr; gap: 15px;">
                     <div class="muunnin-ryhma">
                        <label for="kalori-ika">Ikä (vuosia)</label>
                        <input type="number" id="kalori-ika" value="30">
                    </div>
                    <div class="muunnin-ryhma">
                        <label for="kalori-sukupuoli">Sukupuoli</label>
                        <select id="kalori-sukupuoli">
                            <option value="mies">Mies</option>
                            <option value="nainen">Nainen</option>
                        </select>
                    </div>
                    <div class="muunnin-ryhma">
                        <label for="kalori-pituus">Pituus (cm)</label>
                        <input type="number" id="kalori-pituus" value="180">
                    </div>
                    <div class="muunnin-ryhma">
                        <label for="kalori-paino">Paino (kg)</label>
                        <input type="number" id="kalori-paino" value="80">
                    </div>
                </div>
                 <div class="muunnin-ryhma" style="margin-top: 15px;">
                    <label for="kalori-aktiivisuus">Aktiivisuustaso</label>
                    <select id="kalori-aktiivisuus">
                        <option value="1.2">Kevyt (vähän tai ei lainkaan liikuntaa)</option>
                        <option value="1.375">Kohtalainen (1-3 kertaa viikossa)</option>
                        <option value="1.55">Aktiivinen (3-5 kertaa viikossa)</option>
                        <option value="1.725">Erittäin aktiivinen (6-7 kertaa viikossa)</option>
                        <option value="1.9">Huippu-aktiivinen (raskas työ/harjoittelu)</option>
                    </select>
                </div>
                <div id="kalori-tulos" class="tulos-box" style="margin-top: 20px; display: none;"></div>
            `;
            const ikaInput = document.getElementById('kalori-ika'), spSelect = document.getElementById('kalori-sukupuoli'), pituusInput = document.getElementById('kalori-pituus'), painoInput = document.getElementById('kalori-paino'), aktiivisuusSelect = document.getElementById('kalori-aktiivisuus'), tulosBox = document.getElementById('kalori-tulos');
            const laskeKalorit = () => {
                const ika = parseInt(ikaInput.value), pituus = parseInt(pituusInput.value), paino = parseInt(painoInput.value), onMies = spSelect.value === 'mies', kerroin = parseFloat(aktiivisuusSelect.value);
                if(!ika || !pituus || !paino) { tulosBox.style.display = 'none'; return; }
                let bmr = (10 * paino) + (6.25 * pituus) - (5 * ika);
                bmr += onMies ? 5 : -161;
                const tdee = bmr * kerroin;
                tulosBox.innerHTML = `<p style="margin: 5px 0;"><strong>Perusaineenvaihdunta (BMR):</strong> ${bmr.toFixed(0)} kcal/vrk</p><p style="margin: 5px 0;"><strong>Kokonaiskulutus (TDEE):</strong> ${tdee.toFixed(0)} kcal/vrk</p><div class="selite-laatikko" style="margin-top: 10px; font-size: 0.8em;">BMR on energiamäärä, jonka keho kuluttaa levossa. TDEE arvioi kokonaiskulutuksen aktiivisuustaso huomioiden.</div>`;
                tulosBox.style.display = 'block';
            };
            [ikaInput, spSelect, pituusInput, painoInput, aktiivisuusSelect].forEach(el => el.addEventListener('input', laskeKalorit));
            laskeKalorit();
        };

        const alustaVariMuunnin = () => {
            const container = document.getElementById('varit');
            if(!container) return;
            container.innerHTML = `<div class="yksikko-muunnin" style="grid-template-columns: 100px 1fr; gap: 15px;"><div id="vari-esikatselu" style="width: 100px; height: 100px; border-radius: 8px; border: 1px solid var(--color-border); background-color: #90EE90; grid-row: 1 / 4;"></div><div class="muunnin-ryhma"><label for="vari-hex">HEX</label><input type="text" id="vari-hex" value="#90EE90"></div><div class="muunnin-ryhma"><label for="vari-rgb">RGB</label><input type="text" id="vari-rgb" value="rgb(144, 238, 144)"></div><div class="muunnin-ryhma"><label for="vari-hsl">HSL</label><input type="text" id="vari-hsl" value="hsl(120, 73%, 75%)"></div></div>`;
            const hexInput = document.getElementById('vari-hex'), rgbInput = document.getElementById('vari-rgb'), hslInput = document.getElementById('vari-hsl'), preview = document.getElementById('vari-esikatselu');
            let lastValidColor = '#90EE90';
            const updateColors = (source, value) => {
                let r, g, b;
                try {
                    if (source === 'hex') {
                        const hex = value.startsWith('#') ? value : '#' + value;
                        if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex) && !/^#([A-Fa-f0-9]{6})$/.test(hex)) throw new Error('Invalid HEX');
                        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
                        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
                        r = parseInt(result[1], 16); g = parseInt(result[2], 16); b = parseInt(result[3], 16);
                    } else if (source === 'rgb') {
                        const match = value.match(/(\d+),\s*(\d+),\s*(\d+)/);
                        if (!match) throw new Error('Invalid RGB');
                        [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
                        if (r > 255 || g > 255 || b > 255) throw new Error('Invalid RGB');
                    } else if (source === 'hsl') {
                         let [h, s, l] = value.match(/(\d+),\s*(\d+)%?,\s*(\d+)%?/).slice(1).map(Number);
                         s /= 100; l /= 100;
                         if (h > 360 || s > 1 || l > 1) throw new Error('Invalid HSL');
                         let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c/2, rp, gp, bp;
                         if (0<=h&&h<60) {[rp,gp,bp]=[c,x,0]} else if (60<=h&&h<120) {[rp,gp,bp]=[x,c,0]} else if (120<=h&&h<180){[rp,gp,bp]=[0,c,x]} else if (180<=h&&h<240){[rp,gp,bp]=[0,x,c]} else if (240<=h&&h<300){[rp,gp,bp]=[x,0,c]} else {[rp,gp,bp]=[c,0,x]};
                         [r,g,b] = [Math.round((rp+m)*255), Math.round((gp+m)*255), Math.round((bp+m)*255)];
                    }
                    if (source !== 'hex') hexInput.value = `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1).toUpperCase()}`;
                    if (source !== 'rgb') rgbInput.value = `rgb(${r}, ${g}, ${b})`;
                    if (source !== 'hsl') {
                        const r_norm = r/255, g_norm = g/255, b_norm = b/255;
                        const cmax = Math.max(r_norm, g_norm, b_norm), cmin = Math.min(r_norm, g_norm, b_norm);
                        const delta = cmax - cmin;
                        let h = delta === 0 ? 0 : 60 * (cmax === r_norm ? ((g_norm - b_norm) / delta) % 6 : (cmax === g_norm ? (b_norm - r_norm) / delta + 2 : (r_norm - g_norm) / delta + 4));
                        h = Math.round(h < 0 ? h + 360 : h);
                        let l = (cmax + cmin) / 2;
                        let s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
                        hslInput.value = `hsl(${h}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
                    }
                    lastValidColor = hexInput.value;
                    preview.style.backgroundColor = lastValidColor;
                } catch (e) { preview.style.backgroundColor = lastValidColor; }
            };
            hexInput.addEventListener('input', () => updateColors('hex', hexInput.value));
            rgbInput.addEventListener('input', () => updateColors('rgb', rgbInput.value));
            hslInput.addEventListener('input', () => updateColors('hsl', hslInput.value));
        };
        
        const alustaNumeroTyokalut = () => {
            const container = document.getElementById('numerot');
            if(!container) return;
            container.innerHTML = `<h4>Alkuluvut</h4><div class="muunnin-ryhma"><label for="alkuluku-syote">Testattava luku / Yläraja</label><input type="number" id="alkuluku-syote" value="100"></div><div id="alkuluku-tulos" class="tulos-box" style="margin-top:10px;"></div><hr style="margin: 30px 0; border-color: var(--color-border);"><h4>Numerosumma</h4><div class="muunnin-ryhma"><label for="numerosumma-syote">Luku</label><input type="number" id="numerosumma-syote" value="1984"></div><div id="numerosumma-tulos" class="tulos-box" style="margin-top:10px;"></div>`;
            const alkulukuInput = document.getElementById('alkuluku-syote'), alkulukuTulos = document.getElementById('alkuluku-tulos'), nsummaInput = document.getElementById('numerosumma-syote'), nsummaTulos = document.getElementById('numerosumma-tulos');
            const onkoAlkuluku = num => { if (num <= 1) return false; for (let i = 2; i*i <= num; i++) if (num % i === 0) return false; return true; };
            const laskeAlkuluvut = () => {
                const luku = parseInt(alkulukuInput.value);
                if (isNaN(luku)) { alkulukuTulos.innerHTML = ''; return; }
                let tulosHtml = `<p>${luku} on ${onkoAlkuluku(luku) ? '' : '<strong>ei</strong> ole'} alkuluku.</p>`;
                if (luku > 1 && luku <= 100000) { const loydetyt = []; for(let i = 2; i <= luku; i++) if (onkoAlkuluku(i)) loydetyt.push(i); tulosHtml += `<hr style="border-color: var(--color-border); margin: 10px 0;"><p style="font-size:0.9em">Alkuluvut ${luku} asti: ${loydetyt.join(', ')}</p>`; }
                alkulukuTulos.innerHTML = tulosHtml;
            };
            const laskeNumerosumma = () => {
                const lukuStr = nsummaInput.value;
                if (lukuStr === '') { nsummaTulos.innerHTML = ''; return; }
                const ristiSumma = lukuStr.split('').reduce((sum, digit) => sum + (parseInt(digit) || 0), 0);
                let iteroitu = ristiSumma;
                while (iteroitu > 9) { iteroitu = iteroitu.toString().split('').reduce((sum, digit) => sum + (parseInt(digit) || 0), 0); }
                nsummaTulos.innerHTML = `<p>Ristisumma: <strong>${ristiSumma}</strong></p><p>Iteroitu numerosumma: <strong>${iteroitu}</strong></p>`;
            };
            alkulukuInput.addEventListener('input', laskeAlkuluvut);
            nsummaInput.addEventListener('input', laskeNumerosumma);
            laskeAlkuluvut();
            laskeNumerosumma();
        };

        const alustaVastusLaskuri = () => {
            const container = document.getElementById('vastus');
            if(!container) return;
            const colorMap = [ { name: 'Musta', value: 0, multiplier: 1, color: '#000' }, { name: 'Ruskea', value: 1, multiplier: 10, tolerance: 1, color: '#A52A2A' }, { name: 'Punainen', value: 2, multiplier: 100, tolerance: 2, color: '#FF0000' }, { name: 'Oranssi', value: 3, multiplier: 1000, color: '#FFA500' }, { name: 'Keltainen', value: 4, multiplier: 10000, color: '#FFFF00' }, { name: 'Vihreä', value: 5, multiplier: 100000, tolerance: 0.5, color: '#008000' }, { name: 'Sininen', value: 6, multiplier: 1000000, tolerance: 0.25, color: '#0000FF' }, { name: 'Violetti', value: 7, multiplier: 1e7, tolerance: 0.1, color: '#EE82EE' }, { name: 'Harmaa', value: 8, multiplier: 1e8, tolerance: 0.05, color: '#808080' }, { name: 'Valkoinen', value: 9, multiplier: 1e9, color: '#FFFFFF' }, { name: 'Kulta', multiplier: 0.1, tolerance: 5, color: '#FFD700' }, { name: 'Hopea', multiplier: 0.01, tolerance: 10, color: '#C0C0C0' }, ];
            container.innerHTML = `<div class="muunnin-ryhma"><label for="vastus-renkaat">Renkaiden määrä</label><select id="vastus-renkaat"><option value="4">4</option><option value="5">5</option></select></div><div id="vastus-valitsimet" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 10px; margin-top:15px; align-items: end;"></div><div id="vastus-tulos" class="tulos-box" style="margin-top:20px;"></div>`;
            const renkaatSelect = document.getElementById('vastus-renkaat'), valitsimetDiv = document.getElementById('vastus-valitsimet'), tulosDiv = document.getElementById('vastus-tulos');
            const luoValitsimet = () => {
                const count = parseInt(renkaatSelect.value);
                valitsimetDiv.innerHTML = '';
                for(let i = 1; i <= count; i++) {
                    let opts = colorMap.map((c,idx) => ( (i < count && c.value !== undefined) || (i === count && c.tolerance !== undefined) ) ? `<option value="${idx}" style="background-color:${c.color};color:${[4,9,10,11].includes(idx)?'#000':'#FFF'};">${c.name}</option>` : '').join('');
                    valitsimetDiv.innerHTML += `<div><label style="font-size:0.8em;text-align:center;display:block;margin-bottom:8px">Rengas ${i}</label><select class="vastus-rengas" id="vastus-rengas-${i}">${opts}</select></div>`;
                }
                document.querySelectorAll('.vastus-rengas').forEach(s => s.addEventListener('change', laskeVastus));
                laskeVastus();
            };
            const formatOhms = (ohms) => { if (ohms >= 1e9) return (ohms/1e9).toPrecision(3)+' GΩ'; if (ohms >= 1e6) return (ohms/1e6).toPrecision(3)+' MΩ'; if (ohms >= 1e3) return (ohms/1e3).toPrecision(3)+' kΩ'; return ohms.toPrecision(3)+' Ω'; };
            const laskeVastus = () => {
                const count = parseInt(renkaatSelect.value);
                const valinnat = Array.from({length: count}, (_, i) => colorMap[document.getElementById(`vastus-rengas-${i+1}`).value]);
                let arvoStr = (count === 4) ? `${valinnat[0].value}${valinnat[1].value}` : `${valinnat[0].value}${valinnat[1].value}${valinnat[2].value}`;
                const kerroin = (count === 4) ? valinnat[2].multiplier : valinnat[3].multiplier;
                const toleranssi = valinnat[count-1].tolerance;
                if(arvoStr.includes('undefined') || kerroin === undefined) { tulosDiv.textContent = 'Virheellinen valinta.'; return; }
                const lopullinenArvo = parseInt(arvoStr) * kerroin;
                tulosDiv.innerHTML = `Arvo: <strong>${formatOhms(lopullinenArvo)}</strong>` + (toleranssi !== undefined ? ` ±${toleranssi}%` : '');
            };
            renkaatSelect.addEventListener('change', luoValitsimet);
            luoValitsimet();
        };

        const initializers = [
            { id: 'koordinaatit', func: alustaKoordinaattiMuunnin }, { id: 'paivamaarat', func: alustaPaivamaaraLaskuri },
            { id: 'teksti', func: alustaTekstiMuunnin }, { id: 'aika', func: alustaAikaMuunnin },
            { id: 'pituus', func: () => alustaVakioMuunnin('pituus', yksikot.pituus || []) },
            { id: 'nopeus', func: () => alustaVakioMuunnin('nopeus', yksikot.nopeus || []) },
            { id: 'massa', func: () => alustaVakioMuunnin('massa', yksikot.massa || []) },
            { id: 'pinta-ala', func: () => alustaVakioMuunnin('pinta-ala', yksikot.pinta_ala || []) },
            { id: 'tilavuus', func: () => alustaVakioMuunnin('tilavuus', yksikot.tilavuus || []) },
            { id: 'voima', func: () => alustaVakioMuunnin('voima', yksikot.voima || []) },
            { id: 'apteekkari_massa', func: () => alustaVakioMuunnin('apteekkari_massa', yksikot.apteekkari_massa || []) },
            { id: 'polttoaine', func: alustaPolttoaineMuunnin }, { id: 'typografia', func: alustaTypografiaMuunnin },
            { id: 'paine', func: () => alustaVakioMuunnin('paine', yksikot.paine || []) },
            { id: 'energia', func: () => alustaVakioMuunnin('energia', yksikot.energia || []) },
            { id: 'teho', func: () => alustaVakioMuunnin('teho', yksikot.teho || []) },
            { id: 'data', func: () => alustaVakioMuunnin('data', yksikot.data || []) },
            { id: 'kulma', func: () => alustaVakioMuunnin('kulma', yksikot.kulma || []) },
            { id: 'sahko', func: () => alustaVakioMuunnin('sahko', yksikot.sahko || []) },
            { id: 'sateily', func: () => alustaVakioMuunnin('sateily', yksikot.sateily || []) },
            { id: 'valo', func: () => alustaVakioMuunnin('valo', yksikot.valo || []) },
            { id: 'lampotila', func: alustaLampotilaMuunnin }, { id: 'roomalaiset', func: alustaRoomalainenMuunnin }, 
            { id: 'luvut', func: alustaLukujarjestelmaMuunnin }, { id: "ruoanlaitto", func: alustaRuoanlaittoMuunnin }, 
            { id: "verensokeri", func: alustaVerensokeriMuunnin }, { id: "bmi", func: alustaBmiLaskuri }, 
            { id: "yksikkosanasto", func: alustaYksikkoSanasto }, { id: 'prosentti', func: alustaProsenttiLaskuri }, 
            { id: 'kalorit', func: alustaKaloriLaskuri }, { id: 'numerot', func: alustaNumeroTyokalut }, 
            { id: 'vastus', func: alustaVastusLaskuri }, { id: 'varit', func: alustaVariMuunnin },
        ];

        initializers.forEach(init => {
            try {
                if (document.getElementById(init.id)) init.func();
            } catch (e) {
                console.error(`Virhe muuntimen "${init.id}" alustuksessa:`, e);
                const errorTab = document.querySelector(`.valilehti-nappi[data-valilehti="${init.id}"]`);
                if (errorTab) { errorTab.style.color = 'red'; errorTab.style.textDecoration = 'line-through'; errorTab.title = `Lataus epäonnistui: ${e.message}`; }
            }
        });
    }

    main();
});
