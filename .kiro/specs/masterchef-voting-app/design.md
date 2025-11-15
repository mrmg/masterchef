# Design Document

## Overview

The MasterChef Game Application is a real-time, multi-device web application built on Firebase. The system uses a distributed architecture where any connected device has full control capabilities, with Firestore providing real-time synchronization across all participants. The application follows a state machine pattern to manage game flow through distinct phases: session creation, contestant management, cooking rounds, voting, and results display.

## Architecture

### Technology Stack

- **Frontend Framework**: React with TypeScript for type safety and component reusability
- **State Management**: React Context API with custom hooks for local state, Firestore for distributed state
- **Backend**: Firebase Firestore for real-time database, Firebase Hosting for static site deployment
- **Styling**: Tailwind CSS for responsive design with custom animations
- **Animation Library**: Framer Motion for elegant page transitions and state changes
- **Build Tool**: Vite for fast development and optimized production builds
- **Audio**: Web Audio API for sound effects and countdown music

## Visual Design Language

### Restaurant Menu Aesthetic

The application adopts an upscale restaurant menu aesthetic to create an elegant, sophisticated experience befitting a culinary competition.

#### Typography
- **Primary Font**: Serif font family (e.g., Playfair Display, Cormorant) for headings and chef names
- **Secondary Font**: Sans-serif font (e.g., Lato, Open Sans) for body text and UI elements
- **Hierarchy**: Large, elegant headings with generous spacing, reminiscent of fine dining menus

#### Color Palette
- **Background**: Cream/off-white (#FAF9F6) or dark charcoal (#2C2C2C) for contrast
- **Primary Text**: Deep charcoal (#2C2C2C) on light backgrounds, cream on dark
- **Accent Colors**: 
  - Gold/brass (#D4AF37) for highlights and winner displays
  - Deep burgundy (#800020) for timer warnings
  - Sage green (#9CAF88) for success states
- **Borders**: Thin, elegant lines in muted gold or charcoal

#### Visual Elements
- **Dividers**: Ornamental dividers between sections (subtle flourishes)
- **Cards**: Subtle shadows with rounded corners, resembling menu cards
- **Borders**: Thin decorative borders around important elements
- **Icons**: Minimalist, line-based icons that complement the elegant aesthetic
- **Whitespace**: Generous padding and margins for a clean, uncluttered look

#### Layout Principles
- **Centered Layouts**: Important content centered on the page
- **Vertical Rhythm**: Consistent spacing between elements
- **Grid System**: Asymmetric grids for visual interest while maintaining balance
- **Focal Points**: Clear visual hierarchy directing attention to key information

### Animation and Transitions

All transitions should be smooth, elegant, and purposeful, enhancing the premium feel of the application.

#### Page Transitions
- **Duration**: 400-600ms for page transitions
- **Easing**: Ease-in-out curves for natural motion
- **Types**:
  - Fade + slide up for entering screens
  - Fade + slide down for exiting screens
  - Cross-fade for result view changes

#### State Change Animations
- **Chef List Randomization**: 
  - Cards shuffle with staggered timing (100ms delay between each)
  - Smooth position transitions using spring physics
  - Subtle scale effect (0.95 → 1.0) on settling
  
- **Timer State Changes**:
  - Color transitions over 500ms when entering warning/critical states
  - Pulse animation for flashing (scale 1.0 → 1.05 → 1.0)
  - Smooth countdown number changes with fade transitions

- **Voting Submission**:
  - Success checkmark animation with scale + fade
  - Card flip transition when moving to next chef
  - Progress indicator with smooth fill animation

- **Results Reveal**:
  - Staggered entrance for leaderboard items (100ms delay each)
  - Winner announcement with dramatic scale + fade entrance
  - Score numbers count up with easing

#### Micro-interactions
- **Button Hovers**: Subtle scale (1.0 → 1.02) and shadow increase
- **Button Presses**: Quick scale down (1.0 → 0.98) for tactile feedback
- **Input Focus**: Smooth border color transition and subtle glow
- **Card Hovers**: Gentle lift effect with shadow increase
- **Swipe Gestures**: Momentum-based scrolling with spring physics

#### Loading States
- **Skeleton Screens**: Subtle shimmer animation on loading placeholders
- **Spinners**: Elegant rotating animation for async operations
- **Progress Bars**: Smooth fill animation with easing

### Framer Motion Implementation

Use Framer Motion for declarative animations:

```typescript
// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.4, ease: "easeIn" } }
};

// Staggered list animations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Spring physics for shuffle
const shuffleVariants = {
  shuffle: {
    scale: [1, 0.95, 1],
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Hosting                         │
│                  (masterchefgame.web.app)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Tablet     │  │   Mobile     │  │   Mobile     │     │
│  │   Device     │  │   Device 1   │  │   Device 2   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Firestore                         │
│                                                               │
│  /sessions/{sessionCode}                                     │
│    ├─ config: { simultaneousPlayers, roundTime }            │
│    ├─ state: { phase, currentRound, timerStart }            │
│    ├─ chefs: [{ name, dish, order }]                        │
│    ├─ votes: { [voterName]: { [chefName]: scores } }        │
│    └─ photos: [{ url, timestamp }] (optional)               │
└─────────────────────────────────────────────────────────────┘
```

### Game State Machine

The application follows a finite state machine with these phases:

1. **LOBBY**: Session creation or joining
2. **SETUP**: Contestant management and ordering (includes game configuration)
3. **ROUND_READY**: Displaying chefs about to cook with start button, timer not yet started
4. **ROUND_ACTIVE**: Timer counting down after start button pressed
5. **ROUND_COMPLETE**: Round finished, displaying continue button
6. **VOTING**: Participants casting votes
7. **RESULTS_COUNTDOWN**: 10-second dramatic countdown
8. **RESULTS**: Displaying leaderboards and vote breakdowns

**Critical State Transitions:**
- **SETUP → ROUND_READY**: Game configuration (simultaneousPlayers, roundTime) must be synchronized to Firebase before transitioning
- **ROUND_READY → ROUND_ACTIVE**: Timer start time (timerStartTime, timerEndTime) must be synchronized to Firebase when start button is pressed
- **ROUND_ACTIVE → ROUND_COMPLETE**: Automatically transitions when timer reaches zero
- **ROUND_COMPLETE → VOTING**: Requires user to press continue button

## Components and Interfaces

### Core Components

#### 1. SessionManager Component
Handles session creation and joining logic.

**Props**: None (uses URL fragment)

**State**:
- `sessionCode: string | null`
- `isCreating: boolean`
- `isJoining: boolean`

**Key Methods**:
- `createSession()`: Generates unique code, initializes Firestore document
- `joinSession(code: string)`: Validates and connects to existing session
- `generateSessionCode()`: Creates 6-character alphanumeric code

#### 2. GameConfig Component
Configuration interface for game settings with real-time synchronization.

**Props**:
- `sessionCode: string`

**State**:
- `simultaneousPlayers: number` (1-4, default 2)
- `roundTime: number` (seconds, default 1200)

**Key Methods**:
- `updateConfig()`: Writes config to Firestore immediately when changed
- `validateConfig()`: Ensures valid ranges before writing to Firestore
- `syncConfigFromFirebase()`: Subscribes to config changes and updates local state

**Synchronization Behavior**:
- Component subscribes to session document in Firestore
- When config changes in Firestore, local state updates automatically
- When user changes config locally, immediately writes to Firestore
- All connected devices see config changes within 2 seconds

#### 3. ContestantManager Component
Interface for adding and ordering chefs.

**Props**:
- `sessionCode: string`

**State**:
- `chefs: Chef[]`
- `isRandomizing: boolean`

**Interfaces**:
```typescript
interface Chef {
  id: string;
  name: string;
  dish: string;
  order: number;
}
```

**Key Methods**:
- `addChef(name: string, dish: string)`: Adds new chef to Firestore
- `randomizeOrder()`: Shuffles chef order with animation
- `reorderChef(chefId: string, newOrder: number)`: Manual reordering
- `animateRandomization()`: Visual shuffle effect

#### 4. RoundTimer Component
Displays countdown timer with visual and audio feedback, synchronized across all devices.

**Props**:
- `sessionCode: string`
- `roundTime: number` (from Firebase config)
- `currentChefs: Chef[]`
- `timerStartTime: Timestamp | null` (from Firebase state)
- `timerEndTime: Timestamp | null` (from Firebase state)
- `onStart: () => void` (callback to update Firebase with start time)
- `onComplete: () => void` (callback to transition to ROUND_COMPLETE phase)

**State**:
- `remainingTime: number` (calculated from Firebase timestamps)
- `isActive: boolean` (derived from timerStartTime presence)
- `timerColor: string`
- `isFlashing: boolean`

**Key Methods**:
- `startTimer()`: Calls onStart callback which writes timerStartTime and timerEndTime to Firestore
- `calculateRemainingTime()`: Computes remaining seconds based on current time and timerEndTime from Firebase
- `playBuzzer()`: Plays sound at 5-minute intervals
- `playCountdownMusic()`: Starts timed music track
- `updateVisualState()`: Changes color/flashing based on remaining time

**Synchronization Behavior**:
- Component receives timerStartTime and timerEndTime from Firebase via props
- When timerStartTime is null, displays ready state with start button
- When timerStartTime is set, calculates remaining time client-side using server timestamp
- All connected devices calculate remaining time from the same Firebase timestamp, ensuring synchronization
- When remaining time reaches zero, displays continue button and calls onComplete when pressed

**Visual States**:
- Ready: Shows configured round time with start button (timerStartTime is null)
- Normal: White/default color (>25% remaining, timer active)
- Warning: Red color (≤25% remaining)
- Critical: Red + flashing (≤5% remaining)
- Complete: Shows "Time's Up!" with continue button (remaining time is 0)

#### 5. VotingInterface Component
Multi-step voting flow for participants.

**Props**:
- `sessionCode: string`
- `currentRoundChefs: Chef[]`
- `allParticipants: string[]`

**State**:
- `selectedVoter: string | null`
- `currentChefIndex: number`
- `votes: VoteData`

**Interfaces**:
```typescript
interface VoteData {
  [chefName: string]: {
    technique: number;
    presentation: number;
    taste: number;
  }
}
```

**Key Methods**:
- `selectVoter(name: string)`: Initiates voting for a participant
- `submitVote(chefName: string, scores: CategoryScores)`: Records vote to Firestore
- `getNextChef()`: Advances to next chef in round
- `checkVotingComplete()`: Determines if all participants have voted

**Flow**:
1. Display all participant names
2. Participant selects their name
3. Show first chef with voting sliders (0-10 for each category)
4. Submit vote, show next chef
5. After all chefs voted, return to name selection

#### 6. ResultsDisplay Component
Comprehensive results visualization with multiple views.

**Props**:
- `sessionCode: string`

**State**:
- `currentView: ResultView`
- `allVotes: VoteData`
- `leaderboards: LeaderboardData`

**Interfaces**:
```typescript
enum ResultView {
  WINNER,
  OVERALL_LEADERBOARD,
  TECHNIQUE_LEADERBOARD,
  PRESENTATION_LEADERBOARD,
  TASTE_LEADERBOARD,
  VOTE_TABLES
}

interface LeaderboardEntry {
  chefName: string;
  totalScore: number;
  techniqueScore: number;
  presentationScore: number;
  tasteScore: number;
  rank: number;
}
```

**Key Methods**:
- `calculateLeaderboards()`: Aggregates votes into rankings
- `swipeToNextView()`: Handles gesture navigation
- `renderCurrentView()`: Displays appropriate result screen

**Views**:
1. Winner: Large display of top chef
2. Overall Leaderboard: All chefs ranked by total score
3. Category Leaderboards: Ranked by individual categories
4. Vote Tables: Detailed breakdown of all votes per chef
5. Photo Gallery: Swipeable view of uploaded event photos (optional feature)

#### 7. ResultsCountdown Component
Dramatic 10-second countdown before results.

**Props**:
- `onComplete: () => void`

**State**:
- `countdown: number` (10 to 0)
- `isFlashing: boolean`

**Key Methods**:
- `startCountdown()`: Begins 10-second timer
- `playDramaticMusic()`: Starts countdown audio
- `flashDisplay()`: Activates flashing at <5 seconds

#### 8. LivePhotoFeed Component
Real-time photo gallery with upload and notification features, accessible throughout the game.

**Props**:
- `sessionCode: string`

**State**:
- `photos: Photo[]` (sorted newest first)
- `currentPhotoIndex: number`
- `isUploading: boolean`
- `unviewedCount: number`
- `isGalleryOpen: boolean`
- `lastViewedTimestamp: Timestamp | null`

**Interfaces**:
```typescript
interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  uploadedBy: string;
  timestamp: Timestamp;
  storageRef: string;
  roundNumber: number | null; // null for pre-game/post-game photos
  roundChefs: string[]; // chef IDs for the associated round, empty if no round
}
```

**Key Methods**:
- `uploadPhoto(file: File)`: Uploads to Firebase Storage, adds metadata (including current round info) to Firestore, triggers notifications
- `getCurrentRoundContext()`: Determines current round number and chefs based on game phase
- `subscribeToPhotos()`: Real-time listener for new photos from Firestore
- `markPhotosAsViewed()`: Updates lastViewedTimestamp when gallery is opened
- `calculateUnviewedCount()`: Counts photos uploaded after lastViewedTimestamp
- `swipeToPhoto(index: number)`: Navigates between photos
- `renderGalleryView()`: Scrollable list view showing photos grouped by round
- `renderPhotoDetail(photo: Photo)`: Full-screen photo view with swipe navigation and round context
- `groupPhotosByRound()`: Organizes photos into sections (Pre-game, Round 1, Round 2, etc., Post-game)

**Features**:
- Persistent floating action button (FAB) for photo upload, visible in all phases
- Persistent gallery icon with badge showing unviewed photo count
- "New Photo" toast notification when photos are uploaded by others
- Real-time photo feed updates via Firestore listeners
- Photos sorted newest first for immediate visibility
- Swipe gestures for navigation between photos
- Full-screen photo display with pinch-to-zoom
- Automatic thumbnail generation for performance
- Upload progress indicator
- Photo metadata (uploader name, timestamp)

**Notification Behavior**:
- When a new photo is added to Firestore, all connected devices receive update
- Devices show "New Photo" toast notification (except the uploader)
- Gallery badge increments unviewed count
- Opening gallery marks all photos as viewed and clears badge
- Notifications persist across game phases

**Layout**:
- FAB positioned in bottom-right corner (above other UI elements)
- Gallery icon positioned in top-right corner with badge overlay
- Gallery opens as modal overlay with semi-transparent backdrop
- Photos display in vertical scrollable list (newest at top)
- Tap photo to view full-screen with swipe navigation

### Responsive Layout Components

#### TabletLayout Component
Optimized for tablet devices with no scrolling.

**Features**:
- Viewport-based scaling using CSS `vh` and `vw` units
- Dynamic font sizing based on screen dimensions
- Grid layouts that adapt to available space
- Touch-optimized button sizes (minimum 60px)

#### MobileLayout Component
Optimized for mobile devices with vertical scrolling.

**Features**:
- Stack-based layouts for narrow screens
- Collapsible sections for long content
- Sticky headers for navigation context
- Touch-optimized controls (minimum 44px)

## Data Models

### Firestore Schema

#### Session Document
Path: `/sessions/{sessionCode}`

```typescript
interface SessionDocument {
  // Configuration
  config: {
    simultaneousPlayers: number; // 1-4
    roundTime: number; // seconds
    createdAt: Timestamp;
  };
  
  // Current game state
  state: {
    phase: GamePhase;
    currentRound: number;
    currentRoundChefs: string[]; // chef IDs
    timerStartTime: Timestamp | null;
    timerEndTime: Timestamp | null;
  };
  
  // Participants
  chefs: {
    [chefId: string]: {
      name: string;
      dish: string;
      order: number;
      hasCooked: boolean;
    }
  };
  
  // Voting data
  votes: {
    [roundNumber: number]: {
      [voterName: string]: {
        [chefId: string]: {
          technique: number;
          presentation: number;
          taste: number;
          timestamp: Timestamp;
        }
      }
    }
  };
  
  // Voting completion tracking
  votingStatus: {
    [roundNumber: number]: {
      requiredVoters: string[];
      completedVoters: string[];
    }
  };
  
  // Live photo feed
  photos: {
    [photoId: string]: {
      url: string;
      thumbnailUrl: string;
      uploadedBy: string;
      timestamp: Timestamp;
      storageRef: string; // Firebase Storage path
      roundNumber: number | null; // null for pre-game/post-game photos
      roundChefs: string[]; // chef IDs for the associated round
    }
  };
}
```

### Local State Models

#### GameContext
Provides game state to all components via React Context.

```typescript
interface GameContextValue {
  sessionCode: string;
  gameState: SessionDocument;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateGamePhase: (phase: GamePhase) => Promise<void>;
  startRound: (chefIds: string[]) => Promise<void>;
  submitVote: (voterName: string, chefId: string, scores: CategoryScores) => Promise<void>;
  advanceToNextRound: () => Promise<void>;
  restartRound: () => Promise<void>;
  restartGame: () => Promise<void>;
}
```

### Game Control Features

#### Restart Round
Allows resetting the current round to its initial state (ROUND_READY phase) without losing chef assignments.

**Behavior**:
- Available during ROUND_READY, ROUND_ACTIVE, and ROUND_COMPLETE phases
- Clears timerStartTime and timerEndTime
- Resets phase to ROUND_READY
- Preserves currentRound number and currentRoundChefs
- Does not affect votes from previous rounds

**Use Cases**:
- Timer started accidentally
- Technical issues during cooking
- Need to restart due to external factors

#### Restart Game
Allows resetting the entire game back to the SETUP phase while preserving the chef list and configuration.

**Behavior**:
- Available in any phase after SETUP
- Requires confirmation dialog to prevent accidental resets
- Resets phase to SETUP
- Clears all round data (currentRound, currentRoundChefs, timer states)
- Clears all votes and voting status
- Marks all chefs as hasCooked: false
- Preserves chef list and game configuration (simultaneousPlayers, roundTime)

**Use Cases**:
- Major technical issues
- Want to replay the competition
- Need to start over with same contestants

## Error Handling

### Network Errors
- **Offline Detection**: Monitor `navigator.onLine` and Firestore connection state
- **Retry Logic**: Exponential backoff for failed writes (max 3 attempts)
- **User Feedback**: Toast notifications for connection issues
- **Graceful Degradation**: Cache last known state, allow read-only mode

### Data Validation
- **Input Sanitization**: Validate all user inputs before Firestore writes
- **Schema Validation**: Use TypeScript interfaces to enforce data structure
- **Constraint Checking**: Validate ranges (e.g., votes 0-10, players 1-4)
- **Duplicate Prevention**: Check for duplicate chef names, session codes

### State Conflicts
- **Optimistic Updates**: Update UI immediately, rollback on Firestore error
- **Conflict Resolution**: Last-write-wins for most fields, merge for votes
- **Transaction Usage**: Use Firestore transactions for critical operations (vote submission)

### Audio Failures
- **Fallback Handling**: Continue game if audio fails to load
- **User Permissions**: Request audio permissions, provide visual-only fallback
- **Error Logging**: Log audio errors for debugging without blocking gameplay

## Testing Strategy

### Unit Tests
- **Utility Functions**: Session code generation, score calculation, time formatting
- **Data Transformations**: Vote aggregation, leaderboard calculation
- **Validation Logic**: Input validation, constraint checking
- **Tools**: Vitest for test runner, React Testing Library for component tests

### Integration Tests
- **Firebase Emulator**: Test Firestore interactions locally
- **Component Integration**: Test component communication via Context
- **State Transitions**: Verify game phase transitions
- **Real-time Updates**: Test Firestore listener behavior

### End-to-End Tests
- **Multi-Device Simulation**: Test synchronization across multiple browser instances
- **Complete Game Flow**: Create session → add chefs → run rounds → vote → view results
- **Responsive Layouts**: Test on tablet and mobile viewport sizes
- **Tools**: Playwright for browser automation

### Manual Testing
- **Audio Playback**: Verify countdown music and buzzer sounds
- **Animations**: Check randomization animation smoothness
- **Touch Interactions**: Test on actual tablet and mobile devices
- **Performance**: Monitor Firestore read/write counts, optimize queries

## Performance Considerations

### Firestore Optimization
- **Denormalization**: Store calculated scores to avoid client-side aggregation
- **Indexed Queries**: Use composite indexes for complex queries
- **Batch Writes**: Group related updates into batches
- **Listener Management**: Unsubscribe from listeners when components unmount

### Frontend Optimization
- **Code Splitting**: Lazy load result views and photo gallery
- **Memoization**: Use React.memo for expensive components
- **Virtual Scrolling**: For large vote tables (if many participants)
- **Asset Optimization**: Compress audio files, use WebP for images

### Real-time Sync
- **Debouncing**: Debounce rapid state changes (e.g., manual reordering)
- **Local Caching**: Cache session data in localStorage for faster loads
- **Selective Updates**: Only update changed fields in Firestore
- **Connection Pooling**: Reuse Firestore connection across components

## Security Considerations

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionCode} {
      // Anyone with the session code can read
      allow read: if true;
      
      // Anyone with the session code can write
      // (trust-based system as specified)
      allow write: if true;
    }
  }
}
```

### Input Sanitization
- **XSS Prevention**: Sanitize chef names and dish names
- **Length Limits**: Enforce maximum lengths for text inputs
- **Character Restrictions**: Allow only alphanumeric and basic punctuation

### Session Code Security
- **Collision Prevention**: Use crypto.randomUUID() for unique codes
- **Code Length**: 6-character codes provide 2.2 billion combinations
- **Expiration**: Optionally implement session expiration after 24 hours

## Deployment

### Firebase Hosting Setup
```bash
# Initialize Firebase
firebase init hosting

# Configure firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  }
}

# Build and deploy
npm run build
firebase deploy --only hosting
```

### Environment Configuration
```typescript
// src/config/firebase.ts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "masterchefgame.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};
```

### CI/CD Pipeline
- **GitHub Actions**: Automate build and deployment on push to main
- **Preview Deployments**: Use Firebase Hosting preview channels for PRs
- **Environment Variables**: Store Firebase config in GitHub Secrets

## Accessibility

### WCAG 2.1 Level AA Compliance
- **Color Contrast**: Ensure 4.5:1 ratio for all text
- **Keyboard Navigation**: Support tab navigation and enter/space activation
- **Screen Readers**: Provide ARIA labels for interactive elements
- **Focus Indicators**: Visible focus outlines for all focusable elements

### Responsive Touch Targets
- **Minimum Size**: 44px × 44px for mobile, 60px × 60px for tablet
- **Spacing**: 8px minimum between adjacent touch targets
- **Feedback**: Visual feedback on touch/click (ripple effect)

## Live Photo Feed Implementation

The live photo feed is a core feature that enables real-time photo sharing throughout the competition, creating an engaging experience for both participants and remote viewers.

### Firebase Storage Integration
- **Storage Structure**: `/sessions/{sessionCode}/photos/{photoId}`
- **Upload Process**: 
  1. User taps floating action button (FAB) to select image
  2. Client validates file (JPEG, PNG, WebP, max 5MB)
  3. Determine current round context from game state
  4. Resize to max 1920px width using canvas API
  5. Generate thumbnail (320px width) using canvas API
  6. Upload both full and thumbnail to Firebase Storage
  7. Store URLs and metadata (including round association) in Firestore
  8. Firestore triggers real-time update to all connected devices
- **File Types**: Accept JPEG, PNG, WebP
- **Size Limits**: Max 5MB per photo, max 100 photos per session
- **Metadata**: Store uploader name, timestamp, storage references, round number, chef IDs

**Round Association Logic**:
- **SETUP phase**: roundNumber = null (pre-game)
- **ROUND_READY phase**: roundNumber = currentRound, roundChefs = currentRoundChefs
- **ROUND_ACTIVE phase**: roundNumber = currentRound, roundChefs = currentRoundChefs
- **ROUND_COMPLETE phase**: roundNumber = currentRound, roundChefs = currentRoundChefs
- **VOTING phase**: roundNumber = currentRound, roundChefs = currentRoundChefs (photos of dishes being voted on)
- **RESULTS_COUNTDOWN phase**: roundNumber = null (post-game)
- **RESULTS phase**: roundNumber = null (post-game)

### Real-time Notification System
- **Firestore Listeners**: Subscribe to photos collection for real-time updates
- **New Photo Detection**: Compare incoming photo timestamps with lastViewedTimestamp
- **Toast Notifications**: Show "New Photo from [uploader]" toast for 3 seconds
- **Badge Updates**: Increment unviewed count badge on gallery icon
- **Notification Suppression**: Don't notify the user who uploaded the photo
- **Cross-device Sync**: All connected devices receive notifications simultaneously

### Gallery UI Design
- **Floating Action Button (FAB)**:
  - Positioned bottom-right corner with 16px margin
  - Camera icon with gold background
  - Always visible across all game phases
  - Tap to open file picker
  - Shows upload progress spinner when uploading
  
- **Gallery Icon**:
  - Positioned top-right corner with 16px margin
  - Gallery/grid icon with gold background
  - Badge overlay showing unviewed count (if > 0)
  - Tap to open gallery modal
  
- **Gallery Modal**:
  - Full-screen overlay with semi-transparent backdrop
  - Close button in top-right
  - Photos grouped by round with section headers
  - Section order: Newest rounds first, then "Pre-game" at bottom
  - Section headers: "Round 1: [Chef Names]", "Round 2: [Chef Names]", "Pre-game", "Post-game"
  - Each photo shows thumbnail, uploader name, timestamp
  - Tap photo to view full-screen
  
- **Full-screen Photo View**:
  - Black background
  - Photo centered and scaled to fit
  - Swipe left/right to navigate between photos
  - Pinch-to-zoom support
  - Close button or swipe down to exit
  - Photo metadata overlay (uploader, timestamp, round context)
  - Round context displays: "Round 2: Alice & Bob" or "Pre-game" or "Post-game"

### Performance Optimization
- **Lazy Loading**: Load thumbnails first, full images on demand
- **Virtual Scrolling**: Only render visible photos in gallery list
- **Image Caching**: Cache downloaded images in browser storage
- **Progressive Loading**: Show low-quality placeholder while loading
- **Thumbnail Optimization**: Use WebP format for thumbnails when supported
- **Upload Queue**: Queue multiple uploads and process sequentially

### Local Storage for View Tracking
- **lastViewedTimestamp**: Store in localStorage per session
- **Key Format**: `masterchef_photos_viewed_{sessionCode}`
- **Update Trigger**: When user opens gallery modal
- **Persistence**: Survives page refreshes and reconnections

### Remote Viewer Experience
- **No Voting Required**: Remote viewers can join session without participating
- **Photo Access**: Full access to live photo feed and gallery
- **Notifications**: Receive real-time photo notifications
- **Game Phase Display**: Show current phase (e.g., "Round 2 in progress")
- **Read-only Mode**: Cannot upload photos or vote (optional restriction)

## Future Enhancements

### Additional Features (Not in Current Scope)
- **Chef Profiles**: Add photos and bios for chefs
- **Historical Data**: Track stats across multiple games
- **Spectator Mode**: Read-only access for non-participants
- **Custom Themes**: Branding and color customization
