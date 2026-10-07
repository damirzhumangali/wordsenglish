'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, RotateCcw, Library, BarChart3, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';

export function QuickActions() {
  const { dueForReviewWords, startSession } = useApp();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Continue Learning */}
      <button
        onClick={() => {
          sound.playTap();
          startSession({ mode: 'daily' });
        }}
        className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
      >
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="font-bold text-sm text-slate-900 dark:text-white">
          Continue Learning
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <span>Start new card</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* Review Words */}
      <Link
        href="/review"
        onClick={() => sound.playTap()}
        className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-md transition-all text-left group cursor-pointer relative"
      >
        {dueForReviewWords.length > 0 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
            {dueForReviewWords.length} due
          </span>
        )}
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="font-bold text-sm text-slate-900 dark:text-white">
          Review Words
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <span>Spaced repetition</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>

      {/* Vocabulary */}
      <Link
        href="/vocabulary"
        onClick={() => sound.playTap()}
        className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
      >
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <Library className="w-5 h-5" />
        </div>
        <div className="font-bold text-sm text-slate-900 dark:text-white">
          Vocabulary
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <span>Search & browse</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>

      {/* Statistics */}
      <Link
        href="/stats"
        onClick={() => sound.playTap()}
        className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
      >
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div className="font-bold text-sm text-slate-900 dark:text-white">
          Statistics
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <span>View analytics</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
