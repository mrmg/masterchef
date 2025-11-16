import type { Chef, SessionDocument } from '../types/index';
import { GamePhase } from '../types/index';

export const getNextRoundChefs = (
  chefs: { [chefId: string]: Chef },
  simultaneousPlayers: number
): string[] => {
  const chefList = Object.values(chefs)
    .filter(chef => !chef.hasCooked)
    .sort((a, b) => a.order - b.order);

  return chefList.slice(0, simultaneousPlayers).map(chef => chef.id);
};

export const hasMoreRounds = (chefs: { [chefId: string]: Chef }): boolean => {
  return Object.values(chefs).some(chef => !chef.hasCooked);
};

export const getCurrentRoundNumber = (session: SessionDocument): number => {
  return session.state.currentRound;
};

export const canStartNextRound = (session: SessionDocument): boolean => {
  const { phase } = session.state;
  return phase === GamePhase.ROUND_COMPLETE || phase === GamePhase.SETUP;
};

export const shouldShowResults = (session: SessionDocument): boolean => {
  return !hasMoreRounds(session.chefs);
};

export const getAllParticipantNames = (chefs: { [chefId: string]: Chef }): string[] => {
  return Object.values(chefs).map(chef => chef.name);
};

export const getChefsByIds = (
  chefs: { [chefId: string]: Chef },
  chefIds: string[]
): Chef[] => {
  return chefIds.map(id => chefs[id]).filter(Boolean);
};
