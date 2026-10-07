'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import { sound } from '@/lib/sound';

interface QuizFillGapProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizFillGap({ question, onAnswer, onNext }: QuizFillGapProps) {
  const [typedInput, setTypedInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const cleanCorrect = question.correctAnswer.toLowerCase().trim();

  const handleOptionClick = (optionLabel: string, correct: boolean) => {
    if (hasAnswered) return;
    setSelectedOption(optionLabel);
    setHasAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    onAnswer(optionLabel, correct);
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasAnswered || !typedInput.trim()) return;

    const correct = typedInput.toLowerCase().trim() === cleanCorrect;
    setHasAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    onAnswer(typedInput.trim(), correct);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative">
      <div className="text-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {question.title}
        </span>
        <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
            {question.prompt}
          </p>
        </div>
        {question.secondaryPrompt && (
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {question.secondaryPrompt}
          </p>
        )}
      </div>

      {/* Either Options or Typed Input */}
      {question.options && question.options.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === option.label;
            let style =
              'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300';

            if (hasAnswered) {
              if (option.isCorrect) {
                style =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200';
              } else if (isSelected && !option.isCorrect) {
                style =
                  'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300';
              } else {
                style = 'opacity-40 border-slate-100';
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.label, option.isCorrect)}
                disabled={hasAnswered}
                className={`p-3.5 rounded-2xl border-2 font-bold text-sm text-center transition-all cursor-pointer ${style}`}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleTypedSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              disabled={hasAnswered}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Type the missing word..."
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
            {!hasAnswered && (
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="absolute right-3 top-3 p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 cursor-pointer"
              >
                <CornerDownLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Feedback banner */}
      <AnimatePresence>
        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl mb-6 ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? (
                <>
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
                    Excellent! +15 XP
                  </span>
                </>
              ) : (
                <>
                  <span className="font-bold text-sm text-amber-800 dark:text-amber-200">
                    Not quite
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Answer: <strong className="text-emerald-600">{question.word.word}</strong> ({question.word.translation_ru})
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {hasAnswered && (
        <button
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
