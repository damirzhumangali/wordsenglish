'use client';

import React from 'react';
import { Volume2, Sparkles, BookOpen, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

export function WordOfTheDayCard() {
  const { words, toggleFavorite, userWords, startSession } = useApp();

  // Find "significant" or pick curated featured word
  const dailyWord =
    words.find((w) => w.word.toLowerCase() === 'significant') || words[0];

  const isFavorite = userWords[dailyWord.id]?.isFavorite || false;

  const handleListen = () => {
    sound.playTap();
    speakWord(dailyWord.word);
  };

  const handleLearn = () => {
    sound.playTap();
    startSession({ mode: 'daily' });
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Word of the Day</span>
        </div>

        <button
          onClick={() => toggleFavorite(dailyWord.id)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isFavorite
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title="Save to favorites"
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
        </button>
      </div>

      <div className="mt-2">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {dailyWord.word.toUpperCase()}
          </h3>
          <button
            onClick={handleListen}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Listen"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs font-mono text-slate-400 mt-0.5">
          {dailyWord.pronunciation} • {dailyWord.part_of_speech}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
          {dailyWord.translation_ru}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
          {dailyWord.definition}
        </p>
      </div>

      <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          &ldquo;{dailyWord.example}&rdquo;
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleLearn}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Learn Word in Context</span>
        </button>
      </div>
    </div>
  );
}
