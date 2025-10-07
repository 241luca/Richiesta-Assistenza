import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BriefcaseIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

interface ProfessionCategory {
  id: string;
  professionId: string;
  categoryId: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  category: Category;
}

interface Profession {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  categories: ProfessionCategory[];
  _count: {
    users: number;
  };
}

export default function ProfessionCategoriesPage() {
  const queryClient = useQueryClient();
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  // Fetch professions and categories
  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['profession-categories'],
    queryFn: async () => {
      const response = await api.get('/profession-categories');
      // ResponseFormatter restituisce { success: true, data: {...}, message: '...' }
      return response.data;
    }
  });

  // Estrai i dati effettivi dalla risposta
  const data = responseData?.data || responseData;

  // Bulk update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ professionId, categoryIds }: { professionId: string; categoryIds: string[] }) => {
      const response = await api.post('/profession-categories/bulk', {
        professionId,
        categoryIds
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Associazioni aggiornate con successo!');
      queryClient.invalidateQueries({ queryKey: ['profession-categories'] });
      setPendingChanges({});
      setSelectedProfession(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Errore aggiornamento associazioni';
      toast.error(errorMessage);
    }
  });

  const handleCategoryToggle = (categoryId: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSave = () => {
    if (!selectedProfession) return;

    const profession = data?.professions.find((p: Profession) => p.id === selectedProfession);
    if (!profession) return;

    // Calcola le categorie finali
    const currentCategories = profession.categories.map((pc: ProfessionCategory) => pc.categoryId);
    const finalCategories = new Set(currentCategories);

    // Applica le modifiche pendenti
    Object.entries(pendingChanges).forEach(([categoryId, shouldHave]) => {
      if (shouldHave) {
        finalCategories.add(categoryId);
      } else {
        finalCategories.delete(categoryId);
      }
    });

    updateMutation.mutate({
      professionId: selectedProfession,
      categoryIds: Array.from(finalCategories)
    });
  };

  const handleCancel = () => {
    setPendingChanges({});
    setSelectedProfession(null);
  };

  const getProfessionCategories = (professionId: string) => {
    const profession = data?.professions.find((p: Profession) => p.id === professionId);
    if (!profession) return new Set<string>();
    
    const categories = new Set(profession.categories.map((pc: ProfessionCategory) => pc.categoryId));
    
    // Applica modifiche pendenti se questa è la professione selezionata
    if (professionId === selectedProfession) {
      Object.entries(pendingChanges).forEach(([categoryId, shouldHave]) => {
        if (shouldHave) {
          categories.add(categoryId);
        } else {
          categories.delete(categoryId);
        }
      });
    }
    
    return categories;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 inline mr-2" />
          <span className="text-red-800">Errore caricamento dati</span>
        </div>
      </div>
    );
  }

  const professions = data?.professions || [];
  const allCategories = data?.allCategories || [];

  // Se non ci sono professioni, mostra un messaggio con link
  if (professions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestione Associazioni Professioni-Categorie
              </h1>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 inline mr-2" />
          <span className="text-yellow-800">
            Nessuna professione trovata nel sistema. 
            Prima di configurare le associazioni, è necessario creare almeno una professione.
          </span>
          <div className="mt-4">
            <a 
              href="/admin/system-enums" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Vai a Gestione Professioni
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestione Associazioni Professioni-Categorie
              </h1>
              <p className="text-gray-600">
                Configura quali categorie di servizi possono essere gestite da ogni professione
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <InformationCircleIcon className="h-5 w-5 text-blue-600 inline mr-2" />
        <span className="text-sm text-blue-800">
          Questa configurazione determina quali tipi di richieste possono essere accettate dai professionisti di ogni categoria.
          Solo il SUPER_ADMIN può modificare queste associazioni.
        </span>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-0">
          {/* Profession List */}
          <div className="col-span-4 border-r">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">
                Professioni ({professions.length})
              </h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {professions.map((profession: Profession) => {
                const isSelected = selectedProfession === profession.id;
                const categoryCount = getProfessionCategories(profession.id).size;
                
                return (
                  <button
                    key={profession.id}
                    onClick={() => {
                      setSelectedProfession(profession.id);
                      setPendingChanges({});
                    }}
                    className={`
                      w-full text-left px-4 py-3 border-b transition-colors
                      ${isSelected 
                        ? 'bg-indigo-50 border-indigo-200' 
                        : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {profession.name}
                        </div>
                        {profession.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {profession.description}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">
                          {categoryCount} categorie
                        </div>
                        <div className="text-xs text-gray-500">
                          {profession._count.users} professionisti
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Assignment */}
          <div className="col-span-8">
            {selectedProfession ? (
              <>
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase">
                    Categorie Assegnabili
                  </h2>
                  {Object.keys(pendingChanges).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-orange-600">
                        {Object.keys(pendingChanges).length} modifiche in sospeso
                      </span>
                      <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {updateMutation.isPending ? 'Salvataggio...' : 'Salva'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        Annulla
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {allCategories.map((category: Category) => {
                      const professionCategories = getProfessionCategories(selectedProfession);
                      const isAssigned = professionCategories.has(category.id);
                      const hasPendingChange = category.id in pendingChanges;
                      
                      return (
                        <label
                          key={category.id}
                          className={`
                            flex items-center p-3 rounded-lg border cursor-pointer transition-all
                            ${isAssigned 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                            }
                            ${hasPendingChange ? 'ring-2 ring-orange-400' : ''}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">
                                {category.name}
                              </span>
                              {hasPendingChange && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                                  Modificato
                                </span>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                          {isAssigned && (
                            <CheckIcon className="h-5 w-5 text-green-600" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BriefcaseIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Seleziona una professione per gestire le categorie associate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
