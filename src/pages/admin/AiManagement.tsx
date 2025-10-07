import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SparklesIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { api } from '@/services/api';

export function AiManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: health } = useQuery({
    queryKey: ['ai-health'],
    queryFn: () => api.get('/ai/health')
  });

  const { data: stats } = useQuery({
    queryKey: ['ai-stats'],
    queryFn: () => api.get('/ai/stats')
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <SparklesIcon className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Gestione Sistema AI</h1>
        </div>
        <p className="text-gray-600">Configura e monitora il sistema AI</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Stato Sistema</h3>
        <div className="flex items-center space-x-2">
          <span className={health?.data?.status === 'operational' ? 
            'h-3 w-3 bg-green-500 rounded-full animate-pulse' : 
            'h-3 w-3 bg-yellow-500 rounded-full'}>
          </span>
          <span className="font-medium">
            {health?.data?.status === 'operational' ? 'Operativo' : 'Configurazione'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {health?.data?.message}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 
                'py-4 border-b-2 border-purple-500 text-purple-600' : 
                'py-4 text-gray-500'}
            >
              Panoramica
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={activeTab === 'config' ? 
                'py-4 border-b-2 border-purple-500 text-purple-600' : 
                'py-4 text-gray-500'}
            >
              Configurazione
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Statistiche</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Conversazioni</p>
                  <p className="text-2xl font-bold">{stats?.data?.totalConversations || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Token Usati</p>
                  <p className="text-2xl font-bold">{stats?.data?.totalTokens || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Modello</p>
                  <p className="text-lg font-bold">GPT-3.5</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configurazione</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Modello AI
                  </label>
                  <select className="w-full border rounded px-3 py-2">
                    <option>GPT-3.5 Turbo</option>
                    <option>GPT-4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Temperatura
                  </label>
                  <input type="range" min="0" max="2" step="0.1" 
                    defaultValue="0.7" className="w-full" />
                </div>
                <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
                  Salva Configurazione
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
