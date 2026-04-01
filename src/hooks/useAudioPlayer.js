import { useCallback, useEffect, useRef } from 'react';

/**
 * React hook that manages an HTML <audio> element for radio clip playback.
 *
 * Exposes:
 *   play(url, durationSecs, { onPlay, onTick, onEnd, onError }) → cancelFn
 *   stop()
 *
 * Key design decisions:
 *  - The Audio element is stored in a ref, not state — no re-renders.
 *  - A `cancelled` flag per-clip prevents the double-fire bug
 *    (where stopAudio nulls the element, then the stale 'error' event fires again).
 *  - crossOrigin is intentionally NOT set — setting it to 'anonymous' forces
 *    CORS checks that block ~80% of radio streams.
 *  - The element is cleaned up on component unmount via useEffect.
 */
export function useAudioPlayer() {
    const audioRef    = useRef(null);
    const clipTimerRef = useRef(null);
    const stallTimerRef = useRef(null);

    // ── Cleanup on unmount ───────────────────────────────
    useEffect(() => {
        return () => stopInternal();
    }, []);

    // ── Internal helpers ─────────────────────────────────
    function clearClipTimer() {
        if (clipTimerRef.current) {
            clearInterval(clipTimerRef.current);
            clipTimerRef.current = null;
        }
    }

    function clearStallTimer() {
        if (stallTimerRef.current) {
            clearTimeout(stallTimerRef.current);
            stallTimerRef.current = null;
        }
    }

    function stopInternal() {
        clearClipTimer();
        clearStallTimer();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
    }

    // ── Public API ───────────────────────────────────────

    /**
     * Stop any currently playing audio immediately.
     */
    const stop = useCallback(() => {
        stopInternal();
    }, []);

    /**
     * Play a radio stream URL for `duration` seconds.
     *
     * @param {string}   url
     * @param {number}   duration   Seconds to play before calling onEnd (default 15)
     * @param {object}   callbacks  { onPlay, onTick(timeLeft), onEnd, onError(msg) }
     * @returns {Function}          Cancel function — call to abort early.
     */
    const play = useCallback((url, duration = 15, callbacks = {}) => {
        stopInternal(); // clean up any previous clip

        const { onPlay, onTick, onEnd, onError } = callbacks;

        // Capture in a local variable so all event callbacks always have a
        // valid reference — even after audioRef.current is nulled by stopInternal().
        const audio = new Audio();
        audioRef.current = audio;
        audio.volume = 0.85;
        audio.src    = url;

        let timeLeft       = duration;
        let playbackStarted = false;
        let cancelled      = false; // only the first error/end path fires its callback

        const fireError = (msg) => {
            if (cancelled) return;
            cancelled = true;
            clearClipTimer();
            clearStallTimer();
            onError?.(msg);
        };

        // ── Playing event → start the countdown ──────────
        const onPlaying = () => {
            if (playbackStarted || cancelled) return;
            playbackStarted = true;
            clearStallTimer();
            onPlay?.();

            clipTimerRef.current = setInterval(() => {
                if (cancelled) { clearClipTimer(); return; }
                timeLeft--;
                onTick?.(timeLeft);
                if (timeLeft <= 0) {
                    cancelled = true;
                    stopInternal();
                    onEnd?.();
                }
            }, 1000);
        };

        audio.addEventListener('playing', onPlaying, { once: true });

        // ── Audio element error → use local ref, not audioRef ──
        audio.addEventListener('error', () => {
            const code = audio.error?.code ?? 'unknown';
            console.warn(`[AudioPlayer] error code=${code} for: ${url}`);
            fireError(`Stream error (code ${code})`);
        });

        // ── Stall detection ───────────────────────────────
        stallTimerRef.current = setTimeout(() => {
            if (!playbackStarted && !cancelled) {
                console.warn('[AudioPlayer] Stall timeout:', url);
                fireError('Stream timed out');
                stopInternal();
            }
        }, 10_000);

        // ── Start playback ────────────────────────────────
        audio.play().catch((err) => {
            console.warn('[AudioPlayer] play() rejected:', err.message);
            fireError('Play blocked: ' + err.message);
        });

        // ── Return cancel fn ──────────────────────────────
        return () => {
            cancelled = true;
            stopInternal();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { play, stop };
}
