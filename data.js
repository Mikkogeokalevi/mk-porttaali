// data.js - Sisältää staattiset listat maakunnista ja kunnista

export const suomenMaakunnat = [
    "Ahvenanmaa", "Etelä-Karjala", "Etelä-Pohjanmaa", "Etelä-Savo", "Kainuu", "Kanta-Häme",
    "Keski-Pohjanmaa", "Keski-Suomi", "Kymenlaakso", "Lappi", "Pirkanmaa", "Pohjanmaa",
    "Pohjois-Karjala", "Pohjois-Pohjanmaa", "Pohjois-Savo", "Päijät-Häme", "Satakunta",
    "Uusimaa", "Varsinais-Suomi"
].sort();

export const maakuntienKunnat = {
    "Ahvenanmaa": ["Brändö", "Eckerö", "Finström", "Föglö", "Geta", "Hammarland", "Jomala", "Kumlinge", "Kökar", "Lemland", "Lumparland", "Maarianhamina", "Saltvik", "Sottunga", "Sund", "Vårdö"].sort(),
    "Etelä-Karjala": ["Imatra", "Lappeenranta", "Lemi", "Luumäki", "Parikkala", "Rautjärvi", "Ruokolahti", "Savitaipale", "Taipalsaari"].sort(),
    "Etelä-Pohjanmaa": ["Alajärvi", "Alavus", "Evijärvi", "Ilmajoki", "Isojoki", "Isokyrö", "Karijoki", "Kauhajoki", "Kauhava", "Kuortane", "Kurikka", "Lappajärvi", "Lapua", "Seinäjoki", "Soini", "Teuva", "Vimpeli", "Ähtäri"].sort(),
    "Etelä-Savo": ["Enonkoski", "Hirvensalmi", "Juva", "Kangasniemi", "Mikkeli", "Mäntyharju", "Pieksämäki", "Puumala", "Rantasalmi", "Savonlinna", "Sulkava"].sort(),
    "Kainuu": ["Hyrynsalmi", "Kajaani", "Kuhmo", "Paltamo", "Puolanka", "Ristijärvi", "Sotkamo", "Suomussalmi"].sort(),
    "Kanta-Häme": ["Forssa", "Hattula", "Hausjärvi", "Humppila", "Hämeenlinna", "Janakkala", "Jokioinen", "Loppi", "Riihimäki", "Tammela", "Ypäjä"].sort(),
    "Keski-Pohjanmaa": ["Halsua", "Kannus", "Kaustinen", "Kokkola", "Lestijärvi", "Perho", "Toholampi", "Veteli"].sort(),
    "Keski-Suomi": ["Hankasalmi", "Joutsa", "Jyväskylä", "Jämsä", "Kannonkoski", "Karstula", "Keuruu", "Kinnula", "Kivijärvi", "Konnevesi", "Kuhmoinen", "Kyyjärvi", "Laukaa", "Luhanka", "Multia", "Muurame", "Petäjävesi", "Pihtipudas", "Saarijärvi", "Toivakka", "Uurainen", "Viitasaari", "Äänekoski"].sort(),
    "Kymenlaakso": ["Hamina", "Kotka", "Kouvola", "Miehikkälä", "Pyhtää", "Virolahti"].sort(),
    "Lappi": ["Enontekiö", "Inari", "Kemi", "Kemijärvi", "Keminmaa", "Kittilä", "Kolari", "Muonio", "Pelkosenniemi", "Pello", "Posio", "Ranua", "Rovaniemi", "Salla", "Savukoski", "Simo", "Sodankylä", "Tervola", "Tornio", "Utsjoki", "Ylitornio"].sort(),
    "Pirkanmaa": ["Akaa", "Hämeenkyrö", "Ikaalinen", "Juupajoki", "Kangasala", "Kihniö", "Lempäälä", "Mänttä-Vilppula", "Nokia", "Orivesi", "Parkano", "Pirkkala", "Punkalaidun", "Pälkäne", "Ruovesi", "Sastamala", "Tampere", "Urjala", "Valkeakoski", "Vesilahti", "Virrat", "Ylöjärvi"].sort(),
    "Pohjanmaa": ["Kaskinen", "Korsnäs", "Kristiinankaupunki", "Kruunupyy", "Laihia", "Luoto", "Maalahti", "Mustasaari", "Närpiö", "Pedersöre", "Pietarsaari", "Uusikaarlepyy", "Vaasa", "Vöyri"].sort(),
    "Pohjois-Karjala": ["Heinävesi", "Ilomantsi", "Joensuu", "Juuka", "Kitee", "Kontiolahti", "Lieksa", "Liperi", "Nurmes", "Outokumpu", "Polvijärvi", "Rääkkylä", "Tohmajärvi"].sort(),
    "Pohjois-Pohjanmaa": ["Alavieska", "Haapajärvi", "Haapavesi", "Hailuoto", "Ii", "Kalajoki", "Kärsämäki", "Kempele", "Kuusamo", "Liminka", "Lumijoki", "Merijärvi", "Muhos", "Nivala", "Oulainen", "Oulu", "Pudasjärvi", "Pyhäjoki", "Pyhäjärvi", "Pyhäntä", "Raahe", "Reisjärvi", "Sievi", "Siikajoki", "Siikalatva", "Taivalkoski", "Tyrnävä", "Utajärvi", "Vaala", "Ylivieska"].sort(),
    "Pohjois-Savo": ["Iisalmi", "Joroinen", "Kaavi", "Keitele", "Kiuruvesi", "Kuopio", "Lapinlahti", "Leppävirta", "Pielavesi", "Rautalampi", "Rautavaara", "Siilinjärvi", "Sonkajärvi", "Suonenjoki", "Tervo", "Tuusniemi", "Varkaus", "Vesanto", "Vieremä"].sort(),
    "Päijät-Häme": ["Asikkala", "Hartola", "Heinola", "Hollola", "Iitti", "Kärkölä", "Lahti", "Orimattila", "Padasjoki", "Sysmä"].sort(),
    "Satakunta": ["Eura", "Eurajoki", "Harjavalta", "Huittinen", "Jämijärvi", "Kankaanpää", "Karvia", "Kokemäki", "Merikarvia", "Nakkila", "Pomarkku", "Pori", "Rauma", "Siikainen", "Säkylä", "Ulvila"].sort(),
    "Uusimaa": ["Askola", "Espoo", "Hanko", "Helsinki", "Hyvinkää", "Inkoo", "Järvenpää", "Karkkila", "Kauniainen", "Kerava", "Kirkkonummi", "Lapinjärvi", "Lohja", "Loviisa", "Myrskylä", "Mäntsälä", "Nurmijärvi", "Pornainen", "Porvoo", "Pukkila", "Raasepori", "Sipoo", "Siuntio", "Tuusula", "Vantaa", "Vihti"].sort(),
    "Varsinais-Suomi": ["Aura", "Kaarina", "Kemiönsaari", "Koski Tl", "Kustavi", "Laitila", "Lieto", "Loimaa", "Marttila", "Masku", "Mynämäki", "Naantali", "Nousiainen", "Oripää", "Paimio", "Parainen", "Pyhäranta", "Pöytyä", "Raisio", "Rusko", "Salo", "Sauvo", "Somero", "Taivassalo", "Turku", "Uusikaupunki", "Vehmaa"].sort()
};
