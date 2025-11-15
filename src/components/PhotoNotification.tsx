import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SessionDocument } from '../types/index';

interface PhotoNotificationProps {
  gameState: SessionDocument;
  currentUserName: string;
}

interface NotificationData {
  id: string;
  uploaderName: string;
  timestamp: number;
}

const PhotoNotification = ({ gameState, currentUserName }: PhotoNotificationProps) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastPhotoCount, setLastPhotoCount] = useState(0);

  useEffect(() => {
    if (!gameState.photos) return;

    const photos = Object.values(gameState.photos);
    const currentPhotoCount = photos.length;

    // Check if new photos were added
    if (currentPhotoCount > lastPhotoCount && lastPhotoCount > 0) {
      // Find new photos
      const sortedPhotos = [...photos].sort((a, b) => 
        b.timestamp.toMillis() - a.timestamp.toMillis()
      );

      const newPhotosCount = currentPhotoCount - lastPhotoCount;
      const newPhotos = sortedPhotos.slice(0, newPhotosCount);

      // Show notifications for photos not uploaded by current user
      newPhotos.forEach(photo => {
        if (photo.uploadedBy !== currentUserName) {
          const notification: NotificationData = {
            id: photo.id,
            uploaderName: photo.uploadedBy,
            timestamp: Date.now(),
          };

          setNotifications(prev => [...prev, notification]);

          // Auto-remove notification after 3 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 3000);
        }
      });
    }

    setLastPhotoCount(currentPhotoCount);
  }, [gameState.photos, currentUserName, lastPhotoCount]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '5rem',
        left: '1rem',
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            style={{
              backgroundColor: 'var(--color-sage)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.875rem' }}>
                New Photo
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>
                from {notification.uploaderName}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PhotoNotification;
