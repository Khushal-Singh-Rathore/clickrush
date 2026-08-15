import { useCallback, useEffect, useRef, useState } from 'react';
import { sounds } from '../utils/audio';

export type GameStateStatus = 'CONNECTING' | 'ACTIVE' | 'COMPLETED' | 'DISCONNECTED' | 'ERROR';

export interface FinalGameResult {
  game_id: string;
  click_count: number;
  score: number;
  duration_seconds?: number;
  started_at: string;
  ended_at: string;
  status: string;
}

export const useGameWebSocket = (gameId: string | null, token: string | null) => {
  const [gameState, setGameState] = useState<GameStateStatus>('CONNECTING');
  const [clickCount, setClickCount] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<FinalGameResult | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const completedRef = useRef<boolean>(false);
  const lastBeepSecRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameId || !token) return;

    completedRef.current = false;
    lastBeepSecRef.current = null;

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/games/${gameId}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    setGameState('CONNECTING');

    ws.onopen = () => {
      setGameState('ACTIVE');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'game_start') {
          setGameState('ACTIVE');
          setClickCount(data.click_count || 0);
          setSecondsRemaining(data.seconds_remaining ?? data.duration_seconds ?? 60);
        } else if (data.type === 'state') {
          setClickCount(data.click_count);
          setSecondsRemaining(data.seconds_remaining);

          // Audio Beep for final 3 seconds countdown
          const intSec = Math.floor(data.seconds_remaining);
          if (intSec <= 3 && intSec >= 1 && intSec !== lastBeepSecRef.current) {
            lastBeepSecRef.current = intSec;
            sounds.playBeep(880 + (4 - intSec) * 100);
          }
        } else if (data.type === 'game_complete') {
          completedRef.current = true;
          setGameState('COMPLETED');
          setClickCount(data.click_count);
          setFinalResult(data);
          sounds.playVictoryChime();
        } else if (data.type === 'error') {
          setErrorMessage(data.detail || 'WebSocket error occurred');
          setGameState('ERROR');
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error', error);
      if (!completedRef.current) {
        setErrorMessage('Connection error. Please try again.');
        setGameState('ERROR');
      }
    };

    ws.onclose = (event) => {
      if (completedRef.current || event.code === 1000) {
        completedRef.current = true;
        setGameState('COMPLETED');
      } else {
        setGameState('DISCONNECTED');
      }
    };

    return () => {
      ws.close();
    };
  }, [gameId, token]);

  const sendClick = useCallback(() => {
    sounds.playClickSound();
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'click' }));
    }
  }, []);

  const finishGame = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'finish' }));
    }
  }, []);

  return {
    gameState,
    clickCount,
    secondsRemaining,
    errorMessage,
    finalResult,
    sendClick,
    finishGame,
  };
};
