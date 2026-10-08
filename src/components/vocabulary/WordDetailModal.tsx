'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, Star, RotateCcw, Play, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { Word } from '@/types/vocabulary';
import { useApp } from '@/context/AppContext';
import { formatNextReviewTime } from '@/lib/srs';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

interface WordDetailModalProps {
  word: Word | null;
  onClose: () => void;
}

export function WordDetailModal({ word, onClose }: WordDetailModalProps) {
  const { userWords, toggleFavorite, resetWordProgress, startSession, profile } = useApp();

  if (!word) return null;

  const uw = userWords[word.id];
  const isFav = uw?.isFavorite || false;
  const translation =
    profile.settings.targetLang === 'kz' && word.translation_kz
      ? word.translation_kz
      : word.translation_ru;

  const handleListen = () => {
    sound.playTap();
    speakWord(word.word);
  };

  const handlePracticeWord = (dir: 'both' | 'ru_en' | 'en_ru' = 'both') => {
    sound.playTap();
    onClose();
    startSession({ mode: 'daily', direction: dir });
  };

  const handleResetProgress = () => {
    sound.playTap();
    resetWordProgress(word.id);
  };

  const nextReview = uw?.nextReviewAt ? formatNextReviewTime(uw.nextReviewAt) : 'Ready';

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
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Level & Category Tags */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {word.level}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {word.part_of_speech}
          </span>
          {uw && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {uw.status}
            </span>
          )}
        </div>

        {/* Word, Pronounce, and Favorite */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {word.word}
              </h2>
              <button
                onClick={handleListen}
                className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                title="Pronounce"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm font-mono text-slate-400 mt-1">
              {word.pronunciation}
            </div>
          </div>

          <button
            onClick={() => toggleFavorite(word.id)}
            className={`p-3 rounded-2xl transition-colors cursor-pointer ${
              isFav
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
            }`}
          >
            <Star className={`w-6 h-6 ${isFav ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Translation */}
        <div className="mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {translation}
          </div>
        </div>

        {/* Definition and Example */}
        <div className="py-4 space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Definition
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
              {word.definition}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Example
            </div>
            <p className="text-sm text-slate-900 dark:text-white italic">
              &ldquo;{word.example}&rdquo;
            </p>
          </div>

          {word.synonyms && word.synonyms.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Synonyms
              </div>
              <div className="flex flex-wrap gap-1.5">
                {word.synonyms.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spaced Repetition Stats */}
        {uw && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 my-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Spaced Repetition Stats
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900">
                <span className="text-slate-400 block">Memory</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {uw.memoryStrength}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900">
                <span className="text-slate-400 block">Correct</span>
                <span className="font-bold text-emerald-500 text-sm">
                  {uw.correctCount}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900">
                <span className="text-slate-400 block">Errors</span>
                <span className="font-bold text-rose-500 text-sm">
                  {uw.incorrectCount}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 text-center">
              Next Review: <strong className="text-slate-700 dark:text-slate-300">{nextReview}</strong>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={() => handlePracticeWord('both')}
            className="w-full sm:flex-1 py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            title="Тренировка в обоих направлениях (EN ⇄ RU)"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Учить (EN ⇄ RU)</span>
          </button>

          <button
            onClick={() => handlePracticeWord('ru_en')}
            className="w-full sm:flex-1 py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            title="Тренировка вспоминания английского слова по русскому переводу"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Вспомнить (RU ➔ EN)</span>
          </button>

          {uw && (
            <button
              onClick={handleResetProgress}
              className="w-full sm:w-auto py-3 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
              title="Сбросить прогресс слова"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сброс</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
