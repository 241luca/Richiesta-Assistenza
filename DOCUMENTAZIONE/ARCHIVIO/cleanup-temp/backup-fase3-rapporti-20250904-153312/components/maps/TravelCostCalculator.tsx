/**
 * TravelCostCalculator Component
 * Calcola i costi di viaggio con tariffe complesse a scaglioni
 * Supporta supplementi per weekend, notte, urgenza e zone speciali
 */

import React, { useState, useEffect } from 'react';
import { 
  CurrencyEuroIcon,
  CalculatorIcon,
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { format, isWeekend, getHours } from 'date-fns';
import { it } from 'date-fns/locale';

interface TravelRate {
  id: string;
  name: string;
  description?: string;
  baseRate: number; // Tariffa base chiamata in centesimi
  perKmRate: number; // Tariffa base per km in centesimi
  // Scaglioni chilometrici
  kmRange1End: number; // Fino a X km
  kmRange1Rate: number; // Tariffa per questo scaglione
  kmRange2End: number; // Da X a Y km
  kmRange2Rate: number; // Tariffa per questo scaglione
  kmRange3End: number; // Da Y a Z km
  kmRange3Rate: number; // Tariffa per questo scaglione
  kmRangeOverRate: number; // Oltre Z km
  // Supplementi
  weekendSupplement: number; // Supplemento weekend in %
  nightSupplement: number; // Supplemento notturno in %
  urgencySupplement: number; // Supplemento urgenza in %
  // Zone tariffarie
  zoneARates?: Record<string, number>; // {"Milano": 500, "Roma": 800}
  zoneBRates?: Record<string, number>; // Zone speciali
}

interface TravelCostCalculatorProps {
  distance: number; // in km
  travelRate?: TravelRate;
  requestDate?: Date;
  isUrgent?: boolean;
  destinationCity?: string;
  showBreakdown?: boolean;
  onCostCalculated?: (cost: number, breakdown: CostBreakdown) => void;
}

interface CostBreakdown {
  baseCallCost: number; // Costo chiamata base
  distanceCost: number; // Costo chilometrico totale
  distanceDetails: {
    range: string;
    km: number;
    rate: number;
    cost: number;
  }[];
  weekendSupplement: number;
  nightSupplement: number;
  urgencySupplement: number;
  zoneSupplement: number;
  subtotal: number;
  supplements: number;
  total: number;
}

// Tariffa di default se non specificata
const DEFAULT_TRAVEL_RATE: TravelRate = {
  id: 'default',
  name: 'Tariffa Standard',
  description: 'Tariffa base per trasferte',
  baseRate: 0, // €0 chiamata base
  perKmRate: 50, // €0.50/km base
  kmRange1End: 10,
  kmRange1Rate: 50, // €0.50/km fino a 10km
  kmRange2End: 30,
  kmRange2Rate: 40, // €0.40/km da 10 a 30km
  kmRange3End: 50,
  kmRange3Rate: 35, // €0.35/km da 30 a 50km
  kmRangeOverRate: 30, // €0.30/km oltre 50km
  weekendSupplement: 20, // +20% weekend
  nightSupplement: 30, // +30% notte (20:00-08:00)
  urgencySupplement: 50, // +50% urgenza
};

export function TravelCostCalculator({
  distance,
  travelRate = DEFAULT_TRAVEL_RATE,
  requestDate = new Date(),
  isUrgent = false,
  destinationCity,
  showBreakdown = true,
  onCostCalculated
}: TravelCostCalculatorProps) {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    calculateCost();
  }, [distance, travelRate, requestDate, isUrgent, destinationCity]);

  const calculateCost = () => {
    if (distance <= 0) {
      setCostBreakdown(null);
      return;
    }

    // 1. Costo chiamata base
    const baseCallCost = travelRate.baseRate;

    // 2. Calcolo costo chilometrico a scaglioni
    const distanceDetails: CostBreakdown['distanceDetails'] = [];
    let remainingDistance = distance;
    let distanceCost = 0;

    // Scaglione 1: 0 - X km
    if (remainingDistance > 0) {
      const kmInRange = Math.min(remainingDistance, travelRate.kmRange1End);
      const cost = kmInRange * travelRate.kmRange1Rate;
      distanceCost += cost;
      distanceDetails.push({
        range: `0-${travelRate.kmRange1End} km`,
        km: kmInRange,
        rate: travelRate.kmRange1Rate,
        cost
      });
      remainingDistance -= kmInRange;
    }

    // Scaglione 2: X - Y km
    if (remainingDistance > 0) {
      const kmInRange = Math.min(remainingDistance, travelRate.kmRange2End - travelRate.kmRange1End);
      const cost = kmInRange * travelRate.kmRange2Rate;
      distanceCost += cost;
      distanceDetails.push({
        range: `${travelRate.kmRange1End}-${travelRate.kmRange2End} km`,
        km: kmInRange,
        rate: travelRate.kmRange2Rate,
        cost
      });
      remainingDistance -= kmInRange;
    }

    // Scaglione 3: Y - Z km
    if (remainingDistance > 0) {
      const kmInRange = Math.min(remainingDistance, travelRate.kmRange3End - travelRate.kmRange2End);
      const cost = kmInRange * travelRate.kmRange3Rate;
      distanceCost += cost;
      distanceDetails.push({
        range: `${travelRate.kmRange2End}-${travelRate.kmRange3End} km`,
        km: kmInRange,
        rate: travelRate.kmRange3Rate,
        cost
      });
      remainingDistance -= kmInRange;
    }

    // Scaglione 4: Oltre Z km
    if (remainingDistance > 0) {
      const cost = remainingDistance * travelRate.kmRangeOverRate;
      distanceCost += cost;
      distanceDetails.push({
        range: `Oltre ${travelRate.kmRange3End} km`,
        km: remainingDistance,
        rate: travelRate.kmRangeOverRate,
        cost
      });
    }

    // 3. Calcolo supplementi
    const subtotal = baseCallCost + distanceCost;
    let supplements = 0;

    // Supplemento weekend
    let weekendSupplement = 0;
    if (isWeekend(requestDate) && travelRate.weekendSupplement > 0) {
      weekendSupplement = Math.round(subtotal * (travelRate.weekendSupplement / 100));
      supplements += weekendSupplement;
    }

    // Supplemento notturno (20:00 - 08:00)
    let nightSupplement = 0;
    const hour = getHours(requestDate);
    if ((hour >= 20 || hour < 8) && travelRate.nightSupplement > 0) {
      nightSupplement = Math.round(subtotal * (travelRate.nightSupplement / 100));
      supplements += nightSupplement;
    }

    // Supplemento urgenza
    let urgencySupplement = 0;
    if (isUrgent && travelRate.urgencySupplement > 0) {
      urgencySupplement = Math.round(subtotal * (travelRate.urgencySupplement / 100));
      supplements += urgencySupplement;
    }

    // Supplemento zona
    let zoneSupplement = 0;
    if (destinationCity && travelRate.zoneARates) {
      if (travelRate.zoneARates[destinationCity]) {
        zoneSupplement = travelRate.zoneARates[destinationCity];
        supplements += zoneSupplement;
      } else if (travelRate.zoneBRates && travelRate.zoneBRates[destinationCity]) {
        zoneSupplement = travelRate.zoneBRates[destinationCity];
        supplements += zoneSupplement;
      }
    }

    // 4. Totale finale
    const total = subtotal + supplements;

    const breakdown: CostBreakdown = {
      baseCallCost,
      distanceCost,
      distanceDetails,
      weekendSupplement,
      nightSupplement,
      urgencySupplement,
      zoneSupplement,
      subtotal,
      supplements,
      total
    };

    setCostBreakdown(breakdown);

    // Callback con risultati
    if (onCostCalculated) {
      onCostCalculated(total, breakdown);
    }
  };

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatRate = (cents: number): string => {
    return `€${(cents / 100).toFixed(2)}/km`;
  };

  if (!costBreakdown) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header con totale */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CurrencyEuroIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500">Costo Viaggio Stimato</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(costBreakdown.total)}
              </p>
            </div>
          </div>
          
          {showBreakdown && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              {isExpanded ? 'Nascondi' : 'Mostra'} dettagli
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Info supplementi attivi */}
        {costBreakdown.supplements > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {costBreakdown.weekendSupplement > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Weekend +{travelRate.weekendSupplement}%
              </span>
            )}
            {costBreakdown.nightSupplement > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Notturno +{travelRate.nightSupplement}%
              </span>
            )}
            {costBreakdown.urgencySupplement > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Urgenza +{travelRate.urgencySupplement}%
              </span>
            )}
            {costBreakdown.zoneSupplement > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Zona {destinationCity}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dettaglio costi (espandibile) */}
      {showBreakdown && isExpanded && (
        <div className="p-4 space-y-4">
          {/* Costi base */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Costi Base</h4>
            <div className="space-y-2">
              {costBreakdown.baseCallCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Chiamata base</span>
                  <span className="font-medium">{formatCurrency(costBreakdown.baseCallCost)}</span>
                </div>
              )}
              
              {/* Dettaglio scaglioni chilometrici */}
              {costBreakdown.distanceDetails.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {detail.range}: {detail.km.toFixed(1)} km × {formatRate(detail.rate)}
                  </span>
                  <span className="font-medium">{formatCurrency(detail.cost)}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotale</span>
                <span>{formatCurrency(costBreakdown.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Supplementi */}
          {costBreakdown.supplements > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Supplementi</h4>
              <div className="space-y-2">
                {costBreakdown.weekendSupplement > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Weekend (+{travelRate.weekendSupplement}%)
                    </span>
                    <span className="font-medium text-purple-600">
                      +{formatCurrency(costBreakdown.weekendSupplement)}
                    </span>
                  </div>
                )}
                
                {costBreakdown.nightSupplement > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Notturno (+{travelRate.nightSupplement}%)
                    </span>
                    <span className="font-medium text-indigo-600">
                      +{formatCurrency(costBreakdown.nightSupplement)}
                    </span>
                  </div>
                )}
                
                {costBreakdown.urgencySupplement > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Urgenza (+{travelRate.urgencySupplement}%)
                    </span>
                    <span className="font-medium text-red-600">
                      +{formatCurrency(costBreakdown.urgencySupplement)}
                    </span>
                  </div>
                )}
                
                {costBreakdown.zoneSupplement > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Supplemento zona {destinationCity}
                    </span>
                    <span className="font-medium text-orange-600">
                      +{formatCurrency(costBreakdown.zoneSupplement)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Totale finale */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-900">Totale</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(costBreakdown.total)}
              </span>
            </div>
          </div>

          {/* Note informative */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-xs text-blue-700">
                  Il costo è calcolato in base alla tariffa "{travelRate.name}" con scaglioni chilometrici progressivi.
                  Il prezzo finale potrebbe variare in base al traffico e al percorso effettivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelCostCalculator;
