import { useGame }        from './hooks/useGame.js';
import Starfield          from './components/Starfield.jsx';
import Globe              from './components/Globe.jsx';
import HUD                from './components/HUD.jsx';
import StartScreen        from './components/StartScreen.jsx';
import StationPanel       from './components/StationPanel.jsx';
import Controls           from './components/Controls.jsx';
import ResultPanel        from './components/ResultPanel.jsx';
import LoadingOverlay     from './components/LoadingOverlay.jsx';
import Toast              from './components/Toast.jsx';

/**
 * Root component — composes useGame and distributes state to presentational
 * components. Contains no logic of its own.
 */
export default function App() {
    const {
        roundNumber,
        timer, timerLabel,
        isWaveformActive,
        isLoading,
        isStartScreenVisible,
        isStationPanelVisible,
        isResultVisible,
        submitEnabled,
        hint, activeButton,
        toast, resultData,
        globeContainerRef,
        startRound, submitGuess, nextRound,
    } = useGame();

    return (
        <div id="app">
            <Starfield />

            {/* Globe mounts into this div via useGlobe inside useGame */}
            <Globe containerRef={globeContainerRef} />

            <HUD roundNumber={roundNumber} />

            <StartScreen
                visible={isStartScreenVisible}
                onStart={startRound}
            />

            <StationPanel
                visible={isStationPanelVisible}
                timer={timer}
                timerLabel={timerLabel}
                isWaveformActive={isWaveformActive}
            />

            <Controls
                activeButton={activeButton}
                hint={hint}
                submitEnabled={submitEnabled}
                onPlay={startRound}
                onSubmit={submitGuess}
                onNext={nextRound}
            />

            <ResultPanel
                visible={isResultVisible}
                data={resultData}
            />

            <LoadingOverlay visible={isLoading} />

            <Toast message={toast.message} visible={toast.visible} />
        </div>
    );
}
