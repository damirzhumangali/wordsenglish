/**
 * Web Speech API text-to-speech and speech recognition helper
 * With resilient audio stream fallbacks, Chrome paused unsticking,
 * garbage collection prevention, and microphone permissions diagnostics.
 */

// Global reference to prevent Chrome garbage-collecting utterance mid-speech
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudioFallback: HTMLAudioElement | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

export function getActiveUtterance() {
  return activeUtterance;
}

// Initialize voices eagerly if in browser
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        cachedVoices = window.speechSynthesis.getVoices();
      } catch {}
    };
  } catch {}
}

/**
 * Universal high-definition audio fallback using online audio TTS
 * Works reliably even when SpeechSynthesis is disabled, muted, or missing English voices
 */
export function playAudioFallback(text: string, rate: number = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    try {
      if (activeAudioFallback) {
        try {
          activeAudioFallback.pause();
          activeAudioFallback.src = '';
        } catch {}
        activeAudioFallback = null;
      }

      const cleanText = text.trim();
      if (!cleanText) {
        resolve();
        return;
      }

      // Online audio stream endpoint with English pronunciation
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(url);
      activeAudioFallback = audio;
      audio.playbackRate = rate;

      const cleanup = () => {
        activeAudioFallback = null;
        resolve();
      };

      audio.onended = cleanup;
      audio.onerror = () => {
        cleanup();
      };

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          cleanup();
        });
      }
    } catch {
      resolve();
    }
  });
}

/**
 * Speaks a word or sentence using SpeechSynthesis, with automatic fallback to MP3 audio stream
 */
export function speakWord(text: string, lang?: string, rate?: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    let selectedLang = lang;
    let selectedRate = rate;

    // Automatically inherit accent & speed from saved user settings
    try {
      const saved = localStorage.getItem('vocabflow_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!selectedLang && parsed?.settings?.speechAccent) {
          selectedLang = parsed.settings.speechAccent;
        }
        if (selectedRate === undefined && parsed?.settings?.speechSpeed) {
          selectedRate = parsed.settings.speechSpeed;
        }
      }
    } catch {}

    const finalLang = selectedLang || 'en-US';
    const finalRate = selectedRate !== undefined ? selectedRate : 0.95;

    // Direct audio fallback if SpeechSynthesis API is unsupported
    if (!('speechSynthesis' in window)) {
      playAudioFallback(text, finalRate).then(resolve);
      return;
    }

    try {
      // Unstick Chrome speech synthesis if paused or suspended
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Stop any pending audio fallback
      if (activeAudioFallback) {
        try {
          activeAudioFallback.pause();
          activeAudioFallback.src = '';
        } catch {}
        activeAudioFallback = null;
      }

      // Cancel previous utterances safely
      try {
        window.speechSynthesis.cancel();
      } catch {}

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterance = utterance; // Prevent GC sweep bug
      utterance.lang = finalLang;
      utterance.rate = finalRate;
      utterance.pitch = 1.0;

      // Select natural sounding English voice matching the requested lang/accent
      const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase() === finalLang.toLowerCase() &&
            (v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Google') ||
              v.name.includes('Daniel') ||
              v.name.includes('Oliver') ||
              v.name.includes('Karen') ||
              v.name.includes('Alex') ||
              v.name.includes('Victoria'))
        ) ||
        voices.find((v) => v.lang.toLowerCase() === finalLang.toLowerCase()) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      let hasResolved = false;
      const finish = () => {
        if (!hasResolved) {
          hasResolved = true;
          activeUtterance = null;
          resolve();
        }
      };

      // Watchdog fallback: if SpeechSynthesis fails to produce sound within 900ms, use MP3 audio fallback
      const watchdogTimer = setTimeout(() => {
        if (!hasResolved && (!window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
          playAudioFallback(text, rate).then(finish);
        }
      }, 900);

      utterance.onstart = () => {
        clearTimeout(watchdogTimer);
      };

      utterance.onend = () => {
        clearTimeout(watchdogTimer);
        finish();
      };

      utterance.onerror = (err) => {
        clearTimeout(watchdogTimer);
        if (err.error === 'interrupted' || err.error === 'canceled') {
          finish();
        } else {
          // Play fallback audio on error
          playAudioFallback(text, rate).then(finish);
        }
      };

      // Dispatch speak with brief tick to avoid Chrome cancel race
      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch {
          playAudioFallback(text, rate).then(finish);
        }
      }, 25);
    } catch {
      playAudioFallback(text, rate).then(resolve);
    }
  });
}

/**
 * Immediately cancels all active speech synthesis and audio fallbacks
 */
export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  try {
    window.speechSynthesis.cancel();
  } catch {}
  if (activeAudioFallback) {
    try {
      activeAudioFallback.pause();
      activeAudioFallback.src = '';
    } catch {}
    activeAudioFallback = null;
  }
  activeUtterance = null;
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export type SpeechErrorCode =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'audio-capture'
  | 'not-supported'
  | 'aborted'
  | 'unknown';

/**
 * Checks whether Speech Recognition is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Requests native microphone permission and tests hardware input availability
 */
export async function requestMicrophoneAccess(): Promise<{
  granted: boolean;
  stream: MediaStream | null;
  error?: SpeechErrorCode;
}> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: false, stream: null, error: 'not-supported' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return { granted: true, stream };
  } catch (err: unknown) {
    const errorObj = err as { name?: string };
    if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
      return { granted: false, stream: null, error: 'not-allowed' };
    }
    if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
      return { granted: false, stream: null, error: 'audio-capture' };
    }
    return { granted: false, stream: null, error: 'unknown' };
  }
}

/**
 * Creates audio volume level monitor from a MediaStream (0 to 100)
 * Uses Web Audio API AnalyserNode
 */
export function createAudioLevelMonitor(
  stream: MediaStream,
  onVolume: (level: number) => void
): () => void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return () => {};

    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const checkVolume = () => {
      try {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        onVolume(normalized);
        animationId = requestAnimationFrame(checkVolume);
      } catch {
        // Stopped
      }
    };

    animationId = requestAnimationFrame(checkVolume);

    return () => {
      cancelAnimationFrame(animationId);
      try {
        source.disconnect();
        analyser.disconnect();
        ctx.close().catch(() => {});
      } catch {}
    };
  } catch {
    return () => {};
  }
}

export function createSpeechRecognizer(
  onResult: (res: SpeechRecognitionResult) => void,
  onError?: (errCode: SpeechErrorCode, rawError?: unknown) => void,
  onEnd?: () => void,
  continuous: boolean = false
) {
  if (typeof window === 'undefined') return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError('not-supported');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = continuous;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = (finalTranscript || interimTranscript).trim();
      onResult({
        transcript: text,
        isFinal: !!finalTranscript,
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      const err = event?.error || 'unknown';
      let code: SpeechErrorCode = 'unknown';

      if (err === 'not-allowed') code = 'not-allowed';
      else if (err === 'no-speech') code = 'no-speech';
      else if (err === 'network') code = 'network';
      else if (err === 'audio-capture') code = 'audio-capture';
      else if (err === 'aborted') code = 'aborted';

      if (onError) onError(code, event);
    };

    if (onEnd) {
      recognition.onend = onEnd;
    }

    return recognition;
  } catch (err) {
    if (onError) onError('unknown', err);
    return null;
  }
}
