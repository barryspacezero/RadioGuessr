export function calcScore(guessLat, guessLng, lat, lng) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat - guessLat), dLng = toRad(lng - guessLng);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(guessLat)) * Math.cos(toRad(lat)) * Math.sin(dLng/2)**2;
  const km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  return { km, score: Math.round(5000 * Math.exp(-10 * km / 20015)) };
}
