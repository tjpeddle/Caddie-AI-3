import { useState, useEffect, useRef, useCallback } from 'react';

// Fix: Add missing type definitions for the Web Speech API, which are not standard in TypeScript DOM typings yet.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}


interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

interface UseSpeechRecognitionOptions {
  onTranscriptChange?: (transcript: string) => void;
}

const getSpeechRecognition = (): ({ new(): SpeechRecognition }) | null => {
  if (typeof window !== 'undefined') {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }
  return null;
};

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}): SpeechRecognitionHook => {
  const SpeechRecognition = getSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const isManualStopRef = useRef<boolean>(false);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      const fullTranscript = (finalTranscriptRef.current + interimTranscript).trim();
      const sanitizedTranscript = fullTranscript.replace(/\*{3,}\s*astiscrk/gi, '').trim();

      setTranscript(sanitizedTranscript);
      if (options.onTranscriptChange) {
        options.onTranscriptChange(sanitizedTranscript);
      }
    };
    
    recognition.onend = () => {
      if (isManualStopRef.current) {
        setIsListening(false);
      } else {
        // Automatically restart if recognition stops unexpectedly (e.g., timeout)
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        } catch (e) {
          console.error("Error restarting speech recognition:", e);
          setError("Speech recognition was interrupted and could not restart.");
          setIsListening(false);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't auto-restart on errors like 'no-speech'
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isManualStopRef.current = true;
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, [SpeechRecognition, options.onTranscriptChange]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        finalTranscriptRef.current = '';
        if (options.onTranscriptChange) {
            options.onTranscriptChange('');
        }
        isManualStopRef.current = false;
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch(e) {
        // This can happen if start() is called too close to a previous stop().
        console.error("Could not start speech recognition", e);
        setError("Could not start listening. Please try again.");
      }
    }
  }, [isListening, options.onTranscriptChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isManualStopRef.current = true;
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!SpeechRecognition,
    error,
  };
};