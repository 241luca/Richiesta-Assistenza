"use strict";
/**
 * Socket.io Instance Helper
 * Fornisce accesso globale all'istanza di Socket.io
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIO = setIO;
exports.getIO = getIO;
exports.isIOInitialized = isIOInitialized;
var ioInstance = null;
/**
 * Imposta l'istanza globale di Socket.io
 */
function setIO(io) {
    ioInstance = io;
}
/**
 * Ottiene l'istanza globale di Socket.io
 */
function getIO() {
    return ioInstance;
}
/**
 * Verifica se Socket.io è inizializzato
 */
function isIOInitialized() {
    return ioInstance !== null;
}
