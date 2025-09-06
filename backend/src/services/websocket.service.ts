import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { initializeSocketServer } from '../websocket/socket.server';

// Re-export the initialization function with the old name for backward compatibility
export function initializeWebSocket(io: Server) {
  initializeSocketServer(io);
}

// Re-export helper functions from the new socket server
export { sendToUser as sendNotification, broadcastToOrganization, isUserOnline } from '../websocket/socket.server';
