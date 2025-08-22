import React from 'react';
import type { PlayerInfo } from '../types/game';

interface LobbyScreenProps {
  nickname: string;
  players: PlayerInfo[];
  connected: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ nickname, players, connected }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Quiz Game Lobby</h1>
          <p className="text-gray-400">Welcome, {nickname}!</p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className={`inline-flex items-center space-x-2 text-lg ${connected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Players ({players.length})
            </h2>
            
            {players.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No players connected yet...
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      player.nickname === nickname
                        ? 'bg-blue-900 border border-blue-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white font-medium">{player.nickname}</span>
                    {player.nickname === nickname && (
                      <span className="text-blue-300 text-sm">(you)</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="bg-yellow-900 border border-yellow-700 text-yellow-100 px-4 py-3 rounded-lg">
              <p className="font-medium">Waiting for host to start the game...</p>
              <p className="text-sm mt-1">The game will begin when the host runs the start command</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};