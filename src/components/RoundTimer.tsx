import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Chef } from '../types/index';
import { Timestamp } from 'firebase/firestore';

interface RoundTimerProps {
  roundTime: number;
  currentChefs: Chef[];
  timerStartTime: Timestamp | null;
  timerEndTime: Timestamp | null;
  onStart: () => void;
  onComplete: () => void;
}

const RoundTimer = ({
  roundTime,
  currentChefs,
  timerStartTime,
  timerEndTime,
  onStart,
  onComplete,
}: RoundTimerProps) => {
  const [remainingTime, setRemainingTime] = useState(roundTime);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (timerStartTime && timerEndTime) {
      setIsActive(true);
      
      const interval = setInterval(() => {
        const now = Date.now();
        const endMs = timerEndTime.toMillis();
        const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
        
        setRemainingTime(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
          setIsActive(false);
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setRemainingTime(roundTime);
      setIsActive(false);
    }
  }, [timerStartTime, timerEndTime, roundTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentRemaining = (remainingTime / roundTime) * 100;
  const isWarning = percentRemaining <= 25;
  const isCritical = percentRemaining <= 5;

  const timerColor = isCritical || isWarning ? 'var(--color-burgundy)' : 'var(--color-gold)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '48rem', width: '100%', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            marginBottom: '2rem',
          }}
        >
          Cooking Round
        </h1>

        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-serif)',
              color: 'var(--color-charcoal)',
              marginBottom: '1rem',
            }}
          >
            Currently Cooking
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: currentChefs.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {currentChefs.map((chef) => (
              <div
                key={chef.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-cream)',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--color-charcoal)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-charcoal)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {chef.name}
                </p>
                <p
                  style={{
                    fontStyle: 'italic',
                    color: 'var(--color-charcoal)',
                    opacity: 0.7,
                  }}
                >
                  {chef.dish}
                </p>
              </div>
            ))}
          </div>

          <motion.div
            animate={{
              scale: isCritical ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isCritical ? Infinity : 0,
            }}
            style={{
              fontSize: '5rem',
              fontFamily: 'var(--font-serif)',
              color: timerColor,
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            {formatTime(remainingTime)}
          </motion.div>

          {!isActive && remainingTime === roundTime && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={onStart}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: 'var(--color-gold)',
                  color: 'var(--color-charcoal)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Start Timer
              </button>
            </div>
          )}

          {isActive && (
            <button
              onClick={onRestart}
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
                marginTop: '1rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Restart Round
            </button>
          )}

          {!isActive && remainingTime === 0 && (
            <div>
              <p
                style={{
                  fontSize: '2rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-burgundy)',
                  marginBottom: '1rem',
                }}
              >
                Time's Up!
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={onComplete}
                  style={{
                    padding: '1rem 2rem',
                    backgroundColor: 'var(--color-gold)',
                    color: 'var(--color-charcoal)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Continue
                </button>
                <button
                  onClick={onRestart}
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
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Restart Round
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoundTimer;
