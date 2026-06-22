import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, X, ChevronLeft, ChevronRight, Calendar, MapPin, Award } from 'lucide-react';
import { COUNTRY_TO_REGION, REGIONS } from '../../data/constants.js';

export default function PassportModal({ isOpen, onClose, clickSound, allTimeHistory }) {
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const [selectedStamp, setSelectedStamp] = useState(null);

  const CONTINENTS = {
    'All Stamps': 'ALL',
    'North America': ['North America', 'Central America', 'Caribbean'],
    'South America': ['South America'],
    'Europe': ['Europe', 'Caucasus'],
    'Asia': ['South Asia', 'East Asia', 'Southeast Asia', 'Central Asia', 'Middle East'],
    'Africa': ['Africa - North', 'Africa - West', 'Africa - East', 'Africa - Central', 'Africa - South'],
    'Oceania': ['Oceania', 'Pacific / Territories']
  };

  const uniqueStampsMap = new Map();
  if (allTimeHistory) {
    allTimeHistory.forEach(item => {
      uniqueStampsMap.set(item.code, item);
    });
  }

  const regionNames = Object.keys(CONTINENTS);
  const currentRegion = regionNames[currentRegionIndex];
  const regionCountries = currentRegion === 'All Stamps'
    ? Array.from(uniqueStampsMap.keys())
    : CONTINENTS[currentRegion].flatMap(subRegion => REGIONS[subRegion] || []);

  const getCountryName = (code) => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
    } catch (e) {
      return code;
    }
  };

  const colorThemes = [
    { border: 'border-blue-700/80', text: 'text-blue-800/80', ring: 'border-blue-600/50' },
    { border: 'border-red-700/80', text: 'text-red-800/80', ring: 'border-red-600/50' },
    { border: 'border-emerald-700/80', text: 'text-emerald-800/80', ring: 'border-emerald-600/50' },
    { border: 'border-purple-700/80', text: 'text-purple-800/80', ring: 'border-purple-600/50' },
    { border: 'border-orange-700/80', text: 'text-orange-800/80', ring: 'border-orange-600/50' }
  ];

  const shapes = [
    { type: 'circle', containerClass: 'w-32 h-32 md:w-40 md:h-40 rounded-full', innerRingClass: 'rounded-full border-[2px]', borderClass: 'border-[4px] border-dashed' },
    { type: 'rectangle', containerClass: 'w-40 h-28 md:w-48 md:h-36 rounded-md', innerRingClass: 'rounded-md border-[2px]', borderClass: 'border-[5px] border-double' },
    { type: 'square', containerClass: 'w-32 h-32 md:w-40 md:h-40 rounded-2xl', innerRingClass: 'rounded-2xl border-[2px]', borderClass: 'border-[4px] border-solid' },
    { type: 'vertical', containerClass: 'w-28 h-36 md:w-36 md:h-48 rounded-lg', innerRingClass: 'rounded-lg border-[2px]', borderClass: 'border-[3px] border-solid' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-[#FDFBF7] border-[3px] border-black w-[95%] max-w-5xl flex flex-col max-h-[85vh] shadow-[8px_8px_0_#000] relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 md:p-3 border-b-[3px] border-black bg-white z-10 relative">
              <div className="flex items-center gap-2">
                <Book className="w-5 h-5 text-black" />
                <h2 className="text-lg md:text-xl font-black text-black uppercase tracking-widest mt-1 leading-none hidden sm:block">Passport</h2>
                <h2 className="text-base font-black text-black uppercase tracking-widest mt-1 leading-none sm:hidden">Stamps</h2>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex flex-col items-end border-r-2 border-black/20 pr-3 md:pr-4">
                  <span className="text-[8px] md:text-[9px] font-bold text-black/50 uppercase tracking-widest leading-none mb-0.5">Visited</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg md:text-xl font-black text-black leading-none">{uniqueStampsMap.size}</span>
                    <span className="text-[10px] md:text-xs font-bold text-black/40 leading-none">/ {Object.keys(COUNTRY_TO_REGION).length}</span>
                  </div>
                </div>

                <button
                  onClick={() => { if (clickSound) { clickSound.currentTime = 0; clickSound.play(); } onClose(); }}
                  className="text-black hover:scale-110 active:scale-95 transition-transform"
                >
                  <X className="w-5 h-5 font-bold" />
                </button>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-2 border-b-[3px] border-black bg-[#F5F1E6] z-10 relative">
              <button
                onClick={() => { if (clickSound) { clickSound.currentTime = 0; clickSound.play(); } setCurrentRegionIndex(prev => prev === 0 ? regionNames.length - 1 : prev - 1); }}
                className="p-1 hover:bg-black/10 rounded-full transition-colors active:scale-95 text-black"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="flex flex-col items-center flex-1">
                <span className="text-[8px] md:text-[9px] font-bold text-black/50 uppercase tracking-widest leading-none mb-1">Region</span>
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-center text-black leading-none">{currentRegion}</span>
                <span className="text-[8px] font-bold text-black/40 uppercase tracking-widest mt-0.5">
                  Page {currentRegionIndex + 1} of {regionNames.length}
                </span>
              </div>

              <button
                onClick={() => { if (clickSound) { clickSound.currentTime = 0; clickSound.play(); } setCurrentRegionIndex(prev => prev === regionNames.length - 1 ? 0 : prev + 1); }}
                className="p-1 hover:bg-black/10 rounded-full transition-colors active:scale-95 text-black"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Stamps Grid */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-light relative bg-[#FDFBF7]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRegion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 pt-16 pb-8 md:px-12 md:pt-20 md:pb-12 flex flex-wrap justify-center items-center gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-8 w-full min-h-full"
                >
                  {regionCountries.length === 0 && currentRegion === 'All Stamps' && (
                    <span className="text-black/50 font-bold tracking-widest uppercase text-center w-full mt-4">
                      No stamps yet.<br />Play a round to get your passport stamped!
                    </span>
                  )}
                  {regionCountries.map((countryCode, index) => {
                    const stampData = uniqueStampsMap.get(countryCode);
                    const isMissing = !stampData;
                    
                    const shape = shapes[index % shapes.length];
                    const rotation = index % 5 === 0 ? '-rotate-[10deg]' : index % 5 === 1 ? 'rotate-[6deg]' : index % 5 === 2 ? '-rotate-[4deg]' : index % 5 === 3 ? 'rotate-[12deg]' : '-rotate-[6deg]';
                    const fade = index % 2 === 0 ? 'opacity-80' : 'opacity-95';
                    const xOffset = index % 4 === 0 ? 'translate-x-1' : index % 4 === 1 ? '-translate-x-2' : index % 4 === 2 ? 'translate-x-3' : '-translate-x-1';
                    const yOffset = index % 3 === 0 ? 'translate-y-2' : index % 3 === 1 ? '-translate-y-2' : 'translate-y-1';
                    const zIndex = index % 3 === 0 ? 'z-10' : index % 3 === 1 ? 'z-20' : 'z-30';

                    let theme = colorThemes[index % colorThemes.length];
                    let isGold = false;
                    let isTransit = false;

                    if (!isMissing) {
                      if (stampData.score >= 4000) {
                        theme = { border: 'border-yellow-500/90', text: 'text-yellow-600/90', ring: 'border-yellow-400/60' };
                        isGold = true;
                      } else if (stampData.score < 1000) {
                        theme = { border: 'border-red-700/90', text: 'text-red-800/90', ring: 'border-red-600/50' };
                        isTransit = true;
                      }
                    }

                    return (
                      <div 
                        key={countryCode} 
                        tabIndex={isMissing ? "-1" : "0"} 
                        onClick={() => {
                          if (!isMissing) {
                            if (clickSound) { clickSound.currentTime = 0; clickSound.play(); }
                            setSelectedStamp({ ...stampData, name: getCountryName(countryCode) });
                          }
                        }}
                        className={`relative group flex flex-col items-center focus:outline-none transition-all duration-300 ${!isMissing ? 'cursor-pointer hover:scale-[1.15]' : ''} ${xOffset} ${yOffset} ${zIndex} -ml-1 md:-ml-2 hover:!z-[60]`}
                      >
                        {/* Custom Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 group-focus:scale-100 transition-transform origin-bottom bg-black text-white text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 border-2 border-white/20 whitespace-nowrap z-[100] pointer-events-none shadow-xl">
                          {getCountryName(countryCode)}
                          {isMissing && <span className="ml-2 text-white/50 text-[10px] md:text-xs">(Undiscovered)</span>}
                          <div className="absolute left-1/2 -bottom-[5px] md:-bottom-[6px] w-2 h-2 md:w-3 md:h-3 bg-black border-r-2 border-b-2 border-white/20 rotate-45 -translate-x-1/2" />
                        </div>

                        {isMissing ? (
                          <div className={`relative flex flex-col items-center justify-center ${shape.containerClass} border-2 border-dashed border-black/10 bg-black/5`}>
                            <span className="text-4xl md:text-5xl font-black text-black/10 font-serif">?</span>
                          </div>
                        ) : (
                          <div className={`relative flex flex-col items-center justify-center ${shape.containerClass} ${shape.borderClass} p-2 mix-blend-multiply ${theme.border} ${theme.text} ${rotation} ${fade} filter ${isGold ? 'drop-shadow-[0_0_12px_rgba(234,179,8,0.6)] saturate-150' : 'hover:saturate-125'} hover:opacity-100 transition-all`}>
                            
                            {/* Inner ring */}
                            <div className={`absolute inset-[3px] md:inset-[4px] ${shape.innerRingClass} ${theme.ring} pointer-events-none`} />
                            
                            {/* Top Text */}
                            <span className="text-[12px] md:text-[15px] font-black uppercase tracking-widest leading-none mb-1 md:mb-2 opacity-90 relative z-10">{countryCode}</span>
                            
                            {/* Flag */}
                            <img
                              src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
                              alt={countryCode}
                              className={`w-14 h-10 md:w-16 md:h-12 object-cover opacity-[0.85] mix-blend-multiply filter contrast-125 saturate-50 ${theme.border} border-2 relative z-10`}
                            />
                            
                            {/* Bottom Text */}
                            <div className="mt-1 md:mt-2 flex flex-col items-center opacity-90 relative z-10">
                              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest leading-none">
                                {isTransit ? 'TRANSIT' : isGold ? 'RESIDENT' : 'TOURIST'}
                              </span>
                              <span className="text-[11px] md:text-[13px] font-black tracking-widest mt-1 md:mt-1.5">{stampData.score.toLocaleString()}</span>
                            </div>
                            
                            {/* Subtle arc text simulation for circle only */}
                            {shape.type === 'circle' && (
                              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
                                <path id={`curve-${countryCode}`} d="M 15,50 A 35,35 0 1,1 85,50 A 35,35 0 1,1 15,50" fill="transparent" />
                                <text className={`text-[7px] md:text-[8px] font-bold uppercase tracking-widest ${theme.text}`} fill="currentColor">
                                  <textPath href={`#curve-${countryCode}`} startOffset="5%">
                                    RADIO • GSSR • OFFICIAL • 
                                  </textPath>
                                </text>
                              </svg>
                            )}

                            {/* Linear border text for non-circles */}
                            {shape.type !== 'circle' && (
                               <div className="absolute inset-x-0 bottom-2 md:bottom-2.5 flex justify-center opacity-50 pointer-events-none">
                                 <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest leading-none">
                                   {isGold ? 'GOLD CLASS VISA' : isTransit ? 'TEMPORARY VISA' : 'RADIO GSSR OFFICIAL'}
                                 </span>
                               </div>
                            )}
                            {shape.type !== 'circle' && (
                               <div className="absolute inset-x-0 top-2 md:top-2.5 flex justify-center opacity-50 pointer-events-none">
                                 <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest leading-none">
                                   {isTransit ? 'DENIED ENTRY' : 'VISA APPROVED'}
                                 </span>
                               </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive Stamp Details Modal overlay */}
            <AnimatePresence>
              {selectedStamp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
                >
                  <motion.div
                    initial={{ y: 20, scale: 0.9 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 20, scale: 0.9 }}
                    className="bg-white border-[3px] border-black shadow-[8px_8px_0_#000] w-full max-w-sm flex flex-col p-6"
                  >
                    <div className="flex justify-between items-start border-b-[3px] border-black pb-4 mb-4">
                      <div className="flex flex-col pr-4">
                        <h3 className="text-2xl font-black uppercase tracking-widest leading-none text-black break-words">{selectedStamp.name}</h3>
                        <span className="text-xs font-bold text-black/50 uppercase tracking-widest mt-1">Visa Details</span>
                      </div>
                      <button
                        onClick={() => { if (clickSound) clickSound.play(); setSelectedStamp(null); }}
                        className="text-black hover:scale-110 active:scale-95 transition-transform p-1 bg-black/5 rounded-full shrink-0"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 bg-[#F5F1E6] p-4 border-2 border-black">
                        <Award className={`w-8 h-8 ${selectedStamp.score >= 4000 ? 'text-yellow-600' : selectedStamp.score < 1000 ? 'text-red-600' : 'text-blue-600'}`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-black/60 uppercase tracking-widest leading-none">Best Score</span>
                          <span className="text-2xl font-black leading-none mt-1 text-black">{selectedStamp.score.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-[#F5F1E6] p-4 border-2 border-black">
                        <MapPin className="w-8 h-8 text-black/70" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-black/60 uppercase tracking-widest leading-none">Total Visits</span>
                          <span className="text-2xl font-black leading-none mt-1 text-black">{selectedStamp.visits || 1}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-[#F5F1E6] p-4 border-2 border-black">
                        <Calendar className="w-8 h-8 text-black/70" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-black/60 uppercase tracking-widest leading-none">First Discovered</span>
                          <span className="text-lg font-black leading-none mt-1 uppercase text-black">
                            {selectedStamp.firstDiscovered ? new Date(selectedStamp.firstDiscovered).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Legacy'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
