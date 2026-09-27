// findsQuery.js - Löytöhaut: laajennettava kyselyrekisteri findsdata/{vuosi}-datan päälle
// Uusi haku = yksi merkintä FINDS_QUERIES-listaan (input + filters + run); UI ei tarvitse muutoksia.
// Datan rakenne (gpxImport.js): findsdata/{vuosi} = { finds: { GCxxxx: [tyyppiIdx, 'YYYY-MM-DD', D, T, sijainti, 'attr,attr'] } }

import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { ATTR_FI } from "./gpxImport.js";

const TYPE_NAMES = ['Tradi', 'Multi', 'Webcam', 'Mysse', 'Letteri', 'Öörtti', 'Miitti', 'Virtu', 'Cito', 'Wherigo', 'Com.Cel', 'Mega', 'No Loc', 'Juhla'];
// Tyyppikohtaiset värit (D/T-ruudukko + type-chips)
const TYPE_COLORS = [
  '#7ac74f', // 0 Tradi - vihreä
  '#f0a35e', // 1 Multi - oranssi
  '#8ea4c9', // 2 Webcam - harmaansininen
  '#b16bd4', // 3 Mysse - violetti
  '#c98f4e', // 4 Letteri - ruskea
  '#4db6ac', // 5 Öörtti - turkoosi
  '#e06080', // 6 Miitti - pinkki
  '#7c9bd8', // 7 Virtu - sininen
  '#4da04d', // 8 Cito - tumma vihreä
  '#4f7ecf', // 9 Wherigo - sininen
  '#d99a3d', // 10 Com.Cel - keltainen
  '#d64545', // 11 Mega - punainen
  '#9e9e9e', // 12 No Loc - harmaa
  '#c97b3f'  // 13 Juhla - oranssinruskea
];
const DT_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const MONTHS_FI = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];
const WEEKDAYS_FI = [['Maanantai', 1], ['Tiistai', 2], ['Keskiviikko', 3], ['Torstai', 4], ['Perjantai', 5], ['Lauantai', 6], ['Sunnuntai', 0]];

// ---------- Datan lataus (välimuistitettu istunnon ajaksi) ----------

let findsCache = null;
export async function loadFinds(db, uid) {
  if (findsCache) return findsCache;
  const snap = await getDocs(collection(db, 'users', uid, 'findsdata'));
  const finds = [];
  snap.forEach(d => {
    const data = d.data().finds || {};
    for (const [code, r] of Object.entries(data)) {
      const [type, day, D, T, loc, attrStr] = r;
      finds.push({
        code, type: +type, day: day || '', D: +D || 0, T: +T || 0, loc: loc || '',
        attrs: attrStr ? String(attrStr).split(',').map(Number).filter(n => n) : []
      });
    }
  });
  findsCache = finds;
  return finds;
}

// ---------- Suodatus-apuri (tyyppi + attribuutti -filterit) ----------

function applyFilters(finds, { types = null, attr = null } = {}) {
  const typeSet = types && types.length ? new Set(types.map(Number)) : null;
  const attrId = attr ? +attr : null;
  if (!typeSet && !attrId) return finds;
  return finds.filter(f =>
    (!typeSet || typeSet.has(f.type)) &&
    (!attrId || f.attrs.includes(attrId))
  );
}

// ---------- Jaetut tulosrenderöijät ----------

// 9x9 D/T-ruudukko: rivit = Difficulty, sarakkeet = Terrain.
// Ruudun väri = yleisimmän kätkötyypin väri kyseisessä ruudussa + legenda.
function dtMatrix(finds) {
  const cells = {}; // 'd|t' -> {typeIdx: count}
  for (const f of finds) {
    if (!f.D || !f.T) continue;
    const k = `${f.D}|${f.T}`;
    const cell = cells[k] = cells[k] || {};
    cell[f.type] = (cell[f.type] || 0) + 1;
  }
  const filled = Object.keys(cells).length;
  const usedTypes = new Set();
  const head = `<tr><th>D\\T</th>${DT_VALUES.map(t => `<th>${t}</th>`).join('')}</tr>`;
  const rows = DT_VALUES.map(d =>
    `<tr><th>${d}</th>${DT_VALUES.map(t => {
      const byType = cells[`${d}|${t}`];
      if (!byType) return '<td></td>';
      let topType = -1, topN = 0, total = 0;
      for (const [ty, n] of Object.entries(byType)) {
        total += n;
        if (n > topN) { topN = n; topType = +ty; }
      }
      if (topType >= 0) usedTypes.add(topType);
      const c = TYPE_COLORS[topType] || '#a6e3a1';
      return `<td style="background:${c}44; border-color:${c}; color:var(--text-color); font-weight:700;" title="${TYPE_NAMES[topType] || ''}">${total}</td>`;
    }).join('')}</tr>`
  ).join('');
  const legend = usedTypes.size
    ? `<div class="type-coverage" style="margin-top:8px;">${[...usedTypes].sort((a, b) => a - b).map(i =>
        `<span class="type-chip" style="border-color:${TYPE_COLORS[i]}; color:${TYPE_COLORS[i]};">${TYPE_NAMES[i]}</span>`).join('')}</div>`
    : '';
  return {
    filled, total: DT_VALUES.length * DT_VALUES.length,
    html: `<div class="fq-scroll"><table class="dt-matrix">${head}${rows}</table></div>${legend}`
  };
}

// 14 kätkötyyppiä: löydetyt omalla värillään + lukumäärä, puuttuvat himmennetty
function typeCoverage(finds) {
  const counts = {};
  for (const f of finds) if (f.type >= 0) counts[f.type] = (counts[f.type] || 0) + 1;
  return {
    found: Object.keys(counts).length, total: TYPE_NAMES.length,
    html: `<div class="type-coverage">${TYPE_NAMES.map((n, i) => {
      const c = TYPE_COLORS[i];
      return counts[i]
        ? `<span class="type-chip" style="border-color:${c}; color:${c}; background:${c}22;">${n} ${counts[i]}</span>`
        : `<span class="type-chip miss">${n}</span>`;
    }).join('')}</div>`
  };
}

// Löytölista (uusimmat ensin), katkaistaan limit-kohdalla
function findsList(finds, limit = 300) {
  const sorted = [...finds].sort((a, b) => (a.day < b.day ? 1 : -1));
  const rows = sorted.slice(0, limit).map(f =>
    `<tr><td><strong>${f.code}</strong></td><td style="color:${TYPE_COLORS[f.type] || 'inherit'};">${TYPE_NAMES[f.type] || '?'}</td><td>${f.day || '—'}</td><td>${f.D || '—'} / ${f.T || '—'}</td><td>${f.loc || '—'}</td></tr>`
  ).join('');
  return `<div class="fq-scroll"><table class="finds-table"><tr><th>Koodi</th><th>Tyyppi</th><th>Pvm</th><th>D/T</th><th>Sijainti</th></tr>${rows}</table></div>` +
    (sorted.length > limit ? `<p style="font-size:0.8em;opacity:0.7;">Näytetään ${limit} / ${sorted.length} löytöä (uusimmat ensin).</p>` : '');
}

// ---------- Kyselyrekisteri ----------
// input: 'day' | 'month' | 'weekday' | 'attr' | null
// filters: ['types','attr'] — valinnaiset lisäsuodattimet (UI hoitaa ne automaattisesti)
// run(finds, input) -> [{ title, html }, ...]

const FINDS_QUERIES = [
  {
    id: 'day-search',
    title: 'Kalenteripäivähaku',
    desc: 'Kaikki tietynä kalenteripäivänä (pp.kk.) tehdyt löydöt kaikkina vuosina — puuttuvat tyypit ja D/T-kattavuus.',
    input: 'day',
    filters: ['types', 'attr'],
    run(finds, input) {
      const { month, day } = input;
      const mmdd = `-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hits = applyFilters(finds.filter(f => f.day.endsWith(mmdd)), input);
      const cov = typeCoverage(hits);
      const mx = dtMatrix(hits);
      return [
        { title: `Kätkötyypit ${day}.${month}. — ${cov.found}/${cov.total} löydetty`, html: cov.html },
        { title: `D/T-kattavuus — ${mx.filled}/${mx.total}`, html: mx.html },
        { title: `Löydöt (${hits.length})`, html: hits.length ? findsList(hits) : '<p>Ei löytöjä tänä päivänä.</p>' }
      ];
    }
  },
  {
    id: 'month-dt',
    title: 'Kuukauden D/T-taulukko',
    desc: 'D/T-ruudukko valitulta kuukaudelta kaikkina vuosina.',
    input: 'month',
    filters: ['types', 'attr'],
    run(finds, input) {
      const { month } = input;
      const mm = String(month).padStart(2, '0');
      const hits = applyFilters(finds.filter(f => f.day.slice(5, 7) === mm), input);
      const mx = dtMatrix(hits);
      return [
        { title: `${MONTHS_FI[month - 1]}: D/T ${mx.filled}/${mx.total} (${hits.length} löytöä)`, html: mx.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä tässä kuussa.</p>' }
      ];
    }
  },
  {
    id: 'weekday-dt',
    title: 'Viikonpäivän D/T-taulukko',
    desc: 'D/T-ruudukko valitulta viikonpäivältä (esim. kaikki lauantai-löydöt).',
    input: 'weekday',
    filters: ['types', 'attr'],
    run(finds, input) {
      const wd = +input.weekday;
      const hits = applyFilters(finds.filter(f => {
        if (f.day.length < 10) return false;
        const [y, m, d] = f.day.split('-').map(Number);
        return new Date(y, m - 1, d).getDay() === wd;
      }), input);
      const name = (WEEKDAYS_FI.find(w => w[1] === wd) || ['?'])[0];
      const mx = dtMatrix(hits);
      return [
        { title: `${name}: D/T ${mx.filled}/${mx.total} (${hits.length} löytöä)`, html: mx.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä tänä viikonpäivänä.</p>' }
      ];
    }
  },
  {
    id: 'all-dt',
    title: 'Koko D/T-matriisi',
    desc: 'Kaikkien löytöjen D/T-ruudukko — suodata vapaasti tyypeillä ja attribuuteilla.',
    input: null,
    filters: ['types', 'attr'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const mx = dtMatrix(hits);
      return [
        { title: `Kaikki löydöt: D/T ${mx.filled}/${mx.total} (${hits.length} löytöä)`, html: mx.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä.</p>' }
      ];
    }
  },
  {
    id: 'attr-search',
    title: 'Attribuuttihaku',
    desc: 'Löydöt joilla valittu attribuutti (esim. kiipeily, lumikengät, yökätköily).',
    input: 'attr',
    filters: ['types'],
    run(finds, input) {
      const id = +input.attr;
      const hits = applyFilters(finds.filter(f => f.attrs.includes(id)), input);
      const cov = typeCoverage(hits);
      return [
        { title: `${ATTR_FI[id] || id}: ${hits.length} löytöä — tyyppejä ${cov.found}/${cov.total}`, html: cov.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä tällä attribuutilla.</p>' }
      ];
    }
  }
];

// ---------- Näkymä ----------

function renderInputs(query, inputDiv) {
  let html = `<p style="font-size:0.8em;opacity:0.7;margin:5px 0 0;">${query.desc}</p>`;
  if (query.input === 'day') {
    const dayOpts = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
    const monOpts = MONTHS_FI.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
    html += `<div style="display:flex; gap:10px;">
      <div style="flex:1;"><label>Päivä:</label><select id="fqDay">${dayOpts}</select></div>
      <div style="flex:2;"><label>Kuukausi:</label><select id="fqMonth">${monOpts}</select></div></div>`;
  } else if (query.input === 'month') {
    html += `<label>Kuukausi:</label><select id="fqMonth">${MONTHS_FI.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select>`;
  } else if (query.input === 'weekday') {
    html += `<label>Viikonpäivä:</label><select id="fqWeekday">${WEEKDAYS_FI.map(w => `<option value="${w[1]}">${w[0]}</option>`).join('')}</select>`;
  } else if (query.input === 'attr') {
    const opts = Object.entries(ATTR_FI).sort((a, b) => a[1].localeCompare(b[1], 'fi'))
      .map(([id, n]) => `<option value="${id}">${n}</option>`).join('');
    html += `<label>Attribuutti:</label><select id="fqAttr">${opts}</select>`;
  }

  // Yhteiset lisäsuodattimet (filters-taulukossa luetellut)
  if (query.filters?.includes('types')) {
    html += `<details style="margin-top:6px;">
      <summary style="font-size:0.8em; color:var(--subtext-color); cursor:pointer;">Kätkötyypit (oletuksena kaikki valittuna)</summary>
      <div class="type-coverage" id="fqTypes" style="margin-top:6px;">${TYPE_NAMES.map((n, i) =>
        `<span class="type-chip fq-type fq-on" data-i="${i}" data-color="${TYPE_COLORS[i]}" style="border-color:${TYPE_COLORS[i]}; color:${TYPE_COLORS[i]}; background:${TYPE_COLORS[i]}22; cursor:pointer;">${n}</span>`).join('')}</div>
    </details>`;
  }
  if (query.filters?.includes('attr')) {
    const opts = '<option value="">Kaikki attribuutit</option>' + Object.entries(ATTR_FI).sort((a, b) => a[1].localeCompare(b[1], 'fi'))
      .map(([id, n]) => `<option value="${id}">${n}</option>`).join('');
    html += `<label style="font-size:0.85em;">Attribuuttisuodatin:</label><select id="fqAttrFilter" style="margin-bottom:0;">${opts}</select>`;
  }
  inputDiv.innerHTML = html;

  // Tyyppichipit togglettaviksi
  inputDiv.querySelectorAll('.fq-type').forEach(ch => {
    ch.onclick = () => {
      const on = ch.classList.toggle('fq-on');
      ch.style.background = on ? ch.dataset.color + '22' : 'transparent';
      ch.style.opacity = on ? '1' : '0.4';
    };
  });
}

export const renderFindsQueries = async (db, user, content) => {
  content.innerHTML = `<div class="card"><h1>Löytöhaut</h1><p>Ladataan löytödataa...</p></div>`;
  let finds;
  try {
    finds = await loadFinds(db, user.uid);
  } catch (e) {
    console.error(e);
    content.innerHTML = `<div class="card"><div class="view-header"><h1>Löytöhaut</h1><button class="btn btn-sm" onclick="app.router('stats')">⬅ Tilastot</button></div><p style="color:var(--c-red);">Löytödatan lataus epäonnistui.</p></div>`;
    return;
  }

  if (!finds.length) {
    content.innerHTML = `
    <div class="card">
        <div class="view-header"><h1>Löytöhaut</h1>
        <button class="btn btn-sm" onclick="app.router('stats')">⬅ Tilastot</button></div>
        <p>Ei kätkökohtaista löytödataa. Tuo löytösi GPX-tiedostosta Asetukset-sivulla — löytöhaut käyttävät tuontia, joka tallentaa jokaisen kätkön tyypin, päivän, D/T:n ja attribuutit.</p>
    </div>`;
    return;
  }

  content.innerHTML = `
  <div class="card">
      <div class="view-header"><h1>Löytöhaut</h1>
      <button class="btn btn-sm" onclick="app.router('stats')">⬅ Tilastot</button></div>
      <p style="font-size:0.85em; opacity:0.75; margin-top:0;">Kyselyjä GPX-tuotuun löytödataan (${finds.length} löytöä). Uusia hakuja lisätään helposti — kerro toiveesi!</p>
      <label>Haku:</label>
      <select id="fqQuery">${FINDS_QUERIES.map((q, i) => `<option value="${i}">${q.title}</option>`).join('')}</select>
      <div id="fqInput" style="margin-top:8px;"></div>
      <button class="btn btn-primary" id="fqRun" style="margin-top:6px;">Hae</button>
      <div id="fqResult" style="margin-top:15px;"></div>
  </div>`;

  const querySel = document.getElementById('fqQuery');
  const inputDiv = document.getElementById('fqInput');
  const resultDiv = document.getElementById('fqResult');

  querySel.onchange = () => { renderInputs(FINDS_QUERIES[+querySel.value], inputDiv); resultDiv.innerHTML = ''; };
  renderInputs(FINDS_QUERIES[0], inputDiv);

  document.getElementById('fqRun').onclick = () => {
    const q = FINDS_QUERIES[+querySel.value];
    // Valitut tyyppisuodattimet (jos näkyvissä)
    const typeChips = inputDiv.querySelectorAll('.fq-type');
    const types = typeChips.length
      ? [...typeChips].filter(ch => ch.classList.contains('fq-on')).map(ch => +ch.dataset.i)
      : null;
    const input = {
      month: +document.getElementById('fqMonth')?.value || null,
      day: +document.getElementById('fqDay')?.value || null,
      weekday: document.getElementById('fqWeekday')?.value ?? null,
      attr: document.getElementById('fqAttr')?.value ?? null,          // attribuuttihaku (pakollinen)
      attrFilter: document.getElementById('fqAttrFilter')?.value || null, // valinnainen attribuuttisuodatin
      types
    };
    // Yhdistä: attrFilter toimii samana suodattimena kuin attr muissa haussa
    if (input.attrFilter && !input.attr) input.attr = input.attrFilter;
    try {
      const sections = q.run(finds, input);
      resultDiv.innerHTML = sections.map(s =>
        `<div class="panel" style="padding:12px 14px; margin-top:10px;">
           <h3 style="margin:0 0 8px; font-size:0.95em;">${s.title}</h3>${s.html}</div>`).join('');
    } catch (e) {
      console.error('Löytöhaku:', e);
      resultDiv.innerHTML = `<p style="color:var(--c-red);">Haku epäonnistui.</p>`;
    }
  };
};
