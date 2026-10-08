import { Word } from '@/types/vocabulary';
import { QuizQuestion, QuestionType, MultipleChoiceOption } from '@/types/session';
import { StudyDirection } from '@/types/user';

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
 * Helper to get proper translation according to target language
 */
export function getWordTranslation(
  word: Word,
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): string {
  if (targetLang === 'kz' && word.translation_kz) {
    return word.translation_kz;
  }
  return word.translation_ru;
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
  key: 'translation' | 'word',
  targetLang: 'ru' | 'kz' | 'en' = 'ru',
  count = 3
): string[] {
  const others = allWords.filter((w) => w.id !== targetWord.id);
  const shuffled = shuffleArray(others);
  if (key === 'translation') {
    return shuffled.slice(0, count).map((w) => getWordTranslation(w, targetLang));
  }
  return shuffled.slice(0, count).map((w) => w.word);
}

/**
 * Creates English -> Russian question (Comprehension / Passive recognition)
 */
export function generateEnRuQuestion(
  word: Word,
  allWords: Word[],
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const translation = getWordTranslation(word, targetLang);
  const distractors = getDistractors(word, allWords, 'translation', targetLang, 3);
  const optionsRaw = shuffleArray([
    { text: translation, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ]);

  const options: MultipleChoiceOption[] = optionsRaw.map((opt, i) => ({
    id: `opt-${i}`,
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

  const langLabel = targetLang === 'kz' ? 'KZ' : 'RU';

  return {
    id: `q-en-ru-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'en_ru',
    direction: 'en_ru',
    word,
    title: `Выбери правильный перевод (🇬🇧 EN ➔ ${langLabel === 'KZ' ? '🇰🇿' : '🇷🇺'} ${langLabel})`,
    prompt: word.word,
    secondaryPrompt: word.pronunciation,
    options,
    correctAnswer: translation,
    exampleSentence: word.example,
    explanation: `${word.word} = ${translation}`,
  };
}

/**
 * Creates Russian -> English question (Active retrieval / Production)
 */
export function generateRuEnQuestion(
  word: Word,
  allWords: Word[],
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const translation = getWordTranslation(word, targetLang);
  const distractors = getDistractors(word, allWords, 'word', targetLang, 3);
  const optionsRaw = shuffleArray([
    { text: word.word, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ]);

  const options: MultipleChoiceOption[] = optionsRaw.map((opt, i) => ({
    id: `opt-${i}`,
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

  const langLabel = targetLang === 'kz' ? '🇰🇿 Казахский' : '🇷🇺 Русский';

  return {
    id: `q-ru-en-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'ru_en',
    direction: 'ru_en',
    word,
    title: `Как сказать по-английски? (${langLabel} ➔ 🇬🇧 EN)`,
    prompt: translation,
    secondaryPrompt: `(${word.part_of_speech.toLowerCase()}) • ${word.definition}`,
    options,
    correctAnswer: word.word,
    exampleSentence: word.example,
    explanation: `${translation} = ${word.word} [${word.pronunciation}]`,
  };
}

/**
 * Creates Fill in the Blank question
 */
export function generateFillGapQuestion(
  word: Word,
  allWords: Word[],
  isHard = false,
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const translation = getWordTranslation(word, targetLang);
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
    const distractors = getDistractors(word, allWords, 'word', targetLang, 3);
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
    id: `q-gap-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'fill_gap',
    direction: 'ru_en',
    word,
    title: 'Вставь слово в предложение',
    prompt: blankSentence,
    secondaryPrompt: `Значение: ${translation}`,
    options,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `"${word.word}" (${translation}) правильно дополняет контекст.`,
  };
}

/**
 * Creates Recall question (Type the English word from Russian prompt)
 */
export function generateRecallQuestion(
  word: Word,
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const translation = getWordTranslation(word, targetLang);
  const langLabel = targetLang === 'kz' ? '🇰🇿 KZ' : '🇷🇺 RU';
  return {
    id: `q-recall-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'recall',
    direction: 'ru_en',
    word,
    title: `Вспомни и напиши слово (${langLabel} ➔ 🇬🇧 EN)`,
    prompt: translation,
    secondaryPrompt: `${word.part_of_speech} • ${word.definition}`,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `Правильно: "${word.word}" [${word.pronunciation}] = ${translation}`,
  };
}

/**
 * Creates Sentence Builder question (Unscramble words)
 */
export function generateSentenceBuilderQuestion(
  word: Word,
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const translation = getWordTranslation(word, targetLang);
  // Take example sentence and split into tokens
  const clean = word.example.replace(/[.!?]/g, '');
  const tokens = clean.split(' ').filter(Boolean);
  const scrambled = shuffleArray(tokens);

  return {
    id: `q-sentence-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'sentence_builder',
    word,
    title: 'Sentence Builder',
    prompt: `Assemble the sentence using "${word.word}"`,
    secondaryPrompt: translation,
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
  allWords: Word[],
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const translation = getWordTranslation(word, targetLang);
  const distractors = getDistractors(word, allWords, 'word', targetLang, 3);
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
    id: `q-listen-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'listening',
    direction: 'en_ru',
    word,
    title: 'Аудирование (Слушай и выбери)',
    prompt: 'Послушай и определи произнесенное слово',
    secondaryPrompt: 'Нажми на динамик, чтобы прослушать снова',
    audioText: word.word,
    options,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `${word.word} = ${translation}`,
  };
}

/**
 * Creates Word Match question (5 pairs)
 */
export function generateWordMatchQuestion(
  words: Word[],
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const sampleWords = words.slice(0, 5);
  const matchPairs = sampleWords.map((w) => ({
    id: w.id,
    en: w.word,
    target: getWordTranslation(w, targetLang),
  }));

  return {
    id: `q-match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'word_match',
    word: sampleWords[0],
    title: 'Word Match (EN ⇄ RU)',
    prompt: 'Соедини английские слова с их правильным переводом',
    matchPairs,
    correctAnswer: 'all_matched',
  };
}

/**
 * Creates Speaking practice question
 */
export function generateSpeakingQuestion(
  word: Word,
  targetLang: 'ru' | 'kz' | 'en' = 'ru'
): QuizQuestion {
  const translation = getWordTranslation(word, targetLang);
  return {
    id: `q-speak-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'speaking',
    word,
    title: 'Практика произношения',
    prompt: `Произнеси в микрофон: "${word.word.toUpperCase()}"`,
    secondaryPrompt: `Пример: ${word.example}`,
    correctAnswer: word.word.toLowerCase(),
    exampleSentence: word.example,
    explanation: `Целевое слово: ${word.word} (${translation})`,
  };
}

/**
 * Generates a full Daily Session with checkpoints supporting bidirectional training
 */
export function generateDailySession(
  newWords: Word[],
  reviewWords: Word[],
  allWords: Word[],
  options?: {
    direction?: StudyDirection;
    targetLang?: 'ru' | 'kz' | 'en';
  }
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const direction: StudyDirection = options?.direction || 'both';
  const targetLang = options?.targetLang || 'ru';

  if (direction === 'ru_en') {
    // ----------------------------------------------------
    // MODE: REVERSE ONLY (RU -> EN) - Active Recall Focus
    // ----------------------------------------------------
    // 1. Flashcards for new words starting with Russian front
    newWords.forEach((word) => {
      questions.push({
        id: `q-flash-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'flashcard',
        direction: 'ru_en',
        word,
        title: 'Новое слово (Вспомни перевод)',
        prompt: getWordTranslation(word, targetLang),
        secondaryPrompt: `(${word.part_of_speech.toLowerCase()})`,
        correctAnswer: word.word,
        exampleSentence: word.example,
        explanation: word.definition,
      });
    });

    // 2. RU -> EN multiple choice for all new words
    newWords.forEach((w) => {
      questions.push(generateRuEnQuestion(w, allWords, targetLang));
    });

    // 3. RU -> EN multiple choice for review words
    reviewWords.forEach((w) => {
      questions.push(generateRuEnQuestion(w, allWords, targetLang));
    });

    // 4. Word Match mini-game
    const matchPool = [...newWords, ...reviewWords];
    if (matchPool.length >= 4) {
      questions.push(generateWordMatchQuestion(shuffleArray(matchPool), targetLang));
    }

    // 5. Active Recall (type English word from Russian prompt)
    const recallPool = shuffleArray([...newWords, ...reviewWords]).slice(0, 4);
    recallPool.forEach((w) => {
      questions.push(generateRecallQuestion(w, targetLang));
    });

    // 6. Sentence builder
    if (newWords.length > 0) {
      questions.push(generateSentenceBuilderQuestion(newWords[0], targetLang));
    }

    // 7. Speaking practice
    if (reviewWords.length > 0 || newWords.length > 0) {
      const spk = reviewWords[0] || newWords[0];
      questions.push(generateSpeakingQuestion(spk, targetLang));
    }

    return questions;
  }

  if (direction === 'en_ru') {
    // ----------------------------------------------------
    // MODE: FORWARD ONLY (EN -> RU) - Recognition Focus
    // ----------------------------------------------------
    // 1. Flashcards
    newWords.forEach((word) => {
      questions.push({
        id: `q-flash-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'flashcard',
        direction: 'en_ru',
        word,
        title: 'New Word',
        prompt: word.word,
        secondaryPrompt: word.pronunciation,
        correctAnswer: word.word,
        exampleSentence: word.example,
        explanation: word.definition,
      });
    });

    // 2. EN -> RU for new words
    newWords.forEach((w) => {
      questions.push(generateEnRuQuestion(w, allWords, targetLang));
    });

    // 3. EN -> RU for review words
    reviewWords.forEach((w) => {
      questions.push(generateEnRuQuestion(w, allWords, targetLang));
    });

    // 4. Word Match
    const matchPool = [...newWords, ...reviewWords];
    if (matchPool.length >= 4) {
      questions.push(generateWordMatchQuestion(shuffleArray(matchPool), targetLang));
    }

    // 5. Fill gap
    newWords.slice(0, 2).forEach((w) => {
      questions.push(generateFillGapQuestion(w, allWords, false, targetLang));
    });

    // 6. Listening
    if (newWords.length > 0) {
      questions.push(generateListeningQuestion(newWords[0], allWords, targetLang));
    }

    return questions;
  }

  // ----------------------------------------------------
  // MODE: BOTH (EN ⇄ RU) - Comprehensive Bidirectional (DEFAULT & RECOMMENDED)
  // Trains BOTH recognition (EN -> RU) and recall (RU -> EN) for every word!
  // ----------------------------------------------------

  // Step 1: Pre-learning Interactive Flashcards for new words (flipper supports both)
  newWords.forEach((word) => {
    questions.push({
      id: `q-flash-${word.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'flashcard',
      direction: 'en_ru',
      word,
      title: 'Карточка слова (EN ⇄ RU)',
      prompt: word.word,
      secondaryPrompt: word.pronunciation,
      correctAnswer: word.word,
      exampleSentence: word.example,
      explanation: word.definition,
    });
  });

  // Step 2: English -> Translation for new words (Comprehension)
  newWords.forEach((w) => {
    questions.push(generateEnRuQuestion(w, allWords, targetLang));
  });

  // Step 3: CRITICAL STEP! Translation -> English for ALL new words!
  // This solves the exact user problem: after seeing the English word,
  // immediately test if they can identify the English word from the Russian prompt!
  newWords.forEach((w) => {
    questions.push(generateRuEnQuestion(w, allWords, targetLang));
  });

  // Step 4: Translation -> English for review words
  reviewWords.forEach((w) => {
    questions.push(generateRuEnQuestion(w, allWords, targetLang));
  });

  // Step 5: English -> Translation for review words (keep both pathways active)
  if (reviewWords.length > 0) {
    reviewWords.slice(0, 2).forEach((w) => {
      questions.push(generateEnRuQuestion(w, allWords, targetLang));
    });
  }

  // Step 6: Word Match mini-game if we have at least 4 words
  const matchPool = [...newWords, ...reviewWords];
  if (matchPool.length >= 4) {
    questions.push(generateWordMatchQuestion(shuffleArray(matchPool), targetLang));
  }

  // Step 7: Fill the Gap in context
  newWords.slice(0, 2).forEach((w) => {
    questions.push(generateFillGapQuestion(w, allWords, false, targetLang));
  });

  // Step 8: Active Recall (Type the English word from Russian translation)
  // Forces highest-order memory retrieval (RU -> EN)
  const recallPool = shuffleArray([...newWords, ...reviewWords]).slice(0, 3);
  recallPool.forEach((w) => {
    questions.push(generateRecallQuestion(w, targetLang));
  });

  // Step 9: Listening Quiz
  if (newWords.length > 0) {
    questions.push(generateListeningQuestion(newWords[0], allWords, targetLang));
  }

  // Step 10: Speaking Quiz
  if (reviewWords.length > 0 || newWords.length > 0) {
    const speakTarget = reviewWords[0] || newWords[0];
    questions.push(generateSpeakingQuestion(speakTarget, targetLang));
  }

  return questions;
}
