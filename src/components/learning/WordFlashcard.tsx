'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Star, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Word } from '@/types/vocabulary';
import { useApp } from '@/context/AppContext';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

interface WordFlashcardProps {
  word: Word;
  onNext: () => void;
  onKnowThis: () => void;
}

export function WordFlashcard({ word, onNext, onKnowThis }: WordFlashcardProps) {
  const { toggleFavorite, userWords, profile } = useApp();
  const isFavorite = userWords[word.id]?.isFavorite || false;

  const handleListen = () => {
    sound.playTap();
    speakWord(word.word);
  };

  const translation =
    profile.settings.targetLang === 'kz' && word.translation_kz
      ? word.translation_kz
      : word.translation_ru;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header tags */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {word.level}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {word.part_of_speech}
          </span>
        </div>

        <button
          onClick={() => toggleFavorite(word.id)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isFavorite
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Mark as favorite"
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-500' : ''}`} />
        </button>
      </div>

      {/* Main Word & Pronunciation */}
      <div className="text-center py-4">
        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          {word.word}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
            {word.pronunciation}
          </span>
          <button
            onClick={handleListen}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            title="Listen pronunciation (Space)"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Translation */}
      <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {translation}
        </div>
      </div>

      {/* Definition & Example */}
      <div className="py-6 space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Definition
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {word.definition}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Example
          </div>
          <p className="text-sm text-slate-900 dark:text-white italic leading-relaxed">
            &ldquo;{word.example}&rdquo;
          </p>
        </div>

        {word.synonyms && word.synonyms.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Synonyms
            </div>
            <div className="flex flex-wrap gap-1.5">
              {word.synonyms.map((syn) => (
                <span
                  key={syn}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  {syn}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onKnowThis}
          className="w-full sm:w-auto flex-1 py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>I know this word</span>
        </button>

        <button
          onClick={onNext}
          className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
        >
          <span>Learn Word</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
