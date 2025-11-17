import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Chef } from '../types/index';
import { submitVote, markVoterComplete } from '../services/sessionService';

interface VotingInterfaceProps {
  sessionCode: string;
  roundNumber: number;
  currentRoundChefs: Chef[];
  allParticipants: Chef[];
  completedVoters: string[];
  currentVoterName?: string;
}

// Score selector component
const ScoreSelector = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
    <label
      style={{
        fontSize: '1rem',
        fontFamily: 'var(--font-serif)',
        color: 'var(--color-charcoal)',
        minWidth: '110px',
      }}
    >
      {label}
    </label>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
        <button
          key={num}
          onClick={() => onChange(num)}
          style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            minHeight: '40px',
            borderRadius: '0.25rem',
            border: '2px solid var(--color-charcoal)',
            backgroundColor: value === num ? 'var(--color-gold)' : 'transparent',
            color: 'var(--color-charcoal)',
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            padding: 0,
          }}
        >
          {num}
        </button>
      ))}
    </div>
  </div>
);

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
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentChef = currentRoundChefs[currentChefIndex];

  // Filter out voters who have already completed voting in this session
  // AND filter out participants who have no one to vote for (they were the only chef)
  const availableVoters = allParticipants.filter(participant => {
    // Already completed voting
    if (completedVoters.includes(participant.name)) return false;
    
    // Check if this person has anyone to vote for
    const chefsTheyCanVoteFor = currentRoundChefs.filter(chef => chef.name !== participant.name);
    return chefsTheyCanVoteFor.length > 0;
  });

  // Separate chefs and judges for display
  const availableChefs = availableVoters.filter(p => !p.isJudge);
  const availableJudges = availableVoters.filter(p => p.isJudge);

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
      const voteData: any = {
        technique,
        presentation,
        taste,
      };
      
      if (comment.trim()) {
        voteData.comment = comment.trim();
      }
      
      await submitVote(sessionCode, roundNumber, selectedVoter, currentChef.id, voteData);

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
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Reset scores and comment
      setTechnique(5);
      setPresentation(5);
      setTaste(5);
      setComment('');
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
          height: 'auto',
          padding: '2rem',
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}
      >
        <div style={{ maxWidth: '48rem', width: '100%', margin: '0 auto' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Chefs Section */}
            {availableChefs.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {availableChefs.map((participant) => (
                    <button
                      key={participant.id}
                      onClick={() => handleVoterSelect(participant.name)}
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
                      {participant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Judges Section */}
            {availableJudges.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {availableJudges.map((participant) => (
                    <button
                      key={participant.id}
                      onClick={() => handleVoterSelect(participant.name)}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: 'white',
                        border: '2px dashed var(--color-gold)',
                        borderRadius: '0.5rem',
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        color: 'var(--color-charcoal)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
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
                      <span style={{ fontSize: '1.5rem' }}>🍸</span>
                      <span>{participant.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
        height: 'auto',
        padding: '2rem',
        paddingTop: '5rem',
        paddingBottom: '5rem',
      }}
    >
      <div style={{ maxWidth: '48rem', width: '100%', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-charcoal)',
                  margin: 0,
                  marginBottom: '0.25rem',
                }}
              >
                {currentChef.name}
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  color: 'var(--color-charcoal)',
                  opacity: 0.7,
                  margin: 0,
                }}
              >
                {currentChef.dish}
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-charcoal)', opacity: 0.7 }}>
              <div>Voting as: <strong>{selectedVoter}</strong></div>
              <div>Chef {chefsToVoteFor.findIndex(c => c.id === currentChef.id) + 1} of {chefsToVoteFor.length}</div>
            </div>
          </div>

          {/* Scoring */}
          <div style={{ marginBottom: '1.5rem' }}>
            <ScoreSelector label="Technique" value={technique} onChange={setTechnique} />
            <ScoreSelector label="Presentation" value={presentation} onChange={setPresentation} />
            <ScoreSelector label="Taste" value={taste} onChange={setTaste} />

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
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--color-charcoal)',
                  borderRadius: '0.5rem',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  color: 'var(--color-charcoal)',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleSubmitVote}
              disabled={isSubmitting}
              style={{
                flex: '3',
                padding: '1rem 2rem',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-charcoal)',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
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
            
            <button
              onClick={() => {
                setSelectedVoter(null);
                setCurrentChefIndex(0);
                setTechnique(5);
                setPresentation(5);
                setTaste(5);
                setComment('');
              }}
              disabled={isSubmitting}
              style={{
                flex: '1',
                padding: '1rem',
                backgroundColor: 'transparent',
                color: 'var(--color-charcoal)',
                fontFamily: 'var(--font-sans)',
                fontSize: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--color-charcoal)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'var(--color-charcoal)';
                  e.currentTarget.style.color = 'var(--color-cream)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-charcoal)';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VotingInterface;
