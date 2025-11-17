# Timer Interval Beeps - Testing Guide

## Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser (typically http://localhost:5173)

3. Create or join a game session and navigate to a cooking round

## Test Mode Configuration

The timer is currently set to **TEST MODE** for easier verification.

- **Test Mode Settings** (in `src/components/RoundTimer.tsx`):
  - `USE_TEST_MODE = true`
  - Timer duration: 2 minutes (120 seconds)
  - Beep intervals: Every 30 seconds
  - Expected beeps at: **1m30s (90s), 1m (60s), 30s**

- **Production Mode Settings**:
  - `USE_TEST_MODE = false`
  - Timer duration: Actual round time (e.g., 20 minutes)
  - Beep intervals: Every 5 minutes
  - Expected beeps at: **15min, 10min, 5min** (for 20-minute round)

## Test Checklist

### ✅ Test 1: Basic Interval Beeps (Test Mode)
- [ ] Start a cooking round timer
- [ ] Verify beep plays at **1m30s** (90 seconds remaining)
- [ ] Verify beep plays at **1m** (60 seconds remaining)
- [ ] Verify beep plays at **30s** (30 seconds remaining)
- [ ] Verify **NO beep** at 0 seconds (end sound should play instead)

### ✅ Test 2: Countdown Sound Still Works
- [ ] Verify countdown sound plays at **32 seconds** remaining
- [ ] Confirm this is distinct from interval beeps

### ✅ Test 3: End Sound Still Works
- [ ] Verify random end sound plays when timer reaches 0
- [ ] Confirm this is distinct from interval beeps

### ✅ Test 4: Mute Controls
- [ ] Toggle mute button BEFORE starting timer
- [ ] Start timer and verify NO beeps play (but timer still counts down)
- [ ] Unmute and start a new round
- [ ] Verify beeps now play correctly
- [ ] Toggle mute DURING timer countdown
- [ ] Verify subsequent beeps respect the new mute state

### ✅ Test 5: Mute Persistence
- [ ] Enable mute
- [ ] Refresh the page
- [ ] Start a timer
- [ ] Verify beeps remain muted after page refresh

### ✅ Test 6: Audio Distinctiveness
- [ ] Listen to interval beep sound
- [ ] Confirm it sounds like a microwave beep (short, simple tone)
- [ ] Confirm it's different from countdown sound (at 32s)
- [ ] Confirm it's different from end sounds (Gordon Ramsay quotes)

### ✅ Test 7: No Duplicate Beeps
- [ ] Start timer
- [ ] Verify each interval beep plays only ONCE
- [ ] Stop timer before it completes
- [ ] Start timer again
- [ ] Verify beeps play again (intervals were reset)

### ✅ Test 8: Multiple Rounds
- [ ] Complete a full cooking round
- [ ] Start a new cooking round
- [ ] Verify interval beeps play correctly in the new round
- [ ] Confirm intervals were properly reset between rounds

### ✅ Test 9: Production Mode (Optional)
- [ ] Change `USE_TEST_MODE` to `false` in `src/components/RoundTimer.tsx`
- [ ] Restart dev server
- [ ] Start a 20-minute cooking round
- [ ] Verify beeps at 15min, 10min, and 5min
- [ ] (This test requires patience - you may want to skip to specific times)

## Browser Compatibility

Test across different browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (note: may have stricter autoplay policies)

## Known Issues / Notes

1. **Programmatic Beep Sound**: Currently using Web Audio API to generate beep sound. If you want a more realistic microwave sound, replace with an actual audio file at `src/assets/microwave-beep.mp3` and update the import in RoundTimer.tsx.

2. **Autoplay Restrictions**: Some browsers may block audio autoplay. If beeps don't play, try interacting with the page first (click anywhere).

3. **Test Mode Duration**: The test mode uses a 2-minute timer regardless of the configured round time. This is intentional for testing purposes.

## Troubleshooting

**Beeps not playing:**
- Check browser console for errors
- Verify mute is not enabled
- Try clicking on the page to enable audio autoplay
- Check browser audio permissions

**Wrong beep timing:**
- Verify `USE_TEST_MODE` is set correctly
- Check `intervalCheckpoints` array in browser console
- Ensure timer is actually running (check remaining time updates)

**Beeps playing multiple times:**
- Check `playedIntervalsRef` is being cleared on timer restart
- Verify interval checking logic in timer loop

## Success Criteria

All tests should pass with:
- ✅ Beeps play at correct intervals
- ✅ No beep at 0 seconds
- ✅ Countdown and end sounds still work
- ✅ Mute controls work correctly
- ✅ No duplicate beeps
- ✅ Intervals reset between rounds
- ✅ Beep sound is distinct and recognizable
