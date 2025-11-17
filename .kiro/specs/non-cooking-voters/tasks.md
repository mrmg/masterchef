# Implementation Plan

- [x] 1. Update data model and utility functions
  - Add `isJudge?: boolean` field to Chef interface in types/index.ts
  - Create utility functions to filter chefs vs judges
  - Update `getNextRoundChefs` to exclude judges from cooking rotation
  - Update `hasMoreRounds` to only check chefs (not judges)
  - _Requirements: 1.4, 5.1, 5.2_

- [x] 2. Update ContestantManager component for judge support
  - [x] 2.1 Add judge checkbox to Add Chef modal
    - Add checkbox labeled "Judge (non-cooking voter)" to modal
    - Add state to track checkbox value
    - _Requirements: 1.1, 4.1_

  - [x] 2.2 Update Add Chef modal logic for judges
    - Set `isJudge: true` when checkbox is checked
    - Make dish name optional when judge checkbox is checked (default to "Judge")
    - Update handleAddChef to handle judge flag
    - _Requirements: 1.2, 4.1_

  - [x] 2.3 Add visual indicators for judges in participant list
    - Add judge badge with cocktail glass icon (🍸) to judge cards
    - Apply different styling to distinguish judges from chefs
    - Display judges after chefs in the list
    - _Requirements: 1.3, 3.1, 4.2_

  - [x] 2.4 Update shuffle functionality to exclude judges
    - Filter judges before shuffling
    - Only randomize chef order
    - _Requirements: 4.4_

  - [x] 2.5 Update reordering to only work within chef list
    - Disable up/down arrows for judges
    - Ensure chef reordering doesn't affect judge positions
    - _Requirements: 4.3_

  - [x] 2.6 Update delete functionality for judges
    - Ensure deleting judges doesn't affect chef ordering
    - Handle deletion of both chefs and judges
    - _Requirements: 1.5_

- [x] 3. Update VotingInterface component for judge support
  - [x] 3.1 Update voter selection screen to display judges
    - Show chefs first, then judges
    - Add visual indicator (🍸 cocktail glass icon or badge) for judges
    - _Requirements: 2.1, 3.1, 3.2, 3.3_

  - [x] 3.2 Ensure judges can vote on all chefs
    - Update voting logic to allow judges to vote on all chefs
    - Verify judges are included in available voters list
    - _Requirements: 2.2, 2.3_

  - [x] 3.3 Update voting completion tracking
    - Include judges in required voters count
    - Track judge voting completion
    - _Requirements: 2.4_

- [x] 4. Add validation and error handling
  - Add validation to prevent starting game with only judges
  - Add error message when trying to delete last chef
  - Ensure at least one chef exists before allowing game start
  - _Requirements: 1.4, 5.2_

- [ ]* 5. Test backward compatibility
  - Verify existing sessions without isJudge flag work correctly
  - Test that participants without flag are treated as chefs
  - Verify cooking rotation works with legacy data
  - _Requirements: 5.1, 5.2, 5.3_
