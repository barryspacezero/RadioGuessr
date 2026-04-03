const API = 'https://de1.api.radio-browser.info';

export async function fetchStation() {
  for (let i = 0; i < 3; i++) {
    try {
      const params = new URLSearchParams({
        limit: 10, order: 'random', hidebroken: 'true',
        has_geo_info: 'true', codec: 'MP3', _: Date.now(),
      });
      const res = await fetch(`${API}/json/stations/search?${params}`);
      const list = await res.json();
      console.log(list);
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
// const API = 'https://de1.api.radio-browser.info';

// export async function fetchStation() {
//   const res = await fetch(`${API}/json/stations/search?limit=1`);
//   const list = await res.json();
//   const s = list[0];

//   return {
//     name: s.name,
//     url: s.url_resolved || s.url,
//     country: s.country,
//     lat: parseFloat(s.geo_lat),
//     lng: parseFloat(s.geo_long),
//   };
// }