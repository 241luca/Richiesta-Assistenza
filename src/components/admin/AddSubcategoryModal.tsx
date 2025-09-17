import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';

interface AddSubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  professionId: string | null;
}

export default function AddSubcategoryModal({ 
  isOpen, 
  onClose, 
  professionalId,
  professionId 
}: AddSubcategoryModalProps) {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');

  // Recupera le sottocategorie già assegnate al professionista dall'endpoint dedicato
  const { data: assignedCompetences } = useQuery({
    queryKey: ['professional-competences', professionalId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/user/subcategories/${professionalId}`);
        return response.data.data || [];
      } catch (error) {
        console.error('Errore caricamento competenze:', error);
        return [];
      }
    },
    enabled: isOpen
  });

  // Estrai gli ID delle sottocategorie già assegnate
  const assignedSubcategoryIds = assignedCompetences?.map(
    (comp: any) => comp.subcategoryId
  ) || [];
  
  console.log('Assigned subcategory IDs:', assignedSubcategoryIds);

  // Fetch categorie associate alla professione
  const { data: professionCategories } = useQuery({
    queryKey: ['profession-categories', professionId],
    queryFn: async () => {
      if (!professionId) return [];
      const response = await apiClient.get(`/profession-categories/profession/${professionId}`);
      return response.data.data?.categories || [];
    },
    enabled: !!professionId && isOpen
  });

  // Fetch sottocategorie della categoria selezionata
  const { data: subcategories } = useQuery({
    queryKey: ['subcategories', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const response = await apiClient.get(`/subcategories/by-category/${selectedCategoryId}`);
      console.log('Subcategories fetched:', response.data.data);
      return response.data.data || [];
    },
    enabled: !!selectedCategoryId
  });
  
  // Filtra le sottocategorie già assegnate
  const availableSubcategories = subcategories?.filter(
    (sub: any) => !assignedSubcategoryIds.includes(sub.id)
  ) || [];
  
  console.log('Available subcategories:', availableSubcategories);

  // Mutation per aggiungere la sottocategoria
  const addSubcategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Usa l'endpoint admin per aggiungere sottocategoria
      const response = await apiClient.post(`/user/subcategories/${professionalId}/add`, data);
      return response.data;
    },
    onSuccess: () => {
      // Chiudi prima il modal
      onClose();
      
      // Poi invalida e ricarica tutto
      queryClient.invalidateQueries({ queryKey: ['professional', professionalId] });
      queryClient.invalidateQueries({ queryKey: ['professional-competences', professionalId] });
      queryClient.refetchQueries({ queryKey: ['professional-competences', professionalId] });
      
      toast.success('Competenza aggiunta con successo');
      
      // Reset form
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
    },
    onError: (error: any) => {
      console.error('Errore:', error);
      const errorMessage = error.response?.data?.message || 'Errore durante l\'aggiunta';
      
      // Se la sottocategoria è già assegnata, mostra un messaggio più chiaro
      if (error.response?.data?.code === 'SUBCATEGORY_ALREADY_EXISTS') {
        toast.error('Questa competenza è già stata assegnata al professionista');
      } else {
        toast.error(errorMessage);
      }
    }
  });

  const handleSubmit = () => {
    if (!selectedSubcategoryId) {
      toast.error('Seleziona una sottocategoria');
      return;
    }

    const data = {
      subcategoryId: selectedSubcategoryId,
      experienceLevel: 'INTERMEDIATE',
      isActive: true
    };
    
    console.log('Sending data to backend:', data);
    console.log('Professional ID:', professionalId);
    
    addSubcategoryMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Aggiungi Competenza</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Step 1: Selezione Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1. Seleziona la categoria
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedSubcategoryId(''); // Reset sottocategoria
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleziona categoria --</option>
              {professionCategories?.map((pc: any) => {
                // Debug per vedere cosa contiene pc
                console.log('ProfessionCategory item:', pc);
                const categoryId = pc.category?.id || pc.categoryId || pc.id;
                const categoryName = pc.category?.name || pc.name || 'Categoria senza nome';
                
                return (
                  <option key={categoryId} value={categoryId}>
                    {categoryName}
                  </option>
                );
              })}
            </select>
            {professionCategories?.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Nessuna categoria disponibile per questa professione
              </p>
            )}
          </div>

          {/* Step 2: Selezione Sottocategoria */}
          {selectedCategoryId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2. Seleziona la competenza specifica
              </label>
              <select
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleziona sottocategoria --</option>
                {availableSubcategories?.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                    {sub.description && ` - ${sub.description}`}
                  </option>
                ))}
              </select>
              {subcategories && subcategories.length > 0 && availableSubcategories.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  Tutte le competenze di questa categoria sono già state assegnate
                </p>
              )}
              {subcategories && subcategories.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Nessuna competenza disponibile per questa categoria
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSubcategoryId || addSubcategoryMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addSubcategoryMutation.isPending ? 'Aggiunta...' : 'Aggiungi Competenza'}
          </button>
        </div>
      </div>
    </div>
  );
}
