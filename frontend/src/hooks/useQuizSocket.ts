import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

export type SignalRStatus = 'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting';

export interface DifficultyUpdatedEvent {
  sessionId: number;
  newDifficulty: number;
  confidence: number;
  source: string;
  timestamp: string;
}

interface UseQuizSocketResult {
  signalRStatus: SignalRStatus;
  lastDifficultyEvent: DifficultyUpdatedEvent | null;
}

// Strip trailing /api if present so we get the backend base URL for SignalR
const _apiUrl: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5272';
const HUB_URL = _apiUrl.replace(/\/api\/?$/, '') + '/hubs/quiz';

export function useQuizSocket(
  sessionId: number | null,
  onDifficultyUpdated?: (event: DifficultyUpdatedEvent) => void
): UseQuizSocketResult {
  const [signalRStatus, setSignalRStatus] = useState<SignalRStatus>('Disconnected');
  const [lastDifficultyEvent, setLastDifficultyEvent] = useState<DifficultyUpdatedEvent | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const onUpdateRef = useRef(onDifficultyUpdated);
  onUpdateRef.current = onDifficultyUpdated;

  const connect = useCallback(async (sid: number) => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.onreconnecting(() => {
      console.log('[SignalR] Reconnecting...');
      setSignalRStatus('Reconnecting');
    });

    connection.onreconnected(() => {
      console.log('[SignalR] Reconnected');
      setSignalRStatus('Connected');
      connection.invoke('JoinSession', sid).catch(console.error);
    });

    connection.onclose(() => {
      console.log('[SignalR] Disconnected');
      setSignalRStatus('Disconnected');
    });

    connection.on('DifficultyUpdated', (event: DifficultyUpdatedEvent) => {
      console.log('[SignalR] DifficultyUpdated received:', event);
      setLastDifficultyEvent(event);
      onUpdateRef.current?.(event);
    });

    try {
      setSignalRStatus('Connecting');
      await connection.start();
      await connection.invoke('JoinSession', sid);
      setSignalRStatus('Connected');
      console.log(`[SignalR] Connected and joined session ${sid}`);
    } catch (err) {
      console.error('[SignalR] Connection failed:', err);
      setSignalRStatus('Disconnected');
    }

    connectionRef.current = connection;
  }, []);

  useEffect(() => {
    if (sessionId === null) return;

    connect(sessionId);

    return () => {
      connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, [sessionId, connect]);

  return { signalRStatus, lastDifficultyEvent };
}
