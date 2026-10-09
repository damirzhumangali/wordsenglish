export type AIScenarioId =
  | 'vocabulary-drill'
  | 'daily-chat'
  | 'job-interview'
  | 'travel-airport'
  | 'ielts-speaking';

export interface AIScenario {
  id: AIScenarioId;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  initialMessage: string;
  suggestions: string[];
}

export interface SpeechFeedback {
  hasMistake: boolean;
  correction?: {
    original: string;
    corrected: string;
    rule: string;
  };
  vocabularyUpgrade?: {
    used: string;
    betterAlternative: string;
    example: string;
  };
  pronunciationTip?: {
    word: string;
    phonetic: string;
    tip: string;
  };
  fluencyScore: number; // 0 - 100
  estimatedLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
}

export type VoicePersonaId = 'sky' | 'alloy' | 'nova' | 'echo';

export interface CustomAIPersona {
  id: string;
  name: string;
  roleTitle: string;
  personality: 'friendly' | 'strict-examiner' | 'business-mentor' | 'native-friend';
  strictness: 'gentle' | 'balanced' | 'strict';
  feedbackFocus: ('grammar' | 'vocabulary' | 'pronunciation' | 'idioms')[];
  customPrompt?: string;
  speechAccent: 'en-US' | 'en-GB';
  voicePersona?: VoicePersonaId;
  speakFeedbackAloud?: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  feedback?: SpeechFeedback;
  vocabularyFocus?: {
    word: string;
    definition: string;
    examples: string[];
  };
}
