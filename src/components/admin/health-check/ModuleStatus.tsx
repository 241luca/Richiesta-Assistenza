/**
 * Module Status Component
 * Modal per visualizzare i dettagli di un singolo modulo
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
                {module.displayName || module.module}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Last checked: {new Date(module.timestamp).toLocaleString()}
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
                  {module.score}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    module.score >= 80 ? 'bg-green-500' :
                    module.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${module.score}%` }}
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
                  {module.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Execution time: {module.executionTime}ms
              </div>
            </div>
          </div>

          {/* Checks */}
          {module.checks && module.checks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Checks</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {module.checks.map((check: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="mt-0.5">
                          {getCheckStatusIcon(check.status)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{check.description}</p>
                          <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                          {check.value !== undefined && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Value: </span>
                              <span className="font-medium">{check.value}</span>
                              {check.threshold && (
                                <>
                                  <span className="text-gray-500"> / Threshold: </span>
                                  <span className="font-medium">{check.threshold}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {check.severity && getSeverityBadge(check.severity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {module.metrics && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Metrics</h3>
              {Object.keys(module.metrics).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(module.metrics).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {value !== null && value !== undefined 
                          ? (typeof value === 'number' ? value.toLocaleString() : String(value))
                          : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  <InformationCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Nessuna metrica disponibile</p>
                  <p className="text-sm mt-1">Il servizio potrebbe non essere configurato o attivo</p>
                </div>
              )}
            </div>
          )}

          {/* Errors and Warnings */}
          <div className="grid grid-cols-2 gap-6">
            {/* Errors */}
            {module.errors && module.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Errors ({module.errors.length})
                </h3>
                <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <ul className="space-y-2">
                    {module.errors.map((error: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-red-800">{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

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
          </div>

          {/* Recommendations */}
          {module.recommendations && module.recommendations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">
                Recommendations
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
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
