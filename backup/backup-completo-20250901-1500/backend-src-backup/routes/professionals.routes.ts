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

// Configure multer for professional KB uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Struttura: uploads/professional-kb/{professional-id}/{subcategory-slug}/
    const professionalId = req.params.professionalId || req.body.professionalId;
    const subcategoryId = req.body.subcategoryId || 'general';
    
    let subcategorySlug = 'general';
    
    // Get subcategory info if provided
    if (subcategoryId && subcategoryId !== 'general') {
      try {
        const subcategory = await prisma.subcategory.findUnique({
          where: { id: subcategoryId }
        });
        
        if (subcategory) {
          subcategorySlug = subcategory.slug || subcategory.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        }
      } catch (error) {
        console.error('Error fetching subcategory:', error);
      }
    }
    
    const uploadDir = path.join(
      process.cwd(), 
      'uploads', 
      'professional-kb',
      professionalId,
      subcategorySlug
    );
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      (req as any).uploadDir = uploadDir;
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(sanitizedName, ext).substring(0, 50);
    
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

// GET /api/professionals/:professionalId/ai-settings - Get AI settings with subcategories
router.get(
  '/:professionalId/ai-settings',
  authenticate,
  async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const requestingUser = req.user as any;
      
      // Check if user is authorized (self or admin)
      if (requestingUser.id !== professionalId && 
          requestingUser.role !== 'ADMIN' && 
          requestingUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error(
          'Not authorized to view these settings',
          'FORBIDDEN'
        ));
      }

      // Get professional's subcategories with AI customizations
      const subcategories = await prisma.professionalUserSubcategory.findMany({
        where: {
          userId: professionalId,
          isActive: true
        },
        include: {
          Subcategory: {
            include: {
              Category: true,
              SubcategoryAiSettings: true
            }
          }
        }
      });

      // Get AI customizations for each subcategory
      const result = await Promise.all(subcategories.map(async (sub) => {
        const customization = await prisma.professionalAiCustomization.findUnique({
          where: {
            professionalId_subcategoryId: {
              professionalId,
              subcategoryId: sub.subcategoryId
            }
          }
        });

        // Get KB documents for this professional-subcategory combination
        const kbDocuments = await prisma.knowledgeBaseDocument.findMany({
          where: {
            uploadedById: professionalId,
            subcategoryIds: {
              has: sub.subcategoryId
            },
            metadata: {
              path: ['professional'],
              equals: true
            }
          },
          select: {
            id: true,
            title: true,
            filePath: true,
            createdAt: true
          }
        });

        return {
          subcategoryId: sub.subcategoryId,
          subcategory: sub.Subcategory,
          experienceYears: sub.experienceYears,
          certifications: sub.certifications,
          customization: customization ? {
            ...customization,
            kbDocuments: kbDocuments.map(doc => ({
              id: doc.id,
              title: doc.title,
              fileName: path.basename(doc.filePath || ''),
              fileSize: 0, // Would need to get from filesystem
              uploadedAt: doc.createdAt
            }))
          } : null
        };
      }));

      res.json(ResponseFormatter.success(result, 'AI settings retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/professionals/:professionalId/ai-settings/:subcategoryId - Save AI customization
router.post(
  '/:professionalId/ai-settings/:subcategoryId',
  authenticate,
  async (req, res, next) => {
    try {
      const { professionalId, subcategoryId } = req.params;
      const requestingUser = req.user as any;
      
      // Check if user is authorized (self or admin)
      if (requestingUser.id !== professionalId && 
          requestingUser.role !== 'ADMIN' && 
          requestingUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error(
          'Not authorized to modify these settings',
          'FORBIDDEN'
        ));
      }

      // Get the subcategory AI settings
      const subcategoryAiSettings = await prisma.subcategoryAiSettings.findUnique({
        where: { subcategoryId }
      });

      if (!subcategoryAiSettings) {
        return res.status(404).json(ResponseFormatter.error(
          'Subcategory AI settings not found. Configure subcategory AI first.',
          'NOT_FOUND'
        ));
      }

      const data = {
        professionalId,
        subcategoryId,
        settingsId: subcategoryAiSettings.id,
        customSystemPrompt: req.body.customSystemPrompt || null,
        customKnowledgeBase: req.body.customKnowledgeBase || null,
        customTone: req.body.customTone || null,
        customInitialMessage: req.body.customInitialMessage || null,
        customTemperature: req.body.customTemperature || null,
        customMaxTokens: req.body.customMaxTokens || null,
        preferredExamples: req.body.preferredExamples || null,
        avoidTopics: req.body.avoidTopics || null,
        specializations: req.body.specializations || null,
        isActive: req.body.isActive ?? true
      };

      // Upsert the customization
      const customization = await prisma.professionalAiCustomization.upsert({
        where: {
          professionalId_subcategoryId: {
            professionalId,
            subcategoryId
          }
        },
        update: data,
        create: data
      });

      res.json(ResponseFormatter.success(customization, 'AI customization saved successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/professionals/:professionalId/kb-documents/upload - Upload KB document for professional
router.post(
  '/:professionalId/kb-documents/upload',
  authenticate,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const { subcategoryId } = req.body;
      const requestingUser = req.user as any;
      
      // Check if user is authorized (self or admin)
      if (requestingUser.id !== professionalId && 
          requestingUser.role !== 'ADMIN' && 
          requestingUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error(
          'Not authorized to upload documents',
          'FORBIDDEN'
        ));
      }

      if (!req.file) {
        return res.status(400).json(ResponseFormatter.error(
          'No file uploaded',
          'NO_FILE'
        ));
      }

      const file = req.file;
      
      // Create relative path for storage
      const relativePath = path.relative(
        path.join(process.cwd(), 'uploads'),
        file.path
      );

      // Create document record
      const document = await prisma.knowledgeBaseDocument.create({
        data: {
          title: file.originalname.replace(/\.[^/.]+$/, ''),
          description: `Professional KB document for ${professionalId}`,
          documentType: 'professional',
          category: subcategoryId || 'general',
          subcategoryIds: subcategoryId ? [subcategoryId] : [],
          filePath: relativePath,
          content: '', // Will be populated by processing job
          language: 'it',
          tags: [
            'professional',
            professionalId,
            subcategoryId || 'general',
            path.extname(file.originalname).substring(1).toLowerCase()
          ],
          isActive: true,
          uploadedById: professionalId,
          metadata: {
            professional: true,
            professionalId,
            subcategoryId,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadPath: relativePath,
            timestamp: new Date().toISOString()
          }
        }
      });

      res.json(ResponseFormatter.success({
        id: document.id,
        title: document.title,
        fileName: file.originalname,
        fileSize: file.size,
        uploadedAt: document.createdAt
      }, 'Document uploaded successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/professionals/:professionalId/kb-documents/:documentId - Delete KB document
router.delete(
  '/:professionalId/kb-documents/:documentId',
  authenticate,
  async (req, res, next) => {
    try {
      const { professionalId, documentId } = req.params;
      const requestingUser = req.user as any;
      
      // Check if user is authorized (self or admin)
      if (requestingUser.id !== professionalId && 
          requestingUser.role !== 'ADMIN' && 
          requestingUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error(
          'Not authorized to delete documents',
          'FORBIDDEN'
        ));
      }

      // Get document to delete file
      const document = await prisma.knowledgeBaseDocument.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        return res.status(404).json(ResponseFormatter.error(
          'Document not found',
          'NOT_FOUND'
        ));
      }

      // Verify document belongs to this professional
      if (document.uploadedById !== professionalId) {
        return res.status(403).json(ResponseFormatter.error(
          'Document does not belong to this professional',
          'FORBIDDEN'
        ));
      }

      // Delete file from filesystem
      if (document.filePath) {
        const fullPath = path.join(process.cwd(), 'uploads', document.filePath);
        try {
          await fs.unlink(fullPath);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      // Delete from database
      await prisma.knowledgeBaseDocument.delete({
        where: { id: documentId }
      });

      res.json(ResponseFormatter.success(null, 'Document deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
