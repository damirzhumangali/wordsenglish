'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Moon,
  Sun,
  Keyboard,
  Globe,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Play,
  Bell,
  BellRing,
  Clock,
  ArrowLeftRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';
import { EnglishLevel } from '@/types/vocabulary';
import {
  speakWord,
  requestMicrophoneAccess,
  createAudioLevelMonitor,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
} from '@/lib/speech';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestReminder,
  REMINDER_SLOTS,
} from '@/lib/notifications';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, profile, updateSettings } = useApp();

  const [testSoundStatus, setTestSoundStatus] = useState<'idle' | 'playing' | 'success'>('idle');
  const [testMicStatus, setTestMicStatus] = useState<'idle' | 'recording' | 'success' | 'error'>('idle');
  const [testMicLevel, setTestMicLevel] = useState(0);
  const [testMicTranscript, setTestMicTranscript] = useState('');
  const [testMicError, setTestMicError] = useState<string | null>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const stopMonitorRef = useRef<(() => void) | null>(null);
  const testRecognizerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notifTestSuccess, setNotifTestSuccess] = useState<string | null>(null);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleRequestNotif = async () => {
    sound.playTap();
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  const handleTestNotification = async (slotKey: '13:00' | '20:00') => {
    sound.playTap();
    const res = await sendTestReminder(slotKey);
    setNotifPermission(res.permission);
    setNotifTestSuccess(slotKey);

    window.dispatchEvent(
      new CustomEvent('vocabflow-test-notification', { detail: { slot: res.slot } })
    );

    setTimeout(() => {
      setNotifTestSuccess(null);
    }, 4500);
  };

  if (!settingsModalOpen) return null;

  const dailyWordOptions = [5, 10, 15, 20, 30];
  const studyTimeOptions = [5, 10, 15, 20, 30];
  const levels: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  const handleTestSound = async () => {
    sound.playTap();
    setTestSoundStatus('playing');
    try {
      sound.playCorrect();
      await speakWord('VocabFlow sound test. Audio is working properly!');
      setTestSoundStatus('success');
      setTimeout(() => setTestSoundStatus('idle'), 4000);
    } catch {
      setTestSoundStatus('idle');
    }
  };

  const stopMicTest = () => {
    if (stopMonitorRef.current) {
      stopMonitorRef.current();
      stopMonitorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (testRecognizerRef.current) {
      try {
        testRecognizerRef.current.stop();
      } catch {}
      testRecognizerRef.current = null;
    }
    setTestMicLevel(0);
  };

  const handleStartMicTest = async () => {
    sound.playTap();
    setTestMicError(null);
    setTestMicTranscript('');

    if (!isSpeechRecognitionSupported()) {
      setTestMicError('Ваш браузер не поддерживает Web Speech Recognition (например, Firefox). Для распознавания речи используйте Google Chrome или Safari.');
      setTestMicStatus('error');
      return;
    }

    const access = await requestMicrophoneAccess();
    if (!access.granted || !access.stream) {
      setTestMicStatus('error');
      if (access.error === 'not-allowed') {
        setTestMicError('Доступ к микрофону заблокирован браузером или системой macOS.');
      } else if (access.error === 'audio-capture') {
        setTestMicError('Микрофон не найден. Подключите микрофон или наушники.');
      } else {
        setTestMicError('Не удалось подключиться к микрофону.');
      }
      return;
    }

    micStreamRef.current = access.stream;
    setTestMicStatus('recording');

    stopMonitorRef.current = createAudioLevelMonitor(access.stream, (lvl) => {
      setTestMicLevel(lvl);
    });

    const recognizer = createSpeechRecognizer(
      (res) => {
        setTestMicTranscript(res.transcript);
        if (res.transcript.trim()) {
          setTestMicStatus('success');
          stopMicTest();
        }
      },
      (err) => {
        if (err === 'not-allowed') {
          setTestMicError('Доступ к микрофону заблокирован.');
          setTestMicStatus('error');
          stopMicTest();
        } else if (err === 'network') {
          setTestMicError('Ошибка сети распознавания речи.');
          setTestMicStatus('error');
          stopMicTest();
        }
      },
      () => {
        // recognizer finished
      }
    );

    if (recognizer) {
      testRecognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch {}
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
            stopMicTest();
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

          {/* Daily Study Reminders (13:00 & 20:00) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Напоминания о тренировках</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      2 раза в день
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Уведомления каждый день в 13:00 (обед) и 20:00 (8 вечера)
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

            {/* Schedule Slot Cards */}
            {(profile.settings.notificationsEnabled ?? true) && (
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Slot 1: 13:00 */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-black text-xs text-amber-600 dark:text-amber-400">
                        <Sun className="w-3.5 h-3.5" />
                        <span>13:00 • Дневная разминка</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold">
                        Обед
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      5 минут на повторение слов в середине дня.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTestNotification('13:00')}
                      className="py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{notifTestSuccess === '13:00' ? 'Отправлено!' : 'Тест 13:00'}</span>
                    </button>
                  </div>

                  {/* Slot 2: 20:00 */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-black text-xs text-indigo-600 dark:text-indigo-400">
                        <Moon className="w-3.5 h-3.5" />
                        <span>20:00 • Вечерний обзор</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold">
                        8 вечера
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      Закрепление дневной цели перед сном.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTestNotification('20:00')}
                      className="py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{notifTestSuccess === '20:00' ? 'Отправлено!' : 'Тест 20:00'}</span>
                    </button>
                  </div>
                </div>

                {/* Browser permission notice */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  {notifPermission === 'granted' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Системные уведомления браузера и Mac активны</span>
                    </span>
                  ) : notifPermission === 'denied' ? (
                    <span className="text-rose-500 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Уведомления заблокированы (разрешите в адресной строке)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestNotif}
                      className="text-emerald-600 dark:text-emerald-400 font-bold underline cursor-pointer hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Bell className="w-3 h-3" />
                      <span>Включить системные push-уведомления браузера</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Test Section for Sound & Microphone */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Audio & Microphone Diagnostics</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Инструкция</span>
                {showTroubleshoot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Test Speaker Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <span>Проверка звука</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  Воспроизводит проверочную фразу и аудио-сигнал.
                </p>
                <button
                  type="button"
                  onClick={handleTestSound}
                  disabled={testSoundStatus === 'playing'}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <Play className="w-3 h-3" />
                  <span>{testSoundStatus === 'playing' ? 'Воспроизведение...' : 'Тест звука'}</span>
                </button>
                {testSoundStatus === 'success' && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Звук воспроизведен!</span>
                  </div>
                )}
              </div>

              {/* Test Mic Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-500" />
                  <span>Проверка микрофона</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  Проверяет доступ и уровень захвата голоса.
                </p>
                <button
                  type="button"
                  onClick={testMicStatus === 'recording' ? stopMicTest : handleStartMicTest}
                  className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    testMicStatus === 'recording'
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  }`}
                >
                  {testMicStatus === 'recording' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span>{testMicStatus === 'recording' ? 'Остановить' : 'Тест микрофона'}</span>
                </button>

                {testMicStatus === 'recording' && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-75"
                          style={{ width: `${Math.min(100, testMicLevel * 2)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {testMicLevel > 5 ? 'Улавливает' : 'Тишина'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Скажите что-нибудь на английском...</p>
                  </div>
                )}

                {testMicStatus === 'success' && (
                  <div className="mt-2 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Микрофон работает!</span>
                    </div>
                    {testMicTranscript && (
                      <p className="text-[10px] italic text-slate-500 truncate">
                        &ldquo;{testMicTranscript}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {testMicError && (
                  <div className="mt-2 text-[10px] text-rose-500 font-medium">
                    {testMicError}
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Troubleshoot Instructions */}
            <AnimatePresence>
              {showTroubleshoot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 space-y-2.5 overflow-hidden"
                >
                  <div>
                    <h4 className="font-bold flex items-center gap-1 text-xs text-amber-800 dark:text-amber-300">
                      <span>🔈 Если не слышно звук:</span>
                    </h4>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
                      <li>Убедитесь, что переключатель <strong>Sound Effects</strong> включен выше.</li>
                      <li>Проверьте, не заглушена ли вкладка в браузере (значок динамика на вкладке).</li>
                      <li>Проверьте вывод звука на Mac (нажмите значок Звука в строке меню: Встроенные динамики / Наушники).</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold flex items-center gap-1 text-xs text-amber-800 dark:text-amber-300">
                      <span>🎙️ Если не работает микрофон:</span>
                    </h4>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
                      <li>
                        <strong>В браузере (Chrome / Safari):</strong> нажмите на значок настроек сайта / замка слева в адресной строке и переключите <strong>Микрофон: Разрешить</strong>.
                      </li>
                      <li>
                        <strong>В macOS:</strong> откройте <em>«Системные настройки» → «Конфиденциальность и безопасность» → «Микрофон»</em> и включите доступ для вашего браузера.
                      </li>
                      <li>
                        В упражнениях на говорение вы всегда можете переключиться на вкладку <strong>«Type Text»</strong> и написать предложение вручную.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              sound.playTap();
              stopMicTest();
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
