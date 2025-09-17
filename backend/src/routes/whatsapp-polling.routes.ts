/**
 * Route per il polling manuale e automatico dei messaggi
 * SENZA webhook esterni - Tutto sicuro nel tuo server
 */

import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { whatsappPolling } from '../services/whatsapp-polling.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/whatsapp/polling/start
 * Avvia il polling automatico (controlla ogni X secondi)
 */
router.post('/polling/start', async (req, res) => {
  try {
    const { interval = 30 } = req.body; // Default 30 secondi
    
    await whatsappPolling.start(interval);
    
    logger.info(`✅ Polling WhatsApp avviato (ogni ${interval} secondi)`);
    
    return res.json(ResponseFormatter.success({
      status: 'started',
      interval: interval,
      message: `Controllo messaggi ogni ${interval} secondi`
    }, 'Polling avviato'));
    
  } catch (error: any) {
    logger.error('Errore avvio polling:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore avvio polling', 'POLLING_START_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/polling/stop
 * Ferma il polling automatico
 */
router.post('/polling/stop', async (req, res) => {
  try {
    whatsappPolling.stop();
    
    logger.info('⏹️ Polling WhatsApp fermato');
    
    return res.json(ResponseFormatter.success({
      status: 'stopped'
    }, 'Polling fermato'));
    
  } catch (error: any) {
    logger.error('Errore stop polling:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore stop polling', 'POLLING_STOP_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/polling/check
 * Controlla SUBITO se ci sono nuovi messaggi (manuale)
 */
router.post('/polling/check', async (req, res) => {
  try {
    logger.info('🔍 Controllo manuale messaggi WhatsApp...');
    
    const result = await whatsappPolling.checkNow();
    
    return res.json(ResponseFormatter.success({
      checked: true,
      timestamp: new Date(),
      result: result
    }, 'Controllo eseguito'));
    
  } catch (error: any) {
    logger.error('Errore controllo messaggi:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore controllo messaggi', 'CHECK_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/polling/status
 * Stato del polling
 */
router.get('/polling/status', async (req, res) => {
  try {
    const status = whatsappPolling.getStatus();
    
    return res.json(ResponseFormatter.success(
      status,
      'Stato polling'
    ));
    
  } catch (error: any) {
    logger.error('Errore stato polling:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore stato polling', 'STATUS_ERROR')
    );
  }
});

export default router;