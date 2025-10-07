# 🔧 SISTEMA WHATSAPP - DOCUMENTAZIONE TECNICA

**Per Sviluppatori**  
**Versione**: 1.0.0  
**Data**: 10 Gennaio 2025

---

## 📐 ARCHITETTURA IMPLEMENTAZIONE

### Pattern Architetturale
```
Frontend (React) → API Client (Axios) → Backend Routes → Services → Evolution API
                                              ↓
                                        ResponseFormatter
                                              ↓
                                          Database
```

### Principi Implementati
1. **Separation of Concerns**: Routes gestiscono HTTP, Services gestiscono logica
2. **ResponseFormatter**: SEMPRE nelle routes, MAI nei services
3. **Error Handling**: Try-catch a ogni livello con logging appropriato
4. **Configuration**: Caricamento lazy da database con fallback su .env
5. **State Management**: React Query per server state, useState per UI state

---

## 🔌 BACKEND IMPLEMENTATION

### File Struttura
```
backend/src/
├── routes/
│   └── whatsapp.routes.ts    # 19 endpoints, 1078 righe
├── services/
│   └── (WhatsApp logic nei routes per ora)
├── middleware/
│   └── auth.ts               # JWT authentication
└── utils/
    ├── responseFormatter.ts  # Standardizzazione risposte
    └── logger.ts            # Winston logging
```

### Route Handler Pattern
```typescript
// Pattern standard implementato
router.post('/endpoint', authenticate, ensureConfigLoaded, async (req: Request, res: Response) => {
  try {
    // 1. Validazione input
    const { param1, param2 } = req.body;
    
    if (!param1) {
      return res.status(400).json(ResponseFormatter.error(
        'Param1 is required',
        'VALIDATION_ERROR'
      ));
    }
    
    // 2. Business logic
    const result = await evolutionApi!.post('/evolution/endpoint', {
      // payload
    });
    
    // 3. Response formatting
    return res.json(ResponseFormatter.success(
      result.data,
      'Operation successful'
    ));
    
  } catch (error: any) {
    logger.error('Operation failed:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.response?.data?.message || 'Operation failed',
      'OPERATION_ERROR'
    ));
  }
});
```

### Configuration Loading
```typescript
// Middleware: ensureConfigLoaded
const ensureConfigLoaded = async (req: Request, res: Response, next: NextFunction) => {
  if (!EVOLUTION_CONFIG.loaded) {
    try {
      // 1. Prova a caricare da database
      const configs = await prisma.systemConfig.findMany({
        where: { key: { startsWith: 'whatsapp_' } }
      });
      
      // 2. Mappa configurazioni
      configs.forEach(config => {
        if (config.key === 'whatsapp_evolution_url') {
          EVOLUTION_CONFIG.url = config.value;
        }
        // etc...
      });
      
      // 3. Fallback su environment
      EVOLUTION_CONFIG.url = EVOLUTION_CONFIG.url || process.env.EVOLUTION_API_URL;
      
      // 4. Crea client Axios
      evolutionApi = axios.create({
        baseURL: EVOLUTION_CONFIG.url,
        headers: {
          'apikey': EVOLUTION_CONFIG.apikey,
          'Content-Type': 'application/json'
        }
      });
      
      EVOLUTION_CONFIG.loaded = true;
    } catch (error) {
      // Handle error
    }
  }
  next();
};
```

### Verifica Connessione Affidabile
```typescript
// Metodo primario: usa whatsappNumbers API
// Se funziona, WhatsApp è sicuramente connesso
const checkResponse = await evolutionApi!.post(
  `/chat/whatsappNumbers/${EVOLUTION_CONFIG.instance}`,
  { numbers: [testNumber] }
);

if (checkResponse.data) {
  isConnected = true; // Connesso al 100%
}

// Fallback: connectionState (meno affidabile)
if (!isConnected) {
  const response = await evolutionApi!.get(
    `/instance/connectionState/${EVOLUTION_CONFIG.instance}`
  );
  isConnected = response.data?.instance?.state === 'open';
}
```

### Formattazione Numeri
```typescript
// Auto-formato per numeri italiani
let formattedNumber = recipient.replace(/\D/g, ''); // Rimuovi non-numerici

// Aggiungi +39 se necessario
if (!formattedNumber.startsWith('39') && formattedNumber.length <= 10) {
  formattedNumber = '39' + formattedNumber;
}
```

---

## 💻 FRONTEND IMPLEMENTATION

### File Struttura
```
src/
├── pages/admin/
│   └── WhatsAppAdmin.tsx    # Componente principale, 1289 righe
├── services/
│   └── api.ts              # Client Axios configurato
└── hooks/
    └── (custom hooks futuri)
```

### Component Structure
```typescript
export default function WhatsAppAdminPage() {
  // 1. State Management
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'manage' | 'send' | 'settings'>('status');
  
  // 2. Effects
  useEffect(() => {
    loadStatus();
    loadInstances();
    loadApiInfo();
  }, []);
  
  // 3. Polling connessione
  useEffect(() => {
    if (currentInstance) {
      const interval = setInterval(() => {
        checkConnectionState();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentInstance]);
  
  // 4. Functions
  const loadStatus = async () => { /* ... */ };
  const sendMessage = async () => { /* ... */ };
  
  // 5. Render
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Tabs */}
      {/* Tab Content */}
    </div>
  );
}
```

### API Client Pattern
```typescript
// services/api.ts
const api = axios.create({
  baseURL: 'http://localhost:3200/api',  // ⚠️ /api già incluso!
  headers: { 'Content-Type': 'application/json' }
});

// Uso corretto
api.get('/whatsapp/status')      // ✅ Risulta in /api/whatsapp/status
api.post('/whatsapp/send', data) // ✅ Risulta in /api/whatsapp/send

// Errore comune
api.get('/api/whatsapp/status')  // ❌ Risulta in /api/api/whatsapp/status
```

### Header Display Logic
```tsx
{/* Mostra sempre istanza, numero e nome quando disponibili */}
<div className="flex items-center gap-3 mt-1">
  {currentInstance && (
    <p className="text-sm text-blue-600">
      <KeyIcon className="h-4 w-4 inline mr-1" />
      Istanza: <span className="font-semibold">{currentInstance}</span>
    </p>
  )}
  {status?.connected && status?.phoneNumber && (
    <span className="flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-sm">
      <PhoneIcon className="h-3 w-3 mr-1" />
      <span className="font-semibold">{status.phoneNumber}</span>
    </span>
  )}
  {status?.profileName && (
    <span className="text-sm text-gray-700 font-medium">
      {status.profileName}
    </span>
  )}
</div>
```

### Tab System Implementation
```tsx
// State per tabs
const [activeTab, setActiveTab] = useState<'status' | 'manage' | 'send' | 'settings'>('status');

// Navigation
<nav className="-mb-px flex space-x-8">
  {['status', 'manage', 'send', 'settings'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={activeTab === tab ? 'border-blue-500' : 'border-transparent'}
    >
      {/* Icon + Label */}
    </button>
  ))}
</nav>

// Content rendering
{activeTab === 'status' && <StatusContent />}
{activeTab === 'manage' && <ManageContent />}
// etc...
```

---

## 🔐 SICUREZZA

### Authentication
- Tutti gli endpoint protetti da middleware `authenticate`
- JWT token richiesto in header Authorization
- Verifica ruolo ADMIN per accesso WhatsApp

### API Key Management
- API key Evolution salvata criptata nel database
- Non esposta mai al frontend
- Rotazione periodica consigliata

### Input Validation
```typescript
// Validazione numero telefono
const number = recipient.replace(/\D/g, ''); // Solo numeri
if (!number || number.length < 10) {
  throw new Error('Invalid number');
}

// Validazione messaggio
if (message.length > 4096) {
  throw new Error('Message too long');
}
```

### Rate Limiting
```typescript
// Da implementare
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // max 30 messaggi per minuto
  message: 'Too many messages'
});
```

---

## 🐛 DEBUG & LOGGING

### Backend Logging
```typescript
import logger from '../utils/logger';

// Livelli di log
logger.info('Operation started:', { data });
logger.error('Operation failed:', error);
logger.warn('Unusual condition:', warning);
logger.debug('Debug info:', debugData);
```

### Frontend Debugging
```javascript
// Console logging per debug
console.log('Status response:', response.data);

// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

### Evolution API Debug
```bash
# Test diretto Evolution API
curl http://37.27.89.35:8080/instance/connectionState/assistenza \
  -H "apikey: B6B615D7C87B2C8H-8CAC-BD4D-AJ97-F2JBE638G78D"

# Response esempio
{
  "instance": {
    "instanceName": "assistenza",
    "state": "open"
  }
}
```

---

## 🔄 STATE MANAGEMENT

### Frontend State Types
```typescript
// Stato connessione
interface ConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'connecting' | 'close';
  };
}

// Info istanza
interface InstanceInfo {
  instanceName: string;
  instanceId?: string;
  owner?: string;
  profileName?: string;
  status?: string;
  state?: string;
}

// Settings
interface Settings {
  rejectCall: boolean;
  msgCall: string;
  groupsIgnore: boolean;
  alwaysOnline: boolean;
  readMessages: boolean;
  readStatus: boolean;
  syncFullHistory: boolean;
}
```

### Sync Strategies
1. **Polling**: Ogni 5 secondi per stato connessione
2. **On-demand**: Click "Aggiorna" per refresh manuale
3. **After-action**: Dopo ogni operazione (send, connect, etc.)
4. **WebSocket**: (Futuro) Real-time updates

---

## 🚀 DEPLOYMENT NOTES

### Environment Setup
```bash
# Development
npm run dev         # Frontend :5193
cd backend && npm run dev  # Backend :3200

# Production
npm run build       # Build frontend
cd backend && npm run build  # Build backend
NODE_ENV=production npm start
```

### Docker Configuration
```dockerfile
# Dockerfile per backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3200
CMD ["npm", "start"]
```

### Nginx Proxy
```nginx
# WhatsApp admin route
location /admin/whatsapp {
  proxy_pass http://localhost:5193;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
}

# API routes
location /api/whatsapp {
  proxy_pass http://localhost:3200;
  proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 📦 DEPENDENCIES

### Backend
```json
{
  "axios": "^1.6.0",        // HTTP client per Evolution API
  "express": "^4.18.0",     // Web server
  "prisma": "@latest",      // ORM database
  "@types/express": "^4.17.0",
  "winston": "^3.11.0"      // Logging
}
```

### Frontend
```json
{
  "react": "^18.3.1",
  "@tanstack/react-query": "^5.0.0",  // Server state
  "axios": "^1.6.0",                   // API client
  "react-hot-toast": "^2.4.0",        // Notifiche
  "@heroicons/react": "^2.0.0",       // Icone
  "tailwindcss": "^3.4.0"             // Styling
}
```

---

## 🔮 FUTURE IMPROVEMENTS

### Performance
- [ ] Implementare caching Redis per stato connessione
- [ ] Batch API calls dove possibile
- [ ] Lazy loading per lista istanze
- [ ] Virtual scrolling per messaggi

### Code Quality
- [ ] Estrarre services dal routes file
- [ ] Aggiungere unit tests
- [ ] Implementare error boundaries React
- [ ] TypeScript strict mode

### Features
- [ ] WebSocket per real-time updates
- [ ] Queue system per invio messaggi
- [ ] Retry logic automatico
- [ ] Backup/restore conversazioni

### Monitoring
- [ ] Sentry per error tracking
- [ ] Analytics invio messaggi
- [ ] Health checks automatici
- [ ] Alert su disconnessione

---

## 📚 RISORSE

### Evolution API
- Docs: https://doc.evolution-api.com/v2
- Manager: http://37.27.89.35:8080/manager
- Swagger: http://37.27.89.35:8080/docs

### Baileys Library
- GitHub: https://github.com/WhiskeySockets/Baileys
- Docs: https://whiskeysockets.github.io/

### Project
- Repo: https://github.com/241luca/Richiesta-Assistenza
- Issues: GitHub Issues
- Wiki: GitHub Wiki

---

**Ultimo aggiornamento**: 10 Gennaio 2025  
**Maintainer**: Team Sviluppo LM Tecnologie
