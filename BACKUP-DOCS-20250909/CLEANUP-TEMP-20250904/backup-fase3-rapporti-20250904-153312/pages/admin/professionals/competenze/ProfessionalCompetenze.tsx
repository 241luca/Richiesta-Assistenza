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
  PencilIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../../services/api';
import toast from 'react-hot-toast';

export default function ProfessionalCompetenze() {
  const { professionalId } = useParams();
  const queryClient = useQueryClient();
  const [editingProfession, setEditingProfession] = useState(false);
  const [selectedProfessionId, setSelectedProfessionId] = useState<string | null>(null);

  // Fetch competenze
  const { data: competenze, isLoading } = useQuery({
    queryKey: ['professional-competenze', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/user/subcategories/${professionalId}`);
      return response.data.data;
    }
  });

  // Fetch professional con professione
  const { data: professional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${professionalId}`);
      console.log('Professional data received:', response.data.data);
      console.log('ProfessionData:', response.data.data?.professionData);
      return response.data.data;
    }
  });

  // Imposta la professione quando i dati sono caricati
  useEffect(() => {
    if (professional) {
      console.log('Setting profession from:', { 
        professionId: professional.professionId, 
        profession: professional.profession 
      });
      setSelectedProfessionId(professional.professionId || null);
    }
  }, [professional]);

  // Fetch lista professioni
  const { data: professions } = useQuery({
    queryKey: ['professions'],
    queryFn: async () => {
      const response = await apiClient.get('/professions?isActive=true');
      return response.data.data;
    }
  });

  // Mutation per aggiornare la professione
  const updateProfessionMutation = useMutation({
    mutationFn: async (professionId: string | null) => {
      const response = await apiClient.put(`/professions/user/${professionalId}`, {
        professionId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional', professionalId] });
      toast.success('Professione aggiornata con successo');
      setEditingProfession(false);
    },
    onError: (error: any) => {
      console.error('Errore aggiornamento professione:', error);
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiornamento');
    }
  });

  const handleSaveProfession = () => {
    console.log('Saving profession ID:', selectedProfessionId);
    updateProfessionMutation.mutate(selectedProfessionId);
  };

  const handleCancelEdit = () => {
    setSelectedProfessionId(professional?.professionId || null);
    setEditingProfession(false);
  };

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Competenze Professionali
            </h1>
            <p className="text-gray-600">
              {professional?.firstName} {professional?.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Sezione Professione - NUOVA! */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BriefcaseIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold">Professione/Qualifica</h2>
          </div>
          {!editingProfession && (
            <button 
              onClick={() => setEditingProfession(true)}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Modifica
            </button>
          )}
        </div>

        {editingProfession ? (
          <div className="space-y-4">
            <select
              value={selectedProfessionId || ''}
              onChange={(e) => setSelectedProfessionId(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- Nessuna professione --</option>
              {professions?.map((profession: any) => (
                <option key={profession.id} value={profession.id}>
                  {profession.name}
                  {profession.description && ` - ${profession.description}`}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveProfession}
                disabled={updateProfessionMutation.isPending}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5 mr-1" />
                Salva
              </button>
              <button 
                onClick={handleCancelEdit}
                disabled={updateProfessionMutation.isPending}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5 mr-1" />
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-lg">
              {professional?.professionData ? (
                <span className="font-medium text-gray-900">
                  {professional.professionData.name}
                  {professional.professionData.description && (
                    <span className="text-sm text-gray-600 ml-2">
                      ({professional.professionData.description})
                    </span>
                  )}
                </span>
              ) : professional?.profession ? (
                <span className="font-medium text-gray-700">
                  {professional.profession}
                  <span className="text-sm text-amber-600 ml-2">
                    (testo libero - da aggiornare)
                  </span>
                </span>
              ) : (
                <span className="text-gray-500 italic">
                  Nessuna professione specificata
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Lista Competenze */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Sottocategorie Associate</h2>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Competenza
          </button>
        </div>

        {competenze?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nessuna competenza associata
          </div>
        ) : (
          <div className="grid gap-4">
            {competenze?.map((comp: any) => (
              <div key={comp.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{comp.Subcategory?.name}</h3>
                  <p className="text-sm text-gray-600">{comp.Subcategory?.category?.name}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Livello: {comp.experienceLevel || 'Base'}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {comp.isActive ? 'Attiva' : 'Inattiva'}
                    </span>
                    {comp.experienceYears && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {comp.experienceYears} anni esperienza
                      </span>
                    )}
                  </div>
                </div>
                <button className="text-red-600 hover:text-red-800">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
