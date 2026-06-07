import { Play, Pause } from 'lucide-react';
import AnimatedCard from '../ui/AnimatedCard.jsx';
import { stopAudio } from '../../audio.js';
import { useGameStore } from '../../store/useGameStore.js';
import { useMultiplayerStore } from '../../store/useMultiplayerStore.js';

export default function ResultScreen({ clickSound, globeRef }) {
  const result = useGameStore(state => state.result);
  const station = useGameStore(state => state.station);
  const round = useGameStore(state => state.round);
  const setPhase = useGameStore(state => state.setPhase);
  const startRound = useGameStore(state => state.startRound);
  const toggleResultAudio = useGameStore(state => state.toggleResultAudio);
  const isAudioPlaying = useGameStore(state => state.isAudioPlaying);

  const roomId = useMultiplayerStore(state => state.roomId);
  const isHost = useMultiplayerStore(state => state.isHost);
  const players = useMultiplayerStore(state => state.players);
  const playerGuesses = useMultiplayerStore(state => state.playerGuesses);
  
  const isMultiplayer = !!roomId;

  const sortedGuesses = Object.entries(playerGuesses)
    .map(([id, guessData]) => {
       const p = players.find(p => p.userId === id);
       return { ...guessData, userName: p?.userName || 'Unknown' };
    })
    .sort((a, b) => b.result.score - a.result.score);

  const location = station ? [station.state, station.country].filter(Boolean).join(', ') : '';
  if (!result || !station) return null;

  return (
    <AnimatedCard
      key="result"
      delay={2.2}
      className="!items-start gap-1.5 md:!min-w-[340px]"
      persistentMobileContent={
        (!isMultiplayer || isHost) ? (
          <button className="btn btn-primary w-full shadow-lg" onClick={() => {
            if (round >= 5) {
              stopAudio()
              setPhase('final')
            } else { clickSound.currentTime = 0; clickSound.play(); startRound(globeRef) }
          }}>{round === 5 ? 'Final Score' : 'Next Round'}</button>
        ) : (
          <div className="w-full text-center text-white font-bold p-3">Waiting for Host...</div>
        )
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
      {isMultiplayer ? (
        <div className="w-full">
           <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-black">Leaderboard</span>
           <ul className="mt-2 space-y-2">
             {sortedGuesses.map((g, idx) => (
               <li key={idx} className="flex justify-between items-center text-black text-sm">
                 <span className="font-bold">{g.userName}</span>
                 <div className="text-right leading-tight">
                   <div className="font-bold">{g.result.score.toLocaleString()} pts</div>
                   <div className="text-[10px] opacity-80">{Math.round(g.result.km).toLocaleString()} km</div>
                 </div>
               </li>
             ))}
           </ul>
        </div>
      ) : (
        <>
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-black">Score</span>
          <span className="text-5xl md:text-[60px] font-bold leading-none tracking-[-2px] text-black">
            {result.score.toLocaleString()}
          </span>
        </>
      )}
      {(!isMultiplayer || isHost) ? (
        <button className="hidden md:block btn btn-primary mt-4 w-full" onClick={() => {
          if (round >= 5) {
            stopAudio()
            setPhase('final')
          } else { clickSound.currentTime = 0; clickSound.play(); startRound(globeRef) }
        }}>{round === 5 ? 'Final Score' : 'Next Round'}</button>
      ) : (
        <div className="hidden md:block text-black font-bold text-center mt-4 w-full">Waiting for Host...</div>
      )}
    </AnimatedCard>
  );
}
