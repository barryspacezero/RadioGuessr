import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import AnimatedCard from '../ui/AnimatedCard.jsx';
import { COUNTRY_TO_REGION } from '../../data/constants.js';
import { useGameStore } from '../../store/useGameStore.js';

export default function PlayingScreen({ clickSound, globeRef }) {
  const isAudioLoading = useGameStore(state => state.isAudioLoading);
  const error = useGameStore(state => state.error);
  const rerollCurrentStation = useGameStore(state => state.rerollCurrentStation);
  const guess = useGameStore(state => state.guess);
  const submitGuess = useGameStore(state => state.submitGuess);
  const round = useGameStore(state => state.round);
  const hintCredits = useGameStore(state => state.hintCredits);
  const roundHints = useGameStore(state => state.roundHints);
  const station = useGameStore(state => state.station);
  const useHint = useGameStore(state => state.useHint);
  return (
    <>
      <AnimatePresence mode="wait">
        {isAudioLoading && (
          <AnimatedCard key="loading-audio">
            <div className="flex flex-col items-center gap-2.5 w-full min-w-[240px]">
              <div className="h-6 bg-gray-200 w-32 rounded-sm mb-1 animate-pulse" />
              <div className="h-4 bg-gray-200 w-3/4 rounded-sm animate-pulse" />
              <div className="h-3 bg-gray-200 w-20 rounded-sm animate-pulse" />

              <div className="w-full border-t border-dashed border-black/10 my-2" />

              <button
                className="w-full text-[11px] py-2 font-bold uppercase border-2 border-black bg-white text-black hover:bg-black hover:text-white cursor-pointer transition-colors shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000] flex items-center justify-center gap-1.5"
                onClick={() => { clickSound.currentTime = 0; clickSound.play(); rerollCurrentStation(); }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reroll (Same Country)
              </button>

              {error && (
                <span className="text-[12px] font-semibold text-red-600 text-center mt-1 animate-none">
                  {error}
                </span>
              )}
            </div>
          </AnimatedCard>
        )}

        {isAudioLoading === false && (
          <AnimatedCard
            key="playing"
            persistentMobileContent={
              <div className="flex flex-col items-center gap-2 w-full">
                <button className="btn btn-primary w-full shadow-lg" disabled={!guess} onClick={() => submitGuess(globeRef)}>
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
                  className={`flex-1 text-[11px] py-1.5 font-bold uppercase border-2 ${(hintCredits > 0 || roundHints.language) ? 'border-black hover:bg-black hover:text-white cursor-pointer' : 'border-[#ccc] text-[#ccc] cursor-not-allowed'} ${roundHints.language ? 'bg-black text-white' : 'bg-white text-black'} transition-colors shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000] disabled:shadow-[2px_2px_0_#cccccc]`}
                  disabled={roundHints.language || hintCredits === 0}
                  onClick={() => useHint('language')}
                  title={roundHints.language ? (station.language || 'Unknown') : 'Use Hint: Language'}
                >
                  Lang
                </button>
                <button
                  className={`flex-1 text-[11px] py-1.5 font-bold uppercase border-2 ${(hintCredits > 0 || roundHints.city) ? 'border-black hover:bg-black hover:text-white cursor-pointer' : 'border-[#ccc] text-[#ccc] cursor-not-allowed'} ${roundHints.city ? 'bg-black text-white' : 'bg-white text-black'} transition-colors shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000] disabled:shadow-[2px_2px_0_#cccccc]`}
                  disabled={roundHints.city || hintCredits === 0}
                  onClick={() => useHint('city')}
                  title={roundHints.city ? (station.state || 'Unknown') : 'Use Hint: City'}
                >
                  City
                </button>
                <button
                  className={`flex-1 text-[11px] py-1.5 font-bold uppercase border-2 ${(hintCredits > 0 || roundHints.region) ? 'border-black hover:bg-black hover:text-white cursor-pointer' : 'border-[#ccc] text-[#ccc] cursor-not-allowed'} ${roundHints.region ? 'bg-black text-white' : 'bg-white text-black'} transition-colors shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000] disabled:shadow-[2px_2px_0_#cccccc]`}
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

            <div className="flex flex-col gap-2 w-full mt-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-black/60">
                <span>Station Trouble?</span>
              </div>
              <button
                className="w-full text-[11px] py-1.5 font-bold uppercase border-2 border-black bg-white text-black hover:bg-black hover:text-white cursor-pointer transition-colors shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000] flex items-center justify-center gap-1.5"
                onClick={() => { clickSound.currentTime = 0; clickSound.play(); rerollCurrentStation(); }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reroll (Same Country)
              </button>
              {error && (
                <span className="text-[12px] font-semibold text-red-600 text-center mt-1">
                  {error}
                </span>
              )}
            </div>
          </AnimatedCard>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="hidden md:flex absolute bottom-16 left-1/2 -translate-x-1/2 w-auto z-10 flex-col items-center gap-2.5 pointer-events-none"
        >
          <div className="pointer-events-auto flex flex-col items-center gap-2.5">
            <button className="btn btn-primary shadow-xl" disabled={!guess} onClick={() => submitGuess(globeRef)}>
              Submit Guess
            </button>
            {!guess && (
              <span className="text-sm font-medium text-white bg-black px-3 py-1 rounded-sm shadow-md">
                Click the globe to place your pin
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
