import { Router } from 'express';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

// Test endpoint per verificare i modelli Prisma disponibili
router.get('/prisma-models', async (req, res) => {
  try {
    // Lista tutti i modelli disponibili in Prisma
    const models = Object.keys(prisma).filter(key => 
      !key.startsWith('$') && 
      !key.startsWith('_') && 
      typeof (prisma as any)[key] === 'object'
    );
    
    logger.info('Available Prisma models:', models);
    
    // Verifica specificamente se scheduledIntervention esiste
    const hasScheduledIntervention = 'scheduledIntervention' in prisma;
    const hasScheduledInterventionCapital = 'ScheduledIntervention' in prisma;
    
    // Prova a fare una query di test se il modello esiste
    let testQuery = null;
    let errorMessage = null;
    
    try {
      // Prova con nome minuscolo
      if ((prisma as any).scheduledIntervention) {
        testQuery = await (prisma as any).scheduledIntervention.count();
      }
    } catch (e1: any) {
      errorMessage = e1.message;
      try {
        // Prova con nome maiuscolo
        if ((prisma as any).ScheduledIntervention) {
          testQuery = await (prisma as any).ScheduledIntervention.count();
        }
      } catch (e2: any) {
        errorMessage = `Lower: ${e1.message}, Upper: ${e2.message}`;
      }
    }
    
    return res.json(ResponseFormatter.success({
      availableModels: models,
      hasScheduledIntervention,
      hasScheduledInterventionCapital,
      testQueryResult: testQuery,
      errorMessage
    }, 'Prisma models check'));
    
  } catch (error: any) {
    logger.error('Error checking Prisma models:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to check Prisma models',
      'CHECK_ERROR',
      { error: error.message }
    ));
  }
});

// Test diretto della tabella scheduled_interventions
router.get('/test-scheduled-table', async (req, res) => {
  try {
    // Query diretta al database
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM scheduled_interventions
    `;
    
    return res.json(ResponseFormatter.success({
      tableExists: true,
      result
    }, 'Table check successful'));
    
  } catch (error: any) {
    logger.error('Error checking table:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Table check failed',
      'TABLE_ERROR',
      { error: error.message }
    ));
  }
});

export default router;
