// WebSocket Message Types
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
}

// Client to Server Messages
export interface JoinMessage {
  nickname: string;
}

export interface AnswerMessage {
  questionId: string;
  option: 'A' | 'B' | 'C' | 'D';
  clientTs: number;
}

export interface PingMessage {
  nonce: string;
}

// Server to Client Messages
export interface LobbyStateMessage {
  players: PlayerInfo[];
  gameState: 'lobby' | 'active';
}

export interface PlayerInfo {
  id: string;
  nickname: string;
}

export interface GameStartedMessage {
  startAt: string;
}

export interface QuestionMessage {
  questionId: string;
  text: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  durationMs: number;
  askedAt: string;
}

export interface TimerTickMessage {
  questionId: string;
  remainingMs: number;
}

export interface AnswerAckMessage {
  questionId: string;
  receivedAt: string;
}

export interface AnswerResultMessage {
  questionId: string;
  correct: 'A' | 'B' | 'C' | 'D';
  youCorrect: boolean;
  yourPointsThisQ: number;
}

export interface LeaderboardMessage {
  entries: LeaderboardEntry[];
  questionNumber: number;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  totalPoints: number;
  lastDelta?: number;
}

export interface SystemMessage {
  message: string;
}

export interface PongMessage {
  nonce: string;
  serverTs: number;
}

export interface ErrorMessage {
  code: string;
  message: string;
}

// UI State Types
export type GamePhase = 'joining' | 'lobby' | 'question' | 'reveal' | 'leaderboard';

export interface GameState {
  phase: GamePhase;
  nickname: string;
  players: PlayerInfo[];
  currentQuestion?: QuestionMessage;
  selectedOption?: 'A' | 'B' | 'C' | 'D';
  answerLocked: boolean;
  timeRemaining: number;
  lastResult?: AnswerResultMessage;
  leaderboard: LeaderboardEntry[];
  error?: string;
  connected: boolean;
}