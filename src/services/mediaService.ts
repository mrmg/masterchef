import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';

const MAX_IMAGE_WIDTH = 1920;
const THUMBNAIL_WIDTH = 320;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export type MediaType = 'photo' | 'video';

export interface ResizedImages {
  fullImage: Blob;
  thumbnail: Blob;
}

export interface VideoMetadata {
  thumbnail: Blob;
  duration: number;
}

/**
 * Validates media file (photo or video)
 */
export const validateMediaFile = (file: File): { valid: boolean; error?: string; type: MediaType } => {
  // Check if it's an image
  if (file.type.startsWith('image/')) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are supported', type: 'photo' };
    }
    
    if (file.size > MAX_PHOTO_SIZE) {
      return { valid: false, error: 'Photo size must be less than 5MB', type: 'photo' };
    }
    
    return { valid: true, type: 'photo' };
  }
  
  // Check if it's a video
  if (file.type.startsWith('video/')) {
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!validVideoTypes.includes(file.type)) {
      return { valid: false, error: 'Only MP4, MOV, and WebM videos are supported', type: 'video' };
    }
    
    if (file.size > MAX_VIDEO_SIZE) {
      return { valid: false, error: 'Video size must be less than 50MB', type: 'video' };
    }
    
    return { valid: true, type: 'video' };
  }
  
  return { valid: false, error: 'File must be an image or video', type: 'photo' };
};

/**
 * Legacy function for backward compatibility
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const result = validateMediaFile(file);
  return { valid: result.valid && result.type === 'photo', error: result.error };
};

/**
 * Resizes an image to specified width while maintaining aspect ratio
 */
const resizeImage = (file: File, maxWidth: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Only resize if image is larger than max width
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Resizes image to both full size and thumbnail
 */
export const resizeImages = async (file: File): Promise<ResizedImages> => {
  const [fullImage, thumbnail] = await Promise.all([
    resizeImage(file, MAX_IMAGE_WIDTH),
    resizeImage(file, THUMBNAIL_WIDTH),
  ]);

  return { fullImage, thumbnail };
};

/**
 * Generates a thumbnail from the first frame of a video
 */
export const generateVideoThumbnail = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Seek to 0.1s to avoid potential black frames at the start
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      try {
        // Calculate thumbnail dimensions maintaining aspect ratio
        const width = THUMBNAIL_WIDTH;
        const height = (video.videoHeight / video.videoWidth) * THUMBNAIL_WIDTH;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(video.src);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          },
          'image/jpeg',
          0.9
        );
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Extracts video duration in seconds
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Processes video file to extract thumbnail and duration
 */
export const processVideo = async (file: File): Promise<VideoMetadata> => {
  const [thumbnail, duration] = await Promise.all([
    generateVideoThumbnail(file),
    getVideoDuration(file),
  ]);

  return { thumbnail, duration };
};

/**
 * Uploads photo to Firebase Storage
 */
export const uploadPhoto = async (
  sessionCode: string,
  photoId: string,
  fullImage: Blob,
  thumbnail: Blob
): Promise<{ fullUrl: string; thumbnailUrl: string; storagePath: string }> => {
  const storagePath = `sessions/${sessionCode}/media/${photoId}`;
  const fullRef = ref(storage, `${storagePath}/full.jpg`);
  const thumbnailRef = ref(storage, `${storagePath}/thumbnail.jpg`);

  // Upload both images
  await Promise.all([
    uploadBytes(fullRef, fullImage, { contentType: 'image/jpeg' }),
    uploadBytes(thumbnailRef, thumbnail, { contentType: 'image/jpeg' }),
  ]);

  // Get download URLs
  const [fullUrl, thumbnailUrl] = await Promise.all([
    getDownloadURL(fullRef),
    getDownloadURL(thumbnailRef),
  ]);

  return { fullUrl, thumbnailUrl, storagePath };
};

/**
 * Uploads video to Firebase Storage
 */
export const uploadVideo = async (
  sessionCode: string,
  videoId: string,
  videoFile: File,
  thumbnail: Blob
): Promise<{ videoUrl: string; thumbnailUrl: string; storagePath: string }> => {
  const storagePath = `sessions/${sessionCode}/media/${videoId}`;
  
  // Determine video file extension
  const extension = videoFile.type === 'video/quicktime' ? 'mov' : 
                   videoFile.type === 'video/webm' ? 'webm' : 'mp4';
  
  const videoRef = ref(storage, `${storagePath}/video.${extension}`);
  const thumbnailRef = ref(storage, `${storagePath}/thumbnail.jpg`);

  // Upload video and thumbnail
  await Promise.all([
    uploadBytes(videoRef, videoFile, { contentType: videoFile.type }),
    uploadBytes(thumbnailRef, thumbnail, { contentType: 'image/jpeg' }),
  ]);

  // Get download URLs
  const [videoUrl, thumbnailUrl] = await Promise.all([
    getDownloadURL(videoRef),
    getDownloadURL(thumbnailRef),
  ]);

  return { videoUrl, thumbnailUrl, storagePath };
};

/**
 * Uploads media (photo or video) to Firebase Storage
 */
export const uploadMedia = async (
  sessionCode: string,
  mediaId: string,
  file: File,
  type: MediaType,
  processedData: ResizedImages | VideoMetadata
): Promise<{ mediaUrl: string; thumbnailUrl: string; storagePath: string; duration?: number }> => {
  if (type === 'photo') {
    const { fullImage, thumbnail } = processedData as ResizedImages;
    const result = await uploadPhoto(sessionCode, mediaId, fullImage, thumbnail);
    return { mediaUrl: result.fullUrl, thumbnailUrl: result.thumbnailUrl, storagePath: result.storagePath };
  } else {
    const { thumbnail, duration } = processedData as VideoMetadata;
    const result = await uploadVideo(sessionCode, mediaId, file, thumbnail);
    return { 
      mediaUrl: result.videoUrl, 
      thumbnailUrl: result.thumbnailUrl, 
      storagePath: result.storagePath,
      duration 
    };
  }
};

/**
 * Deletes photo from Firebase Storage
 */
export const deletePhoto = async (storagePath: string): Promise<void> => {
  const fullRef = ref(storage, `${storagePath}/full.jpg`);
  const thumbnailRef = ref(storage, `${storagePath}/thumbnail.jpg`);

  await Promise.all([
    deleteObject(fullRef).catch(() => {}), // Ignore errors if file doesn't exist
    deleteObject(thumbnailRef).catch(() => {}),
  ]);
};

/**
 * Deletes video from Firebase Storage
 */
export const deleteVideo = async (storagePath: string): Promise<void> => {
  // Try all possible video extensions
  const extensions = ['mp4', 'mov', 'webm'];
  const thumbnailRef = ref(storage, `${storagePath}/thumbnail.jpg`);
  
  const deletePromises = extensions.map(ext => 
    deleteObject(ref(storage, `${storagePath}/video.${ext}`)).catch(() => {})
  );
  
  deletePromises.push(deleteObject(thumbnailRef).catch(() => {}));
  
  await Promise.all(deletePromises);
};

/**
 * Deletes media (photo or video) from Firebase Storage
 */
export const deleteMedia = async (storagePath: string, type: MediaType): Promise<void> => {
  if (type === 'photo') {
    await deletePhoto(storagePath);
  } else {
    await deleteVideo(storagePath);
  }
};
