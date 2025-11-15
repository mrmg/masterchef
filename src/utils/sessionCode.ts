import { getSession } from '../services/sessionService';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

export const generateSessionCode = (): string => {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
};

export const generateUniqueSessionCode = async (): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateSessionCode();
    const existingSession = await getSession(code);
    
    if (!existingSession) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique session code after multiple attempts');
};
