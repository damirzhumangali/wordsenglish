import { EnglishLevel } from './vocabulary';

export interface UserSettings {
  dailyGoalWords: number; // 5, 10, 15, 20, 30
  studyTimeMinutes: number; // 5, 10, 15, 20, 30
  targetLang: 'ru' | 'kz' | 'en';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  darkMode: boolean;
  keyboardShortcuts: boolean;
  notificationsEnabled: boolean;
  reminderTimes: string[]; // ['13:00', '20:00']
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string | null;
  progress?: { current: number; max: number };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  englishLevel: EnglishLevel;
  learningReasons: string[];
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  wordsLearnedCount: number;
  wordsMasteredCount: number;
  todayStudiedCount: number;
  settings: UserSettings;
  joinedDate: string;
  isDemoUser: boolean;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number; // words reviewed or sessions
  xp: number;
}
