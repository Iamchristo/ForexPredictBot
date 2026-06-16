'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { BotMessage } from '@/types';
import { tokenStorage } from '@/lib/auth';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketReturn {
  messages: BotMessage[];
  connectionStatus: ConnectionStatus;
  sendMessage: (data: object) => void;
  connect: (token?: string) => void;
  disconnect: () => void;
  clearMessages: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMessage = useCallback((msg: BotMessage) => {
    setMessages((prev) => [...prev, { ...msg, id: msg.id || Date.now().toString() + Math.random() }]);
  }, []);

  const connect = useCallback((token?: string) => {
    const t = token || tokenStorage.getToken();
    if (!t) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/ws/bot?token=${t}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage({ ...data, id: Date.now().toString() + Math.random() });
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        wsRef.current = null;
      };

      ws.onerror = () => {
        setConnectionStatus('error');
      };
    } catch (e) {
      setConnectionStatus('error');
    }
  }, [addMessage]);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { messages, connectionStatus, sendMessage, connect, disconnect, clearMessages };
}
