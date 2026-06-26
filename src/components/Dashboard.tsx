import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Bell, Wallet, PiggyBank, CreditCard, Plus, Check, Clock, AlertTriangle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bill, BillStatus, BudgetCategory, NotificationItem, SavingsGoal, TabType, Transaction } from '../types';
import IconRenderer from './IconRenderer';
import NotificationsPanel from './NotificationsPanel';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgetCategories: BudgetCategory[];
  bills: Bill[];
  notifications: NotificationItem[];
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  lastUpdate: string;
  onTabChange: (tab: TabType) => void;
  unreadCount?: number;
  onMarkAllRead?: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onAddBill?: (b: Omit<Bill, 'id'>) => void;
  onUpdateBill?: (id: string, u: Partial<Bill>) => void;
  onDeleteBill?: (id: string) => void;
}

const statusConfig: Record<BillStatus, { icon: typeof Check; label: string; bg: string; text: string }> = {
  paid: { icon: Check, label: 'paid', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  pending: { icon: Clock, label: 'pending', bg: 'bg-amber-50', text: 'text-amber-600' },
  overdue: { icon: AlertTriangle, label: 'overdue', bg: 'bg-rose-50', text: 'text-rose-600' },
};

const BALANCE_HIDDEN_KEY = 'ego_balance_hidden';
const PROFILE_KEY = 'ego_profile';

function formatLastUpdate(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  const calendarDate = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(d);

  const clockTime = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(d);

  if (diffMin < 1) return `${calendarDate} · ${clockTime}`;
  if (diffMin < 60) return `${calendarDate} · ${diffMin}min · ${clockTime}`;
  if (diffMin < 1440) return `${calendarDate} · ${Math.floor(diffMin / 60)}h · ${clockTime}`;
  return `${calendarDate} · ${clockTime}`;
}

function getProfilePhoto(): string | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.photo || null;
  } catch {
    return null;
  }
}

function getProfileName(): string {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return '';
    const p = JSON.parse(raw);
    return p?.name || '';
  } catch {
    return '';
  }
}

export default function Dashboard({
  transactions, savingsGoals, bills, notifications, totalIncome, totalExpenses, totalSavings, lastUpdate,
  onTabChange, unreadCount = 0, onMarkAllRead, onMarkNotificationRead, onAddBill, onUpdateBill, onDeleteBill,
}: DashboardProps) {
  const { t, formatDate, formatMoney, currencySymbol, locale } = useLanguage();
  const [notifOpen, setNotifOpen] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billForm, setBillForm] = useState({ name: '', amount: '', icon: 'file-text', dueDate: '', status: 'pending' as BillStatus });
  const [balanceHidden, setBalanceHidden] = useState(() => localStorage.getItem(BALANCE_HIDDEN_KEY) === '1');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => forceTick(t => (t + 1) % 1_000_000), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const photo = useState<string | null>(() => getProfilePhoto())[0];
  const name = useState<string>(() => getProfileName())[0];

  const toggleBalance = () => {
    const next = !balanceHidden;
    setBalanceHidden(next);
    localStorage.setItem(BALANCE_HIDDEN_KEY, next ? '1' : '0');
  };

  const Hidden = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1 tracking-widest">
      {balanceHidden ? <><span>••••</span> <span className="text-zinc-400 text-xs">{currencySymbol}</span></> : children}
    </span>
  );

  const balance = totalIncome - totalExpenses;
  const recentTransactions = transactions.slice(0, 4);
  const topSavings = savingsGoals.slice(0, 2);

  const openAddBill = () => { setEditingBill(null); setBillForm({ name: '', amount: '', icon: 'file-text', dueDate: '', status: 'pending' }); setShowBillModal(true); };
  const openEditBill = (b: Bill) => { setEditingBill(b); setBillForm({ name: b.name, amount: String(b.amount), icon: b.icon, dueDate: b.dueDate, status: b.status }); setShowBillModal(true); };
  const handleSaveBill = () => {
    if (!billForm.name || !billForm.amount) return;
    if (editingBill) { onUpdateBill?.(editingBill.id, { ...billForm, amount: Number(billForm.amount) }); }
    else { onAddBill?.({ name: billForm.name, amount: Number(billForm.amount), icon: billForm.icon, dueDate: billForm.dueDate || new Date().toISOString().split('T')[0], status: billForm.status }); }
    setShowBillModal(false);
  };

  const cycleStatus = (b: Bill) => {
    const order: BillStatus[] = ['pending', 'paid', 'overdue'];
    const next = order[(order.indexOf(b.status) + 1) % order.length];
    onUpdateBill?.(b.id, { status: next });
  };

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center border border-zinc-200">
              {photo ? (
                <img src={photo} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-400 text-sm font-medium">{(name || 'M').slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{t('hello')}</p>
              <p className="text-zinc-900 font-medium text-base">{name || t('mySpace')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleBalance} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center" aria-label="toggle balance">
              {balanceHidden ? <EyeOff size={16} className="text-zinc-600" /> : <Eye size={16} className="text-zinc-600" />}
            </button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setNotifOpen(true)} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center relative">
              <Bell size={16} className="text-zinc-600" />
              {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-50" />}
            </motion.button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-zinc-400 text-xs uppercase tracking-widest">{t('totalBalance')}</p>
            {lastUpdate && (
              <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                <RefreshCw size={10} />
                {formatLastUpdate(lastUpdate, locale)}
              </div>
            )}
          </div>
          <p className="text-white text-3xl font-light tracking-tight mb-5">
            <Hidden>{formatMoney(balance)}</Hidden>
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5"><ArrowUpRight size={12} className="text-emerald-500" /><span className="text-zinc-400 text-[10px] uppercase tracking-wider">{t('income')}</span></div>
              <p className="text-white font-medium text-sm"><Hidden>+{formatMoney(totalIncome)}</Hidden></p>
            </div>
            <div className="w-px bg-zinc-700" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5"><ArrowDownRight size={12} className="text-rose-500" /><span className="text-zinc-400 text-[10px] uppercase tracking-wider">{t('expenses')}</span></div>
              <p className="text-white font-medium text-sm"><Hidden>-{formatMoney(totalExpenses)}</Hidden></p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-3 mb-8">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => onTabChange('budget')} className="flex-1 bg-white rounded-xl p-4 border border-zinc-100 shadow-sm text-left">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center mb-3"><Wallet size={16} className="text-white" /></div>
            <p className="text-zinc-900 font-medium text-sm">{t('budget')}</p>
            <p className="text-zinc-400 text-xs mt-0.5">{t('expensesShort')}</p>
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => onTabChange('savings')} className="flex-1 bg-white rounded-xl p-4 border border-zinc-100 shadow-sm text-left">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-3"><PiggyBank size={16} className="text-zinc-700" /></div>
            <p className="text-zinc-900 font-medium text-sm">{t('savings')}</p>
            <p className="text-zinc-400 text-xs mt-0.5"><Hidden>{formatMoney(totalSavings)}</Hidden></p>
          </motion.button>
        </div>

        {topSavings.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-zinc-900 font-medium text-sm">{t('objectives')}</h3>
              <button onClick={() => onTabChange('savings')} className="text-zinc-400 text-xs">{t('seeAll')}</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {topSavings.map((g, i) => {
                const p = (g.currentAmount / g.targetAmount) * 100;
                const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="min-w-[180px] bg-white rounded-xl p-4 border border-zinc-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center"><IconRenderer name={g.icon} size={14} className="text-zinc-600" /></div>
                      <p className="text-zinc-900 font-medium text-xs">{g.title}</p>
                    </div>
                    <div className="bg-zinc-100 rounded-full h-1 overflow-hidden mb-2"><div className="h-full rounded-full bg-zinc-900" style={{ width: `${Math.min(p, 100)}%` }} /></div>
                    <div className="flex justify-between items-center">
                      <p className="text-zinc-400 text-[10px]"><Hidden>{formatMoney(g.currentAmount)}</Hidden> / <Hidden>{formatMoney(g.targetAmount)}</Hidden></p>
                      <p className="text-zinc-400 text-[10px]">{daysLeft}j</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-zinc-900 font-medium text-sm">{t('bills')}</h3>
            <button onClick={openAddBill} className="inline-flex items-center gap-1 text-zinc-400 text-xs"><Plus size={12} />{t('add')}</button>
          </div>
          {bills.length === 0 && <p className="text-zinc-400 text-xs text-center py-4">{t('noBills')}</p>}
          <div className="space-y-2">
            {bills.map((b, i) => {
              const cfg = statusConfig[b.status];
              const StatusIcon = cfg.icon;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-zinc-100">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center"><IconRenderer name={b.icon} size={16} className="text-zinc-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-900 font-medium text-sm truncate cursor-pointer" onClick={() => openEditBill(b)}>{b.name}</p>
                    <p className="text-zinc-400 text-[10px]">{formatDate(b.dueDate, { day: 'numeric', month: 'short' })} · <Hidden>{formatMoney(b.amount)}</Hidden></p>
                  </div>
                  <button onClick={() => cycleStatus(b)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                    <StatusIcon size={10} /> {t(cfg.label as 'paid' | 'pending' | 'overdue')}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => onTabChange('budget')} className="min-w-[200px] bg-zinc-900 rounded-xl p-4 text-white text-left shadow-lg">
              <div className="flex items-center gap-2 mb-3"><CreditCard size={14} className="text-zinc-400" /><span className="text-xs font-medium text-zinc-300">{t('mainCard')}</span></div>
              <p className="text-[10px] text-zinc-500 mb-1">{t('cardBalance')}</p>
              <p className="text-base font-light"><Hidden>{formatMoney(balance)}</Hidden></p>
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => onTabChange('savings')} className="min-w-[160px] bg-white rounded-xl p-4 text-zinc-900 text-left border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><CreditCard size={14} className="text-zinc-400" /><span className="text-xs font-medium">{t('savingsCard')}</span></div>
              <p className="text-[10px] text-zinc-400 mb-1">{t('cardBalance')}</p>
              <p className="text-base font-light"><Hidden>{formatMoney(totalSavings)}</Hidden></p>
            </motion.button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-zinc-900 font-medium text-sm">{t('transactions')}</h3>
            <button onClick={() => onTabChange('transactions')} className="text-zinc-400 text-xs">{t('seeAll')}</button>
          </div>
          {recentTransactions.length === 0 && <p className="text-zinc-400 text-xs text-center py-4">{t('noTransactions')}</p>}
          <div className="space-y-2">
            {recentTransactions.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-zinc-100">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <IconRenderer name={tx.icon} size={16} className={tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 font-medium text-sm truncate">{tx.title}</p>
                  <p className="text-zinc-400 text-[10px]">{formatDate(tx.date, { day: 'numeric', month: 'long' })}</p>
                </div>
                <p className={`font-medium text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}<Hidden>{formatMoney(tx.amount)}</Hidden>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <NotificationsPanel open={notifOpen} notifications={notifications} onClose={() => setNotifOpen(false)} onMarkAllRead={onMarkAllRead} onMarkNotificationRead={onMarkNotificationRead} />

      <AnimatePresence>
        {showBillModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowBillModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
              <h3 className="text-zinc-900 font-medium text-base mb-5">{editingBill ? t('editBill') : t('addBill')}</h3>
              <input type="text" placeholder={t('billName')} value={billForm.name} onChange={e => setBillForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-3 border border-zinc-200 focus:outline-none focus:border-zinc-400" />
              <input type="number" placeholder={`${t('amount')} (${currencySymbol})`} value={billForm.amount} onChange={e => setBillForm(p => ({ ...p, amount: e.target.value }))} className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-3 border border-zinc-200 focus:outline-none focus:border-zinc-400" />
              <input type="date" value={billForm.dueDate} onChange={e => setBillForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-4 border border-zinc-200 focus:outline-none focus:border-zinc-400" />
              <div className="flex gap-2 mb-5">
                {(['pending', 'paid', 'overdue'] as BillStatus[]).map(s => {
                  const c = statusConfig[s];
                  return (
                    <button key={s} onClick={() => setBillForm(p => ({ ...p, status: s }))} className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${billForm.status === s ? `${c.bg} ${c.text} border-current` : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                      {t(c.label as 'paid' | 'pending' | 'overdue')}
                    </button>
                  );
                })}
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveBill} className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium text-sm mb-3">{editingBill ? t('save') : t('create')}</motion.button>
              {editingBill && <button onClick={() => { onDeleteBill?.(editingBill.id); setShowBillModal(false); }} className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-medium text-sm border border-rose-100">{t('delete')}</button>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
