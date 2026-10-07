'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import { sound } from '@/lib/sound';

interface QuizSentenceBuilderProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizSentenceBuilder({
  question,
  onAnswer,
  onNext,
}: QuizSentenceBuilderProps) {
  const initialTokens = question.scrambledTokens || [];
  const [availableTokens, setAvailableTokens] = useState<string[]>(initialTokens);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const cleanTarget = (question.correctAnswer || '').toLowerCase().replace(/[.!?]/g, '').trim();

  const handleSelectToken = (token: string, index: number) => {
    if (hasAnswered) return;
    sound.playTap();
    const nextAvail = [...availableTokens];
    nextAvail.splice(index, 1);
    setAvailableTokens(nextAvail);
    setSelectedTokens([...selectedTokens, token]);
  };

  const handleRemoveToken = (token: string, index: number) => {
    if (hasAnswered) return;
    sound.playTap();
    const nextSelected = [...selectedTokens];
    nextSelected.splice(index, 1);
    setSelectedTokens(nextSelected);
    setAvailableTokens([...availableTokens, token]);
  };

  const handleReset = () => {
    if (hasAnswered) return;
    sound.playTap();
    setAvailableTokens(initialTokens);
    setSelectedTokens([]);
  };

  const handleCheck = () => {
    if (hasAnswered || selectedTokens.length === 0) return;

    const userSentence = selectedTokens.join(' ').toLowerCase().trim();
    const correct = userSentence === cleanTarget;

    setHasAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    onAnswer(selectedTokens.join(' '), correct);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative">
      <div className="text-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Sentence Builder
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {question.prompt}
        </h2>
        {question.secondaryPrompt && (
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            {question.secondaryPrompt}
          </p>
        )}
      </div>

      {/* Assembly Area */}
      <div className="min-h-24 p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 mb-6 flex flex-wrap gap-2 items-center">
        {selectedTokens.length === 0 ? (
          <p className="text-xs text-slate-400 italic mx-auto">
            Tap words below to build the sentence in order
          </p>
        ) : (
          selectedTokens.map((token, idx) => (
            <motion.button
              key={`${token}-${idx}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => handleRemoveToken(token, idx)}
              disabled={hasAnswered}
              className="py-2 px-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm font-semibold text-sm text-slate-900 dark:text-white hover:border-rose-400 cursor-pointer"
            >
              {token}
            </motion.button>
          ))
        )}
      </div>

      {/* Available Word Chips */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {availableTokens.map((token, idx) => (
          <button
            key={`${token}-${idx}`}
            onClick={() => handleSelectToken(token, idx)}
            disabled={hasAnswered}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-sm text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {token}
          </button>
        ))}
      </div>

      {/* Actions */}
      {!hasAnswered ? (
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={selectedTokens.length === 0}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleCheck}
            disabled={selectedTokens.length === 0}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 disabled:opacity-40 cursor-pointer transition-all"
          >
            Check Sentence
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {isCorrect ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Correct! +15 XP</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-rose-500" />
                  <span>Not quite</span>
                </>
              )}
            </div>
            <p className="text-xs">
              Correct: &ldquo;{question.exampleSentence}&rdquo;
            </p>
          </div>

          <button
            onClick={onNext}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
