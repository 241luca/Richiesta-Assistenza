/**
 * Module Detail Component - VERSIONE COMPLETA CON ANALISI DETTAGLIATA
 * Mostra tutti i dettagli di un modulo health check con analisi completa dei test
 */

import React from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ModuleDetailProps {
  module: any;
  onClose: () => void;
}

// Helper per formattare date
const formatDate = (date: any): string => {
  if (!date) return 'Never';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return 'Never';
  }
};

// Helper per formattare metriche
const formatMetricValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

// Helper per ottenere icona check
const getCheckIcon = (status: string) => {
  switch (status) {
    case 'pass':
    case 'healthy':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'warn':
    case 'warning':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    case 'fail':
    case 'error':
    case 'critical':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-400" />;
  }
};

// Helper per ottenere colore severity
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export default function ModuleDetail({ module, onClose }: ModuleDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Conta i checks
  const checkStats = React.useMemo(() => {
    if (!Array.isArray(module.checks)) {
      return { total: 0, passed: 0, warnings: 0, errors: 0 };
    }
    
    return {
      total: module.checks.length,
      passed: module.checks.filter((c: any) => 
        c.status === 'pass' || c.status === 'healthy'
      ).length,
      warnings: module.checks.filter((c: any) => 
        c.status === 'warn' || c.status === 'warning'
      ).length,
      errors: module.checks.filter((c: any) => 
        c.status === 'fail' || c.status === 'error' || c.status === 'critical'
      ).length
    };
  }, [module.checks]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {module.displayName || module.module}
              <span className={`text-sm px-2 py-1 rounded-full ${
                module.status === 'healthy' ? 'bg-green-100 text-green-700' :
                module.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {module.status}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Last checked: {formatDate(module.timestamp)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Score Overview */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Health Score</div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">
                    <span className={module.score >= 80 ? 'text-green-600' : 
                                   module.score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                      {module.score}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          module.score >= 80 ? 'bg-green-500' :
                          module.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${module.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div className={`text-xl font-semibold capitalize ${getStatusColor(module.status)}`}>
                  {module.status}
                </div>
                <div className="text-xs text-gray-500">
                  Execution time: {module.executionTime}ms
                </div>
              </div>
            </div>
          </div>

          {/* Checks Analysis */}
          {checkStats.total > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Checks Analysis ({checkStats.total} total)
              </h3>
              
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Passed</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {checkStats.passed}
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">Warnings</span>
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 mt-1">
                    {checkStats.warnings}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-700">Failed</span>
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {checkStats.errors}
                  </div>
                </div>
              </div>

              {/* Detailed Checks List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Detailed Check Results:</h4>
                {module.checks.map((check: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      {getCheckIcon(check.status)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {check.description || `Check ${index + 1}`}
                            </div>
                            {check.message && (
                              <div className="text-sm text-gray-600 mt-1">
                                {check.message}
                              </div>
                            )}
                          </div>
                          {check.severity && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(check.severity)}`}>
                              {check.severity}
                            </span>
                          )}
                        </div>
                        {check.details && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            {typeof check.details === 'object' ? 
                              JSON.stringify(check.details, null, 2) : 
                              check.details
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {module.metrics && Object.keys(module.metrics).length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(module.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                      {formatMetricValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {module.warnings && module.warnings.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-yellow-600">
                Warnings ({module.warnings.length})
              </h3>
              <ul className="space-y-2">
                {module.warnings.map((warning: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors */}
          {module.errors && module.errors.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">
                Errors ({module.errors.length})
              </h3>
              <ul className="space-y-2">
                {module.errors.map((error: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {module.recommendations && module.recommendations.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-blue-600">
                Recommendations
              </h3>
              <ul className="space-y-2">
                {module.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details className="px-6 py-4 bg-gray-50">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
              View Raw Data (Debug)
            </summary>
            <pre className="mt-2 text-xs bg-white p-4 rounded overflow-x-auto">
              {JSON.stringify(module, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
