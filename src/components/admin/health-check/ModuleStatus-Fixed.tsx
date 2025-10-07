/**
 * Module Status Component - FIXED VERSION
 * Modal per visualizzare i dettagli di un singolo modulo
 * FIX: Gestione corretta di date e oggetti
 */

import React from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ModuleStatusProps {
  module: any;
  onClose: () => void;
}

// Funzione helper per formattare valori
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') {
    // Se è un array, mostra il numero di elementi
    if (Array.isArray(value)) {
      return `${value.length} items`;
    }
    // Se è un oggetto, prova a convertirlo in stringa leggibile
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return 'Complex data';
    }
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
};

// Funzione helper per formattare date
const formatDate = (date: any): string => {
  if (!date) return 'Never';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return 'Invalid Date';
  }
};

export default function ModuleStatus({ module, onClose }: ModuleStatusProps) {
  if (!module) return null;

  const getCheckStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warn':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'skip':
        return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {severity}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {module.displayName || module.module || 'Module Details'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Last checked: {formatDate(module.timestamp)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Score and Status */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Health Score</span>
                <span className={`text-3xl font-bold ${
                  module.score >= 80 ? 'text-green-600' :
                  module.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {module.score || 0}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    module.score >= 80 ? 'bg-green-500' :
                    module.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${module.score || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-lg font-semibold capitalize ${
                  module.status === 'healthy' ? 'text-green-600' :
                  module.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {module.status || 'Unknown'}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Execution time: {module.executionTime || 0}ms
              </div>
            </div>
          </div>

          {/* Metrics - Fixed rendering */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Metrics</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">SCORE</td>
                    <td className="py-2 px-4 text-sm text-gray-500">{module.score || 0}</td>
                  </tr>
                  {module.checks && (
                    <tr>
                      <td className="py-2 px-4 text-sm font-medium text-gray-900">CHECKS</td>
                      <td className="py-2 px-4 text-sm text-gray-500">
                        {Array.isArray(module.checks) ? `${module.checks.length} checks performed` : formatValue(module.checks)}
                      </td>
                    </tr>
                  )}
                  {module.errors && module.errors.length > 0 && (
                    <tr>
                      <td className="py-2 px-4 text-sm font-medium text-gray-900">ERRORS</td>
                      <td className="py-2 px-4 text-sm text-red-600">{module.errors.length}</td>
                    </tr>
                  )}
                  {module.warnings && module.warnings.length > 0 && (
                    <tr>
                      <td className="py-2 px-4 text-sm font-medium text-gray-900">WARNINGS</td>
                      <td className="py-2 px-4 text-sm text-yellow-600">{module.warnings.length}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">MODULE</td>
                    <td className="py-2 px-4 text-sm text-gray-500">{module.module || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">STATUS</td>
                    <td className="py-2 px-4 text-sm text-gray-500">{module.status || 'Unknown'}</td>
                  </tr>
                  {module.metrics && typeof module.metrics === 'object' && (
                    <tr>
                      <td className="py-2 px-4 text-sm font-medium text-gray-900">METRICS</td>
                      <td className="py-2 px-4 text-sm text-gray-500">
                        {formatValue(module.metrics)}
                      </td>
                    </tr>
                  )}
                  {module.displayName && (
                    <tr>
                      <td className="py-2 px-4 text-sm font-medium text-gray-900">DISPLAYNAME</td>
                      <td className="py-2 px-4 text-sm text-gray-500">{module.displayName}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">TIMESTAMP</td>
                    <td className="py-2 px-4 text-sm text-gray-500">{formatDate(module.timestamp)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">EXECUTIONTIME</td>
                    <td className="py-2 px-4 text-sm text-gray-500">{module.executionTime || 0}ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Errors and Warnings Details */}
          <div className="grid grid-cols-2 gap-6">
            {/* Warnings */}
            {module.warnings && module.warnings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-600 mb-2">
                  Warnings ({module.warnings.length})
                </h3>
                <div className="bg-yellow-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <ul className="space-y-2">
                    {module.warnings.map((warning: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-yellow-800">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {module.recommendations && module.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  Recommendations
                </h3>
                <div className="bg-blue-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <ul className="space-y-2">
                    {module.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
