import type { SessionDocument, LeaderboardEntry } from '../types/index';

export const calculateLeaderboards = (session: SessionDocument): LeaderboardEntry[] => {
  const { chefs, votes } = session;
  const chefScores: { [chefId: string]: LeaderboardEntry } = {};

  // Initialize scores for all chefs
  Object.values(chefs).forEach((chef) => {
    chefScores[chef.id] = {
      chefId: chef.id,
      chefName: chef.name,
      dish: chef.dish,
      totalScore: 0,
      techniqueScore: 0,
      presentationScore: 0,
      tasteScore: 0,
      rank: 0,
    };
  });

  // Aggregate votes
  Object.values(votes).forEach((roundVotes) => {
    Object.values(roundVotes).forEach((voterVotes) => {
      Object.entries(voterVotes).forEach(([chefId, vote]) => {
        if (chefScores[chefId]) {
          chefScores[chefId].techniqueScore += vote.technique;
          chefScores[chefId].presentationScore += vote.presentation;
          chefScores[chefId].tasteScore += vote.taste;
          chefScores[chefId].totalScore += vote.technique + vote.presentation + vote.taste;
        }
      });
    });
  });

  // Sort by total score and assign ranks
  const leaderboard = Object.values(chefScores).sort((a, b) => b.totalScore - a.totalScore);
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
};

export const getWinner = (leaderboard: LeaderboardEntry[]): LeaderboardEntry | null => {
  return leaderboard.length > 0 ? leaderboard[0] : null;
};

export const getCategoryLeaderboard = (
  leaderboard: LeaderboardEntry[],
  category: 'technique' | 'presentation' | 'taste'
): LeaderboardEntry[] => {
  const scoreKey = `${category}Score` as keyof LeaderboardEntry;
  return [...leaderboard].sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number));
};
