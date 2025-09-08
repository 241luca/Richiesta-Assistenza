/**
 * WorkAddressSettings Component
 * Gestisce la configurazione dell'indirizzo di lavoro del professionista
 * Seguendo ISTRUZIONI-PROGETTO.md - Usa Tailwind e React Query
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useWorkAddress, useTravel } from '../../hooks/useTravel';
import type { WorkAddressFormData, UpdateWorkAddressDto } from '../../types/travel';
import toast from 'react-hot-toast';
import AddressAutocomplete from '../address/AddressAutocomplete'; // AGGIUNTO: Import autocompletamento

// Province italiane per select
const ITALIAN_PROVINCES = [
  'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ', 'BS', 'BR',
  'CA', 'CL', 'CB', 'CI', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN', 'FM', 'FE', 'FI', 'FG',
  'FC', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC', 'LI', 'LO', 'LU', 'MC', 'MN', 'MS',
  'MT', 'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OT', 'OR', 'PD', 'PA', 'PR', 'PV', 'PG', 'PU', 'PE', 'PC',
  'PI', 'PT', 'PN', 'PZ', 'PO', 'RG', 'RA', 'RC', 'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'VS', 'SS', 'SV', 'SI',
  'SR', 'SO', 'TA', 'TE', 'TR', 'TO', 'OG', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV',
  'VI', 'VT', 'SU'
];

interface WorkAddressSettingsProps {
  onSave?: () => void;
  className?: string;
}

export const WorkAddressSettings: React.FC<WorkAddressSettingsProps> = ({
  onSave,
  className = ''
}) => {
  const [showAddressFields, setShowAddressFields] = useState(false);
  const { data: workAddress, isLoading, error } = useWorkAddress();
  const { updateWorkAddress, validateAddress, isUpdatingWorkAddress, isValidatingAddress } = useTravel();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<WorkAddressFormData>({
    defaultValues: {
      useResidenceAsWorkAddress: 'true', // String per compatibilità
      workAddress: '',
      workCity: '',
      workProvince: '',
      workPostalCode: '',
      travelRatePerKm: 0.50 // Default €0.50/km
    }
  });

  const useResidenceAsWork = watch('useResidenceAsWorkAddress') === 'true';

  // Aggiorna form quando arrivano i dati
  useEffect(() => {
    if (workAddress) {
      const useResidence = workAddress.useResidenceAsWorkAddress;
      setShowAddressFields(!useResidence);
      
      reset({
        useResidenceAsWorkAddress: useResidence ? 'true' : 'false', // String per hidden input
        workAddress: workAddress.workAddress || '',
        workCity: workAddress.workCity || '',
        workProvince: workAddress.workProvince || '',
        workPostalCode: workAddress.workPostalCode || '',
        travelRatePerKm: workAddress.travelRatePerKm || 0.50 // Già in euro
      });
    }
  }, [workAddress, reset]);

  // Gestisce il cambio dell'opzione "usa residenza"
  const handleUseResidenceChange = (value: boolean) => {
    setShowAddressFields(!value);
    setValue('useResidenceAsWorkAddress', value ? 'true' : 'false'); // Aggiorna hidden input
    
    if (value) {
      // Se usa residenza, pulisce i campi indirizzo lavoro
      setValue('workAddress', '');
      setValue('workCity', '');
      setValue('workProvince', '');
      setValue('workPostalCode', '');
    }
  };

  // Gestisce il submit del form
  const onSubmit = async (formData: WorkAddressFormData) => {
    try {
      // Prepara i dati per l'API
      const updateData: UpdateWorkAddressDto = {
        // CORREZIONE: Converte stringa in boolean
        useResidenceAsWorkAddress: formData.useResidenceAsWorkAddress === true || formData.useResidenceAsWorkAddress === 'true',
        // CORREZIONE: Mantiene in euro, non convertire in centesimi qui
        travelRatePerKm: formData.travelRatePerKm // Invia in euro (es: 0.50 per 50 cent/km)
      };

      // Aggiunge campi indirizzo solo se non usa residenza
      if (!updateData.useResidenceAsWorkAddress) {
        updateData.workAddress = formData.workAddress;
        updateData.workCity = formData.workCity;
        updateData.workProvince = formData.workProvince;
        updateData.workPostalCode = formData.workPostalCode;
      }

      await updateWorkAddress(updateData);
      toast.success('Indirizzo di lavoro aggiornato con successo!');
      onSave?.();

    } catch (error) {
      console.error('Error saving work address:', error);
      toast.error('Errore nel salvataggio dell\'indirizzo');
    }
  };

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          Indirizzo di Lavoro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Opzione usa residenza */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Indirizzo di partenza per i viaggi
            </label>
            
            {/* Hidden input per React Hook Form */}
            <input
              type="hidden"
              {...register('useResidenceAsWorkAddress')}
              value={useResidenceAsWork ? 'true' : 'false'}
            />
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  name="useResidenceAsWorkAddress"
                  checked={useResidenceAsWork === true}
                  onChange={() => handleUseResidenceChange(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    🏠 Usa il mio indirizzo di residenza
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Userò l'indirizzo già presente nel mio profilo
                  </p>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  name="useResidenceAsWorkAddress"
                  checked={useResidenceAsWork === false}
                  onChange={() => handleUseResidenceChange(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    🏢 Usa un indirizzo di lavoro diverso
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Configurerò un indirizzo specifico per il lavoro
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Indirizzo di lavoro con autocompletamento Google Places */}
          {showAddressFields && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Indirizzo di Lavoro</h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>Autocompletamento Google:</strong> Digita l'indirizzo e seleziona dai suggerimenti per garantire la massima precisione nelle indicazioni stradali.
                  </div>
                </div>
              </div>

              <AddressAutocomplete
                value={{
                  address: watch('workAddress') || '',
                  city: watch('workCity') || '',
                  province: watch('workProvince') || '',
                  postalCode: watch('workPostalCode') || ''
                }}
                onChange={(addressData) => {
                  setValue('workAddress', addressData.address);
                  setValue('workCity', addressData.city);
                  setValue('workProvince', addressData.province);
                  setValue('workPostalCode', addressData.postalCode);
                  
                  console.log('🏢 Indirizzo lavoro selezionato:', addressData);
                }}
                errors={{
                  address: errors.workAddress,
                  city: errors.workCity,
                  province: errors.workProvince,
                  postalCode: errors.workPostalCode
                }}
              />
            </div>
          )}

          {/* Tariffa per km */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tariffa per chilometro (€)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('travelRatePerKm', {
                  required: 'Tariffa richiesta',
                  min: { value: 0, message: 'Tariffa non può essere negativa' },
                  max: { value: 100, message: 'Tariffa massima €100/km' }
                })}
                className="pl-8"
                placeholder="0.50"
              />
            </div>
            {errors.travelRatePerKm && (
              <p className="mt-1 text-sm text-red-600">{errors.travelRatePerKm.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Tariffa applicata per calcolare i costi di spostamento
            </p>
          </div>

          {/* Pulsanti */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isUpdatingWorkAddress || isValidatingAddress}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingWorkAddress || isValidatingAddress}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingWorkAddress ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Salvataggio...
                </>
              ) : (
                'Salva Impostazioni'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkAddressSettings;
