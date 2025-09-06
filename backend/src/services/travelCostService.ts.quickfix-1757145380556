/**
 * Travel Cost Service - VERSIONE SEMPLIFICATA
 * Usa SOLO le tabelle travel_cost_settings, travel_cost_ranges, travel_supplements
 * NO riferimenti a TravelCostRules che non esiste
 */

import { PrismaClient } from '@prisma/client';
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
   */
  async getCostSettings(professionalId: string): Promise<TravelCostSettings | null> {
    try {
      logger.info(`[TravelCostService] Getting cost settings for professional: ${professionalId}`);
      
      const settings = await prisma.$queryRaw<any[]>`
        SELECT 
          tcs.id,
          tcs.professional_id,
          tcs.base_cost,
          tcs.free_distance_km,
          tcs.is_active
        FROM travel_cost_settings tcs
        WHERE tcs.professional_id = ${professionalId}
        LIMIT 1
      `;

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
      
      // Recupera gli scaglioni
      const ranges = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          from_km as "fromKm",
          to_km as "toKm",
          cost_per_km as "costPerKm",
          order_index as "orderIndex"
        FROM travel_cost_ranges
        WHERE settings_id = ${settingsData.id}::uuid
        ORDER BY order_index
      `;
      
      logger.info(`[TravelCostService] Found ${ranges.length} cost ranges`);
      
      // Recupera i supplementi
      const supplements = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          supplement_type as "type",
          percentage,
          fixed_amount as "fixedAmount",
          is_active as "isActive"
        FROM travel_supplements
        WHERE settings_id = ${settingsData.id}::uuid
        ORDER BY supplement_type
      `;
      
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
        // Verifica se esistono già le impostazioni
        const existingSettings = await tx.$queryRaw<any[]>`
          SELECT id FROM travel_cost_settings 
          WHERE professional_id = ${settings.professionalId}
          LIMIT 1
        `;

        logger.info(`[TravelCostService] Existing settings found: ${existingSettings.length > 0}`);

        let settingsId: string;

        if (existingSettings.length > 0) {
          // AGGIORNA le impostazioni esistenti
          settingsId = existingSettings[0].id;
          logger.info(`[TravelCostService] UPDATING existing settings with id: ${settingsId}`);
          
          const updateResult = await tx.$executeRaw`
            UPDATE travel_cost_settings 
            SET 
              base_cost = ${settings.baseCost}::integer,
              free_distance_km = ${settings.freeDistanceKm}::integer,
              is_active = ${settings.isActive}::boolean,
              updated_at = NOW()
            WHERE id = ${settingsId}::uuid
          `;
          
          logger.info(`[TravelCostService] Updated ${updateResult} rows`);

          // Elimina i vecchi scaglioni e supplementi
          const deletedRanges = await tx.$executeRaw`
            DELETE FROM travel_cost_ranges WHERE settings_id = ${settingsId}::uuid
          `;
          logger.info(`[TravelCostService] Deleted ${deletedRanges} old ranges`);
          
          const deletedSupplements = await tx.$executeRaw`
            DELETE FROM travel_supplements WHERE settings_id = ${settingsId}::uuid
          `;
          logger.info(`[TravelCostService] Deleted ${deletedSupplements} old supplements`);
          
        } else {
          // CREA nuove impostazioni
          logger.info(`[TravelCostService] CREATING new settings for professional: ${settings.professionalId}`);
          
          const newSettings = await tx.$queryRaw<any[]>`
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
          `;
          
          settingsId = newSettings[0].id;
          logger.info(`[TravelCostService] Created new settings with id: ${settingsId}`);
        }

        // Inserisci i nuovi scaglioni
        if (settings.costRanges && settings.costRanges.length > 0) {
          logger.info(`[TravelCostService] Inserting ${settings.costRanges.length} cost ranges`);
          
          for (let i = 0; i < settings.costRanges.length; i++) {
            const range = settings.costRanges[i];
            logger.info(`[TravelCostService] Range ${i}: from ${range.fromKm} to ${range.toKm} at ${range.costPerKm} per km`);
            
            const insertedRange = await tx.$executeRaw`
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
                ${range.toKm}::integer,
                ${range.costPerKm}::integer,
                ${i}::integer,
                NOW()
              )
            `;
            logger.info(`[TravelCostService] Inserted range ${i}: ${insertedRange} rows`);
          }
        }

        // Inserisci i supplementi
        if (settings.supplements && settings.supplements.length > 0) {
          logger.info(`[TravelCostService] Inserting ${settings.supplements.length} supplements`);
          
          for (const supplement of settings.supplements) {
            logger.info(`[TravelCostService] Supplement ${supplement.type}: ${supplement.percentage}% + ${supplement.fixedAmount} (active: ${supplement.isActive})`);
            
            const insertedSupplement = await tx.$executeRaw`
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
            `;
            logger.info(`[TravelCostService] Inserted supplement ${supplement.type}: ${insertedSupplement} rows`);
          }
        }

        logger.info(`[TravelCostService] Transaction completed, retrieving saved settings`);
        
        // Recupera le impostazioni salvate per conferma
        const savedSettings = await this.getCostSettings(settings.professionalId);
        
        if (!savedSettings) {
          throw new Error('Failed to retrieve saved settings');
        }
        
        logger.info(`[TravelCostService] ====== SAVE COMPLETED ======`);
        return savedSettings;
      });
    } catch (error) {
      logger.error('[TravelCostService] ====== SAVE ERROR ======');
      logger.error('[TravelCostService] Error details:', error);
      throw error;
    }
  }

  /**
   * Calcola il costo del trasferimento in base alle impostazioni
   */
  async calculateTravelCost(
    professionalId: string,
    distanceKm: number,
    options?: {
      isWeekend?: boolean;
      isNight?: boolean;
      isHoliday?: boolean;
      isUrgent?: boolean;
    }
  ): Promise<{
    baseCost: number;
    distanceCost: number;
    supplements: number;
    totalCost: number;
    breakdown: any;
  }> {
    try {
      const settings = await this.getCostSettings(professionalId);
      
      if (!settings || !settings.isActive) {
        // Se non ci sono impostazioni, usa i valori di default
        const defaultBaseCost = 1000; // €10.00
        const defaultPerKm = 100; // €1.00/km
        const distanceCost = Math.max(0, distanceKm) * defaultPerKm;
        
        return {
          baseCost: defaultBaseCost,
          distanceCost,
          supplements: 0,
          totalCost: defaultBaseCost + distanceCost,
          breakdown: {
            distance: distanceKm,
            freeKm: 0,
            chargedKm: distanceKm,
            perKmRate: defaultPerKm,
            isDefault: true
          }
        };
      }

      // Calcola la distanza a pagamento
      const chargeableDistance = Math.max(0, distanceKm - settings.freeDistanceKm);
      
      // Calcola il costo per la distanza usando gli scaglioni
      let distanceCost = 0;
      let remainingDistance = chargeableDistance;
      const breakdown: any[] = [];

      if (settings.costRanges && settings.costRanges.length > 0) {
        for (const range of settings.costRanges) {
          if (remainingDistance <= 0) break;
          
          const rangeStart = range.fromKm;
          const rangeEnd = range.toKm || Infinity;
          const rangeSize = rangeEnd - rangeStart;
          
          // Calcola quanti km rientrano in questo scaglione
          const kmInRange = Math.min(remainingDistance, rangeSize);
          
          if (kmInRange > 0) {
            const costForRange = kmInRange * range.costPerKm;
            distanceCost += costForRange;
            remainingDistance -= kmInRange;
            
            breakdown.push({
              fromKm: range.fromKm,
              toKm: range.toKm,
              km: kmInRange,
              perKm: range.costPerKm,
              cost: costForRange
            });
          }
        }
      }

      // Calcola i supplementi
      let supplementsTotal = 0;
      const appliedSupplements: any[] = [];

      if (settings.supplements && settings.supplements.length > 0) {
        for (const supplement of settings.supplements) {
          if (!supplement.isActive) continue;
          
          let apply = false;
          switch (supplement.type) {
            case 'WEEKEND':
              apply = options?.isWeekend || false;
              break;
            case 'NIGHT':
              apply = options?.isNight || false;
              break;
            case 'HOLIDAY':
              apply = options?.isHoliday || false;
              break;
            case 'URGENT':
              apply = options?.isUrgent || false;
              break;
          }
          
          if (apply) {
            const percentageAmount = (settings.baseCost + distanceCost) * (supplement.percentage / 100);
            const totalSupplement = percentageAmount + supplement.fixedAmount;
            
            supplementsTotal += totalSupplement;
            appliedSupplements.push({
              type: supplement.type,
              percentage: supplement.percentage,
              fixedAmount: supplement.fixedAmount,
              totalAmount: totalSupplement
            });
          }
        }
      }

      const totalCost = settings.baseCost + distanceCost + supplementsTotal;

      return {
        baseCost: settings.baseCost,
        distanceCost,
        supplements: supplementsTotal,
        totalCost,
        breakdown: {
          distance: distanceKm,
          freeKm: settings.freeDistanceKm,
          chargedKm: chargeableDistance,
          ranges: breakdown,
          appliedSupplements,
          isDefault: false
        }
      };
    } catch (error) {
      logger.error('Error calculating travel cost:', error);
      // Ritorna valori di default in caso di errore
      const defaultBaseCost = 1000;
      const defaultPerKm = 100;
      const distanceCost = Math.max(0, distanceKm) * defaultPerKm;
      
      return {
        baseCost: defaultBaseCost,
        distanceCost,
        supplements: 0,
        totalCost: defaultBaseCost + distanceCost,
        breakdown: {
          distance: distanceKm,
          freeKm: 0,
          chargedKm: distanceKm,
          perKmRate: defaultPerKm,
          isDefault: true,
          error: true
        }
      };
    }
  }
}

export const travelCostService = new TravelCostService();