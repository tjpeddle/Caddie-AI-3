import React from 'react';

const GolfBallIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128ZM128,48a80,80,0,1,0,80,80A80.09,80.09,0,0,0,128,48Zm0,112a12,12,0,1,1,12-12A12,12,0,0,1,128,160Zm-40-28a12,12,0,1,1,12-12A12,12,0,0,1,88,132Zm-4-48a12,12,0,1,1,12-12A12,12,0,0,1,84,84Zm56,8a12,12,0,1,1,12-12A12,12,0,0,1,140,92Zm40-24a12,12,0,1,1,12-12A12,12,0,0,1,180,68Zm-8,64a12,12,0,1,1,12-12A12,12,0,0,1,172,132Z" />
  </svg>
);


interface WelcomeScreenProps {
  onStartNewRound: () => void;
  onResumeRound: () => void;
  hasExistingData: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartNewRound, onResumeRound, hasExistingData }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6 text-center">
      <div className="max-w-md">
        <GolfBallIcon className="w-24 h-24 mx-auto mb-6 text-green-400" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Caddie</h1>
        {hasExistingData ? (
          <>
            <p className="text-lg text-gray-300 mb-8">
              Welcome back! You can resume your last round or start a fresh one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onResumeRound}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 duration-300 shadow-lg"
              >
                Resume Round
              </button>
              <button
                onClick={onStartNewRound}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors duration-300"
              >
                Start New Round
              </button>
            </div>
          </>
        ) : (
           <>
            <p className="text-lg text-gray-300 mb-8">
              Your personal, voice-activated caddie. Tell me about your shots, and I'll help you with club selection and strategy based on how you're playing today.
            </p>
            <button
              onClick={onStartNewRound}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-transform transform hover:scale-105 duration-300 shadow-lg"
            >
              Start Round
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;