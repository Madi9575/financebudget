import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Bell, Wallet, PiggyBank, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { BudgetCategory, NotificationItem, SavingsGoal, TabType, Transaction } from '../types';
import IconRenderer from './IconRenderer';
import NotificationsPanel from './NotificationsPanel';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgetCategories: BudgetCategory[];
  notifications: NotificationItem[];
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  onTabChange: (tab: TabType) => void;
  unreadCount?: number;
  onMarkAllRead?: () => void;
  onMarkNotificationRead?: (id: string) => void;
}

export default function Dashboard({
  transactions,
  savingsGoals,
  totalIncome,
  totalExpenses,
  totalSavings,
  notifications,
  onTabChange,
  unreadCount = 0,
  onMarkAllRead,
  onMarkNotificationRead,
}: DashboardProps) {
  const { t, formatDate, formatMoney } = useLanguage();
  const [notifOpen, setNotifOpen] = useState(false);

  const balance = totalIncome - totalExpenses;
  const recentTransactions = transactions.slice(0, 4);
  const topSavings = savingsGoals.slice(0, 2);

  const billCategories = [
    { name: t('water'), icon: 'droplets' },
    { name: t('electricity'), icon: 'zap' },
    { name: t('wifi'), icon: 'wifi' },
    { name: t('groceries'), icon: 'shopping-cart' },
  ];

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{t('hello')}</p>
            <p className="text-zinc-900 font-medium text-lg">{t('mySpace')}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen(true)}
            className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center relative"
          >
            <Bell size={16} className="text-zinc-600" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-100" />
            )}
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-2xl p-6 mb-6"
        >
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">{t('totalBalance')}</p>
          <p className="text-white text-3xl font-light tracking-tight">{formatMoney(balance)}</p>

          <div className="flex gap-3 mt-6">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowUpRight size={12} className="text-emerald-500" />
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider">{t('income')}</span>
              </div>
              <p className="text-white font-medium text-sm">+{formatMoney(totalIncome)}</p>
            </div>
            <div className="w-px bg-zinc-700" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowDownRight size={12} className="text-rose-500" />
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider">{t('expenses')}</span>
              </div>
              <p className="text-white font-medium text-sm">-{formatMoney(totalExpenses)}</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-3 mb-8">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('budget')}
            className="flex-1 bg-white rounded-xl p-4 border border-zinc-100 shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center mb-3">
              <Wallet size={16} className="text-white" />
            </div>
            <p className="text-zinc-900 font-medium text-sm text-left">{t('budget')}</p>
            <p className="text-zinc-400 text-xs mt-0.5 text-left">{t('expensesShort')}</p>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange('savings')}
            className="flex-1 bg-white rounded-xl p-4 border border-zinc-100 shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-3">
              <PiggyBank size={16} className="text-zinc-700" />
            </div>
            <p className="text-zinc-900 font-medium text-sm text-left">{t('savings')}</p>
            <p className="text-zinc-400 text-xs mt-0.5 text-left">{formatMoney(totalSavings)}</p>
          </motion.button>
        </div>

        {topSavings.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-zinc-900 font-medium text-sm">{t('objectives')}</h3>
              <button onClick={() => onTabChange('savings')} className="text-zinc-400 text-xs hover:text-zinc-600 transition-colors">{t('seeAll')}</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {topSavings.map((goal, i) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="min-w-[170px] bg-white rounded-xl p-4 border border-zinc-100"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center">
                        <IconRenderer name={goal.icon} size={14} className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-900 font-medium text-xs">{goal.title}</p>
                    </div>
                    <div className="bg-zinc-100 rounded-full h-1 overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-zinc-400 text-[10px]">{formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-zinc-900 font-medium text-sm">{t('bills')}</h3>
          </div>
          <div className="flex gap-3">
            {billCategories.map((bill, i) => (
              <motion.button
                key={bill.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex flex-col items-center gap-2 group"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-100 shadow-sm flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
                  <IconRenderer name={bill.icon} size={16} className="text-zinc-900 group-hover:text-white" />
                </div>
                <span className="text-zinc-500 text-[10px] font-medium">{bill.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange('budget')}
              className="min-w-[200px] bg-zinc-900 rounded-xl p-4 text-white text-left shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-zinc-400" />
                <span className="text-xs font-medium text-zinc-300">{t('mainCard')}</span>
              </div>
              <p className="text-[10px] tracking-[0.15em] text-zinc-500 mb-1">•••• 7775</p>
              <p className="text-[10px] text-zinc-500">{t('cardBalance')}</p>
              <p className="text-base font-light">{formatMoney(balance)}</p>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange('savings')}
              className="min-w-[160px] bg-white rounded-xl p-4 text-zinc-900 text-left border border-zinc-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-zinc-400" />
                <span className="text-xs font-medium">{t('savingsCard')}</span>
              </div>
              <p className="text-[10px] tracking-[0.15em] text-zinc-400 mb-1">•••• 4221</p>
              <p className="text-[10px] text-zinc-400">{t('cardBalance')}</p>
              <p className="text-base font-light">{formatMoney(totalSavings)}</p>
            </motion.button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-zinc-900 font-medium text-sm">{t('transactions')}</h3>
            <button onClick={() => onTabChange('transactions')} className="text-zinc-400 text-xs hover:text-zinc-600 transition-colors">{t('seeAll')}</button>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-zinc-100"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  tx.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'
                }`}>
                  <IconRenderer
                    name={tx.icon}
                    size={16}
                    className={tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 font-medium text-sm truncate">{tx.title}</p>
                  <p className="text-zinc-400 text-[10px]">{formatDate(tx.date, { day: 'numeric', month: 'long' })}</p>
                </div>
                <p className={`font-medium text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <NotificationsPanel
        open={notifOpen}
        notifications={notifications}
        onClose={() => setNotifOpen(false)}
        onMarkAllRead={onMarkAllRead}
        onMarkNotificationRead={onMarkNotificationRead}
      />
    </div>
  );
}
