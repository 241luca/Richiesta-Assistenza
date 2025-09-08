import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SwatchIcon,
  TagIcon,
  EyeIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';

interface SystemEnum {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt?: string;
  EnumValue: EnumValue[];
}

interface EnumValue {
  id: string;
  enumId: string;
  value: string;
  label: string;
  description?: string;
  color: string;
  textColor: string;
  bgColor?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  isDefault: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
}

const ICON_OPTIONS = [
  'ClockIcon', 'UserIcon', 'CheckCircleIcon', 'XCircleIcon', 
  'ExclamationTriangleIcon', 'ArrowUpIcon', 'ArrowDownIcon',
  'MinusIcon', 'WrenchScrewdriverIcon', 'DocumentIcon',
  'Cog6ToothIcon', 'ShieldCheckIcon', 'BellIcon', 'InformationCircleIcon',
  'ExclamationCircleIcon', 'ArrowPathIcon', 'ArrowUturnLeftIcon'
];

export default function SystemEnumsPage() {
  const [expandedEnums, setExpandedEnums] = useState<Set<string>>(new Set());
  const [showCreateEnum, setShowCreateEnum] = useState(false);
  const [showCreateValue, setShowCreateValue] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<EnumValue | null>(null);
  const queryClient = useQueryClient();

  // Fetch all system enums
  const { data: enumsResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/system-enums'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/system-enums');
      console.log('System Enums API Response:', response.data);
      
      // CORRETTO: Gestisce il formato ResponseFormatter
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      // Fallback per vecchio formato
      return response.data || [];
    },
    staleTime: 30 * 1000
  });

  const toggleExpanded = (enumId: string) => {
    const newExpanded = new Set(expandedEnums);
    if (newExpanded.has(enumId)) {
      newExpanded.delete(enumId);
    } else {
      newExpanded.add(enumId);
    }
    setExpandedEnums(newExpanded);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      system: 'bg-blue-100 text-blue-800',
      ai: 'bg-purple-100 text-purple-800',
      payments: 'bg-green-100 text-green-800',
      notifications: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Assicuriamo che enums sia sempre un array
  const enums = Array.isArray(enumsResponse) ? enumsResponse : [];
  
  console.log('Final enums:', enums);

  // Group enums by category
  const groupedEnums = enums?.reduce((acc, enumItem) => {
    if (!acc[enumItem.category]) acc[enumItem.category] = [];
    acc[enumItem.category].push(enumItem);
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" style={{ width: '24px', height: '24px' }} />
          <h1 className="text-2xl font-bold text-gray-900">Gestione Enum di Sistema</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestione Enum di Sistema</h1>
        </div>
        
        <Button
          onClick={() => setShowCreateEnum(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" style={{ width: '16px', height: '16px' }} />
          Nuovo Enum
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" style={{ width: '20px', height: '20px' }} />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Gestione Centralizzata</h3>
            <p className="text-sm text-blue-700 mt-1">
              Questa sezione permette di configurare tutti i valori enum utilizzati nel sistema (stati richieste, priorità, ecc.) 
              con colori e icone personalizzate. Le modifiche si riflettono immediatamente nell'interfaccia.
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Enums */}
      <div className="space-y-6">
        {Object.entries(groupedEnums).map(([category, categoryEnums]) => (
          <div key={category} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {category === 'system' ? 'Sistema' : 
                     category === 'ai' ? 'Intelligenza Artificiale' :
                     category === 'payments' ? 'Pagamenti' :
                     category === 'notifications' ? 'Notifiche' : category}
                  </h2>
                  <Badge className={getCategoryBadgeColor(category)}>
                    {categoryEnums.length} enum
                  </Badge>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {categoryEnums.map((enumItem: SystemEnum) => (
                <EnumCard 
                  key={enumItem.id}
                  enumItem={enumItem}
                  isExpanded={expandedEnums.has(enumItem.id)}
                  onToggleExpanded={() => toggleExpanded(enumItem.id)}
                  onCreateValue={() => setShowCreateValue(enumItem.id)}
                  onEditValue={setEditingValue}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Enum Modal */}
      {showCreateEnum && (
        <CreateEnumModal 
          onClose={() => setShowCreateEnum(false)}
          onSuccess={() => {
            setShowCreateEnum(false);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/system-enums'] });
          }}
        />
      )}

      {/* Create Value Modal */}
      {showCreateValue && (
        <CreateValueModal 
          enumId={showCreateValue}
          onClose={() => setShowCreateValue(null)}
          onSuccess={() => {
            setShowCreateValue(null);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/system-enums'] });
          }}
        />
      )}

      {/* Edit Value Modal */}
      {editingValue && (
        <EditValueModal 
          value={editingValue}
          onClose={() => setEditingValue(null)}
          onSuccess={() => {
            setEditingValue(null);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/system-enums'] });
          }}
        />
      )}
    </div>
  );
}

// Componente per singola Card Enum
function EnumCard({ enumItem, isExpanded, onToggleExpanded, onCreateValue, onEditValue }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onToggleExpanded}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" style={{ width: '20px', height: '20px' }} />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" style={{ width: '20px', height: '20px' }} />
            )}
          </button>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">{enumItem.name}</h3>
            {enumItem.description && (
              <p className="text-sm text-gray-500 mt-1">{enumItem.description}</p>
            )}
          </div>
          
          <Badge className={enumItem.isEditable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {enumItem.isEditable ? 'Modificabile' : 'Sistema'}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Badge className="bg-gray-100 text-gray-800">
            {enumItem.EnumValue?.length || 0} valori
          </Badge>
          
          {enumItem.isEditable && (
            <Button
              onClick={onCreateValue}
              variant="outline"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" style={{ width: '16px', height: '16px' }} />
              Aggiungi
            </Button>
          )}
        </div>
      </div>

      {isExpanded && enumItem.EnumValue && (
        <div className="mt-4 ml-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enumItem.EnumValue
              .sort((a, b) => a.order - b.order)
              .map((value: EnumValue) => (
                <ValueCard 
                  key={value.id} 
                  value={value} 
                  isEditable={enumItem.isEditable}
                  onEdit={() => onEditValue(value)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente per singola Value Card
function ValueCard({ value, isEditable, onEdit }) {
  const deleteValueMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/system-enums/values/${id}`),
    onSuccess: () => {
      toast.success('Valore eliminato');
      // Refresh will be handled by parent
    },
    onError: () => toast.error('Errore durante l\'eliminazione')
  });

  return (
    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <Badge 
          style={{
            backgroundColor: value.bgColor || value.color,
            color: value.textColor
          }}
          className="text-xs"
        >
          {value.label}
        </Badge>
        {value.isDefault && (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Default</Badge>
        )}
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div><strong>Valore:</strong> {value.value}</div>
        {value.icon && <div><strong>Icona:</strong> {value.icon}</div>}
        {value.description && <div><strong>Desc:</strong> {value.description}</div>}
      </div>

      {isEditable && (
        <div className="flex justify-end space-x-1 mt-2">
          <button 
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <PencilIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
          </button>
          <button 
            onClick={() => deleteValueMutation.mutate(value.id)}
            disabled={value.isDefault || deleteValueMutation.isPending}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}
    </div>
  );
}

// Modal per creare nuovo enum
function CreateEnumModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'system'
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/system-enums', data),
    onSuccess: () => {
      toast.success('Enum creato con successo');
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Crea Nuovo Enum</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nome Enum"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
            placeholder="CUSTOM_STATUS"
            required
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione dell'enum..."
          />
          
          <Select
            label="Categoria"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            options={[
              { value: 'system', label: 'Sistema' },
              { value: 'ai', label: 'AI' },
              { value: 'payments', label: 'Pagamenti' },
              { value: 'notifications', label: 'Notifiche' },
              { value: 'custom', label: 'Personalizzato' }
            ]}
          />
          
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
              {createMutation.isPending ? 'Creazione...' : 'Crea Enum'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal per creare nuovo valore
function CreateValueModal({ enumId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    enumId,
    value: '',
    label: '',
    description: '',
    color: '#3B82F6',
    textColor: '#FFFFFF',
    bgColor: '#DBEAFE',
    icon: '',
    order: 0,
    isDefault: false
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/system-enums/values', data),
    onSuccess: () => {
      toast.success('Valore creato con successo');
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
          <h2 className="text-lg font-semibold">Crea Nuovo Valore</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valore (Chiave)"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value.toUpperCase()})}
              placeholder="NEW_STATUS"
              required
            />
            
            <Input
              label="Etichetta"
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              placeholder="Nuovo Stato"
              required
            />
          </div>
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrizione del valore..."
          />
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colore Principale
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full h-10 rounded border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colore Testo
              </label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                className="w-full h-10 rounded border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colore Sfondo
              </label>
              <input
                type="color"
                value={formData.bgColor}
                onChange={(e) => setFormData({...formData, bgColor: e.target.value})}
                className="w-full h-10 rounded border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Icona"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              options={[
                { value: '', label: 'Nessuna icona' },
                ...ICON_OPTIONS.map(icon => ({ value: icon, label: icon }))
              ]}
            />
            
            <Input
              label="Ordine"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Imposta come valore predefinito
            </label>
          </div>
          
          {/* Preview */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Anteprima:</h4>
            <Badge 
              style={{
                backgroundColor: formData.bgColor,
                color: formData.textColor,
                borderColor: formData.color
              }}
              className="border"
            >
              {formData.label || 'Etichetta'}
            </Badge>
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
              {createMutation.isPending ? 'Creazione...' : 'Crea Valore'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal per modificare valore esistente
function EditValueModal({ value, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    label: value.label,
    description: value.description || '',
    color: value.color,
    textColor: value.textColor,
    bgColor: value.bgColor || value.color,
    icon: value.icon || '',
    order: value.order,
    isDefault: value.isDefault,
    isActive: value.isActive
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.put(`/admin/system-enums/values/${value.id}`, data),
    onSuccess: () => {
      toast.success('Valore aggiornato con successo');
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
          <h2 className="text-lg font-semibold">Modifica Valore: {value.value}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Etichetta"
            value={formData.label}
            onChange={(e) => setFormData({...formData, label: e.target.value})}
            required
          />
          
          <TextArea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colore Principale
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full h-10 rounded border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colore Testo
              </label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                className="w-full h-10 rounded border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colore Sfondo
              </label>
              <input
                type="color"
                value={formData.bgColor}
                onChange={(e) => setFormData({...formData, bgColor: e.target.value})}
                className="w-full h-10 rounded border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Icona"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              options={[
                { value: '', label: 'Nessuna icona' },
                ...ICON_OPTIONS.map(icon => ({ value: icon, label: icon }))
              ]}
            />
            
            <Input
              label="Ordine"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Valore predefinito
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Attivo
              </label>
            </div>
          </div>
          
          {/* Preview */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Anteprima:</h4>
            <Badge 
              style={{
                backgroundColor: formData.bgColor,
                color: formData.textColor,
                borderColor: formData.color
              }}
              className="border"
            >
              {formData.label}
            </Badge>
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
              disabled={updateMutation.isPending}
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
