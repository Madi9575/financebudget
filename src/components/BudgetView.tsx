import { useMemo, useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Pencil, Trash2, FolderPlus, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BudgetCategory, Transaction } from '../types';
import IconRenderer from './IconRenderer';
import { useLanguage } from '../i18n/LanguageContext';

interface BudgetViewProps {
  budgetCategories: BudgetCategory[];
  totalIncome: number;
  totalExpenses: number;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onAddCategory?: (cat: { name: string; icon: string; color: string; budgeted?: number }) => void;
  onUpdateCategory?: (id: string, updates: Partial<BudgetCategory>) => void;
  onDeleteCategory?: (id: string) => void;
  onReorderCategories?: (from: number, to: number) => void;
}

const CHART_COLORS = ['#18181b', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];
const ICON_OPTIONS = ['shopping-cart', 'file-text', 'utensils', 'car', 'gamepad-2', 'heart', 'wifi', 'zap', 'droplets', 'home', 'gift'];
const COLOR_OPTIONS = ['#18181b', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

type CategoryForm = {
  name: string;
  budgeted: string;
  icon: string;
  color: string;
};

const emptyCategoryForm: CategoryForm = {
  name: '',
  budgeted: '100',
  icon: 'shopping-cart',
  color: '#18181b',
};

export default function BudgetView({
  budgetCategories,
  totalIncome,
  totalExpenses,
  onAddTransaction,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
}: BudgetViewProps) {
  const { t, formatMoney, currencySymbol } = useLanguage();
  const periodTabs = [t('week'), t('month'), t('year')];
  const [activePeriod, setActivePeriod] = useState(periodTabs[1]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [newTx, setNewTx] = useState({
    title: '',
    category: budgetCategories[0]?.name || '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
  });

  const periodMultiplier = activePeriod === t('week') ? 0.25 : activePeriod === t('year') ? 12 : 1;
  const balance = (totalIncome - totalExpenses) * periodMultiplier;
  const displayIncome = totalIncome * periodMultiplier;
  const displayExpenses = totalExpenses * periodMultiplier;
  const totalBudgeted = budgetCategories.reduce((s, c) => s + c.budgeted, 0) * periodMultiplier;
  const totalSpent = budgetCategories.reduce((s, c) => s + c.spent, 0) * periodMultiplier;
  const budgetRemaining = totalBudgeted - totalSpent;

  const chartData = useMemo(() => budgetCategories.map(category => ({
    name: category.name,
    value: category.spent || 0,
  })), [budgetCategories]);
  const totalChart = chartData.reduce((sum, item) => sum + item.value, 0) || 1;

  const radius = 42;
  const innerRadius = 28;
  const cx = 60;
  const cy = 60;
  let cumulativeAngle = -90;
  const segments = chartData.map((item, index) => {
    const angle = (item.value / totalChart) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    if (item.value === 0) return null;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    return { path, color: CHART_COLORS[index % CHART_COLORS.length], key: item.name };
  }).filter(Boolean);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setShowCategoryModal(true);
  };

  const openEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      budgeted: String(category.budgeted),
      icon: category.icon,
      color: category.color,
    });
    setShowCategoryModal(true);
  };

  const handleAddTransaction = () => {
    if (!newTx.title || !newTx.amount) return;
    const iconMap: Record<string, string> = {
      Courses: 'shopping-cart',
      Factures: 'file-text',
      Restauration: 'utensils',
      Transport: 'car',
      Loisirs: 'gamepad-2',
      Santé: 'heart',
    };

    onAddTransaction({
      title: newTx.title,
      category: newTx.type === 'income' ? 'Revenu' : newTx.category,
      amount: Number(newTx.amount),
      type: newTx.type,
      date: new Date().toISOString().split('T')[0],
      icon: newTx.type === 'income' ? 'briefcase' : (iconMap[newTx.category] || 'shopping-cart'),
    });

    setNewTx({ title: '', category: budgetCategories[0]?.name || '', amount: '', type: 'expense' });
    setShowAddModal(false);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) return;

    if (editingCategory && onUpdateCategory) {
      onUpdateCategory(editingCategory.id, {
        name: categoryForm.name,
        budgeted: Number(categoryForm.budgeted),
        icon: categoryForm.icon,
        color: categoryForm.color,
      });
    } else if (onAddCategory) {
      onAddCategory({
        name: categoryForm.name,
        budgeted: Number(categoryForm.budgeted),
        icon: categoryForm.icon,
        color: categoryForm.color,
      });
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
  };

  const handleDeleteCategory = () => {
    if (!editingCategory || !onDeleteCategory) return;
    onDeleteCategory(editingCategory.id);
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
  };

  const moveCategory = (idx: number, direction: -1 | 1) => {
    const next = idx + direction;
    if (next < 0 || next >= budgetCategories.length || !onReorderCategories) return;
    onReorderCategories(idx, next);
  };

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{t('overview')}</p>
            <h1 className="text-zinc-900 font-medium text-lg">{t('budget')}</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center"
          >
            <Plus size={16} className="text-white" />
          </motion.button>
        </div>

        <div className="flex bg-zinc-100 rounded-lg p-1 mb-6">
          {periodTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActivePeriod(tab)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                activePeriod === tab ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-white rounded-xl p-4 border border-zinc-100 text-center shadow-sm">
            <ArrowUpRight size={14} className="text-emerald-500 mx-auto mb-1.5" />
            <p className="text-zinc-400 text-[9px] uppercase tracking-wider">{t('income')}</p>
            <p className="text-zinc-900 font-medium text-sm mt-0.5">{formatMoney(displayIncome)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-zinc-100 text-center shadow-sm">
            <ArrowDownRight size={14} className="text-rose-500 mx-auto mb-1.5" />
            <p className="text-zinc-400 text-[9px] uppercase tracking-wider">{t('expenses')}</p>
            <p className="text-zinc-900 font-medium text-sm mt-0.5">{formatMoney(displayExpenses)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-zinc-100 text-center shadow-sm">
            <TrendingUp size={14} className="text-zinc-500 mx-auto mb-1.5" />
            <p className="text-zinc-400 text-[9px] uppercase tracking-wider">{t('balance')}</p>
            <p className="text-zinc-900 font-medium text-sm mt-0.5">{formatMoney(balance)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-zinc-100 mb-6">
          <h3 className="text-zinc-900 font-medium text-sm mb-4">{t('distribution')}</h3>
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0">
              <svg width="120" height="120" viewBox="0 0 120 120" className="select-none">
                {segments.map((segment, index) => (
                  <path key={index} d={segment!.path} fill={segment!.color} stroke="white" strokeWidth="1.5" />
                ))}
                <text x="60" y="58" textAnchor="middle" className="fill-zinc-400 text-[8px] uppercase tracking-wider">{t('spent')}</text>
                <text x="60" y="72" textAnchor="middle" className="fill-zinc-900 font-medium" style={{ fontSize: '12px' }}>
                  {formatMoney(totalSpent)}
                </text>
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              {chartData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index] }} />
                  <span className="text-zinc-600 text-xs truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-zinc-900 font-medium text-sm">{t('monthlyBudget')}</h3>
            <span className="text-zinc-400 text-xs">{formatMoney(budgetRemaining)} {t('remainingShort')}</span>
          </div>
          <div className="bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${Math.min((totalSpent / Math.max(totalBudgeted, 1)) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-zinc-900 font-medium text-sm">{t('monthlyBudget')}</h3>
          <button
            type="button"
            onClick={openCreateCategory}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700"
          >
            <FolderPlus size={14} />
            Catégorie
          </button>
        </div>

        <div className="space-y-3">
          {budgetCategories.map((category, index) => {
            const progress = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
            const displaySpent = category.spent * periodMultiplier;
            const displayBudgeted = category.budgeted * periodMultiplier;
            const isOver = progress > 90;
            const isFirst = index === 0;
            const isLast = index === budgetCategories.length - 1;

            return (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white rounded-xl p-4 border border-zinc-100"
              >
                <div className="flex items-start gap-3 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center mt-0.5">
                    <IconRenderer name={category.icon} size={14} className="text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-zinc-900 font-medium text-sm truncate">{category.name}</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveCategory(index, -1)}
                          disabled={isFirst}
                          className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 disabled:opacity-30"
                          aria-label="move up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategory(index, 1)}
                          disabled={isLast}
                          className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 disabled:opacity-30"
                          aria-label="move down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditCategory(category)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory?.(category.id)}
                          className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isOver ? 'bg-rose-50 text-rose-600' : 'bg-zinc-100 text-zinc-600'}`}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-xs">{formatMoney(displaySpent)} / {formatMoney(displayBudgeted)}</p>
                  </div>
                </div>
                <div className="bg-zinc-100 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: isOver ? '#e11d48' : '#18181b' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowAddModal(false)}
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
              <h3 className="text-zinc-900 font-medium text-base mb-6">{t('newTransaction')}</h3>

              <div className="flex bg-zinc-100 rounded-lg p-1 mb-5">
                <button onClick={() => setNewTx(p => ({ ...p, type: 'expense' }))} className={`flex-1 py-2.5 rounded-md text-xs font-medium transition-all ${newTx.type === 'expense' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500'}`}>
                  {t('expense')}
                </button>
                <button onClick={() => setNewTx(p => ({ ...p, type: 'income' }))} className={`flex-1 py-2.5 rounded-md text-xs font-medium transition-all ${newTx.type === 'income' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500'}`}>
                  {t('revenue')}
                </button>
              </div>

              <input
                type="text"
                placeholder={t('title')}
                value={newTx.title}
                onChange={e => setNewTx(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-3 border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />

              <input
                type="number"
                placeholder={`${t('amount')} (${currencySymbol})`}
                value={newTx.amount}
                onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-4 border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />

              {newTx.type === 'expense' && (
                <div className="flex gap-2 mb-5">
                  <div className="relative flex-1">
                    <select
                      value={newTx.category}
                      onChange={e => setNewTx(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-zinc-50 rounded-xl pl-4 pr-11 py-3 text-zinc-900 text-sm border border-zinc-200 focus:outline-none focus:border-zinc-400 appearance-none"
                    >
                      {budgetCategories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  <button type="button" onClick={openCreateCategory} className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                    <Plus size={18} className="text-zinc-600" />
                  </button>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddTransaction} className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium text-sm">
                {t('add')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28 max-h-[88vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
              <h3 className="text-zinc-900 font-medium text-base mb-5">{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>

              <input
                type="text"
                placeholder="Nom de catégorie"
                value={categoryForm.name}
                onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-3 border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />

              <input
                type="number"
                placeholder={`Budget mensuel (${currencySymbol})`}
                value={categoryForm.budgeted}
                onChange={e => setCategoryForm(prev => ({ ...prev, budgeted: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-zinc-900 text-sm mb-4 border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />

              <p className="text-zinc-500 text-xs font-medium mb-2">{t('icon')}</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setCategoryForm(prev => ({ ...prev, icon }))}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${categoryForm.icon === icon ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'}`}
                  >
                    <IconRenderer name={icon} size={16} className="text-zinc-700" />
                  </button>
                ))}
              </div>

              <p className="text-zinc-500 text-xs font-medium mb-2">{t('color')}</p>
              <div className="flex gap-2 mb-6">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${categoryForm.color === color ? 'border-zinc-900 scale-105' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleSaveCategory} className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium text-sm">
                  {editingCategory ? t('save') : t('create')}
                </motion.button>
                {editingCategory && (
                  <button onClick={handleDeleteCategory} className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-medium text-sm border border-rose-100">
                    {t('delete')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
