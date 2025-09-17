/**
 * useSocket Hook
 * Hook personalizzato per gestire la connessione WebSocket
 */

import { useContext, useEffect, useCallback, useState } from 'react';
import { useSocket as useSocketContext } from '../contexts/SocketContext';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
}

interface SocketStatus {
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectOnMount = true
  } = options;

  const context = useSocketContext();
  const [status, setStatus] = useState<SocketStatus>({
    isConnected: context.isConnected,
    connectionError: context.connectionError,
    reconnectAttempts: context.reconnectAttempts
  });

  // Aggiorna lo stato quando il contesto cambia
  useEffect(() => {
    setStatus({
      isConnected: context.isConnected,
      connectionError: context.connectionError,
      reconnectAttempts: context.reconnectAttempts
    });
  }, [context.isConnected, context.connectionError, context.reconnectAttempts]);

  // Wrapper per emit con logging
  const emit = useCallback((event: string, data?: any) => {
    console.log(`🔌 Emitting "${event}":`, data);
    context.emit(event, data);
  }, [context]);

  // Wrapper per on con logging
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    const wrappedCallback = (...args: any[]) => {
      console.log(`🔌 Received "${event}":`, args);
      callback(...args);
    };
    context.on(event, wrappedCallback);
    return () => context.off(event, wrappedCallback);
  }, [context]);

  // Wrapper per once (single event listener)
  const once = useCallback((event: string, callback: (...args: any[]) => void) => {
    const wrappedCallback = (...args: any[]) => {
      console.log(`🔌 Received once "${event}":`, args);
      callback(...args);
      context.off(event, wrappedCallback);
    };
    context.on(event, wrappedCallback);
    return () => context.off(event, wrappedCallback);
  }, [context]);

  // Funzione per inviare e attendere risposta
  const emitWithResponse = useCallback((event: string, data?: any, timeout: number = 5000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const responseEvent = `${event}:response`;
      const errorEvent = `${event}:error`;
      let timeoutId: NodeJS.Timeout;

      // Cleanup function
      const cleanup = () => {
        clearTimeout(timeoutId);
        context.off(responseEvent);
        context.off(errorEvent);
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for response to "${event}"`));
      }, timeout);

      // Listen for response
      context.on(responseEvent, (response: any) => {
        cleanup();
        resolve(response);
      });

      // Listen for error
      context.on(errorEvent, (error: any) => {
        cleanup();
        reject(error);
      });

      // Emit the event
      emit(event, data);
    });
  }, [context, emit]);

  // Funzione per sottoscriversi a un canale
  const subscribe = useCallback((channel: string) => {
    emit('subscribe', [channel]);
    console.log(`📡 Subscribed to channel: ${channel}`);
  }, [emit]);

  // Funzione per annullare la sottoscrizione
  const unsubscribe = useCallback((channel: string) => {
    emit('unsubscribe', [channel]);
    console.log(`📡 Unsubscribed from channel: ${channel}`);
  }, [emit]);

  // Funzione per inviare un ping e misurare la latenza
  const ping = useCallback((): Promise<number> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeoutId = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      once('pong', () => {
        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;
        console.log(`🏓 Ping latency: ${latency}ms`);
        resolve(latency);
      });

      emit('ping');
    });
  }, [emit, once]);

  return {
    // Stato connessione
    ...status,
    socket: context.socket,
    
    // Metodi base
    emit,
    on,
    off: context.off,
    once,
    
    // Metodi avanzati
    emitWithResponse,
    subscribe,
    unsubscribe,
    ping,
    
    // Utility
    isReady: context.isConnected && !context.connectionError
  };
};

// Hook per gestire eventi specifici
export const useSocketEvent = (
  event: string,
  handler: (...args: any[]) => void,
  deps: any[] = []
) => {
  const { on, off } = useSocketContext();

  useEffect(() => {
    on(event, handler);
    return () => off(event, handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
};

// Hook per gestire la sottoscrizione a canali
export const useSocketChannel = (channel: string, enabled: boolean = true) => {
  const { emit, isConnected } = useSocketContext();

  useEffect(() => {
    if (!isConnected || !enabled) return;

    // Subscribe to channel
    emit('subscribe', [channel]);
    console.log(`📡 Subscribed to channel: ${channel}`);

    // Cleanup: unsubscribe
    return () => {
      emit('unsubscribe', [channel]);
      console.log(`📡 Unsubscribed from channel: ${channel}`);
    };
  }, [channel, enabled, isConnected, emit]);
};

export default useSocket;
