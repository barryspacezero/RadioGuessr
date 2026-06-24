import { useRef, useEffect, useState } from 'react';

function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}
import { useGameStore } from './store/useGameStore.js';
import { setAnalyticsContext } from './analytics.js';
import Globe from './Globe.jsx';
import MapLibreGlobe from './MapLibreGlobe.jsx';
import StartScreen from './components/phases/StartScreen.jsx';
import FinalScreen from './components/phases/FinalScreen.jsx';
import PlayingScreen from './components/phases/PlayingScreen.jsx';
import ResultScreen from './components/phases/ResultScreen.jsx';
import ScoreboardTooltip from './components/overlays/ScoreboardTooltip.jsx';
import VolumeControl from './components/overlays/VolumeControl.jsx';

export default function App() {
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    setWebGLSupported(checkWebGLSupport());
  }, []);

  const clickSound = new Audio('/click.mp3');
  const globe = useRef(null);

  useEffect(() => {
    // Sync critical game state with GA4 context
    const unsub = useGameStore.subscribe((state) => {
      setAnalyticsContext({
        phase: state.phase,
        theme: state.theme,
        talk_mode: state.talkMode,
        total_rounds: state.totalRounds,
        current_round: state.round,
        show_borders: state.showBorders,
        show_names: state.showNames
      });
    });
    // Initial sync
    setAnalyticsContext({
      phase: useGameStore.getState().phase,
      theme: useGameStore.getState().theme,
      talk_mode: useGameStore.getState().talkMode,
      total_rounds: useGameStore.getState().totalRounds,
      current_round: useGameStore.getState().round,
      show_borders: useGameStore.getState().showBorders,
      show_names: useGameStore.getState().showNames
    });
    
    // Kick off initial background preload
    useGameStore.getState().preloadNextStation();

    return unsub;
  }, []);

  const phase = useGameStore((state) => state.phase);
  const theme = useGameStore((state) => state.theme);
  const showBorders = useGameStore((state) => state.showBorders);
  const showNames = useGameStore((state) => state.showNames);
  const setGuess = useGameStore((state) => state.setGuess);

  if (!webGLSupported) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center font-sans">
        <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-8 border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-white tracking-tight">WebGL Required</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed text-lg">
            RadioGuessr uses a 3D globe which requires WebGL. It seems your browser doesn't support WebGL or it is disabled.
          </p>
          <div className="bg-zinc-800/50 rounded-xl p-5 text-sm text-zinc-300 border border-zinc-700/50 shadow-inner">
            Please enable WebGL in your browser settings, or try using a different modern browser like Chrome, Firefox, or Safari.
          </div>
        </div>
      </div>
    );
  }

  const useMapLibre = import.meta.env.VITE_USE_MAPLIBRE !== 'false' && !!import.meta.env.VITE_MAPTILER_TOKEN;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {useMapLibre ? (
        <MapLibreGlobe ref={globe} onGuess={setGuess} theme={theme} showBorders={showBorders} showNames={showNames} />
      ) : (
        <Globe ref={globe} onGuess={setGuess} theme={theme} showBorders={showBorders} showNames={showNames} />
      )}

      {phase !== 'start' && (
        <>
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-40 pointer-events-none">
            <h1 className="text-2xl md:text-3xl text-white font-bold tracking-tight" style={{ textShadow: '2px 2px 0px #000' }}>
              RadioGuessr
            </h1>
          </div>

          <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40 flex items-start gap-3 md:gap-4 pointer-events-none">
            <ScoreboardTooltip />
            <VolumeControl clickSound={clickSound} />
          </div>
        </>
      )}

      {phase === 'start' && <StartScreen clickSound={clickSound} globeRef={globe} />}
      {phase === 'final' && <FinalScreen clickSound={clickSound} />}
      {phase === 'playing' && <PlayingScreen clickSound={clickSound} globeRef={globe} />}
      {phase === 'result' && <ResultScreen clickSound={clickSound} globeRef={globe} />}
    </div>
  );
}