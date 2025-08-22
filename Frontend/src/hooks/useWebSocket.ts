import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage } from '../types/game';

export interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(options.url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setLastError(null);
        reconnectAttempts.current = 0;
        options.onOpen?.();
      };

      ws.onclose = () => {
        setIsConnected(false);
        options.onClose?.();
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        setLastError('WebSocket connection error');
        options.onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          options.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      setLastError('Failed to connect to WebSocket');
      console.error('WebSocket connection failed:', error);
    }
  }, [options]);

  const sendMessage = useCallback(<T,>(type: string, data: T) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage<T> = { type, data };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastError,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};