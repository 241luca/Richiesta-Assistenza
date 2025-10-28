import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  PhotoIcon,
  FolderIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'text';
  category: string;
  description?: string;
  isActive: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Configurazione delle sezioni
const SECTIONS_CONFIG = {
  'Immagini': {
    icon: PhotoIcon,
    gradient: 'from-blue-500 to-indigo-500',
    bgLight: 'from-blue-50 to-indigo-50',
    description: 'Configurazione percorsi e limiti per le immagini'
  },
  'Promemoria Immagini': {
    icon: BellIcon,
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'from-amber-50 to-orange-50',
    description: 'Configurazione promemoria per immagini mancanti'
  },
  'Obbligatorietà Clienti': {
    icon: UserGroupIcon,
    gradient: 'from-green-500 to-emerald-500',
    bgLight: 'from-green-50 to-emerald-50',
    description: 'Impostazioni obbligatorietà per i clienti'
  },
  'Obbligatorietà Professionisti': {
    icon: WrenchScrewdriverIcon,
    gradient: 'from-purple-500 to-violet-500',
    bgLight: 'from-purple-50 to-violet-50',
    description: 'Impostazioni obbligatorietà per i professionisti'
  },
  'Esclusioni': {
    icon: ShieldExclamationIcon,
    gradient: 'from-red-500 to-rose-500',
    bgLight: 'from-red-50 to-rose-50',
    description: 'Configurazione esclusioni dalle obbligatorietà'
  }
};

export default function ImageConfigPage() {
  const [selectedSection, setSelectedSection] = useState<string>('Immagini');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Categorie delle impostazioni relative alle immagini
  const IMAGE_CATEGORIES = [
    'Immagini',
    'Promemoria Immagini',
    'Obbligatorietà Clienti', 
    'Obbligatorietà Professionisti',
    'Esclusioni'
  ];

  // Fetch settings per le categorie specifiche
  const { data: settings = [], isLoading, refetch } = useQuery({
    queryKey: ['image-config-settings'],
    queryFn: async () => {
      const response = await api.systemSettings.getAll();
      const allSettings = response.data?.data || [];
      
      // Filtra solo le impostazioni relative alle immagini e obbligatorietà
      return allSettings.filter((setting: SystemSetting) => 
        IMAGE_CATEGORIES.includes(setting.category)
      );
    }
  });

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const response = await api.systemSettings.update(id, { value });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Impostazione aggiornata con successo');
      queryClient.invalidateQueries({ queryKey: ['image-config-settings'] });
      setEditingId(null);
      setEditValues({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiornamento');
    }
  });

  // Filtra le impostazioni per sezione selezionata
  const filteredSettings = settings.filter(setting => setting.category === selectedSection);

  const handleEdit = (setting: SystemSetting) => {
    setEditingId(setting.id);
    setEditValues({ [setting.id]: setting.value });
  };

  const handleSave = (settingId: string) => {
    const newValue = editValues[settingId];
    if (newValue !== undefined) {
      updateMutation.mutate({ id: settingId, value: newValue });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const renderSettingValue = (setting: SystemSetting) => {
    const isEditing = editingId === setting.id;
    const currentValue = isEditing ? editValues[setting.id] : setting.value;

    if (!setting.isEditable) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">{setting.value}</span>
          <InformationCircleIcon className="h-4 w-4 text-gray-400" title="Non modificabile" />
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="space-y-3">
          {setting.type === 'boolean' ? (
            <select
              value={currentValue}
              onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Sì</option>
              <option value="false">No</option>
            </select>
          ) : setting.type === 'text' ? (
            <TextArea
              value={currentValue}
              onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
              placeholder={setting.description}
              rows={4}
              className="w-full"
            />
          ) : (
            <Input
              type={setting.type === 'number' ? 'number' : 'text'}
              value={currentValue}
              onChange={(e) => setEditValues({ ...editValues, [setting.id]: e.target.value })}
              placeholder={setting.description}
              className="w-full"
            />
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleSave(setting.id)}
              disabled={updateMutation.isPending}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Salva
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <XCircleIcon className="h-4 w-4 mr-1" />
              Annulla
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {setting.type === 'boolean' ? (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              setting.value === 'true' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {setting.value === 'true' ? 'Sì' : 'No'}
            </span>
          ) : setting.type === 'text' ? (
            <div className="text-sm text-gray-600">
              {setting.value ? (
                <div className="max-h-20 overflow-y-auto">
                  {setting.value.split('\n').map((line, index) => (
                    <div key={index}>{line || <span className="text-gray-400">-</span>}</div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic">Nessun valore</span>
              )}
            </div>
          ) : (
            <span className="text-gray-900">{setting.value || <span className="text-gray-400 italic">Non impostato</span>}</span>
          )}
        </div>
        <button
          onClick={() => handleEdit(setting)}
          className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Modifica
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Caricamento impostazioni...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <PhotoIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurazione Immagini e Obbligatorietà</h1>
            <p className="text-gray-600">Gestisci i percorsi delle immagini e le regole di obbligatorietà per utenti</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar delle sezioni */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sezioni</h3>
            <nav className="space-y-2">
              {Object.entries(SECTIONS_CONFIG).map(([section, config]) => {
                const Icon = config.icon;
                const isSelected = selectedSection === section;
                
                return (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{section}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header sezione */}
            <div className={`p-6 bg-gradient-to-r ${SECTIONS_CONFIG[selectedSection]?.gradient} rounded-t-lg`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {React.createElement(SECTIONS_CONFIG[selectedSection]?.icon, {
                    className: "h-6 w-6 text-white"
                  })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedSection}</h2>
                  <p className="text-white/90">{SECTIONS_CONFIG[selectedSection]?.description}</p>
                </div>
              </div>
            </div>

            {/* Lista impostazioni */}
            <div className="p-6">
              {filteredSettings.length === 0 ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nessuna impostazione trovata per questa sezione</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSettings.map((setting) => (
                    <div
                      key={setting.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{setting.key}</h4>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            setting.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {setting.isActive ? 'Attivo' : 'Inattivo'}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {setting.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        {renderSettingValue(setting)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}