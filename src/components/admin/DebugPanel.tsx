import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { debugLogger, DebugLogEntry, WorkerDebugLog } from '@/utils/debugLogger';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DebugLogEntry[];
  summary: any;
}

/**
 * 🔍 Pannello DEBUG in tempo reale
 * Mostra passo dopo passo cosa fa il worker
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  logs,
  summary,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      START: 'bg-blue-50 border-blue-200',
      PROGRESS: 'bg-yellow-50 border-yellow-200',
      SUCCESS: 'bg-green-50 border-green-200',
      ERROR: 'bg-red-50 border-red-200',
      INFO: 'bg-gray-50 border-gray-200',
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      START: '▶️',
      PROGRESS: '⏳',
      SUCCESS: '✅',
      ERROR: '❌',
      INFO: 'ℹ️',
    };
    return icons[status] || '📝';
  };

  const getStatusTextColor = (status: string): string => {
    const colors: Record<string, string> = {
      START: 'text-blue-700',
      PROGRESS: 'text-yellow-700',
      SUCCESS: 'text-green-700',
      ERROR: 'text-red-700',
      INFO: 'text-gray-700',
    };
    return colors[status] || 'text-gray-700';
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black bg-opacity-50">
      <div className="min-h-screen px-4 pt-4 pb-20">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔍</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Debug Panel</h2>
                <p className="text-sm text-gray-600">
                  Visualizza tutti i dettagli dell'esecuzione ({logs.length} step)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Riepilogo */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Riepilogo Esecuzione</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-medium">STEP TOTALI</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {summary.totalSteps}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-xs text-gray-600 font-medium">SUCCESSI</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {summary.successCount}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="text-xs text-gray-600 font-medium">ERRORI</div>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  {summary.errorCount}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-xs text-gray-600 font-medium">CHUNK CREATI</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  {summary.chunksCreated}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="text-xs text-gray-600 font-medium">EMBEDDINGS</div>
                <div className="text-3xl font-bold text-orange-600 mt-2">
                  {summary.embeddingsCreated}
                </div>
              </div>
            </div>
          </div>

          {/* Lista Step */}
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nessuno step registrato</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.step}
                  className={`border rounded-lg transition ${getStatusColor(log.status)}`}
                >
                  {/* Header Step */}
                  <button
                    onClick={() => toggleStep(log.step)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-lg">{getStatusIcon(log.status)}</div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${getStatusTextColor(log.status)}`}>
                            Step {log.step}
                          </span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            {log.action}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                          {log.duration && ` • ${log.duration}ms`}
                        </div>
                      </div>
                    </div>
                    {expandedSteps.has(log.step) ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {/* Dettagli Step */}
                  {expandedSteps.has(log.step) && (
                    <div className="px-4 pb-3 pt-0 border-t border-gray-200">
                      <div className="bg-white rounded-lg p-4 mt-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          📋 Dettagli
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-32">
                                {key}:
                              </span>
                              <span className="text-sm text-gray-800 flex-1 break-words">
                                {typeof value === 'object' ? (
                                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  String(value)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer con pulsanti download */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {logs.length} step registrati
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => debugLogger.downloadLog('json')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Scarica JSON</span>
              </button>
              <button
                onClick={() => debugLogger.downloadLog('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Scarica CSV</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Chiudi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
