'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Award, BookOpen, Target, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { DailyGoalCard } from '@/components/dashboard/DailyGoalCard';
import { WordOfTheDayCard } from '@/components/dashboard/WordOfTheDayCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { getRankDetails } from '@/lib/storage';

export default function DashboardPage() {
  const { profile } = useApp();
  const [greeting, setGreeting] = React.useState('Welcome back');

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const rank = getRankDetails(profile.totalXp);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Welcome & Rank Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}, {profile.name} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ready to convert passive recognition into active spoken fluency?
          </p>
        </div>

        {/* User Level Badge */}
        <div className="flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/20">
            {rank.level}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>Level {rank.level}</span>
              <span className="text-indigo-500 font-semibold">• {rank.rankTitle}</span>
            </div>
            <div className="w-28 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${rank.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Day Streak"
          value={`${profile.currentStreak} Days`}
          subtext="Keep the fire burning"
          icon={Flame}
          color="amber"
        />
        <StatCard
          label="Total XP"
          value={profile.totalXp.toLocaleString()}
          subtext={`${rank.rankTitle} Rank`}
          icon={Award}
          color="indigo"
        />
        <StatCard
          label="Words Learned"
          value={profile.wordsLearnedCount}
          subtext={`${profile.wordsMasteredCount} Mastered`}
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          label="Today's Goal"
          value={`${profile.todayStudiedCount} / ${profile.settings.dailyGoalWords}`}
          subtext={
            profile.todayStudiedCount >= profile.settings.dailyGoalWords
              ? 'Goal Achieved 🎉'
              : `${profile.settings.dailyGoalWords - profile.todayStudiedCount} left`
          }
          icon={Target}
          color="blue"
        />
      </div>

      {/* Hero Daily Training Goal Card */}
      <DailyGoalCard />

      {/* AI Voice Tutor Feature Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white relative overflow-hidden shadow-xl border border-indigo-700/40">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Новинка • Gemini AI Voice Tutor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Разговаривай голосом и учи слова с ИИ Luna
            </h2>
            <p className="text-sm text-indigo-200/90 leading-relaxed font-medium">
              Общайся на английском в реальном времени, получай разборы сложных слов, живые примеры использования и мягкие исправления речи.
            </p>
          </div>

          <Link
            href="/ai-tutor"
            className="py-3.5 px-6 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto shrink-0 active:scale-[0.98]"
          >
            <span>Начать диалог голосом</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </Link>
        </div>
      </div>

      {/* Word of the Day & Quick Actions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WordOfTheDayCard />
        </div>
        <div className="lg:col-span-2 flex flex-col justify-between gap-6">
          <QuickActions />
          <ActivityHeatmap />
        </div>
      </div>
    </div>
  );
}
