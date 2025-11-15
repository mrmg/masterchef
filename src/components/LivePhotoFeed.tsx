import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { validateImageFile, resizeImages, uploadPhoto } from '../services/photoService';
import { addPhoto } from '../services/sessionService';
import { GamePhase } from '../types/index';

interface LivePhotoFeedProps {
  sessionCode: string;
  uploaderName: string;
  currentPhase: GamePhase;
  currentRound: number;
  currentRoundChefs: string[];
}

const LivePhotoFeed = ({
  sessionCode,
  uploaderName,
  currentPhase,
  currentRound,
  currentRoundChefs,
}: LivePhotoFeedProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRoundContext = (): { roundNumber: number | null; roundChefs: string[] } => {
    // Determine if photo should be associated with a round
    const roundPhases = [
      GamePhase.ROUND_READY,
      GamePhase.ROUND_ACTIVE,
      GamePhase.ROUND_COMPLETE,
      GamePhase.VOTING,
    ];

    if (roundPhases.includes(currentPhase)) {
      return {
        roundNumber: currentRound,
        roundChefs: currentRoundChefs,
      };
    }

    // Pre-game or post-game
    return {
      roundNumber: null,
      roundChefs: [],
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Resize images
      setUploadProgress(20);
      const { fullImage, thumbnail } = await resizeImages(file);

      // Upload to storage
      setUploadProgress(50);
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { fullUrl, thumbnailUrl, storagePath } = await uploadPhoto(
        sessionCode,
        photoId,
        fullImage,
        thumbnail
      );

      // Add to Firestore
      setUploadProgress(80);
      const { roundNumber, roundChefs } = getRoundContext();
      await addPhoto(
        sessionCode,
        photoId,
        fullUrl,
        thumbnailUrl,
        uploaderName,
        storagePath,
        roundNumber,
        roundChefs
      );

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError('Failed to upload photo');
      setIsUploading(false);
      setUploadProgress(0);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleFABClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Floating Action Button */}
      <motion.button
        onClick={handleFABClick}
        disabled={isUploading}
        whileHover={{ scale: isUploading ? 1 : 1.1 }}
        whileTap={{ scale: isUploading ? 1 : 0.9 }}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: isUploading ? 'var(--color-sage)' : 'var(--color-gold)',
          border: 'none',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'background-color 0.3s',
        }}
      >
        {isUploading ? (
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid white',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
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
        )}
      </motion.button>

      {/* Upload progress indicator */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '1rem',
            backgroundColor: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal)', margin: 0 }}>
            Uploading... {uploadProgress}%
          </p>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '1rem',
            backgroundColor: 'var(--color-burgundy)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          <p style={{ fontSize: '0.875rem', margin: 0 }}>{error}</p>
        </motion.div>
      )}

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default LivePhotoFeed;
