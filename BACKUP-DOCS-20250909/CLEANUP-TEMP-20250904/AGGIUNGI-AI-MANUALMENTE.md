# ✅ AGGIUNGI AI AL SISTEMA - ISTRUZIONI MANUALI

## 1. AGGIUNGI AI CHAT NELLE RICHIESTE

**File:** `src/pages/RequestDetailPage.tsx`

**Passo 1:** Aggiungi l'import all'inizio del file (dopo gli altri import):
```jsx
import { AiChatComplete } from '@/components/ai/AiChatComplete';
```

**Passo 2:** Aggiungi il componente AI Chat prima dell'ultimo `</div>` (circa riga 1000):
```jsx
      {/* AI Chat Assistant */}
      {request && (
        <AiChatComplete
          requestId={request.id}
          subcategoryId={request.subcategoryId}
          conversationType={user?.role === 'PROFESSIONAL' ? 'professional_help' : 'client_help'}
        />
      )}
    </div>
  );
}
```

## 2. AGGIUNGI CARD AI NEL DASHBOARD ADMIN

**File:** `src/pages/admin/AdminDashboard.tsx`

**Passo 1:** Aggiungi import per SparklesIcon:
```jsx
import { 
  UserIcon, 
  // ... altri icon
  SparklesIcon  // <-- Aggiungi questo
} from '@heroicons/react/24/outline';
```

**Passo 2:** Aggiungi la Card AI dopo le altre StatCard (cerca la sezione con le card):
```jsx
{/* Dopo le altre StatCard, aggiungi: */}
<div 
  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
  onClick={() => window.location.href = '/admin/ai'}
>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-medium text-gray-700">Sistema AI</h3>
    <SparklesIcon className="h-5 w-5 text-purple-600" />
  </div>
  <div className="text-2xl font-bold">Operativo</div>
  <p className="text-xs text-gray-500 mt-2">OpenAI Configurato</p>
  <div className="mt-3">
    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
      Clicca per gestire
    </span>
  </div>
</div>
```

## 3. AGGIUNGI LA ROUTE PER LA PAGINA AI

**File:** `src/App.tsx`

**Passo 1:** Aggiungi import:
```jsx
import { AiManagement } from '@/pages/admin/AiManagement';
```

**Passo 2:** Aggiungi la route (cerca la sezione con le route /admin):
```jsx
<Route path="/admin/ai" element={<AiManagement />} />
```

## 4. CREA LA PAGINA AI MANAGEMENT

**File:** `src/pages/admin/AiManagement.tsx` (crea nuovo file)

```jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SparklesIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { apiClient as api } from '@/services/api';

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
```

## 5. VERIFICA CHE TUTTO FUNZIONI

1. **Riavvia il frontend** se necessario
2. **Vai su una richiesta**: Dovresti vedere il bottone AI chat in basso a destra
3. **Vai su /admin**: Dovresti vedere la card Sistema AI
4. **Clicca sulla card**: Dovrebbe portarti a /admin/ai

## NOTA
Se i file AiChatComplete.tsx non esistono ancora, creali nella cartella:
`src/components/ai/`

---
Segui questi passaggi uno per uno e il sistema AI sarà completamente integrato nel frontend!
