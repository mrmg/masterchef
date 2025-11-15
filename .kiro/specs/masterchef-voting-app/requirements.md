# Requirements Document

## Introduction

The MasterChef Game Application is a web-based system for hosting live cooking competitions. The system manages game sessions with unique codes, orchestrates timed cooking rounds with multiple simultaneous contestants, facilitates multi-category voting by all participants, and displays comprehensive results with leaderboards and voting breakdowns.

## Glossary

- **Game System**: The web application that manages MasterChef game sessions
- **Host**: The user who creates and manages a game session using a tablet device
- **Participant**: Any user who joins a game session to compete or vote
- **Chef**: A participant who is competing by cooking a dish
- **Game Session**: A unique instance of a MasterChef competition identified by a session code
- **Session Code**: A unique identifier used to join a specific game session
- **Round**: A timed cooking period where one or more chefs cook simultaneously
- **Round Time**: The duration allocated for a cooking round, configurable from 5 seconds to 60 minutes
- **Simultaneous Players**: The number of chefs cooking at the same time in a round, configurable from 1 to 4
- **Dish**: The food item prepared by a chef during their round
- **Vote**: A score given by a participant to a chef in three categories: Technique, Presentation, and Taste
- **Vote Category**: One of three scoring dimensions (Technique, Presentation, Taste), each scored from 0 to 10
- **Leaderboard**: A ranked display of all chefs based on their total scores
- **Real-time Synchronization**: The automatic updating of game state across all connected devices
- **Device**: Any tablet or mobile device connected to a game session with full control capabilities

## Requirements

### Requirement 1

**User Story:** As a host, I want to create a new game session with a unique code, so that participants can join my MasterChef competition

#### Acceptance Criteria

1. WHEN a user accesses the root URL, THE Game System SHALL display options to create or join a session
2. WHEN a user selects create session, THE Game System SHALL generate a unique session code
3. THE Game System SHALL display the session code to the host
4. THE Game System SHALL construct a URL with the session code as the fragment identifier
5. WHEN the constructed URL is accessed, THE Game System SHALL load that specific game session

### Requirement 2

**User Story:** As a host, I want to configure game settings when creating a session, so that I can customize the competition format

#### Acceptance Criteria

1. WHEN creating a session, THE Game System SHALL allow selection of simultaneous players from 1 to 4
2. THE Game System SHALL set the default simultaneous players to 2
3. WHEN creating a session, THE Game System SHALL allow selection of round time in 5-minute increments from 5 minutes to 60 minutes
4. THE Game System SHALL provide a 5-second round time option for testing purposes
5. THE Game System SHALL set the default round time to 20 minutes
6. WHEN game configuration is set, THE Game System SHALL synchronize the configuration to Firebase Firestore
7. WHEN configuration changes in Firebase, THE Game System SHALL update all connected devices within 2 seconds

### Requirement 3

**User Story:** As a participant, I want to join an existing game session using a code, so that I can participate in the competition

#### Acceptance Criteria

1. WHEN a user selects join session, THE Game System SHALL prompt for a session code
2. WHEN a valid session code is entered, THE Game System SHALL add the user to that game session
3. IF an invalid session code is entered, THEN THE Game System SHALL display an error message
4. WHEN a user accesses a URL with a session code fragment, THE Game System SHALL automatically join that session
5. THE Game System SHALL persist the session connection for the duration of the game

### Requirement 4

**User Story:** As a host, I want to manage contestant information, so that I can register all chefs and their dishes

#### Acceptance Criteria

1. THE Game System SHALL provide an interface for entering chef name and dish name
2. THE Game System SHALL allow dish name to be blank and display it as "mystery dish"
3. THE Game System SHALL provide a randomize button to shuffle contestant order
4. WHEN the randomize button is pressed, THE Game System SHALL animate the reordering of contestants
5. THE Game System SHALL allow the host to manually reorder contestants after randomization

### Requirement 5

**User Story:** As a host, I want to run timed cooking rounds, so that chefs can compete under time pressure

#### Acceptance Criteria

1. WHEN a cooking round begins, THE Game System SHALL display the currently cooking chefs and their dish names
2. WHEN a cooking round begins, THE Game System SHALL display the configured round time without starting the countdown
3. THE Game System SHALL display a start button to begin the countdown timer
4. WHEN the host presses start, THE Game System SHALL synchronize the timer start time to Firebase Firestore
5. WHEN the timer start time is synchronized, THE Game System SHALL begin the countdown timer on all connected devices
6. THE Game System SHALL calculate remaining time based on the synchronized start time from Firebase
7. WHEN the timer reaches zero, THE Game System SHALL display a continue button
8. WHEN the continue button is pressed, THE Game System SHALL advance to the voting phase

### Requirement 6

**User Story:** As a host, I want visual and audio feedback during rounds, so that the competition remains exciting

#### Acceptance Criteria

1. WHEN remaining time is less than 25 percent of round time, THE Game System SHALL change the timer color to red
2. WHEN remaining time is less than 5 percent of round time, THE Game System SHALL flash the timer
3. THE Game System SHALL play a buzzer sound at each 5-minute interval during the countdown
4. WHEN the timer starts, THE Game System SHALL play countdown music timed to finish when the timer reaches zero
5. WHERE round time is 5 seconds, THE Game System SHALL include audio cues but adjust timing appropriately

### Requirement 7

**User Story:** As a participant, I want to vote for chefs in multiple categories, so that I can provide comprehensive feedback

#### Acceptance Criteria

1. WHEN voting begins, THE Game System SHALL display all participant names for selection
2. WHEN a participant selects their name, THE Game System SHALL display the chefs who cooked in the current round
3. THE Game System SHALL display each chef's name and dish name during voting
4. THE Game System SHALL provide voting interfaces for Technique, Presentation, and Taste categories
5. THE Game System SHALL accept scores from 0 to 10 for each vote category

### Requirement 8

**User Story:** As a participant, I want to vote for all chefs in a round, so that I can evaluate all dishes

#### Acceptance Criteria

1. WHEN a participant completes voting for one chef, THE Game System SHALL display remaining chefs from that round
2. WHEN a participant completes voting for all chefs in a round, THE Game System SHALL return to the name selection screen
3. THE Game System SHALL display chefs in the voting interface if they cooked simultaneously with others
4. THE Game System SHALL prevent chefs from voting for themselves
5. WHEN all participants have voted, THE Game System SHALL await host confirmation before proceeding

### Requirement 9

**User Story:** As a host, I want to see when voting is complete, so that I can move to the next round or results

#### Acceptance Criteria

1. THE Game System SHALL track which participants have completed voting for the current round
2. WHEN all participants have voted, THE Game System SHALL display a confirmation prompt to the host
3. THE Game System SHALL allow the host to proceed to the next round if chefs remain
4. THE Game System SHALL allow the host to proceed to results if all chefs have cooked
5. THE Game System SHALL cycle through all chefs before displaying final results

### Requirement 10

**User Story:** As a participant, I want to see an exciting countdown before results, so that the reveal is dramatic

#### Acceptance Criteria

1. WHEN all voting is complete, THE Game System SHALL display a 10-second countdown
2. WHILE the countdown is active, THE Game System SHALL use visual styling similar to the round timer
3. WHILE the countdown is active, THE Game System SHALL play countdown music
4. WHEN remaining countdown time is less than 5 seconds, THE Game System SHALL flash the display
5. WHEN the countdown reaches zero, THE Game System SHALL display the results screen

### Requirement 11

**User Story:** As a participant, I want to see comprehensive results, so that I can understand how everyone performed

#### Acceptance Criteria

1. THE Game System SHALL display the winner prominently at the top of the results screen
2. THE Game System SHALL provide an overall leaderboard showing all chefs ranked by total score
3. THE Game System SHALL provide category-specific leaderboards for Technique, Presentation, and Taste
4. THE Game System SHALL display detailed vote tables showing all votes cast for each chef
5. THE Game System SHALL allow swiping between different result views

### Requirement 12

**User Story:** As a participant, I want to access results after the game ends, so that I can review the competition later

#### Acceptance Criteria

1. WHEN a user accesses a session URL after the game ends, THE Game System SHALL display the results screen
2. THE Game System SHALL persist all voting data and results for the session
3. THE Game System SHALL allow navigation through all result views from the session URL
4. THE Game System SHALL provide an option to return to the create game screen
5. THE Game System SHALL maintain result accessibility until the session is explicitly deleted

### Requirement 13

**User Story:** As a host using a tablet, I want the interface to fit without scrolling, so that I can manage the game efficiently

#### Acceptance Criteria

1. WHILE the Game System is displayed on a tablet device, THE Game System SHALL scale all screens to fit without vertical scrolling
2. WHILE the Game System is displayed on a tablet device, THE Game System SHALL scale all screens to fit without horizontal scrolling
3. THE Game System SHALL adjust font sizes and element spacing to maintain readability on tablet screens
4. THE Game System SHALL ensure all interactive elements remain accessible on tablet screens
5. THE Game System SHALL maintain aspect ratios and visual hierarchy when scaling for tablet displays

### Requirement 14

**User Story:** As a participant using a mobile device, I want the interface to be responsive, so that I can participate from my phone

#### Acceptance Criteria

1. WHILE the Game System is displayed on a mobile device, THE Game System SHALL allow vertical scrolling where necessary
2. THE Game System SHALL optimize layouts for mobile screen widths from 320 pixels to 480 pixels
3. THE Game System SHALL ensure all interactive elements are at least 44 pixels in touch target size
4. THE Game System SHALL maintain full functionality on mobile devices
5. THE Game System SHALL adjust layouts appropriately for portrait and landscape orientations

### Requirement 15

**User Story:** As any device user, I want full control over the game from my device, so that we can flexibly manage the competition

#### Acceptance Criteria

1. THE Game System SHALL provide identical functionality to all devices connected to a session
2. THE Game System SHALL synchronize all game state changes across all connected devices within 2 seconds
3. THE Game System SHALL allow any device to perform host actions such as starting rounds and advancing game phases
4. WHEN a device joins an in-progress session, THE Game System SHALL load the current game state
5. THE Game System SHALL persist game state to allow resuming from any device

### Requirement 16

**User Story:** As a user, I want the game to use Firebase for data storage, so that all devices stay synchronized

#### Acceptance Criteria

1. THE Game System SHALL use Firebase Firestore to store all game session data
2. THE Game System SHALL use Firebase Hosting to serve the web application
3. WHEN game state changes, THE Game System SHALL update Firestore within 1 second
4. WHEN Firestore data changes, THE Game System SHALL update all connected devices within 2 seconds
5. THE Game System SHALL use Firestore real-time listeners to maintain synchronization

### Requirement 17

**User Story:** As a host, I want to restart the current round, so that I can recover from mistakes or technical issues during a round

#### Acceptance Criteria

1. WHILE a round is in ROUND_READY, ROUND_ACTIVE, or ROUND_COMPLETE phase, THE Game System SHALL display a restart round button
2. WHEN the restart round button is pressed, THE Game System SHALL reset the current round to ROUND_READY phase
3. WHEN the current round is restarted, THE Game System SHALL clear the timer start time and end time
4. WHEN the current round is restarted, THE Game System SHALL preserve the current round number and chef assignments
5. WHEN the current round is restarted, THE Game System SHALL synchronize the reset state to all connected devices within 2 seconds

### Requirement 18

**User Story:** As a host, I want to restart the entire game, so that I can start over with the same contestants

#### Acceptance Criteria

1. WHILE the game is in any phase after SETUP, THE Game System SHALL display a restart game button
2. WHEN the restart game button is pressed, THE Game System SHALL display a confirmation dialog
3. WHEN restart is confirmed, THE Game System SHALL reset the game phase to SETUP
4. WHEN the game is restarted, THE Game System SHALL clear all round data including timer states and votes
5. WHEN the game is restarted, THE Game System SHALL mark all chefs as not having cooked
6. WHEN the game is restarted, THE Game System SHALL preserve the chef list and game configuration
7. WHEN the game is restarted, THE Game System SHALL synchronize the reset state to all connected devices within 2 seconds

### Requirement 19

**User Story:** As a participant, I want to upload and view photos in real-time during the event, so that everyone can share and experience the competition together

#### Acceptance Criteria

1. THE Game System SHALL provide a photo upload button accessible from all game phases
2. WHEN a photo is uploaded, THE Game System SHALL store it in Firebase Storage and add metadata to Firestore
3. WHEN a photo is uploaded during ROUND_READY, ROUND_ACTIVE, ROUND_COMPLETE, or VOTING phases, THE Game System SHALL associate the photo with the current round number and chef IDs
4. WHEN a photo is uploaded during SETUP, RESULTS_COUNTDOWN, or RESULTS phases, THE Game System SHALL mark the photo as pre-game or post-game
5. WHEN a photo is uploaded, THE Game System SHALL display a "New Photo" notification on all connected devices
6. THE Game System SHALL display the newest photo first in the photo gallery
7. THE Game System SHALL group photos by round in the gallery with section headers showing round number and chef names
8. THE Game System SHALL update the photo gallery in real-time when new photos are added
9. THE Game System SHALL display a persistent photo gallery icon with a badge showing unviewed photo count
10. WHEN a user opens the photo gallery, THE Game System SHALL mark photos as viewed for that device
11. THE Game System SHALL allow swiping or scrolling through photos in the gallery
12. WHEN viewing a photo full-screen, THE Game System SHALL display the associated round context (round number and chef names, or pre-game/post-game)
13. THE Game System SHALL associate all photos with the game session for later viewing

### Requirement 20

**User Story:** As a remote viewer, I want to follow the competition through live photos, so that I can experience the event even if I cannot attend

#### Acceptance Criteria

1. WHEN a user joins a session URL, THE Game System SHALL allow viewing without participating in voting
2. THE Game System SHALL display real-time photo updates to all connected users including remote viewers
3. THE Game System SHALL show notifications when new photos are uploaded during the competition
4. THE Game System SHALL allow remote viewers to browse the photo gallery at any time
5. THE Game System SHALL display the current game phase to remote viewers so they can follow along
