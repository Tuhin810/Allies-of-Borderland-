// Game Economy Constants

export const ECONOMY = {
  // Token name
  TOKEN_NAME: 'RC',
  TOKEN_SYMBOL: 'RC',
  
  // Initial bonuses
  NEW_USER_BONUS: 200, // Tokens given to new users
  
  // Room costs
  ROOM_CREATION_COST: 10, // Cost to create a new room
  
  // Staking
  MIN_STAKE: 1, // Minimum stake amount
  MAX_STAKE_PERCENTAGE: 100, // Can stake up to 100% of balance
  
  // Display
  TOKEN_DECIMALS: 0, // RC tokens are whole numbers
} as const;

export type EconomyConfig = typeof ECONOMY;
