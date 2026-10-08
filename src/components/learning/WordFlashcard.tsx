'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Star,
  CheckCircle,
  ArrowRight,
  RotateCw,
  Sparkles,
  Eye,
  ArrowLeftRight,
  HelpCircle,
} from 'lucide-react';
import { Word } from '@/types/vocabulary';
import { useApp } from '@/context/AppContext';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

interface WordFlashcardProps {
  word: Word;
  direction?: 'en_ru' | 'ru_en';
  onNext: () => void;
  onKnowThis: () => void;
}

export function WordFlashcard({
  word,
  direction: initialDirection,
  onNext,
  onKnowThis,
}: WordFlashcardProps) {
  const { toggleFavorite, userWords, profile, activeSessionDirection } = useApp();
  const isFavorite = userWords[word.id]?.isFavorite || false;

  // Determine active direction: prop -> session setting -> default
  const defaultDir: 'en_ru' | 'ru_en' =
    initialDirection ||
    (activeSessionDirection === 'ru_en' ? 'ru_en' : 'en_ru');

  const [currentDirection, setCurrentDirection] = useState<'en_ru' | 'ru_en'>(defaultDir);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Sync if prop changes
  useEffect(() => {
    if (initialDirection) {
      setCurrentDirection(initialDirection);
    }
  }, [initialDirection]);

  // Reset flip when word changes
  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
  }, [word.id]);

  const targetLang = profile.settings.targetLang;
  const translation =
    targetLang === 'kz' && word.translation_kz
      ? word.translation_kz
      : word.translation_ru;

  const targetLangLabel = targetLang === 'kz' ? '🇰🇿 Казахский' : '🇷🇺 Русский';

  const handleListen = () => {
    sound.playTap();
    speakWord(word.word);
  };

  const handleFlipCard = () => {
    sound.playTap();
    setIsFlipped((prev) => !prev);
    // If flipping to reveal English word in ru_en mode, play audio
    if (!isFlipped && currentDirection === 'ru_en') {
      setTimeout(() => {
        speakWord(word.word);
      }, 250);
    }
  };

  const handleSwapDirection = () => {
    sound.playTap();
    setCurrentDirection((prev) => (prev === 'en_ru' ? 'ru_en' : 'en_ru'));
    setIsFlipped(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div
        className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          currentDirection === 'ru_en'
            ? 'bg-indigo-500/15'
            : 'bg-emerald-500/15'
        }`}
      />

      {/* Top Header: Level tag, Direction Switcher & Favorite */}
      <div className="flex items-center justify-between mb-5 gap-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {word.level}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {word.part_of_speech}
          </span>
        </div>

        {/* Direction Switcher Button */}
        <button
          onClick={handleSwapDirection}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
            currentDirection === 'ru_en'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
          }`}
          title="Поменять направление (Английский ⇄ Русский)"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>
            {currentDirection === 'en_ru' ? '🇬🇧 EN ➔ 🇷🇺 RU' : '🇷🇺 RU ➔ 🇬🇧 EN'}
          </span>
        </button>

        {/* Favorite Star */}
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

      {/* Interactive Card Body with Flip Animation */}
      <div
        onClick={handleFlipCard}
        className={`group relative p-6 sm:p-7 rounded-2xl border-2 transition-all cursor-pointer select-none ${
          isFlipped
            ? 'border-emerald-400/60 dark:border-emerald-500/40 bg-slate-50/70 dark:bg-slate-800/40 shadow-inner'
            : currentDirection === 'ru_en'
            ? 'border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-md hover:border-indigo-400'
            : 'border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-b from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-md hover:border-emerald-400'
        }`}
      >
        {/* Flip reminder pill at top-right of the card */}
        <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isFlipped ? 'Перевернуть обратно' : 'Нажми, чтобы перевернуть'}</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ========================================================
              MODE 1: EN -> RU (English on front, Russian on back)
             ======================================================== */}
          {currentDirection === 'en_ru' && !isFlipped && (
            <motion.div
              key="en_front"
              initial={{ opacity: 0, rotateY: -30 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 30 }}
              transition={{ duration: 0.2 }}
              className="text-center py-6"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Слово на английском
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {word.word}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                  {word.pronunciation}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListen();
                  }}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Listen pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <Eye className="w-4 h-4" />
                <span>Нажми или Пробел — показать перевод</span>
              </div>
            </motion.div>
          )}

          {currentDirection === 'en_ru' && isFlipped && (
            <motion.div
              key="en_back"
              initial={{ opacity: 0, rotateY: 30 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -30 }}
              transition={{ duration: 0.2 }}
              className="text-center py-4"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg font-bold text-slate-500 line-through">
                  {word.word}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  [{word.pronunciation}]
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListen();
                  }}
                  className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block mb-1">
                Перевод на русский
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {translation}
              </div>
            </motion.div>
          )}

          {/* ========================================================
              MODE 2: RU -> EN (Russian on front, English on back)
              This directly solves: "когда наоборот то я забываю!"
             ======================================================== */}
          {currentDirection === 'ru_en' && !isFlipped && (
            <motion.div
              key="ru_front"
              initial={{ opacity: 0, rotateY: -30 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 30 }}
              transition={{ duration: 0.2 }}
              className="text-center py-6"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2 block">
                {targetLangLabel} (Вспомни английское слово)
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {translation}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Часть речи: <strong className="text-slate-600 dark:text-slate-300">{word.part_of_speech}</strong>
              </p>

              {/* Optional hint */}
              {showHint ? (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 italic mt-3 bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  💡 Определение: {word.definition}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(true);
                  }}
                  className="mt-3 text-xs text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Показать подсказку</span>
                </button>
              )}

              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                <Eye className="w-4 h-4" />
                <span>Нажми или Пробел — проверить себя</span>
              </div>
            </motion.div>
          )}

          {currentDirection === 'ru_en' && isFlipped && (
            <motion.div
              key="ru_back"
              initial={{ opacity: 0, rotateY: 30 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -30 }}
              transition={{ duration: 0.2 }}
              className="text-center py-4"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-1">
                Английское слово
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {word.word}
              </h2>

              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                  {word.pronunciation}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListen();
                  }}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Listen pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                = {translation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Definition & Example (Always visible or enriched upon flip) */}
      <div className="py-5 space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Definition / Определение
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {word.definition}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Example sentence
          </div>
          <p className="text-sm text-slate-900 dark:text-white italic leading-relaxed">
            &ldquo;{word.example}&rdquo;
          </p>
        </div>

        {word.synonyms && word.synonyms.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Synonyms / Синонимы
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
          <span>Знаю это слово</span>
        </button>

        <button
          onClick={onNext}
          className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
        >
          <span>Далее</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
