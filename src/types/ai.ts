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

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  vocabularyFocus?: {
    word: string;
    definition: string;
    examples: string[];
  };
}
