/**
 * Alerts Panel Component
 * Pannello per visualizzare gli alert del sistema
 * FIX: Corrette le key per evitare warning React
 */

import React from 'react';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Alert {
  module: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = React.useState<string[]>([]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  // Crea un ID univoco per ogni alert basato sul contenuto
  const getAlertId = (alert: Alert, originalIndex: number) => {
    return `${alert.module}-${alert.severity}-${alert.timestamp}-${originalIndex}`;
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const visibleAlerts = alerts
    .map((alert, index) => ({ 
      ...alert, 
      id: getAlertId(alert, index),
      originalIndex: index 
    }))
    .filter(alert => !dismissedAlerts.includes(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  // Sort alerts by severity (critical first)
  const sortedAlerts = [...visibleAlerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return (severityOrder[a.severity as keyof typeof severityOrder] || 2) - 
           (severityOrder[b.severity as keyof typeof severityOrder] || 2);
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          System Alerts ({sortedAlerts.length})
        </h2>
        {sortedAlerts.length > 3 && (
          <button
            onClick={() => setDismissedAlerts(
              alerts.map((alert, i) => getAlertId(alert, i))
            )}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Dismiss All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sortedAlerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${getSeverityTextColor(alert.severity)}`}>
                    {alert.module.toUpperCase()} - {alert.severity.toUpperCase()}
                  </p>
                  <p className={`mt-1 text-sm ${getSeverityTextColor(alert.severity)}`}>
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="ml-4 flex-shrink-0 p-1 rounded hover:bg-white/50"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedAlerts.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            And {sortedAlerts.length - 5} more alerts...
          </p>
        </div>
      )}

      {/* Alert Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-600">
              {sortedAlerts.filter(a => a.severity === 'critical').length}
            </p>
            <p className="text-sm text-gray-600">Critical</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {sortedAlerts.filter(a => a.severity === 'warning').length}
            </p>
            <p className="text-sm text-gray-600">Warnings</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {sortedAlerts.filter(a => a.severity === 'info').length}
            </p>
            <p className="text-sm text-gray-600">Info</p>
          </div>
        </div>
      </div>
    </div>
  );
}
