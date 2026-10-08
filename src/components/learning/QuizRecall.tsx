'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, CornerDownLeft, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import { levenshteinDistance } from '@/lib/question-generator';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

interface QuizRecallProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizRecall({ question, onAnswer, onNext }: QuizRecallProps) {
  const [typedInput, setTypedInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [resultState, setResultState] = useState<'perfect' | 'almost' | 'wrong'>('perfect');

  const targetWord = question.correctAnswer.toLowerCase().trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  // Render character by character comparison for almost/wrong states
  const renderTypoHighlight = () => {
    const user = typedInput.toLowerCase().trim();
    return (
      <div className="mt-2 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-16">You wrote:</span>
          <span className="font-mono font-bold tracking-wider text-rose-500 line-through">
            {user}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-16">Correct:</span>
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

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            autoFocus
            disabled={hasAnswered}
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Type the English word..."
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75 tracking-wide"
          />
          {!hasAnswered && (
            <button
              type="submit"
              disabled={!typedInput.trim()}
              className="absolute right-3 top-3 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <CornerDownLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

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
                    Perfect! +20 XP
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
                    Almost correct (minor typo) +15 XP
                  </span>
                </div>
                {renderTypoHighlight()}
              </div>
            )}

            {resultState === 'wrong' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-base text-rose-800 dark:text-rose-200">
                    Not quite
                  </span>
                </div>
                {renderTypoHighlight()}
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
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
