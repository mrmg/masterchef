import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RestartGameButtonProps {
  onRestartGame: () => void;
  onRestartRound?: () => void;
  showRestartRound?: boolean;
}

const RestartGameButton = ({ onRestartGame, onRestartRound, showRestartRound }: RestartGameButtonProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRestartGame = () => {
    setShowConfirmation(false);
    onRestartGame();
  };

  const handleRestartRound = () => {
    setShowConfirmation(false);
    if (onRestartRound) {
      onRestartRound();
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setShowConfirmation(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-gold)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-charcoal)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
            }}
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  color: 'var(--color-charcoal)',
                  marginBottom: '1rem',
                }}
              >
                Restart Options
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-charcoal)',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5',
                  fontSize: '0.875rem',
                }}
              >
                {showRestartRound 
                  ? 'Restart Round: Reset current round to beginning. Restart Game: Clear all rounds and votes.'
                  : 'This will reset the entire game back to setup. All rounds and votes will be cleared, but your chef list and configuration will be preserved.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {showRestartRound && onRestartRound && (
                  <button
                    onClick={handleRestartRound}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'var(--color-gold)',
                      color: 'var(--color-charcoal)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    Restart Round
                  </button>
                )}
                <button
                  onClick={handleRestartGame}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-burgundy)',
                    color: 'white',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Restart Game
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-cream)',
                    color: 'var(--color-charcoal)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--color-charcoal)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RestartGameButton;
