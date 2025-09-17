/**
 * Servizio per gestire l'Instance ID di WhatsApp
 */

import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * Salva o aggiorna l'Instance ID di WhatsApp
 */
export async function saveWhatsAppInstanceId(instanceId: string): Promise<void> {
  try {
    logger.info(`💾 Salvataggio Instance ID WhatsApp: ${instanceId}`);
    
    await prisma.systemConfiguration.upsert({
      where: { key: 'whatsapp_instance_id' },
      update: {
        value: instanceId,
        updatedAt: new Date()
      },
      create: {
        key: 'whatsapp_instance_id',
        value: instanceId,
        description: 'WhatsApp Instance ID from SendApp'
      }
    });
    
    logger.info('✅ Instance ID salvato con successo');
  } catch (error) {
    logger.error('❌ Errore salvataggio Instance ID:', error);
    throw error;
  }
}

/**
 * Recupera l'Instance ID salvato
 */
export async function getWhatsAppInstanceId(): Promise<string | null> {
  try {
    const config = await prisma.systemConfiguration.findFirst({
      where: { key: 'whatsapp_instance_id' }
    });
    
    if (!config?.value) {
      logger.warn('⚠️ Instance ID non trovato nel database');
      return null;
    }
    
    return config.value;
  } catch (error) {
    logger.error('❌ Errore recupero Instance ID:', error);
    return null;
  }
}

/**
 * Rimuove l'Instance ID (quando si disconnette)
 */
export async function removeWhatsAppInstanceId(): Promise<void> {
  try {
    await prisma.systemConfiguration.deleteMany({
      where: { key: 'whatsapp_instance_id' }
    });
    
    logger.info('🗑️ Instance ID rimosso');
  } catch (error) {
    logger.error('❌ Errore rimozione Instance ID:', error);
  }
}

/**
 * Salva lo stato della connessione WhatsApp
 */
export async function saveWhatsAppConnectionStatus(isConnected: boolean, phoneNumber?: string): Promise<void> {
  try {
    // Salva stato connessione
    await prisma.systemConfiguration.upsert({
      where: { key: 'whatsapp_connected' },
      update: {
        value: isConnected.toString(),
        updatedAt: new Date()
      },
      create: {
        key: 'whatsapp_connected',
        value: isConnected.toString(),
        description: 'WhatsApp connection status'
      }
    });
    
    // Salva numero di telefono se fornito
    if (phoneNumber) {
      await prisma.systemConfiguration.upsert({
        where: { key: 'whatsapp_phone_number' },
        update: {
          value: phoneNumber,
          updatedAt: new Date()
        },
        create: {
          key: 'whatsapp_phone_number',
          value: phoneNumber,
          description: 'WhatsApp connected phone number'
        }
      });
    }
    
    logger.info(`📱 Stato WhatsApp aggiornato: ${isConnected ? 'Connesso' : 'Disconnesso'} ${phoneNumber || ''}`);
  } catch (error) {
    logger.error('❌ Errore salvataggio stato connessione:', error);
  }
}

export const whatsappInstanceService = {
  saveInstanceId: saveWhatsAppInstanceId,
  getInstanceId: getWhatsAppInstanceId,
  removeInstanceId: removeWhatsAppInstanceId,
  saveConnectionStatus: saveWhatsAppConnectionStatus
};