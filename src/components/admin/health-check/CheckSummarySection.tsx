/**
 * Check Summary Section Component
 * Sezione con box cliccabili per vedere i dettagli dei check
 * FIX: Aggiunto key univoche per evitare warning React
 */

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface CheckSummarySectionProps {
  stats: {
    totalChecks: number;
    passedChecks: number;
    warningChecks: number;
    failedChecks: number;
    checksDetails: any[];
  };
}

export default function CheckSummarySection({ stats }: CheckSummarySectionProps) {
  const [expandedBox, setExpandedBox] = useState<string | null>(null);

  const toggleBox = (boxType: string) => {
    setExpandedBox(expandedBox === boxType ? null : boxType);
  };

  // Filtra i check per tipo
  const passedList = stats.checksDetails.filter(c => 
    c.status === 'pass' || c.status === 'healthy'
  );
  const warningList = stats.checksDetails.filter(c => 
    c.status === 'warn' || c.status === 'warning'
  );
  const failedList = stats.checksDetails.filter(c => 
    c.status === 'fail' || c.status === 'error' || c.status === 'critical'
  );

  // Funzione helper per creare una key univoca
  const getUniqueKey = (check: any, index: number) => {
    return `${check.module}-${check.description}-${index}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Test Eseguiti</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Box Totale Check */}
        <div 
          className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-gray-300"
          onClick={() => toggleBox('total')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Test Totali</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{stats.totalChecks}</span>
              {expandedBox === 'total' ? 
                <ChevronUpIcon className="h-4 w-4 text-gray-600" /> : 
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              }
            </div>
          </div>
        </div>
        
        {/* Box Passati */}
        <div 
          className="bg-green-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-300"
          onClick={() => toggleBox('passed')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Passati</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">{stats.passedChecks}</span>
              {expandedBox === 'passed' ? 
                <ChevronUpIcon className="h-4 w-4 text-green-600" /> : 
                <ChevronDownIcon className="h-4 w-4 text-green-600" />
              }
            </div>
          </div>
        </div>
        
        {/* Box Warning */}
        <div 
          className="bg-yellow-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-yellow-300"
          onClick={() => toggleBox('warning')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-yellow-600">{stats.warningChecks}</span>
              {expandedBox === 'warning' ? 
                <ChevronUpIcon className="h-4 w-4 text-yellow-600" /> : 
                <ChevronDownIcon className="h-4 w-4 text-yellow-600" />
              }
            </div>
          </div>
        </div>
        
        {/* Box Falliti */}
        <div 
          className="bg-red-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-red-300"
          onClick={() => toggleBox('failed')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Falliti</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-600">{stats.failedChecks}</span>
              {expandedBox === 'failed' ? 
                <ChevronUpIcon className="h-4 w-4 text-red-600" /> : 
                <ChevronDownIcon className="h-4 w-4 text-red-600" />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Lista espandibile per Totale */}
      {expandedBox === 'total' && stats.totalChecks > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Tutti i Test Eseguiti:</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stats.checksDetails.map((check: any, idx: number) => (
              <div key={getUniqueKey(check, idx)} className="flex items-start gap-2 p-2 bg-white rounded text-sm">
                {(check.status === 'pass' || check.status === 'healthy') && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
                {(check.status === 'warn' || check.status === 'warning') && (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                )}
                {(check.status === 'fail' || check.status === 'error' || check.status === 'critical') && (
                  <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    <span className="text-blue-600">{check.moduleName}</span>: {check.description}
                  </div>
                  {check.message && (
                    <div className="text-gray-600 text-xs mt-0.5">{check.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista espandibile per Passati */}
      {expandedBox === 'passed' && passedList.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-semibold text-green-700 mb-3">Test Superati con Successo:</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {passedList.map((check: any, idx: number) => (
              <div key={`passed-${getUniqueKey(check, idx)}`} className="flex items-start gap-2 p-2 bg-white rounded text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    <span className="text-blue-600">{check.moduleName}</span>: {check.description}
                  </div>
                  {check.message && (
                    <div className="text-green-600 text-xs mt-0.5">{check.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista espandibile per Warning */}
      {expandedBox === 'warning' && warningList.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-700 mb-3">Test con Avvisi:</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {warningList.map((check: any, idx: number) => (
              <div key={`warning-${getUniqueKey(check, idx)}`} className="flex items-start gap-2 p-2 bg-white rounded text-sm">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    <span className="text-blue-600">{check.moduleName}</span>: {check.description}
                  </div>
                  {check.message && (
                    <div className="text-yellow-700 text-xs mt-0.5">⚠️ {check.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista espandibile per Falliti */}
      {expandedBox === 'failed' && failedList.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h4 className="text-sm font-semibold text-red-700 mb-3">Test Falliti:</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {failedList.map((check: any, idx: number) => (
              <div key={`failed-${getUniqueKey(check, idx)}`} className="flex items-start gap-2 p-2 bg-white rounded text-sm">
                <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    <span className="text-blue-600">{check.moduleName}</span>: {check.description}
                  </div>
                  {check.message && (
                    <div className="text-red-700 text-xs mt-0.5">❌ {check.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messaggio se non ci sono check */}
      {stats.totalChecks === 0 && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center text-gray-600">
          Nessun test eseguito. Clicca su "Esegui Tutti i Test" per avviare i controlli.
        </div>
      )}

      {/* Messaggio se tutti passati */}
      {stats.totalChecks > 0 && stats.warningChecks === 0 && stats.failedChecks === 0 && !expandedBox && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            <span className="text-green-700 font-medium">
              Perfetto! Tutti i {stats.totalChecks} test sono stati superati con successo.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
