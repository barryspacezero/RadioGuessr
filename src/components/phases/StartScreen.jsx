import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import GithubIcon from '../ui/GithubIcon.jsx';
import { useGameStore } from '../../store/useGameStore.js';

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
  return (
    <motion.div
      key="start"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute bg-black/40 backdrop-blur-sm inset-0 z-50 flex flex-col items-center justify-center gap-5"
    >
      <h1 className="text-4xl text-white font-bold tracking-tight">RadioGuessr</h1>
      <p className="text-sm text-white text-center max-w-[260px] leading-relaxed">
        A GeoGuessr-style game where you listen to live radio streams from around the world and guess their location on a 3D globe.
      </p>

      <div className="flex flex-row items-center justify-center gap-6 mt-4">
        <div className="flex flex-col items-center gap-1">
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
            <option value="day">Day Map</option>
            <option value="water">Water Map</option>
            <option value="night">Night Map</option>
          </select>
        </div>

        <div className="flex flex-col items-center gap-1">
          <label htmlFor="rounds" className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
            Total Rounds
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
            <option value="20">20 Rounds</option>
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

        <div className="flex items-center gap-2">
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
            <span className="text-[11px] text-white/80 uppercase tracking-widest font-bold select-none group-hover:text-white transition-colors">Talk Mode</span>
          </label>
          <div className="group relative flex items-center">
            <Info className="w-4 h-4 text-white/60 hover:text-white cursor-help transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
              Filters out music stations to help you hear spoken language for easier guessing.
            </div>
          </div>
        </div>
      </div>

      {error && <span className="text-[13px] font-semibold text-red-700">{error}</span>}
      <button className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg hover:shadow-xl active:scale-95" onClick={() => { clickSound.currentTime = 0; clickSound.play(); startRound(globeRef); }}>
        <Play className="w-8 h-8 fill-current ml-1" />
      </button>
      <span className="text-[13px] font-medium text-white/70">Game Version: 1.6</span>
      <span className="text-[14px] font-medium text-white/90">Created By : <a href="https://github.com/barryspacezero" className="hover:underline">Sparsh</a></span>

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
