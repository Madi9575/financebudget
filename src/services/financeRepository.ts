import { FinanceData } from '../types';
import { safeJsonParse } from '../utils/security';

const STORAGE_KEY = 'infinance_data';

export function getDefaultFinanceData(): FinanceData {
  return {
    transactions: [],
    savingsGoals: [],
    budgetCategories: [],
    bills: [],
    notifications: [],
  };
}

export interface FinanceRepository {
  load(): FinanceData;
  save(data: FinanceData): void;
  reset(): void;
}

export class LocalFinanceRepository implements FinanceRepository {
  load(): FinanceData {
    return safeJsonParse(localStorage.getItem(STORAGE_KEY), getDefaultFinanceData());
  }

  save(data: FinanceData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const financeRepository = new LocalFinanceRepository();
