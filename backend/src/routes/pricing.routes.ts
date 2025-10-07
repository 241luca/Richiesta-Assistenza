import { Router } from 'express';
import { z } from 'zod';
import { pricingService } from '../services/pricing.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';
import { AuditAction, LogCategory } from '@prisma/client';

const router = Router();

// Schema validazione per parametri
const categoryPricingSchema = z.object({
  categoryId: z.string().cuid('ID categoria non valido')
});

const estimateSchema = z.object({
  categoryId: z.string().cuid('ID categoria non valido'),
  subcategoryId: z.string().cuid().optional()
});

/**
 * GET /pricing/range/category/:categoryId
 * Ottiene il pricing completo per una categoria
 */
router.get('/range/category/:categoryId', 
  authenticate,
  auditLogger({ 
    action: AuditAction.READ, 
    category: LogCategory.BUSINESS,
    entityType: 'PricingCategory' 
  }),
  async (req, res) => {
    try {
      // Validazione parametri
      const { categoryId } = categoryPricingSchema.parse(req.params);
      
      console.log(`[PricingRoutes] Richiesta pricing categoria: ${categoryId} da utente: ${req.user?.id}`);

      const pricing = await pricingService.getCategoryPricing(categoryId);
      
      return res.json(ResponseFormatter.success(pricing, 'Pricing categoria recuperato con successo'));
      
    } catch (error) {
      console.error('[PricingRoutes] Errore recupero pricing categoria:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(
          ResponseFormatter.error('Parametri non validi', error.errors)
        );
      }
      
      return res.status(400).json(
        ResponseFormatter.error(error.message || 'Errore nel recupero del pricing')
      );
    }
  }
);

/**
 * GET /pricing/range/estimate
 * Ottiene una stima di prezzo per categoria/sottocategoria
 */
router.get('/range/estimate', 
  authenticate,
  auditLogger({ 
    action: AuditAction.READ, 
    category: LogCategory.BUSINESS,
    entityType: 'PricingEstimate' 
  }),
  async (req, res) => {
    try {
      // Validazione query parameters
      const { categoryId, subcategoryId } = estimateSchema.parse(req.query);
      
      console.log(`[PricingRoutes] Richiesta stima prezzo - categoria: ${categoryId}, sottocategoria: ${subcategoryId || 'nessuna'} da utente: ${req.user?.id}`);

      const range = await pricingService.getPriceRange(categoryId, subcategoryId);
      
      if (!range) {
        return res.json(ResponseFormatter.success(
          null, 
          'Non ci sono abbastanza dati per fornire una stima affidabile. Sono necessari almeno 5 preventivi accettati negli ultimi 6 mesi.'
        ));
      }

      return res.json(ResponseFormatter.success(range, 'Stima prezzo calcolata con successo'));
      
    } catch (error) {
      console.error('[PricingRoutes] Errore calcolo stima prezzo:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(
          ResponseFormatter.error('Parametri non validi', error.errors)
        );
      }
      
      return res.status(400).json(
        ResponseFormatter.error(error.message || 'Errore nel calcolo della stima')
      );
    }
  }
);

/**
 * GET /pricing/stats
 * Ottiene statistiche generali sui prezzi
 */
router.get('/stats', 
  authenticate,
  auditLogger({ 
    action: AuditAction.READ, 
    category: LogCategory.BUSINESS,
    entityType: 'PricingStats' 
  }),
  async (req, res) => {
    try {
      console.log(`[PricingRoutes] Richiesta statistiche pricing da utente: ${req.user?.id}`);

      const stats = await pricingService.getPricingStats();
      
      return res.json(ResponseFormatter.success(stats, 'Statistiche pricing recuperate con successo'));
      
    } catch (error) {
      console.error('[PricingRoutes] Errore recupero statistiche:', error);
      
      return res.status(500).json(
        ResponseFormatter.error('Errore interno nel recupero delle statistiche')
      );
    }
  }
);

/**
 * GET /pricing/health
 * Endpoint di test per verificare il funzionamento del servizio
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await pricingService.getPricingStats();
    
    return res.json(ResponseFormatter.success({
      status: 'ok',
      service: 'pricing',
      timestamp: new Date().toISOString(),
      dataAvailable: stats.totalQuotes > 0
    }, 'Servizio pricing operativo'));
    
  } catch (error) {
    return res.status(500).json(
      ResponseFormatter.error('Servizio pricing non disponibile')
    );
  }
});

/**
 * GET /pricing/test/estimate
 * ⚠️ ENDPOINT TEMPORANEO PER TEST - RIMUOVERE IN PRODUZIONE
 * Test della logica pricing senza autenticazione
 */
router.get('/test/estimate', async (req, res) => {
  try {
    console.log('[PricingRoutes] 🧪 Test endpoint chiamato - SOLO PER SVILUPPO');
    
    // Per test, usiamo parametri fissi o dalla query
    const categoryId = req.query.categoryId as string || 'test-category';
    const subcategoryId = req.query.subcategoryId as string;
    
    console.log(`[PricingRoutes] 🧪 Test con categoryId: ${categoryId}, subcategoryId: ${subcategoryId || 'nessuna'}`);
    
    const range = await pricingService.getPriceRange(categoryId, subcategoryId);
    
    if (!range) {
      return res.json(ResponseFormatter.success(
        null, 
        '🧪 TEST: Non ci sono abbastanza dati per questa categoria. Questo è normale se non ci sono preventivi nel DB.'
      ));
    }

    return res.json(ResponseFormatter.success({
      ...range,
      testNote: '🧪 Questo è un endpoint di test. In produzione richiederà autenticazione.'
    }, '🧪 TEST: Range prezzi calcolato con successo'));
    
  } catch (error) {
    console.error('[PricingRoutes] 🧪 Test endpoint errore:', error);
    
    return res.json(ResponseFormatter.error(
      `🧪 TEST ERROR: ${error.message}`,
      { error: error.toString(), stack: error.stack }
    ));
  }
});

/**
 * GET /pricing/test/stats  
 * ⚠️ ENDPOINT TEMPORANEO PER TEST - RIMUOVERE IN PRODUZIONE
 * Test delle statistiche senza autenticazione
 */
router.get('/test/stats', async (req, res) => {
  try {
    console.log('[PricingRoutes] 🧪 Test stats endpoint chiamato');
    
    const stats = await pricingService.getPricingStats();
    
    return res.json(ResponseFormatter.success({
      ...stats,
      testNote: '🧪 Questo è un endpoint di test. In produzione richiederà autenticazione.',
      dbInfo: {
        hasData: stats.totalQuotes > 0,
        quotesCount: stats.totalQuotes,
        dataStatus: stats.totalQuotes >= 5 ? 'Sufficient for pricing' : 'Insufficient for reliable pricing'
      }
    }, '🧪 TEST: Statistiche recuperate con successo'));
    
  } catch (error) {
    console.error('[PricingRoutes] 🧪 Test stats errore:', error);
    
    return res.json(ResponseFormatter.error(
      `🧪 TEST ERROR: ${error.message}`,
      { error: error.toString() }
    ));
  }
});

export default router;
