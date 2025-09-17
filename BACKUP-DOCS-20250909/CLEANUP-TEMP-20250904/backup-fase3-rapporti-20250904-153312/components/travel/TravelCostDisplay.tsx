/**
 * TravelCostDisplay Component
 * Visualizzazione pubblica delle tariffe di trasferimento
 * Mostra le tariffe in modo chiaro per i clienti
 */

import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  CurrencyEuroIcon,
  InformationCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface CostRange {
  fromKm: number;
  toKm: number | null;
  costPerKm: number;
}

interface Supplement {
  type: 'WEEKEND' | 'NIGHT' | 'HOLIDAY' | 'URGENT';
  percentage: number;
  fixedAmount: number;
  isActive: boolean;
}

interface TravelCostData {
  baseCost: number;
  costRanges: CostRange[];
  supplements: Supplement[];
  freeDistanceKm: number;
  isActive: boolean;
}

interface TravelCostDisplayProps {
  professionalId?: string;
  compact?: boolean;
}

export function TravelCostDisplay({ professionalId, compact = false }: TravelCostDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [costData, setCostData] = useState<TravelCostData | null>(null);

  const supplementLabels = {
    WEEKEND: 'Weekend',
    NIGHT: 'Notturno',
    HOLIDAY: 'Festivi',
    URGENT: 'Urgente'
  };

  const supplementDescriptions = {
    WEEKEND: 'Sabato e Domenica',
    NIGHT: 'Dalle 20:00 alle 08:00',
    HOLIDAY: 'Giorni festivi nazionali',
    URGENT: 'Intervento entro 24 ore'
  };

  useEffect(() => {
    if (professionalId) {
      fetchCostSettings();
    }
  }, [professionalId]);

  const fetchCostSettings = async () => {
    setLoading(true);
    try {
      const endpoint = professionalId 
        ? `/travel/professional/${professionalId}/cost-settings`
        : '/travel/cost-settings';
      
      const response = await api.get(endpoint);
      
      if (response.data.success && response.data.data) {
        setCostData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cost settings:', error);
      setCostData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatEuro = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Caricamento tariffe...</span>
        </div>
      </div>
    );
  }

  if (!costData || !costData.isActive) {
    return null;
  }

  if (compact) {
    // Versione compatta per card o liste
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TruckIcon className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Costo Trasferimento</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-900">
              €{formatEuro(costData.baseCost)}
            </span>
            <span className="text-gray-600 ml-1">
              + €{formatEuro(costData.costRanges[0].costPerKm)}/km
            </span>
          </div>
        </div>
        {costData.freeDistanceKm > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Primi {costData.freeDistanceKm} km gratuiti
          </p>
        )}
      </div>
    );
  }

  // Versione completa
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
        <div className="flex items-center">
          <TruckIcon className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tariffe Trasferimento</h3>
            <p className="text-sm text-gray-600">Costi trasparenti per gli spostamenti</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Costo Base e Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CurrencyEuroIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Costo Base Chiamata</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              €{formatEuro(costData.baseCost)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Applicato per ogni intervento
            </p>
          </div>

          {costData.freeDistanceKm > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Distanza Gratuita</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {costData.freeDistanceKm} km
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Nessun costo aggiuntivo
              </p>
            </div>
          )}
        </div>

        {/* Tabella Scaglioni */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tariffe Chilometriche</h4>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distanza
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo per km
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costData.costRanges.map((range, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {range.fromKm === 0 && costData.freeDistanceKm > 0 ? (
                        <span>
                          Da {costData.freeDistanceKm} a {range.toKm || '∞'} km
                        </span>
                      ) : (
                        <span>
                          {range.fromKm} - {range.toKm || '∞'} km
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className="font-semibold text-gray-900">
                        €{formatEuro(range.costPerKm)}
                      </span>
                      <span className="text-gray-500 ml-1">/km</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplementi Attivi */}
        {costData.supplements.some(s => s.isActive) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Supplementi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {costData.supplements.filter(s => s.isActive).map((supplement) => (
                <div key={supplement.type} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {supplementLabels[supplement.type]}
                    </p>
                    <p className="text-xs text-gray-600">
                      {supplementDescriptions[supplement.type]}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {supplement.percentage > 0 && `+${supplement.percentage}%`}
                      {supplement.percentage > 0 && supplement.fixedAmount > 0 && ' + '}
                      {supplement.fixedAmount > 0 && `€${formatEuro(supplement.fixedAmount)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Esempio di Calcolo */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Come viene calcolato il costo?</p>
              <p>
                Il costo totale del trasferimento include il costo base più il costo chilometrico 
                in base alla distanza. Eventuali supplementi vengono applicati per interventi 
                in orari o giorni particolari.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TravelCostBadge Component
 * Badge minimale per mostrare se sono previsti costi di trasferimento
 */
export function TravelCostBadge({ professionalId }: { professionalId?: string }) {
  const [hasCosts, setHasCosts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostStatus();
  }, [professionalId]);

  const fetchCostStatus = async () => {
    try {
      const endpoint = professionalId 
        ? `/travel/professional/${professionalId}/cost-settings`
        : '/travel/cost-settings';
      
      const response = await api.get(endpoint);
      
      if (response.data.success && response.data.data) {
        setHasCosts(response.data.data.isActive);
      }
    } catch (error) {
      setHasCosts(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hasCosts) {
    return null;
  }

  return (
    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <TruckIcon className="h-3.5 w-3.5 mr-1" />
      Costi trasferimento
    </div>
  );
}

export default TravelCostDisplay;