import { Word } from '@/types/vocabulary';
import { QuizQuestion, QuestionType, MultipleChoiceOption } from '@/types/session';

/**
 * Shuffles an array with Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
}

/**
 * Generates distractors from the word pool
 */
function getDistractors(
  targetWord: Word,
  allWords: Word[],
  key: 'translation_ru' | 'word',
  count = 3
): string[] {
  const others = allWords.filter((w) => w.id !== targetWord.id);
  const shuffled = shuffleArray(others);
  return shuffled.slice(0, count).map((w) => w[key]);
}

/**
 * Creates English -> Russian question
 */
export function generateEnRuQuestion(word: Word, allWords: Word[]): QuizQuestion {
  const distractors = getDistractors(word, allWords, 'translation_ru', 3);
  const optionsRaw = shuffleArray([
    { text: word.translation_ru, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ]);

  const options: MultipleChoiceOption[] = optionsRaw.map((opt, i) => ({
    id: `opt-${i}`,
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

  return {
    id: `q-en-ru-${word.id}-${Date.now()}`,
    type: 'en_ru',
    word,
    title: 'Choose the correct translation',
    prompt: word.word,
    secondaryPrompt: word.pronunciation,
    options,
    correctAnswer: word.translation_ru,
    exampleSentence: word.example,
    explanation: `${word.word} = ${word.translation_ru}`,
  };
}

/**
 * Creates Russian -> English question
 */
export function generateRuEnQuestion(word: Word, allWords: Word[]): QuizQuestion {
  const distractors = getDistractors(word, allWords, 'word', 3);
  const optionsRaw = shuffleArray([
    { text: word.word, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ]);

  const options: MultipleChoiceOption[] = optionsRaw.map((opt, i) => ({
    id: `opt-${i}`,
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

  return {
    id: `q-ru-en-${word.id}-${Date.now()}`,
    type: 'ru_en',
    word,
    title: 'How do you say in English?',
    prompt: word.translation_ru,
    secondaryPrompt: `(${word.part_of_speech.toLowerCase()})`,
    options,
    correctAnswer: word.word,
    exampleSentence: word.example,
    explanation: `${word.word}: ${word.definition}`,
  };
}

/**
 * Creates Fill in the Blank question
 */
export function generateFillGapQuestion(
  word: Word,
  allWords: Word[],
  isHard = false
): QuizQuestion {
  // Replace the target word in the example sentence with blank
  const regex = new RegExp(`\\b${word.word}\\b`, 'gi');
  let blankSentence = word.example.replace(regex, '______');

  // If word wasn't found verbatim (e.g. conjugated), find first match or fallback
  if (!blankSentence.includes('______')) {
    const parts = word.example.split(' ');
    if (parts.length > 2) {
      parts[Math.floor(parts.length / 2)] = '______';
      blankSentence = parts.join(' ');
    } else {
      blankSentence = `I want to ______ this now.`;
    }
  }

  let options: MultipleChoiceOption[] | undefined;
  if (!isHard) {
    const distractors = getDistractors(word, allWords, 'word', 3);
    const optionsRaw = shuffleArray([
      { text: word.word, isCorrect: true },
      ...distractors.map((d) => ({ text: d, isCorrect: false })),
    ]);
    options = optionsRaw.map((opt, i) => ({
      id: `opt-${i}`,
      label: opt.text,
      isCorrect: opt.isCorrect,
    }));
  }

  return {
    id: `q-gap-${word.id}-${Date.now()}`,
    type: 'fill_gap',
    word,
    title: 'Complete the sentence',
    prompt: blankSentence,
    secondaryPrompt: `Meaning: ${word.translation_ru}`,
    options,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `"${word.word}" correctly fits the context.`,
  };
}

/**
 * Creates Recall question (Type the English word)
 */
export function generateRecallQuestion(word: Word): QuizQuestion {
  return {
    id: `q-recall-${word.id}-${Date.now()}`,
    type: 'recall',
    word,
    title: 'Active Recall',
    prompt: word.translation_ru,
    secondaryPrompt: `${word.part_of_speech} • ${word.definition}`,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `Correct: "${word.word}" [${word.pronunciation}]`,
  };
}

/**
 * Creates Sentence Builder question (Unscramble words)
 */
export function generateSentenceBuilderQuestion(word: Word): QuizQuestion {
  // Take example sentence and split into tokens
  const clean = word.example.replace(/[.!?]/g, '');
  const tokens = clean.split(' ').filter(Boolean);
  const scrambled = shuffleArray(tokens);

  return {
    id: `q-sentence-${word.id}-${Date.now()}`,
    type: 'sentence_builder',
    word,
    title: 'Sentence Builder',
    prompt: `Assemble the sentence using "${word.word}"`,
    secondaryPrompt: word.translation_ru,
    scrambledTokens: scrambled,
    correctAnswer: clean,
    exampleSentence: word.example,
    explanation: word.example,
  };
}

/**
 * Creates Listening question
 */
export function generateListeningQuestion(
  word: Word,
  allWords: Word[]
): QuizQuestion {
  const distractors = getDistractors(word, allWords, 'word', 3);
  const optionsRaw = shuffleArray([
    { text: word.word, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ]);

  const options = optionsRaw.map((opt, i) => ({
    id: `opt-${i}`,
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

  return {
    id: `q-listen-${word.id}-${Date.now()}`,
    type: 'listening',
    word,
    title: 'Listening Quiz',
    prompt: 'Listen and identify the spoken word',
    secondaryPrompt: 'Click the sound button to replay',
    audioText: word.word,
    options,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `${word.word} = ${word.translation_ru}`,
  };
}

/**
 * Creates Word Match question (5 pairs)
 */
export function generateWordMatchQuestion(words: Word[]): QuizQuestion {
  const sampleWords = words.slice(0, 5);
  const matchPairs = sampleWords.map((w) => ({
    id: w.id,
    en: w.word,
    target: w.translation_ru,
  }));

  return {
    id: `q-match-${Date.now()}`,
    type: 'word_match',
    word: sampleWords[0],
    title: 'Word Match',
    prompt: 'Tap English word, then tap matching translation',
    matchPairs,
    correctAnswer: 'all_matched',
  };
}

/**
 * Creates Speaking practice question
 */
export function generateSpeakingQuestion(word: Word): QuizQuestion {
  return {
    id: `q-speak-${word.id}-${Date.now()}`,
    type: 'speaking',
    word,
    title: 'Speaking Practice',
    prompt: `Use "${word.word.toUpperCase()}" in a spoken sentence`,
    secondaryPrompt: `Example: ${word.example}`,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `Target word: ${word.word} (${word.translation_ru})`,
  };
}

/**
 * Generates a full Daily Session with checkpoints
 */
export function generateDailySession(
  newWords: Word[],
  reviewWords: Word[],
  allWords: Word[]
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Step 1: Pre-learning Flashcards for new words
  newWords.forEach((word) => {
    questions.push({
      id: `q-flash-${word.id}-${Date.now()}`,
      type: 'flashcard',
      word,
      title: 'New Word',
      prompt: word.word,
      secondaryPrompt: word.pronunciation,
      correctAnswer: word.word,
      exampleSentence: word.example,
      explanation: word.definition,
    });
  });

  // Step 2: English -> Translation for new words
  newWords.forEach((w) => {
    questions.push(generateEnRuQuestion(w, allWords));
  });

  // Step 3: Translation -> English for review words
  reviewWords.slice(0, 3).forEach((w) => {
    questions.push(generateRuEnQuestion(w, allWords));
  });

  // Step 4: Word Match mini-game if we have at least 4 words
  const matchPool = [...newWords, ...reviewWords];
  if (matchPool.length >= 4) {
    questions.push(generateWordMatchQuestion(shuffleArray(matchPool)));
  }

  // Step 5: Fill the Gap
  newWords.slice(0, 2).forEach((w) => {
    questions.push(generateFillGapQuestion(w, allWords));
  });

  // Step 6: Active Recall (CRITICAL for activating vocabulary)
  const recallPool = shuffleArray([...newWords, ...reviewWords]).slice(0, 3);
  recallPool.forEach((w) => {
    questions.push(generateRecallQuestion(w));
  });

  // Step 7: Listening Quiz
  if (newWords.length > 0) {
    questions.push(generateListeningQuestion(newWords[0], allWords));
  }

  // Step 8: Speaking Quiz
  if (reviewWords.length > 0 || newWords.length > 0) {
    const speakWord = (reviewWords[0] || newWords[0]);
    questions.push(generateSpeakingQuestion(speakWord));
  }

  return questions;
}
