import React from 'react';
import { Home, Clock, PiggyBank, Settings, DollarSign } from 'lucide-react';
import { TabType } from '../types';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage();

  const tabs: { id: TabType; icon: React.FC<{ size?: number; className?: string }>; label: string }[] = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'transactions', icon: Clock, label: t('history') },
    { id: 'budget', icon: DollarSign, label: '' },
    { id: 'savings', icon: PiggyBank, label: t('savings') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-zinc-100 px-2 pb-2 pt-1.5 shadow-[0_-1px_0_rgba(0,0,0,0.02)]">
        <div className="flex items-end justify-around">
          {tabs.map((tab) => {
            const isCenter = tab.id === 'budget';
            const isActive = activeTab === tab.id;

            if (isCenter) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="relative -mt-4 flex flex-col items-center"
                >
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg ${
                      isActive ? 'bg-zinc-900' : 'bg-zinc-800'
                    }`}
                    style={{ width: '52px', height: '52px' }}
                  >
                    <DollarSign size={22} className="text-white" />
                  </motion.div>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center py-1.5 px-3 relative"
              >
                <tab.icon
                  size={20}
                  className={isActive ? 'text-zinc-900' : 'text-zinc-400'}
                />
                {tab.label && (
                  <span className={`text-[9px] mt-1 ${isActive ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
