import { 
  COUNTRY_STATION_COUNTS, 
  REGIONS, 
  COUNTRY_TO_REGION, 
  COUNTRY_POOL, 
  COUNTRY_TO_LANGUAGE, 
  COUNTRY_TO_CITY, 
  VALID_TAGS 
} from './data/constants.js';

let cachedApiNodes = null;

export async function getApiNodes() {
  if (cachedApiNodes && cachedApiNodes.length > 0) return cachedApiNodes;
  try {
    // Dynamic node discovery
    const res = await fetch('https://all.api.radio-browser.info/json/servers', {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const servers = await res.json();
      const nodes = servers.map(s => `https://${s.name}`);
      cachedApiNodes = [...new Set(nodes)];
      
      // Ensure all.api is in the list as a final fallback
      if (!cachedApiNodes.includes('https://all.api.radio-browser.info')) {
        cachedApiNodes.push('https://all.api.radio-browser.info');
      }
      return cachedApiNodes;
    }
  } catch (err) {
    console.warn("Dynamic node discovery failed:", err);
  }
  
  // Fallback if discovery fails
  cachedApiNodes = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
    'https://all.api.radio-browser.info'
  ];
  return cachedApiNodes;
}

// ─── Layer 4: Session-level deduplication ───
// Tracks station UUIDs already played in this session. Reset on game reset via resetSessionSeen().
const sessionSeenUUIDs = new Set();
export function resetSessionSeen() { sessionSeenUUIDs.clear(); }
export function markSessionSeen(uuid) { sessionSeenUUIDs.add(uuid); }

// ─── Layer 1 + Layer 3: Random offset + Sort order diversity ───
export async function fetchStation(targetCountry = null, talkMode = false) {
  const banUntil = parseInt(localStorage.getItem('radio_rate_limit') || '0', 10);
  if (banUntil > Date.now()) {
    throw new Error('Rate limited');
  }

  const nodes = await getApiNodes();
  
  for (let i = 0; i < 5; i++) {
    try {
      const country = targetCountry || COUNTRY_POOL[Math.floor(Math.random() * COUNTRY_POOL.length)];

      // Layer 1: Random offset within the known station pool for this country.
      // Cap at 60% of total count to keep reasonable stream quality.
      const totalCount = COUNTRY_STATION_COUNTS[country] || 20;
      const maxOffset = Math.max(0, Math.floor(totalCount * 0.6) - 100);
      const offset = maxOffset > 0 ? Math.floor(Math.random() * maxOffset) : 0;

      // Layer 3: Sort order diversity
      const roll = Math.random();
      let order, reverse;
      if (roll < 0.75) {
        order = 'votes'; reverse = 'true';    // 75% — quality-biased
      } else {
        order = 'clicktrend'; reverse = 'true'; // 25% — recently popular
      }

      const searchParamsObj = {
        limit: 100,
        offset,
        order,
        reverse,
        hidebroken: 'true',
        has_geo_info: 'true',
        countrycode: country,
        _: Date.now(),
      };

      if (talkMode && !targetCountry && i < 3) {
        searchParamsObj.tag = 'news';
        searchParamsObj.offset = 0; // Avoid overshooting smaller tagged pools
      } else if (!talkMode && !targetCountry && i < 3 && order === 'votes') {
        searchParamsObj.tag = VALID_TAGS[Math.floor(Math.random() * VALID_TAGS.length)];
        searchParamsObj.offset = 0; // Avoid overshooting smaller tagged pools
      }

      const params = new URLSearchParams(searchParamsObj);
      const apiNode = nodes[Math.floor(Math.random() * nodes.length)];
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let res;
      try {
        res = await fetch(`${apiNode}/json/stations/search?${params}`, {
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          throw new Error('Rate limited');
        }
        throw new Error(`Node ${apiNode} failed with status ${res.status}`);
      }

      let stations = await res.json();
      let list = stations;

      if (talkMode && list.length > 0) {
        const SPEECH_WORDS = [
          'news','talk','info','actualit','noticias','nachrichten','информ','nouvelles',
          'radio nacional','public radio','npr','bbc','rfi','dw',
          'actualidad','periodico','journal','noticia','talkback','all news',
          'sport news','business','politics','government','parliament'
        ];
        const MUSIC_WORDS = [
          'music','hits','fm 10','top 40','pop','rock','jazz','classic','oldies',
          'country','dance','techno','house','rnb','r&b','hip hop','lounge',
          'smooth','gold','mix','chart','playlist','beat','groove','sound',
          'easy','adult contemporary','soft','wave','flow'
        ];
        
        const scored = list.map(s => {
          const text = ((s.name||'') + ' ' + (s.tags||'')).toLowerCase();
          let score = 0;
          SPEECH_WORDS.forEach(w => { if (text.includes(w)) score += 2; });
          MUSIC_WORDS.forEach(w => { if (text.includes(w)) score -= 3; });
          return { s, score };
        });

        const talkOnly = scored.filter(x => x.score > 0).sort((a,b) => b.score - a.score).map(x => x.s);
        if (talkOnly.length >= 3) list = talkOnly;
      }

      // Shuffle the returned batch so we don't always take the first result
      for (let j = list.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [list[j], list[k]] = [list[k], list[j]];
      }

      const validStations = [];
      for (const s of list) {
        // Layer 4: Skip already-played stations
        if (sessionSeenUUIDs.has(s.stationuuid)) continue;

        const lat = parseFloat(s.geo_lat), lng = parseFloat(s.geo_long);
        const url = s.url_resolved || s.url;
        if (!url || !url.startsWith('https')) continue;
        if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) continue;

        validStations.push({
          stationuuid: s.stationuuid,
          name: s.name || 'Unknown Station', url,
          country: s.country || '', countrycode: (s.countrycode || '').toUpperCase(),
          state: s.state || COUNTRY_TO_CITY[s.countrycode?.toUpperCase()] || '', lat, lng,
          language: s.language || COUNTRY_TO_LANGUAGE[s.countrycode?.toUpperCase()] || 'Unknown',
        });
      }
      
      if (validStations.length > 0) {
        return validStations;
      }
    } catch (err) {
      if (err instanceof AggregateError && err.errors.some(e => e.message === 'Rate limited')) {
        localStorage.setItem('radio_rate_limit', Date.now() + 15000); // 15s ban
        throw new Error('Rate limited');
      }
      console.warn(`Station fetch attempt ${i + 1} failed:`, err);
      // Wait before retrying to allow network to recover (especially for 429/503 errors)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('No station found after multiple attempts');
}
