import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/professionals/:id/skills
 * Ottiene le competenze di un professionista
 */
router.get('/:id/skills', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a visualizzare queste competenze',
        'UNAUTHORIZED'
      ));
    }
    
    // Recupera le skills dal database
    const skills = await prisma.professionalSkill.findMany({
      where: { userId: professionalId },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(ResponseFormatter.success(
      skills,
      'Competenze recuperate con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error getting professional skills:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle competenze',
      'SKILLS_ERROR'
    ));
  }
});

/**
 * POST /api/professionals/:id/skills
 * Aggiunge una nuova competenza
 */
router.post('/:id/skills', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a modificare queste competenze',
        'UNAUTHORIZED'
      ));
    }
    
    const { name, level } = req.body;
    
    if (!name) {
      return res.status(400).json(ResponseFormatter.error(
        'Nome competenza richiesto',
        'INVALID_NAME'
      ));
    }
    
    // Crea la nuova skill
    const skill = await prisma.professionalSkill.create({
      data: {
        userId: professionalId,
        name,
        level: level || 'intermediate'
      }
    });
    
    return res.json(ResponseFormatter.success(
      skill,
      'Competenza aggiunta con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error creating professional skill:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della competenza',
      'SKILL_CREATE_ERROR'
    ));
  }
});

/**
 * PUT /api/professionals/:id/skills/:skillId
 * Aggiorna una competenza esistente
 */
router.put('/:id/skills/:skillId', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    const skillId = req.params.skillId;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a modificare queste competenze',
        'UNAUTHORIZED'
      ));
    }
    
    const { name, level } = req.body;
    
    // Aggiorna la skill
    const skill = await prisma.professionalSkill.update({
      where: { id: skillId },
      data: {
        name: name || undefined,
        level: level || undefined,
        updatedAt: new Date()
      }
    });
    
    return res.json(ResponseFormatter.success(
      skill,
      'Competenza aggiornata con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error updating professional skill:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della competenza',
      'SKILL_UPDATE_ERROR'
    ));
  }
});

/**
 * DELETE /api/professionals/:id/skills/:skillId
 * Elimina una competenza
 */
router.delete('/:id/skills/:skillId', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    const skillId = req.params.skillId;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a eliminare queste competenze',
        'UNAUTHORIZED'
      ));
    }
    
    // Elimina la skill
    await prisma.professionalSkill.delete({
      where: { id: skillId }
    });
    
    return res.json(ResponseFormatter.success(
      null,
      'Competenza eliminata con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error deleting professional skill:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione della competenza',
      'SKILL_DELETE_ERROR'
    ));
  }
});

/**
 * GET /api/professionals/:id/certifications
 * Ottiene le certificazioni di un professionista
 */
router.get('/:id/certifications', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a visualizzare queste certificazioni',
        'UNAUTHORIZED'
      ));
    }
    
    // Recupera le certificazioni dal database
    const certifications = await prisma.professionalCertification.findMany({
      where: { userId: professionalId },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(ResponseFormatter.success(
      certifications,
      'Certificazioni recuperate con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error getting professional certifications:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle certificazioni',
      'CERTIFICATIONS_ERROR'
    ));
  }
});

/**
 * POST /api/professionals/:id/certifications
 * Aggiunge una nuova certificazione
 */
router.post('/:id/certifications', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a modificare queste certificazioni',
        'UNAUTHORIZED'
      ));
    }
    
    const { name, issuer, validUntil, isVerified } = req.body;
    
    if (!name || !issuer) {
      return res.status(400).json(ResponseFormatter.error(
        'Nome e ente certificatore richiesti',
        'INVALID_DATA'
      ));
    }
    
    // Crea la nuova certificazione
    const certification = await prisma.professionalCertification.create({
      data: {
        userId: professionalId,
        name,
        issuer,
        validUntil: validUntil ? new Date(validUntil) : null,
        isVerified: isVerified || false
      }
    });
    
    return res.json(ResponseFormatter.success(
      certification,
      'Certificazione aggiunta con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error creating professional certification:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della certificazione',
      'CERTIFICATION_CREATE_ERROR'
    ));
  }
});

/**
 * PUT /api/professionals/:id/certifications/:certificationId
 * Aggiorna una certificazione esistente
 */
router.put('/:id/certifications/:certificationId', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    const certificationId = req.params.certificationId;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a modificare queste certificazioni',
        'UNAUTHORIZED'
      ));
    }
    
    const { name, issuer, validUntil, isVerified } = req.body;
    
    // Aggiorna la certificazione
    const certification = await prisma.professionalCertification.update({
      where: { id: certificationId },
      data: {
        name: name || undefined,
        issuer: issuer || undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined,
        updatedAt: new Date()
      }
    });
    
    return res.json(ResponseFormatter.success(
      certification,
      'Certificazione aggiornata con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error updating professional certification:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della certificazione',
      'CERTIFICATION_UPDATE_ERROR'
    ));
  }
});

/**
 * DELETE /api/professionals/:id/certifications/:certificationId
 * Elimina una certificazione
 */
router.delete('/:id/certifications/:certificationId', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    const certificationId = req.params.certificationId;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a eliminare queste certificazioni',
        'UNAUTHORIZED'
      ));
    }
    
    // Elimina la certificazione
    await prisma.professionalCertification.delete({
      where: { id: certificationId }
    });
    
    return res.json(ResponseFormatter.success(
      null,
      'Certificazione eliminata con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error deleting professional certification:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione della certificazione',
      'CERTIFICATION_DELETE_ERROR'
    ));
  }
});

export default router;
