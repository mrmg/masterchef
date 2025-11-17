# Implementation Plan

- [x] 1. Create analytics utility module with data interfaces
  - Create `src/utils/analytics.ts` file
  - Define TypeScript interfaces: `AnalyticsData`, `ChefControversy`, `ChefFavorite`, `VoterStats`, `CategoryWinners`, `CategoryWinner`, `GeneralStats`
  - Export all interfaces for use in components
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.5, 6.1, 7.1_

- [x] 2. Implement analytics calculation functions
  - [x] 2.1 Implement `calculateMostControversial` function
    - Calculate variance (standard deviation) of total scores for each chef
    - Return chef with highest variance including min, max, and average scores
    - Handle edge case: return null if fewer than 2 voters
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Implement `calculateJudgesFavorite` function
    - Filter voters to judges only (isJudge === true)
    - Calculate average total score for each chef from judge votes
    - Return chef with highest average and vote count
    - Handle edge case: return null if no judges exist
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.8_

  - [x] 2.3 Implement `calculateChefsFavorite` function
    - Filter voters to chefs only (not judges)
    - Calculate average total score for each chef from chef votes
    - Exclude self-votes
    - Return chef with highest average and vote count
    - Handle edge case: return null if no chef voters
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.7_

  - [x] 2.4 Implement `calculateToughestCritic` function
    - Calculate average score given by each voter
    - Return voter with lowest average
    - Include min/max scores and vote count
    - Handle edge case: return null if only one voter
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.5 Implement `calculateMostGenerousVoter` function
    - Calculate average score given by each voter
    - Return voter with highest average
    - Include min/max scores and vote count
    - Handle edge case: return null if only one voter
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.6 Implement `calculateCategoryWinners` function
    - Find chef with highest techniqueScore for Best Technique
    - Find chef with highest presentationScore for Best Presented Dish
    - Find chef with highest tasteScore for Best Taste
    - Mark if category winner is also overall winner
    - Handle ties by returning first chef
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 2.7 Implement `calculateGeneralStats` function
    - Calculate average score across all votes
    - Find highest single vote total
    - Find lowest single vote total
    - Count perfect scores (30/30)
    - Calculate score spread (1st place - last place)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 2.8 Implement main `calculateAnalytics` orchestration function
    - Call all calculation functions
    - Return complete AnalyticsData object
    - Wrap in try-catch for error handling
    - _Requirements: 8.4_

- [x] 3. Update type definitions
  - [x] 3.1 Add ANALYTICS to ResultView enum in `src/types/index.ts`
    - Add `ANALYTICS = 'ANALYTICS'` to ResultView enum
    - _Requirements: 5.5_

- [x] 4. Create analytics view UI component
  - [x] 4.1 Update ResultsDisplay component to include analytics tab
    - Add 'analytics' to ViewType union type
    - Add analytics button to navigation tabs
    - Position analytics tab after votes tab
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.2 Implement `renderAnalytics` function in ResultsDisplay
    - Call `calculateAnalytics` with gameState and leaderboard
    - Create main analytics container with motion animations
    - Add analytics header with title "Analytics & Insights"
    - Use consistent styling with other result views
    - _Requirements: 5.4, 9.1_

  - [x] 4.3 Create Category Winners section
    - Display section header "Category Winners"
    - Show Best Technique winner with chef name, dish, and score
    - Show Best Presented Dish winner with chef name, dish, and score
    - Show Best Taste winner with chef name, dish, and score
    - Add visual indicator if category winner is overall winner
    - Use card styling consistent with vote tables
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.4 Create Voter Insights section
    - Display section header "Voter Insights"
    - Conditionally render Judges' Favorite if data exists
    - Conditionally render Chefs' Favorite if data exists
    - Display unified message if judges' and chefs' favorites are the same
    - Show Toughest Critic with name, average score, and vote count
    - Show Most Generous Voter with name, average score, and vote count
    - Display score ranges for both critic and generous voter
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.5 Create Most Controversial section
    - Display section header "Most Controversial"
    - Show chef name, dish name, and variance value
    - Display score range (min and max)
    - Display average score
    - Conditionally render only if data exists (2+ voters)
    - Show message if insufficient data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.6 Create General Statistics section
    - Display section header "Competition Statistics"
    - Show average score across all votes
    - Show highest single vote total
    - Show lowest single vote total
    - Show count of perfect scores if any exist
    - Show score spread between 1st and last place
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.7 Implement responsive layout and styling
    - Use single-column layout for all screen sizes
    - Apply appropriate spacing and padding for mobile
    - Ensure font sizes are readable on small screens
    - Enable vertical scrolling for content overflow
    - Maintain visual hierarchy across screen sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.8 Add edge case handling and error messages
    - Display "Not enough voting data" if no voters
    - Hide voter comparison stats if only one voter
    - Hide judges' favorite section if no judges
    - Hide chefs' favorite section if no chef voters
    - Show appropriate messages for single chef competitions
    - Handle calculation errors gracefully with fallback messages
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Wire analytics view into results navigation
  - Update AnimatePresence in ResultsDisplay to include analytics view
  - Ensure analytics view renders when currentView === 'analytics'
  - Verify smooth transitions between all result views
  - Test navigation flow: Winner → Overall → Technique → Presentation → Taste → Votes → Analytics
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
