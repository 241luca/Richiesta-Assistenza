import { Router, Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { getSmartDocsClient } from '../services/smartdocs-client.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/smartdocs/health
 * Health check di SmartDocs
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    
    if (!client.isEnabled()) {
      return res.json({
        enabled: false,
        message: 'SmartDocs is not enabled'
      });
    }

    const health = await client.healthCheck();
    
    res.json({
      enabled: true,
      ...health
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Health check failed', error);
    res.status(503).json({
      enabled: true,
      error: 'Service unavailable',
      message: error.message
    });
  }
});

/**
 * GET /api/smartdocs/containers
 * Lista containers
 */
router.get('/containers', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { type, search, limit = '50', offset = '0' } = req.query;

    const containers = await client.listContainers({
      type: type as string,
      search: search as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: containers
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to list containers', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/containers
 * Crea nuovo container
 */
router.post('/containers', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { type, name, description, metadata } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        error: 'Type and name are required'
      });
    }

    const container = await client.createContainer({
      type,
      name,
      description,
      metadata
    });

    res.status(201).json({
      success: true,
      data: container
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to create container', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smartdocs/containers/:id/stats
 * Statistiche container
 */
router.get('/containers/:id/stats', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { id } = req.params;

    const stats = await client.getContainerStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get container stats', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/smartdocs/containers/:id/documents
 * Svuota tutti i documenti di un container
 */
router.delete('/containers/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';

    const response = await fetch(`${smartdocsUrl}/api/containers/${id}/documents`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to clear container documents', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/smartdocs/containers/:id
 * Aggiorna container
 */
router.put('/containers/:id', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { id } = req.params;
    const { name, description, ai_prompt } = req.body;

    const container = await client.updateContainer(id, {
      name,
      description,
      ai_prompt
    });

    res.json({
      success: true,
      data: container
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to update container', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/smartdocs/containers/:id
 * Elimina container
 */
router.delete('/containers/:id', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { id } = req.params;

    await client.deleteContainer(id);

    res.json({
      success: true,
      message: 'Container eliminato con successo'
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to delete container', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// CONTAINER INSTANCES ROUTES (Proxy to SmartDocs API)
// ============================================================================

/**
 * POST /api/smartdocs/instances
 * Crea nuova istanza container
 */
router.post('/instances', async (req: Request, res: Response) => {
  try {
    logger.info('[SmartDocs] Creating instance with data:', req.body);
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const response = await fetch(`${smartdocsUrl}/api/container-instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    logger.info('[SmartDocs] SmartDocs API response:', { status: response.status, data });
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to create instance', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smartdocs/instances
 * Lista istanze
 */
router.get('/instances', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const queryString = new URLSearchParams(req.query as any).toString();
    const response = await fetch(
      `${smartdocsUrl}/api/container-instances?${queryString}`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to list instances', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smartdocs/instances/:id
 * Ottieni istanza
 */
router.get('/instances/:id', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const { id } = req.params;
    const response = await fetch(
      `${smartdocsUrl}/api/container-instances/${id}`
    );
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get instance', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/smartdocs/instances/:id
 * Aggiorna istanza
 */
router.put('/instances/:id', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const { id } = req.params;
    const response = await fetch(
      `${smartdocsUrl}/api/container-instances/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }
    );
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to update instance', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/smartdocs/instances/:id
 * Elimina istanza
 */
router.delete('/instances/:id', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const { id } = req.params;
    const response = await fetch(
      `${smartdocsUrl}/api/container-instances/${id}`,
      { method: 'DELETE' }
    );
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to delete instance', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smartdocs/instances/:id/stats
 * Statistiche istanza
 */
router.get('/instances/:id/stats', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const { id } = req.params;
    const response = await fetch(
      `${smartdocsUrl}/api/container-instances/${id}/stats`
    );
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get instance stats', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/smartdocs/instances/:id/documents
 * Svuota tutti i documenti dell'istanza container (chunk, embeddings, KG inclusi)
 */
router.delete('/instances/:id/documents', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const { id } = req.params;
    const response = await fetch(
      `${smartdocsUrl}/api/container-instances/${id}/documents`,
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to clear instance documents', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/ingest/intervention-report/:id
 * Ingest rapportino intervento
 */
router.post('/ingest/intervention-report/:id', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { id } = req.params;

    // Fetch rapportino da database
    const report = await prisma.interventionReport.findUnique({
      where: { id },
      include: {
        AssistanceRequest: {
          include: {
            Category: true,
            client: true,
            professional: true
          }
        },
        User_InterventionReport_professionalIdToUser: true,
        User_InterventionReport_clientIdToUser: true,
        InterventionReportStatus: true
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Intervention report not found'
      });
    }

    // Ingest nel sistema SmartDocs
    const result = await client.ingestInterventionReport({
      id: report.id,
      title: (report as any).AssistanceRequest?.title || `Intervento #${report.id}`,
      description: (report as any).internalNotes || '',
      notes: (report as any).clientNotes || undefined,
      professionalId: (report as any).professionalId,
      clientId: (report as any).clientId,
      categoryId: (report as any).AssistanceRequest?.categoryId,
      metadata: {
        statusId: (report as any).statusId,
        status: (report as any).InterventionReportStatus?.name || (report as any).statusId,
        createdAt: (report as any).createdAt,
        completedAt: (report as any).clientSignedAt || (report as any).professionalSignedAt || undefined,
        categoryName: (report as any).AssistanceRequest?.Category?.name,
        clientName: ((report as any).User_InterventionReport_clientIdToUser?.fullName) || `${(report as any).User_InterventionReport_clientIdToUser?.firstName || ''} ${(report as any).User_InterventionReport_clientIdToUser?.lastName || ''}`.trim(),
        professionalName: ((report as any).User_InterventionReport_professionalIdToUser?.fullName) || `${(report as any).User_InterventionReport_professionalIdToUser?.firstName || ''} ${(report as any).User_InterventionReport_professionalIdToUser?.lastName || ''}`.trim()
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to ingest intervention report', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/ingest/manual
 * Ingest manuale/documento
 */
router.post('/ingest/manual', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { title, content, type = 'manual', metadata } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const result = await client.ingestManual({
      id: Date.now(), // Temporary ID
      title,
      content,
      type,
      metadata
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to ingest manual', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/query
 * Query documenti con RAG
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { question, containerId, limit = 5, threshold = 0.7 } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const result = await client.query({
      question,
      containerId,
      limit,
      threshold
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Query failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/ask
 * Query rapida con RAG - proxy to SmartDocs
 */
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const {
      question,
      container_id,
      threshold,
      limit,
      systemPrompt,
      includeDebug
    } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    
    // Proxy to SmartDocs query endpoint
    const response = await fetch(`${smartdocsUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        containerId: container_id,
        threshold,
        limit,
        systemPrompt,
        includeDebug
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Query failed', { error: error.message, question: req.body.question });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/classify
 * Classifica documento
 */
router.post('/classify', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { content, types } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const result = await client.classify({ content, types });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Classification failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/extract
 * Estrai dati strutturati
 */
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { content, schema } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const result = await client.extract({ content, schema });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Extraction failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/batch-ingest/intervention-reports
 * Ingest multiplo di rapportini
 */
router.post('/batch-ingest/intervention-reports', async (req: Request, res: Response) => {
  try {
    const client = getSmartDocsClient();
    const { limit = 100, offset = 0, status } = req.body;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const offsetNum = typeof offset === 'string' ? parseInt(offset, 10) : offset;

    // Fetch rapportini da database
    const reports = await prisma.interventionReport.findMany({
      take: limitNum,
      skip: offsetNum,
      where: status ? { statusId: status } : undefined,
      include: {
        AssistanceRequest: {
          include: {
            Category: true,
            client: true,
            professional: true
          }
        },
        User_InterventionReport_professionalIdToUser: true,
        User_InterventionReport_clientIdToUser: true,
        InterventionReportStatus: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const results = [];
    const errors = [];

    for (const report of reports) {
      try {
        const result = await client.ingestInterventionReport({
          id: report.id,
          title: (report as any).AssistanceRequest?.title || `Intervento #${report.id}`,
          description: (report as any).internalNotes || '',
          notes: (report as any).clientNotes || undefined,
          professionalId: (report as any).professionalId,
          clientId: (report as any).clientId,
          categoryId: (report as any).AssistanceRequest?.categoryId,
          metadata: {
            statusId: (report as any).statusId,
            status: (report as any).InterventionReportStatus?.name || (report as any).statusId,
            createdAt: (report as any).createdAt,
            categoryName: (report as any).AssistanceRequest?.Category?.name
          }
        });

        results.push({
          id: report.id,
          success: true,
          documentId: result.documentId
        });
      } catch (error: any) {
        errors.push({
          id: report.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        processed: reports.length,
        succeeded: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Batch ingest failed', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// DOCUMENTS ROUTES (Proxy to SmartDocs API)
// ============================================================================

// Configure multer for file uploads (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

/**
 * POST /api/smartdocs/documents/upload
 * Upload documento (proxy with multipart/form-data)
 */
router.post('/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    logger.info('[SmartDocs] Uploading file:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    
    // Create FormData to forward to SmartDocs API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('container_id', req.body.container_id);
    formData.append('title', req.body.title || req.file.originalname);
    if (req.body.description) formData.append('description', req.body.description);
    if (req.body.document_type) formData.append('document_type', req.body.document_type);

    // Forward to SmartDocs API using axios for better multipart support
    const axios = require('axios');
    const response = await axios.post(`${smartdocsUrl}/api/documents/upload`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    logger.info('[SmartDocs] Upload response:', { status: response.status, success: response.data.success });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error('[SmartDocs] Upload failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        error: error.message || 'Upload failed'
      }
    );
  }
});

/**
 * GET /api/smartdocs/documents/container/:containerId
 * Lista documenti in un container
 */
router.get('/documents/container/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    
    const response = await fetch(`${smartdocsUrl}/api/documents/container/${containerId}`);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to list documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smartdocs/documents/:id/chunks
 * Elenco chunks semantici di un documento
 */
router.get('/documents/:id/chunks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';

    const response = await fetch(`${smartdocsUrl}/api/documents/${id}/chunks`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get document chunks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/smartdocs/documents/:id
 * Elimina documento
 */
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    
    const response = await fetch(`${smartdocsUrl}/api/documents/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to delete document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/documents/:id/process
 * Process/Reprocess document - generate embeddings
 */
router.post('/documents/:id/process', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    
    logger.info(`[SmartDocs] Processing document ${id}`);
    
    const response = await fetch(`${smartdocsUrl}/api/documents/${id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to process document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// SYNC & STORAGE ROUTES
// ============================================================================

/**
 * GET /api/smartdocs/storage/:containerId
 * Get storage statistics for container
 */
router.get('/storage/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    
    const response = await fetch(`${smartdocsUrl}/api/sync/stats/${containerId}`);
    const data: any = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get storage stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// KNOWLEDGE GRAPH ROUTES (Proxy to SmartDocs API)
// ============================================================================

/**
 * GET /api/smartdocs/knowledge-graph/entities
 * Proxy: recupera le entità estratte per un documento
 * Query supportate: documentId, containerId, limit, minImportance
 */
router.get('/knowledge-graph/entities', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const queryString = new URLSearchParams(req.query as any).toString();

    const response = await fetch(
      `${smartdocsUrl}/api/knowledge-graph/entities?${queryString}`
    );
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get KG entities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smartdocs/knowledge-graph/relationships
 * Proxy: recupera le relazioni estratte per un documento
 * Query supportate: documentId, containerId, limit, minConfidence
 */
router.get('/knowledge-graph/relationships', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const queryString = new URLSearchParams(req.query as any).toString();

    const response = await fetch(
      `${smartdocsUrl}/api/knowledge-graph/relationships?${queryString}`
    );
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get KG relationships:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// CONTAINER CATEGORIES ROUTES (Proxy to SmartDocs API)
// ============================================================================

/**
 * GET /api/smartdocs/container-categories/grouped
 * Proxy: recupera le categorie dei container raggruppate
 */
router.get('/container-categories/grouped', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const response = await fetch(`${smartdocsUrl}/api/container-categories/grouped`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to get container categories (grouped):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/sync/request/:requestId
 * Manually trigger sync for a specific request
 */
router.post('/sync/request/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    // This will be imported when hooks service is ready
    // await smartdocsHooksService.onRequestChanged(requestId);
    
    res.json({
      success: true,
      message: 'Request sync triggered'
    });
  } catch (error: any) {
    logger.error('[SmartDocs] Sync request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/smartdocs/sync/jobs
 * Lista dei sync jobs (proxy a SmartDocs API con filtri opzionali)
 */
router.get('/sync/jobs', async (req: Request, res: Response) => {
  try {
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const queryString = new URLSearchParams(req.query as any).toString();
    const url = queryString
      ? `${smartdocsUrl}/api/sync/jobs?${queryString}`
      : `${smartdocsUrl}/api/sync/jobs`;

    logger.info('[SmartDocs] Listing sync jobs', { query: req.query, url });

    const response = await fetch(url);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to list sync jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/smartdocs/sync/jobs/:id/retry
 * Retry di un sync job esistente (proxy a SmartDocs API)
 */
router.post('/sync/jobs/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const smartdocsUrl = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';

    logger.info(`[SmartDocs] Retrying sync job ${id}`);

    const response = await fetch(`${smartdocsUrl}/api/sync/jobs/${id}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    logger.error('[SmartDocs] Failed to retry sync job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
