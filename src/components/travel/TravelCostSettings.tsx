/**
 * TravelCostSettings Component
 * Gestione delle tariffe di trasferimento per i professionisti
 * Permette di configurare costi per km, supplementi e zone
 * FIXED: Aggiunta key prop mancante per evitare warning React
 */

import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  CurrencyEuroIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface CostRange {
  id?: string;
  fromKm: number;
  toKm: number | null;
  costPerKm: number; // in cents
}

interface Supplement {
  id?: string;
  type: 'WEEKEND' | 'NIGHT' | 'HOLIDAY' | 'URGENT';
  percentage: number;
  fixedAmount: number; // in cents
  isActive: boolean;
}

interface TravelCostData {
  professionalId: string;
  baseCost: number; // in cents
  costRanges: CostRange[];
  supplements: Supplement[];
  freeDistanceKm: number;
  isActive: boolean;
}

export function TravelCostSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [costData, setCostData] = useState<TravelCostData>({
    professionalId: '',
    baseCost: 1000, // €10.00 default
    costRanges: [
      { fromKm: 0, toKm: 10, costPerKm: 100 }, // €1.00/km per i primi 10km
      { fromKm: 10, toKm: 50, costPerKm: 80 },  // €0.80/km da 10 a 50km
      { fromKm: 50, toKm: null, costPerKm: 60 } // €0.60/km oltre 50km
    ],
    supplements: [
      { type: 'WEEKEND', percentage: 20, fixedAmount: 0, isActive: false },
      { type: 'NIGHT', percentage: 30, fixedAmount: 0, isActive: false },
      { type: 'HOLIDAY', percentage: 50, fixedAmount: 0, isActive: false },
      { type: 'URGENT', percentage: 0, fixedAmount: 2000, isActive: false } // €20 fisso
    ],
    freeDistanceKm: 0,
    isActive: true
  });

  const supplementLabels = {
    WEEKEND: 'Weekend (Sab-Dom)',
    NIGHT: 'Notturno (20:00-08:00)',
    HOLIDAY: 'Festivi',
    URGENT: 'Urgente (entro 24h)'
  };

  useEffect(() => {
    fetchCostSettings();
  }, []);

  const fetchCostSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/travel/cost-settings');
      if (response.data.success && response.data.data) {
        setCostData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cost settings:', error);
      // Se non ci sono impostazioni salvate, usa i default
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Valida i dati prima di salvare
      if (!validateCostRanges()) {
        toast.error('Controlla gli scaglioni chilometrici');
        setSaving(false);
        return;
      }

      const response = await api.post('/travel/cost-settings', costData);
      
      if (response.data.success) {
        toast.success('Tariffe salvate con successo!');
      } else {
        toast.error('Errore nel salvataggio delle tariffe');
      }
    } catch (error) {
      console.error('Error saving cost settings:', error);
      toast.error('Errore nel salvataggio delle tariffe');
    } finally {
      setSaving(false);
    }
  };

  const validateCostRanges = (): boolean => {
    // Verifica che gli scaglioni siano contigui e non si sovrappongano
    for (let i = 0; i < costData.costRanges.length - 1; i++) {
      const current = costData.costRanges[i];
      const next = costData.costRanges[i + 1];
      
      if (current.toKm === null) {
        toast.error(`Lo scaglione ${i + 1} non può avere "fino a" illimitato se non è l'ultimo`);
        return false;
      }
      
      if (next.fromKm !== current.toKm) {
        toast.error(`Gap o sovrapposizione tra scaglione ${i + 1} e ${i + 2}`);
        return false;
      }
    }
    return true;
  };

  const addCostRange = () => {
    const lastRange = costData.costRanges[costData.costRanges.length - 1];
    const newFromKm = lastRange.toKm || lastRange.fromKm + 10;
    
    setCostData({
      ...costData,
      costRanges: [
        ...costData.costRanges.slice(0, -1),
        { ...lastRange, toKm: newFromKm },
        { fromKm: newFromKm, toKm: null, costPerKm: 50 }
      ]
    });
  };

  const removeCostRange = (index: number) => {
    if (costData.costRanges.length <= 1) {
      toast.error('Deve esserci almeno uno scaglione');
      return;
    }
    
    const newRanges = [...costData.costRanges];
    newRanges.splice(index, 1);
    
    // Aggiusta il fromKm del range successivo se necessario
    if (index < newRanges.length) {
      newRanges[index].fromKm = index > 0 ? newRanges[index - 1].toKm! : 0;
    }
    
    setCostData({ ...costData, costRanges: newRanges });
  };

  const updateCostRange = (index: number, field: keyof CostRange, value: any) => {
    const newRanges = [...costData.costRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    
    // Se modifichi il toKm, aggiorna il fromKm del successivo
    if (field === 'toKm' && index < newRanges.length - 1) {
      newRanges[index + 1].fromKm = value;
    }
    
    setCostData({ ...costData, costRanges: newRanges });
  };

  const updateSupplement = (index: number, field: keyof Supplement, value: any) => {
    const newSupplements = [...costData.supplements];
    newSupplements[index] = { ...newSupplements[index], [field]: value };
    setCostData({ ...costData, supplements: newSupplements });
  };

  const formatEuro = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  const parseEuro = (value: string): number => {
    return Math.round(parseFloat(value) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Caricamento tariffe...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TruckIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tariffe Trasferimento</h2>
              <p className="text-sm text-gray-600">Configura i costi per gli spostamenti verso i clienti</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={costData.isActive}
                onChange={(e) => setCostData({ ...costData, isActive: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Attivo</span>
            </label>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Costo Base */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Costo Base Chiamata
            </label>
            <InformationCircleIcon 
              className="h-5 w-5 text-gray-400"
              title="Costo fisso applicato per ogni intervento, indipendentemente dalla distanza"
            />
          </div>
          <div className="flex items-center">
            <CurrencyEuroIcon className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="number"
              step="0.50"
              value={formatEuro(costData.baseCost)}
              onChange={(e) => setCostData({ ...costData, baseCost: parseEuro(e.target.value) })}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10.00"
            />
            <span className="ml-2 text-gray-600">EUR</span>
          </div>
        </div>

        {/* Distanza Gratuita */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Distanza Gratuita
            </label>
            <InformationCircleIcon 
              className="h-5 w-5 text-gray-400"
              title="Primi km non addebitati al cliente"
            />
          </div>
          <div className="flex items-center">
            <input
              type="number"
              step="1"
              min="0"
              value={costData.freeDistanceKm}
              onChange={(e) => setCostData({ ...costData, freeDistanceKm: parseInt(e.target.value) || 0 })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
            <span className="ml-2 text-gray-600">km gratuiti</span>
          </div>
        </div>

        {/* Scaglioni Chilometrici */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Scaglioni Chilometrici</h3>
            <button
              onClick={addCostRange}
              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Aggiungi Scaglione
            </button>
          </div>
          
          <div className="space-y-2">
            {costData.costRanges.map((range, index) => (
              <div key={`range-${index}`} className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-600 w-16">Da km</span>
                <input
                  type="number"
                  value={range.fromKm}
                  disabled
                  className="w-20 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
                />
                
                <span className="text-sm text-gray-600">a</span>
                
                {index === costData.costRanges.length - 1 ? (
                  <span className="w-20 px-2 py-1 text-sm font-medium text-blue-600">∞</span>
                ) : (
                  <input
                    type="number"
                    value={range.toKm || ''}
                    onChange={(e) => updateCostRange(index, 'toKm', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                )}
                
                <span className="text-sm text-gray-600">km</span>
                
                <div className="flex items-center flex-1 justify-end space-x-2">
                  <CurrencyEuroIcon className="h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.10"
                    value={formatEuro(range.costPerKm)}
                    onChange={(e) => updateCostRange(index, 'costPerKm', parseEuro(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="1.00"
                  />
                  <span className="text-sm text-gray-600">/km</span>
                  
                  {costData.costRanges.length > 1 && (
                    <button
                      onClick={() => removeCostRange(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supplementi */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Supplementi</h3>
          <div className="space-y-2">
            {costData.supplements.map((supplement, index) => (
              <div key={`supplement-${supplement.type}`} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={supplement.isActive}
                  onChange={(e) => updateSupplement(index, 'isActive', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                
                <span className="text-sm font-medium text-gray-700 w-40">
                  {supplementLabels[supplement.type]}
                </span>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={supplement.percentage}
                    onChange={(e) => updateSupplement(index, 'percentage', parseInt(e.target.value) || 0)}
                    disabled={!supplement.isActive}
                    className={`w-16 px-2 py-1 border border-gray-300 rounded text-sm ${
                      !supplement.isActive ? 'bg-gray-100' : 'focus:ring-2 focus:ring-blue-500'
                    }`}
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                
                <span className="text-sm text-gray-600">+</span>
                
                <div className="flex items-center space-x-2">
                  <CurrencyEuroIcon className="h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formatEuro(supplement.fixedAmount)}
                    onChange={(e) => updateSupplement(index, 'fixedAmount', parseEuro(e.target.value))}
                    disabled={!supplement.isActive}
                    className={`w-20 px-2 py-1 border border-gray-300 rounded text-sm ${
                      !supplement.isActive ? 'bg-gray-100' : 'focus:ring-2 focus:ring-blue-500'
                    }`}
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-600">fisso</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Esempio di Calcolo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Esempio di Calcolo</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Per un intervento a 25 km di distanza:</p>
            <ul className="ml-4 space-y-1">
              <li>• Costo base: €{formatEuro(costData.baseCost)}</li>
              <li>• Primi {costData.freeDistanceKm} km: Gratis</li>
              {costData.costRanges.map((range, index) => {
                if (25 > range.fromKm) {
                  const kmInRange = Math.min(25, range.toKm || 25) - Math.max(range.fromKm, costData.freeDistanceKm);
                  if (kmInRange > 0) {
                    return (
                      <li key={`calc-range-${index}`}>
                        • {kmInRange} km × €{formatEuro(range.costPerKm)}/km = €{formatEuro(kmInRange * range.costPerKm)}
                      </li>
                    );
                  }
                }
                return null;
              }).filter(Boolean)}
              <li className="font-semibold pt-1 border-t border-blue-300">
                Totale: €{
                  formatEuro(
                    costData.baseCost + 
                    costData.costRanges.reduce((total, range) => {
                      const kmInRange = Math.min(25, range.toKm || 25) - Math.max(range.fromKm, costData.freeDistanceKm);
                      return total + (kmInRange > 0 ? kmInRange * range.costPerKm : 0);
                    }, 0)
                  )
                }
              </li>
            </ul>
          </div>
        </div>

        {/* Pulsanti Azione */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={fetchCostSettings}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Salva Tariffe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TravelCostSettings;