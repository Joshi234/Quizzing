import { useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { JoinScreen } from './components/JoinScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { RevealScreen } from './components/RevealScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import './App.css';

function App() {
  const { gameState, joinGame, selectOption, submitAnswer, clearError } = useGame();

  // Clear error after 5 seconds
  useEffect(() => {
    if (gameState.error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.error, clearError]);

  const renderCurrentScreen = () => {
    switch (gameState.phase) {
      case 'joining':
        return (
          <JoinScreen
            onJoin={joinGame}
            error={gameState.error}
            connected={gameState.connected}
          />
        );

      case 'lobby':
        return (
          <LobbyScreen
            nickname={gameState.nickname}
            players={gameState.players}
            connected={gameState.connected}
          />
        );

      case 'question':
        if (!gameState.currentQuestion) return null;
        return (
          <QuestionScreen
            question={gameState.currentQuestion}
            selectedOption={gameState.selectedOption}
            answerLocked={gameState.answerLocked}
            timeRemaining={gameState.timeRemaining}
            onSelectOption={selectOption}
            onSubmitAnswer={submitAnswer}
          />
        );

      case 'reveal':
        if (!gameState.currentQuestion || !gameState.lastResult) return null;
        return (
          <RevealScreen
            question={gameState.currentQuestion}
            result={gameState.lastResult}
            selectedOption={gameState.selectedOption}
          />
        );

      case 'leaderboard':
        return (
          <LeaderboardScreen
            entries={gameState.leaderboard}
            questionNumber={1}
            currentPlayerNickname={gameState.nickname}
          />
        );

      default:
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <h1 className="text-2xl font-bold mb-4">Loading...</h1>
              <p>Connecting to game server...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;
