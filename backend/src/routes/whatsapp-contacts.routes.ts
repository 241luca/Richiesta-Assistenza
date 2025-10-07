import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/whatsapp/contacts - Ottieni tutti i contatti
 * VERSIONE SEMPLIFICATA - Ritorna array vuoto per ora
 */
router.get('/contacts', authenticate, async (req: any, res: Response) => {
  try {
    // Per ora ritorniamo un array vuoto o dati mock
    const mockContacts = [
      {
        id: '1',
        phoneNumber: '+393331234567',
        name: 'Mario Rossi',
        pushname: 'Mario',
        isMyContact: true,
        isUser: true,
        isBusiness: false,
        isBlocked: false,
        isFavorite: false,
        lastMessageAt: new Date(),
        user: null,
        professional: null
      },
      {
        id: '2',
        phoneNumber: '+393339876543',
        name: 'Luigi Verdi',
        pushname: 'Luigi',
        isMyContact: true,
        isUser: true,
        isBusiness: false,
        isBlocked: false,
        isFavorite: true,
        lastMessageAt: new Date(),
        user: null,
        professional: null
      }
    ];
    
    logger.info('📱 Returning mock contacts for now');
    return res.json(ResponseFormatter.success(mockContacts, 'Contatti recuperati (mock)'));
    
  } catch (error: any) {
    logger.error('Errore recupero contatti:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero contatti', 'FETCH_CONTACTS_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/contacts/:id - Ottieni dettagli contatto
 */
router.get('/contacts/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // Mock contact
    const mockContact = {
      id,
      phoneNumber: '+393331234567',
      name: 'Mario Rossi',
      pushname: 'Mario',
      isMyContact: true,
      isUser: true,
      isBusiness: false,
      isBlocked: false,
      isFavorite: false,
      lastMessageAt: new Date(),
      messages: [],
      user: null,
      professional: null
    };
    
    return res.json(ResponseFormatter.success(mockContact, 'Contatto recuperato'));
  } catch (error: any) {
    logger.error('Errore recupero contatto:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero contatto', 'FETCH_CONTACT_ERROR')
    );
  }
});

/**
 * PUT /api/whatsapp/contacts/:id - Aggiorna contatto
 */
router.put('/contacts/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Per ora ritorna solo successo
    logger.info(`📝 Mock update contact ${id}:`, updates);
    
    return res.json(ResponseFormatter.success({ id, ...updates }, 'Contatto aggiornato'));
  } catch (error: any) {
    logger.error('Errore aggiornamento contatto:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore aggiornamento contatto', 'UPDATE_CONTACT_ERROR')
    );
  }
});

/**
 * PUT /api/whatsapp/contacts/:id/link - Collega contatto a utente
 */
router.put('/contacts/:id/link', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, professionalId } = req.body;
    
    logger.info(`🔗 Mock link contact ${id} to user ${userId || professionalId}`);
    
    return res.json(ResponseFormatter.success(
      { id, userId, professionalId }, 
      'Contatto collegato con successo'
    ));
  } catch (error: any) {
    logger.error('Errore collegamento contatto:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore collegamento contatto', 'LINK_CONTACT_ERROR')
    );
  }
});

/**
 * DELETE /api/whatsapp/contacts/:id/link - Rimuovi collegamento
 */
router.delete('/contacts/:id/link', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    logger.info(`✂️ Mock unlink contact ${id}`);
    
    return res.json(ResponseFormatter.success({ id }, 'Collegamento rimosso'));
  } catch (error: any) {
    logger.error('Errore rimozione collegamento:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore rimozione collegamento', 'UNLINK_CONTACT_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/contacts/sync - Sincronizza contatti
 */
router.post('/contacts/sync', authenticate, async (req: any, res: Response) => {
  try {
    logger.info('🔄 Mock sync contacts');
    
    return res.json(ResponseFormatter.success(
      { linked: 0, total: 0 },
      `Sincronizzazione completata (mock)`
    ));
  } catch (error: any) {
    logger.error('Errore sincronizzazione contatti:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore sincronizzazione contatti', 'SYNC_CONTACTS_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/contacts/stats - Statistiche contatti
 */
router.get('/contacts/stats/summary', authenticate, async (req: any, res: Response) => {
  try {
    const stats = {
      total: 2,
      linked: 0,
      unlinked: 2,
      business: 0,
      favorites: 1,
      blocked: 0
    };
    
    return res.json(ResponseFormatter.success(stats, 'Statistiche contatti (mock)'));
  } catch (error: any) {
    logger.error('Errore recupero statistiche:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero statistiche', 'STATS_ERROR')
    );
  }
});

export default router;