import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description?: string;
  isActive: boolean;
  isEditable: boolean;
  updatedAt: string;
}

interface SettingCardProps {
  setting: SystemSetting;
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onValueChange: (value: string) => void;
  renderValue: (setting: SystemSetting) => React.ReactNode;
  renderEditField: (value: string, onChange: (value: string) => void, type: string) => React.ReactNode;
}

export default function SettingCard({
  setting,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onValueChange,
  renderValue,
  renderEditField
}: SettingCardProps) {
  return (
    <div className="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <div className="p-4">
        {/* Header compatto */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-gray-600">
                {setting.key}
              </span>
              {!setting.isEditable && (
                <LockClosedIcon className="h-3 w-3 text-gray-400" title="Impostazione di sistema" />
              )}
              {setting.isActive ? (
                <span className="w-2 h-2 bg-green-500 rounded-full" title="Attiva" />
              ) : (
                <span className="w-2 h-2 bg-gray-300 rounded-full" title="Inattiva" />
              )}
            </div>
            
            {/* Descrizione */}
            {setting.description && !isEditing && (
              <p className="text-xs text-gray-500 mb-2">
                {setting.description}
              </p>
            )}
          </div>

          {/* Azioni */}
          {!isEditing && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {setting.isEditable && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Modifica"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Elimina"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Valore */}
        <div className="mt-2">
          {isEditing ? (
            <div className="space-y-3">
              {renderEditField(editValue, onValueChange, setting.type)}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={onCancel}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={onSave}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salva
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              {renderValue(setting)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
