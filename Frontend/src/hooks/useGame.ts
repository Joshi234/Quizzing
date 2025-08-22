import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import type {
  GameState,
  WebSocketMessage,
  JoinMessage,
  AnswerMessage,
  LobbyStateMessage,
  QuestionMessage,
  TimerTickMessage,
  AnswerResultMessage,
  LeaderboardMessage,
  ErrorMessage,
} from '../types/game';

const WEBSOCKET_URL = 'ws://localhost:5000/ws';

const initialState: GameState = {
  phase: 'joining',
  nickname: '',
  players: [],
  selectedOption: undefined,
  answerLocked: false,
  timeRemaining: 0,
  leaderboard: [],
  connected: false,
};

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('Received message:', message);

    switch (message.type) {
      case 'lobby_state':
        const lobbyData = message.data as LobbyStateMessage;
        setGameState(prev => ({
          ...prev,
          players: lobbyData.players,
          phase: lobbyData.gameState === 'lobby' ? 'lobby' : prev.phase,
        }));
        break;

      case 'game_started':
        setGameState(prev => ({
          ...prev,
          phase: 'question',
        }));
        break;

      case 'question':
        const questionData = message.data as QuestionMessage;
        setGameState(prev => ({
          ...prev,
          phase: 'question',
          currentQuestion: questionData,
          selectedOption: undefined,
          answerLocked: false,
          timeRemaining: questionData.durationMs,
        }));
        break;

      case 'timer_tick':
        const timerData = message.data as TimerTickMessage;
        setGameState(prev => ({
          ...prev,
          timeRemaining: timerData.remainingMs,
        }));
        break;

      case 'answer_ack':
        setGameState(prev => ({
          ...prev,
          answerLocked: true,
        }));
        break;

      case 'answer_result':
        const resultData = message.data as AnswerResultMessage;
        setGameState(prev => ({
          ...prev,
          phase: 'reveal',
          lastResult: resultData,
        }));
        break;

      case 'leaderboard':
        const leaderboardData = message.data as LeaderboardMessage;
        setGameState(prev => ({
          ...prev,
          phase: 'leaderboard',
          leaderboard: leaderboardData.entries,
        }));
        break;

      case 'error':
        const errorData = message.data as ErrorMessage;
        setGameState(prev => ({
          ...prev,
          error: errorData.message,
        }));
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  }, []);

  const handleOpen = useCallback(() => {
    setGameState(prev => ({ ...prev, connected: true }));
  }, []);

  const handleClose = useCallback(() => {
    setGameState(prev => ({ ...prev, connected: false }));
  }, []);

  const handleError = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      connected: false,
      error: 'Connection error. Retrying...',
    }));
  }, []);

  const { isConnected, sendMessage } = useWebSocket({
    url: WEBSOCKET_URL,
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    onError: handleError,
  });

  const joinGame = useCallback((nickname: string) => {
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setGameState(prev => ({
        ...prev,
        error: 'Nickname must be 2-20 characters',
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      nickname: trimmedNickname,
      error: undefined,
    }));

    sendMessage<JoinMessage>('join', { nickname: trimmedNickname });
  }, [sendMessage]);

  const selectOption = useCallback((option: 'A' | 'B' | 'C' | 'D') => {
    setGameState(prev => ({
      ...prev,
      selectedOption: option,
    }));
  }, []);

  const submitAnswer = useCallback(() => {
    if (!gameState.currentQuestion || !gameState.selectedOption || gameState.answerLocked) {
      return;
    }

    sendMessage<AnswerMessage>('answer', {
      questionId: gameState.currentQuestion.questionId,
      option: gameState.selectedOption,
      clientTs: Date.now(),
    });
  }, [gameState.currentQuestion, gameState.selectedOption, gameState.answerLocked, sendMessage]);

  const clearError = useCallback(() => {
    setGameState(prev => ({ ...prev, error: undefined }));
  }, []);

  // Update connected state based on WebSocket connection
  useEffect(() => {
    setGameState(prev => ({ ...prev, connected: isConnected }));
  }, [isConnected]);

  return {
    gameState,
    joinGame,
    selectOption,
    submitAnswer,
    clearError,
  };
};