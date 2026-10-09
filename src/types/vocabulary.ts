export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'Not sure';

export type PartOfSpeech =
  | 'Noun'
  | 'Verb'
  | 'Adjective'
  | 'Adverb'
  | 'Phrasal Verb'
  | 'Idiom'
  | 'Preposition'
  | 'Conjunction';

export type CategoryId =
  | 'daily-english'
  | 'ielts'
  | 'toefl'
  | 'university'
  | 'work'
  | 'travel'
  | 'business'
  | 'it-programming'
  | 'technology'
  | 'academic-english'
  | 'common-verbs'
  | 'phrasal-verbs'
  | 'adjectives'
  | 'advanced-vocabulary';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  totalWords: number;
  levelRange: string;
}

export interface Word {
  id: string;
  word: string;
  translation_ru: string;
  translation_kz?: string;
  definition: string;
  example: string;
  pronunciation: string; // IPA notation, e.g. /əˈtʃiːv/
  part_of_speech: PartOfSpeech;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category_id: CategoryId;
  synonyms: string[];
  antonyms?: string[];
  audio_url?: string;
  mnemonic?: string; // Mnemonic memory hook / ассоциация для запоминания
  is_custom?: boolean;
}

export type SRSStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface UserWord {
  id: string;
  userId: string;
  wordId: string;
  status: SRSStatus;
  difficulty: number; // Ease Factor, default 2.5
  intervalMinutes: number; // Review interval in minutes
  correctCount: number;
  incorrectCount: number;
  reviewCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  memoryStrength: number; // 0 to 100%
  isFavorite: boolean;
  history?: {
    date: string;
    isCorrect: boolean;
    rating?: SRSRating;
  }[];
}
