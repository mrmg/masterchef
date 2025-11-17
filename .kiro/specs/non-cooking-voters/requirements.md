# Requirements Document

## Introduction

This feature adds support for judges in the MasterChef voting application. Currently, all participants are chefs who both cook and vote. This enhancement introduces a new participant type: judges who can participate in scoring but do not cook dishes themselves. This allows for dedicated judges, spectators, or other participants to contribute to the voting process without being part of the cooking competition.

## Glossary

- **Chef**: A participant who cooks a dish and appears in the cooking rotation. Chefs can also vote on other chefs' dishes.
- **Judge**: A participant who only votes on dishes but does not cook. Judges never appear in the cooking rotation.
- **Participant**: Any person in the session, either a Chef or a Judge.
- **Cooking Rotation**: The ordered list of chefs who will cook during rounds.
- **Voting Pool**: All participants (both Chefs and Judges) who can submit votes for dishes.
- **Contestant Manager**: The UI component where participants are added and managed before the game starts.
- **Voting Interface**: The UI component where participants submit scores for chefs' dishes.
- **Session**: A single game instance identified by a session code.

## Requirements

### Requirement 1

**User Story:** As a game organizer, I want to add judges who don't cook, so that dedicated judges can participate in scoring without competing.

#### Acceptance Criteria

1. WHEN THE Contestant Manager displays the add participant modal, THE Contestant Manager SHALL display a checkbox to mark the participant as a judge.
2. WHEN a user adds a participant with the judge checkbox selected, THE Contestant Manager SHALL store the participant with a flag indicating they are a judge.
3. WHEN THE Contestant Manager displays participants, THE Contestant Manager SHALL visually distinguish judges from chefs using a cocktail glass icon.
4. WHERE a participant is marked as a judge, THE Contestant Manager SHALL exclude that participant from the cooking rotation.
5. WHEN a user deletes a judge, THE Contestant Manager SHALL remove the judge from the session without affecting chef ordering.

### Requirement 2

**User Story:** As a judge, I want to vote on all chefs' dishes, so that I can contribute my scores even though I'm not cooking.

#### Acceptance Criteria

1. WHEN THE Voting Interface displays available voters, THE Voting Interface SHALL include all judges in the voter selection list.
2. WHEN a judge selects themselves in the voting interface, THE Voting Interface SHALL present all chefs for scoring.
3. WHEN a judge submits scores, THE Voting Interface SHALL accept and store the votes with the same validation as chef votes.
4. WHEN calculating voting completion, THE Session SHALL include judges in the required voters count.

### Requirement 3

**User Story:** As a chef, I want judges to appear in my voting list, so that I know judges are participating but not competing.

#### Acceptance Criteria

1. WHEN THE Voting Interface displays the voter selection screen, THE Voting Interface SHALL display judges after chefs in the list.
2. WHEN THE Voting Interface displays a judge, THE Voting Interface SHALL include a cocktail glass icon as a visual indicator.
3. WHEN a chef views the voting interface, THE Voting Interface SHALL include judges in the available voter list.

### Requirement 4

**User Story:** As a game organizer, I want to manage both chefs and judges in one interface, so that I can set up all participants efficiently.

#### Acceptance Criteria

1. WHEN THE Contestant Manager displays the add participant options, THE Contestant Manager SHALL provide separate actions for adding chefs and adding judges.
2. WHEN THE Contestant Manager displays the participant list, THE Contestant Manager SHALL show both chefs and judges in organized sections or with clear visual distinction.
3. WHEN a user reorders participants, THE Contestant Manager SHALL only allow reordering within the chef list.
4. WHEN THE Contestant Manager displays shuffle functionality, THE Contestant Manager SHALL only shuffle chefs and exclude judges from randomization.

### Requirement 5

**User Story:** As a system, I want to maintain backward compatibility with existing sessions, so that games created before this feature continue to work.

#### Acceptance Criteria

1. WHEN THE Session loads a participant without an isJudge flag, THE Session SHALL treat that participant as a chef.
2. WHEN THE Session calculates cooking rotation, THE Session SHALL include all participants without an isJudge flag set to true.
3. WHEN THE Session determines voting eligibility, THE Session SHALL allow all participants to vote regardless of isJudge flag presence.
