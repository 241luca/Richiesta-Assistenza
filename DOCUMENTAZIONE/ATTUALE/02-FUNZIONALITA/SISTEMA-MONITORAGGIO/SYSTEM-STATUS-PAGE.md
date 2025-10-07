# 📄 SystemStatusPage - Guida Pagina

**File**: `/src/pages/admin/SystemStatusPage.tsx`  
**Route**: `/admin/system-status`  
**Versione**: 1.0  
**Data**: 02 Ottobre 2025

---

## 📋 Overview

La **SystemStatusPage** è una dashboard completa che mostra in dettaglio lo stato di tutti i servizi del sistema, con statistiche hardware e descrizioni tecniche.

### Caratteristiche Principali

- ✅ **Banner stato generale** (verde/giallo/rosso)
- ✅ **3 Card statistiche** (CPU, Memoria, Sistema)
- ✅ **Lista servizi dettagliata** (9 servizi monitorati)
- ✅ **4 info card** per servizio
- ✅ **Descrizione tecnica** ogni servizio
- ✅ **Auto-refresh** configurabile (30s default)
- ✅ **ADMIN e SUPER_ADMIN**

---

## 🎯 Accesso alla Pagina

### Metodo 1: Dal Service Indicator

1. Clicca sul **pallino verde/giallo/rosso** nell'header
2. Click "**Dettagli completi →**"
3. Apre `/admin/system-status`

### Metodo 2: Dal Menu Sidebar

1. Sidebar → **Tools e Utility**
2. Click "**System Status**" (badge NEW)
3. Apre `/admin/system-status`

### Metodo 3: URL Diretto

```
http://localhost:5193/admin/system-status
```

---

## 🎨 Struttura Pagina

### 1. Header con Controlli

```
┌───────────────────────────────────────────────┐
│ Stato Sistema                                 │
│ Monitoraggio in tempo reale di tutti i...    │
│                                               │
│  ☑ Auto-refresh (30s)   [Aggiorna ↻]        │
└───────────────────────────────────────────────┘
```

**Elementi**:
- Titolo e descrizione
- Checkbox auto-refresh toggle
- Pulsante refresh manuale (icona rotante)

---

### 2. Banner Stato Generale

```
┌───────────────────────────────────────────────┐
│ ✓ Sistema Operativo                           │
│ 8 di 9 servizi online                         │
└───────────────────────────────────────────────┘
```

**Colori**:
- 🟢 **Verde** (healthy): Tutti servizi online
- 🟡 **Giallo** (degraded): Alcuni servizi warning
- 🔴 **Rosso** (critical): Servizi critici offline

---

### 3. Card Statistiche Sistema

#### CPU Card

```
┌──────────────────────┐
│ CPU              🔧  │
├──────────────────────┤
│ Modello: Intel i7    │
│ Core: 8              │
│ Utilizzo: 45%        │
│ ████████░░ 45%       │
└──────────────────────┘
```

**Info Visualizzate**:
- Modello CPU (troncato a 20 char)
- Numero core
- Percentuale utilizzo
- Barra progresso colorata

**Colori Barra**:
- 🟢 Verde: < 60%
- 🟡 Giallo: 60-80%
- 🔴 Rosso: > 80%

---

#### Memoria Card

```
┌──────────────────────┐
│ Memoria          📊  │
├──────────────────────┤
│ Totale: 16 GB        │
│ Usata: 8 GB          │
│ Libera: 8 GB         │
│ ████████░░ 50%       │
└──────────────────────┘
```

**Info Visualizzate**:
- Totale RAM (formattata: GB)
- RAM usata
- RAM libera
- Barra progresso colorata

---

#### Sistema Card

```
┌──────────────────────┐
│ Sistema          💻  │
├──────────────────────┤
│ OS: Darwin           │
│ Versione: 23.5.0     │
│ Hostname: macbook... │
│ Uptime: 5g 3h 25m    │
└──────────────────────┘
```

**Info Visualizzate**:
- Tipo OS (Darwin/Linux/Windows)
- Versione OS
- Hostname
- Uptime formattato (giorni, ore, minuti)

---

### 4. Lista Servizi Dettagliata

Ogni servizio mostra:

```
┌────────────────────────────────────────────────┐
│ 🗄️  PostgreSQL                  [45ms] ✓ Online│
│                                                │
│ Database relazionale principale che memorizza  │
│ tutti i dati dell'applicazione. Monitora...   │
│                                                │
│ ┌──────────┬──────────┬──────────┬──────────┐ │
│ │   Tipo   │   Pool   │   Perf   │  Stato   │ │
│ ├──────────┼──────────┼──────────┼──────────┤ │
│ │PostgreSQL│ 2-20 con.│Eccellente│  Attivo  │ │
│ └──────────┴──────────┴──────────┴──────────┘ │
│                                                │
│ ℹ️ Database relazionale principale che        │
│    memorizza tutti i dati dell'applicazione.  │
│    Monitora latenza query e connessioni...    │
└────────────────────────────────────────────────┘
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
  systemStats: {
    cpu: {
      model: string;
      cores: number;
      usage: number;
      loadAvg: number[];
    };
    memory: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
    os: {
      platform: string;
      type: string;
      release: string;
      hostname: string;
      uptime: number;
    };
  };
  timestamp: string;
}
```

---

## 💻 Codice Principale

### Query Configuration

```typescript
const { data: health, isLoading, refetch } = useQuery<SystemHealth>({
  queryKey: ['system-health-detailed'],
  queryFn: async () => {
    const response = await api.get('/admin/health-check/status');
    return response.data.data;
  },
  refetchInterval: autoRefresh ? 30000 : false,
  retry: 1,
});
```

### Auto-Refresh Toggle

```typescript
const [autoRefresh, setAutoRefresh] = useState(true);

<label className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={autoRefresh}
    onChange={(e) => setAutoRefresh(e.target.checked)}
    className="rounded border-gray-300"
  />
  <span>Auto-refresh (30s)</span>
</label>
```

---

## 🎨 Helper Functions

### getServiceDetails

Restituisce le 4 card informative per ogni servizio:

```typescript
const getServiceDetails = (service: ServiceStatus) => {
  const name = service.name.toLowerCase();
  
  if (name.includes('postgresql')) {
    return [
      { label: 'Tipo', value: 'PostgreSQL' },
      { label: 'Pool', value: '2-20 connessioni' },
      { label: 'Performance', value: '...' },
      { label: 'Stato', value: '...' }
    ];
  }
  // ... altri servizi
};
```

### getServiceDescription

Restituisce descrizione tecnica dettagliata:

```typescript
const getServiceDescription = (serviceName: string): string => {
  const name = serviceName.toLowerCase();
  
  if (name.includes('postgresql')) {
    return 'Database relazionale principale che memorizza tutti i dati dell\'applicazione. Monitora latenza query e connessioni attive.';
  }
  // ... altri servizi
};
```

### formatBytes

Formatta bytes in unità leggibili:

```typescript
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
```

### formatUptime

Formatta secondi in giorni/ore/minuti:

```typescript
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}g ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
```

---

## 📊 Dettagli Servizi Implementati

### PostgreSQL
- **Tipo**: PostgreSQL
- **Pool**: 2-20 connessioni
- **Performance**: Eccellente/Buona/Lenta (basato su latency)
- **Stato**: Attivo/Offline

### Redis
- **Tipo**: Cache Redis
- **Versione**: ioredis
- **Uso**: Session + Cache
- **TTL Default**: 5 minuti

### WebSocket (Socket.io)
- **Tipo**: Socket.io
- **Versione**: v4.8+
- **Client**: Numero connessi (estratto da message)
- **Clustering**: Attivo

### Email (Brevo)
- **Provider**: Brevo
- **Tipo**: SMTP + API
- **Rate Limit**: 300/giorno
- **Templates**: 20+

### WhatsApp (WppConnect)
- **Tipo**: WppConnect
- **Versione**: v1.37+
- **Multidevice**: Supportato
- **QR Refresh**: 30s

### OpenAI
- **Modello**: GPT-4/3.5
- **Dual Config**: Pro + Client
- **Embeddings**: text-embed-3
- **Rate Limit**: 100 req/day

### Stripe
- **Tipo**: Payment Gateway
- **Webhook**: Configurato
- **API Version**: Latest
- **SCA**: 3D Secure

### Google Maps
- **API**: Maps Platform
- **Servizi**: Places + Geocoding
- **Cache**: 24h Redis
- **Quota**: $200/mese

### Google Calendar
- **API**: Calendar v3
- **OAuth**: Configurato
- **Sync**: Bidirezionale
- **Events**: Illimitati

---

## 🔧 Configurazione

### Cambiare Intervallo Auto-Refresh

```typescript
// Default: 30 secondi
refetchInterval: autoRefresh ? 30000 : false

// Cambia a 60 secondi
refetchInterval: autoRefresh ? 60000 : false

// Cambia a 15 secondi (non raccomandato)
refetchInterval: autoRefresh ? 15000 : false
```

### Aggiungere Nuovo Servizio

1. **Backend**: Aggiungi check in health-check service
2. **Frontend**: Aggiungi dettagli e descrizione

```typescript
// getServiceDetails
if (name.includes('nuovo-servizio')) {
  return [
    { label: 'Info1', value: 'Valore1' },
    { label: 'Info2', value: 'Valore2' },
    { label: 'Info3', value: 'Valore3' },
    { label: 'Info4', value: 'Valore4' }
  ];
}

// getServiceDescription
if (name.includes('nuovo-servizio')) {
  return 'Descrizione dettagliata del nuovo servizio...';
}
```

---

## 🐛 Troubleshooting

### Problema: Redirect alla dashboard

**Causa**: Route non nel menu di navigazione

**Soluzione**:
```typescript
// Layout.tsx - Aggiungi al menu SUPER_ADMIN
{ name: 'System Status', href: '/admin/system-status', icon: ServerIcon }
```

### Problema: Statistiche sistema mancanti

**Causa**: Backend non restituisce systemStats

**Verifica Backend**:
```typescript
// healthCheck.service.ts
systemStats: {
  cpu: { /* ... */ },
  memory: { /* ... */ },
  os: { /* ... */ }
}
```

### Problema: Descrizione servizio generica

**Causa**: Nome servizio non riconosciuto

**Debug**:
```typescript
console.log('Service name:', service.name.toLowerCase());

// Verifica che corrisponda al case in getServiceDescription
```

---

## 🎨 Customizzazione

### Cambiare Colori Banner

```typescript
// Banner verde (healthy)
className="bg-green-50 border-green-200"

// Cambia a:
className="bg-emerald-50 border-emerald-200"
```

### Aggiungere Grafici

```typescript
import { LineChart, Line, XAxis, YAxis } from 'recharts';

// Aggiungi dopo le 3 card
<div className="col-span-3">
  <LineChart data={historicalData} width={800} height={200}>
    <Line type="monotone" dataKey="cpu" stroke="#8884d8" />
    <XAxis dataKey="timestamp" />
    <YAxis />
  </LineChart>
</div>
```

### Export PDF

```typescript
import jsPDF from 'jspdf';

const exportPDF = () => {
  const doc = new jsPDF();
  doc.text('System Status Report', 10, 10);
  doc.text(`Overall: ${overallStatus}`, 10, 20);
  // ... aggiungi altri dati
  doc.save('system-status.pdf');
};

// Aggiungi pulsante
<button onClick={exportPDF}>Export PDF</button>
```

---

## 📊 Performance

### Metriche

- **Initial Load**: < 500ms
- **Render Time**: < 50ms
- **Query Time**: ~30-50ms
- **Memory**: ~200KB
- **Auto-Refresh**: Ogni 30s

### Ottimizzazioni

```typescript
// Memoizza dettagli servizi
const serviceDetails = useMemo(
  () => services.map(s => ({
    ...s,
    details: getServiceDetails(s),
    description: getServiceDescription(s.name)
  })),
  [services]
);
```

---

## 📝 Checklist Implementazione

- [ ] Verifica route in routes.tsx
- [ ] Aggiungi voce al menu Layout
- [ ] Testa banner stato (simula servizio offline)
- [ ] Verifica card CPU/Memoria/Sistema
- [ ] Controlla dettagli per ogni servizio
- [ ] Testa auto-refresh (aspetta 30s)
- [ ] Testa pulsante refresh manuale
- [ ] Verifica responsive mobile
- [ ] Controlla permessi (ADMIN + SUPER_ADMIN)

---

## 🔗 Link Correlati

- [ServiceStatusIndicator](./SERVICE-STATUS-INDICATOR.md)
- [Health Check API](../../03-API/HEALTH-CHECK-API.md)
- [System Monitoring Guide](../../04-GUIDE/SYSTEM-MONITORING.md)

---

**Creato**: 02 Ottobre 2025  
**Versione**: 1.0  
**Autore**: Sistema Documentazione
