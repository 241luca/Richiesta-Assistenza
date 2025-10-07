import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMultiple, handleUploadError, isImageFile, UPLOAD_LIMITS } from '../middleware/upload.middleware';
import { fileService } from '../services/file.service';
// AGGIUNTO: ResponseFormatter per output consistente
import { ResponseFormatter, formatAttachment, formatAttachmentList } from '../utils/responseFormatter';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

/**
 * GET /api/requests/:id/attachments
 * Ottieni tutti gli attachments di una richiesta
 */
router.get('/requests/:id/attachments', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: requestId } = req.params;
    const userId = (req as any).user.id;
    
    // Verifica che l'utente possa visualizzare gli attachments
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      select: {
        clientId: true,
        professionalId: true
        // Rimosso organizationId che non esiste nel modello
      }
    });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Richiesta non trovata'
      });
    }
    
    // Verifica permessi
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true
        // Rimosso organizationId
      }
    });
    
    const canView = 
      user?.role === 'SUPER_ADMIN' ||
      user?.role === 'ADMIN' ||
      request.clientId === userId ||
      request.professionalId === userId;
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per visualizzare questi allegati'
      });
    }
    
    const attachments = await fileService.getRequestAttachments(requestId);
    
    res.json({
      success: true,
      data: attachments,
      count: attachments.length
    });
  } catch (error) {
    console.error('Errore recupero attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli allegati'
    });
  }
});

/**
 * POST /api/requests/:id/attachments
 * Upload allegati multipli per una richiesta
 */
router.post(
  '/requests/:id/attachments',
  authenticate,
  uploadMultiple,
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const { id: requestId } = req.params;
      const userId = (req as any).user.id;
      const files = req.files as Express.Multer.File[];
      const descriptions = req.body.descriptions || [];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nessun file caricato'
        });
      }
      
      // Verifica che la richiesta esista e l'utente possa caricare file
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: {
        clientId: true,
        professionalId: true
        // Rimosso organizationId che non esiste
        }
      });
      
      if (!request) {
        // Elimina file caricati se la richiesta non esiste
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Errore eliminazione file:', err);
          }
        }
        
        return res.status(404).json({
          success: false,
          message: 'Richiesta non trovata'
        });
      }
      
      // Verifica permessi upload
      const canUpload = 
        request.clientId === userId ||
        request.professionalId === userId;
      
      if (!canUpload) {
        // Elimina file caricati se non ha permessi
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Errore eliminazione file:', err);
          }
        }
        
        return res.status(403).json({
          success: false,
          message: 'Non hai i permessi per caricare allegati in questa richiesta'
        });
      }
      
      // Verifica numero massimo di allegati per richiesta
      const currentCount = await fileService.countRequestAttachments(requestId);
      if (currentCount + files.length > UPLOAD_LIMITS.MAX_FILES) {
        // Elimina file caricati
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Errore eliminazione file:', err);
          }
        }
        
        return res.status(400).json({
          success: false,
          message: `Numero massimo di allegati raggiunto. Massimo ${UPLOAD_LIMITS.MAX_FILES} file per richiesta`
        });
      }
      
      // Processa ogni file
      const savedAttachments = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const description = descriptions[i] || null;
        
        let processedFile = {
          filePath: `attachments/${file.filename}`,
          thumbnailPath: undefined as string | undefined
        };
        
        // Se è un'immagine, processala con Sharp
        if (isImageFile(file.mimetype)) {
          const processed = await fileService.processImage(file.path, file.filename);
          processedFile = processed;
        }
        
        // Salva nel database
        const attachment = await fileService.saveAttachment(
          requestId,
          userId,
          {
            fileName: file.filename,
            originalName: file.originalname,
            filePath: processedFile.filePath,
            fileType: file.mimetype,
            fileSize: file.size,
            thumbnailPath: processedFile.thumbnailPath
          },
          description
        );
        
        savedAttachments.push(attachment);
      }
      
      res.status(201).json({
        success: true,
        message: `${savedAttachments.length} file caricati con successo`,
        data: savedAttachments
      });
      
    } catch (error) {
      console.error('Errore upload attachments:', error);
      
      // Prova a eliminare file caricati in caso di errore
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Errore eliminazione file:', err);
          }
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Errore durante il caricamento dei file'
      });
    }
  }
);

/**
 * DELETE /api/attachments/:id
 * Elimina un allegato
 */
router.delete('/attachments/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: attachmentId } = req.params;
    const userId = (req as any).user.id;
    
    await fileService.deleteAttachment(attachmentId, userId);
    
    res.json({
      success: true,
      message: 'Allegato eliminato con successo'
    });
  } catch (error: any) {
    console.error('Errore eliminazione attachment:', error);
    
    if (error.message === 'Attachment non trovato') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Non hai i permessi per eliminare questo file') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'eliminazione dell\'allegato'
    });
  }
});

/**
 * GET /api/attachments/:id/download
 * Download di un allegato
 */
router.get('/attachments/:id/download', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: attachmentId } = req.params;
    const userId = (req as any).user.id;
    
    // Ottieni info attachment
    const attachment = await fileService.getAttachment(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Allegato non trovato'
      });
    }
    
    // Verifica permessi
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: attachment.requestId },
      select: {
        clientId: true,
        professionalId: true
      }
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true
      }
    });
    
    const canDownload = 
      user?.role === 'SUPER_ADMIN' ||
      user?.role === 'ADMIN' ||
      request?.clientId === userId ||
      request?.professionalId === userId;
    
    if (!canDownload) {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per scaricare questo file'
      });
    }
    
    // Costruisci percorso file
    const filePath = path.join(process.cwd(), '..', 'uploads', attachment.filePath);
    
    // Verifica che il file esista
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File non trovato nel filesystem'
      });
    }
    
    // Imposta headers per download
    res.setHeader('Content-Type', attachment.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Length', attachment.fileSize.toString());
    
    // Invia file
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
    
  } catch (error) {
    console.error('Errore download attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il download del file'
    });
  }
});

/**
 * GET /api/attachments/:id/thumbnail
 * Ottieni thumbnail di un'immagine
 */
router.get('/attachments/:id/thumbnail', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: attachmentId } = req.params;
    
    // Ottieni info attachment
    const attachment = await fileService.getAttachment(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Allegato non trovato'
      });
    }
    
    if (!attachment.thumbnailPath) {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail non disponibile per questo file'
      });
    }
    
    // Costruisci percorso thumbnail
    const thumbnailPath = path.join(process.cwd(), '..', 'uploads', attachment.thumbnailPath);
    
    // Verifica che il file esista
    try {
      await fs.access(thumbnailPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail non trovata nel filesystem'
      });
    }
    
    // Imposta headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache per 24 ore
    
    // Invia thumbnail
    const thumbnailData = await fs.readFile(thumbnailPath);
    res.send(thumbnailData);
    
  } catch (error) {
    console.error('Errore recupero thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero della thumbnail'
    });
  }
});

/**
 * GET /api/storage/stats
 * Statistiche utilizzo storage (solo admin)
 */
router.get('/storage/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verifica che sia admin
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo gli amministratori possono visualizzare le statistiche storage'
      });
    }
    
    const stats = await fileService.getStorageStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Errore recupero statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle statistiche'
    });
  }
});

export default router;
