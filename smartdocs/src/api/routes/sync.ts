import { Router, Request, Response } from 'express';
import multer from 'multer';
import { StructuredDataIngestionService } from '../../services/StructuredDataIngestionService';
import { DatabaseClient } from '../../database/client';
import { logger } from '../../utils/logger';

const router = Router();
const ingestionService = new StructuredDataIngestionService();
const db = DatabaseClient.getInstance();

// 🔥 Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const os = require('os');
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = file.originalname.split('.').pop();
    cb(null, `upload-${uniqueSuffix}.${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/sync/ingest
 * Ingest structured data from external applications
 * ENTERPRISE ENDPOINT - Multi-tenant ready
 * 🔥 UPDATED: Now supports BOTH JSON and FormData (file uploads)
 */
router.post('/ingest', upload.single('file'), async (req: Request, res: Response) => {
  const startTime = Date.now();
  const isFileUpload = !!req.file;
  
  try {
    let container_id, source_app, source_type, entity_type, entity_id, title, content, metadata, auto_update, chunk_size, chunk_overlap, use_markdown, ocr_engine, chunking_method;
    
    // 🔥 Parse data based on request type
    if (isFileUpload) {
      // 📎 File upload via FormData
      logger.info(`[SyncAPI] 📄 File upload detected: ${req.file!.originalname} (${req.file!.size} bytes)`);
      
      container_id = req.body.container_id;
      source_app = req.body.source_app;
      source_type = req.body.source_type || 'auto_sync';
      entity_type = req.body.entity_type;
      entity_id = req.body.entity_id;
      title = req.body.title || req.file!.originalname;
      content = ''; // Will be extracted by OCR
      metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
      auto_update = req.body.auto_update !== 'false';
      chunk_size = req.body.chunk_size;
      chunk_overlap = req.body.chunk_overlap;
      use_markdown = req.body.use_markdown === 'true'; // Always true for file uploads
      ocr_engine = req.body.ocr_engine || 'auto';
      chunking_method = req.body.chunking_method || 'semantic';
      
      // ✅ Add uploaded file info to metadata
      metadata.uploaded_file = {
        original_name: req.file!.originalname,
        size: req.file!.size,
        mime_type: req.file!.mimetype,
        uploaded_at: new Date().toISOString()
      };
    } else {
      // 📝 JSON request (original format)
      const body = req.body;
      container_id = body.container_id;
      source_app = body.source_app;
      source_type = body.source_type || 'auto_sync';
      entity_type = body.entity_type;
      entity_id = body.entity_id;
      title = body.title;
      content = body.content;
      metadata = body.metadata;
      auto_update = body.auto_update !== false;
      chunk_size = body.chunk_size;
      chunk_overlap = body.chunk_overlap;
      use_markdown = body.use_markdown;
      ocr_engine = body.ocr_engine;
      chunking_method = body.chunking_method;
    }

    // Validation
    if (!container_id || !source_app || !entity_type || !entity_id || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: container_id, source_app, entity_type, entity_id, title'
      });
    }
    
    // ✅ For file uploads, content is optional (will be extracted)
    if (!isFileUpload && !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content (or upload a file)'
      });
    }

    logger.info(`[SyncAPI] Ingest request from ${source_app} for ${entity_type} #${entity_id} ${isFileUpload ? '(FILE UPLOAD)' : '(JSON)'}`);

    // 🔥 Handle file path
    let tempFilePath: string | undefined;
    
    if (isFileUpload) {
      // ✅ Use uploaded file path
      tempFilePath = req.file!.path;
      logger.info(`[SyncAPI] Using uploaded file: ${tempFilePath}`);
    } else if (use_markdown && content) {
      // ✅ Create temp file from text content
      const fs = require('fs').promises;
      const path = require('path');
      const os = require('os');
      
      tempFilePath = path.join(os.tmpdir(), `sync-test-${Date.now()}.md`);
      await fs.writeFile(tempFilePath, content, 'utf-8');
      logger.info(`[SyncAPI] Created temp file for Markdown conversion: ${tempFilePath}`);
    }

    // 🔥 DEBUG: Log dei dati in ingresso
    const debugInfo: any = {
      request: {
        type: isFileUpload ? 'file_upload' : 'json',
        container_id,
        source_app,
        source_type,
        entity_type,
        entity_id,
        title,
        content_length: content?.length || 0,
        file_path: tempFilePath,
        file_info: isFileUpload ? {
          name: req.file!.originalname,
          size: req.file!.size,
          mime: req.file!.mimetype
        } : null,
        metadata_keys: Object.keys(metadata || {}),
        auto_update,
        chunk_size,
        chunk_overlap,
        use_markdown,
        ocr_engine,
        chunking_method,
        timestamp: new Date().toISOString()
      }
    };

    try {
      const result = await ingestionService.ingestStructuredData({
        container_id,
        source_app,
        source_type,
        entity_type,
        entity_id,
        title,
        content: content || '', // Empty for file uploads
        metadata,
        auto_update,
        chunk_size,
        chunk_overlap,
        // ✅ Markdown pipeline params
        use_markdown: isFileUpload ? true : use_markdown, // Force markdown for files
        file_path: tempFilePath,
        ocr_engine,
        chunking_method
      });

      // Cleanup temp file
      if (tempFilePath) {
        const fs = require('fs').promises;
        await fs.unlink(tempFilePath).catch((err) => {
          logger.warn(`[SyncAPI] Failed to cleanup temp file ${tempFilePath}:`, err.message);
        });
      }

      const processingTime = Date.now() - startTime;

      // 🔥 DEBUG: Info completa di risposta
      debugInfo.response = {
        documentId: result.documentId,
        chunksCreated: result.chunksCreated,
        entitiesExtracted: result.entitiesExtracted,
        relationshipsExtracted: result.relationshipsExtracted,
        semanticChunking: result.semanticChunking,
        keywords: result.keywords,
        hybridExtraction: result.hybridExtraction,
        markdown: result.markdown,  // ✅ Include Markdown content
        processingTime_ms: processingTime,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: result,
        message: `Successfully ingested ${entity_type} #${entity_id}`,
        debug: debugInfo
      });
    } catch (ingestionError: any) {
      // Cleanup temp file on error
      if (tempFilePath) {
        const fs = require('fs').promises;
        await fs.unlink(tempFilePath).catch(() => {});
      }
      throw ingestionError;
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    logger.error('[SyncAPI] Ingest failed:', error);
    
    // Cleanup uploaded file on error
    if (req.file?.path) {
      const fs = require('fs').promises;
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    const debugError = {
      error: error.message,
      stack: error.stack,
      processingTime_ms: processingTime,
      timestamp: new Date().toISOString()
    };

    res.status(500).json({
      success: false,
      error: error.message,
      debug: debugError
    });
  }
});

/**
 * DELETE /api/sync/entity/:container_id/:entity_type/:entity_id
 * Delete all chunks for a specific entity
 */
router.delete('/entity/:container_id/:entity_type/:entity_id', async (req: Request, res: Response) => {
  try {
    const { container_id, entity_type, entity_id } = req.params;
    const { source_app } = req.query;

    logger.info(`[SyncAPI] Delete chunks for ${entity_type} #${entity_id}`);

    const deleted = await ingestionService.deleteEntityChunks({
      container_id,
      source_app: source_app as string,
      entity_type,
      entity_id
    });

    res.json({
      success: true,
      data: { deleted_count: deleted },
      message: `Deleted ${deleted} document(s)`
    });

  } catch (error: any) {
    logger.error('[SyncAPI] Delete failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sync/stats/:container_id
 * Get storage statistics for a container
 */
router.get('/stats/:container_id', async (req: Request, res: Response) => {
  try {
    const { container_id } = req.params;

    const stats = await ingestionService.getStorageStats(container_id);

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('[SyncAPI] Stats fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sync/jobs
 * Get sync jobs list with optional filters
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      entity_type, 
      limit = '50', 
      offset = '0' 
    } = req.query;

    let query = 'SELECT * FROM smartdocs.sync_jobs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (entity_type) {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string));
    params.push(parseInt(offset as string));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error: any) {
    logger.error('[SyncAPI] Jobs fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sync/jobs/:id/retry
 * Retry a failed or completed sync job by re-ingesting the last stored data
 */
router.post('/jobs/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Load job
    const jobResult = await db.query(
      'SELECT * FROM smartdocs.sync_jobs WHERE id = $1',
      [id]
    );

    if (jobResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found'
      });
    }

    const job = jobResult.rows[0];

    // Prevent retry of currently processing jobs
    if (job.status === 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Job is currently processing'
      });
    }

    // Load latest stored document for this entity
    const docResult = await db.query(
      `SELECT * FROM smartdocs.documents
       WHERE container_id = $1 AND entity_type = $2 AND entity_id = $3
       ORDER BY updated_at DESC
       LIMIT 1`,
      [job.container_id, job.entity_type, job.entity_id]
    );

    if (docResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Source document not found for this job'
      });
    }

    const doc = docResult.rows[0];

    logger.info(
      `[SyncAPI] Retrying job ${id} for ${job.entity_type} #${job.entity_id} in container ${job.container_id}`
    );

    // Re-ingest using stored content
    const result = await ingestionService.ingestStructuredData({
      container_id: job.container_id,
      source_app: job.source_app || 'richiesta_assistenza',
      source_type: 'auto_sync',
      entity_type: job.entity_type,
      entity_id: job.entity_id,
      title: doc.title || `${job.entity_type} ${job.entity_id}`,
      content: doc.content,
      metadata: doc.metadata || {},
      auto_update: true,
      chunk_size: undefined,
      chunk_overlap: undefined
    });

    res.json({
      success: true,
      data: result,
      message: 'Job re-queued successfully'
    });

  } catch (error: any) {
    logger.error('[SyncAPI] Job retry failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
