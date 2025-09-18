import React from 'react';
import { RoundStats } from '../types';

interface ScorecardProps {
  roundStats: RoundStats;
  isVisible: boolean;
  onClose: () => void;
}

const Scorecard: React.FC<ScorecardProps> = ({ roundStats, isVisible, onClose }) => {
  if (!isVisible) return null;

  const totalScore = roundStats.holes.reduce((sum, hole) => sum + (hole.score || 0), 0);
  const fairwaysHit = roundStats.holes.filter(hole => hole.fairwayHit).length;
  const greensHit = roundStats.holes.filter(hole => hole.greenInRegulation).length;
  const totalPutts = roundStats.holes.reduce((sum, hole) => sum + (hole.putts || 0), 0);
  const upAndDowns = roundStats.holes.filter(hole => hole.upAndDown).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 m-4 max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Scorecard</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="text-white space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Total Score:</span>
            <span className="font-bold">{totalScore}</span>
          </div>
          <div className="flex justify-between">
            <span>Fairways Hit:</span>
            <span>{fairwaysHit}/{roundStats.holes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Greens in Regulation:</span>
            <span>{greensHit}/{roundStats.holes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Putts:</span>
            <span>{totalPutts}</span>
          </div>
          <div className="flex justify-between">
            <span>Up & Downs:</span>
            <span>{upAndDowns}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-white font-bold">Hole by Hole:</h3>
          {roundStats.holes.map((hole, index) => (
            <div key={index} className="bg-gray-700 rounded p-2 text-sm text-white">
              <div className="flex justify-between">
                <span>Hole {hole.holeNumber} (Par {hole.par})</span>
                <span>Score: {hole.score || '-'}</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Fairway: {hole.fairwayHit ? '✓' : '✗'} | 
                Green: {hole.greenInRegulation ? '✓' : '✗'} | 
                Putts: {hole.putts || '-'} |
                {hole.upAndDown && ' Up & Down ✓'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scorecard;
