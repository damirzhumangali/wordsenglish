import { SRSStatus, SRSRating, UserWord, Word } from '@/types/vocabulary';

// Standard interval steps in minutes:
// 10m, 1d (1440m), 3d (4320m), 7d (10080m), 14d (20160m), 30d (43200m), 60d (86400m)
export const SRS_INTERVAL_STEPS_MINUTES = [
  10,       // Step 0: 10 min
  1440,     // Step 1: 1 day
  4320,     // Step 2: 3 days
  10080,    // Step 3: 7 days
  20160,    // Step 4: 14 days
  43200,    // Step 5: 30 days
  86400,    // Step 6: 60 days
];

/**
 * Calculates updated UserWord record based on answer correctness or user self-rating
 */
export function updateSRSWord(
  userWord: UserWord,
  isCorrect: boolean,
  rating?: SRSRating
): UserWord {
  const now = new Date();
  const lastReviewedAt = now.toISOString();

  let nextIntervalMinutes = userWord.intervalMinutes || 10;
  let status: SRSStatus = userWord.status;
  let difficulty = userWord.difficulty || 2.5;
  let correctCount = userWord.correctCount + (isCorrect ? 1 : 0);
  let incorrectCount = userWord.incorrectCount + (!isCorrect ? 1 : 0);
  let reviewCount = userWord.reviewCount + 1;
  let memoryStrength = userWord.memoryStrength || 0;

  if (rating) {
    // Explicit rating chosen by user (Again, Hard, Good, Easy)
    switch (rating) {
      case 'again':
        nextIntervalMinutes = 10;
        status = 'LEARNING';
        difficulty = Math.max(1.3, difficulty - 0.2);
        memoryStrength = Math.max(10, memoryStrength - 25);
        break;
      case 'hard':
        nextIntervalMinutes = 1440; // 1 day
        status = 'REVIEW';
        difficulty = Math.max(1.3, difficulty - 0.1);
        memoryStrength = Math.min(85, memoryStrength + 10);
        break;
      case 'good':
        nextIntervalMinutes = 4320; // 3 days
        status = 'REVIEW';
        memoryStrength = Math.min(95, memoryStrength + 20);
        break;
      case 'easy':
        nextIntervalMinutes = 10080; // 7 days
        status = nextIntervalMinutes >= 43200 ? 'MASTERED' : 'REVIEW';
        difficulty = Math.min(3.0, difficulty + 0.15);
        memoryStrength = Math.min(100, memoryStrength + 30);
        break;
    }
  } else {
    // Automated calculation based on correctness
    if (isCorrect) {
      // Find current step index
      const stepIndex = SRS_INTERVAL_STEPS_MINUTES.findIndex(
        (m) => m >= nextIntervalMinutes
      );

      if (stepIndex === -1 || stepIndex >= SRS_INTERVAL_STEPS_MINUTES.length - 1) {
        nextIntervalMinutes = 86400; // 60 days
        status = 'MASTERED';
        memoryStrength = 100;
      } else {
        const nextIndex = Math.min(
          SRS_INTERVAL_STEPS_MINUTES.length - 1,
          stepIndex + 1
        );
        nextIntervalMinutes = SRS_INTERVAL_STEPS_MINUTES[nextIndex];
        status = nextIntervalMinutes >= 43200 ? 'MASTERED' : 'REVIEW';
        memoryStrength = Math.min(100, Math.round(((nextIndex + 1) / SRS_INTERVAL_STEPS_MINUTES.length) * 100));
      }

      difficulty = Math.min(3.0, difficulty + 0.05);
    } else {
      // Mistake occurred - demote interval
      if (nextIntervalMinutes >= 43200) {
        // 30d/60d -> 7d
        nextIntervalMinutes = 10080;
        status = 'REVIEW';
      } else if (nextIntervalMinutes >= 10080) {
        // 7d -> 1d
        nextIntervalMinutes = 1440;
        status = 'REVIEW';
      } else {
        // 1d/10m -> 10m back to LEARNING
        nextIntervalMinutes = 10;
        status = 'LEARNING';
      }

      difficulty = Math.max(1.3, difficulty - 0.2);
      memoryStrength = Math.max(15, Math.round(memoryStrength * 0.6));
    }
  }

  const nextReviewDate = new Date(now.getTime() + nextIntervalMinutes * 60 * 1000);

  return {
    ...userWord,
    status,
    difficulty: Number(difficulty.toFixed(2)),
    intervalMinutes: nextIntervalMinutes,
    correctCount,
    incorrectCount,
    reviewCount,
    lastReviewedAt,
    nextReviewAt: nextReviewDate.toISOString(),
    memoryStrength,
  };
}

/**
 * Calculates priority score for spaced repetition review queue
 * priority = overdue score + mistake score + difficulty score + memory decay score
 */
export function calculateReviewPriority(userWord: UserWord, nowTimestamp?: number): number {
  const now = nowTimestamp ?? 1791379200000;
  const nextReviewTime = new Date(userWord.nextReviewAt).getTime();
  const diffHours = (now - nextReviewTime) / (1000 * 60 * 60);

  // Overdue score: positive if due, negative if in the future
  const overdueScore = Math.max(0, diffHours * 2);

  // Mistake score: higher if user frequently makes errors
  const totalAnswers = userWord.correctCount + userWord.incorrectCount;
  const errorRate = totalAnswers > 0 ? userWord.incorrectCount / totalAnswers : 0;
  const mistakeScore = errorRate * 50;

  // Difficulty score: inverted ease factor (lower ease = harder = higher priority)
  const difficultyScore = (3.0 - (userWord.difficulty || 2.5)) * 20;

  // Memory decay score: words with weaker memory strength need review first
  const memoryDecayScore = (100 - (userWord.memoryStrength || 0)) * 0.3;

  return overdueScore + mistakeScore + difficultyScore + memoryDecayScore;
}

/**
 * Formats time until next review into human readable string
 */
export function formatNextReviewTime(nextReviewAt: string, nowTimestamp?: number): string {
  const now = nowTimestamp ?? 1791379200000;
  const due = new Date(nextReviewAt).getTime();
  const diffMinutes = Math.round((due - now) / (1000 * 60));

  if (diffMinutes <= 0) return 'Ready for review';
  if (diffMinutes < 60) return `in ${diffMinutes}m`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}
