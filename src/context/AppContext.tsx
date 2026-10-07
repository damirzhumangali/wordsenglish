'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Word, UserWord, SRSRating, EnglishLevel } from '@/types/vocabulary';
import { UserProfile, UserSettings, Achievement, ActivityDay } from '@/types/user';
import { QuizQuestion, LearningSessionSummary } from '@/types/session';
import { SEED_WORDS } from '@/lib/seed-words';
import {
  STORAGE_KEYS,
  INITIAL_ACHIEVEMENTS,
  getDefaultProfile,
  getDefaultUserWords,
  generateSeedActivity,
  getRankDetails,
} from '@/lib/storage';
import { updateSRSWord } from '@/lib/srs';
import { generateDailySession } from '@/lib/question-generator';
import { sound } from '@/lib/sound';

interface AppContextType {
  profile: UserProfile;
  words: Word[];
  userWords: Record<string, UserWord>;
  achievements: Achievement[];
  activity: ActivityDay[];
  onboardingCompleted: boolean;
  activeSessionQuestions: QuizQuestion[] | null;
  activeSessionIndex: number;
  activeSessionSummary: LearningSessionSummary | null;
  authModalOpen: boolean;
  settingsModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setOnboardingCompleted: (val: boolean) => void;
  startSession: (options?: { categoryId?: string; mode?: 'daily' | 'review' | 'mistakes' | 'category'; wordsCount?: number }) => void;
  submitAnswer: (userAnswer: string, isCorrect: boolean, rating?: SRSRating) => void;
  nextSessionQuestion: () => void;
  closeSession: () => void;
  toggleFavorite: (wordId: string) => void;
  resetWordProgress: (wordId: string) => void;
  addCustomWord: (wordData: Omit<Word, 'id'>) => Word;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateProfileName: (name: string) => void;
  completeOnboarding: (answers: {
    level: EnglishLevel;
    reasons: string[];
    wordsPerDay: number;
    studyTime: number;
  }) => void;
  loginUser: (email: string, name: string) => void;
  logoutUser: () => void;
  dueForReviewWords: Word[];
  mistakeWords: { word: Word; userWord: UserWord; accuracy: number }[];
  todayProgressPercent: number;
  isDailyGoalCompleted: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(getDefaultProfile);
  const [words, setWords] = useState<Word[]>(SEED_WORDS);
  const [userWords, setUserWords] = useState<Record<string, UserWord>>(getDefaultUserWords);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [activity, setActivity] = useState<ActivityDay[]>(generateSeedActivity);
  const [onboardingCompleted, setOnboardingCompletedState] = useState<boolean>(true);
  const [activeSessionQuestions, setActiveSessionQuestions] = useState<QuizQuestion[] | null>(null);
  const [activeSessionIndex, setActiveSessionIndex] = useState<number>(0);
  const [activeSessionSummary, setActiveSessionSummary] = useState<LearningSessionSummary | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionAnswersLog, setSessionAnswersLog] = useState<{
    questionId: string;
    wordId: string;
    type: QuizQuestion['type'];
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    responseTimeMs: number;
  }[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        parsed.settings = {
          ...getDefaultProfile().settings,
          ...parsed.settings,
        };
        setProfile(parsed);
      }

      const savedUserWords = localStorage.getItem(STORAGE_KEYS.USER_WORDS);
      if (savedUserWords) setUserWords(JSON.parse(savedUserWords));

      const savedCustomWords = localStorage.getItem(STORAGE_KEYS.CUSTOM_WORDS);
      if (savedCustomWords) {
        const custom: Word[] = JSON.parse(savedCustomWords);
        setWords([...SEED_WORDS, ...custom]);
      }

      const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (savedAchievements) setAchievements(JSON.parse(savedAchievements));

      const savedActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (savedActivity) setActivity(JSON.parse(savedActivity));

      const savedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
      if (savedOnboarding !== null) {
        setOnboardingCompletedState(savedOnboarding === 'true');
      } else {
        setOnboardingCompletedState(false);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Update sound engine preference
  useEffect(() => {
    sound.setEnabled(profile.settings.soundEnabled);
  }, [profile.settings.soundEnabled]);

  // Synchronize Dark Mode with html class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (profile.settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [profile.settings.darkMode]);

  // Save changes to localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {}
  }, [profile, isClient]);

  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_WORDS, JSON.stringify(userWords));
    } catch {}
  }, [userWords, isClient]);

  // Calculate words due for review (safe on client)
  const dueForReviewWords = useMemo(() => {
    const nowTime = isClient ? Date.now() : 1791379200000;
    return words.filter((w) => {
      const uw = userWords[w.id];
      if (!uw) return false;
      if (uw.status === 'NEW') return false;
      const dueTime = new Date(uw.nextReviewAt).getTime();
      return dueTime <= nowTime;
    });
  }, [words, userWords, isClient]);

  // Calculate mistake words (accuracy < 60% with at least 2 attempts)
  const mistakeWords = useMemo(() => {
    const list: { word: Word; userWord: UserWord; accuracy: number }[] = [];
    words.forEach((w) => {
      const uw = userWords[w.id];
      if (uw && (uw.correctCount + uw.incorrectCount >= 2)) {
        const total = uw.correctCount + uw.incorrectCount;
        const acc = Math.round((uw.correctCount / total) * 100);
        if (acc < 65) {
          list.push({ word: w, userWord: uw, accuracy: acc });
        }
      }
    });
    return list.sort((a, b) => a.accuracy - b.accuracy);
  }, [words, userWords]);

  const todayProgressPercent = Math.min(
    100,
    Math.round((profile.todayStudiedCount / profile.settings.dailyGoalWords) * 100)
  );

  const isDailyGoalCompleted = profile.todayStudiedCount >= profile.settings.dailyGoalWords;

  // Trigger confetti burst
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
      });
    } catch {}
  };

  const setOnboardingCompleted = (val: boolean) => {
    setOnboardingCompletedState(val);
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, String(val));
    } catch {}
  };

  const completeOnboarding = (answers: {
    level: EnglishLevel;
    reasons: string[];
    wordsPerDay: number;
    studyTime: number;
  }) => {
    setProfile((prev) => ({
      ...prev,
      englishLevel: answers.level,
      learningReasons: answers.reasons,
      settings: {
        ...prev.settings,
        dailyGoalWords: answers.wordsPerDay,
        studyTimeMinutes: answers.studyTime,
      },
    }));
    setOnboardingCompleted(true);
    triggerConfetti();
    sound.playFanfare();
  };

  const startSession = (options?: {
    categoryId?: string;
    mode?: 'daily' | 'review' | 'mistakes' | 'category';
    wordsCount?: number;
  }) => {
    let newWordPool: Word[] = [];
    let reviewWordPool: Word[] = [];

    const mode = options?.mode || 'daily';

    if (mode === 'mistakes') {
      const mistakes = mistakeWords.map((m) => m.word);
      reviewWordPool = mistakes.length > 0 ? mistakes.slice(0, 5) : words.slice(0, 5);
      newWordPool = [];
    } else if (mode === 'review') {
      reviewWordPool = dueForReviewWords.length > 0 ? dueForReviewWords.slice(0, 6) : words.slice(0, 5);
      newWordPool = [];
    } else if (mode === 'category' && options?.categoryId) {
      const categoryWords = words.filter((w) => w.category_id === options.categoryId);
      newWordPool = categoryWords.slice(0, 4);
      reviewWordPool = categoryWords.slice(4, 7);
    } else {
      // Daily mode: pick 3 new words and 3 review words
      const unlearned = words.filter((w) => !userWords[w.id] || userWords[w.id].status === 'NEW');
      newWordPool = unlearned.slice(0, 3);
      reviewWordPool = dueForReviewWords.slice(0, 3);

      if (reviewWordPool.length === 0) {
        reviewWordPool = words.filter((w) => userWords[w.id]?.status === 'LEARNING').slice(0, 3);
      }
      if (reviewWordPool.length === 0) {
        reviewWordPool = words.slice(3, 6);
      }
    }

    const generated = generateDailySession(newWordPool, reviewWordPool, words);
    setActiveSessionQuestions(generated);
    setActiveSessionIndex(0);
    setActiveSessionSummary(null);
    setSessionStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setSessionAnswersLog([]);
  };

  const submitAnswer = (userAnswer: string, isCorrect: boolean, rating?: SRSRating) => {
    if (!activeSessionQuestions) return;
    const currentQ = activeSessionQuestions[activeSessionIndex];
    if (!currentQ) return;

    const responseTime = Date.now() - questionStartTime;

    // Log answer
    setSessionAnswersLog((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        wordId: currentQ.word.id,
        type: currentQ.type,
        userAnswer,
        correctAnswer: currentQ.correctAnswer,
        isCorrect,
        responseTimeMs: responseTime,
      },
    ]);

    // Update SRS state for the word
    const existingUW = userWords[currentQ.word.id] || {
      id: `uw-${currentQ.word.id}`,
      userId: profile.id,
      wordId: currentQ.word.id,
      status: 'LEARNING',
      difficulty: 2.5,
      intervalMinutes: 10,
      correctCount: 0,
      incorrectCount: 0,
      reviewCount: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date().toISOString(),
      memoryStrength: 20,
      isFavorite: false,
    };

    const updatedUW = updateSRSWord(existingUW, isCorrect, rating);
    setUserWords((prev) => ({
      ...prev,
      [currentQ.word.id]: updatedUW,
    }));

    // XP calculation
    let xpEarned = 0;
    if (isCorrect) {
      if (currentQ.type === 'recall' || currentQ.type === 'speaking') {
        xpEarned = 20;
      } else if (currentQ.type === 'sentence_builder' || currentQ.type === 'fill_gap') {
        xpEarned = 15;
      } else {
        xpEarned = 10;
      }
    } else {
      xpEarned = 2; // Encouragement XP
    }

    setProfile((prev) => {
      const newXp = prev.totalXp + xpEarned;
      const rank = getRankDetails(newXp);
      return {
        ...prev,
        totalXp: newXp,
        level: rank.level,
      };
    });
  };

  const nextSessionQuestion = () => {
    if (!activeSessionQuestions) return;

    if (activeSessionIndex + 1 < activeSessionQuestions.length) {
      setActiveSessionIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      // Finish session
      finishSession();
    }
  };

  const finishSession = () => {
    if (!activeSessionQuestions) return;

    const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000));
    const correctCount = sessionAnswersLog.filter((a) => a.isCorrect).length;
    const totalQ = sessionAnswersLog.length;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 100;
    const bonusXp = accuracy === 100 ? 50 : accuracy >= 80 ? 30 : 15;

    // Check newly learned and mastered
    const wordsInSession = Array.from(new Set(sessionAnswersLog.map((a) => a.wordId)));
    const masteredCount = wordsInSession.filter((id) => userWords[id]?.status === 'MASTERED').length;
    const needsReviewCount = wordsInSession.filter((id) => userWords[id]?.status === 'LEARNING' || (userWords[id]?.incorrectCount || 0) > 0).length;

    const summary: LearningSessionSummary = {
      id: `sess-${Date.now()}`,
      startedAt: new Date(sessionStartTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds,
      totalQuestions: totalQ,
      correctAnswers: correctCount,
      accuracy,
      xpEarned: correctCount * 12 + bonusXp,
      newWordsCount: Math.min(wordsInSession.length, 3),
      reviewedCount: Math.max(0, wordsInSession.length - 3),
      masteredCount,
      needsReviewCount,
      answers: sessionAnswersLog,
    };

    setActiveSessionSummary(summary);

    // Update user profile stats & streak
    setProfile((prev) => {
      const newTodayCount = prev.todayStudiedCount + wordsInSession.length;
      const isGoalJustReached = prev.todayStudiedCount < prev.settings.dailyGoalWords && newTodayCount >= prev.settings.dailyGoalWords;
      const newStreak = isGoalJustReached ? prev.currentStreak + 1 : prev.currentStreak;

      return {
        ...prev,
        todayStudiedCount: newTodayCount,
        wordsLearnedCount: prev.wordsLearnedCount + wordsInSession.length,
        totalXp: prev.totalXp + bonusXp,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
      };
    });

    // Update activity history
    const today = new Date().toISOString().split('T')[0];
    setActivity((prev) => {
      const existing = prev.find((a) => a.date === today);
      if (existing) {
        return prev.map((a) => (a.date === today ? { ...a, count: a.count + wordsInSession.length, xp: a.xp + summary.xpEarned } : a));
      }
      return [...prev, { date: today, count: wordsInSession.length, xp: summary.xpEarned }];
    });

    sound.playFanfare();
    triggerConfetti();
  };

  const closeSession = () => {
    setActiveSessionQuestions(null);
    setActiveSessionSummary(null);
    setActiveSessionIndex(0);
  };

  const toggleFavorite = (wordId: string) => {
    sound.playTap();
    setUserWords((prev) => {
      const current = prev[wordId];
      if (!current) {
        return {
          ...prev,
          [wordId]: {
            id: `uw-${wordId}`,
            userId: profile.id,
            wordId,
            status: 'NEW',
            difficulty: 2.5,
            intervalMinutes: 10,
            correctCount: 0,
            incorrectCount: 0,
            reviewCount: 0,
            lastReviewedAt: null,
            nextReviewAt: new Date().toISOString(),
            memoryStrength: 0,
            isFavorite: true,
          },
        };
      }
      return {
        ...prev,
        [wordId]: {
          ...current,
          isFavorite: !current.isFavorite,
        },
      };
    });
  };

  const resetWordProgress = (wordId: string) => {
    setUserWords((prev) => {
      const copy = { ...prev };
      delete copy[wordId];
      return copy;
    });
  };

  const addCustomWord = (wordData: Omit<Word, 'id'>): Word => {
    const id = `custom-${Date.now()}`;
    const newWord: Word = {
      ...wordData,
      id,
      is_custom: true,
    };

    setWords((prev) => [newWord, ...prev]);

    // Add to localStorage custom words
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_WORDS);
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_WORDS, JSON.stringify([newWord, ...list]));
    } catch {}

    // Initialize userWord in LEARNING status
    setUserWords((prev) => ({
      ...prev,
      [id]: {
        id: `uw-${id}`,
        userId: profile.id,
        wordId: id,
        status: 'LEARNING',
        difficulty: 2.5,
        intervalMinutes: 10,
        correctCount: 0,
        incorrectCount: 0,
        reviewCount: 0,
        lastReviewedAt: null,
        nextReviewAt: new Date().toISOString(),
        memoryStrength: 10,
        isFavorite: false,
      },
    }));

    sound.playFanfare();
    return newWord;
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setProfile((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  const updateProfileName = (name: string) => {
    setProfile((prev) => ({
      ...prev,
      name,
    }));
  };

  const loginUser = (email: string, name: string) => {
    setProfile((prev) => ({
      ...prev,
      email,
      name: name || email.split('@')[0],
      isDemoUser: false,
    }));
    setAuthModalOpen(false);
    sound.playFanfare();
  };

  const logoutUser = () => {
    setProfile(getDefaultProfile());
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        words,
        userWords,
        achievements,
        activity,
        onboardingCompleted,
        activeSessionQuestions,
        activeSessionIndex,
        activeSessionSummary,
        authModalOpen,
        settingsModalOpen,
        setAuthModalOpen,
        setSettingsModalOpen,
        setOnboardingCompleted,
        startSession,
        submitAnswer,
        nextSessionQuestion,
        closeSession,
        toggleFavorite,
        resetWordProgress,
        addCustomWord,
        updateSettings,
        updateProfileName,
        completeOnboarding,
        loginUser,
        logoutUser,
        dueForReviewWords,
        mistakeWords,
        todayProgressPercent,
        isDailyGoalCompleted,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
