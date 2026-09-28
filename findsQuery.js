// findsQuery.js - Löytöhaut: laajennettava kyselyrekisteri findsdata/{vuosi}-datan päälle
// Uusi haku = yksi merkintä FINDS_QUERIES-listaan (input + filters + run); UI ei tarvitse muutoksia.
// Datan rakenne (gpxImport.js): findsdata/{vuosi} = { finds: { GCxxxx: [tyyppiIdx, 'YYYY-MM-DD', D, T, sijainti, 'attr,attr'] } }

import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { ATTR_EN, countryNameFi } from "./gpxImport.js";

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
  // loc-kentässä on kunta (FI/SE/NO/EE) tai maanimi (muut maat) — rakennetaan kunta->maa-kartta
  const [snap, statsSnap, seSnap, noSnap, eeSnap, otherSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'findsdata')),
    getDoc(doc(db, 'stats', uid)),
    getDoc(doc(db, 'users', uid, 'sweden', 'finds')),
    getDoc(doc(db, 'users', uid, 'norway', 'finds')),
    getDoc(doc(db, 'users', uid, 'estonia', 'finds')),
    getDoc(doc(db, 'users', uid, 'other_countries', 'finds'))
  ]);
  const locToCountry = {};
  const addLocs = (data, key, name) => { for (const k of Object.keys(data?.[key] || {})) locToCountry[k] = name; };
  addLocs(seSnap.data(), 'municipalities', 'Ruotsi');
  addLocs(noSnap.data(), 'municipalities', 'Norja');
  addLocs(eeSnap.data(), 'municipalities', 'Viro');
  addLocs(statsSnap.data(), 'municipalities', 'Suomi');
  for (const c of Object.keys(otherSnap.data()?.countries || {})) locToCountry[c] = countryNameFi(c);
  const FI_LOC_ALIASES = new Set(['Finland', 'Aland Islands', 'Åland Islands', 'Åland', 'Ahvenanmaa', 'Suomi']);
  const resolveCountry = loc =>
    locToCountry[loc] || (FI_LOC_ALIASES.has(loc) ? 'Suomi' : countryNameFi(loc || 'Tuntematon'));

  const finds = [];
  snap.forEach(d => {
    const data = d.data().finds || {};
    for (const [code, r] of Object.entries(data)) {
      const [type, day, D, T, loc, attrStr] = r;
      finds.push({
        code, type: +type, day: day || '', D: +D || 0, T: +T || 0, loc: loc || '',
        country: resolveCountry(loc),
        attrs: attrStr ? String(attrStr).split(',').map(Number).filter(n => n) : []
      });
    }
  });
  findsCache = finds;
  return finds;
}

// ---------- Suodatus-apuri (tyyppi + attribuutti -filterit) ----------

function applyFilters(finds, { types = null, attr = null, countries = null } = {}) {
  const typeSet = types && types.length ? new Set(types.map(Number)) : null;
  const attrId = attr ? +attr : null;
  const countrySet = countries && countries.length ? new Set(countries) : null;
  if (!typeSet && !attrId && !countrySet) return finds;
  return finds.filter(f =>
    (!typeSet || typeSet.has(f.type)) &&
    (!attrId || f.attrs.includes(attrId)) &&
    (!countrySet || countrySet.has(f.country))
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
  const head = `<tr><th>D\\T</th>${DT_VALUES.map(t => `<th>${t}</th>`).join('')}<th>yht</th></tr>`;
  const colTotals = DT_VALUES.map(() => 0);
  let grandTotal = 0;
  const rows = DT_VALUES.map(d => {
    let rowTotal = 0;
    const tds = DT_VALUES.map((t, ti) => {
      const byType = cells[`${d}|${t}`];
      if (!byType) return '<td></td>';
      const segs = Object.entries(byType).sort((a, b) => b[1] - a[1]);
      const topType = +segs[0][0];
      const total = segs.reduce((a, s) => a + s[1], 0);
      rowTotal += total; colTotals[ti] += total; grandTotal += total;
      if (topType >= 0) usedTypes.add(topType);
      const c = TYPE_COLORS[topType] || '#a6e3a1';
      // Pinottu väripalkki: jokaisen tyypin osuus ruudussa; monityyppiruudut näkyvät selkeästi
      const bar = `<div style="display:flex; height:4px; border-radius:2px; overflow:hidden; margin-top:2px;">` +
        segs.map(([ty, n]) => `<span style="flex:${n}; background:${TYPE_COLORS[ty] || '#888'};"></span>`).join('') + `</div>`;
      const tip = segs.map(([ty, n]) => `${TYPE_NAMES[ty] || '?'} ${n}`).join(', ');
      const breakAttr = segs.map(([ty, n]) => `${ty}:${n}`).join(';'); // mobiilipopupia varten
      return `<td data-break="${breakAttr}" data-dv="${d}" data-tv="${t}" style="background:${c}44; border-color:${c}; color:var(--text-color); font-weight:700; cursor:pointer;" title="${tip}">${total}${bar}</td>`;
    }).join('');
    return `<tr><th>${d}</th>${tds}<th>${rowTotal || ''}</th></tr>`;
  }).join('');
  const totalsRow = `<tr><th>yht</th>${colTotals.map(n => `<th>${n || ''}</th>`).join('')}<th style="color:var(--c-green);">${grandTotal || ''}</th></tr>`;
  const legend = usedTypes.size
    ? `<div class="type-coverage" style="margin-top:8px;">${[...usedTypes].sort((a, b) => a - b).map(i =>
        `<span class="type-chip" style="border-color:${TYPE_COLORS[i]}; color:${TYPE_COLORS[i]};">${TYPE_NAMES[i]}</span>`).join('')}</div>
       <p style="font-size:0.7em; opacity:0.6; margin:4px 0 0;">Ruudun väri = yleisin tyyppi; alareunan palkki näyttää kaikkien tyyppien osuudet.</p>`
    : '';
  return {
    filled, total: DT_VALUES.length * DT_VALUES.length,
    html: `<div class="fq-scroll"><table class="dt-matrix">${head}${rows}${totalsRow}</table></div>${legend}`
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

// Löytölista (uusimmat ensin), katkaistaan limit-kohdalla.
// Sarakkeet ovat sortattavia: th[data-k] -> rivin data-attribuutti; sorttaus hoidetaan DOM:ssa
// yhdellä delegoidulla kuuntelijalla (alla), joten lista toimii kaikissa näkymissä.
export function findsList(finds, limit = 300) {
  const sorted = [...finds].sort((a, b) => (a.day < b.day ? 1 : -1));
  const rows = sorted.map((f, i) =>
    `<tr${i >= limit ? ' class="fq-hidden"' : ''} data-code="${f.code}" data-type="${f.type}" data-day="${f.day}" data-d="${f.D || 0}" data-t="${f.T || 0}" data-loc="${f.loc || ''}">` +
    `<td><a href="https://www.geocaching.com/geocache/${f.code}" target="_blank" rel="noopener" style="color:var(--c-blue); font-weight:700; text-decoration:none;">${f.code}</a></td>` +
    `<td style="color:${TYPE_COLORS[f.type] || 'inherit'};">${TYPE_NAMES[f.type] || '?'}</td>` +
    `<td>${f.day || '—'}</td><td>${f.D || '—'}</td><td>${f.T || '—'}</td><td>${f.loc || '—'}</td></tr>`
  ).join('');
  const th = (k, label) => `<th data-k="${k}" data-label="${label}" title="Järjestä">${label}</th>`;
  return `<div class="fq-scroll"><table class="finds-table"><thead><tr>${th('code', 'Koodi')}${th('type', 'Tyyppi')}${th('day', 'Pvm')}${th('d', 'D')}${th('t', 'T')}${th('loc', 'Sijainti')}</tr></thead><tbody>${rows}</tbody></table></div>` +
    (sorted.length > limit ? `<button type="button" class="fq-showall">Näytä kaikki ${sorted.length} löytöä</button>` : '');
}

// ---------- Chip-valitsimet (mobiiliystävällinen korvike natiiville selectille) ----------
// chipSel() tuottaa napikkaita valintalaatikoita; delegated klikkikuuntelija alla.
function chipSel(id, opts, sel, cls = '') {
  const multi = cls.includes('fq-multi');
  const allOn = multi && sel === '*';
  const v = allOn ? opts.map(o => o[0]).join(',') : sel;
  return `<div class="fq-csel ${cls}" id="${id}" data-v="${v}"${multi ? ' data-multi' : ''}>` +
    opts.map(([ov, l]) => `<button type="button" class="fq-copt${(allOn || String(ov) === String(sel)) ? ' on' : ''}" data-v="${ov}">${l}</button>`).join('') +
    `</div>`;
}
const chipVal = (root, id) => root.querySelector('#' + id)?.dataset.v ?? null;
const chipVals = (root, id) => { const v = chipVal(root, id); return v ? v.split(',').map(Number).filter(n => !isNaN(n)) : null; };
document.addEventListener('click', e => {
  const b = e.target.closest('.fq-copt');
  if (!b) return;
  const box = b.closest('.fq-csel');
  if (box.dataset.multi != null) {
    b.classList.toggle('on');
    box.dataset.v = [...box.querySelectorAll('.fq-copt.on')].map(x => x.dataset.v).join(',');
  } else {
    box.querySelectorAll('.fq-copt.on').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    box.dataset.v = b.dataset.v;
  }
  box.dispatchEvent(new CustomEvent('fq-change', { bubbles: true }));
});

// Löytölistan "Näytä kaikki" -nappi (limitin yli menevät rivit ovat piilossa)
document.addEventListener('click', e => {
  const btn = e.target.closest('.fq-showall');
  if (!btn) return;
  btn.parentElement.querySelectorAll('tr.fq-hidden').forEach(r => r.classList.remove('fq-hidden'));
  btn.remove();
});

// ---------- Accordion-valitsimet (sama malli kuin kuvageneraattorissa) ----------
// Piilotettu <select> + tyylitelty nappi joka avaa oman option-paneelin.
const optHtml = (pairs, sel) => pairs.map(([v, l]) =>
  `<option value="${v}"${String(v) === String(sel) ? ' selected' : ''}>${l}</option>`).join('');

function accField(id, pairs, sel, ph = 'Valitse') {
  return `<div class="gen-accordion-field">
    <select id="${id}">${optHtml(pairs, sel)}</select>
    <div class="gen-accordion" data-select="${id}">
      <button type="button" class="gen-accordion-toggle"><span class="gen-accordion-label">${ph}</span><span class="gen-accordion-caret">▾</span></button>
      <div class="gen-accordion-panel"><ul class="gen-accordion-options"></ul></div>
    </div>
  </div>`;
}

// Aseta selectin arvo ohjelmallisesti (päivittää myös accordion-labelin)
function setSelectVal(sel, v) {
  sel.value = v;
  const lbl = sel.closest('.gen-accordion-field')?.querySelector('.gen-accordion-label');
  const opt = sel.options[sel.selectedIndex];
  if (lbl && opt) lbl.textContent = opt.textContent;
}

function wireAccordions(root) {
  const accs = [...root.querySelectorAll('.gen-accordion')];
  const closeAll = except => accs.forEach(a => { if (a !== except) a.classList.remove('open'); });
  accs.forEach(acc => {
    const select = document.getElementById(acc.dataset.select);
    if (!select) return;
    const toggle = acc.querySelector('.gen-accordion-toggle');
    const label = acc.querySelector('.gen-accordion-label');
    const list = acc.querySelector('.gen-accordion-options');
    const syncLabel = () => {
      const o = select.options[select.selectedIndex];
      label.textContent = o ? o.textContent : 'Valitse';
    };
    toggle.addEventListener('click', () => {
      if (acc.classList.contains('open')) { acc.classList.remove('open'); return; }
      closeAll(acc);
      list.innerHTML = '';
      [...select.options].forEach(option => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'gen-accordion-option';
        b.dataset.value = option.value;
        b.textContent = option.textContent;
        if (option.value === select.value) b.classList.add('active');
        b.addEventListener('click', () => {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          syncLabel();
          acc.classList.remove('open');
        });
        li.appendChild(b);
        list.appendChild(li);
      });
      acc.classList.add('open');
    });
    select.addEventListener('change', syncLabel);
    syncLabel();
  });
}
// Klikkaus accordionin ulkopuolelle sulkee sen
document.addEventListener('click', e => {
  document.querySelectorAll('.gen-accordion.open').forEach(a => {
    if (!a.contains(e.target)) a.classList.remove('open');
  });
});

const MONTHS_SHORT = ['Tam', 'Hel', 'Maa', 'Huh', 'Tou', 'Kes', 'Hei', 'Elo', 'Syy', 'Lok', 'Mar', 'Jou'];
const WD_OPTS = [[1, 'Ma'], [2, 'Ti'], [3, 'Ke'], [4, 'To'], [5, 'Pe'], [6, 'La'], [0, 'Su']];
function wdOf(day) { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d).getDay(); }

// Vuosikalenteri geocache.fi-tyyliin: kuukaudet x päivät, solun sinisävy = löytömäärä
function yearCalendar(finds) {
  const cnt = {};
  for (const f of finds) if (f.day.length >= 10) { const k = f.day.slice(5); cnt[k] = (cnt[k] || 0) + 1; }
  const max = Math.max(0, ...Object.values(cnt));
  const MLEN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const bg = n => `rgba(137,180,250,${(0.15 + 0.85 * n / (max || 1)).toFixed(2)})`;
  const head = `<tr><th></th>${Array.from({ length: 31 }, (_, i) => `<th>${i + 1}</th>`).join('')}<th>yht</th></tr>`;
  const colT = Array(31).fill(0);
  let total = 0;
  const rows = MONTHS_SHORT.map((mn, mi) => {
    let rt = 0;
    const tds = Array.from({ length: 31 }, (_, di) => {
      const d = di + 1;
      if (d > MLEN[mi]) return '<td class="na"></td>';
      const n = cnt[`${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] || 0;
      rt += n; colT[di] += n; total += n;
      return n ? `<td style="background:${bg(n)}; color:#111;">${n}</td>` : '<td></td>';
    }).join('');
    return `<tr><th>${mn}</th>${tds}<th>${rt || ''}</th></tr>`;
  }).join('');
  const tot = `<tr><th>yht</th>${colT.map(n => `<th>${n || ''}</th>`).join('')}<th style="color:var(--c-green);">${total || ''}</th></tr>`;
  const wd = [0, 0, 0, 0, 0, 0, 0];
  for (const f of finds) if (f.day.length >= 10) wd[wdOf(f.day)]++;
  const wdHtml = `<div class="type-coverage" style="margin-top:8px;">` +
    WD_OPTS.map(([i, l]) => `<span class="type-chip" style="border-color:#89b4fa; color:#89b4fa;">${l} ${wd[i]}</span>`).join('') + `</div>`;
  return `<div class="fq-scroll"><table class="dt-matrix fq-cal">${head}${rows}${tot}</table></div>${wdHtml}`;
}

// Löytöpäiväjakauma: montako päivää on 1,2,3... löytöä + eniten löytöjä sisältäneet päivät
function dayDist(finds) {
  const perDay = {};
  for (const f of finds) if (f.day.length >= 10) perDay[f.day] = (perDay[f.day] || 0) + 1;
  const dist = {};
  for (const n of Object.values(perDay)) dist[n] = (dist[n] || 0) + 1;
  const chips = Object.entries(dist).sort((a, b) => +a[0] - +b[0])
    .map(([n, days]) => `<span class="type-chip" style="border-color:#a6e3a1; color:#a6e3a1;">${n} löytöä · ${days} pvä</span>`).join('');
  const fmt = day => `${+day.slice(8)}.${+day.slice(5, 7)}.${day.slice(0, 4)}`;
  const top = Object.entries(perDay).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([day, n]) => `<tr><td>${fmt(day)}</td><td>${n} löytöä</td></tr>`).join('');
  return `<div class="type-coverage">${chips}</div>
    <div class="fq-scroll" style="margin-top:8px;"><table class="finds-table"><thead><tr><th>Päivä</th><th>Löytömäärä</th></tr></thead><tbody>${top}</tbody></table></div>`;
}

// ---------- D/T-ruudukon mobiili-infopopup + listasuodatus ----------
// Mobiilissa title-tooltip ei toimi — klikkaus ruutuun avaa pienen popupin JA
// suodattaa alla olevan löytölistan kyseiseen D/T-ruutuun.
// Popup sulkeutuu kun klikataan mistä tahansa muualta (tai samaa ruutua uudelleen).
let dtPopup = null;
function closeDtPopup() { if (dtPopup) { dtPopup.remove(); dtPopup = null; } }
function dtFilterList(res, dv, tv) {
  let shown = 0;
  res.querySelectorAll('.finds-table tbody tr').forEach(r => {
    r.classList.remove('fq-hidden'); // ruutusuodatus ohittaa näyttörajan
    const ok = parseFloat(r.dataset.d) === parseFloat(dv) && parseFloat(r.dataset.t) === parseFloat(tv);
    r.style.display = ok ? '' : 'none';
    if (ok) shown++;
  });
  res.querySelector('.fq-dtfilter')?.remove();
  const table = res.querySelector('.finds-table');
  if (table) {
    const note = document.createElement('div');
    note.className = 'fq-dtfilter';
    note.innerHTML = `Ruutu D${dv}/T${tv}: ${shown} löytöä · <b class="fq-dt-reset">Näytä kaikki</b>`;
    table.closest('.fq-scroll')?.before(note);
  }
}
document.addEventListener('click', e => {
  // "Näytä kaikki" -palautus löytölistan suodatukseen
  if (e.target.closest('.fq-dt-reset')) {
    const res = document.getElementById('fqResult');
    res?.querySelectorAll('.finds-table tbody tr').forEach(r => r.style.display = '');
    res?.querySelector('.fq-dtfilter')?.remove();
    return;
  }
  const td = e.target.closest('.dt-matrix td[data-break]');
  if (!td) { closeDtPopup(); return; }
  if (dtPopup?._for === td) { closeDtPopup(); return; }
  closeDtPopup();
  const res = document.getElementById('fqResult');
  if (res) dtFilterList(res, td.dataset.dv, td.dataset.tv);
  dtPopup = document.createElement('div');
  dtPopup.className = 'dt-popup';
  dtPopup._for = td;
  dtPopup.innerHTML = td.dataset.break.split(';').map(p => {
    const [ty, n] = p.split(':');
    return `<div style="display:flex; justify-content:space-between; gap:12px; padding:3px 0;">
      <span style="color:${TYPE_COLORS[+ty] || '#888'}; font-weight:600;">${TYPE_NAMES[+ty] || '?'}</span><span>${n}</span></div>`;
  }).join('') + `<div style="font-size:0.72em; opacity:0.6; margin-top:5px; border-top:1px solid rgba(127,127,127,0.25); padding-top:4px;">Lista rajattu tähän ruutuun · klikkaa sulkeaksesi</div>`;
  document.body.appendChild(dtPopup);
  const r = td.getBoundingClientRect();
  const pw = dtPopup.offsetWidth, ph = dtPopup.offsetHeight;
  let left = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8);
  let top = r.bottom + window.scrollY + 6;
  if (top + ph > window.scrollY + window.innerHeight - 8) top = r.top + window.scrollY - ph - 6;
  dtPopup.style.left = left + 'px';
  dtPopup.style.top = top + 'px';
});
document.addEventListener('scroll', closeDtPopup, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDtPopup(); });

// Yksi delegoitu kuuntelija riittää kaikille finds-table-sorttauksille (myös dynaamisesti lisätyille)
document.addEventListener('click', e => {
  const thEl = e.target.closest('.finds-table th[data-k]');
  if (!thEl) return;
  const table = thEl.closest('table');
  const tbody = table.querySelector('tbody');
  const k = thEl.dataset.k;
  const dir = thEl.dataset.dir === 'asc' ? -1 : 1;
  const rows = [...tbody.rows];
  rows.sort((a, b) => {
    const x = a.dataset[k] || '', y = b.dataset[k] || '';
    const nx = parseFloat(x), ny = parseFloat(y);
    return (!isNaN(nx) && !isNaN(ny)) ? (nx - ny) * dir : x.localeCompare(y, 'fi') * dir;
  });
  table.querySelectorAll('th[data-k]').forEach(h => { h.dataset.dir = ''; h.textContent = h.dataset.label; });
  thEl.dataset.dir = dir === 1 ? 'asc' : 'desc';
  thEl.textContent = `${thEl.dataset.label} ${dir === 1 ? '▲' : '▼'}`;
  rows.forEach(r => tbody.appendChild(r));
});

// ---------- Kyselyrekisteri ----------
// input: 'day' | 'month' | 'weekday' | 'attr' | null
// filters: ['types','attr'] — valinnaiset lisäsuodattimet (UI hoitaa ne automaattisesti)
// run(finds, input) -> [{ title, html }, ...]

const FINDS_QUERIES = [
  {
    id: 'day-search',
    title: 'Kalenteripäivähaku',
    desc: 'Yksittäinen päivä tai päiväväli (pp.kk.–pp.kk., voi ylittää vuodenvaihteen) kaikkina vuosina tai valittuna vuosina — puuttuvat tyypit ja D/T-kattavuus.',
    input: 'day',
    filters: ['types', 'attr', 'countries'],
    run(finds, input) {
      const { month, day } = input;
      const m2 = input.month2 || month, d2 = input.day2 || day;
      const a = month * 100 + day, b = m2 * 100 + d2;
      const inRange = f => {
        const v = (+f.day.slice(5, 7)) * 100 + (+f.day.slice(8, 10));
        return a <= b ? (v >= a && v <= b) : (v >= a || v <= b); // väli voi ylittää vuodenvaihteen
      };
      const yOk = f => {
        const y = +f.day.slice(0, 4);
        return (!input.yearFrom || y >= input.yearFrom) && (!input.yearTo || y <= input.yearTo);
      };
      const hits = applyFilters(finds.filter(f => f.day.length >= 10 && inRange(f) && yOk(f)), input);
      const label = a === b ? `${day}.${month}.` : `${day}.${month}.–${d2}.${m2}.`;
      const yr = (input.yearFrom || input.yearTo) ? ` (${input.yearFrom || '…'}–${input.yearTo || '…'})` : '';
      const cov = typeCoverage(hits);
      const mx = dtMatrix(hits);
      return [
        { title: `Kätkötyypit ${label}${yr} — ${cov.found}/${cov.total} löydetty`, html: cov.html },
        { title: `D/T-kattavuus — ${mx.filled}/${mx.total}`, html: mx.html },
        { title: `Löydöt (${hits.length})`, html: hits.length ? findsList(hits) : '<p>Ei löytöjä valitulla välillä.</p>' }
      ];
    }
  },
  {
    id: 'month-dt',
    title: 'Kuukauden D/T-taulukko',
    desc: 'D/T-ruudukko valitulta kuukaudelta kaikkina vuosina.',
    input: 'month',
    filters: ['types', 'attr', 'countries'],
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
    filters: ['types', 'attr', 'countries'],
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
    filters: ['types', 'attr', 'countries'],
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
    filters: ['types', 'countries'],
    run(finds, input) {
      const id = +input.attr;
      const hits = applyFilters(finds.filter(f => f.attrs.includes(id)), input);
      const cov = typeCoverage(hits);
      return [
        { title: `${ATTR_EN[id] || id}: ${hits.length} löytöä — tyyppejä ${cov.found}/${cov.total}`, html: cov.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä tällä attribuutilla.</p>' }
      ];
    }
  },
  {
    id: 'kunta',
    title: 'Paikkakuntahaku',
    desc: 'Mitä kätköjä olen hakenut tietystä kunnasta tai paikkakunnasta — kirjoita nimi ja valitse listasta.',
    input: 'loc',
    filters: ['types', 'attr'],
    run(finds, input) {
      const loc = (input.loc || '').trim().toLowerCase();
      const hits = applyFilters(finds.filter(f => (f.loc || '').toLowerCase() === loc), input);
      const cov = typeCoverage(hits);
      const mx = dtMatrix(hits);
      return [
        { title: `${input.loc || '—'}: ${hits.length} löytöä — tyyppejä ${cov.found}/${cov.total}`, html: cov.html },
        { title: `D/T ${mx.filled}/${mx.total}`, html: mx.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä — tarkista nimi tai valitse se listasta.</p>' }
      ];
    }
  },
  {
    id: 'year-cal',
    title: 'Vuosikalenteri',
    desc: 'Kalenteriruudukko valitulta vuodelta: kuukaudet x päivät, värin voimakkuus = löytömäärä.',
    input: 'year',
    filters: ['types', 'attr', 'countries'],
    run(finds, input) {
      const hits = applyFilters(finds.filter(f => !input.year || +f.day.slice(0, 4) === +input.year), input);
      return [
        { title: `Vuosikalenteri ${input.year || ''} — ${hits.length} löytöä`, html: yearCalendar(hits) },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä tänä vuonna.</p>' }
      ];
    }
  },
  {
    id: 'custom',
    title: 'Monihaku',
    desc: 'Yhdistä vapaasti kuukaudet, viikonpäivät, vuodet + tyypit/maat/attribuutit. Tuloksena tyypit, D/T-ruudukko, vuosikalenteri, löytöpäiväjakauma ja lista.',
    input: 'custom',
    filters: ['types', 'attr', 'countries'],
    run(finds, input) {
      const hits = applyFilters(finds.filter(f => {
        if (f.day.length < 10) return false;
        if (input.months?.length && !input.months.includes(+f.day.slice(5, 7))) return false;
        if (input.weekdays?.length && !input.weekdays.includes(wdOf(f.day))) return false;
        if (input.yearFrom && +f.day.slice(0, 4) < input.yearFrom) return false;
        if (input.yearTo && +f.day.slice(0, 4) > input.yearTo) return false;
        return true;
      }), input);
      const mx = dtMatrix(hits);
      return [
        { title: `Tulokset — ${hits.length} löytöä`, html: typeCoverage(hits).html },
        { title: `D/T ${mx.filled}/${mx.total}`, html: mx.html },
        { title: 'Vuosikalenteri', html: yearCalendar(hits) },
        { title: 'Löytöpäivät', html: dayDist(hits) },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : '<p>Ei löytöjä.</p>' }
      ];
    }
  }
];

// ---------- Näkymä ----------

// Attribuuttivalinnat: viralliset englanninkieliset nimet + negatiiviset ("Ei: ...") -vaihtoehdot
function attrPairs() {
  const pos = Object.entries(ATTR_EN).sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => [id, n]);
  const neg = Object.entries(ATTR_EN).sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => [`-${id}`, `Ei: ${n}`]);
  return [...pos, ...neg];
}

function renderInputs(query, inputDiv, finds) {
  let html = `<p style="font-size:0.8em;opacity:0.7;margin:5px 0 0;">${query.desc}</p>`;
  const years = [...new Set(finds.filter(f => f.day.length >= 10).map(f => +f.day.slice(0, 4)))].sort((a, b) => a - b);
  const yrOptsAll = [['', 'Kaikki'], ...years.map(y => [y, y])];
  const monOpts = MONTHS_FI.map((m, i) => [i + 1, m]);
  const monShort = MONTHS_SHORT.map((m, i) => [i + 1, m]);
  const dayOpts = Array.from({ length: 31 }, (_, i) => [i + 1, i + 1]);
  if (query.input === 'day') {
    html += `<div class="gen-accordion-row">
        <div class="fq-half"><label>Päivä</label>${accField('fqDay', dayOpts, 1)}</div>
        <div class="fq-half"><label>Kuukausi</label>${accField('fqMonth', monOpts, 1)}</div>
      </div>
      <div class="fq-grp"><label>Aikarajaus</label>${accField('fqRangeMode', [['one', 'Vain yksi päivä'], ['range', 'Päiväväli / vuosirajaus']], 'one')}</div>
      <div id="fqExtra" class="hidden">
        <div class="gen-accordion-row">
          <div class="fq-half"><label>Asti: päivä</label>${accField('fqDay2', dayOpts, 1)}</div>
          <div class="fq-half"><label>Asti: kuukausi</label>${accField('fqMonth2', monOpts, 1)}</div>
        </div>
        <div class="gen-accordion-row">
          <div class="fq-half"><label>Vuosi alkaen</label>${accField('fqYearFrom', yrOptsAll, '')}</div>
          <div class="fq-half"><label>Vuosi asti</label>${accField('fqYearTo', yrOptsAll, '')}</div>
        </div>
      </div>`;
  } else if (query.input === 'month') {
    html += `<div class="fq-grp"><label>Kuukausi</label>${accField('fqMonth', monOpts, 1)}</div>`;
  } else if (query.input === 'weekday') {
    html += `<div class="fq-grp"><label>Viikonpäivä</label>${accField('fqWeekday', WEEKDAYS_FI.map(([n, v]) => [v, n]), 1)}</div>`;
  } else if (query.input === 'attr') {
    html += `<div class="fq-grp"><label>Attribuutti</label>${accField('fqAttr', attrPairs(), '', '— Valitse attribuutti —')}</div>`;
  } else if (query.input === 'loc') {
    const counts = {};
    for (const f of finds) if (f.loc) counts[f.loc] = (counts[f.loc] || 0) + 1;
    const locs = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    html += `<label>Kunta / paikkakunta:</label>
      <input id="fqLoc" list="fqLocList" placeholder="Kirjoita kunta..." autocomplete="off" style="margin-bottom:0;">
      <datalist id="fqLocList">${locs.map(([l]) => `<option value="${l}">`).join('')}</datalist>
      <p style="font-size:0.75em; opacity:0.6; margin:4px 0 0;">Suosituimmat: ${locs.slice(0, 5).map(([l, n]) => `${l} (${n})`).join(', ')}</p>`;
  } else if (query.input === 'year') {
    html += `<div class="fq-grp"><label>Vuosi</label>${accField('fqYear', years.map(y => [y, y]), years.at(-1) || '')}</div>`;
  } else if (query.input === 'custom') {
    html += `<div class="fq-grp"><label>Kuukaudet (poista rajaamatta)</label>${chipSel('fqMonths', monShort, '*', 'fq-multi fq-x')}</div>
      <div class="fq-grp"><label>Viikonpäivät</label>${chipSel('fqWeekdays', WD_OPTS, '*', 'fq-multi fq-x')}</div>
      <div class="gen-accordion-row">
        <div class="fq-half"><label>Vuosi alkaen</label>${accField('fqYearFrom', yrOptsAll, '')}</div>
        <div class="fq-half"><label>Vuosi asti</label>${accField('fqYearTo', yrOptsAll, '')}</div>
      </div>`;
  }

  // Yhteiset lisäsuodattimet (filters-taulukossa luetellut)
  const minis = t => `<div class="fq-minis"><button type="button" class="fq-minisel" data-t="${t}" data-on="1">Kaikki</button><button type="button" class="fq-minisel" data-t="${t}">Ei mitään</button></div>`;
  if (query.filters?.includes('types')) {
    html += `<details style="margin-top:6px;">
      <summary style="font-size:0.8em; color:var(--subtext-color); cursor:pointer;">Kätkötyypit (oletuksena kaikki valittuna)</summary>
      <div class="type-coverage" id="fqTypes" style="margin-top:6px;">${TYPE_NAMES.map((n, i) =>
        `<span class="type-chip fq-type fq-on" data-i="${i}" data-color="${TYPE_COLORS[i]}" style="border-color:${TYPE_COLORS[i]}; color:${TYPE_COLORS[i]}; background:${TYPE_COLORS[i]}22; cursor:pointer;">${n}</span>`).join('')}</div>
      ${minis('fqTypes')}
    </details>`;
  }
  if (query.filters?.includes('countries')) {
    const countries = [...new Set(finds.map(f => f.country).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fi'));
    html += `<details style="margin-top:6px;">
      <summary style="font-size:0.8em; color:var(--subtext-color); cursor:pointer;">Maat (oletuksena kaikki, ${countries.length} maata)</summary>
      <div class="type-coverage" id="fqCountries" style="margin-top:6px;">${countries.map(c =>
        `<span class="type-chip fq-country fq-on" data-c="${c}" data-color="#b4befe" style="border-color:#b4befe; color:#b4befe; background:#b4befe22; cursor:pointer;">${c}</span>`).join('')}</div>
      ${minis('fqCountries')}
    </details>`;
  }
  if (query.filters?.includes('attr')) {
    html += `<div class="fq-grp"><label>Attribuuttisuodatin</label>${accField('fqAttrFilter', [['', 'Kaikki attribuutit'], ...attrPairs()], '')}</div>`;
  }
  inputDiv.innerHTML = html;
  wireAccordions(inputDiv);

  // Päiväväli/vuosirajaus -lohko aukeaa Aikarajaus-valinnasta (kuten genTimeSelect generaattorissa)
  const rangeSel = inputDiv.querySelector('#fqRangeMode');
  const extra = inputDiv.querySelector('#fqExtra');
  if (rangeSel && extra) {
    rangeSel.addEventListener('change', () => extra.classList.toggle('hidden', rangeSel.value !== 'range'));
  }

  // Kalenteripäivähaku: "asti"-kentät seuraavat "alkaa"-kenttiä kunnes käyttäjä muuttaa niitä
  const d1 = inputDiv.querySelector('#fqDay'), m1 = inputDiv.querySelector('#fqMonth');
  const d2 = inputDiv.querySelector('#fqDay2'), m2 = inputDiv.querySelector('#fqMonth2');
  if (d1 && d2) {
    let touched = false;
    [d2, m2].forEach(s => s.addEventListener('change', () => touched = true));
    d1.addEventListener('change', () => { if (!touched) setSelectVal(d2, d1.value); });
    m1.addEventListener('change', () => { if (!touched) setSelectVal(m2, m1.value); });
  }

  // Tyyppi- ja maachipit togglettaviksi + Kaikki/Ei mitään -napit
  const setChip = (ch, on) => {
    ch.classList.toggle('fq-on', on);
    ch.style.background = on ? ch.dataset.color + '22' : 'transparent';
    ch.style.opacity = on ? '1' : '0.4';
  };
  inputDiv.querySelectorAll('.fq-type, .fq-country').forEach(ch => {
    ch.onclick = () => setChip(ch, !ch.classList.contains('fq-on'));
  });
  inputDiv.querySelectorAll('.fq-minisel').forEach(b => {
    b.onclick = () => {
      const on = b.dataset.on === '1';
      inputDiv.querySelectorAll(`#${b.dataset.t} .fq-type, #${b.dataset.t} .fq-country`).forEach(ch => setChip(ch, on));
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
      ${accField('fqQuery', FINDS_QUERIES.map((q, i) => [i, q.title]), 0)}
      <div id="fqInput" style="margin-top:8px;"></div>
      <button class="btn btn-primary" id="fqRun" style="margin-top:6px;">Hae</button>
      <div id="fqResult" style="margin-top:15px;"></div>
  </div>`;

  const querySel = document.getElementById('fqQuery');
  const inputDiv = document.getElementById('fqInput');
  const resultDiv = document.getElementById('fqResult');

  wireAccordions(content);
  querySel.addEventListener('change', () => { closeDtPopup(); renderInputs(FINDS_QUERIES[+querySel.value], inputDiv, finds); resultDiv.innerHTML = ''; });
  renderInputs(FINDS_QUERIES[0], inputDiv, finds);

  document.getElementById('fqRun').onclick = () => {
    closeDtPopup();
    const q = FINDS_QUERIES[+querySel.value];
    // Valitut tyyppisuodattimet (jos näkyvissä)
    const typeChips = inputDiv.querySelectorAll('.fq-type');
    const types = typeChips.length
      ? [...typeChips].filter(ch => ch.classList.contains('fq-on')).map(ch => +ch.dataset.i)
      : null;
    const countryChips = inputDiv.querySelectorAll('.fq-country');
    const countries = countryChips.length
      ? [...countryChips].filter(ch => ch.classList.contains('fq-on')).map(ch => ch.dataset.c)
      : null;
    const sel = id => document.getElementById(id);
    const gv = id => +sel(id)?.value || null;
    // 'day'-haun asti/vuosikentät luetaan vain kun "Päiväväli / vuosirajaus" on valittuna
    const rangeOn = sel('fqRangeMode') ? sel('fqRangeMode').value === 'range' : true;
    const input = {
      month: gv('fqMonth'),
      day: gv('fqDay'),
      month2: rangeOn ? gv('fqMonth2') : null,
      day2: rangeOn ? gv('fqDay2') : null,
      yearFrom: rangeOn ? gv('fqYearFrom') : null,
      yearTo: rangeOn ? gv('fqYearTo') : null,
      year: gv('fqYear'),
      weekday: sel('fqWeekday')?.value ?? null,
      months: chipVals(inputDiv, 'fqMonths'),
      weekdays: chipVals(inputDiv, 'fqWeekdays'),
      loc: sel('fqLoc')?.value || null,
      attr: sel('fqAttr')?.value ?? null,          // attribuuttihaku (pakollinen)
      attrFilter: sel('fqAttrFilter')?.value || null, // valinnainen attribuuttisuodatin
      types, countries
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
