 import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, Role, GolfData } from './types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.ts';
import { geminiService } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import InputBar from './components/InputBar';
import WelcomeScreen from './components/WelcomeScreen';
import Scorecard from './components/Scorecard';
import PhotoCapture from './components/PhotoCapture';

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
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    if (!golfData || !golfData.currentRoundId) return [];
    return golfData.rounds[golfData.currentRoundId] || [];
  }, [golfData]);

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
    if (window.speechSynthesis && text.trim()) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = voiceSpeed;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;
        if (selectedVoice) utterance.voice = selectedVoice;
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  }, [selectedVoice, voiceSpeed]);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
      }
    } catch (err) {
      console.error('Wake lock failed:', err);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  const handlePhotoTaken = useCallback(async (photoData: string) => {
    if (!golfData?.currentRoundId) return;
    setIsPhotoLoading(true);

    try {
      const photoMessage: Message = { role: Role.USER, content: "📸 Photo uploaded", image: photoData };
      const currentRoundId = golfData.currentRoundId;
      setGolfData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          rounds: { ...prev.rounds, [currentRoundId]: [...(prev.rounds[currentRoundId] || []), photoMessage] }
        };
      });

      const response = await geminiService.sendMessage(
        "Analyze this golf hole photo and give quick strategic advice.",
        [photoData]
      );
      const aiMessage: Message = { role: Role.MODEL, content: response };
      setGolfData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          rounds: { ...prev.rounds, [currentRoundId]: [...(prev.rounds[currentRoundId] || []), aiMessage] }
        };
      });
      speak(response);
    } catch (err) {
      console.error("Photo analysis failed:", err);
    } finally {
      setIsPhotoLoading(false);
    }
  }, [golfData, speak]);

  const handleUserInput = useCallback(async (inputText: string) => {
    if (!inputText || isLoading || !golfData?.currentRoundId) return;
    const currentRoundId = golfData.currentRoundId;
    const userMessage: Message = { role: Role.USER, content: inputText };

    setGolfData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        rounds: { ...prev.rounds, [currentRoundId]: [...(prev.rounds[currentRoundId] || []), userMessage] }
      };
    });

    setIsLoading(true);
    setError(null);
    try {
      const response = await geminiService.sendMessage(inputText);
      const aiMessage: Message = { role: Role.MODEL, content: response };
      setGolfData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          rounds: { ...prev.rounds, [currentRoundId]: [...(prev.rounds[currentRoundId] || []), aiMessage] }
        };
      });
      speak(response);
    } catch {
      const errorMsg = "Sorry, I had a problem. Try again.";
      setError(errorMsg);
      setGolfData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          rounds: { ...prev.rounds, [currentRoundId]: [...(prev.rounds[currentRoundId] || []), { role: Role.MODEL, content: errorMsg }] }
        };
      });
      speak(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [golfData, isLoading, speak]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({ onTranscriptChange: setText });

  const handleSendMessage = useCallback((message: string) => {
    const clean = message.trim();
    if (!clean) return;
    handleUserInput(clean);
    setText('');
    if (isListening) stopListening();
  }, [handleUserInput, isListening, stopListening]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    requestWakeLock();
    const handleVisibility = () => {
      if (!document.hidden) requestWakeLock();
      else {
        if (isListening) stopListening();
        window.speechSynthesis.cancel();
      }
    };
    const handleUnload = () => {
      if (isListening) stopListening();
      window.speechSynthesis.cancel();
      releaseWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [requestWakeLock, releaseWakeLock, isListening, stopListening]);

  const goToMainMenu = useCallback(() => setShowWelcome(true), []);

  const handleNewRound = useCallback(() => {
    const newRoundId = Date.now().toString();
    const welcomeMessages = [
      "Hey, I’m your AI Caddie. Ready to start your round?",
      "Let’s tee off! Tell me about the first hole.",
      "Welcome back to the course — what’s your opening hole like?",
      "AI Caddie here. Ready when you are, describe the hole!"
    ];
    const welcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    const initialMessage: Message = { role: Role.MODEL, content: welcomeMessage };

    const updated: GolfData = golfData ? {
      ...golfData,
      rounds: { ...golfData.rounds, [newRoundId]: [initialMessage] },
      roundStats: {
        ...golfData.roundStats,
        [newRoundId]: { roundId: newRoundId, date: new Date().toISOString(), holes: [], currentHole: 1 }
      },
      currentRoundId: newRoundId
    } : {
      rounds: { [newRoundId]: [initialMessage] },
      roundStats: { [newRoundId]: { roundId: newRoundId, date: new Date().toISOString(), holes: [], currentHole: 1 } },
      currentRoundId: newRoundId
    };

    setGolfData(updated);
    geminiService.initializeChat(Object.values(updated.rounds).flat());
    speak(welcomeMessage);
    setShowWelcome(false);
  }, [golfData, speak]);

  if (!golfData && !showWelcome) return null;

  if (showWelcome) {
    return <WelcomeScreen onStartNewRound={handleNewRound} onResumeRound={() => setShowWelcome(false)} hasExistingData={!!golfData} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Header onNewRound={handleNewRound} onGoToMainMenu={goToMainMenu} />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
        {isLoading && <ChatMessage message={{ role: Role.MODEL, content: '...' }} isLoading />}
        {error && <p className="text-red-400 text-center">{error}</p>}
      </main>
      <div className="p-4 border-t border-gray-700 flex justify-end space-x-2">
        <PhotoCapture onPhotoTaken={handlePhotoTaken} isLoading={isPhotoLoading} />
        <button onClick={() => setShowScorecard(true)} className="p-2" title="Scorecard">📋</button>
        <button onClick={() => setShowVoiceSettings(!showVoiceSettings)} className="p-2" title="Voice">⚙️</button>
      </div>
      {showVoiceSettings && (
        <div className="absolute bottom-20 right-4 bg-gray-800 rounded p-3 w-56">
          <label className="block text-sm mb-2">Speed: {voiceSpeed.toFixed(1)}x</label>
          <input type="range" min="0.5" max="2.0" step="0.1" value={voiceSpeed} onChange={e => setVoiceSpeed(parseFloat(e.target.value))} className="w-full mb-2" />
          <div className="max-h-32 overflow-y-auto">
            {availableVoices.map((v, i) => (
              <button key={i} onClick={() => { setSelectedVoice(v); setShowVoiceSettings(false); }} className={`block w-full text-left text-sm p-1 ${selectedVoice === v ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}>
                {v.name} <span className="text-xs text-gray-400">{v.lang}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <InputBar text={text} setText={setText} onSendMessage={handleSendMessage} isListening={isListening} startListening={startListening} stopListening={stopListening} isLoading={isLoading} />
      {golfData?.currentRoundId && (
        <Scorecard roundStats={golfData.roundStats[golfData.currentRoundId]} isVisible={showScorecard} onClose={() => setShowScorecard(false)} />
      )}
    </div>
  );
};

export default App;


