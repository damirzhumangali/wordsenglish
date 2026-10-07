'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Zap,
  Layers,
  Swords,
  Timer,
  Trophy,
  Flame,
  Heart,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { shuffleArray } from '@/lib/question-generator';
import { sound } from '@/lib/sound';

type ActiveGame = 'hub' | 'speed' | 'memory' | 'battle';

export default function GamesPage() {
  const { words, profile } = useApp();
  const [activeGame, setActiveGame] = useState<ActiveGame>('hub');

  // ----------------------------------------------------
  // GAME 1: SPEED QUIZ (60 SECONDS RAPID FIRE)
  // ----------------------------------------------------
  const [speedSeconds, setSpeedSeconds] = useState(60);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedStreak, setSpeedStreak] = useState(0);
  const [speedWrong, setSpeedWrong] = useState(0);
  const [speedActiveQuestion, setSpeedActiveQuestion] = useState<{
    word: string;
    correct: string;
    options: string[];
  } | null>(null);
  const [speedFinished, setSpeedFinished] = useState(false);

  const startSpeedQuiz = () => {
    sound.playTap();
    setSpeedSeconds(60);
    setSpeedScore(0);
    setSpeedStreak(0);
    setSpeedWrong(0);
    setSpeedFinished(false);
    setActiveGame('speed');
    nextSpeedQuestion();
  };

  const nextSpeedQuestion = () => {
    const target = words[Math.floor(Math.random() * words.length)];
    const otherTranslations = words
      .filter((w) => w.id !== target.id)
      .map((w) => w.translation_ru);
    const distractors = shuffleArray(otherTranslations).slice(0, 3);
    const opts = shuffleArray([target.translation_ru, ...distractors]);

    setSpeedActiveQuestion({
      word: target.word,
      correct: target.translation_ru,
      options: opts,
    });
  };

  useEffect(() => {
    if (activeGame !== 'speed' || speedFinished) return;
    const interval = setInterval(() => {
      setSpeedSeconds((prev) => {
        if (prev <= 1) {
          setSpeedFinished(true);
          sound.playFanfare();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeGame, speedFinished]);

  const handleSpeedAnswer = (option: string) => {
    if (!speedActiveQuestion || speedFinished) return;
    if (option === speedActiveQuestion.correct) {
      sound.playCorrect();
      setSpeedScore((s) => s + 1);
      setSpeedStreak((str) => str + 1);
    } else {
      sound.playWrong();
      setSpeedWrong((w) => w + 1);
      setSpeedStreak(0);
    }
    nextSpeedQuestion();
  };

  // ----------------------------------------------------
  // GAME 2: MEMORY CARDS (FLIP AND MATCH)
  // ----------------------------------------------------
  const [memoryCards, setMemoryCards] = useState<
    { id: string; wordId: string; text: string; isFlipped: boolean; isMatched: boolean }[]
  >([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryFinished, setMemoryFinished] = useState(false);

  const startMemoryGame = () => {
    sound.playTap();
    setMemoryMoves(0);
    setMemoryFinished(false);
    setFlippedIndices([]);
    setActiveGame('memory');

    const sample = shuffleArray(words).slice(0, 6);
    const cards: { id: string; wordId: string; text: string; isFlipped: boolean; isMatched: boolean }[] = [];

    sample.forEach((w) => {
      cards.push({ id: `en-${w.id}`, wordId: w.id, text: w.word, isFlipped: false, isMatched: false });
      cards.push({ id: `ru-${w.id}`, wordId: w.id, text: w.translation_ru, isFlipped: false, isMatched: false });
    });

    setMemoryCards(shuffleArray(cards));
  };

  const handleCardClick = (idx: number) => {
    if (memoryCards[idx].isFlipped || memoryCards[idx].isMatched || flippedIndices.length >= 2) return;

    sound.playTap();
    const updated = [...memoryCards];
    updated[idx].isFlipped = true;
    setMemoryCards(updated);

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      if (memoryCards[firstIdx].wordId === memoryCards[secondIdx].wordId) {
        // Matched!
        sound.playCorrect();
        setTimeout(() => {
          const matchedState = [...memoryCards];
          matchedState[firstIdx].isMatched = true;
          matchedState[secondIdx].isMatched = true;
          setMemoryCards(matchedState);
          setFlippedIndices([]);

          if (matchedState.every((c) => c.isMatched)) {
            setMemoryFinished(true);
            sound.playFanfare();
          }
        }, 400);
      } else {
        // Mismatch
        sound.playWrong();
        setTimeout(() => {
          const resetFlipped = [...memoryCards];
          resetFlipped[firstIdx].isFlipped = false;
          resetFlipped[secondIdx].isFlipped = false;
          setMemoryCards(resetFlipped);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  // ----------------------------------------------------
  // GAME 3: VOCABULARY BATTLE (1v1 VS AI OPPONENT)
  // ----------------------------------------------------
  const [playerHp, setPlayerHp] = useState(3);
  const [aiHp, setAiHp] = useState(3);
  const [battleQuestion, setBattleQuestion] = useState<{
    word: string;
    prompt: string;
    correct: string;
    options: string[];
  } | null>(null);
  const [battleFinished, setBattleFinished] = useState(false);
  const [battleOutcome, setBattleOutcome] = useState<'win' | 'lose' | null>(null);
  const [isAttacking, setIsAttacking] = useState<'player' | 'ai' | null>(null);

  const startBattle = () => {
    sound.playTap();
    setPlayerHp(3);
    setAiHp(3);
    setBattleFinished(false);
    setBattleOutcome(null);
    setIsAttacking(null);
    setActiveGame('battle');
    nextBattleQuestion();
  };

  const nextBattleQuestion = () => {
    const target = words[Math.floor(Math.random() * words.length)];
    const otherTranslations = words
      .filter((w) => w.id !== target.id)
      .map((w) => w.translation_ru);
    const distractors = shuffleArray(otherTranslations).slice(0, 3);
    const opts = shuffleArray([target.translation_ru, ...distractors]);

    setBattleQuestion({
      word: target.word,
      prompt: `What is the meaning of "${target.word}"?`,
      correct: target.translation_ru,
      options: opts,
    });
  };

  const handleBattleAnswer = (option: string) => {
    if (!battleQuestion || battleFinished || isAttacking) return;

    if (option === battleQuestion.correct) {
      sound.playCorrect();
      setIsAttacking('player');

      setTimeout(() => {
        const nextAiHp = aiHp - 1;
        setAiHp(nextAiHp);
        setIsAttacking(null);

        if (nextAiHp <= 0) {
          setBattleFinished(true);
          setBattleOutcome('win');
          sound.playFanfare();
        } else {
          nextBattleQuestion();
        }
      }, 700);
    } else {
      sound.playWrong();
      setIsAttacking('ai');

      setTimeout(() => {
        const nextPlayerHp = playerHp - 1;
        setPlayerHp(nextPlayerHp);
        setIsAttacking(null);

        if (nextPlayerHp <= 0) {
          setBattleFinished(true);
          setBattleOutcome('lose');
        } else {
          nextBattleQuestion();
        }
      }, 700);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Arcade & Games Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Train lexical reflexes and high-speed retrieval through gamified challenges.
          </p>
        </div>

        {activeGame !== 'hub' && (
          <button
            onClick={() => {
              sound.playTap();
              setActiveGame('hub');
            }}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer self-start sm:self-auto"
          >
            ← Back to Games Hub
          </button>
        )}
      </div>

      {/* ----------------- HUB VIEW ----------------- */}
      {activeGame === 'hub' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Speed Quiz */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Speed Quiz
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Answer as many words as possible in a 60-second rapid fire sprint. Earn massive streak bonuses.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-500">
                <Timer className="w-4 h-4" />
                <span>60 Seconds • +120 XP</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={startSpeedQuiz}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Play Speed Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Memory Cards */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Memory Cards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Flip face-down cards to discover matching pairs between English words and translations.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-500">
                <Sparkles className="w-4 h-4" />
                <span>Visual Recall • +80 XP</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={startMemoryGame}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Play Memory Cards</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Vocabulary Battle */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Swords className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Vocabulary Battle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Duel against the Vocab AI in a turn-based 3-heart showdown. Attack with correct translations!
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-500">
                <Heart className="w-4 h-4 fill-rose-500" />
                <span>PvAI Duel • +150 XP</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={startBattle}
                className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Enter Battle Arena</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SPEED QUIZ RUNNER ----------------- */}
      {activeGame === 'speed' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-rose-500 font-mono text-xl font-black">
              <Timer className="w-5 h-5" />
              <span>{String(speedSeconds).padStart(2, '0')}s</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-slate-900 dark:text-white">Score: {speedScore}</span>
              <span className="flex items-center gap-1 text-amber-500">
                <Flame className="w-4 h-4 fill-amber-500" />
                <span>{speedStreak}</span>
              </span>
            </div>
          </div>

          {!speedFinished && speedActiveQuestion ? (
            <div>
              <div className="text-center py-6 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Translate Word
                </span>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                  {speedActiveQuestion.word}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {speedActiveQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSpeedAnswer(opt)}
                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-amber-500 font-bold text-sm text-left transition-all cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-3" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Time&apos;s Up!
              </h3>
              <div className="my-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-sm font-semibold">
                Score: {speedScore} Correct • {speedWrong} Wrong
              </div>
              <p className="text-xs font-bold text-emerald-500">+120 XP Added to Profile</p>
              <button
                onClick={startSpeedQuiz}
                className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------- MEMORY CARDS RUNNER ----------------- */}
      {activeGame === 'memory' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Memory Cards Matching
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Moves: {memoryMoves}
            </span>
          </div>

          {!memoryFinished ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {memoryCards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  disabled={card.isFlipped || card.isMatched}
                  className={`h-24 rounded-2xl border-2 font-bold text-xs p-2 flex items-center justify-center text-center transition-all cursor-pointer ${
                    card.isMatched
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 opacity-60'
                      : card.isFlipped
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-transparent hover:border-slate-300'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? card.text : '❓'}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Sparkles className="w-16 h-16 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                All Pairs Discovered!
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Completed in {memoryMoves} moves • +80 XP
              </p>
              <button
                onClick={startMemoryGame}
                className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------- VOCABULARY BATTLE RUNNER ----------------- */}
      {activeGame === 'battle' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl">
          {/* Health Bar Arena */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-6">
            <div className="text-center">
              <div className="font-bold text-xs text-slate-900 dark:text-white">{profile.name}</div>
              <div className="flex gap-1 mt-1 justify-center">
                {[1, 2, 3].map((heart) => (
                  <Heart
                    key={heart}
                    className={`w-5 h-5 ${
                      heart <= playerHp ? 'text-rose-500 fill-rose-500' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="font-black text-lg text-slate-400">VS</div>

            <div className="text-center">
              <div className="font-bold text-xs text-slate-900 dark:text-white">Vocab Bot</div>
              <div className="flex gap-1 mt-1 justify-center">
                {[1, 2, 3].map((heart) => (
                  <Heart
                    key={heart}
                    className={`w-5 h-5 ${
                      heart <= aiHp ? 'text-rose-500 fill-rose-500' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {!battleFinished && battleQuestion ? (
            <div>
              <div className="text-center py-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Attack with Correct Translation
                </span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {battleQuestion.word}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {battleQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleBattleAnswer(opt)}
                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-rose-500 font-bold text-sm text-left transition-all cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              {battleOutcome === 'win' ? (
                <>
                  <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Victory! You defeated the Bot 🎉
                  </h3>
                  <p className="text-sm font-bold text-emerald-500 mt-1">+150 XP Reward</p>
                </>
              ) : (
                <>
                  <X className="w-16 h-16 text-rose-500 mx-auto mb-3" />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Defeated! The bot was too quick.
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Try again to reclaim victory!</p>
                </>
              )}

              <button
                onClick={startBattle}
                className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                Rematch
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
