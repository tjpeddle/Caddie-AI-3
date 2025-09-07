
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, Role, GolfData } from './types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.ts';
import { geminiService } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import InputBar from './components/InputBar';
import WelcomeScreen from './components/WelcomeScreen';

const STORAGE_KEY = 'golfCaddieHistory_v2';

const App: React.FC = () => {
  const [golfData, setGolfData] = useState<GolfData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [text, setText] = useState(''); // Lifted state from InputBar

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    if (!golfData || !golfData.currentRoundId) return [];
    return golfData.rounds[golfData.currentRoundId] || [];
  }, [golfData]);

  // Load history from localStorage or show welcome screen on initial load
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const data = JSON.parse(savedHistory) as GolfData;
        setGolfData(data);
        const fullHistory = Object.values(data.rounds).flat();
        geminiService.initializeChat(fullHistory);
      } else {
        setShowWelcome(true);
      }
    } catch (e) {
      console.error("Failed to load or parse chat history:", e);
      localStorage.removeItem(STORAGE_KEY);
      setShowWelcome(true);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (golfData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(golfData));
    }
  }, [golfData]);

  const speak = useCallback((text: string) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.20;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleUserInput = useCallback(async (inputText: string) => {
    if (!inputText || isLoading || !golfData?.currentRoundId) return;

    const userMessage: Message = { role: Role.USER, content: inputText };
    
    // Optimistically update UI
    const currentRoundId = golfData.currentRoundId;
    setGolfData(prevData => {
        if (!prevData) return null;
        const currentMessages = prevData.rounds[currentRoundId] || [];
        return {
            ...prevData,
            rounds: {
                ...prevData.rounds,
                [currentRoundId]: [...currentMessages, userMessage],
            },
        };
    });

    setIsLoading(true);
    setError(null);

    try {
      const responseText = await geminiService.sendMessage(inputText);
      const modelMessage: Message = { role: Role.MODEL, content: responseText };
      
      setGolfData(prevData => {
        if (!prevData) return null;
        const currentMessages = prevData.rounds[currentRoundId] || [];
        return {
            ...prevData,
            rounds: {
                ...prevData.rounds,
                [currentRoundId]: [...currentMessages, modelMessage],
            },
        };
      });

      speak(responseText);
    } catch (err) {
      const errorMessage = 'Sorry, I ran into a problem. Please try again.';
      setError(errorMessage);
      const errorModelMessage: Message = { role: Role.MODEL, content: errorMessage };
      
      setGolfData(prevData => {
        if (!prevData) return null;
        const currentMessages = prevData.rounds[currentRoundId] || [];
        return {
            ...prevData,
            rounds: {
                ...prevData.rounds,
                [currentRoundId]: [...currentMessages, errorModelMessage],
            },
        };
      });

      speak(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, golfData, speak]);
  
  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onTranscriptChange: setText,
  });
  
  const handleSendMessage = useCallback((message: string) => {
    const messageToSend = message.trim();
    if (messageToSend) {
        handleUserInput(messageToSend);
        setText('');
    }
  }, [handleUserInput]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const goToMainMenu = useCallback(() => {
    setShowWelcome(true);
  }, []);

  const resumeRound = useCallback(() => {
    setShowWelcome(false);
  }, []);
  
  const handleNewRound = useCallback(() => {
    const newRoundId = Date.now().toString();
    let welcomeMessage: string;
    let initialMessage: Message;
    let updatedData: GolfData;

    if (!golfData) {
      // First round ever
      welcomeMessage = "Hey, I'm your AI Caddie! I'll remember how you play to give you the best advice. What's the situation on your first hole?";
      initialMessage = { role: Role.MODEL, content: welcomeMessage };
      updatedData = {
          rounds: { [newRoundId]: [initialMessage] },
          currentRoundId: newRoundId,
      };
    } else {
      // Subsequent new round
      welcomeMessage = "Alright, new round! I've got all your past shots in my memory. Let's get started. Tell me about the first hole.";
      initialMessage = { role: Role.MODEL, content: welcomeMessage };
      updatedData = {
          ...golfData,
          rounds: {
              ...golfData.rounds,
              [newRoundId]: [initialMessage],
          },
          currentRoundId: newRoundId,
      };
    }
    
    setGolfData(updatedData);
    const fullHistory = Object.values(updatedData.rounds).flat();
    geminiService.initializeChat(fullHistory);

    speak(welcomeMessage);
    setShowWelcome(false);
  }, [golfData, speak]);

  if (!golfData && !showWelcome) {
    return null; // Initial loading state
  }

  if (showWelcome) {
    return (
      <WelcomeScreen 
        onStartNewRound={handleNewRound} 
        onResumeRound={resumeRound}
        hasExistingData={golfData !== null}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Header onNewRound={handleNewRound} onGoToMainMenu={goToMainMenu} />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && <ChatMessage message={{ role: Role.MODEL, content: '...' }} isLoading={true} />}
        {error && <p className="text-red-400 text-center">{error}</p>}
      </main>
      <InputBar
        text={text}
        setText={setText}
        onSendMessage={handleSendMessage}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;