import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import {
  PaintBrushIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  SwatchIcon,
  AdjustmentsVerticalIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface UIElement {
  id: string;
  elementType: string;
  isVisible: boolean;
  isRequired: boolean;
  order: number;
  customLabel?: string;
  customClasses?: string;
}

interface UIConfig {
  id: string;
  name: string;
  description?: string;
  role: string;
  pageType: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    borderRadius: string;
  };
  elements: UIElement[];
  customCSS?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UIConfigPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<UIConfig | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: 'CLIENT',
    pageType: 'DASHBOARD',
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#f59e0b',
      fontFamily: 'Inter',
      borderRadius: '0.5rem'
    },
    elements: [] as UIElement[],
    customCSS: '',
    isActive: true
  });

  // Carica configurazioni UI
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['ui-configs'],
    queryFn: async () => {
      const response = await api.get('/admin/document-ui-configs');
      return response.data?.data || [];
    }
  });

  // Carica statistiche
  const { data: stats } = useQuery({
    queryKey: ['ui-config-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/document-config/stats');
      return response.data?.data || {};
    }
  });

  // Elementi UI disponibili
  const availableElements = [
    { type: 'header', label: 'Header', icon: '🔝' },
    { type: 'sidebar', label: 'Sidebar', icon: '📱' },
    { type: 'navbar', label: 'Navigation Bar', icon: '🧭' },
    { type: 'footer', label: 'Footer', icon: '🔻' },
    { type: 'breadcrumb', label: 'Breadcrumb', icon: '🍞' },
    { type: 'search', label: 'Search Bar', icon: '🔍' },
    { type: 'filters', label: 'Filtri', icon: '🔧' },
    { type: 'notifications', label: 'Centro Notifiche', icon: '🔔' },
    { type: 'userMenu', label: 'Menu Utente', icon: '👤' },
    { type: 'quickActions', label: 'Azioni Rapide', icon: '⚡' },
    { type: 'statistics', label: 'Widget Statistiche', icon: '📊' },
    { type: 'recentActivity', label: 'Attività Recenti', icon: '📜' }
  ];

  // Mutation per creare configurazione
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/document-ui-configs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-configs'] });
      toast.success('Configurazione UI creata con successo');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Errore nella creazione della configurazione');
    }
  });

  // Mutation per aggiornare configurazione
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await api.put(`/admin/document-ui-configs/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-configs'] });
      toast.success('Configurazione aggiornata con successo');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento della configurazione');
    }
  });

  // Mutation per eliminare configurazione
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/document-ui-configs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-configs'] });
      toast.success('Configurazione eliminata con successo');
    },
    onError: () => {
      toast.error('Errore nell\'eliminazione della configurazione');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConfig) {
      updateMutation.mutate({ id: selectedConfig.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (config: UIConfig) => {
    setSelectedConfig(config);
    setFormData({
      name: config.name,
      description: config.description || '',
      role: config.role,
      pageType: config.pageType,
      theme: config.theme,
      elements: config.elements || [],
      customCSS: config.customCSS || '',
      isActive: config.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sicuro di voler eliminare questa configurazione?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleElement = (elementType: string) => {
    const existingElement = formData.elements.find(e => e.elementType === elementType);
    
    if (existingElement) {
      setFormData({
        ...formData,
        elements: formData.elements.filter(e => e.elementType !== elementType)
      });
    } else {
      setFormData({
        ...formData,
        elements: [...formData.elements, {
          id: `elem_${Date.now()}`,
          elementType,
          isVisible: true,
          isRequired: false,
          order: formData.elements.length + 1
        }]
      });
    }
  };

  const updateElementProperty = (elementType: string, property: string, value: any) => {
    setFormData({
      ...formData,
      elements: formData.elements.map(e => 
        e.elementType === elementType 
          ? { ...e, [property]: value }
          : e
      )
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      role: 'CLIENT',
      pageType: 'DASHBOARD',
      theme: {
        primaryColor: '#6366f1',
        secondaryColor: '#f59e0b',
        fontFamily: 'Inter',
        borderRadius: '0.5rem'
      },
      elements: [],
      customCSS: '',
      isActive: true
    });
    setSelectedConfig(null);
    setActiveTab('general');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurazione UI</h1>
            <p className="mt-1 text-sm text-gray-600">
              Personalizza l'interfaccia utente per ruolo e tipo di pagina
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuova Configurazione
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-pink-50 rounded-lg p-4">
            <div className="flex items-center">
              <PaintBrushIcon className="h-8 w-8 text-pink-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Configurazioni Totali</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.uiConfigs?.total || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Per Ruolo</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.uiConfigs?.byRole?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <SwatchIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Temi Custom</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {configs.filter((c: any) => c.customCSS).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Attive</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {configs.filter((c: any) => c.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Configurazioni */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Configurazioni UI</h2>
        </div>
        
        {configs.length === 0 ? (
          <div className="p-12 text-center">
            <PaintBrushIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna configurazione</h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando la tua prima configurazione UI personalizzata.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crea Configurazione
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {configs.map((config: any) => (
              <div key={config.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                {/* Preview Header */}
                <div 
                  className="h-32 rounded-t-lg relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${config.theme?.primaryColor || '#6366f1'} 0%, ${config.theme?.secondaryColor || '#f59e0b'} 100%)`
                  }}
                >
                  <div className="absolute top-4 right-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      config.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {config.isActive ? 'Attiva' : 'Inattiva'}
                    </span>
                  </div>
                </div>

                {/* Config Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                  {config.description && (
                    <p className="mt-1 text-sm text-gray-500">{config.description}</p>
                  )}
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {config.role}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {config.pageType}
                    </span>
                  </div>

                  {/* Elements Count */}
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">{config.elements?.length || 0}</span> elementi configurati
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      className="text-sm text-pink-600 hover:text-pink-900 font-medium"
                    >
                      <EyeIcon className="inline-block h-4 w-4 mr-1" />
                      Preview
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="p-1 text-gray-600 hover:text-gray-900"
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="p-1 text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Creazione/Modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedConfig ? 'Modifica Configurazione UI' : 'Nuova Configurazione UI'}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                  <nav className="-mb-px flex space-x-8">
                    {['general', 'elements', 'theme', 'custom'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? 'border-pink-500 text-pink-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab === 'general' && 'Generale'}
                        {tab === 'elements' && 'Elementi UI'}
                        {tab === 'theme' && 'Tema'}
                        {tab === 'custom' && 'CSS Personalizzato'}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Tab Generale */}
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nome Configurazione *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Ruolo *
                          </label>
                          <select
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                          >
                            <option value="CLIENT">Cliente</option>
                            <option value="PROFESSIONAL">Professionista</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tipo Pagina *
                          </label>
                          <select
                            required
                            value={formData.pageType}
                            onChange={(e) => setFormData({ ...formData, pageType: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                          >
                            <option value="DASHBOARD">Dashboard</option>
                            <option value="LIST">Lista</option>
                            <option value="DETAIL">Dettaglio</option>
                            <option value="FORM">Form</option>
                            <option value="REPORT">Report</option>
                          </select>
                        </div>
                        <div className="flex items-center mt-6">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Configurazione Attiva
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Descrizione
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab Elementi UI */}
                  {activeTab === 'elements' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Seleziona Elementi UI</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {availableElements.map((element) => {
                            const isSelected = formData.elements.some(e => e.elementType === element.type);
                            const selectedElement = formData.elements.find(e => e.elementType === element.type);
                            
                            return (
                              <div 
                                key={element.type}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-pink-500 bg-pink-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className="text-2xl mr-2">{element.icon}</span>
                                    <span className="font-medium text-sm">{element.label}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleElement(element.type)}
                                    className={`p-1 rounded ${
                                      isSelected 
                                        ? 'text-pink-600' 
                                        : 'text-gray-400'
                                    }`}
                                  >
                                    {isSelected ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                                  </button>
                                </div>
                                
                                {isSelected && (
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                      <button
                                        type="button"
                                        onClick={() => updateElementProperty(element.type, 'isVisible', !selectedElement?.isVisible)}
                                        className="mr-2"
                                      >
                                        {selectedElement?.isVisible ? 
                                          <EyeIcon className="h-4 w-4 text-green-600" /> : 
                                          <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                        }
                                      </button>
                                      <span className="text-xs text-gray-600">
                                        {selectedElement?.isVisible ? 'Visibile' : 'Nascosto'}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedElement?.isRequired || false}
                                        onChange={(e) => updateElementProperty(element.type, 'isRequired', e.target.checked)}
                                        className="h-3 w-3 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mr-2"
                                      />
                                      <span className="text-xs text-gray-600">Obbligatorio</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Tema */}
                  {activeTab === 'theme' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Colore Primario
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={formData.theme.primaryColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                theme: { ...formData.theme, primaryColor: e.target.value }
                              })}
                              className="h-10 w-20"
                            />
                            <input
                              type="text"
                              value={formData.theme.primaryColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                theme: { ...formData.theme, primaryColor: e.target.value }
                              })}
                              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Colore Secondario
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={formData.theme.secondaryColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                theme: { ...formData.theme, secondaryColor: e.target.value }
                              })}
                              className="h-10 w-20"
                            />
                            <input
                              type="text"
                              value={formData.theme.secondaryColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                theme: { ...formData.theme, secondaryColor: e.target.value }
                              })}
                              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Font Family
                          </label>
                          <select
                            value={formData.theme.fontFamily}
                            onChange={(e) => setFormData({
                              ...formData,
                              theme: { ...formData.theme, fontFamily: e.target.value }
                            })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                          >
                            <option value="Inter">Inter</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Open Sans">Open Sans</option>
                            <option value="Lato">Lato</option>
                            <option value="Poppins">Poppins</option>
                            <option value="Montserrat">Montserrat</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Border Radius
                          </label>
                          <select
                            value={formData.theme.borderRadius}
                            onChange={(e) => setFormData({
                              ...formData,
                              theme: { ...formData.theme, borderRadius: e.target.value }
                            })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                          >
                            <option value="0">Nessuno (0)</option>
                            <option value="0.125rem">Minimo (0.125rem)</option>
                            <option value="0.25rem">Piccolo (0.25rem)</option>
                            <option value="0.375rem">Medio-Piccolo (0.375rem)</option>
                            <option value="0.5rem">Medio (0.5rem)</option>
                            <option value="0.75rem">Grande (0.75rem)</option>
                            <option value="1rem">Extra Grande (1rem)</option>
                          </select>
                        </div>
                      </div>

                      {/* Preview del tema */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Anteprima Tema</h4>
                        <div 
                          className="border-2 border-gray-200 rounded-lg p-6"
                          style={{
                            fontFamily: formData.theme.fontFamily,
                            borderRadius: formData.theme.borderRadius
                          }}
                        >
                          <div className="space-y-4">
                            <button
                              type="button"
                              style={{
                                backgroundColor: formData.theme.primaryColor,
                                borderRadius: formData.theme.borderRadius
                              }}
                              className="px-4 py-2 text-white"
                            >
                              Bottone Primario
                            </button>
                            <button
                              type="button"
                              style={{
                                backgroundColor: formData.theme.secondaryColor,
                                borderRadius: formData.theme.borderRadius
                              }}
                              className="px-4 py-2 text-white"
                            >
                              Bottone Secondario
                            </button>
                            <div 
                              className="p-4 border-2"
                              style={{
                                borderColor: formData.theme.primaryColor,
                                borderRadius: formData.theme.borderRadius
                              }}
                            >
                              Card di esempio con bordo primario
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab CSS Personalizzato */}
                  {activeTab === 'custom' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CSS Personalizzato
                        </label>
                        <p className="text-sm text-gray-500 mb-4">
                          Aggiungi regole CSS personalizzate per questa configurazione. Usa con cautela.
                        </p>
                        <textarea
                          value={formData.customCSS}
                          onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
                          rows={15}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm font-mono"
                          placeholder={`/* Esempio CSS personalizzato */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sidebar-menu {
  width: 280px;
}

/* Le classi saranno applicate con scope al ruolo/pagina selezionati */`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvataggio...' : 'Salva Configurazione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
