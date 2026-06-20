import { useState, useEffect, Fragment, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Book, X } from 'lucide-react';
import GithubIcon from '../ui/GithubIcon.jsx';
import { useGameStore } from '../../store/useGameStore.js';
import { logEvent } from '../../analytics.js';
import { supabase } from '../../supabase.js';
import CountrySelect from '../ui/CountrySelect.jsx';

export default function FinalScreen({ clickSound }) {
  const history = useGameStore(state => state.history);
  const allTimeHistory = useGameStore(state => state.allTimeHistory);
  const totalScore = useGameStore(state => state.totalScore);
  const totalRounds = useGameStore(state => state.totalRounds);
  const resetGame = useGameStore(state => state.resetGame);

  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [scoresError, setScoresError] = useState(null);
  
  const userRowRef = useRef(null);

  useEffect(() => {
    if (!loadingScores && userRowRef.current) {
      setTimeout(() => {
        userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [loadingScores, scores]);

  const fetchScores = async () => {
    setLoadingScores(true);
    setScoresError(null);
    if (!supabase) {
      setScoresError('Leaderboard is not configured.');
      setLoadingScores(false);
      return;
    }
    try {
      const { data, error: dbError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('rounds', totalRounds)
        .order('score', { ascending: false })
        .limit(50);
      if (dbError) throw dbError;
      setScores(data || []);
    } catch (err) {
      console.error(err);
      setScoresError('Failed to load leaderboard.');
    } finally {
      setLoadingScores(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [totalRounds]);

  const handleSubmitScore = async () => {
    if (!playerName.trim()) {
      setSubmitError('Please enter a name.');
      return;
    }
    if (!supabase) {
      setSubmitError('Leaderboard is not configured.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.from('leaderboard').insert([
        {
          player_name: playerName.trim(),
          score: totalScore,
          rounds: totalRounds,
          country_code: selectedCountry
        }
      ]);

      if (error) throw error;

      setSubmitSuccess(true);
      fetchScores();
    } catch (err) {
      console.error(err);
      setSubmitError('Failed to submit score. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userProjectedRank = scores.length > 0 
    ? (scores.findIndex(s => totalScore >= s.score) === -1 ? scores.length + 1 : scores.findIndex(s => totalScore >= s.score) + 1) 
    : 1;

  return (
    <>
      <motion.div
        key="final"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute bg-black/60 backdrop-blur-md inset-0 z-50 flex flex-col items-center justify-center gap-2 overflow-y-auto custom-scrollbar py-12 px-4"
      >
        <h1 className="text-3xl md:text-4xl text-white font-black tracking-tighter mb-2 text-center drop-shadow-md">RadioGuessr</h1>
        <div className="flex flex-col items-center gap-1 mb-4">
          <p className="text-sm md:text-base text-white/80 text-center uppercase tracking-[2px] font-bold">
            Total Score: <span className="text-amber-400 text-lg md:text-xl">{totalScore.toLocaleString()}</span>
          </p>
        </div>

        <div className="flex flex-col items-center w-full">
          <span className="text-base text-white font-bold text-center uppercase tracking-[1.2px] mb-3">Leaderboard ({totalRounds} Rounds)</span>
          <div className="flex flex-col w-full max-w-[360px] md:max-w-[420px] max-h-[50vh] overflow-y-auto gap-2 px-2 pb-2 custom-scrollbar">
            {loadingScores ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
              </div>
            ) : scoresError ? (
              <span className="text-red-400 text-sm font-bold text-center p-2">{scoresError}</span>
            ) : scores.length === 0 ? (
              <span className="text-white/50 text-sm font-bold text-center uppercase p-2">No scores yet. Be the first!</span>
            ) : (
              <>
                {scores.map((entry, idx) => {
                  const isFormHere = !submitSuccess && userProjectedRank === idx + 1;
                  return (
                      <Fragment key={entry.id || idx}>
                        {isFormHere && (
                          <div ref={userRowRef} className="flex flex-col gap-2 p-2.5 rounded-lg border-2 border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black w-6 text-center text-amber-400">#{userProjectedRank}</span>
                              <div className="flex-1">
                                <CountrySelect selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
                              </div>
                            </div>
                            <div className="flex w-full gap-2">
                            <input
                              type="text"
                              placeholder="Enter your name"
                              maxLength={20}
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              className="flex-1 bg-black/50 border-2 border-white/30 text-white px-2 py-1.5 text-sm font-bold placeholder-white/40 focus:outline-none focus:border-amber-400 transition-colors min-w-0"
                              disabled={isSubmitting}
                            />
                            <button
                              onClick={handleSubmitScore}
                              disabled={isSubmitting}
                              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                            >
                              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                            </button>
                          </div>
                          {submitError && <span className="text-red-400 text-xs font-bold text-center">{submitError}</span>}
                        </div>
                      )}
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg border-2 ${idx === 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' :
                            idx === 1 ? 'bg-zinc-300/10 border-zinc-300/30 text-zinc-100' :
                              idx === 2 ? 'bg-orange-700/10 border-orange-700/30 text-orange-200' :
                                'bg-white/5 border-white/10 text-white/90'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-base font-black w-6 text-center ${idx === 0 ? 'text-amber-400' :
                              idx === 1 ? 'text-zinc-300' :
                                idx === 2 ? 'text-orange-600' :
                                  'text-white/40'
                            }`}>
                            #{idx + 1}
                          </span>
                          {entry.country_code && (
                            <img
                              src={`https://flagcdn.com/${entry.country_code.toLowerCase()}.svg`}
                              className="w-5 h-auto shadow-sm border border-white/20 rounded-[1px]"
                              alt={entry.country_code}
                            />
                          )}
                          <span className="font-bold text-sm truncate max-w-[100px] md:max-w-[160px]">
                            {entry.player_name || 'Anonymous'}
                          </span>
                        </div>
                        <span className="font-black text-lg tracking-tighter">
                          {entry.score.toLocaleString()}
                        </span>
                      </div>
                    </Fragment>
                  );
                })}
                {!submitSuccess && (scores.length === 0 || userProjectedRank > scores.length) && (
                  <div ref={userRowRef} className="flex flex-col gap-2 p-2.5 rounded-lg border-2 border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black w-6 text-center text-amber-400">#{scores.length + 1}</span>
                      <div className="flex-1">
                        <CountrySelect selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
                      </div>
                    </div>
                    <div className="flex w-full gap-2">
                      <input
                        type="text"
                        placeholder="Enter your name"
                        maxLength={20}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="flex-1 bg-black/50 border-2 border-white/30 text-white px-2 py-1.5 text-sm font-bold placeholder-white/40 focus:outline-none focus:border-amber-400 transition-colors min-w-0"
                        disabled={isSubmitting}
                      />
                      <button
                        onClick={handleSubmitScore}
                        disabled={isSubmitting}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                      </button>
                    </div>
                    {submitError && <span className="text-red-400 text-xs font-bold text-center">{submitError}</span>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          <button
            onClick={() => { clickSound.currentTime = 0; clickSound.play(); logEvent('passport_opened'); setIsHistoryOpen(true); }}
            className="group flex items-center justify-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 backdrop-blur-md border-2 border-sky-500/30 text-sky-400 p-3 md:px-4 md:py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 z-50 pointer-events-auto"
            title="View Passport"
          >
            <Book className="w-6 h-6 shrink-0 opacity-90 group-hover:opacity-100" />
            <span className="hidden md:inline font-bold tracking-wide opacity-90 group-hover:opacity-100 text-sm">Passport</span>
          </button>

          <button className="btn text-lg py-3 px-8 md:px-12 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black transition-colors uppercase tracking-widest font-black shadow-[4px_4px_0_#000]" onClick={() => { clickSound.currentTime = 0; clickSound.play(); resetGame(); }}>
            Play Again
          </button>

          <a
            href="https://github.com/barryspacezero/RadioGuessr"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logEvent('social_click', { platform: 'github' })}
            className="group flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white p-3 md:px-4 md:py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 z-50 pointer-events-auto"
            title="Star on GitHub"
          >
            <GithubIcon className="w-6 h-6 shrink-0 opacity-90 group-hover:opacity-100" />
            <span className="hidden md:inline font-bold tracking-wide opacity-90 group-hover:opacity-100 text-sm">GitHub</span>
          </a>
        </div>

      </motion.div>

      {/* Passport Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            key="passport"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDFBF7] border-[3px] border-black w-[95%] max-w-xl flex flex-col max-h-[85vh] shadow-[8px_8px_0_#000]"
            >
              <div className="flex items-center justify-between p-4 md:p-5 border-b-[3px] border-black bg-white z-10 relative">
                <div className="flex items-center gap-3">
                  <Book className="w-6 h-6 text-black" />
                  <h2 className="text-xl font-black text-black uppercase tracking-widest mt-1">Passport Stamps</h2>
                </div>
                <button
                  onClick={() => { clickSound.currentTime = 0; clickSound.play(); setIsHistoryOpen(false); }}
                  className="text-black hover:scale-110 active:scale-95 transition-transform"
                >
                  <X className="w-7 h-7 font-bold" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8 pt-12 md:px-8 md:pb-10 md:pt-16 custom-scrollbar-light flex flex-wrap justify-center items-center gap-x-6 gap-y-10">
                {allTimeHistory.length === 0 ? (
                  <span className="text-black/50 font-bold tracking-widest uppercase">No stamps yet.</span>
                ) : (
                  allTimeHistory.map((item, index) => {
                  const rotation = index % 3 === 0 ? '-rotate-2' : index % 3 === 1 ? 'rotate-3' : 'rotate-1';
                  return (
                    <div key={index} tabIndex="0" className={`relative group flex flex-col items-center cursor-pointer focus:outline-none ${rotation} hover:rotate-0 transition-all duration-300`}>

                      {/* Custom Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 group-focus:scale-100 transition-transform origin-bottom bg-black text-white text-xs font-bold px-3 py-1.5 border-2 border-white/20 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        {item.country}
                        <div className="absolute left-1/2 -bottom-[5px] w-2 h-2 bg-black border-r-2 border-b-2 border-white/20 rotate-45 -translate-x-1/2" />
                      </div>

                      {item.code && (
                        <div className="relative">
                          <img
                            src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
                            alt={item.country}
                            className="h-12 md:h-16 w-auto border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,0.15)] group-hover:shadow-[5px_5px_0_rgba(0,0,0,0.25)] transition-shadow object-cover"
                          />
                        </div>
                      )}
                      <div className="mt-3 bg-black text-white px-2 py-0.5 -rotate-1 border border-black shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                        <span className="text-[11px] font-black tracking-widest">{item.score.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                }))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
