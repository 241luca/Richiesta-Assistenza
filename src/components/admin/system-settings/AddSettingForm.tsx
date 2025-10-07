import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';

interface AddSettingFormProps {
  show: boolean;
  setting: {
    key: string;
    value: string;
    type: string;
    description: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  renderField: (value: string, onChange: (value: string) => void, type: string) => React.ReactNode;
}

export default function AddSettingForm({
  show,
  setting,
  onChange,
  onSubmit,
  onCancel,
  renderField
}: AddSettingFormProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Aggiungi Nuova Impostazione
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Chiave */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chiave Univoca
            </label>
            <Input
              value={setting.key}
              onChange={(e) => onChange('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="es. logo_url, email_supporto"
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Usa solo lettere minuscole e underscore
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo di Campo
            </label>
            <select
              value={setting.type}
              onChange={(e) => onChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="string">Testo Breve</option>
              <option value="text">Testo Lungo</option>
              <option value="number">Numero</option>
              <option value="boolean">Si/No</option>
              <option value="email">Email</option>
              <option value="url">URL/Link</option>
              <option value="color">Colore</option>
            </select>
          </div>

          {/* Valore */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valore
            </label>
            {renderField(
              setting.value,
              (value) => onChange('value', value),
              setting.type
            )}
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione (Opzionale)
            </label>
            <TextArea
              value={setting.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Breve descrizione dell'impostazione..."
              rows={2}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onSubmit}
            disabled={!setting.key || !setting.value}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Crea Impostazione
          </button>
        </div>
      </div>
    </div>
  );
}
