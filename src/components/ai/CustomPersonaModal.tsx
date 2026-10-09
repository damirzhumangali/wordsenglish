'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Sliders, Check, Bot, Shield, User, MessageSquare } from 'lucide-react';
import { CustomAIPersona } from '@/types/ai';
import { sound } from '@/lib/sound';

interface CustomPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: CustomAIPersona;
  onSave: (persona: CustomAIPersona) => void;
}

export function CustomPersonaModal({
  isOpen,
  onClose,
  currentPersona,
  onSave,
}: CustomPersonaModalProps) {
  const [name, setName] = useState(currentPersona.name);
  const [personality, setPersonality] = useState(currentPersona.personality);
  const [strictness, setStrictness] = useState(currentPersona.strictness);
  const [accent, setAccent] = useState(currentPersona.speechAccent);
  const [customPrompt, setCustomPrompt] = useState(currentPersona.customPrompt || '');

  if (!isOpen) return null;

  const handleSave = () => {
    sound.playTap();
    const updated: CustomAIPersona = {
      ...currentPersona,
      name: name.trim() || 'Luna',
      personality,
      strictness,
      speechAccent: accent,
      customPrompt: customPrompt.trim(),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto space-y-5"
      >
        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Настройка своего ИИ-репетитора
            </h2>
            <p className="text-xs text-slate-500">
              Персонализируйте характер, строгость фидбэка и правила обучения
            </p>
          </div>
        </div>

        {/* AI Name & Role */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Имя вашего ИИ-репетитора
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Luna, Alex, Sarah, Mr. Anderson..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Personality presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Характер и стиль общения
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'friendly', label: '🌟 Дружелюбный носитель', desc: 'Мягко поддерживает и хвалит' },
                { id: 'strict-examiner', label: '🎓 Строгий экзаменатор', desc: 'Придирчивый к IELTS баллам' },
                { id: 'business-mentor', label: '💼 IT & Бизнес Ментор', desc: 'Фокус на карьере и переговорах' },
                { id: 'native-friend', label: '☕ Друг-американец', desc: 'Живой разговорный сленг' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setPersonality(p.id as any);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    personality === p.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Strictness */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Строгость проверки ошибок (Фидбэк)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gentle', label: 'Мягкая', desc: 'Только явные ошибки' },
                { id: 'balanced', label: 'Реалистичная', desc: 'Грамматика + B2 слова' },
                { id: 'strict', label: 'Максимальная', desc: 'Разбор всех предлогов и мелочей' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setStrictness(s.id as any);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    strictness === s.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-xs font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">{s.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Акцент голоса ИИ
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en-US', label: '🇺🇸 Американский (US)' },
                { id: 'en-GB', label: '🇬🇧 Британский (UK)' },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setAccent(a.id as any);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    accent === a.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Guidelines */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Собственные инструкции для вашего ИИ (необязательно)
            </label>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Например: Поправляй мои артикли the/a, учи меня терминам веб-разработки и задавай вопросы про стартапы..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
          >
            Сохранить ИИ-репетитора
          </button>
        </div>
      </motion.div>
    </div>
  );
}
