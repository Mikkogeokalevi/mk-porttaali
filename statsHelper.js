// statsHelper.js - Korjattu ja tarkistettu

// Sarakkeiden määrittely (0 = Tradi, 1 = Multi, 2 = Webbi, 3 = Mysteeri...)
export const CACHE_TYPES = [
    { index: 0, name: "Tradi", icon: "tradi.png" },
    { index: 1, name: "Multi", icon: "multi.png" },
    { index: 2, name: "Webbikamera", icon: "webcam.png" },
    { index: 3, name: "Mysteeri", icon: "mysse.png" },
    { index: 4, name: "Letterbox", icon: "letter.png" },
    { index: 5, name: "Earthcache", icon: "earth.png" },
    { index: 6, name: "Eventti", icon: "event.png" },
    { index: 7, name: "Virtuaali", icon: "virtual.png" },
    { index: 8, name: "CITO", icon: "cito.png" },
    { index: 9, name: "Wherigo", icon: "wherigo.png" },
    { index: 10, name: "Comm. Celeb.", icon: "commu.png" },
    { index: 11, name: "Mega", icon: "mega.png" }
];

// Tarkistaa, onko kunnassa Tripletti (Tradi + Multi + Mysteeri)
export function isTriplet(statsArray) {
    if (!statsArray || statsArray.length < 4) return false;
    const t = statsArray[0] || 0; // Tradi
    const m = statsArray[1] || 0; // Multi
    const q = statsArray[3] || 0; // Mysteeri (indeksi 3, koska webbi on 2)
    return (t > 0 && m > 0 && q > 0);
}

// Laskee montako ERI tyyppiä on löydetty
export function countFoundTypes(statsArray) {
    if (!statsArray) return 0;
    let count = 0;
    CACHE_TYPES.forEach(type => {
        if (statsArray[type.index] > 0) count++;
    });
    return count;
}

// Laskee yleistilastot (Prosentit jne.)
export function calculateGlobalStats(municipalitiesData) {
    let total = 0;
    let found = 0;
    
    Object.keys(municipalitiesData).forEach(kunta => {
        total++;
        const stats = municipalitiesData[kunta].s || [];
        const sum = stats.reduce((a, b) => a + b, 0);
        if (sum > 0) found++;
    });

    return {
        total: total,
        found: found,
        percentage: total > 0 ? ((found / total) * 100).toFixed(1) : 0
    };
}

// Laskee maakuntien suosituimmat tyypit
export function calculateRegionStats(municipalitiesData) {
    const regionStats = {};

    Object.keys(municipalitiesData).forEach(kunta => {
        const d = municipalitiesData[kunta];
        const region = d.r || "Muu";
        const stats = d.s || [];

        if (!regionStats[region]) {
            regionStats[region] = { types: {} };
            CACHE_TYPES.forEach(t => regionStats[region].types[t.name] = 0);
        }

        CACHE_TYPES.forEach(t => {
            const val = stats[t.index] || 0;
            regionStats[region].types[t.name] += val;
        });
    });

    // Etsi voittaja jokaiselle maakunnalle
    Object.keys(regionStats).forEach(r => {
        let max = -1;
        let winner = "-";
        Object.entries(regionStats[r].types).forEach(([type, count]) => {
            if (count > max) { max = count; winner = type; }
        });
        regionStats[r].mostPopular = winner;
    });

    return regionStats;
}
