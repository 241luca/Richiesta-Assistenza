import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { TextArea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import {
  Cog6ToothIcon,
  PlusIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  HashtagIcon,
  SwatchIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Define types
interface SystemSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  type: string;
  description?: string;
  category: string;
  isEditable: boolean;
  isPublic: boolean;
  validation?: any;
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
}

// Add toggle icon placeholder since it might not exist in heroicons
const ToggleIcon = Cog6ToothIcon;

const SETTING_TYPES = [
  { value: 'string', label: 'Testo', icon: DocumentTextIcon },
  { value: 'textarea', label: 'Testo Lungo', icon: DocumentTextIcon },
  { value: 'number', label: 'Numero', icon: HashtagIcon },
  { value: 'boolean', label: 'Booleano', icon: ToggleIcon },
  { value: 'color', label: 'Colore', icon: SwatchIcon },
  { value: 'json', label: 'JSON', icon: DocumentTextIcon }
];

const CATEGORIES = [
  { value: 'footer', label: 'Footer', color: 'bg-blue-100 text-blue-800' },
  { value: 'branding', label: 'Branding', color: 'bg-purple-100 text-purple-800' },
  { value: 'general', label: 'Generale', color: 'bg-gray-100 text-gray-800' },
  { value: 'system', label: 'Sistema', color: 'bg-red-100 text-red-800' },
  { value: 'ai', label: 'AI', color: 'bg-green-100 text-green-800' }
];

export default function SystemSettingsPage() {
  const [showCreateSetting, setShowCreateSetting] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch all system settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/system-settings'],
    queryFn: () => apiClient.get('/admin/system-settings'),
    staleTime: 30 * 1000
  });

  const getCategoryColor = (category: string) => {
    const categoryConfig = CATEGORIES.find(c => c.value === category);
    return categoryConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = SETTING_TYPES.find(t => t.value === type);
    return typeConfig?.icon || DocumentTextIcon;
  };

  // Filter settings by category - Handle ResponseFormatter structure
  const settingsDataContent = settingsData?.data || {};
  const filteredSettings = selectedCategory === 'all' 
    ? settingsDataContent
    : { [selectedCategory]: settingsDataContent[selectedCategory] || [] };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" style={{ width: '24px', height: '24px' }} />
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni di Sistema</h1>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-12 bg-gray-100 rounded"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" style={{ width: '24px', height: '24px' }} />
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni di Sistema</h1>
        </div>
        
        <Button
          onClick={() => setShowCreateSetting(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" style={{ width: '16px', height: '16px' }} />
          Nuova Impostazione
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" style={{ width: '20px', height: '20px' }} />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Configurazione Globale</h3>
            <p className="text-sm text-blue-700 mt-1">
              Gestisci tutte le impostazioni globali del sistema come testi del footer, branding, 
              configurazioni AI e altre impostazioni personalizzabili.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size="sm"
          >
            Tutte le Categorie
          </Button>
          {CATEGORIES.map(category => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.value)}
              size="sm"
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-6">
        {Object.entries(filteredSettings).map(([category, settings]) => (
          <SettingsCategory
            key={category}
            category={category}
            settings={settings}
            onEditSetting={setEditingSetting}
          />
        ))}
      </div>

      {/* Footer Preview */}
      <FooterPreview />

      {/* Create Setting Modal */}
      {showCreateSetting && (
        <CreateSettingModal 
          onClose={() => setShowCreateSetting(false)}
          onSuccess={() => {
            setShowCreateSetting(false);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
          }}
        />
      )}

      {/* Edit Setting Modal */}
      {editingSetting && (
        <EditSettingModal 
          setting={editingSetting}
          onClose={() => setEditingSetting(null)}
          onSuccess={() => {
            setEditingSetting(null);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
          }}
        />
      )}
    </div>
  );
}

// Componente per categoria di impostazioni
function SettingsCategory({ category, settings, onEditSetting }) {
  const getCategoryInfo = (cat: string) => {
    const configs = {
      footer: { title: 'Impostazioni Footer', icon: DocumentTextIcon },
      branding: { title: 'Branding', icon: SwatchIcon },
      general: { title: 'Generale', icon: Cog6ToothIcon },
      system: { title: 'Sistema', icon: Cog6ToothIcon },
      ai: { title: 'Intelligenza Artificiale', icon: DocumentTextIcon }
    };
    return configs[cat] || { title: cat.charAt(0).toUpperCase() + cat.slice(1), icon: Cog6ToothIcon };
  };

  const categoryInfo = getCategoryInfo(category);
  const Icon = categoryInfo.icon;

  // Add safety check for settings parameter
  if (!settings || !Array.isArray(settings) || settings.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 text-gray-600" style={{ width: '20px', height: '20px' }} />
            <h2 className="text-lg font-semibold text-gray-900">{categoryInfo.title}</h2>
            <Badge className="bg-gray-100 text-gray-800">
              {settings.length} impostazioni
            </Badge>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {settings.map((setting: SystemSetting) => (
          <SettingRow 
            key={setting.id}
            setting={setting}
            onEdit={() => onEditSetting(setting)}
          />
        ))}
      </div>
    </Card>
  );
}

// Componente per singola riga di impostazione
function SettingRow({ setting, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting.value);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (newValue: string) => 
      apiClient.put(`/admin/system-settings/${setting.key}`, { value: newValue }),
    onSuccess: () => {
      toast.success('Impostazione aggiornata');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
    },
    onError: () => toast.error('Errore durante l\'aggiornamento')
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/admin/system-settings/${setting.key}`),
    onSuccess: () => {
      toast.success('Impostazione eliminata');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
    },
    onError: () => toast.error('Errore durante l\'eliminazione')
  });

  const handleSave = () => {
    if (editValue !== setting.value) {
      updateMutation.mutate(editValue);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(setting.value);
    setIsEditing(false);
  };

  const TypeIcon = getTypeIcon(setting.type);

  const renderValue = () => {
    if (isEditing) {
      switch (setting.type) {
        case 'boolean':
          return (
            <select 
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Vero</option>
              <option value="false">Falso</option>
            </select>
          );
        case 'textarea':
          return (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          );
        case 'color':
          return (
            <input
              type="color"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="block w-20 h-10 border border-gray-300 rounded-md"
            />
          );
        default:
          return (
            <input
              type={setting.type === 'number' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          );
      }
    }

    // Display mode
    switch (setting.type) {
      case 'boolean':
        return (
          <Badge className={setting.value === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {setting.value === 'true' ? 'Attivo' : 'Inattivo'}
          </Badge>
        );
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: setting.value }}
            ></div>
            <span className="font-mono text-sm">{setting.value}</span>
          </div>
        );
      default:
        return (
          <span className={`${setting.value.length > 100 ? 'text-sm' : ''} text-gray-900`}>
            {setting.value.length > 100 ? `${setting.value.substring(0, 100)}...` : setting.value}
          </span>
        );
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center space-x-2 mb-2">
            <TypeIcon className="h-4 w-4 text-gray-500" style={{ width: '16px', height: '16px' }} />
            <h3 className="text-sm font-medium text-gray-900">{setting.label}</h3>
            <code className="px-2 py-1 text-xs bg-gray-100 rounded">{setting.key}</code>
            {setting.isPublic && (
              <Badge className="bg-blue-100 text-blue-800">Pubblico</Badge>
            )}
            {!setting.isEditable && (
              <Badge className="bg-red-100 text-red-800">Sistema</Badge>
            )}
          </div>
          
          {setting.description && (
            <p className="text-sm text-gray-500 mb-2">{setting.description}</p>
          )}
          
          <div className="mt-2">
            {renderValue()}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
              </Button>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="outline"
              >
                <XMarkIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
              </Button>
            </>
          ) : (
            <>
              {setting.isEditable && (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="outline"
                >
                  <PencilIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
                </Button>
              )}
              <Button
                onClick={onEdit}
                size="sm"
                variant="outline"
              >
                <EyeIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
              </Button>
              {setting.isEditable && (
                <Button
                  onClick={() => deleteMutation.mutate()}
                  size="sm"
                  variant="outline"
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente per preview del footer
function FooterPreview() {
  const { data: footerConfig } = useQuery({
    queryKey: ['/api/admin/system-settings/footer/config'],
    queryFn: () => apiClient.get('/admin/system-settings/footer/config'),
    staleTime: 60 * 1000
  });

  // Handle ResponseFormatter structure for footer config
  const config = footerConfig?.data || {};

  return (
    <Card className="mt-8">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Anteprima Footer</h3>
        <p className="text-sm text-gray-500 mt-1">
          Ecco come apparirà il footer con le impostazioni attuali:
        </p>
      </div>
      
      <div className="p-6">
        <div className="bg-white border-t border-gray-200 rounded-lg p-4">
          <p className="text-center text-xs text-gray-500">
            {config.text || '© 2025 Sistema Richiesta Assistenza'} {config.version || 'v2.0'} | {config.edition || 'Enterprise Edition'}
          </p>
        </div>
      </div>
    </Card>
  );
}

// Modal per creare nuova impostazione
function CreateSettingModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'string',
    label: '',
    description: '',
    category: 'general',
    isPublic: false,
    validation: null
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/system-settings', data),
    onSuccess: () => {
      toast.success('Impostazione creata con successo');
      onSuccess();
    },
    onError: () => toast.error('Errore durante la creazione')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Crea Nuova Impostazione</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chiave"
              value={formData.key}
              onChange={(e) => setFormData({...formData, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_')})}
              placeholder="FOOTER_TEXT"
              required
            />
            
            <Input
              label="Etichetta"
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              placeholder="Testo Footer"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              options={SETTING_TYPES.map(type => ({ value: type.value, label: type.label }))}
            />
            
            <Select
              label="Categoria"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              options={CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }))}
            />
          </div>
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione dell'impostazione..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valore</label>
            {formData.type === 'boolean' ? (
              <select 
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleziona...</option>
                <option value="true">Vero</option>
                <option value="false">Falso</option>
              </select>
            ) : formData.type === 'textarea' ? (
              <textarea
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            ) : formData.type === 'color' ? (
              <input
                type="color"
                value={formData.value || '#000000'}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="block w-20 h-10 border border-gray-300 rounded-md"
              />
            ) : (
              <Input
                type={formData.type === 'number' ? 'number' : 'text'}
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                placeholder="Valore dell'impostazione"
                required
              />
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Impostazione pubblica (accessibile senza autenticazione)
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending ? 'Creazione...' : 'Crea Impostazione'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal per modificare impostazione esistente
function EditSettingModal({ setting, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    value: setting.value,
    label: setting.label,
    description: setting.description || '',
    category: setting.category,
    type: setting.type,
    isPublic: setting.isPublic
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.put(`/admin/system-settings/${setting.key}`, data),
    onSuccess: () => {
      toast.success('Impostazione aggiornata con successo');
      onSuccess();
    },
    onError: () => toast.error('Errore durante l\'aggiornamento')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Modifica Impostazione: {setting.key}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Etichetta"
            value={formData.label}
            onChange={(e) => setFormData({...formData, label: e.target.value})}
            required
            disabled={!setting.isEditable}
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            disabled={!setting.isEditable}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              options={CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }))}
              disabled={!setting.isEditable}
            />
            
            <Select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              options={SETTING_TYPES.map(type => ({ value: type.value, label: type.label }))}
              disabled={!setting.isEditable}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valore</label>
            {formData.type === 'boolean' ? (
              <select 
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Vero</option>
                <option value="false">Falso</option>
              </select>
            ) : formData.type === 'textarea' ? (
              <textarea
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            ) : formData.type === 'color' ? (
              <input
                type="color"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="block w-20 h-10 border border-gray-300 rounded-md"
              />
            ) : (
              <Input
                type={formData.type === 'number' ? 'number' : 'text'}
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                required
              />
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              disabled={!setting.isEditable}
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Impostazione pubblica
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || !setting.isEditable}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTypeIcon(type: string) {
  const typeConfig = SETTING_TYPES.find(t => t.value === type);
  return typeConfig?.icon || DocumentTextIcon;
}
