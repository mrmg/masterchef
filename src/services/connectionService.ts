import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  collection,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, database } from '../config/firebase';
import { onDisconnect, ref as dbRef, set, remove } from 'firebase/database';

const CONNECTIONS_COLLECTION = 'sessions';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 60 seconds

let connectionId: string | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Generates a unique connection ID
 */
export const generateConnectionId = (): string => {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Gets the current connection ID
 */
export const getConnectionId = (): string => {
  if (!connectionId) {
    connectionId = generateConnectionId();
  }
  return connectionId;
};

/**
 * Updates the connection presence in Firestore
 */
export const updateConnectionPresence = async (
  sessionCode: string,
  displayName: string
): Promise<void> => {
  const connId = getConnectionId();
  const connectionRef = doc(db, CONNECTIONS_COLLECTION, sessionCode, 'connections', connId);

  await setDoc(connectionRef, {
    lastSeen: Timestamp.now(),
    displayName: displayName || 'Anonymous',
  });
};

/**
 * Starts the heartbeat mechanism to keep connection alive
 */
export const startHeartbeat = (
  sessionCode: string,
  displayName: string
): void => {
  // Clear any existing heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Initial presence update
  updateConnectionPresence(sessionCode, displayName);

  // Set up periodic heartbeat
  heartbeatInterval = setInterval(() => {
    updateConnectionPresence(sessionCode, displayName);
  }, HEARTBEAT_INTERVAL);

  // Set up Firebase Realtime Database onDisconnect handler for immediate cleanup
  const connId = getConnectionId();
  const rtdbRef = dbRef(database, `presence/${sessionCode}/${connId}`);
  
  // Set presence in RTDB
  set(rtdbRef, {
    online: true,
    lastSeen: Date.now(),
  });

  // Set up disconnect handler
  onDisconnect(rtdbRef).remove();

  // Also set up Firestore cleanup on disconnect
  // Note: This is a best-effort approach since Firestore doesn't have native onDisconnect
  window.addEventListener('beforeunload', () => {
    removeConnection(sessionCode);
  });
};

/**
 * Stops the heartbeat mechanism
 */
export const stopHeartbeat = (): void => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

/**
 * Removes the current connection from Firestore
 */
export const removeConnection = async (sessionCode: string): Promise<void> => {
  const connId = getConnectionId();
  const connectionRef = doc(db, CONNECTIONS_COLLECTION, sessionCode, 'connections', connId);

  try {
    await deleteDoc(connectionRef);
  } catch (error) {
    console.error('Failed to remove connection:', error);
  }

  // Also remove from RTDB
  const rtdbRef = dbRef(database, `presence/${sessionCode}/${connId}`);
  try {
    await remove(rtdbRef);
  } catch (error) {
    console.error('Failed to remove RTDB presence:', error);
  }
};

/**
 * Subscribes to active connections count
 */
export const subscribeToConnectionCount = (
  sessionCode: string,
  callback: (count: number) => void
): Unsubscribe => {
  const connectionsRef = collection(db, CONNECTIONS_COLLECTION, sessionCode, 'connections');
  
  return onSnapshot(connectionsRef, (snapshot) => {
    const now = Date.now();
    const activeConnections = snapshot.docs.filter(doc => {
      const data = doc.data();
      const lastSeen = data.lastSeen?.toMillis() || 0;
      return (now - lastSeen) < CONNECTION_TIMEOUT;
    });
    
    callback(activeConnections.length);
  });
};

/**
 * Cleans up stale connections (older than CONNECTION_TIMEOUT)
 */
export const cleanupStaleConnections = async (sessionCode: string): Promise<void> => {
  const connectionsRef = collection(db, CONNECTIONS_COLLECTION, sessionCode, 'connections');
  
  const snapshot = await onSnapshot(connectionsRef, async (snap) => {
    const now = Date.now();
    const deletePromises: Promise<void>[] = [];

    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const lastSeen = data.lastSeen?.toMillis() || 0;
      
      if ((now - lastSeen) > CONNECTION_TIMEOUT) {
        deletePromises.push(deleteDoc(docSnap.ref));
      }
    });

    await Promise.all(deletePromises);
  });

  // Unsubscribe immediately after cleanup
  snapshot();
};

/**
 * Starts periodic cleanup of stale connections
 */
export const startConnectionCleanup = (sessionCode: string): ReturnType<typeof setInterval> => {
  // Run cleanup immediately
  cleanupStaleConnections(sessionCode);

  // Then run every 60 seconds
  return setInterval(() => {
    cleanupStaleConnections(sessionCode);
  }, CONNECTION_TIMEOUT);
};
