/**
 * Travel Cost Service - VERSIONE SICURA (SQL INJECTION FIX)
 * Usa SOLO le tabelle travel_cost_settings, travel_cost_ranges, travel_supplements
 * 
 * CHANGELOG:
 * - v2.0.0: Fix SQL Injection usando Prisma.sql con parametri tipizzati
 * - Tutte le query raw ora usano template literals con Prisma.sql
 * - Nessuna concatenazione diretta di stringhe
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CostRange {
  id?: string;
  fromKm: number;
  toKm: number | null;
  costPerKm: number;
  orderIndex?: number;
}

export interface Supplement {
  id?: string;
  type: 'WEEKEND' | 'NIGHT' | 'HOLIDAY' | 'URGENT';
  percentage: number;
  fixedAmount: number;
  isActive: boolean;
}

export interface TravelCostSettings {
  id?: string;
  professionalId: string;
  baseCost: number;
  freeDistanceKm: number;
  isActive: boolean;
  costRanges: CostRange[];
  supplements: Supplement[];
}

class TravelCostService {
  /**
   * Recupera le impostazioni dei costi di viaggio per un professionista
   * 🔧 FIX SQL INJECTION: Usa Prisma.sql template
   */
  async getCostSettings(professionalId: string): Promise<TravelCostSettings | null> {
    try {
      logger.info(`[TravelCostService] Getting cost settings for professional: ${professionalId}`);
      
      // 🔧 FIX: Usa Prisma.sql per query sicura
      const settings = await prisma.$queryRaw<any[]>(
        Prisma.sql`
          SELECT 
            tcs.id,
            tcs.professional_id,
            tcs.base_cost,
            tcs.free_distance_km,
            tcs.is_active
          FROM travel_cost_settings tcs
          WHERE tcs.professional_id = ${professionalId}
          LIMIT 1
        `
      );

      if (settings.length === 0) {
        logger.info(`[TravelCostService] No settings found, returning defaults for professional ${professionalId}`);
        // Ritorna impostazioni di default se non esistono
        return {
          professionalId: professionalId,
          baseCost: 1000, // €10.00
          freeDistanceKm: 0,
          isActive: false,
          costRanges: [
            { fromKm: 0, toKm: 10, costPerKm: 100 },
            { fromKm: 10, toKm: 50, costPerKm: 80 },
            { fromKm: 50, toKm: null, costPerKm: 60 }
          ],
          supplements: [
            { type: 'WEEKEND' as const, percentage: 20, fixedAmount: 0, isActive: false },
            { type: 'NIGHT' as const, percentage: 30, fixedAmount: 0, isActive: false },
            { type: 'HOLIDAY' as const, percentage: 50, fixedAmount: 0, isActive: false },
            { type: 'URGENT' as const, percentage: 0, fixedAmount: 2000, isActive: false }
          ]
        };
      }

      const settingsData = settings[0];
      logger.info(`[TravelCostService] Found settings with id: ${settingsData.id}`);
      
      // 🔧 FIX: Query sicura per ranges
      const ranges = await prisma.$queryRaw<any[]>(
        Prisma.sql`
          SELECT 
            id,
            from_km as "fromKm",
            to_km as "toKm",
            cost_per_km as "costPerKm",
            order_index as "orderIndex"
          FROM travel_cost_ranges
          WHERE settings_id = ${settingsData.id}::uuid
          ORDER BY order_index
        `
      );
      
      logger.info(`[TravelCostService] Found ${ranges.length} cost ranges`);
      
      // 🔧 FIX: Query sicura per supplements
      const supplements = await prisma.$queryRaw<any[]>(
        Prisma.sql`
          SELECT 
            id,
            supplement_type as "type",
            percentage,
            fixed_amount as "fixedAmount",
            is_active as "isActive"
          FROM travel_supplements
          WHERE settings_id = ${settingsData.id}::uuid
          ORDER BY supplement_type
        `
      );
      
      logger.info(`[TravelCostService] Found ${supplements.length} supplements`);
      
      return {
        id: settingsData.id,
        professionalId: settingsData.professional_id,
        baseCost: settingsData.base_cost,
        freeDistanceKm: settingsData.free_distance_km,
        isActive: settingsData.is_active,
        costRanges: ranges.length > 0 ? ranges : [
          { fromKm: 0, toKm: 10, costPerKm: 100 },
          { fromKm: 10, toKm: 50, costPerKm: 80 },
          { fromKm: 50, toKm: null, costPerKm: 60 }
        ],
        supplements: supplements.length > 0 ? supplements : [
          { type: 'WEEKEND' as const, percentage: 20, fixedAmount: 0, isActive: false },
          { type: 'NIGHT' as const, percentage: 30, fixedAmount: 0, isActive: false },
          { type: 'HOLIDAY' as const, percentage: 50, fixedAmount: 0, isActive: false },
          { type: 'URGENT' as const, percentage: 0, fixedAmount: 2000, isActive: false }
        ]
      };
    } catch (error) {
      logger.error('[TravelCostService] Error fetching cost settings:', error);
      // Ritorna impostazioni di default in caso di errore
      return {
        professionalId: professionalId,
        baseCost: 1000,
        freeDistanceKm: 0,
        isActive: false,
        costRanges: [
          { fromKm: 0, toKm: 10, costPerKm: 100 },
          { fromKm: 10, toKm: 50, costPerKm: 80 },
          { fromKm: 50, toKm: null, costPerKm: 60 }
        ],
        supplements: [
          { type: 'WEEKEND' as const, percentage: 20, fixedAmount: 0, isActive: false },
          { type: 'NIGHT' as const, percentage: 30, fixedAmount: 0, isActive: false },
          { type: 'HOLIDAY' as const, percentage: 50, fixedAmount: 0, isActive: false },
          { type: 'URGENT' as const, percentage: 0, fixedAmount: 2000, isActive: false }
        ]
      };
    }
  }

  /**
   * Salva o aggiorna le impostazioni dei costi di viaggio
   * 🔧 FIX SQL INJECTION: Tutte le query ora usano Prisma.sql
   */
  async saveCostSettings(settings: TravelCostSettings): Promise<TravelCostSettings> {
    try {
      logger.info(`[TravelCostService] ====== SAVING SETTINGS ======`);
      logger.info(`[TravelCostService] Professional ID: ${settings.professionalId}`);
      logger.info(`[TravelCostService] Base Cost: ${settings.baseCost}`);
      logger.info(`[TravelCostService] Free Distance: ${settings.freeDistanceKm}`);
      logger.info(`[TravelCostService] Is Active: ${settings.isActive}`);
      logger.info(`[TravelCostService] Ranges: ${settings.costRanges?.length || 0}`);
      logger.info(`[TravelCostService] Supplements: ${settings.supplements?.length || 0}`);

      return await prisma.$transaction(async (tx) => {
        // 🔧 FIX: Query sicura per verificare esistenza
        const existingSettings = await tx.$queryRaw<any[]>(
          Prisma.sql`
            SELECT id FROM travel_cost_settings 
            WHERE professional_id = ${settings.professionalId}
            LIMIT 1
          `
        );

        logger.info(`[TravelCostService] Existing settings found: ${existingSettings.length > 0}`);

        let settingsId: string;

        if (existingSettings.length > 0) {
          // AGGIORNA le impostazioni esistenti
          settingsId = existingSettings[0].id;
          logger.info(`[TravelCostService] UPDATING existing settings with id: ${settingsId}`);
          
          // 🔧 FIX: Update sicuro
          const updateResult = await tx.$executeRaw(
            Prisma.sql`
              UPDATE travel_cost_settings 
              SET 
                base_cost = ${settings.baseCost}::integer,
                free_distance_km = ${settings.freeDistanceKm}::integer,
                is_active = ${settings.isActive}::boolean,
                updated_at = NOW()
              WHERE id = ${settingsId}::uuid
            `
          );
          
          logger.info(`[TravelCostService] Updated ${updateResult} rows`);

          // 🔧 FIX: Delete sicuro dei vecchi scaglioni
          const deletedRanges = await tx.$executeRaw(
            Prisma.sql`
              DELETE FROM travel_cost_ranges WHERE settings_id = ${settingsId}::uuid
            `
          );
          logger.info(`[TravelCostService] Deleted ${deletedRanges} old ranges`);
          
          // 🔧 FIX: Delete sicuro dei vecchi supplementi
          const deletedSupplements = await tx.$executeRaw(
            Prisma.sql`
              DELETE FROM travel_supplements WHERE settings_id = ${settingsId}::uuid
            `
          );
          logger.info(`[TravelCostService] Deleted ${deletedSupplements} old supplements`);
          
        } else {
          // CREA nuove impostazioni
          logger.info(`[TravelCostService] CREATING new settings for professional: ${settings.professionalId}`);
          
          // 🔧 FIX: Insert sicuro
          const newSettings = await tx.$queryRaw<any[]>(
            Prisma.sql`
              INSERT INTO travel_cost_settings (
                professional_id, 
                base_cost, 
                free_distance_km, 
                is_active,
                created_at,
                updated_at
              ) VALUES (
                ${settings.professionalId},
                ${settings.baseCost}::integer,
                ${settings.freeDistanceKm}::integer,
                ${settings.isActive}::boolean,
                NOW(),
                NOW()
              ) RETURNING id
            `
          );
          
          settingsId = newSettings[0].id;
          logger.info(`[TravelCostService] Created new settings with id: ${settingsId}`);
        }

        // Inserisci i nuovi scaglioni
        if (settings.costRanges && settings.costRanges.length > 0) {
          logger.info(`[TravelCostService] Inserting ${settings.costRanges.length} cost ranges`);
          
          for (let i = 0; i < settings.costRanges.length; i++) {
            const range = settings.costRanges[i];
            logger.info(`[TravelCostService] Range ${i}: from ${range.fromKm} to ${range.toKm} at ${range.costPerKm} per km`);
            
            // 🔧 FIX: Insert sicuro per ranges
            const insertedRange = await tx.$executeRaw(
              Prisma.sql`
                INSERT INTO travel_cost_ranges (
                  id,
                  settings_id,
                  from_km,
                  to_km,
                  cost_per_km,
                  order_index,
                  created_at
                ) VALUES (
                  gen_random_uuid(),
                  ${settingsId}::uuid,
                  ${range.fromKm}::integer,
                  ${range.toKm === null ? null : range.toKm}::integer,
                  ${range.costPerKm}::integer,
                  ${i}::integer,
                  NOW()
                )
              `
            );
            logger.info(`[TravelCostService] Inserted range ${i}: ${insertedRange} rows`);
          }
        }

        // Inserisci i supplementi
        if (settings.supplements && settings.supplements.length > 0) {
          logger.info(`[TravelCostService] Inserting ${settings.supplements.length} supplements`);
          
          for (const supplement of settings.supplements) {
            logger.info(`[TravelCostService] Supplement ${supplement.type}: ${supplement.percentage}% + ${supplement.fixedAmount} (active: ${supplement.isActive})`);
            
            // 🔧 FIX: Insert sicuro per supplements
            const insertedSupplement = await tx.$executeRaw(
              Prisma.sql`
                INSERT INTO travel_supplements (
                  id,
                  settings_id,
                  supplement_type,
                  percentage,
                  fixed_amount,
                  is_active,
                  created_at
                ) VALUES (
                  gen_random_uuid(),
                  ${settingsId}::uuid,
                  ${supplement.type}::varchar,
                  ${supplement.percentage}::integer,
                  ${supplement.fixedAmount}::integer,
                  ${supplement.isActive}::boolean,
                  NOW()
                )
              `
            );
            logger.info(`[TravelCostService] Inserted supplement ${supplement.type}: ${insertedSupplement} rows`);
          }
        }

        logger.info(`[TravelCostService] Transaction completed, retrieving saved settings`);
        
        // Recupera le impostazioni salvate per conferma
        const savedSettings = await this.getCostSettings(settings.professionalId);
        
        if (!savedSettings) {
          throw new Error('Failed to retrieve saved settings');
        }
        
        logger.info(`[TravelCostService] ====== SETTINGS SAVED SUCCESSFULLY ======`);
        return savedSettings;
      });
      
    } catch (error) {
      logger.error('[TravelCostService] Error saving cost settings:', error);
      throw error;
    }
  }

  /**
   * Calcola il costo del viaggio in base alla distanza
   * (Questo metodo non usa query SQL, quindi è già sicuro)
   */
  calculateTravelCost(
    distanceKm: number,
    settings: TravelCostSettings,
    options?: {
      isWeekend?: boolean;
      isNight?: boolean;
      isHoliday?: boolean;
      isUrgent?: boolean;
    }
  ): {
    baseCost: number;
    distanceCost: number;
    supplements: { type: string; amount: number }[];
    totalCost: number;
  } {
    logger.info(`[TravelCostService] Calculating cost for ${distanceKm}km`);
    
    // Base cost
    let baseCost = settings.baseCost || 0;
    
    // Calculate distance cost
    let distanceCost = 0;
    const chargeableDistance = Math.max(0, distanceKm - settings.freeDistanceKm);
    
    if (chargeableDistance > 0 && settings.costRanges && settings.costRanges.length > 0) {
      // Sort ranges by fromKm
      const sortedRanges = [...settings.costRanges].sort((a, b) => a.fromKm - b.fromKm);
      
      let remainingDistance = chargeableDistance;
      
      for (const range of sortedRanges) {
        if (remainingDistance <= 0) break;
        
        const rangeStart = range.fromKm;
        const rangeEnd = range.toKm || Number.MAX_SAFE_INTEGER;
        
        if (distanceKm > rangeStart) {
          const kmInRange = Math.min(remainingDistance, rangeEnd - rangeStart);
          distanceCost += kmInRange * (range.costPerKm || 0);
          remainingDistance -= kmInRange;
        }
      }
    }
    
    // Calculate supplements
    const supplementsApplied: { type: string; amount: number }[] = [];
    let totalSupplements = 0;
    
    if (settings.supplements && options) {
      for (const supplement of settings.supplements) {
        if (!supplement.isActive) continue;
        
        let shouldApply = false;
        
        switch (supplement.type) {
          case 'WEEKEND':
            shouldApply = options.isWeekend || false;
            break;
          case 'NIGHT':
            shouldApply = options.isNight || false;
            break;
          case 'HOLIDAY':
            shouldApply = options.isHoliday || false;
            break;
          case 'URGENT':
            shouldApply = options.isUrgent || false;
            break;
        }
        
        if (shouldApply) {
          const percentageAmount = ((baseCost + distanceCost) * supplement.percentage) / 100;
          const supplementAmount = percentageAmount + supplement.fixedAmount;
          
          supplementsApplied.push({
            type: supplement.type,
            amount: supplementAmount
          });
          
          totalSupplements += supplementAmount;
        }
      }
    }
    
    const totalCost = baseCost + distanceCost + totalSupplements;
    
    logger.info(`[TravelCostService] Cost calculation complete:`, {
      baseCost,
      distanceCost,
      supplements: totalSupplements,
      total: totalCost
    });
    
    return {
      baseCost,
      distanceCost,
      supplements: supplementsApplied,
      totalCost
    };
  }
}

export const travelCostService = new TravelCostService();