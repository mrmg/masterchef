import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Chef } from '../types/index';
import { Timestamp } from 'firebase/firestore';
import { generateMicrowaveBeep } from '../utils/generateBeep';

// Import audio files
import countdownSound from '../assets/countdown.mp3';
import sound1 from '../assets/GANDYS FLIP FLOP - AUDIO FROM JAYUZUMI.COM.mp3';
import sound2 from '../assets/I DON\'T THINK YOU CAN ACTUALLY COOK - AUDIO FROM JAYUZUMI.COM.mp3';
import sound3 from '../assets/I WOULD BE IF I COOKED THAT SHIT - AUDIO FROM JAYUZUMI.COM.mp3';
import sound4 from '../assets/JUST LEAVE IT - AUDIO FROM JAYUZUMI.COM.mp3';
import sound5 from '../assets/NO YOU\'RE NOT EATING THAT - AUDIO FROM JAYUZUMI.COM.mp3';
import sound6 from '../assets/WHAT ARE YOU - AUDIO FROM JAYUZUMI.COM.mp3';
import sound7 from '../assets/YOU\'RE A GREAT TALKER BUT YOU\'RE A SH-T COOK - AUDIO FROM JAYUZUMI.COM.mp3';

const endSounds = [sound1, sound2, sound3, sound4, sound5, sound6, sound7];

// Configuration for test mode vs production mode
const USE_TEST_MODE = true; // Set to false for production

/**
 * Calculate interval checkpoints for beeps
 * For 20-minute round (1200s): [900, 600, 300] (15min, 10min, 5min)
 * For 2-minute test (120s): [90, 60, 30] (1m30s, 1m, 30s)
 */
const calculateIntervals = (duration: number, interval: number): number[] => {
  const intervals: number[] = [];
  for (let time = interval; time < duration; time += interval) {
    intervals.push(time);
  }
  return intervals.reverse(); // Descending order for countdown
};

interface RoundTimerProps {
  roundTime: number;
  currentChefs: Chef[];
  timerStartTime: Timestamp | null;
  timerEndTime: Timestamp | null;
  onStart: () => void;
  onComplete: () => void;
}

const RoundTimer = ({
  roundTime,
  currentChefs,
  timerStartTime,
  timerEndTime,
  onStart,
  onComplete,
}: RoundTimerProps) => {
  const [remainingTime, setRemainingTime] = useState(roundTime);
  const [isActive, setIsActive] = useState(false);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);
  const intervalBeepRef = useRef<HTMLAudioElement | null>(null);
  const playedIntervalsRef = useRef<Set<number>>(new Set());

  // Calculate interval checkpoints based on mode
  const totalDuration = USE_TEST_MODE ? 120 : roundTime; // 2 min vs actual round time
  const intervalSeconds = USE_TEST_MODE ? 30 : 300; // 30 sec vs 5 min
  const intervalCheckpoints = calculateIntervals(totalDuration, intervalSeconds);

  // Initialize audio elements
  useEffect(() => {
    const countdown = new Audio(countdownSound);
    countdown.loop = false; // Ensure no looping
    countdownAudioRef.current = countdown;
    
    // Pick a random end sound
    const randomSound = endSounds[Math.floor(Math.random() * endSounds.length)];
    const endSound = new Audio(randomSound);
    endSound.loop = false; // Ensure no looping
    endAudioRef.current = endSound;
    
    // Initialize interval beep audio (programmatically generated)
    const beepUrl = generateMicrowaveBeep();
    const intervalBeep = new Audio(beepUrl);
    intervalBeep.loop = false;
    intervalBeepRef.current = intervalBeep;
    
    // Listen for mute toggle events
    const handleMuteToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ muted: boolean }>;
      if (countdownAudioRef.current) {
        countdownAudioRef.current.volume = customEvent.detail.muted ? 0 : 1;
      }
      if (endAudioRef.current) {
        endAudioRef.current.volume = customEvent.detail.muted ? 0 : 1;
      }
      if (intervalBeepRef.current) {
        intervalBeepRef.current.volume = customEvent.detail.muted ? 0 : 1;
      }
    };
    
    window.addEventListener('muteToggle', handleMuteToggle);
    
    // Check initial mute state from localStorage
    const savedMuteState = localStorage.getItem('masterchef_muted');
    if (savedMuteState === 'true') {
      if (countdownAudioRef.current) countdownAudioRef.current.volume = 0;
      if (endAudioRef.current) endAudioRef.current.volume = 0;
      if (intervalBeepRef.current) intervalBeepRef.current.volume = 0;
    }
    
    return () => {
      window.removeEventListener('muteToggle', handleMuteToggle);
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current = null;
      }
      if (endAudioRef.current) {
        endAudioRef.current.pause();
        endAudioRef.current = null;
      }
      if (intervalBeepRef.current) {
        intervalBeepRef.current.pause();
        intervalBeepRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (timerStartTime && timerEndTime) {
      setIsActive(true);
      
      // Reset played intervals for new round
      playedIntervalsRef.current.clear();
      
      // Use refs to track if sounds have been played to avoid re-renders
      const soundsPlayed = { countdown: false, end: false };
      
      const interval = setInterval(() => {
        const now = Date.now();
        const endMs = timerEndTime.toMillis();
        const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
        
        setRemainingTime(remaining);
        
        // Check for interval beeps
        if (intervalCheckpoints.includes(remaining) && 
            !playedIntervalsRef.current.has(remaining) && 
            intervalBeepRef.current) {
          intervalBeepRef.current.play().catch(err => 
            console.error('Failed to play interval beep:', err)
          );
          playedIntervalsRef.current.add(remaining);
        }
        
        // Play countdown sound at 32 seconds
        if (remaining === 32 && !soundsPlayed.countdown && countdownAudioRef.current) {
          countdownAudioRef.current.play().catch(err => console.error('Failed to play countdown:', err));
          soundsPlayed.countdown = true;
        }
        
        if (remaining === 0) {
          clearInterval(interval);
          setIsActive(false);
          
          // Play random end sound 1 second after timer ends
          if (!soundsPlayed.end && endAudioRef.current) {
            setTimeout(() => {
              endAudioRef.current?.play().catch(err => console.error('Failed to play end sound:', err));
            }, 1000);
            soundsPlayed.end = true;
          }
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setRemainingTime(roundTime);
      setIsActive(false);
    }
  }, [timerStartTime, timerEndTime, roundTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentRemaining = (remainingTime / roundTime) * 100;
  const isWarning = percentRemaining <= 25;
  const isCritical = percentRemaining <= 5;

  const timerColor = isCritical || isWarning ? 'var(--color-burgundy)' : 'var(--color-gold)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        paddingTop: '5rem',
      }}
    >
      <div style={{ maxWidth: '48rem', width: '100%', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-gold)',
            marginBottom: '2rem',
          }}
        >
          Cooking Round
        </h1>

        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-serif)',
              color: 'var(--color-charcoal)',
              marginBottom: '1rem',
            }}
          >
            Currently Cooking
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: currentChefs.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {currentChefs.map((chef) => (
              <div
                key={chef.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-cream)',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--color-charcoal)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-charcoal)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {chef.name}
                </p>
                <p
                  style={{
                    fontStyle: 'italic',
                    color: 'var(--color-charcoal)',
                    opacity: 0.7,
                  }}
                >
                  {chef.dish}
                </p>
              </div>
            ))}
          </div>

          <motion.div
            animate={{
              scale: isCritical ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isCritical ? Infinity : 0,
            }}
            style={{
              fontSize: '5rem',
              fontFamily: 'var(--font-serif)',
              color: timerColor,
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            {formatTime(remainingTime)}
          </motion.div>

          {!isActive && remainingTime === roundTime && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={onStart}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: 'var(--color-gold)',
                  color: 'var(--color-charcoal)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Start Cooking!
              </button>
            </div>
          )}



          {!isActive && remainingTime === 0 && (
            <div>
              <p
                style={{
                  fontSize: '2rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-burgundy)',
                  marginBottom: '1rem',
                }}
              >
                Time's Up!
              </p>
              <button
                onClick={onComplete}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: 'var(--color-gold)',
                  color: 'var(--color-charcoal)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoundTimer;
