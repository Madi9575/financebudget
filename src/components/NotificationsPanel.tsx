import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, PiggyBank, FileText, Target } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { NotificationItem } from '../types';

interface NotificationsPanelProps {
  open: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead?: () => void;
  onMarkNotificationRead?: (id: string) => void;
}

const iconMap = {
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  'file-text': FileText,
  target: Target,
};

export default function NotificationsPanel({
  open,
  notifications,
  onClose,
  onMarkAllRead,
  onMarkNotificationRead,
}: NotificationsPanelProps) {
  const { t, formatMoney } = useLanguage();
  const hasUnread = notifications.some(notification => !notification.read);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-28 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-zinc-900 font-medium text-base">{t('notificationsTitle')}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                <X size={14} className="text-zinc-600" />
              </button>
            </div>

            <div className="space-y-2">
              {notifications.map((notification, index) => {
                const Icon = iconMap[notification.icon];
                return (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: notification.read ? 0.5 : 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onMarkNotificationRead?.(notification.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      notification.read ? 'border-zinc-100 bg-white' : 'border-zinc-100 bg-zinc-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${notification.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-900 text-sm">
                        {t(notification.key).replace('{amount}', formatMoney(500))}
                      </p>
                      <p className="text-zinc-400 text-[10px] mt-1">{t(notification.timeKey)}</p>
                    </div>
                    {!notification.read && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mt-2" />}
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => onMarkAllRead?.()}
              disabled={!hasUnread}
              className={`w-full mt-5 font-medium text-xs py-3 rounded-lg transition-colors ${
                hasUnread
                  ? 'text-zinc-900 bg-zinc-50 hover:bg-zinc-100'
                  : 'text-zinc-400 bg-zinc-100 cursor-not-allowed'
              }`}
            >
              {t('markAllRead')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
