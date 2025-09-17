/**
 * QuoteBuilder Component
 * UPDATED: Integrazione calcolo automatico costi di viaggio con modifica manuale
 * - Checkbox per includere/escludere costi viaggio
 * - Calcolo automatico basato su distanza richiesta
 * - Possibilità di modificare manualmente il costo calcolato
 * - Toggle tra modalità automatica e manuale
 */

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentDuplicateIcon, 
  CalculatorIcon,
  TruckIcon,
  InformationCircleIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { api, apiClient } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';

// Validation schema
const quoteItemSchema = z.object({
  description: z.string().min(1, 'Descrizione richiesta'),
  quantity: z.number().min(0.01, 'Quantità deve essere maggiore di 0'),
  unitPrice: z.number().min(0, 'Prezzo unitario non può essere negativo'),
  taxRate: z.number().min(0).max(1).default(0.22),
  discount: z.number().min(0).default(0),
  itemType: z.enum(['service', 'product', 'expense', 'travel']).default('service'),
  unit: z.string().default('pz'),
  notes: z.string().optional(),
  isAutomatic: z.boolean().optional() // Flag per voci generate automaticamente
});

const quoteSchema = z.object({
  title: z.string().min(1, 'Titolo richiesto'),
  description: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  internalNotes: z.string().optional(),
  requiresDeposit: z.boolean().default(false),
  includeTravelCost: z.boolean().default(false), // Include costi viaggio
  items: z.array(quoteItemSchema).min(1, 'Almeno un articolo richiesto')
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteBuilderProps {
  requestId: string;
  onSuccess?: (quote: any) => void;
  initialData?: Partial<QuoteFormData>;
  templateId?: string;
}

interface TravelCostInfo {
  distance: number;
  duration: number;
  cost: number;
  origin: string;
  destination: string;
  costBreakdown?: {
    baseCost: number;
    distanceCost: number;
    supplements: number;
  };
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  requestId,
  onSuccess,
  initialData,
  templateId
}) => {
  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0
  });
  
  const [includeTravelCost, setIncludeTravelCost] = useState(false);
  const [travelCostInfo, setTravelCostInfo] = useState<TravelCostInfo | null>(null);
  const [loadingTravelCost, setLoadingTravelCost] = useState(false);
  const [manualEditMode, setManualEditMode] = useState(false);
  const [manualTravelCost, setManualTravelCost] = useState<number | null>(null);
  const [originalTravelCost, setOriginalTravelCost] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 giorni
      notes: '',
      termsConditions: '',
      internalNotes: '',
      requiresDeposit: false,
      includeTravelCost: false,
      items: [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 0.22,
          discount: 0,
          itemType: 'service',
          unit: 'pz',
          notes: '',
          isAutomatic: false
        }
      ]
    }
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');

  // Load request details to get address
  const { data: requestData } = useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      const response = await api.get(`/requests/${requestId}`);
      return response.data;
    },
    enabled: !!requestId
  });

  // Update travel cost item when manual cost changes
  const updateTravelCostItem = (cost: number) => {
    const travelItemIndex = fields.findIndex(item => item.itemType === 'travel' && item.isAutomatic);
    
    if (travelItemIndex >= 0 && travelCostInfo) {
      const travelItem = {
        description: manualEditMode 
          ? `Costi di trasferimento (${travelCostInfo.distance} km) - Modificato manualmente`
          : `Costi di trasferimento (${travelCostInfo.distance} km)`,
        quantity: 1,
        unitPrice: cost / 100, // Converti da centesimi a euro
        taxRate: 0.22,
        discount: 0,
        itemType: 'travel' as const,
        unit: 'forfait',
        notes: `Distanza: ${travelCostInfo.distance} km, Durata stimata: ${Math.round(travelCostInfo.duration / 60)} min${
          manualEditMode ? ' - Costo modificato manualmente' : ''
        }`,
        isAutomatic: true
      };
      
      update(travelItemIndex, travelItem);
    }
  };

  // Calculate travel cost when checkbox is checked
  const calculateTravelCost = async () => {
    if (!requestId) return;
    
    setLoadingTravelCost(true);
    try {
      const response = await api.get(`/travel/request/${requestId}/travel-info`);
      
      if (response.data.success && response.data.data) {
        const travelData = response.data.data;
        setTravelCostInfo(travelData);
        setOriginalTravelCost(travelData.cost);
        
        // Se non siamo in modalità manuale, usa il costo calcolato
        const costToUse = manualEditMode && manualTravelCost !== null 
          ? manualTravelCost 
          : travelData.cost;
        
        // Aggiungi o aggiorna la voce costi viaggio
        const travelItemIndex = fields.findIndex(item => item.itemType === 'travel' && item.isAutomatic);
        
        const travelItem = {
          description: manualEditMode 
            ? `Costi di trasferimento (${travelData.distance} km) - Modificato manualmente`
            : `Costi di trasferimento (${travelData.distance} km)`,
          quantity: 1,
          unitPrice: costToUse / 100, // Converti da centesimi a euro
          taxRate: 0.22,
          discount: 0,
          itemType: 'travel' as const,
          unit: 'forfait',
          notes: `Distanza: ${travelData.distance} km, Durata stimata: ${Math.round(travelData.duration / 60)} min${
            manualEditMode ? ' - Costo modificato manualmente' : ''
          }`,
          isAutomatic: true
        };
        
        if (travelItemIndex >= 0) {
          // Aggiorna la voce esistente
          update(travelItemIndex, travelItem);
        } else {
          // Aggiungi nuova voce
          append(travelItem);
        }
        
        toast.success('Costi di viaggio calcolati e aggiunti al preventivo');
      } else {
        toast.error('Impossibile calcolare i costi di viaggio');
        setIncludeTravelCost(false);
      }
    } catch (error: any) {
      console.error('Error calculating travel cost:', error);
      toast.error('Errore nel calcolo dei costi di viaggio');
      setIncludeTravelCost(false);
    } finally {
      setLoadingTravelCost(false);
    }
  };

  // Remove travel cost when checkbox is unchecked
  const removeTravelCost = () => {
    const travelItemIndex = fields.findIndex(item => item.itemType === 'travel' && item.isAutomatic);
    if (travelItemIndex >= 0) {
      remove(travelItemIndex);
      toast.info('Costi di viaggio rimossi dal preventivo');
    }
    setTravelCostInfo(null);
    setManualEditMode(false);
    setManualTravelCost(null);
    setOriginalTravelCost(null);
  };

  // Handle travel cost checkbox change
  const handleTravelCostChange = async (checked: boolean) => {
    setIncludeTravelCost(checked);
    setValue('includeTravelCost', checked);
    
    if (checked) {
      await calculateTravelCost();
    } else {
      removeTravelCost();
    }
  };

  // Toggle manual edit mode
  const toggleManualEdit = () => {
    if (!manualEditMode) {
      // Entering manual edit mode
      setManualEditMode(true);
      setManualTravelCost(originalTravelCost);
      toast.info('Modalità modifica manuale attivata');
    } else {
      // Exiting manual edit mode - restore original
      setManualEditMode(false);
      setManualTravelCost(null);
      if (originalTravelCost !== null) {
        updateTravelCostItem(originalTravelCost);
        toast.info('Costo ripristinato al valore calcolato');
      }
    }
  };

  // Apply manual cost
  const applyManualCost = () => {
    if (manualTravelCost !== null && manualTravelCost >= 0) {
      updateTravelCostItem(manualTravelCost);
      toast.success('Costo di trasferimento aggiornato');
    } else {
      toast.error('Inserisci un valore valido');
    }
  };

  // Load template if provided
  const { data: templates } = useQuery({
    queryKey: ['/api/quotes/templates', { subcategoryId: undefined }],
    queryFn: () => api.get('/api/quotes/templates'),
    enabled: false // Only load when needed
  });

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: (data: QuoteFormData) => {
      // Rimuovi il flag isAutomatic prima di inviare al backend
      const cleanedData = {
        ...data,
        items: data.items.map(({ isAutomatic, ...item }) => item)
      };
      return api.post(`/api/quotes`, { ...cleanedData, requestId });
    },
    onSuccess: (response) => {
      toast.success('Preventivo creato con successo');
      if (onSuccess) {
        onSuccess(response.data);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione del preventivo');
    }
  });

  // Calculate totals when items change
  useEffect(() => {
    const subtotal = watchItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const discountAmount = watchItems.reduce((sum, item) => {
      return sum + item.discount;
    }, 0);

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = watchItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice - item.discount;
      return sum + (itemTotal * item.taxRate);
    }, 0);

    const totalAmount = taxableAmount + taxAmount;

    setTotals({
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount
    });
  }, [watchItems]);

  const onSubmit = (data: QuoteFormData) => {
    createQuoteMutation.mutate(data);
  };

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0.22,
      discount: 0,
      itemType: 'service',
      unit: 'pz',
      notes: '',
      isAutomatic: false
    });
  };

  const duplicateItem = (index: number) => {
    const item = fields[index];
    append({ ...item, isAutomatic: false });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informazioni Preventivo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Titolo"
              {...register('title')}
              error={errors.title?.message}
              placeholder="es. Preventivo riparazione impianto"
            />
            
            <Input
              label="Valido fino a"
              type="date"
              {...register('validUntil')}
              error={errors.validUntil?.message}
            />
          </div>
          
          <div className="mt-4">
            <TextArea
              label="Descrizione"
              {...register('description')}
              error={errors.description?.message}
              rows={3}
              placeholder="Descrizione dettagliata del preventivo"
            />
          </div>
        </div>
      </Card>

      {/* Travel Cost Section - AGGIORNATO CON MODIFICA MANUALE */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Costi di Trasferimento</h2>
            </div>
            {requestData && (
              <div className="text-sm text-gray-600">
                <span>Destinazione: </span>
                <span className="font-medium">
                  {requestData.address}, {requestData.city}
                </span>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="includeTravelCost"
                checked={includeTravelCost}
                onChange={(e) => handleTravelCostChange(e.target.checked)}
                disabled={loadingTravelCost}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="includeTravelCost" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Includi costi di trasferimento nel preventivo
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Calcola automaticamente i costi di viaggio basati sulla distanza e li aggiunge come voce nel preventivo
                </p>
              </div>
            </div>
            
            {loadingTravelCost && (
              <div className="mt-4 flex items-center text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Calcolo costi di viaggio in corso...
              </div>
            )}
            
            {travelCostInfo && !loadingTravelCost && (
              <div className="mt-4 space-y-3">
                {/* Info di base */}
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Distanza:</span>
                      <span className="ml-2 font-medium">{travelCostInfo.distance} km</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Durata:</span>
                      <span className="ml-2 font-medium">{Math.round(travelCostInfo.duration / 60)} min</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Costo calcolato:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        € {(originalTravelCost! / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {travelCostInfo.costBreakdown && !manualEditMode && (
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Costo base:</span>
                        <span>€ {(travelCostInfo.costBreakdown.baseCost / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Costo distanza:</span>
                        <span>€ {(travelCostInfo.costBreakdown.distanceCost / 100).toFixed(2)}</span>
                      </div>
                      {travelCostInfo.costBreakdown.supplements > 0 && (
                        <div className="flex justify-between">
                          <span>Supplementi:</span>
                          <span>€ {(travelCostInfo.costBreakdown.supplements / 100).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sezione modifica manuale */}
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <PencilIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Personalizzazione costo
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleManualEdit}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        manualEditMode 
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {manualEditMode ? (
                        <>
                          <ArrowPathIcon className="h-3 w-3 inline mr-1" />
                          Ripristina calcolo automatico
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-3 w-3 inline mr-1" />
                          Modifica manualmente
                        </>
                      )}
                    </button>
                  </div>

                  {manualEditMode && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Costo personalizzato:</label>
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">€</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={manualTravelCost !== null ? (manualTravelCost / 100).toFixed(2) : ''}
                            onChange={(e) => setManualTravelCost(Math.round(parseFloat(e.target.value) * 100))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                          <button
                            type="button"
                            onClick={applyManualCost}
                            className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Applica
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <div className="flex items-start">
                          <InformationCircleIcon className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="text-xs text-orange-800">
                            <p className="font-medium">Modalità modifica manuale attiva</p>
                            <p className="mt-1">
                              Il costo originale calcolato è di € {(originalTravelCost! / 100).toFixed(2)}.
                              Puoi modificarlo secondo le tue esigenze specifiche.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!manualEditMode && originalTravelCost !== travelCostInfo.cost && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                      <div className="flex items-center text-xs text-yellow-800">
                        <InformationCircleIcon className="h-4 w-4 mr-2" />
                        <span>
                          Costo attualmente modificato manualmente. 
                          Clicca "Modifica manualmente" per cambiarlo o ripristinare il valore automatico.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Voci Preventivo</h2>
            <Button
              type="button"
              onClick={addItem}
              variant="secondary"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Aggiungi Voce
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className={`border rounded-lg p-4 ${
                  field.isAutomatic ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Voce #{index + 1}
                    </span>
                    {field.isAutomatic && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        Automatica
                      </span>
                    )}
                    {field.itemType === 'travel' && (
                      <TruckIcon className="ml-2 h-4 w-4 text-blue-600" />
                    )}
                    {field.notes?.includes('modificato manualmente') && (
                      <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded">
                        Personalizzata
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!field.isAutomatic && (
                      <button
                        type="button"
                        onClick={() => duplicateItem(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    )}
                    {fields.length > 1 && !field.isAutomatic && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <Input
                      label="Descrizione"
                      {...register(`items.${index}.description`)}
                      error={errors.items?.[index]?.description?.message}
                      placeholder="es. Manodopera"
                      disabled={field.isAutomatic}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Input
                      label="Quantità"
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      error={errors.items?.[index]?.quantity?.message}
                      disabled={field.isAutomatic}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Input
                      label="Prezzo Unit."
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      error={errors.items?.[index]?.unitPrice?.message}
                      disabled={field.isAutomatic}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Input
                      label="IVA %"
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                      error={errors.items?.[index]?.taxRate?.message}
                      disabled={field.isAutomatic}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="Tipo"
                    {...register(`items.${index}.itemType`)}
                    disabled={field.isAutomatic}
                  >
                    <option value="service">Servizio</option>
                    <option value="product">Prodotto</option>
                    <option value="expense">Spesa</option>
                    <option value="travel">Trasferimento</option>
                  </Select>
                  
                  <Input
                    label="Unità"
                    {...register(`items.${index}.unit`)}
                    placeholder="es. ore, pz, kg"
                    disabled={field.isAutomatic}
                  />
                  
                  <Input
                    label="Sconto"
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.discount`, { valueAsNumber: true })}
                    disabled={field.isAutomatic}
                  />
                </div>
                
                <div className="mt-3">
                  <Input
                    label="Note (opzionale)"
                    {...register(`items.${index}.notes`)}
                    placeholder="Note aggiuntive per questa voce"
                    disabled={field.isAutomatic}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Notes and Terms */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Note e Condizioni</h2>
          
          <div className="space-y-4">
            <TextArea
              label="Note"
              {...register('notes')}
              rows={3}
              placeholder="Note visibili al cliente"
            />
            
            <TextArea
              label="Termini e Condizioni"
              {...register('termsConditions')}
              rows={4}
              placeholder="Termini e condizioni del preventivo"
            />
            
            <TextArea
              label="Note Interne"
              {...register('internalNotes')}
              rows={2}
              placeholder="Note interne (non visibili al cliente)"
            />
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('requiresDeposit')}
                className="rounded border-gray-300"
              />
              <span className="ml-2">Richiedi deposito per accettazione</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Totals */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Riepilogo</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotale:</span>
              <span className="font-medium">€ {totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Sconti:</span>
                <span>- € {totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IVA:</span>
              <span className="font-medium">€ {totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Totale:</span>
              <span>€ {totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={createQuoteMutation.isPending}
        >
          {createQuoteMutation.isPending ? 'Creazione...' : 'Crea Preventivo'}
        </Button>
      </div>
    </form>
  );
};