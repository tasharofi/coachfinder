// Bundled Australian suburbs dataset for MVP
// Contains major suburbs across all states with lat/lng for proximity search.
// This is a curated subset. For production, replace with full ABS/Australia Post dataset.

const SUBURBS = [
  // NSW — Sydney
  { suburb: "Sydney", state: "NSW", postcode: "2000", lat: -33.8688, lng: 151.2093 },
  { suburb: "Bondi", state: "NSW", postcode: "2026", lat: -33.8914, lng: 151.2743 },
  { suburb: "Bondi Beach", state: "NSW", postcode: "2026", lat: -33.8908, lng: 151.2764 },
  { suburb: "Bondi Junction", state: "NSW", postcode: "2022", lat: -33.8925, lng: 151.2503 },
  { suburb: "Surry Hills", state: "NSW", postcode: "2010", lat: -33.8832, lng: 151.2107 },
  { suburb: "Newtown", state: "NSW", postcode: "2042", lat: -33.8966, lng: 151.1789 },
  { suburb: "Paddington", state: "NSW", postcode: "2021", lat: -33.8843, lng: 151.2268 },
  { suburb: "Manly", state: "NSW", postcode: "2095", lat: -33.7972, lng: 151.2855 },
  { suburb: "Mosman", state: "NSW", postcode: "2088", lat: -33.8293, lng: 151.2444 },
  { suburb: "Randwick", state: "NSW", postcode: "2031", lat: -33.9133, lng: 151.2413 },
  { suburb: "Ultimo", state: "NSW", postcode: "2007", lat: -33.8785, lng: 151.1986 },
  { suburb: "Darlinghurst", state: "NSW", postcode: "2010", lat: -33.8774, lng: 151.2206 },
  { suburb: "Redfern", state: "NSW", postcode: "2016", lat: -33.8929, lng: 151.2040 },
  { suburb: "Glebe", state: "NSW", postcode: "2037", lat: -33.8799, lng: 151.1867 },
  { suburb: "Pyrmont", state: "NSW", postcode: "2009", lat: -33.8699, lng: 151.1942 },
  { suburb: "Rozelle", state: "NSW", postcode: "2039", lat: -33.8640, lng: 151.1696 },
  { suburb: "Balmain", state: "NSW", postcode: "2041", lat: -33.8578, lng: 151.1795 },
  { suburb: "Leichhardt", state: "NSW", postcode: "2040", lat: -33.8835, lng: 151.1569 },
  { suburb: "Marrickville", state: "NSW", postcode: "2204", lat: -33.9108, lng: 151.1554 },
  { suburb: "Enmore", state: "NSW", postcode: "2042", lat: -33.9010, lng: 151.1745 },
  { suburb: "Erskineville", state: "NSW", postcode: "2043", lat: -33.9022, lng: 151.1859 },
  { suburb: "Alexandria", state: "NSW", postcode: "2015", lat: -33.9032, lng: 151.1957 },
  { suburb: "Zetland", state: "NSW", postcode: "2017", lat: -33.9065, lng: 151.2097 },
  { suburb: "Waterloo", state: "NSW", postcode: "2017", lat: -33.8997, lng: 151.2055 },
  { suburb: "Mascot", state: "NSW", postcode: "2020", lat: -33.9273, lng: 151.1875 },
  { suburb: "Coogee", state: "NSW", postcode: "2034", lat: -33.9205, lng: 151.2561 },
  { suburb: "Bronte", state: "NSW", postcode: "2024", lat: -33.9032, lng: 151.2635 },
  { suburb: "Waverley", state: "NSW", postcode: "2024", lat: -33.8983, lng: 151.2556 },
  { suburb: "Double Bay", state: "NSW", postcode: "2028", lat: -33.8770, lng: 151.2439 },
  { suburb: "Rose Bay", state: "NSW", postcode: "2029", lat: -33.8695, lng: 151.2620 },
  { suburb: "Vaucluse", state: "NSW", postcode: "2030", lat: -33.8570, lng: 151.2789 },
  { suburb: "Woollahra", state: "NSW", postcode: "2025", lat: -33.8867, lng: 151.2399 },
  { suburb: "Neutral Bay", state: "NSW", postcode: "2089", lat: -33.8327, lng: 151.2195 },
  { suburb: "North Sydney", state: "NSW", postcode: "2060", lat: -33.8390, lng: 151.2073 },
  { suburb: "Crows Nest", state: "NSW", postcode: "2065", lat: -33.8261, lng: 151.2050 },
  { suburb: "Chatswood", state: "NSW", postcode: "2067", lat: -33.7963, lng: 151.1836 },
  { suburb: "Lane Cove", state: "NSW", postcode: "2066", lat: -33.8159, lng: 151.1672 },
  { suburb: "Willoughby", state: "NSW", postcode: "2068", lat: -33.8006, lng: 151.1967 },
  { suburb: "Cremorne", state: "NSW", postcode: "2090", lat: -33.8293, lng: 151.2282 },
  { suburb: "Dee Why", state: "NSW", postcode: "2099", lat: -33.7521, lng: 151.2862 },
  { suburb: "Brookvale", state: "NSW", postcode: "2100", lat: -33.7676, lng: 151.2757 },
  { suburb: "Freshwater", state: "NSW", postcode: "2096", lat: -33.7779, lng: 151.2892 },
  { suburb: "Curl Curl", state: "NSW", postcode: "2096", lat: -33.7675, lng: 151.2900 },
  // NSW — Greater Sydney
  { suburb: "Parramatta", state: "NSW", postcode: "2150", lat: -33.8151, lng: 151.0011 },
  { suburb: "Bankstown", state: "NSW", postcode: "2200", lat: -33.9178, lng: 151.0337 },
  { suburb: "Liverpool", state: "NSW", postcode: "2170", lat: -33.9209, lng: 150.9243 },
  { suburb: "Penrith", state: "NSW", postcode: "2750", lat: -33.7507, lng: 150.6876 },
  { suburb: "Blacktown", state: "NSW", postcode: "2148", lat: -33.7688, lng: 150.9070 },
  { suburb: "Castle Hill", state: "NSW", postcode: "2154", lat: -33.7317, lng: 151.0037 },
  { suburb: "Hornsby", state: "NSW", postcode: "2077", lat: -33.7043, lng: 151.0988 },
  { suburb: "Ryde", state: "NSW", postcode: "2112", lat: -33.8132, lng: 151.1027 },
  { suburb: "Burwood", state: "NSW", postcode: "2134", lat: -33.8775, lng: 151.1040 },
  { suburb: "Strathfield", state: "NSW", postcode: "2135", lat: -33.8734, lng: 151.0940 },
  { suburb: "Hurstville", state: "NSW", postcode: "2220", lat: -33.9667, lng: 151.1033 },
  { suburb: "Sutherland", state: "NSW", postcode: "2232", lat: -34.0310, lng: 151.0573 },
  { suburb: "Cronulla", state: "NSW", postcode: "2230", lat: -34.0558, lng: 151.1519 },
  { suburb: "Miranda", state: "NSW", postcode: "2228", lat: -34.0378, lng: 151.1032 },
  { suburb: "Campbelltown", state: "NSW", postcode: "2560", lat: -34.0646, lng: 150.8144 },
  // NSW — Hills District / North-West
  { suburb: "Berowra", state: "NSW", postcode: "2081", lat: -33.6235, lng: 151.1508 },
  { suburb: "Berowra Heights", state: "NSW", postcode: "2082", lat: -33.6133, lng: 151.1408 },
  { suburb: "Mount Kuring-Gai", state: "NSW", postcode: "2080", lat: -33.6535, lng: 151.1371 },
  { suburb: "Mount Colah", state: "NSW", postcode: "2079", lat: -33.6741, lng: 151.1181 },
  { suburb: "Asquith", state: "NSW", postcode: "2078", lat: -33.6887, lng: 151.1082 },
  { suburb: "Waitara", state: "NSW", postcode: "2077", lat: -33.7112, lng: 151.1032 },
  // NSW — Regional
  { suburb: "Newcastle", state: "NSW", postcode: "2300", lat: -32.9283, lng: 151.7817 },
  { suburb: "Wollongong", state: "NSW", postcode: "2500", lat: -34.4244, lng: 150.8931 },
  { suburb: "Central Coast", state: "NSW", postcode: "2250", lat: -33.4261, lng: 151.3419 },
  { suburb: "Byron Bay", state: "NSW", postcode: "2481", lat: -28.6437, lng: 153.6120 },
  { suburb: "Coffs Harbour", state: "NSW", postcode: "2450", lat: -30.2963, lng: 153.1135 },
  // VIC — Melbourne
  { suburb: "Melbourne", state: "VIC", postcode: "3000", lat: -37.8136, lng: 144.9631 },
  { suburb: "South Yarra", state: "VIC", postcode: "3141", lat: -37.8384, lng: 144.9924 },
  { suburb: "St Kilda", state: "VIC", postcode: "3182", lat: -37.8615, lng: 144.9803 },
  { suburb: "Richmond", state: "VIC", postcode: "3121", lat: -37.8188, lng: 145.0005 },
  { suburb: "Fitzroy", state: "VIC", postcode: "3065", lat: -37.7990, lng: 144.9787 },
  { suburb: "Collingwood", state: "VIC", postcode: "3066", lat: -37.7985, lng: 144.9866 },
  { suburb: "Brunswick", state: "VIC", postcode: "3056", lat: -37.7665, lng: 144.9602 },
  { suburb: "Carlton", state: "VIC", postcode: "3053", lat: -37.8004, lng: 144.9690 },
  { suburb: "Southbank", state: "VIC", postcode: "3006", lat: -37.8229, lng: 144.9647 },
  { suburb: "Docklands", state: "VIC", postcode: "3008", lat: -37.8145, lng: 144.9462 },
  { suburb: "Port Melbourne", state: "VIC", postcode: "3207", lat: -37.8370, lng: 144.9327 },
  { suburb: "South Melbourne", state: "VIC", postcode: "3205", lat: -37.8343, lng: 144.9578 },
  { suburb: "Albert Park", state: "VIC", postcode: "3206", lat: -37.8429, lng: 144.9538 },
  { suburb: "Prahran", state: "VIC", postcode: "3181", lat: -37.8507, lng: 144.9912 },
  { suburb: "Toorak", state: "VIC", postcode: "3142", lat: -37.8419, lng: 145.0109 },
  { suburb: "Hawthorn", state: "VIC", postcode: "3122", lat: -37.8218, lng: 145.0352 },
  { suburb: "Camberwell", state: "VIC", postcode: "3124", lat: -37.8413, lng: 145.0586 },
  { suburb: "Brighton", state: "VIC", postcode: "3186", lat: -37.9061, lng: 144.9879 },
  { suburb: "Caulfield", state: "VIC", postcode: "3162", lat: -37.8773, lng: 145.0223 },
  { suburb: "Malvern", state: "VIC", postcode: "3144", lat: -37.8628, lng: 145.0316 },
  { suburb: "Box Hill", state: "VIC", postcode: "3128", lat: -37.8190, lng: 145.1218 },
  { suburb: "Glen Waverley", state: "VIC", postcode: "3150", lat: -37.8781, lng: 145.1649 },
  { suburb: "Clayton", state: "VIC", postcode: "3168", lat: -37.9183, lng: 145.1219 },
  { suburb: "Dandenong", state: "VIC", postcode: "3175", lat: -37.9873, lng: 145.2151 },
  { suburb: "Footscray", state: "VIC", postcode: "3011", lat: -37.7997, lng: 144.8997 },
  { suburb: "Williamstown", state: "VIC", postcode: "3016", lat: -37.8576, lng: 144.8998 },
  { suburb: "Essendon", state: "VIC", postcode: "3040", lat: -37.7525, lng: 144.9173 },
  { suburb: "Coburg", state: "VIC", postcode: "3058", lat: -37.7424, lng: 144.9649 },
  { suburb: "Preston", state: "VIC", postcode: "3072", lat: -37.7478, lng: 145.0154 },
  { suburb: "Northcote", state: "VIC", postcode: "3070", lat: -37.7697, lng: 144.9970 },
  // VIC — Regional
  { suburb: "Geelong", state: "VIC", postcode: "3220", lat: -38.1499, lng: 144.3617 },
  { suburb: "Ballarat", state: "VIC", postcode: "3350", lat: -37.5622, lng: 143.8503 },
  { suburb: "Bendigo", state: "VIC", postcode: "3550", lat: -36.7570, lng: 144.2785 },
  // QLD — Brisbane
  { suburb: "Brisbane City", state: "QLD", postcode: "4000", lat: -27.4698, lng: 153.0251 },
  { suburb: "South Brisbane", state: "QLD", postcode: "4101", lat: -27.4807, lng: 153.0194 },
  { suburb: "West End", state: "QLD", postcode: "4101", lat: -27.4828, lng: 153.0052 },
  { suburb: "Fortitude Valley", state: "QLD", postcode: "4006", lat: -27.4564, lng: 153.0354 },
  { suburb: "New Farm", state: "QLD", postcode: "4005", lat: -27.4654, lng: 153.0460 },
  { suburb: "Paddington", state: "QLD", postcode: "4064", lat: -27.4590, lng: 152.9972 },
  { suburb: "Toowong", state: "QLD", postcode: "4066", lat: -27.4835, lng: 152.9871 },
  { suburb: "Milton", state: "QLD", postcode: "4064", lat: -27.4715, lng: 153.0009 },
  { suburb: "Bulimba", state: "QLD", postcode: "4171", lat: -27.4547, lng: 153.0571 },
  { suburb: "Woolloongabba", state: "QLD", postcode: "4102", lat: -27.4902, lng: 153.0360 },
  { suburb: "Kangaroo Point", state: "QLD", postcode: "4169", lat: -27.4782, lng: 153.0357 },
  { suburb: "Teneriffe", state: "QLD", postcode: "4005", lat: -27.4555, lng: 153.0507 },
  { suburb: "Ascot", state: "QLD", postcode: "4007", lat: -27.4321, lng: 153.0600 },
  { suburb: "Hamilton", state: "QLD", postcode: "4007", lat: -27.4371, lng: 153.0601 },
  { suburb: "Indooroopilly", state: "QLD", postcode: "4068", lat: -27.5005, lng: 152.9752 },
  { suburb: "Carindale", state: "QLD", postcode: "4152", lat: -27.5065, lng: 153.1022 },
  { suburb: "Chermside", state: "QLD", postcode: "4032", lat: -27.3858, lng: 153.0317 },
  { suburb: "Mount Gravatt", state: "QLD", postcode: "4122", lat: -27.5438, lng: 153.0805 },
  // QLD — Other
  { suburb: "Gold Coast", state: "QLD", postcode: "4217", lat: -28.0167, lng: 153.4000 },
  { suburb: "Surfers Paradise", state: "QLD", postcode: "4217", lat: -28.0027, lng: 153.4298 },
  { suburb: "Broadbeach", state: "QLD", postcode: "4218", lat: -28.0269, lng: 153.4312 },
  { suburb: "Noosa Heads", state: "QLD", postcode: "4567", lat: -26.3949, lng: 153.0809 },
  { suburb: "Cairns", state: "QLD", postcode: "4870", lat: -16.9186, lng: 145.7781 },
  { suburb: "Townsville", state: "QLD", postcode: "4810", lat: -19.2576, lng: 146.8173 },
  // SA — Adelaide
  { suburb: "Adelaide", state: "SA", postcode: "5000", lat: -34.9285, lng: 138.6007 },
  { suburb: "North Adelaide", state: "SA", postcode: "5006", lat: -34.9064, lng: 138.5936 },
  { suburb: "Glenelg", state: "SA", postcode: "5045", lat: -34.9815, lng: 138.5147 },
  { suburb: "Norwood", state: "SA", postcode: "5067", lat: -34.9222, lng: 138.6319 },
  { suburb: "Unley", state: "SA", postcode: "5061", lat: -34.9497, lng: 138.6044 },
  { suburb: "Prospect", state: "SA", postcode: "5082", lat: -34.8831, lng: 138.5973 },
  { suburb: "Burnside", state: "SA", postcode: "5066", lat: -34.9369, lng: 138.6547 },
  // WA — Perth
  { suburb: "Perth", state: "WA", postcode: "6000", lat: -31.9505, lng: 115.8605 },
  { suburb: "Fremantle", state: "WA", postcode: "6160", lat: -32.0569, lng: 115.7439 },
  { suburb: "Subiaco", state: "WA", postcode: "6008", lat: -31.9459, lng: 115.8275 },
  { suburb: "Leederville", state: "WA", postcode: "6007", lat: -31.9363, lng: 115.8413 },
  { suburb: "Mount Lawley", state: "WA", postcode: "6050", lat: -31.9330, lng: 115.8721 },
  { suburb: "Northbridge", state: "WA", postcode: "6003", lat: -31.9443, lng: 115.8574 },
  { suburb: "Claremont", state: "WA", postcode: "6010", lat: -31.9795, lng: 115.7802 },
  { suburb: "Cottesloe", state: "WA", postcode: "6011", lat: -31.9967, lng: 115.7640 },
  { suburb: "Scarborough", state: "WA", postcode: "6019", lat: -31.8943, lng: 115.7587 },
  { suburb: "Joondalup", state: "WA", postcode: "6027", lat: -31.7459, lng: 115.7682 },
  // TAS
  { suburb: "Hobart", state: "TAS", postcode: "7000", lat: -42.8821, lng: 147.3272 },
  { suburb: "Launceston", state: "TAS", postcode: "7250", lat: -41.4332, lng: 147.1441 },
  { suburb: "Sandy Bay", state: "TAS", postcode: "7005", lat: -42.8983, lng: 147.3266 },
  { suburb: "Battery Point", state: "TAS", postcode: "7004", lat: -42.8893, lng: 147.3330 },
  // ACT
  { suburb: "Canberra", state: "ACT", postcode: "2601", lat: -35.2809, lng: 149.1300 },
  { suburb: "Barton", state: "ACT", postcode: "2600", lat: -35.3082, lng: 149.1365 },
  { suburb: "Braddon", state: "ACT", postcode: "2612", lat: -35.2703, lng: 149.1355 },
  { suburb: "Kingston", state: "ACT", postcode: "2604", lat: -35.3144, lng: 149.1406 },
  { suburb: "Manuka", state: "ACT", postcode: "2603", lat: -35.3167, lng: 149.1430 },
  { suburb: "Woden", state: "ACT", postcode: "2606", lat: -35.3459, lng: 149.0860 },
  { suburb: "Belconnen", state: "ACT", postcode: "2617", lat: -35.2388, lng: 149.0656 },
  { suburb: "Tuggeranong", state: "ACT", postcode: "2900", lat: -35.4161, lng: 149.0661 },
  // NT
  { suburb: "Darwin", state: "NT", postcode: "0800", lat: -12.4634, lng: 130.8456 },
  { suburb: "Alice Springs", state: "NT", postcode: "0870", lat: -23.6980, lng: 133.8807 },
];

/**
 * Calculate Haversine distance between two lat/lng points in km
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Search suburbs by name (case-insensitive prefix/contains match)
 * Returns top N matches sorted by relevance
 */
function searchSuburbs(query, limit = 10) {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase().trim();

    // Prioritize starts-with matches, then contains matches
    const startsWithMatches = [];
    const containsMatches = [];

    for (const s of SUBURBS) {
        const name = s.suburb.toLowerCase();
        if (name.startsWith(q)) {
            startsWithMatches.push(s);
        } else if (name.includes(q)) {
            containsMatches.push(s);
        }
    }

    return [...startsWithMatches, ...containsMatches].slice(0, limit);
}

/**
 * Find nearby suburbs within a given radius (km)
 * Returns suburbs sorted by distance, excluding the exact match
 */
function findNearbySuburbs(suburb, state, radiusKm = 10, limit = 20) {
    const base = SUBURBS.find(
        s => s.suburb.toLowerCase() === suburb.toLowerCase() &&
             (!state || s.state === state)
    );

    if (!base || !base.lat || !base.lng) return [];

    const nearby = [];
    for (const s of SUBURBS) {
        if (s.suburb.toLowerCase() === base.suburb.toLowerCase() && s.state === base.state) continue;
        const dist = haversineDistance(base.lat, base.lng, s.lat, s.lng);
        if (dist <= radiusKm) {
            nearby.push({ ...s, distance: Math.round(dist * 10) / 10 });
        }
    }

    nearby.sort((a, b) => a.distance - b.distance);
    return nearby.slice(0, limit);
}

/**
 * Find suburb by exact match
 */
function findSuburb(suburb, state) {
    return SUBURBS.find(
        s => s.suburb.toLowerCase() === suburb.toLowerCase() &&
             (!state || s.state === state)
    ) || null;
}

/**
 * Get all unique postcodes within a radius of a given suburb
 * Useful for search queries — find coaches in nearby postcodes
 */
function getNearbyPostcodes(suburb, state, radiusKm = 10) {
    const base = findSuburb(suburb, state);
    if (!base) return [base?.postcode].filter(Boolean);

    const postcodes = new Set([base.postcode]);
    const nearby = findNearbySuburbs(suburb, state, radiusKm);
    for (const s of nearby) {
        postcodes.add(s.postcode);
    }
    return Array.from(postcodes);
}

module.exports = {
    SUBURBS,
    searchSuburbs,
    findNearbySuburbs,
    findSuburb,
    getNearbyPostcodes,
    haversineDistance,
};
