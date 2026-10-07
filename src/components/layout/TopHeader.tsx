'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Flame, Award, Moon, Sun, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';

export function TopHeader() {
  const { profile, updateSettings, setSettingsModalOpen } = useApp();

  const toggleDarkMode = () => {
    sound.playTap();
    updateSettings({ darkMode: !profile.settings.darkMode });
  };

  return (
    <header className="lg:hidden sticky top-0 inset-x-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-20 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
          Vocab<span className="text-emerald-500">Flow</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 fill-amber-500" />
          <span>{profile.currentStreak}</span>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>{profile.totalXp}</span>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {profile.settings.darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setSettingsModalOpen(true);
          }}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
