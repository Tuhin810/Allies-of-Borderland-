export enum GamePhase {
  LOBBY = 'LOBBY',
  DISCUSSION = 'DISCUSSION', // Voice enabled, trade info
  JAIL = 'JAIL', // Voice disabled, vote on suit
  RESOLVING = 'RESOLVING',
  GAME_OVER = 'GAME_OVER'
}

export enum Role {
  CITIZEN = 'CITIZEN',
  JACK = 'JACK'
}

export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES'
}

export interface Player {
  id: string;
  peerId?: string; // WebRTC Peer ID
  name: string;
  avatar: string;
  hp: number;
  isAlive: boolean;
  isLocal: boolean;
  isHost?: boolean;
  isSpectator?: boolean;
  isWeb3?: boolean;
  role?: Role; // Hidden from others
  actualSuit?: Suit; // The truth (Hidden from self)
  guessedSuit?: Suit | null; // The bet
  betAmount: number; // Staked SOL
  balance: number; // In-game chips or SOL balance
  solanaAddress?: string; // Solana Public Key string
  reputation: number; // Trust score
}

export interface GameState {
  phase: GamePhase;
  round: number;
  timer: number;
  pot: number;
  narrative: string;
  history: string[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

// Network Types
export type NetworkMessageType = 'JOIN' | 'STATE_UPDATE' | 'PLAYER_ACTION' | 'WELCOME' | 'NARRATIVE' | 'CHAT' | 'BUY_IN';

export interface NetworkMessage {
  type: NetworkMessageType;
  payload: any;
  senderId?: string;
}

export interface PlayerAction {
  playerId: string;
  type: 'GUESS_SUIT' | 'BRIBE';
  value: any;
}