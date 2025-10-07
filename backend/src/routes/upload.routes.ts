import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { profileImageService } from '../services/profileImage.service';
import logger from '../utils/logger';

const router = Router();

// ============================================
// CONFIGURAZIONE MULTER PER UPLOAD GENERALE
// ============================================
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

// ============================================
// CONFIGURAZIONE MULTER PER FOTO PROFILO
// ============================================
const profileImageStorage = multer.memoryStorage(); // Usa memory storage per processare con Sharp

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB massimo
  },
  fileFilter: (req, file, cb) => {
    // Accetta solo formati immagine specifici
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato non valido. Usa JPG, PNG o WebP'));
    }
  }
});

// ============================================
// ROUTE FOTO PROFILO
// ============================================

/**
 * Upload foto profilo utente
 * POST /api/upload/profile-image
 */
router.post('/profile-image', 
  authenticate, 
  profileImageUpload.single('image'), 
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json(
          ResponseFormatter.error('Nessun file caricato', 'NO_FILE')
        );
      }

      // Salva e ottimizza l'immagine
      const result = await profileImageService.saveProfileImage(
        req.user.id,
        req.file
      );

      logger.info(`Profile image uploaded for user ${req.user.id}`);

      return res.json(ResponseFormatter.success({
        profileImageUrl: result.profileImageUrl,
        thumbnailUrl: result.thumbnailUrl,
        message: 'Foto profilo caricata con successo'
      }));

    } catch (error: any) {
      logger.error('Profile image upload error:', error);
      
      // Gestisci errori di validazione
      if (error.message.includes('Formato non valido') || 
          error.message.includes('troppo grande') || 
          error.message.includes('troppo piccola')) {
        return res.status(400).json(
          ResponseFormatter.error(error.message, 'VALIDATION_ERROR')
        );
      }
      
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore nel caricamento della foto profilo',
          'UPLOAD_ERROR'
        )
      );
    }
  }
);

/**
 * Ottieni foto profilo utente
 * GET /api/upload/profile-image/:userId
 */
router.get('/profile-image/:userId', authenticate, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    
    const profileImageUrl = await profileImageService.getUserProfileImage(userId);
    
    if (!profileImageUrl) {
      return res.status(404).json(
        ResponseFormatter.error('Foto profilo non trovata', 'NOT_FOUND')
      );
    }

    return res.json(ResponseFormatter.success({
      profileImageUrl
    }));

  } catch (error: any) {
    logger.error('Get profile image error:', error);
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero della foto profilo',
        'GET_ERROR'
      )
    );
  }
});

/**
 * Rimuovi foto profilo
 * DELETE /api/upload/profile-image
 */
router.delete('/profile-image', authenticate, async (req: any, res: Response) => {
  try {
    await profileImageService.removeProfileImage(req.user.id);
    
    logger.info(`Profile image removed for user ${req.user.id}`);

    return res.json(ResponseFormatter.success(
      null, 
      'Foto profilo rimossa con successo'
    ));

  } catch (error: any) {
    logger.error('Remove profile image error:', error);
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nella rimozione della foto profilo',
        'DELETE_ERROR'
      )
    );
  }
});

/**
 * Verifica se l'utente ha una foto profilo (per professionisti)
 * GET /api/upload/check-profile-image
 */
router.get('/check-profile-image', authenticate, async (req: any, res: Response) => {
  try {
    const profileImageUrl = await profileImageService.getUserProfileImage(req.user.id);
    
    const hasProfileImage = !!profileImageUrl;
    const isRequired = req.user.role === 'PROFESSIONAL'; // Obbligatoria solo per professionisti

    return res.json(ResponseFormatter.success({
      hasProfileImage,
      isRequired,
      profileImageUrl,
      message: hasProfileImage 
        ? 'Foto profilo presente' 
        : (isRequired ? 'Foto profilo richiesta per i professionisti' : 'Foto profilo opzionale')
    }));

  } catch (error: any) {
    logger.error('Check profile image error:', error);
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel controllo della foto profilo',
        'CHECK_ERROR'
      )
    );
  }
});

// ============================================
// ROUTE ESISTENTI PER ADMIN (UPLOAD GENERALE)
// ============================================

// Upload immagine generale (solo admin)
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

// Elimina immagine generale (solo admin)
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
