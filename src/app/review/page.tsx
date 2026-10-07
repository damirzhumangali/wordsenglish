'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, Clock, Play, Volume2, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatNextReviewTime } from '@/lib/srs';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

export default function ReviewPage() {
  const {
    words,
    userWords,
    dueForReviewWords,
    mistakeWords,
    startSession,
    toggleFavorite,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'due' | 'mistakes'>('due');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [now, setNow] = useState<number>(1791379200000);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  // Group due words by timing
  const overdueList = dueForReviewWords.filter((w) => {
    const uw = userWords[w.id];
    if (!uw) return false;
    const dueTime = new Date(uw.nextReviewAt).getTime();
    return dueTime < now - 3600 * 1000; // >1h overdue
  });

  const todayList = dueForReviewWords.filter((w) => {
    const uw = userWords[w.id];
    if (!uw) return false;
    const dueTime = new Date(uw.nextReviewAt).getTime();
    return dueTime >= now - 3600 * 1000 && dueTime <= now;
  });

  const upcomingList = words.filter((w) => {
    const uw = userWords[w.id];
    if (!uw || uw.status === 'NEW') return false;
    const dueTime = new Date(uw.nextReviewAt).getTime();
    return dueTime > now;
  });

  const getFilteredList = () => {
    if (priorityFilter === 'overdue') return overdueList;
    if (priorityFilter === 'today') return todayList;
    if (priorityFilter === 'upcoming') return upcomingList;
    return dueForReviewWords;
  };

  const displayedWords = getFilteredList();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Spaced Repetition & Reviews
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Strengthen neural recall pathways before words fade into the forgetting curve.
          </p>
        </div>

        {dueForReviewWords.length > 0 && (
          <button
            onClick={() => {
              sound.playTap();
              startSession({ mode: 'review' });
            }}
            className="py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Review {dueForReviewWords.length} Due Words</span>
          </button>
        )}
      </div>

      {/* Primary Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('due');
          }}
          className={`py-2 px-5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'due'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Due Reviews ({dueForReviewWords.length})
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('mistakes');
          }}
          className={`py-2 px-5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'mistakes'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Frequent Mistakes ({mistakeWords.length})
        </button>
      </div>

      {activeTab === 'due' && (
        <div className="space-y-6">
          {/* Priority Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
              Timing:
            </span>
            {[
              { id: 'all', label: `All Due (${dueForReviewWords.length})` },
              { id: 'overdue', label: `Overdue (${overdueList.length})` },
              { id: 'today', label: `Today (${todayList.length})` },
              { id: 'upcoming', label: `Upcoming (${upcomingList.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  sound.playTap();
                  setPriorityFilter(f.id as typeof priorityFilter);
                }}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  priorityFilter === f.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Words List */}
          {displayedWords.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                You&apos;re all caught up! 🎉
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No words need review in this priority queue right now. Great job keeping your memory strong!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedWords.map((word) => {
                const uw = userWords[word.id];
                const isFav = uw?.isFavorite || false;
                const nextReview = uw?.nextReviewAt ? formatNextReviewTime(uw.nextReviewAt) : 'Ready';

                return (
                  <div
                    key={word.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {nextReview}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              sound.playTap();
                              speakWord(word.word);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-500 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(word.id)}
                            className={`p-1 cursor-pointer ${
                              isFav ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                        {word.word}
                      </h4>
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {word.translation_ru}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
                        &ldquo;{word.example}&rdquo;
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Memory: {uw?.memoryStrength || 0}%</span>
                      <span>Level {word.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mistakes' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  Targeted Error Correction
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  These words have an accuracy below 65%. Practice them to solidify memory.
                </p>
              </div>
            </div>

            {mistakeWords.length > 0 && (
              <button
                onClick={() => {
                  sound.playTap();
                  startSession({ mode: 'mistakes' });
                }}
                className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 whitespace-nowrap cursor-pointer"
              >
                Practice Mistakes
              </button>
            )}
          </div>

          {mistakeWords.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                No persistent mistakes! 🎉
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your accuracy is consistent across all practiced words.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mistakeWords.map(({ word, userWord, accuracy }) => (
                <div
                  key={word.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {accuracy}% Accuracy
                      </span>
                      <span className="text-xs text-slate-400">
                        {userWord.incorrectCount} Errors
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                      {word.word}
                    </h4>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {word.translation_ru}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
                      &ldquo;{word.example}&rdquo;
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        sound.playTap();
                        speakWord(word.word);
                      }}
                      className="text-xs text-slate-500 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Pronounce</span>
                    </button>
                    <span className="text-xs font-mono text-slate-400">
                      Level {word.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
