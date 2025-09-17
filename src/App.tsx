   import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Message, Role, GolfData } from "./types";
import { geminiService } from "./services/geminiService";
import Header from "./components/Header";
import ChatMessage from "./components/ChatMessage";
import InputBar from "./components/InputBar";
import WelcomeScreen from "./components/WelcomeScreen";
import Scorecard from "./components/Scorecard";
import SimpleCamera from "./components/SimpleCamera";

const STORAGE_KEY = "golfCaddieHistory_v2";

const App: React.FC = () => {
  const [golfData, setGolfData] = useState<GolfData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [text, setText] = useState("");
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);

  // --- Load saved history ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as GolfData;
        setGolfData(data);
        const fullHistory = Object.values(data.rounds).flat();
        geminiService.initializeChat(fullHistory);
      } else {
        setShowWelcome(true);
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem(STORAGE_KEY);
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (golfData) localStorage.setItem(STORAGE_KEY, JSON.stringify(golfData));
  }, [golfData]);

  // --- Derive messages ---
  const messages = useMemo(() => {
    if (!golfData?.currentRoundId) return [];
    return golfData.rounds[golfData.currentRoundId] || [];
  }, [golfData]);

  // --- Photo handling using native iOS camera (file input) ---
  const handlePhotoTaken = useCallback(
    async (base64Image: string, description: string) => {
      if (!golfData?.currentRoundId) return;

      setIsPhotoLoading(true);
      try {
        const response = await fetch("/api/analyze-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const data = await response.json();

        setGolfData((prev) => {
          if (!prev) return null;
          const roundId = prev.currentRoundId!;
          return {
            ...prev,
            rounds: {
              ...prev.rounds,
              [roundId]: [
                ...(prev.rounds[roundId] || []),
                { role: Role.USER, content: description, image: base64Image },
                { role: Role.MODEL, content: data.analysis || "No analysis returned" },
              ],
            },
          };
        });
      } catch (err) {
        console.error("Error analyzing photo:", err);
        setGolfData((prev) => {
          if (!prev) return null;
          const roundId = prev.currentRoundId!;
          return {
            ...prev,
            rounds: {
              ...prev.rounds,
              [roundId]: [
                ...(prev.rounds[roundId] || []),
                { role: Role.MODEL, content: "⚠️ Error analyzing image" },
              ],
            },
          };
        });
      } finally {
        setIsPhotoLoading(false);
      }
    },
    [golfData]
  );

  // --- Start new round ---
  const handleNewRound = useCallback(() => {
    const newRoundId = Date.now().toString();
    const welcomeMessage: Message = {
      role: Role.MODEL,
      content: "Ready to caddie for you. What's your first shot?",
    };

    const updated: GolfData = golfData
      ? {
          ...golfData,
          rounds: { ...golfData.rounds, [newRoundId]: [welcomeMessage] },
          roundStats: {
            ...golfData.roundStats,
            [newRoundId]: { roundId: newRoundId, date: new Date().toISOString(), holes: [], currentHole: 1 },
          },
          currentRoundId: newRoundId,
        }
      : {
          rounds: { [newRoundId]: [welcomeMessage] },
          roundStats: { [newRoundId]: { roundId: newRoundId, date: new Date().toISOString(), holes: [], currentHole: 1 } },
          currentRoundId: newRoundId,
        };

    setGolfData(updated);
    geminiService.initializeChat([welcomeMessage]);
    setShowWelcome(false);
  }, [golfData]);

  if (showWelcome) {
    return <WelcomeScreen onStartNewRound={handleNewRound} onResumeRound={() => setShowWelcome(false)} hasExistingData={!!golfData} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Header onNewRound={handleNewRound} onGoToMainMenu={() => setShowWelcome(true)} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isLoading && <ChatMessage message={{ role: Role.MODEL, content: "..." }} isLoading />}
        {error && <p className="text-red-400 text-center">{error}</p>}
      </main>

      <div className="p-4 border-t border-gray-700 flex justify-end space-x-2">
        <SimpleCamera onPhotoTaken={handlePhotoTaken} isLoading={isPhotoLoading} />
        <button onClick={() => setShowScorecard(true)}>📋</button>
      </div>

      <InputBar text={text} setText={setText} onSendMessage={() => {}} isListening={false} startListening={() => {}} stopListening={() => {}} isLoading={isLoading} />

      {golfData?.currentRoundId && (
        <Scorecard roundStats={golfData.roundStats[golfData.currentRoundId]} isVisible={showScorecard} onClose={() => setShowScorecard(false)} />
      )}
    </div>
  );
};

export default App;


