import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  BriefcaseIcon,
  Squares2X2Icon,
  RectangleGroupIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  TagIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { apiClient, api } from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

type TabType = 'professions' | 'categories' | 'subcategories';

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('professions');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Squares2X2Icon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestione Tassonomia</h1>
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
            <span className="flex items-center space-x-2">
              <BriefcaseIcon className="h-5 w-5" />
              <span>Professioni</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center space-x-2">
              <RectangleGroupIcon className="h-5 w-5" />
              <span>Categorie</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('subcategories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subcategories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Squares2X2Icon className="h-5 w-5" />
              <span>Sottocategorie</span>
            </span>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'professions' && <ProfessionsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'subcategories' && <SubcategoriesTab />}
    </div>
  );
}

// Form Modal Categorie (crea/modifica)
function CategoryFormModal({ 
  category, 
  onClose, 
  onSuccess 
}: {
  category: any | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    color: category?.color || '#3B82F6',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive ?? true,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (category) {
        return await api.put(`/categories/${category.id}`, data);
      } else {
        return await api.post('/categories', data);
      }
    },
    onSuccess: () => {
      toast.success(category ? 'Categoria aggiornata' : 'Categoria creata');
      onSuccess();
    },
    onError: (error: any) => {
      const message =
        (error?.response?.data?.message as string) ||
        (typeof error?.message === 'string' ? error.message : undefined) ||
        'Errore durante il salvataggio';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    };
    saveMutation.mutate(dataToSubmit);
  };

  const presetColors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#F97316','#6B7280','#059669'];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {category ? 'Modifica Categoria' : 'Nuova Categoria'}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="es. Idraulica"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Slug URL</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Auto-generato se vuoto"
              />
              <p className="mt-1 text-xs text-gray-500">Utilizzato negli URL (es. /categorie/idraulica)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descrizione</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Breve descrizione della categoria"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Colore Categoria</label>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn('w-8 h-8 rounded-md border-2 transition-all', formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-400')}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ordine Visualizzazione</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">Categorie con numero più basso appaiono prima</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Categoria attiva</label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvataggio...' : (category ? 'Aggiorna' : 'Crea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// ===== Professioni =====
function ProfessionsTab() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfession, setEditingProfession] = useState<any | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data: professionsData, isLoading } = useQuery({
    queryKey: ['professions'],
    queryFn: async () => {
      const response = await apiClient.get('/professions');
      const list = response.data?.data || [];
      return Array.isArray(list) ? list : [];
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/professions/${id}`);
    },
    onSuccess: () => {
      toast.success('Professione eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['professions'] });
    },
    onError: (error: any) => {
      const msg =
        (error?.response?.data?.message as string) ||
        (typeof error?.message === 'string' ? error.message : undefined) ||
        'Errore durante l\'eliminazione';
      toast.error(msg);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiClient.put(`/professions/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['professions'] });
    },
    onError: (error: any) => {
      const msg =
        (error?.response?.data?.message as string) ||
        (typeof error?.message === 'string' ? error.message : undefined) ||
        'Errore durante l\'aggiornamento';
      toast.error(msg);
    },
  });

  const professions = Array.isArray(professionsData) ? professionsData : [];
  const activeCount = professions.filter((p: any) => p.isActive).length;
  const inactiveCount = professions.length - activeCount;
  const shownProfessions = showInactive ? professions : professions.filter((p: any) => p.isActive);

  const handleDelete = (profession: any) => {
    const usersCount = profession._count?.users || 0;
    if (usersCount > 0) {
      toast.error(`Impossibile eliminare: ci sono ${usersCount} utenti associati`);
      return;
    }
    if (window.confirm(`Sei sicuro di voler eliminare "${profession.name}"?`)) {
      deleteMutation.mutate(profession.id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Professioni</h1>
        <p className="text-gray-600 mt-1">Configura le professioni e il loro stato di visibilità</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showInactiveProfessions"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showInactiveProfessions" className="text-sm text-gray-700">
              Mostra inattive
            </label>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuova Professione
            </button>
          </div>
        </div>
      </div>

      {/* Professions Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Caricamento...</p>
          </div>
        ) : shownProfessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessuna professione trovata</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <colgroup>
                <col className="w-3/5" />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professione</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professionisti</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shownProfessions.map((profession: any) => (
                  <tr key={profession.id} className={cn(!profession.isActive && 'bg-gray-50 opacity-60')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center min-w-0 whitespace-nowrap">
                        <IdentificationIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">{profession.name}</span>
                        {profession.slug && (
                          <span className="ml-2 text-xs text-gray-500 truncate">/{profession.slug}</span>
                        )}
                      </div>
                      {profession.description && (
                        <div className="text-xs text-gray-600 mt-1 whitespace-normal break-words">{profession.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {profession._count?.users || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {profession.displayOrder}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: profession.id, isActive: !profession.isActive })}
                        className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors', profession.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')}
                      >
                        {profession.isActive ? (
                          <>
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Attiva
                          </>
                        ) : (
                          <>
                            <EyeSlashIcon className="h-3 w-3 mr-1" />
                            Inattiva
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => setEditingProfession(profession)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifica"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(profession)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(isCreating || editingProfession) && (
        <ProfessionFormModal
          profession={editingProfession}
          onClose={() => {
            setIsCreating(false);
            setEditingProfession(null);
          }}
          onSuccess={() => {
            setIsCreating(false);
            setEditingProfession(null);
            queryClient.invalidateQueries({ queryKey: ['professions'] });
          }}
        />
      )}
    </div>
  );
}

// Form Modal Professioni (crea/modifica)
function ProfessionFormModal({
  profession,
  onClose,
  onSuccess
}: {
  profession: any | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: profession?.name || '',
    slug: profession?.slug || '',
    description: profession?.description || '',
    displayOrder: profession?.displayOrder || 0,
    isActive: profession?.isActive ?? true,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (profession) {
        return await apiClient.put(`/professions/${profession.id}`, data);
      } else {
        return await apiClient.post('/professions', data);
      }
    },
    onSuccess: () => {
      toast.success(profession ? 'Professione aggiornata' : 'Professione creata');
      onSuccess();
    },
    onError: (error: any) => {
      const message =
        (error?.response?.data?.message as string) ||
        (typeof error?.message === 'string' ? error.message : undefined) ||
        'Errore durante il salvataggio';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    };
    saveMutation.mutate(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-height-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {profession ? 'Modifica Professione' : 'Nuova Professione'}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="es. Idraulico"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Slug URL</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Auto-generato se vuoto"
              />
              <p className="mt-1 text-xs text-gray-500">Utilizzato negli URL (es. /professioni/idraulico)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descrizione</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Breve descrizione della professione"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ordine Visualizzazione</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">Più basso appare prima</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="prof_isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="prof_isActive" className="ml-2 text-sm text-gray-700">Professione attiva</label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvataggio...' : (profession ? 'Aggiorna' : 'Crea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function CreateProfessionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void; }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Nuova Professione</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value,
                slug: generateSlug(e.target.value)
              })}
              placeholder="Es: Elettricista"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="es: elettricista"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrizione della professione"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ordine visualizzazione</label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label className="ml-2 text-sm text-gray-700">Professione attiva</label>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded-md">Annulla</button>
            <button type="submit" className="px-3 py-2 rounded-md bg-blue-600 text-white">Crea</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== Categorie =====
function CategoriesTab() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch categories (gestione formati diversi)
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      let categories: any[] = [];
      if (response.data?.data) {
        categories = Array.isArray(response.data.data) ? response.data.data : response.data.data.categories || [];
      } else if (response.data?.categories) {
        categories = response.data.categories;
      } else if (Array.isArray(response.data)) {
        categories = response.data;
      }
      return Array.isArray(categories) ? categories : [];
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      toast.success('Categoria eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (error: any) => {
      const msg =
        (error?.response?.data?.message as string) ||
        (typeof error?.message === 'string' ? error.message : undefined) ||
        'Errore durante l\'eliminazione';
      toast.error(msg);
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/categories/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['profession-categories'] });
    },
    onError: (error: any) => {
      const msg =
        (error?.response?.data?.message as string) ||
        (typeof error?.message === 'string' ? error.message : undefined) ||
        'Errore durante l\'aggiornamento';
      toast.error(msg);
    },
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const activeCount = categories.filter((c: any) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;
  const shownCategories = activeTab === 'all'
    ? categories
    : activeTab === 'active'
      ? categories.filter((c: any) => c.isActive)
      : categories.filter((c: any) => !c.isActive);

  const handleDelete = (category: any) => {
    if (category._count && category._count.subcategories > 0) {
      toast.error(`Impossibile eliminare: ci sono ${category._count.subcategories} sottocategorie associate`);
      return;
    }

    if (category._count && category._count.assistanceRequests > 0) {
      toast.error(`Impossibile eliminare: ci sono ${category._count.assistanceRequests} richieste attive`);
      return;
    }

    if (window.confirm(`Sei sicuro di voler eliminare "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  return (
    <div className="p-2">
      {/* Header + Azioni */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Categorie</h2>
            <p className="text-sm text-gray-600">
              {categories.length} totali • {activeCount} attive • {inactiveCount} inattive
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuova Categoria
          </button>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1 text-sm rounded-md border',
              activeTab === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            Tutte
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'px-3 py-1 text-sm rounded-md border',
              activeTab === 'active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            Attive ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={cn(
              'px-3 py-1 text-sm rounded-md border',
              activeTab === 'inactive' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            Inattive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Grid categorie */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Caricamento...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessuna categoria trovata</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {shownCategories.map((category: any) => (
              <div
                key={category.id}
                className={cn(
                  'relative rounded-lg border-2 p-6 transition-all',
                  category.isActive ? 'border-gray-200 hover:shadow-lg' : 'border-gray-100 bg-gray-50 opacity-60'
                )}
              >
                {/* Barra colore */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
                  style={{ backgroundColor: category.color }}
                />

                {/* Contenuto */}
                <div className="mt-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          {/* Usa TagIcon come in CategoriesPage */}
                          <TagIcon className="h-3 w-3 mr-1" />
                          {category._count?.subcategories || 0} sottocategorie
                        </div>
                        <div>
                          {category._count?.assistanceRequests || 0} richieste
                        </div>
                      </div>

                      {/* Ordine */}
                      <div className="mt-2 text-xs text-gray-400">Ordine: {category.displayOrder}</div>
                    </div>

                    {/* Badge stato */}
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: category.id, isActive: !category.isActive })}
                      className={cn(
                        'ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors',
                        category.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      )}
                    >
                      {category.isActive ? (
                        <>
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Attiva
                        </>
                      ) : (
                        <>
                          <EyeSlashIcon className="h-3 w-3 mr-1" />
                          Inattiva
                        </>
                      )}
                    </button>
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifica"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Elimina"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale Crea/Modifica */}
      {(isCreating || editingCategory) && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setIsCreating(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setIsCreating(false);
            setEditingCategory(null);
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            queryClient.invalidateQueries({ queryKey: ['profession-categories'] });
          }}
        />
      )}
    </div>
  );
}

function CreateCategoryModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void; }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#2563EB',
    textColor: '#FFFFFF',
    displayOrder: 0,
    isActive: true
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Nuova Categoria</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value,
                slug: generateSlug(e.target.value)
              })}
              placeholder="Es: Casa e impianti"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="es: casa-impianti"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrizione della categoria"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Colore</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="mt-1 block w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Colore testo</label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="mt-1 block w-full h-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ordine visualizzazione</label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label className="ml-2 text-sm text-gray-700">Categoria attiva</label>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded-md">Annulla</button>
            <button type="submit" className="px-3 py-2 rounded-md bg-blue-600 text-white">Crea</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== Sottocategorie =====
function SubcategoriesTab() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any | null>(null);
  const [configuringAiSettings, setConfiguringAiSettings] = useState<any | null>(null);

  type Subcategory = {
    id: string;
    name: string;
    slug: string;
    description?: string;
    requirements?: string;
    color?: string;
    textColor?: string;
    isActive: boolean;
    displayOrder: number;
    category: { id: string; name: string; slug: string; color: string };
    _count?: { professionals: number; assistanceRequests: number };
    aiSettings?: { modelName: string; temperature: number; responseStyle: string; detailLevel: string };
  };

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });

  const { data: subcategoriesData, isLoading } = useQuery({
    queryKey: ['admin-subcategories', selectedCategory, showInactive],
    queryFn: async () => {
      const params: any = { includeAiSettings: 'true' };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (!showInactive) params.isActive = 'true';
      const response = await api.get('/subcategories', { params });
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subcategories/${id}`);
    },
    onSuccess: () => {
      toast.success('Sottocategoria eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Errore durante l'eliminazione");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/subcategories/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] });
    },
    onError: () => {
      toast.error("Errore durante l'aggiornamento");
    },
  });

  const categories = categoriesData || [];
  const subcategories: Subcategory[] = subcategoriesData || [];

  const handleDelete = (subcategory: Subcategory) => {
    if (subcategory._count && subcategory._count.assistanceRequests > 0) {
      toast.error(`Impossibile eliminare: ci sono ${subcategory._count.assistanceRequests} richieste attive`);
      return;
    }
    if (window.confirm(`Sei sicuro di voler eliminare "${subcategory.name}"?`)) {
      deleteMutation.mutate(subcategory.id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Sottocategorie</h1>
        <p className="text-gray-600 mt-1">Configura le sottocategorie professionali e le relative impostazioni AI</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showInactive" className="text-sm text-gray-700">Mostra inattive</label>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuova Sottocategoria
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Caricamento...</div>
        ) : subcategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sottocategoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professionisti</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Richieste</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Config</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subcategories.map((subcategory: Subcategory) => (
                  <tr key={subcategory.id} className={cn(!subcategory.isActive && 'bg-gray-50 opacity-60')}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-md flex items-center justify-center mr-3" style={{ backgroundColor: subcategory.color || '#E5E7EB' }}>
                          <span className="text-xs font-bold" style={{ color: subcategory.textColor || '#1F2937' }}>
                            {subcategory.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subcategory.name}</div>
                          {subcategory.description && (<div className="text-sm text-gray-500">{subcategory.description}</div>)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: subcategory.category.color }} />
                        <span className="text-sm text-gray-900">{subcategory.category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subcategory._count?.professionals || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subcategory._count?.assistanceRequests || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {subcategory.aiSettings ? (
                        <div className="text-xs">
                          <div className="text-gray-900">{subcategory.aiSettings.modelName}</div>
                          <div className="text-gray-500">{subcategory.aiSettings.responseStyle} / {subcategory.aiSettings.detailLevel}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Non configurato</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: subcategory.id, isActive: !subcategory.isActive })}
                        className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', subcategory.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}
                      >
                        {subcategory.isActive ? (<><EyeIcon className="h-3 w-3 mr-1" />Attiva</>) : (<><EyeSlashIcon className="h-3 w-3 mr-1" />Inattiva</>)}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setEditingSubcategory(subcategory)} className="text-blue-600 hover:text-blue-900" title="Modifica">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfiguringAiSettings(subcategory)} className="text-purple-600 hover:text-purple-900" title="Configurazione AI">
                          <CogIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(subcategory)} className="text-red-600 hover:text-red-900" title="Elimina">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">Nessuna sottocategoria trovata</div>
        )}
      </div>

      {(isCreating || editingSubcategory) && (
        <SubcategoryFormModal
          subcategory={editingSubcategory}
          categories={categories}
          onClose={() => { setIsCreating(false); setEditingSubcategory(null); }}
          onSuccess={() => { setIsCreating(false); setEditingSubcategory(null); queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] }); }}
        />
      )}

      {configuringAiSettings && (
        <AiSettingsModal
          subcategory={configuringAiSettings}
          onClose={() => setConfiguringAiSettings(null)}
          onSuccess={() => { setConfiguringAiSettings(null); queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] }); }}
        />
      )}
    </div>
  );
}

function SubcategoryFormModal({ subcategory, categories, onClose, onSuccess }: { subcategory: any | null; categories: any[]; onClose: () => void; onSuccess: () => void; }) {
  const [formData, setFormData] = useState({
    name: subcategory?.name || '',
    slug: subcategory?.slug || '',
    description: subcategory?.description || '',
    categoryId: subcategory?.category?.id || '',
    requirements: subcategory?.requirements || '',
    color: subcategory?.color || '#E5E7EB',
    textColor: subcategory?.textColor || '#1F2937',
    displayOrder: subcategory?.displayOrder || 0,
    isActive: subcategory?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (subcategory) {
        return await api.put(`/subcategories/${subcategory.id}`, data);
      } else {
        return await api.post('/subcategories', data);
      }
    },
    onSuccess: () => {
      toast.success(subcategory ? 'Sottocategoria aggiornata' : 'Sottocategoria creata');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Errore durante il salvataggio');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{subcategory ? 'Modifica Sottocategoria' : 'Nuova Sottocategoria'}</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="Auto-generato se vuoto" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria <span className="text-red-500">*</span></label>
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border">
                <option value="">Seleziona categoria...</option>
                {categories.map((category: any) => (<option key={category.id} value={category.id}>{category.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descrizione</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Requisiti</label>
              <textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Colore Sfondo</label>
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Colore Testo</label>
                <input type="color" value={formData.textColor} onChange={(e) => setFormData({ ...formData, textColor: e.target.value })} className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ordine Visualizzazione</label>
                <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border" />
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Sottocategoria attiva</label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Annulla</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">{createMutation.isPending ? 'Salvataggio...' : (subcategory ? 'Aggiorna' : 'Crea')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AiSettingsModal({ subcategory, onClose, onSuccess }: { subcategory: any; onClose: () => void; onSuccess: () => void; }) {
  type AiSettings = {
    modelName: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    systemPrompt: string;
    knowledgeBasePrompt?: string;
    responseStyle: 'FORMAL' | 'INFORMAL' | 'TECHNICAL' | 'EDUCATIONAL';
    detailLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    includeDiagrams: boolean;
    includeReferences: boolean;
    useKnowledgeBase: boolean;
    isActive: boolean;
  };

  const [kbDocuments, setKbDocuments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AiSettings>({
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: `Sei un assistente esperto specializzato in ${subcategory.name}. Fornisci risposte professionali e dettagliate.`,
    responseStyle: 'FORMAL',
    detailLevel: 'INTERMEDIATE',
    includeDiagrams: false,
    includeReferences: false,
    useKnowledgeBase: false,
    isActive: true,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: AiSettings) => {
      return await api.post(`/subcategories/${subcategory.id}/ai-settings`, data);
    },
    onSuccess: () => {
      toast.success('Impostazioni AI salvate con successo');
      onSuccess();
    },
    onError: (error: any) => {
      const serverMessage = error?.response?.data?.message;
      const serverCode = error?.response?.data?.error?.code;
      const msg = typeof serverMessage === 'string' 
        ? serverMessage 
        : (typeof serverCode === 'string' ? serverCode : 'Errore durante il salvataggio');
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Configurazione AI - {subcategory.name}</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Modello AI</label>
                <select value={formData.modelName} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border">
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
                <input type="number" value={formData.maxTokens} onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })} min="100" max="4096" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Temperature ({formData.temperature})</label>
                <input type="range" value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })} min="0" max="2" step="0.1" className="mt-1 block w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stile Risposta</label>
                <select value={formData.responseStyle} onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value as any })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border">
                  <option value="FORMAL">Formale</option>
                  <option value="INFORMAL">Informale</option>
                  <option value="TECHNICAL">Tecnico</option>
                  <option value="EDUCATIONAL">Educativo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Livello Dettaglio</label>
                <select value={formData.detailLevel} onChange={(e) => setFormData({ ...formData, detailLevel: e.target.value as any })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border">
                  <option value="BASIC">Base</option>
                  <option value="INTERMEDIATE">Intermedio</option>
                  <option value="ADVANCED">Avanzato</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">System Prompt</label>
              <textarea value={formData.systemPrompt} onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" id="useKnowledgeBase" checked={formData.useKnowledgeBase} onChange={(e) => setFormData({ ...formData, useKnowledgeBase: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="useKnowledgeBase" className="ml-2 text-sm text-gray-700">Usa Knowledge Base</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="includeDiagrams" checked={formData.includeDiagrams} onChange={(e) => setFormData({ ...formData, includeDiagrams: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="includeDiagrams" className="ml-2 text-sm text-gray-700">Includi Diagrammi</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="includeReferences" checked={formData.includeReferences} onChange={(e) => setFormData({ ...formData, includeReferences: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="includeReferences" className="ml-2 text-sm text-gray-700">Includi Riferimenti</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="isActiveAi" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isActiveAi" className="ml-2 text-sm text-gray-700">AI Attivo</label>
              </div>
            </div>

            {formData.useKnowledgeBase && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Knowledge Base Documents</h4>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                    <DocumentArrowUpIcon className="h-4 w-4 mr-1" />{uploadingFile ? 'Caricamento...' : 'Upload File'}
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.doc,.docx,.txt,.md" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingFile(true);
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('subcategoryId', subcategory.id);
                    try {
                      const response = await api.post(`/kb-documents/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setKbDocuments(prev => [...prev, response.data.data]);
                      toast.success('File caricato con successo');
                    } catch (error: any) {
                      const serverMessage = error?.response?.data?.message;
                      const serverCode = error?.response?.data?.error?.code;
                      const msg = typeof serverMessage === 'string' 
                        ? serverMessage 
                        : (typeof serverCode === 'string' ? serverCode : 'Errore durante il caricamento');
                      toast.error(msg);
                    } finally {
                      setUploadingFile(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }} />
                </div>
                {kbDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {kbDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                            <p className="text-xs text-gray-500">{doc.fileName} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button type="button" onClick={async () => {
                          try {
                            await api.delete(`/kb-documents/${doc.id}`);
                            setKbDocuments(prev => prev.filter(d => d.id !== doc.id));
                            toast.success('Documento rimosso');
                          } catch (error) {
                            toast.error('Errore durante la rimozione');
                          }
                        }} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Nessun documento caricato. Clicca su "Upload File" per aggiungere documenti alla knowledge base.</p>
                )}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Knowledge Base Prompt (opzionale)</label>
                  <textarea value={formData.knowledgeBasePrompt || ''} onChange={(e) => setFormData({ ...formData, knowledgeBasePrompt: e.target.value })} rows={2} placeholder="Prompt specifico per utilizzare la knowledge base..." className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-sm" />
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Annulla</button>
            <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">{saveMutation.isPending ? 'Salvataggio...' : 'Salva Impostazioni'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}