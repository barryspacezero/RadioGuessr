import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
import Globe from './Globe.jsx'

function AnimatedCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20, transition: { delay: 0 } }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      className={`fixed bottom-0 left-0 w-full md:w-auto md:min-w-[300px] md:max-w-sm md:absolute md:bottom-auto md:top-8 md:left-8 z-20 flex flex-col items-center gap-2.5 bg-white border-t-2 md:border-2 border-black shadow-[0_-6px_0_#000000] md:shadow-[6px_6px_0_#000000] p-8 md:p-10 rounded-t-3xl md:rounded-bl-none md:rounded-t-none ${className}`}
    >
      {children}
    </motion.div>
  )
}
import { fetchStation } from './api.js'
import { playAudio, stopAudio } from './audio.js'
import { calcScore } from './score.js'

export default function App() {
  const clickSound = new Audio('/click.mp3')
  const globe = useRef(null);
  const [phase, setPhase] = useState('start'); // start, playing, loading, result, final, rerouting
  const [station, setStation] = useState(null);
  const [totalScore, setTotalScore] = useState(0)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [guess, setGuess] = useState(null);
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [hint, setHint] = useState(false);
  const [history, setHistory] = useState([])

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

    async function fetchAndPlay(retriesLeft = 3) {
      if (retriesLeft === 0) {
        setError('Could not find a working station. Please check your internet connection and try again.')
        setPhase('start')
        setRound(prev => prev - 1)
        return
      }
      try {
        const s = await fetchStation()
        setStation(s)
        setPhase('playing')
        globe.current.setGuessing(false) // Wait for audio to load before allowing guess
        setIsAudioLoading(true)
        playAudio(s.url, {
          onLoading: () => {
            // setIsAudioLoading(true)
            if (globe.current) globe.current.setGuessing(false)
          },
          onPlaying: () => {
            setIsAudioLoading(false)
            setError('')
            if (globe.current) globe.current.setGuessing(true)
          },
          onError: () => {
            setError('Stream failed. Trying again.')
            setPhase('loading')
            fetchAndPlay(retriesLeft - 1)
          }
        })
      } catch (err) {
        console.warn('Station fetch failed, retrying...', err)
        fetchAndPlay(retriesLeft - 1)
      }
    }

    fetchAndPlay(3)

    // Fallback: If after 6 seconds the stream still hasn't fired onPlaying, 
    // let them guess anyway so they aren't stuck.
    setTimeout(() => {
      setIsAudioLoading(false)
      if (globe.current) globe.current.setGuessing(true)
    }, 6000)
  }

  function resetGame() {
    setPhase('start')
    setHistory([])
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
    setHistory(prev => [...prev, {
      country: station.country,
      code: station.countrycode,
      score: score,
    }])
  }

  const location = station
    ? [station.state, station.country].filter(Boolean).join(', ')
    : '';

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Globe ref={globe} onGuess={setGuess} />

      <AnimatePresence mode="wait">
        {phase === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bg-black/60 backdrop-blur-md inset-0 z-50 flex flex-col items-center justify-center gap-5"
          >
            <h1 className="text-4xl text-white font-bold tracking-tight">RadioGuessr</h1>
            <p className="text-sm text-white text-center max-w-[260px] leading-relaxed">
              A GeoGuessr-style game where you listen to live radio streams from around the world and guess their location on a 3D globe.
            </p>
            {error && <span className="text-[13px] font-semibold text-red-700">{error}</span>}
            <button className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg hover:shadow-xl active:scale-95" onClick={() => { clickSound.currentTime = 0; clickSound.play(); startRound(); }}>
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
            <span className="text-[13px] font-medium text-white/70">Game Version: 1.2</span>
            {/* <span className="text-[13px] font-medium text-white/90">Created By : <a href="https://github.com/barryspacezero">barryspace</a></span> */}
          </motion.div>
        )}

        {phase === 'final' && (
          <motion.div
            key="final"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bg-black/60 backdrop-blur-md inset-0 z-50 flex flex-col items-center justify-center gap-5"
          >
            <span className="text-xl text-white font-bold text-center uppercase tracking-[1.2px]">Countries visited this session</span>
            <div className="flex flex-wrap justify-center items-center bg-white p-4 md:p-6 gap-5 md:gap-8 border-2 border-black shadow-[6px_6px_0_#000000]">
              {history.map((item, index) => (
                <div key={index} tabIndex="0" className="relative group flex flex-col items-center cursor-pointer focus:outline-none">
                  {item.code && (
                    <img
                      src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
                      alt={item.country}
                      className="h-10 md:h-14 w-auto border-2 border-black shadow-[2px_2px_0_#000000] group-hover:-translate-y-1 group-focus:-translate-y-1 group-hover:shadow-[4px_4px_0_#000000] group-focus:shadow-[4px_4px_0_#000000] transition-all object-cover"
                    />
                  )}
                  <span className="text-[14px] font-bold text-[#444] mt-2">{item.score}</span>

                  {/* Custom Tooltip */}
                  <div className="absolute -top-12 scale-0 group-hover:scale-100 group-focus:scale-100 transition-transform origin-bottom bg-black text-white text-xs font-bold px-3 py-1.5 border-2 border-white/20 whitespace-nowrap z-10 pointer-events-none rounded-sm">
                    {item.country}
                    <div className="absolute left-1/2 -bottom-[5px] w-2 h-2 bg-black border-r-2 border-b-2 border-white/20 rotate-45 -translate-x-1/2" />
                  </div>
                </div>
              ))}
            </div>
            {/* <h1 className="text-4xl text-white font-bold tracking-tight">Game Over</h1> */}
            <p className="text-sm text-white text-center max-w-[260px] leading-relaxed">
              Total Score: {totalScore}
            </p>
            <button className="btn " onClick={() => { clickSound.currentTime = 0; clickSound.play(); resetGame(); }}>Play Again</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* {phase === 'loading' && (
          <AnimatedCard key="loading">
            <span className="text-xl font-bold uppercase tracking-[1.2px]">Loading...</span>
          </AnimatedCard>
        )} */}

        {phase === 'playing' && isAudioLoading && (
          <AnimatedCard key="loading-audio">
            <span className="text-xl font-bold uppercase tracking-[1.2px]">Loading...</span>
          </AnimatedCard>
        )}

        {phase === 'playing' && isAudioLoading === false && (
          <AnimatedCard key="playing">
            <span className="text-xl font-bold uppercase tracking-[1.2px]">Now Playing</span>
            <span className="text-[13px] font-medium text-[#444] text-center">{station.name}</span>
            <span className="text-[13px] font-medium text-[#444]">Round {round}/5</span>
            <button className="btn btn-primary mt-2" onClick={() => setHint(true)}>
              {hint ? `Language: ${station.language || 'Unknown'}` : 'Reveal Hint?'}
            </button>

            <div className="flex md:hidden flex-col items-center gap-2 w-full mt-1 border-t-2 border-black/10 pt-4">
              <button className="btn btn-primary w-full" disabled={!guess} onClick={submitGuess}>
                Submit Guess
              </button>
              {!guess && (
                <span className="text-[11px] font-medium text-[#555] text-center">
                  Click the globe to place your pin
                </span>
              )}
            </div>
          </AnimatedCard>
        )}

        {phase === 'result' && result && station && (
          <AnimatedCard key="result" delay={2.2} className="!items-start gap-1.5 md:!min-w-[340px]">
            <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#777]">Station</span>
            <span className="text-[13px] font-medium text-[#444] line-clamp-2 ">{station.name}</span>
            <div className="flex items-center gap-2.5 mt-0.5">
              {station.countrycode && (
                <img
                  src={`https://flagcdn.com/${station.countrycode.toLowerCase()}.svg`}
                  // alt={station.country}
                  className="w-16 border-2 border-black shadow-[2px_2px_0_#000000] object-cover"
                />
              )}
              <span className="text-xl md:text-[22px] font-bold tracking-tight leading-tight">{location}</span>
            </div>
            <span className="text-[13px] text-[#555]">
              {result.km < 1 ? 'Less than 1 km away' : `${result.km.toLocaleString()} km away`}
            </span>
            <div className="my-3 border-t-2 border-black w-full" />
            <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#777]">Score</span>
            <span className="text-5xl md:text-[60px] font-bold leading-none tracking-[-2px]">
              {result.score.toLocaleString()}
            </span>
            <button disabled={phase !== 'result'} className="btn btn-primary mt-4 w-full" onClick={() => {
              if (round >= 5) setPhase('final')
              else { clickSound.currentTime = 0; clickSound.play(); startRound() }
            }}>{round === 5 ? 'Final Score' : 'Next Round'}</button>
          </AnimatedCard>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="hidden md:flex absolute bottom-16 left-1/2 -translate-x-1/2 w-auto z-10 flex-col items-center gap-2.5 pointer-events-none"
          >
            <div className="pointer-events-auto flex flex-col items-center gap-2.5">
              <button className="btn btn-primary shadow-xl" disabled={!guess} onClick={submitGuess}>
                Submit Guess
              </button>
              {!guess && (
                <span className="text-xs font-medium text-white bg-black px-3 py-1 rounded-sm shadow-md">
                  Click the globe to place your pin
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}