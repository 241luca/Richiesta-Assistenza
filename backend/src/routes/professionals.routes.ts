import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { professionalStatsService } from '../services/professional-stats.service';

const router = Router();

// Middleware per verificare se l'utente è admin o il professionista stesso
const canAccessProfessional = async (req: any, res: any, next: any) => {
  const { professionalId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  
  // Admin può accedere a tutto
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    return next();
  }
  
  // Il professionista può accedere solo ai propri dati
  if (userRole === 'PROFESSIONAL' && userId === professionalId) {
    return next();
  }
  
  return res.status(403).json(ResponseFormatter.error(
    'Non autorizzato ad accedere a questi dati',
    'FORBIDDEN'
  ));
};

// ==================== STATISTICHE PROFESSIONISTA ====================

// GET /professionals/:professionalId/stats
// Ottiene tutte le statistiche per un professionista
router.get('/:professionalId/stats', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    
    logger.info(`Fetching stats for professional: ${professionalId}`);
    
    const stats = await professionalStatsService.getStats(professionalId);
    
    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche recuperate con successo'
    ));
  } catch (error) {
    logger.error('Error fetching professional stats:', error);
    
    if (error instanceof Error && error.message === 'Professionista non trovato') {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle statistiche',
      'STATS_ERROR'
    ));
  }
});

// GET /professionals/:professionalId/stats/quick
// Ottiene statistiche rapide (versione cache-friendly)
router.get('/:professionalId/stats/quick', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    
    const quickStats = await professionalStatsService.getQuickStats(professionalId);
    
    return res.json(ResponseFormatter.success(
      quickStats,
      'Statistiche rapide recuperate'
    ));
  } catch (error) {
    logger.error('Error fetching quick stats:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero statistiche rapide',
      'QUICK_STATS_ERROR'
    ));
  }
});

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
    urgente: z.number().min(0)
  })
});

// GET /professionals/:professionalId/pricing
router.get('/:professionalId/pricing', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    
    // Cerca le tariffe esistenti
    let pricing = await prisma.professionalPricing.findUnique({
      where: { userId: professionalId }
    });
    
    // Se non esistono, crea valori di default
    if (!pricing) {
      pricing = await prisma.professionalPricing.create({
        data: {
          userId: professionalId,
          hourlyRate: 50.00,
          minimumRate: 30.00,
          costPerKm: 0.50,
          freeKm: 10,
          supplements: {
            weekend: 20,
            notturno: 30,
            festivo: 50,
            urgente: 30
          }
        }
      });
    }
    
    return res.json(ResponseFormatter.success(pricing));
  } catch (error) {
    logger.error('Error fetching pricing:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nel recupero tariffe'));
  }
});

// PUT /professionals/:professionalId/pricing
router.put('/:professionalId/pricing', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    const validatedData = pricingSchema.parse(req.body);
    
    const pricing = await prisma.professionalPricing.upsert({
      where: { userId: professionalId },
      update: validatedData,
      create: {
        userId: professionalId,
        ...validatedData
      }
    });
    
    return res.json(ResponseFormatter.success(pricing, 'Tariffe aggiornate con successo'));
  } catch (error) {
    logger.error('Error updating pricing:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nell\'aggiornamento tariffe'));
  }
});

// ==================== AI SETTINGS ====================

const aiSettingsSchema = z.object({
  modelName: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(100).max(4000),
  responseStyle: z.enum(['formal', 'informal', 'technical', 'educational']),
  detailLevel: z.enum(['basic', 'intermediate', 'advanced']),
  useKnowledgeBase: z.boolean(),
  systemPrompt: z.string().optional()
});

// GET /professionals/:professionalId/ai-settings/:subcategoryId
router.get('/:professionalId/ai-settings/:subcategoryId', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    
    // Verifica che il professionista abbia questa sottocategoria
    const hasSubcategory = await prisma.professionalUserSubcategory.findUnique({
      where: {
        userId_subcategoryId: {
          recipientId: professionalId,
          subcategoryId: subcategoryId
        }
      }
    });
    
    if (!hasSubcategory) {
      return res.status(404).json(ResponseFormatter.error('Sottocategoria non trovata per questo professionista'));
    }
    
    // Cerca le impostazioni AI esistenti
    let aiSettings = await prisma.professionalAiSettings.findUnique({
      where: {
        userId_subcategoryId: {
          recipientId: professionalId,
          subcategoryId: subcategoryId
        }
      }
    });
    
    // Se non esistono, crea valori di default
    if (!aiSettings) {
      aiSettings = await prisma.professionalAiSettings.create({
        data: {
          recipientId: professionalId,
          subcategoryId: subcategoryId,
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2000,
          responseStyle: 'formal',
          detailLevel: 'intermediate',
          useKnowledgeBase: true,
          systemPrompt: 'Sei un esperto professionista nel tuo settore. Fornisci risposte precise, professionali e utili ai clienti.'
        }
      });
    }
    
    return res.json(ResponseFormatter.success(aiSettings));
  } catch (error) {
    logger.error('Error fetching AI settings:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nel recupero impostazioni AI'));
  }
});

// PUT /professionals/:professionalId/ai-settings/:subcategoryId
router.put('/:professionalId/ai-settings/:subcategoryId', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    const validatedData = aiSettingsSchema.parse(req.body);
    
    logger.info('Updating AI settings:', {
      professionalId,
      subcategoryId,
      data: validatedData
    });
    
    const aiSettings = await prisma.professionalAiSettings.upsert({
      where: {
        userId_subcategoryId: {
          recipientId: professionalId,
          subcategoryId: subcategoryId
        }
      },
      update: validatedData,
      create: {
        recipientId: professionalId,
        subcategoryId: subcategoryId,
        ...validatedData
      }
    });
    
    logger.info('AI settings saved:', aiSettings);
    
    return res.json(ResponseFormatter.success(aiSettings, 'Impostazioni AI aggiornate con successo'));
  } catch (error) {
    logger.error('Error updating AI settings:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nell\'aggiornamento impostazioni AI'));
  }
});

// ==================== SKILLS ====================

const skillSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
});

// GET /professionals/:professionalId/skills
router.get('/:professionalId/skills', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    
    const skills = await prisma.professionalSkill.findMany({
      where: { userId: professionalId },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(ResponseFormatter.success(skills));
  } catch (error) {
    logger.error('Error fetching skills:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nel recupero skills'));
  }
});

// POST /professionals/:professionalId/skills
router.post('/:professionalId/skills', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    const validatedData = skillSchema.parse(req.body);
    
    // Verifica che non esista già una skill con lo stesso nome
    const existing = await prisma.professionalSkill.findFirst({
      where: {
        userId: professionalId,
        name: validatedData.name
      }
    });
    
    if (existing) {
      return res.status(400).json(ResponseFormatter.error('Skill già esistente'));
    }
    
    const skill = await prisma.professionalSkill.create({
      data: {
        userId: professionalId,
        ...validatedData
      }
    });
    
    return res.json(ResponseFormatter.success(skill, 'Skill aggiunta con successo'));
  } catch (error) {
    logger.error('Error creating skill:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nell\'aggiunta skill'));
  }
});

// DELETE /professionals/:professionalId/skills/:skillId
router.delete('/:professionalId/skills/:skillId', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId, skillId } = req.params;
    
    await prisma.professionalSkill.delete({
      where: {
        id: skillId,
        userId: professionalId
      }
    });
    
    return res.json(ResponseFormatter.success(null, 'Skill rimossa con successo'));
  } catch (error) {
    logger.error('Error deleting skill:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nella rimozione skill'));
  }
});

// ==================== CERTIFICATIONS ====================

const certificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  validUntil: z.string().optional(),
  isVerified: z.boolean().optional()
});

// GET /professionals/:professionalId/certifications
router.get('/:professionalId/certifications', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    
    const certifications = await prisma.professionalCertification.findMany({
      where: { userId: professionalId },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(ResponseFormatter.success(certifications));
  } catch (error) {
    logger.error('Error fetching certifications:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nel recupero certificazioni'));
  }
});

// POST /professionals/:professionalId/certifications
router.post('/:professionalId/certifications', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    const validatedData = certificationSchema.parse(req.body);
    
    const certification = await prisma.professionalCertification.create({
      data: {
        userId: professionalId,
        ...validatedData,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null
      }
    });
    
    return res.json(ResponseFormatter.success(certification, 'Certificazione aggiunta con successo'));
  } catch (error) {
    logger.error('Error creating certification:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nell\'aggiunta certificazione'));
  }
});

// DELETE /professionals/:professionalId/certifications/:certId
router.delete('/:professionalId/certifications/:certId', authenticate, canAccessProfessional, async (req: any, res) => {
  try {
    const { professionalId, certId } = req.params;
    
    await prisma.professionalCertification.delete({
      where: {
        id: certId,
        recipientId: professionalId
      }
    });
    
    return res.json(ResponseFormatter.success(null, 'Certificazione rimossa con successo'));
  } catch (error) {
    logger.error('Error deleting certification:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nella rimozione certificazione'));
  }
});

// PATCH /professionals/:professionalId/certifications/:certId/verify (Admin only)
router.patch('/:professionalId/certifications/:certId/verify', 
  authenticate, 
  requireRole(['ADMIN', 'SUPER_ADMIN']), 
  async (req: any, res) => {
  try {
    const { professionalId, certId } = req.params;
    
    const certification = await prisma.professionalCertification.update({
      where: {
        id: certId,
        recipientId: professionalId
      },
      data: {
        isVerified: true
      }
    });
    
    return res.json(ResponseFormatter.success(certification, 'Certificazione verificata'));
  } catch (error) {
    logger.error('Error verifying certification:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nella verifica certificazione'));
  }
});

// GET /professionals/by-subcategory/:subcategoryId
// Ottiene tutti i professionisti abilitati per una sottocategoria
router.get('/by-subcategory/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { subcategoryId } = req.params;
    const { verified } = req.query; // ✅ Filtro per solo verificati
    
    logger.info(`Searching professionals for subcategory: ${subcategoryId}`);
    
    // Prima verifichiamo se ci sono associazioni per questa sottocategoria
    const associationsCount = await prisma.professionalUserSubcategory.count({
      where: { subcategoryId }
    });
    
    logger.info(`Found ${associationsCount} professional associations for subcategory ${subcategoryId}`);
    
    // Se non ci sono associazioni, proviamo a cercare professionisti generici
    if (associationsCount === 0) {
      // Crea il filtro where base con verificato se richiesto
      const whereCondition: any = {
        role: 'PROFESSIONAL'
      };
      
      // Aggiungi filtro per solo verificati se richiesto
      if (verified === 'true') {
        whereCondition.isVerified = true;
      }
      
      // Recupera tutti i professionisti attivi come fallback
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
          isVerified: true, // ✅ Badge verificato
          verifiedAt: true,
          professionalInfo: {
            select: {
              hourlyRate: true,
              workRadius: true
            }
          }
        },
        take: 10 // Limita a 10 per non sovraccaricare
      });
      
      const formattedProfessionals = allProfessionals.map(prof => ({
        id: prof.id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        email: prof.email,
        phone: prof.phone,
        city: prof.city,
        province: prof.province,
        isVerified: prof.isVerified, // ✅ Badge verificato
        verifiedAt: prof.verifiedAt,
        hourlyRate: prof.professionalInfo?.hourlyRate || null,
        workRadius: prof.professionalInfo?.workRadius || null,
        experienceYears: 0,
        skillDescription: 'Professionista generico (nessuna skill specifica registrata)'
      }));
      
      return res.json(ResponseFormatter.success(
        formattedProfessionals, 
        `Nessuna skill specifica trovata. Mostro ${formattedProfessionals.length} professionisti generici`
      ));
    }
    
    // Crea il filtro where per professionisti con sottocategorie
    const whereConditionSpecific: any = {
      role: 'PROFESSIONAL',
      professionalUserSubcategories: {
        some: {
          subcategoryId: subcategoryId
        }
      }
    };
    
    // Aggiungi filtro per solo verificati se richiesto
    if (verified === 'true') {
      whereConditionSpecific.isVerified = true;
    }
    
    // Trova tutti i professionisti che hanno competenze per questa sottocategoria
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
        isVerified: true, // ✅ Badge verificato
        verifiedAt: true,
        professionalInfo: {
          select: {
            hourlyRate: true,
            workRadius: true
          }
        },
        professionalUserSubcategories: {
          where: {
            subcategoryId: subcategoryId
          },
          select: {
            experienceYears: true,
            certifications: true
          }
        }
      }
    });
    
    // Formatta i dati per il frontend
    const formattedProfessionals = professionals.map(prof => ({
      id: prof.id,
      firstName: prof.firstName,
      lastName: prof.lastName,
      email: prof.email,
      phone: prof.phone,
      city: prof.city,
      province: prof.province,
      isVerified: prof.isVerified, // ✅ Badge verificato
      verifiedAt: prof.verifiedAt,
      hourlyRate: prof.professionalInfo?.hourlyRate || null,
      workRadius: prof.professionalInfo?.workRadius || null,
      experienceYears: prof.professionalUserSubcategories[0]?.experienceYears || 0,
      skillDescription: prof.professionalUserSubcategories[0]?.certifications ? 
        'Professionista certificato' : 'Professionista qualificato'
    }));
    
    return res.json(ResponseFormatter.success(
      formattedProfessionals, 
      `Trovati ${formattedProfessionals.length} professionisti per questa sottocategoria`
    ));
  } catch (error) {
    logger.error('Error fetching professionals by subcategory:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nel recupero professionisti'));
  }
});

// GET /professionals/by-subcategory-simple/:subcategoryId
// Versione semplificata per testing
router.get('/by-subcategory-simple/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { subcategoryId } = req.params;
    
    // Recupera TUTTI i professionisti attivi senza filtro sottocategoria
    const allProfessionals = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        province: true
      },
      take: 10
    });
    
    return res.json(ResponseFormatter.success(
      allProfessionals, 
      `Trovati ${allProfessionals.length} professionisti (versione semplificata)`
    ));
  } catch (error) {
    logger.error('Error in simple endpoint:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero professionisti', 
      'FETCH_ERROR',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    ));
  }
});

// GET /professionals
// Ottiene tutti i professionisti con filtri opzionali
router.get('/', authenticate, async (req: any, res) => {
  try {
    const { verified, search, city, limit = 20, offset = 0 } = req.query;
    
    // Costruisci il filtro where
    const whereCondition: any = {
      role: 'PROFESSIONAL'
    };
    
    // Filtro solo verificati
    if (verified === 'true') {
      whereCondition.isVerified = true;
    }
    
    // Filtro per cittÃ 
    if (city) {
      whereCondition.city = {
        contains: city,
        mode: 'insensitive'
      };
    }
    
    // Filtro per ricerca nome/cognome
    if (search) {
      whereCondition.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Esegui la query
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
              hourlyRate: true
            }
          },
          professionalUserSubcategories: {
            select: {
              subcategoryId: true,
              experienceYears: true,
              subcategory: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: [
          { isVerified: 'desc' }, // Verificati per primi
          { createdAt: 'desc' }
        ]
      }),
      prisma.user.count({ where: whereCondition })
    ]);
    
    // Formatta i dati
    const formattedProfessionals = professionals.map(prof => ({
      id: prof.id,
      firstName: prof.firstName,
      lastName: prof.lastName,
      fullName: `${prof.firstName} ${prof.lastName}`,
      email: prof.email,
      phone: prof.phone,
      city: prof.city,
      province: prof.province,
      isVerified: prof.isVerified,
      verifiedAt: prof.verifiedAt,
      verificationDetails: {
        documentsVerified: prof.documentsVerified,
        backgroundCheck: prof.backgroundCheck,
        certificatesVerified: prof.certificatesVerified
      },
      hourlyRate: prof.professionalPricing?.hourlyRate || null,
      subcategories: prof.professionalUserSubcategories.map(sub => ({
        id: sub.subcategoryId,
        name: sub.subcategory.name,
        experienceYears: sub.experienceYears
      }))
    }));
    
    // Statistiche per il frontend
    const stats = {
      total: totalCount,
      verified: formattedProfessionals.filter(p => p.isVerified).length,
      showing: formattedProfessionals.length,
      hasMore: (parseInt(offset) + formattedProfessionals.length) < totalCount
    };
    
    return res.json(ResponseFormatter.success(
      formattedProfessionals,
      `Trovati ${stats.total} professionisti`,
      stats
    ));
    
  } catch (error) {
    logger.error('Error fetching professionals:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nel recupero professionisti'));
  }
});

export default router;
