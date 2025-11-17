# Requirements Document

## Introduction

This feature adds periodic audio notifications during the cooking round to help chefs track remaining time without constantly watching the timer. The system will play a microwave-style beep at regular intervals (every 5 minutes in production, every 30 seconds in test mode) to provide audible time checkpoints during cooking.

## Glossary

- **Timer System**: The RoundTimer component that manages and displays the countdown during cooking rounds
- **Interval Beep**: A microwave-style audio notification played at regular time intervals during the cooking round
- **Test Mode**: A configuration setting that uses shorter durations (2 minutes total, 30-second intervals) for testing purposes
- **Production Mode**: The standard configuration using full game durations (e.g., 20 minutes total, 5-minute intervals)
- **Beep Audio**: A short, microwave-style sound effect played at interval checkpoints
- **Mute State**: The user's audio preference setting that controls whether sounds are played

## Requirements

### Requirement 1

**User Story:** As a chef cooking during a round, I want to hear periodic beeps at regular intervals, so that I can track time without constantly looking at the timer display

#### Acceptance Criteria

1. WHEN the cooking timer is active AND 5 minutes remain before the next interval checkpoint, THE Timer System SHALL play the Interval Beep
2. WHEN the cooking timer reaches each subsequent 5-minute interval (15min, 10min, 5min in a 20-minute round), THE Timer System SHALL play the Interval Beep
3. THE Timer System SHALL NOT play the Interval Beep at the 0-second mark (timer end is handled by existing end sound)
4. WHEN the Mute State is enabled, THE Timer System SHALL NOT play the Interval Beep
5. THE Interval Beep SHALL be a short microwave-style sound effect lasting no more than 3 seconds

### Requirement 2

**User Story:** As a developer testing the timer feature, I want a test mode with shorter intervals, so that I can verify the beep functionality without waiting for full production durations

#### Acceptance Criteria

1. WHERE Test Mode is configured, THE Timer System SHALL use a 2-minute total duration
2. WHERE Test Mode is configured, THE Timer System SHALL play the Interval Beep at 90 seconds remaining
3. WHERE Test Mode is configured, THE Timer System SHALL play the Interval Beep at 60 seconds remaining
4. WHERE Test Mode is configured, THE Timer System SHALL play the Interval Beep at 30 seconds remaining
5. THE Timer System SHALL support switching between Test Mode and Production Mode through configuration

### Requirement 3

**User Story:** As a user with audio preferences, I want the interval beeps to respect my mute settings, so that I have consistent control over all game audio

#### Acceptance Criteria

1. WHEN the user toggles the mute button, THE Timer System SHALL update the Interval Beep volume to match the Mute State
2. WHEN the Timer System initializes, THE Timer System SHALL check the stored Mute State from localStorage
3. IF the stored Mute State is muted, THEN THE Timer System SHALL set the Interval Beep volume to 0
4. THE Timer System SHALL listen for muteToggle events throughout the timer lifecycle
5. THE Interval Beep SHALL use the same mute control mechanism as existing timer sounds

### Requirement 4

**User Story:** As a chef, I want the interval beeps to be distinct from the countdown and end sounds, so that I can differentiate between time checkpoints and the final countdown

#### Acceptance Criteria

1. THE Interval Beep SHALL use a different audio file than the countdown sound (played at 32 seconds)
2. THE Interval Beep SHALL use a different audio file than the random end sounds
3. THE Interval Beep SHALL have a microwave-style tone that is recognizable as a time checkpoint
4. THE Timer System SHALL play only one Interval Beep per checkpoint (no duplicate plays)
5. THE Timer System SHALL track which interval checkpoints have been played to prevent replays
