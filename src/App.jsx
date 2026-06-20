import { useRef, useEffect } from 'react';
import { useGameStore } from './store/useGameStore.js';
import { setAnalyticsContext } from './analytics.js';
import Globe from './Globe.jsx';

import StartScreen from './components/phases/StartScreen.jsx';
import FinalScreen from './components/phases/FinalScreen.jsx';
import PlayingScreen from './components/phases/PlayingScreen.jsx';
import ResultScreen from './components/phases/ResultScreen.jsx';
import ScoreboardTooltip from './components/overlays/ScoreboardTooltip.jsx';
import VolumeControl from './components/overlays/VolumeControl.jsx';

export default function App() {
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

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Globe ref={globe} onGuess={setGuess} theme={theme} showBorders={showBorders} showNames={showNames} />

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