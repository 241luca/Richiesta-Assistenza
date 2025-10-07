import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { phrasesApi } from '../../../services/professional/reports-api';

interface Phrase {
  id: string;
  category: 'problem' | 'solution' | 'recommendation' | 'note';
  code: string;
  title: string;
  content: string;
  usageCount: number;
  isFavorite: boolean;
}

interface PhraseFormData {
  category: string;
  title: string;
  content: string;
  isFavorite: boolean;
}

export default function ProfessionalPhrasesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<PhraseFormData>({
    category: 'problem',
    title: '',
    content: '',
    isFavorite: false
  });

  // Mock data per ora (quando le API saranno pronte, rimuovere questo)
  const mockPhrases: Phrase[] = [
    {
      id: '1',
      category: 'problem',
      code: 'P001',
      title: 'Perdita rubinetto',
      content: 'Riscontrata perdita d\'acqua dal rubinetto della cucina, causata dall\'usura della guarnizione interna.',
      usageCount: 15,
      isFavorite: true
    },
    {
      id: '2',
      category: 'solution',
      code: 'S001',
      title: 'Sostituzione guarnizione',
      content: 'Effettuata sostituzione della guarnizione con ricambio originale certificato.',
      usageCount: 12,
      isFavorite: false
    },
    {
      id: '3',
      category: 'recommendation',
      code: 'R001',
      title: 'Manutenzione periodica',
      content: 'Si consiglia di effettuare una verifica periodica ogni 6 mesi per prevenire future perdite.',
      usageCount: 8,
      isFavorite: true
    }
  ];

  // Query per recuperare le frasi
  const { data: phrases = mockPhrases, isLoading, refetch } = useQuery({
    queryKey: ['professional-phrases'],
    queryFn: async () => {
      // TEMPORANEO: Usa sempre mock data finché API non è pronta
      // TODO: Quando l'API sarà pronta, rimuovere questa riga e decommentare sotto
      return mockPhrases;
      
      /* DA DECOMMENTARE QUANDO API SARÀ PRONTA:
      try {
        const response = await phrasesApi.getAll();
        return response.data?.data || [];
      } catch (error) {
        console.error('Error fetching phrases:', error);
        throw error;
      }
      */
    }
  });

  // Mutation per creare frase
  const createMutation = useMutation({
    mutationFn: async (data: PhraseFormData) => {
      // Mock implementation
      const newPhrase = {
        id: Date.now().toString(),
        code: `${data.category.charAt(0).toUpperCase()}${String(phrases.length + 1).padStart(3, '0')}`,
        ...data,
        usageCount: 0
      };
      
      // Quando l'API sarà pronta:
      // return await phrasesApi.create(data);
      
      return { data: newPhrase };
    },
    onSuccess: () => {
      toast.success('Frase aggiunta con successo!');
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'aggiunta della frase');
    }
  });

  // Mutation per aggiornare frase
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PhraseFormData }) => {
      // Mock implementation
      console.log('Updating phrase:', id, data);
      
      // Quando l'API sarà pronta:
      // return await phrasesApi.update(id, data);
      
      return { data: { id, ...data } };
    },
    onSuccess: () => {
      toast.success('Frase aggiornata con successo!');
      setShowModal(false);
      setEditingPhrase(null);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento della frase');
    }
  });

  // Mutation per eliminare frase
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation
      console.log('Deleting phrase:', id);
      
      // Quando l'API sarà pronta:
      // return await phrasesApi.delete(id);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Frase eliminata con successo!');
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione della frase');
    }
  });

  // Mutation per toggle preferito
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation
      console.log('Toggling favorite:', id);
      
      // Quando l'API sarà pronta:
      // return await phrasesApi.toggleFavorite(id);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Preferito aggiornato!');
      refetch();
    }
  });

  const categoryColors = {
    problem: 'bg-red-100 text-red-800',
    solution: 'bg-green-100 text-green-800',
    recommendation: 'bg-blue-100 text-blue-800',
    note: 'bg-gray-100 text-gray-800'
  };

  const categoryLabels = {
    problem: '🔴 Problema',
    solution: '✅ Soluzione',
    recommendation: '💡 Raccomandazione',
    note: '📝 Nota'
  };

  // Filtra frasi
  const filteredPhrases = phrases.filter((phrase: Phrase) => {
    const matchesSearch = phrase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phrase.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || phrase.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      category: 'problem',
      title: '',
      content: '',
      isFavorite: false
    });
  };

  // Open modal for edit
  const openEditModal = (phrase: Phrase) => {
    setEditingPhrase(phrase);
    setFormData({
      category: phrase.category,
      title: phrase.title,
      content: phrase.content,
      isFavorite: phrase.isFavorite
    });
    setShowModal(true);
  };

  // Open modal for new
  const openNewModal = () => {
    setEditingPhrase(null);
    resetForm();
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Il contenuto è obbligatorio');
      return;
    }

    if (editingPhrase) {
      updateMutation.mutate({ id: editingPhrase.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa frase?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/professional/reports')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Torna ai Rapporti
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Frasi Ricorrenti
              </h1>
              <p className="mt-2 text-gray-600">
                Gestisci le tue frasi preimpostate per velocizzare la compilazione dei rapporti
              </p>
            </div>
            <button
              onClick={openNewModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuova Frase
            </button>
          </div>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Totale Frasi</p>
            <p className="text-2xl font-bold text-gray-900">{phrases.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Preferiti</p>
            <p className="text-2xl font-bold text-gray-900">
              {phrases.filter((p: Phrase) => p.isFavorite).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Più Usata</p>
            <p className="text-sm font-bold text-gray-900">
              {phrases.sort((a: Phrase, b: Phrase) => b.usageCount - a.usageCount)[0]?.title || '-'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Utilizzi Totali</p>
            <p className="text-2xl font-bold text-gray-900">
              {phrases.reduce((sum: number, p: Phrase) => sum + p.usageCount, 0)}
            </p>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca nelle frasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === 'all' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tutte
              </button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedCategory === key 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista Frasi */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhrases.map(phrase => (
              <div key={phrase.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[phrase.category]}`}>
                    {categoryLabels[phrase.category]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavoriteMutation.mutate(phrase.id)}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      {phrase.isFavorite ? (
                        <StarSolidIcon className="h-5 w-5" />
                      ) : (
                        <StarIcon className="h-5 w-5" />
                      )}
                    </button>
                    <span className="text-xs text-gray-500">
                      {phrase.usageCount} usi
                    </span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">
                  {phrase.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {phrase.content}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Codice: {phrase.code}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(phrase)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(phrase.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredPhrases.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna frase trovata</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Cancella ricerca
              </button>
            )}
          </div>
        )}

        {/* Modal Aggiungi/Modifica */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingPhrase ? 'Modifica Frase' : 'Nuova Frase'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingPhrase(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="problem">🔴 Problema</option>
                      <option value="solution">✅ Soluzione</option>
                      <option value="recommendation">💡 Raccomandazione</option>
                      <option value="note">📝 Nota</option>
                    </select>
                  </div>

                  {/* Titolo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titolo *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Es. Perdita rubinetto"
                      required
                    />
                  </div>

                  {/* Contenuto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenuto *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrizione dettagliata della frase..."
                      rows={4}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.content.length}/500 caratteri
                    </p>
                  </div>

                  {/* Preferito */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFavorite"
                      checked={formData.isFavorite}
                      onChange={(e) => setFormData({...formData, isFavorite: e.target.checked})}
                      className="rounded text-blue-600 mr-2"
                    />
                    <label htmlFor="isFavorite" className="text-sm text-gray-700">
                      Aggiungi ai preferiti ⭐
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPhrase(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}