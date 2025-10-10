/**
 * Routes per gestione indirizzi utente
 * Include ricalcolo automatico distanze per professionisti
 * 
 * VERSIONE CORRETTA: TypeScript Strict Mode
 * Data: 08/10/2025
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import logger from '../utils/logger'; // ✅ Corretto: senza graffe
import { z } from 'zod';
import travelCalculationService from '../services/travelCalculation.service';

// ==================== INTERFACCE ====================

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

interface AuthRequest extends Request {
  user?: UserPayload;
}

// ==================== VALIDATION SCHEMAS ====================

const mainAddressSchema = z.object({
  address: z.string().min(3, 'Indirizzo troppo corto'),
  city: z.string().min(2, 'Città richiesta'),
  province: z.string().max(2, 'Provincia deve essere 2 caratteri'),
  postalCode: z.string().regex(/^\d{5}$/, 'CAP deve essere 5 cifre'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const workAddressSchema = z.object({
  workAddress: z.string().min(3, 'Indirizzo lavoro troppo corto'),
  workCity: z.string().min(2, 'Città lavoro richiesta'),
  workProvince: z.string().max(2, 'Provincia deve essere 2 caratteri'),
  workPostalCode: z.string().regex(/^\d{5}$/, 'CAP deve essere 5 cifre'),
  workLatitude: z.number().optional(),
  workLongitude: z.number().optional(),
  useResidenceAsWorkAddress: z.boolean().optional(),
});

// ==================== ROUTER ====================

const router = Router();

/**
 * GET /api/address/main
 * Ottieni indirizzo principale dell'utente
 */
router.get('/main', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json(ResponseFormatter.error({ message: 'Non autenticato', code: 'UNAUTHORIZED' }));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        address: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json(ResponseFormatter.error({ message: 'Utente non trovato', code: 'USER_NOT_FOUND' }));
    }

    return res.json(
      ResponseFormatter.success(user, 'Indirizzo principale recuperato')
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching main address:', error);
    return res
      .status(500)
      .json(
        ResponseFormatter.error({ message: 'Errore nel recupero indirizzo', error: errorMessage })
      );
  }
});

/**
 * PUT /api/address/main
 * Aggiorna indirizzo principale dell'utente
 */
router.put('/main', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res
        .status(401)
        .json(ResponseFormatter.error({ message: 'Non autenticato', code: 'UNAUTHORIZED' }));
    }

    const validatedData = mainAddressSchema.parse(req.body);

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        useResidenceAsWorkAddress: true,
        address: true,
        city: true,
      },
    });

    const addressChanged =
      validatedData.address !== currentUser?.address ||
      validatedData.city !== currentUser?.city;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        province: validatedData.province.toUpperCase(),
        updatedAt: new Date(),
      },
      select: {
        address: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        useResidenceAsWorkAddress: true,
      },
    });

    if (
      addressChanged &&
      userRole === 'PROFESSIONAL' &&
      currentUser?.useResidenceAsWorkAddress
    ) {
      logger.info(
        `🏠 Main address (used as work) changed for professional ${userId}, recalculating...`
      );

      try {
        const updatedCount = await travelCalculationService.recalculateForProfessional(
          userId
        );
        logger.info(`✅ Recalculated ${updatedCount} requests`);

        return res.json(
          ResponseFormatter.success(
            updatedUser,
            `Indirizzo aggiornato. Ricalcolate ${updatedCount} distanze.`
          )
        );
      } catch (error) {
        logger.error('Failed to recalculate:', error);
      }
    }

    return res.json(
      ResponseFormatter.success(updatedUser, 'Indirizzo principale aggiornato')
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error updating main address:', error);
    return res
      .status(500)
      .json(
        ResponseFormatter.error({ message: 'Errore nell\'aggiornamento indirizzo', error: errorMessage })
      );
  }
});

/**
 * GET /api/address/work
 * Ottieni indirizzo di lavoro del professionista
 */
router.get('/work', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res
        .status(401)
        .json(ResponseFormatter.error({ message: 'Non autenticato', code: 'UNAUTHORIZED' }));
    }

    if (userRole !== 'PROFESSIONAL') {
      return res
        .status(403)
        .json(
          ResponseFormatter.error({ message: 'Solo i professionisti hanno un indirizzo di lavoro', code: 'NOT_PROFESSIONAL' })
        );
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
        address: true,
        city: true,
        province: true,
        postalCode: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json(ResponseFormatter.error({ message: 'Utente non trovato', code: 'USER_NOT_FOUND' }));
    }

    const workData = user.useResidenceAsWorkAddress
      ? {
          workAddress: user.address,
          workCity: user.city,
          workProvince: user.province,
          workPostalCode: user.postalCode,
          useResidenceAsWorkAddress: true,
        }
      : {
          workAddress: user.workAddress,
          workCity: user.workCity,
          workProvince: user.workProvince,
          workPostalCode: user.workPostalCode,
          useResidenceAsWorkAddress: false,
        };

    return res.json(
      ResponseFormatter.success(workData, 'Indirizzo di lavoro recuperato')
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching work address:', error);
    return res
      .status(500)
      .json(
        ResponseFormatter.error({ message: 'Errore nel recupero indirizzo lavoro', error: errorMessage })
      );
  }
});

/**
 * PUT /api/address/work
 * Aggiorna indirizzo di lavoro del professionista con RICALCOLO AUTOMATICO
 */
router.put('/work', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res
        .status(401)
        .json(ResponseFormatter.error({ message: 'Non autenticato', code: 'UNAUTHORIZED' }));
    }

    if (userRole !== 'PROFESSIONAL') {
      return res
        .status(403)
        .json(
          ResponseFormatter.error({ message: 'Solo i professionisti possono aggiornare l\'indirizzo di lavoro', code: 'NOT_PROFESSIONAL' })
        );
    }

    const validatedData = workAddressSchema.parse(req.body);

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        useResidenceAsWorkAddress: true,
      },
    });

    const addressChanged =
      validatedData.workAddress !== currentUser?.workAddress ||
      validatedData.workCity !== currentUser?.workCity ||
      validatedData.workProvince !== currentUser?.workProvince ||
      validatedData.workPostalCode !== currentUser?.workPostalCode ||
      (validatedData.useResidenceAsWorkAddress !== undefined &&
        validatedData.useResidenceAsWorkAddress !==
          currentUser?.useResidenceAsWorkAddress);

    if (!addressChanged) {
      return res.json(
        ResponseFormatter.success(currentUser, 'Nessuna modifica all\'indirizzo')
      );
    }

    logger.info(`🏢 Work address changing for professional ${userId}`);
    logger.info(`  From: ${currentUser?.workAddress}, ${currentUser?.workCity}`);
    logger.info(`  To: ${validatedData.workAddress}, ${validatedData.workCity}`);

    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (updateData.workProvince && typeof updateData.workProvince === 'string') {
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
        useResidenceAsWorkAddress: true,
      },
    });

    logger.info(`🚗 Starting travel info recalculation for all assigned requests...`);

    try {
      const assignedRequests = await prisma.assistanceRequest.findMany({
        where: {
          professionalId: userId,
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS'],
          },
        },
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
        },
      });

      logger.info(`📍 Found ${assignedRequests.length} requests to recalculate`);

      let successCount = 0;
      let failCount = 0;

      for (const request of assignedRequests) {
        try {
          logger.info(
            `  Recalculating for: ${request.title} (${request.address}, ${request.city})`
          );
          const success = await travelCalculationService.calculateAndSave(
            request.id,
            userId
          );

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

      logger.info(
        `📊 Recalculation complete: ${successCount} success, ${failCount} failed`
      );

      return res.json(
        ResponseFormatter.success(
          {
            ...updatedUser,
            recalculation: {
              total: assignedRequests.length,
              success: successCount,
              failed: failCount,
            },
          },
          `Indirizzo di lavoro aggiornato. Ricalcolate ${successCount} distanze su ${assignedRequests.length} richieste.`
        )
      );
    } catch (error) {
      logger.error('❌ Failed to recalculate travel info:', error);

      return res.json(
        ResponseFormatter.success(
          updatedUser,
          'Indirizzo di lavoro aggiornato. Errore nel ricalcolo distanze, riprova manualmente.'
        )
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error updating work address:', error);
    return res
      .status(500)
      .json(
        ResponseFormatter.error({ message: 'Errore nell\'aggiornamento indirizzo lavoro', error: errorMessage })
      );
  }
});

/**
 * POST /api/address/recalculate-all
 * Forza il ricalcolo di tutte le distanze per il professionista
 */
router.post(
  '/recalculate-all',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res
          .status(401)
          .json(ResponseFormatter.error({ message: 'Non autenticato', code: 'UNAUTHORIZED' }));
      }

      if (userRole !== 'PROFESSIONAL') {
        return res
          .status(403)
          .json(
            ResponseFormatter.error({ message: 'Solo i professionisti possono ricalcolare le distanze', code: 'NOT_PROFESSIONAL' })
          );
      }

      logger.info(`🔄 Manual recalculation requested by professional ${userId}`);

      const updatedCount = await travelCalculationService.recalculateForProfessional(
        userId
      );

      return res.json(
        ResponseFormatter.success(
          { recalculated: updatedCount },
          `Ricalcolate ${updatedCount} distanze con successo`
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in manual recalculation:', error);
      return res
        .status(500)
        .json(
          ResponseFormatter.error({ message: 'Errore nel ricalcolo distanze', error: errorMessage })
        );
    }
  }
);

export default router;
