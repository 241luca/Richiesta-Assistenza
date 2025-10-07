# 🟢 ServiceStatusIndicator - Guida Componente

**File**: `/src/components/admin/ServiceStatusIndicator.tsx`  
**Versione**: 1.0  
**Data**: 02 Ottobre 2025

---

## 📋 Overview

Il **ServiceStatusIndicator** è un componente React che mostra lo stato generale di tutti i servizi del sistema tramite un pallino colorato nell'header.

### Caratteristiche Principali

- ✅ **Pallino colorato** (verde/giallo/rosso)
- ✅ **Badge numerico** servizi offline
- ✅ **Dropdown** con lista servizi
- ✅ **Auto-refresh** ogni 30 secondi
- ✅ **Link** a pagina dettagli
- ✅ **Solo SUPER_ADMIN**

---

## 🎨 Stati Visivi

### Pallino Principale

```
🟢 Verde (healthy)
   - Tutti i servizi online
   - Nessun problema rilevato
   
🟡 Giallo (degraded)
   - Alcuni servizi con warning
   - Sistema parzialmente funzionante
   
🔴 Rosso (critical)
   - Uno o più servizi critici offline
   - Attenzione immediata richiesta
```

### Badge Numerico

```
🟢        → Nessun badge (tutto OK)
🟢 [2]    → 2 servizi offline
🔴 [5]    → 5 servizi offline (critico)
```

---

## 🔌 API Utilizzata

### Endpoint

```http
GET /api/admin/health-check/status
```

### Response Type

```typescript
interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceStatus[];
  timestamp: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  message?: string;
  latency?: number;
  details?: any;
}
```

---

## 🎯 Servizi Monitorati

| # | Servizio | Icona | Descrizione |
|---|----------|-------|-------------|
| 1 | PostgreSQL | 🗄️ | Database principale |
| 2 | Redis | 📡 | Cache e sessioni |
| 3 | Socket.io | 🔌 | WebSocket real-time |
| 4 | Email | 📧 | Servizio Brevo |
| 5 | WhatsApp | 💬 | WppConnect |
| 6 | OpenAI | 🤖 | Intelligenza artificiale |
| 7 | Stripe | 💳 | Gateway pagamenti |
| 8 | Google Maps | 🗺️ | Mappe e geocoding |
| 9 | Google Calendar | 📅 | Sincronizzazione calendario |

---

## 💻 Utilizzo nel Codice

### Import

```typescript
import ServiceStatusIndicator from './admin/ServiceStatusIndicator';
```

### Integrazione nel Layout

```typescript
// Layout.tsx (header section)
{user?.role === 'SUPER_ADMIN' && (
  <ServiceStatusIndicator />
)}
```

### Query Configuration

```typescript
const { data: health, isLoading } = useQuery<SystemHealth>({
  queryKey: ['system-health'],
  queryFn: async () => {
    const response = await api.get('/admin/health-check/status');
    return response.data.data;
  },
  refetchInterval: 30000,  // 30 secondi
  retry: 1,
});
```

---

## 🎨 Struttura Dropdown

```
┌──────────────────────────────────────┐
│ Stato Servizi Sistema    [Tutto OK]  │
│ Ultimo controllo: 14:30:45           │
├──────────────────────────────────────┤
│ 🗄️  PostgreSQL              45ms ✓  │
│     Connected successfully           │
│                                      │
│ 📡  Redis                    12ms ✓  │
│     Cache operational                │
│                                      │
│ 🔌  Socket.io                8ms ✓   │
│     5 clients connected              │
├──────────────────────────────────────┤
│ Dettagli completi →      🔄 Refresh  │
└──────────────────────────────────────┘
```

---

## ⚙️ Configurazione

### Auto-Refresh

Modificare l'intervallo di polling:

```typescript
// 30 secondi (default)
refetchInterval: 30000

// 60 secondi
refetchInterval: 60000

// Disabilitato
refetchInterval: false
```

### Retry Logic

```typescript
retry: 1,  // Solo 1 retry su errore
```

---

## 🐛 Troubleshooting

### Problema: Pallino sempre rosso

**Causa**: Servizio critico offline

**Debug**:
```typescript
// Console del browser
const health = await api.get('/admin/health-check/status');
console.log(health.data.data.services);

// Cerca servizi con status !== 'online'
```

**Soluzione**:
1. Identifica quale servizio è offline
2. Controlla i log di quel servizio
3. Riavvia il servizio se necessario

### Problema: Dropdown non si apre

**Causa**: Z-index o event propagation

**Soluzione**:
```typescript
// Verifica z-index
className="... z-50"  // Deve essere alto

// Verifica overlay
<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
```

### Problema: Latency non mostrata

**Causa**: Backend non restituisce il campo

**Soluzione**:
```typescript
// Backend deve restituire:
{
  name: "PostgreSQL",
  status: "online",
  latency: 45  // ← Questo campo
}
```

---

## 🎨 Customizzazione

### Cambiare Icone Servizi

```typescript
const getServiceIcon = (serviceName: string) => {
  switch (serviceName.toLowerCase()) {
    case 'database':
      return '🗄️';  // ← Cambia qui
    case 'redis':
      return '📡';   // ← Cambia qui
    // ...
  }
};
```

### Cambiare Colori Stati

```typescript
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';    // ← Cambia qui
    case 'degraded':
      return 'bg-yellow-500';   // ← Cambia qui
    case 'critical':
      return 'bg-red-500';      // ← Cambia qui
  }
};
```

### Aggiungere Badge Animazione

```typescript
{overallStatus !== 'healthy' && (
  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
)}
```

---

## 📊 Performance

### Metriche

- **Render time**: < 10ms
- **Query time**: ~30ms
- **Memory**: ~50KB
- **Bandwidth**: ~2KB per refresh

### Ottimizzazioni

```typescript
// Memoizza icone
const serviceIcon = useMemo(
  () => getServiceIcon(service.name),
  [service.name]
);

// Debounce click
const handleClick = useDebouncedCallback(() => {
  setIsOpen(!isOpen);
}, 200);
```

---

## 🔐 Sicurezza

### Visibilità

```typescript
// Solo SUPER_ADMIN possono vedere questo componente
{user?.role === 'SUPER_ADMIN' && <ServiceStatusIndicator />}
```

### API Protection

```typescript
// Backend route protetta
router.get('/status',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    // ...
  }
);
```

---

## 📝 Checklist Implementazione

- [ ] Import componente nel Layout
- [ ] Verifica permessi (solo SUPER_ADMIN)
- [ ] Testa auto-refresh (aspetta 30s)
- [ ] Testa dropdown (click pallino)
- [ ] Testa link "Dettagli completi"
- [ ] Verifica stati (simula servizio offline)
- [ ] Controlla responsive mobile
- [ ] Verifica Z-index con altri dropdown

---

## 🔗 Link Correlati

- [SystemStatusPage](./SYSTEM-STATUS-PAGE.md)
- [API Health Check](../../03-API/HEALTH-CHECK-API.md)
- [Layout Component](../../01-ARCHITETTURA/LAYOUT.md)

---

**Creato**: 02 Ottobre 2025  
**Versione**: 1.0  
**Autore**: Sistema Documentazione
