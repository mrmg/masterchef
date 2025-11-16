import { useState } from 'react';
import SessionManager from './components/SessionManager';
import ContestantManager from './components/ContestantManager';
import RoundTimer from './components/RoundTimer';
import VotingInterface from './components/VotingInterface';
import ResultsCountdown from './components/ResultsCountdown';
import ResultsDisplay from './components/ResultsDisplay';
import RestartGameButton from './components/RestartGameButton';
import PhotoGalleryButton from './components/PhotoGalleryButton';
import PhotoNotification from './components/PhotoNotification';
import MuteButton from './components/MuteButton';
import { GameProvider, useGame } from './contexts/GameContext';
import { GamePhase } from './types/index';
import { getNextRoundChefs, getChefsByIds, hasMoreRounds, getAllParticipantNames } from './utils/gamePhases';
import { prepareRound, startTimer, completeRound, updateGamePhase, initializeVotingStatus, restartRound, restartGame } from './services/sessionService';

const GameContent = () => {
  const { gameState, isLoading, sessionCode } = useGame();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>
          Session not found
        </div>
      </div>
    );
  }

  const { phase, currentRound, currentRoundChefs, timerStartTime, timerEndTime } = gameState.state;
  const { simultaneousPlayers, roundTime } = gameState.config;

  const handleStartGame = async () => {
    const nextChefIds = getNextRoundChefs(gameState.chefs, simultaneousPlayers);
    if (nextChefIds.length > 0) {
      await prepareRound(sessionCode, 1, nextChefIds);
    }
  };

  const handleStartTimer = async () => {
    await startTimer(sessionCode, roundTime);
  };

  const handleRoundComplete = async () => {
    await completeRound(sessionCode);
    
    // Initialize voting status - only include participants who have someone to vote for
    const participants = getAllParticipantNames(gameState.chefs);
    const chefs = getChefsByIds(gameState.chefs, currentRoundChefs);
    
    // Filter to only include voters who have at least one chef to vote for
    const eligibleVoters = participants.filter(participantName => {
      const chefsTheyCanVoteFor = chefs.filter(chef => chef.name !== participantName);
      return chefsTheyCanVoteFor.length > 0;
    });
    
    await initializeVotingStatus(sessionCode, currentRound, eligibleVoters);
    
    // Move to voting phase
    await updateGamePhase(sessionCode, GamePhase.VOTING);
  };

  const handleRestartRound = async () => {
    await restartRound(sessionCode);
  };

  const handleRestartGame = async () => {
    await restartGame(sessionCode);
  };

  const showRestartGameButton = phase !== GamePhase.SETUP && phase !== GamePhase.LOBBY;

  const handleVotingComplete = async () => {
    // Check if there are more chefs to cook
    if (hasMoreRounds(gameState.chefs)) {
      // Prepare next round
      const nextChefIds = getNextRoundChefs(gameState.chefs, simultaneousPlayers);
      if (nextChefIds.length > 0) {
        await prepareRound(sessionCode, currentRound + 1, nextChefIds);
      }
    } else {
      // All chefs have cooked, go to results
      await updateGamePhase(sessionCode, GamePhase.RESULTS_COUNTDOWN);
    }
  };

  if (phase === GamePhase.SETUP) {
    const uploaderName = 'User';
    return (
      <>
        <ContestantManager
          sessionCode={sessionCode}
          chefs={gameState.chefs}
          onContinue={handleStartGame}
        />
        <PhotoGalleryButton 
          sessionCode={sessionCode} 
          gameState={gameState}
          uploaderName={uploaderName}
          currentPhase={phase}
          currentRound={currentRound}
          currentRoundChefs={currentRoundChefs}
        />
        <PhotoNotification gameState={gameState} currentUserName={uploaderName} />
      </>
    );
  }

  // Show restart game button for all phases after SETUP
  const content = (() => {

    if (phase === GamePhase.ROUND_READY || phase === GamePhase.ROUND_ACTIVE || phase === GamePhase.ROUND_COMPLETE) {
      const chefs = getChefsByIds(gameState.chefs, currentRoundChefs);
      return (
        <RoundTimer
          roundTime={roundTime}
          currentChefs={chefs}
          timerStartTime={timerStartTime}
          timerEndTime={timerEndTime}
          onStart={handleStartTimer}
          onComplete={handleRoundComplete}
        />
      );
    }

    if (phase === GamePhase.VOTING) {
      const chefs = getChefsByIds(gameState.chefs, currentRoundChefs);
      const participants = getAllParticipantNames(gameState.chefs);
      const votingStatus = gameState.votingStatus[currentRound];
      
      // Check if all votes are received
      // This includes the case where there are no eligible voters (requiredVoters is empty)
      const allVoted = votingStatus && 
        votingStatus.completedVoters.length === votingStatus.requiredVoters.length;

      // If there are no eligible voters or all have voted, show completion screen
      if (allVoted || (votingStatus && votingStatus.requiredVoters.length === 0)) {
        return (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-gold)', marginBottom: '2rem' }}>
                {votingStatus && votingStatus.requiredVoters.length === 0 
                  ? 'No Voting Required!' 
                  : 'All Votes Received!'}
              </h1>
              <button
                onClick={handleVotingComplete}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: 'var(--color-gold)',
                  color: 'var(--color-charcoal)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {hasMoreRounds(gameState.chefs) ? 'Start Next Round' : 'View Results'}
              </button>
            </div>
          </div>
        );
      }

      return (
        <VotingInterface
          sessionCode={sessionCode}
          roundNumber={currentRound}
          currentRoundChefs={chefs}
          allParticipants={participants}
          completedVoters={votingStatus?.completedVoters || []}
        />
      );
    }

    if (phase === GamePhase.RESULTS_COUNTDOWN) {
      return (
        <ResultsCountdown
          onComplete={() => updateGamePhase(sessionCode, GamePhase.RESULTS)}
        />
      );
    }

    if (phase === GamePhase.RESULTS) {
      return <ResultsDisplay gameState={gameState} />;
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>
          Game Phase: {phase}
        </div>
      </div>
    );
  })();

  // Show photo feed in all phases
  const showPhotoFeed = phase !== GamePhase.LOBBY;
  const uploaderName = 'User'; // Default name, could be enhanced to ask for name

  return (
    <>
      {content}
      {showRestartGameButton && (
        <>
          <RestartGameButton 
            onRestartGame={handleRestartGame}
            onRestartRound={handleRestartRound}
            showRestartRound={phase === GamePhase.ROUND_READY || phase === GamePhase.ROUND_ACTIVE || phase === GamePhase.ROUND_COMPLETE}
          />
          <MuteButton />
        </>
      )}
      {showPhotoFeed && (
        <>
          <PhotoGalleryButton 
            sessionCode={sessionCode} 
            gameState={gameState}
            uploaderName={uploaderName}
            currentPhase={phase}
            currentRound={currentRound}
            currentRoundChefs={currentRoundChefs}
          />
          <PhotoNotification gameState={gameState} currentUserName={uploaderName} />
        </>
      )}
    </>
  );
};

function App() {
  const [sessionCode, setSessionCode] = useState<string | null>(null);

  if (!sessionCode) {
    return <SessionManager onSessionJoined={setSessionCode} />;
  }

  return (
    <GameProvider sessionCode={sessionCode}>
      <GameContent />
    </GameProvider>
  );
}

export default App;
