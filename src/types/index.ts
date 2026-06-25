export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  icon: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  icon: string;
  color: string;
}

export interface NotificationItem {
  id: string;
  icon: 'wallet' | 'piggy-bank' | 'file-text' | 'target';
  key: 'notifBudget' | 'notifSaving' | 'notifBill' | 'notifGoal';
  timeKey: 'minutesAgo' | 'hoursAgo' | 'yesterday' | 'daysAgo';
  color: string;
  read: boolean;
}

export interface FinanceData {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgetCategories: BudgetCategory[];
  notifications: NotificationItem[];
}

export type TabType = 'home' | 'budget' | 'savings' | 'transactions' | 'settings';
export type ViewMode = 'budget' | 'savings';
