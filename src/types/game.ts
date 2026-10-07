import { Word } from './vocabulary';

export interface GameScore {
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  timeSeconds: number;
  accuracy: number;
  xpEarned: number;
}

export interface MemoryCardItem {
  id: string;
  wordId: string;
  text: string;
  type: 'en' | 'trans';
  isFlipped: boolean;
  isMatched: boolean;
}

export interface BattleCharacter {
  name: string;
  avatar: string;
  health: number; // 0 to 3
  maxHealth: number;
}
