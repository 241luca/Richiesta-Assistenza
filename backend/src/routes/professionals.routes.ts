import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { professionalStatsService } from '../services/professional-stats.service';
import { Prisma } from '@prisma/client';

const router = Router();

// ==================== TIPI ====================

// Interfaccia per req.user esteso dall'autenticazione
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    email: string;
  };
}

// ==================== MIDDLEWARE ====================

// Middleware per verificare se l'utente è admin o il professionista stesso
const canAccessProfessional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { professionalId } = req.params;
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const userRole = authReq.user.role;

  // Admin può accedere a tutto
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    return next();
  }

  // Il professionista può accedere solo ai propri dati
  if (userRole === 'PROFESSIONAL' && userId === professionalId) {
    return next();
  }

  return res.status(403).json(
    ResponseFormatter.error(
      'Non autorizzato ad accedere a questi dati',
      'FORBIDDEN'
    )
  );
};

// ==================== STATISTICHE PROFESSIONISTA ====================

// GET /professionals/:professionalId/stats
router.get(
  '/:professionalId/stats',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;

      logger.info(`Fetching stats for professional: ${professionalId}`);

      const stats = await professionalStatsService.getStats(professionalId);

      return res.json(
        ResponseFormatter.success(stats, 'Statistiche recuperate con successo')
      );
    } catch (error) {
      logger.error('Error fetching professional stats:', error);

      if (
        error instanceof Error &&
        error.message === 'Professionista non trovato'
      ) {
        return res
          .status(404)
          .json(
            ResponseFormatter.error(
              'Professionista non trovato',
              'PROFESSIONAL_NOT_FOUND'
            )
          );
      }

      return res
        .status(500)
        .json(
          ResponseFormatter.error(
            'Errore nel recupero delle statistiche',
            'STATS_ERROR'
          )
        );
    }
  }
);

// GET /professionals/:professionalId/stats/quick
router.get(
  '/:professionalId/stats/quick',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;

      const quickStats =
        await professionalStatsService.getQuickStats(professionalId);

      return res.json(
        ResponseFormatter.success(quickStats, 'Statistiche rapide recuperate')
      );
    } catch (error) {
      logger.error('Error fetching quick stats:', error);
      return res
        .status(500)
        .json(
          ResponseFormatter.error(
            'Errore nel recupero statistiche rapide',
            'QUICK_STATS_ERROR'
          )
        );
    }
  }
);

// ==================== PRICING/TARIFFE ====================

const pricingSchema = z.object({
  hourlyRate: z.number().min(0),
  minimumRate: z.number().min(0),
  costPerKm: z.number().min(0),
  freeKm: z.number().min(0),
  supplements: z.object({
    weekend: z.number().min(0),
    notturno: z.number().min(0),
    festivo: z.number().min(0),
    urgente: z.number().min(0),
  }),
});

// GET /professionals/:professionalId/pricing
router.get(
  '/:professionalId/pricing',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;

      // Cerca le tariffe esistenti
      let pricing = await prisma.professionalPricing.findUnique({
        where: { userId: professionalId },
      });

      // Se non esistono, crea valori di default
      if (!pricing) {
        pricing = await prisma.professionalPricing.create({
          data: {
            id: `pp_${professionalId}_${Date.now()}`,
            user: { connect: { id: professionalId } },
            hourlyRate: 50.0,
            minimumRate: 30.0,
            costPerKm: 0.5,
            freeKm: 10,
            supplements: {
              weekend: 20,
              notturno: 30,
              festivo: 50,
              urgente: 30,
            },
            updatedAt: new Date(),
          },
        });
      }

      return res.json(ResponseFormatter.success(pricing));
    } catch (error) {
      logger.error('Error fetching pricing:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nel recupero tariffe'));
    }
  }
);

// PUT /professionals/:professionalId/pricing
router.put(
  '/:professionalId/pricing',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;
      const validatedData = pricingSchema.parse(req.body);

      const pricing = await prisma.professionalPricing.upsert({
        where: { userId: professionalId },
        update: validatedData,
        create: {
          id: `pp_${professionalId}_${Date.now()}`,
          user: { connect: { id: professionalId } },
          ...validatedData,
          updatedAt: new Date(),
        },
      });

      return res.json(
        ResponseFormatter.success(pricing, 'Tariffe aggiornate con successo')
      );
    } catch (error) {
      logger.error('Error updating pricing:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error("Errore nell'aggiornamento tariffe"));
    }
  }
);

// ==================== AI SETTINGS ====================

const aiSettingsSchema = z.object({
  modelName: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(100).max(4000),
  responseStyle: z.enum(['formal', 'informal', 'technical', 'educational']),
  detailLevel: z.enum(['basic', 'intermediate', 'advanced']),
  useKnowledgeBase: z.boolean(),
  systemPrompt: z.string().optional(),
});

// GET /professionals/:professionalId/ai-settings/:subcategoryId
router.get(
  '/:professionalId/ai-settings/:subcategoryId',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId, subcategoryId } = req.params;

      // Verifica che il professionista abbia questa sottocategoria
      const hasSubcategory =
        await prisma.professionalUserSubcategory.findUnique({
          where: {
            userId_subcategoryId: {
              userId: professionalId,
              subcategoryId: subcategoryId,
            },
          },
        });

      if (!hasSubcategory) {
        return res
          .status(404)
          .json(
            ResponseFormatter.error(
              'Sottocategoria non trovata per questo professionista'
            )
          );
      }

      // Cerca le impostazioni AI esistenti
      let aiSettings = await prisma.professionalAiSettings.findUnique({
        where: {
          professionalId_subcategoryId: {
            professionalId: professionalId,
            subcategoryId: subcategoryId,
          },
        },
      });

      // Se non esistono, crea valori di default
      if (!aiSettings) {
        aiSettings = await prisma.professionalAiSettings.create({
          data: {
            id: `pai_${professionalId}_${subcategoryId}`,
            professional: { connect: { id: professionalId } },
            subcategory: { connect: { id: subcategoryId } },
            modelName: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 2000,
            responseStyle: 'formal',
            detailLevel: 'intermediate',
            useKnowledgeBase: true,
            systemPrompt:
              'Sei un esperto professionista nel tuo settore. Fornisci risposte precise, professionali e utili ai clienti.',
            updatedAt: new Date(),
          },
        });
      }

      return res.json(ResponseFormatter.success(aiSettings));
    } catch (error) {
      logger.error('Error fetching AI settings:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nel recupero impostazioni AI'));
    }
  }
);

// PUT /professionals/:professionalId/ai-settings/:subcategoryId
router.put(
  '/:professionalId/ai-settings/:subcategoryId',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId, subcategoryId } = req.params;
      const validatedData = aiSettingsSchema.parse(req.body);

      logger.info('Updating AI settings:', {
        professionalId,
        subcategoryId,
        data: validatedData,
      });

      const aiSettings = await prisma.professionalAiSettings.upsert({
        where: {
          professionalId_subcategoryId: {
            professionalId: professionalId,
            subcategoryId: subcategoryId,
          },
        },
        update: validatedData,
        create: {
          id: `pai_${professionalId}_${subcategoryId}`,
          professional: { connect: { id: professionalId } },
          subcategory: { connect: { id: subcategoryId } },
          ...validatedData,
          updatedAt: new Date(),
        },
      });

      logger.info('AI settings saved:', aiSettings);

      return res.json(
        ResponseFormatter.success(
          aiSettings,
          'Impostazioni AI aggiornate con successo'
        )
      );
    } catch (error) {
      logger.error('Error updating AI settings:', error);
      return res
        .status(500)
        .json(
          ResponseFormatter.error("Errore nell'aggiornamento impostazioni AI")
        );
    }
  }
);

// ==================== SKILLS ====================

const skillSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
});

// GET /professionals/:professionalId/skills
router.get(
  '/:professionalId/skills',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;

      const skills = await prisma.professionalSkill.findMany({
        where: { userId: professionalId },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(ResponseFormatter.success(skills));
    } catch (error) {
      logger.error('Error fetching skills:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nel recupero skills'));
    }
  }
);

// POST /professionals/:professionalId/skills
router.post(
  '/:professionalId/skills',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;
      const validatedData = skillSchema.parse(req.body);

      // Verifica che non esista già una skill con lo stesso nome
      const existing = await prisma.professionalSkill.findFirst({
        where: {
          userId: professionalId,
          name: validatedData.name,
        },
      });

      if (existing) {
        return res
          .status(400)
          .json(ResponseFormatter.error('Skill già esistente'));
      }

      const skill = await prisma.professionalSkill.create({
        data: {
          id: `ps_${professionalId}_${Date.now()}`,
          user: { connect: { id: professionalId } },
          ...validatedData,
          updatedAt: new Date(),
        },
      });

      return res.json(
        ResponseFormatter.success(skill, 'Skill aggiunta con successo')
      );
    } catch (error) {
      logger.error('Error creating skill:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error("Errore nell'aggiunta skill"));
    }
  }
);

// DELETE /professionals/:professionalId/skills/:skillId
router.delete(
  '/:professionalId/skills/:skillId',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId, skillId } = req.params;

      await prisma.professionalSkill.delete({
        where: {
          id: skillId,
          userId: professionalId,
        },
      });

      return res.json(
        ResponseFormatter.success(null, 'Skill rimossa con successo')
      );
    } catch (error) {
      logger.error('Error deleting skill:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nella rimozione skill'));
    }
  }
);

// ==================== CERTIFICATIONS ====================

const certificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  validUntil: z.string().optional(),
  isVerified: z.boolean().optional(),
});

// GET /professionals/:professionalId/certifications
router.get(
  '/:professionalId/certifications',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;

      const certifications = await prisma.professionalCertification.findMany({
        where: { userId: professionalId },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(ResponseFormatter.success(certifications));
    } catch (error) {
      logger.error('Error fetching certifications:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nel recupero certificazioni'));
    }
  }
);

// POST /professionals/:professionalId/certifications
router.post(
  '/:professionalId/certifications',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId } = req.params;
      const validatedData = certificationSchema.parse(req.body);

      const certification = await prisma.professionalCertification.create({
        data: {
          id: `pc_${professionalId}_${Date.now()}`,
          user: { connect: { id: professionalId } },
          ...validatedData,
          validUntil: validatedData.validUntil
            ? new Date(validatedData.validUntil)
            : null,
          updatedAt: new Date(),
        },
      });

      return res.json(
        ResponseFormatter.success(
          certification,
          'Certificazione aggiunta con successo'
        )
      );
    } catch (error) {
      logger.error('Error creating certification:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error("Errore nell'aggiunta certificazione"));
    }
  }
);

// DELETE /professionals/:professionalId/certifications/:certId
router.delete(
  '/:professionalId/certifications/:certId',
  authenticate,
  canAccessProfessional,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId, certId } = req.params;

      await prisma.professionalCertification.delete({
        where: {
          id: certId,
          userId: professionalId,
        },
      });

      return res.json(
        ResponseFormatter.success(null, 'Certificazione rimossa con successo')
      );
    } catch (error) {
      logger.error('Error deleting certification:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nella rimozione certificazione'));
    }
  }
);

// PATCH /professionals/:professionalId/certifications/:certId/verify (Admin only)
router.patch(
  '/:professionalId/certifications/:certId/verify',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { professionalId, certId } = req.params;

      const certification = await prisma.professionalCertification.update({
        where: {
          id: certId,
          userId: professionalId,
        },
        data: {
          isVerified: true,
        },
      });

      return res.json(
        ResponseFormatter.success(certification, 'Certificazione verificata')
      );
    } catch (error) {
      logger.error('Error verifying certification:', error);
      return res
        .status(500)
        .json(
          ResponseFormatter.error('Errore nella verifica certificazione')
        );
    }
  }
);

// ==================== QUERY PROFESSIONISTI ====================

// GET /professionals/by-subcategory/:subcategoryId
router.get(
  '/by-subcategory/:subcategoryId',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { subcategoryId } = req.params;
      const { verified } = req.query;

      logger.info(`Searching professionals for subcategory: ${subcategoryId}`);

      const associationsCount =
        await prisma.professionalUserSubcategory.count({
          where: { subcategoryId },
        });

      logger.info(
        `Found ${associationsCount} professional associations for subcategory ${subcategoryId}`
      );

      // Se non ci sono associazioni, cerca professionisti generici
      if (associationsCount === 0) {
        const whereCondition: Prisma.UserWhereInput = {
          role: 'PROFESSIONAL',
        };

        if (verified === 'true') {
          whereCondition.isVerified = true;
        }

        const allProfessionals = await prisma.user.findMany({
          where: whereCondition,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            city: true,
            province: true,
            isVerified: true,
            verifiedAt: true,
            professionalPricing: {
              select: {
                hourlyRate: true,
              },
            },
          },
          take: 10,
        });

        const formattedProfessionals = allProfessionals.map((prof) => ({
          id: prof.id,
          firstName: prof.firstName,
          lastName: prof.lastName,
          email: prof.email,
          phone: prof.phone ?? null,
          city: prof.city ?? null,
          province: prof.province ?? null,
          isVerified: prof.isVerified,
          verifiedAt: prof.verifiedAt,
          hourlyRate: prof.professionalPricing?.hourlyRate ?? null,
          experienceYears: 0,
          skillDescription:
            'Professionista generico (nessuna skill specifica registrata)',
        }));

        return res.json(
          ResponseFormatter.success(
            formattedProfessionals,
            `Nessuna skill specifica trovata. Mostro ${formattedProfessionals.length} professionisti generici`
          )
        );
      }

      // Cerca professionisti con la sottocategoria specifica
      const whereConditionSpecific: Prisma.UserWhereInput = {
        role: 'PROFESSIONAL',
        ProfessionalUserSubcategory: {
          some: {
            subcategoryId: subcategoryId,
          },
        },
      };

      if (verified === 'true') {
        whereConditionSpecific.isVerified = true;
      }

      const professionals = await prisma.user.findMany({
        where: whereConditionSpecific,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          province: true,
          isVerified: true,
          verifiedAt: true,
          professionalPricing: {
          select: {
          hourlyRate: true,
          },
          },
          ProfessionalUserSubcategory: {
            where: {
            subcategoryId: subcategoryId,
          },
          select: {
            experienceYears: true,
          certifications: true,
          },
          },
        },
      });

      const formattedProfessionals = professionals.map((prof) => ({
        id: prof.id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        email: prof.email,
        phone: prof.phone ?? null,
        city: prof.city ?? null,
        province: prof.province ?? null,
        isVerified: prof.isVerified,
        verifiedAt: prof.verifiedAt,
        hourlyRate: prof.professionalPricing?.hourlyRate ?? null,
        experienceYears: prof.ProfessionalUserSubcategory?.[0]?.experienceYears ?? 0,
        skillDescription: prof.ProfessionalUserSubcategory?.[0]?.certifications
          ? 'Professionista certificato'
          : 'Professionista qualificato',
      }));

      return res.json(
        ResponseFormatter.success(
          formattedProfessionals,
          `Trovati ${formattedProfessionals.length} professionisti per questa sottocategoria`
        )
      );
    } catch (error) {
      logger.error('Error fetching professionals by subcategory:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nel recupero professionisti'));
    }
  }
);

// GET /professionals/by-subcategory-simple/:subcategoryId
router.get(
  '/by-subcategory-simple/:subcategoryId',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { subcategoryId } = req.params;

      const allProfessionals = await prisma.user.findMany({
        where: {
          role: 'PROFESSIONAL',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          province: true,
        },
        take: 10,
      });

      return res.json(
        ResponseFormatter.success(
          allProfessionals,
          `Trovati ${allProfessionals.length} professionisti (versione semplificata)`
        )
      );
    } catch (error) {
      logger.error('Error in simple endpoint:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore nel recupero professionisti', 'FETCH_ERROR', {
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  }
);

// GET /professionals
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { verified, search, city, limit = '20', offset = '0' } = req.query;

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const whereCondition: Prisma.UserWhereInput = {
        role: 'PROFESSIONAL',
      };

      if (verified === 'true') {
        whereCondition.isVerified = true;
      }

      if (city && typeof city === 'string') {
        whereCondition.city = {
          contains: city,
          mode: 'insensitive',
        };
      }

      if (search && typeof search === 'string') {
        whereCondition.OR = [
          {
            firstName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [professionals, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereCondition,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            city: true,
            province: true,
            isVerified: true,
            verifiedAt: true,
            documentsVerified: true,
            backgroundCheck: true,
            certificatesVerified: true,
            professionalPricing: {
              select: {
                hourlyRate: true,
              },
            },
            ProfessionalUserSubcategory: {
              select: {
                subcategoryId: true,
                experienceYears: true,
                subcategory: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          take: limitNum,
          skip: offsetNum,
          orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.user.count({ where: whereCondition }),
      ]);

      const formattedProfessionals = professionals.map((prof) => ({
        id: prof.id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        fullName: `${prof.firstName} ${prof.lastName}`,
        email: prof.email,
        phone: prof.phone ?? null,
        city: prof.city ?? null,
        province: prof.province ?? null,
        isVerified: prof.isVerified,
        verifiedAt: prof.verifiedAt,
        verificationDetails: {
          documentsVerified: prof.documentsVerified,
          backgroundCheck: prof.backgroundCheck,
          certificatesVerified: prof.certificatesVerified,
        },
        hourlyRate: prof.professionalPricing?.hourlyRate ?? null,
        subcategories: prof.ProfessionalUserSubcategory.map((sub) => ({
          id: sub.subcategoryId,
          name: sub.subcategory.name,
          experienceYears: sub.experienceYears,
        })),
      }));

      const stats = {
        total: totalCount,
        verified: formattedProfessionals.filter((p) => p.isVerified).length,
        showing: formattedProfessionals.length,
        hasMore: offsetNum + formattedProfessionals.length < totalCount,
      };

      return res.json(
        ResponseFormatter.success(
          formattedProfessionals,
          `Trovati ${stats.total} professionisti`,
          stats
        )
      );
    } catch (error) {
      logger.error('Error fetching professionals:', error);
      return res
        .status(500)
        .json(ResponseFormatter.error('Errore nel recupero professionisti'));
    }
  }
);

export default router;
