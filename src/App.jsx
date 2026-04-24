import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Volume2, VolumeX, Trophy, ChevronUp, ChevronDown } from 'lucide-react'
import Globe from './Globe.jsx'

const CloudSvg = ({ className, style }) => (
  <svg
    viewBox="0 0 100 50"
    className={`fill-white/90 blur-[3px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] ${className}`}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M75.3 19.5a18.3 18.3 0 0 0-35-5.5 13.8 13.8 0 0 0-21.7 8.3 11 11 0 0 0 2.2 21.7h59.6a16.5 16.5 0 0 0-5.1-24.5z" />
  </svg>
);

function AnimatedCard({ children, className = "", delay = 0, persistentMobileContent }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isItemsStart = className.includes('!items-start') || className.includes('items-start');
  const gapClass = className.includes('gap-1.5') ? 'gap-1.5' : 'gap-2.5';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20, transition: { delay: 0 } }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      className={`fixed bottom-0 left-0 w-full md:w-auto md:min-w-[300px] md:max-w-sm md:absolute md:bottom-auto md:top-24 md:left-8 z-20 flex flex-col bg-gradient-to-b from-[#7dd3fc] to-[#e0f2fe] border-t-2 md:border-2 border-black shadow-[0_-6px_0_#000000] md:shadow-[6px_6px_0_#000000] rounded-t-3xl md:rounded-none ${className.replace('!items-start', '').replace('gap-1.5', '')}`}
    >
      {/* Animated Sky Background */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-t-3xl md:rounded-none pointer-events-none">
        <CloudSvg className="absolute top-4 -left-16 w-16" style={{ animation: 'float-cloud 30s linear infinite 0s' }} />
        <CloudSvg className="absolute top-14 -left-20 w-24" style={{ animation: 'float-cloud 45s linear infinite 15s' }} />
        <CloudSvg className="absolute -bottom-2 -left-32 w-32" style={{ animation: 'float-cloud 60s linear infinite 5s' }} />
        <CloudSvg className="absolute top-28 -left-12 w-12" style={{ animation: 'float-cloud 25s linear infinite 20s' }} />
      </div>

      <div
        className="w-full flex justify-center items-center h-[36px] md:hidden cursor-pointer relative z-10 shrink-0 border-b-2 border-black/10 bg-white/20 backdrop-blur-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-6 h-6 text-black pointer-events-none" />
        ) : (
          <ChevronUp className="w-6 h-6 text-black pointer-events-none" />
        )}
      </div>

      {/* Expandable Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`w-full relative z-10 ${isExpanded ? 'pointer-events-auto' : 'pointer-events-none md:pointer-events-auto'}`}
      >
        <div className={`w-full flex flex-col ${isItemsStart ? 'items-start' : 'items-center'} ${gapClass} px-5 pb-5 pt-1 md:p-10 md:pt-10`}>
          {children}
        </div>
      </motion.div>

      {persistentMobileContent && (
        <div className="w-full md:hidden px-5 pt-1 pb-3 shrink-0 relative z-10 bg-white/40 backdrop-blur-sm">
          {persistentMobileContent}
        </div>
      )}
    </motion.div>
  )
}
import { fetchStation, COUNTRY_TO_REGION } from './api.js'
import { playAudio, stopAudio, setVolume } from './audio.js'
import { calcScore } from './score.js'

export default function App() {
  const clickSound = new Audio('/click.mp3')
  const globe = useRef(null);
  const [phase, setPhase] = useState('start'); // start, playing, loading, result, final, rerouting
  const [volume, setVolumeState] = useState(0.85);
  const [theme, setTheme] = useState('default');
  const [showBorders, setShowBorders] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [station, setStation] = useState(null);
  const [totalScore, setTotalScore] = useState(0)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [guess, setGuess] = useState(null);
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [hintCredits, setHintCredits] = useState(3);
  const [roundHints, setRoundHints] = useState({ language: false, city: false, region: false });
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
    setRoundHints({ language: false, city: false, region: false })
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
    setHintCredits(3)
    setRoundHints({ language: false, city: false, region: false })
    setIsAudioLoading(false)
  }

  function useHint(type) {
    if (hintCredits > 0 && !roundHints[type]) {
      setHintCredits(prev => prev - 1);
      setRoundHints(prev => ({ ...prev, [type]: true }));
    }
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
      <Globe ref={globe} onGuess={setGuess} theme={theme} showBorders={showBorders} showNames={showNames} />

      {phase !== 'start' && (
        <>
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-40 pointer-events-none">
            <h1 className="text-2xl md:text-3xl text-white font-bold tracking-tight" style={{ textShadow: '2px 2px 0px #000' }}>
              RadioGuessr
            </h1>
          </div>

          <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40 flex items-start gap-3 md:gap-4 pointer-events-none">
            {/* Scoreboard Tooltip */}
            <div className="relative group pointer-events-auto" tabIndex="0">
              <div className="bg-gradient-to-b from-[#7dd3fc] to-[#e0f2fe] border-2 border-black p-3 shadow-[4px_4px_0_#000000] items-center cursor-pointer transition-transform group-hover:-translate-y-0.5 group-focus:-translate-y-0.5">
                <Trophy className="w-5 h-5 md:w-7 md:h-7 shrink-0" />
              </div>

              <div className="absolute top-full right-0 mt-3 md:mt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200 origin-top-right z-50">
                <div className="bg-gradient-to-b from-[#7dd3fc] to-[#e0f2fe] border-2 border-black p-3 md:p-4 shadow-[4px_4px_0_#000000] w-48 flex flex-col pointer-events-auto">
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3, 4, 5].map(r => {
                      const pastRound = history[r - 1];
                      const isCurrent = !pastRound && r === round;

                      return (
                        <div key={r} className="flex justify-between items-center text-sm font-medium">
                          <span className={`${isCurrent ? 'text-black font-bold' : 'text-black font-medium'}`}>R{r}</span>
                          {pastRound ? (
                            <span className="font-bold flex items-center gap-2">
                              {pastRound.code && (
                                <img
                                  src={`https://flagcdn.com/${pastRound.code.toLowerCase()}.svg`}
                                  className="h-3 w-4 border border-black object-cover"
                                  alt=""
                                />
                              )}
                              {pastRound.score}
                            </span>
                          ) : (isCurrent ? (
                            <span className="animate-pulse text-black font-bold">...</span>
                          ) : (
                            <span className="text-black">-</span>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t-2 border-black mt-3 pt-2 flex justify-between items-center font-bold text-base md:text-lg">
                    <span className="uppercase tracking-wide text-[12px] mt-0.5">Total</span>
                    <span>{totalScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Control */}
            <div className="hidden md:flex group bg-gradient-to-b from-[#7dd3fc] to-[#e0f2fe] border-2 border-black p-3 shadow-[4px_4px_0_#000000] items-center gap-0 hover:gap-3 transition-all cursor-pointer pointer-events-auto">
              {volume === 0 ? <VolumeX className="w-7 h-7 shrink-0" /> : <Volume2 className="w-7 h-7 shrink-0" />}
              <div className="w-0 overflow-hidden group-hover:w-32 py-2 transition-all duration-300 ease-in-out flex items-center shrink-0">
                <input
                  type="range"
                  id="volume"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolumeState(v);
                    setVolume(v);
                    clickSound.volume = v;
                  }}
                  className="w-32 h-3 bg-gray-200 appearance-none cursor-pointer accent-black"
                  title="Volume"
                />
              </div>
            </div>
          </div>
        </>
      )}

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

            <div className="flex flex-col items-center gap-1 mt-2">
              <label htmlFor="theme" className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
                Globe Style
              </label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-transparent border-2 border-white/30 text-white text-sm font-medium px-3 py-1.5 outline-none cursor-pointer hover:border-white/60 transition-colors [&>option]:bg-black"
              >
                <option value="default">Blue Marble</option>
                {/* <option value="dark">Dark Map</option> */}
                <option value="day">Day Map</option>
                <option value="water">Water Map</option>
                <option value="night">Night Map</option>
              </select>
            </div>

            <div className="flex items-center gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-white/50 group-hover:border-white/80 transition-colors">
                  <input
                    type="checkbox"
                    className="opacity-0 absolute w-full h-full cursor-pointer"
                    checked={showBorders}
                    onChange={(e) => setShowBorders(e.target.checked)}
                  />
                  {showBorders && <div className="w-2.5 h-2.5 bg-white pointer-events-none" />}
                </div>
                <span className="text-[11px] text-white/80 uppercase tracking-widest font-bold select-none group-hover:text-white transition-colors">Borders</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-white/50 group-hover:border-white/80 transition-colors">
                  <input
                    type="checkbox"
                    className="opacity-0 absolute w-full h-full cursor-pointer"
                    checked={showNames}
                    onChange={(e) => setShowNames(e.target.checked)}
                  />
                  {showNames && <div className="w-2.5 h-2.5 bg-white pointer-events-none" />}
                </div>
                <span className="text-[11px] text-white/80 uppercase tracking-widest font-bold select-none group-hover:text-white transition-colors">Country Labels</span>
              </label>
            </div>

            {error && <span className="text-[13px] font-semibold text-red-700">{error}</span>}
            <button className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg hover:shadow-xl active:scale-95" onClick={() => { clickSound.currentTime = 0; clickSound.play(); startRound(); }}>
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
            <span className="text-[13px] font-medium text-white/70">Game Version: 1.4</span>
            <span className="text-[14px] font-medium text-white/90">Created By : <a href="https://github.com/barryspacezero">Sparsh</a></span>
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
            <h1 className="text-4xl text-white font-bold tracking-tight">RadioGuessr</h1>
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
                  <div className="absolute -top-12 scale-0 group-hover:scale-100 group-focus:scale-100 transition-transform origin-bottom bg-black text-white text-xs font-bold px-3 py-1.5 border-2 border-white/20 whitespace-nowrap z-10 pointer-events-none">
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
            <div className="flex flex-col items-center gap-2.5 w-full animate-pulse min-w-[240px]">
              <div className="h-6 bg-gray-200 w-32 rounded-sm mb-1" />
              <div className="h-4 bg-gray-200 w-3/4 rounded-sm" />
              <div className="h-3 bg-gray-200 w-20 rounded-sm" />
              <div className="flex flex-col gap-2 w-full mt-2">
                <div className="h-3 bg-gray-200 w-24 rounded-sm" />
                <div className="flex gap-2 w-full h-[32px] mt-0.5">
                  <div className="flex-1 bg-gray-200 rounded-sm" />
                  <div className="flex-1 bg-gray-200 rounded-sm" />
                  <div className="flex-1 bg-gray-200 rounded-sm" />
                </div>
              </div>
              <div className="flex md:hidden w-full h-10 bg-gray-200 rounded-sm mt-4" />
            </div>
          </AnimatedCard>
        )}

        {phase === 'playing' && isAudioLoading === false && (
          <AnimatedCard
            key="playing"
            persistentMobileContent={
              <div className="flex flex-col items-center gap-2 w-full">
                <button className="btn btn-primary w-full shadow-lg" disabled={!guess} onClick={submitGuess}>
                  Submit Guess
                </button>
                {!guess && (
                  <span className="text-[11px] font-medium text-black text-center">
                    Click the globe to place your pin
                  </span>
                )}
              </div>
            }
          >
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-end gap-[3px] h-[14px]">
                <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="w-[3px] bg-black" />
                <motion.div animate={{ height: ['100%', '40%', '100%'] }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }} className="w-[3px] bg-black" />
                <motion.div animate={{ height: ['50%', '100%', '50%'] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }} className="w-[3px] bg-black" />
                <motion.div animate={{ height: ['80%', '30%', '80%'] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }} className="w-[3px] bg-black" />
              </div>
              <span className="text-[16px] font-bold uppercase tracking-[1.2px] leading-none mt-0.5">Now Playing</span>
            </div>
            <span className="text-[13px] font-medium text-black">Round {round}/5</span>
            <div className="flex flex-col gap-2 w-full mt-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-black">
                <span>Hints ({hintCredits} left)</span>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  className={`flex-1 text-[11px] py-1.5 font-bold uppercase border-2 ${(hintCredits > 0 || roundHints.language) ? 'border-black hover:bg-black hover:text-white cursor-pointer' : 'border-[#ccc] text-[#ccc] cursor-not-allowed'} ${roundHints.language ? 'bg-black text-white' : 'bg-white text-black'} transition-colors shadow-[2px_2px_0_#000000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000000] disabled:shadow-[2px_2px_0_#cccccc]`}
                  disabled={roundHints.language || hintCredits === 0}
                  onClick={() => useHint('language')}
                  title={roundHints.language ? (station.language || 'Unknown') : 'Use Hint: Language'}
                >
                  Lang
                </button>
                <button
                  className={`flex-1 text-[11px] py-1.5 font-bold uppercase border-2 ${(hintCredits > 0 || roundHints.city) ? 'border-black hover:bg-black hover:text-white cursor-pointer' : 'border-[#ccc] text-[#ccc] cursor-not-allowed'} ${roundHints.city ? 'bg-black text-white' : 'bg-white text-black'} transition-colors shadow-[2px_2px_0_#000000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000000] disabled:shadow-[2px_2px_0_#cccccc]`}
                  disabled={roundHints.city || hintCredits === 0}
                  onClick={() => useHint('city')}
                  title={roundHints.city ? (station.state || 'Unknown') : 'Use Hint: City'}
                >
                  City
                </button>
                <button
                  className={`flex-1 text-[11px] py-1.5 font-bold uppercase border-2 ${(hintCredits > 0 || roundHints.region) ? 'border-black hover:bg-black hover:text-white cursor-pointer' : 'border-[#ccc] text-[#ccc] cursor-not-allowed'} ${roundHints.region ? 'bg-black text-white' : 'bg-white text-black'} transition-colors shadow-[2px_2px_0_#000000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000000] disabled:shadow-[2px_2px_0_#cccccc]`}
                  disabled={roundHints.region || hintCredits === 0}
                  onClick={() => useHint('region')}
                  title={roundHints.region ? (COUNTRY_TO_REGION[station.countrycode] || 'Unknown') : 'Use Hint: Region'}
                >
                  Region
                </button>
              </div>
              {(roundHints.language || roundHints.city || roundHints.region) && (
                <div className="flex flex-col gap-1 mt-1 p-2 bg-[#f4f4f4] border-2 border-black max-h-[100px] overflow-y-auto shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] text-black">
                  {roundHints.language && <div className="text-[12px] font-bold"><span className="text-black/60">Language:</span> {station.language || 'Unknown'}</div>}
                  {roundHints.city && <div className="text-[12px] font-bold"><span className="text-black/60">City/State:</span> {station.state || 'Unknown'}</div>}
                  {roundHints.region && <div className="text-[12px] font-bold"><span className="text-black/60">Region:</span> {COUNTRY_TO_REGION[station.countrycode] || 'Unknown'}</div>}
                </div>
              )}
            </div>

          </AnimatedCard>
        )}

        {phase === 'result' && result && station && (
          <AnimatedCard 
            key="result" 
            delay={2.2} 
            className="!items-start gap-1.5 md:!min-w-[340px]"
            persistentMobileContent={
              <button disabled={phase !== 'result'} className="btn btn-primary w-full shadow-lg" onClick={() => {
                if (round >= 5) setPhase('final')
                else { clickSound.currentTime = 0; clickSound.play(); startRound() }
              }}>{round === 5 ? 'Final Score' : 'Next Round'}</button>
            }
          >
            <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-black">Station</span>
            <span className="text-[13px] font-medium text-black line-clamp-2 ">{station.name}</span>
            <div className="flex items-center gap-2.5 mt-0.5">
              {station.countrycode && (
                <img
                  src={`https://flagcdn.com/${station.countrycode.toLowerCase()}.svg`}
                  className="w-16 border-2 border-black shadow-[2px_2px_0_#000000] object-cover"
                />
              )}
              <span className="text-xl md:text-[22px] font-bold tracking-tight leading-tight text-black">{location}</span>
            </div>
            <span className="text-[13px] text-black">
              {result.km < 1 ? 'Less than 1 km away' : `${result.km.toLocaleString()} km away`}
            </span>
            <div className="my-3 border-t-2 border-black w-full" />
            <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-black">Score</span>
            <span className="text-5xl md:text-[60px] font-bold leading-none tracking-[-2px] text-black">
              {result.score.toLocaleString()}
            </span>
            <button disabled={phase !== 'result'} className="hidden md:block btn btn-primary mt-4 w-full" onClick={() => {
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
                <span className="text-sm font-medium text-white bg-black px-3 py-1 rounded-sm shadow-md">
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