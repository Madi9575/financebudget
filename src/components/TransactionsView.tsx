import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../types';
import IconRenderer from './IconRenderer';
import { useLanguage } from '../i18n/LanguageContext';

interface TransactionsViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export default function TransactionsView({ transactions, onDeleteTransaction }: TransactionsViewProps) {
  const { t, formatDate, formatMoney } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const month = formatDate(tx.date, { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(tx);
    return acc;
  }, {});

  const totalFiltered = filtered.reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-6">
        <div className="mb-5">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{t('history')}</p>
          <h1 className="text-zinc-900 font-medium text-lg">{t('transactionHistory')}</h1>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-zinc-900 text-sm placeholder-zinc-400 border border-zinc-200 focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { key: 'all' as const, label: t('all') },
            { key: 'income' as const, label: t('income') },
            { key: 'expense' as const, label: t('expenses') },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                filterType === f.key
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-500 border border-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="text-zinc-400 text-xs">
          {filtered.length} {filtered.length > 1 ? t('transactionsCountPlural') : t('transactionsCount')} •{' '}
          <span className={totalFiltered >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            {totalFiltered >= 0 ? '+' : ''}{formatMoney(totalFiltered)}
          </span>
        </div>
      </div>

      <div className="px-5">
        {Object.entries(grouped).map(([month, txs]) => (
          <div key={month} className="mb-6">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-3">{month}</p>
            <div className="space-y-2">
              <AnimatePresence>
                {txs.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8, height: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-zinc-100"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
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
                      <p className="text-zinc-400 text-[10px]">{formatDate(tx.date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                      </p>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} className="text-zinc-300" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search size={40} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">{t('noTransactions')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
