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
  const [voiceSpeed, setVoiceSpeed] = useState(0.8);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // NEW: State for our on-screen debug logs
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // NEW: Function to add a log message
  const addLog = useCallback((message: string) => {
    setDebugLogs(prevLogs => {
      const timestamp = new Date().toLocaleTimeString();
      return [...prevLogs, `[${timestamp}] ${message}`];
    });
  }, []);

  // NEW: Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      addLog(`Global Error: ${event.message}`);
      addLog(`Stack: ${event.error?.stack || 'No stack available'}`);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      addLog(`Unhandled Rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
d      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [addLog]);

  // Rest of your useEffect hooks
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const data = JSON.parse(savedHistory) as GolfData;
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
    // ... your speak function
  }, [selectedVoice, voiceSpeed]);

  const requestWakeLock = useCallback(async () => {
    // ... your wake lock function
  }, []);

  const releaseWakeLock = useCallback(() => {
    // ... your release wake lock function
  }, [wakeLock]);

  const processScoreData = useCallback((text: string, currentRoundId: string) => {
    // ... your process score data function
  }, [golfData]);
  
  const messages = useMemo(() => {
    if (!golfData || !golfData.currentRoundId) return [];
    return golfData.rounds[golfData.currentRoundId] || [];
  }, [golfData]);
  
  // This is the function we've been debugging
  const handlePhotoTaken = useCallback(async (photoData: string, description: string) => {
    addLog('handlePhotoTaken called');
    if (!golfData?.currentRoundId) {
      addLog('No current round ID');
      return;
    }
    
    setIsPhotoLoading(true);

    try {
      const photoMessage: Message = {
        role: Role.USER,
        content: "📸 Golf hole photo uploaded for analysis",
        image: photoData
      };
      
      const currentRoundId = golfData.currentRoundId;
      setGolfData(prevData => {
        if (!prevData) return null;
        const currentMessages = prevData.rounds[currentRoundId] || [];
        return {
          ...prevData,
          rounds: {
            ...prevData.rounds,
            [currentRoundId]: [...currentMessages, photoMessage],
          },
        };
      });

      const analysisPrompt = `Analyze this golf hole and provide strategic advice. Look for hazards, green shape, pin position, best target areas, and club selection suggestions. Provide specific strategic advice for playing this hole.`;
      
      let response;
      try {
        response = await geminiService.sendMessage(analysisPrompt, [photoData]);
        const aiMessage: Message = { role: Role.MODEL, content: response };
        setGolfData(prevData => {
          if (!prevData) return null;
          const currentMessages = prevData.rounds[currentRoundId] || [];
          return {
            ...prevData,
            rounds: {
              ...prevData.rounds,
              [currentRoundId]: [...currentMessages, aiMessage],
            },
          };
        });
        speak(response);

      } catch (geminiError) {
        addLog(`Gemini Service Error: ${geminiError}`);
        const errorMessage: Message = {
          role: Role.MODEL,
          content: "I can see your photo but I'm having trouble analyzing it right now. The image uploaded successfully though! Try asking me about your golf situation with text for now."
        };
        setGolfData(prevData => {
          if (!prevData) return null;
          const currentMessages = prevData.rounds[currentRoundId] || [];
          return {
            ...prevData,
            rounds: {
              ...prevData.rounds,
              [currentRoundId]: [...currentMessages, errorMessage],
            },
          };
        });
        setIsPhotoLoading(false);
        return;
      }
    } catch (error) {
      addLog(`Unexpected Photo Error: ${error}`);
      setIsPhotoLoading(false);
    } finally {
      setIsPhotoLoading(false);
      addLog('setIsPhotoLoading(false) called');
    }
  }, [golfData?.currentRoundId, setGolfData, speak, addLog]);

  // Rest of your functions
  const handleUserInput = useCallback(async (inputText: string) => {
    // ...
  }, [isLoading, golfData, speak]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onTranscriptChange: setText,
  });

  const handleSendMessage = useCallback((message: string) => {
    // ...
  }, [handleUserInput, isListening, stopListening]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // ... other useEffect hooks

  const goToMainMenu = useCallback(() => {
    setShowWelcome(true);
  }, []);

  const resumeRound = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const handleNewRound = useCallback(() => {
    // ...
  }, [golfData, speak]);
  
  if (!golfData && !showWelcome) {
    return null;
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
        {debugLogs.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg text-sm font-mono text-gray-300">
            <h3 className="text-white font-bold mb-2">Debug Log</h3>
            {debugLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        )}
      </main>

      <div className="p-4 border-t border-gray-700">
        <div className="flex justify-end">
          <div className="relative">
            <PhotoCapture
              onPhotoTaken={handlePhotoTaken}
              isLoading={isPhotoLoading}
            />
            <button
              onClick={() => setShowScorecard(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
              title="View Scorecard"
            >
              📋
            </button>
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Voice Settings"
            >
              ⚙️
            </button>
            {showVoiceSettings && (
              <div className="absolute bottom-12 right-0 bg-gray-800 rounded-lg p-4 min-w-48 shadow-lg">
                <h3 className="text-white mb-2">Voice Options</h3>
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
      
      {golfData?.currentRoundId && golfData.roundStats[golfData.currentRoundId] && (
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
