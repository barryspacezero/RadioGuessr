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
  'Europe': ['DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE', 'CH', 'AT', 'LU', 'IE', 'GB', 'SE', 'NO', 'DK', 'FI', 'IS', 'EE', 'LV', 'LT', 'PL', 'RO', 'UA', 'BY', 'RU', 'CZ', 'SK', 'HU', 'MD', 'GR', 'TR', 'RS', 'HR', 'BA', 'SI', 'MK', 'AL', 'ME', 'BG', 'CY', 'MT'],
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

export const COUNTRY_TO_CITY = {
  "IR": "Tehran", "AL": "Tirana", "WF": "Mata-Utu", "BE": "Brussels", "IO": "Diego Garcia",
  "PM": "Saint-Pierre", "VC": "Kingstown", "MH": "Majuro", "TM": "Ashgabat", "NG": "Abuja", "TN": "Tunis", "SC": "Victoria",
  "UY": "Montevideo", "PF": "Papeetē", "AE": "Abu Dhabi", "HT": "Port-au-Prince", "TR": "Ankara", "GY": "Georgetown",
  "JO": "Amman", "SI": "Ljubljana", "OM": "Muscat", "ZA": "Pretoria", "PT": "Lisbon", "UG": "Kampala", "DK": "Copenhagen",
  "DO": "Santo Domingo", "TO": "Nuku'alofa", "NF": "Kingston", "MT": "Valletta", "BD": "Dhaka", "SV": "San Salvador",
  "TH": "Bangkok", "ZW": "Harare", "KZ": "Astana", "MY": "Kuala Lumpur", "MD": "Chișinău", "AX": "Mariehamn",
  "HK": "City of Victoria", "IM": "Douglas", "LS": "Maseru", "VU": "Port Vila", "GT": "Guatemala City",
  "SN": "Dakar", "DE": "Berlin", "MS": "Plymouth", "PN": "Adamstown", "SS": "Juba", "GW": "Bissau",
  "CY": "Nicosia", "DZ": "Algiers", "PS": "Ramallah", "GE": "Tbilisi", "KW": "Kuwait City", "MU": "Port Louis",
  "XK": "Pristina", "VI": "Charlotte Amalie", "CM": "Yaoundé", "GB": "London", "TT": "Port of Spain", "BF": "Ouagadougou",
  "RS": "Belgrade", "TG": "Lomé", "CX": "Flying Fish Cove", "EH": "El Aaiún", "IE": "Dublin", "BY": "Minsk", "PH": "Manila",
  "CC": "West Island", "CO": "Bogotá", "NA": "Windhoek", "CI": "Yamoussoukro", "US": "Washington, D.C.", "RO": "Bucharest",
  "GR": "Athens", "NL": "Amsterdam", "GP": "Basse-Terre", "TC": "Cockburn Town", "RU": "Moscow", "KH": "Phnom Penh",
  "GL": "Nuuk", "BB": "Bridgetown", "LC": "Castries", "MZ": "Maputo", "KP": "Pyongyang", "AM": "Yerevan", "GA": "Libreville",
  "SJ": "Longyearbyen", "FO": "Tórshavn", "YE": "Sana'a", "NE": "Niamey", "IT": "Rome", "PR": "San Juan", "CN": "Beijing",
  "PY": "Asunción", "NC": "Nouméa", "TF": "Port-aux-Français", "DM": "Roseau", "EG": "Cairo", "SL": "Freetown", "BR": "Brasília",
  "ZM": "Lusaka", "ER": "Asmara", "MF": "Marigot", "FK": "Stanley", "RE": "Saint-Denis", "ME": "Podgorica", "LR": "Monrovia",
  "SY": "Damascus", "TK": "Fakaofo", "BG": "Sofia", "ML": "Bamako", "LA": "Vientiane", "LT": "Vilnius", "MR": "Nouakchott",
  "SK": "Bratislava", "CK": "Avarua", "SO": "Mogadishu", "FJ": "Suva", "KE": "Nairobi", "KI": "South Tarawa", "NO": "Oslo",
  "GQ": "Ciudad de la Paz", "LY": "Tripoli", "LU": "Luxembourg", "PA": "Panama City", "GN": "Conakry", "CV": "Praia",
  "ID": "Jakarta", "KN": "Basseterre", "BQ": "Kralendijk", "CR": "San José", "JE": "Saint Helier", "ES": "Madrid", "MW": "Lilongwe",
  "SM": "City of San Marino", "BH": "Manama", "KY": "George Town", "KR": "Seoul", "AO": "Luanda", "FI": "Helsinki", "CU": "Havana",
  "NU": "Alofi", "GH": "Accra", "EC": "Quito", "GU": "Hagåtña", "BS": "Nassau", "FM": "Palikir", "TV": "Funafuti", "CH": "Bern",
  "TD": "N'Djamena", "HU": "Budapest", "MQ": "Fort-de-France", "VG": "Road Town", "MK": "Skopje", "NI": "Managua", "MX": "Mexico City",
  "CL": "Santiago", "BN": "Bandar Seri Begawan", "GF": "Cayenne", "AT": "Vienna", "HR": "Zagreb", "CZ": "Prague", "MC": "Monaco",
  "PW": "Ngerulmud", "SE": "Stockholm", "BI": "Gitega", "MP": "Saipan", "CD": "Kinshasa", "CG": "Brazzaville", "LI": "Vaduz",
  "NZ": "Wellington", "JP": "Tokyo", "EE": "Tallinn", "GD": "St. George's", "SX": "Philipsburg", "AZ": "Baku", "SB": "Honiara",
  "NP": "Kathmandu", "GG": "St. Peter Port", "AW": "Oranjestad", "UM": "Washington DC", "GM": "Banjul", "TZ": "Dodoma", "DJ": "Djibouti",
  "IN": "New Delhi", "LK": "Sri Jayawardenepura Kotte", "PE": "Lima", "TJ": "Dushanbe", "PG": "Port Moresby", "BO": "Sucre", "UZ": "Tashkent",
  "BL": "Gustavia", "JM": "Kingston", "TL": "Dili", "KM": "Moroni", "WS": "Apia", "SR": "Paramaribo", "MV": "Malé", "ST": "São Tomé",
  "MN": "Ulan Bator", "CW": "Willemstad", "SD": "Khartoum", "BW": "Gaborone", "IL": "Jerusalem", "BZ": "Belmopan", "BJ": "Porto-Novo",
  "LV": "Riga", "AR": "Buenos Aires", "MM": "Naypyidaw", "SG": "Singapore", "AI": "The Valley", "BM": "Hamilton", "RW": "Kigali",
  "FR": "Paris", "SA": "Riyadh", "VN": "Hanoi", "AD": "Andorra la Vella", "GS": "King Edward Point", "HN": "Tegucigalpa",
  "VA": "Vatican City", "AU": "Canberra", "PK": "Islamabad", "AF": "Kabul", "IS": "Reykjavik", "MG": "Antananarivo", "ET": "Addis Ababa",
  "QA": "Doha", "KG": "Bishkek", "CF": "Bangui", "GI": "Gibraltar", "SZ": "Mbabane", "YT": "Mamoudzou", "UA": "Kyiv", "SH": "Jamestown",
  "LB": "Beirut", "VE": "Caracas", "IQ": "Baghdad", "AS": "Pago Pago", "AG": "Saint John's", "PL": "Warsaw", "TW": "Taipei", "CA": "Ottawa",
  "NR": "Yaren", "BT": "Thimphu", "MA": "Rabat", "BA": "Sarajevo"
};

const VALID_TAGS = ['music', 'talk', 'news', 'pop', 'rock', 'dance', 'jazz', 'classical', 'indie', 'hits', 'electronic', 'country', 'hiphop', 'rnb'];

export async function fetchStation() {
  for (let i = 0; i < 5; i++) {
    try {
      const country = COUNTRY_POOL[Math.floor(Math.random() * COUNTRY_POOL.length)];
      const searchParamsObj = {
        limit: 10, order: 'votes', reverse: 'true', hidebroken: 'true',
        has_geo_info: 'true',
        countrycode: country, _: Date.now(),
      };

      // Try to enforce a meaningful genre tag for the first 3 attempts
      // This prevents random ambience stations and gets music or talk shows
      if (i < 3) {
        searchParamsObj.tag = VALID_TAGS[Math.floor(Math.random() * VALID_TAGS.length)];
      }

      const params = new URLSearchParams(searchParamsObj);
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
          state: s.state || COUNTRY_TO_CITY[s.countrycode] || '', lat, lng,
          language: s.language || COUNTRY_TO_LANGUAGE[s.countrycode] || 'Unknown',
        };
      }
    } catch (err) {
      console.warn('Station fetch attempt failed, retrying...', err)
    }
  }
  throw new Error('No station found');
}

