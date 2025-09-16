 import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, Role, GolfData } from './types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.ts';
import { geminiService } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import InputBar from './components/InputBar';
import WelcomeScreen from './components/WelcomeScreen';
import Scorecard from './components/Scorecard';
import SimpleCamera from './components/SimpleCamera';

const STORAGE_KEY = 'golfCaddieHistory_v2';

const App: React.FC = () => {
  const [golfData, setGolfData] = useState<GolfData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(0.8);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Derive current round's messages
  const messages = useMemo(() => {
    if (!golfData || !golfData.currentRoundId) return [];
    return golfData.rounds[golfData.currentRoundId] || [];
  }, [golfData]);

  // --- Load/Save state ---
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const data = JSON.parse(savedHistory) as GolfData;
        if (!data.roundStats) data.roundStats = {};
        setGolfData(data);
        const fullHistory = Object.values(data.rounds).flat();
        geminiService.initializeChat(fullHistory);
      } else {
        setShowWelcome(true);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
      localStorage.removeItem(STORAGE_KEY);
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (golfData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(golfData));
    }
  }, [golfData]);

  // --- Voice setup ---
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      const defaultVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      setSelectedVoice(defaultVoice);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !text.trim()) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed;
      utterance.voice = selectedVoice || null;
      window.speechSynthesis.speak(utterance);
    }, 200);
  }, [selectedVoice, voiceSpeed]);

  // --- User input handling ---
  const handleUserInput = useCallback(async (inputText: string) => {
    if (!inputText || isLoading || !golfData?.currentRoundId) return;

    const currentRoundId = golfData.currentRoundId;
    const userMessage: Message = { role: Role.USER, content: inputText };

    // Add user message
    setGolfData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        rounds: {
          ...prev.rounds,
          [currentRoundId]: [...(prev.rounds[currentRoundId] || []), userMessage],
        }
      };
    });

    setIsLoading(true);
    setError(null);

    try {
      const responseText = await geminiService.sendMessage(inputText);
      const modelMessage: Message = { role: Role.MODEL, content: responseText };

      setGolfData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          rounds: {
            ...prev.rounds,
            [currentRoundId]: [...(prev.rounds[currentRoundId] || []), modelMessage],
          }
        };
      });

      speak(responseText);
    } catch (err) {
      setError("Sorry, I ran into a problem. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, golfData, speak]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onTranscriptChange: setText,
  });

  const handleSendMessage = useCallback((msg: string) => {
    const trimmed = msg.trim();
    if (trimmed) {
      handleUserInput(trimmed);
      setText('');
      if (isListening) stopListening();
    }
  }, [handleUserInput, isListening, stopListening]);

  // --- Photo handling ---
  const handlePhotoTaken = useCallback(async (base64Image: string) => {
    if (!golfData?.currentRoundId) return;
    setIsPhotoLoading(true);
    try {
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();

      setGolfData(prev => {
        if (!prev) return null;
        const roundId = prev.currentRoundId!;
        return {
          ...prev,
          rounds: {
            ...prev.rounds,
            [roundId]: [
              ...(prev.rounds[roundId] || []),
              { role: Role.USER, content: "Uploaded a photo", image: base64Image },
              { role: Role.MODEL, content: data.output }
            ]
          }
        };
      });
    } catch (err) {
      console.error("Error analyzing photo:", err);
      setGolfData(prev => {
        if (!prev) return null;
        const roundId = prev.currentRoundId!;
        return {
          ...prev,
          rounds: {
            ...prev.rounds,
            [roundId]: [
              ...(prev.rounds[roundId] || []),
              { role: Role.MODEL, content: "Error analyzing image" }
            ]
          }
        };
      });
    } finally {
      setIsPhotoLoading(false);
    }
  }, [golfData]);

  // --- Auto scroll ---
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Round controls ---
  const handleNewRound = useCallback(() => {
    const newRoundId = Date.now().toString();
    const welcomeMessage: Message = { role: Role.MODEL, content: "Ready to caddie for you. What's your first shot?" };

    const updated: GolfData = golfData
      ? {
          ...golfData,
          rounds: { ...golfData.rounds, [newRoundId]: [welcomeMessage] },
          roundStats: {
            ...golfData.roundStats,
            [newRoundId]: { roundId: newRoundId, date: new Date().toISOString(), holes: [], currentHole: 1 }
          },
          currentRoundId: newRoundId
        }
      : {
          rounds: { [newRoundId]: [welcomeMessage] },
          roundStats: { [newRoundId]: { roundId: newRoundId, date: new Date().toISOString(), holes: [], currentHole: 1 } },
          currentRoundId: newRoundId
        };

    setGolfData(updated);
    geminiService.initializeChat([welcomeMessage]);
    speak(welcomeMessage.content);
    setShowWelcome(false);
  }, [golfData, speak]);

  if (showWelcome) {
    return (
      <WelcomeScreen
        onStartNewRound={handleNewRound}
        onResumeRound={() => setShowWelcome(false)}
        hasExistingData={!!golfData}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Header onNewRound={handleNewRound} onGoToMainMenu={() => setShowWelcome(true)} />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
        {isLoading && <ChatMessage message={{ role: Role.MODEL, content: '...' }} isLoading />}
        {error && <p className="text-red-400 text-center">{error}</p>}
      </main>

      <div className="p-4 border-t border-gray-700 flex justify-end space-x-2">
        <SimpleCamera onPhotoTaken={handlePhotoTaken} isLoading={isPhotoLoading} />
        <button onClick={() => setShowScorecard(true)}>📋</button>
        <button onClick={() => setShowVoiceSettings(!showVoiceSettings)}>⚙️</button>
      </div>

      <InputBar
        text={text}
        setText={setText}
        onSendMessage={handleSendMessage}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
        isLoading={isLoading}
      />

      {golfData?.currentRoundId && (
        <Scorecard
          roundStats={golfData.roundStats[golfData.currentRoundId]}
          isVisible={showScorecard}
          onClose={() => setShowScorecard(false)}
        />
      )}
    </div>
  );
};

export default App;

