'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Check,
  Brain,
  Target,
  Clock,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { EnglishLevel } from '@/types/vocabulary';
import { useApp } from '@/context/AppContext';
import { sound } from '@/lib/sound';

export function OnboardingModal() {
  const { onboardingCompleted, completeOnboarding } = useApp();
  const [step, setStep] = useState<number>(0);

  // Form states
  const [level, setLevel] = useState<EnglishLevel>('B1');
  const [reasons, setReasons] = useState<string[]>(['Daily English', 'IT / Programming']);
  const [wordsPerDay, setWordsPerDay] = useState<number>(15);
  const [studyTime, setStudyTime] = useState<number>(15);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  if (onboardingCompleted) return null;

  const englishLevels: { value: EnglishLevel; label: string; desc: string }[] = [
    { value: 'A1', label: 'A1 — Beginner', desc: 'Basic greetings, common objects' },
    { value: 'A2', label: 'A2 — Elementary', desc: 'Simple conversation, shopping & routine' },
    { value: 'B1', label: 'B1 — Intermediate', desc: 'Everyday dialogue, work & travel' },
    { value: 'B2', label: 'B2 — Upper Intermediate', desc: 'Complex texts, fluid speech & debates' },
    { value: 'C1', label: 'C1 — Advanced', desc: 'Professional fluency, academic research' },
    { value: 'Not sure', label: 'Not sure', desc: 'We will calibrate automatically' },
  ];

  const learningReasonsList = [
    'Daily English',
    'IELTS',
    'TOEFL',
    'University',
    'Work',
    'Travel',
    'IT / Programming',
    'Business',
  ];

  const wordsOptions = [5, 10, 15, 20];
  const timeOptions = [5, 10, 15, 20, 30];

  const toggleReason = (r: string) => {
    sound.playTap();
    if (reasons.includes(r)) {
      if (reasons.length > 1) {
        setReasons(reasons.filter((item) => item !== r));
      }
    } else {
      setReasons([...reasons, r]);
    }
  };

  const handleNext = () => {
    sound.playTap();
    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      // Generate plan step
      setIsGeneratingPlan(true);
      setTimeout(() => {
        completeOnboarding({
          level,
          reasons,
          wordsPerDay,
          studyTime,
        });
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
      >
        {/* Step Progress Bar */}
        {step > 0 && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome Screen */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 animate-float">
                  <Sparkles className="w-10 h-10" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Welcome to <span className="text-emerald-500">VocabFlow</span>
                </h1>

                <p className="mt-3 text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Build your English vocabulary every day. Transition from passive recognition to active recall.
                </p>

                <div className="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
                  <button
                    onClick={() => {
                      sound.playTap();
                      setStep(1);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-xs text-slate-400">Takes less than 1 minute to personalize</p>
                </div>
              </motion.div>
            )}

            {/* Step 1: English Level */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Compass className="w-4 h-4" />
                  <span>Step 1 of 4</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  What is your English level?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  We will tailor vocabulary difficulty to your current grasp.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6">
                  {englishLevels.map((item) => {
                    const isSelected = level === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setLevel(item.value);
                        }}
                        className={`p-3.5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Reasons / Goals */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Target className="w-4 h-4" />
                  <span>Step 2 of 4</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Why are you learning English?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select all topics that match your goals.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
                  {learningReasonsList.map((reason) => {
                    const isSelected = reasons.includes(reason);
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => toggleReason(reason)}
                        className={`p-3 rounded-2xl text-center border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{reason}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Words per day */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Brain className="w-4 h-4" />
                  <span>Step 3 of 4</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  How many words do you want to learn per day?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  15 words per day builds an active vocabulary of ~450 words in a single month!
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  {wordsOptions.map((opt) => {
                    const isSelected = wordsPerDay === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setWordsPerDay(opt);
                        }}
                        className={`p-4 rounded-2xl text-center border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xl font-black text-slate-900 dark:text-white">
                          {opt}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          words / day
                        </div>
                        {opt === 15 && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            Recommended
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Time per day */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Step 4 of 4</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  How much time do you want to study?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Short, consistent daily blocks generate the highest retention rate.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-6">
                  {timeOptions.map((mins) => {
                    const isSelected = studyTime === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setStudyTime(mins);
                        }}
                        className={`p-3.5 rounded-2xl text-center border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {mins}
                        </div>
                        <div className="text-[11px] text-slate-500">min</div>
                      </button>
                    );
                  })}
                </div>

                {isGeneratingPlan ? (
                  <div className="mt-8 py-4 flex flex-col items-center justify-center text-center">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      Generating your personalized learning plan...
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 flex justify-between items-center">
                    <button
                      onClick={() => setStep(3)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create My Plan</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
