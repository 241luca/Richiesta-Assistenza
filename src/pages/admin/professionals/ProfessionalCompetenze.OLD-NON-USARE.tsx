import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AcademicCapIcon, 
  PlusIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../services/api';
import toast from 'react-hot-toast';

export default function ProfessionalCompetenze() {
  const { professionalId } = useParams();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE');
  
  // Carica dati professionista
  const { data: professional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${professionalId}`);
      return response.data.data || response.data;
    }
  });

  // Carica TUTTE le categorie disponibili
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/categories');
        const cats = response.data.data || response.data || [];
        return cats;
      } catch (error) {
        console.error('Errore caricamento categorie:', error);
        return [];
      }
    }
  });

  // Carica TUTTE le sottocategorie una volta sola
  const { data: allSubcategories = [] } = useQuery({
    queryKey: ['all-subcategories'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/subcategories');
        return response.data.data || response.data || [];
      } catch (error) {
        console.error('Errore caricamento sottocategorie:', error);
        return [];
      }
    }
  });

  // Filtra le sottocategorie per la categoria selezionata
  const availableSubcategories = React.useMemo(() => {
    if (!selectedCategory || !allSubcategories.length) return [];
    
    const filtered = allSubcategories.filter((sub: any) => {
      const catId = sub.categoryId || sub.category_id || sub.category?.id;
      return catId == selectedCategory;
    });
    
    return filtered;
  }, [selectedCategory, allSubcategories]);

  // Carica competenze già assegnate al professionista
  const { data: assignedCompetences = [], refetch: refetchCompetences } = useQuery({
    queryKey: ['professional-competences', professionalId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/user/subcategories/${professionalId}`);
        console.log('Competenze ricevute dal server:', response.data.data);
        return response.data.data || [];
      } catch (error) {
        console.error('Errore caricamento competenze assegnate:', error);
        return [];
      }
    },
    enabled: !!professionalId
  });

  // Mutation per aggiungere una competenza usando il nuovo endpoint
  const addCompetenceMutation = useMutation({
    mutationFn: async () => {
      // Usa il nuovo endpoint POST per aggiungere una singola competenza con experienceLevel
      return await apiClient.post(`/user/subcategories/${professionalId}/add`, {
        subcategoryId: selectedSubcategory,
        experienceLevel: experienceLevel
      });
    },
    onSuccess: () => {
      toast.success('Competenza aggiunta con successo');
      refetchCompetences();
      setShowAddModal(false);
      setSelectedCategory('');
      setSelectedSubcategory('');
      setExperienceLevel('INTERMEDIATE');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiunta della competenza');
    }
  });

  // Mutation per rimuovere una competenza
  const removeCompetenceMutation = useMutation({
    mutationFn: async (competenceToRemove: any) => {
      // Estrai l'ID della sottocategoria dalla struttura corretta
      const subcategoryIdToRemove = competenceToRemove.subcategoryId || 
                                    competenceToRemove.subcategory?.id || 
                                    competenceToRemove.Subcategory?.id;
      
      // Prepara l'array delle competenze rimanenti con experienceLevel
      const remainingCompetences = assignedCompetences
        .filter((comp: any) => {
          const compId = comp.subcategoryId || comp.subcategory?.id || comp.Subcategory?.id;
          return compId !== subcategoryIdToRemove;
        })
        .map((comp: any) => ({
          subcategoryId: comp.subcategoryId || comp.subcategory?.id || comp.Subcategory?.id,
          experienceLevel: comp.experienceLevel || 'INTERMEDIATE'
        }));
      
      // Aggiorna con l'array senza la sottocategoria rimossa
      return await apiClient.put(`/user/subcategories/${professionalId}`, {
        subcategories: remainingCompetences
      });
    },
    onSuccess: () => {
      toast.success('Competenza rimossa');
      refetchCompetences();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella rimozione');
    }
  });

  // Mutation per toggle attivo/inattivo
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ item, isActive }: { item: any; isActive: boolean }) => {
      // Aggiorna tutte le competenze, cambiando solo lo stato di quella specifica
      const updatedCompetences = assignedCompetences.map((comp: any) => {
        const compId = comp.subcategoryId || comp.subcategory?.id || comp.Subcategory?.id;
        const itemId = item.subcategoryId || item.subcategory?.id || item.Subcategory?.id;
        
        if (compId === itemId) {
          return {
            subcategoryId: compId,
            experienceLevel: comp.experienceLevel || 'INTERMEDIATE',
            isActive: isActive
          };
        }
        return {
          subcategoryId: compId,
          experienceLevel: comp.experienceLevel || 'INTERMEDIATE',
          isActive: comp.isActive !== false
        };
      });
      
      return await apiClient.put(`/user/subcategories/${professionalId}`, {
        subcategories: updatedCompetences
      });
    },
    onSuccess: () => {
      toast.success('Stato aggiornato');
      refetchCompetences();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  // Filtra sottocategorie già assegnate - CORRETTO per gestire sia 'subcategory' che 'Subcategory'
  const filteredSubcategories = availableSubcategories.filter(
    (sub: any) => !assignedCompetences.some((comp: any) => {
      // Gestisci entrambi i casi: subcategory (minuscolo) e Subcategory (maiuscolo)
      const compId = comp.subcategoryId || 
                    comp.subcategory?.id || 
                    comp.Subcategory?.id;
      return compId === sub.id;
    })
  );

  const experienceLevels = [
    { value: 'BASIC', label: 'Base', color: 'bg-gray-100 text-gray-800' },
    { value: 'INTERMEDIATE', label: 'Intermedio', color: 'bg-blue-100 text-blue-800' },
    { value: 'ADVANCED', label: 'Avanzato', color: 'bg-green-100 text-green-800' },
    { value: 'EXPERT', label: 'Esperto', color: 'bg-purple-100 text-purple-800' }
  ];

  // Debug: mostra cosa stiamo ricevendo
  React.useEffect(() => {
    if (assignedCompetences.length > 0) {
      console.log('Struttura competenze assegnate:', assignedCompetences[0]);
    }
  }, [assignedCompetences]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Competenze Professionali</h1>
              <p className="text-gray-600">{professional?.firstName} {professional?.lastName}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Competenza
          </button>
        </div>
      </div>

      {/* Lista Competenze Assegnate */}
      <div className="grid gap-4">
        {assignedCompetences.map((item: any) => {
          // Gestisci entrambi i casi: subcategory (minuscolo) e Subcategory (maiuscolo)
          const subcategoryData = item.subcategory || item.Subcategory;
          const subcategoryName = subcategoryData?.name || 'Nome non disponibile';
          const categoryName = subcategoryData?.category?.name || 'Categoria non disponibile';
          const description = subcategoryData?.description || '';
          const experienceLevel = item.experienceLevel || 'INTERMEDIATE';
          const isActive = item.isActive !== false;
          
          return (
          <div key={item.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold">
                    {subcategoryName}
                  </h3>
                  {isActive ? (
                    <span className="ml-3 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Attiva
                    </span>
                  ) : (
                    <span className="ml-3 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Inattiva
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  Categoria: {categoryName}
                </p>
                
                <div className="flex gap-4 mb-3">
                  <div>
                    <span className="text-xs text-gray-500">Livello esperienza:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      experienceLevels.find(l => l.value === experienceLevel)?.color || 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {experienceLevels.find(l => l.value === experienceLevel)?.label || 
                       'Intermedio'}
                    </span>
                  </div>
                </div>

                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => toggleActiveMutation.mutate({ 
                    item: item, 
                    isActive: !isActive 
                  })}
                  className={`p-2 rounded-lg ${
                    isActive 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
                      : 'bg-green-100 hover:bg-green-200 text-green-600'
                  }`}
                  title={isActive ? 'Disattiva' : 'Attiva'}
                >
                  {isActive ? <XMarkIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Rimuovere questa competenza?')) {
                      removeCompetenceMutation.mutate(item);
                    }
                  }}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                  title="Rimuovi"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
        
        {assignedCompetences.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessuna competenza configurata</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aggiungi la prima competenza
            </button>
          </div>
        )}
      </div>

      {/* Modal Aggiungi Competenza */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Aggiungi Nuova Competenza</h3>
            
            {/* Step 1: Seleziona Categoria */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Seleziona Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory(''); // Reset sottocategoria
                }}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Seleziona Categoria --</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome || cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Seleziona Sottocategoria (solo se categoria selezionata) */}
            {selectedCategory && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Seleziona Sottocategoria
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">-- Seleziona Sottocategoria --</option>
                  {filteredSubcategories.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {availableSubcategories.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Nessuna sottocategoria trovata per questa categoria.
                  </p>
                )}
                {filteredSubcategories.length === 0 && availableSubcategories.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Tutte le {availableSubcategories.length} sottocategorie di questa categoria sono già assegnate
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Seleziona Livello Esperienza */}
            {selectedSubcategory && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Livello Esperienza
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCategory('');
                  setSelectedSubcategory('');
                  setExperienceLevel('INTERMEDIATE');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={() => addCompetenceMutation.mutate()}
                disabled={!selectedSubcategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
