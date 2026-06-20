import { Trophy } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.js';

export default function ScoreboardTooltip() {
  const history = useGameStore(state => state.history);
  const round = useGameStore(state => state.round);
  const totalScore = useGameStore(state => state.totalScore);
  const totalRounds = useGameStore(state => state.totalRounds);
  return (
    <div className="relative group pointer-events-auto" tabIndex="0">
      <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0_#000] items-center cursor-pointer transition-transform group-hover:-translate-y-0.5 group-focus:-translate-y-0.5">
        <Trophy className="w-5 h-5 md:w-7 md:h-7 shrink-0" />
      </div>

      <div className="absolute top-full right-0 mt-3 md:mt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200 origin-top-right z-50">
        <div className="bg-white border-2 border-black p-3 md:p-4 shadow-[4px_4px_0_#000] w-48 flex flex-col pointer-events-auto">
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
              const pastRound = history[r - 1];
              const isCurrent = !pastRound && r === round;

              return (
                <div key={r} className="flex justify-between items-center text-sm font-medium">
                  <span className={`${isCurrent ? 'text-black font-bold' : 'text-black font-medium'}`}>R{r}</span>
                  {pastRound ? (
                    <span className="font-bold flex items-center gap-2">
                      {pastRound.code && (
                        <img
                          src={`https://flagcdn.com/${pastRound.code.toLowerCase()}.svg`}
                          className="h-3 w-4 border border-black object-cover"
                          alt=""
                        />
                      )}
                      {pastRound.score}
                    </span>
                  ) : (isCurrent ? (
                    <span className="animate-pulse text-black font-bold">...</span>
                  ) : (
                    <span className="text-black">-</span>
                  ))}
                </div>
              )
            })}
          </div>
          <div className="border-t-2 border-black mt-3 pt-2 flex justify-between items-center font-bold text-base md:text-lg">
            <span className="uppercase tracking-wide text-[12px] mt-0.5">Total</span>
            <span>{totalScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
