'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  AlertCircle,
  Volume2,
  Lightbulb,
  Puzzle,
  Brain,
  Delete,
  RotateCcw,
} from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import { levenshteinDistance } from '@/lib/question-generator';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';
import { getWordMnemonic } from '@/lib/mnemonics';

interface QuizRecallProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizRecall({ question, onAnswer, onNext }: QuizRecallProps) {
  const [typedInput, setTypedInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [resultState, setResultState] = useState<'perfect' | 'almost' | 'wrong'>('perfect');

  // Hint states
  const [showFirstLetter, setShowFirstLetter] = useState(false);
  const [showScramble, setShowScramble] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const targetWord = question.correctAnswer.toLowerCase().trim();
  const mnemonic = getWordMnemonic(question.word);

  // Scrambled letters for anagram tiles
  const scrambledLetters = useMemo(() => {
    const letters = targetWord.split('');
    // Fisher-Yates shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // Ensure it's not identical to the target word if length > 2
    if (letters.join('') === targetWord && letters.length > 2) {
      [letters[0], letters[1]] = [letters[1], letters[0]];
    }
    return letters;
  }, [targetWord]);

  // Masked string: "a _ _ _ _ _ (6 букв)"
  const maskedWord = useMemo(() => {
    if (!targetWord) return '';
    const first = targetWord[0].toUpperCase();
    const rest = Array(targetWord.length - 1).fill('_').join(' ');
    return `${first} ${rest} (${targetWord.length} букв)`;
  }, [targetWord]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (hasAnswered || !typedInput.trim()) return;

    const userText = typedInput.toLowerCase().trim();
    const distance = levenshteinDistance(userText, targetWord);

    let state: 'perfect' | 'almost' | 'wrong' = 'wrong';
    let isCorrectAnswer = false;

    if (userText === targetWord) {
      state = 'perfect';
      isCorrectAnswer = true;
      sound.playCorrect();
    } else if (distance <= 2 && targetWord.length >= 4) {
      // Typo tolerance (Almost correct!)
      state = 'almost';
      isCorrectAnswer = true;
      sound.playCorrect();
    } else {
      state = 'wrong';
      isCorrectAnswer = false;
      sound.playWrong();
    }

    setResultState(state);
    setHasAnswered(true);
    onAnswer(userText, isCorrectAnswer);
  };

  const handleTileClick = (letter: string) => {
    if (hasAnswered) return;
    sound.playTap();
    setTypedInput((prev) => prev + letter);
  };

  const handleBackspace = () => {
    sound.playTap();
    setTypedInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    sound.playTap();
    setTypedInput('');
  };

  // Render character by character comparison for almost/wrong states
  const renderTypoHighlight = () => {
    const user = typedInput.toLowerCase().trim();
    return (
      <div className="mt-2 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-16">Вы написали:</span>
          <span className="font-mono font-bold tracking-wider text-rose-500 line-through">
            {user || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-16">Правильно:</span>
          <span className="font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
            {targetWord}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>🇷🇺 RU ➔ 🇬🇧 EN • Вспомни английское слово</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {question.prompt}
        </h2>
        {question.secondaryPrompt && (
          <p className="text-xs text-slate-500 mt-1">
            {question.secondaryPrompt}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            autoFocus
            disabled={hasAnswered}
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Напишите слово на английском..."
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75 tracking-wide"
          />
          {!hasAnswered && (
            <button
              type="submit"
              disabled={!typedInput.trim()}
              className="absolute right-3 top-3 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 cursor-pointer shadow-md shadow-indigo-600/20"
              title="Отправить ответ (Enter)"
            >
              <CornerDownLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Helper / Hint Tools (First Letter, Scramble, Mnemonic) */}
      {!hasAnswered && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setShowFirstLetter(!showFirstLetter);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showFirstLetter
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{showFirstLetter ? 'Скрыть первую букву' : '💡 Первая буква'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setShowScramble(!showScramble);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showScramble
                  ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Puzzle className="w-3.5 h-3.5 text-indigo-500" />
              <span>{showScramble ? 'Скрыть буквы' : '🧩 Буквы (Scramble)'}</span>
            </button>

            {mnemonic && (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setShowMnemonic(!showMnemonic);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  showMnemonic
                    ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span>{showMnemonic ? 'Скрыть подсказку' : '🧠 Ассоциация'}</span>
              </button>
            )}
          </div>

          {/* Masked Letter Hint Box */}
          {showFirstLetter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center font-mono font-black text-amber-800 dark:text-amber-200 text-base tracking-widest"
            >
              {maskedWord}
            </motion.div>
          )}

          {/* Mnemonic Hint Box */}
          {showMnemonic && mnemonic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center text-xs text-purple-900 dark:text-purple-200 font-semibold italic"
            >
              {mnemonic}
            </motion.div>
          )}

          {/* Interactive Scrambled Letter Tiles */}
          {showScramble && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80"
            >
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center mb-2.5">
                Нажимайте на буквы, чтобы составить слово:
              </div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {scrambledLetters.map((char, idx) => (
                  <button
                    key={`${char}-${idx}`}
                    type="button"
                    onClick={() => handleTileClick(char)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 font-black text-base hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center uppercase"
                  >
                    {char}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleBackspace}
                  className="px-3 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  title="Удалить последнюю букву"
                >
                  <Delete className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center"
                  title="Очистить всё поле"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Recall feedback banner */}
      <AnimatePresence>
        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl mb-6 ${
              resultState === 'perfect'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
                : resultState === 'almost'
                ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60'
            }`}
          >
            {resultState === 'perfect' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-base text-emerald-800 dark:text-emerald-200">
                    Отлично! +20 XP
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {question.explanation}
                </p>
              </div>
            )}

            {resultState === 'almost' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-base text-amber-800 dark:text-amber-200">
                    Почти правильно (небольшая опечатка) +15 XP
                  </span>
                </div>
                {renderTypoHighlight()}
              </div>
            )}

            {resultState === 'wrong' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-base text-rose-800 dark:text-rose-200">
                    Не совсем верно
                  </span>
                </div>
                {renderTypoHighlight()}
              </div>
            )}

            {/* Mnemonic reinforcement after answer */}
            {mnemonic && (
              <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-300/40 dark:border-purple-700/40 text-purple-950 dark:text-purple-200 text-xs">
                <span className="font-bold flex items-center gap-1 mb-0.5 text-purple-700 dark:text-purple-300">
                  <Brain className="w-3.5 h-3.5 text-purple-500" />
                  <span>Мнемоника для памяти:</span>
                </span>
                <span className="italic">{mnemonic}</span>
              </div>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  speakWord(question.word.word);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Послушать: {question.word.word} [{question.word.pronunciation}]</span>
              </button>
            </div>

            {question.exampleSentence && (
              <p className="text-xs text-slate-500 italic mt-2">
                &ldquo;{question.exampleSentence}&rdquo;
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {hasAnswered && (
        <button
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Далее</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
