import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { customFormsAPI } from '../../services/customForms.api';

interface Subcategory {
  id: string;
  name: string;
  categoryName: string;
}

const CustomFormsNew: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    subcategoryId: '',
    displayType: 'SIMPLE' as 'SIMPLE' | 'STANDARD' | 'ADVANCED'
  });

  // Query per ottenere le sottocategorie del professionista
  const { data: subcategories, isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ['professional-subcategories', user?.id, 'new'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      const response = await api.get(`/user/subcategories/${user.id}`);
      const rawData = response.data.data;
      
      return rawData
        .filter((item: any) => item?.Subcategory?.id && item?.Subcategory?.name)
        .map((item: any) => ({
          id: item.Subcategory.id,
          name: item.Subcategory.name,
          categoryName: item.Subcategory.Category?.name || 'Categoria non specificata'
        }));
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof createFormData) => {
      if (!user?.id) throw new Error('User ID is required');
      
      const formData = {
        name: data.name,
        description: data.description || undefined,
        subcategoryId: data.subcategoryId,
        professionalId: user.id,
        displayType: data.displayType,
        fields: []
      };
      
      return await customFormsAPI.createCustomForm(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['professional-custom-forms', user?.id, 'list'] 
      });
      setCreateFormData({
        name: '',
        description: '',
        subcategoryId: '',
        displayType: 'SIMPLE'
      });
      alert('Modulo creato con successo!');
    },
    onError: (error: any) => {
      alert(`Errore nella creazione del form: ${error.message}`);
    }
  });

  // Handler functions
  const handleCreateFormChange = useCallback((field: string, value: string) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCreateFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.name.trim()) {
      alert('Il nome del form è obbligatorio');
      return;
    }
    
    if (!createFormData.subcategoryId) {
      alert('Seleziona una sottocategoria');
      return;
    }
    
    createMutation.mutate(createFormData);
  }, [createFormData, createMutation.mutate]);

  // Memoized values
  const memoizedSubcategories = useMemo(() => {
    return subcategories || [];
  }, [subcategories]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          ➕ Nuovo Modulo
        </h1>
        <p className="text-gray-600 mt-1">
          Crea un nuovo modulo personalizzato per raccogliere informazioni dai clienti
        </p>
      </div>

      {/* Form di creazione */}
      <div className="bg-white rounded-lg shadow max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Dettagli del Nuovo Form</h2>
        </div>
        
        <form onSubmit={handleCreateFormSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome del Form *
              </label>
              <input
                type="text"
                value={createFormData.name}
                onChange={(e) => handleCreateFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Es. Richiesta Idraulico Emergenza"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Scegli un nome descrittivo che identifichi chiaramente il tipo di richiesta
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                value={createFormData.description}
                onChange={(e) => handleCreateFormChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Descrizione opzionale del form e delle informazioni che raccoglierà..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Aggiungi una descrizione per spiegare a cosa serve questo form
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sottocategoria *
              </label>
              <select
                value={createFormData.subcategoryId}
                onChange={(e) => handleCreateFormChange('subcategoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoadingSubcategories}
              >
                <option value="">
                  {isLoadingSubcategories ? 'Caricamento...' : 'Seleziona una sottocategoria'}
                </option>
                {memoizedSubcategories.map((sub: Subcategory) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.categoryName} - {sub.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Il form sarà associato a questa sottocategoria di servizi
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di Visualizzazione
              </label>
              <select
                value={createFormData.displayType}
                onChange={(e) => handleCreateFormChange('displayType', e.target.value as 'SIMPLE' | 'STANDARD' | 'ADVANCED')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="SIMPLE">Semplice</option>
                <option value="STANDARD">Standard</option>
                <option value="ADVANCED">Avanzato</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Scegli come verrà mostrato il form ai clienti
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setCreateFormData({
                  name: '',
                  description: '',
                  subcategoryId: '',
                  displayType: 'SIMPLE'
                });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={createMutation.isPending}
            >
              Cancella
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              disabled={createMutation.isPending}
            >
              <PlusIcon className="h-5 w-5" />
              {createMutation.isPending ? 'Creazione...' : 'Crea Form'}
            </button>
          </div>
        </form>
      </div>

      {/* Informazioni aggiuntive */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Suggerimenti</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Dopo aver creato il form, potrai aggiungere i campi personalizzati</li>
          <li>• Puoi impostare un form come predefinito per ogni sottocategoria</li>
          <li>• I form devono essere pubblicati per essere visibili ai clienti</li>
          <li>• Puoi sempre modificare il form dopo la creazione</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomFormsNew;