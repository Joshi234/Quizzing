import React from 'react';

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
}

export const Timer: React.FC<TimerProps> = ({ timeRemaining, totalTime }) => {
  const progress = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0;
  const seconds = Math.ceil(timeRemaining / 1000);
  
  // Color based on remaining time
  const getColor = () => {
    if (progress > 60) return 'text-green-400';
    if (progress > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    if (progress > 60) return 'stroke-green-400';
    if (progress > 30) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            className={`transition-all duration-1000 ${getProgressColor()}`}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${getColor()}`}>
          {seconds}
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-400">
        seconds remaining
      </div>
    </div>
  );
};