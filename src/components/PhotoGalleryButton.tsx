import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoGallery from './PhotoGallery';
import type { SessionDocument } from '../types/index';

interface PhotoGalleryButtonProps {
  sessionCode: string;
  gameState: SessionDocument;
  uploaderName: string;
  currentPhase: any;
  currentRound: number;
  currentRoundChefs: string[];
}

const PhotoGalleryButton = ({ sessionCode, gameState, uploaderName, currentPhase, currentRound, currentRoundChefs }: PhotoGalleryButtonProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number | null>(null);

  const storageKey = `masterchef_photos_viewed_${sessionCode}`;

  // Load last viewed timestamp from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setLastViewedTimestamp(parseInt(stored));
    }
  }, [storageKey]);

  // Calculate unviewed count
  useEffect(() => {
    if (!gameState.photos) {
      setUnviewedCount(0);
      return;
    }

    const photos = Object.values(gameState.photos);
    if (lastViewedTimestamp === null) {
      setUnviewedCount(photos.length);
    } else {
      const unviewed = photos.filter(
        photo => photo.timestamp.toMillis() > lastViewedTimestamp
      );
      setUnviewedCount(unviewed.length);
    }
  }, [gameState.photos, lastViewedTimestamp]);

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
    // Mark all photos as viewed
    const now = Date.now();
    localStorage.setItem(storageKey, now.toString());
    setLastViewedTimestamp(now);
    setUnviewedCount(0);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
  };

  return (
    <>
      <motion.button
        onClick={handleOpenGallery}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-gold)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-charcoal)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>

        {/* Badge for unviewed count */}
        {unviewedCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: 'var(--color-burgundy)',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {unviewedCount > 99 ? '99+' : unviewedCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isGalleryOpen && (
          <PhotoGallery
            sessionCode={sessionCode}
            gameState={gameState}
            uploaderName={uploaderName}
            currentPhase={currentPhase}
            currentRound={currentRound}
            currentRoundChefs={currentRoundChefs}
            onClose={handleCloseGallery}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PhotoGalleryButton;
