# 📋 COME AGGIUNGERE L'INTERFACCIA ADMIN PER L'AI

## 1. AGGIUNGI IL LINK NEL MENU ADMIN

Nel file dove hai il menu admin (es. AdminDashboard.tsx o AdminLayout.tsx), aggiungi:

```jsx
import { SparklesIcon } from '@heroicons/react/24/outline';

// Nel menu o nella sidebar
<a href="/admin/ai" className="flex items-center space-x-2 p-3 hover:bg-purple-50 rounded-lg">
  <SparklesIcon className="h-5 w-5 text-purple-600" />
  <span>Gestione AI</span>
</a>
```

## 2. AGGIUNGI LA ROUTE IN APP.TSX

```jsx
// Import della pagina
import { AiManagement } from '@/pages/admin/AiManagement';

// Nella sezione routes admin
<Route path="/admin/ai" element={<AiManagement />} />
```

## 3. CREA LA PAGINA AI MANAGEMENT

Crea il file: `src/pages/admin/AiManagement.tsx`

```jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { apiClient as api } from '@/services/api';

export function AiManagement() {
  const { data: health } = useQuery({
    queryKey: ['ai-health'],
    queryFn: () => api.get('/ai/health')
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestione Sistema AI</h1>
      
      {/* Stato AI */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Stato Sistema</h2>
        <div className="flex items-center space-x-2">
          <span className={health?.data?.status === 'operational' ? 
            'text-green-600' : 'text-yellow-600'}>
            {health?.data?.status === 'operational' ? '✅ Operativo' : '⚠️ Configurazione'}
          </span>
        </div>
      </div>

      {/* Link alle configurazioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/api-keys" 
           className="bg-white rounded-lg shadow p-6 hover:shadow-lg">
          <h3 className="font-semibold">Chiavi API</h3>
          <p className="text-sm text-gray-600">Configura OpenAI</p>
        </a>
        
        <a href="/admin/subcategories" 
           className="bg-white rounded-lg shadow p-6 hover:shadow-lg">
          <h3 className="font-semibold">Configurazione AI</h3>
          <p className="text-sm text-gray-600">Per sottocategoria</p>
        </a>
      </div>
    </div>
  );
}
```

## 4. AGGIUNGI UNA CARD NEL DASHBOARD ADMIN

Nel AdminDashboard.tsx, aggiungi questa card:

```jsx
{/* Card AI Status */}
<div className="bg-white rounded-lg shadow p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold">Sistema AI</h3>
    <SparklesIcon className="h-5 w-5 text-purple-600" />
  </div>
  <p className="text-2xl font-bold">Operativo</p>
  <a href="/admin/ai" className="text-sm text-purple-600 hover:underline">
    Gestisci →
  </a>
</div>
```

## 5. PER TESTARE

1. Riavvia il frontend se necessario
2. Vai su `/admin` come amministratore
3. Cerca il link "Gestione AI"
4. Clicca e verifica che la pagina si apra

## PERCORSI ESISTENTI PER LA CONFIGURAZIONE AI

- **Admin → API Keys**: Per inserire/modificare chiave OpenAI
- **Admin → Sottocategorie**: Per configurare AI per ogni sottocategoria
- **Admin → Gestione AI**: Panoramica generale del sistema

## NOTE

- L'interfaccia admin per l'AI è modulare
- Puoi espandere con più funzionalità in futuro
- Il sistema AI è già completamente funzionante nel backend
- La chat AI appare automaticamente nelle richieste per utenti loggati

---
Il sistema AI è completamente implementato e pronto all'uso!
