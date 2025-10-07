# 🖥️ SESSIONE 8: Frontend Pages + Dashboard Integration
**Durata Stimata**: 2 ore  
**Complessità**: Media  
**Prerequisiti**: Sessione 7 completata

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! SESSIONE 8 di 10 - Frontend Pages e Dashboard.

📚 DOCUMENTI DA LEGGERE:
1. /src/components/admin/modules/ (componenti sessione 7)
2. /src/pages/admin/AdminDashboard.tsx (dashboard esistente)
3. /src/App.tsx (routing)

🎯 OBIETTIVO SESSIONE 8:
Creare pagina ModuleManager completa + integrare in AdminDashboard.

📋 TASK DA COMPLETARE:

**1. PAGINA MODULE MANAGER**
File: `src/pages/admin/ModuleManager.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '../../services/modules.api';
import { ModuleCard } from '../../components/admin/modules/ModuleCard';
import { SystemModule } from '../../types/modules.types';

const CATEGORIES = {
  CORE: { name: 'Core', color: '#EF4444' },
  BUSINESS: { name: 'Business', color: '#10B981' },
  COMMUNICATION: { name: 'Comunicazione', color: '#3B82F6' },
  ADVANCED: { name: 'Avanzate', color: '#8B5CF6' },
  AUTOMATION: { name: 'Automazione', color: '#F59E0B' },
  INTEGRATIONS: { name: 'Integrazioni', color: '#06B6D4' },
  REPORTING: { name: 'Reportistica', color: '#EC4899' },
  ADMIN: { name: 'Amministrazione', color: '#6366F1' }
};

export const ModuleManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: async () => {
      const response = await modulesApi.getAll();
      return response.data.data as SystemModule[];
    }
  });

  // Raggruppa per categoria
  const modulesByCategory = modules?.reduce((acc: any, module: SystemModule) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {}) || {};

  // Statistiche
  const stats = {
    total: modules?.length || 0,
    enabled: modules?.filter((m) => m.isEnabled).length || 0,
    disabled: modules?.filter((m) => !m.isEnabled).length || 0,
    core: modules?.filter((m) => m.isCore).length || 0
  };

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

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">Errore Caricamento</h2>
          <p className="text-red-700">Impossibile caricare i moduli del sistema.</p>
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          className={`px-4 py-2 rounded-lg font-semibold ${
            selectedCategory === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tutte ({stats.total})
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              selectedCategory === key
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedCategory === key ? cat.color : undefined
            }}
          >
            {cat.name} ({modulesByCategory[key]?.length || 0})
          </button>
        ))}
      </div>

      {/* Lista Moduli */}
      {Object.entries(modulesByCategory)
        .filter(([category]) => !selectedCategory || category === selectedCategory)
        .map(([category, categoryModules]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span
                className="w-1 h-6 rounded"
                style={{ backgroundColor: CATEGORIES[category as keyof typeof CATEGORIES].color }}
              />
              {CATEGORIES[category as keyof typeof CATEGORIES].name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(categoryModules as SystemModule[]).map((module) => (
                <ModuleCard key={module.code} module={module} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};
```

**2. AGGIUNGERE ROUTE**
File: `src/App.tsx`

Aggiungi import e route:

```typescript
import { ModuleManager } from './pages/admin/ModuleManager';

// Nelle routes admin, aggiungi:
<Route path="/admin/modules" element={<ModuleManager />} />
```

**3. AGGIORNARE ADMIN DASHBOARD**
File: `src/pages/admin/AdminDashboard.tsx`

Aggiungi card link e widget:

```typescript
import { Link } from 'react-router-dom';
import { ModulesStatusWidget } from '../../components/admin/dashboard/ModulesStatusWidget';

// Nel render, aggiungi tra le card esistenti:

{/* Card Gestione Moduli */}
<Link
  to="/admin/modules"
  className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white hover:shadow-xl transition-shadow"
>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold">🔧 Gestione Moduli</h3>
    <span className="text-3xl">→</span>
  </div>
  <p className="text-purple-100 mb-4">
    Abilita/Disabilita funzionalità sistema
  </p>
  <div className="text-sm space-y-1">
    <p>• Sistema Recensioni</p>
    <p>• WhatsApp Business</p>
    <p>• AI Assistant</p>
    <p>• Portfolio Lavori</p>
  </div>
</Link>

{/* Più sotto, nella sezione widgets */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
  <ModulesStatusWidget />
  {/* Altri widget esistenti... */}
</div>
```

**4. AGGIORNARE NAVIGATION**
Se hai un menu di navigazione, aggiungi:

File: `src/components/admin/AdminNav.tsx` (o simile)

```typescript
<NavLink 
  to="/admin/modules"
  className={({ isActive }) => 
    `flex items-center gap-2 px-4 py-2 rounded-lg ${
      isActive ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'
    }`
  }
>
  🔧 Moduli Sistema
</NavLink>
```

⚠️ REGOLE CRITICHE:
1. ✅ React Query per data fetching
2. ✅ Loading state elegante
3. ✅ Error handling chiaro
4. ✅ Responsive design
5. ✅ Tailwind per tutto lo styling
6. ✅ Link React Router (non <a>)

📝 DOCUMENTAZIONE:

**File**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-08-frontend-pages.md`

```markdown
# 📋 Report Sessione 8 - Frontend Pages

**Data**: 05/10/2025
**Status**: ✅ Completato

## ✅ Completato
- [x] ModuleManager page creata
- [x] Route /admin/modules aggiunta
- [x] AdminDashboard aggiornato
- [x] Card link inserita
- [x] Widget integrato
- [x] Navigation aggiornata
- [x] Test manuale OK

## 📦 File Creati/Modificati
- src/pages/admin/ModuleManager.tsx (nuovo)
- src/App.tsx (route aggiunta)
- src/pages/admin/AdminDashboard.tsx (card + widget)
- src/components/admin/AdminNav.tsx (link)

## 🎨 Features
- Stats cards responsive
- Filtro categorie dinamico
- Griglia moduli 2 colonne
- Loading skeleton
- Error handling
- Mobile responsive

## 🧪 Testing
✅ Pagina carica correttamente
✅ 66 moduli visualizzati
✅ Filtro categorie funziona
✅ Toggle moduli OK
✅ Widget dashboard OK
✅ Responsive mobile OK
```

🧪 TESTING:
```bash
npm run dev

# Browser: http://localhost:5193
# Login admin
# Vai a /admin
# Click card "Gestione Moduli"
# Test:
# - Caricamento moduli
# - Filtro categorie
# - Toggle ON/OFF
# - Widget dashboard
# - Responsive mobile
```

✅ CHECKLIST:
- [ ] ModuleManager page creata
- [ ] Route aggiunta
- [ ] AdminDashboard aggiornato
- [ ] Card link funzionante
- [ ] Widget integrato
- [ ] Navigation aggiornata
- [ ] Responsive testato
- [ ] Loading state OK
- [ ] Error handling OK
- [ ] Report creato
- [ ] Screenshots salvati
- [ ] Commit su Git

➡️ PROSSIMA SESSIONE:
**SESSIONE 9**: Testing Suite (Unit, Integration, E2E)

Al termine:
➡️ "SESSIONE 8 COMPLETATA - PRONTO PER SESSIONE 9"
```
