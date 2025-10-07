import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads with hierarchical structure
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Struttura semplificata: uploads/kb-documents/{category-slug}/{subcategory-slug}/
    // Questo mantiene tutti i documenti di una sottocategoria insieme
    
    const subcategoryId = req.body.subcategoryId || 'general';
    let categorySlug = 'uncategorized';
    let subcategorySlug = 'general';
    
    // Get subcategory and category info if subcategoryId is provided
    if (subcategoryId && subcategoryId !== 'general') {
      try {
        const subcategory = await prisma.subcategory.findUnique({
          where: { id: subcategoryId },
          include: { category: true }
        });
        
        if (subcategory) {
          // Use slugs for folder names (more readable and URL-safe)
          categorySlug = subcategory.category.slug || subcategory.category.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          subcategorySlug = subcategory.slug || subcategory.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          // Store info for later use
          (req as any).categoryInfo = {
            categoryId: subcategory.categoryId,
            categoryName: subcategory.category.name,
            categorySlug,
            subcategoryName: subcategory.name,
            subcategorySlug
          };
        }
      } catch (error) {
        console.error('Error fetching subcategory info:', error);
      }
    }
    
    // Create hierarchical path without date folders
    const uploadDir = path.join(
      process.cwd(), 
      'uploads', 
      'kb-documents',
      categorySlug,
      subcategorySlug
    );
    
    try {
      // Create directory structure if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Store the directory path for later use
      (req as any).uploadDir = uploadDir;
      
      console.log(`📁 Creating upload directory: ${uploadDir}`);
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Create filename with timestamp for uniqueness but keep original name readable
    const timestamp = Date.now();
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .toLowerCase();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(sanitizedName, ext).substring(0, 50); // Limit name length
    
    // Format: {originalname}_{timestamp}{ext}
    // This keeps files readable while ensuring uniqueness
    cb(null, `${nameWithoutExt}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|md/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.'));
    }
  }
});

// POST /api/kb-documents/upload - Upload a new KB document
router.post(
  '/upload',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const { subcategoryId } = req.body;
      
      // Get subcategory with category info if subcategoryId is provided
      let categoryId = 'uncategorized';
      let categoryName = 'General';
      
      if (subcategoryId) {
        const subcategory = await prisma.subcategory.findUnique({
          where: { id: subcategoryId },
          include: { category: true }
        });
        
        if (subcategory) {
          categoryId = subcategory.categoryId;
          categoryName = subcategory.category.name;
          // Add category info to request for multer
          req.body.categoryId = categoryId;
        }
      }
      
      // Now proceed with file upload
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json(ResponseFormatter.error(
            err.message || 'File upload failed',
            'UPLOAD_ERROR'
          ));
        }
        
        if (!req.file) {
          return res.status(400).json(ResponseFormatter.error(
            'No file uploaded',
            'NO_FILE'
          ));
        }

        const file = req.file;
        const categoryInfo = (req as any).categoryInfo || {
          categoryId: 'uncategorized',
          categoryName: 'General',
          categorySlug: 'uncategorized',
          subcategoryName: 'General',
          subcategorySlug: 'general'
        };
        
        // Create relative path for storage (from uploads directory)
        const relativePath = path.relative(
          path.join(process.cwd(), 'uploads'),
          file.path
        );

        // Create document record
        const document = await prisma.knowledgeBaseDocument.create({
          data: {
            title: file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension
            description: `Documento per ${categoryInfo.categoryName} - ${categoryInfo.subcategoryName}`,
            documentType: 'manual',
            Category: categoryInfo.categoryId,
            subcategoryIds: subcategoryId ? [subcategoryId] : [],
            filePath: relativePath, // Store relative path
            content: '', // Will be populated by processing job
            language: 'it',
            tags: [
              categoryInfo.categorySlug,
              categoryInfo.subcategorySlug,
              path.extname(file.originalname).substring(1).toLowerCase() // file type without dot
            ],
            isActive: true,
            uploadedById: (req.user as any).id,
            metadata: {
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              Category: categoryInfo.categoryName,
              SubCategory: categoryInfo.subcategoryName,
              uploadPath: relativePath,
              timestamp: new Date().toISOString()
            }
          }
        });

        // Log the upload for tracking
        console.log(`✅ KB Document uploaded successfully:`, {
          id: document.id,
          title: document.title,
          path: `${categoryInfo.categorySlug}/${categoryInfo.subcategorySlug}/${file.filename}`,
          size: `${(file.size / 1024).toFixed(2)} KB`
        });

        res.json(ResponseFormatter.success({
          id: document.id,
          title: document.title,
          fileName: file.originalname,
          fileSize: file.size,
          Category: categoryInfo.categoryName,
          SubCategory: categoryInfo.subcategoryName,
          uploadedAt: document.createdAt,
          path: relativePath
        }, 'Document uploaded successfully'));
      });
    } catch (error) {
      console.error('Upload error:', error);
      next(error);
    }
  }
);

// GET /api/kb-documents - Get all KB documents
router.get(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const { subcategoryId, professionalId } = req.query;
      
      let where: any = {
        isActive: true
      };

      if (subcategoryId) {
        // Per cercare in un JSON array, usiamo il raw SQL con Prisma
        // Il campo subcategoryIds è un array JSON, quindi cerchiamo se contiene l'ID
        const documents = await prisma.$queryRaw`
          SELECT id, title, description, "documentType", category, language, tags, "createdAt", "uploadedById"
          FROM "KnowledgeBaseDocument"
          WHERE "isActive" = true 
          AND ("subcategoryIds"::jsonb @> ${JSON.stringify([subcategoryId])}::jsonb OR "subcategoryIds"::jsonb = '[]'::jsonb)
          ORDER BY "createdAt" DESC
        `;
        
        res.json(ResponseFormatter.success(documents, 'Documents retrieved successfully'));
        return;
      }

      // Se non c'è subcategoryId, query normale
      const documents = await prisma.knowledgeBaseDocument.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          documentType: true,
          category: true,
          language: true,
          tags: true,
          createdAt: true,
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(ResponseFormatter.success(documents, 'Documents retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/kb-documents/:id - Delete a KB document
router.delete(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Get document to delete file
      const document = await prisma.knowledgeBaseDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json(ResponseFormatter.error(
          'Document not found',
          'NOT_FOUND'
        ));
      }

      // Delete file from filesystem
      if (document.filePath) {
        try {
          await fs.unlink(document.filePath);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      // Delete from database
      await prisma.knowledgeBaseDocument.delete({
        where: { id }
      });

      res.json(ResponseFormatter.success(null, 'Document deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/kb-documents/stats - Get storage statistics
router.get(
  '/stats',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const baseDir = path.join(process.cwd(), 'uploads', 'kb-documents');
      
      // Get total documents count
      const totalDocs = await prisma.knowledgeBaseDocument.count();
      
      // Get documents by category
      const docsByCategory = await prisma.knowledgeBaseDocument.groupBy({
        by: ['category'],
        _count: {
          id: true
        }
      });
      
      // Calculate directory sizes (simplified version)
      let totalSize = 0;
      const documents = await prisma.knowledgeBaseDocument.findMany({
        where: { isActive: true }
      });
      
      for (const doc of documents) {
        if (doc.metadata && (doc.metadata as any).size) {
          totalSize += (doc.metadata as any).size;
        }
      }
      
      res.json(ResponseFormatter.success({
        totalDocuments: totalDocs,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        documentsByCategory: docsByCategory,
        storageStructure: {
          pattern: 'uploads/kb-documents/{category-slug}/{subcategory-slug}/{filename}',
          example: 'uploads/kb-documents/elettricista/riparazione-impianti/manuale_sicurezza_1735628400.pdf',
          benefits: [
            'Tutti i documenti di una sottocategoria sono insieme',
            'Facile navigazione e backup per categoria',
            'Nomi file leggibili con timestamp per unicità',
            'Struttura semplice e intuitiva'
          ]
        }
      }, 'Storage statistics retrieved'));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/kb-documents/cleanup - Clean up orphaned files
router.delete(
  '/cleanup',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const { dryRun = true } = req.query;
      const baseDir = path.join(process.cwd(), 'uploads', 'kb-documents');
      
      // Get all file paths from database
      const dbDocuments = await prisma.knowledgeBaseDocument.findMany({
        select: { filePath: true }
      });
      
      const dbPaths = new Set(dbDocuments.map(d => d.filePath));
      const orphanedFiles: string[] = [];
      let deletedCount = 0;
      
      // Function to recursively check directories
      const checkDirectory = async (dir: string) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              await checkDirectory(fullPath);
            } else if (entry.isFile()) {
              const relativePath = path.relative(
                path.join(process.cwd(), 'uploads'),
                fullPath
              );
              
              if (!dbPaths.has(relativePath)) {
                orphanedFiles.push(relativePath);
                
                if (dryRun === 'false') {
                  await fs.unlink(fullPath);
                  deletedCount++;
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error checking directory ${dir}:`, error);
        }
      };
      
      // Start checking from base directory
      await checkDirectory(baseDir).catch(() => {
        console.log('KB documents directory does not exist yet');
      });
      
      res.json(ResponseFormatter.success({
        orphanedFiles,
        count: orphanedFiles.length,
        deletedCount: dryRun === 'false' ? deletedCount : 0,
        dryRun: dryRun !== 'false',
        message: dryRun !== 'false' 
          ? 'Dry run completed. No files were deleted.' 
          : `Cleanup completed. ${deletedCount} files deleted.`
      }, 'Cleanup completed'));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
