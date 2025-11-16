import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MuteButton = () => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem('masterchef_muted');
    if (savedMuteState === 'true') {
      setIsMuted(true);
    }
  }, []);

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('masterchef_muted', newMuteState.toString());
    
    // Dispatch custom event so RoundTimer can listen
    window.dispatchEvent(new CustomEvent('muteToggle', { detail: { muted: newMuteState } }));
  };

  return (
    <motion.button
      onClick={toggleMute}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '5rem',
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
      {isMuted ? (
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
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
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
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </motion.button>
  );
};

export default MuteButton;
