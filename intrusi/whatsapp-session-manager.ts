/**
 * WhatsApp Session Manager
 * Gestisce salvataggio e recupero sessioni su multipli layer
 */

import { prisma } from '../config/database';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger';

// Import Redis se disponibile (opzionale)
let redis: any = null;
try {
  const redisModule = require('../config/redis');
  redis = redisModule.redis || redisModule.default;
} catch (error) {
  logger.warn('Redis non disponibile, sessioni solo su DB e file');
}

export class WhatsAppSessionManager {
  private sessionName: string;
  private encryptionKey: string;
  
  constructor(sessionName: string = 'assistenza-wpp') {
    this.sessionName = sessionName;
    // Chiave di crittografia dal .env o generata
    this.encryptionKey = process.env.SESSION_ENCRYPTION_KEY || 
                        this.generateEncryptionKey();
  }
  
  /**
   * Genera chiave di crittografia se non esiste
   */
  private generateEncryptionKey(): string {
    const key = crypto.randomBytes(32).toString('hex');
    logger.warn('⚠️ Usando chiave di crittografia generata. Aggiungi SESSION_ENCRYPTION_KEY al .env');
    return key;
  }
  
  /**
   * Cripta i dati della sessione
   */
  private encrypt(data: any): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      algorithm, 
      Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
      iv
    );
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }
  
  /**
   * Decripta i dati della sessione
   */
  private decrypt(encryptedData: string): any {
    try {
      const { encrypted, iv, authTag } = JSON.parse(encryptedData);
      const algorithm = 'aes-256-gcm';
      
      const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Errore decrittazione sessione:', error);
      return null;
    }
  }
  
  /**
   * Salva la sessione su tutti i layer
   */
  async saveSession(sessionData: any): Promise<boolean> {
    logger.info('💾 Salvataggio sessione WhatsApp su multipli layer...');
    
    const encrypted = this.encrypt(sessionData);
    const results = [];
    
    // 1. Salva su File
    try {
      const filePath = path.join(process.cwd(), 'tokens', this.sessionName, 'session.encrypted');
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, encrypted);
      logger.info('✅ Sessione salvata su file');
      results.push(true);
    } catch (error) {
      logger.error('❌ Errore salvataggio file:', error);
      results.push(false);
    }
    
    // 2. Salva su Database
    try {
      await prisma.whatsAppSession.upsert({
        where: { sessionName: this.sessionName },
        update: {
          sessionData: encrypted as any,
          isActive: true,
          lastConnected: new Date()
        },
        create: {
          sessionName: this.sessionName,
          sessionData: encrypted as any,
          isActive: true,
          lastConnected: new Date()
        }
      });
      logger.info('✅ Sessione salvata su database');
      results.push(true);
    } catch (error) {
      logger.error('❌ Errore salvataggio database:', error);
      results.push(false);
    }
    
    // 3. Salva su Redis (con TTL di 7 giorni) - Solo se disponibile
    if (redis) {
      try {
        await redis.setex(
          `whatsapp:session:${this.sessionName}`,
          7 * 24 * 60 * 60, // 7 giorni
          encrypted
        );
        logger.info('✅ Sessione salvata su Redis');
        results.push(true);
      } catch (error) {
        logger.error('❌ Errore salvataggio Redis:', error);
        results.push(false);
      }
    }
    
    // Successo se almeno uno ha funzionato
    const success = results.some(r => r === true);
    logger.info(`💾 Salvataggio completato: ${results.filter(r => r).length}/${results.length} layer riusciti`);
    
    return success;
  }
  
  /**
   * Recupera la sessione dal primo layer disponibile
   */
  async loadSession(): Promise<any> {
    logger.info('🔍 Recupero sessione WhatsApp...');
    
    // Prova in ordine: Redis -> Database -> File
    
    // 1. Prova Redis (più veloce) - Solo se disponibile
    if (redis) {
      try {
        const data = await redis.get(`whatsapp:session:${this.sessionName}`);
        if (data) {
          logger.info('✅ Sessione recuperata da Redis');
          const decrypted = this.decrypt(data);
          if (decrypted) return decrypted;
        }
      } catch (error) {
        logger.warn('⚠️ Redis non disponibile:', error);
      }
    }
    
    // 2. Prova Database
    try {
      const session = await prisma.whatsAppSession.findUnique({
        where: { 
          sessionName: this.sessionName,
          isActive: true
        }
      });
      
      if (session && session.sessionData) {
        logger.info('✅ Sessione recuperata da database');
        const decrypted = this.decrypt(JSON.stringify(session.sessionData));
        
        // Risalva su Redis per velocizzare (se disponibile)
        if (decrypted && redis) {
          redis.setex(
            `whatsapp:session:${this.sessionName}`,
            7 * 24 * 60 * 60,
            JSON.stringify(session.sessionData)
          ).catch((err: any) => logger.warn('Non riesco a salvare su Redis:', err));
        }
        
        if (decrypted) return decrypted;
      }
    } catch (error) {
      logger.error('❌ Errore recupero da database:', error);
    }
    
    // 3. Prova File
    try {
      const filePath = path.join(process.cwd(), 'tokens', this.sessionName, 'session.encrypted');
      const encrypted = await fs.readFile(filePath, 'utf8');
      const decrypted = this.decrypt(encrypted);
      
      if (decrypted) {
        logger.info('✅ Sessione recuperata da file');
        
        // Risalva su database e Redis
        this.saveSession(decrypted).catch(err => 
          logger.warn('Non riesco a propagare sessione:', err)
        );
        
        return decrypted;
      }
    } catch (error) {
      logger.warn('⚠️ Nessun file sessione trovato');
    }
    
    logger.warn('⚠️ Nessuna sessione trovata su nessun layer');
    return null;
  }
  
  /**
   * Elimina la sessione da tutti i layer
   */
  async deleteSession(): Promise<void> {
    logger.info('🗑️ Eliminazione sessione WhatsApp...');
    
    // Elimina da Redis (se disponibile)
    if (redis) {
      try {
        await redis.del(`whatsapp:session:${this.sessionName}`);
        logger.info('✅ Sessione eliminata da Redis');
      } catch (error) {
        logger.error('Errore eliminazione Redis:', error);
      }
    }
    
    // Elimina da Database (soft delete)
    try {
      await prisma.whatsAppSession.updateMany({
        where: { sessionName: this.sessionName },
        data: { isActive: false }
      });
      logger.info('✅ Sessione disattivata su database');
    } catch (error) {
      logger.error('Errore eliminazione database:', error);
    }
    
    // Elimina file
    try {
      const dirPath = path.join(process.cwd(), 'tokens', this.sessionName);
      await fs.rm(dirPath, { recursive: true, force: true });
      logger.info('✅ File sessione eliminati');
    } catch (error) {
      logger.error('Errore eliminazione file:', error);
    }
  }
  
  /**
   * Verifica se esiste una sessione valida
   */
  async hasValidSession(): Promise<boolean> {
    const session = await this.loadSession();
    return session !== null;
  }
  
  /**
   * Backup della sessione (per sicurezza extra)
   */
  async backupSession(): Promise<void> {
    const session = await this.loadSession();
    if (!session) return;
    
    const backupPath = path.join(
      process.cwd(), 
      'backups', 
      'whatsapp-sessions',
      `${this.sessionName}-${Date.now()}.backup`
    );
    
    try {
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, this.encrypt(session));
      logger.info(`✅ Backup sessione creato: ${backupPath}`);
    } catch (error) {
      logger.error('Errore backup sessione:', error);
    }
  }
}

// Export singleton
export const sessionManager = new WhatsAppSessionManager();
