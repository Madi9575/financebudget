import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bill, BillStatus, BudgetCategory, FinanceData, NotificationItem, SavingsGoal, Transaction } from '../types';
import { financeRepository } from '../services/financeRepository';
import {
  clampNumber,
  createId,
  createRateLimiter,
  normalizeColor,
  parseCurrencyInput,
  sanitizeDateInput,
  sanitizeIconName,
  sanitizeText,
} from '../utils/security';

function syncBudgetSpending(cats: BudgetCategory[], txs: Transaction[]) {
  return cats.map(c => ({
    ...c,
    spent: Number(txs.filter(t => t.type === 'expense' && t.category === c.name).reduce((s, t) => s + t.amount, 0).toFixed(2)),
  }));
}

function ensureOther(cats: BudgetCategory[]) {
  if (cats.some(c => c.name === 'Autre')) return cats;
  return [...cats, { id: createId('b'), name: 'Autre', budgeted: 100, spent: 0, icon: 'file-text', color: '#71717a' }];
}

function generateSmartNotifications(data: FinanceData): NotificationItem[] {
  const now = new Date();
  const existing = new Set(data.notifications.map(n => n.id));
  const news: NotificationItem[] = [];

  // Budget alerts: category > 80%
  for (const cat of data.budgetCategories) {
    if (cat.budgeted > 0 && cat.spent / cat.budgeted >= 0.8) {
      const id = `alert_budget_${cat.id}`;
      if (!existing.has(id)) {
        news.push({ id, message: `${cat.name} : ${Math.round((cat.spent / cat.budgeted) * 100)}% du budget utilisé`, icon: 'wallet', color: 'bg-amber-50 text-amber-600', createdAt: now.toISOString(), read: false });
      }
    }
  }

  // Savings deadline alerts
  for (const goal of data.savingsGoals) {
    const deadline = new Date(goal.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;

    if (progress >= 1) {
      const id = `alert_goal_done_${goal.id}`;
      if (!existing.has(id)) {
        news.push({ id, message: `"${goal.title}" atteint !`, icon: 'target', color: 'bg-emerald-50 text-emerald-600', createdAt: now.toISOString(), read: false });
      }
    } else if (daysLeft <= 30 && daysLeft > 0 && progress < 1) {
      const id = `alert_goal_soon_${goal.id}`;
      if (!existing.has(id)) {
        news.push({ id, message: `"${goal.title}" : ${daysLeft}j restants, ${Math.round(progress * 100)}% atteint`, icon: 'target', color: 'bg-rose-50 text-rose-600', createdAt: now.toISOString(), read: false });
      }
    }
  }

  // Bill alerts
  for (const bill of data.bills) {
    const due = new Date(bill.dueDate);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    if (bill.status === 'pending' && daysLeft <= 3 && daysLeft >= 0) {
      const id = `alert_bill_${bill.id}`;
      if (!existing.has(id)) {
        news.push({ id, message: `${bill.name} à payer dans ${daysLeft}j`, icon: 'file-text', color: 'bg-rose-50 text-rose-600', createdAt: now.toISOString(), read: false });
      }
    }
    if (bill.status !== 'paid' && daysLeft < 0) {
      const id = `alert_bill_overdue_${bill.id}`;
      if (!existing.has(id)) {
        news.push({ id, message: `${bill.name} en retard !`, icon: 'alert-triangle', color: 'bg-red-50 text-red-600', createdAt: now.toISOString(), read: false });
      }
    }
  }

  return news;
}

export function useFinanceStore() {
  const [data, setData] = useState<FinanceData>(() => {
    const loaded = financeRepository.load();
    if (!loaded.bills) loaded.bills = [];
    return loaded;
  });
  const limiter = useRef(createRateLimiter(10, 10000));

  const updateData = useCallback((updater: (prev: FinanceData) => FinanceData) => {
    setData(prev => {
      const next = updater(prev);
      financeRepository.save(next);
      return next;
    });
  }, []);

  // Smart notification generation on data change
  useEffect(() => {
    const newNotifs = generateSmartNotifications(data);
    if (newNotifs.length > 0) {
      updateData(prev => ({ ...prev, notifications: [...newNotifs, ...prev.notifications] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.budgetCategories, data.savingsGoals, data.bills]);

  const rl = useCallback((a: string, cb: () => void) => {
    if (!limiter.current.allow(a)) return false;
    cb();
    return true;
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => rl('addTx', () => {
    const title = sanitizeText(tx.title, 72);
    const amount = parseCurrencyInput(tx.amount, 0, 1e9);
    if (!title || amount <= 0) return;
    updateData(prev => {
      const next = [{ ...tx, id: createId('tx'), title, category: sanitizeText(tx.category, 40) || 'Autre', amount, icon: sanitizeIconName(tx.icon), date: sanitizeDateInput(tx.date) }, ...prev.transactions];
      return { ...prev, transactions: next, budgetCategories: syncBudgetSpending(prev.budgetCategories, next) };
    });
  }), [updateData, rl]);

  const deleteTransaction = useCallback((id: string) => rl('delTx', () => {
    updateData(prev => {
      const next = prev.transactions.filter(t => t.id !== id);
      return { ...prev, transactions: next, budgetCategories: syncBudgetSpending(prev.budgetCategories, next) };
    });
  }), [updateData, rl]);

  const addSavingsGoal = useCallback((g: Omit<SavingsGoal, 'id'>) => rl('addGoal', () => {
    const title = sanitizeText(g.title, 72);
    const targetAmount = parseCurrencyInput(g.targetAmount, 1, 1e9);
    if (!title || targetAmount <= 0) return;
    updateData(prev => ({ ...prev, savingsGoals: [...prev.savingsGoals, { ...g, id: createId('goal'), title, targetAmount, currentAmount: parseCurrencyInput(g.currentAmount, 0, targetAmount), icon: sanitizeIconName(g.icon), color: normalizeColor(g.color), deadline: sanitizeDateInput(g.deadline) }] }));
  }), [updateData, rl]);

  const updateSavingsGoal = useCallback((id: string, amount: number) => rl('updGoal', () => {
    const deposit = parseCurrencyInput(amount, 0, 1e9);
    if (deposit <= 0) return;
    updateData(prev => ({ ...prev, savingsGoals: prev.savingsGoals.map(g => g.id === id ? { ...g, currentAmount: clampNumber(g.currentAmount + deposit, 0, g.targetAmount) } : g) }));
  }), [updateData, rl]);

  const editSavingsGoal = useCallback((id: string, u: Partial<SavingsGoal>) => rl('editGoal', () => {
    const title = sanitizeText(u.title ?? '', 72);
    if (!title) return;
    const targetAmount = parseCurrencyInput(u.targetAmount ?? 1, 1, 1e9);
    updateData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map(g => g.id === id ? {
        ...g,
        title,
        targetAmount,
        icon: sanitizeIconName(u.icon ?? g.icon),
        color: normalizeColor(u.color ?? g.color),
        deadline: sanitizeDateInput(u.deadline ?? g.deadline),
      } : g),
    }));
  }), [updateData, rl]);

  const reorderSavingsGoals = useCallback((from: number, to: number) => rl('reorderGoals', () => {
    updateData(prev => {
      if (from === to || from < 0 || to < 0 || from >= prev.savingsGoals.length || to >= prev.savingsGoals.length) return prev;
      const list = [...prev.savingsGoals];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { ...prev, savingsGoals: list };
    });
  }), [updateData, rl]);

  const deleteSavingsGoal = useCallback((id: string) => rl('delGoal', () => {
    updateData(prev => ({ ...prev, savingsGoals: prev.savingsGoals.filter(g => g.id !== id) }));
  }), [updateData, rl]);

  const addBudgetCategory = useCallback((c: { name: string; icon: string; color: string; budgeted?: number }) => rl('addCat', () => {
    const name = sanitizeText(c.name, 40);
    if (!name) return;
    updateData(prev => {
      if (prev.budgetCategories.some(x => x.name.toLowerCase() === name.toLowerCase())) return prev;
      const next = [...prev.budgetCategories, { id: createId('b'), name, budgeted: clampNumber(c.budgeted ?? 100, 0, 1e9), spent: 0, icon: sanitizeIconName(c.icon || 'file-text'), color: normalizeColor(c.color) }];
      return { ...prev, budgetCategories: syncBudgetSpending(next, prev.transactions) };
    });
  }), [updateData, rl]);

  const updateBudgetCategory = useCallback((id: string, u: Partial<BudgetCategory>) => rl('updCat', () => {
    updateData(prev => {
      const cur = prev.budgetCategories.find(c => c.id === id);
      if (!cur) return prev;
      const nextName = sanitizeText(u.name ?? cur.name, 40) || cur.name;
      const txs = prev.transactions.map(t => t.category === cur.name ? { ...t, category: nextName } : t);
      const cats = prev.budgetCategories.map(c => c.id === id ? { ...c, name: nextName, budgeted: clampNumber(u.budgeted ?? c.budgeted, 0, 1e9), icon: sanitizeIconName(u.icon ?? c.icon), color: normalizeColor(u.color ?? c.color) } : c);
      return { ...prev, transactions: txs, budgetCategories: syncBudgetSpending(cats, txs) };
    });
  }), [updateData, rl]);

  const deleteBudgetCategory = useCallback((id: string) => rl('delCat', () => {
    updateData(prev => {
      const cur = prev.budgetCategories.find(c => c.id === id);
      if (!cur) return prev;
      const cats = ensureOther(prev.budgetCategories.filter(c => c.id !== id));
      const txs = prev.transactions.map(t => t.category === cur.name ? { ...t, category: 'Autre', icon: 'file-text' } : t);
      return { ...prev, transactions: txs, budgetCategories: syncBudgetSpending(cats, txs) };
    });
  }), [updateData, rl]);

  const reorderBudgetCategories = useCallback((from: number, to: number) => rl('reorderCats', () => {
    updateData(prev => {
      if (from === to || from < 0 || to < 0 || from >= prev.budgetCategories.length || to >= prev.budgetCategories.length) return prev;
      const list = [...prev.budgetCategories];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { ...prev, budgetCategories: list };
    });
  }), [updateData, rl]);

  // Bills
  const addBill = useCallback((b: Omit<Bill, 'id'>) => rl('addBill', () => {
    const name = sanitizeText(b.name, 60);
    if (!name) return;
    updateData(prev => ({ ...prev, bills: [...prev.bills, { ...b, id: createId('bill'), name, amount: parseCurrencyInput(b.amount, 0, 1e9), dueDate: sanitizeDateInput(b.dueDate), icon: sanitizeIconName(b.icon), status: b.status || 'pending' }] }));
  }), [updateData, rl]);

  const updateBill = useCallback((id: string, u: Partial<Bill>) => rl('updBill', () => {
    updateData(prev => ({
      ...prev,
      bills: prev.bills.map(b => b.id === id ? {
        ...b,
        name: sanitizeText(u.name ?? b.name, 60) || b.name,
        amount: parseCurrencyInput(u.amount ?? b.amount, 0, 1e9),
        dueDate: sanitizeDateInput(u.dueDate ?? b.dueDate),
        icon: sanitizeIconName(u.icon ?? b.icon),
        status: (u.status ?? b.status) as BillStatus,
      } : b),
    }));
  }), [updateData, rl]);

  const deleteBill = useCallback((id: string) => rl('delBill', () => {
    updateData(prev => ({ ...prev, bills: prev.bills.filter(b => b.id !== id) }));
  }), [updateData, rl]);

  const markNotificationRead = useCallback((id: string) => rl('readNotif', () => {
    updateData(prev => ({ ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  }), [updateData, rl]);

  const markAllRead = useCallback(() => rl('readAll', () => {
    updateData(prev => ({ ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })) }));
  }), [updateData, rl]);

  const budgetCategories = useMemo(() => syncBudgetSpending(data.budgetCategories, data.transactions), [data.budgetCategories, data.transactions]);
  const totalIncome = useMemo(() => data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [data.transactions]);
  const totalExpenses = useMemo(() => data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [data.transactions]);
  const totalSavings = useMemo(() => data.savingsGoals.reduce((s, g) => s + g.currentAmount, 0), [data.savingsGoals]);
  const totalSavingsTarget = useMemo(() => data.savingsGoals.reduce((s, g) => s + g.targetAmount, 0), [data.savingsGoals]);
  const unreadCount = useMemo(() => data.notifications.filter(n => !n.read).length, [data.notifications]);

  const lastUpdate = useMemo(() => {
    const allDates: string[] = [];
    for (const t of data.transactions) allDates.push(t.date);
    for (const g of data.savingsGoals) {
      allDates.push(g.deadline);
      allDates.push(g.deadline);
    }
    for (const b of data.bills) allDates.push(b.dueDate);
    if (allDates.length === 0) return new Date().toISOString();

    const createdDates: string[] = [];
    for (const t of data.transactions) createdDates.push(t.date);
    for (const n of data.notifications) createdDates.push(n.createdAt);
    if (createdDates.length > 0) {
      const newestCreated = createdDates.reduce((max, cur) => (cur > max ? cur : max));
      return newestCreated;
    }

    return allDates.reduce((max, cur) => (cur > max ? cur : max));
  }, [data]);

  return {
    ...data, budgetCategories, totalIncome, totalExpenses, totalSavings, totalSavingsTarget, unreadCount, lastUpdate,
    addTransaction, deleteTransaction,
    addSavingsGoal, updateSavingsGoal, editSavingsGoal, deleteSavingsGoal, reorderSavingsGoals,
    addBudgetCategory, updateBudgetCategory, deleteBudgetCategory, reorderBudgetCategories,
    addBill, updateBill, deleteBill,
    markNotificationRead, markAllRead,
  };
}
