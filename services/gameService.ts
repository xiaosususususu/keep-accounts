import { Game, Player, Transaction, TransactionType, GamePlayerStats, SettlementTransfer, AppState } from '../types';

const STORAGE_KEY = 'poker_ledger_data_v1';

// Initial Seed Data
const generateId = () => Math.random().toString(36).substr(2, 9);

export const getInitialState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    games: [],
    players: [],
    transactions: [],
  };
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// --- Calculation Logic ---

export const calculateGameStats = (gameId: string, transactions: Transaction[], playerIds: string[]): GamePlayerStats[] => {
  const gameTransactions = transactions.filter(t => t.gameId === gameId);
  
  return playerIds.map(pid => {
    const playerTx = gameTransactions.filter(t => t.playerId === pid);
    
    const totalBuyIn = playerTx
      .filter(t => t.type === TransactionType.BUY_IN)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCashOut = playerTx
      .filter(t => t.type === TransactionType.CASH_OUT)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      playerId: pid,
      totalBuyIn,
      totalCashOut,
      netScore: totalCashOut - totalBuyIn,
      chipsInHand: 0 // Conceptual, really only valid after cashout
    };
  }).sort((a, b) => b.netScore - a.netScore);
};

// Automatic Settlement Algorithm (Minimize transactions)
// Simple greedy algorithm: Matches biggest winner with biggest loser
export const calculateSettlement = (stats: GamePlayerStats[], players: Player[]): SettlementTransfer[] => {
  const transfers: SettlementTransfer[] = [];
  
  // Clone to avoid mutating
  let debtors = stats.filter(s => s.netScore < 0).map(s => ({ ...s, netScore: s.netScore }));
  let creditors = stats.filter(s => s.netScore > 0).map(s => ({ ...s, netScore: s.netScore }));

  // Sort by magnitude (descending)
  debtors.sort((a, b) => a.netScore - b.netScore); // Ascending (most negative first)
  creditors.sort((a, b) => b.netScore - a.netScore); // Descending (most positive first)

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // The amount to settle is the minimum of what the creditor needs and what the debtor owes
    const amount = Math.min(creditor.netScore, Math.abs(debtor.netScore));

    if (amount > 0) {
      transfers.push({
        fromPlayerId: debtor.playerId,
        fromPlayerName: players.find(p => p.id === debtor.playerId)?.name || 'Unknown',
        toPlayerId: creditor.playerId,
        toPlayerName: players.find(p => p.id === creditor.playerId)?.name || 'Unknown',
        amount: Number(amount.toFixed(2))
      });
    }

    // Adjust remaining balances
    creditor.netScore -= amount;
    debtor.netScore += amount;

    // Move indices if settled within floating point tolerance
    if (Math.abs(creditor.netScore) < 0.01) i++;
    if (Math.abs(debtor.netScore) < 0.01) j++;
  }

  return transfers;
};

export const formatCurrency = (amount: number, currency: 'USD' | 'CNY' = 'USD') => {
  return new Intl.NumberFormat(currency === 'CNY' ? 'zh-CN' : 'en-US', { 
    style: 'currency', 
    currency: currency 
  }).format(amount);
};
