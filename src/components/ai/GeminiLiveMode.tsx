'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Award,
  Radio,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import {
  speakWord,
  stopSpeaking,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  CHATGPT_VOICE_PRESETS,
  VoicePersona,
} from '@/lib/speech';
import { AIScenario, AIScenarioId, CustomAIPersona, SpeechFeedback } from '@/types/ai';
import { SpeechFeedbackCard } from '@/components/ai/SpeechFeedbackCard';

interface GeminiLiveModeProps {
  isOpen: boolean;
  onClose: () => void;
  activeScenario: AIScenario;
  onScenarioChange: (id: AIScenarioId) => void;
  scenarios: AIScenario[];
  customApiKey?: string;
  customPersona?: CustomAIPersona;
}

type LiveStatus = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused';

interface LiveMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

export function GeminiLiveMode({
  isOpen,
  onClose,
  activeScenario,
  onScenarioChange,
  scenarios,
  customApiKey,
  customPersona,
}: GeminiLiveModeProps) {
  const [status, setStatus] = useState<LiveStatus>('listening');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversation, setConversation] = useState<LiveMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<SpeechFeedback | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(
    customPersona?.voicePersona || 'sky'
  );
  const [taughtWords, setTaughtWords] = useState<
    { word: string; translation: string; pronunciation: string; example: string }[]
  >([]);

  const recognizerRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef('');
  const conversationRef = useRef<LiveMessage[]>([]);
  const isComponentActiveRef = useRef(false);

  const tutorName = customPersona?.name || 'Luna';
  const tutorAccent = customPersona?.speechAccent || 'en-US';

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Start Live session when opened
  useEffect(() => {
    if (!isOpen) {
      isComponentActiveRef.current = false;
      stopSpeaking();
      stopListening();
      return;
    }

    isComponentActiveRef.current = true;
    sound.playTap();
    setLatestFeedback(null);

    // Initial greeting tailored to persona and scenario
    const greetingText =
      activeScenario.id === 'vocabulary-drill'
        ? `Hello! I'm ${tutorName}, your live voice tutor just like ChatGPT Voice. Speak naturally, and I'll give you real voice feedback on your grammar, vocabulary, and pronunciation. What would you like to practice today?`
        : `Hello! I'm ${tutorName}. Let's practice ${activeScenario.name}. Speak freely, and I'll give you spoken feedback after each thought!`;

    setConversation([
      {
        id: `gemini-init-${Date.now()}`,
        sender: 'gemini',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Speak initial greeting and start listening
    playGeminiSpeech(greetingText);

    return () => {
      isComponentActiveRef.current = false;
      stopSpeaking();
      stopListening();
    };
  }, [isOpen, activeScenario.id, tutorName]);

  const stopListening = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const startListening = () => {
    if (!isComponentActiveRef.current || isMuted) return;
    if (!isSpeechRecognitionSupported()) return;

    stopListening();
    setStatus('listening');
    setLiveTranscript('');
    currentTranscriptRef.current = '';

    const recognizer = createSpeechRecognizer(
      (result) => {
        if (!isComponentActiveRef.current) return;

        // If user speaks while Gemini was speaking, interrupt immediately!
        if (status === 'speaking') {
          stopSpeaking();
        }

        setStatus('listening');
        setLiveTranscript(result.transcript);
        currentTranscriptRef.current = result.transcript;

        // Reset silence timer on every new speech event
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Detect user pause (1.4s of silence) -> auto-send to Gemini Live
        if (result.transcript.trim().length > 3) {
          silenceTimerRef.current = setTimeout(() => {
            if (currentTranscriptRef.current.trim()) {
              handleSendToGemini(currentTranscriptRef.current.trim());
            }
          }, 1400);
        }
      },
      () => {
        // Recognition error
      },
      () => {
        // Recognition ended: if still listening and active, auto-restart
        if (isComponentActiveRef.current && status === 'listening' && !isMuted) {
          setTimeout(() => {
            if (isComponentActiveRef.current && status === 'listening') {
              startListening();
            }
          }, 300);
        }
      },
      true // continuous mode
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch {}
    }
  };

  const handleSendToGemini = async (userText: string) => {
    if (!isComponentActiveRef.current || !userText.trim()) return;

    stopListening();
    setStatus('thinking');
    setLiveTranscript('');
    currentTranscriptRef.current = '';

    const newMsg: LiveMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedConv = [...conversationRef.current, newMsg];
    setConversation(updatedConv);

    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedConv.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          scenario: activeScenario.id,
          customApiKey: customApiKey?.trim() || undefined,
          customPersona: customPersona,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I heard you! That's a great sentence. Let's keep going!";

      if (data.feedback) {
        setLatestFeedback(data.feedback);
      }

      const geminiMsg: LiveMessage = {
        id: `gemini-${Date.now()}`,
        sender: 'gemini',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversation((prev) => [...prev, geminiMsg]);

      // Scan and extract vocabulary taught in response
      extractVocabularyWords(reply);

      // Speak response aloud and auto-resume listening when done
      playGeminiSpeech(reply);
    } catch {
      setStatus('listening');
      startListening();
    }
  };

  const handleVoiceChange = (voice: VoicePersona) => {
    sound.playTap();
    setSelectedVoice(voice);
    stopSpeaking();
    stopListening();
    const samples: Record<VoicePersona, string> = {
      sky: "Hi, I'm Sky. Ready to practice speaking with you!",
      alloy: "Hello, I'm Alloy. Let's work on your vocabulary and fluency.",
      nova: "Hey there! I'm Nova, excited to chat with you!",
      echo: "Hello, I am Echo. Speak naturally, I'm listening.",
    };
    speakWord(samples[voice], tutorAccent, undefined, voice).then(() => {
      if (isComponentActiveRef.current && !isMuted) {
        setStatus('listening');
        startListening();
      }
    });
  };

  const playGeminiSpeech = async (text: string) => {
    if (!isComponentActiveRef.current) return;
    setStatus('speaking');

    try {
      await speakWord(text, tutorAccent, undefined, selectedVoice);
    } catch {
      // Ignore
    }

    // When speaking completes, resume listening for the user's turn
    if (isComponentActiveRef.current && !isMuted) {
      setStatus('listening');
      startListening();
    }
  };

  // Extract taught words from Gemini text to populate the live vocabulary board
  const extractVocabularyWords = (text: string) => {
    const knownWords: Record<string, { ru: string; ipa: string; ex: string }> = {
      achieve: { ru: 'достигать', ipa: '/əˈtʃiːv/', ex: 'You will achieve fluency with practice.' },
      resilient: { ru: 'стойкий, живучий', ipa: '/rɪˈzɪl.jənt/', ex: 'Language learners are resilient.' },
      reluctant: { ru: 'неохотный, сомневающийся', ipa: '/rɪˈlʌk.tənt/', ex: 'Never be reluctant to speak.' },
      meticulous: { ru: 'дотошный, тщательный', ipa: '/məˈtɪk.jə.ləs/', ex: 'Be meticulous with details.' },
      eloquent: { ru: 'красноречивый', ipa: '/ˈel.ə.kwənt/', ex: 'An eloquent speaker convinces all.' },
      vague: { ru: 'смутный, неясный', ipa: '/veɪɡ/', ex: 'Avoid vague explanations.' },
      enhance: { ru: 'улучшать, усиливать', ipa: '/ɪnˈhæns/', ex: 'Reading will enhance your skills.' },
      foster: { ru: 'способствовать, развивать', ipa: '/ˈfɒs.tər/', ex: 'Foster good study habits.' },
      collaborate: { ru: 'сотрудничать', ipa: '/kəˈlæb.ə.reɪt/', ex: 'We collaborate with the team.' },
      fascinating: { ru: 'увлекательный', ipa: '/ˈfæs.ən.eɪ.tɪŋ/', ex: 'A fascinating conversation!' },
    };

    const lower = text.toLowerCase();
    Object.keys(knownWords).forEach((w) => {
      if (lower.includes(w) && !taughtWords.some((item) => item.word === w)) {
        setTaughtWords((prev) => [
          { word: w, translation: knownWords[w].ru, pronunciation: knownWords[w].ipa, example: knownWords[w].ex },
          ...prev.slice(0, 5),
        ]);
      }
    });
  };

  const toggleMute = () => {
    sound.playTap();
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
      stopSpeaking();
      setStatus('paused');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-3xl h-[92vh] max-h-[820px] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {tutorName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPT VOICE LIVE</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                  {tutorAccent === 'en-GB' ? '🇬🇧 UK Accent' : '🇺🇸 US Accent'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Живой диалог как в ChatGPT • Голосовые исправления и фидбэк
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              stopSpeaking();
              stopListening();
              onClose();
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            title="Закрыть Live Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ChatGPT Voice Picker Bar (Sky, Alloy, Nova, Echo) */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none relative z-10 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Голос GPT:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {CHATGPT_VOICE_PRESETS.map((v) => {
              const isSelected = selectedVoice === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => handleVoiceChange(v.id as VoicePersona)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={`${v.name}: ${v.description}`}
                >
                  <span>{v.gender === 'Female' ? '👩' : '👨'}</span>
                  <span>{v.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenario Switcher Pills */}
        <div className="px-4 py-2 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none relative z-10 shrink-0">
          {scenarios.map((sc) => {
            const isSel = sc.id === activeScenario.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  sound.playTap();
                  stopSpeaking();
                  onScenarioChange(sc.id);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sc.name}
              </button>
            );
          })}
        </div>

        {/* Central Live Interactive Area - Scrollable */}
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 text-center relative z-10 overflow-y-auto space-y-4">
          {/* Animated Gemini Dynamic Orb */}
          <div className="relative my-2 shrink-0">
            {/* Outer pulsating rings */}
            <AnimatePresence>
              {status === 'listening' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 blur-xl pointer-events-none"
                />
              )}
              {status === 'speaking' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  className="absolute inset-0 -m-10 rounded-full bg-gradient-to-r from-indigo-500/35 via-purple-500/35 to-pink-500/35 blur-xl pointer-events-none"
                />
              )}
              {status === 'thinking' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-0 -m-6 rounded-full bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-lg pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Core Orb */}
            <div
              className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative select-none ${
                status === 'speaking'
                  ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-indigo-500/40 scale-105'
                  : status === 'thinking'
                  ? 'bg-gradient-to-tr from-indigo-700 via-purple-800 to-cyan-700 shadow-purple-500/30'
                  : status === 'paused'
                  ? 'bg-slate-800 border-2 border-slate-700 text-slate-500'
                  : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/30'
              }`}
            >
              {/* Sound waves representation */}
              <div className="flex items-center gap-1.5 h-10">
                {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5].map((delay, idx) => (
                  <motion.div
                    key={idx}
                    animate={
                      status === 'speaking' || status === 'listening'
                        ? { scaleY: [0.3, 1.2, 0.4] }
                        : { scaleY: 0.25 }
                    }
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: delay * 0.2,
                      ease: 'easeInOut',
                    }}
                    className="w-1.5 h-full rounded-full bg-white/90"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status Label */}
          <div className="space-y-1">
            <div className="text-sm font-bold tracking-wide uppercase text-slate-300">
              {status === 'listening' && `🟢 Слушаю вас... Говорите (${tutorName} на связи)`}
              {status === 'thinking' && `🟣 ${tutorName} анализирует грамматику и готовит фидбэк...`}
              {status === 'speaking' && `🔵 ${tutorName} говорит... Слушайте произношение`}
              {status === 'paused' && '⏸️ Разговор на паузе'}
            </div>
            <p className="text-xs text-slate-400">
              {status === 'listening'
                ? 'Сделайте паузу, когда закончите мысль — ИИ ответит и проверит ошибки'
                : 'Вы можете начать говорить в любой момент, чтобы перебить ИИ'}
            </p>
          </div>

          {/* Live Subtitle / Transcript Banner */}
          <div className="w-full max-w-xl min-h-[46px] p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-xs sm:text-sm font-medium text-slate-200 italic flex items-center justify-center">
            {liveTranscript ? (
              <span>&ldquo;{liveTranscript}&rdquo;</span>
            ) : conversation.length > 0 ? (
              <span className="line-clamp-2">
                &ldquo;{conversation[conversation.length - 1].text}&rdquo;
              </span>
            ) : (
              <span className="text-slate-500">Ожидание первого слова...</span>
            )}
          </div>

          {/* Real-Time Speech Feedback Card */}
          {latestFeedback && (
            <div className="w-full max-w-xl text-left animate-fadeIn">
              <SpeechFeedbackCard feedback={latestFeedback} />
            </div>
          )}

          {/* Live Taught Vocabulary Board */}
          {taughtWords.length > 0 && (
            <div className="w-full max-w-xl pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center justify-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Изученные слова в этом разговоре:</span>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {taughtWords.map((item) => (
                  <div
                    key={item.word}
                    className="px-2.5 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-left text-xs"
                  >
                    <span className="font-bold text-white">{item.word}</span>{' '}
                    <span className="text-slate-400 font-mono text-[10px]">{item.pronunciation}</span>{' '}
                    <span className="text-emerald-400 font-semibold">— {item.translation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Mute / Interrupt / Restart */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-center gap-4 relative z-10 shrink-0">
          <button
            onClick={toggleMute}
            className={`py-3 px-5 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md ${
              isMuted
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Включить микрофон' : 'Микрофон активен'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              stopSpeaking();
              if (!isMuted) {
                setStatus('listening');
                startListening();
              }
            }}
            className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            title="Остановить речь ИИ и говорить самому"
          >
            <Zap className="w-4 h-4" />
            <span>Перебить ИИ / Моя очередь</span>
          </button>
        </div>
      </div>
    </div>
  );
}
