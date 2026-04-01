import { useCallback, useRef, useState } from 'react';
import { useRadioBrowser } from './useRadioBrowser.js';
import { useAudioPlayer }  from './useAudioPlayer.js';
import { useGlobe }        from './useGlobe.js';
import { calculateScore }  from '../utils/score.js';
import { getFlagEmoji }    from '../utils/flagEmoji.js';

// ── Game state machine ────────────────────────────────────────────────────────
const S = {
    IDLE:      'IDLE',
    LOADING:   'LOADING',
    PLAYING:   'PLAYING',
    GUESSING:  'GUESSING',  // clip ended, pin may or may not be placed
    REVEALING: 'REVEALING',
    RESULT:    'RESULT',
};

const MAX_RETRIES = 5;
const CLIP_SECS   = 15;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Central game orchestration hook.
 *
 * Composes three specialised hooks:
 *   useRadioBrowser — API calls
 *   useAudioPlayer  — <audio> element lifecycle
 *   useGlobe        — globe.gl wrapper
 *
 * Exposes all state and callbacks that App.jsx distributes to components.
 */
export function useGame() {
    // ── Specialised hooks ─────────────────────────────────────────────────────
    const { fetchStation }                           = useRadioBrowser();
    const { play: playAudio, stop: stopAudio }       = useAudioPlayer();
    const { containerRef, setGuessingMode, revealAnswer, resetGlobe } =
        useGlobe(useCallback((lat, lng) => handleGuessPlaced(lat, lng), [])); // eslint-disable-line react-hooks/exhaustive-deps

    // ── React UI state ────────────────────────────────────────────────────────
    const [gameState,            setGameState]            = useState(S.IDLE);
    const [roundNumber,          setRoundNumber]          = useState(0);
    const [totalScore,           setTotalScore]           = useState(0);
    const [timer,                setTimer]                = useState(CLIP_SECS);
    const [timerLabel,           setTimerLabel]           = useState('seconds remaining');
    const [isWaveformActive,     setIsWaveformActive]     = useState(false);
    const [isLoading,            setIsLoading]            = useState(false);
    const [isStartScreenVisible, setIsStartScreenVisible] = useState(true);
    const [isStationPanelVisible,setIsStationPanelVisible]= useState(false);
    const [isResultVisible,      setIsResultVisible]      = useState(false);
    const [submitEnabled,        setSubmitEnabled]        = useState(false);
    const [hint,                 setHint]                 = useState('');
    const [activeButton,         setActiveButton]         = useState(null);
    const [toast,                setToast]                = useState({ message: '', visible: false });
    const [resultData,           setResultData]           = useState(null);

    // ── Internal refs (game data that must not cause re-renders) ──────────────
    const stateRef       = useRef(S.IDLE);
    const stationRef     = useRef(null);
    const guessRef       = useRef(null);   // { lat, lng } | null
    const retriesRef     = useRef(0);
    const toastTimerRef  = useRef(null);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const setState = useCallback((s) => {
        stateRef.current = s;
        setGameState(s);
    }, []);

    const showToast = useCallback((message, duration = 2800) => {
        setToast({ message, visible: true });
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(
            () => setToast(t => ({ ...t, visible: false })),
            duration
        );
    }, []);

    const showControls = useCallback((btnId, hintText = '') => {
        setActiveButton(btnId);
        setHint(hintText);
    }, []);

    // ── Globe guess callback ──────────────────────────────────────────────────
    // NOTE: this function is referenced in useGlobe's onGuessPlaced arg.
    // It must read stateRef (not gameState) to avoid stale closures.
    function handleGuessPlaced(lat, lng) {
        guessRef.current = { lat, lng };
        const s = stateRef.current;

        if (s === S.PLAYING) {
            showToast('📍 Guess placed! Reposition or wait — clip end will lock it in.');
            setSubmitEnabled(true);
            setHint('Reposition your pin, or wait for the clip to end.');
        } else if (s === S.GUESSING) {
            // Clip already ended but no guess had been placed — lock immediately
            showToast('📍 Guess placed! Hit Submit.');
            setGuessingMode(false);
            setSubmitEnabled(true);
            setHint('Pin locked! Hit Submit when ready.');
        }
    }

    // ── Clip-ended logic (shared between onEnd and safety timeout) ────────────
    function handleClipEnd() {
        setIsWaveformActive(false);
        setState(S.GUESSING);
        setTimer(0);
        setTimerLabel('clip ended');

        if (guessRef.current) {
            setGuessingMode(false); // lock the pin in place
            setSubmitEnabled(true);
            setHint('Pin locked! Hit Submit when ready.');
        } else {
            setHint('Clip ended! Click the globe to place your guess, then Submit.');
        }
    }

    // ── startRound ────────────────────────────────────────────────────────────
    const startRound = useCallback(async (isRetry = false) => {
        if (stateRef.current !== S.IDLE) return;
        setState(S.LOADING);

        if (!isRetry) {
            setRoundNumber(n => n + 1);
            retriesRef.current = 0;
        }
        guessRef.current = null;

        // Reset UI
        setIsStartScreenVisible(false);
        setIsResultVisible(false);
        resetGlobe();
        setIsStationPanelVisible(false);
        setSubmitEnabled(false);
        showControls(null);
        setIsLoading(true);

        // Fetch a station
        let station;
        try {
            station = await fetchStation();
        } catch {
            setIsLoading(false);
            showToast('⚠️ Could not find a station. Retrying…');
            setState(S.IDLE);
            setTimeout(startRound, 1500);
            return;
        }

        stationRef.current = station;
        setIsLoading(false);
        setIsStationPanelVisible(true);
        setState(S.PLAYING);
        setTimer(CLIP_SECS);
        setTimerLabel('seconds remaining');
        setIsWaveformActive(true);
        setGuessingMode(true);
        showControls('btn-submit', 'Click the globe to place your guess');
        setSubmitEnabled(false);

        // Start audio playback
        const cancelClip = playAudio(station.url, CLIP_SECS, {
            onPlay: () => showToast('🎵 Listen carefully and guess the location!'),
            onTick: (t) => setTimer(t),
            onEnd:  () => handleClipEnd(),
            onError: (msg) => {
                setIsWaveformActive(false);
                retriesRef.current++;

                if (retriesRef.current >= MAX_RETRIES) {
                    setIsStationPanelVisible(false);
                    setState(S.IDLE);
                    showControls('btn-play', '');
                    setHint('Could not find a working stream. Click Play Radio to try again.');
                    showToast(`⚠️ No working stream after ${MAX_RETRIES} tries.`);
                } else {
                    console.warn(`[Game] Stream error (${retriesRef.current}/${MAX_RETRIES}): ${msg}`);
                    showToast(`📻 Switching station… (${msg})`);
                    setState(S.IDLE);
                    setTimeout(() => startRound(true), 800);
                }
            },
        });

        // Safety net: if 18 s pass and we're still PLAYING (audio stalled silently)
        setTimeout(() => {
            if (stateRef.current === S.PLAYING) {
                cancelClip();
                handleClipEnd();
            }
        }, 18_000);
    }, [fetchStation, playAudio, resetGlobe, setGuessingMode, showControls, showToast, setState]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── submitGuess ───────────────────────────────────────────────────────────
    const submitGuess = useCallback(async () => {
        const s = stateRef.current;
        if (!guessRef.current || (s !== S.PLAYING && s !== S.GUESSING)) return;
        setState(S.REVEALING);

        stopAudio();
        setIsWaveformActive(false);
        setGuessingMode(false);
        showControls(null);
        setIsStationPanelVisible(false);

        const station = stationRef.current;
        const { score, distanceKm, tier } = calculateScore(
            guessRef.current.lat, guessRef.current.lng,
            station.lat,          station.lng
        );
        setTotalScore(n => n + score);

        revealAnswer(station.lat, station.lng, guessRef.current.lat, guessRef.current.lng);

        await sleep(600);
        setState(S.RESULT);

        const flag = getFlagEmoji(station.countrycode);
        const loc  = [station.state, station.country].filter(Boolean).join(', ');
        setResultData({ stationName: station.name, location: `${flag} ${loc}`, distanceKm, score, tier });
        setIsResultVisible(true);
        showControls('btn-next');
    }, [stopAudio, setGuessingMode, revealAnswer, showControls, setState]);

    // ── nextRound ─────────────────────────────────────────────────────────────
    const nextRound = useCallback(() => {
        if (stateRef.current !== S.RESULT) return;
        setState(S.IDLE);
        startRound();
    }, [setState, startRound]);

    // ── Public API ────────────────────────────────────────────────────────────
    return {
        // State
        gameState, roundNumber, totalScore,
        timer, timerLabel,
        isWaveformActive, isLoading,
        isStartScreenVisible, isStationPanelVisible, isResultVisible,
        submitEnabled, hint, activeButton,
        toast, resultData,
        // Globe
        globeContainerRef: containerRef,
        // Actions
        startRound, submitGuess, nextRound,
    };
}
