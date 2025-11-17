# Design Document: Timer Interval Beeps

## Overview

This feature enhances the RoundTimer component by adding periodic audio notifications at regular intervals during cooking rounds. The design integrates seamlessly with the existing timer infrastructure, audio management system, and mute controls while providing configurable intervals for both production and testing scenarios.

## Architecture

### Component Structure

The implementation will be contained within the existing `RoundTimer` component (`src/components/RoundTimer.tsx`), leveraging the current audio management patterns already established for countdown and end sounds.

**Key Design Decisions:**
- Reuse existing audio initialization and mute control patterns
- Calculate interval checkpoints dynamically based on round duration
- Track played intervals to prevent duplicate beeps
- Support configuration switching between test and production modes

### Audio Management

The interval beep system will follow the same audio management pattern as existing sounds:
- Audio element created during component initialization
- Volume controlled by mute state from localStorage
- Responds to muteToggle events
- Cleanup on component unmount

## Components and Interfaces

### Modified Component: RoundTimer

**New State/Refs:**
```typescript
const intervalBeepRef = useRef<HTMLAudioElement | null>(null);
const playedIntervalsRef = useRef<Set<number>>(new Set());
```

**Configuration:**
```typescript
// At component level or passed as prop
const USE_TEST_MODE = true; // Toggle for testing vs production

// Derived values
const totalDuration = USE_TEST_MODE ? 120 : roundTime; // 2 min vs actual round time
const intervalSeconds = USE_TEST_MODE ? 30 : 300; // 30 sec vs 5 min
```

**Interval Calculation Logic:**
```typescript
// Calculate which intervals should trigger beeps
// For 20-minute round (1200s): [900, 600, 300] (15min, 10min, 5min)
// For 2-minute test (120s): [90, 60, 30] (1m30s, 1m, 30s)
const calculateIntervals = (duration: number, interval: number): number[] => {
  const intervals: number[] = [];
  for (let time = interval; time < duration; time += interval) {
    intervals.push(time);
  }
  return intervals.reverse(); // Descending order for countdown
};
```

### Audio Asset

**New Audio File Required:**
- File: `src/assets/microwave-beep.mp3`
- Duration: 1-3 seconds
- Style: Short, microwave-style beep sound
- Format: MP3

## Data Models

No new data models required. The feature uses existing timer state and adds local tracking:

```typescript
// Tracking structure (in-memory, component-scoped)
playedIntervalsRef.current: Set<number> // Set of interval times that have been played
```

## Error Handling

### Audio Playback Failures

```typescript
intervalBeepRef.current?.play().catch(err => 
  console.error('Failed to play interval beep:', err)
);
```

**Failure Scenarios:**
- Audio file not loaded: Graceful degradation, timer continues without beeps
- Browser autoplay restrictions: User interaction required before audio plays
- Audio element not initialized: Null check prevents crashes

### Configuration Errors

- Invalid interval values: Default to production mode values
- Missing audio file: Component continues functioning, logs error

## Implementation Details

### Timer Loop Integration

The existing timer interval (runs every 100ms) will be enhanced to check for interval beeps:

```typescript
const interval = setInterval(() => {
  const now = Date.now();
  const endMs = timerEndTime.toMillis();
  const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
  
  setRemainingTime(remaining);
  
  // Existing countdown sound at 32 seconds
  if (remaining === 32 && !soundsPlayed.countdown && countdownAudioRef.current) {
    countdownAudioRef.current.play().catch(err => console.error('Failed to play countdown:', err));
    soundsPlayed.countdown = true;
  }
  
  // NEW: Check for interval beeps
  if (intervalCheckpoints.includes(remaining) && 
      !playedIntervalsRef.current.has(remaining) && 
      intervalBeepRef.current) {
    intervalBeepRef.current.play().catch(err => 
      console.error('Failed to play interval beep:', err)
    );
    playedIntervalsRef.current.add(remaining);
  }
  
  // Existing timer end logic
  if (remaining === 0) {
    clearInterval(interval);
    setIsActive(false);
    // ... end sound logic
  }
}, 100);
```

### Mute Control Integration

The interval beep will integrate with the existing mute system:

```typescript
useEffect(() => {
  // ... existing audio initialization
  
  // NEW: Initialize interval beep audio
  const intervalBeep = new Audio(microwaveBeepSound);
  intervalBeep.loop = false;
  intervalBeepRef.current = intervalBeep;
  
  const handleMuteToggle = (event: Event) => {
    const customEvent = event as CustomEvent<{ muted: boolean }>;
    if (countdownAudioRef.current) {
      countdownAudioRef.current.volume = customEvent.detail.muted ? 0 : 1;
    }
    if (endAudioRef.current) {
      endAudioRef.current.volume = customEvent.detail.muted ? 0 : 1;
    }
    // NEW: Apply mute to interval beep
    if (intervalBeepRef.current) {
      intervalBeepRef.current.volume = customEvent.detail.muted ? 0 : 1;
    }
  };
  
  // ... existing event listener setup
  
  // NEW: Check initial mute state for interval beep
  const savedMuteState = localStorage.getItem('masterchef_muted');
  if (savedMuteState === 'true') {
    if (countdownAudioRef.current) countdownAudioRef.current.volume = 0;
    if (endAudioRef.current) endAudioRef.current.volume = 0;
    if (intervalBeepRef.current) intervalBeepRef.current.volume = 0;
  }
  
  return () => {
    // ... existing cleanup
    // NEW: Cleanup interval beep
    if (intervalBeepRef.current) {
      intervalBeepRef.current.pause();
      intervalBeepRef.current = null;
    }
  };
}, []);
```

### Reset on Timer Restart

When the timer restarts (new round), the played intervals set must be cleared:

```typescript
useEffect(() => {
  if (timerStartTime && timerEndTime) {
    setIsActive(true);
    playedIntervalsRef.current.clear(); // Reset played intervals for new round
    
    // ... rest of timer logic
  }
}, [timerStartTime, timerEndTime, roundTime]);
```

## Testing Strategy

### Manual Testing Approach

1. **Test Mode Verification** (2-minute timer, 30-second intervals)
   - Start timer and verify beeps at 1m30s, 1m, and 30s
   - Confirm no beep at 0s (end sound plays instead)
   - Verify countdown sound still plays at 32s

2. **Production Mode Verification** (20-minute timer, 5-minute intervals)
   - Start timer and verify beeps at 15min, 10min, and 5min
   - Confirm proper spacing between beeps

3. **Mute Control Testing**
   - Toggle mute before timer starts - verify no beeps play
   - Toggle mute during timer - verify beeps respect new state
   - Refresh page with mute enabled - verify beeps remain muted

4. **Audio Distinctiveness**
   - Verify interval beep sounds different from countdown (32s)
   - Verify interval beep sounds different from end sounds
   - Confirm microwave-style tone is recognizable

5. **Edge Cases**
   - Start/stop timer multiple times - verify no duplicate beeps
   - Multiple rounds - verify intervals reset properly
   - Browser autoplay restrictions - verify graceful handling

### Configuration Testing

Test both modes by toggling the `USE_TEST_MODE` constant:

```typescript
// For testing
const USE_TEST_MODE = true;

// For production
const USE_TEST_MODE = false;
```

### Browser Compatibility

Test audio playback across:
- Chrome/Edge (Chromium)
- Firefox
- Safari (may have stricter autoplay policies)

## Configuration

### Test Mode vs Production Mode

The feature will use a simple boolean flag to switch between modes:

```typescript
// Option 1: Component-level constant (for development)
const USE_TEST_MODE = true;

// Option 2: Environment variable (for deployment)
const USE_TEST_MODE = import.meta.env.VITE_TIMER_TEST_MODE === 'true';

// Option 3: Props-based (for runtime control)
interface RoundTimerProps {
  // ... existing props
  useTestMode?: boolean;
}
```

**Recommendation:** Start with Option 1 (component constant) for simplicity, can be enhanced later if needed.

## Dependencies

### New Assets Required
- Microwave beep sound file (`src/assets/microwave-beep.mp3`)

### Existing Dependencies (no changes)
- React hooks (useState, useEffect, useRef)
- Firebase Timestamp
- Framer Motion
- Existing audio assets

## Migration Notes

This is a purely additive feature with no breaking changes:
- No database schema changes
- No API changes
- No prop interface changes (unless optional test mode prop is added)
- Existing timer functionality remains unchanged
- Backward compatible with all existing game sessions
