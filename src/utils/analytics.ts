/**
 * Analytics utility module for calculating voting insights and statistics
 */

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

import type { SessionDocument, LeaderboardEntry } from '../types/index';

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate the most controversial dish (highest vote variance)
 */
export function calculateMostControversial(
  session: SessionDocument,
  leaderboard: LeaderboardEntry[]
): ChefControversy | null {
  // Get all voters
  const allVoters = new Set<string>();
  Object.values(session.votes).forEach(roundVotes => {
    Object.keys(roundVotes).forEach(voter => allVoters.add(voter));
  });

  // Return null if fewer than 2 voters
  if (allVoters.size < 2) return null;
  if (leaderboard.length === 0) return null;

  let mostControversial: ChefControversy | null = null;
  let highestVariance = -1;

  // For each chef, collect all total scores they received
  leaderboard.forEach(chef => {
    const scores: number[] = [];
    
    Object.values(session.votes).forEach(roundVotes => {
      Object.entries(roundVotes).forEach(([_, voterVotes]) => {
        if (voterVotes[chef.chefId]) {
          const vote = voterVotes[chef.chefId];
          const totalScore = vote.technique + vote.presentation + vote.taste;
          scores.push(totalScore);
        }
      });
    });

    if (scores.length >= 2) {
      const variance = calculateStandardDeviation(scores);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

      if (variance > highestVariance) {
        highestVariance = variance;
        mostControversial = {
          chefId: chef.chefId,
          chefName: chef.chefName,
          dish: chef.dish,
          variance,
          minScore,
          maxScore,
          averageScore,
        };
      }
    }
  });

  return mostControversial;
}

/**
 * Calculate judges' favorite chef
 */
export function calculateJudgesFavorite(session: SessionDocument): ChefFavorite | null {
  const chefScores: { [chefId: string]: { total: number; count: number; name: string; dish: string } } = {};

  // Collect all votes from judges
  Object.values(session.votes).forEach(roundVotes => {
    Object.entries(roundVotes).forEach(([voterName, voterVotes]) => {
      // Check if voter is a judge
      const voterChef = Object.values(session.chefs).find(c => c.name === voterName);
      const isJudge = voterChef?.isJudge === true;

      if (isJudge) {
        Object.entries(voterVotes).forEach(([chefId, vote]) => {
          const totalScore = vote.technique + vote.presentation + vote.taste;
          
          if (!chefScores[chefId]) {
            const chef = session.chefs[chefId];
            chefScores[chefId] = {
              total: 0,
              count: 0,
              name: chef.name,
              dish: chef.dish,
            };
          }
          
          chefScores[chefId].total += totalScore;
          chefScores[chefId].count += 1;
        });
      }
    });
  });

  // Return null if no judges voted
  if (Object.keys(chefScores).length === 0) return null;

  // Find chef with highest average
  let favorite: ChefFavorite | null = null;
  let highestAverage = -1;

  Object.entries(chefScores).forEach(([chefId, data]) => {
    const average = data.total / data.count;
    if (average > highestAverage) {
      highestAverage = average;
      favorite = {
        chefId,
        chefName: data.name,
        dish: data.dish,
        averageScore: average,
        voteCount: data.count,
      };
    }
  });

  return favorite;
}

/**
 * Calculate chefs' favorite chef (excluding self-votes)
 */
export function calculateChefsFavorite(session: SessionDocument): ChefFavorite | null {
  const chefScores: { [chefId: string]: { total: number; count: number; name: string; dish: string } } = {};

  // Collect all votes from non-judge chefs
  Object.values(session.votes).forEach(roundVotes => {
    Object.entries(roundVotes).forEach(([voterName, voterVotes]) => {
      // Check if voter is a chef (not a judge)
      const voterChef = Object.values(session.chefs).find(c => c.name === voterName);
      const isJudge = voterChef?.isJudge === true;

      if (!isJudge && voterChef) {
        Object.entries(voterVotes).forEach(([chefId, vote]) => {
          // Exclude self-votes
          if (voterChef.id !== chefId) {
            const totalScore = vote.technique + vote.presentation + vote.taste;
            
            if (!chefScores[chefId]) {
              const chef = session.chefs[chefId];
              chefScores[chefId] = {
                total: 0,
                count: 0,
                name: chef.name,
                dish: chef.dish,
              };
            }
            
            chefScores[chefId].total += totalScore;
            chefScores[chefId].count += 1;
          }
        });
      }
    });
  });

  // Return null if no chef voters
  if (Object.keys(chefScores).length === 0) return null;

  // Find chef with highest average
  let favorite: ChefFavorite | null = null;
  let highestAverage = -1;

  Object.entries(chefScores).forEach(([chefId, data]) => {
    const average = data.total / data.count;
    if (average > highestAverage) {
      highestAverage = average;
      favorite = {
        chefId,
        chefName: data.name,
        dish: data.dish,
        averageScore: average,
        voteCount: data.count,
      };
    }
  });

  return favorite;
}

/**
 * Calculate toughest critic (voter with lowest average score)
 */
export function calculateToughestCritic(session: SessionDocument): VoterStats | null {
  const voterStats: { [voterName: string]: { total: number; count: number; scores: number[]; isJudge: boolean } } = {};

  // Collect all votes by voter
  Object.values(session.votes).forEach(roundVotes => {
    Object.entries(roundVotes).forEach(([voterName, voterVotes]) => {
      if (!voterStats[voterName]) {
        const voterChef = Object.values(session.chefs).find(c => c.name === voterName);
        voterStats[voterName] = {
          total: 0,
          count: 0,
          scores: [],
          isJudge: voterChef?.isJudge === true,
        };
      }

      Object.values(voterVotes).forEach(vote => {
        const totalScore = vote.technique + vote.presentation + vote.taste;
        voterStats[voterName].total += totalScore;
        voterStats[voterName].count += 1;
        voterStats[voterName].scores.push(totalScore);
      });
    });
  });

  // Return null if only one voter
  if (Object.keys(voterStats).length <= 1) return null;

  // Find voter with lowest average
  let toughest: VoterStats | null = null;
  let lowestAverage = Infinity;

  Object.entries(voterStats).forEach(([voterName, data]) => {
    const average = data.total / data.count;
    if (average < lowestAverage) {
      lowestAverage = average;
      toughest = {
        voterName,
        averageScore: average,
        voteCount: data.count,
        minScore: Math.min(...data.scores),
        maxScore: Math.max(...data.scores),
        isJudge: data.isJudge,
      };
    }
  });

  return toughest;
}

/**
 * Calculate most generous voter (voter with highest average score)
 */
export function calculateMostGenerousVoter(session: SessionDocument): VoterStats | null {
  const voterStats: { [voterName: string]: { total: number; count: number; scores: number[]; isJudge: boolean } } = {};

  // Collect all votes by voter
  Object.values(session.votes).forEach(roundVotes => {
    Object.entries(roundVotes).forEach(([voterName, voterVotes]) => {
      if (!voterStats[voterName]) {
        const voterChef = Object.values(session.chefs).find(c => c.name === voterName);
        voterStats[voterName] = {
          total: 0,
          count: 0,
          scores: [],
          isJudge: voterChef?.isJudge === true,
        };
      }

      Object.values(voterVotes).forEach(vote => {
        const totalScore = vote.technique + vote.presentation + vote.taste;
        voterStats[voterName].total += totalScore;
        voterStats[voterName].count += 1;
        voterStats[voterName].scores.push(totalScore);
      });
    });
  });

  // Return null if only one voter
  if (Object.keys(voterStats).length <= 1) return null;

  // Find voter with highest average
  let generous: VoterStats | null = null;
  let highestAverage = -1;

  Object.entries(voterStats).forEach(([voterName, data]) => {
    const average = data.total / data.count;
    if (average > highestAverage) {
      highestAverage = average;
      generous = {
        voterName,
        averageScore: average,
        voteCount: data.count,
        minScore: Math.min(...data.scores),
        maxScore: Math.max(...data.scores),
        isJudge: data.isJudge,
      };
    }
  });

  return generous;
}

/**
 * Calculate category winners
 */
export function calculateCategoryWinners(
  leaderboard: LeaderboardEntry[],
  overallWinnerId: string
): CategoryWinners {
  if (leaderboard.length === 0) {
    return {
      technique: null,
      presentation: null,
      taste: null,
    };
  }

  // Find highest in each category
  const techniqueWinner = [...leaderboard].sort((a, b) => b.techniqueScore - a.techniqueScore)[0];
  const presentationWinner = [...leaderboard].sort((a, b) => b.presentationScore - a.presentationScore)[0];
  const tasteWinner = [...leaderboard].sort((a, b) => b.tasteScore - a.tasteScore)[0];

  return {
    technique: {
      chefId: techniqueWinner.chefId,
      chefName: techniqueWinner.chefName,
      dish: techniqueWinner.dish,
      score: techniqueWinner.techniqueScore,
      isOverallWinner: techniqueWinner.chefId === overallWinnerId,
    },
    presentation: {
      chefId: presentationWinner.chefId,
      chefName: presentationWinner.chefName,
      dish: presentationWinner.dish,
      score: presentationWinner.presentationScore,
      isOverallWinner: presentationWinner.chefId === overallWinnerId,
    },
    taste: {
      chefId: tasteWinner.chefId,
      chefName: tasteWinner.chefName,
      dish: tasteWinner.dish,
      score: tasteWinner.tasteScore,
      isOverallWinner: tasteWinner.chefId === overallWinnerId,
    },
  };
}

/**
 * Calculate general statistics
 */
export function calculateGeneralStats(
  session: SessionDocument,
  leaderboard: LeaderboardEntry[]
): GeneralStats {
  const allScores: number[] = [];
  let perfectScores = 0;

  // Collect all individual vote totals
  Object.values(session.votes).forEach(roundVotes => {
    Object.values(roundVotes).forEach(voterVotes => {
      Object.values(voterVotes).forEach(vote => {
        const totalScore = vote.technique + vote.presentation + vote.taste;
        allScores.push(totalScore);
        if (totalScore === 30) {
          perfectScores += 1;
        }
      });
    });
  });

  const averageScore = allScores.length > 0
    ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
    : 0;

  const highestSingleVote = allScores.length > 0 ? Math.max(...allScores) : 0;
  const lowestSingleVote = allScores.length > 0 ? Math.min(...allScores) : 0;

  const scoreSpread = leaderboard.length > 1
    ? leaderboard[0].totalScore - leaderboard[leaderboard.length - 1].totalScore
    : 0;

  return {
    averageScore,
    highestSingleVote,
    lowestSingleVote,
    perfectScores,
    scoreSpread,
  };
}

/**
 * Main function to calculate all analytics
 */
export function calculateAnalytics(
  session: SessionDocument,
  leaderboard: LeaderboardEntry[]
): AnalyticsData {
  try {
    const overallWinnerId = leaderboard.length > 0 ? leaderboard[0].chefId : '';

    return {
      mostControversial: calculateMostControversial(session, leaderboard),
      judgesFavorite: calculateJudgesFavorite(session),
      chefsFavorite: calculateChefsFavorite(session),
      toughestCritic: calculateToughestCritic(session),
      mostGenerousVoter: calculateMostGenerousVoter(session),
      categoryWinners: calculateCategoryWinners(leaderboard, overallWinnerId),
      generalStats: calculateGeneralStats(session, leaderboard),
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    // Return empty analytics on error
    return {
      mostControversial: null,
      judgesFavorite: null,
      chefsFavorite: null,
      toughestCritic: null,
      mostGenerousVoter: null,
      categoryWinners: {
        technique: null,
        presentation: null,
        taste: null,
      },
      generalStats: {
        averageScore: 0,
        highestSingleVote: 0,
        lowestSingleVote: 0,
        perfectScores: 0,
        scoreSpread: 0,
      },
    };
  }
}
