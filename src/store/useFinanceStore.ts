import { useCallback, useMemo, useRef, useState } from 'react';
import { BudgetCategory, FinanceData, SavingsGoal, Transaction } from '../types';
import { financeRepository } from '../services/financeRepository';
import {
  clampNumber,
  createId,
  createRateLimiter,
  normalizeColor,
  parseCurrencyInput,
  sanitizeDateInput,
  sanitizeEmail,
  sanitizeIconName,
  sanitizeText,
} from '../utils/security';

function syncBudgetSpending(categories: BudgetCategory[], transactions: Transaction[]) {
  return categories.map(category => ({
    ...category,
    spent: Number(
      transactions
        .filter(tx => tx.type === 'expense' && tx.category === category.name)
        .reduce((sum, tx) => sum + tx.amount, 0)
        .toFixed(2)
    ),
  }));
}

function ensureOtherCategory(categories: BudgetCategory[]) {
  if (categories.some(category => category.name === 'Autre')) return categories;
  return [
    ...categories,
    {
      id: createId('budget'),
      name: 'Autre',
      budgeted: 100,
      spent: 0,
      icon: 'file-text',
      color: '#71717a',
    },
  ];
}

export function useFinanceStore() {
  const [data, setData] = useState<FinanceData>(() => financeRepository.load());
  const limiter = useRef(createRateLimiter(10, 10000));

  const updateData = useCallback((updater: (prev: FinanceData) => FinanceData) => {
    setData(prev => {
      const next = updater(prev);
      financeRepository.save(next);
      return next;
    });
  }, []);

  const withRateLimit = useCallback((action: string, callback: () => void) => {
    if (!limiter.current.allow(action)) {
      return false;
    }
    callback();
    return true;
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    return withRateLimit('addTransaction', () => {
      const title = sanitizeText(transaction.title, 72);
      const category = sanitizeText(transaction.category, 40) || 'Autre';
      const amount = parseCurrencyInput(transaction.amount, 0, 1_000_000_000);
      const icon = sanitizeIconName(transaction.icon);
      if (!title || amount <= 0) return;

      updateData(prev => {
        const nextTransactions = [{
          ...transaction,
          id: createId('tx'),
          title,
          category,
          amount,
          icon,
          date: sanitizeDateInput(transaction.date),
        }, ...prev.transactions];

        return {
          ...prev,
          transactions: nextTransactions,
          budgetCategories: syncBudgetSpending(prev.budgetCategories, nextTransactions),
        };
      });
    });
  }, [updateData, withRateLimit]);

  const deleteTransaction = useCallback((id: string) => {
    return withRateLimit('deleteTransaction', () => {
      updateData(prev => {
        const nextTransactions = prev.transactions.filter(transaction => transaction.id !== id);
        return {
          ...prev,
          transactions: nextTransactions,
          budgetCategories: syncBudgetSpending(prev.budgetCategories, nextTransactions),
        };
      });
    });
  }, [updateData, withRateLimit]);

  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id'>) => {
    return withRateLimit('addSavingsGoal', () => {
      const title = sanitizeText(goal.title, 72);
      const targetAmount = parseCurrencyInput(goal.targetAmount, 1, 1_000_000_000);
      const currentAmount = parseCurrencyInput(goal.currentAmount, 0, targetAmount);
      if (!title || targetAmount <= 0) return;

      updateData(prev => ({
        ...prev,
        savingsGoals: [
          ...prev.savingsGoals,
          {
            ...goal,
            id: createId('goal'),
            title,
            targetAmount,
            currentAmount,
            icon: sanitizeIconName(goal.icon),
            color: normalizeColor(goal.color),
            deadline: sanitizeDateInput(goal.deadline),
          },
        ],
      }));
    });
  }, [updateData, withRateLimit]);

  const updateSavingsGoal = useCallback((id: string, amount: number) => {
    return withRateLimit('updateSavingsGoal', () => {
      const deposit = parseCurrencyInput(amount, 0, 1_000_000_000);
      if (deposit <= 0) return;

      updateData(prev => ({
        ...prev,
        savingsGoals: prev.savingsGoals.map(goal =>
          goal.id === id
            ? { ...goal, currentAmount: clampNumber(goal.currentAmount + deposit, 0, goal.targetAmount) }
            : goal
        ),
      }));
    });
  }, [updateData, withRateLimit]);

  const deleteSavingsGoal = useCallback((id: string) => {
    return withRateLimit('deleteSavingsGoal', () => {
      updateData(prev => ({
        ...prev,
        savingsGoals: prev.savingsGoals.filter(goal => goal.id !== id),
      }));
    });
  }, [updateData, withRateLimit]);

  const addBudgetCategory = useCallback((category: { name: string; icon: string; color: string; budgeted?: number }) => {
    return withRateLimit('addBudgetCategory', () => {
      const name = sanitizeText(category.name, 40);
      if (!name) return;

      updateData(prev => {
        if (prev.budgetCategories.some(item => item.name.toLowerCase() === name.toLowerCase())) {
          return prev;
        }

        const nextCategories = [
          ...prev.budgetCategories,
          {
            id: createId('budget'),
            name,
            budgeted: clampNumber(category.budgeted ?? 100, 0, 1_000_000_000),
            spent: 0,
            icon: sanitizeIconName(category.icon || 'file-text'),
            color: normalizeColor(category.color),
          },
        ];

        return {
          ...prev,
          budgetCategories: syncBudgetSpending(nextCategories, prev.transactions),
        };
      });
    });
  }, [updateData, withRateLimit]);

  const updateBudgetCategory = useCallback((id: string, updates: Partial<BudgetCategory>) => {
    return withRateLimit('updateBudgetCategory', () => {
      updateData(prev => {
        const current = prev.budgetCategories.find(category => category.id === id);
        if (!current) return prev;

        const nextName = sanitizeText(updates.name ?? current.name, 40) || current.name;
        const renamedTransactions = prev.transactions.map(transaction =>
          transaction.category === current.name
            ? { ...transaction, category: nextName }
            : transaction
        );

        const nextCategories = prev.budgetCategories.map(category =>
          category.id === id
            ? {
                ...category,
                name: nextName,
                budgeted: clampNumber(updates.budgeted ?? category.budgeted, 0, 1_000_000_000),
                icon: sanitizeIconName(updates.icon ?? category.icon),
                color: normalizeColor(updates.color ?? category.color),
              }
            : category
        );

        return {
          ...prev,
          transactions: renamedTransactions,
          budgetCategories: syncBudgetSpending(nextCategories, renamedTransactions),
        };
      });
    });
  }, [updateData, withRateLimit]);

  const deleteBudgetCategory = useCallback((id: string) => {
    return withRateLimit('deleteBudgetCategory', () => {
      updateData(prev => {
        const current = prev.budgetCategories.find(category => category.id === id);
        if (!current) return prev;

        const baseCategories = ensureOtherCategory(prev.budgetCategories.filter(category => category.id !== id));
        const nextTransactions = prev.transactions.map(transaction =>
          transaction.category === current.name
            ? { ...transaction, category: 'Autre', icon: 'file-text' }
            : transaction
        );

        return {
          ...prev,
          transactions: nextTransactions,
          budgetCategories: syncBudgetSpending(baseCategories, nextTransactions),
        };
      });
    });
  }, [updateData, withRateLimit]);

  const markNotificationRead = useCallback((id: string) => {
    return withRateLimit('markNotificationRead', () => {
      updateData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        ),
      }));
    });
  }, [updateData, withRateLimit]);

  const markAllRead = useCallback(() => {
    return withRateLimit('markAllRead', () => {
      updateData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({ ...notification, read: true })),
      }));
    });
  }, [updateData, withRateLimit]);

  const budgetCategories = useMemo(
    () => syncBudgetSpending(data.budgetCategories, data.transactions),
    [data.budgetCategories, data.transactions]
  );

  const totalIncome = useMemo(
    () => data.transactions.filter(transaction => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0),
    [data.transactions]
  );
  const totalExpenses = useMemo(
    () => data.transactions.filter(transaction => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0),
    [data.transactions]
  );
  const totalSavings = useMemo(
    () => data.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    [data.savingsGoals]
  );
  const totalSavingsTarget = useMemo(
    () => data.savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0),
    [data.savingsGoals]
  );
  const unreadCount = useMemo(
    () => data.notifications.filter(notification => !notification.read).length,
    [data.notifications]
  );

  return {
    ...data,
    budgetCategories,
    totalIncome,
    totalExpenses,
    totalSavings,
    totalSavingsTarget,
    unreadCount,
    addTransaction,
    deleteTransaction,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    markNotificationRead,
    markAllRead,
    sanitizeEmail,
  };
}
