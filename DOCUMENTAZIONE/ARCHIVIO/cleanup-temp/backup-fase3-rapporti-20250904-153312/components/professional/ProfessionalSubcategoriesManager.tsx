import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AcademicCapIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// Tipi TypeScript per i dati
interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  textColor: string;
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  isActive: boolean;
  color?: string;
  textColor?: string;
}

interface ProfessionalSubcategory {
  id: string;
  subcategoryId: string;
  userId: string;
  experienceYears?: number;
  certifications?: any;
  isActive: boolean;
  Subcategory?: Subcategory;
}

interface ProfessionalSubcategoriesManagerProps {
  professionalId?: string;
  isAdminView?: boolean;
}

export function ProfessionalSubcategoriesManager({ 
  professionalId, 
  isAdminView = false 
}: ProfessionalSubcategoriesManagerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Usa l'ID passato come prop o l'ID dell'utente corrente
  const targetUserId = professionalId || user?.id;

  // Query per ottenere tutte le categorie
  const { data: categoriesResponse, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        return { data: [] };
      }
    }
  });

  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.data || []);

  // Query per ottenere tutte le sottocategorie
  const { data: subcategoriesResponse, isLoading: loadingSubcategories } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      try {
        const response = await api.get('/subcategories');
        return response.data;
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        return { data: [] };
      }
    }
  });

  const subcategories = Array.isArray(subcategoriesResponse) ? subcategoriesResponse : (subcategoriesResponse?.data || []);

  // Query per ottenere le sottocategorie del professionista specifico
  const { 
    data: professionalSubcategoriesResponse, 
    isLoading: loadingProfessionalSubcategories,
    refetch: refetchProfessionalSubcategories
  } = useQuery({
    queryKey: ['professional-subcategories', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { data: [] };
      
      try {
        // Se è un admin, usa l'endpoint specifico per ottenere le sottocategorie di un altro utente
        if (isAdminView && professionalId) {
          const response = await api.get(`/user/subcategories/${professionalId}`);
          return response.data;
        } else {
          // Professionista che vede le proprie sottocategorie
          const response = await api.get('/user/subcategories');
          return response.data;
        }
      } catch (error) {
        console.error('Error fetching professional subcategories:', error);
        return { data: [] };
      }
    },
    enabled: !!targetUserId
  });

  const professionalSubcategories = Array.isArray(professionalSubcategoriesResponse) 
    ? professionalSubcategoriesResponse 
    : (professionalSubcategoriesResponse?.data || []);

  // Inizializza le sottocategorie selezionate quando i dati sono caricati
  useEffect(() => {
    if (professionalSubcategories.length > 0) {
      const selected = new Set<string>();
      professionalSubcategories.forEach((ps: ProfessionalSubcategory) => {
        if (ps.isActive) {
          selected.add(ps.subcategoryId);
        }
      });
      setSelectedSubcategories(selected);
    }
  }, [professionalSubcategories]);

  // Mutation per salvare le sottocategorie
  const saveMutation = useMutation({
    mutationFn: async (subcategoryIds: string[]) => {
      if (isAdminView && professionalId) {
        // Admin che aggiorna sottocategorie di un professionista
        const response = await api.put(`/user/subcategories/${professionalId}`, {
          subcategoryIds
        });
        return response.data;
      } else {
        // Professionista che aggiorna le proprie sottocategorie
        const response = await api.put('/user/subcategories', {
          subcategoryIds
        });
        return response.data;
      }
    },
    onSuccess: () => {
      setSuccessMessage(
        isAdminView 
          ? 'Competenze del professionista aggiornate con successo!' 
          : 'Le tue competenze sono state aggiornate con successo!'
      );
      queryClient.invalidateQueries({ queryKey: ['professional-subcategories', targetUserId] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || error.message || 'Errore durante il salvataggio');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });

  // Toggle selezione sottocategoria
  const toggleSubcategory = (subcategoryId: string) => {
    const newSelected = new Set(selectedSubcategories);
    if (newSelected.has(subcategoryId)) {
      newSelected.delete(subcategoryId);
    } else {
      newSelected.add(subcategoryId);
    }
    setSelectedSubcategories(newSelected);
  };

  // Toggle espansione categoria
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Salva le modifiche
  const handleSave = () => {
    saveMutation.mutate(Array.from(selectedSubcategories));
  };

  // Raggruppa sottocategorie per categoria
  const subcategoriesByCategory = subcategories.reduce((acc: any, subcategory: Subcategory) => {
    if (!acc[subcategory.categoryId]) {
      acc[subcategory.categoryId] = [];
    }
    acc[subcategory.categoryId].push(subcategory);
    return acc;
  }, {});

  const isLoading = loadingCategories || loadingSubcategories || loadingProfessionalSubcategories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Caricamento sottocategorie...</span>
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="text-center p-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">
          {isAdminView 
            ? 'Seleziona un professionista per gestire le sue competenze'
            : 'Errore: utente non identificato'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messaggi di stato */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Lista categorie e sottocategorie */}
      <div className="space-y-4">
        {categories.map((category: Category) => {
          const categorySubcategories = subcategoriesByCategory[category.id] || [];
          const isExpanded = expandedCategories.has(category.id);
          const selectedCount = categorySubcategories.filter(
            (sub: Subcategory) => selectedSubcategories.has(sub.id)
          ).length;

          return (
            <div key={category.id} className="border rounded-lg overflow-hidden">
              {/* Header categoria */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ 
                  backgroundColor: `${category.color}10`,
                  borderLeft: `4px solid ${category.color}`
                }}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-white font-bold text-sm">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedCount > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                        {selectedCount} selezionate
                      </span>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Lista sottocategorie */}
              {isExpanded && (
                <div className="border-t bg-white">
                  {categorySubcategories.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nessuna sottocategoria disponibile
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                      {categorySubcategories.map((subcategory: Subcategory) => {
                        const isSelected = selectedSubcategories.has(subcategory.id);
                        
                        return (
                          <div
                            key={subcategory.id}
                            onClick={() => toggleSubcategory(subcategory.id)}
                            className={`
                              p-3 rounded-lg border cursor-pointer transition-all
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`
                                mt-0.5 w-5 h-5 rounded flex items-center justify-center
                                ${isSelected ? 'bg-blue-500' : 'bg-gray-200'}
                              `}>
                                {isSelected && (
                                  <CheckIcon className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className={`
                                  font-medium 
                                  ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                                `}>
                                  {subcategory.name}
                                </h4>
                                {subcategory.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {subcategory.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pulsante salva */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={() => refetchProfessionalSubcategories()}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla modifiche
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <span className="flex items-center">
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Salvataggio...
              </span>
            ) : (
              <span>Salva modifiche</span>
            )}
          </button>
      </div>
    </div>
  );
}
