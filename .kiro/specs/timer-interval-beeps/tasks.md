# Implementation Plan

- [x] 1. Add microwave beep audio asset
  - Source or create a microwave-style beep sound effect (1-3 seconds duration)
  - Save the audio file as `src/assets/microwave-beep.mp3`
  - Verify the audio file plays correctly in the browser
  - _Requirements: 1.5_

- [x] 2. Implement interval calculation logic
  - Add `calculateIntervals` helper function that generates interval checkpoints based on duration and interval spacing
  - Add `USE_TEST_MODE` configuration constant at component level
  - Calculate `intervalCheckpoints` array using the helper function with appropriate values for test/production mode
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Initialize interval beep audio element
  - Import the microwave beep audio file in RoundTimer component
  - Create `intervalBeepRef` using useRef to store the audio element
  - Initialize the audio element in the existing useEffect that sets up countdown and end sounds
  - Set loop property to false to prevent repeating
  - _Requirements: 1.5, 3.2_

- [x] 4. Integrate mute controls for interval beep
  - Add interval beep volume control to the existing `handleMuteToggle` event handler
  - Apply initial mute state from localStorage to interval beep audio element
  - Add interval beep cleanup to the useEffect return function
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Implement interval beep playback logic
  - Create `playedIntervalsRef` using useRef with a Set to track which intervals have been played
  - Add interval checkpoint checking logic to the existing timer interval loop
  - Play interval beep when remaining time matches an unplayed checkpoint
  - Mark intervals as played after beep is triggered
  - Add error handling for audio playback failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.4, 4.5_

- [x] 6. Reset interval tracking on timer restart
  - Clear the `playedIntervalsRef` Set when timer starts (in the useEffect that monitors timerStartTime/timerEndTime)
  - Ensure intervals reset properly between rounds
  - _Requirements: 4.4, 4.5_

- [x] 7. Manual testing and verification
  - Test with USE_TEST_MODE = true: verify beeps at 1m30s, 1m, and 30s in a 2-minute timer
  - Test with USE_TEST_MODE = false: verify beeps at 15min, 10min, and 5min in a 20-minute timer
  - Verify no beep plays at 0 seconds (end sound should play instead)
  - Verify countdown sound at 32 seconds still works
  - Test mute button toggles interval beeps correctly
  - Test page refresh with mute enabled persists mute state for interval beeps
  - Verify interval beep sound is distinct from countdown and end sounds
  - Test multiple timer starts/stops to ensure no duplicate beeps
  - Test across multiple rounds to verify interval tracking resets properly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Verify gallery connection counter shows all session connections
  - Review connectionService.ts to understand how connections are tracked and counted
  - Verify that the connection counter in MediaGallery shows count of all users connected to the session code, not just users with gallery open
  - Test by opening multiple browser tabs/windows with the same session code in different phases (lobby, timer, voting, etc.)
  - Confirm the connection counter increments for each new connection regardless of which page/phase they're on
  - If the counter only tracks gallery viewers, modify the connection tracking to be session-wide rather than gallery-specific
  - Ensure heartbeat mechanism starts when users join the session (not just when opening gallery)
  - Test that connections are properly cleaned up when users close tabs or navigate away
  - _Requirements: N/A (additional verification task)_
