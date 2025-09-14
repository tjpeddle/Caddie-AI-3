 import React, { useState, useEffect, useCallback } from "react";
import ChatMessage from "./components/ChatMessage";
import PhotoCapture from "./components/PhotoCapture";
import Scorecard from "./components/Scorecard";
import Settings from "./components/Settings";
import geminiService from "./services/geminiService";
import { Message, GolfData, RoundStats } from "./types";

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [golfData, setGolfData] = useState<GolfData | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voice, setVoice] = useState<string>("default");
  const [isListening, setIsListening] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // simple randomized greetings
  const greetings = [
    "Hey, ready to play?",
    "Let’s hit the course!",
    "Your caddie’s here.",
    "Game time—let’s go.",
    "Ready when you are."
  ];

  // Restore history
  useEffect(() => {
    const savedMessages = localStorage.getItem("messages");
    const savedGolfData = localStorage.getItem("golfData");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedGolfData) setGolfData(JSON.parse(savedGolfData));
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    localStorage.setItem("golfData", JSON.stringify(golfData));
  }, [messages, golfData]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const randomGreeting =
        greetings[Math.floor(Math.random() * greetings.length)];
      setMessages([{ role: "assistant", content: randomGreeting }]);
    }
  }, [messages]);

  const processScoreData = useCallback(
    (data: any): GolfData => {
      if (!golfData) {
        return {
          currentRoundId: Date.now().toString(),
          roundStats: {
            [Date.now().toString()]: { strokes: 0, pars: 0, birdies: 0, bogeys: 0 }
          }
        };
      }
      const roundId = golfData.currentRoundId || Date.now().toString();
      const currentStats: RoundStats = golfData.roundStats?.[roundId] || {
        strokes: 0,
        pars: 0,
        birdies: 0,
        bogeys: 0
      };
      const updatedStats: RoundStats = {
        strokes: currentStats.strokes + (data.strokes || 0),
        pars: currentStats.pars + (data.pars || 0),
        birdies: currentStats.birdies + (data.birdies || 0),
        bogeys: currentStats.bogeys + (data.bogeys || 0)
      };
      return {
        currentRoundId: roundId,
        roundStats: { ...golfData.roundStats, [roundId]: updatedStats }
      };
    },
    [golfData]
  );

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice !== "default") {
        const voices = speechSynthesis.getVoices();
        const selected = voices.find((v) => v.name === voice);
        if (selected) utterance.voice = selected;
      }
      speechSynthesis.speak(utterance);
    }
  };

  const handleUserInput = useCallback(
    async (input: string) => {
      if (!input.trim()) return;
      const userMessage: Message = { role: "user", content: input };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const result = await geminiService.sendMessage(updatedMessages, golfData);
        const assistantMessage: Message = { role: "assistant", content: result.text };
        setMessages((prev) => [...prev, assistantMessage]);
        if (result.data) {
          setGolfData((prev) => (prev ? processScoreData(result.data) : null));
        }
        speak(result.text);
      } catch (err) {
        console.error("Error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong." }
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, golfData, processScoreData]
  );

  const handlePhotoTaken = useCallback(
    async (photoData: string, description: string) => {
      if (!golfData?.currentRoundId) return;
      setIsPhotoLoading(true);

      const photoMessage: Message = {
        role: "user",
        content: description,
        image: photoData
      };
      const updatedMessages = [...messages, photoMessage];
      setMessages(updatedMessages);

      try {
        const result = await geminiService.sendMessage(updatedMessages, golfData);
        const assistantMessage: Message = { role: "assistant", content: result.text };
        setMessages((prev) => [...prev, assistantMessage]);
        if (result.data) {
          setGolfData((prev) => (prev ? processScoreData(result.data) : null));
        }
        speak(result.text);
      } catch (err) {
        console.error("Photo error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't process that photo." }
        ]);
      } finally {
        setIsPhotoLoading(false);
      }
    },
    [messages, golfData, processScoreData]
  );

  // Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        const lock = await (navigator as any).wakeLock?.request("screen");
        setWakeLock(lock);
        lock?.addEventListener("release", () => setWakeLock(null));
      } catch (err) {
        console.warn("WakeLock error:", err);
      }
    };
    requestWakeLock();
    return () => {
      wakeLock?.release();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-2 bg-gray-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowScorecard(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Scorecard"
          >
            📋
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        <PhotoCapture
          onPhotoTaken={handlePhotoTaken}
          isLoading={isPhotoLoading}
        />
      </header>
      <main className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {(isLoading || isPhotoLoading) && (
          <div className="text-gray-400">Thinking…</div>
        )}
      </main>
      <footer className="p-2 bg-gray-800">
        <ChatInput
          onSend={handleUserInput}
          isListening={isListening}
          setIsListening={setIsListening}
          isLoading={isLoading}
        />
      </footer>
      {showScorecard &&
        golfData?.currentRoundId &&
        golfData.roundStats?.[golfData.currentRoundId] && (
          <Scorecard
            roundStats={golfData.roundStats[golfData.currentRoundId]}
            isVisible={showScorecard}
            onClose={() => setShowScorecard(false)}
          />
        )}
      {showSettings && (
        <Settings
          voice={voice}
          setVoice={setVoice}
          isVisible={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;

