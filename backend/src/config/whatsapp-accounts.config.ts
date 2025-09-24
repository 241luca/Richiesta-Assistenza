import { multiAccountService } from '../services/multi-account-whatsapp.service';
import logger from '../utils/logger';

/**
 * Configurazione Multi-Account WhatsApp
 * Inizializza tutti gli account necessari
 */
export async function initializeWhatsAppAccounts() {
  logger.info('🚀 Inizializzazione Multi-Account WhatsApp...');
  
  // Account 1: Assistenza Generale
  await multiAccountService.addAccount({
    sessionName: 'assistenza-generale',
    phoneNumber: '+393401234567',
    description: 'Numero principale assistenza clienti',
    department: 'support'
  });
  
  // Account 2: Supporto Tecnico
  await multiAccountService.addAccount({
    sessionName: 'supporto-tecnico',
    phoneNumber: '+393409876543',
    description: 'Supporto tecnico specializzato',
    department: 'technical'
  });
  
  // Account 3: Vendite
  await multiAccountService.addAccount({
    sessionName: 'vendite',
    phoneNumber: '+393405555555',
    description: 'Reparto commerciale e preventivi',
    department: 'sales'
  });
  
  // Account 4: Emergenze 24/7
  await multiAccountService.addAccount({
    sessionName: 'emergenze',
    phoneNumber: '+393407777777',
    description: 'Linea emergenze sempre attiva',
    department: 'emergency'
  });
  
  logger.info('✅ Multi-Account configurati. Scansiona i QR code per ogni numero.');
}

/**
 * Esempio: Invia messaggio da account specifico
 */
export async function sendFromSpecificAccount(
  accountName: string,
  recipient: string,
  message: string
) {
  try {
    await multiAccountService.sendMessage(accountName, recipient, message);
    logger.info(`✅ Messaggio inviato da ${accountName}`);
  } catch (error) {
    logger.error(`❌ Errore invio da ${accountName}:`, error);
  }
}

/**
 * Esempio: Broadcast a tutti gli account
 */
export async function broadcastToAllAccounts(recipient: string, message: string) {
  const accounts = multiAccountService.getAllAccountsStatus();
  
  for (const account of accounts) {
    if (account.isConnected) {
      try {
        await multiAccountService.sendMessage(
          account.sessionName, 
          recipient, 
          `[${account.description}] ${message}`
        );
      } catch (error) {
        logger.error(`Errore broadcast da ${account.sessionName}:`, error);
      }
    }
  }
}
