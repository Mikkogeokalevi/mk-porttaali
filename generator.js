import { suomenMaakunnat, maakuntienKunnat } from "./data.js";

function formatDate(input) {
  const parts = input.split("-");
  if (!parts || parts.length !== 3) return "";
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export const handleTypeChange = () => {
    const type = document.getElementById('genType').value;
    const yearFilters = document.getElementById('yearSpecificFilters');
    if (type === 'year') {
        yearFilters.classList.remove('hidden');
    } else {
        yearFilters.classList.add('hidden');
        document.getElementById('genLocType').value = 'none';
        handleLocTypeChange();
    }
};

export const handleLocTypeChange = () => {
    const locType = document.getElementById('genLocType').value;
    const locInput = document.getElementById('genLocValue');
    const iconRegion = document.getElementById('regionInfoIcon');
    const iconMun = document.getElementById('munSelectIcon');

    locInput.disabled = true;
    iconRegion.classList.add('hidden');
    iconMun.classList.add('hidden');
    document.getElementById('regionListContainer').classList.add('hidden');

    if (locType === 'mkunta') {
        locInput.disabled = false;
        locInput.placeholder = 'Valitse maakunta ⓘ';
        iconRegion.classList.remove('hidden');
    } else if (locType === 'pkunta') {
        locInput.disabled = false;
        locInput.placeholder = 'Valitse kunnat ⚙️';
        iconMun.classList.remove('hidden');
    } else {
        locInput.value = '';
        locInput.placeholder = 'Valitse tyyppi ensin';
    }
};

export const toggleRegionList = () => {
    const container = document.getElementById('regionListContainer');
    if (!container.classList.contains('hidden')) {
        container.classList.add('hidden');
        return;
    }
    container.innerHTML = '';
    suomenMaakunnat.forEach(maakunta => {
        const div = document.createElement('div');
        div.textContent = maakunta;
        div.className = 'region-list-item';
        div.onclick = () => {
            const input = document.getElementById('genLocValue');
            if (input.value) input.value += `, ${maakunta}`;
            else input.value = maakunta;
            container.classList.add('hidden');
        };
        container.appendChild(div);
    });
    container.classList.remove('hidden');
};

export const openPaikkakuntaModal = () => {
    document.getElementById('paikkakuntaModal').style.display = 'flex';
    showModalRegionSelection();
};

export const closePaikkakuntaModal = () => {
    document.getElementById('paikkakuntaModal').style.display = 'none';
};

export const showModalRegionSelection = () => {
    document.getElementById('modalHeaderText').textContent = 'Valitse maakunta';
    document.getElementById('modalRegionList').classList.remove('hidden');
    document.getElementById('modalMunicipalityListContainer').classList.add('hidden');
    document.getElementById('modalBackButton').classList.add('hidden');
    document.getElementById('modalAddButton').classList.add('hidden');

    const ul = document.getElementById('modalRegionList');
    ul.innerHTML = '';
    suomenMaakunnat.forEach(region => {
        if (maakuntienKunnat[region]) {
            const li = document.createElement('li');
            li.textContent = region;
            li.onclick = () => showModalMunicipalitySelection(region);
            ul.appendChild(li);
        }
    });
};

export const showModalMunicipalitySelection = (region) => {
    document.getElementById('modalHeaderText').textContent = `Valitse kunnat (${region})`;
    document.getElementById('modalRegionList').classList.add('hidden');
    document.getElementById('modalMunicipalityListContainer').classList.remove('hidden');
    document.getElementById('modalBackButton').classList.remove('hidden');
    document.getElementById('modalAddButton').classList.remove('hidden');
    document.getElementById('selectAllMunicipalities').checked = false;

    const ul = document.getElementById('modalMunicipalityList');
    ul.innerHTML = '';
    const kunnat = maakuntienKunnat[region] || [];
    kunnat.forEach(kunta => {
        const li = document.createElement('li');
        li.className = 'municipality-item';
        li.innerHTML = `<label><input type="checkbox" value="${kunta}" name="mun_checkbox"> ${kunta}</label>`;
        ul.appendChild(li);
    });
};

export const toggleSelectAll = (source) => {
    const checkboxes = document.getElementsByName('mun_checkbox');
    for(let i=0; i<checkboxes.length; i++) {
        checkboxes[i].checked = source.checked;
    }
};

export const confirmMunicipalities = () => {
    const checkboxes = document.querySelectorAll('input[name="mun_checkbox"]:checked');
    const input = document.getElementById('genLocValue');
    let currentVal = input.value.split(',').map(s => s.trim()).filter(s => s);
    checkboxes.forEach(cb => {
        if (!currentVal.includes(cb.value)) currentVal.push(cb.value);
    });
    input.value = currentVal.join(',');
    showModalRegionSelection();
};

export const toggleFriendManager = () => document.getElementById('friendManager').classList.toggle('hidden');

export const updateProfileLink = () => {
    const user = document.getElementById('genUser').value;
    const link = document.getElementById('gcProfileLink');
    if(user) {
        link.href = `https://www.geocaching.com/p/?u=${encodeURIComponent(user)}`;
        link.textContent = `Avaa ${user} profiili Geocaching.comissa ↗`;
        link.classList.remove('hidden');
    } else { link.classList.add('hidden'); }
};

export const toggleTimeFields = () => {
    const val = document.getElementById('genTimeSelect').value;
    const fields = document.getElementById('timeFields');
    if(val === 'kylla') fields.classList.remove('hidden');
    else fields.classList.add('hidden');
};

// --- TÄRKEIN MUUTOS TÄSSÄ FUNKTIOSSA ---
export const generateStatImage = () => {
    const baseUrl = "https://www.geocache.fi/stat/";
    const user = document.getElementById("genUser").value.trim();
    const type = document.getElementById("genType").value;
    const timeMode = document.getElementById("genTimeSelect").value;
    const year = document.getElementById("genYear").value;
    const month = document.getElementById("genMonth").value;
    const start = document.getElementById("genStart").value;
    const end = document.getElementById("genEnd").value;
    const cacheType = document.getElementById("genCacheType").value;
    const locType = document.getElementById('genLocType').value;
    const locValue = document.getElementById('genLocValue').value.trim();

    if (!user) { alert("Syötä käyttäjätunnus!"); return; }

    // Logiikka ID:n etsimiseen
    let userId = null;
    
    // 1. Tarkista onko kyseessä käyttäjä itse ja onko hänellä ID
    if (window.app.savedNickname === user && window.app.savedId) {
        userId = window.app.savedId;
    } 
    // 2. Jos ei, etsi kaverilistasta
    else if (window.app.friendsList) {
        const friend = window.app.friendsList.find(f => f.name.toLowerCase() === user.toLowerCase());
        if (friend && friend.id) {
            userId = friend.id;
        }
    }

    // Rakennetaan kuvan URL
    let params = `?user=${encodeURIComponent(user)}`;
    if (type === "hiddenday") params += `&type=2`;

    if (timeMode === "kylla") {
        if (start && end) params += `&startdate=${formatDate(start)}&enddate=${formatDate(end)}`;
        else {
           if (year && year !== "current") params += `&year=${year}`;
           if (month && month !== "current") params += `&month=${month}`;
        }
    }
    if (cacheType) params += `&cachetype=${cacheType}`;
    
    if (type === 'year' && locType !== 'none' && locValue) {
        if (locType === 'pkunta') params += `&pkunta=${encodeURIComponent(locValue)}`;
        if (locType === 'mkunta') params += `&mkunta=${encodeURIComponent(locValue)}`;
    }

    const imageUrl = `${baseUrl}${type}.php${params}`;
    
    // Rakennetaan "Avaa isona" linkki
    let largeUrl = imageUrl; 
    let linkText = "Avaa isona";

    // JOS tyyppi on kunta JA meillä on ID -> muutetaan linkki interaktiiviseksi
    if (type === 'kunta' && userId) {
        largeUrl = `https://www.geocache.fi/stat/kunta/?userid=${userId}&names=1`;
        linkText = "Avaa interaktiivinen kartta ↗";
    }

    const img = document.getElementById('generatedImg');
    const link = document.getElementById('openLink');
    
    img.src = imageUrl;
    link.href = largeUrl;
    link.textContent = linkText; // Päivitä linkin teksti
    
    // Jos linkki on interaktiivinen kartta, korostetaan sitä värillä
    if (type === 'kunta' && userId) {
        link.style.backgroundColor = "#fab387"; 
        link.style.color = "#1e1e2e";
    } else {
        link.style.backgroundColor = ""; // Palauta oletus
        link.style.color = "";
    }

    document.getElementById('resultArea').classList.remove('hidden');
};

export const initGeneratorAccordions = () => {
    const accordions = Array.from(document.querySelectorAll('.gen-accordion'));
    if (!accordions.length) return;

    const closeAll = (except) => {
        accordions.forEach(acc => {
            if (acc !== except) acc.classList.remove('open');
        });
    };

    const buildAccordion = (acc) => {
        const selectId = acc.dataset.select;
        const select = document.getElementById(selectId);
        if (!select) return;

        const toggle = acc.querySelector('.gen-accordion-toggle');
        const label = acc.querySelector('.gen-accordion-label');
        const list = acc.querySelector('.gen-accordion-options');

        const syncLabel = () => {
            const selected = select.options[select.selectedIndex];
            label.textContent = selected ? selected.textContent : 'Valitse';
        };

        const updateActive = () => {
            list.querySelectorAll('.gen-accordion-option').forEach(button => {
                button.classList.toggle('active', button.dataset.value === select.value);
            });
        };

        const renderOptions = () => {
            list.innerHTML = '';
            Array.from(select.options).forEach(option => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'gen-accordion-option';
                button.dataset.value = option.value;
                button.textContent = option.textContent;
                if (option.value === select.value) button.classList.add('active');

                button.addEventListener('click', () => {
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    syncLabel();
                    updateActive();
                    acc.classList.remove('open');
                });

                item.appendChild(button);
                list.appendChild(item);
            });
        };

        toggle.addEventListener('click', () => {
            if (acc.classList.contains('open')) {
                acc.classList.remove('open');
                return;
            }
            closeAll(acc);
            renderOptions();
            acc.classList.add('open');
        });

        select.addEventListener('change', () => {
            syncLabel();
            updateActive();
        });

        syncLabel();
        updateActive();
    };

    accordions.forEach(buildAccordion);

    document.addEventListener('click', (event) => {
        const within = event.target.closest('.gen-accordion');
        if (!within) closeAll();
    });
};
