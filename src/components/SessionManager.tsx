import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateUniqueSessionCode } from '../utils/sessionCode';
import { createSession, getSession } from '../services/sessionService';
import GameConfig from './GameConfig';

interface SessionManagerProps {
  onSessionJoined: (sessionCode: string) => void;
}

const SessionManager = ({ onSessionJoined }: SessionManagerProps) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [sessionCode, setSessionCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for session code in URL fragment
    const hash = window.location.hash.substring(1);
    if (hash) {
      handleJoinSession(hash);
    }
  }, []);

  const handleCreateSession = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const code = await generateUniqueSessionCode();
      setSessionCode(code);
      setMode('create');
      
      // Update URL with session code
      window.location.hash = code;
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async (code: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const session = await getSession(code.toUpperCase());
      
      if (session) {
        onSessionJoined(code.toUpperCase());
      } else {
        setError('Session not found. Please check the code and try again.');
      }
    } catch (err) {
      setError('Failed to join session. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClick = () => {
    if (joinCode.trim()) {
      handleJoinSession(joinCode.trim());
    }
  };

  const handleConfigComplete = (simultaneousPlayers: number, roundTime: number) => {
    createSession(sessionCode, simultaneousPlayers, roundTime)
      .then(() => {
        onSessionJoined(sessionCode);
      })
      .catch((err) => {
        setError('Failed to initialize session. Please try again.');
        console.error(err);
      });
  };

  if (mode === 'create' && sessionCode) {
    return (
      <GameConfig
        sessionCode={sessionCode}
        onComplete={handleConfigComplete}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ 
            fontSize: '3rem', 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            color: 'var(--color-gold)',
            fontFamily: 'var(--font-serif)'
          }}
        >
          MasterChef Game
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            textAlign: 'center',
            marginBottom: '2.5rem',
            padding: '0 1rem',
            fontFamily: 'var(--font-sans)',
            fontStyle: 'italic',
            color: 'var(--color-charcoal)',
            opacity: 0.8,
            lineHeight: '1.6',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0' }}>
            Welcome to our culinary competition
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            Where passion meets precision, and every dish tells a story
          </p>
        </motion.div>

        {mode === 'select' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <button
              onClick={handleCreateSession}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-charcoal)',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isLoading ? 'Creating...' : 'Create New Game'}
            </button>

            <button
              onClick={() => setMode('join')}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--color-gold)',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--color-gold)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                e.currentTarget.style.color = 'var(--color-charcoal)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-gold)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Join Existing Game
            </button>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter Session Code"
              maxLength={6}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontFamily: 'var(--font-serif)',
                border: '2px solid var(--color-gold)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--color-cream)',
                color: 'var(--color-charcoal)',
              }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setMode('select')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--color-charcoal)',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--color-charcoal)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-charcoal)';
                  e.currentTarget.style.color = 'var(--color-cream)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-charcoal)';
                }}
              >
                Back
              </button>
              <button
                onClick={handleJoinClick}
                disabled={isLoading || !joinCode.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--color-gold)',
                  color: 'var(--color-charcoal)',
                  fontFamily: 'var(--font-serif)',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: (isLoading || !joinCode.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || !joinCode.trim()) ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: '1rem',
              color: 'var(--color-burgundy)',
              textAlign: 'center',
            }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default SessionManager;
