import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updateGameConfig } from '../services/sessionService';
import { useGame } from '../contexts/GameContext';

interface GameConfigProps {
  sessionCode: string;
  onComplete: (simultaneousPlayers: number, roundTime: number) => void;
}

const GameConfig = ({ sessionCode, onComplete }: GameConfigProps) => {
  const { gameState } = useGame();
  const [simultaneousPlayers, setSimultaneousPlayers] = useState(2);
  const [roundTime, setRoundTime] = useState(1200); // 20 minutes in seconds

  // Sync local state with Firebase
  useEffect(() => {
    if (gameState?.config) {
      setSimultaneousPlayers(gameState.config.simultaneousPlayers);
      setRoundTime(gameState.config.roundTime);
    }
  }, [gameState?.config]);

  const roundTimeOptions = [
    { label: '5 seconds (testing)', value: 5 },
    { label: '5 minutes', value: 300 },
    { label: '10 minutes', value: 600 },
    { label: '15 minutes', value: 900 },
    { label: '20 minutes', value: 1200 },
    { label: '25 minutes', value: 1500 },
    { label: '30 minutes', value: 1800 },
    { label: '35 minutes', value: 2100 },
    { label: '40 minutes', value: 2400 },
    { label: '45 minutes', value: 2700 },
    { label: '50 minutes', value: 3000 },
    { label: '55 minutes', value: 3300 },
    { label: '60 minutes', value: 3600 },
  ];

  const handleSimultaneousPlayersChange = async (value: number) => {
    setSimultaneousPlayers(value);
    await updateGameConfig(sessionCode, value, roundTime);
  };

  const handleRoundTimeChange = async (value: number) => {
    setRoundTime(value);
    await updateGameConfig(sessionCode, simultaneousPlayers, value);
  };

  const handleSubmit = () => {
    onComplete(simultaneousPlayers, roundTime);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl text-gold mb-4">Game Configuration</h1>
          <div className="inline-block px-6 py-3 bg-charcoal text-cream rounded-lg">
            <p className="text-sm mb-1">Session Code</p>
            <p className="text-3xl font-serif tracking-wider">{sessionCode}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6 bg-white p-8 rounded-lg shadow-lg"
        >
          <div>
            <label className="block text-lg font-serif mb-3 text-charcoal">
              Simultaneous Players
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => handleSimultaneousPlayersChange(num)}
                  className={`py-3 rounded-lg font-serif text-xl transition-all ${
                    simultaneousPlayers === num
                      ? 'bg-gold text-charcoal'
                      : 'bg-cream text-charcoal border-2 border-charcoal hover:bg-charcoal hover:text-cream'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-serif mb-3 text-charcoal">
              Round Time
            </label>
            <select
              value={roundTime}
              onChange={(e) => handleRoundTimeChange(Number(e.target.value))}
              className="w-full py-3 px-4 border-2 border-charcoal rounded-lg bg-cream text-charcoal font-serif text-lg focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {roundTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-4 px-6 bg-gold text-charcoal font-serif text-xl rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
          >
            Start Game
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GameConfig;
