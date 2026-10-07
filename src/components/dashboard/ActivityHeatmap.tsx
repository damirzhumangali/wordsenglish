'use client';

import React from 'react';
import { Flame, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function ActivityHeatmap() {
  const { activity, profile } = useApp();

  // Get color intensity level (0 to 4)
  const getLevelColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/80';
    if (count < 5) return 'bg-emerald-200 dark:bg-emerald-900/60';
    if (count < 10) return 'bg-emerald-300 dark:bg-emerald-700';
    if (count < 18) return 'bg-emerald-400 dark:bg-emerald-500';
    return 'bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/20';
  };

  // Group into columns of 7 days (weeks)
  const weeks: { date: string; count: number; xp: number }[][] = [];
  let currentWeek: { date: string; count: number; xp: number }[] = [];

  activity.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === activity.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Learning Activity Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your consistent study record over the last 60 days
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>Current: {profile.currentStreak} Days</span>
          </div>
          <div className="text-slate-400">
            Best: <span className="text-slate-700 dark:text-slate-200">{profile.longestStreak} Days</span>
          </div>
        </div>
      </div>

      {/* Contribution Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1.5 min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 cursor-pointer ${getLevelColor(
                    day.count
                  )}`}
                  title={`${day.date}: ${day.count} words studied (+${day.xp} XP)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-400">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
        <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/60" />
        <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
        <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
        <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
        <span>More</span>
      </div>
    </div>
  );
}
