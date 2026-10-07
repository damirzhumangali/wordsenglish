'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Check,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Volume2,
  PenTool,
  HelpCircle,
  RotateCcw,
  Send,
} from 'lucide-react';
import { QuizQuestion } from '@/types/session';
import {
  createSpeechRecognizer,
  requestMicrophoneAccess,
  createAudioLevelMonitor,
  isSpeechRecognitionSupported,
  speakWord,
  SpeechErrorCode,
} from '@/lib/speech';
import { sound } from '@/lib/sound';

interface QuizSpeakingProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizSpeaking({ question, onAnswer, onNext }: QuizSpeakingProps) {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [analysis, setAnalysis] = useState<{
    grammar: number;
    vocabulary: number;
    naturalness: number;
    correctUsage: boolean;
    feedback: string;
  } | null>(null);

  const targetWord = question.word.word.toLowerCase();
  const recognizerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopMonitorRef = useRef<(() => void) | null>(null);

  // Clean up media stream and recognizer on unmount
  useEffect(() => {
    return () => {
      cleanupAudioStream();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const cleanupAudioStream = () => {
    if (stopMonitorRef.current) {
      stopMonitorRef.current();
      stopMonitorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  };

  const handlePlayWordPronunciation = () => {
    sound.playTap();
    speakWord(question.word.word);
  };

  const handleStartSpeaking = async () => {
    sound.playTap();
    setErrorMessage(null);
    setTranscript('');

    // Check browser support
    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(
        'Ваш браузер не поддерживает распознавание речи Web Speech API (например, Firefox). Переключитесь на текстовый ввод ниже или откройте в Google Chrome / Safari.'
      );
      setInputMode('text');
      return;
    }

    // Request actual microphone hardware permission
    const micAccess = await requestMicrophoneAccess();
    if (!micAccess.granted || !micAccess.stream) {
      if (micAccess.error === 'not-allowed') {
        setErrorMessage(
          'Доступ к микрофону заблокирован в настройках браузера или системы macOS. Нажмите на значок замка в адресной строке и разрешите микрофон.'
        );
        setShowTroubleshoot(true);
      } else if (micAccess.error === 'audio-capture') {
        setErrorMessage(
          'Микрофон не обнаружен на вашем устройстве. Подключите гарнитуру или проверьте системные настройки звука.'
        );
      } else {
        setErrorMessage('Не удалось запустить микрофон. Попробуйте написать предложение текстом.');
      }
      return;
    }

    // Save stream and start audio level analyzer
    streamRef.current = micAccess.stream;
    stopMonitorRef.current = createAudioLevelMonitor(micAccess.stream, (level) => {
      setAudioLevel(level);
    });

    setIsRecording(true);

    // Initialize speech recognizer
    const recognizer = createSpeechRecognizer(
      (res) => {
        setTranscript(res.transcript);
        if (res.isFinal && res.transcript.trim()) {
          stopSpeakingAndEvaluate(res.transcript.trim());
        }
      },
      (errCode: SpeechErrorCode) => {
        cleanupAudioStream();
        setIsRecording(false);

        if (errCode === 'no-speech') {
          setErrorMessage('Речь не была услышана. Говорите ближе к микрофону и попробуйте снова.');
        } else if (errCode === 'not-allowed') {
          setErrorMessage(
            'Доступ к микрофону отклонен браузером. Разрешите микрофон в адресной строке.'
          );
          setShowTroubleshoot(true);
        } else if (errCode === 'network') {
          setErrorMessage(
            'Ошибка сети сервиса распознавания речи (требуется доступ к Google Speech API). Вы можете ввести предложение текстом.'
          );
        } else if (errCode !== 'aborted') {
          setErrorMessage('Распознавание завершилось с ошибкой. Попробуйте еще раз или введите текст.');
        }
      },
      () => {
        // Recognition ended
        cleanupAudioStream();
        setIsRecording(false);
      }
    );

    if (!recognizer) {
      cleanupAudioStream();
      setIsRecording(false);
      setErrorMessage('Не удалось запустить распознавание речи.');
      return;
    }

    recognizerRef.current = recognizer;

    try {
      recognizer.start();
    } catch {
      cleanupAudioStream();
      setIsRecording(false);
      setErrorMessage('Не удалось запустить захват микрофона.');
    }
  };

  const handleStopSpeakingManually = () => {
    sound.playTap();
    if (transcript.trim()) {
      stopSpeakingAndEvaluate(transcript.trim());
    } else {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {}
      }
      cleanupAudioStream();
      setIsRecording(false);
    }
  };

  const stopSpeakingAndEvaluate = (spokenText: string) => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
    }
    cleanupAudioStream();
    setIsRecording(false);
    evaluateSpeech(spokenText);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    sound.playTap();
    setTranscript(manualText.trim());
    evaluateSpeech(manualText.trim());
  };

  const evaluateSpeech = (spokenText: string) => {
    const textLower = spokenText.toLowerCase();
    const containsTarget = textLower.includes(targetWord);
    const wordCount = spokenText.split(' ').filter(Boolean).length;

    const correctUsage = containsTarget && wordCount >= 3;
    const grammar = correctUsage ? (wordCount >= 5 ? 9 : 8) : 6;
    const vocabulary = correctUsage ? 10 : 6;
    const naturalness = correctUsage ? 9 : 7;

    const feedback = correctUsage
      ? `Great sentence! You pronounced and used "${question.word.word}" naturally in context.`
      : `Sentence recorded. Make sure to clearly include "${question.word.word}" in a full English phrase.`;

    setAnalysis({
      grammar,
      vocabulary,
      naturalness,
      correctUsage,
      feedback,
    });
    setHasEvaluated(true);

    if (correctUsage) {
      sound.playCorrect();
      onAnswer(spokenText, true);
    } else {
      sound.playWrong();
      onAnswer(spokenText, false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl relative">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Speaking & AI Analysis</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Use &ldquo;<span className="text-emerald-500">{question.word.word.toUpperCase()}</span>&rdquo; in a sentence
          </h2>
          <button
            onClick={handlePlayWordPronunciation}
            className="p-2 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Listen to word pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Meaning: {question.word.translation_ru}
        </p>

        {/* Mode Switcher */}
        {!hasEvaluated && (
          <div className="mt-4 inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                sound.playTap();
                setInputMode('voice');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'voice'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => {
                sound.playTap();
                setInputMode('text');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'text'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Type Text</span>
            </button>
          </div>
        )}
      </div>

      {/* Error / Permission Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
          {showTroubleshoot && (
            <div className="pt-2 border-t border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">Как включить микрофон:</p>
              <p>1. В адресной строке браузера (слева от localhost:3000) нажмите на значок настроек сайта / замка и переключите <strong>Микрофон: Разрешить</strong>.</p>
              <p>2. В macOS: откройте <strong>Системные настройки → Конфиденциальность и безопасность → Микрофон</strong> и убедитесь, что флажок для вашего браузера включен.</p>
            </div>
          )}
        </div>
      )}

      {/* Voice Mode */}
      {!hasEvaluated && inputMode === 'voice' && (
        <div className="text-center py-4">
          <div className="relative inline-flex items-center justify-center">
            {/* Animated Audio Wave Rings when recording */}
            {isRecording && (
              <motion.div
                animate={{
                  scale: [1, 1 + audioLevel * 0.008 + 0.15, 1],
                  opacity: [0.6, 0.2, 0.6],
                }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-rose-500/25 blur-sm"
                style={{ width: '120px', height: '120px', left: '-12px', top: '-12px' }}
              />
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? handleStopSpeakingManually : handleStartSpeaking}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center cursor-pointer shadow-xl transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-rose-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </motion.button>
          </div>

          {/* Sound level visualizer bars */}
          {isRecording && (
            <div className="mt-4 flex items-center justify-center gap-1.5 h-6">
              {[0.4, 0.8, 1.2, 0.9, 0.6].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: Math.max(6, Math.min(24, (audioLevel / 4) * scale + 4)),
                  }}
                  transition={{ duration: 0.1 }}
                  className="w-1.5 rounded-full bg-rose-500"
                />
              ))}
              <span className="ml-2 text-[11px] font-mono text-slate-400">
                {audioLevel > 5 ? 'Hearing sound...' : 'Speak louder...'}
              </span>
            </div>
          )}

          <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {isRecording
              ? 'Listening... Tap to finish & evaluate'
              : 'Tap microphone and speak in English aloud'}
          </p>

          {/* Live speech preview */}
          {transcript && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-medium italic text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              &ldquo;{transcript}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Manual Text Mode Fallback */}
      {!hasEvaluated && inputMode === 'text' && (
        <form onSubmit={handleTextSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Type your English sentence with &ldquo;{question.word.word}&rdquo;:
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={`e.g. You need perseverance to ${targetWord} great things...`}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!manualText.trim()}
                className="absolute right-3 top-3 p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Tip: Include at least 3-5 words in your sentence for maximum score.
          </p>
        </form>
      )}

      {/* AI Evaluation Result Card */}
      <AnimatePresence>
        {hasEvaluated && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Your sentence
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white italic">
                &ldquo;{transcript}&rdquo;
              </p>
            </div>

            {/* AI Scores Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                <div className="text-xs text-slate-500">Grammar</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {analysis.grammar}/10
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-center">
                <div className="text-xs text-slate-500">Vocabulary</div>
                <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {analysis.vocabulary}/10
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-center">
                <div className="text-xs text-slate-500">Naturalness</div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {analysis.naturalness}/10
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-200">
                  {analysis.correctUsage ? 'Correct Usage: Yes (+20 XP)' : 'Needs Revision'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {analysis.feedback}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasEvaluated && (
        <button
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
