'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, X, ArrowRight, Clock } from 'lucide-react';
import { ReminderSlotInfo } from '@/lib/notifications';
import { sound } from '@/lib/sound';

interface NotificationReminderBannerProps {
  slot: ReminderSlotInfo | null;
  onStartSession: () => void;
  onDismiss: () => void;
  onSnooze: () => void;
}

export function NotificationReminderBanner({
  slot,
  onStartSession,
  onDismiss,
  onSnooze,
}: NotificationReminderBannerProps) {
  if (!slot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg"
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl rounded-3xl p-4 sm:p-5 text-slate-900 dark:text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  slot.iconType === 'sun'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/25'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/25'
                }`}
              >
                {slot.iconType === 'sun' ? (
                  <Sun className="w-6 h-6 animate-spin-slow" />
                ) : (
                  <Moon className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                    {slot.time} • Напоминание
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Streak Boost</span>
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                  {slot.title}
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playTap();
                onDismiss();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {slot.message}
          </p>

          <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                sound.playTap();
                onStartSession();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Начать тренировку (5 мин)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sound.playTap();
                onSnooze();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all"
              title="Отложить на 15 минут"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Позже</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
