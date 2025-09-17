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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/TextArea';
import SettingCard from '@/components/admin/system-settings/SettingCard';
import CategorySidebar from '@/components/admin/system-settings/CategorySidebar';
import AddSettingForm from '@/components/admin/system-settings/AddSettingForm';
import ImageUpload from '@/components/admin/ImageUpload';

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

// Configurazione categorie semplificate
const CATEGORIES_CONFIG = {
  'Branding': {
    icon: PhotoIcon,
    color: 'blue',
    description: 'Logo, colori e identità visiva'
  },
  'Azienda': {
    icon: BuildingOfficeIcon,
    color: 'purple',
    description: 'Informazioni societarie'
  },
  'Contatti': {
    icon: PhoneIcon,
    color: 'green',
    description: 'Recapiti e comunicazioni'
  },
  'Privacy': {
    icon: ShieldCheckIcon,
    color: 'red',
    description: 'GDPR e documenti legali'
  },
  'Sistema': {
    icon: CogIcon,
    color: 'gray',
    description: 'Configurazioni tecniche'
  }
};

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('Branding');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    type: 'string',
    category: activeCategory,
    description: '',
    isActive: true,
    isEditable: true
  });

  // Fetch settings
  const { data: settings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/system-settings');
      if (response.data?.success) {
        return response.data.data || [];
      }
      throw new Error(response.data?.message || 'Errore nel caricamento');
    },
    retry: 1
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<SystemSetting>) => {
      return api.post('/admin/system-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Impostazione creata con successo');
      setShowAddForm(false);
      resetNewSetting();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      return api.put(`/admin/system-settings/${id}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Impostazione aggiornata');
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/system-settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Impostazione eliminata');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  });

  const resetNewSetting = () => {
    setNewSetting({
      key: '',
      value: '',
      type: 'string',
      category: activeCategory,
      description: '',
      isActive: true,
      isEditable: true
    });
  };

  // Filter settings
  const filteredSettings = settings.filter((s: SystemSetting) => {
    const matchesCategory = s.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Count settings per category
  const categoriesWithCount = Object.fromEntries(
    Object.entries(CATEGORIES_CONFIG).map(([key, config]) => [
      key,
      {
        ...config,
        count: settings.filter((s: SystemSetting) => s.category === key).length
      }
    ])
  );

  // Render form field based on type
  const renderFormField = (value: string, onChange: (value: string) => void, type: string, settingKey?: string) => {
    // Special handling for logo and favicon URLs
    if (type === 'url' && settingKey && (settingKey.includes('logo') || settingKey.includes('favicon'))) {
      return (
        <ImageUpload
          currentValue={value}
          settingKey={settingKey}
          onUploadSuccess={(newUrl) => onChange(newUrl)}
          accept="image/*"
        />
      );
    }

    switch (type) {
      case 'boolean':
        return (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange('true')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                value === 'true'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Attivo
            </button>
            <button
              type="button"
              onClick={() => onChange('false')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                value === 'false'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disattivo
            </button>
          </div>
        );
      
      case 'text':
        return (
          <TextArea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            rows={3}
          />
        );
      
      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || '#3B82F6'}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#3B82F6"
              className="flex-1"
            />
          </div>
        );
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
          />
        );
    }
  };

  // Render setting value display
  const renderSettingValue = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            setting.value === 'true'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {setting.value === 'true' ? 'Attivo' : 'Disattivo'}
          </span>
        );
      
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: setting.value }}
            />
            <span className="font-mono text-xs">{setting.value}</span>
          </div>
        );
      
      case 'url':
        if (setting.key.includes('logo') || setting.key.includes('favicon')) {
          return (
            <img 
              src={setting.value} 
              alt={setting.key} 
              className="h-10 object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                // Nascondi l'immagine se non può essere caricata
                img.style.display = 'none';
                // Aggiungi un elemento di testo alternativo
                const span = document.createElement('span');
                span.className = 'text-gray-400 text-xs';
                span.textContent = 'Immagine non disponibile';
                img.parentElement?.appendChild(span);
              }}
            />
          );
        }
        return (
          <a href={setting.value} className="text-blue-600 hover:underline text-sm" target="_blank" rel="noopener noreferrer">
            {setting.value.length > 50 ? setting.value.substring(0, 50) + '...' : setting.value}
          </a>
        );
      
      case 'email':
        return (
          <a href={`mailto:${setting.value}`} className="text-blue-600 hover:underline text-sm">
            {setting.value}
          </a>
        );
      
      case 'text':
        return (
          <p className="text-sm text-gray-700 line-clamp-2">
            {setting.value}
          </p>
        );
      
      default:
        return <span className="text-sm text-gray-900">{setting.value}</span>;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CogIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Errore nel caricamento
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Non è stato possibile caricare le impostazioni di sistema.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 inline mr-2" />
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Categorie */}
      <CategorySidebar
        categories={categoriesWithCount}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Impostazioni di Sistema
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {CATEGORIES_CONFIG[activeCategory as keyof typeof CATEGORIES_CONFIG]?.description}
                </p>
              </div>
              <button
                onClick={() => {
                  setNewSetting({ ...newSetting, category: activeCategory });
                  setShowAddForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Aggiungi</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca impostazioni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full max-w-md"
              />
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredSettings.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CogIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery 
                  ? 'Nessun risultato trovato' 
                  : `Nessuna impostazione in ${activeCategory}`}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery 
                  ? 'Prova a modificare i criteri di ricerca' 
                  : 'Inizia creando la prima impostazione'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setNewSetting({ ...newSetting, category: activeCategory });
                    setShowAddForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Crea Prima Impostazione
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSettings.map((setting: SystemSetting) => (
                <SettingCard
                  key={setting.id}
                  setting={setting}
                  isEditing={editingId === setting.id}
                  editValue={editValue}
                  onEdit={() => {
                    setEditingId(setting.id);
                    setEditValue(setting.value);
                  }}
                  onSave={() => {
                    // Per URL di immagini, salva direttamente il valore
                    if (setting.type === 'url' && (setting.key.includes('logo') || setting.key.includes('favicon'))) {
                      updateMutation.mutate({ id: setting.id, value: editValue });
                    } else {
                      updateMutation.mutate({ id: setting.id, value: editValue });
                    }
                  }}
                  onCancel={() => {
                    setEditingId(null);
                    setEditValue('');
                  }}
                  onDelete={() => {
                    if (confirm(`Eliminare l'impostazione "${setting.key}"?`)) {
                      deleteMutation.mutate(setting.id);
                    }
                  }}
                  onValueChange={setEditValue}
                  renderValue={renderSettingValue}
                  renderEditField={(val, onChange, type) => renderFormField(val, onChange, type, setting.key)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Setting Modal */}
      <AddSettingForm
        show={showAddForm}
        setting={newSetting}
        onChange={(field, value) => setNewSetting({ ...newSetting, [field]: value })}
        onSubmit={() => createMutation.mutate(newSetting)}
        onCancel={() => {
          setShowAddForm(false);
          resetNewSetting();
        }}
        renderField={renderFormField}
      />
    </div>
  );
}
