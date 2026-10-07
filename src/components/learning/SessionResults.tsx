'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Award,
  Clock,
  Sparkles,
  RotateCcw,
  Home,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { LearningSessionSummary } from '@/types/session';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';

interface SessionResultsProps {
  summary: LearningSessionSummary;
  onHome: () => void;
  onReviewMistakes: () => void;
}

export function SessionResults({
  summary,
  onHome,
  onReviewMistakes,
}: SessionResultsProps) {
  const { profile } = useApp();

  const minutes = Math.max(1, Math.round(summary.durationSeconds / 60));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-2xl relative overflow-hidden"
    >
      {/* Decorative fireworks glow */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/15 to-transparent pointer-events-none" />

      {/* Header Banner */}
      <div className="text-center relative z-10 mb-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-3 animate-float">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
          Great job! 🎉
        </h2>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
          Daily Training Session Complete
        </p>
      </div>

      {/* Primary Highlights: Score, XP, Streak */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
          <div className="text-xs font-semibold text-slate-500">Accuracy</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summary.accuracy}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {summary.correctAnswers}/{summary.totalQuestions} Correct
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-center">
          <div className="text-xs font-semibold text-slate-500">XP Earned</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            +{summary.xpEarned}
          </div>
          <div className="text-[10px] text-indigo-500 font-medium mt-0.5">
            Rank Booster
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-center">
          <div className="text-xs font-semibold text-slate-500">Streak</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
            <Flame className="w-5 h-5 fill-amber-500" />
            <span>{profile.currentStreak}d</span>
          </div>
          <div className="text-[10px] text-amber-500 font-medium mt-0.5">
            Streak Active
          </div>
        </div>
      </div>

      {/* Vocabulary Breakdown Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 mb-6 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Session Statistics
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">New Words Introduced:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {summary.newWordsCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">Words Reviewed:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {summary.reviewedCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">Words Mastered:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {summary.masteredCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">Duration:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {minutes} min ({summary.durationSeconds}s)
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        <button
          onClick={onHome}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>

        {summary.needsReviewCount > 0 && (
          <button
            onClick={onReviewMistakes}
            className="w-full py-3 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Review Mistakes ({summary.needsReviewCount})</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
