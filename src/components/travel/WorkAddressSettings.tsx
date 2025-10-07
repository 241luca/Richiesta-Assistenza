/**
 * WorkAddressSettings - VERSIONE FINALE
 * Con indicatore visivo stato salvataggio
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { PlaceAutocomplete } from '../address/PlaceAutocomplete';
import { useWorkAddress, useTravel } from '../../hooks/useTravel';

interface WorkAddressFormData {
  useResidenceAsWorkAddress: string;
  workAddress: string;
  workCity: string;
  workProvince: string;
  workPostalCode: string;
}

interface WorkAddressSettingsProps {
  onSave?: () => void;
  className?: string;
}

export const WorkAddressSettings: React.FC<WorkAddressSettingsProps> = ({
  onSave,
  className = ''
}) => {
  const [showAddressFields, setShowAddressFields] = useState(false);
  
  const { data: workAddress, isLoading } = useWorkAddress();
  const { updateWorkAddress, isUpdatingWorkAddress } = useTravel();

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<WorkAddressFormData>({
    defaultValues: {
      useResidenceAsWorkAddress: 'true',
      workAddress: '',
      workCity: '',
      workProvince: '',
      workPostalCode: ''
    }
  });

  const useResidenceAsWork = watch('useResidenceAsWorkAddress') === 'true';
  const currentWorkAddress = watch('workAddress');

  // Aggiorna form quando arrivano i dati dal server
  React.useEffect(() => {
    if (workAddress) {
      const useResidence = workAddress.useResidenceAsWorkAddress;
      setShowAddressFields(!useResidence);
      
      setValue('useResidenceAsWorkAddress', useResidence ? 'true' : 'false');
      setValue('workAddress', workAddress.workAddress || '');
      setValue('workCity', workAddress.workCity || '');
      setValue('workProvince', workAddress.workProvince || '');
      setValue('workPostalCode', workAddress.workPostalCode || '');
    }
  }, [workAddress, setValue]);

  const handleUseResidenceChange = (value: boolean) => {
    setShowAddressFields(!value);
    setValue('useResidenceAsWorkAddress', value ? 'true' : 'false');
    
    if (value) {
      setValue('workAddress', '');
      setValue('workCity', '');
      setValue('workProvince', '');
      setValue('workPostalCode', '');
    }
  };

  const onSubmit = async (data: WorkAddressFormData) => {
    try {
      const updateData = {
        useResidenceAsWorkAddress: data.useResidenceAsWorkAddress === 'true',
        ...(data.useResidenceAsWorkAddress === 'false' && {
          workAddress: data.workAddress,
          workCity: data.workCity,
          workProvince: data.workProvince,
          workPostalCode: data.workPostalCode
        })
      };

      await updateWorkAddress(updateData);
      toast.success('Indirizzo di lavoro aggiornato!');
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
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Indirizzo di partenza per i viaggi
            </label>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="useResidenceAsWorkAddress"
                  checked={useResidenceAsWork}
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
              
              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="useResidenceAsWorkAddress"
                  checked={!useResidenceAsWork}
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

          {showAddressFields && (
            <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">Indirizzo di Lavoro</h4>
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    API 2025
                  </span>
                </div>
                
                {/* INDICATORE STATO SALVATAGGIO */}
                {currentWorkAddress ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-700">Configurato</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 border border-orange-300 rounded-full">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs font-medium text-orange-700">Da configurare</span>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <strong>Google Places API:</strong> Digita l'indirizzo e seleziona dai suggerimenti. 
                    Città, provincia e CAP verranno compilati automaticamente.
                  </div>
                </div>
              </div>

              <PlaceAutocomplete
                value={currentWorkAddress || ''}
                onChange={(formatted, place) => {
                  setValue('workAddress', formatted);
                  
                  if (place?.address_components) {
                    const components = place.address_components;
                    
                    const city = components.find(c => 
                      c.types.includes('locality') || 
                      c.types.includes('administrative_area_level_3')
                    );
                    if (city) setValue('workCity', city.long_name);
                    
                    const province = components.find(c => 
                      c.types.includes('administrative_area_level_2')
                    );
                    if (province) setValue('workProvince', province.short_name);
                    
                    const postalCode = components.find(c => 
                      c.types.includes('postal_code')
                    );
                    if (postalCode) setValue('workPostalCode', postalCode.long_name);
                  }
                }}
                placeholder="Via, numero civico, città"
                label="Indirizzo completo"
                error={errors.workAddress?.message}
              />

              {watch('workCity') && (
                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Dati estratti automaticamente:</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Città:</span>
                      <p className="font-medium">{watch('workCity')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Provincia:</span>
                      <p className="font-medium">{watch('workProvince')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">CAP:</span>
                      <p className="font-medium">{watch('workPostalCode')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isUpdatingWorkAddress}
              className="min-w-[120px]"
            >
              {isUpdatingWorkAddress ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvataggio...
                </span>
              ) : (
                'Salva Indirizzo'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkAddressSettings;
