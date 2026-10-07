'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Sparkles, Moon, Sun, Keyboard, Globe } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';
import { EnglishLevel } from '@/types/vocabulary';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, profile, updateSettings } = useApp();

  if (!settingsModalOpen) return null;

  const dailyWordOptions = [5, 10, 15, 20, 30];
  const studyTimeOptions = [5, 10, 15, 20, 30];
  const levels: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={() => {
            sound.playTap();
            setSettingsModalOpen(false);
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Settings
        </h2>

        <div className="space-y-6">
          {/* Daily Goal Words */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Daily Words Target
            </label>
            <div className="flex flex-wrap gap-2">
              {dailyWordOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    updateSettings({ dailyGoalWords: num });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    profile.settings.dailyGoalWords === num
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {num} words
                </button>
              ))}
            </div>
          </div>

          {/* Target Translation Language */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Translation Language</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'ru', label: 'Русский' },
                { code: 'kz', label: 'Қазақша' },
                { code: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    updateSettings({ targetLang: lang.code as 'ru' | 'kz' | 'en' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                    profile.settings.targetLang === lang.code
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Study Time Target */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Daily Study Time
            </label>
            <div className="flex flex-wrap gap-2">
              {studyTimeOptions.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    updateSettings({ studyTimeMinutes: mins });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    profile.settings.studyTimeMinutes === mins
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Sound & Toggles */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile.settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Sound Effects
                  </div>
                  <div className="text-xs text-slate-500">Audio chimes on answers</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.soundEnabled}
                onChange={(e) => {
                  sound.playTap();
                  updateSettings({ soundEnabled: e.target.checked });
                }}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile.settings.darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Dark Mode
                  </div>
                  <div className="text-xs text-slate-500">Sleek dark color scheme</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.darkMode}
                onChange={(e) => {
                  sound.playTap();
                  updateSettings({ darkMode: e.target.checked });
                }}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Keyboard Shortcuts
                  </div>
                  <div className="text-xs text-slate-500">Press 1-4, Enter, Space in quiz</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.keyboardShortcuts}
                onChange={(e) => {
                  sound.playTap();
                  updateSettings({ keyboardShortcuts: e.target.checked });
                }}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              sound.playTap();
              setSettingsModalOpen(false);
            }}
            className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm cursor-pointer shadow-md shadow-emerald-500/20"
          >
            Save & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
