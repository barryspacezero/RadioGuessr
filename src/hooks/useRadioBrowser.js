import { useCallback, useRef } from 'react';

// ── Mirror pool ───────────────────────────────────────────────────────────────
const MIRRORS = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
    'https://fi1.api.radio-browser.info',
    'https://de2.api.radio-browser.info',
    'https://all.api.radio-browser.info',
];

const BACKOFF_MS = 60_000;

// ── URL patterns that always mean a playlist file, not a direct stream ────────
const PLAYLIST_RE = /\.(m3u8?|pls|asx|xspf)(\?.*)?$/i;

// ── Patterns in the URL that hint at HLS even without an extension ────────────
// (e.g. /hls/, /playlist/, /index.m3u8 without extension after ?)
const HLS_URL_RE = /\/hls\/|\/playlist\/|\.m3u8|manifest/i;

/**
 * React hook wrapping the Radio Browser REST API.
 *
 * Strategy — no URL probing (probing opens a TCP connection that competes
 * with the <audio> element on single-listener Icecast servers, causing the
 * "plays for 1 second then code 4" bug).
 *
 * Instead we use two API passes with strict codec filtering:
 *   Pass 1 — ask the API for codec=MP3 (direct Icecast/Shoutcast, never HLS)
 *   Pass 2 — fallback: codec=AAC (also common, mostly non-HLS)
 *   Pass 3 — fallback: any codec, client-side filtered to known-good set
 */
export function useRadioBrowser() {
    const mirrorIndex = useRef(Math.floor(Math.random() * MIRRORS.length));
    const failedAt    = useRef(new Map());

    const nextMirror = useCallback(() => {
        const now = Date.now();
        for (let i = 0; i < MIRRORS.length; i++) {
            mirrorIndex.current = (mirrorIndex.current + 1) % MIRRORS.length;
            const m = MIRRORS[mirrorIndex.current];
            if (now - (failedAt.current.get(m) ?? 0) > BACKOFF_MS) return m;
        }
        failedAt.current.clear();
        return MIRRORS[mirrorIndex.current];
    }, []);

    /** Fetch a batch from one mirror, optionally locking to a codec. */
    const fetchBatch = useCallback(async (mirror, codec = null) => {
        const params = new URLSearchParams({
            limit:        '40',
            order:        'random',
            hidebroken:   'true',
            has_geo_info: 'true',
            _:             Date.now(),
        });
        if (codec) params.set('codec', codec);

        const res = await fetch(
            `${mirror}/json/stations/search?${params}`,
            { cache: 'no-store', signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty response');
        return data;
    }, []);

    /**
     * Validate a raw station from the API.
     * @param {Set<string>|null} allowedCodecs  If provided, station's codec must be in this set.
     * @returns normalised station object or null
     */
    function pick(s, allowedCodecs = null) {
        // Coordinates
        const lat = parseFloat(s.geo_lat);
        const lng = parseFloat(s.geo_long);
        if (!isFinite(lat) || !isFinite(lng)) return null;
        if (lat === 0 && lng === 0) return null;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

        // URL presence and extension-based playlist rejection
        const url = s.url_resolved || s.url;
        if (!url?.trim()) return null;
        if (PLAYLIST_RE.test(url)) return null;
        if (HLS_URL_RE.test(url))  return null; // URL structure hints at HLS

        // Codec allow-list (when enforced)
        if (allowedCodecs) {
            const c = (s.codec || '').toUpperCase().trim();
            if (!c || !allowedCodecs.has(c)) return null;
        }

        return {
            name:        s.name        || 'Unknown Station',
            url,
            country:     s.country     || '',
            countrycode: s.countrycode || '',
            state:       s.state       || '',
            lat, lng,
            language:    s.language    || '',
            stationuuid: s.stationuuid || '',
            codec:       s.codec       || '',
        };
    }

    /**
     * Attempt one pass across all mirrors using the given codec filter.
     * Returns a station object, or null if nothing was found.
     */
    const tryPass = useCallback(async (codec, allowedCodecs) => {
        const tried = new Set();
        for (let i = 0; i < MIRRORS.length; i++) {
            const mirror = nextMirror();
            if (tried.has(mirror)) continue;
            tried.add(mirror);
            try {
                const stations = await fetchBatch(mirror, codec);
                for (const s of stations) {
                    const station = pick(s, allowedCodecs);
                    if (station) {
                        console.debug(`[RadioBrowser] Found: ${station.name} (${station.codec}) via ${mirror}`);
                        return station;
                    }
                }
            } catch (err) {
                failedAt.current.set(mirror, Date.now());
                console.warn(`[RadioBrowser] Mirror ${mirror} failed:`, err.message);
            }
        }
        return null;
    }, [nextMirror, fetchBatch]);

    /**
     * Main public method — three passes, strictest first.
     *
     * Pass 1: API codec=MP3   → direct Icecast/Shoutcast streams, almost never HLS
     * Pass 2: API codec=AAC   → also mostly direct streams on Icecast
     * Pass 3: no codec filter → client-side filter for OGG / FLAC / OPUS fallback
     */
    const fetchStation = useCallback(async () => {
        // Pass 1 — MP3 (best compatibility, Icecast native)
        let station = await tryPass('MP3', null);
        if (station) return station;

        console.warn('[RadioBrowser] Pass 1 (MP3) exhausted — trying AAC…');

        // Pass 2 — AAC (common on Icecast, not usually HLS unless explicitly HLS station)
        station = await tryPass('AAC', null);
        if (station) return station;

        console.warn('[RadioBrowser] Pass 2 (AAC) exhausted — trying broad codec filter…');

        // Pass 3 — any geo station, client-side filtered to browser-native codecs
        station = await tryPass(null, new Set(['MP3', 'AAC', 'AAC+', 'OGG', 'FLAC', 'OPUS']));
        if (station) return station;

        throw new Error('[RadioBrowser] All passes exhausted');
    }, [tryPass]);

    return { fetchStation };
}
