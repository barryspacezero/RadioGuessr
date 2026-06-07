import { create } from 'zustand';
import { fetchStation, resetSessionSeen } from '../api.js';
import { playAudio, stopAudio, pauseAudio, resumeAudio, getAudioState } from '../audio.js';
import { calcScore } from '../score.js';
import { logEvent } from '../analytics.js';
import { COUNTRY_TO_REGION } from '../data/constants.js';
import { useMultiplayerStore } from './useMultiplayerStore.js';

export const useGameStore = create((set, get) => ({
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
  isAudioPlaying: true,

  // Simple Setters
  setPhase: (phase) => set({ phase }),
  setVolumeState: (volume) => set({ volume }),
  setTheme: (theme) => set({ theme }),
  setShowBorders: (showBorders) => set({ showBorders }),
  setShowNames: (showNames) => set({ showNames }),
  setGuess: (guess) => set({ guess }),

  // Actions
  startRound: async (globeRef) => {
    const { round, totalScore, history, theme, showBorders, showNames } = get();
    
    if (round >= 5) {
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
      roundHints: { language: false, city: false, region: false }
    });

    const fetchAndPlay = async (retriesLeft = 3) => {
      if (retriesLeft === 0) {
        set((state) => ({
          error: 'Could not find a working station. Please check your internet connection and try again.',
          phase: 'start',
          round: state.round - 1
        }));
        return;
      }
      try {
        const s = await fetchStation();
        set({ station: s, phase: 'playing', isAudioLoading: true });
        if (globeRef?.current) globeRef.current.setGuessing(false);
        
        const mp = useMultiplayerStore.getState();
        if (mp.isHost && mp.channel) {
          mp.broadcastStartRound(s, nextRound);
        }

        playAudio(s.url, {
          onLoading: () => {
            if (globeRef?.current) globeRef.current.setGuessing(false);
          },
          onPlaying: () => {
            set((state) => {
              if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
                globeRef.current.setGuessing(true);
              }
              return { isAudioLoading: false, error: '', isAudioPlaying: true };
            });
            logEvent('station_load_success', {
              round_number: nextRound,
              countrycode: s.countrycode,
              region: COUNTRY_TO_REGION[s.countrycode] || 'Unknown',
              language: s.language || 'Unknown'
            });
          },
          onError: () => {
            set({ error: 'Stream failed. Trying again.', phase: 'loading' });
            logEvent('station_load_fail', {
              round_number: nextRound,
              error_type: 'playback_error',
              retries_left: retriesLeft - 1
            });
            fetchAndPlay(retriesLeft - 1);
          }
        });
      } catch (err) {
        console.warn('Station fetch failed, retrying...', err);
        logEvent('station_load_fail', {
          round_number: nextRound,
          error_type: 'fetch_error',
          error_message: err.message || '',
          retries_left: retriesLeft - 1
        });
        fetchAndPlay(retriesLeft - 1);
      }
    };

    fetchAndPlay(3);

    setTimeout(() => {
      set((state) => {
        if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
          globeRef.current.setGuessing(true);
        }
        return { isAudioLoading: false };
      });
    }, 6000);
  },

  rerollCurrentStation: async (globeRef) => {
    const { station, round } = get();
    if (!station) return;

    stopAudio();
    logEvent('station_reroll_requested', { round_number: round, countrycode: station.countrycode });

    set({ guess: null, error: '', isAudioLoading: true });
    if (globeRef?.current) {
      globeRef.current.reset();
      globeRef.current.setGuessing(false);
    }

    const fetchAndPlayReroll = async (retriesLeft = 3) => {
      if (retriesLeft === 0) {
        set((state) => {
          if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
            globeRef.current.setGuessing(true);
          }
          return { error: 'Could not find another working station for this country. You can try to guess or reroll again.', isAudioLoading: false };
        });
        logEvent('station_reroll_fail', { round_number: round, countrycode: station.countrycode, error_message: 'Max retries exceeded' });
        return;
      }
      try {
        const s = await fetchStation(station.countrycode);
        set({ station: s, isAudioLoading: true });
        
        playAudio(s.url, {
          onLoading: () => {
            if (globeRef?.current) globeRef.current.setGuessing(false);
          },
          onPlaying: () => {
            set((state) => {
              if ((state.phase === 'playing' || state.phase === 'loading') && globeRef?.current) {
                globeRef.current.setGuessing(true);
              }
              return { isAudioLoading: false, error: '', isAudioPlaying: true };
            });
            logEvent('station_reroll_success', { round_number: round, countrycode: s.countrycode, region: COUNTRY_TO_REGION[s.countrycode] || 'Unknown' });
          },
          onError: () => {
            set({ error: 'Stream failed. Trying another.' });
            logEvent('station_reroll_fail', { round_number: round, countrycode: station.countrycode, error_type: 'playback_error', retries_left: retriesLeft - 1 });
            fetchAndPlayReroll(retriesLeft - 1);
          }
        });
      } catch (err) {
        console.warn('Reroll station fetch failed, retrying...', err);
        logEvent('station_reroll_fail', { round_number: round, countrycode: station.countrycode, error_type: 'fetch_error', error_message: err.message || '', retries_left: retriesLeft - 1 });
        fetchAndPlayReroll(retriesLeft - 1);
      }
    };

    fetchAndPlayReroll(3);
  },

  resetGame: () => {
    set({
      phase: 'start',
      history: [],
      totalScore: 0,
      round: 0,
      station: null,
      guess: null,
      result: null,
      error: '',
      hintCredits: 5,
      roundHints: { language: false, city: false, region: false },
      isAudioLoading: false
    });
    resetSessionSeen();
    logEvent('game_reset');
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
    const result = { km, score };
    
    const isMultiplayer = !!useMultiplayerStore.getState().roomId;

    set({
      result,
      totalScore: totalScore + score,
      phase: isMultiplayer ? 'waiting' : 'result',
      history: [...history, { country: station.country, code: station.countrycode, score: score }]
    });

    if (isMultiplayer) {
       useMultiplayerStore.getState().broadcastGuess(guess, result);
    }

    logEvent('guess_submitted', { round_number: round, distance_km: Math.round(km), score_earned: score, countrycode: station.countrycode, region: COUNTRY_TO_REGION[station.countrycode] || 'Unknown' });
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
  },

  startMultiplayerRound: (station, roundNumber) => {
    stopAudio();
    
    set({
      round: roundNumber,
      guess: null,
      result: null,
      error: '',
      phase: 'playing',
      roundHints: { language: false, city: false, region: false },
      station: station,
      isAudioLoading: true
    });

    playAudio(station.url, {
      onLoading: () => {},
      onPlaying: () => {
        set({ isAudioLoading: false, error: '', isAudioPlaying: true });
      },
      onError: () => {
        set({ error: 'Stream failed for peer.', isAudioLoading: false });
      }
    });
  },

  revealMultiplayerResults: () => {
    pauseAudio();
    set({ isAudioPlaying: false, phase: 'result' });
  }
}));
