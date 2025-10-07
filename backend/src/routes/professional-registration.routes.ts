import express from 'express';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import logger from '../utils/logger';
import { auditLogger } from '../middleware/auditLogger';
import { OccasionalWorkerService } from '../services/occasional-worker.service';

const router = express.Router();

// Configurazione upload documenti
const storage = multer.diskStorage({
  destination: 'uploads/documents/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Schema validazione registrazione professionista
const registerProfessionalSchema = z.object({
  registrationType: z.enum(['occasional', 'individual', 'company']),
  activityType: z.enum(['OCCASIONAL', 'INDIVIDUAL', 'COMPANY']),
  
  // Dati personali (tutti)
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  personalFiscalCode: z.string().length(16).toUpperCase(),
  email: z.string().email(),
  personalPhone: z.string().min(10),
  password: z.string().min(8),
  
  // Indirizzo personale
  personalAddress: z.string().optional(),
  personalCity: z.string().min(2),
  personalProvince: z.string().length(2).toUpperCase(),
  personalPostalCode: z.string().length(5).optional(),
  
  // Professione
  professionId: z.string(),
  yearsExperience: z.string().optional(),
  
  // Dati fiscali (non per occasional)
  vatNumber: z.string().length(11).optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email().optional(),
  pec: z.string().email().optional(),
  sdiCode: z.string().max(7).optional(),
  
  // Dati azienda (solo company)
  businessName: z.string().optional(),
  companyFiscalCode: z.string().length(16).optional(),
  companyRole: z.enum(['OWNER', 'EMPLOYEE', 'COLLABORATOR']).optional(),
  
  // Sedi
  legalAddress: z.string().optional(),
  legalCity: z.string().optional(),
  legalProvince: z.string().length(2).optional(),
  legalPostalCode: z.string().length(5).optional(),
  
  hasOperativeAddress: z.string().optional(),
  operativeAddress: z.string().optional(),
  operativeCity: z.string().optional(),
  operativeProvince: z.string().length(2).optional(),
  operativePostalCode: z.string().length(5).optional(),
});

/**
 * POST /api/auth/register-professional
 * Registrazione completa professionista (3 tipi)
 */
router.post('/register-professional',
  upload.fields([
    { name: 'identityDocument', maxCount: 1 },
    { name: 'vatCertificate', maxCount: 1 },
    { name: 'chamberOfCommerce', maxCount: 1 }
  ]),
  auditLogger('PROFESSIONAL_REGISTRATION'),
  async (req, res) => {
    try {
      // Parse e valida dati
      const data = registerProfessionalSchema.parse(req.body);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Verifica unicità email
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email }
      });
      if (existingEmail) {
        return res.status(400).json(
          ResponseFormatter.error('Email già registrata', 'EMAIL_EXISTS')
        );
      }
      
      // Verifica unicità CF
      const existingCF = await prisma.user.findFirst({
        where: { personalFiscalCode: data.personalFiscalCode }
      });
      if (existingCF) {
        return res.status(400).json(
          ResponseFormatter.error('Codice Fiscale già registrato', 'CF_EXISTS')
        );
      }
      
      // Verifica unicità P.IVA (se presente)
      if (data.vatNumber) {
        const existingVAT = await prisma.user.findFirst({
          where: { vatNumber: data.vatNumber }
        });
        if (existingVAT) {
          return res.status(400).json(
            ResponseFormatter.error('Partita IVA già registrata', 'VAT_EXISTS')
          );
        }
      }
      
      // 1. LAVORATORE OCCASIONALE
      if (data.registrationType === 'occasional') {
        const user = await OccasionalWorkerService.register({
          firstName: data.firstName,
          lastName: data.lastName,
          personalFiscalCode: data.personalFiscalCode,
          email: data.email,
          personalPhone: data.personalPhone,
          password: data.password,
          personalAddress: data.personalAddress || '',
          personalCity: data.personalCity,
          personalProvince: data.personalProvince,
          personalPostalCode: data.personalPostalCode || '',
          professionId: data.professionId,
          yearsExperience: data.yearsExperience
        });
        
        // Salva documento identità
        if (files.identityDocument) {
          await prisma.document.create({
            data: {
              userId: user.id,
              type: 'IDENTITY',
              fileName: files.identityDocument[0].filename,
              filePath: files.identityDocument[0].path,
              fileSize: files.identityDocument[0].size,
              mimeType: files.identityDocument[0].mimetype
            }
          });
        }
        
        logger.info(`Occasional worker registered: ${user.email}`);
        
        return res.status(201).json(
          ResponseFormatter.success(
            { userId: user.id },
            'Registrazione lavoratore occasionale completata. Un amministratore verificherà la tua richiesta.'
          )
        );
      }
      
      // 2. DITTA INDIVIDUALE
      if (data.registrationType === 'individual') {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        const user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              password: hashedPassword,
              personalFiscalCode: data.personalFiscalCode,
              personalPhone: data.personalPhone,
              
              // Indirizzo personale
              personalAddress: data.personalAddress,
              personalCity: data.personalCity,
              personalProvince: data.personalProvince,
              personalPostalCode: data.personalPostalCode,
              
              // Dati fiscali
              vatNumber: data.vatNumber!,
              companyPhone: data.companyPhone,
              companyEmail: data.companyEmail,
              pec: data.pec,
              sdiCode: data.sdiCode,
              
              // Sede (usa personale se non specificato)
              legalAddress: data.legalAddress || data.personalAddress,
              legalCity: data.legalCity || data.personalCity,
              legalProvince: data.legalProvince || data.personalProvince,
              legalPostalCode: data.legalPostalCode || data.personalPostalCode,
              
              // Professione
              professionId: data.professionId,
              yearsExperience: data.yearsExperience,
              
              // Tipo e stato
              activityType: 'INDIVIDUAL',
              role: 'PROFESSIONAL',
              isActive: false,
              isApproved: false,
              approvalStatus: 'PENDING'
            }
          });
          
          // Crea visibilità contatti
          await tx.contactVisibility.create({
            data: {
              userId: newUser.id,
              showPersonalPhone: false,
              showCompanyPhone: true,
              showPersonalEmail: false,
              showCompanyEmail: true,
              showPec: false,
              showPersonalAddress: false,
              showBusinessAddress: true
            }
          });
          
          // Notifica admin
          await tx.notification.create({
            data: {
              userId: newUser.id,
              title: 'Nuova ditta individuale registrata',
              message: `${newUser.firstName} ${newUser.lastName} si è registrato come ditta individuale`,
              type: 'REGISTRATION',
              severity: 'INFO'
            }
          });
          
          return newUser;
        });
        
        // Salva documenti
        if (files.identityDocument) {
          await prisma.document.create({
            data: {
              userId: user.id,
              type: 'IDENTITY',
              fileName: files.identityDocument[0].filename,
              filePath: files.identityDocument[0].path,
              fileSize: files.identityDocument[0].size,
              mimeType: files.identityDocument[0].mimetype
            }
          });
        }
        
        if (files.vatCertificate) {
          await prisma.document.create({
            data: {
              userId: user.id,
              type: 'VAT_CERTIFICATE',
              fileName: files.vatCertificate[0].filename,
              filePath: files.vatCertificate[0].path,
              fileSize: files.vatCertificate[0].size,
              mimeType: files.vatCertificate[0].mimetype
            }
          });
        }
        
        logger.info(`Individual professional registered: ${user.email}`);
        
        return res.status(201).json(
          ResponseFormatter.success(
            { userId: user.id },
            'Registrazione ditta individuale completata. Un amministratore verificherà la tua richiesta.'
          )
        );
      }
      
      // 3. SOCIETÀ
      if (data.registrationType === 'company') {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        const result = await prisma.$transaction(async (tx) => {
          // Crea azienda
          const company = await tx.company.create({
            data: {
              businessName: data.businessName!,
              vatNumber: data.vatNumber!,
              companyFiscalCode: data.companyFiscalCode || data.vatNumber!,
              
              // Contatti aziendali
              companyPhone: data.companyPhone!,
              companyEmail: data.companyEmail!,
              pec: data.pec,
              sdiCode: data.sdiCode,
              
              // Sede legale
              legalAddress: data.legalAddress!,
              legalCity: data.legalCity!,
              legalProvince: data.legalProvince!,
              legalPostalCode: data.legalPostalCode!,
              
              // Sede operativa
              hasOperativeAddress: data.hasOperativeAddress === 'true',
              operativeAddress: data.operativeAddress,
              operativeCity: data.operativeCity,
              operativeProvince: data.operativeProvince,
              operativePostalCode: data.operativePostalCode,
              
              isActive: false,
              isApproved: false
            }
          });
          
          // Crea utente (titolare/admin)
          const user = await tx.user.create({
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              password: hashedPassword,
              personalFiscalCode: data.personalFiscalCode,
              personalPhone: data.personalPhone,
              
              // Indirizzo personale
              personalAddress: data.personalAddress,
              personalCity: data.personalCity,
              personalProvince: data.personalProvince,
              personalPostalCode: data.personalPostalCode,
              
              // Riferimento azienda
              companyId: company.id,
              companyRole: data.companyRole || 'OWNER',
              
              // Professione
              professionId: data.professionId,
              yearsExperience: data.yearsExperience,
              
              // Tipo e stato
              activityType: 'COMPANY',
              role: 'PROFESSIONAL',
              isActive: false,
              isApproved: false,
              approvalStatus: 'PENDING'
            }
          });
          
          // Se è owner, aggiorna azienda
          if (data.companyRole === 'OWNER' || !data.companyRole) {
            await tx.company.update({
              where: { id: company.id },
              data: { ownerId: user.id }
            });
            
            // Crea permessi completi per owner
            await tx.companyPermission.create({
              data: {
                companyId: company.id,
                userId: user.id,
                canViewAllRequests: true,
                canAssignRequests: true,
                canCreateQuotes: true,
                canEditQuotes: true,
                canApproveQuotes: true,
                canManageTeam: true,
                canGenerateCodes: true,
                canViewReports: true,
                canManageServices: true,
                canManagePricing: true,
                canManageDocuments: true,
                canViewFinancials: true,
                canMessageAllClients: true,
                canManageReviews: true
              }
            });
          }
          
          // Crea visibilità contatti
          await tx.contactVisibility.create({
            data: {
              userId: user.id,
              showPersonalPhone: false,
              showCompanyPhone: true,
              showPersonalEmail: false,
              showCompanyEmail: true,
              showPec: false,
              showPersonalAddress: false,
              showBusinessAddress: true
            }
          });
          
          // Notifica admin
          await tx.notification.create({
            data: {
              userId: user.id,
              title: 'Nuova società registrata',
              message: `${company.businessName} si è registrata (referente: ${user.firstName} ${user.lastName})`,
              type: 'REGISTRATION',
              severity: 'INFO'
            }
          });
          
          return { user, company };
        });
        
        // Salva documenti
        if (files.identityDocument) {
          await prisma.document.create({
            data: {
              userId: result.user.id,
              type: 'IDENTITY',
              fileName: files.identityDocument[0].filename,
              filePath: files.identityDocument[0].path,
              fileSize: files.identityDocument[0].size,
              mimeType: files.identityDocument[0].mimetype
            }
          });
        }
        
        if (files.vatCertificate) {
          await prisma.document.create({
            data: {
              userId: result.user.id,
              companyId: result.company.id,
              type: 'VAT_CERTIFICATE',
              fileName: files.vatCertificate[0].filename,
              filePath: files.vatCertificate[0].path,
              fileSize: files.vatCertificate[0].size,
              mimeType: files.vatCertificate[0].mimetype
            }
          });
        }
        
        if (files.chamberOfCommerce) {
          await prisma.document.create({
            data: {
              userId: result.user.id,
              companyId: result.company.id,
              type: 'CHAMBER_OF_COMMERCE',
              fileName: files.chamberOfCommerce[0].filename,
              filePath: files.chamberOfCommerce[0].path,
              fileSize: files.chamberOfCommerce[0].size,
              mimeType: files.chamberOfCommerce[0].mimetype
            }
          });
        }
        
        logger.info(`Company registered: ${result.company.businessName} (owner: ${result.user.email})`);
        
        return res.status(201).json(
          ResponseFormatter.success(
            { 
              userId: result.user.id,
              companyId: result.company.id
            },
            'Registrazione società completata. Un amministratore verificherà la tua richiesta.'
          )
        );
      }
      
      // Non dovrebbe mai arrivare qui
      return res.status(400).json(
        ResponseFormatter.error('Tipo registrazione non valido', 'INVALID_TYPE')
      );
      
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(
          ResponseFormatter.error(
            'Dati non validi',
            'VALIDATION_ERROR',
            error.errors
          )
        );
      }
      
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore durante la registrazione',
          'REGISTRATION_ERROR'
        )
      );
    }
  }
);

/**
 * GET /api/auth/check-availability
 * Verifica disponibilità in real-time
 */
router.get('/check-availability',
  async (req, res) => {
    try {
      const { field, value } = req.query;
      
      if (!field || !value) {
        return res.status(400).json(
          ResponseFormatter.error('Field e value richiesti', 'PARAMS_REQUIRED')
        );
      }
      
      let exists = false;
      
      switch (field) {
        case 'email':
          const emailUser = await prisma.user.findUnique({
            where: { email: value as string }
          });
          exists = !!emailUser;
          break;
          
        case 'personalFiscalCode':
          const cfUser = await prisma.user.findFirst({
            where: { personalFiscalCode: value as string }
          });
          exists = !!cfUser;
          break;
          
        case 'vatNumber':
          const vatUser = await prisma.user.findFirst({
            where: { vatNumber: value as string }
          });
          const vatCompany = await prisma.company.findFirst({
            where: { vatNumber: value as string }
          });
          exists = !!vatUser || !!vatCompany;
          break;
          
        case 'businessName':
          const company = await prisma.company.findFirst({
            where: { businessName: value as string }
          });
          exists = !!company;
          break;
          
        default:
          return res.status(400).json(
            ResponseFormatter.error('Campo non valido', 'INVALID_FIELD')
          );
      }
      
      return res.json(
        ResponseFormatter.success(
          { available: !exists },
          exists ? `${field} già in uso` : `${field} disponibile`
        )
      );
      
    } catch (error) {
      logger.error('Check availability error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore verifica disponibilità', 'CHECK_ERROR')
      );
    }
  }
);

export default router;
