// Audio utility functions for timer sounds
// Note: Audio files would need to be added to public/sounds/ directory

export const playBuzzer = () => {
  try {
    const audio = new Audio('/sounds/buzzer.mp3');
    audio.play().catch(err => console.log('Audio play failed:', err));
  } catch (err) {
    console.log('Audio not available:', err);
  }
};

export const playCountdownMusic = (duration: number) => {
  try {
    const audio = new Audio('/sounds/countdown.mp3');
    audio.play().catch(err => console.log('Audio play failed:', err));
    
    // Stop after duration
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, duration * 1000);
  } catch (err) {
    console.log('Audio not available:', err);
  }
};
