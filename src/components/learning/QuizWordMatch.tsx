'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, Sparkles, ArrowRight } from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import { shuffleArray } from '@/lib/question-generator';
import { sound } from '@/lib/sound';

interface QuizWordMatchProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizWordMatch({ question, onAnswer, onNext }: QuizWordMatchProps) {
  const rawPairs = question.matchPairs || [];

  // Prepare left (en) and right (target) arrays
  const [leftItems, setLeftItems] = useState<{ id: string; text: string }[]>([]);
  const [rightItems, setRightItems] = useState<{ id: string; text: string }[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize randomized columns
  useEffect(() => {
    if (rawPairs.length > 0) {
      setLeftItems(shuffleArray(rawPairs.map((p) => ({ id: p.id, text: p.en }))));
      setRightItems(shuffleArray(rawPairs.map((p) => ({ id: p.id, text: p.target }))));
    }
  }, [rawPairs]);

  // Timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // Check matching
  useEffect(() => {
    if (selectedLeft && selectedRight) {
      if (selectedLeft === selectedRight) {
        // Matched!
        sound.playCorrect();
        const nextMatched = [...matchedIds, selectedLeft];
        setMatchedIds(nextMatched);
        setSelectedLeft(null);
        setSelectedRight(null);

        if (nextMatched.length === rawPairs.length) {
          setIsFinished(true);
          sound.playFanfare();
          onAnswer('all_matched', true);
        }
      } else {
        // Mismatch
        sound.playWrong();
        const t = setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);
        return () => clearTimeout(t);
      }
    }
  }, [selectedLeft, selectedRight, matchedIds, rawPairs.length, onAnswer]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mini-Game
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Word Match
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm font-semibold">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span>{formatTimer(seconds)}</span>
        </div>
      </div>

      {!isFinished ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Left Column (English words) */}
          <div className="space-y-2.5">
            {leftItems.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedLeft === item.id;
              if (isMatched) return <div key={item.id} className="h-12" />;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playTap();
                    setSelectedLeft(item.id);
                  }}
                  className={`w-full h-12 px-4 rounded-2xl border-2 font-bold text-sm text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  {item.text}
                </button>
              );
            })}
          </div>

          {/* Right Column (Translations) */}
          <div className="space-y-2.5">
            {rightItems.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedRight === item.id;
              if (isMatched) return <div key={item.id} className="h-12" />;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playTap();
                    setSelectedRight(item.id);
                  }}
                  className={`w-full h-12 px-4 rounded-2xl border-2 font-semibold text-sm text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center mb-6"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Completed in {seconds} seconds!
          </h3>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            +50 XP Earned
          </p>
        </motion.div>
      )}

      {isFinished && (
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
