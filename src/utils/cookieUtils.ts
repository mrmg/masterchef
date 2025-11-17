/**
 * Cookie utility functions for managing display name
 */

const DISPLAY_NAME_COOKIE = 'masterchef_display_name';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 365 days in seconds

/**
 * Sets the display name in a browser cookie
 * @param name - The display name to store (1-30 characters)
 * @returns true if successful, false if validation fails
 */
export const setDisplayName = (name: string): boolean => {
  // Validate name length
  if (name.length < 1 || name.length > 30) {
    return false;
  }

  // Store in cookie with 365-day expiration
  document.cookie = `${DISPLAY_NAME_COOKIE}=${encodeURIComponent(name)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
  return true;
};

/**
 * Retrieves the display name from the browser cookie
 * @returns The stored display name, or null if not found
 */
export const getDisplayName = (): string | null => {
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === DISPLAY_NAME_COOKIE) {
      return decodeURIComponent(value);
    }
  }
  
  return null;
};

/**
 * Validates a display name
 * @param name - The name to validate
 * @returns An object with valid flag and optional error message
 */
export const validateDisplayName = (name: string): { valid: boolean; error?: string } => {
  if (name.length < 1) {
    return { valid: false, error: 'Name must be at least 1 character' };
  }
  
  if (name.length > 30) {
    return { valid: false, error: 'Name must be 30 characters or less' };
  }
  
  return { valid: true };
};

/**
 * Clears the display name cookie
 */
export const clearDisplayName = (): void => {
  document.cookie = `${DISPLAY_NAME_COOKIE}=; max-age=0; path=/`;
};
