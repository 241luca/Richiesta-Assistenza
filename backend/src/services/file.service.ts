import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
// AGGIUNTO: ResponseFormatter per formattazione consistente
import { formatAttachment, formatAttachmentList } from '../utils/responseFormatter';

const prisma = new PrismaClient();

interface FileInfo {
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  thumbnailPath?: string;
}

interface ProcessedImage {
  filePath: string;
  thumbnailPath: string;
}

export class FileService {
  private readonly uploadsDir = path.join(process.cwd(), '..', 'uploads');
  private readonly attachmentsDir = path.join(this.uploadsDir, 'attachments');
  private readonly thumbnailsDir = path.join(this.uploadsDir, 'thumbnails');
  
  constructor() {
    this.ensureDirectories();
  }
  
  /**
   * Assicura che le directory di upload esistano
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.attachmentsDir, { recursive: true });
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
    } catch (error) {
      console.error('Errore creazione directory:', error);
    }
  }
  
  /**
   * Processa un'immagine: resize e crea thumbnail
   */
  async processImage(filePath: string, fileName: string): Promise<ProcessedImage> {
    try {
      const fullPath = path.join(this.attachmentsDir, fileName);
      
      // Resize immagine principale (max 1920x1080)
      await sharp(fullPath)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(fullPath + '.tmp');
      
      // Sostituisci file originale con versione ottimizzata
      await fs.rename(fullPath + '.tmp', fullPath);
      
      // Crea thumbnail (200x200)
      const thumbnailName = `thumb-${fileName}`;
      const thumbnailPath = path.join(this.thumbnailsDir, thumbnailName);
      
      await sharp(fullPath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      return {
        filePath: `attachments/${fileName}`,
        thumbnailPath: `thumbnails/${thumbnailName}`
      };
    } catch (error) {
      console.error('Errore processing immagine:', error);
      // Se fallisce, ritorna percorso originale senza thumbnail
      return {
        filePath: `attachments/${fileName}`,
        thumbnailPath: ''
      };
    }
  }
  
  /**
   * Salva i metadati dell'attachment nel database
   */
  async saveAttachment(
    requestId: string,
    uploadedById: string,
    fileInfo: FileInfo,
    description?: string
  ) {
    try {
      const attachment = await prisma.requestAttachment.create({
        data: {
          id: uuidv4(), // Genera UUID per l'ID
          requestId,
          recipientId: uploadedById, // Usa userId come definito nello schema
          fileName: fileInfo.fileName,
          originalName: fileInfo.originalName,
          filePath: fileInfo.filePath,
          fileType: fileInfo.fileType,
          fileSize: fileInfo.fileSize,
          // thumbnailPath non esiste nello schema, lo mettiamo nei metadata
          description,
          metadata: {
            uploadedAt: new Date().toISOString(),
            userAgent: null, // Può essere popolato dal request header
            thumbnailPath: fileInfo.thumbnailPath // Salviamo thumbnail nei metadata
          }
        }
      });

      // AGGIUNTO: Usa ResponseFormatter per output consistente
      return formatAttachment(attachment);
    } catch (error) {
      console.error('Errore salvataggio attachment:', error);
      throw error;
    }
  }
  
  /**
   * Ottieni tutti gli attachments di una richiesta
   */
  async getRequestAttachments(requestId: string) {
    try {
      const attachments = await prisma.requestAttachment.findMany({
        where: { requestId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // AGGIUNTO: Usa ResponseFormatter per output consistente
      return formatAttachmentList(attachments);
    } catch (error) {
      console.error('Errore recupero attachments:', error);
      throw error;
    }
  }
  
  /**
   * Ottieni un singolo attachment
   */
  async getAttachment(attachmentId: string) {
    try {
      const attachment = await prisma.requestAttachment.findUnique({
        where: { id: attachmentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // AGGIUNTO: Usa ResponseFormatter per output consistente
      return attachment ? formatAttachment(attachment) : null;
    } catch (error) {
      console.error('Errore recupero attachment:', error);
      throw error;
    }
  }
  
  /**
   * Elimina un attachment
   */
  async deleteAttachment(attachmentId: string, recipientId: string): Promise<boolean> {
    try {
      // Verifica che l'utente possa eliminare l'attachment
      const attachment = await prisma.requestAttachment.findUnique({
        where: { id: attachmentId },
        include: {
          request: {
            select: {
              clientId: true,
              professionalId: true
            }
          }
        }
      });
      
      if (!attachment) {
        throw new Error('Attachment non trovato');
      }
      
      // Verifica permessi (può eliminare: chi ha uploadato, il cliente, il professionista assegnato)
      const canDelete = 
        attachment.userId === userId ||
        attachment.request.clientId === userId ||
        attachment.request.professionalId === userId;
      
      if (!canDelete) {
        throw new Error('Non hai i permessi per eliminare questo file');
      }
      
      // Elimina file fisici
      try {
        await fs.unlink(path.join(this.uploadsDir, attachment.filePath));
        // Thumbnail è ora nei metadata
        const metadata = attachment.metadata as any;
        if (metadata?.thumbnailPath) {
          await fs.unlink(path.join(this.uploadsDir, metadata.thumbnailPath));
        }
      } catch (error) {
        console.error('Errore eliminazione file fisico:', error);
      }
      
      // Elimina dal database
      await prisma.requestAttachment.delete({
        where: { id: attachmentId }
      });
      
      return true;
    } catch (error) {
      console.error('Errore eliminazione attachment:', error);
      throw error;
    }
  }
  
  /**
   * Conta gli attachments per una richiesta
   */
  async countRequestAttachments(requestId: string): Promise<number> {
    try {
      const count = await prisma.requestAttachment.count({
        where: { requestId }
      });
      
      return count;
    } catch (error) {
      console.error('Errore conteggio attachments:', error);
      return 0;
    }
  }
  
  /**
   * Pulizia file orfani (cron job)
   */
  async cleanupOrphanFiles(): Promise<void> {
    try {
      // Trova tutti i file nel filesystem
      const attachmentFiles = await fs.readdir(this.attachmentsDir);
      const thumbnailFiles = await fs.readdir(this.thumbnailsDir);
      
      // Ottieni tutti i percorsi dal database
      const dbAttachments = await prisma.requestAttachment.findMany({
        select: {
          fileName: true,
          metadata: true
        }
      });
      
      const dbFileNames = new Set(dbAttachments.map(a => a.fileName));
      const dbThumbnails = new Set(
        dbAttachments
          .filter(a => {
            const metadata = a.metadata as any;
            return metadata?.thumbnailPath;
          })
          .map(a => {
            const metadata = a.metadata as any;
            return path.basename(metadata.thumbnailPath);
          })
      );
      
      // Elimina file orfani
      for (const file of attachmentFiles) {
        if (!dbFileNames.has(file) && !file.startsWith('.')) {
          const filePath = path.join(this.attachmentsDir, file);
          const stats = await fs.stat(filePath);
          
          // Elimina solo file più vecchi di 24 ore
          const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          if (ageInHours > 24) {
            await fs.unlink(filePath);
            console.log(`File orfano eliminato: ${file}`);
          }
        }
      }
      
      // Elimina thumbnail orfani
      for (const thumb of thumbnailFiles) {
        if (!dbThumbnails.has(thumb) && !thumb.startsWith('.')) {
          const thumbPath = path.join(this.thumbnailsDir, thumb);
          const stats = await fs.stat(thumbPath);
          
          const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          if (ageInHours > 24) {
            await fs.unlink(thumbPath);
            console.log(`Thumbnail orfano eliminato: ${thumb}`);
          }
        }
      }
    } catch (error) {
      console.error('Errore pulizia file orfani:', error);
    }
  }
  
  /**
   * Ottieni statistiche storage
   */
  async getStorageStats() {
    try {
      const totalAttachments = await prisma.requestAttachment.count();
      const totalSize = await prisma.requestAttachment.aggregate({
        _sum: {
          fileSize: true
        }
      });
      
      const byType = await prisma.requestAttachment.groupBy({
        by: ['fileType'],
        _count: true,
        _sum: {
          fileSize: true
        }
      });
      
      return {
        totalFiles: totalAttachments,
        totalSizeBytes: totalSize._sum.fileSize || 0,
        totalSizeMB: ((totalSize._sum.fileSize || 0) / (1024 * 1024)).toFixed(2),
        byType: byType.map(t => ({
          type: t.fileType,
          count: t._count,
          sizeBytes: t._sum.fileSize || 0,
          sizeMB: ((t._sum.fileSize || 0) / (1024 * 1024)).toFixed(2)
        }))
      };
    } catch (error) {
      console.error('Errore calcolo statistiche:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
