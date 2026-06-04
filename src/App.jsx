import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Volume2, VolumeX, Trophy, ChevronUp, ChevronDown, RefreshCw, Pause } from 'lucide-react'
import Globe from './Globe.jsx'

import StartScreen from './components/phases/StartScreen.jsx';
import FinalScreen from './components/phases/FinalScreen.jsx';
import PlayingScreen from './components/phases/PlayingScreen.jsx';
import ResultScreen from './components/phases/ResultScreen.jsx';
import DiscordIcon from './components/ui/DiscordIcon.jsx';
import AnimatedCard from './components/ui/AnimatedCard.jsx';
import ScoreboardTooltip from './components/overlays/ScoreboardTooltip.jsx';
import VolumeControl from './components/overlays/VolumeControl.jsx';
import { fetchStation, resetSessionSeen } from './api.js'
import { COUNTRY_TO_REGION } from './data/constants.js'
import { playAudio, stopAudio, setVolume, pauseAudio, resumeAudio, getAudioState } from './audio.js'
import { calcScore } from './score.js'
import { logEvent } from './analytics.js'

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
  const [hintCredits, setHintCredits] = useState(5);
  const [roundHints, setRoundHints] = useState({ language: false, city: false, region: false });
  const [history, setHistory] = useState([])
  const [isAudioPlaying, setIsAudioPlaying] = useState(true)

  async function startRound() {
    if (round >= 5) {
      setPhase('final')
      logEvent('game_complete', {
        total_score: totalScore,
        countries_visited: history.map(h => h.country).join(', ')
      })
      return
    }

    if (round === 0) {
      logEvent('game_start', {
        theme,
        show_borders: showBorders,
        show_names: showNames
      })
    }

    setRound(prev => {
      const nextRound = prev + 1;
      logEvent('round_start', { round_number: nextRound });
      return nextRound;
    })

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
            setIsAudioPlaying(true)
            if (globe.current) globe.current.setGuessing(true)
            logEvent('station_load_success', {
              round_number: round + 1,
              countrycode: s.countrycode,
              region: COUNTRY_TO_REGION[s.countrycode] || 'Unknown',
              language: s.language || 'Unknown'
            })
          },
          onError: () => {
            setError('Stream failed. Trying again.')
            setPhase('loading')
            logEvent('station_load_fail', {
              round_number: round + 1,
              error_type: 'playback_error',
              retries_left: retriesLeft - 1
            })
            fetchAndPlay(retriesLeft - 1)
          }
        })
      } catch (err) {
        console.warn('Station fetch failed, retrying...', err)
        logEvent('station_load_fail', {
          round_number: round + 1,
          error_type: 'fetch_error',
          error_message: err.message || '',
          retries_left: retriesLeft - 1
        })
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

  async function rerollCurrentStation() {
    if (!station) return

    stopAudio()

    logEvent('station_reroll_requested', {
      round_number: round,
      countrycode: station.countrycode
    })

    // Maybe I should refund hints used in this round? idk. 
    // const spentHints = Object.values(roundHints).filter(Boolean).length
    // setHintCredits(prev => prev + spentHints)
    // setRoundHints({ language: false, city: false, region: false })

    setGuess(null)
    setError('')
    setIsAudioLoading(true)
    if (globe.current) {
      globe.current.reset()
      globe.current.setGuessing(false)
    }

    async function fetchAndPlayReroll(retriesLeft = 3) {
      if (retriesLeft === 0) {
        setError('Could not find another working station for this country. You can try to guess or reroll again.')
        setIsAudioLoading(false)
        if (globe.current) globe.current.setGuessing(true)
        logEvent('station_reroll_fail', {
          round_number: round,
          countrycode: station.countrycode,
          error_message: 'Max retries exceeded'
        })
        return
      }
      try {
        const s = await fetchStation(station.countrycode)
        setStation(s)
        setIsAudioLoading(true)
        playAudio(s.url, {
          onLoading: () => {
            if (globe.current) globe.current.setGuessing(false)
          },
          onPlaying: () => {
            setIsAudioLoading(false)
            setError('')
            setIsAudioPlaying(true)
            if (globe.current) globe.current.setGuessing(true)
            logEvent('station_reroll_success', {
              round_number: round,
              countrycode: s.countrycode,
              region: COUNTRY_TO_REGION[s.countrycode] || 'Unknown'
            })
          },
          onError: () => {
            setError('Stream failed. Trying another.')
            logEvent('station_reroll_fail', {
              round_number: round,
              countrycode: station.countrycode,
              error_type: 'playback_error',
              retries_left: retriesLeft - 1
            })
            fetchAndPlayReroll(retriesLeft - 1)
          }
        })
      } catch (err) {
        console.warn('Reroll station fetch failed, retrying...', err)
        logEvent('station_reroll_fail', {
          round_number: round,
          countrycode: station.countrycode,
          error_type: 'fetch_error',
          error_message: err.message || '',
          retries_left: retriesLeft - 1
        })
        fetchAndPlayReroll(retriesLeft - 1)
      }
    }

    fetchAndPlayReroll(3)
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
    setHintCredits(5)
    setRoundHints({ language: false, city: false, region: false })
    setIsAudioLoading(false)
    resetSessionSeen() // Clear deduplication set for new game
    logEvent('game_reset')
  }

  function useHint(type) {
    if (hintCredits > 0 && !roundHints[type]) {
      setHintCredits(prev => prev - 1);
      setRoundHints(prev => ({ ...prev, [type]: true }));
      logEvent('hint_used', {
        hint_type: type,
        remaining_credits: hintCredits - 1,
        round_number: round
      })
    }
  }

  function submitGuess() {
    pauseAudio();
    setIsAudioPlaying(false);
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

    logEvent('guess_submitted', {
      round_number: round,
      distance_km: Math.round(km),
      score_earned: score,
      countrycode: station.countrycode,
      region: COUNTRY_TO_REGION[station.countrycode] || 'Unknown'
    })
  }

  function toggleResultAudio() {
    const currentState = getAudioState()
    if (currentState === 'playing') {
      pauseAudio()
      setIsAudioPlaying(false)
      logEvent('station_paused', {
        round_number: round,
        station_name: station.name
      })
    } else {
      resumeAudio()
      setIsAudioPlaying(true)
      logEvent('station_keep_listening', {
        round_number: round,
        station_name: station.name
      })
    }
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
            <ScoreboardTooltip history={history} round={round} totalScore={totalScore} />
            <VolumeControl volume={volume} setVolumeState={setVolumeState} setVolume={setVolume} clickSound={clickSound} />
          </div>
        </>
      )}

      {phase === 'start' && <StartScreen theme={theme} setTheme={setTheme} showBorders={showBorders} setShowBorders={setShowBorders} showNames={showNames} setShowNames={setShowNames} error={error} startRound={startRound} clickSound={clickSound} />}
      {phase === 'final' && <FinalScreen history={history} totalScore={totalScore} resetGame={resetGame} clickSound={clickSound} />}
      {phase === 'playing' && <PlayingScreen isAudioLoading={isAudioLoading} error={error} rerollCurrentStation={rerollCurrentStation} clickSound={clickSound} guess={guess} submitGuess={submitGuess} round={round} hintCredits={hintCredits} roundHints={roundHints} station={station} useHint={useHint} />}
      {phase === 'result' && <ResultScreen result={result} station={station} round={round} setPhase={setPhase} startRound={startRound} clickSound={clickSound} toggleResultAudio={toggleResultAudio} isAudioPlaying={isAudioPlaying} location={location} />}
    </div>
  );
}