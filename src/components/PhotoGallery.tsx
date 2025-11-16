import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo, SessionDocument } from '../types/index';
import { validateImageFile, resizeImages, uploadPhoto } from '../services/photoService';
import { addPhoto } from '../services/sessionService';
import { GamePhase } from '../types/index';

interface PhotoGalleryProps {
  sessionCode: string;
  gameState: SessionDocument;
  uploaderName: string;
  currentPhase: any;
  currentRound: number;
  currentRoundChefs: string[];
  onClose: () => void;
}

interface PhotoGroup {
  title: string;
  photos: Photo[];
  roundNumber: number | null;
}

const PhotoGallery = ({ sessionCode, gameState, uploaderName, currentPhase, currentRound, currentRoundChefs, onClose }: PhotoGalleryProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const photos = gameState.photos ? Object.values(gameState.photos) : [];
  
  // Sort photos by timestamp (newest first)
  const sortedPhotos = [...photos].sort((a, b) => 
    b.timestamp.toMillis() - a.timestamp.toMillis()
  );

  // Group photos by round
  const groupPhotosByRound = (): PhotoGroup[] => {
    const groups: { [key: string]: Photo[] } = {};
    
    sortedPhotos.forEach(photo => {
      const key = photo.roundNumber !== null ? `round_${photo.roundNumber}` : 'other';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(photo);
    });

    // Convert to array and sort
    const groupArray: PhotoGroup[] = [];
    
    // Add round groups (sorted by round number, descending)
    const roundKeys = Object.keys(groups)
      .filter(key => key.startsWith('round_'))
      .sort((a, b) => {
        const numA = parseInt(a.split('_')[1]);
        const numB = parseInt(b.split('_')[1]);
        return numB - numA; // Descending order
      });

    roundKeys.forEach(key => {
      const roundNumber = parseInt(key.split('_')[1]);
      const roundPhotos = groups[key];
      const chefNames = roundPhotos[0]?.roundChefs
        .map(chefId => gameState.chefs[chefId]?.name)
        .filter(Boolean)
        .join(' vs ') || '';
      
      groupArray.push({
        title: `Round ${roundNumber}: ${chefNames}`,
        photos: roundPhotos,
        roundNumber,
      });
    });

    // Add pre-game/post-game photos at the end
    if (groups['other']) {
      groupArray.push({
        title: 'Pre-game / Post-game',
        photos: groups['other'],
        roundNumber: null,
      });
    }

    return groupArray;
  };

  const photoGroups = groupPhotosByRound();

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(sortedPhotos.findIndex(p => p.id === photo.id));
  };

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(sortedPhotos[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex < sortedPhotos.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(sortedPhotos[newIndex]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhoto) {
        if (e.key === 'ArrowLeft') handlePrevPhoto();
        if (e.key === 'ArrowRight') handleNextPhoto();
        if (e.key === 'Escape') setSelectedPhoto(null);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, selectedPhotoIndex]);

  const formatTimestamp = (timestamp: any) => {
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const getRoundContext = (photo: Photo): string => {
    if (photo.roundNumber !== null) {
      const chefNames = photo.roundChefs
        .map(chefId => gameState.chefs[chefId]?.name)
        .filter(Boolean)
        .join(' vs ');
      return `Round ${photo.roundNumber}: ${chefNames}`;
    }
    return 'Pre-game / Post-game';
  };

  const getCurrentRoundContext = (): { roundNumber: number | null; roundChefs: string[] } => {
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

    return {
      roundNumber: null,
      roundChefs: [],
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

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
      setUploadProgress(20);
      const { fullImage, thumbnail } = await resizeImages(file);

      setUploadProgress(50);
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { fullUrl, thumbnailUrl, storagePath } = await uploadPhoto(
        sessionCode,
        photoId,
        fullImage,
        thumbnail
      );

      setUploadProgress(80);
      const { roundNumber, roundChefs } = getCurrentRoundContext();
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2000,
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-cream)',
          margin: '2rem 1rem',
          maxWidth: '1200px',
          borderRadius: '0.5rem',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Header buttons */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isUploading ? 'var(--color-sage)' : 'var(--color-gold)',
              color: 'var(--color-charcoal)',
              border: 'none',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isUploading ? '...' : '+'}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-burgundy)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Upload progress/error */}
        {isUploading && (
          <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--color-charcoal)' }}>
            Uploading... {uploadProgress}%
          </div>
        )}
        {error && (
          <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--color-burgundy)' }}>
            {error}
          </div>
        )}

        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            color: 'var(--color-charcoal)',
            marginBottom: '2rem',
          }}
        >
          Photo Gallery
        </h2>

        {photoGroups.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-charcoal)', opacity: 0.7 }}>
            No photos yet. Upload the first one!
          </p>
        ) : (
          photoGroups.map((group, groupIndex) => (
            <div key={groupIndex} style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  color: 'var(--color-gold)',
                  marginBottom: '1rem',
                }}
              >
                {group.title}
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                {group.photos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handlePhotoClick(photo)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={`Photo by ${photo.uploadedBy}`}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                      }}
                    />
                    <div style={{ padding: '0.5rem' }}>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-charcoal)',
                          margin: 0,
                        }}
                      >
                        {photo.uploadedBy}
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-charcoal)',
                          opacity: 0.7,
                          margin: 0,
                        }}
                      >
                        {formatTimestamp(photo.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Full-screen photo view */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'white',
                color: 'var(--color-charcoal)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3001,
              }}
            >
              ×
            </button>

            {/* Navigation buttons */}
            {selectedPhotoIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  color: 'var(--color-charcoal)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3001,
                }}
              >
                ‹
              </button>
            )}

            {selectedPhotoIndex < sortedPhotos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  color: 'var(--color-charcoal)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3001,
                }}
              >
                ›
              </button>
            )}

            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img
                src={selectedPhoto.url}
                alt={`Photo by ${selectedPhoto.uploadedBy}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '0.5rem',
                }}
              />
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginTop: '1rem',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.125rem',
                    color: 'var(--color-charcoal)',
                    margin: '0 0 0.5rem 0',
                  }}
                >
                  {getRoundContext(selectedPhoto)}
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-charcoal)',
                    margin: 0,
                  }}
                >
                  Uploaded by {selectedPhoto.uploadedBy} • {formatTimestamp(selectedPhoto.timestamp)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhotoGallery;
