import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Configurazione tipi file permessi
const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

// Limiti dimensione file
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

// Configurazione storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = path.join(process.cwd(), '..', 'uploads', 'attachments');
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES] || path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});

// Validazione file
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo di file non supportato: ${file.mimetype}. Tipi permessi: JPG, PNG, GIF, PDF, DOC, DOCX`));
  }
};

// Configurazione Multer
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

// Middleware per upload singolo
export const uploadSingle = uploadConfig.single('file');

// Middleware per upload multiplo
export const uploadMultiple = uploadConfig.array('files', MAX_FILES);

// Middleware per gestione errori upload
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File troppo grande. Dimensione massima: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Troppi file. Massimo ${MAX_FILES} file per richiesta`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo file non valido'
      });
    }
  }
  
  if (err?.message?.includes('Tipo di file non supportato')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Funzione helper per validare dimensione immagine
export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

// Costanti esportate per uso in altri moduli
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_TYPES: Object.keys(ALLOWED_FILE_TYPES)
};
