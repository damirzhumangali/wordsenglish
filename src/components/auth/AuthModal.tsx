'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, User, Sparkles, CheckCircle2, Zap, ShieldCheck, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, loginUser, logoutUser, profile } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginInput, setLoginInput] = useState('qwerty');
  const [password, setPassword] = useState('qwerty');
  const [name, setName] = useState('qwerty');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const isLoggedInQwerty = profile.id === 'user-qwerty' || profile.name === 'qwerty';

  const handleQuickLoginQwerty = () => {
    sound.playTap();
    setLoginInput('qwerty');
    setPassword('qwerty');
    loginUser('qwerty@vocabflow.app', 'qwerty');
    setMessage('✓ Вход выполнен! Все ваши данные надёжно сохраняются.');
    setTimeout(() => {
      setAuthModalOpen(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();
    setLoading(true);
    setMessage(null);

    const clean = loginInput.trim().toLowerCase();

    // Check pre-configured account "qwerty"
    if (clean === 'qwerty' || clean === 'qwerty@vocabflow.app' || clean === 'qwerty@vocabflow.com') {
      if (password.trim() !== 'qwerty') {
        setMessage('Неверный пароль. Для аккаунта qwerty пароль: qwerty');
        setLoading(false);
        return;
      }
      loginUser('qwerty@vocabflow.app', 'qwerty');
      setMessage('✓ Вход выполнен! Все ваши данные сохраняются.');
      setLoading(false);
      setTimeout(() => {
        setAuthModalOpen(false);
      }, 500);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({
            email: loginInput,
            password,
            options: { data: { full_name: name } },
          });
          if (error) throw error;
          setMessage('Check your email to confirm registration!');
          loginUser(loginInput, name);
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: loginInput,
            password,
          });
          if (error) throw error;
          loginUser(loginInput, name || loginInput.split('@')[0]);
        }
      } else {
        // Offline / LocalStorage Mode
        loginUser(loginInput || 'qwerty', name || loginInput);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setMessage(errorObj?.message || 'Authentication error.');
      loginUser(loginInput || 'qwerty', name || 'qwerty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 relative"
      >
        <button
          onClick={() => {
            sound.playTap();
            setAuthModalOpen(false);
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white shadow-md shadow-emerald-500/25 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoggedInQwerty ? 'Аккаунт подключен' : 'Вход в аккаунт'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isLoggedInQwerty
              ? 'Ваш прогресс и словарь привязаны к аккаунту qwerty'
              : 'Сохраняйте изученные слова, уровень и статистику на любом устройстве'}
          </p>
        </div>

        {/* If already logged in as qwerty */}
        {isLoggedInQwerty ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  qwerty
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Автосохранение и синхронизация активны
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Продолжить обучение
              </button>
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  setAuthModalOpen(false);
                }}
                className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Quick 1-Click Login Button for qwerty */}
            <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-300/60 dark:border-emerald-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Ваш аккаунт готов к входу:</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold">
                  qwerty / qwerty
                </span>
              </div>

              <button
                type="button"
                onClick={handleQuickLoginQwerty}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Войти как qwerty (в 1 клик)</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-3">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
                или войти вручную
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Логин или Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="qwerty"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="qwerty"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`text-xs p-3 rounded-xl font-medium ${
                    message.startsWith('✓')
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50'
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? 'Проверка...' : 'Войти'}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
