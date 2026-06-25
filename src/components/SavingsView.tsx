import { useState } from 'react';
import { Plus, Target, TrendingUp, Trash2, PiggyBank, SmilePlus, X, ArrowUp, ArrowDown, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { SavingsGoal } from '../types';
import IconRenderer from './IconRenderer';
import { useLanguage } from '../i18n/LanguageContext';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  totalSavings: number;
  totalSavingsTarget: number;
  onAddGoal: (g: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  onEditGoal: (id: string, u: Partial<SavingsGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onReorderGoals: (from: number, to: number) => void;
}

const availableIcons = [
  { name: 'plane', label: '✈️' },
  { name: 'shield', label: '🛡️' },
  { name: 'car', label: '🚗' },
  { name: 'trending-up', label: '📈' },
  { name: 'home', label: '🏠' },
  { name: 'gift', label: '🎁' },
];

const availableColors = ['#18181b', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

type GoalForm = { title: string; targetAmount: string; icon: string; color: string; deadline: string };
const emptyGoalForm: GoalForm = { title: '', targetAmount: '', icon: 'plane', color: '#18181b', deadline: '' };

export default function SavingsView({
  savingsGoals, totalSavings, totalSavingsTarget,
  onAddGoal, onUpdateGoal, onEditGoal, onDeleteGoal, onReorderGoals,
}: SavingsViewProps) {
  const { t, formatDate, formatMoney, currencySymbol } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [goalForm, setGoalForm] = useState<GoalForm>(emptyGoalForm);

  const overallProgress = totalSavingsTarget > 0 ? (totalSavings / totalSavingsTarget) * 100 : 0;

  const openAdd = () => {
    setEditingGoal(null);
    setGoalForm(emptyGoalForm);
    setShowAddModal(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      targetAmount: String(goal.targetAmount),
      icon: goal.icon,
      color: goal.color,
      deadline: goal.deadline,
    });
    setShowAddModal(true);
  };

  const handleSaveGoal = () => {
    if (!goalForm.title.trim()) return;
    const payload = {
      title: goalForm.title,
      targetAmount: Number(goalForm.targetAmount),
      icon: goalForm.icon,
      color: goalForm.color,
      deadline: goalForm.deadline || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    };
    if (editingGoal) {
      onEditGoal(editingGoal.id, payload);
    } else {
      onAddGoal({ ...payload, currentAmount: 0 });
    }
    setGoalForm(emptyGoalForm);
    setShowAddModal(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = () => {
    if (!editingGoal) return;
    onDeleteGoal(editingGoal.id);
    setShowAddModal(false);
    setEditingGoal(null);
    setGoalForm(emptyGoalForm);
  };

  const handleDeposit = () => {
    if (!showDepositModal || !depositAmount) return;
    onUpdateGoal(showDepositModal, parseFloat(depositAmount));
    setDepositAmount('');
    setShowDepositModal(null);
  };

  const move = (idx: number, direction: -1 | 1) => {
    const next = idx + direction;
    if (next < 0 || next >= savingsGoals.length) return;
    onReorderGoals(idx, next);
  };

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{t('savings')}</p>
            <h1 className="text-zinc-900 font-medium text-lg">{t('objectives')}</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={openAdd}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center"
          >
            <Plus size={16} className="text-white" />
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
              <PiggyBank size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest">{t('totalSaved')}</p>
              <p className="text-white text-2xl font-light">{formatMoney(totalSavings)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider">{t('progress')}</span>
            <span className="text-white text-xs font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <div className="bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-white"
            />
          </div>
          <p className="text-zinc-500 text-[10px] mt-2">{t('target')}: {formatMoney(totalSavingsTarget)}</p>
        </motion.div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white rounded-xl p-4 border border-zinc-100 text-center">
            <Target size={14} className="text-zinc-400 mx-auto mb-1.5" />
            <p className="text-zinc-400 text-[9px] uppercase tracking-wider">{t('objectivesCount')}</p>
            <p className="text-zinc-900 font-medium text-lg mt-0.5">{savingsGoals.length}</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-4 border border-zinc-100 text-center">
            <TrendingUp size={14} className="text-zinc-400 mx-auto mb-1.5" />
            <p className="text-zinc-400 text-[9px] uppercase tracking-wider">{t('remainingAmount')}</p>
            <p className="text-zinc-900 font-medium text-lg mt-0.5">{formatMoney(totalSavingsTarget - totalSavings)}</p>
          </div>
        </div>

        <h3 className="text-zinc-900 font-medium text-sm mb-4">{t('myObjectives')}</h3>
        <div className="space-y-3">
          {savingsGoals.map((goal, i) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            const isComplete = progress >= 100;
            const isFirst = i === 0;
            const isLast = i === savingsGoals.length - 1;
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-xl p-5 border ${isComplete ? 'border-emerald-200' : 'border-zinc-100'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <IconRenderer name={goal.icon} size={18} className="text-zinc-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-zinc-900 font-medium text-sm truncate">{goal.title}</p>
                      <p className="text-zinc-400 text-xs">{formatDate(goal.deadline, { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={isFirst}
                      className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 disabled:opacity-30"
                      aria-label="move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={isLast}
                      className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 disabled:opacity-30"
                      aria-label="move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      onClick={() => openEdit(goal)}
                      className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{t('saved')}</p>
                    <p className="text-zinc-900 font-medium text-lg">{formatMoney(goal.currentAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{t('target')}</p>
                    <p className="text-zinc-600 font-medium text-sm">{formatMoney(goal.targetAmount)}</p>
                  </div>
                </div>

                <div className="bg-zinc-100 rounded-full h-1.5 overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-zinc-900"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
                    isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {isComplete ? t('achieved') : `${formatMoney(remaining)} ${t('remaining')}`}
                  </span>
                  {!isComplete && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowDepositModal(goal.id)}
                      className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium"
                    >
                      + {t('add')}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {savingsGoals.length === 0 && (
          <div className="text-center py-12">
            <PiggyBank size={40} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">{t('noGoals')}</p>
            <p className="text-zinc-400 text-xs mt-1">{t('pressPlusToCreate')}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => { setShowAddModal(false); setEditingGoal(null); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
              <h3 className="text-zinc-900 font-medium text-base mb-6">
                {editingGoal ? 'Modifier l\'objectif' : t('newGoal')}
              </h3>

              <input
                type="text"
                placeholder={t('goalName')}
                value={goalForm.title}
                onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-3 border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />

              <input
                type="number"
                placeholder={`${t('targetAmount')} (${currencySymbol})`}
                value={goalForm.targetAmount}
                onChange={e => setGoalForm(p => ({ ...p, targetAmount: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-3 border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />

              <input
                type="date"
                placeholder={t('deadline')}
                value={goalForm.deadline}
                onChange={e => setGoalForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-5 border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />

              <div className="flex items-center justify-between mb-2">
                <p className="text-zinc-500 text-xs font-medium">{t('icon')}</p>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600"
                >
                  <SmilePlus size={13} />
                  {t('allIcons')}
                </button>
              </div>
              <div className="flex gap-2 mb-5 flex-wrap">
                {availableIcons.map(icon => (
                  <button
                    key={icon.name}
                    onClick={() => setGoalForm(p => ({ ...p, icon: icon.name }))}
                    className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border transition-all ${
                      goalForm.icon === icon.name ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    {icon.label}
                  </button>
                ))}
              </div>

              <p className="text-zinc-500 text-xs font-medium mb-2">{t('color')}</p>
              <div className="flex gap-2 mb-6">
                {availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setGoalForm(p => ({ ...p, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${goalForm.color === color ? 'border-zinc-900 scale-105' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveGoal}
                  className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium text-sm"
                >
                  {editingGoal ? t('save') : t('create')}
                </motion.button>
                {editingGoal && (
                  <button
                    onClick={handleDeleteGoal}
                    className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-medium text-sm border border-rose-100 inline-flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    {t('delete')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowDepositModal(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
              <h3 className="text-zinc-900 font-medium text-base mb-6">{t('addToSavings')}</h3>

              <input
                type="number"
                placeholder={`${t('amountToAdd')} (${currencySymbol})`}
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-3 border border-zinc-200 focus:outline-none focus:border-zinc-400"
                autoFocus
              />

              <div className="flex gap-2 mb-5">
                {[50, 100, 200, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount.toString())}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-50 text-zinc-700 text-xs font-medium border border-zinc-200 hover:border-zinc-300"
                  >
                    {formatMoney(amount)}
                  </button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleDeposit}
                className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium text-sm"
              >
                {t('confirm')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
            onClick={() => setShowEmojiPicker(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-t-2xl bg-white p-4 pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-medium text-zinc-900">{t('icon')}</h3>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100"
                >
                  <X size={14} className="text-zinc-600" />
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-zinc-100">
                <EmojiPicker
                  width="100%"
                  height={420}
                  lazyLoadEmojis
                  searchPlaceholder={t('searchIcon')}
                  onEmojiClick={(emojiData) => {
                    setGoalForm(prev => ({ ...prev, icon: emojiData.emoji }));
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
