import React from 'react';

interface HeaderProps {
  onNewRound: () => void;
  onGoToMainMenu: () => void;
}

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

const Header: React.FC<HeaderProps> = ({ onNewRound, onGoToMainMenu }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <GolfBallIcon className="w-8 h-8 mr-3 text-green-400" />
        <h1 className="text-2xl font-bold tracking-tight text-white">AI Golf Caddie</h1>
      </div>
      <div className="flex items-center space-x-2">
         <button
          onClick={onGoToMainMenu}
          className="text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          aria-label="Go to main menu"
        >
          Main Menu
        </button>
        <button
          onClick={onNewRound}
          className="text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          aria-label="Start a new round"
        >
          New Round
        </button>
      </div>
    </header>
  );
};

export default Header;