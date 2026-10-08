'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Flag, Volume2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WordFlashcard } from './WordFlashcard';
import { QuizMultipleChoice } from './QuizMultipleChoice';
import { QuizFillGap } from './QuizFillGap';
import { QuizRecall } from './QuizRecall';
import { QuizWordMatch } from './QuizWordMatch';
import { QuizSentenceBuilder } from './QuizSentenceBuilder';
import { QuizListening } from './QuizListening';
import { QuizSpeaking } from './QuizSpeaking';
import { SessionResults } from './SessionResults';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

export function DailySessionModal() {
  const {
    activeSessionQuestions,
    activeSessionIndex,
    activeSessionSummary,
    submitAnswer,
    nextSessionQuestion,
    closeSession,
    profile,
    startSession,
    activeSessionDirection,
  } = useApp();

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!profile.settings.keyboardShortcuts) return;
    if (!activeSessionQuestions || activeSessionSummary) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const currentQ = activeSessionQuestions[activeSessionIndex];
        if (currentQ) {
          speakWord(currentQ.word.word);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeSessionQuestions,
    activeSessionIndex,
    activeSessionSummary,
    profile.settings.keyboardShortcuts,
  ]);

  if (!activeSessionQuestions) return null;

  // Session Completed State
  if (activeSessionSummary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <SessionResults
          summary={activeSessionSummary}
          onHome={closeSession}
          onReviewMistakes={() => {
            closeSession();
            startSession({ mode: 'mistakes' });
          }}
        />
      </div>
    );
  }

  const currentQuestion = activeSessionQuestions[activeSessionIndex];
  const totalQuestions = activeSessionQuestions.length;
  const progressPercent = Math.round(
    ((activeSessionIndex + 1) / totalQuestions) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Top Session Header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Close Button */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          title="Exit session"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar & Indicators */}
        <div className="flex-1 max-w-xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200/50 dark:border-slate-700/50">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {activeSessionIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Direction mode badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
          {activeSessionDirection === 'both' && '🔀 EN ⇄ RU (Оба)'}
          {activeSessionDirection === 'ru_en' && '🇷🇺 RU ➔ 🇬🇧 EN'}
          {activeSessionDirection === 'en_ru' && '🇬🇧 EN ➔ 🇷🇺 RU'}
        </div>

        {/* Shortcuts reminder badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          <span>Space: 🔊</span>
        </div>
      </div>

      {/* Main Question Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 max-w-3xl w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* Render Question Mode */}
            {currentQuestion.type === 'flashcard' && (
              <WordFlashcard
                word={currentQuestion.word}
                direction={currentQuestion.direction}
                onNext={() => {
                  submitAnswer(currentQuestion.word.word, true);
                  nextSessionQuestion();
                }}
                onKnowThis={() => {
                  submitAnswer(currentQuestion.word.word, true, 'easy');
                  nextSessionQuestion();
                }}
              />
            )}

            {(currentQuestion.type === 'en_ru' ||
              currentQuestion.type === 'ru_en') && (
              <QuizMultipleChoice
                question={currentQuestion}
                onAnswer={(ans, correct) => submitAnswer(ans, correct)}
                onNext={nextSessionQuestion}
              />
            )}

            {currentQuestion.type === 'fill_gap' && (
              <QuizFillGap
                question={currentQuestion}
                onAnswer={(ans, correct) => submitAnswer(ans, correct)}
                onNext={nextSessionQuestion}
              />
            )}

            {currentQuestion.type === 'recall' && (
              <QuizRecall
                question={currentQuestion}
                onAnswer={(ans, correct) => submitAnswer(ans, correct)}
                onNext={nextSessionQuestion}
              />
            )}

            {currentQuestion.type === 'word_match' && (
              <QuizWordMatch
                question={currentQuestion}
                onAnswer={(ans, correct) => submitAnswer(ans, correct)}
                onNext={nextSessionQuestion}
              />
            )}

            {currentQuestion.type === 'sentence_builder' && (
              <QuizSentenceBuilder
                question={currentQuestion}
                onAnswer={(ans, correct) => submitAnswer(ans, correct)}
                onNext={nextSessionQuestion}
              />
            )}

            {currentQuestion.type === 'listening' && (
              <QuizListening
                question={currentQuestion}
                onAnswer={(ans, correct) => submitAnswer(ans, correct)}
                onNext={nextSessionQuestion}
              />
            )}

            {currentQuestion.type === 'speaking' && (
              <QuizSpeaking
                question={currentQuestion}
                onAnswer={(ans, correct) => submitAnswer(ans, correct)}
                onNext={nextSessionQuestion}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Leave Session?
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Your answered progress for completed cards will still be saved.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep Learning
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  closeSession();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
