import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Clean markdown symbols for natural Text-To-Speech reading
 */
function cleanMarkdownForSpeech(text) {
  if (!text) return '';
  return text
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
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove emojis or special symbols that might sound weird
    .replace(/[✨⚡🔥📦💡🔍⚠️]/g, '')
    // Replace multiple newlines/spaces with single space or pause
    .replace(/\n+/g, '. ')
    .trim();
}

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState({ stt: false, tts: false });
  const [askedByVoice, setAskedByVoice] = useState(false);

  const recognitionRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  // Check Web Speech API support
  useEffect(() => {
    const hasSTT = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasTTS = typeof window !== 'undefined' && Boolean(window.speechSynthesis);
    setVoiceSupported({ stt: hasSTT, tts: hasTTS });

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
    };
  }, []);

  // ─── 1. Speech-To-Text (Nhận diện giọng nói tiếng Việt) ───
  const startListening = useCallback(({ onInterim, onFinal, onError }) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.');
      return;
    }

    // Stop speaking if currently speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setAskedByVoice(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }

        if (interimTranscript && onInterim) {
          onInterim(interimTranscript);
        }

        if (finalTranscript && onFinal) {
          onFinal(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'no-speech' && onError) {
          if (event.error === 'not-allowed') {
            onError('Vui lòng cấp quyền micro trên trình duyệt để sử dụng giọng nói.');
          } else {
            onError(`Lỗi nhận diện giọng nói: ${event.error}`);
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start error:', err);
      setIsListening(false);
      if (onError) onError('Không thể khởi động micro.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  // ─── 2. Text-To-Speech (Đọc to câu trả lời bằng giọng tiếng Việt) ───
  const speak = useCallback((rawText, messageId = null) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // If already speaking this message, toggle off
    if (isSpeaking && speakingMessageId === messageId && messageId !== null) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanMarkdownForSpeech(rawText);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05; // Slightly faster for natural rhythm
    utterance.pitch = 1.0;

    // Pick a Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('vietnamese'));
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
  }, [isSpeaking, speakingMessageId]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  return {
    isListening,
    isSpeaking,
    speakingMessageId,
    voiceSupported,
    askedByVoice,
    setAskedByVoice,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

