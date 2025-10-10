/**
 * Socket.io Instance Helper
 * Fornisce accesso globale all'istanza di Socket.io
 */

import { Server } from 'socket.io';

let ioInstance: Server | null = null;

/**
 * Imposta l'istanza globale di Socket.io
 */
export function setIO(io: Server) {
  ioInstance = io;
}

/**
 * Ottiene l'istanza globale di Socket.io
 */
export function getIO(): Server | null {
  return ioInstance;
}

/**
 * Verifica se Socket.io è inizializzato
 */
export function isIOInitialized(): boolean {
  return ioInstance !== null;
}
