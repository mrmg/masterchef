import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SessionDocument, LeaderboardEntry } from '../types/index';
import { calculateLeaderboards, getWinner, getCategoryLeaderboard } from '../utils/results';

interface ResultsDisplayProps {
  gameState: SessionDocument;
}

type ViewType = 'winner' | 'overall' | 'technique' | 'presentation' | 'taste' | 'votes';

const ResultsDisplay = ({ gameState }: ResultsDisplayProps) => {
  const [currentView, setCurrentView] = useState<ViewType>('winner');

  const leaderboard = calculateLeaderboards(gameState);
  const winner = getWinner(leaderboard);

  const renderWinner = () => {
    if (!winner) return null;

    // Get top comments for the winner
    const winnerComments: Array<{ voter: string; comment: string | undefined; totalScore: number }> = [];
    Object.values(gameState.votes).forEach((roundVotes) => {
      Object.entries(roundVotes).forEach(([voterName, voterVotes]) => {
        if (voterVotes[winner.chefId]?.comment) {
          const vote = voterVotes[winner.chefId];
          winnerComments.push({
            voter: voterName,
            comment: vote.comment,
            totalScore: vote.technique + vote.presentation + vote.taste,
          });
        }
      });
    });

    // Sort by score and take top 2
    const topComments = winnerComments
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 2);

    return (
      <motion.div
        key="winner"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{ textAlign: 'center' }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            marginBottom: '1rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Winner
        </h2>
        <h1
          style={{
            fontSize: '4rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            marginBottom: '1rem',
          }}
        >
          {winner.chefName}
        </h1>
        <p
          style={{
            fontSize: '1.5rem',
            fontStyle: 'italic',
            color: 'var(--color-charcoal)',
            marginBottom: '2rem',
          }}
        >
          {winner.dish}
        </p>
        <div
          style={{
            fontSize: '3rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-charcoal)',
            marginBottom: '2rem',
          }}
        >
          {winner.totalScore} points
        </div>

        {topComments.length > 0 && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {topComments.map((comment, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--color-cream)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  border: '2px solid var(--color-gold)',
                }}
              >
                <p
                  style={{
                    fontStyle: 'italic',
                    color: 'var(--color-charcoal)',
                    marginBottom: '0.5rem',
                    fontSize: '1.125rem',
                  }}
                >
                  "{comment.comment}"
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-charcoal)',
                    opacity: 0.7,
                  }}
                >
                  — {comment.voter}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderLeaderboard = (entries: LeaderboardEntry[], title: string, scoreKey?: keyof LeaderboardEntry) => {
    return (
      <motion.div
        key={title}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <h2
          style={{
            fontSize: '2rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          {title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.chefId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: index === 0 ? 'var(--color-gold)' : 'white',
                borderRadius: '0.5rem',
                border: '2px solid var(--color-charcoal)',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontFamily: 'var(--font-serif)',
                  color: index === 0 ? 'var(--color-charcoal)' : 'var(--color-gold)',
                  minWidth: '3rem',
                  textAlign: 'center',
                }}
              >
                #{index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '1.25rem',
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--color-charcoal)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {entry.chefName}
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontStyle: 'italic',
                    color: 'var(--color-charcoal)',
                    opacity: 0.7,
                  }}
                >
                  {entry.dish}
                </p>
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-charcoal)',
                  fontWeight: 'bold',
                }}
              >
                {scoreKey ? entry[scoreKey] : entry.totalScore}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderVoteTables = () => {
    return (
      <motion.div
        key="votes"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <h2
          style={{
            fontSize: '2rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          Detailed Votes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {leaderboard.map((chef) => {
            const chefVotes: Array<{ voter: string; technique: number; presentation: number; taste: number; comment?: string }> = [];
            
            Object.values(gameState.votes).forEach((roundVotes) => {
              Object.entries(roundVotes).forEach(([voterName, voterVotes]) => {
                if (voterVotes[chef.chefId]) {
                  chefVotes.push({
                    voter: voterName,
                    technique: voterVotes[chef.chefId].technique,
                    presentation: voterVotes[chef.chefId].presentation,
                    taste: voterVotes[chef.chefId].taste,
                    comment: voterVotes[chef.chefId].comment,
                  });
                }
              });
            });

            // Sort votes by total score descending
            chefVotes.sort((a, b) => {
              const totalA = a.technique + a.presentation + a.taste;
              const totalB = b.technique + b.presentation + b.taste;
              return totalB - totalA;
            });

            return (
              <div
                key={chef.chefId}
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--color-charcoal)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--color-charcoal)',
                    marginBottom: '1rem',
                  }}
                >
                  {chef.chefName} - {chef.dish}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chefVotes.map((vote, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: 'var(--color-cream)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--color-charcoal)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--color-charcoal)' }}>
                          {vote.voter}
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>
                          {vote.technique + vote.presentation + vote.taste}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-charcoal)' }}>
                        <span>Technique: {vote.technique}</span>
                        <span>Presentation: {vote.presentation}</span>
                        <span>Taste: {vote.taste}</span>
                      </div>
                      {vote.comment && (
                        <div style={{ 
                          fontStyle: 'italic', 
                          color: 'var(--color-charcoal)', 
                          opacity: 0.8,
                          fontSize: '0.875rem',
                          marginTop: '0.5rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid rgba(0,0,0,0.1)',
                        }}>
                          "{vote.comment}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        paddingTop: '5rem',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
        {[
          { key: 'winner', label: 'Winner' },
          { key: 'overall', label: 'Overall' },
          { key: 'technique', label: 'Technique' },
          { key: 'presentation', label: 'Presentation' },
          { key: 'taste', label: 'Taste' },
          { key: 'votes', label: 'Votes' },
        ].map((view) => (
          <button
            key={view.key}
            onClick={() => setCurrentView(view.key as ViewType)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: currentView === view.key ? 'var(--color-gold)' : 'white',
              color: 'var(--color-charcoal)',
              fontFamily: 'var(--font-serif)',
              border: '2px solid var(--color-charcoal)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, maxWidth: '64rem', width: '100%', margin: '0 auto', overflowY: 'auto', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {currentView === 'winner' && renderWinner()}
          {currentView === 'overall' && renderLeaderboard(leaderboard, 'Overall Leaderboard')}
          {currentView === 'technique' && renderLeaderboard(getCategoryLeaderboard(leaderboard, 'technique'), 'Technique Leaderboard', 'techniqueScore')}
          {currentView === 'presentation' && renderLeaderboard(getCategoryLeaderboard(leaderboard, 'presentation'), 'Presentation Leaderboard', 'presentationScore')}
          {currentView === 'taste' && renderLeaderboard(getCategoryLeaderboard(leaderboard, 'taste'), 'Taste Leaderboard', 'tasteScore')}
          {currentView === 'votes' && renderVoteTables()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResultsDisplay;
