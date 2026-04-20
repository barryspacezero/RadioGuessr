const API = 'https://de1.api.radio-browser.info';

const REGIONS = {
  'South Asia': ['IN', 'PK', 'BD', 'LK', 'NP', 'AF', 'MV'],
  'East Asia': ['JP', 'KR', 'CN', 'TW', 'MN', 'HK'],
  'Southeast Asia': ['ID', 'TH', 'VN', 'PH', 'MY', 'SG', 'MM', 'KH', 'LA', 'BN'],
  'Central Asia': ['KZ', 'UZ', 'TM', 'KG', 'TJ'],
  'Middle East': ['IR', 'IQ', 'SA', 'AE', 'YE', 'OM', 'QA', 'KW', 'BH', 'JO', 'SY', 'LB', 'IL', 'PS'],
  'Africa - North': ['EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'SS'],
  'Africa - West': ['NG', 'GH', 'SN', 'CI', 'ML', 'BF', 'NE', 'GN', 'TG', 'BJ', 'LR', 'SL', 'GM', 'GW', 'MR', 'CV'],
  'Africa - East': ['KE', 'ET', 'TZ', 'UG', 'RW', 'BI', 'SO', 'DJ', 'ER', 'MG', 'MU', 'SC'],
  'Africa - Central': ['CM', 'TD', 'CF', 'CG', 'CD', 'GA', 'GQ', 'ST', 'AO'],
  'Africa - South': ['ZA', 'ZW', 'ZM', 'MW', 'MZ', 'BW', 'NA', 'SZ', 'LS'],
  'Europe - West': ['DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE', 'CH', 'AT', 'LU', 'IE', 'GB'],
  'Europe - North': ['SE', 'NO', 'DK', 'FI', 'IS', 'EE', 'LV', 'LT'],
  'Europe - East': ['PL', 'RO', 'UA', 'BY', 'RU', 'CZ', 'SK', 'HU', 'MD'],
  'Europe - South / Balkans': ['GR', 'TR', 'RS', 'HR', 'BA', 'SI', 'MK', 'AL', 'ME', 'BG', 'CY', 'MT'],
  'Caucasus': ['GE', 'AM', 'AZ'],
  'North America': ['US', 'CA', 'MX'],
  'Caribbean': ['CU', 'JM', 'HT', 'DO', 'PR', 'TT', 'BB', 'LC', 'VC', 'GD', 'AG', 'DM', 'KN', 'BS'],
  'Central America': ['GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA'],
  'South America': ['BR', 'AR', 'CO', 'VE', 'PE', 'CL', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR', 'GF'],
  'Oceania': ['AU', 'NZ', 'PG', 'FJ', 'SB', 'VU', 'WS', 'TO', 'KI', 'FM', 'PW'],
  'Pacific / Territories': ['NC', 'PF', 'GU', 'MP']
};

export const COUNTRY_TO_REGION = {};
const COUNTRY_POOL = ['IN', 'IN', 'IN']; // Added extra weight for IN to preserve original logic

for (const [region, countries] of Object.entries(REGIONS)) {
  for (const country of countries) {
    COUNTRY_TO_REGION[country] = region;
    COUNTRY_POOL.push(country);
  }
}

//using the language list as a fallback if the metadata in the API does not have any language.
export const COUNTRY_TO_LANGUAGE = {
  IN: 'Hindi / English', PK: 'Urdu', BD: 'Bengali', LK: 'Sinhala / Tamil', NP: 'Nepali', AF: 'Pashto / Dari', MV: 'Dhivehi',
  JP: 'Japanese', KR: 'Korean', CN: 'Mandarin', TW: 'Mandarin', MN: 'Mongolian', HK: 'Cantonese',
  ID: 'Indonesian', TH: 'Thai', VN: 'Vietnamese', PH: 'Filipino / English', MY: 'Malay', SG: 'English / Malay / Mandarin', MM: 'Burmese', KH: 'Khmer', LA: 'Lao', BN: 'Malay',
  KZ: 'Kazakh / Russian', UZ: 'Uzbek', TM: 'Turkmen', KG: 'Kyrgyz / Russian', TJ: 'Tajik',
  IR: 'Persian', IQ: 'Arabic', SA: 'Arabic', AE: 'Arabic', YE: 'Arabic', OM: 'Arabic', QA: 'Arabic', KW: 'Arabic', BH: 'Arabic', JO: 'Arabic', SY: 'Arabic', LB: 'Arabic', IL: 'Hebrew / Arabic', PS: 'Arabic',
  EG: 'Arabic', LY: 'Arabic', TN: 'Arabic', DZ: 'Arabic', MA: 'Arabic', SD: 'Arabic', SS: 'English',
  NG: 'English', GH: 'English', SN: 'French / Wolof', CI: 'French', ML: 'French', BF: 'French', NE: 'French', GN: 'French', TG: 'French', BJ: 'French', LR: 'English', SL: 'English', GM: 'English', GW: 'Portuguese', MR: 'Arabic', CV: 'Portuguese',
  KE: 'Swahili / English', ET: 'Amharic', TZ: 'Swahili / English', UG: 'English / Swahili', RW: 'Kinyarwanda / English / French', BI: 'Kirundi / French', SO: 'Somali / Arabic', DJ: 'French / Arabic', ER: 'Tigrinya / Arabic', MG: 'Malagasy / French', MU: 'English / French', SC: 'Seychellois Creole',
  CM: 'French / English', TD: 'French / Arabic', CF: 'French / Sango', CG: 'French', CD: 'French', GA: 'French', GQ: 'Spanish / French', ST: 'Portuguese', AO: 'Portuguese',
  ZA: 'English / Afrikaans / Zulu / Xhosa', ZW: 'English / Shona / Ndebele', ZM: 'English', MW: 'English / Chichewa', MZ: 'Portuguese', BW: 'English / Setswana', NA: 'English', SZ: 'Swazi / English', LS: 'Sesotho / English',
  DE: 'German', FR: 'French', ES: 'Spanish', PT: 'Portuguese', IT: 'Italian', NL: 'Dutch', BE: 'Dutch / French / German', CH: 'German / French / Italian', AT: 'German', LU: 'Luxembourgish / French / German', IE: 'English / Irish', GB: 'English',
  SE: 'Swedish', NO: 'Norwegian', DK: 'Danish', FI: 'Finnish / Swedish', IS: 'Icelandic', EE: 'Estonian', LV: 'Latvian', LT: 'Lithuanian',
  PL: 'Polish', RO: 'Romanian', UA: 'Ukrainian', BY: 'Belarusian / Russian', RU: 'Russian', CZ: 'Czech', SK: 'Slovak', HU: 'Hungarian', MD: 'Romanian',
  GR: 'Greek', TR: 'Turkish', RS: 'Serbian', HR: 'Croatian', BA: 'Bosnian / Croatian / Serbian', SI: 'Slovenian', MK: 'Macedonian', AL: 'Albanian', ME: 'Montenegrin', BG: 'Bulgarian', CY: 'Greek / Turkish', MT: 'Maltese / English',
  GE: 'Georgian', AM: 'Armenian', AZ: 'Azerbaijani',
  US: 'English', CA: 'English / French', MX: 'Spanish',
  CU: 'Spanish', JM: 'English', HT: 'French / Haitian Creole', DO: 'Spanish', PR: 'Spanish / English', TT: 'English', BB: 'English', LC: 'English', VC: 'English', GD: 'English', AG: 'English', DM: 'English', KN: 'English', BS: 'English',
  GT: 'Spanish', BZ: 'English', SV: 'Spanish', HN: 'Spanish', NI: 'Spanish', CR: 'Spanish', PA: 'Spanish',
  BR: 'Portuguese', AR: 'Spanish', CO: 'Spanish', VE: 'Spanish', PE: 'Spanish', CL: 'Spanish', EC: 'Spanish', BO: 'Spanish', PY: 'Spanish / Guarani', UY: 'Spanish', GY: 'English', SR: 'Dutch', GF: 'French',
  AU: 'English', NZ: 'English / Maori', PG: 'English / Tok Pisin / Hiri Motu', FJ: 'English / Fijian / Hindi', SB: 'English', VU: 'Bislama / English / French', WS: 'Samoan / English', TO: 'Tongan / English', KI: 'English / Gilbertese', FM: 'English', PW: 'Palauan / English',
  NC: 'French', PF: 'French', GU: 'English', MP: 'English'
};

export async function fetchStation() {
  for (let i = 0; i < 5; i++) {
    try {
      const country = COUNTRY_POOL[Math.floor(Math.random() * COUNTRY_POOL.length)];
      const params = new URLSearchParams({
        limit: 5, order: 'votes', hidebroken: 'true',
        has_geo_info: 'true',
        countrycode: country, _: Date.now(),
      });
      const res = await fetch(`${API}/json/stations/search?${params}`);
      const list = await res.json();
      for (const s of list) {
        const lat = parseFloat(s.geo_lat), lng = parseFloat(s.geo_long);
        const url = s.url_resolved || s.url;
        if (!url.startsWith('https')) continue
        if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) continue;
        if (!url) continue;
        return {
          name: s.name || 'Unknown Station', url,
          country: s.country || '', countrycode: s.countrycode || '',
          state: s.state || '', lat, lng,
          language: s.language || COUNTRY_TO_LANGUAGE[s.countrycode] || 'Unknown',
        };
      }
    } catch {
      console.warn('Station fetch attempt failed, retrying...', err)
    }
  }
  throw new Error('No station found');
}

