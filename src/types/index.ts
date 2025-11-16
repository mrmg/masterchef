import { Timestamp } from 'firebase/firestore';

export enum GamePhase {
  LOBBY = 'LOBBY',
  SETUP = 'SETUP',
  ROUND_READY = 'ROUND_READY',
  ROUND_ACTIVE = 'ROUND_ACTIVE',
  ROUND_COMPLETE = 'ROUND_COMPLETE',
  VOTING = 'VOTING',
  RESULTS_COUNTDOWN = 'RESULTS_COUNTDOWN',
  RESULTS = 'RESULTS',
}

export interface Chef {
  id: string;
  name: string;
  dish: string;
  order: number;
  hasCooked: boolean;
}

export interface CategoryScores {
  technique: number;
  presentation: number;
  taste: number;
}

export interface Vote extends CategoryScores {
  timestamp: Timestamp;
  comment?: string;
}

export interface VoteData {
  [chefId: string]: Vote;
}

export interface RoundVotes {
  [voterName: string]: VoteData;
}

export interface VotingStatus {
  requiredVoters: string[];
  completedVoters: string[];
}

export interface GameConfig {
  simultaneousPlayers: number;
  roundTime: number;
  createdAt: Timestamp;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  currentRoundChefs: string[];
  timerStartTime: Timestamp | null;
  timerEndTime: Timestamp | null;
}

export interface SessionDocument {
  config: GameConfig;
  state: GameState;
  chefs: {
    [chefId: string]: Chef;
  };
  votes: {
    [roundNumber: number]: RoundVotes;
  };
  votingStatus: {
    [roundNumber: number]: VotingStatus;
  };
  photos?: {
    [photoId: string]: Photo;
  };
}

export interface LeaderboardEntry {
  chefId: string;
  chefName: string;
  dish: string;
  totalScore: number;
  techniqueScore: number;
  presentationScore: number;
  tasteScore: number;
  rank: number;
}

export enum ResultView {
  WINNER = 'WINNER',
  OVERALL_LEADERBOARD = 'OVERALL_LEADERBOARD',
  TECHNIQUE_LEADERBOARD = 'TECHNIQUE_LEADERBOARD',
  PRESENTATION_LEADERBOARD = 'PRESENTATION_LEADERBOARD',
  TASTE_LEADERBOARD = 'TASTE_LEADERBOARD',
  VOTE_TABLES = 'VOTE_TABLES',
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  uploadedBy: string;
  timestamp: Timestamp;
  storageRef: string;
  roundNumber: number | null;
  roundChefs: string[];
}
