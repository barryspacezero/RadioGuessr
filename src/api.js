const API = 'https://de1.api.radio-browser.info';

const COUNTRY_POOL = [
  // South Asia
  'IN', 'PK', 'BD', 'LK', 'NP', 'AF', 'MV',

  // East Asia
  'JP', 'KR', 'CN', 'TW', 'MN', 'HK',

  // Southeast Asia
  'ID', 'TH', 'VN', 'PH', 'MY', 'SG', 'MM', 'KH', 'LA', 'BN',

  // Central Asia
  'KZ', 'UZ', 'TM', 'KG', 'TJ',

  // Middle East
  'IR', 'IQ', 'SA', 'AE', 'YE', 'OM', 'QA', 'KW', 'BH', 'JO', 'SY', 'LB', 'IL', 'PS',

  // Africa - North
  'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'SS',

  // Africa - West
  'NG', 'GH', 'SN', 'CI', 'ML', 'BF', 'NE', 'GN', 'TG', 'BJ', 'LR', 'SL', 'GM', 'GW', 'MR', 'CV',

  // Africa - East
  'KE', 'ET', 'TZ', 'UG', 'RW', 'BI', 'SO', 'DJ', 'ER', 'MG', 'MU', 'SC',

  // Africa - Central
  'CM', 'TD', 'CF', 'CG', 'CD', 'GA', 'GQ', 'ST', 'AO',

  // Africa - South
  'ZA', 'ZW', 'ZM', 'MW', 'MZ', 'BW', 'NA', 'SZ', 'LS',

  // Europe - West
  'DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE', 'CH', 'AT', 'LU', 'IE', 'GB',

  // Europe - North
  'SE', 'NO', 'DK', 'FI', 'IS', 'EE', 'LV', 'LT',

  // Europe - East
  'PL', 'RO', 'UA', 'BY', 'RU', 'CZ', 'SK', 'HU', 'MD',

  // Europe - South / Balkans
  'GR', 'TR', 'RS', 'HR', 'BA', 'SI', 'MK', 'AL', 'ME', 'BG', 'CY', 'MT',

  // Caucasus
  'GE', 'AM', 'AZ',

  // North America
  'US', 'CA', 'MX',

  // Caribbean
  'CU', 'JM', 'HT', 'DO', 'PR', 'TT', 'BB', 'LC', 'VC', 'GD', 'AG', 'DM', 'KN', 'BS',

  // Central America
  'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA',

  // South America
  'BR', 'AR', 'CO', 'VE', 'PE', 'CL', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR', 'GF',

  // Oceania
  'AU', 'NZ', 'PG', 'FJ', 'SB', 'VU', 'WS', 'TO', 'KI', 'FM', 'PW',

  // Pacific / Territories
  'NC', 'PF', 'GU', 'MP',
];

export async function fetchStation() {
  for (let i = 0; i < 5; i++) {
    try {
      const country = COUNTRY_POOL[Math.floor(Math.random() * COUNTRY_POOL.length)];
      const params = new URLSearchParams({
        limit: 5, order: 'random', hidebroken: 'true',
        has_geo_info: 'true', codec: 'MP3',
        countrycode: country, _: Date.now(),
      });
      const res = await fetch(`${API}/json/stations/search?${params}`);
      const list = await res.json();
      for (const s of list) {
        const lat = parseFloat(s.geo_lat), lng = parseFloat(s.geo_long);
        if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) continue;
        const url = s.url_resolved || s.url;
        if (!url) continue;
        return {
          name: s.name || 'Unknown Station', url,
          country: s.country || '', countrycode: s.countrycode || '',
          state: s.state || '', lat, lng,
          language: s.language || '',
        };
      }
    } catch { /* retry */ }
  }
  throw new Error('No station found');
}