/**
 * markdown.routes.ts
 * 
 * API routes per la gestione dei documenti Markdown
 * - Storage e retrieval Markdown
 * - Gestione Docling chunks
 * - Statistiche e metriche
 */

import { Router, Request, Response } from 'express';
import { MarkdownStorageService } from '../services/MarkdownStorageService';
import { logger } from '../utils/logger';

const router = Router();
const markdownService = new MarkdownStorageService();

/**
 * GET /api/markdown/document/:documentId
 * Recupera documento Markdown per document ID
 */
router.get('/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    const mdDoc = await markdownService.getMarkdownByDocumentId(documentId);
    
    if (!mdDoc) {
      return res.status(404).json({
        success: false,
        error: 'Markdown document not found'
      });
    }
    
    res.json({
      success: true,
      data: mdDoc
    });
    
  } catch (error: any) {
    logger.error('[MarkdownRoutes] Error retrieving markdown:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/markdown/chunks/:documentId
 * Recupera Docling chunks per document ID
 */
router.get('/chunks/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    const chunks = await markdownService.getDoclingChunks(documentId);
    
    res.json({
      success: true,
      data: {
        documentId,
        totalChunks: chunks.length,
        chunks
      }
    });
    
  } catch (error: any) {
    logger.error('[MarkdownRoutes] Error retrieving chunks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/markdown/stats/:containerId?
 * Statistiche documenti Markdown
 */
router.get('/stats/:containerId?', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    
    const stats = await markdownService.getStatistics(containerId);
    
    res.json({
      success: true,
      data: {
        containerId: containerId || 'all',
        statistics: stats
      }
    });
    
  } catch (error: any) {
    logger.error('[MarkdownRoutes] Error retrieving stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/markdown/document/:documentId
 * Elimina documento Markdown e chunks associati
 */
router.delete('/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    await markdownService.deleteMarkdown(documentId);
    
    res.json({
      success: true,
      message: 'Markdown document deleted successfully'
    });
    
  } catch (error: any) {
    logger.error('[MarkdownRoutes] Error deleting markdown:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
