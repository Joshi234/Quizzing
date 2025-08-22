import React from 'react';
import type { LeaderboardEntry } from '../types/game';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  questionNumber: number;
  currentPlayerNickname: string;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  entries,
  questionNumber,
  currentPlayerNickname,
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number, isCurrentPlayer: boolean) => {
    const baseClasses = 'p-4 rounded-lg border-2 transition-all duration-200';
    
    if (isCurrentPlayer) {
      return `${baseClasses} bg-blue-900 border-blue-600`;
    }
    
    if (rank === 1) {
      return `${baseClasses} bg-yellow-900 border-yellow-600`;
    }
    
    if (rank <= 3) {
      return `${baseClasses} bg-gray-700 border-gray-500`;
    }
    
    return `${baseClasses} bg-gray-800 border-gray-600`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">After Question {questionNumber}</p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentPlayer = entry.nickname === currentPlayerNickname;
            
            return (
              <div
                key={entry.id}
                className={getRankStyle(rank, isCurrentPlayer)}
              >
                <div className="flex items-center justify-between">
                  {/* Rank and Name */}
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold w-12 text-center">
                      {typeof getRankIcon(rank) === 'string' && getRankIcon(rank).startsWith('#') ? (
                        <span className="text-gray-400">{getRankIcon(rank)}</span>
                      ) : (
                        <span>{getRankIcon(rank)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${isCurrentPlayer ? 'text-blue-200' : 'text-white'}`}>
                        {entry.nickname}
                        {isCurrentPlayer && (
                          <span className="ml-2 text-sm text-blue-400">(you)</span>
                        )}
                      </h3>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {entry.totalPoints}
                      <span className="text-sm text-gray-400 ml-1">pts</span>
                    </div>
                    {entry.lastDelta !== undefined && entry.lastDelta !== null && (
                      <div className={`text-sm ${
                        entry.lastDelta > 0 ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {entry.lastDelta > 0 ? `+${entry.lastDelta}` : entry.lastDelta}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No players message */}
        {entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No players to display</p>
          </div>
        )}

        {/* Waiting message */}
        <div className="text-center mt-8">
          <div className="bg-blue-900 border border-blue-700 text-blue-100 px-6 py-4 rounded-lg inline-block">
            <p className="font-medium">Waiting for the next question...</p>
            <p className="text-sm text-blue-300">The host will start the next round shortly</p>
          </div>
        </div>

        {/* Winner celebration for first place */}
        {entries.length > 0 && questionNumber > 0 && (
          <div className="text-center mt-6">
            <p className="text-gray-400">
              🎉 <span className="text-yellow-400 font-bold">{entries[0].nickname}</span> is in the lead! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
};