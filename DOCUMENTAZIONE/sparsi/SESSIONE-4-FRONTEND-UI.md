# 🎨 SESSIONE 4: Frontend - Interfaccia Web
**Durata Stimata**: 4 ore  
**Difficoltà**: Media  
**Cosa faremo**: Creeremo l'interfaccia web dove l'admin può vedere e gestire i moduli (accendere/spegnere)

---

## 📋 PROMPT DA DARE A CLAUDE

Copia e incolla questo prompt in una nuova chat con Claude:

```
Ciao Claude! Sessione 4 - Frontend Sistema Moduli.

📚 LEGGI PRIMA:
1. /ISTRUZIONI-PROGETTO.md (IMPORTANTE - regole React Query, Tailwind, Heroicons)
2. Report Sessioni 1, 2, 3
3. /src/pages/admin/AdminDashboard.tsx (dashboard esistente per vedere lo stile)
4. /src/services/api.ts (client API esistente)

🎯 OBIETTIVO SESSIONE 4:
Creare l'interfaccia web per gestire i moduli:
- Pagina con lista di tutti i 66 moduli
- Card per ogni modulo con interruttore ON/OFF
- Filtri per categoria
- Statistiche (quanti attivi, quanti spenti)
- Integrazione con dashboard admin esistente

⚠️ REGOLE CRITICHE:
- Usa SEMPRE React Query per le API (MAI fetch diretto)
- Usa SOLO Tailwind per lo styling
- Usa SOLO Heroicons per le icone
- L'API client ha GIÀ /api nel baseURL - quindi chiama api.get('/admin/modules') NON api.get('/api/admin/modules')

---

## 📝 COSA DEVI FARE

### PASSO 1: CREA API CLIENT METHODS

Opzione A - Nuovo file dedicato:
Crea `src/services/modules.api.ts`:

```typescript
// src/services/modules.api.ts
import api from './api';

export const modulesApi = {
  // Lista tutti i moduli
  getAll: () => api.get('/admin/modules'),
  
  // Moduli per categoria
  getByCategory: (category: string) => 
    api.get(`/admin/modules/category/${category}`),
  
  // Dettaglio modulo
  getByCode: (code: string) => 
    api.get(`/admin/modules/${code}`),
  
  // Abilita modulo
  enable: (code: string, reason?: string) =>
    api.post(`/admin/modules/${code}/enable`, { reason }),
  
  // Disabilita modulo
  disable: (code: string, reason?: string) =>
    api.post(`/admin/modules/${code}/disable`, { reason }),
  
  // Aggiorna configurazione
  updateConfig: (code: string, config: any) =>
    api.put(`/admin/modules/${code}/config`, { config }),
  
  // Settings
  getSettings: (code: string) =>
    api.get(`/admin/modules/${code}/settings`),
  
  updateSetting: (code: string, key: string, value: string) =>
    api.put(`/admin/modules/${code}/settings/${key}`, { value }),
  
  // Storia modifiche
  getHistory: (code: string, limit?: number) =>
    api.get(`/admin/modules/${code}/history`, { params: { limit } })
};
```

### PASSO 2: CREA TYPES

Crea `src/types/modules.types.ts`:

```typescript
// src/types/modules.types.ts

export type ModuleCategory = 
  | 'CORE'
  | 'BUSINESS'
  | 'COMMUNICATION'
  | 'ADVANCED'
  | 'AUTOMATION'
  | 'INTEGRATIONS'
  | 'REPORTING'
  | 'ADMIN';

export interface SystemModule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ModuleCategory;
  isEnabled: boolean;
  isCore: boolean;
  dependsOn: string[];
  requiredFor?: string[];
  icon: string;
  color: string;
  order: number;
  version: string;
  _count?: {
    settings: number;
  };
}

export interface ModuleSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  isRequired: boolean;
  isSecret: boolean;
}

export interface ModuleHistory {
  id: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  performedBy: string;
  user: {
    firstName: string;
    lastName: string;
  };
  reason?: string;
  createdAt: string;
}
```

### PASSO 3: CREA COMPONENTE MODULE CARD

Crea `src/components/admin/modules/ModuleCard.tsx`:

```typescript
// src/components/admin/modules/ModuleCard.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi } from '../../../services/modules.api';
import { SystemModule } from '../../../types/modules.types';

interface ModuleCardProps {
  module: SystemModule;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  // Mutation per accendere/spegnere modulo
  const toggleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        return await modulesApi.enable(module.code, reason || undefined);
      } else {
        return await modulesApi.disable(module.code, reason || undefined);
      }
    },
    onSuccess: () => {
      // Ricarica lista moduli
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      setShowConfirm(false);
      setReason('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante operazione';
      alert(message);
    }
  });

  const handleToggleClick = () => {
    // Blocca se è un modulo CORE
    if (module.isCore) {
      alert('I moduli CORE non possono essere disabilitati');
      return;
    }

    // Blocca se altri moduli dipendono da questo
    if (module.isEnabled && module.requiredFor && module.requiredFor.length > 0) {
      alert(`Impossibile disabilitare. Richiesto da: ${module.requiredFor.join(', ')}`);
      return;
    }

    setShowConfirm(true);
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow"
        style={{ borderColor: module.color }}
      >
        {/* Header con nome e toggle */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-4xl">{module.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {module.name}
                </h3>
                {module.isCore && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                    CORE
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{module.description}</p>
            </div>
          </div>

          {/* Interruttore ON/OFF */}
          <button
            onClick={handleToggleClick}
            disabled={module.isCore || toggleMutation.isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              module.isEnabled ? 'bg-green-600' : 'bg-gray-300'
            } ${
              module.isCore || toggleMutation.isPending
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                module.isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Informazioni */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Categoria</p>
            <p className="font-semibold text-gray-900">{module.category}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Settings</p>
            <p className="font-semibold text-gray-900">
              {module._count?.settings || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Stato</p>
            <p className={`font-semibold ${module.isEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {module.isEnabled ? 'Attivo' : 'Disattivo'}
            </p>
          </div>
        </div>

        {/* Dipendenze */}
        {module.dependsOn && module.dependsOn.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 mb-1 font-semibold">Dipende da:</p>
            <div className="flex flex-wrap gap-1">
              {module.dependsOn.map((dep) => (
                <span
                  key={dep}
                  className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modale Conferma */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {module.isEnabled ? 'Disabilita' : 'Abilita'} {module.name}
            </h3>

            <p className="text-gray-600 mb-4">
              {module.isEnabled
                ? 'Gli utenti non potranno più utilizzare questa funzionalità.'
                : 'La funzionalità sarà disponibile per tutti gli utenti.'}
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivazione (opzionale)"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={toggleMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={() => toggleMutation.mutate(!module.isEnabled)}
                disabled={toggleMutation.isPending}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  module.isEnabled
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {toggleMutation.isPending ? 'Attendere...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

### PASSO 4: CREA PAGINA MODULE MANAGER

Crea `src/pages/admin/ModuleManager.tsx`:

```typescript
// src/pages/admin/ModuleManager.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '../../services/modules.api';
import { ModuleCard } from '../../components/admin/modules/ModuleCard';
import { SystemModule } from '../../types/modules.types';

const CATEGORIES = {
  CORE: { name: 'Core', color: '#EF4444', icon: '🔴' },
  BUSINESS: { name: 'Business', color: '#10B981', icon: '🟢' },
  COMMUNICATION: { name: 'Comunicazione', color: '#3B82F6', icon: '💬' },
  ADVANCED: { name: 'Avanzate', color: '#8B5CF6', icon: '🤖' },
  AUTOMATION: { name: 'Automazione', color: '#F59E0B', icon: '⚙️' },
  INTEGRATIONS: { name: 'Integrazioni', color: '#06B6D4', icon: '🔗' },
  REPORTING: { name: 'Reportistica', color: '#EC4899', icon: '📊' },
  ADMIN: { name: 'Admin', color: '#6366F1', icon: '🛠️' }
};

export const ModuleManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Carica tutti i moduli
  const { data: modules, isLoading } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: async () => {
      const response = await modulesApi.getAll();
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento moduli...</p>
        </div>
      </div>
    );
  }

  // Raggruppa moduli per categoria
  const modulesByCategory = modules?.reduce((acc: any, module: SystemModule) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {}) || {};

  // Calcola statistiche
  const stats = {
    total: modules?.length || 0,
    enabled: modules?.filter((m: SystemModule) => m.isEnabled).length || 0,
    disabled: modules?.filter((m: SystemModule) => !m.isEnabled).length || 0,
    core: modules?.filter((m: SystemModule) => m.isCore).length || 0
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔧 Gestione Moduli Sistema
        </h1>
        <p className="text-gray-600">
          Abilita o disabilita le funzionalità del sistema
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-700 text-sm mb-1">Totali</p>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-700 text-sm mb-1">Attivi</p>
          <p className="text-3xl font-bold text-green-900">{stats.enabled}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-700 text-sm mb-1">Disattivi</p>
          <p className="text-3xl font-bold text-red-900">{stats.disabled}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-700 text-sm mb-1">Core</p>
          <p className="text-3xl font-bold text-purple-900">{stats.core}</p>
        </div>
      </div>

      {/* Filtro Categorie */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedCategory === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tutte ({stats.total})
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const count = modulesByCategory[key]?.length || 0;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedCategory === key
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedCategory === key ? cat.color : undefined
              }}
            >
              {cat.icon} {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista Moduli */}
      {Object.entries(modulesByCategory)
        .filter(([category]) => !selectedCategory || category === selectedCategory)
        .map(([category, categoryModules]) => {
          const catInfo = CATEGORIES[category as keyof typeof CATEGORIES];
          return (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span
                  className="w-1 h-6 rounded"
                  style={{ backgroundColor: catInfo.color }}
                />
                {catInfo.icon} {catInfo.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(categoryModules as SystemModule[]).map((module) => (
                  <ModuleCard key={module.code} module={module} />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
};
```

### PASSO 5: AGGIUNGI ROUTE

Modifica `src/App.tsx`:

```typescript
// Aggiungi import
import { ModuleManager } from './pages/admin/ModuleManager';

// Nelle routes admin, aggiungi
<Route path="/admin/modules" element={<ModuleManager />} />
```

### PASSO 6: AGGIORNA ADMIN DASHBOARD

Modifica `src/pages/admin/AdminDashboard.tsx`:

Trova la griglia di card/link e aggiungi:

```typescript
{/* NUOVO: Link Gestione Moduli */}
<Link
  to="/admin/modules"
  className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white hover:shadow-xl transition-shadow"
>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold">🔧 Moduli Sistema</h3>
    <span className="text-3xl">→</span>
  </div>
  <p className="text-purple-100 mb-4">
    Abilita/Disabilita funzionalità
  </p>
  <div className="text-sm">
    <p>• Sistema Recensioni</p>
    <p>• WhatsApp Business</p>
    <p>• AI Assistant</p>
    <p>• Portfolio Lavori</p>
  </div>
</Link>
```

### PASSO 7: TESTA IL FRONTEND

1. **Avvia il frontend:**
```bash
npm run dev
```

2. **Login come admin**

3. **Vai su http://localhost:5193/admin/modules**

4. **Test manuale:**
   - ✅ Vedi tutti i 66 moduli
   - ✅ Prova a filtrare per categoria
   - ✅ Prova a spegnere un modulo non-core
   - ✅ Verifica che si apre modale conferma
   - ✅ Spegni e verifica che cambia stato
   - ✅ Prova a spegnere modulo core (deve bloccare)
   - ✅ Riaccendi il modulo

---

## 📝 DOCUMENTAZIONE DA CREARE

### 1. Report Sessione

Crea `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-4-frontend.md`:

```markdown
# Report Sessione 4 - Frontend UI

**Data**: 05/10/2025
**Durata**: [tempo]
**Status**: ✅ Completato

## Obiettivo
Creare interfaccia web completa per gestione moduli.

## Completato
- [x] API client methods (modules.api.ts)
- [x] Types definitions (modules.types.ts)
- [x] Componente ModuleCard
- [x] Pagina ModuleManager
- [x] Route /admin/modules
- [x] Link in AdminDashboard
- [x] Filtro categorie
- [x] Statistiche aggregate
- [x] Modale conferma enable/disable
- [x] Styling Tailwind completo
- [x] React Query integration
- [x] Responsive design

## File Creati
- `src/services/modules.api.ts`
- `src/types/modules.types.ts`
- `src/components/admin/modules/ModuleCard.tsx`
- `src/pages/admin/ModuleManager.tsx`

## File Modificati
- `src/App.tsx` (aggiunta route)
- `src/pages/admin/AdminDashboard.tsx` (aggiunto link)

## Test UI Eseguiti
- ✅ Visualizzazione 66 moduli
- ✅ Filtro per categoria funzionante
- ✅ Toggle ON/OFF modulo
- ✅ Modale conferma
- ✅ Messaggio errore moduli core
- ✅ Messaggio errore dipendenze
- ✅ Loading states
- ✅ Responsive mobile

## Screenshots
[Aggiungi screenshots della UI]

## Problemi Riscontrati
[Nessuno / Descrizione]

## Prossimi Passi
Sessione 5: Testing + Documentazione finale
```

### 2. Documentazione UI

Crea `DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/MODULE-SYSTEM-UI.md`:

```markdown
# Sistema Moduli - Interfaccia Web

## Accesso

**URL**: http://localhost:5193/admin/modules  
**Permessi**: ADMIN o SUPER_ADMIN

## Componenti UI

### ModuleCard
Card singolo modulo con:
- Nome e descrizione
- Icona emoji
- Interruttore ON/OFF
- Badge "CORE" per moduli non disabilitabili
- Informazioni (categoria, settings, stato)
- Dipendenze (se presenti)

### ModuleManager
Pagina principale con:
- **Statistiche**: Totali, Attivi, Disattivi, Core
- **Filtri**: Per categoria (8 categorie)
- **Griglia moduli**: 2 colonne responsive
- **Raggruppamento**: Per categoria con colori

## Funzionalità

### Abilita Modulo
1. Click sull'interruttore
2. Modale conferma (opzionale motivazione)
3. Verifica dipendenze automatica
4. Se OK, modulo si attiva

### Disabilita Modulo
1. Click sull'interruttore
2. Sistema verifica:
   - Non è modulo CORE
   - Nessun modulo dipendente attivo
3. Modale conferma (motivazione opzionale)
4. Se OK, modulo si disattiva

### Limitazioni
- Moduli CORE non possono essere disabilitati
- Moduli richiesti da altri non possono essere disabilitati

## Styling
- **Framework**: Tailwind CSS
- **Icone**: Emoji native
- **Colori**: Uno per categoria
- **Responsive**: Mobile-first

## API Integration
- **React Query** per tutte le chiamate
- **Cache** automatica
- **Invalidation** dopo mutations
- **Loading states** su tutte le operazioni
```

---

## ✅ CHECKLIST COMPLETAMENTO

- [ ] modules.api.ts creato
- [ ] modules.types.ts creato
- [ ] ModuleCard componente creato
- [ ] ModuleManager pagina creata
- [ ] Route aggiunta in App.tsx
- [ ] Link aggiunto in AdminDashboard
- [ ] Frontend avviato senza errori
- [ ] Test visualizzazione 66 moduli
- [ ] Test filtro categorie
- [ ] Test toggle ON/OFF
- [ ] Test modale conferma
- [ ] Test blocco moduli core
- [ ] Test responsive mobile
- [ ] Report sessione creato
- [ ] Documentazione UI creata
- [ ] Screenshots salvati
- [ ] File committati su Git

## 💾 COMANDI GIT

```bash
git add src/services/modules.api.ts
git add src/types/modules.types.ts
git add src/components/admin/modules/
git add src/pages/admin/ModuleManager.tsx
git add src/App.tsx
git add src/pages/admin/AdminDashboard.tsx
git add DOCUMENTAZIONE/

git commit -m "feat: add module management UI

- Add ModuleCard component with toggle
- Add ModuleManager page with filters
- Add category filtering and stats
- Add confirmation modal
- Integrate with AdminDashboard
- Full responsive design with Tailwind"

git push origin main
```

---

🎉 **SESSIONE 4 COMPLETATA! Ultima sessione rimanente: 5**
```

Buon lavoro! 🚀
