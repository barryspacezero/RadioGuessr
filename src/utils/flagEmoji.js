/**
 * Converts an ISO 3166-1 alpha-2 country code to the corresponding flag emoji.
 * Works by mapping each letter to a Regional Indicator Symbol (U+1F1E6–U+1F1FF).
 *
 * @param {string} countryCode  e.g. "DE", "us", "FR"
 * @returns {string}            e.g. "🇩🇪"
 */
export function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const points = countryCode
        .toUpperCase()
        .split('')
        .map(c => 0x1F1E6 - 65 + c.charCodeAt(0)); // 0x1F1E6 = 🇦
    return String.fromCodePoint(...points);
}
