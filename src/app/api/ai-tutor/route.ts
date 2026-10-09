import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages = [], scenario = 'daily-chat', customApiKey, targetWord } = body as {
      messages: ChatMessage[];
      scenario?: string;
      customApiKey?: string;
      targetWord?: string;
    };

    const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    // 1. Try Gemini API if an API key is available
    if (apiKey) {
      try {
        const geminiResult = await callGeminiAPI(apiKey, messages, scenario, targetWord);
        if (geminiResult) {
          return NextResponse.json({ reply: geminiResult, source: 'gemini' });
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to built-in tutor engine:', err);
      }
    }

    // 2. Built-in Smart AI Tutor Engine fallback (works immediately without any external API keys)
    const engineResult = generateSmartTutorResponse(messages, scenario, targetWord);
    return NextResponse.json({ reply: engineResult, source: 'built-in' });
  } catch (error) {
    console.error('Error in ai-tutor route:', error);
    return NextResponse.json(
      { reply: "I'm here! Could you please repeat that? I'd love to practice with you.", source: 'fallback' },
      { status: 200 }
    );
  }
}

/**
 * Call Google Gemini 1.5 Flash API
 */
async function callGeminiAPI(
  apiKey: string,
  messages: ChatMessage[],
  scenario: string,
  targetWord?: string
): Promise<string | null> {
  const systemPrompt = `You are Luna, an engaging, supportive and enthusiastic English voice tutor in the VocabFlow application.
Your main goals:
1. Speak in natural, conversational English suitable for text-to-speech audio playback.
2. Teach English vocabulary naturally in context. Whenever relevant, explain word meanings and provide 1-2 vivid real-life examples.
3. Keep responses relatively concise (2-4 sentences or short lines) so they are enjoyable to listen to and easy to respond to.
4. If the user makes a grammar or word choice mistake, gently and warmly correct it first, then continue the topic.
5. End with an open-ended question that encourages the user to speak or make their own sentence with a word.
Current scenario: ${scenario}.
${targetWord ? `Focus target vocabulary word for this session: "${targetWord}".` : ''}`;

  // Format messages for Gemini API
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }],
    },
    {
      role: 'model',
      parts: [{ text: "Understood! I'm ready to be an encouraging, friendly English tutor. Let's start speaking!" }],
    },
    ...messages.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return cleanResponseText(replyText);
        }
      }
    } catch {
      // Continue to next model or fallback
    }
  }

  return null;
}

function cleanResponseText(text: string): string {
  // Strip excessive markdown asterisks or markdown code blocks for clean voice reading
  return text.replace(/\*\*(.*?)\*\*/g, '$1').trim();
}

/**
 * Built-in pedagogical conversational engine
 * Handles speech practice, word definitions, vivid examples, and scenario dialogues
 */
function generateSmartTutorResponse(
  messages: ChatMessage[],
  scenario: string,
  targetWord?: string
): string {
  const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase().trim() || '';

  // 1. If user asks about a specific word or asking for an example
  if (lastUserMsg.includes('example with') || lastUserMsg.includes('how to use') || lastUserMsg.includes('meaning of') || lastUserMsg.includes('what does')) {
    const wordMatch = lastUserMsg.match(/(?:example with|how to use|meaning of|what does)\s+["']?([a-zA-Z]+)["']?/i);
    const word = wordMatch ? wordMatch[1].toLowerCase() : (targetWord || 'resilient');

    const examplesDatabase: Record<string, { def: string; examples: string[]; question: string }> = {
      achieve: {
        def: 'to successfully reach a goal through consistent effort',
        examples: [
          'With just 15 minutes of daily practice, you will achieve fluency much faster.',
          'She worked relentlessly to achieve her target IELTS score.',
        ],
        question: 'What is one major goal you want to achieve this year?',
      },
      resilient: {
        def: 'able to withstand or recover quickly from difficult conditions',
        examples: [
          'Successful language learners are resilient — they treat mistakes as lessons.',
          'The team remained resilient despite facing numerous technical obstacles.',
        ],
        question: 'Can you describe a time when you had to be resilient?',
      },
      reluctant: {
        def: 'unwilling and hesitant to do something',
        examples: [
          'Many students are reluctant to speak at first because they fear making mistakes.',
          'He was reluctant to change his morning routine.',
        ],
        question: 'Are you usually eager or reluctant to speak English with foreigners?',
      },
      meticulous: {
        def: 'showing great attention to detail; very careful and precise',
        examples: [
          'She is meticulous when writing code and reviewing documentation.',
          'He gave a meticulous presentation with zero errors.',
        ],
        question: 'Are you meticulous about learning pronunciation or do you prefer speaking freely?',
      },
      persistent: {
        def: 'continuing firmly in an action despite difficulty or opposition',
        examples: [
          'If you are persistent, you can master hundreds of new words each month.',
          'Her persistent efforts finally paid off when she got hired.',
        ],
        question: 'What habit has helped you stay persistent in your studies?',
      },
      vague: {
        def: 'not clearly expressed or easily understood; ambiguous',
        examples: [
          'His explanation was so vague that nobody understood the plan.',
          'Try to avoid vague answers in your interview; always give concrete details.',
        ],
        question: 'Has someone ever given you very vague directions?',
      },
    };

    const entry = examplesDatabase[word] || {
      def: `a useful English word that elevates your spoken expression`,
      examples: [
        `Using "${word}" will make your conversation sound much more natural and sophisticated.`,
        `Practice saying: "I recently learned how to use ${word} in daily conversation."`,
      ],
      question: `Can you try making a short sentence using the word "${word}"?`,
    };

    return `Great question! The word "${word}" means ${entry.def}.\n\nHere are real-life examples:\n1. ${entry.examples[0]}\n2. ${entry.examples[1]}\n\n${entry.question}`;
  }

  // 2. Scenario-specific interactive responses
  switch (scenario) {
    case 'job-interview': {
      if (lastUserMsg.includes('experience') || lastUserMsg.includes('worked') || lastUserMsg.includes('project')) {
        return `That sounds like very valuable experience! A great word to use in interviews is "collaborate" (to work together). For example: "I collaborated closely with designers to achieve our deadline." How do you usually resolve disagreements within a team?`;
      }
      if (lastUserMsg.includes('weakness') || lastUserMsg.includes('strength')) {
        return `A great interview strategy is being candid (honest and straightforward). For example: "I am meticulous about quality, but I have learned to balance it with speed." What is an area where you have improved recently?`;
      }
      return `Welcome to the interview practice! Let's start with a classic: "Could you tell me a little bit about yourself and what you are passionate about?" Remember to use active action verbs!`;
    }

    case 'travel-airport': {
      if (lastUserMsg.includes('ticket') || lastUserMsg.includes('gate') || lastUserMsg.includes('flight')) {
        return `Got it! At the airport, useful terms are "boarding pass", "departure gate", and "carry-on luggage". For example: "Excuse me, could you direct me to Gate 14?" Where is your dream travel destination right now?`;
      }
      if (lastUserMsg.includes('hotel') || lastUserMsg.includes('room') || lastUserMsg.includes('book')) {
        return `Nice! When checking in, you can say: "I have a reservation under the name..." or ask: "Is breakfast included in the booking?" Do you prefer traveling alone or with friends?`;
      }
      return `Hello traveler! Imagine we just landed at London Heathrow airport. Are you heading to the baggage claim or the passport control first?`;
    }

    case 'ielts-speaking': {
      if (lastUserMsg.length > 30) {
        return `Good elaboration! To push your score into Band 7.5+, try incorporating cohesive devices like "furthermore", "in contrast", or "from my perspective". For example: "Furthermore, this approach fosters long-term growth." What do you think is the biggest advantage of modern technology in education?`;
      }
      return `Welcome to the IELTS Speaking room. In Part 2, examiners look for fluency and lexical resource. Let's discuss: "Describe a skill you found challenging to learn at first." Try to use words like "initially", "struggle", and "eventually"!`;
    }

    case 'vocabulary-drill': {
      if (lastUserMsg.length > 5) {
        return `Well said! That sentence is clear. Let's introduce a high-impact word: "enhance" (to improve or increase in quality). Example: "Reading daily will enhance your vocabulary." Can you write or say one sentence using "enhance"?`;
      }
      return `Welcome to your Vocabulary Drill! I am here to teach you words and test them in conversation. Would you like to practice B1 words, B2 advanced words, or IT & business vocabulary?`;
    }

    case 'daily-chat':
    default: {
      if (lastUserMsg.includes('hello') || lastUserMsg.includes('hi') || lastUserMsg.includes('hey')) {
        return `Hello there! I'm Luna, your AI conversation partner. How is your day going so far, and what would you like to talk about today?`;
      }
      if (lastUserMsg.includes('how are you')) {
        return `I'm doing fantastic, thank you! Ready to learn some exciting English words with you. What did you do earlier today?`;
      }
      if (lastUserMsg.includes('teach') || lastUserMsg.includes('learn') || lastUserMsg.includes('word')) {
        return `I'd love to! Today's featured word is "eloquent" (speaking clearly and persuasively). For example: "Martin Luther King was an eloquent speaker." Can you think of someone who is eloquent?`;
      }

      return `That is really interesting! Notice how you expressed that. A great word to add to your repertoire is "fascinating" (extremely interesting). For instance: "That sounds like a fascinating experience!" Tell me more about your thoughts on this!`;
    }
  }
}
