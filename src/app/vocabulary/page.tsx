'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Star,
  Volume2,
  Filter,
  CheckCircle2,
  Layers,
  Sparkles,
  Upload,
  Download,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Word, SRSStatus } from '@/types/vocabulary';
import { CATEGORIES } from '@/lib/seed-words';
import { WordDetailModal } from '@/components/vocabulary/WordDetailModal';
import { AddWordModal } from '@/components/vocabulary/AddWordModal';
import { BulkImportModal } from '@/components/vocabulary/BulkImportModal';
import { formatNextReviewTime } from '@/lib/srs';
import { speakWord } from '@/lib/speech';
import { sound } from '@/lib/sound';

export default function VocabularyPage() {
  const { words, userWords, toggleFavorite, profile } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'learning' | 'review' | 'mastered' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleExportDeck = () => {
    sound.playTap();
    const content = filteredWords
      .map((w) => `${w.word} - ${w.translation_ru} [${w.level}, ${w.part_of_speech}]`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabflow-deck-${activeTab}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const uw = userWords[w.id];

      // Tab filter
      if (activeTab === 'favorites') {
        if (!uw?.isFavorite) return false;
      } else if (activeTab === 'learning') {
        if (!uw || uw.status !== 'LEARNING') return false;
      } else if (activeTab === 'review') {
        if (!uw || uw.status !== 'REVIEW') return false;
      } else if (activeTab === 'mastered') {
        if (!uw || uw.status !== 'MASTERED') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchWord = w.word.toLowerCase().includes(q);
        const matchRu = w.translation_ru.toLowerCase().includes(q);
        const matchKz = w.translation_kz?.toLowerCase().includes(q);
        const matchDef = w.definition.toLowerCase().includes(q);
        if (!matchWord && !matchRu && !matchKz && !matchDef) return false;
      }

      // Level filter
      if (selectedLevel !== 'all' && w.level !== selectedLevel) return false;

      // Category filter
      if (selectedCategory !== 'all' && w.category_id !== selectedCategory) return false;

      return true;
    });
  }, [words, userWords, activeTab, searchQuery, selectedLevel, selectedCategory]);

  const tabs = [
    { id: 'all', label: `All (${words.length})` },
    {
      id: 'learning',
      label: `Learning (${words.filter((w) => userWords[w.id]?.status === 'LEARNING').length})`,
    },
    {
      id: 'review',
      label: `Review (${words.filter((w) => userWords[w.id]?.status === 'REVIEW').length})`,
    },
    {
      id: 'mastered',
      label: `Mastered (${words.filter((w) => userWords[w.id]?.status === 'MASTERED').length})`,
    },
    {
      id: 'favorites',
      label: `Favorites (${words.filter((w) => userWords[w.id]?.isFavorite).length})`,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Vocabulary
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, organize and monitor your retention for all active English words.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              sound.playTap();
              setIsBulkImportOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            title="Импортировать список слов из Quizlet, Excel или текста"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Импорт колоды</span>
          </button>

          <button
            onClick={handleExportDeck}
            className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            title="Скачать список слов в текстовый файл"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт ({filteredWords.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setIsAddWordOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить слово</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sound.playTap();
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, translations or definitions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* Level Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="all">All Levels (A1–C1)</option>
            <option value="A1">A1 — Beginner</option>
            <option value="A2">A2 — Elementary</option>
            <option value="B1">B1 — Intermediate</option>
            <option value="B2">B2 — Upper Intermediate</option>
            <option value="C1">C1 — Advanced</option>
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Words Grid */}
      {filteredWords.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === 'favorites'
              ? 'No favorite words yet.'
              : 'No matching words found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'favorites'
              ? 'Tap ⭐ on any word card to save it here for quick practice.'
              : 'Try clearing your search query or switching filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word) => {
            const uw = userWords[word.id];
            const isFav = uw?.isFavorite || false;
            const status: SRSStatus = uw?.status || 'NEW';
            const nextReview = uw?.nextReviewAt ? formatNextReviewTime(uw.nextReviewAt) : 'Ready';

            const statusColor = {
              NEW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
              LEARNING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
              REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
              MASTERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
            }[status];

            return (
              <div
                key={word.id}
                onClick={() => {
                  sound.playTap();
                  setSelectedWord(word);
                }}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {word.level}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                        {status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          sound.playTap();
                          speakWord(word.word);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-500 cursor-pointer"
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(word.id)}
                        className={`p-1 cursor-pointer ${
                          isFav ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                        }`}
                        title="Favorite"
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                    {word.word}
                  </h4>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {profile.settings.targetLang === 'kz' && word.translation_kz
                      ? word.translation_kz
                      : word.translation_ru}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
                    &ldquo;{word.example}&rdquo;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{word.part_of_speech}</span>
                  {status !== 'NEW' && <span>Review: {nextReview}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <WordDetailModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
      />

      <AddWordModal
        isOpen={isAddWordOpen}
        onClose={() => setIsAddWordOpen(false)}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
}
