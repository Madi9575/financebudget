import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from './types';
import { useFinanceStore } from './store/useFinanceStore';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import BudgetView from './components/BudgetView';
import SavingsView from './components/SavingsView';
import TransactionsView from './components/TransactionsView';
import SettingsView from './components/SettingsView';
import LockScreen from './components/LockScreen';
import { LanguageProvider } from './i18n/LanguageContext';

const STORAGE_KEY = 'infinance_data';
const PIN_KEY = 'infinance_pin';
const SESSION_KEY = 'infinance_session';

function AppInner() {
  const hasPin = !!localStorage.getItem(PIN_KEY);
  const hasSession = sessionStorage.getItem(SESSION_KEY) === '1';
  const [unlocked, setUnlocked] = useState(!hasPin || hasSession);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const store = useFinanceStore();

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setUnlocked(true);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('infinance_profile');
    localStorage.removeItem(PIN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }, []);

  if (!unlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            transactions={store.transactions}
            savingsGoals={store.savingsGoals}
            budgetCategories={store.budgetCategories}
            bills={store.bills}
            notifications={store.notifications}
            totalIncome={store.totalIncome}
            totalExpenses={store.totalExpenses}
            totalSavings={store.totalSavings}
            onTabChange={setActiveTab}
            unreadCount={store.unreadCount}
            onMarkAllRead={store.markAllRead}
            onMarkNotificationRead={store.markNotificationRead}
            onAddBill={store.addBill}
            onUpdateBill={store.updateBill}
            onDeleteBill={store.deleteBill}
          />
        );
      case 'budget':
        return (
          <BudgetView
            budgetCategories={store.budgetCategories}
            totalIncome={store.totalIncome}
            totalExpenses={store.totalExpenses}
            onAddTransaction={store.addTransaction}
            onAddCategory={store.addBudgetCategory}
            onUpdateCategory={store.updateBudgetCategory}
            onDeleteCategory={store.deleteBudgetCategory}
          />
        );
      case 'savings':
        return (
          <SavingsView
            savingsGoals={store.savingsGoals}
            totalSavings={store.totalSavings}
            totalSavingsTarget={store.totalSavingsTarget}
            onAddGoal={store.addSavingsGoal}
            onUpdateGoal={store.updateSavingsGoal}
            onDeleteGoal={store.deleteSavingsGoal}
          />
        );
      case 'transactions':
        return (
          <TransactionsView
            transactions={store.transactions}
            onDeleteTransaction={store.deleteTransaction}
          />
        );
      case 'settings':
        return <SettingsView onReset={handleReset} onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex justify-center">
      <div className="w-full max-w-md bg-zinc-50 relative overflow-hidden min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
