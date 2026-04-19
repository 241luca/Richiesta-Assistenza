import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { minioStorage } from '../services/MinIOStorageService';
import { DatabaseClient } from '../database/client';
import { DocumentProcessingService } from '../services/DocumentProcessingService';
import { DocumentService } from '../services/DocumentService';
import { StructuredDataIngestionService } from '../services/StructuredDataIngestionService';

const router = Router();
const db = DatabaseClient.getInstance();
const processingService = new DocumentProcessingService();
const docService = new DocumentService();
const ingestionService = new StructuredDataIngestionService();

// Configurazione Multer per upload in memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Formati supportati
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${file.mimetype}`));
    }
  }
});

/**
 * GET /api/documents
 * Lista TUTTI i documenti da TUTTI i container
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        id,
        container_id,
        title,
        external_doc_type as file_name,
        file_size,
        mime_type,
        external_doc_type as document_type,
        processing_status as status,
        created_at as upload_date,
        updated_at as processed_date,
        metadata,
        error_message
      FROM smartdocs.documents
      ORDER BY created_at DESC
      LIMIT 500
    `;

    const result = await db.query(query);

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    logger.error('Error listing all documents:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to list documents'
    });
  }
});

/**
 * POST /api/documents/upload
 * Upload documento in un container
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { container_id, title, description, document_type } = req.body;

    // Validazione
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!container_id) {
      return res.status(400).json({
        success: false,
        error: 'container_id is required'
      });
    }

    // Verifica che il container esista
    const containerCheck = await db.query(
      'SELECT id, name FROM smartdocs.container_instances WHERE id = $1',
      [container_id]
    );

    if (containerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Container not found'
      });
    }

    const documentId = uuidv4();

    logger.info(`Uploading document ${documentId} to container ${container_id}`);
    logger.info(`File: ${file.originalname}, Size: ${file.size}, Type: ${file.mimetype}`);

    // 1. Upload file to MinIO
    const storageResult = await minioStorage.uploadFile(file, container_id, documentId);

    // 2. Save metadata to database
    const insertQuery = `
      INSERT INTO smartdocs.documents (
        id,
        container_id,
        external_doc_type,
        external_doc_id,
        title,
        content,
        storage_url,
        file_size,
        mime_type,
        metadata,
        processing_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      documentId,
      container_id,
      document_type || 'document',  // external_doc_type
      file.originalname,            // external_doc_id
      title || file.originalname,   // title
      '',                           // content (vuoto per ora)
      storageResult.url,            // storage_url
      file.size,                    // file_size
      file.mimetype,                // mime_type
      JSON.stringify({              // metadata
        original_name: file.originalname,
        upload_timestamp: new Date().toISOString(),
        storage_path: storageResult.objectName
      }),
      'PENDING'                     // processing_status
    ]);

    const document = result.rows[0];

    logger.info(`Document ${documentId} uploaded successfully`);

    return res.status(201).json({
      success: true,
      data: {
        id: document.id,
        container_id: document.container_id,
        title: document.title,
        file_name: document.external_doc_id,
        file_size: document.file_size,
        mime_type: document.mime_type,
        storage_url: document.storage_url,
        status: document.processing_status,
        upload_date: document.created_at
      },
      message: 'Document uploaded successfully. Processing will start shortly.'
    });

  } catch (error: any) {
    logger.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload document'
    });
  }
});

/**
 * GET /api/documents/container/:containerId
 * Lista documenti in un container
 */
router.get('/container/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;

    const query = `
      SELECT 
        id,
        container_id,
        title,
        external_doc_type as file_name,
        file_size,
        mime_type,
        external_doc_type as document_type,
        processing_status as status,
        created_at as upload_date,
        updated_at as processed_date,
        metadata,
        error_message
      FROM smartdocs.documents
      WHERE container_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [containerId]);

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    logger.error('Error listing documents:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to list documents'
    });
  }
});

/**
 * GET /api/documents/:id
 * Get documento singolo con dettagli completi
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT * FROM smartdocs.documents WHERE id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = result.rows[0];

    // Genera nuovo presigned URL se necessario
    if (document.storage_path) {
      const newUrl = await minioStorage.getDownloadUrl(document.storage_path);
      document.storage_url = newUrl;
    }

    return res.json({
      success: true,
      data: document
    });

  } catch (error: any) {
    logger.error('Error getting document:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document'
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Elimina documento
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get document info
    const docQuery = await db.query(
      'SELECT storage_path FROM smartdocs.documents WHERE id = $1',
      [id]
    );

    if (docQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const storagePath = docQuery.rows[0].storage_path;

    // Delete from MinIO
    if (storagePath) {
      await minioStorage.deleteFile(storagePath);
    }

    // Delete chunks from vector DB would go here
    // await qdrantClient.delete(...)

    // Delete from database
    await db.query('DELETE FROM smartdocs.documents WHERE id = $1', [id]);

    logger.info(`Document ${id} deleted successfully`);

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error: any) {
    logger.error('Error deleting document:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete document'
    });
  }
});

/**
 * GET /api/documents/:id/download
 * Download documento
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = await db.query(
      'SELECT storage_path, file_name, mime_type FROM smartdocs.documents WHERE id = $1',
      [id]
    );

    if (query.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const { storage_path, file_name, mime_type } = query.rows[0];

    // Get file from MinIO
    const fileBuffer = await minioStorage.getFile(storage_path);

    res.setHeader('Content-Type', mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
    return res.send(fileBuffer);

  } catch (error: any) {
    logger.error('Error downloading document:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to download document'
    });
  }
});

/**
 * GET /api/documents/:id/chunks
 * Ritorna i chunks del documento con metadati
 */
router.get('/:id/chunks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chunks = await docService.getDocumentChunks(id);

    return res.json({
      success: true,
      data: chunks
    });
  } catch (error: any) {
    logger.error('Error getting document chunks:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document chunks'
    });
  }
});

/**
 * GET /api/documents/:id/analysis
 * Ritorna l'analisi completa del documento (chunks, entità, relazioni, stats)
 */
router.get('/:id/analysis', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await docService.getDocumentAnalysis(id);

    return res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    logger.error('Error getting document analysis:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document analysis'
    });
  }
});

/**
 * POST /api/documents/:id/process
 * Process/Reprocess document - generate embeddings
 */
router.post('/:id/process', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica che il documento esista
    const docQuery = await db.query(
      'SELECT id, title, storage_url, processing_status FROM smartdocs.documents WHERE id = $1',
      [id]
    );

    if (docQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = docQuery.rows[0];

    logger.info(`Document ${id} processing requested`);

    // Avvia il processamento in background (non blocca la risposta)
    processingService.processDocument(id).catch(error => {
      logger.error(`Background processing failed for document ${id}:`, error);
    });

    return res.json({
      success: true,
      message: 'Document processing started',
      data: {
        id: document.id,
        title: document.title,
        status: 'PROCESSING'
      }
    });

  } catch (error: any) {
    logger.error('Error starting document processing:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to start document processing'
    });
  }
});

/**
 * POST /api/documents/upload-markdown
 * Upload documento con conversione automatica in Markdown
 * Supporta dual chunking (Docling + Semantic)
 */
router.post('/upload-markdown', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { 
      container_id, 
      title, 
      ocr_engine = 'auto',
      chunking_method = 'semantic'
    } = req.body;

    // Validazione
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!container_id) {
      return res.status(400).json({
        success: false,
        error: 'container_id is required'
      });
    }

    // Verifica container
    const containerCheck = await db.query(
      'SELECT id, name FROM smartdocs.container_instances WHERE id = $1',
      [container_id]
    );

    if (containerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Container not found'
      });
    }

    const documentId = uuidv4();
    const tempFilePath = `/tmp/${documentId}_${file.originalname}`;

    logger.info(`🔄 Processing document with Markdown pipeline: ${file.originalname}`);
    logger.info(`  Engine: ${ocr_engine}, Chunking: ${chunking_method}`);

    // Salva file temporaneo
    const fs = require('fs').promises;
    await fs.writeFile(tempFilePath, file.buffer);

    try {
      // Upload a MinIO
      const storageResult = await minioStorage.uploadFile(file, container_id, documentId);

      // Processa con pipeline Markdown
      const result = await ingestionService.ingestStructuredData({
        container_id,
        source_app: 'manual',
        source_type: 'manual',
        entity_type: 'document',
        entity_id: documentId,
        title: title || file.originalname,
        content: '', // Sarà sostituito da MD
        metadata: {
          original_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          storage_url: storageResult.url
        },
        // ✅ Markdown pipeline
        use_markdown: true,
        file_path: tempFilePath,
        ocr_engine: ocr_engine as 'auto' | 'docling' | 'paddleocr-vl',
        chunking_method: chunking_method as 'docling' | 'semantic' | 'both'
      });

      // Cleanup temp file
      await fs.unlink(tempFilePath).catch(() => {});

      logger.info(`✅ Document processed with Markdown pipeline: ${result.documentId}`);

      return res.status(201).json({
        success: true,
        data: {
          documentId: result.documentId,
          chunksCreated: result.chunksCreated,
          entitiesExtracted: result.entitiesExtracted,
          relationshipsExtracted: result.relationshipsExtracted,
          semanticChunking: result.semanticChunking,
          hybridExtraction: result.hybridExtraction,
          storage_url: storageResult.url
        },
        message: 'Document processed successfully with Markdown pipeline'
      });

    } catch (processingError: any) {
      // Cleanup on error
      await fs.unlink(tempFilePath).catch(() => {});
      throw processingError;
    }

  } catch (error: any) {
    logger.error('Error in Markdown upload pipeline:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process document with Markdown pipeline'
    });
  }
});

export default router;
