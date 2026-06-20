import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchStation, resetSessionSeen, markSessionSeen } from '../api.js';
import { playAudio, stopAudio, pauseAudio, resumeAudio, getAudioState, probeAndPlayAudio } from '../audio.js';
import { calcScore } from '../score.js';
import { logEvent } from '../analytics.js';
import { COUNTRY_TO_REGION } from '../data/constants.js';

export const useGameStore = create(
  persist(
    (set, get) => ({
  phase: 'start',
  volume: 0.85,
  theme: 'default',
  showBorders: false,
  showNames: false,
  station: null,
  totalScore: 0,
  isAudioLoading: false,
  guess: null,
  round: 0,
  result: null,
  error: '',
  hintCredits: 5,
  roundHints: { language: false, city: false, region: false },
  history: [],
  allTimeHistory: [],
  isAudioPlaying: true,
  talkMode: false,
  totalRounds: 5,
  stationPool: [],
  attemptId: 0,

  // Simple Setters
  setPhase: (phase) => set({ phase }),
  setVolumeState: (volume) => {
    logEvent('settings_changed', { setting_name: 'volume', setting_value: volume });
    set({ volume });
  },
  setTheme: (theme) => {
    logEvent('settings_changed', { setting_name: 'theme', setting_value: theme });
    set({ theme });
  },
  setShowBorders: (showBorders) => {
    logEvent('settings_changed', { setting_name: 'show_borders', setting_value: showBorders });
    set({ showBorders });
  },
  setShowNames: (showNames) => {
    logEvent('settings_changed', { setting_name: 'show_names', setting_value: showNames });
    set({ showNames });
  },
  setGuess: (guess) => set({ guess }),
  setTalkMode: (talkMode) => {
    logEvent('settings_changed', { setting_name: 'talk_mode', setting_value: talkMode });
    set({ talkMode, stationPool: [] }); // Invalidate preloaded pool
    get().preloadNextStation();
  },
  setTotalRounds: (totalRounds) => {
    logEvent('settings_changed', { setting_name: 'total_rounds', setting_value: totalRounds });
    set({ totalRounds, hintCredits: totalRounds });
  },

  isPreloading: false,

  // Actions
  preloadNextStation: async () => {
    const { stationPool, talkMode, isPreloading } = get();
    if (isPreloading) return;
    
    // Only preload if the pool is running low (less than 3 items, which is 1 batch)
    if (stationPool.length < 3) {
      set({ isPreloading: true });
      try {
        const newStations = await fetchStation(null, talkMode);
        // Ensure we don't accidentally wipe out an existing pool, just append
        set(state => ({ stationPool: [...state.stationPool, ...newStations] }));
      } catch (err) {
        console.warn("Background preload failed, will fetch on demand later", err);
      } finally {
        set({ isPreloading: false });
      }
    }
  },

  startRound: async (globeRef) => {
    const { round, totalScore, history, theme, showBorders, showNames, totalRounds } = get();
    
    if (round >= totalRounds) {
      set({ phase: 'final' });
      logEvent('game_complete', {
        total_score: totalScore,
        countries_visited: history.map(h => h.country).join(', ')
      });
      return;
    }

    if (round === 0) {
      logEvent('game_start', { theme, show_borders: showBorders, show_names: showNames });
    }

    const nextRound = round + 1;
    logEvent('round_start', { round_number: nextRound });

    stopAudio();
    if (globeRef?.current) globeRef.current.reset();

    set({
      round: nextRound,
      guess: null,
      result: null,
      error: '',
      phase: 'loading',
      roundHints: { language: false, city: false, region: false },
    });

    const currentAttemptId = Date.now();
    set({ attemptId: currentAttemptId });

    const fetchAndPlay = async (retriesLeft = 3) => {
      if (get().attemptId !== currentAttemptId) return; // Superseded by reroll/reset

      if (retriesLeft <= 0) {
        set((state) => ({
          error: 'Could not find a working station. Please check your internet connection and try again.',
          phase: 'start',
          round: state.round - 1
        }));
        logEvent('station_load_fail', { round_number: nextRound, reason: 'retries_exhausted' });
        return;
      }
      let timeoutId = null;
      try {
        const { talkMode, stationPool } = get();
        let pool = stationPool;
        if (pool.length === 0) {
          pool = await fetchStation(null, talkMode);
        }
        
        if (pool.length === 0) {
          throw new Error('Pool is empty');
        }

        const batch = pool.slice(0, 3);
        const remainingPool = pool.slice(batch.length);

        set({ station: batch[0], stationPool: remainingPool, phase: 'playing', isAudioLoading: true });
        if (globeRef?.current) globeRef.current.setGuessing(false);
        
        const fallbackNext = () => {
          if (get().attemptId !== currentAttemptId) return;
          console.warn('Stream batch failed or timed out, trying next in pool');
          clearTimeout(timeoutId);
          set({ error: 'Stream failed. Trying next...', phase: 'loading' });
          fetchAndPlay(remainingPool.length > 0 ? retriesLeft : retriesLeft - 1);
        };

        timeoutId = setTimeout(() => {
          if (get().attemptId !== currentAttemptId) return;
          if (get().isAudioLoading) {
            stopAudio();
            fallbackNext();
          }
        }, 12000); // 12s timeout: balances buffering time with user patience

        probeAndPlayAudio(batch.map(s => s.url), {
          onLoading: () => {
            if (get().attemptId !== currentAttemptId) return;
            if (globeRef?.current) globeRef.current.setGuessing(false);
          },
          onPlaying: (winningIndex) => {
            if (get().attemptId !== currentAttemptId) return;
            clearTimeout(timeoutId);
            const winnerStation = batch[winningIndex];
            markSessionSeen(winnerStation.stationuuid);
            set((state) => {
              if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
                globeRef.current.setGuessing(true);
              }
              return { station: winnerStation, isAudioLoading: false, error: '', isAudioPlaying: true };
            });
            logEvent('station_load_success', {
              round_number: nextRound,
              countrycode: winnerStation.countrycode,
              region: COUNTRY_TO_REGION[winnerStation.countrycode] || 'Unknown',
              language: winnerStation.language || 'Unknown'
            });
          },
          onError: () => {
            if (get().attemptId !== currentAttemptId) return;
            fallbackNext();
          }
        });
      } catch (err) {
        if (get().attemptId !== currentAttemptId) return;
        clearTimeout(timeoutId);
        console.warn('Station fetch failed, retrying...', err);
        set({ stationPool: [] }); // Clear pool on error
        
        if (err.message === 'Rate limited') {
          set((state) => ({
             error: 'API Rate Limited. Please wait 15 seconds before trying again.',
             phase: 'start',
             round: state.round - 1
          }));
          return;
        }

        fetchAndPlay(retriesLeft - 1);
      }
    };

    fetchAndPlay(3);
  },

  rerollCurrentStation: async (globeRef) => {
    const { station, round } = get();
    if (!station) return;

    // Save old station as fallback
    const oldStation = station;

    stopAudio();
    logEvent('station_reroll_requested', { round_number: round, countrycode: station.countrycode });

    set({ guess: null, error: '', isAudioLoading: true });
    if (globeRef?.current) {
      globeRef.current.reset();
      globeRef.current.setGuessing(false);
    }

    const currentAttemptId = Date.now();
    set({ attemptId: currentAttemptId });

    const fetchAndPlayReroll = async (retriesLeft = 3, existingPool = []) => {
      if (get().attemptId !== currentAttemptId) return;

      if (retriesLeft <= 0) {
        // Fallback to old station
        probeAndPlayAudio([oldStation.url], {
          onLoading: () => {},
          onPlaying: () => {
            if (get().attemptId !== currentAttemptId) return;
            set((state) => {
              if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
                globeRef.current.setGuessing(true);
              }
              return { 
                station: oldStation, 
                error: 'Could not find another working station. Returning to original.', 
                isAudioLoading: false, 
                isAudioPlaying: true 
              };
            });
          },
          onError: () => {
            if (get().attemptId !== currentAttemptId) return;
            set((state) => {
              if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
                globeRef.current.setGuessing(true);
              }
              return { 
                station: oldStation, 
                error: 'Could not find another station, and original stream died.', 
                isAudioLoading: false, 
                isAudioPlaying: false 
              };
            });
          }
        });
        logEvent('station_reroll_fail', { round_number: round, reason: 'retries_exhausted_reroll' });
        return;
      }
      let timeoutId = null;
      try {
        const { talkMode } = get();
        let pool = existingPool;
        if (pool.length === 0) {
          pool = await fetchStation(station.countrycode, talkMode);
        }
        if (pool.length === 0) {
          throw new Error('Pool is empty');
        }

        const batch = pool.slice(0, 3);
        const remainingPool = pool.slice(batch.length);

        set({ station: batch[0], isAudioLoading: true });
        
        const fallbackNext = () => {
          if (get().attemptId !== currentAttemptId) return;
          clearTimeout(timeoutId);
          set({ error: 'Stream failed. Trying another.' });
          fetchAndPlayReroll(remainingPool.length > 0 ? retriesLeft : retriesLeft - 1, remainingPool);
        };

        timeoutId = setTimeout(() => {
          if (get().attemptId !== currentAttemptId) return;
          if (get().isAudioLoading) {
            stopAudio();
            fallbackNext();
          }
        }, 12000); // 12s timeout

        probeAndPlayAudio(batch.map(s => s.url), {
          onLoading: () => {
            if (get().attemptId !== currentAttemptId) return;
            if (globeRef?.current) globeRef.current.setGuessing(false);
          },
          onPlaying: (winningIndex) => {
            if (get().attemptId !== currentAttemptId) return;
            clearTimeout(timeoutId);
            const winnerStation = batch[winningIndex];
            markSessionSeen(winnerStation.stationuuid);
            set((state) => {
              if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
                globeRef.current.setGuessing(true);
              }
              return { station: winnerStation, isAudioLoading: false, error: '', isAudioPlaying: true };
            });
            logEvent('station_reroll_success', { round_number: round, countrycode: winnerStation.countrycode, region: COUNTRY_TO_REGION[winnerStation.countrycode] || 'Unknown' });
          },
          onError: () => {
            if (get().attemptId !== currentAttemptId) return;
            fallbackNext();
          }
        });
      } catch (err) {
        if (get().attemptId !== currentAttemptId) return;
        clearTimeout(timeoutId);
        console.warn('Reroll station fetch failed, retrying...', err);

        if (err.message === 'Rate limited') {
          // Force failure condition instantly to fallback
          fetchAndPlayReroll(0, []);
          return;
        }

        fetchAndPlayReroll(retriesLeft - 1, []);
      }
    };

    fetchAndPlayReroll(3);
  },

  resetGame: () => {
    set((state) => ({
      phase: 'start',
      history: [],
      totalScore: 0,
      round: 0,
      station: null,
      guess: null,
      result: null,
      error: '',
      hintCredits: state.totalRounds,
      roundHints: { language: false, city: false, region: false },
      isAudioLoading: false,
      stationPool: [] // Reset on new game
    }));
    resetSessionSeen();
    logEvent('game_reset');
    get().preloadNextStation();
  },

  useHint: (type) => {
    const { hintCredits, roundHints, round } = get();
    if (hintCredits > 0 && !roundHints[type]) {
      set({
        hintCredits: hintCredits - 1,
        roundHints: { ...roundHints, [type]: true }
      });
      logEvent('hint_used', { hint_type: type, remaining_credits: hintCredits - 1, round_number: round });
    }
  },

  submitGuess: (globeRef) => {
    const { guess, station, totalScore, round, history } = get();
    if (!guess || !station) return;
    
    pauseAudio();
    set({ isAudioPlaying: false });
    
    if (globeRef?.current) {
      globeRef.current.setGuessing(false);
      globeRef.current.reveal(station.lat, station.lng, guess.lat, guess.lng);
    }

    const { km, score } = calcScore(guess.lat, guess.lng, station.lat, station.lng);
    
    set({
      result: { km, score },
      totalScore: totalScore + score,
      phase: 'result',
      history: [...history, { country: station.country, code: station.countrycode, score: score }],
      allTimeHistory: (() => {
        const currentAllTime = get().allTimeHistory;
        const existingIndex = currentAllTime.findIndex(h => h.code === station.countrycode);
        if (existingIndex !== -1) {
          if (score > currentAllTime[existingIndex].score) {
            const updated = [...currentAllTime];
            updated[existingIndex] = { ...updated[existingIndex], score: score };
            return updated;
          }
          return currentAllTime;
        }
        return [...currentAllTime, { country: station.country, code: station.countrycode, score: score }];
      })()
    });

    logEvent('guess_submitted', { round_number: round, distance_km: Math.round(km), score_earned: score, countrycode: station.countrycode, region: COUNTRY_TO_REGION[station.countrycode] || 'Unknown' });
    
    // Kick off background preload immediately while user is looking at results!
    get().preloadNextStation();
  },

  toggleResultAudio: () => {
    const { station, round } = get();
    const currentState = getAudioState();
    if (currentState === 'playing') {
      pauseAudio();
      set({ isAudioPlaying: false });
      logEvent('station_paused', { round_number: round, station_name: station?.name });
    } else {
      resumeAudio();
      set({ isAudioPlaying: true });
      logEvent('station_keep_listening', { round_number: round, station_name: station?.name });
    }
  }
}),
  {
    name: 'radioguessr-storage',
    partialize: (state) => ({ allTimeHistory: state.allTimeHistory }),
  }
));
