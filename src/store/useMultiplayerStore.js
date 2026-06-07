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
      const newUserId = typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      set({ 
        userId: newUserId,
        userName: 'Player_' + Math.floor(Math.random() * 1000)
      });
    }
  },

  setUserName: (name) => {
    set({ userName: name });
    const { channel, userId, isHost, players } = get();
    
    const playerObj = {
      userId,
      userName: name,
      isHost,
      joinedAt: new Date().toISOString()
    };

    const newPlayers = [...players];
    const idx = newPlayers.findIndex(p => p.userId === userId);
    if (idx >= 0) newPlayers[idx] = playerObj;
    else newPlayers.push(playerObj);
    newPlayers.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));
    set({ players: newPlayers });

    if (channel) {
      channel.track(playerObj).catch(() => {});
      channel.send({
        type: 'broadcast',
        event: 'SYNC_PLAYER',
        payload: { player: playerObj, requestReply: false }
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
    const upperRoomId = roomId.trim().toUpperCase();
    get().initUser();
    const { userId, userName } = get();
    
    // If already in a channel, leave it
    const currentChannel = get().channel;
    if (currentChannel) {
      currentChannel.unsubscribe();
    }

    set({ roomId: upperRoomId, players: [], playerGuesses: {} });
    useGameStore.getState().setPhase('lobby'); // switch phase to lobby

    const channel = supabase.channel(`room:${upperRoomId}`, {
      config: {
        broadcast: { self: true },
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        if (Object.keys(state).length > 0) {
          const presencePlayers = Object.values(state).map(p => p[0]);
          const merged = [...get().players];
          presencePlayers.forEach(p => {
             const idx = merged.findIndex(existing => existing.userId === p.userId);
             if (idx >= 0) merged[idx] = p;
             else merged.push(p);
          });
          merged.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));
          set({ players: merged });
        }
      })
      .on('broadcast', { event: 'SYNC_PLAYER' }, (payload) => {
        const { player, requestReply } = payload.payload;
        if (!player) return;
        const newPlayers = [...get().players];
        const idx = newPlayers.findIndex(p => p.userId === player.userId);
        if (idx >= 0) newPlayers[idx] = player;
        else newPlayers.push(player);
        newPlayers.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));
        set({ players: newPlayers });

        if (requestReply && get().isHost) {
          get().channel.send({
            type: 'broadcast',
            event: 'SYNC_PLAYER',
            payload: { player: { userId: get().userId, userName: get().userName, isHost: true }, requestReply: false }
          });
        }
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
      .on('broadcast', { event: 'END_GAME' }, () => {
        if (!get().isHost) {
          useGameStore.getState().stopAudio?.();
          useGameStore.getState().setPhase('final');
        }
      })
      .on('broadcast', { event: 'PLAY_AGAIN' }, () => {
        if (!get().isHost) {
          useGameStore.getState().resetGame();
          useGameStore.getState().setPhase('lobby');
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const playerObj = {
            userId: get().userId,
            userName: get().userName,
            isHost: get().isHost,
            joinedAt: new Date().toISOString()
          };

          const newPlayers = [...get().players];
          if (!newPlayers.find(p => p.userId === playerObj.userId)) {
            newPlayers.push(playerObj);
            newPlayers.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));
            set({ players: newPlayers });
          }

          channel.track(playerObj).catch(() => {});
          channel.send({
            type: 'broadcast',
            event: 'SYNC_PLAYER',
            payload: { player: playerObj, requestReply: !get().isHost }
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
      useGameStore.getState().revealMultiplayerResults();
    }
  },

  broadcastEndGame: () => {
    const { channel, isHost } = get();
    if (channel && isHost) {
      channel.send({
        type: 'broadcast',
        event: 'END_GAME',
        payload: {}
      });
      useGameStore.getState().setPhase('final');
    }
  },

  broadcastPlayAgain: () => {
    const { channel, isHost } = get();
    if (channel && isHost) {
      channel.send({
        type: 'broadcast',
        event: 'PLAY_AGAIN',
        payload: {}
      });
      useGameStore.getState().resetGame();
      useGameStore.getState().setPhase('lobby');
    }
  }
}));
