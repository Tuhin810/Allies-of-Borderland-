import { Player } from '../types';
import { ECONOMY } from '../constants/economy';

/**
 * Calculate total RC pot from all players
 */
export const calculateRCPot = (players: Player[]): number => {
  return players.reduce((total, player) => {
    return total + (player.rcStake || 0);
  }, 0);
};

/**
 * Validate stake amount
 */
export const validateStake = (
  stakeAmount: number,
  availableBalance: number
): { valid: boolean; error?: string } => {
  if (stakeAmount < ECONOMY.MIN_STAKE) {
    return {
      valid: false,
      error: `Minimum stake is ${ECONOMY.MIN_STAKE} ${ECONOMY.TOKEN_SYMBOL}`
    };
  }

  if (stakeAmount > availableBalance) {
    return {
      valid: false,
      error: `Insufficient balance. You have ${availableBalance} ${ECONOMY.TOKEN_SYMBOL}`
    };
  }

  return { valid: true };
};

/**
 * Distribute RC tokens to winners
 * Winners split the pot evenly
 */
export const distributeRCWinnings = (
  players: Player[],
  rcPot: number
): Map<string, number> => {
  const winners = players.filter(p => p.isAlive && !p.isSpectator);
  const winnings = new Map<string, number>();

  if (winners.length === 0) {
    return winnings;
  }

  // Each winner gets their stake back + equal share of the pot
  const potShare = rcPot / winners.length;

  winners.forEach(winner => {
    winnings.set(winner.id, potShare);
  });

  return winnings;
};

/**
 * Calculate winnings for a specific player
 */
export const calculatePlayerWinnings = (
  player: Player,
  winners: Player[],
  rcPot: number
): number => {
  if (!winners.find(w => w.id === player.id)) {
    // Player lost, loses their stake
    return 0;
  }

  // Winner gets equal share of the pot
  return rcPot / winners.length;
};

/**
 * Format RC amount for display
 */
export const formatRC = (amount: number): string => {
  return `${Math.floor(amount)} ${ECONOMY.TOKEN_SYMBOL}`;
};
