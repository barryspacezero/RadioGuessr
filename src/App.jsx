import { useRef } from 'react';
import { useGameStore } from './store/useGameStore.js';
import Globe from './Globe.jsx';

import StartScreen from './components/phases/StartScreen.jsx';
import LobbyScreen from './components/phases/LobbyScreen.jsx';
import WaitingScreen from './components/phases/WaitingScreen.jsx';
import FinalScreen from './components/phases/FinalScreen.jsx';
import PlayingScreen from './components/phases/PlayingScreen.jsx';
import ResultScreen from './components/phases/ResultScreen.jsx';
import ScoreboardTooltip from './components/overlays/ScoreboardTooltip.jsx';
import VolumeControl from './components/overlays/VolumeControl.jsx';

export default function App() {
  const clickSound = new Audio('/click.mp3');
  const globe = useRef(null);

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
      {phase === 'lobby' && <LobbyScreen globeRef={globe} />}
      {phase === 'waiting' && <WaitingScreen />}
      {phase === 'final' && <FinalScreen clickSound={clickSound} />}
      {phase === 'playing' && <PlayingScreen clickSound={clickSound} globeRef={globe} />}
      {phase === 'result' && <ResultScreen clickSound={clickSound} globeRef={globe} />}
    </div>
  );
}