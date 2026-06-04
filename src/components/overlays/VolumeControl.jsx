import { Volume2, VolumeX } from 'lucide-react';

export default function VolumeControl({ volume, setVolumeState, setVolume, clickSound }) {
  return (
    <div className="hidden md:flex group bg-white border-2 border-black p-3 shadow-[4px_4px_0_#000] items-center gap-0 hover:gap-3 transition-all cursor-pointer pointer-events-auto">
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
  );
}
