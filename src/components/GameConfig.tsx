import { useState } from 'react';
import { motion } from 'framer-motion';
import { updateGameConfig } from '../services/sessionService';

interface GameConfigProps {
  sessionCode: string;
  onComplete: (simultaneousPlayers: number, roundTime: number) => void;
}

const GameConfig = ({ sessionCode, onComplete }: GameConfigProps) => {
  const [simultaneousPlayers, setSimultaneousPlayers] = useState(2);
  const [roundTime, setRoundTime] = useState(1200); // 20 minutes in seconds

  const roundTimeOptions = [
    { label: '1 minute (testing)', value: 60 },
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
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'var(--color-cream)',
                    color: 'var(--color-charcoal)',
                    border: `2px solid ${simultaneousPlayers === num ? 'var(--color-gold)' : 'var(--color-charcoal)'}`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (simultaneousPlayers !== num) {
                      e.currentTarget.style.backgroundColor = 'var(--color-charcoal)';
                      e.currentTarget.style.color = 'var(--color-cream)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-cream)';
                    e.currentTarget.style.color = 'var(--color-charcoal)';
                  }}
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
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-charcoal)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Start Game
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GameConfig;
