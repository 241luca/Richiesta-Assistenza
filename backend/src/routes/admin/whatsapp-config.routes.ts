import express from 'express';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import logger from '../../utils/logger';
import { 
  getWhatsAppConfig, 
  saveWhatsAppConfig, 
  isWhatsAppConfigured 
} from '../../services/whatsapp-config.service';
import { initializeWhatsApp, getConnectionStatus } from '../../services/whatsapp.service';

const router = express.Router();

/**
 * GET /api/admin/whatsapp/config
 * Ottiene la configurazione WhatsApp corrente
 */
router.get('/config', 
  authenticate, 
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const config = await getWhatsAppConfig();
      const isConfigured = await isWhatsAppConfigured();
      
      // Restituisci configurazione completa (per admin)
      return res.json(ResponseFormatter.success({
        config: config,
        isConfigured,
        accessToken: config?.accessToken || null,
        instanceId: config?.instanceId || null
      }, 'Configurazione WhatsApp recuperata'));
    } catch (error) {
      logger.error('Errore recupero configurazione WhatsApp:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore recupero configurazione', 'CONFIG_ERROR')
      );
    }
  }
);

/**
 * POST /api/admin/whatsapp/config
 * Aggiorna la configurazione WhatsApp
 */
router.post('/config',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { 
        baseURL, 
        accessToken, 
        instanceId, 
        webhookUrl, 
        isActive 
      } = req.body;
      
      // Validazione base
      if (!accessToken) {
        return res.status(400).json(
          ResponseFormatter.error('Access Token richiesto', 'VALIDATION_ERROR')
        );
      }
      
      // Salva configurazione
      await saveWhatsAppConfig({
        baseURL: baseURL || 'https://app.sendapp.cloud/api',
        accessToken,
        instanceId,
        webhookUrl,
        isActive: isActive !== undefined ? isActive : true
      });
      
      // Se attivato, prova a inizializzare WhatsApp
      if (isActive) {
        try {
          await initializeWhatsApp();
          logger.info('WhatsApp inizializzato dopo aggiornamento configurazione');
        } catch (initError) {
          logger.warn('Impossibile inizializzare WhatsApp:', initError);
        }
      }
      
      return res.json(ResponseFormatter.success(
        null,
        'Configurazione WhatsApp aggiornata con successo'
      ));
    } catch (error) {
      logger.error('Errore aggiornamento configurazione WhatsApp:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore aggiornamento configurazione', 'UPDATE_ERROR')
      );
    }
  }
);

/**
 * POST /api/admin/whatsapp/test
 * Testa la connessione WhatsApp
 */
router.post('/test',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      // Verifica configurazione
      const isConfigured = await isWhatsAppConfigured();
      if (!isConfigured) {
        return res.status(400).json(
          ResponseFormatter.error('WhatsApp non configurato', 'NOT_CONFIGURED')
        );
      }
      
      // Inizializza e testa connessione
      await initializeWhatsApp();
      const status = await getConnectionStatus();
      
      return res.json(ResponseFormatter.success(
        { status },
        'Test connessione completato'
      ));
    } catch (error) {
      logger.error('Errore test connessione WhatsApp:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          'Test connessione fallito: ' + (error as Error).message,
          'TEST_ERROR'
        )
      );
    }
  }
);

/**
 * DELETE /api/admin/whatsapp/config
 * Disattiva la configurazione WhatsApp
 */
router.delete('/config',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res) => {
    try {
      // Disattiva configurazione
      await saveWhatsAppConfig({ isActive: false });
      
      logger.info('Configurazione WhatsApp disattivata');
      
      return res.json(ResponseFormatter.success(
        null,
        'Configurazione WhatsApp disattivata'
      ));
    } catch (error) {
      logger.error('Errore disattivazione WhatsApp:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore disattivazione', 'DELETE_ERROR')
      );
    }
  }
);

export default router;
