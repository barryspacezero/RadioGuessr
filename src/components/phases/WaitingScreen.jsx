import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../../store/useMultiplayerStore.js';
import { useGameStore } from '../../store/useGameStore.js';

export default function WaitingScreen() {
  const { isHost, players, playerGuesses, broadcastReveal } = useMultiplayerStore();
  const station = useGameStore(state => state.station);
  
  const guessesCount = Object.keys(playerGuesses).length;
  const allGuessed = guessesCount >= players.length;

  return (
    <motion.div
      key="waiting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute bg-black/60 backdrop-blur-sm inset-0 z-50 flex flex-col items-center justify-center p-6"
    >
      <div className="bg-black/80 border-2 border-white/20 p-8 rounded-xl text-center shadow-2xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-white mb-2">Waiting for others...</h2>
        <p className="text-white/60 mb-6">{guessesCount} / {players.length} players have guessed</p>
        
        {isHost && (
          <button 
            className={`w-full py-3 rounded-full font-bold transition-all ${allGuessed ? 'bg-[#1db954] text-white hover:scale-105' : 'bg-white/20 text-white/50'}`}
            onClick={broadcastReveal}
          >
            {allGuessed ? 'Reveal Results' : 'Force Reveal Results'}
          </button>
        )}
        {!isHost && (
          <div className="flex items-center justify-center gap-3 text-white/80">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Waiting for Host to reveal
          </div>
        )}
      </div>
    </motion.div>
  );
}
