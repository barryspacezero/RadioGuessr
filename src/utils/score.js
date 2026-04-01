/**
 * Pure scoring utilities — no DOM, no React, no side effects.
 */

/**
 * Great-circle distance between two lat/lng points (Haversine formula).
 * @returns {number} Distance in kilometres
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GeoGuessr-style exponential decay score.
 * Max 5000 pts at 0 km, approaches 0 at ~20 015 km (half of Earth's circumference).
 * @returns {{ score: number, distanceKm: number, tier: string }}
 */
export function calculateScore(guessLat, guessLng, actualLat, actualLng) {
    const distanceKm = haversineDistance(guessLat, guessLng, actualLat, actualLng);
    const score = Math.round(5000 * Math.exp(-10 * distanceKm / 20015));

    let tier;
    if (score >= 4800)      tier = '🎯 Pinpoint!';
    else if (score >= 4000) tier = '🔥 Hot!';
    else if (score >= 3000) tier = '⚡ Close!';
    else if (score >= 1500) tier = '🌍 Getting there';
    else if (score >= 500)  tier = '🗺️ Far off';
    else                    tier = '🏔️ In another world';

    return { score, distanceKm: Math.round(distanceKm), tier };
}
