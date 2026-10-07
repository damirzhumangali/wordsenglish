'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, CheckCircle2, Target } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';

export function DailyGoalCard() {
  const { profile, todayProgressPercent, isDailyGoalCompleted, startSession } = useApp();

  const handleStart = () => {
    sound.playTap();
    startSession({ mode: 'daily' });
  };

  // SVG Circular progress math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (todayProgressPercent / 100) * circumference;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50/50 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-slate-900/90 border border-emerald-500/20 dark:border-emerald-500/20 shadow-sm relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left Info & CTA */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            <span>Daily Goal Target</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isDailyGoalCompleted ? (
              <span className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 dark:text-emerald-400">
                Daily Goal Completed! 🎉
              </span>
            ) : (
              <span>Boost Your Active Vocabulary</span>
            )}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
            {isDailyGoalCompleted
              ? 'Awesome commitment! Keep building momentum with bonus review exercises.'
              : `${profile.todayStudiedCount} of ${profile.settings.dailyGoalWords} target words completed today (${todayProgressPercent}%).`}
          </p>

          <div className="pt-2">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold text-base shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer glow-emerald"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>START DAILY TRAINING</span>
            </button>
          </div>
        </div>

        {/* Right Circular Progress Ring */}
        <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
          <svg className="w-36 h-36 -rotate-90">
            {/* Background ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
              fill="transparent"
              className="text-slate-200/80 dark:text-slate-800"
            />
            {/* Progress ring */}
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeLinecap="round"
              className="text-emerald-500"
            />
          </svg>

          {/* Inner content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isDailyGoalCompleted ? (
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            ) : (
              <>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {todayProgressPercent}%
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {profile.todayStudiedCount}/{profile.settings.dailyGoalWords}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
