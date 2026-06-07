import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../../store/useMultiplayerStore.js';
import { useGameStore } from '../../store/useGameStore.js';

export default function LobbyScreen({ globeRef }) {
  const { roomId, isHost, players, userName, setUserName, leaveRoom } = useMultiplayerStore();
  const startRound = useGameStore(state => state.startRound);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (userName) setNameInput(userName);
  }, [userName]);

  const handleNameChange = (e) => {
    setNameInput(e.target.value);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
    }
  };

  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute bg-black/60 backdrop-blur-md inset-0 z-50 flex flex-col items-center justify-center p-6"
    >
      <div className="bg-black/40 border border-white/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <h2 className="text-3xl text-white font-bold tracking-tight mb-2">Room: {roomId}</h2>
        
        <div className="mb-6">
          <p className="text-white/60 text-sm mb-2">Invite your friends via this link:</p>
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded px-3 py-2">
            <input 
              readOnly 
              value={inviteLink}
              className="bg-transparent text-white/80 w-full outline-none text-sm"
            />
            <button 
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="text-xs bg-white text-black px-2 py-1 rounded font-bold hover:bg-gray-200"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <input 
            value={nameInput}
            onChange={handleNameChange}
            placeholder="Your Name"
            className="bg-black/50 border border-white/30 text-white rounded px-3 py-2 w-full outline-none"
          />
          <button 
            onClick={handleSaveName}
            className="bg-white/20 text-white px-4 py-2 rounded hover:bg-white/30 transition-colors font-medium"
          >
            Save
          </button>
        </div>

        <div className="mb-8 text-left">
          <h3 className="text-white font-semibold mb-3 border-b border-white/10 pb-2">Players in Room ({players.length})</h3>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {players.map((p, idx) => (
              <li key={idx} className="flex items-center gap-2 text-white/90">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{p.userName} {p.isHost ? '(Host)' : ''}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <button 
            onClick={leaveRoom}
            className="px-6 py-2 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            Leave
          </button>

          {isHost ? (
            <button 
              onClick={() => startRound(globeRef)}
              className="px-6 py-2 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
            >
              Start Game
            </button>
          ) : (
            <div className="px-6 py-2 text-white/60 flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></span>
              Waiting for Host
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
