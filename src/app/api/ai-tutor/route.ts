import { NextResponse } from 'next/server';
import { SpeechFeedback, CustomAIPersona } from '@/types/ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      messages = [],
      scenario = 'daily-chat',
      customApiKey,
      targetWord,
      customPersona,
    } = body as {
      messages: ChatMessage[];
      scenario?: string;
      customApiKey?: string;
      targetWord?: string;
      customPersona?: CustomAIPersona;
    };

    const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';

    // 1. Try Gemini API with structured feedback prompt
    if (apiKey && lastUserMessage) {
      try {
        const geminiResult = await callGeminiWithFeedback(
          apiKey,
          messages,
          scenario,
          customPersona,
          targetWord
        );
        if (geminiResult) {
          return NextResponse.json(geminiResult);
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to built-in feedback engine:', err);
      }
    }

    // 2. Built-in Real Feedback Engine
    const { reply, feedback } = generateSmartTutorWithFeedback(
      messages,
      scenario,
      customPersona,
      targetWord
    );

    return NextResponse.json({ reply, feedback, source: 'built-in' });
  } catch (error) {
    console.error('Error in ai-tutor route:', error);
    return NextResponse.json(
      {
        reply: "I'm listening! Could you repeat that? Let's practice your spoken English.",
        source: 'fallback',
      },
      { status: 200 }
    );
  }
}

/**
 * Call Google Gemini API requesting both conversational reply and structured feedback
 */
async function callGeminiWithFeedback(
  apiKey: string,
  messages: ChatMessage[],
  scenario: string,
  persona?: CustomAIPersona,
  targetWord?: string
): Promise<{ reply: string; feedback: SpeechFeedback; source: string } | null> {
  const tutorName = persona?.name || 'Luna';
  const strictness = persona?.strictness || 'balanced';

  const systemPrompt = `You are ${tutorName}, an interactive English Voice AI just like ChatGPT Advanced Voice Mode.
You have a warm, natural, human tone. You are speaking directly with the user through voice.

LIVE VOICE FEEDBACK INSTRUCTIONS (CRITICAL FOR CHATGPT VOICE EXPERIENCE):
In your "reply" field:
1. Speak in a completely natural, human, conversational cadence (just like ChatGPT Voice).
2. If the user made a grammar, tense, or preposition mistake: gently give verbal feedback right away! (e.g. "I hear you! Quick tip: instead of 'didn't went', say 'didn't go' because after 'didn't' we use the base verb.").
3. If they used basic vocabulary: suggest a B2/C1 upgrade in voice! (e.g. "Also, instead of 'very happy', a great C1 phrase is 'thrilled to bits'!").
4. Then continue the conversation with an engaging comment and a follow-up question so the dialog keeps flowing.
5. Keep the total response around 2-3 sentences so speech stays snappy, fast, and natural.

Current scenario: ${scenario}.
Personality: ${persona?.personality || 'friendly and supportive'}.
Strictness: ${strictness}.
Custom instructions: ${persona?.customPrompt || 'Teach vocabulary in context and give real-life examples.'}
${targetWord ? `Target word to teach: "${targetWord}".` : ''}

Respond in valid JSON format ONLY with this schema:
{
  "reply": "Conversational spoken text including natural voice feedback, correction, vocabulary tip, and follow-up question.",
  "feedback": {
    "hasMistake": boolean,
    "correction": {
      "original": "exact mistake part from user speech",
      "corrected": "native corrected version",
      "rule": "brief rule explanation in Russian"
    } or null,
    "vocabularyUpgrade": {
      "used": "simple word user used (e.g. good, like, big, hard)",
      "betterAlternative": "advanced B2/C1 synonym (e.g. exceptional, appreciate, massive, demanding)",
      "example": "example sentence showing how to use the better alternative"
    } or null,
    "pronunciationTip": {
      "word": "a word from the sentence that has tricky pronunciation or silent letters",
      "phonetic": "IPA transcription",
      "tip": "pronunciation advice in Russian"
    } or null,
    "fluencyScore": number from 50 to 100,
    "estimatedLevel": "A1" | "A2" | "B1" | "B2" | "C1"
  }
}`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }],
    },
    {
      role: 'model',
      parts: [{ text: '{"reply":"Hello! I am your live voice tutor just like ChatGPT Voice. Speak naturally in English, and I will give you instant voice feedback on every sentence. What is on your mind today?","feedback":{"hasMistake":false,"fluencyScore":100,"estimatedLevel":"B2"}}' }],
    },
    ...messages.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  const modelsToTry = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 600,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.reply) {
            return {
              reply: parsed.reply,
              feedback: parsed.feedback || analyzeSpeechFallback(messages[messages.length - 1]?.content || ''),
              source: 'gemini',
            };
          }
        }
      }
    } catch {
      // Try next model
    }
  }

  return null;
}

/**
 * Built-in pedagogical speech analyzer and feedback generator
 * Produces voice-friendly spoken responses like ChatGPT Voice
 */
function generateSmartTutorWithFeedback(
  messages: ChatMessage[],
  scenario: string,
  persona?: CustomAIPersona,
  targetWord?: string
): { reply: string; feedback: SpeechFeedback } {
  const lastUserText = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
  const feedback = analyzeSpeechFallback(lastUserText);
  const cleanText = lastUserText.toLowerCase().trim();
  const tutorName = persona?.name || 'Luna';

  // Compose live spoken feedback like ChatGPT Voice
  let spokenCorrection = '';
  if (feedback.hasMistake && feedback.correction) {
    spokenCorrection = `Good attempt! Quick tip on your English: instead of "${feedback.correction.original}", remember to say "${feedback.correction.corrected}". `;
  }

  let spokenUpgrade = '';
  if (feedback.vocabularyUpgrade && feedback.vocabularyUpgrade.used !== 'basic expression') {
    spokenUpgrade = `Also, to sound more advanced, you can say "${feedback.vocabularyUpgrade.betterAlternative}" instead of "${feedback.vocabularyUpgrade.used}". `;
  }

  let conversationTail = '';
  if (cleanText.includes('example with') || cleanText.includes('how to use') || cleanText.includes('meaning of')) {
    const wordMatch = cleanText.match(/(?:example with|how to use|meaning of)\s+["']?([a-zA-Z]+)["']?/i);
    const word = wordMatch ? wordMatch[1].toLowerCase() : (targetWord || 'achieve');
    conversationTail = `The word "${word}" is super useful! For example: "Consistent practice allows you to achieve fluency." Can you try making a sentence with "${word}"?`;
  } else if (cleanText.includes('hello') || cleanText.includes('hi') || cleanText.length < 5) {
    conversationTail = `Hello! I'm ${tutorName}, your live voice coach. Speak freely, and I'll give you instant voice feedback. What would you like to chat about today?`;
  } else if (scenario === 'job-interview') {
    conversationTail = `That makes total sense. Could you tell me about a time you handled a difficult deadline or challenge at work?`;
  } else if (scenario === 'travel-airport') {
    conversationTail = `Sounds exciting! Where would you like to travel next, and why?`;
  } else if (scenario === 'ielts-speaking') {
    conversationTail = `Good fluency! How do you think modern technology influences that trend?`;
  } else {
    conversationTail = `I really like how you expressed that! Tell me, what else happened today?`;
  }

  const reply = `${spokenCorrection}${spokenUpgrade}${conversationTail}`.trim();
  return { reply, feedback };
}

/**
 * Deep linguistic rule-based analyzer providing genuine feedback on user's English
 */
function analyzeSpeechFallback(text: string): SpeechFeedback {
  const lower = text.toLowerCase();
  let hasMistake = false;
  let correction: SpeechFeedback['correction'] | undefined;
  let vocabularyUpgrade: SpeechFeedback['vocabularyUpgrade'] | undefined;
  let pronunciationTip: SpeechFeedback['pronunciationTip'] | undefined;

  // 1. Common Grammar & Preposition Mistake Detectors
  if (lower.includes('i didn\'t went') || lower.includes('did not went')) {
    hasMistake = true;
    correction = {
      original: "didn't went",
      corrected: "didn't go",
      rule: 'После вспомогательного глагола "didn\'t" всегда используется начальная форма глагола (Bare Infinitive).',
    };
  } else if (lower.includes('yesterday i go') || lower.includes('yesterday i see')) {
    hasMistake = true;
    correction = {
      original: lower.includes('go') ? 'yesterday I go' : 'yesterday I see',
      corrected: lower.includes('go') ? 'yesterday I went' : 'yesterday I saw',
      rule: 'Маркер времени "yesterday" требует прошедшего времени (Past Simple).',
    };
  } else if (lower.includes('depend of')) {
    hasMistake = true;
    correction = {
      original: 'depend of',
      corrected: 'depend on',
      rule: 'Глагол "depend" в английском языке всегда используется с предлогом "on", а не "of".',
    };
  } else if (lower.includes('listen music')) {
    hasMistake = true;
    correction = {
      original: 'listen music',
      corrected: 'listen to music',
      rule: 'Глагол "listen" требует предлога "to" перед объектом (listen to music / to someone).',
    };
  } else if (lower.includes('he go') || lower.includes('she go')) {
    hasMistake = true;
    correction = {
      original: lower.includes('he') ? 'he go' : 'she go',
      corrected: lower.includes('he') ? 'he goes' : 'she goes',
      rule: 'Для третьего лица единственного числа (he/she/it) в Present Simple добавляется окончание -s/-es.',
    };
  } else if (lower.includes('i have saw') || lower.includes('i have went')) {
    hasMistake = true;
    correction = {
      original: lower.includes('saw') ? 'have saw' : 'have went',
      corrected: lower.includes('saw') ? 'have seen' : 'have gone',
      rule: 'В Present Perfect используется третья форма глагола (Past Participle): have seen / have gone.',
    };
  } else if (lower.includes('interested on')) {
    hasMistake = true;
    correction = {
      original: 'interested on',
      corrected: 'interested in',
      rule: 'Устойчивое сочетание: "interested IN" (заинтересован в чём-то).',
    };
  }

  // 2. Vocabulary Upgrades (Converting simple words to B2/C1)
  const upgradeMap: Record<string, { better: string; ex: string }> = {
    'very good': { better: 'exceptional / superb', ex: 'Her performance was exceptional.' },
    'very bad': { better: 'terrible / appalling', ex: 'The weather was appalling.' },
    'very big': { better: 'massive / colossal', ex: 'A massive amount of data.' },
    'very hard': { better: 'challenging / demanding', ex: 'It was a demanding task.' },
    'very important': { better: 'crucial / vital', ex: 'It is vital to speak regularly.' },
    'i think': { better: 'I believe / From my perspective', ex: 'From my perspective, this is key.' },
    'i like': { better: 'I am passionate about / I appreciate', ex: 'I am passionate about technology.' },
    'a lot of': { better: 'a substantial amount of / numerous', ex: 'There are numerous opportunities.' },
    'help': { better: 'assist / facilitate', ex: 'This tool facilitates active learning.' },
    'good': { better: 'solid / impressive', ex: 'You made an impressive point.' },
  };

  for (const [simpleWord, upgrade] of Object.entries(upgradeMap)) {
    if (lower.includes(simpleWord)) {
      vocabularyUpgrade = {
        used: simpleWord,
        betterAlternative: upgrade.better,
        example: upgrade.ex,
      };
      break;
    }
  }

  if (!vocabularyUpgrade) {
    vocabularyUpgrade = {
      used: 'basic expression',
      betterAlternative: 'foster / enhance',
      example: 'Daily speaking will foster your confidence and enhance fluency.',
    };
  }

  // 3. Pronunciation & Phonetics Tips for tricky words
  const pronunciationMap: Record<string, { ipa: string; tip: string }> = {
    comfortable: { ipa: '/ˈkʌmftəbl/', tip: 'Произносится в 3 слога (KUMF-ter-bl), не "комфортабл"!' },
    vegetable: { ipa: '/ˈvedʒtəbl/', tip: 'Ударение на первый слог: VEJ-tuh-bl, буква "e" в середине редуцируется.' },
    schedule: { ipa: '/ˈskedʒuːl/ (US) или /ˈʃedjuːl/ (UK)', tip: 'В американском: "СКЕДЖУЛ", в британском: "ШЕДЬЮЛ".' },
    subtle: { ipa: '/ˈsʌtl/', tip: 'Буква "b" не произносится (немая буква).' },
    doubt: { ipa: '/daʊt/', tip: 'Буква "b" немая — произносится просто "ДАУТ".' },
    receipt: { ipa: '/rɪˈsiːt/', tip: 'Буква "p" не читается — произносится "РИСИТ".' },
    Wednesday: { ipa: '/ˈwenzdeɪ/', tip: 'Буква "d" немая — произносится "УЭНЗДЕЙ".' },
    achieve: { ipa: '/əˈtʃiːv/', tip: 'Долгий звук [iː], ударение на второй слог: э-ЧИИВ.' },
    resilient: { ipa: '/rɪˈzɪl.jənt/', tip: 'Ударение на слог "ЗИЛ": ри-ЗИЛ-йэнт.' },
  };

  for (const [w, info] of Object.entries(pronunciationMap)) {
    if (lower.includes(w)) {
      pronunciationTip = {
        word: w,
        phonetic: info.ipa,
        tip: info.tip,
      };
      break;
    }
  }

  if (!pronunciationTip) {
    pronunciationTip = {
      word: 'th sound (the / think)',
      phonetic: '/ð/ and /θ/',
      tip: 'Кончик языка между зубами — не заменяйте на [з] или [с].',
    };
  }

  // 4. Calculate Fluency & CEFR Level
  const wordCount = text.trim().split(/\s+/).length;
  let fluencyScore = 80;
  let estimatedLevel: SpeechFeedback['estimatedLevel'] = 'B1';

  if (hasMistake) {
    fluencyScore -= 15;
  }
  if (wordCount >= 10) {
    fluencyScore += 10;
    estimatedLevel = 'B2';
  }
  if (wordCount >= 20) {
    fluencyScore += 5;
    estimatedLevel = 'C1';
  }
  if (wordCount < 4) {
    fluencyScore -= 10;
    estimatedLevel = 'A2';
  }

  fluencyScore = Math.min(98, Math.max(55, fluencyScore));

  return {
    hasMistake,
    correction,
    vocabularyUpgrade,
    pronunciationTip,
    fluencyScore,
    estimatedLevel,
  };
}
