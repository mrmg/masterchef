import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MediaItem, SessionDocument } from '../types/index';
import { validateMediaFile, resizeImages, processVideo, uploadMedia } from '../services/mediaService';
import { addMedia } from '../services/sessionService';
import { GamePhase } from '../types/index';
import { getDisplayName, setDisplayName as saveName, validateDisplayName } from '../utils/cookieUtils';
import DisplayNamePrompt from './DisplayNamePrompt';
import { subscribeToConnectionCount } from '../services/connectionService';
import { addComment } from '../services/sessionService';
import type { Comment } from '../types/index';

interface MediaGalleryProps {
  sessionCode: string;
  gameState: SessionDocument;
  uploaderName: string;
  currentPhase: any;
  currentRound: number;
  currentRoundChefs: string[];
  onClose: () => void;
}

interface MediaGroup {
  title: string;
  media: MediaItem[];
  comments: Comment[];
  roundNumber: number | null;
}

const MediaGallery = ({ sessionCode, gameState, uploaderName, currentPhase, currentRound, currentRoundChefs, onClose }: MediaGalleryProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState(uploaderName);
  const [settingsName, setSettingsName] = useState(uploaderName);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedUploadContext, setSelectedUploadContext] = useState<{ roundNumber: number | null; roundChefs: string[]; isPreGame?: boolean; isPostGame?: boolean } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load display name from cookie on mount
  useEffect(() => {
    const savedName = getDisplayName();
    if (savedName) {
      setCurrentDisplayName(savedName);
      setSettingsName(savedName);
    }
  }, []);

  // Subscribe to connection count
  // Note: Heartbeat is now managed at the session level in GameContext
  useEffect(() => {
    const unsubscribe = subscribeToConnectionCount(sessionCode, (count) => {
      setActiveConnections(count);
    });

    return () => {
      unsubscribe();
    };
  }, [sessionCode]);

  // Get media from gameState (support both old 'photos' and new 'media' fields)
  const media: MediaItem[] = gameState.media ? Object.values(gameState.media) : 
                gameState.photos ? Object.values(gameState.photos).map(p => ({ ...p, type: 'photo' as const })) : [];
  
  // Get comments from gameState
  const comments: Comment[] = gameState.comments ? Object.values(gameState.comments) : [];
  
  // Sort media by timestamp (newest first)
  const sortedMedia: MediaItem[] = [...media].sort((a, b) => 
    b.timestamp.toMillis() - a.timestamp.toMillis()
  );

  // Sort comments by timestamp (newest first)
  const sortedComments: Comment[] = [...comments].sort((a, b) => 
    b.timestamp.toMillis() - a.timestamp.toMillis()
  );

  // Group media and comments by round
  const groupMediaByRound = (): MediaGroup[] => {
    const mediaGroups: { [key: string]: MediaItem[] } = {};
    const commentGroups: { [key: string]: Comment[] } = {};
    
    // Determine if game has finished (all chefs have cooked)
    const totalChefs = Object.keys(gameState.chefs || {}).length;
    const chefsCooked = Object.values(gameState.chefs || {}).filter(chef => chef.hasCooked).length;
    const gameFinished = totalChefs > 0 && chefsCooked === totalChefs;
    
    // Get the timestamp of the last round's end (approximate)
    const lastRoundEndTime = gameFinished && gameState.state?.timerEndTime 
      ? gameState.state.timerEndTime.toMillis() 
      : null;
    
    sortedMedia.forEach((item: MediaItem) => {
      let key: string;
      if (item.roundNumber !== null) {
        key = `round_${item.roundNumber}`;
      } else {
        // Determine if pre-game or post-game based on timestamp
        if (lastRoundEndTime && item.timestamp.toMillis() > lastRoundEndTime) {
          key = 'post-game';
        } else {
          key = 'pre-game';
        }
      }
      if (!mediaGroups[key]) {
        mediaGroups[key] = [];
      }
      mediaGroups[key].push(item);
    });

    sortedComments.forEach((comment: Comment) => {
      let key: string;
      if (comment.roundNumber !== null) {
        key = `round_${comment.roundNumber}`;
      } else {
        // Determine if pre-game or post-game based on timestamp
        if (lastRoundEndTime && comment.timestamp.toMillis() > lastRoundEndTime) {
          key = 'post-game';
        } else {
          key = 'pre-game';
        }
      }
      if (!commentGroups[key]) {
        commentGroups[key] = [];
      }
      commentGroups[key].push(comment);
    });

    // Convert to array and sort in reverse chronological order
    const groupArray: MediaGroup[] = [];
    
    // Get all unique keys from both media and comments
    const allKeys = new Set([...Object.keys(mediaGroups), ...Object.keys(commentGroups)]);
    
    // Add post-game first (most recent)
    if (allKeys.has('post-game')) {
      groupArray.push({
        title: 'Post-game',
        media: mediaGroups['post-game'] || [],
        comments: commentGroups['post-game'] || [],
        roundNumber: null,
      });
    }
    
    // Add round groups (sorted by round number, descending)
    const roundKeys = Array.from(allKeys)
      .filter(key => key.startsWith('round_'))
      .sort((a, b) => {
        const numA = parseInt(a.split('_')[1]);
        const numB = parseInt(b.split('_')[1]);
        return numB - numA; // Descending order
      });

    roundKeys.forEach(key => {
      const roundNumber = parseInt(key.split('_')[1]);
      const roundMedia = mediaGroups[key] || [];
      const roundComments = commentGroups[key] || [];
      
      // Get chef names - prioritize media's roundChefs since they were captured at upload time
      let chefNames = '';
      let chefIds: string[] = [];
      
      // First, try to get from media items (most reliable)
      if (roundMedia.length > 0) {
        // Collect all unique chef IDs from all media in this round
        const allChefIds = new Set<string>();
        roundMedia.forEach(item => {
          (item.roundChefs || []).forEach(id => allChefIds.add(id));
        });
        chefIds = Array.from(allChefIds);
      }
      
      // If current round, use currentRoundChefs from props
      if (chefIds.length === 0 && roundNumber === currentRound) {
        chefIds = currentRoundChefs;
      }
      
      // Fallback: calculate from game state based on round
      if (chefIds.length === 0) {
        const simultaneousPlayers = gameState.config?.simultaneousPlayers || 2;
        chefIds = Object.values(gameState.chefs || {})
          .filter(chef => {
            const chefRound = Math.ceil(chef.order / simultaneousPlayers);
            return chefRound === roundNumber;
          })
          .sort((a, b) => a.order - b.order)
          .map(chef => chef.id);
      }
      
      // Convert chef IDs to names
      if (chefIds.length > 0) {
        chefNames = chefIds
          .map(chefId => gameState.chefs[chefId]?.name)
          .filter(Boolean)
          .map(name => name.trim())
          .join(' vs ');
      }
      
      groupArray.push({
        title: chefNames ? `Round ${roundNumber}: ${chefNames}` : `Round ${roundNumber}`,
        media: roundMedia,
        comments: roundComments,
        roundNumber,
      });
    });

    // Add pre-game last (oldest)
    if (allKeys.has('pre-game')) {
      groupArray.push({
        title: 'Pre-game',
        media: mediaGroups['pre-game'] || [],
        comments: commentGroups['pre-game'] || [],
        roundNumber: null,
      });
    }

    return groupArray;
  };

  const mediaGroups = groupMediaByRound();

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setSelectedMediaIndex(sortedMedia.findIndex((m: MediaItem) => m.id === item.id));
  };

  const handlePrevMedia = () => {
    if (selectedMediaIndex > 0) {
      const newIndex = selectedMediaIndex - 1;
      setSelectedMediaIndex(newIndex);
      setSelectedMedia(sortedMedia[newIndex] as MediaItem);
    }
  };

  const handleNextMedia = () => {
    if (selectedMediaIndex < sortedMedia.length - 1) {
      const newIndex = selectedMediaIndex + 1;
      setSelectedMediaIndex(newIndex);
      setSelectedMedia(sortedMedia[newIndex] as MediaItem);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedMedia) {
        if (e.key === 'ArrowLeft') handlePrevMedia();
        if (e.key === 'ArrowRight') handleNextMedia();
        if (e.key === 'Escape') setSelectedMedia(null);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, selectedMediaIndex]);

  const formatTimestamp = (timestamp: any) => {
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoundContext = (item: MediaItem): string => {
    if (item.roundNumber !== null) {
      const chefNames = item.roundChefs
        .map(chefId => gameState.chefs[chefId]?.name)
        .filter(Boolean)
        .join(' vs ');
      return `Round ${item.roundNumber}: ${chefNames}`;
    }
    
    // Determine if pre-game or post-game based on timestamp
    const totalChefs = Object.keys(gameState.chefs || {}).length;
    const chefsCooked = Object.values(gameState.chefs || {}).filter(chef => chef.hasCooked).length;
    const gameFinished = totalChefs > 0 && chefsCooked === totalChefs;
    const lastRoundEndTime = gameFinished && gameState.state?.timerEndTime 
      ? gameState.state.timerEndTime.toMillis() 
      : null;
    
    if (lastRoundEndTime && item.timestamp.toMillis() > lastRoundEndTime) {
      return 'Post-game';
    }
    return 'Pre-game';
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || commentText.length > 500) {
      return;
    }

    // Check if display name is set
    if (!currentDisplayName || currentDisplayName === 'User') {
      setShowNamePrompt(true);
      return;
    }

    setIsSubmittingComment(true);

    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      // Use selected context if available, otherwise use current context
      const context = selectedUploadContext || getCurrentRoundContext();
      
      await addComment(
        sessionCode,
        commentId,
        commentText.trim(),
        currentDisplayName,
        context.roundNumber
      );

      setCommentText('');
      // Clear selected context after comment
      setSelectedUploadContext(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError('Failed to post comment');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Check if display name is set
    if (!currentDisplayName || currentDisplayName === 'User') {
      setShowNamePrompt(true);
      return;
    }

    const validation = validateMediaFile(file);
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
      
      const mediaId = `${validation.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      let processedData;
      let duration: number | undefined;

      if (validation.type === 'photo') {
        processedData = await resizeImages(file);
      } else {
        const videoData = await processVideo(file);
        processedData = videoData;
        duration = videoData.duration;
      }

      setUploadProgress(50);
      const { mediaUrl, thumbnailUrl, storagePath, duration: uploadDuration } = await uploadMedia(
        sessionCode,
        mediaId,
        file,
        validation.type,
        processedData
      );

      setUploadProgress(80);
      // Use selected context if available, otherwise use current context
      const context = selectedUploadContext || getCurrentRoundContext();
      await addMedia(
        sessionCode,
        mediaId,
        validation.type,
        mediaUrl,
        thumbnailUrl,
        uploaderName,
        storagePath,
        context.roundNumber,
        context.roundChefs,
        uploadDuration || duration
      );
      
      // Clear selected context after upload
      setSelectedUploadContext(null);

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error('Failed to upload media:', err);
      setError('Failed to upload media');
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
      drag={false}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2000,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        drag={false}
        style={{
          backgroundColor: 'var(--color-cream)',
          margin: '2rem auto',
          maxWidth: '1200px',
          borderRadius: '0.5rem',
          padding: '2rem',
          position: 'relative',
          minHeight: 'min-content',
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Header buttons */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
          {/* Active connections button */}
          <button
            onClick={() => {
              setSettingsName(currentDisplayName);
              setSettingsError(null);
              setShowSettings(true);
            }}
            title="Active connections (click for settings)"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-sage)',
              color: 'var(--color-charcoal)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            {activeConnections}
          </button>

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
          Media Gallery
        </h2>

        {/* Comment Input */}
        <form onSubmit={handleCommentSubmit} style={{ marginBottom: '2rem' }}>
          {selectedUploadContext && (
            <div style={{ 
              marginBottom: '0.5rem', 
              padding: '0.5rem 0.75rem',
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-charcoal)', fontWeight: 600 }}>
                📍 Adding to: {selectedUploadContext.isPreGame ? 'Pre-game' : selectedUploadContext.isPostGame ? 'Post-game' : `Round ${selectedUploadContext.roundNumber}`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedUploadContext(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-burgundy)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0 0.5rem',
                }}
              >
                ✕
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={selectedUploadContext ? `Add a comment to ${selectedUploadContext.isPreGame ? 'Pre-game' : selectedUploadContext.isPostGame ? 'Post-game' : `Round ${selectedUploadContext.roundNumber}`}...` : "Add a comment..."}
              maxLength={500}
              rows={2}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-sans)',
                border: `2px solid ${selectedUploadContext ? 'var(--color-burgundy)' : 'var(--color-gold)'}`,
                borderRadius: '0.25rem',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || commentText.length > 500 || isSubmittingComment}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-sans)',
                backgroundColor: commentText.trim() && commentText.length <= 500 && !isSubmittingComment
                  ? 'var(--color-gold)'
                  : 'var(--color-sage)',
                color: 'var(--color-charcoal)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: commentText.trim() && commentText.length <= 500 && !isSubmittingComment
                  ? 'pointer'
                  : 'not-allowed',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {isSubmittingComment ? 'Posting...' : 'Post'}
            </button>
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-charcoal)',
              opacity: 0.7,
              marginTop: '0.25rem',
              textAlign: 'right',
            }}
          >
            {commentText.length}/500
          </p>
        </form>

        {mediaGroups.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-charcoal)', opacity: 0.7 }}>
            No photos or videos yet. Upload the first one!
          </p>
        ) : (
          mediaGroups.map((group, groupIndex) => (
            <div key={groupIndex} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    color: 'var(--color-gold)',
                    margin: 0,
                  }}
                >
                  {group.title}
                </h3>
                <button
                  onClick={() => {
                    // Determine context based on group
                    let context: { roundNumber: number | null; roundChefs: string[]; isPreGame?: boolean; isPostGame?: boolean };
                    
                    if (group.roundNumber !== null) {
                      // Round-specific context
                      const simultaneousPlayers = gameState.config?.simultaneousPlayers || 2;
                      const chefsInRound = Object.values(gameState.chefs || {})
                        .filter(chef => {
                          const chefRound = Math.ceil(chef.order / simultaneousPlayers);
                          return chefRound === group.roundNumber;
                        })
                        .map(chef => chef.id);
                      
                      context = {
                        roundNumber: group.roundNumber,
                        roundChefs: chefsInRound,
                      };
                    } else if (group.title === 'Pre-game') {
                      context = {
                        roundNumber: null,
                        roundChefs: [],
                        isPreGame: true,
                      };
                    } else {
                      // Post-game
                      context = {
                        roundNumber: null,
                        roundChefs: [],
                        isPostGame: true,
                      };
                    }
                    
                    setSelectedUploadContext(context);
                  }}
                  title={`Add media or comment to ${group.title}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: selectedUploadContext && 
                      ((selectedUploadContext.roundNumber === group.roundNumber) ||
                       (selectedUploadContext.isPreGame && group.title === 'Pre-game') ||
                       (selectedUploadContext.isPostGame && group.title === 'Post-game'))
                      ? 'var(--color-burgundy)' 
                      : 'var(--color-gold)',
                    cursor: 'pointer',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    padding: '0',
                    lineHeight: '1',
                    transition: 'transform 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  +
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                {group.media.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleMediaClick(item)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={`${item.type} by ${item.uploadedBy}`}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                      }}
                    />
                    {/* Video indicator */}
                    {item.type === 'video' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.5rem',
                        }}
                      >
                        ▶
                      </div>
                    )}
                    {/* Video duration */}
                    {item.type === 'video' && item.duration && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '50px',
                          right: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        {formatDuration(item.duration)}
                      </div>
                    )}
                    <div style={{ padding: '0.5rem' }}>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-charcoal)',
                          margin: 0,
                        }}
                      >
                        {item.uploadedBy}
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-charcoal)',
                          opacity: 0.7,
                          margin: 0,
                        }}
                      >
                        {formatTimestamp(item.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Comments for this round */}
              {group.comments.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '1rem',
                      color: 'var(--color-charcoal)',
                      marginBottom: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Comments
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {group.comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          backgroundColor: 'rgba(212, 175, 55, 0.1)',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          borderLeft: '3px solid var(--color-gold)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'var(--color-charcoal)',
                            }}
                          >
                            {comment.author}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-charcoal)',
                              opacity: 0.7,
                            }}
                          >
                            {formatTimestamp(comment.timestamp)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-charcoal)',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </motion.div>

      {/* Full-screen media view */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMedia(null);
            }}
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
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMedia(null);
              }}
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
            {selectedMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevMedia();
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

            {selectedMediaIndex < sortedMedia.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextMedia();
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
              {selectedMedia.type === 'photo' ? (
                <img
                  src={selectedMedia.url}
                  alt={`Photo by ${selectedMedia.uploadedBy}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                    borderRadius: '0.5rem',
                  }}
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    borderRadius: '0.5rem',
                  }}
                />
              )}
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
                  {getRoundContext(selectedMedia)}
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-charcoal)',
                    margin: 0,
                  }}
                >
                  Uploaded by {selectedMedia.uploadedBy} • {formatTimestamp(selectedMedia.timestamp)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 4000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--color-cream)',
                borderRadius: '0.5rem',
                padding: '2rem',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  color: 'var(--color-charcoal)',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                Settings
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const validation = validateDisplayName(settingsName);
                  if (!validation.valid) {
                    setSettingsError(validation.error || 'Invalid name');
                    return;
                  }
                  const success = saveName(settingsName);
                  if (success) {
                    setCurrentDisplayName(settingsName);
                    setShowSettings(false);
                  } else {
                    setSettingsError('Failed to save name');
                  }
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    color: 'var(--color-charcoal)',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => {
                    setSettingsName(e.target.value);
                    setSettingsError(null);
                  }}
                  placeholder="Enter your name"
                  maxLength={30}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: `2px solid ${settingsError ? 'var(--color-burgundy)' : 'var(--color-gold)'}`,
                    borderRadius: '0.25rem',
                    marginBottom: '0.5rem',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                  }}
                />

                {settingsError && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-burgundy)',
                      marginBottom: '1rem',
                    }}
                  >
                    {settingsError}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-sans)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-charcoal)',
                      border: '2px solid var(--color-charcoal)',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!settingsName.trim()}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-sans)',
                      backgroundColor: settingsName.trim() ? 'var(--color-gold)' : 'var(--color-sage)',
                      color: 'var(--color-charcoal)',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: settingsName.trim() ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Display Name Prompt */}
      <AnimatePresence>
        {showNamePrompt && (
          <DisplayNamePrompt
            onNameSet={(name) => {
              setCurrentDisplayName(name);
              setShowNamePrompt(false);
              // After setting name, user can try their action again
            }}
            onCancel={() => setShowNamePrompt(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MediaGallery;
