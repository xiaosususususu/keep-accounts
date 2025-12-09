
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, DollarSign, LogOut, Trash2, Languages, Dice5, Coins, Calculator, StepForward, ScrollText, TrendingUp, History, Lock, Calendar } from 'lucide-react';
import { Game, Player, Transaction, TransactionType, AppState, GameType } from './types';
import { getInitialState, saveState, calculateGameStats, calculateSettlement, formatCurrency } from './services/gameService';
import { Button, Input, Card, Modal, StatBadge } from './components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useTranslation } from './i18n';

// --- View Components ---

const GameList: React.FC<{ 
  games: Game[]; 
  onSelect: (id: string) => void; 
  onCreate: () => void 
}> = ({ games, onSelect, onCreate }) => {
  const { t, language, setLanguage } = useTranslation();
  const activeGames = games.filter(g => g.status === 'ACTIVE').sort((a,b) => b.createdAt - a.createdAt);
  const historyGames = games.filter(g => g.status === 'COMPLETED').sort((a,b) => b.createdAt - a.createdAt);

  const getTypeIcon = (type: GameType) => {
    switch(type) {
        case 'MAHJONG': return <Dice5 size={16} className="text-pink-400" />;
        case 'GENERAL': return <Calculator size={16} className="text-blue-400" />;
        default: return <Coins size={16} className="text-yellow-400" />;
    }
  };

  const getTypeName = (type: GameType) => {
      switch(type) {
          case 'MAHJONG': return t('typeMahjong');
          case 'GENERAL': return t('typeGeneral');
          default: return t('typePoker');
      }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{t('appTitle')}</h1>
        <div className="flex gap-2">
            <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-bold text-slate-300 transition-colors"
            >
                <Languages size={14} />
                {language === 'en' ? 'EN' : '中'}
            </button>
            <Button onClick={onCreate} icon={Plus} size="sm">{t('newGame')}</Button>
        </div>
      </div>

      {activeGames.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('liveNow')}</h2>
          <div className="grid gap-3">
            {activeGames.map(game => (
              <div 
                key={game.id}
                onClick={() => onSelect(game.id)}
                className="group relative bg-slate-800 p-4 rounded-xl border-l-4 border-emerald-500 hover:bg-slate-750 transition-all cursor-pointer shadow-lg shadow-black/20 active:scale-98"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                        {game.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs bg-slate-900/50 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                             {getTypeIcon(game.type || 'POKER')} {getTypeName(game.type || 'POKER')}
                        </span>
                        <p className="text-xs text-slate-400">
                             • {game.playerIds.length} {t('players')}
                        </p>
                        <p className="text-xs text-slate-500">
                             • {t('round')} {game.currentRound || 1}
                        </p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold animate-pulse">
                    {t('liveTag')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('history')}</h2>
        {historyGames.length === 0 && <p className="text-slate-600 text-sm italic">{t('noHistory')}</p>}
        <div className="grid gap-3">
          {historyGames.map(game => (
            <div 
              key={game.id}
              onClick={() => onSelect(game.id)}
              className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all cursor-pointer active:scale-98"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-slate-300">{game.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(game.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-600">• {getTypeName(game.type || 'POKER')}</span>
                  </div>
                </div>
                <div className="text-slate-500">
                  <History size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const { t, language, setLanguage } = useTranslation();
  const [state, setState] = useState<AppState>({ games: [], players: [], transactions: [] });
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  // Modals
  const [showNewGame, setShowNewGame] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', onConfirm: () => {} });
  
  // Forms State
  const [newGameName, setNewGameName] = useState('');
  const [newGameType, setNewGameType] = useState<GameType>('POKER');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedTxType, setSelectedTxType] = useState<TransactionType>(TransactionType.BUY_IN);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [txAmount, setTxAmount] = useState('');

  // Initialization
  useEffect(() => {
    const loaded = getInitialState();
    setState(loaded);
  }, []);

  // Persistence
  useEffect(() => {
    if (state.games.length > 0) { // Only save if we have data (avoid wiping on bad load)
        saveState(state);
    }
  }, [state]);

  const activeGame = useMemo(() => 
    state.games.find(g => g.id === activeGameId), 
  [state.games, activeGameId]);

  const gameStats = useMemo(() => {
    if (!activeGame) return [];
    return calculateGameStats(activeGame.id, state.transactions, activeGame.playerIds);
  }, [activeGame, state.transactions]);

  const historyByRound = useMemo(() => {
    if (!activeGame) return {};
    const gameTxs = state.transactions
        .filter(t => t.gameId === activeGame.id)
        .sort((a, b) => b.timestamp - a.timestamp); // Newest first

    const groups: Record<number, Transaction[]> = {};
    gameTxs.forEach(tx => {
        const r = tx.round || 1;
        if (!groups[r]) groups[r] = [];
        groups[r].push(tx);
    });
    return groups;
  }, [activeGame, state.transactions]);

  // Helpers
  const fmtMoney = (amount: number) => formatCurrency(amount, language === 'zh' ? 'CNY' : 'USD');

  // Labels based on game type
  const getActionLabels = (type: GameType = 'POKER') => {
      if (type === 'POKER') {
          return {
              buyIn: t('actionBuyIn'),
              cashOut: t('actionCashOut'),
              confirmBuyIn: t('confirmBuyIn'),
              confirmCashOut: t('confirmCashOut')
          };
      }
      return {
          buyIn: t('actionLoss'),
          cashOut: t('actionWin'),
          confirmBuyIn: t('confirmLoss'),
          confirmCashOut: t('confirmWin')
      };
  };

  const actionLabels = useMemo(() => getActionLabels(activeGame?.type), [activeGame?.type, language]);

  // Helper to open confirm modal
  const triggerConfirm = (title: string, onConfirm: () => void) => {
      setConfirmModal({ isOpen: true, title, onConfirm });
  };

  // --- Actions ---

  const handleCreateGame = () => {
    if (!newGameName.trim()) return;
    const newGame: Game = {
      id: Date.now().toString(),
      name: newGameName,
      type: newGameType,
      createdAt: Date.now(),
      status: 'ACTIVE',
      playerIds: [],
      currentRound: 1 // Init round
    };
    setState(prev => ({ ...prev, games: [newGame, ...prev.games] }));
    setNewGameName('');
    setNewGameType('POKER');
    setShowNewGame(false);
    setActiveGameId(newGame.id);
  };

  const handleNextRound = () => {
      if (!activeGame || activeGame.status !== 'ACTIVE') return;
      triggerConfirm(t('confirmNextRound'), () => {
          const next = (activeGame.currentRound || 1) + 1;
          setState(prev => ({
              ...prev,
              games: prev.games.map(g => g.id === activeGame.id ? { ...g, currentRound: next } : g)
          }));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
      });
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim() || !activeGame || activeGame.status !== 'ACTIVE') return;
    
    // Check if player exists globally, if not create
    let player = state.players.find(p => p.name.toLowerCase() === newPlayerName.toLowerCase());
    if (!player) {
      player = {
        id: Date.now().toString(),
        name: newPlayerName,
        isGuest: true
      };
      setState(prev => ({ ...prev, players: [...prev.players, player!] }));
    }

    // Add to game
    if (!activeGame.playerIds.includes(player.id)) {
      const updatedGame = { ...activeGame, playerIds: [...activeGame.playerIds, player.id] };
      setState(prev => ({
        ...prev,
        games: prev.games.map(g => g.id === activeGame.id ? updatedGame : g)
      }));
    }
    
    setNewPlayerName('');
    setShowAddPlayer(false);
  };

  const handleTransaction = () => {
    if (!activeGame || activeGame.status !== 'ACTIVE' || !selectedPlayerId || !txAmount) return;
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) return;

    const tx: Transaction = {
      id: Date.now().toString(),
      gameId: activeGame.id,
      playerId: selectedPlayerId,
      type: selectedTxType,
      amount: amount,
      timestamp: Date.now(),
      round: activeGame.currentRound || 1
    };

    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, tx]
    }));
    
    setTxAmount('');
    setShowTransaction(false);
  };

  const handleDeleteTransaction = (txId: string) => {
    if (activeGame?.status !== 'ACTIVE') return;
    triggerConfirm(t('confirmDeleteTx'), () => {
        setState(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== txId)
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleEndGame = () => {
    if (!activeGame) return;
    triggerConfirm(t('confirmEndGame'), () => {
        setState(prev => ({
            ...prev,
            games: prev.games.map(g => g.id === activeGame.id ? { ...g, status: 'COMPLETED', endedAt: Date.now() } : g)
        }));
        setShowSettlement(true);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleDeleteGame = () => {
      if(!activeGame) return;
      triggerConfirm(t('confirmDeleteGame'), () => {
        setState(prev => ({
            ...prev,
            games: prev.games.filter(g => g.id !== activeGame.id),
            transactions: prev.transactions.filter(t => t.gameId !== activeGame.id)
        }));
        setActiveGameId(null);
        setShowSettlement(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      });
  }

  // --- Views ---

  if (!activeGameId) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 max-w-lg mx-auto">
        <GameList 
            games={state.games} 
            onSelect={setActiveGameId} 
            onCreate={() => setShowNewGame(true)} 
        />
        
        {/* New Game Modal */}
        <Modal isOpen={showNewGame} onClose={() => setShowNewGame(false)} title={t('createGameTitle')}>
          <div className="space-y-4">
            <Input 
              label={t('sessionNameLabel')}
              placeholder={t('sessionNamePlaceholder')}
              value={newGameName} 
              onChange={e => setNewGameName(e.target.value)} 
              autoFocus
            />
            
            <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('gameTypeLabel')}</label>
                <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={() => setNewGameType('POKER')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${newGameType === 'POKER' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                    >
                        <Coins size={20} className={newGameType === 'POKER' ? 'text-yellow-300' : 'text-slate-500'} />
                        <div className="text-left">
                            <div className="font-bold text-sm">{t('typePoker')}</div>
                        </div>
                    </button>
                    <button 
                        onClick={() => setNewGameType('MAHJONG')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${newGameType === 'MAHJONG' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                    >
                        <Dice5 size={20} className={newGameType === 'MAHJONG' ? 'text-pink-300' : 'text-slate-500'} />
                         <div className="text-left">
                            <div className="font-bold text-sm">{t('typeMahjong')}</div>
                        </div>
                    </button>
                    <button 
                        onClick={() => setNewGameType('GENERAL')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${newGameType === 'GENERAL' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                    >
                        <Calculator size={20} className={newGameType === 'GENERAL' ? 'text-blue-300' : 'text-slate-500'} />
                         <div className="text-left">
                            <div className="font-bold text-sm">{t('typeGeneral')}</div>
                        </div>
                    </button>
                </div>
            </div>

            <Button onClick={handleCreateGame} className="w-full">{t('createGameBtn')}</Button>
          </div>
        </Modal>
      </div>
    );
  }

  // Active Game View
  const totalBuyIn = gameStats.reduce((sum, p) => sum + p.totalBuyIn, 0);
  const totalCashOut = gameStats.reduce((sum, p) => sum + p.totalCashOut, 0);
  const discrepancy = totalBuyIn - totalCashOut;
  const settlementPlan = calculateSettlement(gameStats, state.players);

  const isPoker = activeGame?.type === 'POKER' || !activeGame?.type;
  const currentRound = activeGame?.currentRound || 1;
  const isActive = activeGame?.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <button onClick={() => setActiveGameId(null)} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ChevronLeft />
        </button>
        <div className="text-center">
            <h1 className="font-bold text-white flex items-center justify-center gap-2">
                {activeGame?.name}
                {!isActive && <Lock size={14} className="text-rose-400" />}
            </h1>
            <p className="text-xs text-slate-400">{t('totalPot')}: <span className="text-emerald-400 font-mono">{fmtMoney(totalBuyIn)}</span></p>
        </div>
        <div className="flex gap-1">
            <button 
                onClick={() => setShowHistory(true)}
                className="text-slate-400 hover:text-white p-2"
                title={t('historyLog')}
            >
                <ScrollText size={20} />
            </button>
            <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="text-slate-400 hover:text-white p-2"
            >
                <Languages size={20} />
            </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-32 space-y-6 overflow-y-auto no-scrollbar">
        
        {/* Game Stats Cards with Round Info */}
        <div className="grid grid-cols-3 gap-3">
             <Card className="flex flex-col items-center justify-center py-4 bg-slate-800">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider">{t('buyIns')}</span>
                <span className="text-sm font-mono font-bold text-white">{fmtMoney(totalBuyIn)}</span>
             </Card>
             <Card className="flex flex-col items-center justify-center py-4 bg-slate-800">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider">{t('players')}</span>
                <span className="text-sm font-mono font-bold text-white">{activeGame?.playerIds.length}</span>
             </Card>
             <Card 
                className={`flex flex-col items-center justify-center py-2 bg-gradient-to-br from-indigo-900/40 to-slate-800 transition-all ${isActive ? 'cursor-pointer hover:border-indigo-500/50 active:scale-95' : 'opacity-70 border-slate-800/50'}`}
                onClick={isActive ? handleNextRound : undefined}
             >
                <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>{isActive ? t('round') : t('finalRound')}</span>
                <div className="flex items-center gap-1">
                    <span className={`text-xl font-mono font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{currentRound}</span>
                    {isActive && <StepForward size={14} className="text-indigo-400" />}
                </div>
             </Card>
        </div>

        {/* Player List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-semibold text-slate-400 uppercase">{t('leaderboard')}</h2>
            {isActive && (
                <button onClick={() => setShowAddPlayer(true)} className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1">
                <Plus size={14} /> {t('addPlayer')}
                </button>
            )}
          </div>
          
          {gameStats.map(stat => {
            const player = state.players.find(p => p.id === stat.playerId);
            return (
              <div key={stat.playerId} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between border border-slate-700/50 hover:border-slate-600 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${stat.netScore >= 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>
                    {player?.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100">{player?.name}</div>
                    <div className="text-xs text-slate-500">
                        {t('in')}: {stat.totalBuyIn} {stat.totalCashOut > 0 && `• ${t('out')}: ${stat.totalCashOut}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <StatBadge value={stat.netScore} />
                   {isActive && (
                       <button 
                            onClick={() => {
                                setSelectedPlayerId(stat.playerId);
                                setShowTransaction(true);
                            }}
                            className="mt-1 text-xs text-slate-500 hover:text-indigo-400 underline decoration-dotted"
                        >
                            {t('action')}
                        </button>
                   )}
                </div>
              </div>
            );
          })}
          
          {gameStats.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-500 mb-2">{t('noPlayersYet')}</p>
                {isActive && <Button variant="secondary" size="sm" onClick={() => setShowAddPlayer(true)}>{t('addFirstPlayer')}</Button>}
            </div>
          )}
        </div>

        {/* Visualizer (Chart) */}
        {gameStats.length > 0 && (
            <Card title={t('netScore')} className="h-64 pt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gameStats}>
                        <XAxis dataKey="playerId" tickFormatter={(id) => state.players.find(p => p.id === id)?.name || ''} tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <ReferenceLine y={0} stroke="#475569" />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            formatter={(value: number) => [value, t('netScore')]}
                            labelFormatter={() => ''}
                        />
                        <Bar dataKey="netScore" radius={[4, 4, 4, 4]}>
                            {gameStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.netScore >= 0 ? '#10b981' : '#f43f5e'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        )}

        {/* Actions Footer */}
        {isActive ? (
             <div className="fixed bottom-6 left-0 right-0 px-6 max-w-lg mx-auto flex gap-3 z-30">
                <Button 
                    className="flex-1 shadow-xl shadow-indigo-900/20" 
                    onClick={() => {
                        setSelectedPlayerId(gameStats[0]?.playerId || ''); // Default to first
                        setShowTransaction(true);
                    }}
                    icon={DollarSign}
                >
                    {t('recordBtn')}
                </Button>
                <Button variant="danger" className="flex-1 shadow-xl shadow-rose-900/20" onClick={handleEndGame} icon={LogOut}>
                    {t('settleGameBtn')}
                </Button>
            </div>
        ) : (
            <div className="fixed bottom-6 left-0 right-0 px-6 max-w-lg mx-auto z-30">
                 <Button variant="secondary" className="w-full" onClick={() => setShowSettlement(true)}>
                    {t('viewSettlementBtn')}
                </Button>
            </div>
        )}

      </main>

      {/* --- Modals --- */}
      
      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} title={t('confirm')}>
          <div className="space-y-6 py-2">
            <p className="text-slate-300 text-base">{confirmModal.title}</p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>{t('cancel')}</Button>
                <Button className="flex-1" onClick={confirmModal.onConfirm}>{t('confirm')}</Button>
            </div>
          </div>
      </Modal>

      {/* Add Player */}
      <Modal isOpen={showAddPlayer} onClose={() => setShowAddPlayer(false)} title={t('addPlayerTitle')}>
        <div className="space-y-4">
            <Input 
                label={t('playerNameLabel')} 
                value={newPlayerName} 
                onChange={e => setNewPlayerName(e.target.value)} 
                placeholder={t('playerNamePlaceholder')}
                autoFocus
            />
            {/* Existing Players Quick Select */}
            {state.players.length > 0 && (
                <div>
                     <span className="text-xs text-slate-500 mb-1 block">{t('quickSelect')}</span>
                     <div className="flex flex-wrap gap-2">
                        {state.players
                            .filter(p => !activeGame?.playerIds.includes(p.id))
                            .slice(0, 5)
                            .map(p => (
                            <button 
                                key={p.id}
                                onClick={() => setNewPlayerName(p.name)}
                                className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-700"
                            >
                                {p.name}
                            </button>
                        ))}
                     </div>
                </div>
            )}
            <Button onClick={handleAddPlayer} className="w-full">{t('joinGameBtn')}</Button>
        </div>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={showTransaction} onClose={() => setShowTransaction(false)} title={t('recordTxTitle')}>
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setSelectedTxType(TransactionType.BUY_IN)}
                    className={`py-2 rounded-md text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedTxType === TransactionType.BUY_IN ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >   
                    <span>{actionLabels.buyIn}</span>
                    <span className="text-[10px] opacity-70 font-normal">
                         {isPoker ? '(- Chips)' : '(Expenses)'}
                    </span>
                </button>
                <button 
                    onClick={() => setSelectedTxType(TransactionType.CASH_OUT)}
                    className={`py-2 rounded-md text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedTxType === TransactionType.CASH_OUT ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <span>{actionLabels.cashOut}</span>
                    <span className="text-[10px] opacity-70 font-normal">
                         {isPoker ? '(+ Chips)' : '(Income)'}
                    </span>
                </button>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold uppercase">{t('playerLabel')}</label>
                <div className="grid grid-cols-3 gap-2">
                    {activeGame?.playerIds.map(pid => {
                        const p = state.players.find(x => x.id === pid);
                        return (
                            <button
                                key={pid}
                                onClick={() => setSelectedPlayerId(pid)}
                                className={`px-2 py-3 rounded-lg text-sm border transition-all truncate ${selectedPlayerId === pid ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                            >
                                {p?.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <Input 
                label={t('amountLabel')}
                type="number" 
                inputMode="decimal"
                placeholder="0.00"
                value={txAmount} 
                onChange={e => setTxAmount(e.target.value)} 
                autoFocus
            />

            <Button onClick={handleTransaction} className="w-full">
                {selectedTxType === TransactionType.BUY_IN ? actionLabels.confirmBuyIn : actionLabels.confirmCashOut}
            </Button>
        </div>
      </Modal>

      {/* History Log Modal */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title={t('historyLog')}>
          <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-1">
             {Object.entries(historyByRound).length === 0 && (
                 <p className="text-center text-slate-500 text-sm py-8">{t('noTransactions')}</p>
             )}
             {Object.entries(historyByRound)
                .sort((a,b) => Number(b[0]) - Number(a[0])) // Sort rounds desc
                .map(([round, txs]) => (
                    <div key={round} className="relative">
                        <div className="sticky top-0 bg-slate-900/95 backdrop-blur py-1.5 z-10 flex items-center gap-2 border-b border-slate-800 mb-2">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                {t('round')} {round}
                            </span>
                            <span className="text-[10px] text-slate-500">• {txs.length} entries</span>
                        </div>
                        <div className="space-y-2 pl-2 border-l-2 border-slate-800 ml-2">
                            {txs.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded hover:bg-slate-800 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-200">
                                                {state.players.find(p => p.id === tx.playerId)?.name}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {tx.type === TransactionType.BUY_IN ? actionLabels.buyIn : actionLabels.cashOut}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                         <span className={`font-mono font-bold ${tx.type === TransactionType.CASH_OUT ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {tx.type === TransactionType.CASH_OUT ? '+' : '-'}{fmtMoney(tx.amount)}
                                         </span>
                                         {isActive && (
                                             <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-600 hover:text-rose-500 transition-colors">
                                                <Trash2 size={16} />
                                             </button>
                                         )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
             }
          </div>
      </Modal>

      {/* Settlement Modal */}
      <Modal isOpen={showSettlement} onClose={() => setShowSettlement(false)} title={t('finalSettlementTitle')}>
            {/* Warning if unbalanced */}
            {Math.abs(discrepancy) > 0.01 && (
                <div className="bg-rose-900/20 border border-rose-500/50 p-3 rounded-lg flex items-center gap-3 mb-4 text-rose-300">
                     <div className="bg-rose-500/20 p-2 rounded-full"><TrendingUp size={20} /></div>
                     <div>
                        <h4 className="font-bold text-sm">{t('unbalancedLedger')}</h4>
                        <p className="text-xs">{discrepancy > 0 ? t('moneyMissing') : t('extraMoney')}: <span className="font-mono font-bold">{fmtMoney(Math.abs(discrepancy))}</span></p>
                     </div>
                </div>
            )}

            {/* Transfer Plan */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('transferPlan')}</h4>
                <div className="space-y-2">
                    {settlementPlan.length === 0 ? (
                        <p className="text-slate-500 italic text-sm">{t('everyoneEven')}</p>
                    ) : (
                        settlementPlan.map((transfer, idx) => (
                             <div key={idx} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border-l-4 border-indigo-500">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <span className="font-bold text-white">{transfer.fromPlayerName}</span>
                                    <span className="text-slate-500">{t('pays')}</span>
                                    <span className="font-bold text-white">{transfer.toPlayerName}</span>
                                </div>
                                <span className="font-mono font-bold text-emerald-400">{fmtMoney(transfer.amount)}</span>
                             </div>
                        ))
                    )}
                </div>
            </div>

            {/* Standings */}
            <div className="mb-6">
                 <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('finalStandings')}</h4>
                 <div className="space-y-1">
                    {gameStats.map(stat => (
                        <div key={stat.playerId} className="flex justify-between text-sm py-1 border-b border-slate-800 last:border-0">
                            <span className="text-slate-300">{state.players.find(p => p.id === stat.playerId)?.name}</span>
                            <span className={`font-mono font-bold ${stat.netScore > 0 ? 'text-emerald-400' : stat.netScore < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                {stat.netScore > 0 ? '+' : ''}{fmtMoney(stat.netScore)}
                            </span>
                        </div>
                    ))}
                 </div>
            </div>

            <div className="flex gap-3">
                 <Button variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30" onClick={handleDeleteGame}>
                    {t('deleteRecordBtn')}
                 </Button>
                 <Button className="flex-1" onClick={() => setShowSettlement(false)}>
                    {t('closeBtn')}
                 </Button>
            </div>
      </Modal>

    </div>
  );
}
