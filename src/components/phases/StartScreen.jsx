import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Trophy, Book } from 'lucide-react';
import GithubIcon from '../ui/GithubIcon.jsx';
import LeaderboardModal from '../ui/LeaderboardModal.jsx';
import PassportModal from '../ui/PassportModal.jsx';
import { useGameStore } from '../../store/useGameStore.js';
import { logEvent } from '../../analytics.js';

const TooltipInfo = ({ text }) => (
  <div tabIndex="0" className="group/tooltip relative flex items-center outline-none">
    <Info className="w-3.5 h-3.5 text-white/50 hover:text-white cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/95 border border-white/20 text-white text-[11px] leading-snug rounded-lg shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 group-focus/tooltip:opacity-100 transition-opacity z-[100] text-center normal-case font-medium tracking-normal">
      {text}
      <div className="absolute left-1/2 -bottom-[5px] w-2 h-2 bg-black/95 border-r border-b border-white/20 rotate-45 -translate-x-1/2" />
    </div>
  </div>
);

export default function StartScreen({ clickSound, globeRef }) {
  const theme = useGameStore(state => state.theme);
  const setTheme = useGameStore(state => state.setTheme);
  const showBorders = useGameStore(state => state.showBorders);
  const setShowBorders = useGameStore(state => state.setShowBorders);
  const showNames = useGameStore(state => state.showNames);
  const setShowNames = useGameStore(state => state.setShowNames);
  const talkMode = useGameStore(state => state.talkMode);
  const setTalkMode = useGameStore(state => state.setTalkMode);
  const totalRounds = useGameStore(state => state.totalRounds);
  const setTotalRounds = useGameStore(state => state.setTotalRounds);
  const error = useGameStore(state => state.error);
  const startRound = useGameStore(state => state.startRound);
  const allTimeHistory = useGameStore(state => state.allTimeHistory);
  
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);

  return (
    <>
      <motion.div
      key="start"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute bg-black/40 backdrop-blur-sm inset-0 z-50 flex flex-col items-center justify-center gap-5"
    >
      <div className="relative inline-block mt-2">
        <h1 className="text-4xl text-white font-bold tracking-tight">RadioGuessr</h1>
        <motion.span 
          initial={{ scale: 0.9, rotate: -20 }}
          animate={{ scale: [0.9, 1.15, 0.9], rotate: 12 }}
          transition={{ 
            scale: { duration: 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            rotate: { type: "spring", stiffness: 260, damping: 20, delay: 0.2 }
          }}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
          className="absolute -top-4 -right-10 text-amber-400 text-lg drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] origin-center"
        >
          2.4!
        </motion.span>
      </div>
      <p className="text-sm text-white text-center max-w-[260px] leading-relaxed">
        A GeoGuessr-style game where you listen to live radio streams from around the world and guess their location on a 3D globe.
      </p>

      <div className="flex flex-row items-center justify-center gap-6 mt-4">
        <div className="flex flex-col items-center gap-1">
          <label htmlFor="theme" className="flex items-center gap-1.5 text-[10px] text-white/70 uppercase tracking-widest font-bold">
            Globe Style <TooltipInfo text="Changes the visual satellite aesthetic of the 3D globe." />
          </label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-transparent border-2 border-white/30 text-white text-sm font-medium px-3 py-1.5 outline-none cursor-pointer hover:border-white/60 transition-colors [&>option]:bg-black"
          >
            <option value="default">Blue Marble</option>
            <option value="day">Day Map</option>
            <option value="water">Water Map</option>
            <option value="night">Night Map</option>
          </select>
        </div>

        <div className="flex flex-col items-center gap-1">
          <label htmlFor="rounds" className="flex items-center gap-1.5 text-[10px] text-white/70 uppercase tracking-widest font-bold">
            Total Rounds <TooltipInfo text="Number of stations per game. More rounds grant more hint credits!" />
          </label>
          <select
            id="rounds"
            value={totalRounds}
            onChange={(e) => setTotalRounds(parseInt(e.target.value))}
            className="bg-transparent border-2 border-white/30 text-white text-sm font-medium px-3 py-1.5 outline-none cursor-pointer hover:border-white/60 transition-colors [&>option]:bg-black"
          >
            <option value="3">3 Rounds</option>
            <option value="5">5 Rounds</option>
            <option value="10">10 Rounds</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 mb-2">
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
          <span className="flex items-center gap-1.5 text-[11px] text-white/80 uppercase tracking-widest font-bold select-none group-hover:text-white transition-colors">
            Borders <TooltipInfo text="Draws interactive country borders directly onto the 3D globe." />
          </span>
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
          <span className="flex items-center gap-1.5 text-[11px] text-white/80 uppercase tracking-widest font-bold select-none group-hover:text-white transition-colors">
            Country Labels <TooltipInfo text="Displays floating country names when hovering over the globe." />
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex items-center justify-center w-5 h-5 border-2 border-white/50 group-hover:border-white/80 transition-colors">
            <input
              type="checkbox"
              className="opacity-0 absolute w-full h-full cursor-pointer"
              checked={talkMode}
              onChange={(e) => setTalkMode(e.target.checked)}
            />
            {talkMode && <div className="w-2.5 h-2.5 bg-white pointer-events-none" />}
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-white/80 uppercase tracking-widest font-bold select-none group-hover:text-white transition-colors">
            Talk Mode <TooltipInfo text="Automatically filters out music stations to help you hear spoken languages for easier guessing." />
          </span>
        </label>
      </div>

      {error && <span className="text-[13px] font-semibold text-red-700">{error}</span>}
      <button className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg hover:shadow-xl active:scale-95" onClick={() => { clickSound.currentTime = 0; clickSound.play(); startRound(globeRef); }}>
        <Play className="w-8 h-8 fill-current ml-1" />
      </button>
      <span className="text-[13px] font-medium text-white/70">Game Version: 2.4.0</span>
      {import.meta.env.VITE_PORTAL !== 'true' && (
        <span className="text-[14px] font-medium text-white/90">Created By : <a href="https://github.com/barryspacezero" className="hover:underline">Sparsh</a></span>
      )}

      {import.meta.env.VITE_PORTAL !== 'true' && (
        <a
          href="https://github.com/barryspacezero/RadioGuessr"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logEvent('social_click', { platform: 'github' })}
          className="absolute bottom-12 right-6 md:bottom-8 md:right-8 group flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white p-3 md:px-4 md:py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 z-50 pointer-events-auto"
          title="Star on GitHub"
        >
          <GithubIcon className="w-6 h-6 shrink-0 opacity-90 group-hover:opacity-100" />
          <span className="hidden md:inline font-bold tracking-wide opacity-90 group-hover:opacity-100 text-sm">Star on GitHub</span>
        </a>
      )}

      <button
        onClick={() => { clickSound.currentTime = 0; clickSound.play(); logEvent('leaderboard_opened'); setIsLeaderboardOpen(true); }}
        className="absolute bottom-12 left-6 md:bottom-8 md:left-8 group flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 backdrop-blur-md border-2 border-amber-500/30 text-amber-500 p-3 md:px-4 md:py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 z-50 pointer-events-auto"
        title="View Leaderboard"
      >
        <Trophy className="w-6 h-6 shrink-0 opacity-90 group-hover:opacity-100" />
        <span className="hidden md:inline font-bold tracking-wide opacity-90 group-hover:opacity-100 text-sm">Leaderboard</span>
      </button>

      <button
        onClick={() => { clickSound.currentTime = 0; clickSound.play(); setIsPassportOpen(true); }}
        className="absolute bottom-28 left-6 md:bottom-24 md:left-8 group flex items-center justify-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 backdrop-blur-md border-2 border-sky-500/30 text-sky-400 p-3 md:px-4 md:py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 z-50 pointer-events-auto"
        title="View Passport"
      >
        <Book className="w-6 h-6 shrink-0 opacity-90 group-hover:opacity-100" />
        <span className="hidden md:inline font-bold tracking-wide opacity-90 group-hover:opacity-100 text-sm">Passport</span>
      </button>

    </motion.div>
    <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => { clickSound.currentTime = 0; clickSound.play(); setIsLeaderboardOpen(false); }} />
    <PassportModal isOpen={isPassportOpen} onClose={() => { clickSound.currentTime = 0; clickSound.play(); setIsPassportOpen(false); }} clickSound={clickSound} allTimeHistory={allTimeHistory} />
    </>
  );
}
