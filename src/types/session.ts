import { Word, SRSRating } from './vocabulary';

export type QuestionType =
  | 'flashcard'
  | 'en_ru'
  | 'ru_en'
  | 'fill_gap'
  | 'recall'
  | 'word_match'
  | 'sentence_builder'
  | 'listening'
  | 'speaking';

export interface MultipleChoiceOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  word: Word;
  title: string;
  prompt: string;
  secondaryPrompt?: string;
  options?: MultipleChoiceOption[];
  correctAnswer: string;
  exampleSentence?: string;
  explanation?: string;
  audioText?: string;
  scrambledTokens?: string[];
  matchPairs?: {
    en: string;
    target: string;
    id: string;
  }[];
  userAnswer?: string;
  isAnswered?: boolean;
  isCorrect?: boolean;
}

export interface SessionAnswerLog {
  questionId: string;
  wordId: string;
  type: QuestionType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface LearningSessionSummary {
  id: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  xpEarned: number;
  newWordsCount: number;
  reviewedCount: number;
  masteredCount: number;
  needsReviewCount: number;
  answers: SessionAnswerLog[];
}
