import { suomenMaakunnat, maakuntienKunnat } from "./data.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const GEN_LAST_STATE_KEY = 'mk_generator_last_state_v1';
const GEN_PRESETS_KEY = 'mk_generator_presets_v1';

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getEl(id) {
  return document.getElementById(id);
}

function readGeneratorFormState() {
  return {
    user: (getEl('genUser')?.value || '').trim(),
    type: getEl('genType')?.value || 'matrix',
    timeMode: getEl('genTimeSelect')?.value || 'ei',
    year: getEl('genYear')?.value || 'current',
    month: getEl('genMonth')?.value || 'current',
    start: getEl('genStart')?.value || '',
    end: getEl('genEnd')?.value || '',
    cacheType: getEl('genCacheType')?.value || '',
    locType: getEl('genLocType')?.value || 'none',
    locValue: (getEl('genLocValue')?.value || '').trim()
  };
}

function applyGeneratorFormState(state) {
  if (!state || typeof state !== 'object') return;

  const setIf = (id, value) => {
    const el = getEl(id);
    if (!el) return;
    if (value === undefined || value === null) return;
    el.value = String(value);
  };

  setIf('genUser', state.user);
  setIf('genType', state.type);
  setIf('genTimeSelect', state.timeMode);
  setIf('genYear', state.year);
  setIf('genMonth', state.month);
  setIf('genStart', state.start);
  setIf('genEnd', state.end);
  setIf('genCacheType', state.cacheType);
  setIf('genLocType', state.locType);
  setIf('genLocValue', state.locValue);

  // Synkataan näkyvyydet ja muut UI-riippuvuudet.
  try {
    handleTypeChange();
    toggleTimeFields();
    handleLocTypeChange();
    updateProfileLink();
  } catch {
    // Nämä voivat epäonnistua jos elementtejä ei ole renderöity.
  }
}

function loadLastGeneratorState() {
  return safeJsonParse(localStorage.getItem(GEN_LAST_STATE_KEY), null);
}

let lastSaveTimer = null;
function scheduleSaveLastGeneratorState() {
  if (lastSaveTimer) window.clearTimeout(lastSaveTimer);
  lastSaveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(GEN_LAST_STATE_KEY, JSON.stringify(readGeneratorFormState()));
    } catch {
      // ignore
    }
  }, 150);
}

function getLocalPresets() {
  const presets = safeJsonParse(localStorage.getItem(GEN_PRESETS_KEY), []);
  return Array.isArray(presets) ? presets : [];
}

function setLocalPresets(presets) {
  localStorage.setItem(GEN_PRESETS_KEY, JSON.stringify(presets));
}

function upsertLocalPreset(preset) {
  const presets = getLocalPresets();
  const idx = presets.findIndex(p => p && p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.unshift(preset);
  setLocalPresets(presets);
}

function removeLocalPreset(id) {
  const presets = getLocalPresets().filter(p => p && p.id !== id);
  setLocalPresets(presets);
}

function getPresetSelect() {
  return getEl('genPresetSelect');
}

function renderPresetOptions(presets, selectedId = '') {
  const select = getPresetSelect();
  if (!select) return;

  const current = selectedId || select.value || '';
  select.innerHTML = '<option value="">-- Valitse suosikkihaku --</option>';
  presets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name || '(nimetön)';
    select.appendChild(opt);
  });
  select.value = current;
}

async function loadFirestorePresets(db, uid) {
  const col = collection(db, 'users', uid, 'generator_presets');
  const snap = await getDocs(col);
  const items = [];
  snap.forEach(d => {
    const data = d.data() || {};
    items.push({
      id: d.id,
      name: data.name || '',
      state: data.state || {},
      updatedAt: data.updatedAt || null
    });
  });
  // Järjestys: uusin ensin jos mahdollista
  items.sort((a, b) => {
    const ta = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
    const tb = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
    return tb - ta;
  });
  return items;
}

function getDbAndUid() {
  const db = window.app?.db;
  const uid = window.app?.currentUser?.uid;
  if (!db || !uid) return { db: null, uid: null };
  return { db, uid };
}

export async function refreshGeneratorPresets() {
  const select = getPresetSelect();
  if (!select) return;

  const { db, uid } = getDbAndUid();
  try {
    let presets = [];
    if (db && uid) {
      presets = await loadFirestorePresets(db, uid);
    } else {
      presets = getLocalPresets();
    }
    renderPresetOptions(presets);
    select.dataset.presets = JSON.stringify(presets);
  } catch (e) {
    console.warn('Preset loading failed:', e);
    const presets = getLocalPresets();
    renderPresetOptions(presets);
    select.dataset.presets = JSON.stringify(presets);
  }
}

function getLoadedPresetsFromSelect() {
  const select = getPresetSelect();
  if (!select) return [];
  return safeJsonParse(select.dataset.presets || '[]', []);
}

export function applySelectedGeneratorPreset() {
  const select = getPresetSelect();
  if (!select) return;
  const id = select.value;
  if (!id) return;
  const presets = getLoadedPresetsFromSelect();
  const preset = presets.find(p => p && p.id === id);
  if (!preset) return;
  applyGeneratorFormState(preset.state);
  scheduleSaveLastGeneratorState();
}

export async function saveGeneratorPreset() {
  const name = (prompt('Anna haulle nimi (näkyy suosikeissa):') || '').trim();
  if (!name) return;

  const state = readGeneratorFormState();
  const { db, uid } = getDbAndUid();

  if (db && uid) {
    const col = collection(db, 'users', uid, 'generator_presets');
    await addDoc(col, { name, state, updatedAt: serverTimestamp() });
    await refreshGeneratorPresets();
    return;
  }

  const preset = { id: `local_${Date.now()}`, name, state };
  upsertLocalPreset(preset);
  await refreshGeneratorPresets();
}

export async function updateSelectedGeneratorPreset() {
  const select = getPresetSelect();
  if (!select || !select.value) return alert('Valitse ensin suosikkihaku.');

  const id = select.value;
  const state = readGeneratorFormState();
  const { db, uid } = getDbAndUid();

  if (db && uid && !id.startsWith('local_')) {
    await updateDoc(doc(db, 'users', uid, 'generator_presets', id), { state, updatedAt: serverTimestamp() });
    await refreshGeneratorPresets();
    return;
  }

  const presets = getLocalPresets();
  const existing = presets.find(p => p && p.id === id);
  if (!existing) return;
  upsertLocalPreset({ ...existing, state });
  await refreshGeneratorPresets();
}

export async function renameSelectedGeneratorPreset() {
  const select = getPresetSelect();
  if (!select || !select.value) return alert('Valitse ensin suosikkihaku.');

  const id = select.value;
  const presets = getLoadedPresetsFromSelect();
  const existing = presets.find(p => p && p.id === id);
  const currentName = existing?.name || '';
  const name = (prompt('Uusi nimi:', currentName) || '').trim();
  if (!name) return;

  const { db, uid } = getDbAndUid();
  if (db && uid && !id.startsWith('local_')) {
    await updateDoc(doc(db, 'users', uid, 'generator_presets', id), { name, updatedAt: serverTimestamp() });
    await refreshGeneratorPresets();
    select.value = id;
    return;
  }

  const local = getLocalPresets();
  const ex = local.find(p => p && p.id === id);
  if (!ex) return;
  upsertLocalPreset({ ...ex, name });
  await refreshGeneratorPresets();
  select.value = id;
}

export async function deleteSelectedGeneratorPreset() {
  const select = getPresetSelect();
  if (!select || !select.value) return alert('Valitse ensin suosikkihaku.');

  const id = select.value;
  const presets = getLoadedPresetsFromSelect();
  const existing = presets.find(p => p && p.id === id);
  const name = existing?.name || id;
  const ok = confirm(`Poistetaanko suosikkihaku "${name}"?`);
  if (!ok) return;

  const { db, uid } = getDbAndUid();
  if (db && uid && !id.startsWith('local_')) {
    await deleteDoc(doc(db, 'users', uid, 'generator_presets', id));
    await refreshGeneratorPresets();
    select.value = '';
    return;
  }

  removeLocalPreset(id);
  await refreshGeneratorPresets();
  select.value = '';
}

export function initGeneratorPersistence() {
  // 1) Lataa viimeisin tila (mutta älä yliaja oletus-käyttäjää tyhjäksi).
  const last = loadLastGeneratorState();
  if (last) {
    const currentUserVal = (getEl('genUser')?.value || '').trim();
    if (currentUserVal && (!last.user || last.user === '')) {
      last.user = currentUserVal;
    }
    applyGeneratorFormState(last);
  } else {
    // Varmistetaan UI:n initial state
    try {
      handleTypeChange();
      toggleTimeFields();
      handleLocTypeChange();
      updateProfileLink();
    } catch {
      // ignore
    }
  }

  // 2) Kuuntelijat: tallenna “edellinen haku” automaattisesti.
  const ids = [
    'genUser',
    'genType',
    'genTimeSelect',
    'genYear',
    'genMonth',
    'genStart',
    'genEnd',
    'genCacheType',
    'genLocType',
    'genLocValue'
  ];

  ids.forEach(id => {
    const el = getEl(id);
    if (!el) return;
    el.addEventListener('change', scheduleSaveLastGeneratorState);
    el.addEventListener('input', scheduleSaveLastGeneratorState);
  });

  // 3) Presetit
  refreshGeneratorPresets();

  const presetSelect = getPresetSelect();
  if (presetSelect) {
    presetSelect.addEventListener('change', applySelectedGeneratorPreset);
  }
}

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
