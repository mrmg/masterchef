# Design Document

## Overview

The Voting Insights & Analytics feature adds a comprehensive analytics view to the results screen, providing statistical insights about voting patterns, chef performance, and voter behavior. This feature integrates seamlessly into the existing results navigation system as a new tab, maintaining the current visual style and user experience patterns.

## Architecture

### Component Structure

The analytics feature will be implemented as a new view within the existing `ResultsDisplay` component:

```
ResultsDisplay (existing)
├── Winner View (existing)
├── Overall Leaderboard (existing)
├── Technique Leaderboard (existing)
├── Presentation Leaderboard (existing)
├── Taste Leaderboard (existing)
├── Vote Tables (existing)
└── Analytics View (NEW)
```

### Data Flow

1. `ResultsDisplay` receives `SessionDocument` as props
2. Analytics calculations are performed in a new utility module `src/utils/analytics.ts`
3. Analytics data is computed on-demand when the Analytics tab is selected
4. Results are rendered using the same styling patterns as existing result views

## Components and Interfaces

### New Utility Module: `src/utils/analytics.ts`

This module will contain all analytics calculation functions:

```typescript
export interface AnalyticsData {
  mostControversial: ChefControversy | null;
  judgesFavorite: ChefFavorite | null;
  chefsFavorite: ChefFavorite | null;
  toughestCritic: VoterStats | null;
  mostGenerousVoter: VoterStats | null;
  categoryWinners: CategoryWinners;
  generalStats: GeneralStats;
}

export interface ChefControversy {
  chefId: string;
  chefName: string;
  dish: string;
  variance: number;
  minScore: number;
  maxScore: number;
  averageScore: number;
}

export interface ChefFavorite {
  chefId: string;
  chefName: string;
  dish: string;
  averageScore: number;
  voteCount: number;
}

export interface VoterStats {
  voterName: string;
  averageScore: number;
  voteCount: number;
  minScore: number;
  maxScore: number;
  isJudge: boolean;
}

export interface CategoryWinners {
  technique: CategoryWinner | null;
  presentation: CategoryWinner | null;
  taste: CategoryWinner | null;
}

export interface CategoryWinner {
  chefId: string;
  chefName: string;
  dish: string;
  score: number;
  isOverallWinner: boolean;
}

export interface GeneralStats {
  averageScore: number;
  highestSingleVote: number;
  lowestSingleVote: number;
  perfectScores: number;
  scoreSpread: number;
}
```

### Analytics Calculation Functions

#### 1. `calculateMostControversial(session: SessionDocument, leaderboard: LeaderboardEntry[]): ChefControversy | null`

**Algorithm:**
- For each chef, collect all total scores they received from voters
- Calculate variance (standard deviation) of these scores
- Return chef with highest variance
- Include min, max, and average scores for context

**Edge Cases:**
- Return null if fewer than 2 voters
- Return null if no chefs competed

#### 2. `calculateJudgesFavorite(session: SessionDocument): ChefFavorite | null`

**Algorithm:**
- Filter voters to only include judges (isJudge === true)
- For each chef, calculate average total score from judge votes only
- Return chef with highest average
- Include vote count for transparency

**Edge Cases:**
- Return null if no judges exist
- Return null if judges didn't vote

#### 3. `calculateChefsFavorite(session: SessionDocument): ChefFavorite | null`

**Algorithm:**
- Filter voters to only include chefs (participants who are not judges)
- For each chef, calculate average total score from chef votes only
- Exclude self-votes (chefs voting for themselves)
- Return chef with highest average

**Edge Cases:**
- Return null if no chef voters exist
- Return null if chefs didn't vote

#### 4. `calculateToughestCritic(session: SessionDocument): VoterStats | null`

**Algorithm:**
- For each voter, calculate average of all total scores they gave
- Return voter with lowest average
- Include min/max scores and vote count

**Edge Cases:**
- Return null if only one voter
- Handle voters who voted for different numbers of chefs

#### 5. `calculateMostGenerousVoter(session: SessionDocument): VoterStats | null`

**Algorithm:**
- For each voter, calculate average of all total scores they gave
- Return voter with highest average
- Include min/max scores and vote count

**Edge Cases:**
- Return null if only one voter
- Handle voters who voted for different numbers of chefs

#### 6. `calculateCategoryWinners(leaderboard: LeaderboardEntry[], overallWinnerId: string): CategoryWinners`

**Algorithm:**
- Find chef with highest techniqueScore
- Find chef with highest presentationScore
- Find chef with highest tasteScore
- Mark if category winner is also overall winner

**Edge Cases:**
- Handle ties by returning first chef (or all tied chefs in future enhancement)
- Return null for category if no chefs competed

#### 7. `calculateGeneralStats(session: SessionDocument, leaderboard: LeaderboardEntry[]): GeneralStats`

**Algorithm:**
- Calculate average of all total scores across all votes
- Find highest single total score given by any voter
- Find lowest single total score given by any voter
- Count perfect scores (30/30)
- Calculate score spread (difference between 1st and last place total scores)

**Edge Cases:**
- Handle empty leaderboard
- Handle single chef competitions

#### 8. Main Function: `calculateAnalytics(session: SessionDocument, leaderboard: LeaderboardEntry[]): AnalyticsData`

Orchestrates all calculations and returns complete analytics data object.

## Data Models

### Type Updates

Add new view type to `src/types/index.ts`:

```typescript
export enum ResultView {
  WINNER = 'WINNER',
  OVERALL_LEADERBOARD = 'OVERALL_LEADERBOARD',
  TECHNIQUE_LEADERBOARD = 'TECHNIQUE_LEADERBOARD',
  PRESENTATION_LEADERBOARD = 'PRESENTATION_LEADERBOARD',
  TASTE_LEADERBOARD = 'TASTE_LEADERBOARD',
  VOTE_TABLES = 'VOTE_TABLES',
  ANALYTICS = 'ANALYTICS', // NEW
}
```

### ViewType Update in ResultsDisplay

Update the local `ViewType` in `ResultsDisplay.tsx`:

```typescript
type ViewType = 'winner' | 'overall' | 'technique' | 'presentation' | 'taste' | 'votes' | 'analytics';
```

## UI Design

### Analytics View Layout

The analytics view will use a card-based layout with sections:

```
┌─────────────────────────────────────┐
│         Analytics Header            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Category Winners Section   │   │
│  │  - Best Technique           │   │
│  │  - Best Presentation        │   │
│  │  - Best Taste               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Voter Insights Section     │   │
│  │  - Judges' Favorite         │   │
│  │  - Chefs' Favorite          │   │
│  │  - Toughest Critic          │   │
│  │  - Most Generous Voter      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Controversy Section        │   │
│  │  - Most Controversial Dish  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  General Statistics         │   │
│  │  - Average Score            │   │
│  │  - Score Spread             │   │
│  │  - Perfect Scores           │   │
│  │  - Highest/Lowest Vote      │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Visual Styling

- Use existing color scheme (gold, charcoal, cream)
- Match card styling from vote tables view
- Use serif font for headers
- Animate entry with framer-motion (consistent with other views)
- Responsive single-column layout
- Icons or emojis for visual interest (🏆, 👨‍🍳, 🔥, 📊)

### Component Structure

```typescript
const renderAnalytics = () => {
  const analytics = calculateAnalytics(gameState, leaderboard);
  
  return (
    <motion.div key="analytics" {...animationProps}>
      <h2>Analytics & Insights</h2>
      
      {/* Category Winners Section */}
      <AnalyticsSection title="Category Winners">
        <CategoryWinnerCard category="technique" data={analytics.categoryWinners.technique} />
        <CategoryWinnerCard category="presentation" data={analytics.categoryWinners.presentation} />
        <CategoryWinnerCard category="taste" data={analytics.categoryWinners.taste} />
      </AnalyticsSection>
      
      {/* Voter Insights Section */}
      <AnalyticsSection title="Voter Insights">
        {analytics.judgesFavorite && <FavoriteCard type="judges" data={analytics.judgesFavorite} />}
        {analytics.chefsFavorite && <FavoriteCard type="chefs" data={analytics.chefsFavorite} />}
        {analytics.toughestCritic && <VoterCard type="tough" data={analytics.toughestCritic} />}
        {analytics.mostGenerousVoter && <VoterCard type="generous" data={analytics.mostGenerousVoter} />}
      </AnalyticsSection>
      
      {/* Controversy Section */}
      {analytics.mostControversial && (
        <AnalyticsSection title="Most Controversial">
          <ControversyCard data={analytics.mostControversial} />
        </AnalyticsSection>
      )}
      
      {/* General Stats Section */}
      <AnalyticsSection title="Competition Statistics">
        <GeneralStatsCard data={analytics.generalStats} />
      </AnalyticsSection>
    </motion.div>
  );
};
```

## Error Handling

### Insufficient Data Scenarios

1. **No Voters**: Display message "Not enough voting data for analytics"
2. **Single Voter**: Hide voter comparison stats, show available data
3. **No Judges**: Hide judges' favorite section
4. **No Chef Voters**: Hide chefs' favorite section
5. **Single Chef**: Show available stats, hide comparison-based insights

### Calculation Errors

- Wrap all calculations in try-catch blocks
- Log errors to console for debugging
- Display fallback message: "Unable to calculate this statistic"
- Continue rendering other available statistics

## Testing Strategy

### Unit Tests for Analytics Functions

Test each calculation function with:
- Normal case (multiple chefs, multiple voters)
- Edge case (single chef)
- Edge case (single voter)
- Edge case (no judges)
- Edge case (all identical scores)
- Edge case (empty votes object)

### Integration Tests

- Verify analytics view renders without errors
- Verify navigation to analytics tab works
- Verify data flows correctly from SessionDocument
- Verify responsive layout on mobile

### Manual Testing Scenarios

1. **Full Competition**: 4 chefs, 6 voters (mix of judges and chefs)
2. **Small Competition**: 2 chefs, 2 voters
3. **Solo Competition**: 1 chef, 3 judges
4. **No Judges**: All participants are chefs
5. **Unanimous Voting**: All voters give same scores

## Performance Considerations

### Calculation Optimization

- Calculate analytics only when Analytics tab is selected (lazy calculation)
- Memoize results if user switches back to Analytics tab
- All calculations are O(n*m) where n = chefs, m = voters (acceptable for typical game sizes)

### Rendering Optimization

- Use React.memo for analytics cards if needed
- Animate sections with staggered delays for visual appeal
- Ensure smooth scrolling on mobile devices

## Accessibility

- Use semantic HTML for statistics sections
- Ensure sufficient color contrast for all text
- Provide text alternatives for any icons
- Support keyboard navigation through tabs
- Announce view changes to screen readers

## Future Enhancements

Potential additions for future iterations:
- Export analytics as PDF or image
- Historical comparison across multiple games
- More advanced statistics (correlation analysis, voting patterns)
- Graphical visualizations (charts, graphs)
- Tie handling for category winners (show all tied chefs)
