# Requirements Document

## Introduction

This feature adds a comprehensive analytics view to the results screen, providing interesting insights and statistics about voting patterns, chef performance, and voter behavior. The analytics will be displayed as an additional tab in the results interface, offering participants a deeper understanding of the competition dynamics beyond simple rankings.

## Glossary

- **Results System**: The ResultsDisplay component that shows competition outcomes and leaderboards
- **Analytics View**: A new results tab displaying statistical insights and voting patterns
- **Vote Variance**: The statistical measure of disagreement among voters for a specific chef, calculated as the standard deviation of total scores
- **Controversial Dish**: The dish with the highest vote variance, indicating the most disagreement among voters
- **Voter Average**: The mean score given by a specific voter across all their votes
- **Tough Critic**: The voter with the lowest average score across all their votes
- **Generous Voter**: The voter with the highest average score across all their votes
- **Judges' Favorite**: The chef with the highest average score from judge voters only
- **Chefs' Favorite**: The chef with the highest average score from chef voters only
- **Category Specialist**: A chef who scored highest in a specific category (Technique, Presentation, or Taste) even if not the overall winner
- **Voter Consistency**: A measure of how similar a voter's scores are across different chefs
- **Results Tab**: One of the swipeable views in the results screen (Winner, Leaderboards, Vote Tables, Analytics)

## Requirements

### Requirement 1

**User Story:** As a participant, I want to see which dish was most controversial, so that I can understand where voters disagreed the most

#### Acceptance Criteria

1. THE Analytics View SHALL calculate vote variance for each chef by computing the standard deviation of total scores received
2. THE Analytics View SHALL identify the chef with the highest vote variance as the most controversial dish
3. WHEN displaying the most controversial dish, THE Analytics View SHALL show the chef name, dish name, and variance value
4. THE Analytics View SHALL display the range of total scores received (minimum and maximum) for the controversial dish
5. IF there are fewer than 2 voters, THEN THE Analytics View SHALL display a message indicating insufficient data for controversy analysis

### Requirement 2

**User Story:** As a participant, I want to see judges' favorite versus chefs' favorite, so that I can compare professional versus peer opinions

#### Acceptance Criteria

1. THE Analytics View SHALL calculate the average total score for each chef from judge voters only
2. THE Analytics View SHALL calculate the average total score for each chef from chef voters only
3. THE Analytics View SHALL identify the chef with the highest average score from judges as the judges' favorite
4. THE Analytics View SHALL identify the chef with the highest average score from chefs as the chefs' favorite
5. WHEN displaying judges' favorite and chefs' favorite, THE Analytics View SHALL show chef name, dish name, and average score
6. IF there are no judges in the session, THEN THE Analytics View SHALL hide the judges' favorite section
7. IF there are no chef voters in the session, THEN THE Analytics View SHALL hide the chefs' favorite section
8. WHERE judges' favorite and chefs' favorite are the same chef, THE Analytics View SHALL display a unified message indicating unanimous preference

### Requirement 3

**User Story:** As a participant, I want to see who was the toughest critic, so that I can identify who gave the lowest scores

#### Acceptance Criteria

1. THE Analytics View SHALL calculate the average score given by each voter across all their votes
2. THE Analytics View SHALL identify the voter with the lowest average score as the toughest critic
3. WHEN displaying the toughest critic, THE Analytics View SHALL show the voter name and their average score
4. THE Analytics View SHALL display how many chefs the toughest critic voted for
5. THE Analytics View SHALL display the toughest critic's score range (lowest and highest total score given)

### Requirement 4

**User Story:** As a participant, I want to see who was the most generous voter, so that I can identify who gave the highest scores

#### Acceptance Criteria

1. THE Analytics View SHALL calculate the average score given by each voter across all their votes
2. THE Analytics View SHALL identify the voter with the highest average score as the most generous voter
3. WHEN displaying the most generous voter, THE Analytics View SHALL show the voter name and their average score
4. THE Analytics View SHALL display how many chefs the most generous voter voted for
5. THE Analytics View SHALL display the most generous voter's score range (lowest and highest total score given)

### Requirement 5

**User Story:** As a participant, I want to access the analytics view from the results screen, so that I can explore voting insights alongside other results

#### Acceptance Criteria

1. THE Results System SHALL add an Analytics tab to the existing results views
2. THE Analytics View SHALL be accessible by swiping or navigating through result tabs
3. THE Analytics View SHALL appear after the Vote Tables view in the navigation order
4. THE Analytics View SHALL use the same visual styling and animations as other results views
5. THE Results System SHALL update the ResultView enum to include an ANALYTICS option

### Requirement 6

**User Story:** As a participant, I want to see category winners, so that I can recognize chefs who excelled in specific areas even if they didn't win overall

#### Acceptance Criteria

1. THE Analytics View SHALL identify the chef with the highest total Technique score as Best Technique
2. THE Analytics View SHALL identify the chef with the highest total Presentation score as Best Presented Dish
3. THE Analytics View SHALL identify the chef with the highest total Taste score as Best Taste
4. WHEN displaying category winners, THE Analytics View SHALL show chef name, dish name, and category score
5. WHERE a category winner is also the overall winner, THE Analytics View SHALL indicate this with a visual marker or note
6. WHERE multiple chefs tie for a category, THE Analytics View SHALL display all tied chefs for that category

### Requirement 7

**User Story:** As a participant, I want to see additional interesting statistics, so that I can gain deeper insights into the competition

#### Acceptance Criteria

1. THE Analytics View SHALL display the average score across all votes in the competition
2. THE Analytics View SHALL display the highest single vote total given to any chef by any voter
3. THE Analytics View SHALL display the lowest single vote total given to any chef by any voter
4. THE Analytics View SHALL identify and display any perfect scores (30 out of 30) if they exist
5. THE Analytics View SHALL calculate and display the score spread (difference between highest and lowest chef total scores)

### Requirement 8

**User Story:** As a participant, I want the analytics to handle edge cases gracefully, so that the view works correctly regardless of competition size

#### Acceptance Criteria

1. IF only one chef competed, THEN THE Analytics View SHALL display available statistics without comparison-based insights
2. IF only one voter participated, THEN THE Analytics View SHALL hide voter comparison statistics (toughest critic, most generous)
3. IF all voters gave identical scores, THEN THE Analytics View SHALL display a message indicating unanimous agreement
4. THE Analytics View SHALL handle missing or incomplete vote data without errors
5. THE Analytics View SHALL display appropriate messages when insufficient data exists for specific statistics

### Requirement 9

**User Story:** As a participant viewing analytics on mobile, I want the layout to be responsive, so that I can read all statistics clearly

#### Acceptance Criteria

1. THE Analytics View SHALL organize statistics into clear sections with headings
2. THE Analytics View SHALL use a single-column layout on mobile devices
3. THE Analytics View SHALL use appropriate font sizes and spacing for readability on small screens
4. THE Analytics View SHALL allow vertical scrolling when content exceeds viewport height
5. THE Analytics View SHALL maintain visual hierarchy and emphasis on key statistics across all screen sizes
