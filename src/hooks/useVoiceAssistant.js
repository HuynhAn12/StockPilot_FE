/**
 * Normalizes speech recognition output for domain-specific retail terms & brand names.
 * Ensures consistent terminology between real-time browser preview and Groq Whisper.
 */
export function normalizeVietnameseSpeechText(text) {
  if (!text) return '';
  let result = text;
  // KiotViet variants (e.g., "K kiốt việt", "cây ốc Việt", "ki ốt việt") -> "KiotViet"
  result = result.replace(/\b(cây\s*ốc\s*việt|k\s*kiốt\s*việt|ki\s*ốt\s*việt|k\s*kiot\s*viet|kiot\s*viet)\b/gi, 'KiotViet');
  // StockPilot variants
  result = result.replace(/\b(stock\s*pilot|s\s*tốc\s*pai\s*lợt|tốc\s*pai\s*lợt)\b/gi, 'StockPilot');
  // AI Pilot variants
  result = result.replace(/\b(ai\s*pilot|ây\s*ai\s*pai\s*lợt)\b/gi, 'AI Pilot');
  // Sapo variants
  result = result.replace(/\b(sa\s*po)\b/gi, 'Sapo');
  // POS variants
  result = result.replace(/\b(pi\s*âu\s*ét|bê\s*ô\s*ét)\b/gi, 'POS');
  return result;
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { apiTranscribeAudio } from '../services/analyticsService';

/**
 * Clean markdown symbols for natural Vietnamese Text-To-Speech reading
 */
export function cleanMarkdownForSpeech(text) {
  if (!text) return '';
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold / italics **text** or *text* -> text
    .replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, '$1')
    // Remove headings #
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes >
    .replace(/^>\s+/gm, '')
    // Remove list bullets
    .replace(/^[-*+]\s+/gm, '')
    // Remove numbered lists 1. 2.
    .replace(/^\d+\.\s+/gm, '')
    // Replace table bars with commas
    .replace(/\|/g, ', ')
    // Remove table divider lines like |:---|
    .replace(/^[-,:\s|]{3,}$/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove emojis or special symbols that might sound weird
    .replace(/[✨⚡🔥📦💡🔍⚠️🚨✅❌🤖📋]/g, '')
    // Clean up currency format for natural speech: 5.000 đ -> 5000 đồng
    .replace(/(\d+)\.000\s*đ/g, '$1 nghìn đồng')
    .replace(/(\d+)\s*đ/g, '$1 đồng')
    .replace(/(\d+)\s*k/gi, '$1 nghìn')
    // Replace multiple newlines/spaces with single space or pause
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the best Vietnamese voice available in the browser
 */
function getBestViVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'vi-VN' || v.lang === 'vi_VN') ||
    voices.find((v) => v.lang.startsWith('vi')) ||
    voices.find((v) => v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('vietnamese')) ||
    null
  );
}

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true); // Tự động đọc câu trả lời
  const [voiceSupported, setVoiceSupported] = useState({ stt: false, tts: false });
  const [askedByVoice, setAskedByVoice] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const currentVoiceRef = useRef(null);

  // 2s Auto-Submit Silence Timer refs & Submission Guards
  const silenceTimeoutRef = useRef(null);
  const onFinalCallbackRef = useRef(null);
  const capturedTextRef = useRef('');
  const hasSubmittedTurnRef = useRef(false);
  const isTranscribingRef = useRef(false);

  // Check Web Speech & Audio recording support
  useEffect(() => {
    const hasSTT = typeof window !== 'undefined' && Boolean(
      (window.SpeechRecognition || window.webkitSpeechRecognition) ||
      (navigator.mediaDevices && window.MediaRecorder)
    );
    const hasTTS = typeof window !== 'undefined' && Boolean(window.speechSynthesis);
    setVoiceSupported({ stt: hasSTT, tts: hasTTS });

    const updateVoices = () => {
      currentVoiceRef.current = getBestViVoice();
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
    };
  }, []);

  // ─── 0. Đảm bảo mỗi lượt nói chỉ gửi duy nhất 1 lần (Chống duplicate Web Speech vs Groq Whisper) ───
  const submitTextOnce = useCallback((text) => {
    const rawTrimmed = (text || '').trim();
    if (!rawTrimmed) return;
    const trimmed = normalizeVietnameseSpeechText(rawTrimmed);
    if (!trimmed) return;
    if (hasSubmittedTurnRef.current) return;
    hasSubmittedTurnRef.current = true;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    capturedTextRef.current = '';

    const callback = onFinalCallbackRef.current;
    if (callback) {
      callback(trimmed);
    }
  }, []);

  // ─── 1. Dừng nghe và gửi kết quả duy nhất ───
  const stopListening = useCallback(async ({ onFinal, onError, cancel = false } = {}) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    setIsListening(false);

    if (cancel) {
      hasSubmittedTurnRef.current = true;
      capturedTextRef.current = '';
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      setIsTranscribing(false);
      isTranscribingRef.current = false;
      return;
    }

    if (onFinal) {
      onFinalCallbackRef.current = onFinal;
    }

    // Nếu đã submit hoặc đang xử lý Whisper cho lượt nói này thì không xử lý thêm lần 2
    if (hasSubmittedTurnRef.current || isTranscribingRef.current) {
      return;
    }

    // 1. Dừng Web Speech Recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    // ⭐️ ƯU TIÊN VĂN BẢN TRỰC TIẾP TỪ WEB SPEECH (WYSIWYG) ⭐️
    // Người dùng nhìn thấy dòng chữ màu tím hiển thị lúc nói.
    // Lấy chính xác văn bản này gửi đi để màu xanh khớp 100% với màu tím mà người dùng vừa thấy,
    // không để Whisper ghi đè hay làm lệch từ vựng (như K kiốt việt -> cây ốc Việt).
    const liveCaptured = normalizeVietnameseSpeechText(capturedTextRef.current);
    if (liveCaptured && liveCaptured.trim()) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      setIsTranscribing(false);
      isTranscribingRef.current = false;
      submitTextOnce(liveCaptured.trim());
      return;
    }

    // 2. Nếu Web Speech chưa bắt được chữ (hoặc trên trình duyệt không hỗ trợ Web Speech như Firefox/Safari),
    // chuyển sang Groq Whisper API với model whisper-large-v3
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      isTranscribingRef.current = true;
      setIsTranscribing(true);

      recorder.onstop = async () => {
        try {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          audioChunksRef.current = [];

          if (audioBlob.size > 2000) {
            // Gửi sang backend -> Groq Whisper API với model whisper-large-v3
            const whisperText = await apiTranscribeAudio(audioBlob);
            const normalizedWhisper = normalizeVietnameseSpeechText(whisperText);
            if (normalizedWhisper && normalizedWhisper.trim()) {
              submitTextOnce(normalizedWhisper.trim());
              return;
            }
          }
        } catch (err) {
          console.warn('Groq Whisper transcribe failed, fallback to Web Speech:', err);
        } finally {
          setIsTranscribing(false);
          isTranscribingRef.current = false;
        }

        // Fallback sang text đã nhận diện từ Web Speech nếu Groq Whisper rỗng
        const fallbackText = normalizeVietnameseSpeechText(capturedTextRef.current);
        if (fallbackText && fallbackText.trim()) {
          submitTextOnce(fallbackText.trim());
        }
      };

      try {
        recorder.stop();
      } catch (e) {
        setIsTranscribing(false);
        isTranscribingRef.current = false;
        const fallbackText = normalizeVietnameseSpeechText(capturedTextRef.current);
        if (fallbackText && fallbackText.trim()) {
          submitTextOnce(fallbackText.trim());
        }
      }
    } else {
      setIsTranscribing(false);
      isTranscribingRef.current = false;
      const fallbackText = normalizeVietnameseSpeechText(capturedTextRef.current);
      if (fallbackText && fallbackText.trim()) {
        submitTextOnce(fallbackText.trim());
      }
    }
  }, [submitTextOnce]);

  // ─── 2. Speech-To-Text với Groq Whisper và Tự động gửi sau 2 giây im lặng ───
  const startListening = useCallback(async ({ onInterim, onFinal, onError }) => {
    if (typeof window === 'undefined') return;

    // Dừng phát âm thanh ngay lập tức nếu AI đang nói
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    hasSubmittedTurnRef.current = false;
    isTranscribingRef.current = false;
    onFinalCallbackRef.current = onFinal;
    capturedTextRef.current = '';
    setAskedByVoice(true);
    setIsListening(true);
    audioChunksRef.current = [];

    let capturedWebSpeech = '';

    // Khởi động MediaRecorder để ghi âm gửi sang Groq Whisper
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
      }
    } catch (micErr) {
      console.warn('Microphone stream error:', micErr);
    }

    // Song song khởi động Web Speech API để hiển thị trực tiếp chữ trên màn hình (interim preview)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (_) {}
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          if (hasSubmittedTurnRef.current || isTranscribingRef.current) {
            return;
          }

          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const trans = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              capturedWebSpeech += (capturedWebSpeech ? ' ' : '') + trans;
            } else {
              interimTranscript += trans;
            }
          }

          const rawFull = (capturedWebSpeech + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
          const fullCurrent = normalizeVietnameseSpeechText(rawFull);
          capturedTextRef.current = fullCurrent;

          if (onInterim && fullCurrent) {
            onInterim(fullCurrent);
          }

          // ⭐️ TỰ ĐỘNG GỬI SAU 2 GIÂY KHI NGƯỜI DÙNG NÓI XONG CÂU HỎI ⭐️
          if (fullCurrent.length > 0) {
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
            }

            silenceTimeoutRef.current = setTimeout(() => {
              // Đã 2 giây người dùng dừng nói -> Tự động gửi câu hỏi
              stopListening({ onFinal: onFinalCallbackRef.current });
            }, 2000);
          }
        };

        recognition.onerror = (event) => {
          if (event.error !== 'no-speech') {
            console.warn('SpeechRecognition event error:', event.error);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (recErr) {
        console.warn('SpeechRecognition start error:', recErr);
      }
    }
  }, [stopListening]);

  // ─── 3. Text-To-Speech (Tự động phát giọng nói ngay khi AI trả lời) ───
  const speak = useCallback((rawText, messageId = null) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const cleanText = cleanMarkdownForSpeech(rawText);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05; // Tốc độ tự nhiên, rõ ràng
    utterance.pitch = 1.0;

    const viVoice = currentVoiceRef.current || getBestViVoice();
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      activeUtteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e);
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      activeUtteranceRef.current = null;
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  return {
    isListening,
    isTranscribing,
    isSpeaking,
    speakingMessageId,
    autoSpeakEnabled,
    setAutoSpeakEnabled,
    voiceSupported,
    askedByVoice,
    setAskedByVoice,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
