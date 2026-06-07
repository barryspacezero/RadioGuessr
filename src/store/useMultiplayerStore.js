import { create } from 'zustand';
import { supabase } from '../lib/supabase.js';
import { useGameStore } from './useGameStore.js';

export const useMultiplayerStore = create((set, get) => ({
  roomId: null,
  isHost: false,
  userId: null,
  userName: null,
  players: [],
  channel: null,
  playerGuesses: {},
  
  initUser: () => {
    if (!get().userId) {
      set({ 
        userId: crypto.randomUUID(),
        userName: 'Player_' + Math.floor(Math.random() * 1000)
      });
    }
  },

  setUserName: (name) => {
    set({ userName: name });
    const { channel, userId, isHost } = get();
    if (channel) {
      channel.track({
        userId,
        userName: name,
        isHost,
        joinedAt: new Date().toISOString()
      });
    }
  },

  createRoom: () => {
    get().initUser();
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    set({ isHost: true });
    get().joinRoom(roomId);
  },

  joinRoom: (roomId) => {
    if (!supabase) {
      console.warn("Supabase credentials missing. Multiplayer disabled.");
      return;
    }
    get().initUser();
    const { userId, userName } = get();
    
    // If already in a channel, leave it
    const currentChannel = get().channel;
    if (currentChannel) {
      currentChannel.unsubscribe();
    }

    set({ roomId, players: [], playerGuesses: {} });
    useGameStore.getState().setPhase('lobby'); // switch phase to lobby

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const players = Object.values(state).map(p => p[0]);
        // Sort players so host is first
        players.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));
        set({ players });
      })
      .on('broadcast', { event: 'START_ROUND' }, (payload) => {
        if (!get().isHost) {
          const { station, round } = payload.payload;
          set({ playerGuesses: {} }); // reset guesses for the round
          useGameStore.getState().startMultiplayerRound(station, round);
        }
      })
      .on('broadcast', { event: 'GUESS_SUBMITTED' }, (payload) => {
        const { userId: fromId, guess, result } = payload.payload;
        set((state) => ({
          playerGuesses: {
            ...state.playerGuesses,
            [fromId]: { guess, result }
          }
        }));
      })
      .on('broadcast', { event: 'REVEAL_RESULTS' }, () => {
        if (!get().isHost) {
           useGameStore.getState().revealMultiplayerResults();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            userName: get().userName,
            isHost: get().isHost,
            joinedAt: new Date().toISOString()
          });
        }
      });

    set({ channel });
  },

  leaveRoom: () => {
    const { channel } = get();
    if (channel) {
      channel.unsubscribe();
    }
    set({
      roomId: null,
      isHost: false,
      players: [],
      channel: null,
      playerGuesses: {}
    });
    useGameStore.getState().resetGame();
  },

  broadcastStartRound: (station, round) => {
    const { channel, isHost } = get();
    if (channel && isHost) {
      set({ playerGuesses: {} });
      channel.send({
        type: 'broadcast',
        event: 'START_ROUND',
        payload: { station, round }
      });
    }
  },

  broadcastGuess: (guess, result) => {
    const { channel, userId } = get();
    if (channel) {
      set((state) => ({
        playerGuesses: {
          ...state.playerGuesses,
          [userId]: { guess, result }
        }
      }));

      channel.send({
        type: 'broadcast',
        event: 'GUESS_SUBMITTED',
        payload: { userId, guess, result }
      });
    }
  },

  broadcastReveal: () => {
    const { channel, isHost } = get();
    if (channel && isHost) {
      channel.send({
        type: 'broadcast',
        event: 'REVEAL_RESULTS',
        payload: {}
      });
    }
  }
}));
