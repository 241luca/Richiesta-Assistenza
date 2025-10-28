import { Router, Request, Response } from 'express';
import { ContainerInstanceService } from '../services/ContainerInstanceService';
import { logger } from '../utils/logger';
import { ContainerService } from '../services/ContainerService';

const router = Router();
const instanceService = new ContainerInstanceService();

/**
 * POST /api/container-instances
 * Crea nuova istanza container
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    logger.info('[ContainerInstances] Received create request:', {
      template_code: data.template_code,
      owner_id: data.owner_id,
      owner_type: data.owner_type,
      name: data.name
    });

    // Validazione base
    if (!data.template_code || !data.name || !data.owner_id || !data.owner_type) {
      logger.warn('[ContainerInstances] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: template_code, name, owner_id, owner_type'
      });
    }

    // Validazione owner_type
    if (!['PROFESSIONAL', 'CLIENT', 'ADMIN'].includes(data.owner_type)) {
      logger.warn('[ContainerInstances] Invalid owner_type:', data.owner_type);
      return res.status(400).json({
        success: false,
        error: 'Invalid owner_type. Must be PROFESSIONAL, CLIENT, or ADMIN'
      });
    }

    const instance = await instanceService.create(data);

    logger.info('[ContainerInstances] Instance created successfully:', instance.id);
    res.status(201).json({
      success: true,
      data: instance
    });
  } catch (error: any) {
    logger.error('[ContainerInstances] Error creating instance:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create instance'
    });
  }
});

/**
 * GET /api/container-instances
 * Lista istanze con filtri
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('[ContainerInstances] GET / called with query:', req.query);
    const options = {
      owner_id: req.query.owner_id as string | undefined, // Changed: removed parseInt to support UUID
      owner_type: req.query.owner_type as 'PROFESSIONAL' | 'CLIENT' | 'ADMIN' | undefined,
      template_code: req.query.template_code as string | undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    logger.info('[ContainerInstances] Calling instanceService.list with options:', options);
    const instances = await instanceService.list(options);

    logger.info('[ContainerInstances] Found instances:', instances.length);
    res.json({
      success: true,
      data: instances,
      count: instances.length
    });
  } catch (error: any) {
    logger.error('[ContainerInstances] Error listing instances:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list instances'
    });
  }
});

/**
 * GET /api/container-instances/:id
 * Ottieni istanza per ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const instance = await instanceService.getById(id);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error: any) {
    logger.error('Error getting instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get instance'
    });
  }
});

/**
 * PUT /api/container-instances/:id
 * Aggiorna istanza
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const instance = await instanceService.update(id, updates);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error: any) {
    logger.error('Error updating instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update instance'
    });
  }
});

/**
 * DELETE /api/container-instances/:id
 * Elimina istanza
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await instanceService.delete(id);

    res.json({
      success: true,
      message: 'Instance deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete instance'
    });
  }
});

/**
 * GET /api/container-instances/:id/stats
 * Statistiche istanza
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stats = await instanceService.getStats(id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting instance stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats'
    });
  }
});

/**
 * POST /api/container-instances/:id/verify-ownership
 * Verifica ownership
 */
router.post('/:id/verify-ownership', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, user_type } = req.body;

    if (!user_id || !user_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id or user_type'
      });
    }

    const isOwner = await instanceService.verifyOwnership(id, user_id, user_type);

    res.json({
      success: true,
      data: { is_owner: isOwner }
    });
  } catch (error: any) {
    logger.error('Error verifying ownership:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify ownership'
    });
  }
});

export default router;

/**
 * DELETE /api/container-instances/:id/documents
 * Svuota tutti i documenti associati all'istanza (chunk, embeddings, KG inclusi)
 */
router.delete('/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Usa il ContainerService che gestisce correttamente la rimozione di
    // documenti, embeddings, chunk metadata/relationships e knowledge graph
    const containerService = new ContainerService();
    const result = await containerService.clearContainerDocuments(id);

    logger.info('[ContainerInstances] Instance documents cleared', { instanceId: id, deleted: result.deletedCount });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('[ContainerInstances] Error clearing instance documents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear instance documents'
    });
  }
});
