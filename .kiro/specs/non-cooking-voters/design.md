# Design Document

## Overview

This design adds judge support to the MasterChef voting application by introducing an `isJudge` flag to the existing `Chef` type. Judges are participants who can vote but never appear in the cooking rotation. The design maintains backward compatibility by treating any participant without the `isJudge` flag (or with it set to `false`) as a chef.

The implementation focuses on minimal changes to the existing data model while adding clear UI distinctions between chefs and judges in the Contestant Manager and Voting Interface.

## Architecture

### Data Model Changes

The existing `Chef` interface will be extended with an optional `isJudge` boolean flag:

```typescript
export interface Chef {
  id: string;
  name: string;
  dish: string;
  order: number;
  hasCooked: boolean;
  isJudge?: boolean; // New optional field
}
```

**Rationale**: Using the existing `Chef` type with an optional flag provides:
- Backward compatibility (existing sessions without the flag continue to work)
- Minimal changes to existing code
- Simplified data management (single collection for all participants)

### Component Architecture

The feature impacts three main components:

1. **ContestantManager**: Add UI for creating judges and visually distinguishing them from chefs
2. **VotingInterface**: Display judges in the voter selection list with visual indicators
3. **Game utility functions**: Filter judges from cooking rotation logic

## Components and Interfaces

### ContestantManager Updates

**New UI Elements**:
- Checkbox/toggle in "Add Chef" modal to mark participant as judge
- Judge indicator badge on participant cards (🍸 cocktail glass icon with "Judge" label)
- Separate visual styling for judge cards vs chef cards

**Behavior Changes**:
- Shuffle button only randomizes chefs (filters out judges)
- Reordering (up/down arrows) only works within chef list
- Judges appear after chefs in the participant list
- Delete functionality works for both chefs and judges

**Modal Updates**:
- Add Chef modal gets a checkbox: "Judge (non-cooking voter)"
- When checkbox is checked, dish name field becomes optional or hidden
- When unchecked, participant is added as a chef (existing behavior)

### VotingInterface Updates

**Voter Selection Screen**:
- Display chefs first, then judges
- Add visual indicator next to judge names (e.g., "⚖️" icon or "Judge" badge)
- Both chefs and judges appear in the voter selection list

**Voting Flow**:
- Judges can vote on all chefs
- Chefs can still vote on other chefs (excluding themselves)
- No changes to scoring interface or vote submission logic

### Service Layer Updates

**sessionService.ts**:
- `addChef` function works for both chefs and judges (no changes needed)
- `deleteChef` function works for both (no changes needed)
- `updateChefOrder` function works for both (no changes needed)

**New/Updated Utility Functions**:

```typescript
// In gamePhases.ts or new utils file

export const getChefs = (participants: { [id: string]: Chef }): Chef[] => {
  return Object.values(participants).filter(p => !p.isJudge);
};

export const getJudges = (participants: { [id: string]: Chef }): Chef[] => {
  return Object.values(participants).filter(p => p.isJudge === true);
};

export const getAllParticipants = (participants: { [id: string]: Chef }): Chef[] => {
  return Object.values(participants);
};

export const getNextRoundChefs = (
  participants: { [id: string]: Chef },
  simultaneousPlayers: number
): string[] => {
  const chefs = Object.values(participants)
    .filter(p => !p.isJudge && !p.hasCooked)
    .sort((a, b) => a.order - b.order);

  return chefs.slice(0, simultaneousPlayers).map(chef => chef.id);
};

export const hasMoreRounds = (participants: { [id: string]: Chef }): boolean => {
  return Object.values(participants).some(p => !p.isJudge && !p.hasCooked);
};
```

## Data Models

### Updated Chef Interface

```typescript
export interface Chef {
  id: string;
  name: string;
  dish: string;          // For judges, can be empty or "Judge"
  order: number;         // For judges, order doesn't affect cooking rotation
  hasCooked: boolean;    // For judges, always false
  isJudge?: boolean;     // Optional flag, defaults to false/undefined (chef)
}
```

### SessionDocument (No Changes)

The `SessionDocument` interface remains unchanged. The `chefs` object stores both chefs and judges:

```typescript
export interface SessionDocument {
  // ... existing fields
  chefs: {
    [chefId: string]: Chef;  // Contains both chefs and judges
  };
  // ... existing fields
}
```

## Error Handling

### Validation Rules

1. **Judge Creation**:
   - Name is required (same as chefs)
   - Dish name is optional (can default to empty string or "Judge")
   - `isJudge` flag must be set to `true`

2. **Cooking Rotation**:
   - Filter out judges when calculating next round chefs
   - Ensure at least one chef exists before starting rounds
   - Handle edge case: session with only judges (should show error or disable start)

3. **Voting**:
   - Judges must have at least one chef to vote for
   - Maintain existing validation for vote scores (1-10 range)

### Error Messages

- "Cannot start game with only judges" - when trying to start with no chefs
- "At least one chef is required" - when deleting the last chef
- Standard validation errors for name/score inputs

## Testing Strategy

### Unit Testing Focus

1. **Utility Functions**:
   - `getChefs()` correctly filters judges
   - `getJudges()` correctly filters chefs
   - `getNextRoundChefs()` excludes judges from rotation
   - `hasMoreRounds()` only considers chefs

2. **Component Logic**:
   - ContestantManager correctly adds judges with `isJudge: true`
   - Shuffle only affects chefs, not judges
   - Reordering only works within chef list
   - VotingInterface displays judges in voter selection

### Integration Testing Focus

1. **End-to-End Flows**:
   - Add chefs and judges, start game, verify only chefs cook
   - Judges can vote on all chefs
   - Chefs can vote on other chefs (not themselves)
   - Results include votes from both chefs and judges

2. **Backward Compatibility**:
   - Existing sessions without `isJudge` flag work correctly
   - Participants without flag are treated as chefs

### Manual Testing Scenarios

1. Create session with 2 chefs and 1 judge
2. Verify judge doesn't appear in cooking rotation
3. Verify judge appears in voter selection
4. Verify judge can vote on both chefs
5. Verify results include judge's votes
6. Test shuffle only affects chefs
7. Test reordering only affects chefs
8. Test deleting judges doesn't affect chef order

## UI/UX Considerations

### Visual Distinctions

**Judge Indicators**:
- Icon: 🍸 (cocktail glass emoji)
- Badge: "🍸 Judge" label

**Recommended Approach**: Combination of icon and subtle styling
- Small "🍸 Judge" badge in top-right of participant card
- Slightly different border or background shade for judge cards
- Same approach in voter selection screen

### Layout

**ContestantManager**:
```
[Add Chef] [Shuffle]

Chefs:
┌─────────────────────┐
│ ▲▼ Chef Name #1     │
│    Dish Name        │
└─────────────────────┘

Judges:
┌─────────────────────┐
│ 🍸 Judge Name       │
│    Judge            │
└─────────────────────┘
```

**Add Chef Modal**:
```
Add Chef
─────────────────
Name: [________]
Dish: [________]
☐ Judge (non-cooking voter)

[Cancel] [Add]
```

**VotingInterface Voter Selection**:
```
Who are you?

[Chef 1]  [Chef 2]  [Chef 3]

[🍸 Judge 1]  [🍸 Judge 2]
```

## Implementation Notes

### Phase 1: Data Model & Utilities
- Add `isJudge` optional field to Chef interface
- Update utility functions to filter judges from cooking rotation
- Update `getAllParticipantNames` to include judges

### Phase 2: ContestantManager UI
- Add "Judge" checkbox to Add Chef modal
- Update modal logic to handle judge flag
- Make dish name optional when judge checkbox is checked
- Add visual indicators for judges (🍸 icon)
- Update shuffle to exclude judges
- Update reordering to only work within chefs
- Organize display: chefs first, then judges

### Phase 3: VotingInterface UI
- Update voter selection to show judges with indicators
- Ensure judges can vote on all chefs
- Test voting flow with judges

### Phase 4: Testing & Polish
- Add validation for edge cases
- Test backward compatibility
- Polish visual styling
- Add error messages

## Backward Compatibility

### Existing Sessions

Sessions created before this feature will continue to work because:
1. The `isJudge` field is optional
2. Undefined or false values are treated as chefs
3. All existing filtering logic checks for `!p.isJudge` or `p.isJudge !== true`

### Migration

No data migration is required. Existing sessions will work as-is with all participants treated as chefs.
