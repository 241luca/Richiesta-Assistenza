// src/components/admin/audit/AuditAlerts.tsx
import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  BellIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Alert {
  id: string;
  name: string;
  description?: string;
  condition: any;
  severity: string;
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  notifyEmails?: string[];
  notifyWebhook?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  alerts: Alert[];
  loading: boolean;
}

export default function AuditAlerts({ alerts, loading }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Assicuriamoci che alerts sia sempre un array
  const alertsList = Array.isArray(alerts) ? alerts : (alerts?.data || []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-100';
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-50';
      case 'INFO':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Alert Configurati
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Configura alert automatici per eventi critici del sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuovo Alert
          </button>
        </div>

        {/* Lista Alert */}
        {alertsList.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nessun alert configurato
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando il tuo primo alert per monitorare eventi critici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertsList.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <h4 className="text-lg font-medium text-gray-900">
                        {alert.name}
                      </h4>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {alert.isActive ? (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Attivo
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disattivo
                        </span>
                      )}
                    </div>
                    
                    {alert.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {alert.description}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Condizioni:</span>
                        <div className="font-medium text-gray-900">
                          {Object.entries(alert.condition).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Trigger Count:</span>
                        <div className="font-medium text-gray-900">
                          {alert.triggerCount}
                        </div>
                      </div>
                      
                      {alert.lastTriggered && (
                        <div>
                          <span className="text-gray-500">Ultimo Trigger:</span>
                          <div className="font-medium text-gray-900">
                            {format(new Date(alert.lastTriggered), 'dd/MM/yyyy HH:mm', { locale: it })}
                          </div>
                        </div>
                      )}
                      
                      {alert.notifyEmails && alert.notifyEmails.length > 0 && (
                        <div>
                          <span className="text-gray-500">Email Notifica:</span>
                          <div className="font-medium text-gray-900 text-xs">
                            {alert.notifyEmails.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button className="text-gray-400 hover:text-gray-500">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-red-500">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Come funzionano gli Alert
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Gli alert monitorano continuamente i log di audit</li>
                <li>Quando le condizioni sono soddisfatte, viene inviata una notifica</li>
                <li>Puoi configurare notifiche via email o webhook</li>
                <li>Gli alert aiutano a identificare rapidamente problemi di sicurezza o anomalie</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
