import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SessionDocument, Chef } from '../types/index';
import { GamePhase } from '../types/index';

interface CategoryScores {
  technique: number;
  presentation: number;
  taste: number;
  comment?: string;
}

const SESSIONS_COLLECTION = 'sessions';

export const createSession = async (
  sessionCode: string,
  simultaneousPlayers: number,
  roundTime: number
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  const sessionData: SessionDocument = {
    config: {
      simultaneousPlayers,
      roundTime,
      createdAt: Timestamp.now(),
    },
    state: {
      phase: GamePhase.SETUP,
      currentRound: 0,
      currentRoundChefs: [],
      timerStartTime: null,
      timerEndTime: null,
    },
    chefs: {},
    votes: {},
    votingStatus: {},
  };

  await setDoc(sessionRef, sessionData);
};

export const getSession = async (sessionCode: string): Promise<SessionDocument | null> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  const sessionSnap = await getDoc(sessionRef);
  
  if (sessionSnap.exists()) {
    return sessionSnap.data() as SessionDocument;
  }
  
  return null;
};

export const subscribeToSession = (
  sessionCode: string,
  callback: (session: SessionDocument | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SessionDocument);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to session:', error);
      if (onError) {
        onError(error);
      }
    }
  );
};

export const updateGamePhase = async (
  sessionCode: string,
  phase: GamePhase
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  await updateDoc(sessionRef, {
    'state.phase': phase,
  });
};

export const addChef = async (
  sessionCode: string,
  chef: Chef
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  await updateDoc(sessionRef, {
    [`chefs.${chef.id}`]: chef,
  });
};

export const deleteChef = async (
  sessionCode: string,
  _chefId: string,
  remainingChefs: { [chefId: string]: Chef }
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  await updateDoc(sessionRef, {
    chefs: remainingChefs,
  });
};

export const updateChefOrder = async (
  sessionCode: string,
  chefs: { [chefId: string]: Chef }
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  await updateDoc(sessionRef, {
    chefs,
  });
};

export const startRound = async (
  sessionCode: string,
  roundNumber: number,
  chefIds: string[],
  roundTime: number
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  const now = Timestamp.now();
  const endTime = Timestamp.fromMillis(now.toMillis() + roundTime * 1000);
  
  await updateDoc(sessionRef, {
    'state.phase': GamePhase.ROUND_ACTIVE,
    'state.currentRound': roundNumber,
    'state.currentRoundChefs': chefIds,
    'state.timerStartTime': now,
    'state.timerEndTime': endTime,
  });
  
  // Mark chefs as having cooked
  const updates: { [key: string]: boolean } = {};
  chefIds.forEach(chefId => {
    updates[`chefs.${chefId}.hasCooked`] = true;
  });
  
  await updateDoc(sessionRef, updates);
};

export const completeRound = async (sessionCode: string): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  await updateDoc(sessionRef, {
    'state.phase': GamePhase.ROUND_COMPLETE,
  });
};

export const submitVote = async (
  sessionCode: string,
  roundNumber: number,
  voterName: string,
  chefId: string,
  scores: CategoryScores
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  await runTransaction(db, async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }
    
    // Build vote object, only including comment if it exists
    const voteData: any = {
      technique: scores.technique,
      presentation: scores.presentation,
      taste: scores.taste,
      timestamp: Timestamp.now(),
    };
    
    if (scores.comment) {
      voteData.comment = scores.comment;
    }
    
    transaction.update(sessionRef, {
      [`votes.${roundNumber}.${voterName}.${chefId}`]: voteData,
    });
  });
};

export const markVoterComplete = async (
  sessionCode: string,
  roundNumber: number,
  voterName: string
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  const sessionDoc = await getDoc(sessionRef);
  
  if (!sessionDoc.exists()) {
    throw new Error('Session not found');
  }
  
  const session = sessionDoc.data() as SessionDocument;
  const votingStatus = session.votingStatus[roundNumber] || {
    requiredVoters: [],
    completedVoters: [],
  };
  
  if (!votingStatus.completedVoters.includes(voterName)) {
    votingStatus.completedVoters.push(voterName);
  }
  
  await updateDoc(sessionRef, {
    [`votingStatus.${roundNumber}`]: votingStatus,
  });
};

export const initializeVotingStatus = async (
  sessionCode: string,
  roundNumber: number,
  voterNames: string[]
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  await updateDoc(sessionRef, {
    [`votingStatus.${roundNumber}`]: {
      requiredVoters: voterNames,
      completedVoters: [],
    },
  });
};

export const updateGameConfig = async (
  sessionCode: string,
  simultaneousPlayers: number,
  roundTime: number
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  await updateDoc(sessionRef, {
    'config.simultaneousPlayers': simultaneousPlayers,
    'config.roundTime': roundTime,
  });
};

export const prepareRound = async (
  sessionCode: string,
  roundNumber: number,
  chefIds: string[]
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  // Mark chefs as having cooked
  const updates: { [key: string]: any } = {
    'state.phase': GamePhase.ROUND_READY,
    'state.currentRound': roundNumber,
    'state.currentRoundChefs': chefIds,
    'state.timerStartTime': null,
    'state.timerEndTime': null,
  };
  
  chefIds.forEach(chefId => {
    updates[`chefs.${chefId}.hasCooked`] = true;
  });
  
  await updateDoc(sessionRef, updates);
};

export const startTimer = async (
  sessionCode: string,
  roundTime: number
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  const now = Timestamp.now();
  const endTime = Timestamp.fromMillis(now.toMillis() + roundTime * 1000);
  
  await updateDoc(sessionRef, {
    'state.phase': GamePhase.ROUND_ACTIVE,
    'state.timerStartTime': now,
    'state.timerEndTime': endTime,
  });
};

export const restartRound = async (sessionCode: string): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  await updateDoc(sessionRef, {
    'state.phase': GamePhase.ROUND_READY,
    'state.timerStartTime': null,
    'state.timerEndTime': null,
  });
};

export const restartGame = async (sessionCode: string): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  const sessionDoc = await getDoc(sessionRef);
  
  if (!sessionDoc.exists()) {
    throw new Error('Session not found');
  }
  
  const session = sessionDoc.data() as SessionDocument;
  
  // Reset all chefs to hasCooked: false
  const updatedChefs: { [key: string]: Chef } = {};
  Object.entries(session.chefs).forEach(([chefId, chef]) => {
    updatedChefs[chefId] = {
      ...chef,
      hasCooked: false,
    };
  });
  
  // Clear all game state but preserve config and chefs
  await updateDoc(sessionRef, {
    'state.phase': GamePhase.SETUP,
    'state.currentRound': 0,
    'state.currentRoundChefs': [],
    'state.timerStartTime': null,
    'state.timerEndTime': null,
    chefs: updatedChefs,
    votes: {},
    votingStatus: {},
  });
};

export const addPhoto = async (
  sessionCode: string,
  photoId: string,
  url: string,
  thumbnailUrl: string,
  uploadedBy: string,
  storageRef: string,
  roundNumber: number | null,
  roundChefs: string[]
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  await updateDoc(sessionRef, {
    [`photos.${photoId}`]: {
      id: photoId,
      url,
      thumbnailUrl,
      uploadedBy,
      timestamp: Timestamp.now(),
      storageRef,
      roundNumber,
      roundChefs,
    },
  });
};

export const addMedia = async (
  sessionCode: string,
  mediaId: string,
  type: 'photo' | 'video',
  url: string,
  thumbnailUrl: string,
  uploadedBy: string,
  storageRef: string,
  roundNumber: number | null,
  roundChefs: string[],
  duration?: number
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  const mediaData: any = {
    id: mediaId,
    type,
    url,
    thumbnailUrl,
    uploadedBy,
    timestamp: Timestamp.now(),
    storageRef,
    roundNumber,
    roundChefs,
  };
  
  if (duration !== undefined) {
    mediaData.duration = duration;
  }
  
  await updateDoc(sessionRef, {
    [`media.${mediaId}`]: mediaData,
  });
};

/**
 * Adds a comment to the session
 */
export const addComment = async (
  sessionCode: string,
  commentId: string,
  text: string,
  author: string,
  roundNumber: number | null
): Promise<void> => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  await updateDoc(sessionRef, {
    [`comments.${commentId}`]: {
      id: commentId,
      text,
      author,
      timestamp: Timestamp.now(),
      roundNumber,
    },
  });
};
