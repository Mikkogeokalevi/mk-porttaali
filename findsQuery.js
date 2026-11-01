// findsQuery.js - Löytöhaut: laajennettava kyselyrekisteri findsdata/{vuosi}-datan päälle
// Uusi haku = yksi merkintä FINDS_QUERIES-listaan (input + filters + run); UI ei tarvitse muutoksia.
// Datan rakenne (gpxImport.js): findsdata/{vuosi} = { finds: { GCxxxx: [tyyppiIdx, 'YYYY-MM-DD', D, T, sijainti, 'attr,attr'] } }

import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { ATTR_EN, countryNameFi } from "./gpxImport.js";
import { maakuntienKunnat, suomenMaakunnat } from "./data.js";
import { toast } from "./ui.js";

const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const parseArr = s => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } };

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

const emptyState = (text) => `<div class="empty-state"><span class="empty-icon">🔍</span><p>${text}</p></div>`;

// Kunta-nimien normalisointi: ruotsinkieliset rinnakkaisnimet + Åland/legacy-loc:t.
// maakuntienKunnat käyttää ruotsinkielisiä virallisnimiä (Maarianhamina, Brändö...),
// kun taas GPX-aineisto voi antaa 'Mariehamn' tai maatason 'Aland Islands'.
const LOC_ALIAS = { 'mariehamn': 'maarianhamina', 'pedersören kunta': 'pedersöre' };
const ALAND_REGION_LOCS = ['aland islands', 'åland islands', 'åland', 'ahvenanmaa'];
const canonLoc = l => { const cl = (l || '').normalize('NFC').trim().toLowerCase(); return LOC_ALIAS[cl] || cl; };
const regionLocSet = region => {
  const s = new Set((maakuntienKunnat[region] || []).map(canonLoc));
  if (region === 'Ahvenanmaa') ALAND_REGION_LOCS.forEach(l => s.add(l));
  return s;
};
// kunta (canonLoc) -> maakunta maakuntienKunnat-pohjalta
const KUNTA_TO_MAAKUNTA = {};
for (const [mk, ks] of Object.entries(maakuntienKunnat))
  for (const k of ks) KUNTA_TO_MAAKUNTA[canonLoc(k)] = mk;
// maakuntanimi (canon) -> maakuntienKunnat-avain — GPX-tuonnin maakuntatason
// sijainnit ('Varsinais-Suomi' tms. pitkänmatkan-multien korit) lukeutuvat maakuntaan
const MAAKUNTA_BY_CANON = {};
for (const mk of Object.keys(maakuntienKunnat)) MAAKUNTA_BY_CANON[canonLoc(mk)] = mk;
// stats.municipalities[k].r — kunta->maakunta siten kuin löytökartta sen näkee
let locRegionStats = {};
// Kaikki tunnetut kunta-sijainnit (FI + SE/NO/EE-municipality-avaimet) — kattavuus-
// diagnostiikassa erotellaan "tuntematon loc" vs "muun maan kunta" vs "maanimi"
let knownKuntaLocs = new Set();
// Löydön maakunta: 1) maakuntienKunnat, 2) Åland/legacy-loc, 3) maakuntanimi,
// 4) stats-docin r-kenttä
const locRegion = loc => {
  const cl = canonLoc(loc);
  if (KUNTA_TO_MAAKUNTA[cl]) return KUNTA_TO_MAAKUNTA[cl];
  if (ALAND_REGION_LOCS.includes(cl)) return 'Ahvenanmaa';
  if (MAAKUNTA_BY_CANON[cl]) return MAAKUNTA_BY_CANON[cl];
  return locRegionStats[cl] || null;
};

// ---------- Kuntakartta-haun GeoJSON-apurit ----------
// Kuntarajat haetaan vain kerran per istunto (välimuistitettu promise)
let _kuntaGeoPromise = null;
function loadKuntaGeo() {
  if (!_kuntaGeoPromise) {
    _kuntaGeoPromise = fetch('./kuntarajat_100k.geojson')
      .then(r => { if (!r.ok) throw new Error('GeoJSON ' + r.status); return r.json(); });
  }
  return _kuntaGeoPromise;
}
// GeoJSON-feature -> kunta-nimi (samat kuntaliitoskorjaukset kuin kartoissa)
const GEO_KUNTA_FIX = { 'Pertunmaa': 'Mäntyharju', 'Pedersören kunta': 'Pedersöre', 'Mariehamn': 'Maarianhamina' };
const geoKuntaName = f => {
  const p = f.properties || {};
  const n = p.Name || p.name || p.NAMEFIN || p.nimi || '';
  return GEO_KUNTA_FIX[n] || n;
};
// maailma.geojson properties.name -> Groundspeak-maanimi (kuntakartan "muut maat"
// -värittämistä varten; sama lista kuin stats.js:n GEO_ALIASES mutta käänteisenä)
const GEOJSON_TO_GROUNDSPEAK = {
  'United States of America': 'United States', 'Republic of Serbia': 'Serbia',
  'The Bahamas': 'Bahamas', 'Macedonia': 'North Macedonia', 'Czech Republic': 'Czechia',
  'East Timor': 'Timor-Leste', 'Swaziland': 'Eswatini', 'Ivory Coast': "Côte d'Ivoire",
  'Democratic Republic of the Congo': 'Democratic Republic of Congo',
  'Republic of the Congo': 'Republic of Congo', 'West Bank': 'Palestine',
  'Myanmar': 'Myanmar (Burma)', 'United Republic of Tanzania': 'Tanzania',
  'Kyrgyzstan': 'Kyrgyz Republic', 'Brunei': 'Brunei Darussalam',
  'Laos': "Lao People's Democratic Republic", 'Vietnam': 'Viet Nam',
  'Iran': 'Iran (Islamic Republic of)', 'Russia': 'Russian Federation',
  'Bolivia': 'Bolivia (Plurinational State of)', 'Venezuela': 'Venezuela (Bolivarian Republic of)',
  'Syria': 'Syrian Arab Republic', 'Moldova': 'Republic of Moldova'
};

// ---------- Datan lataus (välimuistitettu istunnon ajaksi) ----------

let findsCache = null;
let findsCacheUpdatedAt = null;
// Kutsutaan kun findsdata/talousdata muuttuu (GPX-tuonti, kunta-määritykset,
// maakarttojen tallennukset) — muuten haut näyttäisivät vanhaa dataa istunnossa.
export function invalidateFindsCache() { findsCache = null; findsCacheUpdatedAt = null; locRegionStats = {}; knownKuntaLocs = new Set(); }
// Viimeisin findsdata-päivitys (Firestore Timestamp | null) — näytetään näkymän ylälaidassa
export function getFindsUpdatedAt() { return findsCacheUpdatedAt; }
export async function loadFinds(db, uid) {
  if (findsCache) return findsCache;
  // loc-kentässä on kunta (FI/SE/NO/EE) tai maanimi (muut maat) — rakennetaan kunta->maa-kartta
  const [snap, statsSnap, seSnap, noSnap, eeSnap, otherSnap, labSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'findsdata')),
    getDoc(doc(db, 'stats', uid)),
    getDoc(doc(db, 'users', uid, 'sweden', 'finds')),
    getDoc(doc(db, 'users', uid, 'norway', 'finds')),
    getDoc(doc(db, 'users', uid, 'estonia', 'finds')),
    getDoc(doc(db, 'users', uid, 'other_countries', 'finds')),
    getDoc(doc(db, 'users', uid, 'labdata', 'main'))
  ]);
  const locToCountry = {};
  const addLocs = (data, key, name) => { for (const k of Object.keys(data?.[key] || {})) locToCountry[k] = name; };
  addLocs(seSnap.data(), 'municipalities', 'Ruotsi');
  addLocs(noSnap.data(), 'municipalities', 'Norja');
  addLocs(eeSnap.data(), 'municipalities', 'Viro');
  addLocs(statsSnap.data(), 'municipalities', 'Suomi');
  // kunta -> maakunta -kartta stats-docista (entry.r) — maakuntahaun fallback-osuma,
  // sama lähde jolla löytökartta värittää kunnat
  locRegionStats = {};
  for (const [k, e] of Object.entries(statsSnap.data()?.municipalities || {}))
    if (e?.r && e.r !== 'Muu') locRegionStats[canonLoc(k)] = e.r;
  // Tunnetut kunta-sijainnit: FI municipalities + SE/NO/EE municipality-avaimet
  knownKuntaLocs = new Set();
  for (const snap of [statsSnap, seSnap, noSnap, eeSnap])
    for (const k of Object.keys(snap.data()?.municipalities || {})) knownKuntaLocs.add(k);
  for (const ks of Object.values(maakuntienKunnat)) for (const k of ks) knownKuntaLocs.add(k);
  knownKuntaLocs.add('Mariehamn');
  knownKuntaLocs.add('Pedersören kunta');
  for (const c of Object.keys(otherSnap.data()?.countries || {})) locToCountry[c] = countryNameFi(c);
  const FI_LOC_ALIASES = new Set(['Finland', 'Aland Islands', 'Åland Islands', 'Åland', 'Ahvenanmaa', 'Suomi']);
  const resolveCountry = loc =>
    MAAKUNTA_BY_CANON[canonLoc(loc)] ? 'Suomi'
    : (locToCountry[loc] || (FI_LOC_ALIASES.has(loc) ? 'Suomi' : countryNameFi(loc || 'Tuntematon')));

  const finds = [];
  let maxTs = null;
  snap.forEach(d => {
    const t = d.data().updatedAt;
    if (t && (!maxTs || t.toMillis() > maxTs.toMillis())) maxTs = t;
    const data = d.data().finds || {};
    for (const [code, r] of Object.entries(data)) {
      const [type, day, D, T, loc, attrStr, owner] = r;
      finds.push({
        code, type: +type, day: day || '', D: +D || 0, T: +T || 0, loc: loc || '', owner: (owner || '').trim(),
        country: resolveCountry(loc),
        attrs: attrStr ? String(attrStr).split(',').map(Number).filter(n => n) : []
      });
    }
  });
  // LAB-löydöt (Adventure Lab — ei tule GPX:ssä): pseudo-löydöt kun käyttäjä sallii ne asetuksessa.
  // type -1 → eivät määriteltyjä tyyppilukuihin; loc/country/owner/attrs tyhjät → suodattimet ohittavat ne.
  if (localStorage.getItem('fqLabs') === '1' && labSnap.exists()) {
    for (const [day, names] of Object.entries(labSnap.data().finds || {}))
      for (const name of names)
        finds.push({ code: 'LAB', type: -1, day, D: 0, T: 0, loc: '', owner: '', country: '', attrs: [], lab: name });
  }
  findsCache = finds;
  findsCacheUpdatedAt = maxTs;
  return finds;
}

// fi-FI -aikaleima Timestamp/Date-objektille (sama muoto kuin stats.js:n "Data päivitetty")
export function fmtTsFI(t) {
  const d = t?.toDate ? t.toDate() : (t instanceof Date ? t : null);
  return d ? d.toLocaleString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Ei tietoa';
}

// ---------- Suodatus-apuri (tyyppi + attribuutti -filterit) ----------

function applyFilters(finds, { types = null, attr = null, attrs = null, countries = null, loc = null, region = null, owner = null, yearP = null, ym = null, dateFrom = null, dateTo = null } = {}) {
  const typeSet = types && types.length ? new Set(types.map(Number)) : null;
  const attrId = attr ? +attr : null;
  const attrsArr = attrs && attrs.length ? attrs.map(Number) : null; // AND: kaikki valitut vaaditaan
  const countrySet = countries && countries.length ? new Set(countries) : null;
  const locSet = loc ? new Set(loc.split(',').map(s => canonLoc(s)).filter(Boolean)) : null;
  const ownerL = owner ? owner.trim().toLowerCase() : null;
  const yp = yearP ? +yearP : null;
  if (!typeSet && !attrId && !attrsArr && !countrySet && !locSet && !region && !ownerL && !yp && !ym && !dateFrom && !dateTo) return finds;
  return finds.filter(f =>
    (!typeSet || typeSet.has(f.type)) &&
    (!attrId || f.attrs.includes(attrId)) &&
    (!attrsArr || attrsArr.every(a => f.attrs.includes(a))) &&
    (!countrySet || countrySet.has(f.country)) &&
    (!ownerL || (f.owner || '').toLowerCase() === ownerL) &&
    (!locSet || locSet.has(canonLoc(f.loc))) &&
    (!region || locRegion(f.loc) === region) &&
    (!yp || +f.day.slice(0, 4) === yp) &&
    (!ym || f.day.slice(0, 7) === ym) &&
    (!dateFrom || (f.day.length >= 10 && f.day >= dateFrom)) &&
    (!dateTo || (f.day.length >= 10 && f.day <= dateTo))
  );
}

// Tulosotsikoiden aikarajaus-teksti (esim. "— vuosi 2025" / "— 01.06.2025–31.08.2025")
const periodLabel = input =>
  input.yearP ? ` — vuosi ${input.yearP}` :
  input.ym ? ` — ${MONTHS_FI[+input.ym.slice(5, 7) - 1]} ${input.ym.slice(0, 4)}` :
  input.dateFrom && input.dateTo ? ` — ${fmtDayFI(input.dateFrom)}–${fmtDayFI(input.dateTo)}` :
  input.dateFrom ? ` — alkaen ${fmtDayFI(input.dateFrom)}` :
  input.dateTo ? ` — asti ${fmtDayFI(input.dateTo)}` : '';

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
      // Legenda näyttää KAIKKI ruudukossa esiintyvät tyypit, ei vain yleisimmät
      segs.forEach(([ty]) => { const i = +ty; if (i >= 0) usedTypes.add(i); });
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

// Maakunnan kuntakattavuus: löydetyt kunnat vihreinä + lukumäärä, puuttuvat himmennettyinä
function kuntaCoverage(region, hits) {
  const kunnat = maakuntienKunnat[region] || [];
  const counts = {};
  for (const f of hits) { const l = canonLoc(f.loc); if (l) counts[l] = (counts[l] || 0) + 1; }
  const found = kunnat.filter(k => counts[canonLoc(k)]).length;
  return {
    found, total: kunnat.length,
    html: `<div class="type-coverage">${kunnat.map(k =>
      counts[canonLoc(k)]
        ? `<span class="type-chip" style="border-color:var(--c-green); color:var(--c-green); background:#a6e3a122;">${k} ${counts[canonLoc(k)]}</span>`
        : `<span class="type-chip miss">${k}</span>`).join('')}</div>`
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
// YYYY-MM-DD -> suomalainen pp.kk.vvvv-näyttömuoto (data-day pysyy ISO:na sorttausta varten)
const fmtDayFI = d => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (d || '—');
};

// Sarakkeet ovat sortattavia: th[data-k] -> rivin data-attribuutti; sorttaus hoidetaan DOM:ssa
// yhdellä delegoidulla kuuntelijalla (alla), joten lista toimii kaikissa näkymissä.
export function findsList(finds, limit = 300) {
  const sorted = [...finds].sort((a, b) => (a.day < b.day ? 1 : -1));
  const rows = sorted.map((f, i) =>
    `<tr${i >= limit ? ' class="fq-hidden"' : ''} data-code="${f.code}" data-type="${f.type}" data-day="${f.day}" data-d="${f.D || 0}" data-t="${f.T || 0}" data-loc="${f.loc || ''}">` +
    `<td><a href="https://www.geocaching.com/geocache/${f.code}" target="_blank" rel="noopener" style="color:var(--c-blue); font-weight:700; text-decoration:none;">${f.code}</a></td>` +
    `<td style="color:${TYPE_COLORS[f.type] || 'inherit'};">${TYPE_NAMES[f.type] || '?'}</td>` +
    `<td>${fmtDayFI(f.day)}</td><td>${f.D || '—'}</td><td>${f.T || '—'}</td><td>${f.loc || '—'}</td></tr>`
  ).join('');
  const th = (k, label) => `<th data-k="${k}" data-label="${label}" title="Järjestä" tabindex="0" role="button" aria-sort="none">${label}</th>`;
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

// Viimeksi renderöidyn vuosikalenterin päiväkohtaiset löydöt (klikkauspoppupia varten)
let calFinds = {};

// Vuosikalenteri geocache.fi-tyyliin: kuukaudet x päivät, solun sinisävy = löytömäärä.
// Kuluva päivä korostetaan punaisella, ja kalenterin alle listataan puuttuvat päivät.
function yearCalendar(finds, year = null) {
  const cnt = {};
  calFinds = {};
  for (const f of finds) if (f.day.length >= 10) {
    const k = f.day.slice(5);
    cnt[k] = (cnt[k] || 0) + 1;
    (calFinds[k] = calFinds[k] || []).push(f);
  }
  const max = Math.max(0, ...Object.values(cnt));
  const leap = year ? (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) : true;
  const MLEN = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const now = new Date();
  const todayKey = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const bg = n => `rgba(137,180,250,${(0.15 + 0.85 * n / (max || 1)).toFixed(2)})`;
  const head = `<tr><th></th>${Array.from({ length: 31 }, (_, i) => `<th>${i + 1}</th>`).join('')}<th>kpl</th><th>vrk</th></tr>`;
  const colT = Array(31).fill(0);
  const colV = Array(31).fill(0); // päivänumero: monessako kuukaudessa se on täynnä
  const missing = [];
  let total = 0;
  const fullStyle = ' style="background:rgba(166,227,161,0.85); color:#111; font-weight:700;"';
  const rows = MONTHS_SHORT.map((mn, mi) => {
    let rt = 0, rv = 0;
    const tds = Array.from({ length: 31 }, (_, di) => {
      const d = di + 1;
      if (d > MLEN[mi]) return '<td class="na"></td>';
      const k = `${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const n = cnt[k] || 0;
      const tdCls = k === todayKey ? ' class="today"' : '';
      rt += n; colT[di] += n; total += n;
      if (n) { rv++; colV[di]++; } else missing.push(`${d}.${mi + 1}.`);
      return n ? `<td${tdCls} data-mmdd="${k}" style="background:${bg(n)}; color:#111; cursor:pointer;">${n}</td>` : `<td${tdCls} data-mmdd="${k}" style="cursor:pointer;"></td>`;
    }).join('');
    // vrk-sarake: montako kuukauden päivästä on täynnä (vihreä = koko kk)
    return `<tr><th>${mn}</th>${tds}<th>${rt || ''}</th><th${rv === MLEN[mi] ? fullStyle : ''}>${rv || ''}</th></tr>`;
  }).join('');
  // Pystysarake-vrk: monessako kuukaudessa päivänumero on täynnä (vihreä = kaikki kk joissa päivä on olemassa)
  const colMax = Array.from({ length: 31 }, (_, di) => MLEN.filter(l => di + 1 <= l).length);
  const tot = `<tr><th>kpl</th>${colT.map(n => `<th>${n || ''}</th>`).join('')}<th style="color:var(--c-green);">${total || ''}</th><th></th></tr>`;
  const vrk = `<tr><th>vrk</th>${colV.map((n, di) => `<th${n === colMax[di] ? fullStyle : ''}>${n || ''}</th>`).join('')}<th></th><th></th></tr>`;
  // Yhteenveto: montako kalenteripäivää on täynnä (366 = yleiskalenteri / vuosi karkausvuodella)
  const covered = Object.keys(cnt).length;
  const possible = year ? (leap ? 366 : 365) : 366;
  const coverHtml = `<div style="margin-top:8px; font-size:0.85em; color:var(--subtext-color);">Kätkölöytöjä <b style="color:var(--text-color);">${covered}</b> päivänä (${(covered / possible * 100).toFixed(1)}%) ${possible}:sta mahdollisesta päivästä.</div>`;
  const wd = [0, 0, 0, 0, 0, 0, 0];
  for (const f of finds) if (f.day.length >= 10) wd[wdOf(f.day)]++;
  const wdHtml = `<div class="type-coverage" style="margin-top:8px;">` +
    WD_OPTS.map(([i, l]) => `<span class="type-chip" style="border-color:#89b4fa; color:#89b4fa;">${l} ${wd[i]}</span>`).join('') + `</div>`;
  const missingHtml = `<details style="margin-top:8px;"><summary style="font-size:0.8em; color:var(--subtext-color); cursor:pointer;">Päivät ilman löytöä (${missing.length})</summary>
    <div class="type-coverage" style="margin-top:6px;">${missing.map(d => `<span class="type-chip miss">${d}</span>`).join('')}</div></details>`;
  return `<div class="fq-scroll"><table class="dt-matrix fq-cal">${head}${rows}${tot}${vrk}</table></div>${coverHtml}${wdHtml}${missingHtml}`;
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
  // Popupin oma sulje-nappi
  if (e.target.closest('.dt-popup-close')) { closeDtPopup(); return; }
  // Klikkaus popupin sisällä (linkit, vieritys) ei sulje sitä
  if (dtPopup && dtPopup.contains(e.target)) return;
  const td = e.target.closest('.dt-matrix td[data-break]');
  const ctd = e.target.closest('.fq-cal td[data-mmdd]');
  if (!td && !ctd) { closeDtPopup(); return; }
  if (dtPopup?._for === (td || ctd)) { closeDtPopup(); return; }
  closeDtPopup();

  // Vuosikalenterin solu: popup-listaus päivän löydöistä + löytölistan suodatus
  if (ctd) {
    const items = calFinds[ctd.dataset.mmdd] || [];
    const [mm, dd] = ctd.dataset.mmdd.split('-');
    const res = document.getElementById('fqResult');
    if (res && items.length) {
      const codes = new Set(items.map(f => f.code));
      let shown = 0;
      res.querySelectorAll('.finds-table tbody tr').forEach(r => {
        r.classList.remove('fq-hidden');
        const ok = codes.has(r.dataset.code);
        r.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      res.querySelector('.fq-dtfilter')?.remove();
      const table = res.querySelector('.finds-table');
      if (table) {
        const note = document.createElement('div');
        note.className = 'fq-dtfilter';
        note.innerHTML = `Päivä ${+dd}.${+mm}.: ${shown} löytöä · <b class="fq-dt-reset">Näytä kaikki</b>`;
        table.closest('.fq-scroll')?.before(note);
      }
    }
    dtPopup = document.createElement('div');
    dtPopup.className = 'dt-popup';
    dtPopup._for = ctd;
    dtPopup.innerHTML = `<div style="font-weight:700; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <span>${+dd}.${+mm}.</span><span class="dt-popup-close" style="cursor:pointer; opacity:0.55; padding:2px 6px;" title="Sulje">✕</span></div>` +
      (items.length ? items.map(f =>
        `<div style="display:flex; justify-content:space-between; gap:10px; padding:2px 0;">
          <a href="https://www.geocaching.com/geocache/${f.code}" target="_blank" rel="noopener" style="color:var(--c-blue); font-weight:600; text-decoration:none;">${f.code}</a>
          <span style="color:var(--subtext-color); font-size:0.85em;">${f.day.slice(0, 4)}</span>
          <span style="color:${TYPE_COLORS[f.type] || '#888'};">${TYPE_NAMES[f.type] || '?'}</span></div>`).join('')
        : '<div style="opacity:0.6;">Ei löytöjä</div>');
    document.body.appendChild(dtPopup);
    const cr = ctd.getBoundingClientRect();
    const pw = dtPopup.offsetWidth, ph = dtPopup.offsetHeight;
    let left = Math.min(Math.max(8, cr.left + cr.width / 2 - pw / 2), window.innerWidth - pw - 8);
    let top = cr.bottom + window.scrollY + 6;
    if (top + ph > window.scrollY + window.innerHeight - 8) top = cr.top + window.scrollY - ph - 6;
    dtPopup.style.left = left + 'px';
    dtPopup.style.top = top + 'px';
    return;
  }

  const res = document.getElementById('fqResult');
  if (res) dtFilterList(res, td.dataset.dv, td.dataset.tv);
  dtPopup = document.createElement('div');
  dtPopup.className = 'dt-popup';
  dtPopup._for = td;
  dtPopup.innerHTML = td.dataset.break.split(';').map(p => {
    const [ty, n] = p.split(':');
    return `<div style="display:flex; justify-content:space-between; gap:12px; padding:3px 0;">
      <span style="color:${TYPE_COLORS[+ty] || '#888'}; font-weight:600;">${TYPE_NAMES[+ty] || '?'}</span><span>${n}</span></div>`;
  }).join('') + `<div style="font-size:0.72em; opacity:0.6; margin-top:5px; border-top:1px solid rgba(127,127,127,0.25); padding-top:4px;">Lista rajattu tähän ruutuun · klikkaa muualta sulkeaksesi</div>`;
  document.body.appendChild(dtPopup);
  const r = td.getBoundingClientRect();
  const pw = dtPopup.offsetWidth, ph = dtPopup.offsetHeight;
  let left = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8);
  let top = r.bottom + window.scrollY + 6;
  if (top + ph > window.scrollY + window.innerHeight - 8) top = r.top + window.scrollY - ph - 6;
  dtPopup.style.left = left + 'px';
  dtPopup.style.top = top + 'px';
});
// Suljetaan vain jos vieritetään muualla kuin popupin sisällä (popup pysyy
// paikallaan suhteessa soluun koska se on ankkuroitu dokumenttikoordinaatteihin,
// mutta muu vieritys = käyttäjä siirtyi muuhun -> siisti sulkeminen)
document.addEventListener('scroll', e => { if (!dtPopup?.contains(e.target)) closeDtPopup(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDtPopup(); });

// Yksi delegoitu kuuntelija riittää kaikille finds-table-sorttauksille (myös dynaamisesti lisätyille)
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const thEl = e.target.closest?.('.finds-table th[data-k]');
  if (thEl) { e.preventDefault(); thEl.click(); }
});
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
    const nx = x === '' ? NaN : Number(x), ny = y === '' ? NaN : Number(y);
    return (!isNaN(nx) && !isNaN(ny)) ? (nx - ny) * dir : x.localeCompare(y, 'fi') * dir;
  });
  table.querySelectorAll('th[data-k]').forEach(h => { h.dataset.dir = ''; h.textContent = h.dataset.label; h.setAttribute('aria-sort', 'none'); });
  thEl.dataset.dir = dir === 1 ? 'asc' : 'desc';
  thEl.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
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
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'owner'],
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
        { title: `Löydöt (${hits.length})`, html: hits.length ? findsList(hits) : emptyState('Ei löytöjä valitulla välillä.') }
      ];
    }
  },
  {
    id: 'month-dt',
    title: 'Kuukauden D/T-taulukko',
    desc: 'D/T-ruudukko valitulta kuukaudelta kaikkina vuosina.',
    input: 'month',
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const { month } = input;
      const mm = String(month).padStart(2, '0');
      const hits = applyFilters(finds.filter(f => f.day.slice(5, 7) === mm), input);
      const mx = dtMatrix(hits);
      return [
        { title: `${MONTHS_FI[month - 1]}: D/T ${mx.filled}/${mx.total} (${hits.length} löytöä)`, html: mx.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä tässä kuussa.') }
      ];
    }
  },
  {
    id: 'weekday-dt',
    title: 'Viikonpäivän D/T-taulukko',
    desc: 'D/T-ruudukko valitulta viikonpäivältä (esim. kaikki lauantai-löydöt).',
    input: 'weekday',
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
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
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä tänä viikonpäivänä.') }
      ];
    }
  },
  {
    id: 'all-dt',
    title: 'Koko D/T-matriisi',
    desc: 'Kaikkien löytöjen D/T-ruudukko — suodata vapaasti tyypeillä ja attribuuteilla.',
    input: null,
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const mx = dtMatrix(hits);
      return [
        { title: `Kaikki löydöt: D/T ${mx.filled}/${mx.total} (${hits.length} löytöä)`, html: mx.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä.') }
      ];
    }
  },
  {
    id: 'attr-search',
    title: 'Attribuuttihaku',
    desc: 'Löydöt joilla valittu attribuutti (esim. kiipeily, lumikengät, yökätköily).',
    input: 'attr',
    filters: ['types', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const id = +input.attr;
      const hits = applyFilters(finds.filter(f => f.attrs.includes(id)), input);
      const cov = typeCoverage(hits);
      return [
        { title: `${ATTR_EN[id] || id}: ${hits.length} löytöä — tyyppejä ${cov.found}/${cov.total}`, html: cov.html },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä tällä attribuutilla.') }
      ];
    }
  },
  {
    id: 'kunta',
    title: 'Paikkakuntahaku',
    desc: 'Mitä kätköjä olen hakenut tietystä kunnasta tai paikkakunnasta — kirjoita nimi ja valitse listasta. Voit rajata tulokset tietylle vuodelle tai vapaalle aikavälille.',
    input: 'loc',
    filters: ['types', 'attr', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const cov = typeCoverage(hits);
      const mx = dtMatrix(hits);
      return [
        { title: `${input.loc || '—'}: ${hits.length} löytöä${periodLabel(input)} — tyyppejä ${cov.found}/${cov.total}`, html: cov.html },
        { title: `D/T ${mx.filled}/${mx.total}`, html: mx.html },
        { title: 'Vuosikalenteri', html: yearCalendar(hits) },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä — tarkista nimi tai valitse se listasta.') }
      ];
    }
  },
  {
    id: 'maakunta',
    title: 'Maakuntahaku',
    desc: 'Mitä kätköjä olen hakenut maakunnasta — valitse maakunta listasta. Voit rajata tulokset kunnalla, vuodella tai vapaalla aikavälillä.',
    input: 'region',
    filters: ['types', 'attr', 'loc', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds.filter(f => locRegion(f.loc) === input.region), input);
      const cov = typeCoverage(hits);
      const mx = dtMatrix(hits);
      const kun = kuntaCoverage(input.region, hits);
      const kunSet = new Set((maakuntienKunnat[input.region] || []).map(canonLoc));
      // Löydöt jotka lukeutuvat maakuntaan mutta joiden loc ei ole maakunnan kunta
      // (vanha tuonti, maanimi tms.) — listataan arvot diagnosoitavaksi
      const offLocs = [...new Set(hits.filter(f => !kunSet.has(canonLoc(f.loc))).map(f => f.loc || '(tyhjä)'))];
      const kunattomat = hits.filter(f => !kunSet.has(canonLoc(f.loc))).length;
      const kunNote = kunattomat
        ? `<p style="font-size:0.8em; color:var(--c-peach); margin:6px 0 0;">⚠ ${kunattomat} löytöä ilman maakunnan kuntaa (loc: ${offLocs.slice(0, 10).join(', ')}) — kunta päivittyy GPX-uudelleentuonnilla.</p>` : '';
      // Diagnostiikka: jos 0 osumaa, näytä loc-arvot joita ei liitetty mihinkään maakuntaan
      let diag = '';
      if (!hits.length && input.region) {
        const unmapped = [...new Set(finds.filter(f => !locRegion(f.loc)).map(f => f.loc || '(tyhjä)'))].slice(0, 15);
        if (unmapped.length) diag = `<details style="margin-top:6px;"><summary style="font-size:0.8em; cursor:pointer;">Sijaintiarvoja ilman maakuntaa</summary><p style="font-size:0.8em; opacity:0.7; margin:4px 0 0;">${unmapped.join(', ')}</p></details>`;
      }
      return [
        { title: `${input.region || '—'}: ${hits.length} löytöä${periodLabel(input)}`, html: kun.html + kunNote + diag },
        { title: `Kunnat ${kun.found}/${kun.total} — tyyppejä ${cov.found}/${cov.total}`, html: cov.html },
        { title: `D/T ${mx.filled}/${mx.total}`, html: mx.html },
        { title: 'Vuosikalenteri', html: yearCalendar(hits) },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä — valitse maakunta listasta.') }
      ];
    }
  },
  {
    id: 'kattavuus',
    title: 'Kuntakattavuus',
    desc: 'Kaikki 308 kuntaa maakunnittain — löydetyt vihreinä lukumärineen, puuttuvat himmennettyinä. Näyttää myös sijaintiarvot joita ei tunnistettu maakunnan kunnaksi (esim. nimivariaatio tai vanha tuonti).',
    input: 'none',
    filters: [],
    run(finds) {
      const counts = {};
      const unmapped = {}; // country -> { loc: n }
      for (const f of finds) {
        const cl = canonLoc(f.loc);
        if (KUNTA_TO_MAAKUNTA[cl]) { counts[cl] = (counts[cl] || 0) + 1; continue; }
        if (knownKuntaLocs.has(f.loc)) continue; // ulkomaiden kunta, ok
        const c = f.country || 'Tuntematon';
        (unmapped[c] = unmapped[c] || {})[f.loc || '(tyhjä)'] = (unmapped[c][f.loc || '(tyhjä)'] || 0) + 1;
      }
      const found = Object.keys(counts).length;
      const regHtml = Object.entries(maakuntienKunnat).map(([mk, ks]) => {
        const n = ks.filter(k => counts[canonLoc(k)]).length;
        return `<details style="margin-top:4px;"><summary style="font-size:0.85em; cursor:pointer;">${mk} — ${n}/${ks.length}</summary>
          <div class="type-coverage" style="margin:8px 0;">${ks.map(k => {
            const c = counts[canonLoc(k)];
            return c
              ? `<span class="type-chip" style="border-color:var(--c-green); color:var(--c-green); background:#a6e3a122;">${k} ${c}</span>`
              : `<span class="type-chip miss">${k}</span>`;
          }).join('')}</div></details>`;
      }).join('');
      const unCountries = Object.entries(unmapped)
        .map(([c, locs]) => [c, Object.entries(locs).sort((a, b) => b[1] - a[1])])
        .sort((a, b) => b[1].reduce((s, [, n]) => s + n, 0) - a[1].reduce((s, [, n]) => s + n, 0));
      const unTotal = unCountries.reduce((s, [, locs]) => s + locs.reduce((x, [, n]) => x + n, 0), 0);
      const unHtml = unCountries.length
        ? `<details style="margin-top:10px;" open><summary style="font-size:0.85em; cursor:pointer; color:var(--c-peach);">⚠ ${unTotal} löytöä ei-kunta-sijainneilla (maittain)</summary>
            ${unCountries.map(([c, locs]) => `
              <div style="margin-top:8px;"><b style="font-size:0.8em; color:var(--c-peach);">${c} (${locs.reduce((s, [, n]) => s + n, 0)})</b>
              <div class="type-coverage" style="margin:4px 0;">${locs.map(([l, n]) =>
                `<span class="type-chip" style="border-color:var(--c-peach); color:var(--c-peach);">${l} ${n}</span>`).join('')}</div></div>`).join('')}
            <p style="font-size:0.75em; opacity:0.65; margin:6px 0 0;">Nämä löydöt eivät liity maakunnan kuntaan — maanimet ("Muut maat") ovat normaaleja, mutta suomalaiseen maakuntaan kuuluvat arvot (esim. Aland Islands, Mariehamn) korjaantuvat GPX-uudelleentuonnilla.</p></details>`
        : '';
      return [
        { title: `Kunnat ${found}/308 löydettynä`, html: regHtml + unHtml }
      ];
    }
  },
  {
    id: 'kuntakartta',
    title: 'Kuntakartta',
    desc: 'Kuntakartta suodatettuna — valitse esim. kätkötyypit (letterit), attribuutit (monta = kaikki vaaditaan), paikkakunta/maakunta, maat ja aikarajaus. Kartta värittää kunnat joissa suodatusta vastaavia löytöjä on — myös Ruotsin, Norjan ja Viron kunnat sekä muut maat maatasona. Napauta kuntaa nähdäksesi määrät.',
    input: 'none',
    filters: ['types', 'attrs', 'loc', 'region', 'period', 'countries', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const byKunta = {};   // FI: canon -> {name, mk, n, types}
      const byMuni = {};    // SE/NO/EE: 'Ruotsi|luleå' -> {name, mk, n, types}
      const byCountry = {}; // muut maat (maataso): 'Latvia' -> {name, mk:'maa', geo, n, types}
      for (const f of hits) {
        const cl = canonLoc(f.loc);
        let e;
        if (KUNTA_TO_MAAKUNTA[cl]) {
          e = byKunta[cl] || (byKunta[cl] = { name: f.loc, mk: KUNTA_TO_MAAKUNTA[cl], n: 0, types: {}, finds: [] });
        } else if (f.country === 'Ruotsi' || f.country === 'Norja' || f.country === 'Viro') {
          const k = f.country + '|' + cl;
          e = byMuni[k] || (byMuni[k] = { name: f.loc, mk: f.country, n: 0, types: {}, finds: [] });
        } else {
          const k = f.country || 'Tuntematon';
          e = byCountry[k] || (byCountry[k] = { name: k, mk: 'maa', geo: f.loc, n: 0, types: {}, finds: [] });
        }
        e.n++;
        e.types[f.type] = (e.types[f.type] || 0) + 1;
        e.finds.push(f); // karttaklikkauksen löytölistaa varten
      }
      this._kuntaMap = { byKunta, byMuni, byCountry };
      const rows = [...Object.values(byKunta), ...Object.values(byMuni), ...Object.values(byCountry)]
        .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'fi'));
      const kuntaRows = rows.map(e => {
        const ty = Object.entries(e.types).filter(([, n]) => n > 0)
          .map(([i, n]) => `<span style="color:${TYPE_COLORS[i] || '#888'};">${TYPE_NAMES[i] || '?'} ${n}</span>`).join(' · ');
        return `<tr><td><b>${e.name}</b></td><td style="opacity:0.65; font-size:0.85em;">${e.mk}</td><td><b>${e.n}</b></td><td style="font-size:0.8em;">${ty}</td></tr>`;
      }).join('');
      const nKunta = Object.keys(byKunta).length, nMuni = Object.keys(byMuni).length, nMaa = Object.keys(byCountry).length;
      const scopeTxt = [nKunta ? `${nKunta} suom.kuntaa` : '', nMuni ? `${nMuni} ulkomaan kuntaa` : '', nMaa ? `${nMaa} maata` : '']
        .filter(Boolean).join(' + ');
      return [
        { title: `Kuntakartta — ${scopeTxt || 'ei osumia'}, ${hits.length} löytöä${periodLabel(input)}`,
          html: `<div id="fqKuntaMap" style="height:min(62vh,480px); border-radius:10px; overflow:hidden; background:#11111b;"></div>
            <div style="font-size:0.8em; margin-top:6px;"><span style="color:#7ac74f;">■</span> Suodatusta vastaavia löytöjä &nbsp;<span style="color:#585b70;">■</span> Ei osumia &nbsp;·&nbsp; klikkaa kuntaa → löytölista aukeaa alle</div>
            <div id="fqKuntaSel"></div>` },
        { title: `Sijainnit (${rows.length})`, html: rows.length
          ? `<div class="fq-scroll"><table class="finds-table"><thead><tr><th>Kunta / maa</th><th>Alue</th><th>Löydöt</th><th>Tyypit</th></tr></thead><tbody>${kuntaRows}</tbody></table></div>`
          : emptyState('Ei löytöjä suodatuksella.') },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä suodatuksella.') }
      ];
    },
    // Kutsutaan tulosten innerHTML-renderöinnin jälkeen — kartta käynnistetään vasta kun div on DOM:ssa
    async mount(resultDiv) {
      const el = resultDiv.querySelector('#fqKuntaMap');
      const data = this._kuntaMap;
      if (!el || !data) return;
      const { byKunta, byMuni, byCountry } = data;
      const safeGeo = url => fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
      let fiGeo, seGeo, noGeo, eeGeo, worldGeo;
      try {
        [fiGeo, seGeo, noGeo, eeGeo, worldGeo] = await Promise.all([
          loadKuntaGeo(), safeGeo('./sverige_kommuner.geojson'), safeGeo('./norge_kommuner.geojson'),
          safeGeo('./viro_vald.geojson'), safeGeo('./maailma.geojson')
        ]);
      } catch { el.innerHTML = '<p style="padding:15px; font-size:0.85em;">Kuntarajoja ei saatu ladattua.</p>'; return; }
      if (!fiGeo) { el.innerHTML = '<p style="padding:15px; font-size:0.85em;">Kuntarajoja ei saatu ladattua.</p>'; return; }
      const map = L.map(el, { preferCanvas: true, zoomControl: false }).setView([65.0, 26.0], 5);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', subdomains: 'abc', maxZoom: 19
      }).addTo(map);
      const foundLayers = [];
      // Kuntaklikkaus -> löytölista kartan alle (findsList = sortattava taulukko)
      const selEl = resultDiv.querySelector('#fqKuntaSel');
      const showSel = (e, title) => {
        if (!selEl) return;
        selEl.innerHTML = e && e.finds && e.finds.length
          ? `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin:10px 0 4px;">
               <b style="font-size:0.95em;">${title}: ${e.finds.length} löytöä</b>
               <button type="button" class="btn btn-sm" id="fqKuntaClear">Tyhjennä</button></div>` + findsList(e.finds)
          : `<p style="margin:8px 0 0; font-size:0.85em; opacity:0.7;">${title}: ei osumia suodatuksella.</p>`;
        selEl.querySelector('#fqKuntaClear')?.addEventListener('click', () => { selEl.innerHTML = ''; });
        selEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      // Vahva kontrasti vaaleaa OSM-pohjaa vasten
      const hitStyle = { fillColor: '#7ac74f', weight: 1.5, opacity: 1, color: '#2e5d2e', fillOpacity: 0.65 };
      const missStyle = { fillColor: '#313244', weight: 0.7, opacity: 1, color: 'rgba(60,60,80,0.35)', fillOpacity: 0.05 };
      // Muut maat maatasona (maailma.geojson) — PIIRRETÄÄN ALIMMaksi ettei
      // se syö kunta-kerrosten klikkauksia. Osumattomat maat ei-interaktiivisia.
      if (worldGeo && Object.keys(byCountry).length) {
        const locToEntry = {}; // geojson-nimi (canon) -> entry
        for (const e of Object.values(byCountry)) {
          locToEntry[canonLoc(e.geo)] = e;
          locToEntry[canonLoc(e.name)] = e;
        }
        for (const [g, gs] of Object.entries(GEOJSON_TO_GROUNDSPEAK)) {
          if (locToEntry[canonLoc(gs)]) locToEntry[canonLoc(g)] = locToEntry[canonLoc(gs)];
        }
        L.geoJSON(worldGeo, {
          style: f => locToEntry[canonLoc(f.properties?.name)]
            ? { fillColor: '#7ac74f', weight: 0.8, opacity: 1, color: '#2e5d2e', fillOpacity: 0.45 }
            : { fillColor: '#313244', weight: 0.4, opacity: 1, color: 'rgba(60,60,80,0.2)', fillOpacity: 0.03 },
          onEachFeature: (f, layer) => {
            const e = locToEntry[canonLoc(f.properties?.name)];
            if (!e) { layer.options.interactive = false; return; }
            foundLayers.push(layer); // zoomaa myös maatason löydettyihin maihin
            const ty = Object.entries(e.types).filter(([, n]) => n > 0)
              .map(([i, n]) => `<span style="color:${TYPE_COLORS[i] || '#888'};">${TYPE_NAMES[i] || '?'} ${n}</span>`).join(' · ');
            layer.bindPopup(`<div style="text-align:center; min-width:150px;">
              <strong>${e.name}</strong>
              <div style="font-size:0.8em; opacity:0.7;">maa (maatason löydöt)</div>
              <hr style="margin:5px 0; border-top:1px solid #555;"><b>${e.n} löytöä</b>
              <div style="font-size:0.85em; margin-top:3px;">${ty}</div>
            </div>`);
            layer.on('click', () => showSel(e, e.name));
          }
        }).addTo(map);
      }
      const muniLayer = (geo, nameFn, getEntry, subLabel) => {
        if (!geo) return;
        L.geoJSON(geo, {
          style: f => getEntry(nameFn(f)) ? hitStyle : missStyle,
          onEachFeature: (f, layer) => {
            const name = nameFn(f);
            const e = getEntry(name);
            if (e) foundLayers.push(layer);
            const ty = e ? Object.entries(e.types).filter(([, n]) => n > 0)
              .map(([i, n]) => `<span style="color:${TYPE_COLORS[i] || '#888'};">${TYPE_NAMES[i] || '?'} ${n}</span>`).join(' · ') : '';
            layer.bindPopup(`<div style="text-align:center; min-width:150px;">
              <strong>${name}</strong>
              <div style="font-size:0.8em; opacity:0.7;">${subLabel(name)}</div>
              ${e
                ? `<hr style="margin:5px 0; border-top:1px solid #555;"><b>${e.n} löytöä</b><div style="font-size:0.85em; margin-top:3px;">${ty}</div>`
                : '<div style="color:#f38ba8; margin-top:5px;">Ei osumia suodatuksella</div>'}
            </div>`);
            layer.on('click', () => showSel(e || null, name));
          }
        }).addTo(map);
      };
      muniLayer(fiGeo, geoKuntaName,
        n => byKunta[canonLoc(n)], n => KUNTA_TO_MAAKUNTA[canonLoc(n)] || 'Suomi');
      muniLayer(seGeo, f => (f.properties || {}).kom_namn || f.properties?.name || f.properties?.Name,
        n => byMuni['Ruotsi|' + canonLoc(n)], () => 'Ruotsi');
      muniLayer(noGeo, f => (f.properties || {}).kommunenavn || f.properties?.name || f.properties?.Name,
        n => byMuni['Norja|' + canonLoc(n)], () => 'Norja');
      muniLayer(eeGeo, f => (f.properties || {}).ONIMI || f.properties?.name || f.properties?.Name,
        n => byMuni['Viro|' + canonLoc(n)], () => 'Viro');
      if (foundLayers.length && foundLayers.length < 300) {
        map.fitBounds(L.featureGroup(foundLayers).getBounds().pad(0.08));
      }
    }
  },
  {
    id: 'year-cal',
    title: 'Vuosikalenteri',
    desc: 'Kalenteriruudukko valitulta vuodelta: kuukaudet x päivät, värin voimakkuus = löytömäärä.',
    input: 'year',
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds.filter(f => !input.year || +f.day.slice(0, 4) === +input.year), input);
      const yrLabel = input.year ? String(input.year) : 'kaikki vuodet';
      return [
        { title: `Vuosikalenteri (${yrLabel}) — ${hits.length} löytöä`, html: yearCalendar(hits, input.year || null) },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä tänä vuonna.') }
      ];
    }
  },
  {
    id: 'custom',
    title: 'Monihaku',
    desc: 'Yhdistä vapaasti kuukaudet, viikonpäivät, paikkakunta ja aikarajaus + tyypit/maat/attribuutit. Tuloksena tyypit, D/T-ruudukko, vuosikalenteri, löytöpäiväjakauma ja lista.',
    input: 'custom',
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds.filter(f => {
        if (f.day.length < 10) return false;
        if (input.months?.length && !input.months.includes(+f.day.slice(5, 7))) return false;
        if (input.weekdays?.length && !input.weekdays.includes(wdOf(f.day))) return false;
        return true;
      }), input);
      const mx = dtMatrix(hits);
      return [
        { title: `Tulokset — ${hits.length} löytöä`, html: typeCoverage(hits).html },
        { title: `D/T ${mx.filled}/${mx.total}`, html: mx.html },
        { title: 'Vuosikalenteri', html: yearCalendar(hits) },
        { title: 'Löytöpäivät', html: dayDist(hits) },
        { title: 'Löydöt', html: hits.length ? findsList(hits) : emptyState('Ei löytöjä.') }
      ];
    }
  },
  {
    id: 'ekavika',
    title: 'Eka & vika',
    desc: 'Ensimmäinen ja viimeisin löytö per kunta, maakunta tai vuosi.',
    input: 'grp',
    grpOpts: [['kunta', 'Kunta'], ['maakunta', 'Maakunta / maa'], ['vuosi', 'Vuosi']],
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const groups = {};
      for (const f of hits) { const g = grpLabel(f, input.grp); (groups[g] = groups[g] || []).push(f); }
      const rows = Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([g, fs]) => {
        const srt = fs.slice().sort((a, b) => a.day.localeCompare(b.day));
        const e = srt[0], v = srt[srt.length - 1];
        return `<tr><td style="font-weight:600;">${esc(g)}</td><td>${fs.length}</td>
          <td>${e.day}<br><a href="https://www.geocaching.com/geocache/${e.code}" target="_blank" rel="noopener" style="color:var(--c-blue);">${e.code}</a></td>
          <td>${v.day}<br><a href="https://www.geocaching.com/geocache/${v.code}" target="_blank" rel="noopener" style="color:var(--c-blue);">${v.code}</a></td></tr>`;
      }).join('');
      return [
        { title: `${Object.keys(groups).length} ryhmää — ${hits.length} löytöä`, html: rows ? `<div class="fq-scroll"><table class="finds-table"><thead><tr><th>Ryhmä</th><th>Löydöt</th><th>Ensimmäinen</th><th>Viimeisin</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Ei löytöjä.') }
      ];
    }
  },
  {
    id: 'putki',
    title: 'Pisin putki',
    desc: 'Pisin peräkkäisten päivien löytöputki ja pisin löytötaukosi.',
    input: null,
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const days = [...new Set(hits.map(f => f.day))].sort();
      if (!days.length) return [{ title: 'Putki', html: emptyState('Ei löytöjä.') }];
      const nd = d => new Date(new Date(d + 'T00:00:00Z').getTime() + 864e5).toISOString().slice(0, 10);
      const runs = []; let s = days[0], prev = days[0], n = 1;
      for (let i = 1; i < days.length; i++) {
        if (nd(prev) === days[i]) { n++; prev = days[i]; }
        else { runs.push([s, prev, n]); s = prev = days[i]; n = 1; }
      }
      runs.push([s, prev, n]);
      runs.sort((a, b) => b[2] - a[2]);
      let gap = [days[0], days[0], 0];
      for (let i = 1; i < days.length; i++) {
        const g = Math.round((new Date(days[i]) - new Date(days[i - 1])) / 864e5) - 1;
        if (g > gap[2]) gap = [days[i - 1], days[i], g];
      }
      const top = runs.slice(0, 10).map(([a, b, l], i) => `<tr><td>${i + 1}</td><td>${a}</td><td>${b}</td><td style="font-weight:600;">${l} pv</td></tr>`).join('');
      return [
        { title: `Pisin putki: ${runs[0][2]} päivää (${runs[0][0]} – ${runs[0][1]})`, html: `<div class="fq-scroll"><table class="finds-table"><thead><tr><th>#</th><th>Alkaa</th><th>Päättyy</th><th>Pituus</th></tr></thead><tbody>${top}</tbody></table></div>` },
        { title: 'Pisin löytötako', html: `<p style="margin:0;">${gap[0]} → ${gap[1]} — <b>${gap[2]} päivää</b> ilman löytöjä.</p>` }
      ];
    }
  },
  {
    id: 'attrjako',
    title: 'Attribuuttijakso',
    desc: 'Kuinka monta kertaa kukin attribuutti esiintyy löydöissäsi — top-lista.',
    input: null,
    filters: ['types', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const cnt = {};
      hits.forEach(f => f.attrs.forEach(a => cnt[a] = (cnt[a] || 0) + 1));
      const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1])
        .map(([a, n]) => `<tr><td>${esc(ATTR_EN[a] || a)}</td><td>${n}</td><td>${(n / hits.length * 100).toFixed(1)} %</td></tr>`).join('');
      return [
        { title: `${Object.keys(cnt).length} attribuuttia — ${hits.length} löytöä`, html: rows ? `<div class="fq-scroll"><table class="finds-table"><thead><tr><th>Attribuutti</th><th>Määrä</th><th>% löydöistä</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Ei löytöjä.') }
      ];
    }
  },
  {
    id: 'dtavg',
    title: 'D/T-keskiarvo',
    desc: 'Löytöjesi keskimääräinen vaikeus- ja maasto-arvosana ryhmittäin.',
    input: 'grp',
    grpOpts: [['vuosi', 'Vuosi'], ['kunta', 'Kunta'], ['maakunta', 'Maakunta / maa'], ['tyyppi', 'Kätkötyyppi']],
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const g = {};
      for (const f of hits) {
        const k = grpLabel(f, input.grp === 'tyyppi' ? 'tyyppi' : input.grp);
        (g[k] = g[k] || { n: 0, d: 0, t: 0 }).n++; g[k].d += f.D || 0; g[k].t += f.T || 0;
      }
      const rows = Object.entries(g).sort((a, b) => b[1].n - a[1].n)
        .map(([k, v]) => `<tr><td style="font-weight:600;">${esc(k)}</td><td>${v.n}</td><td>${(v.d / v.n).toFixed(2)}</td><td>${(v.t / v.n).toFixed(2)}</td></tr>`).join('');
      const all = hits.length;
      const sumD = hits.reduce((s, f) => s + (f.D || 0), 0), sumT = hits.reduce((s, f) => s + (f.T || 0), 0);
      return [
        { title: `Keskiarvot — D ${all ? (sumD / all).toFixed(2) : '–'} / T ${all ? (sumT / all).toFixed(2) : '–'}`, html: rows ? `<div class="fq-scroll"><table class="finds-table"><thead><tr><th>Ryhmä</th><th>Löydöt</th><th>Kesk. D</th><th>Kesk. T</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Ei löytöjä.') }
      ];
    }
  },
  {
    id: 'vuosivert',
    title: 'Vuosivertailu',
    desc: 'Kuukausittaiset löytömäärät eri vuosina rinnakkain — näet sesongit.',
    input: null,
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const years = [...new Set(hits.map(f => f.day.slice(0, 4)))].sort();
      if (!years.length) return [{ title: 'Vuosivertailu', html: emptyState('Ei löytöjä.') }];
      const grid = {};
      hits.forEach(f => { const m = +f.day.slice(5, 7), y = f.day.slice(0, 4); (grid[m] = grid[m] || {})[y] = (grid[m][y] || 0) + 1; });
      const head = `<tr><th>Kk</th>${years.map(y => `<th>${y}</th>`).join('')}<th>Yht.</th></tr>`;
      const body = MONTHS_SHORT.map((mn, i) => {
        const r = grid[i + 1] || {}, tot = years.reduce((s, y) => s + (r[y] || 0), 0);
        return `<tr><td style="font-weight:600;">${mn}</td>${years.map(y => `<td${r[y] ? ' style="font-weight:600;"' : ''}>${r[y] || ''}</td>`).join('')}<td style="font-weight:700;">${tot || ''}</td></tr>`;
      }).join('');
      const tot = `<tr style="border-top:2px solid rgba(255,255,255,0.2);"><td style="font-weight:700;">Yht.</td>${years.map(y => `<td style="font-weight:700;">${hits.filter(f => f.day.slice(0, 4) === y).length}</td>`).join('')}<td style="font-weight:700;">${hits.length}</td></tr>`;
      return [
        { title: `${years.length} vuotta — ${hits.length} löytöä`, html: `<div class="fq-scroll"><table class="finds-table"><thead>${head}</thead><tbody>${body}${tot}</tbody></table></div>` }
      ];
    }
  },
  {
    id: 'vuosixtyypit',
    title: 'Vuodet × tyypit',
    desc: 'Löytömäärät vuosittain ja tyypeittäin prosentteineen — geocache.fi:n tilaston vastaava.',
    input: null,
    filters: ['attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      if (!hits.length) return [{ title: 'Vuodet × tyypit', html: emptyState('Ei löytöjä.') }];
      const cell = {}, yTot = {}, tTot = {};
      hits.forEach(f => {
        const y = f.day.slice(0, 4);
        (cell[y] = cell[y] || {})[f.type] = (cell[y][f.type] || 0) + 1;
        yTot[y] = (yTot[y] || 0) + 1; tTot[f.type] = (tTot[f.type] || 0) + 1;
      });
      const years = Object.keys(yTot).sort();
      const total = hits.length;
      const usedTypes = TYPE_NAMES.map((_, i) => i).filter(i => tTot[i]);
      const pct = (n, of) => `<br><small style="opacity:0.6;">${(n / of * 100).toFixed(1)} %</small>`;
      const head = `<tr><th>Vuosi</th>${usedTypes.map(i => `<th style="color:${TYPE_COLORS[i]};">${TYPE_NAMES[i]}</th>`).join('')}<th>Yht.</th></tr>`;
      const body = years.map(y =>
        `<tr><td style="font-weight:700;">${y}<br><small style="opacity:0.6;">${yTot[y]} löytöä</small></td>` +
        usedTypes.map(i => `<td>${cell[y][i] ? `<b>${cell[y][i]}</b>${pct(cell[y][i], yTot[y])}` : '<span style="opacity:0.25;">–</span>'}</td>`).join('') +
        `<td style="font-weight:700;">${yTot[y]}${pct(yTot[y], total)}</td></tr>`
      ).join('');
      const tot = `<tr style="border-top:2px solid rgba(255,255,255,0.2);"><td style="font-weight:700;">Yht.</td>` +
        usedTypes.map(i => `<td style="font-weight:700;">${tTot[i]}${pct(tTot[i], total)}</td>`).join('') +
        `<td style="font-weight:700;">${total}</td></tr>`;
      return [{ title: `${years.length} vuotta × ${usedTypes.length} tyyppiä — ${total} löytöä`, html: `<div class="fq-scroll"><table class="finds-table" style="font-size:0.85em;"><thead>${head}</thead><tbody>${body}${tot}</tbody></table></div>` }];
    }
  },
  {
    id: 'paivaloydot',
    title: 'Päivälöydöt',
    desc: 'Geocache.fi:n päivälöytötilasto — klikkaa riviä nähdäksesi tarkat päivät.',
    input: null,
    filters: ['types', 'attr', 'countries', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      if (!hits.length) return [{ title: 'Päivälöydöt', html: emptyState('Ei löytöjä.') }];
      const perDay = {};
      hits.forEach(f => (perDay[f.day] = perDay[f.day] || []).push(f));
      const hist = {};
      Object.entries(perDay).forEach(([d, fs]) => (hist[fs.length] = hist[fs.length] || []).push(d));
      const totalDays = Object.keys(perDay).length;
      const maxBucket = Math.max(...Object.values(hist).map(d => d.length));
      const wdName = d => (WEEKDAYS_FI.find(w => w[1] === wdOf(d)) || ['?'])[0].slice(0, 2);
      const gapRow = (from, to) => `<div style="display:grid;grid-template-columns:70px 1fr 78px;gap:6px;padding:1px 4px;opacity:0.35;font-size:0.85em;">
        <span style="text-align:center;">⋮</span><span style="font-size:0.8em;align-self:center;">${to === from ? to : `${to}–${from}`} puuttuu</span><span></span></div>`;
      const entries = Object.entries(hist).sort((a, b) => b[0] - a[0]);
      let prevN = null;
      const rows = entries.map(([n, days]) => {
        const nNum = +n;
        let gap = '';
        if (prevN !== null && prevN - nNum > 1) gap = gapRow(prevN - 1, nNum + 1);
        prevN = nNum;
        const srt = days.slice().sort();
        const dayList = srt.map(d => `<div style="padding:4px 2px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.9em;">${d} ${wdName(d)} — ${n} löytöä</div>`).join('');
        return gap + `<details style="margin:0;background:none;border:none;border-radius:0;border-bottom:1px solid rgba(255,255,255,0.08);">
          <summary style="display:flex;align-items:center;gap:6px;padding:5px 2px;font-size:0.88em;font-weight:400;white-space:nowrap;overflow:hidden;-webkit-tap-highlight-color:transparent;">
            <span style="flex:none;width:58px;font-weight:700;">${n} löytöä</span>
            <span style="flex:1;min-width:0;text-align:right;opacity:0.7;font-size:0.82em;">${days.length} pv — ${(days.length / totalDays * 100).toFixed(1)} %</span>
            <span style="flex:none;opacity:0.55;font-size:0.78em;">${srt[0]}</span>
          </summary>
          <div style="padding:0 8px 8px;">${dayList}</div>
        </details>`;
      }).join('');
      const sortBtn = `<div style="text-align:right;margin-bottom:4px;"><button class="btn btn-sm fq-pd-sort" data-dir="desc" style="margin:0;padding:4px 10px;font-size:0.8em;">▲ pienin ensin</button></div>`;
      return [{ title: `${totalDays} löytöpäivää — ${hits.length} löytöä`, html: sortBtn + `<div class="fq-pd-list">${rows}</div>` }];
    }
  },
  {
    id: 'maakalenteri',
    title: 'Maat × kuukaudet',
    desc: 'Missä maissa löytöjä on syntynyt kussakin kuussa — kansainvälinen sesonki.',
    input: null,
    filters: ['types', 'attr', 'loc', 'region', 'period', 'owner'],
    run(finds, input) {
      const hits = applyFilters(finds, input);
      const cnt = {}, grid = {};
      hits.forEach(f => {
        const c = f.country || '—', m = +f.day.slice(5, 7);
        cnt[c] = (cnt[c] || 0) + 1; (grid[c] = grid[c] || {})[m] = (grid[c][m] || 0) + 1;
      });
      const cs = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([c]) => c);
      if (!cs.length) return [{ title: 'Maat × kuukaudet', html: emptyState('Ei löytöjä.') }];
      const head = `<tr><th>Maa</th>${MONTHS_SHORT.map(m => `<th>${m}</th>`).join('')}<th>Yht.</th></tr>`;
      const body = cs.map(c => `<tr><td style="font-weight:600; white-space:nowrap;">${esc(countryNameFi(c))}</td>${MONTHS_SHORT.map((_, i) => `<td${grid[c][i + 1] ? ' style="font-weight:600;"' : ''}>${grid[c][i + 1] || ''}</td>`).join('')}<td style="font-weight:700;">${cnt[c]}</td></tr>`).join('');
      return [
        { title: `${cs.length} maata — ${hits.length} löytöä`, html: `<div class="fq-scroll"><table class="finds-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>` }
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
  // Paikkakuntalista (datalist): loc-kentän esiintymät laskevassa järjestyksessä
  const locCounts = {};
  for (const f of finds) if (f.loc) locCounts[f.loc] = (locCounts[f.loc] || 0) + 1;
  const locs = Object.entries(locCounts).sort((a, b) => b[1] - a[1]);
  const locDataList = id => `<datalist id="${id}">${locs.map(([l]) => `<option value="${l}">`).join('')}</datalist>`;

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
  } else if (query.input === 'grp') {
    html += `<div class="fq-grp"><label>Ryhmittely</label>${accField('fqGrp', query.grpOpts, query.grpOpts[0][0])}</div>`;
  } else if (query.input === 'month') {
    html += `<div class="fq-grp"><label>Kuukausi</label>${accField('fqMonth', monOpts, 1)}</div>`;
  } else if (query.input === 'weekday') {
    html += `<div class="fq-grp"><label>Viikonpäivä</label>${accField('fqWeekday', WEEKDAYS_FI.map(([n, v]) => [v, n]), 1)}</div>`;
  } else if (query.input === 'attr') {
    html += `<div class="fq-grp"><label>Attribuutti</label>${accField('fqAttr', attrPairs(), '', '— Valitse attribuutti —')}</div>`;
  } else if (query.input === 'loc') {
    html += `<label>Kunta / paikkakunta:</label>
      <div style="display:flex; gap:6px;">
        <input type="text" id="fqLoc" list="fqLocList" placeholder="Kirjoita kunta..." autocomplete="off" style="margin-bottom:0; flex:1;">
        <button type="button" class="btn btn-sm fq-kunta-pick" data-target="fqLoc" title="Valitse kunnat listasta" style="margin:0; white-space:nowrap;">⚙️</button>
      </div>
      ${locDataList('fqLocList')}
      <p style="font-size:0.75em; opacity:0.6; margin:4px 0 0;">Voit antaa useita pilkulla: Lahti, Hollola. Suosituimmat: ${locs.slice(0, 5).map(([l, n]) => `${l} (${n})`).join(', ')}</p>`;
  } else if (query.input === 'region') {
    html += `<div class="fq-grp"><label>Maakunta</label>${accField('fqRegion', [['', '— Valitse maakunta —'], ...suomenMaakunnat.map(m => [m, m])], '')}</div>`;
  } else if (query.input === 'year') {
    html += `<div class="fq-grp"><label>Vuosi</label>${accField('fqYear', yrOptsAll, '')}</div>`;
  } else if (query.input === 'custom') {
    html += `<div class="fq-grp"><label>Kuukaudet (poista rajaamatta)</label>${chipSel('fqMonths', monShort, '*', 'fq-multi fq-x')}</div>
      <div class="fq-grp"><label>Viikonpäivät</label>${chipSel('fqWeekdays', WD_OPTS, '*', 'fq-multi fq-x')}</div>`;
  }

  // Jaettu paikkakunta-suodatin (geocache.fi-malli: vapaa tekstikenttä + datalist)
  if (query.filters?.includes('loc')) {
    html += `<div class="fq-grp"><label>Paikkakunta</label>
      <div style="display:flex; gap:6px;">
        <input type="text" id="fqLocFilter" list="fqLocListF" placeholder="Kaikki paikkakunnat" autocomplete="off" style="margin-bottom:0; flex:1;">
        <button type="button" class="btn btn-sm fq-kunta-pick" data-target="fqLocFilter" title="Valitse kunnat listasta" style="margin:0; white-space:nowrap;">⚙️</button>
      </div>
      ${locDataList('fqLocListF')}
      <p style="font-size:0.75em; opacity:0.6; margin:4px 0 0;">Voit antaa useita pilkulla: Lahti, Hollola — tai valitse ⚙️-napilla maakunta → kunnat.</p></div>`;
  }

  // Jaettu maakunta-suodatin (geocache.fi-malli: mkunta)
  if (query.filters?.includes('region')) {
    html += `<div class="fq-grp"><label>Maakunta</label>${accField('fqRegionF', [['', 'Kaikki maakunnat'], ...suomenMaakunnat.map(m => [m, m])], '')}</div>`;
  }

  // Jaettu piilottaja-suodatin (GPX:n placed_by — datalist-ehdotukset)
  if (query.filters?.includes('owner')) {
    const owners = [...new Set(finds.map(f => f.owner).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fi'));
    html += `<div class="fq-grp"><label>Piilottaja</label>
      <input type="text" id="fqOwner" list="fqOwnerList" placeholder="Kaikki piilottajat" autocomplete="off" style="margin-bottom:0;">
      <datalist id="fqOwnerList">${owners.map(o => `<option value="${o}">`).join('')}</datalist>
      ${owners.length ? '' : `<p style="font-size:0.75em; opacity:0.6; margin:4px 0 0;">Piilottajat tallentuvat vasta seuraavan GPX-tuonnin jälkeen.</p>`}</div>`;
  }

  // Jaettu aikarajaus (geocache.fi-malli: Kaikki ajat / Tietty vuosi / Tietty kuukausi / Vapaa aikaväli)
  if (query.filters?.includes('period')) {
    html += `<div class="fq-grp"><label>Aikarajaus</label>${accField('fqPeriod', [['all', 'Kaikki ajat'], ['year', 'Tietty vuosi'], ['month', 'Tietty kuukausi'], ['range', 'Vapaa aikaväli']], 'all')}</div>
      <div id="fqPeriodYear" class="hidden"><div class="fq-grp"><label>Vuosi</label>${accField('fqYearP', years.map(y => [y, y]), years.at(-1) || '')}</div></div>
      <div id="fqPeriodMonth" class="hidden"><div class="gen-accordion-row">
        <div class="fq-half"><label>Vuosi</label>${accField('fqYearM', years.map(y => [y, y]), years.at(-1) || '')}</div>
        <div class="fq-half"><label>Kuukausi</label>${accField('fqMonthP', monOpts, new Date().getMonth() + 1)}</div>
      </div></div>
      <div id="fqPeriodRange" class="hidden"><div class="gen-accordion-row">
        <div class="fq-half"><label>Alkaen</label><input type="date" id="fqDateFrom" style="margin:0;"></div>
        <div class="fq-half"><label>Asti</label><input type="date" id="fqDateTo" style="margin:0;"></div>
      </div></div>`;
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
  if (query.filters?.includes('attrs')) {
    html += `<details style="margin-top:6px;">
      <summary style="font-size:0.8em; color:var(--subtext-color); cursor:pointer;">Attribuutit (valitut vaaditaan kaikki — esim. Letteri + Esteetön)</summary>
      <div class="type-coverage" id="fqAttrs" style="margin-top:6px; max-height:200px; overflow-y:auto;">${attrPairs().map(([id, n]) =>
        `<span class="type-chip fq-attr" data-a="${id}" data-color="#89b4fa" style="border-color:#89b4fa; color:#89b4fa; cursor:pointer;">${n}</span>`).join('')}</div>
      ${minis('fqAttrs')}
    </details>`;
  }
  inputDiv.innerHTML = html;
  wireAccordions(inputDiv);

  // Maakuntavalinta rajaa Paikkakunta-datalistin ko. maakunnan kuntiin
  const locListF = inputDiv.querySelector('#fqLocListF');
  if (locListF) {
    const upd = region => {
      const ks = maakuntienKunnat[region] || [];
      locListF.innerHTML = ks.length
        ? ks.map(k => `<option value="${k}">`).join('')
        : locs.map(([l]) => `<option value="${l}">`).join('');
    };
    for (const id of ['#fqRegion', '#fqRegionF']) {
      const sel = inputDiv.querySelector(id);
      if (sel) sel.addEventListener('change', () => upd(sel.value));
    }
  }

  // Päiväväli/vuosirajaus -lohko aukeaa Aikarajaus-valinnasta (kuten genTimeSelect generaattorissa)
  const rangeSel = inputDiv.querySelector('#fqRangeMode');
  const extra = inputDiv.querySelector('#fqExtra');
  if (rangeSel && extra) {
    rangeSel.addEventListener('change', () => extra.classList.toggle('hidden', rangeSel.value !== 'range'));
  }

  // Jaettu aikarajaus: Tietty vuosi -> vuosivalitsin, Tietty kuukausi -> vuosi+kk, Vapaa aikaväli -> pvm-kentät
  const periodSel = inputDiv.querySelector('#fqPeriod');
  if (periodSel) {
    const yWrap = inputDiv.querySelector('#fqPeriodYear');
    const mWrap = inputDiv.querySelector('#fqPeriodMonth');
    const rWrap = inputDiv.querySelector('#fqPeriodRange');
    periodSel.addEventListener('change', () => {
      yWrap.classList.toggle('hidden', periodSel.value !== 'year');
      mWrap.classList.toggle('hidden', periodSel.value !== 'month');
      rWrap.classList.toggle('hidden', periodSel.value !== 'range');
    });
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
  inputDiv.querySelectorAll('.fq-type, .fq-country, .fq-attr').forEach(ch => {
    ch.onclick = () => setChip(ch, !ch.classList.contains('fq-on'));
  });
  inputDiv.querySelectorAll('.fq-minisel').forEach(b => {
    b.onclick = () => {
      const on = b.dataset.on === '1';
      inputDiv.querySelectorAll(`#${b.dataset.t} .fq-type, #${b.dataset.t} .fq-country, #${b.dataset.t} .fq-attr`).forEach(ch => setChip(ch, on));
    };
  });
}

// Ryhmittelyavain ryhmiteltäviä hakuja varten (Eka & vika, D/T-keskiarvo)
function grpLabel(f, grp) {
  if (grp === 'kunta') return canonLoc(f.loc) || f.loc || '—';
  if (grp === 'maakunta') return locRegion(f.loc) || countryNameFi(f.country) || '—';
  if (grp === 'tyyppi') return TYPE_NAMES[f.type] || '?';
  return f.day.slice(0, 4); // vuosi
}

// Kunta-poimija (generatorin malli): maakunta → ruksivalinnat → "Lisää valitut"
let _fqKmTarget = null;
function ensureFqKuntaModal() {
  if (document.getElementById('fqKuntaModal')) return;
  const m = document.createElement('div');
  m.id = 'fqKuntaModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);display:none;align-items:center;justify-content:center;z-index:10000;padding:12px;';
  m.innerHTML = `
    <div class="panel" style="width:100%;max-width:420px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
      <div id="fqKmTitle" style="padding:14px 16px;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.1);">Valitse maakunta</div>
      <div id="fqKmBody" style="flex:1;overflow-y:auto;padding:6px 0;-webkit-overflow-scrolling:touch;"></div>
      <div style="padding:10px;display:flex;gap:8px;border-top:1px solid rgba(255,255,255,0.1);">
        <button class="btn" id="fqKmBack" style="flex:1;margin:0;display:none;">← Takaisin</button>
        <button class="btn btn-primary" id="fqKmAdd" style="flex:1;margin:0;display:none;">Lisää valitut</button>
        <button class="btn" id="fqKmClose" style="flex:1;margin:0;">Sulje</button>
      </div>
    </div>`;
  document.body.appendChild(m);
  const body = m.querySelector('#fqKmBody'), title = m.querySelector('#fqKmTitle');
  const back = m.querySelector('#fqKmBack'), add = m.querySelector('#fqKmAdd');
  const close = () => { m.style.display = 'none'; document.body.classList.remove('modal-open'); };
  const showRegions = () => {
    title.textContent = 'Valitse maakunta';
    back.style.display = add.style.display = 'none';
    const regs = Object.keys(maakuntienKunnat).sort((a, b) => a.localeCompare(b, 'fi'));
    body.innerHTML = regs.map(r => `<div class="fq-km-reg" data-r="${r}" style="padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:1.05em;cursor:pointer;">${r}</div>`).join('');
  };
  const showKunnat = reg => {
    title.textContent = `Valitse kunnat (${reg})`;
    back.style.display = add.style.display = '';
    const cur = new Set((_fqKmTarget?.value || '').split(',').map(s => canonLoc(s.trim())).filter(Boolean));
    const ks = (maakuntienKunnat[reg] || []).slice().sort((a, b) => a.localeCompare(b, 'fi'));
    body.innerHTML = ks.map(k => `<label style="display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:1.02em;cursor:pointer;">
      <input type="checkbox" class="fq-km-cb" value="${k}" ${cur.has(canonLoc(k)) ? 'checked' : ''} style="width:20px;height:20px;flex:none;">${k}</label>`).join('');
  };
  body.onclick = e => { const d = e.target.closest('.fq-km-reg'); if (d) showKunnat(d.dataset.r); };
  back.onclick = showRegions;
  m.querySelector('#fqKmClose').onclick = close;
  m.addEventListener('click', e => { if (e.target === m) close(); });
  add.onclick = () => {
    const sel = [...body.querySelectorAll('.fq-km-cb:checked')].map(c => c.value);
    if (_fqKmTarget && sel.length) {
      const cur = (_fqKmTarget.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const curC = new Set(cur.map(canonLoc));
      _fqKmTarget.value = cur.concat(sel.filter(k => !curC.has(canonLoc(k)))).join(', ');
      _fqKmTarget.dispatchEvent(new Event('input'));
    }
    close();
  };
  document.body.addEventListener('click', e => {
    const b = e.target.closest('.fq-kunta-pick');
    if (!b) return;
    _fqKmTarget = document.getElementById(b.dataset.target);
    showRegions();
    m.style.display = 'flex';
    document.body.classList.add('modal-open');
  });
}

export const renderFindsQueries = async (db, user, content) => {
  content.innerHTML = `<div class="card"><h1>Löytöhaut</h1><div class="loading-wrap" style="margin-top:20px;"><div class="spinner"></div></div></div>`;
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
      <p style="font-size:0.85em; color:var(--success-color); margin-bottom:4px;">📅 Data päivitetty: <b>${fmtTsFI(getFindsUpdatedAt())}</b></p>
      <label style="display:flex; align-items:center; gap:7px; font-size:0.85em; margin-bottom:8px; cursor:pointer;">
        <input type="checkbox" id="fqLabsToggle" style="width:18px;height:18px;"> Sisällytä LAB-löydöt tilastoihin (Adventure Lab — tuodaan Asetuksista)
      </label>
      ${(() => {
        // Löydöt joiden sijainti on vain maakuntatasoa (pitkänmatkan-multien
        // valekoordinaatit, Åland/Islanti-tunnisteiset yms.) — vaativat
        // kunta-määrityksen Muut maat -näkymässä. Näytetään VAIN kun korjattavaa on.
        const regionLevel = finds.filter(f => locRegion(f.loc) && !KUNTA_TO_MAAKUNTA[canonLoc(f.loc)]).length;
        if (!regionLevel) return '';
        return `<div class="panel" style="padding:12px 14px; margin:10px 0; border:2px solid var(--c-peach); background:rgba(249,226,175,0.07);">
          <b style="color:var(--c-peach); font-size:1.02em;">⚠️ Kuntasijaintien rajoitus: pitkänmatkan-multit, mysstit ja wherigot</b>
          <p style="margin:6px 0 4px; font-size:0.86em; line-height:1.55;">GPX-tiedosto sisältää kätkön <b>loppupisteen</b> koordinaatit — ei lähtöpistettä, jonka mukaan geocache.fi laskee kunnan. Jos lähtö ja loppu ovat eri kunnissa, löytö voi kirjautua väärään kuntaan. Tuonti tunnistaa maakuntatason erot automaattisesti (GPX:n maakuntatieto vs koordinaatit) ja siirtää ne maakuntatasolle.</p>
          <p style="margin:0 0 4px; font-size:0.86em;"><b style="color:var(--c-peach);">${regionLevel} löytöä</b> on tällä hetkellä vain maakuntatasolla — <b>korjaa kertaalleen</b>: Tilastot → Muut maat → "Käsin määrityt kunnat". Valinnat säilyvät pysyvästi jokaisessa tuonnissa.</p>
          <button class="btn btn-sm" onclick="app.router('stats_other')" style="margin-top:4px;">✏️ Avaa kunta-määritykset</button>
        </div>`;
      })()}
      <p style="font-size:0.85em; opacity:0.75; margin-top:0;">Kyselyjä GPX-tuotuun löytödataan (${finds.length} löytöä). Uusia hakuja lisätään helposti — kerro toiveesi!</p>
      ${(() => {
        const noDate = finds.filter(f => f.day.length < 10);
        // LAB-pseudo-löydöillä (f.lab) on tahallaan type:-1 — eivät kuulu tuntemattomiin
        const noType = finds.filter(f => !f.lab && (f.type < 0 || f.type >= TYPE_NAMES.length));
        if (!noDate.length && !noType.length) return '';
        const listHtml = arr => `<details style="margin-top:6px;"><summary style="font-size:0.8em; cursor:pointer;">Näytä koodit</summary>
          <div class="type-coverage" style="margin-top:6px;">${arr.map(f =>
            `<a class="type-chip miss" href="https://www.geocaching.com/geocache/${f.code}" target="_blank" rel="noopener" style="text-decoration:none;">${f.code}</a>`).join('')}</div>
          </details>`;
        return `<div class="panel" style="padding:10px 12px; margin-top:8px; border-color:var(--c-peach);">` +
          (noDate.length ? `<b style="color:var(--c-peach);">⚠ ${noDate.length} löytöä ilman päivämäärää</b> — eivät näy kalenteri/D/T-haussa. Tuo GPX uudelleen.${listHtml(noDate)}` : '') +
          (noType.length ? `<b style="color:var(--c-peach);">⚠ ${noType.length} löytöä tunnistamattomalla tyypillä</b> — eivät täsmää tyyppisuodattimiin.${listHtml(noType)}` : '') +
        `</div>`;
      })()}
      <label>Haku:</label>
      ${accField('fqQuery', FINDS_QUERIES.map((q, i) => [i, q.title]), 0)}
      <div id="fqInput" style="margin-top:8px;"></div>
      <button class="btn btn-primary" id="fqRun" style="margin-top:6px;">Hae</button>
      <div class="fq-grp" style="margin-top:10px;"><label>⭐ Pikapohjat</label>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <select id="fqPreset" class="sel" style="flex:1; min-width:140px;"><option value="">— valitse pohja —</option></select>
          <button id="fqPresetSave" class="btn btn-sm" style="margin:0;" title="Tallenna nykyinen haku ja suodattimet pohjaksi">💾 Tallenna</button>
          <button id="fqPresetDel" class="btn btn-sm" style="margin:0;" title="Poista valittu pohja">🗑</button>
        </div>
      </div>
      <div id="fqResult" style="margin-top:15px;"></div>
  </div>`;

  const querySel = document.getElementById('fqQuery');
  const inputDiv = document.getElementById('fqInput');
  const resultDiv = document.getElementById('fqResult');

  wireAccordions(content);
  ensureFqKuntaModal();

  // LAB-löytöjen sallinta tilastoissa — muistetaan localStoragessa, vaikuttaa loadFinds:iin
  const labToggle = document.getElementById('fqLabsToggle');
  if (labToggle) {
    labToggle.checked = localStorage.getItem('fqLabs') === '1';
    labToggle.onchange = () => {
      localStorage.setItem('fqLabs', labToggle.checked ? '1' : '0');
      invalidateFindsCache();
      renderFindsQueries(db, user, content);
    };
  }

  // Pikapohjat — tallenna/hakee suodinasetukset localStorageen
  const PRESET_KEY = 'fqPresets';
  const presetSel = document.getElementById('fqPreset');
  const refreshPresetSel = () => {
    const ps = parseArr(localStorage.getItem(PRESET_KEY) || '[]');
    presetSel.innerHTML = '<option value="">— valitse pohja —</option>' + ps.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('');
  };
  refreshPresetSel();
  document.getElementById('fqPresetSave').onclick = () => {
    const name = prompt('Pohjan nimi:', FINDS_QUERIES[+querySel.value].name);
    if (!name) return;
    const vals = {}, chips = [];
    inputDiv.querySelectorAll('[id]').forEach(el => { if (el.value !== undefined && el.value) vals[el.id] = el.value; });
    inputDiv.querySelectorAll('.fq-chip.fq-on').forEach(c => chips.push(c.id));
    const ps = parseArr(localStorage.getItem(PRESET_KEY) || '[]');
    const i = ps.findIndex(p => p.name === name);
    const p = { name, q: +querySel.value, vals, chips };
    if (i >= 0) ps[i] = p; else ps.push(p);
    localStorage.setItem(PRESET_KEY, JSON.stringify(ps));
    refreshPresetSel();
    presetSel.value = String(i >= 0 ? i : ps.length - 1);
    toast(`💾 Pohja "${name}" tallennettu`, 'ok');
  };
  document.getElementById('fqPresetDel').onclick = () => {
    const i = +presetSel.value;
    if (isNaN(i) || i < 0) return;
    const ps = parseArr(localStorage.getItem(PRESET_KEY) || '[]');
    ps.splice(i, 1);
    localStorage.setItem(PRESET_KEY, JSON.stringify(ps));
    refreshPresetSel();
  };
  presetSel.addEventListener('change', () => {
    const ps = parseArr(localStorage.getItem(PRESET_KEY) || '[]');
    const p = ps[+presetSel.value];
    if (!p) return;
    querySel.value = String(p.q);
    querySel.dispatchEvent(new Event('change'));
    Object.entries(p.vals || {}).forEach(([id, v]) => {
      const el = inputDiv.querySelector('#' + id);
      if (el) { el.value = v; el.dispatchEvent(new Event('change')); }
    });
    (p.chips || []).forEach(id => inputDiv.querySelector('#' + id)?.classList.add('fq-on'));
  });

  querySel.addEventListener('change', () => { closeDtPopup(); localStorage.setItem('fqLastQuery', querySel.value); renderInputs(FINDS_QUERIES[+querySel.value], inputDiv, finds); resultDiv.innerHTML = ''; });
  // Palauta viimeksi käytetty haku (käyttäjän oma "oletusjärjestys")
  const savedQ = +localStorage.getItem('fqLastQuery') || 0;
  if (savedQ > 0 && savedQ < FINDS_QUERIES.length) {
    querySel.value = String(savedQ);
    querySel.dispatchEvent(new Event('change'));
  }
  renderInputs(FINDS_QUERIES[+querySel.value] || FINDS_QUERIES[0], inputDiv, finds);

  // Päivälöydöt-listan järjestyskytkin (suurin/pienin ensin) — kääntää rivit DOM:ssa
  resultDiv.addEventListener('click', e => {
    const b = e.target.closest('.fq-pd-sort');
    if (!b) return;
    const list = resultDiv.querySelector('.fq-pd-list');
    if (!list) return;
    [...list.children].reverse().forEach(el => list.appendChild(el));
    const asc = b.dataset.dir !== 'asc';
    b.dataset.dir = asc ? 'asc' : 'desc';
    b.textContent = asc ? '▼ suurin ensin' : '▲ pienin ensin';
  });

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
    // Valitut attribuuttichipit (AND-logiikka applyFiltersissa)
    const attrChips = inputDiv.querySelectorAll('.fq-attr');
    const attrs = attrChips.length
      ? [...attrChips].filter(ch => ch.classList.contains('fq-on')).map(ch => +ch.dataset.a)
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
      locFilter: sel('fqLocFilter')?.value || null,    // jaettu paikkakuntasuodatin
      region: sel('fqRegion')?.value || null,          // maakunta-pääkenttä (maakuntahaku)
      regionFilter: sel('fqRegionF')?.value || null,   // jaettu maakuntasuodatin
      period: sel('fqPeriod')?.value || 'all',         // jaettu aikarajaus
      yearP: gv('fqYearP'),
      yearM: gv('fqYearM'),
      monthP: gv('fqMonthP'),
      dateFrom: sel('fqDateFrom')?.value || null,
      dateTo: sel('fqDateTo')?.value || null,
      grp: sel('fqGrp')?.value || 'kunta',       // ryhmittely (Eka & vika / D/T-keskiarvo)
      attr: sel('fqAttr')?.value ?? null,          // attribuuttihaku (pakollinen)
      attrFilter: sel('fqAttrFilter')?.value || null, // valinnainen attribuuttisuodatin
      owner: sel('fqOwner')?.value || null,
      types, countries, attrs
    };
    // Yhdistä: attrFilter toimii samana suodattimena kuin attr muissa haussa
    if (input.attrFilter && !input.attr) input.attr = input.attrFilter;
    // Jaettu paikkakuntasuodatin (kun pää-loc-kenttää ei ole)
    if (!input.loc && input.locFilter) input.loc = input.locFilter;
    // Jaettu maakuntasuodatin (kun pää-region-kenttää ei ole)
    if (!input.region && input.regionFilter) input.region = input.regionFilter;
    // Aikarajaus: sovelletaan vain valitun tilan mukaiset parametrit
    if (input.period !== 'year') input.yearP = null;
    input.ym = (input.period === 'month' && input.yearM && input.monthP)
      ? `${input.yearM}-${String(input.monthP).padStart(2, '0')}` : null;
    if (input.period !== 'range') { input.dateFrom = null; input.dateTo = null; }
    try {
      const sections = q.run(finds, input);
      resultDiv.innerHTML = sections.map(s =>
        `<div class="panel" style="padding:12px 14px; margin-top:10px;">
           <h3 style="margin:0 0 8px; font-size:0.95em;">${s.title}</h3>${s.html}</div>`).join('');
      if (q.mount) q.mount(resultDiv); // esim. kuntakartan Leaflet-init tulosdiviin
    } catch (e) {
      console.error('Löytöhaku:', e);
      resultDiv.innerHTML = `<p style="color:var(--c-red);">Haku epäonnistui.</p>`;
    }
  };
};
