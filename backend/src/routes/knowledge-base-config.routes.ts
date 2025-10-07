import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { KnowledgeBaseConfigService } from '../services/knowledge-base-config.service';
import { z } from 'zod';

const router = Router();

// Schema di validazione
const configSchema = z.object({
  maxPerDocument: z.number().min(100).max(50000),
  maxTotalCharacters: z.number().min(500).max(100000),
  searchKeywordMinLength: z.number().min(1).max(10),
  contextBeforeKeyword: z.number().min(0).max(5000),
  contextAfterKeyword: z.number().min(0).max(5000),
  defaultChunkSize: z.number().min(100).max(10000),
  chunkOverlap: z.number().min(0).max(1000),
  enableSmartSearch: z.boolean(),
  enableAutoProcess: z.boolean(),
  includeFullDocument: z.boolean(),
  includeMetadata: z.boolean(),
  includeFileName: z.boolean(),
  customPromptPrefix: z.string().optional(),
  customPromptSuffix: z.string().optional(),
  cacheEnabled: z.boolean(),
  cacheTTL: z.number().min(0)
});

/**
 * GET /api/knowledge-base/config/:professionalId/:subcategoryId/:targetAudience
 * Ottieni configurazione
 */
router.get('/config/:professionalId/:subcategoryId/:targetAudience', 
  authenticate, 
  async (req: any, res) => {
    try {
      const { professionalId, subcategoryId, targetAudience } = req.params;
      
      // Valida targetAudience
      if (!['professional', 'client'].includes(targetAudience)) {
        return res.status(400).json(
          ResponseFormatter.error(
            'Target audience non valido',
            'INVALID_TARGET'
          )
        );
      }
      
      const config = await KnowledgeBaseConfigService.getConfig(
        professionalId,
        subcategoryId,
        targetAudience as 'professional' | 'client'
      );
      
      return res.json(ResponseFormatter.success(
        config,
        'Configurazione recuperata con successo'
      ));
    } catch (error) {
      logger.error('Error fetching KB config:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore nel recupero della configurazione',
          'FETCH_ERROR'
        )
      );
    }
  }
);

/**
 * POST /api/knowledge-base/config/:professionalId/:subcategoryId/:targetAudience
 * Salva/aggiorna configurazione
 */
router.post('/config/:professionalId/:subcategoryId/:targetAudience', 
  authenticate,
  async (req: any, res) => {
    try {
      const { professionalId, subcategoryId, targetAudience } = req.params;
      
      // Valida targetAudience
      if (!['professional', 'client'].includes(targetAudience)) {
        return res.status(400).json(
          ResponseFormatter.error(
            'Target audience non valido',
            'INVALID_TARGET'
          )
        );
      }
      
      // Valida i dati
      const validatedData = configSchema.parse(req.body);
      
      const config = await KnowledgeBaseConfigService.updateConfig(
        professionalId,
        subcategoryId,
        targetAudience as 'professional' | 'client',
        validatedData
      );
      
      logger.info(`KB config updated for ${professionalId}/${subcategoryId}/${targetAudience}`);
      
      return res.json(ResponseFormatter.success(
        config,
        'Configurazione salvata con successo'
      ));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(
          ResponseFormatter.error(
            'Dati non validi',
            'VALIDATION_ERROR',
            error.errors
          )
        );
      }
      
      logger.error('Error updating KB config:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore nel salvataggio della configurazione',
          'UPDATE_ERROR'
        )
      );
    }
  }
);

/**
 * DELETE /api/knowledge-base/config/:professionalId/:subcategoryId/:targetAudience
 * Reset configurazione ai default
 */
router.delete('/config/:professionalId/:subcategoryId/:targetAudience', 
  authenticate,
  async (req: any, res) => {
    try {
      const { professionalId, subcategoryId, targetAudience } = req.params;
      
      // Invalida la cache
      KnowledgeBaseConfigService.invalidateCache(
        professionalId,
        subcategoryId,
        targetAudience
      );
      
      // La prossima volta che viene richiesta, verrà creata con i default
      
      return res.json(ResponseFormatter.success(
        { reset: true },
        'Configurazione ripristinata ai valori di default'
      ));
    } catch (error) {
      logger.error('Error resetting KB config:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore nel reset della configurazione',
          'RESET_ERROR'
        )
      );
    }
  }
);

export default router;
