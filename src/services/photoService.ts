import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';

const MAX_IMAGE_WIDTH = 1920;
const THUMBNAIL_WIDTH = 320;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ResizedImages {
  fullImage: Blob;
  thumbnail: Blob;
}

/**
 * Validates image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check file type specifically
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are supported' };
  }

  return { valid: true };
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
 * Uploads photo to Firebase Storage
 */
export const uploadPhoto = async (
  sessionCode: string,
  photoId: string,
  fullImage: Blob,
  thumbnail: Blob
): Promise<{ fullUrl: string; thumbnailUrl: string; storagePath: string }> => {
  const storagePath = `sessions/${sessionCode}/photos/${photoId}`;
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
