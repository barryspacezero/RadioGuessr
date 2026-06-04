import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import DiscordIcon from '../ui/DiscordIcon.jsx';

export default function StartScreen({ theme, setTheme, showBorders, setShowBorders, showNames, setShowNames, error, startRound, clickSound }) {
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
      <span className="text-[13px] font-medium text-white/70">Game Version: 1.5</span>
      <span className="text-[14px] font-medium text-white/90">Created By : <a href="https://github.com/barryspacezero">Sparsh</a></span>

      <a
        href="https://discord.gg/Vx3ckyrS6"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 right-6 md:bottom-8 md:right-8 group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white px-4 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 z-50 pointer-events-auto"
        title="Join our Discord"
      >
        <DiscordIcon className="w-6 h-6 opacity-90 group-hover:opacity-100" />
        <span className="hidden md:inline font-bold tracking-wide opacity-90 group-hover:opacity-100 text-sm">Join Discord</span>
      </a>
    </motion.div>
  );
}
