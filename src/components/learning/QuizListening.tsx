'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Volume1, Check, X, ArrowRight, CornerDownLeft, Sparkles, RefreshCw } from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

interface QuizListeningProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizListening({ question, onAnswer, onNext }: QuizListeningProps) {
  const [typedInput, setTypedInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const targetWord = (question.audioText || question.word.word).toLowerCase().trim();

  // Play audio on first mount safely
  useEffect(() => {
    const t = setTimeout(() => {
      handlePlayAudio(0.9);
    }, 350);
    return () => clearTimeout(t);
  }, [targetWord]);

  const handlePlayAudio = async (rate = 0.9) => {
    sound.playTap();
    setIsPlaying(true);
    try {
      await speakWord(targetWord, 'en-US', rate);
    } finally {
      setIsPlaying(false);
    }
  };

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

    const correct = typedInput.toLowerCase().trim() === targetWord;
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Listening Challenge</span>
        </div>

        {/* Audio Buttons */}
        <div className="mt-4 mb-3 flex flex-col items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              isPlaying
                ? {
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
                      '0 15px 30px -5px rgba(16, 185, 129, 0.6)',
                      '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
                    ],
                    transition: { repeat: Infinity, duration: 1 },
                  }
                : {}
            }
            onClick={() => handlePlayAudio(0.9)}
            className="w-24 h-24 rounded-3xl bg-emerald-500 hover:bg-emerald-600 text-white flex flex-col items-center justify-center gap-1.5 shadow-xl shadow-emerald-500/25 cursor-pointer transition-colors"
          >
            <Volume2 className="w-10 h-10" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isPlaying ? 'Playing...' : 'Play'}
            </span>
          </motion.button>

          {/* Slow speed replay option */}
          <button
            onClick={() => handlePlayAudio(0.7)}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Volume1 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Play Slower (0.7x)</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tap to replay audio. Identify the spoken English word.
        </p>
      </div>

      {question.options && question.options.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.label;
            let style =
              'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300';

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
              autoFocus
              disabled={hasAnswered}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Type what you hear..."
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-75"
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
              Word: <strong className="text-emerald-600">{question.word.word}</strong> [
              {question.word.pronunciation}] — {question.word.translation_ru}
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
