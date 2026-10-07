'use client';

import React, { useState } from 'react';
import { Play, Sparkles, BookOpen, Layers, CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/seed-words';
import { sound } from '@/lib/sound';

export default function LearnPage() {
  const { startSession, userWords, words } = useApp();
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const levels = ['All', 'A1', 'A2', 'B1', 'B2', 'C1'];

  // Calculate completion percentage for each category
  const getCategoryStats = (categoryId: string) => {
    const categoryWords = words.filter((w) => w.category_id === categoryId);
    if (categoryWords.length === 0) return { total: 0, learned: 0, percent: 0 };

    const learnedCount = categoryWords.filter((w) => {
      const uw = userWords[w.id];
      return uw && uw.status !== 'NEW';
    }).length;

    const percent = Math.round((learnedCount / categoryWords.length) * 100);
    return {
      total: categoryWords.length,
      learned: learnedCount,
      percent,
    };
  };

  const handleStartCategory = (catId: string) => {
    sound.playTap();
    startSession({ mode: 'category', categoryId: catId });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Learning Paths & Topics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose a targeted category or start a recommended daily session.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            startSession({ mode: 'daily' });
          }}
          className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Start Daily Session</span>
        </button>
      </div>

      {/* Level Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
          Level:
        </span>
        {levels.map((lvl) => (
          <button
            key={lvl}
            onClick={() => {
              sound.playTap();
              setSelectedLevel(lvl);
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedLevel === lvl
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((cat) => {
          const stats = getCategoryStats(cat.id);
          return (
            <div
              key={cat.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center shadow-md`}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {cat.levelRange}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {cat.description}
                </p>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">{stats.learned} / {stats.total} words</span>
                    <span className="text-emerald-500 font-bold">{stats.percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleStartCategory(cat.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Practice Category</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
