import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CurrencyEuroIcon,
  TruckIcon,
  PlusIcon,
  TrashIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

interface CostRange {
  fromKm: number;
  toKm: number | null;
  costPerKm: number; // in centesimi
}

interface Supplement {
  type: string;
  name: string;
  percentage: number;
  fixedAmount: number;
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

export default function ProfessionalPricingPage({ professionalId }: { professionalId: string }) {
  const [useRanges, setUseRanges] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData>({
    hourlyRate: 50,
    minimumRate: 30,
    baseCost: 10,
    freeKm: 10,
    costPerKm: 0.50,
    costRanges: [
      { fromKm: 0, toKm: 10, costPerKm: 100 },
      { fromKm: 10, toKm: 50, costPerKm: 80 },
      { fromKm: 50, toKm: null, costPerKm: 60 }
    ],
    supplements: [
      { type: 'weekend', name: 'Weekend (Sab-Dom)', percentage: 20, fixedAmount: 0, isActive: true },
      { type: 'notturno', name: 'Notturno (20:00-08:00)', percentage: 30, fixedAmount: 0, isActive: true },
      { type: 'festivo', name: 'Festivi', percentage: 50, fixedAmount: 0, isActive: true },
      { type: 'urgente', name: 'Urgente (entro 24h)', percentage: 0, fixedAmount: 2000, isActive: true }
    ]
  });

  // Fetch pricing data
  const { data, isLoading } = useQuery({
    queryKey: ['professional-pricing', professionalId],
    queryFn: async () => {
      const response = await api.get(`/professionals/${professionalId}/pricing`);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      if (data) {
        setPricingData(data);
        setUseRanges(!!(data.costRanges && data.costRanges.length > 0));
      }
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PricingData) => {
      return await api.put(`/professionals/${professionalId}/pricing`, data);
    },
    onSuccess: () => {
      toast.success('Tariffe salvate con successo!');
    },
    onError: () => {
      toast.error('Errore nel salvataggio delle tariffe');
    }
  });

  // Aggiungi nuovo scaglione
  const addCostRange = () => {
    const ranges = pricingData.costRanges || [];
    const lastRange = ranges[ranges.length - 1];
    const newFromKm = lastRange ? (lastRange.toKm || 100) : 0;
    
    setPricingData({
      ...pricingData,
      costRanges: [
        ...ranges.slice(0, -1), // Rimuovi l'ultimo che aveva toKm = null
        { ...lastRange, toKm: newFromKm + 10 }, // Aggiungi un limite all'ultimo
        { fromKm: newFromKm + 10, toKm: null, costPerKm: 50 } // Nuovo scaglione senza limite
      ]
    });
  };

  // Rimuovi scaglione
  const removeCostRange = (index: number) => {
    const ranges = pricingData.costRanges || [];
    if (ranges.length <= 1) return;
    
    const newRanges = ranges.filter((_, i) => i !== index);
    // Assicurati che l'ultimo scaglione non abbia limite superiore
    if (newRanges.length > 0) {
      newRanges[newRanges.length - 1].toKm = null;
    }
    
    setPricingData({
      ...pricingData,
      costRanges: newRanges
    });
  };

  // Aggiorna scaglione
  const updateCostRange = (index: number, field: keyof CostRange, value: any) => {
    const ranges = [...(pricingData.costRanges || [])];
    const numValue = field === 'costPerKm' ? parseFloat(value) || 0 : parseInt(value) || 0;
    
    if (field === 'toKm' && index < ranges.length - 1) {
      // Se cambio il toKm di uno scaglione che non è l'ultimo
      // Aggiorna anche il fromKm del successivo
      const nextIndex = index + 1;
      ranges[nextIndex] = { ...ranges[nextIndex], fromKm: numValue };
    }
    
    ranges[index] = { ...ranges[index], [field]: numValue };
    
    setPricingData({
      ...pricingData,
      costRanges: ranges
    });
  };

  // Calcola esempio di costo
  const calculateExampleCost = (distanceKm: number): number => {
    const freeKm = pricingData.freeKm || 10;
    const billableKm = Math.max(0, distanceKm - freeKm);
    
    if (billableKm <= 0) return pricingData.baseCost;
    
    let cost = pricingData.baseCost;
    
    if (useRanges && pricingData.costRanges) {
      let remainingKm = billableKm;
      
      for (const range of pricingData.costRanges) {
        if (remainingKm <= 0) break;
        
        let rangeKm = 0;
        if (range.toKm === null || range.toKm === undefined) {
          rangeKm = remainingKm;
        } else {
          const rangeSize = range.toKm - range.fromKm;
          rangeKm = Math.min(remainingKm, rangeSize);
        }
        
        cost += rangeKm * (range.costPerKm / 100);
        remainingKm -= rangeKm;
      }
    } else {
      cost += billableKm * (pricingData.costPerKm || 0.50);
    }
    
    return Math.round(cost * 100) / 100;
  };

  const handleSave = () => {
    const dataToSave = {
      ...pricingData,
      costRanges: useRanges ? pricingData.costRanges : undefined,
      costPerKm: useRanges ? undefined : pricingData.costPerKm
    };
    
    saveMutation.mutate(dataToSave);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tariffe e Costi</h2>
        <p className="mt-2 text-gray-600">Configura le tue tariffe orarie e i costi di trasferimento</p>
      </div>

      {/* Tariffe Base */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyEuroIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tariffe Base</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tariffa Oraria (€/ora)
            </label>
            <input
              type="number"
              value={pricingData.hourlyRate}
              onChange={(e) => setPricingData({ ...pricingData, hourlyRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="5"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tariffa Minima (€)
            </label>
            <input
              type="number"
              value={pricingData.minimumRate}
              onChange={(e) => setPricingData({ ...pricingData, minimumRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="5"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo Base Chiamata (€)
            </label>
            <input
              type="number"
              value={pricingData.baseCost}
              onChange={(e) => setPricingData({ ...pricingData, baseCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="1"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Costi di Trasferimento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Costi di Trasferimento</h3>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Km Gratuiti */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Km Gratuiti (inclusi nel costo base)
            </label>
            <input
              type="number"
              value={pricingData.freeKm}
              onChange={(e) => setPricingData({ ...pricingData, freeKm: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="50"
            />
            <p className="text-xs text-gray-500 mt-1">I primi {pricingData.freeKm} km sono inclusi nel costo base chiamata</p>
          </div>

          {/* Toggle Scaglioni */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="useRanges"
              checked={useRanges}
              onChange={(e) => setUseRanges(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="useRanges" className="flex-1 cursor-pointer">
              <span className="font-medium text-gray-900">Usa scaglioni chilometrici</span>
              <p className="text-sm text-gray-600">Applica tariffe differenziate per fasce di distanza</p>
            </label>
          </div>

          {/* Configurazione Tariffe */}
          {useRanges ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Scaglioni Chilometrici</h4>
                <button
                  onClick={addCostRange}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Aggiungi Scaglione
                </button>
              </div>
              
              {pricingData.costRanges?.map((range, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Da Km</label>
                      <input
                        type="number"
                        value={range.fromKm}
                        onChange={(e) => updateCostRange(index, 'fromKm', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                        disabled={index > 0} // Il fromKm è automatico tranne che per il primo
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">A Km</label>
                      {index === (pricingData.costRanges?.length || 0) - 1 ? (
                        <input
                          type="text"
                          value="Oltre"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100"
                          disabled
                        />
                      ) : (
                        <input
                          type="number"
                          value={range.toKm || ''}
                          onChange={(e) => updateCostRange(index, 'toKm', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min={range.fromKm + 1}
                        />
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">€/Km</label>
                      <input
                        type="number"
                        value={(range.costPerKm / 100).toFixed(2)}
                        onChange={(e) => updateCostRange(index, 'costPerKm', (parseFloat(e.target.value) * 100).toString())}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        step="0.10"
                        min="0"
                      />
                    </div>
                  </div>
                  {(pricingData.costRanges?.length || 0) > 1 && (
                    <button
                      onClick={() => removeCostRange(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo per Km (€/km)
              </label>
              <input
                type="number"
                value={pricingData.costPerKm}
                onChange={(e) => setPricingData({ ...pricingData, costPerKm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.10"
                min="0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Esempi di Calcolo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalculatorIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Esempi di Calcolo</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[10, 25, 50, 100].map(km => (
            <div key={km} className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-sm text-gray-600">{km} km</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                €{calculateExampleCost(km).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        {useRanges && pricingData.costRanges && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-2">Dettaglio scaglioni:</p>
            <ul className="space-y-1">
              {pricingData.costRanges.map((range, index) => (
                <li key={index}>
                  • {range.fromKm}-{range.toKm || '∞'} km: €{(range.costPerKm / 100).toFixed(2)}/km
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Supplementi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplementi</h3>
        
        <div className="space-y-3">
          {pricingData.supplements.map((supplement, index) => (
            <div key={supplement.type} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={supplement.isActive}
                onChange={(e) => {
                  const newSupplements = [...pricingData.supplements];
                  newSupplements[index] = { ...supplement, isActive: e.target.checked };
                  setPricingData({ ...pricingData, supplements: newSupplements });
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              
              <div className="flex-1">
                <span className="font-medium text-gray-900">{supplement.name}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {supplement.percentage > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                    +{supplement.percentage}%
                  </span>
                )}
                {supplement.fixedAmount > 0 && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                    +€{(supplement.fixedAmount / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Azioni */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annulla
        </button>
        <button
          onClick={handleSave}
          disabled={saveMutation.isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saveMutation.isLoading ? 'Salvataggio...' : 'Salva Tariffe'}
        </button>
      </div>
    </div>
  );
}
