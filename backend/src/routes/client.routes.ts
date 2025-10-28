import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/client/pending-forms
 * Ottiene tutti i form pendenti per il cliente corrente (ottimizzato)
 */
router.get('/pending-forms', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Query ottimizzata con un singolo accesso al database
    const pendingForms = await prisma.requestCustomForm.findMany({
      where: {
        AssistanceRequest: {
          clientId: userId
        },
        isCompleted: false
      },
      include: {
        CustomForm: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        AssistanceRequest: {
          select: {
            id: true,
            title: true,
            requestNumber: true,
            professionalId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(ResponseFormatter.success(
      pendingForms,
      `${pendingForms.length} moduli pendenti trovati`
    ));
  } catch (error) {
    console.error('Errore nel recupero dei form pendenti:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero dei moduli pendenti')
    );
  }
});

export default router;
