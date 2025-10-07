import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

interface CostRange {
  fromKm: number;
  toKm: number | null;
  costPerKm: number; // in centesimi
}

interface Supplement {
  type: string;
  name: string;
  percentage: number;
  fixedAmount: number; // in centesimi
  isActive: boolean;
}

interface PricingData {
  hourlyRate: number;
  minimumRate: number;
  baseCost: number;
  freeKm: number;
  costPerKm?: number;
  costRanges?: CostRange[];
  supplements: Supplement[];
}

/**
 * GET /api/professionals/:id/pricing
 * Ottiene le tariffe di un professionista
 * 🔧 FIX SQL INJECTION: Usa Prisma.sql per query parametrizzate
 */
router.get('/:id/pricing', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a visualizzare queste tariffe',
        'UNAUTHORIZED'
      ));
    }
    
    // Recupera le tariffe dal database
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        hourlyRate: true,
        travelRatePerKm: true,
        // pricingData verrà aggiunto dopo la migrazione
      }
    });
    
    if (!professional) {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    // Prova a recuperare pricingData se esiste nel DB
    let pricingData = null;
    try {
      // 🔧 FIX: Query sicura con Prisma.sql
      const userWithPricing = await prisma.$queryRaw<any[]>(
        Prisma.sql`
          SELECT "pricingData" FROM "User" WHERE id = ${professionalId}
        `
      );
      
      if (userWithPricing && userWithPricing[0]) {
        pricingData = userWithPricing[0].pricingData;
      }
    } catch (e) {
      // Campo non ancora presente nel DB
      console.log('Campo pricingData non ancora presente nel database');
    }
    
    // Se abbiamo dati completi, usali
    if (pricingData) {
      return res.json(ResponseFormatter.success(
        pricingData,
        'Tariffe recuperate con successo'
      ));
    }
    
    // Altrimenti, costruisci dai dati base
    const defaultPricing: PricingData = {
      hourlyRate: professional.hourlyRate ? Number(professional.hourlyRate) : 50,
      minimumRate: 30,
      baseCost: 10,
      freeKm: 10,
      costPerKm: professional.travelRatePerKm ? Number(professional.travelRatePerKm) : 0.50,
      supplements: [
        { type: 'weekend', name: 'Weekend (Sab-Dom)', percentage: 20, fixedAmount: 0, isActive: true },
        { type: 'notturno', name: 'Notturno (20:00-08:00)', percentage: 30, fixedAmount: 0, isActive: true },
        { type: 'festivo', name: 'Festivi', percentage: 50, fixedAmount: 0, isActive: true },
        { type: 'urgente', name: 'Urgente (entro 24h)', percentage: 0, fixedAmount: 2000, isActive: true }
      ]
    };
    
    return res.json(ResponseFormatter.success(
      defaultPricing,
      'Tariffe recuperate con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error getting professional pricing:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle tariffe',
      'PRICING_ERROR'
    ));
  }
});

/**
 * PUT /api/professionals/:id/pricing
 * Aggiorna le tariffe di un professionista
 * 🔧 FIX SQL INJECTION: Usa Prisma.sql per update sicuro
 */
router.put('/:id/pricing', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    
    // Verifica che l'utente sia autorizzato
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a modificare queste tariffe',
        'UNAUTHORIZED'
      ));
    }
    
    const pricingData: PricingData = req.body;
    
    // Valida i dati
    if (!pricingData.hourlyRate || pricingData.hourlyRate < 0) {
      return res.status(400).json(ResponseFormatter.error(
        'Tariffa oraria non valida',
        'INVALID_HOURLY_RATE'
      ));
    }
    
    // Aggiorna nel database
    try {
      // Prima aggiorna i campi base
      await prisma.user.update({
        where: { id: professionalId },
        data: {
          hourlyRate: pricingData.hourlyRate,
          travelRatePerKm: pricingData.costPerKm || 0.50,
          updatedAt: new Date()
        }
      });
      
      // Poi prova ad aggiornare pricingData se il campo esiste
      try {
        // 🔧 FIX: Update sicuro con Prisma.sql
        await prisma.$executeRaw(
          Prisma.sql`
            UPDATE "User" 
            SET "pricingData" = ${JSON.stringify(pricingData)}::jsonb,
                "updatedAt" = NOW()
            WHERE id = ${professionalId}
          `
        );
      } catch (e) {
        console.log('Campo pricingData non ancora presente, salvati solo campi base');
      }
      
      return res.json(ResponseFormatter.success(
        pricingData,
        'Tariffe aggiornate con successo'
      ));
      
    } catch (error: any) {
      logger.error('Error updating pricing:', error);
      throw error;
    }
    
  } catch (error: any) {
    logger.error('Error updating professional pricing:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento delle tariffe',
      'PRICING_UPDATE_ERROR'
    ));
  }
});

/**
 * Funzione helper per calcolare il costo di trasferimento con scaglioni
 */
export function calculateTravelCost(
  distanceKm: number,
  pricingData: any
): number {
  // Se la distanza è nei km gratuiti, costo zero
  const freeKm = pricingData.freeKm || 10;
  const billableKm = Math.max(0, distanceKm - freeKm);
  
  if (billableKm <= 0) {
    return pricingData.baseCost || 10; // Solo costo base
  }
  
  let travelCost = pricingData.baseCost || 10; // Parti dal costo base
  
  // Se abbiamo scaglioni, usali
  if (pricingData.costRanges && pricingData.costRanges.length > 0) {
    let remainingKm = billableKm;
    
    for (const range of pricingData.costRanges) {
      if (remainingKm <= 0) break;
      
      const rangeKm = range.toKm 
        ? Math.min(remainingKm, range.toKm - range.fromKm)
        : remainingKm;
      
      // costPerKm è in centesimi, convertiamo in euro
      const costPerKm = range.costPerKm / 100;
      travelCost += rangeKm * costPerKm;
      remainingKm -= rangeKm;
    }
  } else {
    // Usa tariffa semplice
    const costPerKm = pricingData.costPerKm || 0.50;
    travelCost += billableKm * costPerKm;
  }
  
  return Math.round(travelCost * 100) / 100; // Arrotonda a 2 decimali
}

export default router;