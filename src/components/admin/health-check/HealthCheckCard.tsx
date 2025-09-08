/**
 * Health Check Card Component
 * Card per visualizzare lo stato di un singolo modulo
 */

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import ModuleDescriptions from './ModuleDescriptions';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <div className="h-6 w-6 bg-gray-300 rounded-full animate-pulse" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <div 
        className={`rounded-lg border-2 p-6 transition-all hover:shadow-lg cursor-pointer relative ${getStatusColor(module.status)}`}
        onClick={onClick}
      >
        {/* Info button in top right corner */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo(true);
          }}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 hover:bg-opacity-80 transition-colors z-10"
          title="Informazioni sul modulo"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </button>

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {module.displayName || module.module}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                disabled={isRefreshing}
                className="p-1 rounded hover:bg-white hover:bg-opacity-50 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon 
                  className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(module.status)}
              <p className="text-sm text-gray-600 capitalize">
                {module.status}
              </p>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Health Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(module.score)}`}>
              {module.score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                module.score >= 80 ? 'bg-green-500' :
                module.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${module.score}%` }}
            />
          </div>
        </div>

        {/* Metrics Summary */}
        {module.metrics ? (
          Object.keys(module.metrics).length > 0 ? (
            <div className="space-y-2 mb-4">
              {Object.entries(module.metrics).slice(0, 3).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="font-medium text-gray-900">
                    {value !== null && value !== undefined
                      ? (typeof value === 'number' ? value.toLocaleString() : String(value))
                      : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic mb-4">
              Servizio non configurato
            </div>
          )
        ) : (
          <div className="text-sm text-gray-500 italic mb-4">
            Nessuna metrica disponibile
          </div>
        )}

        {/* Issues Count */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm">
            {module.errors?.length > 0 && (
              <span className="flex items-center text-red-600">
                <XCircleIcon className="h-4 w-4 mr-1" />
                {module.errors.length} errors
              </span>
            )}
            {module.warnings?.length > 0 && (
              <span className="flex items-center text-yellow-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {module.warnings.length} warnings
              </span>
            )}
            {!module.errors?.length && !module.warnings?.length && (
              <span className="text-green-600">No issues</span>
            )}
          </div>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        </div>

        {/* Execution Time */}
        {module.executionTime && (
          <div className="mt-2 text-xs text-gray-500">
            Checked in {module.executionTime}ms
          </div>
        )}
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
