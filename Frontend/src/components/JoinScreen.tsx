import React, { useState } from 'react';
import { Button } from './Button';

interface JoinScreenProps {
  onJoin: (nickname: string) => void;
  error?: string;
  connected: boolean;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin, error, connected }) => {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim() && connected) {
      onJoin(nickname);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Quiz Game</h1>
          <p className="text-gray-400">Enter your nickname to join</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              minLength={2}
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!connected}
            />
            <p className="mt-1 text-xs text-gray-500">2-20 characters</p>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!connected && (
            <div className="bg-yellow-900 border border-yellow-700 text-yellow-100 px-4 py-3 rounded-lg">
              Connecting to server...
            </div>
          )}

          <Button
            type="submit"
            disabled={!nickname.trim() || !connected}
            className="w-full"
            size="lg"
          >
            Join Game
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className={`inline-flex items-center space-x-2 text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};