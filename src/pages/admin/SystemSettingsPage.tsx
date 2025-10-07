import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  CogIcon,
  PlusIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'text' | 'url' | 'email' | 'file' | 'color';
  category: string;
  description?: string;
  isActive: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Configurazione categorie con design migliorato
const CATEGORIES_CONFIG = {
  'Branding': {
    icon: PhotoIcon,
    gradient: 'from-blue-500 to-purple-500',
    bgLight: 'from-blue-50 to-purple-50',
    description: 'Logo, colori e identità visiva del sistema'
  },
  'Azienda': {
    icon: BuildingOfficeIcon,
    gradient: 'from-purple-500 to-pink-500',
    bgLight: 'from-purple-50 to-pink-50',
    description: 'Informazioni societarie e dati aziendali'
  },
  'Contatti': {
    icon: PhoneIcon,
    gradient: 'from-green-500 to-teal-500',
    bgLight: 'from-green-50 to-teal-50',
    description: 'Recapiti e informazioni di contatto'
  },
  'Documenti Legali': {
    icon: ShieldCheckIcon,
    gradient: 'from-red-500 to-orange-500',
    bgLight: 'from-red-50 to-orange-50',
    description: 'Privacy, termini di servizio e policy'
  },
  'Sistema': {
    icon: CogIcon,
    gradient: 'from-gray-500 to-gray-700',
    bgLight: 'from-gray-50 to-gray-100',
    description: 'Configurazioni tecniche del sistema'
  },
  'Social': {
    icon: GlobeAltIcon,
    gradient: 'from-indigo-500 to-blue-500',
    bgLight: 'from-indigo-50 to-blue-50',
    description: 'Link social media e presenza online'
  }
};

export default function SystemSettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings = [], isLoading, refetch } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/system-settings');
      return response.data?.data || [];
    }
  });

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const response = await api.put(`/admin/system-settings/${id}`, { value });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-public'] }); // Invalida anche la cache pubblica
      toast.success('Impostazione aggiornata con successo');
      setEditingId(null);
      setEditValues({});
    },
    onError: () => {
      toast.error('Errore durante l\'aggiornamento');
    }
  });

  // Create setting mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/system-settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Impostazione creata con successo');
      setShowAddForm(false);
    },
    onError: () => {
      toast.error('Errore durante la creazione');
    }
  });

  // Delete setting mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/system-settings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Impostazione eliminata con successo');
    },
    onError: () => {
      toast.error('Errore durante l\'eliminazione');
    }
  });

  // Filter settings
  const filteredSettings = settings.filter((setting: SystemSetting) => {
    const matchesCategory = !selectedCategory || setting.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group settings by category
  const groupedSettings = filteredSettings.reduce((acc: Record<string, SystemSetting[]>, setting: SystemSetting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  const handleEdit = (id: string) => {
    const setting = settings.find((s: SystemSetting) => s.id === id);
    if (setting) {
      setEditingId(id);
      setEditValues({ [id]: setting.value });
    }
  };

  const handleSave = (id: string) => {
    const value = editValues[id];
    if (value !== undefined) {
      updateMutation.mutate({ id, value });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const renderSettingValue = (setting: SystemSetting) => {
    const isEditing = editingId === setting.id;
    
    if (isEditing) {
      switch (setting.type) {
        case 'text':
          return (
            <TextArea
              value={editValues[setting.id] || ''}
              onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
              className="w-full"
              rows={4}
            />
          );
        case 'boolean':
          return (
            <select
              value={editValues[setting.id] || setting.value}
              onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Attivo</option>
              <option value="false">Disattivo</option>
            </select>
          );
        case 'color':
          return (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={editValues[setting.id] || setting.value}
                onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={editValues[setting.id] || setting.value}
                onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
                className="flex-1"
              />
            </div>
          );
        default:
          return (
            <Input
              type={setting.type === 'number' ? 'number' : 'text'}
              value={editValues[setting.id] || ''}
              onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
              className="w-full"
            />
          );
      }
    }

    // Display mode
    switch (setting.type) {
      case 'boolean':
        return setting.value === 'true' ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Attivo
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Disattivo
          </span>
        );
      case 'url':
        return (
          <a href={setting.value} target="_blank" rel="noopener noreferrer" 
             className="text-blue-600 hover:underline break-all">
            {setting.value}
          </a>
        );
      case 'email':
        return (
          <a href={`mailto:${setting.value}`} 
             className="text-blue-600 hover:underline">
            {setting.value}
          </a>
        );
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
              style={{ backgroundColor: setting.value }}
            />
            <span className="font-mono text-sm">{setting.value}</span>
          </div>
        );
      case 'file':
        if (setting.value && (setting.value.includes('.jpg') || setting.value.includes('.png') || setting.value.includes('.svg'))) {
          return (
            <img 
              src={setting.value} 
              alt={setting.key}
              className="h-20 w-auto rounded-lg shadow-md"
            />
          );
        }
        return <span className="text-gray-600">{setting.value || 'Nessun file'}</span>;
      default:
        return <span className="text-gray-700 break-all">{setting.value}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Professionale */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <CogIcon className="h-8 w-8 mr-3" />
                Impostazioni di Sistema
              </h1>
              <p className="mt-2 text-blue-100">
                Gestisci tutte le configurazioni e personalizzazioni del sistema
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Ricarica"
            >
              <ArrowPathIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar Categorie */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <h2 className="font-semibold text-gray-900">Categorie</h2>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    !selectedCategory 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <FunnelIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Tutte le Categorie</p>
                      <p className="text-xs text-gray-500">{settings.length} impostazioni</p>
                    </div>
                  </div>
                </button>
                
                {Object.entries(CATEGORIES_CONFIG).map(([category, config]) => {
                  const Icon = config.icon;
                  const count = settings.filter((s: SystemSetting) => s.category === category).length;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all mt-1 ${
                        selectedCategory === category 
                          ? `bg-gradient-to-r ${config.bgLight} shadow-md` 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 bg-gradient-to-r ${config.gradient}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{category}</p>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistiche</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Totale Impostazioni</span>
                  <span className="font-semibold">{settings.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Attive</span>
                  <span className="font-semibold text-green-600">
                    {settings.filter((s: SystemSetting) => s.isActive).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Modificabili</span>
                  <span className="font-semibold text-blue-600">
                    {settings.filter((s: SystemSetting) => s.isEditable).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cerca impostazioni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuova Impostazione
                </button>
              </div>
            </div>

            {/* Settings Grid */}
            {Object.entries(groupedSettings).length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun risultato</h3>
                <p className="text-gray-600">
                  Non sono state trovate impostazioni corrispondenti ai criteri di ricerca.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSettings).map(([category, categorySettings]) => {
                  const config = CATEGORIES_CONFIG[category as keyof typeof CATEGORIES_CONFIG];
                  const Icon = config?.icon || CogIcon;
                  
                  return (
                    <div key={category} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className={`px-6 py-4 bg-gradient-to-r ${config?.bgLight || 'from-gray-50 to-gray-100'} border-b`}>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <div className={`p-2 rounded-lg mr-3 bg-gradient-to-r ${config?.gradient || 'from-gray-500 to-gray-700'}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          {category}
                          <span className="ml-3 text-sm font-normal text-gray-500">
                            ({categorySettings.length} impostazioni)
                          </span>
                        </h2>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {categorySettings.map((setting) => (
                          <div key={setting.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h3>
                                {setting.description && (
                                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {setting.isActive ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    Attivo
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    Inattivo
                                  </span>
                                )}
                                {!setting.isEditable && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                    Protetto
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              {renderSettingValue(setting)}
                            </div>
                            
                            {editingId === setting.id ? (
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => handleSave(setting.id)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                  Salva
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                                >
                                  Annulla
                                </button>
                              </div>
                            ) : (
                              setting.isEditable && (
                                <div className="mt-4 flex gap-2">
                                  <button
                                    onClick={() => handleEdit(setting.id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  >
                                    Modifica
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Sei sicuro di voler eliminare questa impostazione?')) {
                                        deleteMutation.mutate(setting.id);
                                      }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    Elimina
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Setting Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-xl font-semibold text-gray-900">Nuova Impostazione</h2>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                key: formData.get('key'),
                value: formData.get('value'),
                type: formData.get('type'),
                category: formData.get('category'),
                description: formData.get('description'),
                isActive: formData.get('isActive') === 'true',
                isEditable: formData.get('isEditable') === 'true'
              };
              createMutation.mutate(data);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chiave *
                </label>
                <Input
                  name="key"
                  required
                  placeholder="es. site_name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valore *
                </label>
                <Input
                  name="value"
                  required
                  placeholder="Inserisci il valore"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="string">Stringa</option>
                    <option value="number">Numero</option>
                    <option value="boolean">Booleano</option>
                    <option value="text">Testo</option>
                    <option value="url">URL</option>
                    <option value="email">Email</option>
                    <option value="color">Colore</option>
                    <option value="file">File</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(CATEGORIES_CONFIG).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <TextArea
                  name="description"
                  placeholder="Descrizione opzionale"
                  className="w-full"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    value="true"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Attivo
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isEditable"
                    value="true"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Modificabile
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Crea Impostazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}