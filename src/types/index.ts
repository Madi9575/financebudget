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

export type BillStatus = 'pending' | 'paid' | 'overdue';

export interface Bill {
  id: string;
  name: string;
  icon: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
}

export interface NotificationItem {
  id: string;
  message: string;
  icon: 'wallet' | 'piggy-bank' | 'file-text' | 'target' | 'alert-triangle';
  color: string;
  createdAt: string;
  read: boolean;
}

export interface FinanceData {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgetCategories: BudgetCategory[];
  bills: Bill[];
  notifications: NotificationItem[];
}

export type TabType = 'home' | 'budget' | 'savings' | 'transactions' | 'settings';
