'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Volume2, ArrowRight } from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

interface QuizMultipleChoiceProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizMultipleChoice({
  question,
  onAnswer,
  onNext,
}: QuizMultipleChoiceProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  const handleSelect = (optionId: string, label: string, correct: boolean) => {
    if (hasAnswered) return;
    setSelectedOptionId(optionId);
    setHasAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    onAnswer(label, correct);
  };

  const handlePlayAudio = () => {
    sound.playTap();
    speakWord(question.word.word);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative">
      {/* Title / Question context */}
      <div className="text-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {question.title}
        </span>
        <div className="mt-3 flex items-center justify-center gap-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {question.prompt}
          </h2>
          {question.type === 'en_ru' && (
            <button
              onClick={handlePlayAudio}
              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
              title="Listen (Space)"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>
        {question.secondaryPrompt && (
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {question.secondaryPrompt}
          </p>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {question.options?.map((option, index) => {
          const isSelected = selectedOptionId === option.id;
          let btnStyle =
            'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700';

          if (hasAnswered) {
            if (option.isCorrect) {
              btnStyle =
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 shadow-sm';
            } else if (isSelected && !option.isCorrect) {
              btnStyle =
                'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300';
            } else {
              btnStyle =
                'border-slate-100 dark:border-slate-800/50 opacity-40 text-slate-400';
            }
          }

          return (
            <motion.button
              key={option.id}
              whileTap={!hasAnswered ? { scale: 0.98 } : {}}
              onClick={() =>
                handleSelect(option.id, option.label, option.isCorrect)
              }
              disabled={hasAnswered}
              className={`p-4 rounded-2xl border-2 font-semibold text-sm sm:text-base text-left flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span>{option.label}</span>
              </div>
              {hasAnswered && option.isCorrect && (
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              {hasAnswered && isSelected && !option.isCorrect && (
                <X className="w-5 h-5 text-rose-500" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Answer feedback banner */}
      <AnimatePresence>
        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
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
                    Correct! +10 XP
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

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {question.explanation}
            </p>

            {question.exampleSentence && (
              <p className="text-xs text-slate-500 italic mt-1">
                &ldquo;{question.exampleSentence}&rdquo;
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      {hasAnswered && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
