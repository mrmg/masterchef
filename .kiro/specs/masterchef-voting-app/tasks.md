# Implementation Plan

- [x] 1. Set up project structure and Firebase configuration
  - Initialize React + TypeScript + Vite project with Tailwind CSS
  - Install Firebase SDK and configure Firestore and Hosting
  - Install Framer Motion for animations and transitions
  - Install Google Fonts (Playfair Display, Lato) for restaurant menu aesthetic
  - Create environment configuration for Firebase credentials
  - Set up project folder structure (components, hooks, types, utils)
  - Configure Tailwind with custom color palette (cream, charcoal, gold, burgundy, sage)
  - _Requirements: 16.1, 16.2_

- [x] 2. Implement core data models and TypeScript interfaces
  - Define TypeScript interfaces for SessionDocument, Chef, Vote, GamePhase enum
  - Create utility types for component props and state
  - Define Firestore schema types matching the design document
  - _Requirements: 16.1_

- [x] 3. Create Firebase service layer
  - Implement Firestore initialization and connection management
  - Create service functions for session CRUD operations
  - Implement real-time listener setup for session updates
  - Add error handling and retry logic for Firestore operations
  - _Requirements: 16.1, 16.3, 16.4, 16.5_

- [x] 4. Build session management functionality
- [x] 4.1 Implement session code generation
  - Create utility function to generate unique 6-character alphanumeric codes
  - Add collision detection by checking Firestore for existing codes
  - _Requirements: 1.2, 1.4_

- [x] 4.2 Create SessionManager component
  - Build UI for "Create Session" and "Join Session" options
  - Implement session creation flow that initializes Firestore document
  - Implement session joining flow with code validation
  - Add URL fragment handling to auto-join from shared links
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Implement game configuration interface
- [x] 5.1 Create GameConfig component
  - Build UI for selecting simultaneous players (1-4, default 2)
  - Build UI for selecting round time with dropdown (5sec for testing, 5min increments to 60min, default 20min)
  - Implement config validation and immediate Firestore synchronization
  - Subscribe to Firestore config changes to update UI on all connected devices
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 6. Build contestant management system
- [x] 6.1 Create ContestantManager component
  - Build form for entering chef name and dish name
  - Handle blank dish names by displaying "mystery dish"
  - Implement add chef functionality that writes to Firestore
  - Display list of added chefs with their order
  - _Requirements: 4.1, 4.2_

- [x] 6.2 Implement chef ordering features
  - Create randomize button with shuffle animation
  - Implement drag-and-drop or button-based manual reordering
  - Update chef order in Firestore when changed
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 7. Create game state management
- [x] 7.1 Implement GameContext with React Context API
  - Create context provider that subscribes to Firestore session document
  - Expose game state and action methods to all components
  - Implement state synchronization across all connected devices
  - Handle loading and error states
  - _Requirements: 15.1, 15.2, 15.4, 15.5_

- [x] 7.2 Implement game phase transition logic
  - Create functions to advance between game phases (LOBBY → SETUP → ROUND_READY → etc.)
  - Implement round scheduling to determine which chefs cook next
  - Add validation to ensure proper phase progression
  - _Requirements: 15.3_

- [x] 8. Build round timer system
- [x] 8.1 Create RoundTimer component
  - Display current chefs and their dish names in ROUND_READY phase
  - Display configured round time without starting countdown (ready state)
  - Add "Start" button that writes timerStartTime and timerEndTime to Firestore
  - Calculate remaining time client-side based on synchronized Firebase timestamps
  - Ensure all connected devices countdown to the same end time
  - When timer reaches zero, display "Time's Up!" message
  - Add "Continue" button that transitions to ROUND_COMPLETE phase
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 8.2 Implement timer visual feedback
  - Change timer color to red when <25% time remaining
  - Add flashing animation when <5% time remaining
  - Ensure visual changes are responsive and smooth
  - _Requirements: 6.1, 6.2_

- [x] 8.3 Add audio feedback for timer
  - Integrate Web Audio API for sound playback
  - Play buzzer sound at each 5-minute interval
  - Play countdown music timed to finish at timer end
  - Adjust audio timing for 5-second test rounds
  - Handle audio loading errors gracefully
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 9. Implement voting system
- [x] 9.1 Create VotingInterface component
  - Display all participant names for voter selection
  - Implement voter selection flow
  - Show chef name and dish when voting
  - Create voting UI with sliders for Technique, Presentation, and Taste (0-10)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9.2 Implement vote submission and flow control
  - Submit votes to Firestore using transactions for consistency
  - Show remaining chefs after voting for one chef
  - Return to name selection after completing all chefs in round
  - Prevent chefs from voting for themselves
  - Track voting completion status in Firestore
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9.3 Add voting completion detection
  - Monitor which participants have completed voting
  - Display confirmation prompt when all votes are cast
  - Allow host to proceed to next round or results
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Create results countdown and display
- [x] 10.1 Implement ResultsCountdown component
  - Create 10-second countdown before results
  - Apply visual styling similar to round timer (flashing at <5 seconds)
  - Play dramatic countdown music
  - Automatically transition to results when countdown completes
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10.2 Build ResultsDisplay component
  - Calculate total scores by aggregating votes from Firestore
  - Display winner prominently at top of screen
  - Create overall leaderboard ranked by total score
  - _Requirements: 11.1, 11.2_

- [x] 10.3 Implement category-specific leaderboards
  - Create leaderboards for Technique, Presentation, and Taste categories
  - Rank chefs by individual category scores
  - _Requirements: 11.3_

- [x] 10.4 Create detailed vote tables
  - Display all votes cast for each chef in table format
  - Show voter names and their scores in each category
  - _Requirements: 11.4_

- [x] 10.5 Add swipe navigation for result views
  - Implement swipe gestures to navigate between result screens
  - Support both touch swipe and button navigation
  - Maintain current view state
  - _Requirements: 11.5_

- [x] 11. Implement results persistence and access
  - Ensure results remain accessible when accessing session URL after game ends
  - Load and display results from Firestore for completed sessions
  - Add button to return to create game screen
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12. Fix game flow and timer synchronization issues
- [x] 12.1 Fix game configuration synchronization
  - Ensure roundTime configuration is written to Firebase when set in GameConfig
  - Verify all connected devices receive updated roundTime from Firebase
  - Test that configured roundTime is used in RoundTimer component
  - _Requirements: 2.6, 2.7_

- [x] 12.2 Implement proper ROUND_READY phase
  - Modify game flow to transition to ROUND_READY before ROUND_ACTIVE
  - Display chefs and configured round time without starting timer
  - Show start button in ROUND_READY phase
  - Prevent timer from auto-starting when entering ROUND_READY
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 12.3 Synchronize timer start time to Firebase
  - When start button is pressed, write timerStartTime and timerEndTime to Firebase
  - Calculate timerEndTime as timerStartTime + roundTime
  - Ensure timerStartTime uses Firebase server timestamp for accuracy
  - Update game phase to ROUND_ACTIVE after writing timestamps
  - _Requirements: 5.4, 5.5, 5.6_

- [x] 12.4 Add continue button after timer completion
  - When timer reaches zero, display "Time's Up!" message
  - Show continue button instead of auto-advancing
  - When continue is pressed, transition to VOTING phase
  - Ensure continue button is synchronized across all devices
  - _Requirements: 5.7, 5.8_

- [x] 13. Implement game control features
- [x] 13.1 Add restart round functionality
  - Create restartRound service function that resets current round to ROUND_READY
  - Clear timerStartTime and timerEndTime in Firebase
  - Preserve currentRound number and currentRoundChefs
  - Add restart round button to RoundTimer component (visible in ROUND_READY, ROUND_ACTIVE, ROUND_COMPLETE)
  - Synchronize restart action across all connected devices
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 13.2 Add restart game functionality
  - Create restartGame service function that resets game to SETUP phase
  - Clear all round data (currentRound, currentRoundChefs, timer states)
  - Clear all votes and voting status
  - Mark all chefs as hasCooked: false
  - Preserve chef list and game configuration
  - Add restart game button with confirmation dialog
  - Make button available in all phases after SETUP
  - Synchronize restart action across all connected devices
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [x] 14. Create responsive layouts
- [x] 14.1 Implement TabletLayout component
  - Use viewport-based scaling (vh/vw units) to fit content without scrolling
  - Adjust font sizes dynamically based on screen dimensions
  - Ensure all interactive elements are at least 60px touch targets
  - Test on tablet viewport sizes (768px - 1024px)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 14.2 Implement MobileLayout component
  - Create stack-based layouts for narrow screens
  - Allow vertical scrolling where necessary
  - Ensure touch targets are at least 44px
  - Support portrait and landscape orientations
  - Test on mobile viewport sizes (320px - 480px)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 15. Set up Firebase Hosting and deployment
  - Configure firebase.json for hosting with SPA rewrites
  - Create build script for production deployment
  - Set up environment variables for Firebase config
  - Deploy initial version to masterchefgame.web.app
  - _Requirements: 16.2_

- [x] 16. Implement Firestore security rules
  - Write security rules allowing read/write access to anyone with session code
  - Deploy security rules to Firebase
  - Test security rules with Firebase Emulator
  - _Requirements: 16.1_

- [x] 17. Implement live photo feed
- [x] 17.1 Set up Firebase Storage integration
  - Configure Firebase Storage in project
  - Create storage service functions for photo uploads
  - Implement image resizing using canvas API (max 1920px width)
  - Generate thumbnails (320px width) for performance
  - Handle file validation (type, size limits)
  - _Requirements: 19.2_

- [x] 17.2 Create LivePhotoFeed component with real-time updates
  - Subscribe to Firestore photos collection with real-time listener
  - Implement photo upload functionality with round context detection
  - Associate photos with current round number and chef IDs based on game phase
  - Mark photos as pre-game or post-game when appropriate
  - Add floating action button (FAB) for photo upload, visible in all phases
  - Show upload progress indicator
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 17.3 Implement photo gallery modal with round grouping
  - Create gallery icon with unviewed count badge
  - Build modal overlay with vertical scrollable photo list
  - Group photos by round with section headers (Round X: Chef Names)
  - Display photos newest rounds first, pre-game/post-game at bottom
  - Show photo thumbnails with uploader name and timestamp
  - Implement full-screen photo view with swipe navigation
  - Display round context in full-screen view (round number and chef names)
  - Add pinch-to-zoom support for full-screen photos
  - _Requirements: 19.6, 19.7, 19.9, 19.11, 19.12_

- [x] 17.4 Add real-time photo notifications
  - Detect new photos from Firestore updates
  - Show "New Photo" toast notification when photos are uploaded by others
  - Update gallery badge with unviewed count
  - Store lastViewedTimestamp in localStorage
  - Mark photos as viewed when gallery is opened
  - _Requirements: 19.5, 19.8, 19.9, 19.10_

- [x] 17.5 Optimize photo feed performance
  - Implement lazy loading for thumbnails
  - Add virtual scrolling for large photo lists
  - Cache downloaded images in browser storage
  - Add skeleton loading states
  - Handle upload errors with retry functionality
  - Use WebP format for thumbnails when supported
  - _Requirements: 19.8_

- [x] 17.6 Enable remote viewer experience
  - Allow joining session without participating in voting
  - Display current game phase to remote viewers
  - Ensure photo feed and notifications work for remote viewers
  - Test photo feed across multiple devices simultaneously
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
