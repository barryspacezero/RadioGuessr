import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Download, Share2, ArrowRight, Loader2 } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.js';
import { toCanvas } from 'html-to-image';

// Native (unscaled) card dimensions. The card is always laid out at this size so the
// exported image is identical on every device; on small screens it is visually scaled.
const CARD_W = 700;
const CARD_H = 366;
const CARD_SHADOW = 12;
const CARD_BG = '#FDFBF7';

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

// WebKit (Safari + every iOS browser) sometimes drops web fonts on the first
// SVG foreignObject render, so we do a throwaway warm-up pass there.
const isWebKit = () =>
  typeof navigator !== 'undefined' && /AppleWebKit/i.test(navigator.userAgent) && !/Chrome|Android/i.test(navigator.userAgent);

const canShareFiles = (file) => {
  try {
    return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] }));
  } catch {
    return false;
  }
};

export default function ShareCard({ onContinue, rank }) {
  const totalScore = useGameStore(state => state.totalScore);
  const totalRounds = useGameStore(state => state.totalRounds);
  const history = useGameStore(state => state.history);

  const [busyAction, setBusyAction] = useState(null); // 'share' | 'download' | null
  const [image, setImage] = useState(null); // { dataUrl, blob, file }
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);

  const cardRef = useRef(null);
  const stageRef = useRef(null);

  const fileName = `radioguessr-${totalScore}.jpg`;
  const isTouch = useMemo(isTouchDevice, []);
  const supportsShare = useMemo(
    () => canShareFiles(new File([''], 'probe.jpg', { type: 'image/jpeg' })),
    []
  );

  const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '';
    return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
  };

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

  // --- Responsive scaling (computed in JS; CSS can't divide a length by a length reliably) ---
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const byWidth = stage.clientWidth / (CARD_W + CARD_SHADOW);
      // Leave room for the action buttons on short (e.g. landscape) screens.
      const byHeight = (window.innerHeight - 220) / (CARD_H + CARD_SHADOW);
      setScale(Math.max(0.3, Math.min(1, byWidth, Math.max(byHeight, 0.45))));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // --- Image generation ---
  const renderImage = useCallback(async () => {
    const node = cardRef.current;
    if (!node) throw new Error('Share card is not mounted');
    if (document.fonts?.ready) await document.fonts.ready;

    const options = {
      width: CARD_W,
      height: CARD_H,
      pixelRatio: 2,
      backgroundColor: CARD_BG,
      style: { boxShadow: 'none', margin: '0' },
    };

    if (isWebKit()) await toCanvas(node, options);
    const canvas = await toCanvas(node, options);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Failed to create image blob'))), 'image/jpeg', 0.92);
    });
    return { dataUrl, blob, file: new File([blob], fileName, { type: 'image/jpeg' }) };
  }, [fileName]);

  // Pre-render in the background so tapping Share is instant. This matters on iOS,
  // where navigator.share() is rejected if too much time passes after the tap.
  // Re-runs when the rank arrives from the leaderboard fetch.
  useEffect(() => {
    let cancelled = false;
    setImage(null);
    const timer = setTimeout(() => {
      renderImage()
        .then(img => { if (!cancelled) setImage(img); })
        .catch(err => console.warn('Background share-card render failed:', err));
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [renderImage, rank, totalScore, totalRounds, history]);

  const getImage = async () => image ?? (await renderImage());

  const triggerDownload = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleShare = async () => {
    setError(null);
    setBusyAction('share');
    let img = null;
    try {
      img = await getImage();
      if (canShareFiles(img.file)) {
        await navigator.share({
          title: 'RadioGuessr Score',
          text: `I scored ${totalScore.toLocaleString()} points in RadioGuessr! 📻 radioguessr.space`,
          files: [img.file],
        });
      } else {
        setPreviewUrl(img.dataUrl);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return; // user closed the share sheet
      console.warn('Share failed, falling back to manual save:', err);
      if (img) setPreviewUrl(img.dataUrl);
      else setError('Could not create the image. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownload = async () => {
    setError(null);
    setBusyAction('download');
    try {
      const img = await getImage();
      if (isTouch) {
        // Mobile browsers (especially iOS & in-app webviews) handle blob downloads
        // inconsistently, so show the image with save options instead.
        setPreviewUrl(img.dataUrl);
      } else {
        triggerDownload(img.blob);
      }
    } catch (err) {
      console.error('Failed to generate share image', err);
      setError('Could not create the image. Please try again.');
    } finally {
      setBusyAction(null);
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

  const btnBase = 'group flex items-center justify-center gap-2 border-[3px] border-black px-4 py-3 sm:px-6 sm:py-4 transition-all shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none font-black uppercase tracking-widest text-xs sm:text-sm';
  const showExportButtons = import.meta.env.VITE_PORTAL !== 'true';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm pointer-events-auto"
    >
      {/* Scroll container (separate from the root so the preview overlay below stays pinned) */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain custom-scrollbar">
        <div className="min-h-full flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">

          {/* Stage: measures available width; the sizer reserves the scaled footprint */}
          <div ref={stageRef} className="w-full max-w-[712px] flex justify-center">
            <div
              className="relative shrink-0"
              style={{
                width: CARD_W * scale,
                height: CARD_H * scale,
                marginRight: CARD_SHADOW * scale,
                marginBottom: CARD_SHADOW * scale,
              }}
            >
              <div
                className="absolute top-0 left-0"
                style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                <div
                  ref={cardRef}
                  className="relative w-[700px] h-[366px] bg-[#FDFBF7] border-[4px] border-black shadow-[12px_12px_0_#000] flex flex-col overflow-hidden"
                >
                  {/* Big Background Radio Icon */}
                  <div className="absolute -left-[10%] -bottom-[20%] rotate-[-15deg] opacity-[0.03] pointer-events-none text-black">
                    <Radio size={400} strokeWidth={1} />
                  </div>

                  {/* Top Header */}
                  <div className="w-full h-16 shrink-0 bg-amber-400 border-b-[4px] border-black flex items-center px-6 z-10 relative">
                    <h2 className="text-black text-xl mt-1 drop-shadow-[2px_2px_0_rgba(255,255,255,0.6)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
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
                            <div key={entry.code} className={`relative flex flex-col items-center justify-center w-24 h-24 ${shape} border-[3px] border-dashed bg-[#FDFBF7] p-1 shadow-sm ${theme.border} ${theme.text} ${rotation}`}>
                              <div className={`absolute inset-[3px] ${shape} border-[2px] ${theme.ring} pointer-events-none`} />
                              <span className="text-4xl leading-none mb-1 z-10 relative filter drop-shadow-sm border-[2px] border-black/10 bg-white/50 px-1 py-0.5 rounded">
                                {getFlagEmoji(entry.code)}
                              </span>
                              <span className="text-[12px] font-black tracking-widest opacity-90 z-10 relative">{entry.score}</span>
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
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-[700px] flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4">
              {showExportButtons && supportsShare && (
                <button
                  id="share-card-share-btn"
                  onClick={handleShare}
                  disabled={!!busyAction}
                  className={`${btnBase} sm:flex-1 bg-white text-black`}
                >
                  {busyAction === 'share' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5 group-hover:text-amber-500 transition-colors" />}
                  <span>Share</span>
                </button>
              )}

              {showExportButtons && (
                <button
                  id="share-card-download-btn"
                  onClick={handleDownload}
                  disabled={!!busyAction}
                  className={`${btnBase} sm:flex-1 bg-white text-black ${supportsShare ? '' : 'col-span-2'}`}
                >
                  {busyAction === 'download' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:text-amber-500 transition-colors" />}
                  <span>{isTouch ? 'Save' : 'Download'}</span>
                </button>
              )}

              <button
                id="share-card-continue-btn"
                onClick={onContinue}
                className={`${btnBase} col-span-2 sm:flex-1 bg-amber-400 hover:bg-amber-300 text-black`}
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {error && (
              <p className="text-red-300 text-xs sm:text-sm font-bold text-center uppercase tracking-wider">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Manual save fallback / mobile preview */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/90 overflow-y-auto overscroll-contain pointer-events-auto"
          >
            <div className="min-h-full flex flex-col items-center justify-center gap-5 sm:gap-6 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="text-white text-sm sm:text-lg font-bold uppercase tracking-widest text-center max-w-md">
                {isTouch ? 'Long-press the image to save it to your photos' : 'Right-click the image to save, or use the button below'}
              </p>
              <img
                src={previewUrl}
                alt={`RadioGuessr score card: ${totalScore} points`}
                className="w-full max-w-[700px] max-h-[60vh] object-contain border-4 border-white rounded-lg shadow-2xl"
              />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  id="share-card-preview-download"
                  href={previewUrl}
                  download={fileName}
                  className="flex items-center gap-2 bg-amber-400 text-black font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  id="share-card-preview-close"
                  onClick={() => setPreviewUrl(null)}
                  className="bg-white text-black font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
