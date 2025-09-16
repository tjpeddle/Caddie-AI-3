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
 const [messages, setMessages] = useState<Message[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    if (!golfData || !golfData.currentRoundId) return [];
    return golfData.rounds[golfData.currentRoundId] || [];
  }, [golfData]);

  // Load history
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
      console.error("Failed to load chat history:", e);
      localStorage.removeItem(STORAGE_KEY);
      setShowWelcome(true);
    }
  }, []);

  // Save history
  useEffect(() => {
    if (golfData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(golfData));
    }
  }, [golfData]);
 
  // Load voices - BASIC VERSION
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
    try {
      if (window.speechSynthesis && text.trim()) {
        // Always cancel previous speech first
        window.speechSynthesis.cancel();
        
        // Wait a bit longer to ensure speech synthesis is ready
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = voiceSpeed;
          utterance.volume = 1.0;
          utterance.pitch = 1.0;
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          
          utterance.onstart = () => {
            console.log('Speech started successfully');
          };
          
          utterance.onerror = (event) => {
            console.error('Speech error:', event);
          };
          
          utterance.onend = () => {
            console.log('Speech completed');
          };
          
          // Try to speak - with additional error handling
          try {
            window.speechSynthesis.speak(utterance);
            console.log('Speech synthesis called');
          } catch (speakError) {
            console.error('Failed to call speak:', speakError);
            // Try again after a longer delay
            setTimeout(() => {
              try {
                window.speechSynthesis.speak(utterance);
              } catch (retryError) {
                console.error('Retry also failed:', retryError);
              }
            }, 500);
          }
        }, 200); // Longer delay to avoid conflicts with microphone
      }
    } catch (error) {
      console.error('Speech setup failed:', error);
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

  // SIMPLIFIED score processing
  const processScoreData = useCallback((text: string, currentRoundId: string) => {
    if (!golfData?.roundStats[currentRoundId]) return;
    
    const lowerText = text.toLowerCase();
    let updates: any = {};
    
    // Simple patterns
    if (lowerText.includes('hit') && lowerText.includes('fairway')) updates.fairwayHit = true;
    if (lowerText.includes('miss') && lowerText.includes('fairway')) updates.fairwayHit = false;
    if (lowerText.includes('hit') && lowerText.includes('green')) updates.greenInRegulation = true;
    if (lowerText.includes('miss') && lowerText.includes('green')) updates.greenInRegulation = false;
    
    if (lowerText.includes('two putt')) updates.putts = 2;
    if (lowerText.includes('three putt')) updates.putts = 3;
    
    if (Object.keys(updates).length > 0) {
      setGolfData(prevData => {
        if (!prevData) return null;
        const roundStats = { ...prevData.roundStats[currentRoundId] };
        const holeNumber = roundStats.currentHole;
        const existingHoleIndex = roundStats.holes.findIndex(h => h.holeNumber === holeNumber);
        
        if (existingHoleIndex >= 0) {
          roundStats.holes[existingHoleIndex] = { ...roundStats.holes[existingHoleIndex], ...updates };
        } else {
          roundStats.holes.push({ holeNumber, par: 4, ...updates });
        }
        
        return {
          ...prevData,
          roundStats: { ...prevData.roundStats, [currentRoundId]: roundStats }
        };
      });
    }
  }, [golfData]);

  // DISABLED photo handling for now to prevent crashes
  const handlePhotoTaken = useCallback(async (photoData: string, description: string) => {
    console.log('Photo feature temporarily disabled to prevent crashes');
    // Don't process photos until we fix the crash issue
  }, []);

  const handleUserInput = useCallback(async (inputText: string) => {
    if (!inputText || isLoading || !golfData?.currentRoundId) return;

    const userMessage: Message = { role: Role.USER, content: inputText };
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

      processScoreData(inputText + " " + responseText, currentRoundId);

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
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, golfData, speak, processScoreData]);
  
  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onTranscriptChange: setText,
  });
  
  const handleSendMessage = useCallback((message: string) => {
    const messageToSend = message.trim();
    if (messageToSend) {
      handleUserInput(messageToSend);
      setText('');
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
    requestWakeLock();
    return () => {
      releaseWakeLock();
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
    // MUCH more concise welcome message
    let welcomeMessage = "Ready to caddie for you. What's your first shot?";
    let initialMessage: Message = { role: Role.MODEL, content: welcomeMessage };
    
    let updatedData: GolfData;
    if (!golfData) {
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
    }
    
    setGolfData(updatedData);
    const fullHistory = Object.values(updatedData.rounds).flat();
    geminiService.initializeChat(fullHistory);
    speak(welcomeMessage);
    setShowWelcome(false);
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
      </main>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex justify-end">
          <div className="relative">
<SimpleCamera 
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
      
      {golfData?.currentRoundId && golfData.roundStats?.[golfData.currentRoundId] && (
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
