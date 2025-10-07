/**
 * Routes per gestione indirizzi utente
 * Include ricalcolo automatico distanze per professionisti
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';
import travelCalculationService from '../services/travelCalculation.service';

const router = Router();

// Schema validazione indirizzo principale
const mainAddressSchema = z.object({
  address: z.string().min(3, 'Indirizzo troppo corto'),
  city: z.string().min(2, 'Città richiesta'),
  province: z.string().max(2, 'Provincia deve essere 2 caratteri'),
  postalCode: z.string().regex(/^\d{5}$/, 'CAP deve essere 5 cifre'),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

// Schema validazione indirizzo di lavoro
const workAddressSchema = z.object({
  workAddress: z.string().min(3, 'Indirizzo lavoro troppo corto'),
  workCity: z.string().min(2, 'Città lavoro richiesta'),
  workProvince: z.string().max(2, 'Provincia deve essere 2 caratteri'),
  workPostalCode: z.string().regex(/^\d{5}$/, 'CAP deve essere 5 cifre'),
  workLatitude: z.number().optional(),
  workLongitude: z.number().optional(),
  useResidenceAsWorkAddress: z.boolean().optional()
});

/**
 * GET /api/address/main
 * Ottieni indirizzo principale dell'utente
 */
router.get('/main', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        address: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true
      }
    });

    if (!user) {
      return res.status(404).json(ResponseFormatter.error(
        'Utente non trovato',
        { code: 'USER_NOT_FOUND' }
      ));
    }

    return res.json(ResponseFormatter.success(
      user,
      'Indirizzo principale recuperato'
    ));
  } catch (error) {
    logger.error('Error fetching main address:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero indirizzo',
      { error: error.message }
    ));
  }
});

/**
 * PUT /api/address/main
 * Aggiorna indirizzo principale dell'utente
 */
router.put('/main', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Valida i dati
    const validatedData = mainAddressSchema.parse(req.body);
    
    // Check se l'utente usa residenza come work address
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        useResidenceAsWorkAddress: true,
        address: true,
        city: true
      }
    });
    
    // Controlla se l'indirizzo sta cambiando
    const addressChanged = (
      validatedData.address !== currentUser?.address ||
      validatedData.city !== currentUser?.city
    );
    
    // Aggiorna l'indirizzo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        province: validatedData.province.toUpperCase(),
        updatedAt: new Date()
      },
      select: {
        address: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        useResidenceAsWorkAddress: true
      }
    });
    
    // Se è un professionista e usa residenza come work address, ricalcola
    if (addressChanged && userRole === 'PROFESSIONAL' && currentUser?.useResidenceAsWorkAddress) {
      logger.info(`🏠 Main address (used as work) changed for professional ${userId}, recalculating...`);
      
      try {
        const updatedCount = await travelCalculationService.recalculateForProfessional(userId);
        logger.info(`✅ Recalculated ${updatedCount} requests`);
        
        return res.json(ResponseFormatter.success(
          updatedUser,
          `Indirizzo aggiornato. Ricalcolate ${updatedCount} distanze.`
        ));
      } catch (error) {
        logger.error('Failed to recalculate:', error);
      }
    }
    
    return res.json(ResponseFormatter.success(
      updatedUser,
      'Indirizzo principale aggiornato'
    ));
  } catch (error) {
    logger.error('Error updating main address:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento indirizzo',
      { error: error.message }
    ));
  }
});

/**
 * GET /api/address/work
 * Ottieni indirizzo di lavoro del professionista
 */
router.get('/work', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (userRole !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti hanno un indirizzo di lavoro',
        { code: 'NOT_PROFESSIONAL' }
      ));
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        workLatitude: true,
        workLongitude: true,
        useResidenceAsWorkAddress: true,
        // Include anche residenza nel caso usi quella
        address: true,
        city: true,
        province: true,
        postalCode: true
      }
    });

    if (!user) {
      return res.status(404).json(ResponseFormatter.error(
        'Utente non trovato',
        { code: 'USER_NOT_FOUND' }
      ));
    }

    // Se usa residenza come work, ritorna quella
    const workData = user.useResidenceAsWorkAddress ? {
      workAddress: user.address,
      workCity: user.city,
      workProvince: user.province,
      workPostalCode: user.postalCode,
      useResidenceAsWorkAddress: true
    } : {
      workAddress: user.workAddress,
      workCity: user.workCity,
      workProvince: user.workProvince,
      workPostalCode: user.workPostalCode,
      useResidenceAsWorkAddress: false
    };

    return res.json(ResponseFormatter.success(
      workData,
      'Indirizzo di lavoro recuperato'
    ));
  } catch (error) {
    logger.error('Error fetching work address:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero indirizzo lavoro',
      { error: error.message }
    ));
  }
});

/**
 * PUT /api/address/work
 * Aggiorna indirizzo di lavoro del professionista con RICALCOLO AUTOMATICO
 */
router.put('/work', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (userRole !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono aggiornare l\'indirizzo di lavoro',
        { code: 'NOT_PROFESSIONAL' }
      ));
    }
    
    // Valida i dati
    const validatedData = workAddressSchema.parse(req.body);
    
    // Recupera l'indirizzo attuale per confronto
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        useResidenceAsWorkAddress: true
      }
    });
    
    // Controlla se qualcosa sta cambiando
    const addressChanged = (
      validatedData.workAddress !== currentUser?.workAddress ||
      validatedData.workCity !== currentUser?.workCity ||
      validatedData.workProvince !== currentUser?.workProvince ||
      validatedData.workPostalCode !== currentUser?.workPostalCode ||
      (validatedData.useResidenceAsWorkAddress !== undefined && 
       validatedData.useResidenceAsWorkAddress !== currentUser?.useResidenceAsWorkAddress)
    );
    
    if (!addressChanged) {
      return res.json(ResponseFormatter.success(
        currentUser,
        'Nessuna modifica all\'indirizzo'
      ));
    }
    
    logger.info(`🏢 Work address changing for professional ${userId}`);
    logger.info(`  From: ${currentUser?.workAddress}, ${currentUser?.workCity}`);
    logger.info(`  To: ${validatedData.workAddress}, ${validatedData.workCity}`);
    
    // Aggiorna l'indirizzo di lavoro
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };
    
    if (updateData.workProvince) {
      updateData.workProvince = updateData.workProvince.toUpperCase();
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        workLatitude: true,
        workLongitude: true,
        useResidenceAsWorkAddress: true
      }
    });
    
    // 🔄 RICALCOLA TUTTE LE DISTANZE PER LE RICHIESTE ASSEGNATE
    logger.info(`🚗 Starting travel info recalculation for all assigned requests...`);
    
    try {
      // Trova tutte le richieste assegnate a questo professionista
      const assignedRequests = await prisma.assistanceRequest.findMany({
        where: {
          professionalId: userId,
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS']
          }
        },
        select: {
          id: true,
          title: true,
          address: true,
          city: true
        }
      });
      
      logger.info(`📍 Found ${assignedRequests.length} requests to recalculate`);
      
      // Ricalcola per ogni richiesta
      let successCount = 0;
      let failCount = 0;
      
      for (const request of assignedRequests) {
        try {
          logger.info(`  Recalculating for: ${request.title} (${request.address}, ${request.city})`);
          const success = await travelCalculationService.calculateAndSave(request.id, userId);
          
          if (success) {
            successCount++;
            logger.info(`    ✅ Success`);
          } else {
            failCount++;
            logger.warn(`    ⚠️ Failed`);
          }
        } catch (error) {
          failCount++;
          logger.error(`    ❌ Error:`, error);
        }
      }
      
      logger.info(`📊 Recalculation complete: ${successCount} success, ${failCount} failed`);
      
      return res.json(ResponseFormatter.success(
        {
          ...updatedUser,
          recalculation: {
            total: assignedRequests.length,
            success: successCount,
            failed: failCount
          }
        },
        `Indirizzo di lavoro aggiornato. Ricalcolate ${successCount} distanze su ${assignedRequests.length} richieste.`
      ));
      
    } catch (error) {
      logger.error('❌ Failed to recalculate travel info:', error);
      
      // Non bloccare l'aggiornamento se il ricalcolo fallisce
      return res.json(ResponseFormatter.success(
        updatedUser,
        'Indirizzo di lavoro aggiornato. Errore nel ricalcolo distanze, riprova manualmente.'
      ));
    }
    
  } catch (error) {
    logger.error('Error updating work address:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento indirizzo lavoro',
      { error: error.message }
    ));
  }
});

/**
 * POST /api/address/recalculate-all
 * Forza il ricalcolo di tutte le distanze per il professionista
 */
router.post('/recalculate-all', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (userRole !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono ricalcolare le distanze',
        { code: 'NOT_PROFESSIONAL' }
      ));
    }
    
    logger.info(`🔄 Manual recalculation requested by professional ${userId}`);
    
    const updatedCount = await travelCalculationService.recalculateForProfessional(userId);
    
    return res.json(ResponseFormatter.success(
      { recalculated: updatedCount },
      `Ricalcolate ${updatedCount} distanze con successo`
    ));
    
  } catch (error) {
    logger.error('Error in manual recalculation:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel ricalcolo distanze',
      { error: error.message }
    ));
  }
});

export default router;