import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Chef } from '../types/index';
import { submitVote, markVoterComplete } from '../services/sessionService';

interface VotingInterfaceProps {
  sessionCode: string;
  roundNumber: number;
  currentRoundChefs: Chef[];
  allParticipants: string[];
  completedVoters: string[];
  currentVoterName?: string;
}

const VotingInterface = ({
  sessionCode,
  roundNumber,
  currentRoundChefs,
  allParticipants,
  completedVoters,
  currentVoterName: initialVoter,
}: VotingInterfaceProps) => {
  const [selectedVoter, setSelectedVoter] = useState<string | null>(initialVoter || null);
  const [currentChefIndex, setCurrentChefIndex] = useState(0);
  const [technique, setTechnique] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [taste, setTaste] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentChef = currentRoundChefs[currentChefIndex];
  const isLastChef = currentChefIndex === currentRoundChefs.length - 1;

  // Filter out voters who have already completed voting in this session
  // AND filter out participants who have no one to vote for (they were the only chef)
  const availableVoters = allParticipants.filter(name => {
    // Already completed voting
    if (completedVoters.includes(name)) return false;
    
    // Check if this person has anyone to vote for
    const chefsTheyCanVoteFor = currentRoundChefs.filter(chef => chef.name !== name);
    return chefsTheyCanVoteFor.length > 0;
  });

  // Get chefs that the selected voter can vote for (exclude themselves)
  const chefsToVoteFor = selectedVoter 
    ? currentRoundChefs.filter(chef => chef.name !== selectedVoter)
    : currentRoundChefs;

  const handleVoterSelect = (voterName: string) => {
    setSelectedVoter(voterName);
    // Reset to first chef they can vote for
    const chefsForVoter = currentRoundChefs.filter(chef => chef.name !== voterName);
    setCurrentChefIndex(currentRoundChefs.findIndex(chef => chef.id === chefsForVoter[0]?.id) || 0);
  };

  const handleSubmitVote = async () => {
    if (!selectedVoter || !currentChef) return;

    setIsSubmitting(true);

    try {
      await submitVote(sessionCode, roundNumber, selectedVoter, currentChef.id, {
        technique,
        presentation,
        taste,
      });

      // Find next chef this voter can vote for
      const nextChefIndex = currentRoundChefs.findIndex((chef, idx) => 
        idx > currentChefIndex && chef.name !== selectedVoter
      );

      if (nextChefIndex === -1) {
        // No more chefs to vote for - mark voter as complete
        await markVoterComplete(sessionCode, roundNumber, selectedVoter);
        
        // Reset to voter selection
        setSelectedVoter(null);
        setCurrentChefIndex(0);
      } else {
        // Move to next chef
        setCurrentChefIndex(nextChefIndex);
      }

      // Reset scores
      setTechnique(5);
      setPresentation(5);
      setTaste(5);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedVoter) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '48rem', width: '100%' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontFamily: 'var(--font-serif)',
              color: 'var(--color-gold)',
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            Who are you?
          </h1>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {availableVoters.map((name) => (
              <button
                key={name}
                onClick={() => handleVoterSelect(name)}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  border: '2px solid var(--color-charcoal)',
                  borderRadius: '0.5rem',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  color: 'var(--color-charcoal)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '48rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
            Voting as: <strong>{selectedVoter}</strong>
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal)', opacity: 0.7 }}>
            Chef {chefsToVoteFor.findIndex(c => c.id === currentChef.id) + 1} of {chefsToVoteFor.length}
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-charcoal)',
                marginBottom: '0.5rem',
              }}
            >
              {currentChef.name}
            </h2>
            <p
              style={{
                fontSize: '1.25rem',
                fontStyle: 'italic',
                color: 'var(--color-charcoal)',
                opacity: 0.7,
              }}
            >
              {currentChef.dish}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '1.125rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-charcoal)',
                  marginBottom: '0.5rem',
                }}
              >
                Technique: {technique}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={technique}
                onChange={(e) => setTechnique(Number(e.target.value))}
                style={{ width: '100%', height: '8px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '1.125rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-charcoal)',
                  marginBottom: '0.5rem',
                }}
              >
                Presentation: {presentation}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={presentation}
                onChange={(e) => setPresentation(Number(e.target.value))}
                style={{ width: '100%', height: '8px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '1.125rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-charcoal)',
                  marginBottom: '0.5rem',
                }}
              >
                Taste: {taste}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={taste}
                onChange={(e) => setTaste(Number(e.target.value))}
                style={{ width: '100%', height: '8px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmitVote}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-charcoal)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isSubmitting ? 'Submitting...' : 
             chefsToVoteFor.findIndex(c => c.id === currentChef.id) === chefsToVoteFor.length - 1 
               ? 'Submit Final Vote' 
               : 'Next Chef'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VotingInterface;
