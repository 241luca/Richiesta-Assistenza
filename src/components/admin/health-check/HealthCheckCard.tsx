/**
 * Health Check Card Component - VERSIONE MIGLIORATA V2
 * Card con visualizzazione chiara e dettagliata dei check
 */

import React, { useState, useMemo } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import ModuleDescriptions from './ModuleDescriptions';

// Funzione helper per formattare le date
const formatDate = (date: any): string => {
  if (!date) return 'Mai';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Mai';
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Mai';
  }
};

interface HealthCheckCardProps {
  module: any;
  onRefresh: () => void;
  onClick: () => void;
  isRefreshing: boolean;
}

export default function HealthCheckCard({ 
  module, 
  onRefresh, 
  onClick, 
  isRefreshing 
}: HealthCheckCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [expandDetails, setExpandDetails] = useState(false);

  // Calcola statistiche dei check
  const checkStats = useMemo(() => {
    if (!module.checks || !Array.isArray(module.checks)) {
      return { 
        passed: 0, 
        warnings: 0, 
        failed: 0, 
        total: 0,
        passedList: [],
        warningList: [],
        failedList: []
      };
    }
    
    const passedList: any[] = [];
    const warningList: any[] = [];
    const failedList: any[] = [];
    
    module.checks.forEach((check: any) => {
      if (check.status === 'pass' || check.status === 'healthy') {
        passedList.push(check);
      } else if (check.status === 'warn' || check.status === 'warning') {
        warningList.push(check);
      } else if (check.status === 'fail' || check.status === 'error' || check.status === 'critical') {
        failedList.push(check);
      }
    });
    
    return {
      passed: passedList.length,
      warnings: warningList.length,
      failed: failedList.length,
      total: module.checks.length,
      passedList,
      warningList,
      failedList
    };
  }, [module.checks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-400 hover:border-green-500';
      case 'warning':
        return 'bg-yellow-50 border-yellow-400 hover:border-yellow-500';
      case 'critical':
        return 'bg-red-50 border-red-400 hover:border-red-500';
      default:
        return 'bg-gray-50 border-gray-400 hover:border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCheckIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />;
      case 'warn':
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
      case 'fail':
      case 'error':
      case 'critical':
        return <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    }
  };

  return (
    <>
      <div 
        className={`rounded-lg border-2 p-4 transition-all hover:shadow-xl cursor-pointer relative ${getStatusColor(module.status)}`}
        onClick={onClick}
      >
        {/* Header con nome modulo e icone - FIX SOVRAPPOSIZIONE */}
        <div className="flex items-start justify-between mb-3 gap-2">
          {/* Titolo con truncate per evitare overflow */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate pr-2" title={module.displayName || module.module}>
              {module.displayName || module.module}
            </h3>
          </div>
          
          {/* Container icone con spazio garantito */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Icona Info */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(true);
              }}
              className="p-1.5 rounded-full hover:bg-gray-200 hover:bg-opacity-70 transition-colors"
              title="Informazioni modulo"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />
            </button>
            
            {/* Icona Refresh */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={isRefreshing}
              className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-60 disabled:opacity-50 transition-colors"
              title="Aggiorna test modulo"
            >
              <ArrowPathIcon 
                className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* Status principale con score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(module.status)}
            <span className="text-sm font-medium capitalize">{module.status}</span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              module.score >= 80 ? 'text-green-600' :
              module.score >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {module.score}%
            </div>
            <div className="text-xs text-gray-500">Health Score</div>
          </div>
        </div>

        {/* Barra progressiva dello score */}
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                module.score >= 80 ? 'bg-green-500' :
                module.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${module.score}%` }}
            />
          </div>
        </div>

        {/* Contatori Check SEMPRE VISIBILI */}
        <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-2">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Check Eseguiti: {checkStats.total}
          </div>
          
          {/* Griglia con icone e numeri */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-green-50 rounded">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mb-1" />
              <span className="text-lg font-bold text-green-600">{checkStats.passed}</span>
              <span className="text-xs text-gray-600">Passati</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-yellow-50 rounded">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mb-1" />
              <span className="text-lg font-bold text-yellow-600">{checkStats.warnings}</span>
              <span className="text-xs text-gray-600">Warning</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-red-50 rounded">
              <XCircleIcon className="h-5 w-5 text-red-500 mb-1" />
              <span className="text-lg font-bold text-red-600">{checkStats.failed}</span>
              <span className="text-xs text-gray-600">Falliti</span>
            </div>
          </div>
        </div>

        {/* Problemi principali SEMPRE VISIBILI se ci sono */}
        {(checkStats.warnings > 0 || checkStats.failed > 0) && (
          <div className="bg-white bg-opacity-70 rounded-lg p-2 mb-2">
            <div className="text-xs font-semibold text-gray-700 mb-1">Problemi Rilevati:</div>
            
            {/* Mostra primo warning */}
            {checkStats.warningList.length > 0 && (
              <div className="flex items-start gap-1 text-xs mb-1">
                <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{checkStats.warningList[0].description}</span>
                  {checkStats.warningList[0].message && (
                    <span className="text-gray-600 ml-1">- {checkStats.warningList[0].message}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Mostra primo errore */}
            {checkStats.failedList.length > 0 && (
              <div className="flex items-start gap-1 text-xs">
                <XCircleIcon className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{checkStats.failedList[0].description}</span>
                  {checkStats.failedList[0].message && (
                    <span className="text-gray-600 ml-1">- {checkStats.failedList[0].message}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Indica se ci sono altri problemi */}
            {(checkStats.warnings + checkStats.failed) > 2 && (
              <div className="text-xs text-gray-500 mt-1">
                + altri {(checkStats.warnings + checkStats.failed) - 2} problemi...
              </div>
            )}
          </div>
        )}

        {/* Bottone per espandere tutti i dettagli */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandDetails(!expandDetails);
          }}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
        >
          <span>Mostra tutti i dettagli</span>
          {expandDetails ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
        </button>

        {/* Lista completa espandibile */}
        {expandDetails && module.checks && (
          <div className="mt-2 bg-white bg-opacity-90 rounded-lg p-3 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {module.checks.map((check: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs p-2 hover:bg-gray-50 rounded">
                  {getCheckIcon(check.status)}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      {check.description || `Check ${idx + 1}`}
                    </div>
                    {check.message && (
                      <div className="text-gray-600 mt-0.5">{check.message}</div>
                    )}
                    {check.severity && (
                      <div className="text-gray-500 mt-0.5">
                        Severity: <span className="font-medium">{check.severity}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer con timing e ultimo check */}
        <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between items-center">
          <div className="text-xs text-gray-600">
            <ClockIcon className="h-3 w-3 inline mr-1" />
            {formatDate(module.timestamp)}
          </div>
          {module.executionTime !== undefined && (
            <div className="text-xs text-gray-600 font-medium">
              {module.executionTime}ms
            </div>
          )}
        </div>
      </div>

      {/* Module Description Modal */}
      {showInfo && (
        <ModuleDescriptions 
          selectedModule={module.module}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
