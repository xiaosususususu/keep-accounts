
export enum TransactionType {
  BUY_IN = 'BUY_IN', // Buying chips (Negative cash flow for player initially, positive for pot) OR Recording a Loss
  CASH_OUT = 'CASH_OUT', // Cashing out chips (Positive cash flow for player) OR Recording a Win
}

export type GameType = 'POKER' | 'MAHJONG' | 'GENERAL';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isGuest: boolean;
}

export interface Transaction {
  id: string;
  gameId: string;
  playerId: string;
  type: TransactionType;
  amount: number;
  timestamp: number;
  note?: string;
  round?: number; // Added: Track which round this occurred in
}

export interface GamePlayerStats {
  playerId: string;
  totalBuyIn: number;
  totalCashOut: number;
  netScore: number; // CashOut - BuyIn
  chipsInHand: number; // For live tracking if needed, usually just implied by netScore logic at end
}

export interface Game {
  id: string;
  name: string;
  type: GameType;
  createdAt: number;
  endedAt?: number;
  status: 'ACTIVE' | 'COMPLETED';
  blindRules?: string;
  playerIds: string[];
  currentRound?: number; // Added: Track the current round number
}

export interface AppState {
  games: Game[];
  players: Player[];
  transactions: Transaction[];
}

export interface SettlementTransfer {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}
