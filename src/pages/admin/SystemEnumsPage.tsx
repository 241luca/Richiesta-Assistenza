import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  BriefcaseIcon,
  TableCellsIcon,
  CheckIcon,
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { api, apiClient } from '../../services/api';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import EnumsTab from '../../components/admin/EnumsTab';
import ServiceConfigTab from '../../components/admin/ServiceConfigTab';

// Tab per gestire le diverse tabelle
type TabType = 'enums' | 'professions' | 'service';

export default function SystemEnumsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('professions'); // Iniziamo con professioni

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <TableCellsIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestione Tabelle di Sistema</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('professions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'professions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BriefcaseIcon className="h-5 w-5" />
              <span>Professioni</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('enums')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enums'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TableCellsIcon className="h-5 w-5" />
              <span>Stati e Valori Sistema</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'service'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-5 w-5" />
              <span>Servizio</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'professions' && <ProfessionsTab />}
      {activeTab === 'enums' && <EnumsTab />}
      {activeTab === 'service' && <ServiceConfigTab />}
    </div>
  );
}

// Tab Professioni
function ProfessionsTab() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<any>(null);

  // Fetch professioni
  const { data: professions, isLoading } = useQuery({
    queryKey: ['professions'],
    queryFn: async () => {
      const response = await apiClient.get('/professions');
      return response.data.data || [];
    }
  });

  // Mutation per creare
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/professions', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Professione creata con successo');
      queryClient.invalidateQueries({ queryKey: ['professions'] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione');
    }
  });

  // Mutation per aggiornare
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await apiClient.put(`/professions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Professione aggiornata');
      queryClient.invalidateQueries({ queryKey: ['professions'] });
      setEditingProfession(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  // Mutation per eliminare
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/professions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Professione eliminata');
      queryClient.invalidateQueries({ queryKey: ['professions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Caricamento professioni...</div>;
  }

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Gestione Professioni</h3>
            <p className="text-sm text-blue-700 mt-1">
              Qui puoi gestire le professioni disponibili per i professionisti. 
              Ogni professionista può essere associato a una di queste professioni per una migliore categorizzazione.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {professions?.length || 0} professioni registrate
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Aggiungi Professione
        </Button>
      </div>

      {/* Lista Professioni */}
      <div className="w-full">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ordine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrizione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Professionisti
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {professions?.map((profession: any) => (
              <tr key={profession.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {profession.displayOrder}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {profession.name}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {profession.slug}
                </td>
                <td className="px-3 py-2 text-sm text-gray-500">
                  <span className="truncate block max-w-[200px]" title={profession.description || '-'}>
                    {profession.description || '-'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  <Badge className="bg-gray-100 text-gray-800">
                    {profession._count?.users || 0}
                  </Badge>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <Badge className={profession.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                  }>
                    {profession.isActive ? 'Attiva' : 'Inattiva'}
                  </Badge>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setSelectedProfession(profession);
                        setShowEditModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900" 
                      title="Modifica"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (profession._count?.users > 0) {
                          toast.error(`Impossibile eliminare: ${profession._count.users} professionisti associati`);
                        } else if (confirm(`Eliminare la professione "${profession.name}"?`)) {
                          deleteMutation.mutate(profession.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={profession._count?.users > 0}
                      title={profession._count?.users > 0 ? 'Professione in uso' : 'Elimina'}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Creazione */}
      {showCreateModal && (
        <CreateProfessionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}

      {/* Modal Modifica */}
      {showEditModal && selectedProfession && (
        <EditProfessionModal
          profession={selectedProfession}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProfession(null);
          }}
          onUpdate={(data) => {
            updateMutation.mutate({
              id: selectedProfession.id,
              data
            });
            setShowEditModal(false);
            setSelectedProfession(null);
          }}
        />
      )}
    </div>
  );
}

// Modal per creare nuova professione
function CreateProfessionModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  // Auto-genera slug dal nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Nuova Professione</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
                slug: generateSlug(e.target.value)
              });
            }}
            placeholder="Es: Elettricista"
            required
          />
          
          <Input
            label="Slug (URL)"
            value={formData.slug}
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
            placeholder="es: elettricista"
            required
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione della professione..."
          />
          
          <Input
            label="Ordine visualizzazione"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Professione attiva
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Crea Professione
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal per modificare professione esistente
function EditProfessionModal({ profession, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: profession.name || '',
    slug: profession.slug || '',
    description: profession.description || '',
    displayOrder: profession.displayOrder || 0,
    isActive: profession.isActive !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  // Auto-genera slug dal nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Modifica Professione</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
                slug: generateSlug(e.target.value)
              });
            }}
            placeholder="Es: Elettricista"
            required
          />
          
          <Input
            label="Slug (URL)"
            value={formData.slug}
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
            placeholder="es: elettricista"
            required
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione della professione..."
            rows={4}
          />
          
          <Input
            label="Ordine visualizzazione"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Professione attiva
            </label>
          </div>
          
          {profession._count?.users > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                Questa professione è associata a {profession._count.users} professionisti.
                Le modifiche si applicheranno a tutti.
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Salva Modifiche
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// La nuova EnumsTab è importata dal file separato
