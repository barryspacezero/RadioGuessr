import { 
  COUNTRY_STATION_COUNTS, 
  REGIONS, 
  COUNTRY_TO_REGION, 
  COUNTRY_POOL, 
  COUNTRY_TO_LANGUAGE, 
  COUNTRY_TO_CITY, 
  VALID_TAGS 
} from './data/constants.js';

const API = 'https://de1.api.radio-browser.info';

// ─── Layer 4: Session-level deduplication ───
// Tracks station UUIDs already played in this session. Reset on game reset via resetSessionSeen().
const sessionSeenUUIDs = new Set();
export function resetSessionSeen() { sessionSeenUUIDs.clear(); }

// ─── Layer 1 + Layer 3: Random offset + Sort order diversity ───
export async function fetchStation(targetCountry = null) {
  for (let i = 0; i < 5; i++) {
    try {
      const country = targetCountry || COUNTRY_POOL[Math.floor(Math.random() * COUNTRY_POOL.length)];

      // Layer 1: Random offset within the known station pool for this country.
      // Cap at 60% of total count to keep reasonable stream quality.
      const totalCount = COUNTRY_STATION_COUNTS[country] || 20;
      const maxOffset = Math.max(0, Math.floor(totalCount * 0.6) - 20);
      const offset = maxOffset > 0 ? Math.floor(Math.random() * maxOffset) : 0;

      // Layer 3: Sort order diversity
      const roll = Math.random();
      let order, reverse;
      if (roll < 0.60) {
        order = 'votes'; reverse = 'true';    // 60% — quality-biased
      } else if (roll < 0.85) {
        order = 'random'; reverse = 'false';  // 25% — full randomness
      } else {
        order = 'clicktrend'; reverse = 'true'; // 15% — recently popular
      }

      const searchParamsObj = {
        limit: 20,
        offset,
        order,
        reverse,
        hidebroken: 'true',
        has_geo_info: 'true',
        countrycode: country,
        _: Date.now(),
      };

      // Still enforce a genre tag on votes-sorted fetches for the first 3 attempts
      // to avoid low-quality ambience/test stations.
      if (i < 3 && order === 'votes') {
        searchParamsObj.tag = VALID_TAGS[Math.floor(Math.random() * VALID_TAGS.length)];
      }

      const params = new URLSearchParams(searchParamsObj);
      const res = await fetch(`${API}/json/stations/search?${params}`);
      const list = await res.json();

      // Shuffle the returned batch so we don't always take the first result
      for (let j = list.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [list[j], list[k]] = [list[k], list[j]];
      }

      for (const s of list) {
        // Layer 4: Skip already-played stations
        if (sessionSeenUUIDs.has(s.stationuuid)) continue;

        const lat = parseFloat(s.geo_lat), lng = parseFloat(s.geo_long);
        const url = s.url_resolved || s.url;
        if (!url || !url.startsWith('https')) continue;
        if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) continue;

        sessionSeenUUIDs.add(s.stationuuid);
        return {
          name: s.name || 'Unknown Station', url,
          country: s.country || '', countrycode: s.countrycode || '',
          state: s.state || COUNTRY_TO_CITY[s.countrycode] || '', lat, lng,
          language: s.language || COUNTRY_TO_LANGUAGE[s.countrycode] || 'Unknown',
        };
      }
    } catch (err) {
      console.warn('Station fetch attempt failed, retrying...', err);
    }
  }
  throw new Error('No station found');
}
