'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { SpeechFeedback } from '@/types/ai';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

interface SpeechFeedbackCardProps {
  feedback: SpeechFeedback;
}

export function SpeechFeedbackCard({ feedback }: SpeechFeedbackCardProps) {
  const handleListenWord = (word: string) => {
    sound.playTap();
    speakWord(word);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-800/80 dark:via-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs space-y-3"
    >
      {/* Header bar: Score & CEFR Level */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Разбор и фидбэк вашей речи</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-[10px] font-black uppercase">
            Уровень: {feedback.estimatedLevel}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
            Беглость: {feedback.fluencyScore}%
          </span>
        </div>
      </div>

      {/* Grammar Correction Section (if mistake found) */}
      {feedback.hasMistake && feedback.correction ? (
        <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Как исправить ошибку:</span>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="line-through font-mono text-rose-500 bg-rose-100/60 dark:bg-rose-900/40 px-1.5 py-0.5 rounded">
              {feedback.correction.original}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
              {feedback.correction.corrected}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-0.5 leading-relaxed">
            💡 {feedback.correction.rule}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Грамматика чистая! Предложение построено верно.</span>
        </div>
      )}

      {/* Vocabulary Upgrade (Level up simple words to B2/C1) */}
      {feedback.vocabularyUpgrade && (
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Улучшение словарного запаса (B2 / C1):</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-200">
            Вместо <span className="italic font-medium text-slate-500">&ldquo;{feedback.vocabularyUpgrade.used}&rdquo;</span> скажите{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold underline">
              {feedback.vocabularyUpgrade.betterAlternative}
            </strong>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Пример: &ldquo;{feedback.vocabularyUpgrade.example}&rdquo;
          </p>
        </div>
      )}

      {/* Pronunciation & Phonetics Tip */}
      {feedback.pronunciationTip && (
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-xs gap-2">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>🗣️ Произношение:</span>
              <strong className="text-indigo-600 dark:text-indigo-400">
                {feedback.pronunciationTip.word}
              </strong>
              <span className="font-mono text-[11px] text-slate-400">
                [{feedback.pronunciationTip.phonetic}]
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {feedback.pronunciationTip.tip}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleListenWord(feedback.pronunciationTip!.word)}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors shrink-0"
            title="Послушать произношение"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
