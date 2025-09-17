import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = Router();

// Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'knowledge-base');
    
    // Crea la directory se non esiste
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limite
  },
  fileFilter: (req, file, cb) => {
    // Tipi di file accettati
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato. Usa PDF, TXT, MD o DOC/DOCX.'));
    }
  }
});

/**
 * GET /api/knowledge-base/:professionalId/:subcategoryId
 * Ottieni documenti della knowledge base dal DATABASE
 */
router.get('/:professionalId/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    const { targetAudience } = req.query;

    logger.info(`Fetching knowledge base for professional ${professionalId}, subcategory ${subcategoryId}`);

    // Recupera i documenti dal DATABASE PostgreSQL
    const documents = await prisma.knowledgeBase.findMany({
      where: {
        professionalId,
        subcategoryId,
        targetAudience: targetAudience || 'professional',
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        description: true,
        targetAudience: true,
        isProcessed: true,
        processedAt: true,
        createdAt: true
      }
    });

    // Trasforma i dati per compatibilità con il frontend
    const formattedDocuments = documents.map(doc => ({
      ...doc,
      name: doc.originalName,
      size: doc.fileSize,
      uploadedAt: doc.createdAt
    }));

    logger.info(`Found ${documents.length} documents in database`);

    return res.json(ResponseFormatter.success(
      formattedDocuments,
      'Documenti recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching knowledge base:', error);
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero dei documenti',
        'FETCH_ERROR'
      )
    );
  }
});

/**
 * POST /api/knowledge-base/:professionalId/:subcategoryId/upload
 * Carica un nuovo documento e salvalo nel DATABASE
 */
router.post('/:professionalId/:subcategoryId/upload', 
  authenticate,
  upload.single('file'),
  async (req: any, res) => {
    try {
      const { professionalId, subcategoryId } = req.params;
      const { targetAudience, description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json(
          ResponseFormatter.error(
            'Nessun file caricato',
            'NO_FILE'
          )
        );
      }

      logger.info(`Uploading knowledge base document for professional ${professionalId}`);
      logger.info(`File details: name=${file.originalname}, size=${file.size}, type=${file.mimetype}`);

      // Salva il documento nel DATABASE PostgreSQL
      const document = await prisma.knowledgeBase.create({
        data: {
          professionalId,
          subcategoryId,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          description: description || null,
          targetAudience: targetAudience || 'professional',
          uploadedBy: req.user.id,
          isProcessed: false,
          isActive: true
        }
      });

      logger.info(`Document saved to database with id ${document.id}`);

      // Formatta la risposta per il frontend
      const formattedDocument = {
        ...document,
        name: document.originalName,
        size: document.fileSize,
        uploadedAt: document.createdAt
      };

      return res.json(ResponseFormatter.success(
        formattedDocument,
        'Documento caricato con successo'
      ));
    } catch (error) {
      logger.error('Error uploading document:', error);
      
      // Se c'è stato un errore, elimina il file caricato
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore nel caricamento del documento',
          'UPLOAD_ERROR'
        )
      );
    }
  }
);

/**
 * DELETE /api/knowledge-base/:professionalId/:subcategoryId/:documentId
 * Elimina un documento dal DATABASE e dal filesystem
 */
router.delete('/:professionalId/:subcategoryId/:documentId', 
  authenticate, 
  async (req: any, res) => {
    try {
      const { professionalId, subcategoryId, documentId } = req.params;

      logger.info(`Deleting document ${documentId} for professional ${professionalId}`);

      // Recupera il documento dal DATABASE
      const document = await prisma.knowledgeBase.findFirst({
        where: {
          id: documentId,
          professionalId,
          subcategoryId
        }
      });

      if (!document) {
        return res.status(404).json(
          ResponseFormatter.error(
            'Documento non trovato',
            'NOT_FOUND'
          )
        );
      }

      // Elimina il file fisico se esiste
      if (document.filePath && fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
        logger.info(`Physical file deleted: ${document.filePath}`);
      }

      // Soft delete nel DATABASE (mette isActive a false)
      await prisma.knowledgeBase.update({
        where: { id: documentId },
        data: { isActive: false }
      });

      logger.info(`Document ${documentId} marked as inactive in database`);

      return res.json(ResponseFormatter.success(
        { deleted: true, documentId },
        'Documento eliminato con successo'
      ));
    } catch (error) {
      logger.error('Error deleting document:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore nell\'eliminazione del documento',
          'DELETE_ERROR'
        )
      );
    }
  }
);

/**
 * POST /api/knowledge-base/:professionalId/:subcategoryId/process
 * Processa i documenti per l'AI (estrae testo e prepara per embeddings)
 */
router.post('/:professionalId/:subcategoryId/process', 
  authenticate, 
  async (req: any, res) => {
    try {
      const { professionalId, subcategoryId } = req.params;
      const { targetAudience } = req.body;

      logger.info(`Processing knowledge base for professional ${professionalId}`);

      // Importa il servizio AI per Knowledge Base
      const { KnowledgeBaseAIService } = await import('../services/knowledge-base-ai.service');

      // Processa i documenti con il servizio AI
      const result = await KnowledgeBaseAIService.processDocuments(
        professionalId,
        subcategoryId,
        targetAudience || 'professional'
      );

      return res.json(ResponseFormatter.success(
        result,
        'Knowledge base processata con successo'
      ));
    } catch (error) {
      logger.error('Error processing knowledge base:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore nel processamento dei documenti',
          'PROCESS_ERROR'
        )
      );
    }
  }
);

/**
 * GET /api/knowledge-base/stats/:professionalId
 * Statistiche sui documenti del professional
 */
router.get('/stats/:professionalId', authenticate, async (req: any, res) => {
  try {
    const { professionalId } = req.params;

    const stats = await prisma.knowledgeBase.groupBy({
      by: ['subcategoryId', 'targetAudience'],
      where: {
        professionalId,
        isActive: true
      },
      _count: {
        id: true
      },
      _sum: {
        fileSize: true
      }
    });

    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche recuperate con successo'
    ));
  } catch (error) {
    logger.error('Error getting knowledge base stats:', error);
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero delle statistiche',
        'STATS_ERROR'
      )
    );
  }
});

export default router;
