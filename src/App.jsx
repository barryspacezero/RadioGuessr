import { useRef, useState } from 'react'
import Globe from './Globe.jsx'
import { fetchStation } from './api.js'
import { playAudio, stopAudio } from './audio.js'
import { calcScore } from './score.js'

export default function App() {
  const clickSound = new Audio('/click.mp3')
  const globe = useRef(null);
  const [phase, setPhase] = useState('start');
  const [station, setStation] = useState(null);
  const [totalScore, setTotalScore] = useState(0)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [guess, setGuess] = useState(null);
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [hint, setHint] = useState(false);

  async function startRound() {
    if (round >= 5) {
      setPhase('final')
      return
    }

    setRound(prev => prev + 1)

    stopAudio()
    setGuess(null)
    setResult(null)
    setError('')
    setPhase('loading')
    setHint(false)
    globe.current.reset()

    let s
    try {
      s = await fetchStation()
    } catch {
      setError('Could not find a station. Try again.')
      setPhase('start')
      return
    }

    setStation(s)
    setPhase('playing')
    globe.current.setGuessing(true)

    setIsAudioLoading(true)

    playAudio(s.url, {
      onLoading: () => setIsAudioLoading(true),
      onPlaying: () => setIsAudioLoading(false),
      onError: () => {
        setIsAudioLoading(false)
        setError('Stream failed. Try again.')
        setPhase('start')
      },
    })

    setTimeout(() => {
      setIsAudioLoading(false)
    }, 5000)
  }

  function resetGame() {
    setPhase('start')
    setTotalScore(0)
    setRound(0)
    setStation(null)
    setGuess(null)
    setResult(null)
    setError('')
    setHint(false)
    setIsAudioLoading(false)
  }

  function submitGuess() {
    stopAudio();
    globe.current.setGuessing(false);
    const { km, score } = calcScore(guess.lat, guess.lng, station.lat, station.lng);
    globe.current.reveal(station.lat, station.lng, guess.lat, guess.lng);
    setResult({ km, score });
    setTotalScore(prev => prev + score)
    setPhase('result');
  }

  const location = station
    ? [station.state, station.country].filter(Boolean).join(', ')
    : '';

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Globe ref={globe} onGuess={setGuess} />

      {phase === 'start' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#f0ede6]">
          <h1 className="text-4xl font-bold tracking-tight">RadioGuessr</h1>
          <p className="text-sm text-[#555] text-center max-w-[260px] leading-relaxed">
            Listen to a Live radio stream. Place your guess on the globe. Score points.
          </p>
          {error && <span className="text-[13px] font-semibold text-red-700">{error}</span>}
          <button className="btn btn-primary" onClick={() => { clickSound.currentTime = 0; clickSound.play(); startRound(); }}>Play</button>
          <span className="text-[13px] font-medium text-[#444]">Game Version: 1.0</span>
        </div>
      )}

      {phase === 'playing' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2.5">
          <button className="btn btn-primary" disabled={!guess} onClick={() => { submitGuess(); }}>
            Submit Guess
          </button>
          {!guess && (
            <span className="text-xs font-medium text-[#f0ede6] bg-black px-3 py-1">
              Click the globe to place your pin
            </span>
          )}
        </div>
      )}

      {phase === 'loading' && (
        <div className="absolute top-8 left-8 z-10 flex flex-col items-center gap-2.5 bg-[#f0ede6] border-2 border-black shadow-[6px_6px_0_#000] p-10 min-w-[300px]">
          <span className="text-xl font-bold uppercase tracking-[1.2px]">Loading...</span>
        </div>
      )}

      {phase === 'playing' && isAudioLoading && (
        <div className="absolute top-8 left-8 z-20 flex flex-col items-center gap-2.5 bg-[#f0ede6] border-2 border-black shadow-[6px_6px_0_#000] p-10 min-w-[300px]">
          <span className="text-xl font-bold uppercase tracking-[1.2px]">Loading...</span>
        </div>
      )}

      {phase === 'playing' && isAudioLoading === false && (
        <div className="absolute top-8 left-8 z-10 flex flex-col items-center gap-2.5 bg-[#f0ede6] border-2 border-black shadow-[6px_6px_0_#000] p-10">
          <span className="text-xl font-bold uppercase tracking-[1.2px]">Now Playing</span>
          <span className="text-[13px] font-medium text-[#444]">{station.name}</span>
          <span className="text-[13px] font-medium text-[#444]">Round {round}/5</span>
          <button className="btn btn-primary" onClick={() => setHint(true)}>
            {hint ? 'Language: ' + (station.language || 'Unknown Language, you\'re on your own :P') : 'Reveal Hint?'}
          </button>
          {/* {hint && (
            <span className="text-[13px] font-medium text-[#444]">
              {"Language: " + (station.language || 'Unknown Language, you\'re on your own :P')}
            </span>
          )} */}
        </div>
      )}

      {phase === 'final' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#f0ede6]">
          <h1 className="text-4xl font-bold tracking-tight">Game Over</h1>
          <p className="text-sm text-[#555] text-center max-w-[260px] leading-relaxed">
            Total Score: {totalScore}
          </p>
          <button className="btn btn-primary" onClick={() => { clickSound.currentTime = 0; clickSound.play(); resetGame(); }}>Play Again</button>
        </div>
      )}

      {phase === 'result' && result && station && (
        <div className="absolute top-8 left-8 z-20 bg-[#f0ede6] border-2 border-black shadow-[6px_6px_0_#000] p-10 min-w-[300px] flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#777]">Station</span>
          <span className="text-[13px] font-medium text-[#444]">{station.name}</span>
          <span className="text-[22px] font-bold tracking-tight">{location}</span>
          <span className="text-[13px] text-[#555]">
            {result.km < 1 ? 'Less than 1 km away' : `${result.km.toLocaleString()} km away`}
          </span>
          <div className="my-3 border-t-2 border-black" />
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#777]">Score</span>
          <span className="text-[60px] font-bold leading-none tracking-[-2px]">
            {result.score.toLocaleString()}
          </span>
          <button className="btn btn-primary mt-4" onClick={() => {
            if (round >= 5) {
              setPhase('final')
            } else {
              clickSound.currentTime = 0;
              clickSound.play();
              startRound()
            }
          }}>{round === 5 ? 'Final Score' : 'Next Round'}</button>
        </div>
      )}
    </div>
  );
}