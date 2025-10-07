# 💰 Sistema Range Prezzi Indicativi - Documentazione Completa

**Data Creazione**: 4 Ottobre 2025  
**Versione**: 1.0.0  
**Sistema**: Richiesta Assistenza v5.1

---

## 🎯 Panoramica

Il Sistema Range Prezzi Indicativi calcola e mostra stime di prezzo basate sui preventivi storici accettati. Fornisce ai clienti informazioni trasparenti sui costi attesi per i servizi.

### ✨ Caratteristiche Principali

- **Calcolo Automatico**: Range basato su percentili 25° e 75° dei prezzi storici
- **Dati Affidabili**: Richiede almeno 5 preventivi accettati negli ultimi 6 mesi
- **UI Responsive**: Componenti React pronti all'uso con Tailwind CSS
- **Cache Intelligente**: React Query per ottimizzare le performance
- **API RESTful**: Endpoint completi per tutte le operazioni

---

## 🏗️ Architettura Sistema

```
📦 Sistema Pricing
├── 🔙 Backend (Node.js + TypeScript)
│   ├── services/pricing.service.ts      # Logica business
│   ├── routes/pricing.routes.ts         # API endpoints
│   └── utils/responseFormatter.ts       # Formato risposte
├── 🔧 Frontend (React + TypeScript)
│   ├── components/quotes/PriceRangeDisplay.tsx  # Componente principale
│   ├── hooks/usePricing.ts              # Hook personalizzati
│   ├── services/api.ts                  # Client API
│   └── pages/PricingSystemExample.tsx   # Esempio integrazione
└── 📊 Database (PostgreSQL + Prisma)
    └── schema.prisma                    # Modelli Quote/Request
```

---

## 🚀 Installazione e Setup

### 1. Backend

I file sono già stati creati e integrati:

- ✅ `backend/src/services/pricing.service.ts`
- ✅ `backend/src/routes/pricing.routes.ts`
- ✅ Routes registrate in `server.ts`

### 2. Frontend

- ✅ `src/components/quotes/PriceRangeDisplay.tsx`
- ✅ `src/hooks/usePricing.ts`
- ✅ Funzioni API aggiunte in `src/services/api.ts`

### 3. Database

Il sistema usa i modelli esistenti:
- `Quote` - Per i preventivi
- `AssistanceRequest` - Per le richieste
- `Category` e `Subcategory` - Per la categorizzazione

---

## 📡 API Endpoints

### Base URL: `/api/pricing`

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| `GET` | `/range/estimate` | Stima prezzo per categoria/sottocategoria | ✅ |
| `GET` | `/range/category/:id` | Pricing completo categoria con sottocategorie | ✅ |
| `GET` | `/stats` | Statistiche generali sui prezzi | ✅ |
| `GET` | `/health` | Stato del servizio | ❌ |

### Esempi di Uso

```bash
# 1. Stima per categoria specifica
GET /api/pricing/range/estimate?categoryId=cat_123&subcategoryId=sub_456

# 2. Pricing completo categoria
GET /api/pricing/range/category/cat_123

# 3. Statistiche generali
GET /api/pricing/stats

# 4. Health check
GET /api/pricing/health
```

### Formato Risposte

```typescript
// Stima singola
{
  "success": true,
  "data": {
    "min": 150,
    "max": 350,
    "median": 220,
    "average": 235,
    "sampleSize": 12,
    "lastUpdated": "2025-10-04T14:30:00Z"
  }
}

// Pricing categoria completo
{
  "success": true,
  "data": {
    "category": { /* dati categoria */ },
    "overallRange": { /* range generale */ },
    "subcategoriesRanges": [ /* array sottocategorie */ ],
    "stats": {
      "totalSubcategories": 8,
      "subcategoriesWithData": 5,
      "hasOverallData": true
    }
  }
}
```

---

## 🎨 Uso Frontend

### 1. Componente Base

```tsx
import { PriceRangeDisplay } from '../components/quotes/PriceRangeDisplay';

// Nel form di creazione richiesta
<PriceRangeDisplay 
  categoryId="cat_123"
  subcategoryId="sub_456"
  className="my-4"
/>
```

### 2. Hook Personalizzati

```tsx
import { usePriceEstimate, usePricingStats } from '../hooks/usePricing';

function MyComponent() {
  // Stima singola
  const { data, isLoading, error } = usePriceEstimate(categoryId, subcategoryId);
  
  // Statistiche generali
  const { data: stats } = usePricingStats();
  
  // Dati combinati
  const pricing = usePricingData(categoryId, subcategoryId);
}
```

### 3. API Diretta

```tsx
import api from '../services/api';

// Chiamate API dirette
const estimate = await api.pricing.getEstimate(categoryId, subcategoryId);
const categoryPricing = await api.pricing.getCategoryPricing(categoryId);
const stats = await api.pricing.getStats();
```

---

## 🔧 Configurazione

### Variabili Ambiente

```env
# Backend
DATABASE_URL=postgresql://...   # Database PostgreSQL
REDIS_URL=redis://...          # Cache Redis (opzionale)

# Frontend  
VITE_API_URL=http://localhost:3200  # URL backend
```

### Parametri Sistema

```typescript
// In pricing.service.ts
const MINIMUM_SAMPLES = 5;          // Minimo preventivi richiesti
const MONTHS_LOOKBACK = 6;          // Mesi di storico da considerare
const CACHE_TTL = 5 * 60 * 1000;    // 5 minuti cache React Query
```

---

## 📊 Logica di Calcolo

### Algoritmo Range Prezzi

1. **Filtraggio Dati**:
   - Solo preventivi con `status = ACCEPTED`
   - Ultimi 6 mesi (`createdAt >= sixMonthsAgo`)
   - Categoria/sottocategoria specifica

2. **Validazione Campione**:
   - Minimo 5 preventivi per calcolo affidabile
   - Se < 5 preventivi → restituisce `null`

3. **Calcolo Percentili**:
   - **P25** (25° percentile) → Prezzo minimo indicativo
   - **P75** (75° percentile) → Prezzo massimo indicativo
   - **Mediana** (50° percentile) → Prezzo centrale
   - **Media** → Prezzo medio aritmetico

4. **Arrotondamento**:
   - Minimo: `Math.floor(p25)`
   - Massimo: `Math.ceil(p75)`
   - Media/Mediana: arrotondati

### Esempio Calcolo

```
Preventivi accettati: [120, 150, 180, 200, 220, 250, 280, 320, 350]
                      ↑          ↑              ↑              ↑
                     Min        P25           Mediana         P75

Range risultante: €180 - €320
Mediana: €220
Media: €230
```

---

## 🎨 Personalizzazione UI

### Stili Tailwind

Il componente usa classi Tailwind modificabili:

```tsx
// Colori personalizzati
<div className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">

// Layout responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Dimensioni custom
<PriceRangeDisplay className="max-w-lg mx-auto" />
```

### Temi Personalizzati

```tsx
// Tema scuro
const darkTheme = {
  background: 'bg-gray-800',
  text: 'text-white',
  accent: 'text-blue-400'
};

// Tema per categoria specifica
const plumbingTheme = {
  background: 'bg-blue-50',
  accent: 'text-blue-600',
  icon: 'text-blue-500'
};
```

---

## 🧪 Testing

### Test Backend

```bash
# Health check
curl http://localhost:3200/api/pricing/health

# Statistiche (richiede auth)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3200/api/pricing/stats

# Stima categoria
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3200/api/pricing/range/estimate?categoryId=cat_123"
```

### Test Frontend

```tsx
// Test con dati mock
import { render, screen } from '@testing-library/react';
import { PriceRangeDisplay } from './PriceRangeDisplay';

test('mostra range prezzi correttamente', () => {
  render(<PriceRangeDisplay categoryId="test" />);
  expect(screen.getByText('Stima Indicativa')).toBeInTheDocument();
});
```

---

## 🔍 Troubleshooting

### Problemi Comuni

#### 1. "Range prezzi non disponibile"
**Causa**: Non abbastanza preventivi nel database
**Soluzione**: 
- Verificare che esistano ≥5 preventivi ACCEPTED negli ultimi 6 mesi
- Controllare che categoryId/subcategoryId siano corretti

#### 2. Errore 401 Unauthorized
**Causa**: Token di autenticazione mancante o scaduto
**Soluzione**:
- Verificare login utente
- Controllare header Authorization

#### 3. Loading infinito
**Causa**: Errore nella query o API non raggiungibile
**Soluzione**:
- Verificare che backend sia avviato su porta 3200
- Controllare network tab del browser per errori

#### 4. Prezzi non aggiornati
**Causa**: Cache React Query non invalidata
**Soluzione**:
```tsx
const { refetch } = usePriceEstimate(categoryId);
refetch(); // Forza refresh
```

### Log Debug

```typescript
// Backend
console.log('[PricingService] Calcolando range per:', { categoryId, subcategoryId });

// Frontend
console.log('[PriceRangeDisplay] Caricamento range prezzi:', { categoryId, subcategoryId });
```

---

## 🚀 Estensioni Future

### Funzionalità Pianificate

1. **Machine Learning**:
   - Predizioni prezzi con trend stagionali
   - Algoritmi di clustering per categorie simili

2. **Geo-pricing**:
   - Range prezzi per zona geografica
   - Correzioni per costo della vita locale

3. **Dynamic Pricing**:
   - Aggiustamenti real-time basati su domanda/offerta
   - Pricing personalizzato per utente

4. **Analytics Avanzate**:
   - Dashboard admin con grafici trend
   - Report export Excel/PDF

### API Future

```typescript
// Pricing geografico
GET /api/pricing/range/geo?categoryId=123&city=Milano

// Trend storici
GET /api/pricing/trends?categoryId=123&period=12months

// Predizioni ML
GET /api/pricing/predict?categoryId=123&features={...}
```

---

## 📈 Metriche e Monitoraggio

### KPI da Monitorare

- **Accuracy Rate**: % richieste con pricing nel range stimato
- **Coverage**: % categorie con dati sufficienti
- **User Engagement**: CTR su richieste con pricing
- **Conversion Rate**: % richieste → preventivi dopo pricing

### Dashboard Metriche

```tsx
// Componente admin per metriche
const PricingDashboard = () => {
  const { data: stats } = usePricingStats();
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard 
        title="Coverage" 
        value={`${stats.coverage}%`}
        trend="+5%" 
      />
      <MetricCard 
        title="Accuracy" 
        value={`${stats.accuracy}%`}
        trend="+2%" 
      />
    </div>
  );
};
```

---

## 🔒 Sicurezza

### Controlli Implementati

- ✅ **Autenticazione**: Tutti gli endpoint richiedono login
- ✅ **Validazione Input**: Zod schema per parametri
- ✅ **Rate Limiting**: Express rate limit
- ✅ **Audit Log**: Tracciamento accessi
- ✅ **Error Handling**: Nessun dato sensibile negli errori

### Best Practices

```typescript
// Non esporre logica pricing nel frontend
❌ const price = calculatePrice(materials, hours);
✅ const { data: estimate } = usePriceEstimate(categoryId);

// Validare sempre gli input
❌ const range = await pricingService.getPriceRange(req.query.categoryId);
✅ const { categoryId } = categoryPricingSchema.parse(req.params);
```

---

## 📞 Supporto

### Contatti Team

- **Lead Developer**: Luca Mambelli (lucamambelli@lmtecnologie.it)
- **GitHub**: [@241luca](https://github.com/241luca)

### File di Riferimento

- 📁 **Backend**: `backend/src/services/pricing.service.ts`
- 📁 **Frontend**: `src/components/quotes/PriceRangeDisplay.tsx`
- 📁 **Esempio**: `src/pages/PricingSystemExample.tsx`
- 📁 **Documentazione**: `DOCUMENTAZIONE/PRICING-RANGE-SYSTEM.md`

---

**Fine Documentazione Sistema Range Prezzi Indicativi v1.0**  
**Sistema pronto per produzione** ✅
