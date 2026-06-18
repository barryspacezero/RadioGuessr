import { Play, Pause } from 'lucide-react';
import AnimatedCard from '../ui/AnimatedCard.jsx';
import { stopAudio } from '../../audio.js';
import { useGameStore } from '../../store/useGameStore.js';

export default function ResultScreen({ clickSound, globeRef }) {
  const result = useGameStore(state => state.result);
  const station = useGameStore(state => state.station);
  const round = useGameStore(state => state.round);
  const totalRounds = useGameStore(state => state.totalRounds);
  const setPhase = useGameStore(state => state.setPhase);
  const startRound = useGameStore(state => state.startRound);
  const toggleResultAudio = useGameStore(state => state.toggleResultAudio);
  const isAudioPlaying = useGameStore(state => state.isAudioPlaying);

  const location = station ? [station.state, station.country].filter(Boolean).join(', ') : '';
  if (!result || !station) return null;

  return (
    <AnimatedCard
      key="result"
      delay={2.2}
      className="!items-start gap-1.5 md:!min-w-[340px]"
      persistentMobileContent={
        <button className="btn btn-primary w-full shadow-lg" onClick={() => {
          if (round >= totalRounds) {
            stopAudio()
            setPhase('final')
          } else { clickSound.currentTime = 0; clickSound.play(); startRound(globeRef) }
        }}>{round === totalRounds ? 'Final Score' : 'Next Round'}</button>
      }
    >
      <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-black">Station</span>
      <span className="text-[13px] font-medium text-black line-clamp-2 ">{station.name}</span>
      <div className="flex items-center gap-2.5 mt-0.5">
        {station.countrycode && (
          <img
            src={`https://flagcdn.com/${station.countrycode.toLowerCase()}.svg`}
            className="w-16 border-2 border-black shadow-[2px_2px_0_#000] object-cover"
          />
        )}
        <span className="text-xl md:text-[22px] font-bold tracking-tight leading-tight text-black">{location}</span>
      </div>
      <span className="text-[13px] text-black">
        {result.km < 1 ? 'Less than 1 km away' : `${result.km.toLocaleString()} km away`}
      </span>
      <button
        className="mt-3 w-full text-[11px] py-1.5 font-bold uppercase border-2 border-black bg-white text-black hover:bg-black hover:text-white cursor-pointer transition-colors shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0_#000] flex items-center justify-center gap-1.5"
        onClick={toggleResultAudio}
      >
        {isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        {isAudioPlaying ? "Pause Radio" : "Keep Listening"}
      </button>
      <div className="my-3 border-t-2 border-black w-full" />
      <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-black">Score</span>
      <span className="text-5xl md:text-[60px] font-bold leading-none tracking-[-2px] text-black">
        {result.score.toLocaleString()}
      </span>
      <button className="hidden md:block btn btn-primary mt-4 w-full" onClick={() => {
        if (round >= totalRounds) {
          stopAudio()
          setPhase('final')
        } else { clickSound.currentTime = 0; clickSound.play(); startRound(globeRef) }
      }}>{round === totalRounds ? 'Final Score' : 'Next Round'}</button>
    </AnimatedCard>
  );
}
