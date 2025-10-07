import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPinIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface WorkAddressFormProps {
  currentAddress?: {
    workAddress?: string;
    workCity?: string;
    workProvince?: string;
    workPostalCode?: string;
    useResidenceAsWorkAddress?: boolean;
  };
  mainAddress?: {
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  onSuccess?: () => void;
}

/**
 * Componente per gestire l'indirizzo di lavoro del professionista
 * Include il ricalcolo automatico delle distanze
 */
export function WorkAddressForm({ currentAddress, mainAddress, onSuccess }: WorkAddressFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    workAddress: currentAddress?.workAddress || '',
    workCity: currentAddress?.workCity || '',
    workProvince: currentAddress?.workProvince || '',
    workPostalCode: currentAddress?.workPostalCode || '',
    useResidenceAsWorkAddress: currentAddress?.useResidenceAsWorkAddress || false
  });
  
  const [showRecalculationInfo, setShowRecalculationInfo] = useState(false);

  // Mutation per aggiornare l'indirizzo di lavoro
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put('/address/work', data);
      return response.data;
    },
    onMutate: () => {
      setShowRecalculationInfo(true);
    },
    onSuccess: (response) => {
      const recalcInfo = response.data?.recalculation;
      
      if (recalcInfo) {
        toast.success(
          <div>
            <p className="font-semibold">Indirizzo aggiornato con successo!</p>
            <p className="text-sm mt-1">
              Ricalcolate {recalcInfo.success} distanze su {recalcInfo.total} richieste
            </p>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success('Indirizzo di lavoro aggiornato con successo!');
      }
      
      // Invalida le cache correlate
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['travel-info'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      
      setTimeout(() => {
        setShowRecalculationInfo(false);
      }, 3000);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
      setShowRecalculationInfo(false);
    }
  });

  // Mutation per forzare il ricalcolo manuale
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/address/recalculate-all');
      return response.data;
    },
    onSuccess: (response) => {
      const count = response.data?.recalculated || 0;
      toast.success(`Ricalcolate ${count} distanze con successo!`);
      queryClient.invalidateQueries({ queryKey: ['travel-info'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel ricalcolo');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione base
    if (!formData.useResidenceAsWorkAddress) {
      if (!formData.workAddress || !formData.workCity || !formData.workPostalCode) {
        toast.error('Completa tutti i campi obbligatori');
        return;
      }
    }
    
    updateMutation.mutate(formData);
  };

  const handleUseResidence = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      useResidenceAsWorkAddress: checked,
      // Se usa residenza, copia i dati
      ...(checked && mainAddress ? {
        workAddress: mainAddress.address || '',
        workCity: mainAddress.city || '',
        workProvince: mainAddress.province || '',
        workPostalCode: mainAddress.postalCode || ''
      } : {})
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
            Indirizzo di Lavoro
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            L'indirizzo da cui parti per raggiungere i clienti
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
          className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
          Ricalcola Distanze
        </button>
      </div>

      {showRecalculationInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Aggiornamento in corso...
              </p>
              <p className="text-xs text-blue-700">
                Sto ricalcolando le distanze per tutte le tue richieste attive
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {mainAddress && (
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.useResidenceAsWorkAddress}
                onChange={(e) => handleUseResidence(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Usa il mio indirizzo di residenza come indirizzo di lavoro
              </span>
            </label>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${formData.useResidenceAsWorkAddress ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo *
            </label>
            <input
              type="text"
              value={formData.workAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, workAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Via/Piazza e numero civico"
              disabled={formData.useResidenceAsWorkAddress}
              required={!formData.useResidenceAsWorkAddress}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Città *
            </label>
            <input
              type="text"
              value={formData.workCity}
              onChange={(e) => setFormData(prev => ({ ...prev, workCity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es. Milano"
              disabled={formData.useResidenceAsWorkAddress}
              required={!formData.useResidenceAsWorkAddress}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <input
              type="text"
              value={formData.workProvince}
              onChange={(e) => setFormData(prev => ({ ...prev, workProvince: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es. MI"
              maxLength={2}
              disabled={formData.useResidenceAsWorkAddress}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CAP *
            </label>
            <input
              type="text"
              value={formData.workPostalCode}
              onChange={(e) => setFormData(prev => ({ ...prev, workPostalCode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es. 20100"
              pattern="[0-9]{5}"
              maxLength={5}
              disabled={formData.useResidenceAsWorkAddress}
              required={!formData.useResidenceAsWorkAddress}
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-900">
                Ricalcolo Automatico
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Quando aggiorni l'indirizzo di lavoro, tutte le distanze delle tue richieste 
                attive verranno ricalcolate automaticamente. Questo potrebbe richiedere 
                qualche secondo.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setFormData({
                workAddress: currentAddress?.workAddress || '',
                workCity: currentAddress?.workCity || '',
                workProvince: currentAddress?.workProvince || '',
                workPostalCode: currentAddress?.workPostalCode || '',
                useResidenceAsWorkAddress: currentAddress?.useResidenceAsWorkAddress || false
              });
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
          
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {updateMutation.isPending ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Aggiornamento...
              </>
            ) : (
              'Salva e Ricalcola'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}