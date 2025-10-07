# 🎨 SESSIONE 7: Frontend Components
**Durata Stimata**: 2 ore  
**Complessità**: Media  
**Prerequisiti**: Backend completato (Sessioni 1-6)

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! SESSIONE 7 di 10 - Frontend Components.

📚 DOCUMENTI DA LEGGERE:
1. /ISTRUZIONI-PROGETTO.md (React Query, Tailwind, Heroicons)
2. /src/components/ (esempi componenti esistenti)
3. /src/services/api.ts (API client)

🎯 OBIETTIVO SESSIONE 7:
Creare componenti React per sistema moduli (ModuleCard, Alert, Widget).

📋 TASK DA COMPLETARE:

**1. TYPES FRONTEND**
File: `src/types/modules.types.ts`

```typescript
export type ModuleCategory = 
  | 'CORE'
  | 'BUSINESS'
  | 'COMMUNICATION'
  | 'ADVANCED'
  | 'REPORTING'
  | 'AUTOMATION'
  | 'INTEGRATIONS'
  | 'ADMIN';

export interface SystemModule {
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
```

**2. API CLIENT**
File: `src/services/modules.api.ts`

```typescript
import api from './api';

export const modulesApi = {
  getAll: () => api.get('/admin/modules'),
  
  getByCategory: (category: string) => 
    api.get(`/admin/modules/category/${category}`),
  
  getByCode: (code: string) => 
    api.get(`/admin/modules/${code}`),
  
  enable: (code: string, reason?: string) =>
    api.post(`/admin/modules/${code}/enable`, { reason }),
  
  disable: (code: string, reason?: string) =>
    api.post(`/admin/modules/${code}/disable`, { reason }),
  
  updateConfig: (code: string, config: any) =>
    api.put(`/admin/modules/${code}/config`, { config }),
  
  getSettings: (code: string) =>
    api.get(`/admin/modules/${code}/settings`),
  
  updateSetting: (code: string, key: string, value: string) =>
    api.put(`/admin/modules/${code}/settings/${key}`, { value }),
  
  getHistory: (code: string, limit?: number) =>
    api.get(`/admin/modules/${code}/history`, { params: { limit } })
};
```

**3. COMPONENTE MODULE CARD**
File: `src/components/admin/modules/ModuleCard.tsx`

```typescript
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

  const toggleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        return await modulesApi.enable(module.code, reason || undefined);
      } else {
        return await modulesApi.disable(module.code, reason || undefined);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      setShowConfirm(false);
      setReason('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Errore durante operazione');
    }
  });

  const handleToggleClick = () => {
    if (module.isCore) {
      alert('I moduli CORE non possono essere disabilitati');
      return;
    }

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
        {/* Header */}
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

          {/* Toggle Switch */}
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

        {/* Stats */}
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

**4. COMPONENTE MODULE DISABLED ALERT**
File: `src/components/common/ModuleDisabledAlert.tsx`

```typescript
import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface ModuleDisabledAlertProps {
  moduleName: string;
  message?: string;
}

export const ModuleDisabledAlert: React.FC<ModuleDisabledAlertProps> = ({
  moduleName,
  message
}) => {
  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <XCircleIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Funzionalità Non Disponibile
        </h2>
        <p className="text-gray-700 mb-4">
          {message || `La funzionalità ${moduleName} non è attualmente attiva.`}
        </p>
        <p className="text-sm text-gray-600">
          Contatta l'amministratore del sistema per maggiori informazioni.
        </p>
      </div>
    </div>
  );
};
```

**5. COMPONENTE WIDGET DASHBOARD**
File: `src/components/admin/dashboard/ModulesStatusWidget.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { modulesApi } from '../../../services/modules.api';

export const ModulesStatusWidget: React.FC = () => {
  const { data: modules } = useQuery({
    queryKey: ['admin', 'modules', 'summary'],
    queryFn: async () => {
      const response = await modulesApi.getAll();
      return response.data.data;
    }
  });

  const critical = modules?.filter((m: any) => 
    !m.isEnabled && m.category === 'CORE'
  );
  
  const disabled = modules?.filter((m: any) => !m.isEnabled);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🔧 Stato Moduli
        </h3>
        <Link
          to="/admin/modules"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Gestisci →
        </Link>
      </div>

      {critical && critical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold mb-2">
            ⚠️ Attenzione: {critical.length} moduli critici disabilitati
          </p>
          <ul className="text-sm text-red-700 space-y-1">
            {critical.map((m: any) => (
              <li key={m.code}>• {m.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">
            {modules?.filter((m: any) => m.isEnabled).length || 0}
          </p>
          <p className="text-sm text-gray-600">Attivi</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-3xl font-bold text-red-600">
            {disabled?.length || 0}
          </p>
          <p className="text-sm text-gray-600">Disattivi</p>
        </div>
      </div>

      {disabled && disabled.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Moduli disattivi:</p>
          <div className="flex flex-wrap gap-2">
            {disabled.slice(0, 5).map((m: any) => (
              <span
                key={m.code}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {m.name}
              </span>
            ))}
            {disabled.length > 5 && (
              <span className="text-xs text-gray-500">
                +{disabled.length - 5} altri
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

⚠️ REGOLE CRITICHE:
1. ✅ SEMPRE React Query per API
2. ✅ SOLO Tailwind per styling
3. ✅ SOLO Heroicons per icone
4. ✅ Loading states su mutations
5. ✅ Error handling con alert/toast
6. ✅ Responsive mobile-first

📝 DOCUMENTAZIONE:

**File**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-07-frontend-components.md`

```markdown
# 📋 Report Sessione 7 - Frontend Components

**Data**: 05/10/2025
**Status**: ✅ Completato

## ✅ Completato
- [x] Types frontend creati
- [x] API client modules.api.ts
- [x] ModuleCard componente
- [x] ModuleDisabledAlert componente
- [x] ModulesStatusWidget componente
- [x] Tutti testati manualmente

## 📦 File Creati
- src/types/modules.types.ts
- src/services/modules.api.ts
- src/components/admin/modules/ModuleCard.tsx
- src/components/common/ModuleDisabledAlert.tsx
- src/components/admin/dashboard/ModulesStatusWidget.tsx

## 🎨 Componenti
1. ModuleCard - Card singolo modulo con toggle
2. ModuleDisabledAlert - Alert funzionalità non disponibile
3. ModulesStatusWidget - Widget dashboard admin

## 🧪 Testing
✅ ModuleCard rendering OK
✅ Toggle funzionante
✅ Modale conferma OK
✅ Widget dashboard OK
```

🧪 TESTING:
```bash
# Avvia frontend
npm run dev

# Controlla in browser:
# - Importa ModuleCard in pagina test
# - Verifica rendering
# - Test toggle
```

✅ CHECKLIST:
- [ ] Types creati
- [ ] API client creato
- [ ] ModuleCard completo
- [ ] ModuleDisabledAlert completo
- [ ] Widget completo
- [ ] Tailwind usato correttamente
- [ ] React Query funzionante
- [ ] Report creato
- [ ] Commit su Git

➡️ PROSSIMA SESSIONE:
**SESSIONE 8**: Frontend Pages + Dashboard Integration

Al termine:
➡️ "SESSIONE 7 COMPLETATA - PRONTO PER SESSIONE 8"
```
