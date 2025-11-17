import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { validateDisplayName, setDisplayName } from '../utils/cookieUtils';

interface DisplayNamePromptProps {
  onNameSet: (name: string) => void;
  onCancel?: () => void;
}

const DisplayNamePrompt: React.FC<DisplayNamePromptProps> = ({ onNameSet, onCancel }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateDisplayName(name);
    if (!validation.valid) {
      setError(validation.error || 'Invalid name');
      return;
    }

    const success = setDisplayName(name);
    if (success) {
      onNameSet(name);
    } else {
      setError('Failed to save name');
    }
  };

  return (
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-cream)',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            color: 'var(--color-charcoal)',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          What's your name?
        </h2>
        
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-charcoal)',
            opacity: 0.8,
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          Your name will be shown with your photos and videos
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Enter your name"
            autoFocus
            maxLength={30}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: `2px solid ${error ? 'var(--color-burgundy)' : 'var(--color-gold)'}`,
              borderRadius: '0.25rem',
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
          
          {error && (
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-burgundy)',
                marginBottom: '1rem',
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1rem',
            }}
          >
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-sans)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-charcoal)',
                  border: '2px solid var(--color-charcoal)',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-sans)',
                backgroundColor: name.trim() ? 'var(--color-gold)' : 'var(--color-sage)',
                color: 'var(--color-charcoal)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default DisplayNamePrompt;
