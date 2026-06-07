import { motion } from 'framer-motion';
import GithubIcon from '../ui/GithubIcon.jsx';
import { useGameStore } from '../../store/useGameStore.js';

export default function FinalScreen({ clickSound }) {
  const history = useGameStore(state => state.history);
  const totalScore = useGameStore(state => state.totalScore);
  const resetGame = useGameStore(state => state.resetGame);
  return (
    <motion.div
      key="final"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute bg-black/60 backdrop-blur-md inset-0 z-50 flex flex-col items-center justify-center gap-5"
    >
      <h1 className="text-4xl text-white font-bold tracking-tight">RadioGuessr</h1>
      <span className="text-xl text-white font-bold text-center uppercase tracking-[1.2px]">Countries visited this session</span>
      <div className="flex flex-wrap justify-center items-center bg-white p-4 md:p-6 gap-5 md:gap-8 border-2 border-black shadow-[6px_6px_0_#000]">
        {history.map((item, index) => (
          <div key={index} tabIndex="0" className="relative group flex flex-col items-center cursor-pointer focus:outline-none">
            {item.code && (
              <img
                src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
                alt={item.country}
                className="h-10 md:h-14 w-auto border-2 border-black shadow-[2px_2px_0_#000] group-hover:-translate-y-1 group-focus:-translate-y-1 group-hover:shadow-[4px_4px_0_#000] group-focus:shadow-[4px_4px_0_#000] transition-all object-cover"
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
      <p className="text-sm text-white text-center max-w-[260px] leading-relaxed">
        Total Score: {totalScore}
      </p>
      <button className="btn " onClick={() => { clickSound.currentTime = 0; clickSound.play(); resetGame(); }}>Play Again</button>

      <a
        href="https://github.com/barryspacezero/RadioGuessr"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 right-6 md:bottom-8 md:right-8 group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white px-4 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 z-50 pointer-events-auto"
        title="Star on GitHub"
      >
        <GithubIcon className="w-6 h-6 opacity-90 group-hover:opacity-100" />
        <span className="hidden md:inline font-bold tracking-wide opacity-90 group-hover:opacity-100 text-sm">Star on GitHub</span>
      </a>
    </motion.div>
  );
}
