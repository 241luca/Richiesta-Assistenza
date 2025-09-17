/**
 * Socket Context Provider
 * Gestisce la connessione WebSocket e fornisce accesso globale al socket
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,
  emit: () => {},
  on: () => {},
  off: () => {}
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Inizializza la connessione socket
  useEffect(() => {
    // Get token from localStorage inside useEffect
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    console.log('🔍 WebSocket init check:', {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!token,
      tokenLength: token?.length
    });
    
    if (!isAuthenticated || !user || !token) {
      // Disconnetti se non autenticato
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket - user logged out or no token');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Crea nuova connessione
    console.log('🔌 Initializing WebSocket connection with token...');
    
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3200', {
      transports: ['websocket', 'polling'],
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Event handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
      
      // Mostra toast solo se era disconnesso prima
      if (reconnectAttempts > 0) {
        toast.success('Connessione ristabilita');
      }
    });

    newSocket.on('connected', (data) => {
      console.log('🔐 Authenticated:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server ha disconnesso intenzionalmente
        setConnectionError('Disconnesso dal server');
        toast.error('Disconnesso dal server');
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Problemi di rete
        setConnectionError('Problemi di connessione');
        toast.error('Connessione persa. Tentativo di riconnessione...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      setConnectionError(error.message);
      
      if (error.message === 'Authentication failed' || error.message === 'Authentication token missing') {
        toast.error('Errore di autenticazione WebSocket');
        // Non tentare riconnessione per errori di auth
        newSocket.disconnect();
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      setReconnectAttempts(attemptNumber);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔴 Reconnection failed');
      setConnectionError('Impossibile riconnettersi');
      toast.error('Impossibile ristabilire la connessione');
    });

    newSocket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
      toast.error(`Errore WebSocket: ${error.message || 'Errore sconosciuto'}`);
    });

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up socket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.removeAllListeners();
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, isAuthenticated, reconnectAttempts]);

  // Wrapper per emit con controllo connessione
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current) {
      console.warn(`Cannot emit "${event}" - socket not initialized`);
      return;
    }
    if (!isConnected) {
      console.warn(`Cannot emit "${event}" - socket not connected`);
      toast.error('Non connesso al server');
      return;
    }
    socketRef.current.emit(event, data);
  }, [isConnected]);

  // Wrapper per on con controllo socket
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn(`Cannot listen to "${event}" - socket not initialized`);
      return;
    }
    socketRef.current.on(event, callback);
  }, []);

  // Wrapper per off con controllo socket
  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (!socketRef.current) {
      return;
    }
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  }, []);

  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    connectionError,
    reconnectAttempts,
    emit,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
