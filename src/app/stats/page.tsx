'use client';

import React from 'react';
import {
  BarChart3,
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { StatCard } from '@/components/dashboard/StatCard';

export default function StatisticsPage() {
  const { profile, words, userWords, activity } = useApp();

  // Words Mastered vs Learning
  const masteredCount = words.filter((w) => userWords[w.id]?.status === 'MASTERED').length;
  const learningCount = words.filter((w) => userWords[w.id]?.status === 'LEARNING' || userWords[w.id]?.status === 'REVIEW').length;

  // Words Learned last 7 days from activity
  const last7Days = activity.slice(-7);
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 15);

  // Most difficult words
  const difficultWords = words
    .filter((w) => userWords[w.id] && userWords[w.id].incorrectCount > 0)
    .sort((a, b) => (userWords[b.id]?.incorrectCount || 0) - (userWords[a.id]?.incorrectCount || 0))
    .slice(0, 5);

  // Most improved words
  const improvedWords = words
    .filter((w) => userWords[w.id] && userWords[w.id].correctCount >= 3)
    .sort((a, b) => (userWords[b.id]?.correctCount || 0) - (userWords[a.id]?.correctCount || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Learning Analytics & Insights
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your lexical acquisition rate, retention curves and mastery trends.
        </p>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Words Learned"
          value={profile.wordsLearnedCount}
          subtext={`${masteredCount} Mastered`}
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          label="Total XP"
          value={profile.totalXp.toLocaleString()}
          subtext="Level 5 Explorer"
          icon={Award}
          color="indigo"
        />
        <StatCard
          label="Current Streak"
          value={`${profile.currentStreak} Days`}
          subtext={`Best: ${profile.longestStreak} Days`}
          icon={Flame}
          color="amber"
        />
        <StatCard
          label="Retention Accuracy"
          value="89%"
          subtext="Strong memory consolidation"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap />

      {/* Chart: Last 7 Days Activity */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Words Learned — Last 7 Days
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily active recall and quiz volume
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
            +18% this week
          </span>
        </div>

        {/* Bar Chart Visual */}
        <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6">
          {last7Days.map((day) => {
            const heightPercent = Math.round((day.count / maxDayCount) * 100);
            const dayName = new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'short',
            });
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500">
                  {day.count}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl h-36 flex items-end p-1">
                  <div
                    className="w-full bg-emerald-500 rounded-lg group-hover:bg-emerald-400 transition-all"
                    style={{ height: `${Math.max(10, heightPercent)}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficult vs Improved Words Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Difficult Words */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-rose-500">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Most Difficult Words
            </h3>
          </div>

          <div className="space-y-3">
            {difficultWords.map((w) => {
              const uw = userWords[w.id];
              return (
                <div
                  key={w.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {w.word}
                    </div>
                    <div className="text-xs text-slate-500">{w.translation_ru}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-500">
                      {uw?.incorrectCount || 0} errors
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Mem: {uw?.memoryStrength || 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Improved Words */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-500">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Most Improved Words
            </h3>
          </div>

          <div className="space-y-3">
            {improvedWords.map((w) => {
              const uw = userWords[w.id];
              return (
                <div
                  key={w.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {w.word}
                    </div>
                    <div className="text-xs text-slate-500">{w.translation_ru}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-500">
                      +{uw?.correctCount || 0} correct
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Mem: {uw?.memoryStrength || 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
