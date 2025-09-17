/**
 * WhatsApp Configuration Service
 * Gestisce la configurazione WhatsApp dal database invece che da .env
 */

import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface WhatsAppConfig {
  baseURL: string;
  accessToken: string;
  instanceId: string;
  webhookUrl: string;
  isActive: boolean;
}

/**
 * Ottiene la configurazione WhatsApp dal database
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  try {
    // Cerca la configurazione nel database
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });

    if (!apiKey || !apiKey.isActive) {
      logger.warn('Configurazione WhatsApp non trovata o non attiva');
      return null;
    }

    // Parse della configurazione dal campo permissions (JSON)
    const config = apiKey.permissions as any;
    
    return {
      baseURL: config?.baseURL || 'https://app.sendapp.cloud/api',
      accessToken: apiKey.key, // Il token è salvato nel campo key
      instanceId: config?.instanceId || '',
      webhookUrl: config?.webhookUrl || '',
      isActive: apiKey.isActive
    };
  } catch (error) {
    logger.error('Errore recupero configurazione WhatsApp:', error);
    return null;
  }
}

/**
 * Salva o aggiorna la configurazione WhatsApp nel database
 */
export async function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): Promise<void> {
  try {
    const existingKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });

    const configData = {
      baseURL: config.baseURL || 'https://app.sendapp.cloud/api',
      instanceId: config.instanceId || '',
      webhookUrl: config.webhookUrl || ''
    };

    if (existingKey) {
      // Aggiorna configurazione esistente
      await prisma.apiKey.update({
        where: { service: 'whatsapp' },
        data: {
          key: config.accessToken || existingKey.key,
          permissions: configData,
          isActive: config.isActive !== undefined ? config.isActive : existingKey.isActive,
          updatedAt: new Date()
        }
      });
      logger.info('Configurazione WhatsApp aggiornata');
    } else {
      // Crea nuova configurazione
      await prisma.apiKey.create({
        data: {
          id: `whatsapp_${Date.now()}`,
          key: config.accessToken || '',
          name: 'WhatsApp Integration (SendApp)',
          service: 'whatsapp',
          permissions: configData,
          isActive: config.isActive !== undefined ? config.isActive : true,
          rateLimit: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      logger.info('Configurazione WhatsApp creata');
    }
  } catch (error) {
    logger.error('Errore salvataggio configurazione WhatsApp:', error);
    throw error;
  }
}

/**
 * Verifica se la configurazione WhatsApp è valida
 */
export async function isWhatsAppConfigured(): Promise<boolean> {
  const config = await getWhatsAppConfig();
  return !!(config && config.accessToken && config.isActive);
}

/**
 * Migra la configurazione da .env al database (se necessario)
 */
export async function migrateWhatsAppConfigFromEnv(): Promise<void> {
  try {
    // Verifica se esiste già una configurazione nel DB
    const existingConfig = await getWhatsAppConfig();
    if (existingConfig) {
      logger.info('Configurazione WhatsApp già presente nel database');
      return;
    }

    // Leggi da .env
    const envConfig = {
      baseURL: process.env.SENDAPP_BASE_URL,
      accessToken: process.env.SENDAPP_ACCESS_TOKEN,
      instanceId: process.env.SENDAPP_INSTANCE_ID,
      webhookUrl: process.env.SENDAPP_WEBHOOK_URL
    };

    // Se c'è una configurazione in .env, migrala
    if (envConfig.accessToken) {
      await saveWhatsAppConfig({
        ...envConfig,
        isActive: true
      });
      logger.info('Configurazione WhatsApp migrata da .env al database');
    }
  } catch (error) {
    logger.error('Errore migrazione configurazione WhatsApp:', error);
  }
}
