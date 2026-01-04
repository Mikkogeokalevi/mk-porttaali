// statsHelper.js - Tilastojen laskentalogiikka ja asetukset

// Määritellään sarakkeet Geocache.fi taulukon mukaisessa järjestyksessä.
// index = monesko sarake taulukossa (0-alkainen).
// icon = kuvan nimi images-kansiossa.
export const CACHE_TYPES = [
    { index: 0, name: "Tradi", icon: "tradi.png", id: "tradi" },
    { index: 1, name: "Multi", icon: "multi.png", id: "multi" },
    { index: 2, name: "Webbikamera", icon: "webcam.png", id: "webcam" },
    { index: 3, name: "Mysteeri", icon: "mysse.png", id: "mysse" },
    { index: 4, name: "Letterbox", icon: "letter.png", id: "letter" },
    { index: 5, name: "Earthcache", icon: "earth.png", id: "earth" },
    { index: 6, name: "Eventti", icon: "event.png", id: "event" },
    { index: 7, name: "Virtuaali", icon: "virtual.png", id: "virtual" },
    { index: 8, name: "CITO", icon: "cito.png", id: "cito" },
    { index: 9, name: "Wherigo", icon: "wherigo.png", id: "wherigo" },
    { index: 10, name: "Comm. Celeb.", icon: "commu.png", id: "commu" },
    { index: 11, name: "Mega", icon: "mega.png", id: "mega" },
    // Voit lisätä tähän lisää (esim. Giga, Lab) jos ne ilmestyvät taulukkoon myöhemmin
    // { index: 12, name: "Giga", icon: "giga.png", id: "giga" } 
];

// Apufunktio: Laske montako eri kätkötyyppiä kunnasta on löydetty
export function countFoundTypes(statsArray) {
    let count = 0;
    CACHE_TYPES.forEach(type => {
        if (statsArray[type.index] && statsArray[type.index] > 0) {
            count++;
        }
    });
    return count;
}

// Apufunktio: Onko kunnassa Tripletti (Tradi, Multi, Mysse)?
export function isTriplet(statsArray) {
    const t = statsArray[0] || 0; // Tradi
    const m = statsArray[1] || 0; // Multi
    const q = statsArray[3] || 0; // Mysse (HUOM: sarake 3, koska webbikamera on 2)
    return (t > 0 && m > 0 && q > 0);
}

// Apufunktio: Onko kunnassa "Värisuora" (Kaikki listatut tyypit)?
// Huom: Tämä on tiukka ehto. Voidaan löysätä esim. "Vähintään 8 tyyppiä".
export function getDiversityScore(statsArray) {
    return countFoundTypes(statsArray);
}

// Laskee yleistilastot koko maasta
export function calculateGlobalStats(municipalitiesData) {
    let totalMunicipalities = 0;
    let foundMunicipalities = 0;
    let typeCounts = {}; // { "Pirkanmaa": { "Tradi": 100, "Multi": 20... } }

    CACHE_TYPES.forEach(t => typeCounts[t.name] = 0); // Alusta nollat

    Object.keys(municipalitiesData).forEach(kunta => {
        totalMunicipalities++;
        const d = municipalitiesData[kunta];
        const stats = d.s || [];
        
        // Onko tästä kunnasta löydetty mitään?
        const totalFinds = stats.reduce((a, b) => a + b, 0);
        if (totalFinds > 0) foundMunicipalities++;

        // Tyyppijakaumaa varten (tässä yksinkertaistettu versio koko Suomelle)
        CACHE_TYPES.forEach(type => {
            const val = stats[type.index] || 0;
            if (!typeCounts[type.name]) typeCounts[type.name] = 0;
            typeCounts[type.name] += val;
        });
    });

    return {
        total: totalMunicipalities,
        found: foundMunicipalities,
        percentage: totalMunicipalities > 0 ? ((foundMunicipalities / totalMunicipalities) * 100).toFixed(1) : 0,
        typeCounts: typeCounts
    };
}

// Laskee maakuntakohtaiset jakaumat
export function calculateRegionStats(municipalitiesData) {
    const regionStats = {};

    Object.keys(municipalitiesData).forEach(kunta => {
        const d = municipalitiesData[kunta];
        const region = d.r || "Tuntematon";
        const stats = d.s || [];

        if (!regionStats[region]) {
            regionStats[region] = { total: 0, types: {} };
            CACHE_TYPES.forEach(t => regionStats[region].types[t.name] = 0);
        }

        CACHE_TYPES.forEach(type => {
            const val = stats[type.index] || 0;
            regionStats[region].types[type.name] += val;
            regionStats[region].total += val;
        });
    });

    // Selvitetään jokaisen maakunnan suosituin tyyppi
    Object.keys(regionStats).forEach(region => {
        let maxType = "-";
        let maxVal = -1;
        Object.entries(regionStats[region].types).forEach(([typeName, count]) => {
            if (count > maxVal) {
                maxVal = count;
                maxType = typeName;
            }
        });
        regionStats[region].mostPopular = maxType;
    });

    return regionStats;
}
