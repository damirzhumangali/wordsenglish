import { Word, UserWord, SRSStatus, SRSRating } from '@/types/vocabulary';
import { UserProfile, Achievement, ActivityDay } from '@/types/user';
import { SEED_WORDS } from './seed-words';
import { updateSRSWord } from './srs';
import { LearningSessionSummary } from '@/types/session';

export const STORAGE_KEYS = {
  PROFILE: 'vocabflow_profile_v1',
  USER_WORDS: 'vocabflow_user_words_v1',
  CUSTOM_WORDS: 'vocabflow_custom_words_v1',
  ACHIEVEMENTS: 'vocabflow_achievements_v1',
  SESSIONS: 'vocabflow_sessions_v1',
  ACTIVITY: 'vocabflow_activity_v1',
  ONBOARDING_DONE: 'vocabflow_onboarding_v1',
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Learn your first word in VocabFlow.',
    icon: 'Footprints',
    xpReward: 50,
    unlockedAt: null,
    progress: { current: 0, max: 1 },
  },
  {
    id: 'daily_goal',
    title: 'Daily Achiever',
    description: 'Complete your daily vocabulary goal.',
    icon: 'CheckCircle2',
    xpReward: 100,
    unlockedAt: null,
    progress: { current: 0, max: 1 },
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak.',
    icon: 'Flame',
    xpReward: 250,
    unlockedAt: null,
    progress: { current: 0, max: 7 },
  },
  {
    id: 'words_50',
    title: '50 Words Club',
    description: 'Add 50 words to your active vocabulary list.',
    icon: 'BookOpen',
    xpReward: 200,
    unlockedAt: null,
    progress: { current: 0, max: 50 },
  },
  {
    id: 'words_100',
    title: '100 Words Master',
    description: 'Reach 100 learned or reviewed words.',
    icon: 'Trophy',
    xpReward: 500,
    unlockedAt: null,
    progress: { current: 0, max: 100 },
  },
  {
    id: 'perfect_session',
    title: 'Perfect Session',
    description: 'Complete any quiz session with 100% accuracy.',
    icon: 'Sparkles',
    xpReward: 150,
    unlockedAt: null,
    progress: { current: 0, max: 1 },
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Score 15+ correct answers in a 60-second Speed Quiz.',
    icon: 'Zap',
    xpReward: 200,
    unlockedAt: null,
    progress: { current: 0, max: 15 },
  },
  {
    id: 'battle_champion',
    title: 'Battle Champion',
    description: 'Defeat the AI in Vocabulary Battle without losing a heart.',
    icon: 'Swords',
    xpReward: 300,
    unlockedAt: null,
    progress: { current: 0, max: 1 },
  },
];

export function getRankDetails(xp: number): {
  level: number;
  rankTitle: string;
  nextLevelXp: number;
  progressPercent: number;
} {
  // Rank brackets
  if (xp < 300) {
    const level = 1 + Math.floor(xp / 100);
    return {
      level,
      rankTitle: 'Beginner',
      nextLevelXp: 500,
      progressPercent: Math.min(100, Math.round((xp / 500) * 100)),
    };
  }
  if (xp < 1500) {
    const level = 3 + Math.floor((xp - 300) / 300);
    return {
      level: Math.min(5, level),
      rankTitle: 'Explorer',
      nextLevelXp: 1500,
      progressPercent: Math.min(100, Math.round(((xp - 300) / 1200) * 100)),
    };
  }
  if (xp < 3500) {
    const level = 6 + Math.floor((xp - 1500) / 400);
    return {
      level: Math.min(10, level),
      rankTitle: 'Learner',
      nextLevelXp: 3500,
      progressPercent: Math.min(100, Math.round(((xp - 1500) / 2000) * 100)),
    };
  }
  if (xp < 8000) {
    const level = 11 + Math.floor((xp - 3500) / 500);
    return {
      level: Math.min(20, level),
      rankTitle: 'Speaker',
      nextLevelXp: 8000,
      progressPercent: Math.min(100, Math.round(((xp - 3500) / 4500) * 100)),
    };
  }
  if (xp < 18000) {
    const level = 21 + Math.floor((xp - 8000) / 1000);
    return {
      level: Math.min(30, level),
      rankTitle: 'Advanced',
      nextLevelXp: 18000,
      progressPercent: Math.min(100, Math.round(((xp - 8000) / 10000) * 100)),
    };
  }
  const level = Math.min(50, 31 + Math.floor((xp - 18000) / 1500));
  return {
    level,
    rankTitle: 'Vocabulary Master',
    nextLevelXp: 30000,
    progressPercent: Math.min(100, Math.round(((xp - 18000) / 12000) * 100)),
  };
}

export function getDefaultProfile(): UserProfile {
  return {
    id: 'demo-user-1',
    email: 'damir@example.com',
    name: 'Damir',
    avatarUrl: '',
    englishLevel: 'B1',
    learningReasons: ['Daily English', 'IT / Programming', 'IELTS'],
    totalXp: 1250,
    level: 5,
    currentStreak: 7,
    longestStreak: 14,
    lastActiveDate: '2026-10-07',
    wordsLearnedCount: 42,
    wordsMasteredCount: 18,
    todayStudiedCount: 12,
    settings: {
      dailyGoalWords: 15,
      studyTimeMinutes: 15,
      targetLang: 'ru',
      soundEnabled: true,
      animationsEnabled: true,
      darkMode: false,
      keyboardShortcuts: true,
    },
    joinedDate: '2026-09-01',
    isDemoUser: true,
  };
}

/**
 * Initializes realistic initial user words with spaced repetition state
 */
export function getDefaultUserWords(): Record<string, UserWord> {
  const result: Record<string, UserWord> = {};
  const baseTimestamp = 1791379200000; // Static anchor timestamp for SSR prerender

  // Pick first 40 seed words and distribute them into realistic states
  SEED_WORDS.slice(0, 45).forEach((word, index) => {
    let status: SRSStatus = 'NEW';
    let correctCount = 0;
    let incorrectCount = 0;
    let reviewCount = 0;
    let intervalMinutes = 10;
    let memoryStrength = 0;
    let nextReviewOffsetMinutes = 0;

    if (index < 12) {
      // Due today or overdue for review
      status = 'REVIEW';
      correctCount = 4;
      incorrectCount = 1;
      reviewCount = 5;
      intervalMinutes = 1440; // 1 day
      memoryStrength = 65;
      nextReviewOffsetMinutes = -120; // 2 hours overdue!
    } else if (index < 24) {
      // Currently in learning
      status = 'LEARNING';
      correctCount = 2;
      incorrectCount = 2;
      reviewCount = 4;
      intervalMinutes = 10;
      memoryStrength = 40;
      nextReviewOffsetMinutes = 5; // Ready soon
    } else if (index < 36) {
      // Mastered
      status = 'MASTERED';
      correctCount = 8;
      incorrectCount = 0;
      reviewCount = 8;
      intervalMinutes = 43200; // 30 days
      memoryStrength = 95;
      nextReviewOffsetMinutes = 1440 * 15; // 15 days in future
    } else {
      // Brand new
      status = 'NEW';
    }

    const nextReviewDate = new Date(
      baseTimestamp + nextReviewOffsetMinutes * 60 * 1000
    );

    result[word.id] = {
      id: `uw-${word.id}`,
      userId: 'demo-user-1',
      wordId: word.id,
      status,
      difficulty: 2.5,
      intervalMinutes,
      correctCount,
      incorrectCount,
      reviewCount,
      lastReviewedAt: status !== 'NEW' ? '2026-10-07T10:00:00.000Z' : null,
      nextReviewAt: nextReviewDate.toISOString(),
      memoryStrength,
      isFavorite: index % 6 === 0,
    };
  });

  return result;
}

export function generateSeedActivity(): ActivityDay[] {
  const days: ActivityDay[] = [];
  const baseTimestamp = 1791379200000;

  // Generate 60 days of activity for heatmap
  for (let i = 59; i >= 0; i--) {
    const d = new Date(baseTimestamp - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];

    // Simulate streak pattern: active most days, especially last 7 days
    let count = 0;
    let xp = 0;

    if (i <= 7) {
      // Current active streak
      count = ((i * 3 + 7) % 8) + 12;
      xp = count * 15 + 50;
    } else if (i % 7 !== 3) {
      count = ((i * 5 + 3) % 12) + 5;
      xp = count * 15;
    }

    days.push({
      date: dateStr,
      count,
      xp,
    });
  }

  return days;
}
