// gpxImport.js - Jaettu GPX/ZIP -tuonti: Suomi + Ruotsi + Norja + Viro + muut maat
// Käytetään Asetukset-sivun "Tuo löydöt GPX-tiedostosta" -toiminnossa.
// Parsii <wpt>-pisteet sujuvasti merkkijonosta (ei DOM-puuta muistiin),
// osumattelee kunta-polygoneihin ja tallentaa Firestoreen.

import { doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { maakuntienKunnat } from "./data.js";
import { COUNTRY_CONFIGS } from "./map_countries.js";

// Suomen kuntarajat (samat lähteet kuin map.js / map_all.js)
const FINLAND_GEOJSON_URLS = [
  'https://raw.githubusercontent.com/samilaine/hallinnollisetrajat/master/kuntarajat.json',
  'https://raw.githubusercontent.com/TeemuKoivisto/map-of-finland/master/kuntarajat-2018-raw.json'
];

// Kätkötyyppi-indeksit (sama järjestys kuin statsHelper.CACHE_TYPES + map_all.js: 14 tyyppiä)
export const GPX_TYPE_TO_INDEX = {
  'Traditional Cache': 0,
  'Multi-cache': 1,
  'Webcam Cache': 2,
  'Unknown Cache': 3,
  'Project APE Cache': 3,
  'GPS Adventures Maze Exhibit': 3,
  'Letterbox Hybrid': 4,
  'Earthcache': 5,
  'Event Cache': 6,
  'Virtual Cache': 7,
  'Cache In Trash Out Event': 8,
  'Wherigo Cache': 9,
  'Community Celebration Event': 10,
  'Mega-Event': 11,
  'Mega-Event Cache': 11,
  'Giga-Event': 13,
  'Giga-Event Cache': 13,
  'Lost and Found Event': 6,
  'Locationless (Reverse) Cache': 12,
  'Groundspeak Block Party': 13,
  'Geocaching HQ Celebration': 13,
  'Geocaching HQ Block Party': 13,
  'Geocaching HQ': 13
};
const TYPE_COUNT = 14;

// Kuntaliitoskorjaukset (GeoJSON-nimi -> maakuntienKunnat-nimi)
const FI_MUNICIPALITY_FIX = { 'Pertunmaa': 'Mäntyharju' };

// Englanninkieliset maanimet -> suomi (yleisimmät; fallback = englanti)
const COUNTRY_FI = {
  'Aland Islands': 'Ahvenanmaa', 'Austria': 'Itävalta', 'Belgium': 'Belgia',
  'Belarus': 'Valko-Venäjä', 'Bulgaria': 'Bulgaria', 'Canada': 'Kanada',
  'Croatia': 'Kroatia', 'Cyprus': 'Kypros', 'Czech Republic': 'Tšekki',
  'Czechia': 'Tšekki', 'Denmark': 'Tanska', 'Estonia': 'Viro',
  'Faroe Islands': 'Färsaaret', 'Finland': 'Suomi', 'France': 'Ranska',
  'Germany': 'Saksa', 'Greece': 'Kreikka', 'Greenland': 'Grönlanti',
  'Hungary': 'Unkari', 'Iceland': 'Islanti', 'Ireland': 'Irlanti',
  'Italy': 'Italia', 'Latvia': 'Latvia', 'Liechtenstein': 'Liechtenstein',
  'Lithuania': 'Liettua', 'Luxembourg': 'Luxemburg', 'Netherlands': 'Alankomaat',
  'Norway': 'Norja', 'Poland': 'Puola', 'Portugal': 'Portugali',
  'Romania': 'Romania', 'Russia': 'Venäjä', 'Slovakia': 'Slovakia',
  'Slovenia': 'Slovenia', 'Spain': 'Espanja', 'Sweden': 'Ruotsi',
  'Switzerland': 'Sveitsi', 'Ukraine': 'Ukraina',
  'United Kingdom': 'Iso-Britannia', 'United States': 'Yhdysvallat',
  'Australia': 'Australia', 'New Zealand': 'Uusi-Seelanti', 'Japan': 'Japani',
  'Thailand': 'Thaimaa', 'Egypt': 'Egypti', 'Morocco': 'Marokko',
  'Turkey': 'Turkki', 'Malta': 'Malta', 'Serbia': 'Serbia',
  'Montenegro': 'Montenegro', 'Albania': 'Albania',
  'North Macedonia': 'Pohjois-Makedonia', 'Moldova': 'Moldova',
  'Jersey': 'Jersey', 'Guernsey': 'Guernsey', 'Isle of Man': 'Mansaari',
  'Monaco': 'Monaco', 'Andorra': 'Andorra', 'San Marino': 'San Marino',
  'Vatican City': 'Vatikaani'
};

export function countryNameFi(name) {
  return COUNTRY_FI[name] || name;
}

// Groundspeak-attribuutti-ID:t -> suomi (inc=1 = on, inc=0 = ei/negatiivinen)
export const ATTR_FI = {
  1: 'Koirat sallittu', 2: 'Polkupyörällä', 3: 'Moottoripyörällä', 4: 'Vironomainen',
  5: 'Esteetön pyörätuolilla', 6: 'Lapsille sopiva', 7: 'Tasan tunnin reissu',
  8: 'Maisemanvartija', 9: 'Isoja muutoksia', 10: 'Lyhyt kätköily',
  11: 'Iso rihma', 12: 'Tulva-alue', 13: 'Kesän aikana', 14: 'Talveksi',
  15: 'Talvikelpoinen', 16: 'Sammakko', 17: 'Akvaario', 18: 'Puskissa',
  19: 'Luonnossa', 20: 'Leirintä', 21: 'Sähkö', 22: 'Golfkenttä',
  23: 'Kalastus', 24: 'Pyörätuoli', 25: 'Pysäköinti lähellä', 26: 'Julkinen liikenne',
  27: 'Ruokailu lähellä', 28: 'Piknik', 29: 'Wifihotspot', 30: 'Pankkiautomaatti',
  31: 'Kiipeily', 32: 'Polkupyörät', 33: 'Ajoneuvolla', 34: 'Yö',
  35: 'Valoisa', 36: 'Suositeltu', 37: 'Kauhea', 38: 'Vaikea',
  39: 'Ei suositeltava yöllä', 40: 'Ei suositeltava lapsille', 41: 'Vauvoille sopiva',
  42: 'Huoltotarve', 43: 'Vältä lampia', 44: 'Torakat', 45: 'Kärpäset',
  46: 'Suot', 47: 'Äkillinen pudotus', 48: 'Lehmät', 49: 'Lumikengät',
  50: 'Polttopiste', 51: 'GPS vaaditaan', 52: 'Sopii virkailijoille',
  53: 'Ei saalisalueella', 54: 'Ei suositeltavaa yöllä', 55: 'Tulivuori',
  56: 'Tulva alue', 57: 'Maatila', 58: 'Syötävät kasvit', 59: 'Hylätty rakennus',
  60: 'Puutarha', 61: 'Haude', 62: 'Syksy', 63: 'Suositeltu turisteille',
  64: 'Kanootti', 65: 'Aurinko', 66: 'Sää', 67: 'Teltta',
  68: 'Intiaanileiri', 69: 'Kuntosali', 70: 'Ei tyyppikohtainen'
};


// ---------- ZIP-luku (ilman ulkoista kirjastoa) ----------

async function readGpxText(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0x50 && buf[1] === 0x4B) { // 'PK'
    const gpxBytes = await unzipFirstGpx(buf);
    return new TextDecoder('utf-8').decode(gpxBytes);
  }
  return new TextDecoder('utf-8').decode(buf);
}

async function unzipFirstGpx(buf) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('Selain ei tue zip-purkausta. Pura tiedosto ensin ja valitse .gpx.');
  }
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // Etsi End Of Central Directory (0x06054b50) lopusta
  let eocd = -1;
  const start = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= start; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Zip-tiedosto ei ole kelvollinen (EOCD puuttuu)');
  const entryCount = dv.getUint16(eocd + 10, true);
  let pos = dv.getUint32(eocd + 16, true);

  for (let e = 0; e < entryCount; e++) {
    if (dv.getUint32(pos, true) !== 0x02014b50) break;
    const method = dv.getUint16(pos + 10, true);
    const compSize = dv.getUint32(pos + 20, true);
    const nameLen = dv.getUint16(pos + 28, true);
    const extraLen = dv.getUint16(pos + 30, true);
    const commentLen = dv.getUint16(pos + 32, true);
    const localOff = dv.getUint32(pos + 42, true);
    const name = new TextDecoder().decode(buf.subarray(pos + 46, pos + 46 + nameLen));
    pos += 46 + nameLen + extraLen + commentLen;
    if (!/\.gpx$/i.test(name)) continue;

    // Paikallinen header: data alkaa +30+nameLen+extraLen
    const lNameLen = dv.getUint16(localOff + 26, true);
    const lExtraLen = dv.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const comp = buf.subarray(dataStart, dataStart + compSize);
    if (method === 0) return comp; // stored
    if (method !== 8) throw new Error('Zip-pakkausmenetelmä ei tuettu: ' + method);
    const stream = new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const out = await new Response(stream).arrayBuffer();
    return new Uint8Array(out);
  }
  throw new Error('Zip-paketista ei löytynyt .gpx-tiedostoa');
}

// ---------- GPX-parsinta (sujuva, ei DOM-puuta) ----------

function extractFirst(block, re) {
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

export function parseGpxPoints(text, nickname = '') {
  const points = [];
  const nickLower = (nickname || '').toLowerCase();
  let pos = 0;
  while (true) {
    const start = text.indexOf('<wpt ', pos);
    if (start < 0) break;
    const end = text.indexOf('</wpt>', start);
    if (end < 0) break;
    const block = text.slice(start, end + 6);
    pos = end + 6;

    const openTagEnd = block.indexOf('>');
    const openTag = block.slice(0, openTagEnd);
    const lat = parseFloat(extractFirst(openTag, /lat="([^"]+)"/));
    const lon = parseFloat(extractFirst(openTag, /lon="([^"]+)"/));
    if (isNaN(lat) || isNaN(lon)) continue;

    const sym = extractFirst(block, /<sym>([^<]*)<\/sym>/);
    if (!sym.includes('Found')) continue; // vain löydetyt

    const code = extractFirst(block, /<name>([^<]*)<\/name>/) || `${lat}|${lon}`;
    const country = extractFirst(block, /<groundspeak:country>([^<]*)<\/groundspeak:country>/);
    let type = extractFirst(block, /<groundspeak:type>([^<]*)<\/groundspeak:type>/);
    if (!type) {
      const plain = extractFirst(block, /<type>([^<]*)<\/type>/);
      type = plain.includes('|') ? plain.split('|').pop().trim() : plain;
    }
    const difficulty = parseFloat(extractFirst(block, /<groundspeak:difficulty>([^<]*)<\/groundspeak:difficulty>/)) || 0;
    const terrain = parseFloat(extractFirst(block, /<groundspeak:terrain>([^<]*)<\/groundspeak:terrain>/)) || 0;

    // Attribuutit: id positiivisena jos inc="1", negatiivisena jos inc="0"
    const attrs = [];
    const attrRe = /<groundspeak:attribute[^>]*id="(\d+)"[^>]*inc="(\d)"[^>]*>/g;
    let am;
    while ((am = attrRe.exec(block))) {
      const id = parseInt(am[1]);
      attrs.push(am[2] === '1' ? id : -id);
    }

    // Löytöpäivä = käyttäjän OMA "Found it"/"Attended"-login päivä (wpt <time> on piilotuspäivä!)
    let findDate = '';
    const logRe = /<groundspeak:log[^>]*>([\s\S]*?)<\/groundspeak:log>/g;
    let lm;
    while ((lm = logRe.exec(block))) {
      const log = lm[1];
      const logType = extractFirst(log, /<groundspeak:type>([^<]*)<\/groundspeak:type>/);
      if (!/Found it|Attended|Webcam Photo Taken/i.test(logType)) continue;
      const finder = extractFirst(log, /<groundspeak:finder[^>]*>([^<]*)<\/groundspeak:finder>/);
      const logDate = extractFirst(log, /<groundspeak:date>([^<]*)<\/groundspeak:date>/).slice(0, 10);
      if (nickLower && finder.toLowerCase() === nickLower) { findDate = logDate; break; }
      if (!findDate) findDate = logDate; // varalla: ensimmäinen found-logi
    }

    points.push({ lat, lon, code, time: findDate, country, type, difficulty, terrain, attrs });
  }
  return points;
}

// ---------- Geometria-apurit (sama logiikka kuin map_countries.js) ----------

function pointInRing(point, ring) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function pointInPolygonCoords(point, polygon) {
  if (!pointInRing(point, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
}

function isPointInFeature(point, feature) {
  const geom = feature?.geometry;
  if (!geom) return false;
  if (geom.type === 'Polygon') return pointInPolygonCoords(point, geom.coordinates);
  if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      if (pointInPolygonCoords(point, polygon)) return true;
    }
  }
  return false;
}

function featureBBox(feature) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (coords) => {
    if (typeof coords[0] === 'number') {
      if (coords[0] < minX) minX = coords[0];
      if (coords[0] > maxX) maxX = coords[0];
      if (coords[1] < minY) minY = coords[1];
      if (coords[1] > maxY) maxY = coords[1];
      return;
    }
    for (const c of coords) walk(c);
  };
  walk(feature?.geometry?.coordinates || []);
  return { minX, minY, maxX, maxY };
}

function toRad(d) { return d * Math.PI / 180; }

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function minDistanceToFeature(lat, lon, feature) {
  const geom = feature?.geometry;
  if (!geom) return Infinity;
  let best = Infinity;
  const R = 6371000, deg2rad = Math.PI / 180;
  const processRing = (ring) => {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const p1 = ring[i], p2 = ring[j];
      const cosLat = Math.cos(toRad((p1[1] + p2[1]) / 2));
      const x0 = lon * deg2rad * R * cosLat, y0 = lat * deg2rad * R;
      const x1 = p1[0] * deg2rad * R * cosLat, y1 = p1[1] * deg2rad * R;
      const x2 = p2[0] * deg2rad * R * cosLat, y2 = p2[1] * deg2rad * R;
      const dx = x2 - x1, dy = y2 - y1;
      const len = dx * dx + dy * dy;
      const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / len));
      const d = distanceMeters(lat, lon, (y1 + t * dy) / (deg2rad * R), (x1 + t * dx) / (deg2rad * R * cosLat));
      if (d < best) best = d;
      if (best === 0) return;
    }
  };
  if (geom.type === 'Polygon') geom.coordinates.forEach(processRing);
  else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => poly.forEach(processRing));
  return best;
}

// ---------- Polygonijoukot ----------

function buildFeatureSet(geojson, nameGetter) {
  return (geojson?.features || []).map(f => ({
    feature: f,
    name: nameGetter(f),
    bbox: featureBBox(f)
  }));
}

function matchInFeatureSet(featureSet, lat, lon) {
  for (const item of featureSet) {
    const b = item.bbox;
    if (lon >= b.minX && lon <= b.maxX && lat >= b.minY && lat <= b.maxY) {
      if (isPointInFeature([lon, lat], item.feature)) return item.name;
    }
  }
  return null;
}

function nearestInFeatureSet(featureSet, lat, lon, thresholdM = 10000) {
  let best = null, bestD = thresholdM;
  for (const item of featureSet) {
    const d = minDistanceToFeature(lat, lon, item.feature);
    if (d < bestD) { bestD = d; best = item.name; }
  }
  return best;
}

async function fetchFirstJson(urls) {
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch (e) {}
  }
  return null;
}

// ---------- Tallennus ----------

function emptyStats() { return new Array(TYPE_COUNT).fill(0); }

function emptyEntry() { return { s: emptyStats(), ids: [] }; }

function ensureEntryShape(entry) {
  if (!entry || typeof entry !== 'object') return emptyEntry();
  if (!Array.isArray(entry.s)) entry.s = emptyStats();
  while (entry.s.length < TYPE_COUNT) entry.s.push(0);
  if (!Array.isArray(entry.ids)) entry.ids = [];
  return entry;
}

function addFindTo(entry, code, typeIdx) {
  if (entry.ids.includes(code)) return false;
  entry.ids.push(code);
  if (typeIdx >= 0 && typeIdx < TYPE_COUNT) entry.s[typeIdx]++;
  return true;
}

// ---------- Pääfunktio ----------

// importFindsFile(file, { db, uid, onStatus })
// Palauttaa raportti-objektin { finland:{newMuni,totalMuni}, countries:{...}, other:{...}, duplicates, unmatched, totalFound }
export async function importFindsFile(file, { db, uid, nickname = '', onStatus = () => {} } = {}) {
  onStatus('Luetaan tiedostoa...');
  const text = await readGpxText(file);

  onStatus('Parsitaan löytöpisteitä...');
  const points = parseGpxPoints(text, nickname);
  if (!points.length) throw new Error('Tiedostosta ei löytynyt löydettyjä kätköjä (<sym>Found</sym>).');
  onStatus(`Löydettiin ${points.length} löytöpistettä. Ladataan kuntarajat...`);

  // Ladataan polygonidatat (Suomi + ulkomaat)
  const [fiGeo, seGeo, noGeo, eeGeo] = await Promise.all([
    fetchFirstJson(FINLAND_GEOJSON_URLS),
    fetchFirstJson(['./sverige_kommuner.geojson']),
    fetchFirstJson(['./norge_kommuner.geojson']),
    fetchFirstJson(['./viro_vald.geojson'])
  ]);

  const fiSet = fiGeo ? buildFeatureSet(fiGeo, f => {
    const p = f.properties || {};
    const n = p.NAMEFIN || p.Name || p.name || p.nimi || 'Tuntematon';
    return FI_MUNICIPALITY_FIX[n] || n;
  }) : [];

  const countrySets = {
    Sweden: seGeo ? buildFeatureSet(seGeo, f => COUNTRY_CONFIGS.sweden.nameProperty(f.properties)) : [],
    Norway: noGeo ? buildFeatureSet(noGeo, f => COUNTRY_CONFIGS.norway.nameProperty(f.properties)) : [],
    Estonia: eeGeo ? buildFeatureSet(eeGeo, f => COUNTRY_CONFIGS.estonia.nameProperty(f.properties)) : []
  };
  const COUNTRY_TO_SET = { 'Finland': fiSet, 'Sweden': countrySets.Sweden, 'Norway': countrySets.Norway, 'Estonia': countrySets.Estonia };
  // Geocaching.com kirjaa Ahvenanmaan maaksi 'Aland Islands' — reititetään Suomeen
  const FI_COUNTRY_ALIASES = new Set(['Finland', 'Aland Islands', 'Åland Islands', 'Åland', 'Ahvenanmaa']);

  // Kunta -> maakunta -kartta
  const kuntaToRegion = {};
  for (const [maakunta, kunnat] of Object.entries(maakuntienKunnat)) {
    for (const k of kunnat) kuntaToRegion[k] = maakunta;
  }

  // Ladataan nykyinen data
  onStatus('Ladataan tallennettuja tietoja...');
  const statsSnap = await getDoc(doc(db, 'stats', uid));
  const existingFi = statsSnap.exists() ? (statsSnap.data().municipalities || {}) : {};
  const fiHasIds = Object.values(existingFi).some(e => Array.isArray(e?.ids));
  const fiReplace = !fiHasIds; // ensimmäinen GPX-tuonti korvaa copy/paste-datan (ei duplikaattiriskiä)

  const countryDocs = {};
  for (const [country, cfg] of Object.entries({ Sweden: COUNTRY_CONFIGS.sweden, Norway: COUNTRY_CONFIGS.norway, Estonia: COUNTRY_CONFIGS.estonia })) {
    const snap = await getDoc(doc(db, 'users', uid, cfg.firestorePath, 'finds'));
    countryDocs[country] = snap.exists() ? (snap.data().municipalities || {}) : {};
  }
  const otherSnap = await getDoc(doc(db, 'users', uid, 'other_countries', 'finds'));
  const otherData = otherSnap.exists() ? (otherSnap.data().countries || {}) : {};
  // Siivoa: Ahvenanmaa-alias joutunut aiemmin "muihin maihin" — uudelleentuonti reitittää ne Suomeen
  for (const alias of ['Aland Islands', 'Åland Islands', 'Åland', 'Ahvenanmaa']) delete otherData[alias];

  const findsByYear = {}; // '2023' -> {code: [t,d,D,T,loc,attrs]} ja 'unknown'

  // Osumatteily
  const fi = fiReplace ? {} : Object.fromEntries(Object.entries(existingFi).map(([k, v]) => [k, ensureEntryShape(v)]));
  const report = {
    totalFound: points.length,
    finland: { municipalities: 0, newMunicipalities: 0, replaced: fiReplace },
    countries: {}, other: {}, duplicates: 0, nearest: 0, unmatched: 0, unknownTypes: []
  };

  onStatus(`Osumatellaan ${points.length} pistettä kuntiin...`);
  for (let i = 0; i < points.length; i++) {
    if (i % 100 === 0) {
      onStatus(`Osumatellaan... ${i} / ${points.length}`);
      await new Promise(r => setTimeout(r, 0));
    }
    const p = points[i];
    const typeIdx = GPX_TYPE_TO_INDEX[p.type] !== undefined ? GPX_TYPE_TO_INDEX[p.type] : -1;
    if (p.type && typeIdx === -1 && !report.unknownTypes.includes(p.type)) report.unknownTypes.push(p.type);

    const day = (p.time || '').slice(0, 10);
    const country = p.country || '';
    let loc = null, bucket = 'other';

    const isFinland = FI_COUNTRY_ALIASES.has(country);
    const targetSet = isFinland ? fiSet : COUNTRY_TO_SET[country];
    if (targetSet && targetSet.length) {
      loc = matchInFeatureSet(targetSet, p.lat, p.lon);
      if (!loc) { loc = nearestInFeatureSet(targetSet, p.lat, p.lon, 10000); if (loc) report.nearest++; }
      bucket = isFinland ? 'finland' : 'foreign';
    }

    // Maa tunnistettu mutta kunta ei löytynyt -> laske maatason löydöksi
    if (loc === null && bucket !== 'other') bucket = 'other';

    if (bucket === 'finland') {
      if (loc) {
        const entry = fi[loc] = ensureEntryShape(fi[loc]);
        if (!report.finland.seen) report.finland.seen = new Set();
        if (!entry.ids.includes(p.code)) {
          entry.ids.push(p.code);
          if (typeIdx >= 0) entry.s[typeIdx]++;
          entry.r = kuntaToRegion[loc] || 'Muu';
          report.finland.seen.add(loc);
          const y = day.slice(0, 4) || 'unknown';
          (findsByYear[y] = findsByYear[y] || {})[p.code] = [typeIdx, day, p.difficulty, p.terrain, loc, p.attrs.join(',')];
        } else report.duplicates++;
      } else report.unmatched++;
    } else if (bucket === 'foreign') {
      if (loc) {
        const docData = countryDocs[country];
        const entry = docData[loc] = ensureEntryShape(docData[loc]);
        if (addFindTo(entry, p.code, typeIdx)) {
          const y = day.slice(0, 4) || 'unknown';
          (findsByYear[y] = findsByYear[y] || {})[p.code] = [typeIdx, day, p.difficulty, p.terrain, loc, p.attrs.join(',')];
        } else report.duplicates++;
        report.countries[country] = (report.countries[country] || 0) + 1;
      } else report.unmatched++;
    } else {
      // Muut maat
      const cname = country || 'Tuntematon';
      const entry = otherData[cname] = ensureEntryShape(otherData[cname]);
      if (addFindTo(entry, p.code, typeIdx)) {
        const y = day.slice(0, 4) || 'unknown';
        (findsByYear[y] = findsByYear[y] || {})[p.code] = [typeIdx, day, p.difficulty, p.terrain, cname, p.attrs.join(',')];
        report.other[cname] = (report.other[cname] || 0) + 1;
      } else report.duplicates++;
    }
  }

  report.finland.municipalities = Object.keys(fi).length;
  report.finland.newMunicipalities = report.finland.seen ? report.finland.seen.size : 0;
  // Kokonaismäärät tallennetusta datasta (ei vain tämän ajon uudet) — raportti näyttää aina kaikki maat
  report.countryTotals = {};
  for (const [country, docData] of Object.entries(countryDocs)) {
    report.countryTotals[country] = Object.values(docData).reduce((a, e) => a + (e?.ids?.length || 0), 0);
  }
  report.otherTotals = {};
  for (const [name, e] of Object.entries(otherData)) {
    report.otherTotals[name] = e?.ids?.length || 0;
  }

  // Tallennus
  onStatus('Tallennetaan Firestoreen...');
  const now = Timestamp.now();
  await setDoc(doc(db, 'stats', uid), {
    municipalities: fi,
    gpxImported: true,
    gpxImportAt: now,
    updatedAt: now
  }, { merge: true });

  const saveCountry = async (country, cfg) => {
    const municipalities = countryDocs[country];
    await setDoc(doc(db, 'users', uid, cfg.firestorePath, 'finds'), {
      municipalities, lastGpxImport: now, updatedAt: now
    });
    try {
      localStorage.setItem(`${cfg.storageKey}_${uid}`, JSON.stringify({ municipalities, lastGpxImport: now.toDate().toISOString() }));
    } catch {}
  };
  await saveCountry('Sweden', COUNTRY_CONFIGS.sweden);
  await saveCountry('Norway', COUNTRY_CONFIGS.norway);
  await saveCountry('Estonia', COUNTRY_CONFIGS.estonia);

  await setDoc(doc(db, 'users', uid, 'other_countries', 'finds'), {
    countries: otherData, lastGpxImport: now, updatedAt: now
  });

  // Yksityiskohtaiset löydöt tallennetaan vuosittain -> skaalautuu 50 000+ löytöön
  // (yksi dokumentti = max 1 Mt; 20k löytöä olisi jo ~1.5 Mt yhtenä dokkuna)
  for (const [year, yearFinds] of Object.entries(findsByYear)) {
    const snap = await getDoc(doc(db, 'users', uid, 'findsdata', year));
    const merged = snap.exists() ? { ...(snap.data().finds || {}), ...yearFinds } : yearFinds;
    await setDoc(doc(db, 'users', uid, 'findsdata', year), { finds: merged, updatedAt: now });
  }

  return report;
}
