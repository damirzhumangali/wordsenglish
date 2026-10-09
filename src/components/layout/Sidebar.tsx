'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Home,
  BookOpen,
  RotateCcw,
  Library,
  Gamepad2,
  BarChart3,
  User,
  Settings,
  Moon,
  Sun,
  Flame,
  Award,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';

export function Sidebar() {
  const pathname = usePathname();
  const {
    profile,
    dueForReviewWords,
    updateSettings,
    setSettingsModalOpen,
    setAuthModalOpen,
    logoutUser,
  } = useApp();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    {
      href: '/review',
      label: 'Review',
      icon: RotateCcw,
      badge: dueForReviewWords.length > 0 ? dueForReviewWords.length : undefined,
    },
    { href: '/vocabulary', label: 'Vocabulary', icon: Library },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/stats', label: 'Statistics', icon: BarChart3 },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const toggleDarkMode = () => {
    sound.playTap();
    updateSettings({ darkMode: !profile.settings.darkMode });
  };

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 flex-col fixed inset-y-0 left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <Link
          href="/"
          onClick={() => sound.playTap()}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Vocab<span className="text-emerald-500">Flow</span>
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5">
              Active English Mastery
            </div>
          </div>
        </Link>
      </div>

      {/* Mini Streak & XP Widget */}
      <div className="px-5 py-2">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {profile.currentStreak} Days
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Streak</div>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {profile.totalXp.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Total XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => sound.playTap()}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{link.label}</span>
              </div>
              {link.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'bg-white text-emerald-600'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            {profile.settings.darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500" />
            )}
            <span>{profile.settings.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setSettingsModalOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Settings</span>
        </button>

        {!profile.isDemoUser ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 truncate">
                  {profile.name}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                Сохранено
              </span>
            </div>
            <button
              onClick={() => {
                sound.playTap();
                logoutUser();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sound.playTap();
              setAuthModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Войти (аккаунт qwerty)</span>
          </button>
        )}
      </div>
    </aside>
  );
}
