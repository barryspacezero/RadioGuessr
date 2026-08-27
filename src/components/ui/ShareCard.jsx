import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Download, ArrowRight, Loader2 } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.js';
import html2canvas from 'html2canvas';export default function ShareCard({ onContinue, rank }) {
  const totalScore = useGameStore(state => state.totalScore);
  const totalRounds = useGameStore(state => state.totalRounds);
  const history = useGameStore(state => state.history);

  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef(null);

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Get top 4 unique countries by highest score
  const uniqueBestCountries = Array.from(new Set(history.map(h => h.code)))
    .map(code => {
      const scoresForCountry = history.filter(h => h.code === code).map(h => h.score);
      const maxScore = Math.max(...scoresForCountry);
      return { code, score: maxScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      setIsSharing(true);
      await new Promise(r => setTimeout(r, 150)); 
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#FDFBF7'
      });
      
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      if (!blob) throw new Error('Failed to create blob');

      const file = new File([blob], `radioguessr-${totalScore}.jpg`, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'RadioGuessr Score',
          text: `I scored ${totalScore} points in RadioGuessr!`,
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `radioguessr-${totalScore}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to generate/share image', err);
        alert('Failed to share image. Check console for details.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const stampThemes = [
    { border: 'border-blue-700/80', text: 'text-blue-800', ring: 'border-blue-600/50' },
    { border: 'border-red-700/80', text: 'text-red-800', ring: 'border-red-600/50' },
    { border: 'border-emerald-700/80', text: 'text-emerald-800', ring: 'border-emerald-600/50' },
    { border: 'border-purple-700/80', text: 'text-purple-800', ring: 'border-purple-600/50' },
  ];

  const stampShapes = [
    'rounded-full',
    'rounded-lg',
    'rounded-none',
    'rounded-2xl'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-6 p-4 bg-black/60 backdrop-blur-sm overflow-y-auto custom-scrollbar"
    >
      <div 
        ref={cardRef}
        className="relative w-[700px] h-[366px] max-w-[90vw] shrink-0 bg-[#FDFBF7] border-[4px] border-black shadow-[12px_12px_0_#000] flex flex-col overflow-hidden"
        style={{ transform: 'translateZ(0)' }} // Hardware acceleration hint for html-to-image
      >
        {/* Big Background Radio Icon */}
        <div className="absolute -left-[10%] -bottom-[20%] rotate-[-15deg] opacity-[0.03] pointer-events-none text-black">
          <Radio size={400} strokeWidth={1} />
        </div>
        
        {/* Top Header */}
        <div className="w-full h-16 shrink-0 bg-amber-400 border-b-[4px] border-black flex items-center px-6 z-10 relative">
          <h2 className="text-black text-xl md:text-2xl mt-1 drop-shadow-[2px_2px_0_rgba(255,255,255,0.6)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            RadioGuessr
          </h2>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-row items-stretch w-full relative z-10">
          
          {/* Left Side: Score */}
          <div className="w-[280px] shrink-0 flex flex-col items-center justify-center bg-white relative z-10 p-6 border-r-[4px] border-black">
            <p className="text-black/50 text-sm uppercase tracking-[0.2em] font-black mb-1">Total Score</p>
            <h1 
              className="text-amber-400 text-[70px] leading-[0.9] font-black tracking-tighter relative"
              style={{ textShadow: '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 2px 2px 0px #000' }}
            >
              {totalScore.toLocaleString()}
            </h1>
            
            <div className="mt-4 flex justify-between w-full border-t-2 border-black/10 pt-4">
              <div className="flex flex-col items-center flex-1">
                <span className="text-black font-black text-lg tracking-widest leading-none">
                  {totalRounds}
                </span>
                <span className="text-black/40 text-[9px] uppercase tracking-widest font-black mt-1 text-center">
                  Rounds
                </span>
              </div>
              <div className="w-[2px] bg-black/10 h-10 mx-2 self-center" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-amber-500 font-black text-[14px] tracking-widest leading-none mt-1" style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                  #{rank || '?'}
                </span>
                <span className="text-black/40 text-[9px] uppercase tracking-widest font-black mt-2 text-center">
                  Global Rank
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Stamps */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 relative z-10">
            <h3 className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-4">
              {uniqueBestCountries.length > 0 ? "Stamps Collected" : "No Stamps Yet"}
            </h3>
            
            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              {uniqueBestCountries.map((entry, idx) => {
                const theme = stampThemes[idx % stampThemes.length];
                const shape = stampShapes[idx % stampShapes.length];
                const rotation = idx % 2 === 0 ? 'rotate-[6deg]' : 'rotate-[-8deg]';
                return (
                  <div key={entry.code} className={`relative flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 ${shape} border-[3px] border-dashed bg-[#FDFBF7] p-1 shadow-sm ${theme.border} ${theme.text} ${rotation} hover:scale-110 transition-transform`}>
                    <div className={`absolute inset-[3px] ${shape} border-[2px] ${theme.ring} pointer-events-none`} />
                    <img 
                      src={`https://flagcdn.com/w80/${entry.code.toLowerCase()}.png`} 
                      crossOrigin="anonymous" 
                      className="w-10 h-7 md:w-12 md:h-8 object-cover border-[2px] border-black/20 mb-1 z-10 relative" 
                      alt={entry.code} 
                    />
                    <span className="text-[10px] md:text-[12px] font-black tracking-widest opacity-90 z-10 relative">{entry.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info (bottom right) */}
        <div className="absolute bottom-2 right-4 z-20">
          <p className="text-black/30 text-[9px] font-black tracking-widest uppercase">
            radioguessr.space · {dateStr}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 flex-wrap justify-center mt-2 w-full max-w-[700px]">
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className="group flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-white text-black border-[3px] border-black px-6 py-4 transition-all shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] active:translate-y-[4px] active:shadow-none disabled:opacity-50 font-black uppercase tracking-widest text-sm"
        >
          {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:text-amber-500 transition-colors" />}
          <span>Share</span>
        </button>
        
        <button 
          onClick={onContinue}
          className="group flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black px-6 py-4 transition-all shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] active:translate-y-[4px] active:shadow-none font-black uppercase tracking-widest text-sm"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}
