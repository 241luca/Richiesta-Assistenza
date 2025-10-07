import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';

const router = Router();

// Configurazione multer per upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), '..', 'public', 'uploads');
    
    // Crea la directory se non esiste
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating upload directory:', error);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Genera nome unico per il file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const type = req.body.type || 'image';
    
    cb(null, `${type}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accetta solo immagini
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp|ico/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (ext && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse'));
    }
  }
});

// Upload immagine
router.post('/image', authenticate, upload.single('image'), async (req: any, res: Response) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(
        ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
      );
    }

    if (!req.file) {
      return res.status(400).json(
        ResponseFormatter.error('Nessun file caricato', 'NO_FILE')
      );
    }

    // URL relativo per il frontend
    const fileUrl = `/uploads/${req.file.filename}`;

    logger.info(`Image uploaded: ${fileUrl} by user ${req.user.id}`);

    return res.json(ResponseFormatter.success({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }, 'Immagine caricata con successo'));

  } catch (error: any) {
    logger.error('Upload error:', error);
    
    // Rimuovi il file se c'è stato un errore
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error removing file:', unlinkError);
      }
    }
    
    return res.status(500).json(
      ResponseFormatter.error(
        error.message || 'Errore nel caricamento',
        'UPLOAD_ERROR'
      )
    );
  }
});

// Elimina immagine
router.delete('/image/:filename', authenticate, async (req: any, res: Response) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(
        ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
      );
    }

    const { filename } = req.params;
    const filePath = path.join(process.cwd(), '..', 'public', 'uploads', filename);

    // Verifica che il file esista
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json(
        ResponseFormatter.error('File non trovato', 'NOT_FOUND')
      );
    }

    // Elimina il file
    await fs.unlink(filePath);

    logger.info(`Image deleted: ${filename} by user ${req.user.id}`);

    return res.json(ResponseFormatter.success(null, 'Immagine eliminata con successo'));

  } catch (error: any) {
    logger.error('Delete error:', error);
    return res.status(500).json(
      ResponseFormatter.error(
        error.message || 'Errore nell\'eliminazione',
        'DELETE_ERROR'
      )
    );
  }
});

export default router;
