import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { SessionDocument, GamePhase } from '../types/index';
import { subscribeToSession, updateGamePhase } from '../services/sessionService';

interface GameContextValue {
  sessionCode: string;
  gameState: SessionDocument | null;
  isLoading: boolean;
  error: string | null;
  updatePhase: (phase: GamePhase) => Promise<void>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

interface GameProviderProps {
  sessionCode: string;
  children: ReactNode;
}

export const GameProvider = ({ sessionCode, children }: GameProviderProps) => {
  const [gameState, setGameState] = useState<SessionDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToSession(
      sessionCode,
      (session) => {
        setGameState(session);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionCode]);

  const updatePhase = async (phase: GamePhase) => {
    try {
      await updateGamePhase(sessionCode, phase);
    } catch (err) {
      console.error('Failed to update game phase:', err);
      throw err;
    }
  };

  const value: GameContextValue = {
    sessionCode,
    gameState,
    isLoading,
    error,
    updatePhase,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
