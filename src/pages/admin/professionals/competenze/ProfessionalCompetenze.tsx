import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  BriefcaseIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TagIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../../services/api';
import toast from 'react-hot-toast';
import AddSubcategoryModal from '../../../../components/admin/AddSubcategoryModal';

export default function ProfessionalCompetenze() {
  const { professionalId } = useParams();
  const queryClient = useQueryClient();
  const [editingProfession, setEditingProfession] = useState(false);
  const [selectedProfessionId, setSelectedProfessionId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // NUOVO: Fetch dettagli professionista con query diretta
  const { data: professional, isLoading: isLoadingProfessional, refetch: refetchProfessional } = useQuery({
    queryKey: ['professional-full', professionalId],
    queryFn: async () => {
      // Prima prova con l'endpoint admin solo se l'utente è admin
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
        try {
          const response = await apiClient.get(`/admin/users/${professionalId}`);
          console.log('=== DATI DA /admin/users/:id ===');
          console.log('Full response:', response.data);
          
          if (response.data.success && response.data.data?.user) {
            const userData = response.data.data.user;
            console.log('User data:', userData);
            console.log('ProfessionData:', userData.professionData);
            console.log('ProfessionId:', userData.professionId);
            
            // Se non c'è professionData ma c'è professionId, facciamo una query per ottenerlo
            if (userData.professionId && !userData.professionData) {
              try {
                const profResponse = await apiClient.get(`/professions/${userData.professionId}`);
                if (profResponse.data.success && profResponse.data.data) {
                  userData.professionData = profResponse.data.data;
                }
              } catch (error) {
                console.error('Error fetching profession data:', error);
              }
            }
            
            return userData;
          }
        } catch (error) {
          console.log('Admin endpoint failed, trying user endpoint');
        }
      }
      
      // Fallback all'endpoint normale
      const response = await apiClient.get(`/users/${professionalId}`);
      console.log('=== DATI DA /users/:id ===');
      console.log('Response:', response.data);
      const userData = response.data.data || response.data;
      
      // Se non c'è professionData ma c'è professionId, facciamo una query per ottenerlo
      if (userData.professionId && !userData.professionData) {
        try {
          const profResponse = await apiClient.get(`/professions/${userData.professionId}`);
          if (profResponse.data.success && profResponse.data.data) {
            userData.professionData = profResponse.data.data;
          }
        } catch (error) {
          console.error('Error fetching profession data:', error);
        }
      }
      
      return userData;
    },
    staleTime: 0,
    gcTime: 0
  });

  // Fetch competenze separatamente dall'endpoint dedicato
  const { data: competenzeData, isLoading: isLoadingCompetenze, refetch: refetchCompetenze } = useQuery({
    queryKey: ['professional-competences', professionalId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/user/subcategories/${professionalId}`);
        console.log('Competenze ricevute:', response.data);
        return response.data.data || [];
      } catch (error) {
        console.error('Errore caricamento competenze:', error);
        return [];
      }
    },
    enabled: !!professionalId
  });

  // Usa le competenze dall'endpoint dedicato
  const competenze = competenzeData || [];

  // Fetch lista professioni
  const { data: professions } = useQuery({
    queryKey: ['professions'],
    queryFn: async () => {
      const response = await apiClient.get('/professions?isActive=true');
      console.log('Professioni disponibili:', response.data.data);
      return response.data.data;
    }
  });

  // Fetch categorie associate alla professione - USANDO IL PROFESSIONID DAL PROFESSIONAL
  const { data: professionCategories } = useQuery({
    queryKey: ['profession-categories', professional?.professionId],
    queryFn: async () => {
      if (!professional?.professionId) {
        console.log('No professionId found for professional');
        return [];
      }
      console.log('Fetching categories for professionId:', professional.professionId);
      try {
        const response = await apiClient.get(`/profession-categories/profession/${professional.professionId}`);
        console.log('=== PROFESSION CATEGORIES RESPONSE ===');
        console.log('Full response:', response.data);
        
        // Gestisci diversi formati di risposta
        if (response.data.success && response.data.data) {
          console.log('Response data:', response.data.data);
          
          // Se data è un oggetto profession con categories
          if (response.data.data.categories && Array.isArray(response.data.data.categories)) {
            // Estrai le categorie dall'array categories
            const categories = response.data.data.categories.map((pc: any) => pc.category).filter(Boolean);
            console.log('Extracted categories from profession.categories:', categories);
            return categories;
          }
          
          // Se data è un array di ProfessionCategory con include category
          if (Array.isArray(response.data.data)) {
            // Se gli oggetti hanno la categoria inclusa
            const firstItem = response.data.data[0];
            if (firstItem?.category) {
              // Estrai le categorie dagli oggetti ProfessionCategory
              const categories = response.data.data.map((pc: any) => pc.category).filter(Boolean);
              console.log('Extracted categories from ProfessionCategory:', categories);
              return categories;
            } else {
              // Sono solo ProfessionCategory senza include, dobbiamo caricare le categorie
              console.log('ProfessionCategory without categories, need to fetch them');
              // Per ora restituiamo array vuoto
              return [];
            }
          }
        }
        return [];
      } catch (error) {
        console.error('Error fetching profession categories:', error);
        return [];
      }
    },
    enabled: !!professional?.professionId
  });

  // Imposta la professione quando i dati sono caricati
  useEffect(() => {
    if (professional) {
      setSelectedProfessionId(professional.professionId || null);
      console.log('Professional loaded with professionId:', professional.professionId);
      console.log('Professional professionData:', professional.professionData);
    }
  }, [professional]);

  // Mutation per rimuovere una sottocategoria
  const removeSubcategoryMutation = useMutation({
    mutationFn: async (subcategoryId: string) => {
      const response = await apiClient.delete(`/user/subcategories/${professionalId}/${subcategoryId}`);
      return response.data;
    },
    onSuccess: () => {
      // Ricarica le competenze
      refetchCompetenze();
      toast.success('Competenza rimossa con successo');
    },
    onError: (error: any) => {
      console.error('Errore rimozione:', error);
      toast.error(error.response?.data?.message || 'Errore durante la rimozione');
    }
  });

  const handleRemoveSubcategory = (subcategoryId: string) => {
    if (confirm('Sei sicuro di voler rimuovere questa competenza?')) {
      removeSubcategoryMutation.mutate(subcategoryId);
    }
  };

  // Mutation per aggiornare la professione
  const updateProfessionMutation = useMutation({
    mutationFn: async (professionId: string | null) => {
      const response = await apiClient.put(`/professions/user/${professionalId}`, {
        professionId
      });
      console.log('Response from server:', response.data);
      return response.data;
    },
    onSuccess: async (data) => {
      console.log('Success! Updated user:', data.data);
      toast.success('Professione aggiornata con successo');
      setEditingProfession(false);
      
      // Ricarica tutto
      await refetchProfessional();
      await queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      console.error('Errore aggiornamento professione:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiornamento');
    }
  });

  const handleSaveProfession = () => {
    console.log('Saving profession:', {
      userId: professionalId,
      professionId: selectedProfessionId
    });
    updateProfessionMutation.mutate(selectedProfessionId);
  };

  const handleCancelEdit = () => {
    setSelectedProfessionId(professional?.professionId || null);
    setEditingProfession(false);
  };

  // Callback per quando viene aggiunta una nuova competenza
  const handleCompetenceAdded = () => {
    refetchCompetenze();
    queryClient.invalidateQueries({ queryKey: ['professional-full', professionalId] });
  };

  const isLoading = isLoadingProfessional || isLoadingCompetenze;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestione Competenze
            </h1>
            <p className="text-gray-600">
              {professional?.firstName} {professional?.lastName}
            </p>
            {professional?.email && (
              <p className="text-sm text-gray-500">
                {professional.email}
              </p>
            )}
            {/* Mostra la professione sotto l'email */}
            {(professional?.professionData?.name || professional?.profession) && (
              <p className="text-sm font-medium text-blue-600 mt-1">
                {professional?.professionData?.name || professional?.profession}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Professione Principale */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BriefcaseIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold">Professione Principale</h2>
          </div>
          {!editingProfession && (
            <button
              onClick={() => setEditingProfession(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {editingProfession ? (
          <div className="space-y-4">
            <select
              value={selectedProfessionId || ''}
              onChange={(e) => setSelectedProfessionId(e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Nessuna professione</option>
              {professions?.map((profession: any) => (
                <option key={profession.id} value={profession.id}>
                  {profession.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleSaveProfession}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Salva
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="text-lg">
            {/* Mostra il nome della professione dalla relazione */}
            {professional?.professionData?.name || 
             (professional?.professionId ? 'Caricamento...' : 'Nessuna professione assegnata')}
            
            {/* Warning se professionId presente ma professionData mancante */}
            {professional?.professionId && !professional?.professionData && (
              <p className="text-sm text-red-500 mt-1">
                ProfessionId presente ma professionData non caricato!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Categorie della Professione */}
      {professionCategories && Array.isArray(professionCategories) && professionCategories.length > 0 ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <TagIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Categorie della Professione</h2>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Questa professione lavora nelle seguenti categorie:
            </p>
            <div className="flex flex-wrap gap-2">
              {professionCategories.map((cat: any, index: number) => {
                console.log(`Rendering category ${index}:`, cat);
                console.log('Category has name?', cat.name);
                console.log('Category keys:', Object.keys(cat));
                return (
                  <span
                    key={cat.id || index}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {cat.name || cat.categoryName || 'Nome mancante'}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Le sottocategorie possono essere selezionate da queste categorie
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <TagIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-600">Categorie della Professione</h2>
          </div>
          <p className="text-sm text-gray-500">
            {professional?.professionId ? 'Caricamento categorie...' : 'Nessuna categoria associata a questa professione'}
          </p>
        </div>
      )}

      {/* Sottocategorie/Competenze Specifiche */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">
              Sottocategorie/Competenze Specifiche
            </h2>
            <p className="text-sm text-gray-600">
              Dettaglio delle competenze all'interno delle categorie
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Sottocategoria
          </button>
        </div>

        {competenze.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessuna sottocategoria associata</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {competenze.map((comp: any) => {
              // Gestisci entrambi i formati possibili: subcategory o Subcategory
              const subcategory = comp.subcategory || comp.Subcategory;
              const category = subcategory?.category;
              
              return (
                <div key={comp.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {subcategory?.name || 'Nome non disponibile'}
                      </h3>
                      {category && (
                        <p className="text-sm text-gray-600 mt-1">
                          Categoria: {category.name}
                        </p>
                      )}
                      {subcategory?.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {subcategory.description}
                        </p>
                      )}
                      {comp.experienceLevel && (
                        <div className="mt-3">
                          <span className="text-xs font-medium text-gray-500">
                            Livello esperienza:
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            comp.experienceLevel === 'EXPERT' ? 'bg-purple-100 text-purple-800' :
                            comp.experienceLevel === 'ADVANCED' ? 'bg-green-100 text-green-800' :
                            comp.experienceLevel === 'INTERMEDIATE' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {comp.experienceLevel === 'EXPERT' ? 'Esperto' :
                             comp.experienceLevel === 'ADVANCED' ? 'Avanzato' :
                             comp.experienceLevel === 'INTERMEDIATE' ? 'Intermedio' :
                             'Base'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSubcategory(comp.subcategoryId)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Rimuovi competenza"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal per aggiungere sottocategoria - con callback per aggiornare la lista */}
      <AddSubcategoryModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          handleCompetenceAdded(); // Ricarica le competenze quando il modal si chiude
        }}
        professionalId={professionalId!}
        professionId={professional?.professionId}
      />
    </div>
  );
}
