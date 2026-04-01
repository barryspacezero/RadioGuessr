import { useCallback, useEffect, useRef } from 'react';
import Globe from 'globe.gl';

const EARTH_DAY  = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_BUMP = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const NIGHT_SKY  = 'https://unpkg.com/three-globe/example/img/night-sky.png';

/**
 * React hook that wraps the globe.gl imperative library.
 *
 * Returns:
 *   containerRef       — attach to the globe container <div ref={containerRef} />
 *   setGuessingMode(bool) — enable/disable click-to-guess + autoRotate
 *   revealAnswer(...)  — draw pins and arc between guess and actual
 *   resetGlobe()       — clear all overlays, resume rotation
 *
 * The globe is initialised once in a useEffect after the container div mounts.
 * All state is stored in refs — no React state, no re-renders.
 *
 * @param {(lat: number, lng: number) => void} onGuessPlaced
 *   Callback invoked by the click handler when the user places a pin.
 */
export function useGlobe(onGuessPlaced) {
    const containerRef    = useRef(null);
    const globeRef        = useRef(null);
    const isGuessingRef   = useRef(false);
    const onGuessRef      = useRef(onGuessPlaced);

    // Keep the callback ref fresh without re-running the init effect
    useEffect(() => { onGuessRef.current = onGuessPlaced; });

    // ── Globe initialisation (runs once after the div mounts) ────────────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container || globeRef.current) return; // already initialised

        const globe = Globe()
            .globeImageUrl(EARTH_DAY)
            .bumpImageUrl(EARTH_BUMP)
            .backgroundImageUrl(NIGHT_SKY)
            .showAtmosphere(true)
            .atmosphereColor('#4fc3f7')
            .atmosphereAltitude(0.18)
            .width(window.innerWidth)
            .height(window.innerHeight)(container);

        globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

        const controls = globe.controls();
        controls.autoRotate     = true;
        controls.autoRotateSpeed = 0.4;
        controls.enableDamping  = true;
        controls.dampingFactor  = 0.08;
        controls.minDistance    = 140;
        controls.maxDistance    = 600;

        // Click-to-guess handler
        globe.onGlobeClick(({ lat, lng }) => {
            if (!isGuessingRef.current) return;
            // Draw the guess pin
            globe
                .pointsData([{ lat, lng }])
                .pointColor(() => '#ff5252')
                .pointRadius(() => 0.6)
                .pointAltitude(() => 0.01)
                .pointLabel(() => '📍 Your Guess');
            // Notify the game hook
            onGuessRef.current?.(lat, lng);
        });

        // Responsive resize
        const handleResize = () =>
            globe.width(window.innerWidth).height(window.innerHeight);
        window.addEventListener('resize', handleResize);

        globeRef.current = globe;

        return () => {
            window.removeEventListener('resize', handleResize);
            // globe.gl doesn't have a public destroy — just clear the ref
            globeRef.current = null;
        };
    }, []); // intentionally empty — run once on mount

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Enable or disable click-to-guess mode.
     * When enabled: autoRotation stops, cursor becomes crosshair.
     * When disabled: autoRotation resumes, cursor returns to grab.
     */
    const setGuessingMode = useCallback((enabled) => {
        isGuessingRef.current = enabled;
        const globe = globeRef.current;
        if (!globe) return;
        globe.controls().autoRotate = !enabled;
        if (containerRef.current)
            containerRef.current.style.cursor = enabled ? 'crosshair' : 'grab';
    }, []);

    /**
     * Reveal the actual station location: draw both pins and an animated arc.
     * Then smoothly pan the camera to the actual location.
     */
    const revealAnswer = useCallback((actualLat, actualLng, guessLat, guessLng) => {
        const globe = globeRef.current;
        if (!globe) return;

        globe
            .pointsData([
                { lat: guessLat,  lng: guessLng,  type: 'guess',  color: '#ff5252' },
                { lat: actualLat, lng: actualLng, type: 'actual', color: '#69f0ae' },
            ])
            .pointColor(d => d.color)
            .pointRadius(d => d.type === 'actual' ? 0.8 : 0.5)
            .pointAltitude(d => d.type === 'actual' ? 0.015 : 0.01)
            .pointLabel(d => d.type === 'actual' ? '📡 Station Location' : '📍 Your Guess');

        globe
            .arcsData([{ startLat: guessLat, startLng: guessLng, endLat: actualLat, endLng: actualLng }])
            .arcColor(() => ['#ff5252', '#69f0ae'])
            .arcDashLength(0.4)
            .arcDashGap(0.15)
            .arcDashAnimateTime(2000)
            .arcStroke(0.5)
            .arcAltitudeAutoScale(0.4);

        setTimeout(() => {
            globe.pointOfView({ lat: actualLat, lng: actualLng, altitude: 1.8 }, 2000);
        }, 400);
    }, []);

    /**
     * Reset all globe overlays for a new round and resume gentle auto-rotation.
     */
    const resetGlobe = useCallback(() => {
        isGuessingRef.current = false;
        const globe = globeRef.current;
        if (!globe) return;
        globe.pointsData([]).arcsData([]);
        globe.controls().autoRotate = true;
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
    }, []);

    return { containerRef, setGuessingMode, revealAnswer, resetGlobe };
}
