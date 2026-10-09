'use client';

import React, { useState } from 'react';
import {
  User,
  Flame,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Edit2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getRankDetails } from '@/lib/storage';
import { sound } from '@/lib/sound';

export function ProfilePage() {
  const { profile, achievements, updateProfileName, setSettingsModalOpen, setAuthModalOpen } = useApp();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const rank = getRankDetails(profile.totalXp);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    sound.playTap();
    updateProfileName(nameInput.trim());
    setIsEditingName(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with rank glow */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-emerald-500/25">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-extrabold border-2 border-white dark:border-slate-900">
              Lv. {rank.level}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {profile.name}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 self-center">
                {rank.rankTitle}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {profile.email} • Joined {profile.joinedDate}
            </p>

            {/* Account Status Badge */}
            {profile.id === 'user-qwerty' || profile.name === 'qwerty' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Аккаунт qwerty подключен (все данные автоматически сохраняются)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold mt-1 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Войти в аккаунт qwerty</span>
              </button>
            )}

            {/* Level XP Progress */}
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-500">
                  XP Progress to Level {rank.level + 1}
                </span>
                <span className="text-indigo-500 font-bold">
                  {profile.totalXp} / {rank.nextLevelXp} XP
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${rank.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Learning Preferences Quick Specs */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-xs text-slate-400 block">English Level</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
              {profile.englishLevel}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Daily Target</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
              {profile.settings.dailyGoalWords} words / day
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Current Streak</span>
            <span className="font-bold text-sm text-amber-500 mt-0.5 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{profile.currentStreak} Days</span>
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Longest Streak</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
              {profile.longestStreak} Days
            </span>
          </div>
        </div>
      </div>

      {/* Rank Ladder / Roadmap */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-500" />
          <span>Learner Rank Ladder</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
          {[
            { lvl: '1', title: 'Beginner', active: rank.level >= 1 },
            { lvl: '5', title: 'Explorer', active: rank.level >= 5 },
            { lvl: '10', title: 'Learner', active: rank.level >= 10 },
            { lvl: '20', title: 'Speaker', active: rank.level >= 20 },
            { lvl: '30', title: 'Advanced', active: rank.level >= 30 },
            { lvl: '50', title: 'Vocab Master', active: rank.level >= 50 },
          ].map((item) => (
            <div
              key={item.lvl}
              className={`p-3 rounded-2xl border-2 transition-all ${
                item.active
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                  : 'border-slate-100 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs">Level {item.lvl}</div>
              <div className="text-xs font-semibold mt-0.5">{item.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Badges & Achievements</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unlock badges as your vocabulary and streak grow.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full">
            {achievements.filter((a) => a.unlockedAt !== null).length} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((ach) => {
            const isUnlocked = ach.unlockedAt !== null || ach.id === 'first_step' || ach.id === 'week_warrior';
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-slate-100 dark:border-slate-800/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <span className="text-[11px] font-bold text-indigo-500">
                      +{ach.xpReward} XP
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {ach.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {ach.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                  <span>{isUnlocked ? 'Unlocked 🎉' : 'In Progress'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
