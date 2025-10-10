/**
 * WhatsApp Media Service - VERSIONE CORRETTA
 * Gestione completa invio e ricezione media (immagini, documenti, audio, location)
 * FASE 2 - Funzionalità Complete: Gestione Media
 * Usa il sistema di notifiche e audit log esistente
 */

import { wppConnectService } from './wppconnect.service';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import { whatsAppValidation } from './whatsapp-validation.service';
import { whatsAppErrorHandler, WhatsAppErrorType } from './whatsapp-error-handler.service';
import { NotificationService } from './notification.service'; // Sistema notifiche esistente
import { auditService } from './auditLog.service'; // Sistema audit esistente
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const notificationService = new NotificationService();

export interface MediaMessage {
  id?: string;
  to: string;
  filePath: string;
  caption?: string;
  filename?: string;
  mimeType?: string;
}

export interface LocationMessage {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface MediaOptions {
  compress?: boolean;
  maxSize?: number;
  quality?: number;
}

export class WhatsAppMediaService {
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'whatsapp');
  private readonly MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ];
  private readonly ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/opus'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/quicktime', 'video/3gpp'];
  
  constructor() {
    this.ensureUploadDirectory();
  }
  
  /**
   * Crea directory upload se non esiste
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      logger.info(`📁 Directory upload creata/verificata: ${this.UPLOAD_DIR}`);
    } catch (error) {
      logger.error('Errore creazione directory upload:', error);
    }
  }
  
  /**
   * Ottieni client WPPConnect
   */
  private async getWppClient(): Promise<any> {
    const status = await wppConnectService.getConnectionStatus();
    if (!status.connected) {
      throw new Error('WhatsApp non connesso. Scansiona il QR Code prima.');
    }
    return (wppConnectService as any).client;
  }
  
  /**
   * Verifica che un file esista
   */
  private async verifyFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`File non trovato: ${filePath}`);
    }
  }
  
  /**
   * Ottieni dimensione file
   */
  private async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }
  
  /**
   * Determina MIME type
   */
  private async getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.opus': 'audio/opus',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.3gp': 'video/3gpp'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * Comprimi immagine
   */
  private async compressImage(imagePath: string, options: MediaOptions = {}): Promise<string> {
    try {
      const quality = options.quality || 80;
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      const outputPath = path.join(
        this.UPLOAD_DIR,
        `compressed_${Date.now()}_${path.basename(imagePath)}`
      );
      
      await sharp(imagePath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toFile(outputPath);
      
      logger.info(`✅ Immagine compressa: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      logger.error('Errore compressione immagine:', error);
      return imagePath; // Ritorna originale se fallisce
    }
  }
  
  /**
   * Salva messaggio media nel database
   */
  private async saveMediaMessage(data: any): Promise<void> {
    try {
      await prisma.whatsAppMessage.create({
        data: {
          messageId: data.messageId,
          phoneNumber: data.phoneNumber,
          message: data.caption || '',
          direction: data.direction,
          status: data.status,
          timestamp: new Date(),
          type: data.type,
          isMedia: true,
          mediaPath: data.mediaPath,
          mediaUrl: data.mediaUrl,
          caption: data.caption,
          filename: data.filename,
          mimetype: data.mimeType,
          mediaSize: data.mediaSize,
          fromMe: data.direction === 'outgoing',
          latitude: data.latitude,
          longitude: data.longitude,
          locationName: data.locationName,
          locationAddress: data.locationAddress
        }
      });
      
      // Log nell'audit
      await auditService.log({
        action: `WHATSAPP_MEDIA_${data.type.toUpperCase()}_SENT`,
        entityType: 'WhatsAppMessage',
        entityId: data.messageId,
        userId: null, // Sistema
        metadata: {
          to: data.phoneNumber,
          type: data.type,
          filename: data.filename,
          size: data.mediaSize
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
    } catch (error) {
      logger.error('Errore salvataggio messaggio media:', error);
    }
  }
  
  /**
   * Invia un'immagine
   */
  async sendImage(
    to: string, 
    imagePath: string, 
    caption?: string,
    options: MediaOptions = {}
  ): Promise<any> {
    try {
      logger.info(`📸 Invio immagine a ${to}`);
      
      // 1. Valida numero destinatario
      const validatedNumber = await whatsAppValidation.validatePhoneNumber(to);
      if (!validatedNumber.isValid) {
        throw new Error(`Numero non valido: ${validatedNumber.error}`);
      }
      
      // 2. Verifica che il file esista
      await this.verifyFileExists(imagePath);
      
      // 3. Valida tipo file
      const mimeType = await this.getMimeType(imagePath);
      if (!this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        throw new Error(`Tipo immagine non supportato: ${mimeType}`);
      }
      
      // 4. Verifica dimensione
      let fileSize = await this.getFileSize(imagePath);
      if (fileSize > this.MAX_FILE_SIZE) {
        logger.warn(`⚠️ Immagine troppo grande (${fileSize} bytes), comprimo...`);
        imagePath = await this.compressImage(imagePath, options);
        fileSize = await this.getFileSize(imagePath);
      }
      
      // 5. Comprimi se richiesto
      if (options.compress && !imagePath.includes('compressed_')) {
        imagePath = await this.compressImage(imagePath, options);
        fileSize = await this.getFileSize(imagePath);
      }
      
      // 6. Prepara filename
      const filename = path.basename(imagePath);
      
      // 7. Ottieni client WPPConnect
      const client = await this.getWppClient();
      
      // 8. Invia immagine
      const chatId = validatedNumber.formatted + '@c.us';
      const result = await client.sendImage(
        chatId,
        imagePath,
        filename,
        caption || ''
      );
      
      logger.info(`✅ Immagine inviata con successo a ${to}`);
      
      // 9. Salva nel database
      await this.saveMediaMessage({
        messageId: result?.id || `msg_${Date.now()}`,
        phoneNumber: validatedNumber.formatted,
        type: 'image',
        mediaPath: imagePath,
        caption: caption,
        filename: filename,
        mimeType: mimeType,
        mediaSize: fileSize,
        direction: 'outgoing',
        status: 'SENT'
      });
      
      return {
        success: true,
        messageId: result?.id,
        to: validatedNumber.formatted,
        filename: filename,
        size: fileSize
      };
      
    } catch (error: any) {
      logger.error(`❌ Errore invio immagine:`, error);
      const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendImage');
      throw whatsAppError;
    }
  }
  
  /**
   * Invia un documento
   */
  async sendDocument(
    to: string, 
    docPath: string, 
    filename?: string,
    caption?: string
  ): Promise<any> {
    try {
      logger.info(`📄 Invio documento a ${to}`);
      
      // Valida numero
      const validatedNumber = await whatsAppValidation.validatePhoneNumber(to);
      if (!validatedNumber.isValid) {
        throw new Error(`Numero non valido: ${validatedNumber.error}`);
      }
      
      // Verifica file
      await this.verifyFileExists(docPath);
      
      // Valida tipo
      const mimeType = await this.getMimeType(docPath);
      if (!this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
        throw new Error(`Tipo documento non supportato: ${mimeType}`);
      }
      
      // Verifica dimensione
      const fileSize = await this.getFileSize(docPath);
      if (fileSize > this.MAX_FILE_SIZE) {
        throw new Error(`Documento troppo grande: ${fileSize} bytes (max: ${this.MAX_FILE_SIZE})`);
      }
      
      // Ottieni client
      const client = await this.getWppClient();
      
      // Invia documento
      const chatId = validatedNumber.formatted + '@c.us';
      const docFilename = filename || path.basename(docPath);
      
      const result = await client.sendFile(
        chatId,
        docPath,
        docFilename,
        caption || ''
      );
      
      logger.info(`✅ Documento inviato con successo a ${to}`);
      
      // Salva nel database
      await this.saveMediaMessage({
        messageId: result?.id || `msg_${Date.now()}`,
        phoneNumber: validatedNumber.formatted,
        type: 'document',
        mediaPath: docPath,
        caption: caption,
        filename: docFilename,
        mimeType: mimeType,
        mediaSize: fileSize,
        direction: 'outgoing',
        status: 'SENT'
      });
      
      return {
        success: true,
        messageId: result?.id,
        to: validatedNumber.formatted,
        filename: docFilename,
        size: fileSize
      };
      
    } catch (error: any) {
      logger.error(`❌ Errore invio documento:`, error);
      const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendDocument');
      throw whatsAppError;
    }
  }
  
  /**
   * Invia un audio/nota vocale
   */
  async sendAudio(
    to: string, 
    audioPath: string,
    isVoiceNote: boolean = false
  ): Promise<any> {
    try {
      logger.info(`🎵 Invio ${isVoiceNote ? 'nota vocale' : 'audio'} a ${to}`);
      
      const validatedNumber = await whatsAppValidation.validatePhoneNumber(to);
      if (!validatedNumber.isValid) {
        throw new Error(`Numero non valido: ${validatedNumber.error}`);
      }
      
      await this.verifyFileExists(audioPath);
      
      const mimeType = await this.getMimeType(audioPath);
      if (!this.ALLOWED_AUDIO_TYPES.includes(mimeType)) {
        throw new Error(`Tipo audio non supportato: ${mimeType}`);
      }
      
      const fileSize = await this.getFileSize(audioPath);
      if (fileSize > this.MAX_FILE_SIZE) {
        throw new Error(`Audio troppo grande: ${fileSize} bytes`);
      }
      
      const client = await this.getWppClient();
      const chatId = validatedNumber.formatted + '@c.us';
      
      // WPPConnect distingue tra audio e voice note
      const result = isVoiceNote 
        ? await client.sendVoiceMessage(chatId, audioPath)
        : await client.sendFile(chatId, audioPath, 'audio.mp3', '');
      
      logger.info(`✅ Audio inviato con successo a ${to}`);
      
      await this.saveMediaMessage({
        messageId: result?.id || `msg_${Date.now()}`,
        phoneNumber: validatedNumber.formatted,
        type: isVoiceNote ? 'ptt' : 'audio', // ptt = push to talk (voice note)
        mediaPath: audioPath,
        filename: path.basename(audioPath),
        mimeType: mimeType,
        mediaSize: fileSize,
        direction: 'outgoing',
        status: 'SENT'
      });
      
      return {
        success: true,
        messageId: result?.id,
        to: validatedNumber.formatted,
        type: isVoiceNote ? 'voice_note' : 'audio',
        size: fileSize
      };
      
    } catch (error: any) {
      logger.error(`❌ Errore invio audio:`, error);
      const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendAudio');
      throw whatsAppError;
    }
  }
  
  /**
   * Invia una posizione
   */
  async sendLocation(location: LocationMessage): Promise<any> {
    try {
      logger.info(`📍 Invio posizione a ${location.to}`);
      
      const validatedNumber = await whatsAppValidation.validatePhoneNumber(location.to);
      if (!validatedNumber.isValid) {
        throw new Error(`Numero non valido: ${validatedNumber.error}`);
      }
      
      // Valida coordinate
      if (location.latitude < -90 || location.latitude > 90) {
        throw new Error('Latitudine non valida');
      }
      if (location.longitude < -180 || location.longitude > 180) {
        throw new Error('Longitudine non valida');
      }
      
      const client = await this.getWppClient();
      const chatId = validatedNumber.formatted + '@c.us';
      
      const result = await client.sendLocation(
        chatId,
        location.latitude.toString(),
        location.longitude.toString(),
        location.name || 'Posizione'
      );
      
      logger.info(`✅ Posizione inviata con successo a ${location.to}`);
      
      await this.saveMediaMessage({
        messageId: result?.id || `msg_${Date.now()}`,
        phoneNumber: validatedNumber.formatted,
        type: 'location',
        direction: 'outgoing',
        status: 'SENT',
        latitude: location.latitude,
        longitude: location.longitude,
        locationName: location.name,
        locationAddress: location.address
      });
      
      return {
        success: true,
        messageId: result?.id,
        to: validatedNumber.formatted,
        location: {
          lat: location.latitude,
          lng: location.longitude,
          name: location.name
        }
      };
      
    } catch (error: any) {
      logger.error(`❌ Errore invio posizione:`, error);
      const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendLocation');
      throw whatsAppError;
    }
  }
  
  /**
   * Invia un video
   */
  async sendVideo(
    to: string,
    videoPath: string,
    caption?: string
  ): Promise<any> {
    try {
      logger.info(`🎬 Invio video a ${to}`);
      
      const validatedNumber = await whatsAppValidation.validatePhoneNumber(to);
      if (!validatedNumber.isValid) {
        throw new Error(`Numero non valido: ${validatedNumber.error}`);
      }
      
      await this.verifyFileExists(videoPath);
      
      const mimeType = await this.getMimeType(videoPath);
      if (!this.ALLOWED_VIDEO_TYPES.includes(mimeType)) {
        throw new Error(`Tipo video non supportato: ${mimeType}`);
      }
      
      const fileSize = await this.getFileSize(videoPath);
      if (fileSize > this.MAX_FILE_SIZE) {
        throw new Error(`Video troppo grande: ${fileSize} bytes (max: ${this.MAX_FILE_SIZE})`);
      }
      
      const client = await this.getWppClient();
      const chatId = validatedNumber.formatted + '@c.us';
      const filename = path.basename(videoPath);
      
      const result = await client.sendFile(
        chatId,
        videoPath,
        filename,
        caption || ''
      );
      
      logger.info(`✅ Video inviato con successo a ${to}`);
      
      await this.saveMediaMessage({
        messageId: result?.id || `msg_${Date.now()}`,
        phoneNumber: validatedNumber.formatted,
        type: 'video',
        mediaPath: videoPath,
        caption: caption,
        filename: filename,
        mimeType: mimeType,
        mediaSize: fileSize,
        direction: 'outgoing',
        status: 'SENT'
      });
      
      return {
        success: true,
        messageId: result?.id,
        to: validatedNumber.formatted,
        filename: filename,
        size: fileSize
      };
      
    } catch (error: any) {
      logger.error(`❌ Errore invio video:`, error);
      const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendVideo');
      throw whatsAppError;
    }
  }
  
  /**
   * Scarica media da un messaggio ricevuto
   */
  async downloadMedia(messageId: string): Promise<string> {
    try {
      logger.info(`📥 Download media da messaggio ${messageId}`);
      
      const message = await prisma.whatsAppMessage.findUnique({
        where: { messageId }
      });
      
      if (!message || !message.isMedia) {
        throw new Error('Messaggio non trovato o non contiene media');
      }
      
      const client = await this.getWppClient();
      
      // Download del media
      const media = await client.downloadMedia(messageId);
      
      if (!media) {
        throw new Error('Impossibile scaricare il media');
      }
      
      // Salva su disco
      const filename = `${Date.now()}_${message.filename || 'media'}`;
      const filePath = path.join(this.UPLOAD_DIR, filename);
      
      await fs.writeFile(filePath, media, 'base64');
      
      // Aggiorna database con path locale
      await prisma.whatsAppMessage.update({
        where: { id: message.id },
        data: { mediaPath: filePath }
      });
      
      logger.info(`✅ Media scaricato: ${filePath}`);
      
      // Audit log
      await auditService.log({
        action: 'WHATSAPP_MEDIA_DOWNLOADED',
        entityType: 'WhatsAppMessage',
        entityId: messageId,
        metadata: { filePath, type: message.type },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
      return filePath;
      
    } catch (error: any) {
      logger.error(`❌ Errore download media:`, error);
      throw error;
    }
  }
}

// Singleton
export const whatsAppMediaService = new WhatsAppMediaService();
