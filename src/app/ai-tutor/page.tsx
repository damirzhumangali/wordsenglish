'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Key,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Plane,
  GraduationCap,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';
import { speakWord, createSpeechRecognizer, isSpeechRecognitionSupported } from '@/lib/speech';
import { AIMessage, AIScenarioId, AIScenario, CustomAIPersona, SpeechFeedback } from '@/types/ai';
import { GeminiLiveMode } from '@/components/ai/GeminiLiveMode';
import { SpeechFeedbackCard } from '@/components/ai/SpeechFeedbackCard';
import { CustomPersonaModal } from '@/components/ai/CustomPersonaModal';

const SCENARIOS: AIScenario[] = [
  {
    id: 'vocabulary-drill',
    name: 'Учить слова & примеры',
    description: 'ИИ объясняет значение слов, даёт примеры и тренирует их в речи',
    icon: 'BookOpen',
    systemPrompt: 'Teach vocabulary words in context, explain meanings and provide clear real-life examples.',
    initialMessage: "Hello! I'm Luna, your vocabulary tutor. I can teach you any English word, explain its nuances, and show real-life examples. What word or topic would you like to explore today?",
    suggestions: [
      'Teach me a high-impact B2 word',
      'Give an example with "achieve"',
      'What does "resilient" mean?',
      'How do I use "reluctant" in daily conversation?',
    ],
  },
  {
    id: 'daily-chat',
    name: 'Разговорный английский',
    description: 'Свободный диалог на любые темы с исправлением ошибок',
    icon: 'MessageSquare',
    systemPrompt: 'Casual everyday English conversation with gentle corrections and vocabulary enrichment.',
    initialMessage: "Hi there! Let's chat in English just like friends having coffee. How has your day been so far?",
    suggestions: [
      'Tell me about your favorite hobbies',
      'What are good words to describe feelings?',
      'How was your weekend?',
      'Give me tips to sound more natural in English',
    ],
  },
  {
    id: 'job-interview',
    name: 'Собеседование (Work & IT)',
    description: 'Вопросы для интервью, профессиональная лексика и самопрезентация',
    icon: 'Briefcase',
    systemPrompt: 'Professional job interview simulation with formal workplace and tech vocabulary.',
    initialMessage: 'Welcome to your job interview practice. To start, could you introduce yourself and tell me about a project you are proud of?',
    suggestions: [
      'Tell me about your greatest strength',
      'How do you handle tight deadlines?',
      'Useful words for tech meetings',
      'How to explain a career gap professionally?',
    ],
  },
  {
    id: 'travel-airport',
    name: 'Путешествия & Аэропорт',
    description: 'Диалоги в отеле, аэропорту, кафе и навигация по городу',
    icon: 'Plane',
    systemPrompt: 'Travel scenarios including airports, check-in, ordering food, and asking directions.',
    initialMessage: 'Welcome aboard! Imagine you just landed in London or New York. Where are you heading first?',
    suggestions: [
      'Order food and coffee at a cafe',
      'Ask for directions to the train station',
      'Check in at a hotel with special requests',
      'Solve a lost luggage problem at the airport',
    ],
  },
  {
    id: 'ielts-speaking',
    name: 'IELTS / TOEFL Speaking',
    description: 'Вопросы Speaking Part 1-3, академическая лексика на Band 7.5+',
    icon: 'GraduationCap',
    systemPrompt: 'IELTS speaking exam simulation with high-level lexical resource feedback.',
    initialMessage: "Welcome to IELTS Speaking practice. Let's look at Part 2: Describe an ambitious goal you achieved in the past. Try to use advanced adjectives!",
    suggestions: [
      'Describe a memorable journey',
      'How does technology impact modern education?',
      'High-band vocabulary for environmental issues',
      'Tips for speaking fluently without long pauses',
    ],
  },
];

export default function AITutorPage() {
  const { profile } = useApp();

  const [activeScenarioId, setActiveScenarioId] = useState<AIScenarioId>('vocabulary-drill');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  const [currentPersona, setCurrentPersona] = useState<CustomAIPersona>({
    id: 'persona-default',
    name: 'Luna',
    roleTitle: 'Personal Speech Coach',
    personality: 'friendly',
    strictness: 'balanced',
    feedbackFocus: ['grammar', 'vocabulary', 'pronunciation'],
    speechAccent: 'en-US',
  });

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<any>(null);

  // Load custom Gemini API key and persona from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('vocabflow_gemini_api_key');
      if (savedKey) setCustomApiKey(savedKey);

      const savedPersona = localStorage.getItem('vocabflow_custom_ai_persona');
      if (savedPersona) setCurrentPersona(JSON.parse(savedPersona));
    } catch {}
  }, []);

  // Initialize messages on scenario change
  useEffect(() => {
    setMessages([
      {
        id: `msg-init-${Date.now()}`,
        role: 'assistant',
        content: activeScenario.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [activeScenarioId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    sound.playTap();
    setInputText('');
    setSpeechTranscript('');

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          scenario: activeScenarioId,
          customApiKey: customApiKey.trim() || undefined,
          customPersona: currentPersona,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "That's a great thought! Let's continue practicing.";
      const feedback = data.feedback as SpeechFeedback | undefined;

      const assistantMessage: AIMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Attach feedback to user message
      setMessages((prev) => {
        const copy = [...prev];
        const lastUser = copy.find((m) => m.id === userMessage.id);
        if (lastUser && feedback) {
          lastUser.feedback = feedback;
        }
        return [...copy, assistantMessage];
      });

      // Auto-speak response if enabled
      if (autoSpeak) {
        setTimeout(() => {
          speakWord(reply, currentPersona?.speechAccent || 'en-US', undefined, currentPersona?.voicePersona || 'sky');
        }, 200);
      }
    } catch {
      const fallbackMsg: AIMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "I'm right here! Could you please try repeating that? Let's keep learning together.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakText = (text: string) => {
    sound.playTap();
    speakWord(text, currentPersona?.speechAccent || 'en-US', undefined, currentPersona?.voicePersona || 'sky');
  };

  const startVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Голосовой ввод не поддерживается в этом браузере. Рекомендуем Google Chrome или Safari.');
      return;
    }

    sound.playTap();
    setIsListening(true);
    setSpeechTranscript('');

    const recognizer = createSpeechRecognizer(
      (result) => {
        setSpeechTranscript(result.transcript);
        setInputText(result.transcript);
        if (result.isFinal && result.transcript.trim()) {
          setIsListening(false);
          handleSendMessage(result.transcript);
        }
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch {}
    }
  };

  const stopVoiceInput = () => {
    sound.playTap();
    setIsListening(false);
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }
    if (speechTranscript.trim()) {
      handleSendMessage(speechTranscript);
    }
  };

  const handleSaveApiKey = (key: string) => {
    sound.playTap();
    setCustomApiKey(key);
    try {
      localStorage.setItem('vocabflow_gemini_api_key', key);
    } catch {}
    setShowKeyModal(false);
  };

  const handleResetChat = () => {
    sound.playTap();
    setMessages([
      {
        id: `msg-init-${Date.now()}`,
        role: 'assistant',
        content: activeScenario.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Luna — ИИ Voice Tutor
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                Gemini AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Живой разговорный английский, изучение слов в контексте и реальные примеры
            </p>
          </div>
        </div>

        {/* Action Controls: Custom AI persona, Gemini Live, Auto-voice, Key, Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setShowPersonaModal(true);
            }}
            className="py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-indigo-100 transition-colors shadow-xs"
            title="Настроить характер и строгость своего ИИ"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Свой ИИ: {currentPersona.name}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setIsLiveModeOpen(true);
            }}
            className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all ring-1 ring-emerald-400/40"
            title="Открыть живой голосовой режим как в ChatGPT с мгновенным фидбэком"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>🎙️ Живой голос как в GPT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setAutoSpeak(!autoSpeak);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              autoSpeak
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Автоматически озвучивать ответы ИИ голосом"
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{autoSpeak ? 'Голос: Вкл' : 'Голос: Выкл'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setShowKeyModal(true);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Настройки Gemini API ключа"
          >
            <Key className="w-3.5 h-3.5 text-indigo-500" />
            <span>{customApiKey ? 'Gemini: Свой ключ' : 'Gemini: Встроенный'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetChat}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Очистить диалог"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scenario Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {SCENARIOS.map((sc) => {
          const isSelected = sc.id === activeScenarioId;
          return (
            <button
              key={sc.id}
              onClick={() => {
                sound.playTap();
                setActiveScenarioId(sc.id);
              }}
              className={`py-2 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{sc.name}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 min-h-[460px] max-h-[580px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isUser
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-sm'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                <div
                  className={`rounded-2xl p-4 space-y-2 ${
                    isUser
                      ? 'bg-emerald-500 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.content}
                  </div>

                  {/* Footer of message: audio replay button + timestamp */}
                  <div
                    className={`flex items-center justify-between text-[11px] pt-1 border-t ${
                      isUser
                        ? 'border-emerald-400/40 text-emerald-100'
                        : 'border-slate-200/60 dark:border-slate-700/60 text-slate-400'
                    }`}
                  >
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleSpeakText(msg.content)}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Послушать</span>
                      </button>
                    )}
                    <span className="ml-auto">{msg.timestamp}</span>
                  </div>
                </div>

                {/* Real Speech Feedback Card for user's message */}
                {isUser && msg.feedback && (
                  <SpeechFeedbackCard feedback={msg.feedback} />
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3.5 px-5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150" />
              <span className="ml-2">Luna печатает ответ и подбирает примеры...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Подсказки:
        </span>
        {activeScenario.suggestions.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(sug)}
            className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Voice Transcript Live Banner */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300 truncate">
              {speechTranscript || 'Слушаю вас... Говорите на английском'}
            </span>
          </div>
          <button
            type="button"
            onClick={stopVoiceInput}
            className="px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
          >
            Готово
          </button>
        </motion.div>
      )}

      {/* Input Bar: Voice mic + Text input + Send */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={isListening ? stopVoiceInput : startVoiceInput}
          className={`p-3.5 rounded-2xl text-white font-bold transition-all cursor-pointer shadow-md ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
          }`}
          title={isListening ? 'Остановить запись' : 'Говорить голосом в микрофон'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Спросите значение слова, попросите пример или ответьте..."
            className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 disabled:opacity-40 font-bold transition-all cursor-pointer shadow-sm shadow-slate-900/20"
          title="Отправить сообщение"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>Настройка Google Gemini AI</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              По умолчанию уже работает наш встроенный ИИ-репетитор! Если у вас есть личный ключ <strong>Gemini API Key</strong>, вставьте его ниже для максимальной мощности нейросети:
            </p>

            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleSaveApiKey(customApiKey)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Сохранить
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Gemini Live Hands-Free Fullscreen Mode */}
      <GeminiLiveMode
        isOpen={isLiveModeOpen}
        onClose={() => setIsLiveModeOpen(false)}
        activeScenario={activeScenario}
        onScenarioChange={(id) => setActiveScenarioId(id)}
        scenarios={SCENARIOS}
        customApiKey={customApiKey}
        customPersona={currentPersona}
      />
      {/* Custom Persona Configuration Modal */}
      <CustomPersonaModal
        isOpen={showPersonaModal}
        onClose={() => setShowPersonaModal(false)}
        currentPersona={currentPersona}
        onSave={(updated) => {
          setCurrentPersona(updated);
          try {
            localStorage.setItem('vocabflow_custom_ai_persona', JSON.stringify(updated));
          } catch {}
        }}
      />
    </div>
  );
}
