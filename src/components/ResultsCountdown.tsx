import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ResultsCountdownProps {
  onComplete: () => void;
}

const ResultsCountdown = ({ onComplete }: ResultsCountdownProps) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  const isFlashing = countdown <= 5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-charcoal)',
      }}
    >
      <motion.div
        animate={{
          scale: isFlashing ? [1, 1.1, 1] : 1,
          opacity: isFlashing ? [1, 0.7, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: isFlashing ? Infinity : 0,
        }}
        style={{ textAlign: 'center' }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            marginBottom: '2rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Results In
        </h1>
        <div
          style={{
            fontSize: '8rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            fontWeight: 'bold',
            lineHeight: 1,
          }}
        >
          {countdown}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultsCountdown;
