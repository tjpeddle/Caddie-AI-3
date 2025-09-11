
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
const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(0.8);
  const [wakeLock, setWakeLock] = useState<any>(null);
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
      // Ensure roundStats exists for backward compatibility
      if (!data.roundStats) {
        data.roundStats = {};
      }
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

  // Load available voices
useEffect(() => {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    setAvailableVoices(voices);
    // Set default voice (first English voice or first voice)
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
      
      // Use selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
      };
      
      window.speechSynthesis.speak(utterance);
    }, 100);
  }
}, [selectedVoice, voiceSpeed]);
const requestWakeLock = useCallback(async () => {
  try {
    if ('wakeLock' in navigator) {
      const lock = await (navigator as any).wakeLock.request('screen');
      setWakeLock(lock);
      console.log('Wake lock active');
    }
  } catch (err) {
    console.error('Wake lock failed:', err);
  }
}, []);

const releaseWakeLock = useCallback(() => {
  if (wakeLock) {
    wakeLock.release();
    setWakeLock(null);
    console.log('Wake lock released');
  }
}, [wakeLock]);
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
    setText(''); // This clears the input
    // Also stop listening and clear any ongoing speech recognition
    if (isListening) {
      stopListening();
    }
  }
}, [handleUserInput, isListening, stopListening]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
useEffect(() => {
  // Request wake lock when app starts
  requestWakeLock();
  
  // Re-request if visibility changes
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      requestWakeLock();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    releaseWakeLock();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [requestWakeLock, releaseWakeLock]);
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
    roundStats: { 
        [newRoundId]: {
            roundId: newRoundId,
            date: new Date().toISOString(),
            holes: [],
            currentHole: 1,
        }
    },
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
    roundStats: {
        ...golfData.roundStats,
        [newRoundId]: {
            roundId: newRoundId,
            date: new Date().toISOString(),
            holes: [],
            currentHole: 1,
        },
    },
    currentRoundId: newRoundId,
};
    
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
      {/* Voice Settings - ADD THIS WHOLE SECTION */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex justify-end">
          <div className="relative">
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Voice Settings"
            >
             ⚙️
            </button>
            
            {showVoiceSettings && (
              <div className="absolute bottom-12 right-0 bg-gray-800 rounded-lg p-4 min-w-48 shadow-lg">
                <h3 className="text-white mb-2">Voice Options</h3>{/* Speed Control */}
<div className="mb-4 pb-4 border-b border-gray-600">
  <label className="text-white text-sm mb-2 block">
    Speed: {voiceSpeed.toFixed(1)}x
  </label>
  <input
    type="range"
    min="0.5"
    max="2.0"
    step="0.1"
    value={voiceSpeed}
    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
    className="w-full"
  />
  <div className="flex justify-between text-xs text-gray-400 mt-1">
    <span>Slow</span>
    <span>Fast</span>
  </div>
</div>
                
                <div className="max-h-40 overflow-y-auto">
                  {availableVoices.map((voice, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedVoice(voice);
                        setShowVoiceSettings(false);
                      }}
                      className={`block w-full text-left p-2 rounded text-sm mb-1 ${
                        selectedVoice === voice
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {voice.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
    </div>
  );
};

export default App;
