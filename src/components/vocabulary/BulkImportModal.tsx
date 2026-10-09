'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Word, EnglishLevel, CategoryId, PartOfSpeech } from '@/types/vocabulary';
import { CATEGORIES } from '@/lib/seed-words';
import { sound } from '@/lib/sound';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedWord {
  word: string;
  translation_ru: string;
  definition?: string;
  example?: string;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const { bulkAddCustomWords } = useApp();

  const [rawText, setRawText] = useState('');
  const [defaultLevel, setDefaultLevel] = useState<EnglishLevel>('B1');
  const [defaultCategory, setDefaultCategory] = useState<CategoryId>('daily-english');
  const [isSuccess, setIsSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  if (!isOpen) return null;

  // Real-time parsing of pasted text
  const parseLines = (text: string): ParsedWord[] => {
    if (!text.trim()) return [];

    // Check if JSON format
    const trimmed = text.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          return json
            .filter((item) => item && (item.word || item.english) && (item.translation_ru || item.translation || item.russian))
            .map((item) => ({
              word: (item.word || item.english).trim(),
              translation_ru: (item.translation_ru || item.translation || item.russian).trim(),
              definition: item.definition?.trim(),
              example: item.example?.trim(),
            }));
        }
      } catch {
        // Fall back to line parser
      }
    }

    const lines = text.split('\n');
    const result: ParsedWord[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Common delimiters: " - ", " : ", "\t", " — ", " – ", " = ", ";"
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(' — ')) {
        parts = line.split(' — ');
      } else if (line.includes(' – ')) {
        parts = line.split(' – ');
      } else if (line.includes(' - ')) {
        parts = line.split(' - ');
      } else if (line.includes(' : ')) {
        parts = line.split(' : ');
      } else if (line.includes('=')) {
        parts = line.split('=');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else if (line.includes('-')) {
        parts = line.split('-');
      }

      if (parts.length >= 2) {
        const word = parts[0].trim();
        const translation = parts[1].trim();
        if (word && translation) {
          result.push({
            word,
            translation_ru: translation,
          });
        }
      }
    }

    return result;
  };

  const parsedWords = parseLines(rawText);

  const handlePasteExample = () => {
    sound.playTap();
    setRawText(
`achieve - достигать
resilient - стойкий, жизнеспособный
meticulous - дотошный, тщательный
reluctant - неохотный
eloquent - красноречивый
vague - смутный, неясный
inevitable - неизбежный`
    );
  };

  const handleImport = () => {
    if (parsedWords.length === 0) return;
    sound.playTap();

    const wordsToAdd: Array<Omit<Word, 'id'>> = parsedWords.map((item) => ({
      word: item.word,
      translation_ru: item.translation_ru,
      definition: item.definition || `English term "${item.word}" meaning "${item.translation_ru}"`,
      example: item.example || `Let's use "${item.word}" in daily conversation.`,
      pronunciation: `/${item.word.toLowerCase()}/`,
      part_of_speech: 'Verb' as PartOfSpeech,
      level: defaultLevel === 'Not sure' ? 'B1' : defaultLevel,
      category_id: defaultCategory,
      synonyms: [],
      is_custom: true,
    }));

    bulkAddCustomWords(wordsToAdd);
    setImportedCount(wordsToAdd.length);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setRawText('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Массовый импорт колод
            </h2>
            <p className="text-xs text-slate-500">
              Вставьте слова списком из Quizlet, Excel или текста
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Успешно импортировано!
            </h3>
            <p className="text-sm text-slate-500">
              Добавлено <strong>{importedCount}</strong> слов в ваш словарь и интервальное повторение.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Формат: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">слово - перевод</code> (по одному на строке)
              </span>
              <button
                type="button"
                onClick={handlePasteExample}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Пример</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="achieve - достигать&#10;resilient - стойкий&#10;meticulous - дотошный"
              className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />

            {/* Parsing preview */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs">
              <span className="text-slate-500">Распознано слов к импорту:</span>
              <span className={`font-bold ${parsedWords.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {parsedWords.length} слов
              </span>
            </div>

            {/* Level and Category selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Уровень
                </label>
                <select
                  value={defaultLevel}
                  onChange={(e) => setDefaultLevel(e.target.value as EnglishLevel)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="A1">A1 — Beginner</option>
                  <option value="A2">A2 — Elementary</option>
                  <option value="B1">B1 — Intermediate</option>
                  <option value="B2">B2 — Upper-Intermediate</option>
                  <option value="C1">C1 — Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Категория
                </label>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value as CategoryId)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={parsedWords.length === 0}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Импортировать ({parsedWords.length})</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
