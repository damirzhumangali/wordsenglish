'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color: 'amber' | 'indigo' | 'emerald' | 'blue';
}

export function StatCard({ label, value, subtext, icon: Icon, color }: StatCardProps) {
  const colorMap = {
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-500',
      border: 'border-amber-200/50 dark:border-amber-900/30',
    },
    indigo: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-500',
      border: 'border-indigo-200/50 dark:border-indigo-900/30',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-500',
      border: 'border-emerald-200/50 dark:border-emerald-900/30',
    },
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-500',
      border: 'border-blue-200/50 dark:border-blue-900/30',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-2xl ${scheme.bg} ${scheme.text} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        {subtext && (
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
