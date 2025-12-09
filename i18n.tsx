

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    appTitle: "PokerLedger",
    newGame: "New Game",
    liveNow: "Live Now",
    history: "History",
    noHistory: "No history yet.",
    createGameTitle: "New Game Session",
    sessionNameLabel: "Session Name",
    sessionNamePlaceholder: "e.g. Friday Night",
    gameTypeLabel: "Game Type",
    typePoker: "Poker / Chips",
    typeMahjong: "Mahjong / Board Game",
    typeGeneral: "General Scoring",
    createGameBtn: "Create Game",
    totalPot: "Total Flow",
    buyIns: "Total In",
    players: "Players",
    leaderboard: "Leaderboard",
    addPlayer: "Add Player",
    addPlayerTitle: "Add Player",
    playerNameLabel: "Player Name",
    playerNamePlaceholder: "e.g. Bob",
    quickSelect: "Quick Select",
    joinGameBtn: "Join Game",
    recordTxTitle: "Record Transaction",
    // Dynamic labels based on context
    actionBuyIn: "Buy In",
    actionCashOut: "Cash Out",
    actionLoss: "Record Expense/Loss",
    actionWin: "Record Income/Win",
    amountLabel: "Amount",
    confirmBuyIn: "Confirm Buy In",
    confirmCashOut: "Confirm Cash Out",
    confirmLoss: "Confirm Expense",
    confirmWin: "Confirm Income",
    recordBtn: "Record",
    settleGameBtn: "Settle Game",
    viewSettlementBtn: "View Settlement Report",
    finalSettlementTitle: "Final Settlement",
    unbalancedLedger: "Unbalanced Ledger!",
    transferPlan: "Transfer Plan",
    everyoneEven: "Everyone is even (or no data).",
    pays: "pays",
    finalStandings: "Final Standings",
    closeBtn: "Close",
    deleteRecordBtn: "Delete Record",
    confirmEndGame: "Are you sure you want to settle and end this game?",
    confirmDeleteGame: "Delete this game and all its records?",
    action: "Action",
    in: "In/Loss",
    out: "Out/Win",
    netScore: "Net Score",
    moneyMissing: "Money missing",
    extraMoney: "Extra money",
    playerLabel: "Player",
    addFirstPlayer: "Add First Player",
    noPlayersYet: "No players yet",
    liveTag: "LIVE",
    diff: "Difference",
    totalBuyIn: "Total In",
    totalCashOut: "Total Out",
    // Round & History
    round: "Round",
    finalRound: "Final Round",
    nextRound: "Next Round",
    confirmNextRound: "Start Next Round?",
    historyLog: "Transaction Log",
    viewHistory: "Log",
    noTransactions: "No transactions.",
    deleteTx: "Delete",
    confirmDeleteTx: "Delete this transaction?",
    // Generic
    cancel: "Cancel",
    confirm: "Confirm"
  },
  zh: {
    appTitle: "牌局记账",
    newGame: "新建牌局",
    liveNow: "进行中",
    history: "历史记录",
    noHistory: "暂无历史记录",
    createGameTitle: "新建牌局",
    sessionNameLabel: "牌局名称",
    sessionNamePlaceholder: "例如：周五德州局",
    gameTypeLabel: "游戏类型",
    typePoker: "德州 / 筹码模式",
    typeMahjong: "麻将 / 积分模式",
    typeGeneral: "通用记账",
    createGameBtn: "创建牌局",
    totalPot: "总流水",
    buyIns: "总买入",
    players: "玩家",
    leaderboard: "排行榜",
    addPlayer: "添加玩家",
    addPlayerTitle: "添加玩家",
    playerNameLabel: "玩家昵称",
    playerNamePlaceholder: "例如：老王",
    quickSelect: "快速选择",
    joinGameBtn: "加入牌局",
    recordTxTitle: "记一笔",
    // Dynamic labels
    actionBuyIn: "买入 (负)",
    actionCashOut: "离桌 (正)",
    actionLoss: "记支出 / 输",
    actionWin: "记收入 / 赢",
    amountLabel: "金额 / 分数",
    confirmBuyIn: "确认买入",
    confirmCashOut: "确认离桌",
    confirmLoss: "确认支出",
    confirmWin: "确认收入",
    recordBtn: "记账",
    settleGameBtn: "结束结算",
    viewSettlementBtn: "查看结算单",
    finalSettlementTitle: "最终结算",
    unbalancedLedger: "账目不平！",
    transferPlan: "转账方案",
    everyoneEven: "账目持平（或无数据）",
    pays: "支付给",
    finalStandings: "最终战绩",
    closeBtn: "关闭",
    deleteRecordBtn: "删除记录",
    confirmEndGame: "确定要结算并结束当前牌局吗？",
    confirmDeleteGame: "确定要删除此牌局及其所有记录吗？",
    action: "操作",
    in: "投入/输",
    out: "带出/赢",
    netScore: "净胜",
    moneyMissing: "少钱",
    extraMoney: "多钱",
    playerLabel: "玩家",
    addFirstPlayer: "添加第一个玩家",
    noPlayersYet: "暂无玩家",
    liveTag: "进行中",
    diff: "差额",
    totalBuyIn: "总投入",
    totalCashOut: "总产出",
    // Round & History
    round: "轮数",
    finalRound: "最终轮数",
    nextRound: "下一轮",
    confirmNextRound: "确定开始下一轮？",
    historyLog: "流水记录",
    viewHistory: "明细",
    noTransactions: "暂无流水",
    deleteTx: "删除",
    confirmDeleteTx: "确定删除这笔记录？",
    // Generic
    cancel: "取消",
    confirm: "确认"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('poker_ledger_lang');
    return (saved === 'zh' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('poker_ledger_lang', language);
  }, [language]);

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
