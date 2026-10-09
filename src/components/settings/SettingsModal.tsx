'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Keyboard,
  Globe,
  CheckCircle2,
  Play,
  BellRing,
  Smartphone,
  Gauge,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';
import { EnglishLevel } from '@/types/vocabulary';
import { SpeechAccent, SpeechSpeed } from '@/types/user';
import { speakWord } from '@/lib/speech';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, profile, updateSettings } = useApp();

  const [testSoundStatus, setTestSoundStatus] = useState<'idle' | 'playing' | 'success'>('idle');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleRequestNotif = async () => {
    sound.playTap();
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  if (!settingsModalOpen) return null;

  const dailyWordOptions = [5, 10, 15, 20, 30];
  const studyTimeOptions = [5, 10, 15, 20, 30];

  const handleTestSound = async () => {
    sound.playTap();
    setTestSoundStatus('playing');
    try {
      sound.playCorrect();
      await speakWord('Welcome to VocabFlow! Learning English made easy and natural.');
      setTestSoundStatus('success');
      setTimeout(() => setTestSoundStatus('idle'), 3000);
    } catch {
      setTestSoundStatus('idle');
    }
  };

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

        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">
          Настройки
        </h2>

        <div className="space-y-6">
          {/* Daily Goal Words */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Цель: новых слов в день
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
                  {num} слов
                </button>
              ))}
            </div>
          </div>

          {/* Target Translation Language */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Язык перевода</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'ru', label: '🇷🇺 Русский' },
                { code: 'kz', label: '🇰🇿 Қазақша' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    updateSettings({ targetLang: lang.code as 'ru' | 'kz' });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
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

          {/* Study Direction */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Направление обучения
              </label>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {(profile.settings.studyDirection || 'both') === 'both' && 'Оба направления'}
                {profile.settings.studyDirection === 'ru_en' && 'Русский ➔ Английский'}
                {profile.settings.studyDirection === 'en_ru' && 'Английский ➔ Русский'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  code: 'both',
                  label: '🔀 Оба (EN ⇄ RU)',
                  desc: 'Учишь и вспоминаешь в обе стороны',
                  badge: 'Рекомендуется',
                },
                {
                  code: 'ru_en',
                  label: '🇷🇺 ➔ 🇬🇧 RU ➔ EN',
                  desc: 'Вспомни английское слово по переводу',
                  badge: 'Активный recall',
                },
                {
                  code: 'en_ru',
                  label: '🇬🇧 ➔ 🇷🇺 EN ➔ RU',
                  desc: 'Выбери перевод по английскому слову',
                  badge: 'Пассивный',
                },
              ].map((dir) => {
                const isSelected = (profile.settings.studyDirection || 'both') === dir.code;
                return (
                  <button
                    key={dir.code}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      updateSettings({ studyDirection: dir.code as any });
                    }}
                    className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold leading-tight">{dir.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {dir.desc}
                      </div>
                    </div>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold self-start ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {dir.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice & Speech Settings (Accent + Speed) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Озвучка и произношение
            </label>

            {/* Accent selection */}
            <div>
              <div className="text-xs text-slate-500 mb-1.5 font-medium">Акцент голоса:</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'en-US' as SpeechAccent, label: '🇺🇸 Американский (US)' },
                  { code: 'en-GB' as SpeechAccent, label: '🇬🇧 Британский (UK)' },
                ].map((item) => {
                  const isSelected = (profile.settings.speechAccent || 'en-US') === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        updateSettings({ speechAccent: item.code });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speech rate / speed */}
            <div>
              <div className="text-xs text-slate-500 mb-1.5 flex items-center justify-between font-medium">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  <span>Скорость речи:</span>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {profile.settings.speechSpeed || 1.0}x
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { speed: 0.8 as SpeechSpeed, label: '0.8x (Медленно)' },
                  { speed: 1.0 as SpeechSpeed, label: '1.0x (Нормально)' },
                  { speed: 1.2 as SpeechSpeed, label: '1.2x (Быстро)' },
                ].map((item) => {
                  const isSelected = (profile.settings.speechSpeed || 1.0) === item.speed;
                  return (
                    <button
                      key={item.speed}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        updateSettings({ speechSpeed: item.speed });
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Test Voice Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestSound}
                disabled={testSoundStatus === 'playing'}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {testSoundStatus === 'playing' ? 'Воспроизведение...' : '🔊 Проверить голос'}
                </span>
                {testSoundStatus === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            </div>
          </div>

          {/* Daily Study Time */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Время занятий в день
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
                  {mins} мин
                </button>
              ))}
            </div>
          </div>

          {/* App Experience Toggles (Sound, Theme, Shortcuts, Haptics) */}
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
                    Звуковые эффекты
                  </div>
                  <div className="text-xs text-slate-500">Сигналы правильных и ошибочных ответов</div>
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

            {/* Haptic feedback (Vibrations for PWA / Mobile) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Вибрация (Тактильный отклик)
                  </div>
                  <div className="text-xs text-slate-500">Вибрация при тапах и ответах на телефоне</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.hapticsEnabled ?? true}
                onChange={(e) => {
                  sound.playTap();
                  updateSettings({ hapticsEnabled: e.target.checked });
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
                    Тёмная тема (Dark Mode)
                  </div>
                  <div className="text-xs text-slate-500">Комфортный тёмный интерфейс</div>
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
                    Горячие клавиши
                  </div>
                  <div className="text-xs text-slate-500">Клавиши 1-4, Enter, Пробел в тестах</div>
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

            {/* Daily Study Reminders Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <BellRing className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Напоминания (13:00 и 20:00)</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Напоминать о повторении слов дважды в день
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.notificationsEnabled ?? true}
                onChange={(e) => {
                  sound.playTap();
                  updateSettings({ notificationsEnabled: e.target.checked });
                  if (e.target.checked && notifPermission === 'default') {
                    handleRequestNotif();
                  }
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
            Сохранить и закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
}
