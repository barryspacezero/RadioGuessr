import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase.js';

export default function LeaderboardModal({ isOpen, onClose }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roundFilter, setRoundFilter] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchScores = async () => {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        if (mounted) {
          setError('Supabase is not configured. Add your environment variables.');
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('rounds', roundFilter)
          .order('score', { ascending: false })
          .limit(50);

        if (dbError) throw dbError;
        
        if (mounted) {
          setScores(data || []);
        }
      } catch (err) {
        if (mounted) setError('Failed to load leaderboard. Please try again later.');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchScores();

    return () => { mounted = false; };
  }, [isOpen, roundFilter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="leaderboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zinc-900 border-2 border-white/20 w-full max-w-lg rounded-xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-white/10 bg-zinc-950">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white tracking-wide uppercase">Global Leaderboard</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b-2 border-white/10 flex justify-center gap-2 bg-zinc-900/50">
              {[3, 5, 10, 20].map((rounds) => (
                <button
                  key={rounds}
                  onClick={() => setRoundFilter(rounds)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all border-2 ${
                    roundFilter === rounds 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-white/60 border-white/20 hover:border-white/50 hover:text-white'
                  }`}
                >
                  {rounds} RND
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-white/50">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-white/30" />
                  <span className="text-sm font-medium uppercase tracking-widest">Fetching Scores...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-48 text-red-400/80 text-sm font-medium text-center px-4">
                  {error}
                </div>
              ) : scores.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-white/40 text-sm font-medium uppercase tracking-widest">
                  No scores yet. Be the first!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {scores.map((entry, idx) => (
                    <div 
                      key={entry.id || idx} 
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        idx === 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' :
                        idx === 1 ? 'bg-zinc-300/10 border-zinc-300/30 text-zinc-100' :
                        idx === 2 ? 'bg-orange-700/10 border-orange-700/30 text-orange-200' :
                        'bg-white/5 border-white/10 text-white/90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-black w-6 text-center ${
                          idx === 0 ? 'text-amber-400' :
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
                        <span className="font-bold text-base truncate max-w-[130px] md:max-w-[180px]">
                          {entry.player_name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="font-black text-xl tracking-tighter">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
