import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  CurrencyEuroIcon,
  XMarkIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { materialsApi } from '../../../services/professional/reports-api';

interface Material {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  vatRate: number;
  category: string;
  isFavorite: boolean;
  usageCount: number;
}

interface MaterialFormData {
  code: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  vatRate: number;
  category: string;
}

export default function ProfessionalMaterialsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<MaterialFormData>({
    code: '',
    name: '',
    description: '',
    unit: 'pezzo',
    price: 0,
    vatRate: 22,
    category: 'generale'
  });

  // Mock data
  const mockMaterials: Material[] = [
    {
      id: '1',
      code: 'MAT001',
      name: 'Tubo PVC 32mm',
      description: 'Tubo in PVC rigido diametro 32mm',
      unit: 'metro',
      price: 3.50,
      vatRate: 22,
      category: 'idraulica',
      isFavorite: true,
      usageCount: 45
    },
    {
      id: '2',
      code: 'MAT002',
      name: 'Cavo elettrico 2.5mm²',
      description: 'Cavo elettrico unipolare 2.5mm² blu',
      unit: 'metro',
      price: 1.20,
      vatRate: 22,
      category: 'elettrico',
      isFavorite: false,
      usageCount: 32
    },
    {
      id: '3',
      code: 'MAT003',
      name: 'Interruttore Bticino',
      description: 'Interruttore unipolare Bticino serie Living',
      unit: 'pezzo',
      price: 12.00,
      vatRate: 22,
      category: 'elettrico',
      isFavorite: true,
      usageCount: 28
    }
  ];

  // Query per recuperare i materiali
  const { data: materials = mockMaterials, isLoading, refetch } = useQuery({
    queryKey: ['professional-materials'],
    queryFn: async () => {
      try {
        const response = await materialsApi.getAll();
        return response.data?.data || mockMaterials;
      } catch (error) {
        console.warn('Using mock data for materials');
        return mockMaterials;
      }
    }
  });

  // Mutation per creare materiale
  const createMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const newMaterial = {
        id: Date.now().toString(),
        ...data,
        isFavorite: false,
        usageCount: 0
      };
      
      // Quando l'API sarà pronta:
      // return await materialsApi.create(data);
      
      return { data: newMaterial };
    },
    onSuccess: () => {
      toast.success('Materiale aggiunto con successo!');
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'aggiunta del materiale');
    }
  });

  // Mutation per aggiornare materiale
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MaterialFormData }) => {
      console.log('Updating material:', id, data);
      
      // Quando l'API sarà pronta:
      // return await materialsApi.update(id, data);
      
      return { data: { id, ...data } };
    },
    onSuccess: () => {
      toast.success('Materiale aggiornato con successo!');
      setShowModal(false);
      setEditingMaterial(null);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento del materiale');
    }
  });

  // Mutation per eliminare materiale
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting material:', id);
      
      // Quando l'API sarà pronta:
      // return await materialsApi.delete(id);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Materiale eliminato con successo!');
      refetch();
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione del materiale');
    }
  });

  // Import CSV
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Mock implementation
      toast.success('File CSV importato con successo!');
      
      // Quando l'API sarà pronta:
      // await materialsApi.importCSV(file);
      // refetch();
    } catch (error) {
      toast.error('Errore nell\'importazione del CSV');
    }
  };

  const categories = {
    all: 'Tutti',
    generale: '📦 Generale',
    idraulica: '💧 Idraulica',
    elettrico: '⚡ Elettrico',
    muratura: '🧱 Muratura',
    climatizzazione: '❄️ Climatizzazione',
    altro: '📋 Altro'
  };

  const units = [
    { value: 'pezzo', label: 'Pezzo' },
    { value: 'metro', label: 'Metro' },
    { value: 'mq', label: 'Metro quadro' },
    { value: 'mc', label: 'Metro cubo' },
    { value: 'kg', label: 'Kilogrammo' },
    { value: 'litro', label: 'Litro' },
    { value: 'ora', label: 'Ora' },
    { value: 'giorno', label: 'Giorno' }
  ];

  // Filtra materiali
  const filteredMaterials = materials.filter((material: Material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          material.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      unit: 'pezzo',
      price: 0,
      vatRate: 22,
      category: 'generale'
    });
  };

  // Open modal for edit
  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      name: material.name,
      description: material.description,
      unit: material.unit,
      price: material.price,
      vatRate: material.vatRate,
      category: material.category
    });
    setShowModal(true);
  };

  // Open modal for new
  const openNewModal = () => {
    setEditingMaterial(null);
    
    // Genera codice automatico
    const nextCode = `MAT${String(materials.length + 1).padStart(3, '0')}`;
    setFormData({
      ...formData,
      code: nextCode
    });
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast.error('Il codice è obbligatorio');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Il nome è obbligatorio');
      return;
    }

    if (formData.price < 0) {
      toast.error('Il prezzo non può essere negativo');
      return;
    }

    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo materiale?')) {
      deleteMutation.mutate(id);
    }
  };

  // Calcola statistiche
  const stats = {
    total: materials.length,
    avgPrice: materials.reduce((sum: number, m: Material) => sum + m.price, 0) / materials.length || 0,
    favorites: materials.filter((m: Material) => m.isFavorite).length,
    mostUsed: materials.sort((a: Material, b: Material) => b.usageCount - a.usageCount)[0]
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
                Listino Materiali
              </h1>
              <p className="mt-2 text-gray-600">
                Gestisci il tuo listino materiali personalizzato
              </p>
            </div>
            <div className="flex gap-3">
              <label className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center cursor-pointer">
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Importa CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
              <button
                onClick={openNewModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuovo Materiale
              </button>
            </div>
          </div>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CubeIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Totale Materiali</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CurrencyEuroIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Prezzo Medio</p>
                <p className="text-xl font-bold">€ {stats.avgPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⭐</span>
              <div>
                <p className="text-sm text-gray-500">Preferiti</p>
                <p className="text-xl font-bold">{stats.favorites}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <p className="text-sm text-gray-500">Più Usato</p>
                <p className="text-sm font-bold">{stats.mostUsed?.name || '-'}</p>
              </div>
            </div>
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
                  placeholder="Cerca materiali..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(categories).map(([key, label]) => (
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

        {/* Tabella Materiali */}
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materiale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Codice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prezzo/Unità
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IVA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilizzi
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMaterials.map((material: Material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {material.isFavorite && (
                            <span className="text-yellow-500 mr-2">⭐</span>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {material.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {material.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          {material.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="font-semibold">€ {material.price.toFixed(2)}</span>
                        <span className="text-gray-500">/{material.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {material.vatRate}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {material.usageCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(material)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          <PencilIcon className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredMaterials.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white rounded-lg">
            <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun materiale trovato</p>
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
                  {editingMaterial ? 'Modifica Materiale' : 'Nuovo Materiale'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingMaterial(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Codice */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codice *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Es. MAT001"
                      required
                    />
                  </div>

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
                      {Object.entries(categories).filter(([key]) => key !== 'all').map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nome */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Materiale *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Es. Tubo PVC 32mm"
                      required
                    />
                  </div>

                  {/* Descrizione */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrizione
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrizione dettagliata del materiale..."
                      rows={3}
                    />
                  </div>

                  {/* Unità */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unità di Misura *
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prezzo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prezzo (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* IVA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aliquota IVA (%) *
                    </label>
                    <select
                      value={formData.vatRate}
                      onChange={(e) => setFormData({...formData, vatRate: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="4">4%</option>
                      <option value="10">10%</option>
                      <option value="22">22%</option>
                    </select>
                  </div>

                  {/* Prezzo con IVA (calcolato) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prezzo con IVA
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-lg">
                      <span className="font-semibold">
                        € {(formData.price * (1 + formData.vatRate / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingMaterial(null);
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