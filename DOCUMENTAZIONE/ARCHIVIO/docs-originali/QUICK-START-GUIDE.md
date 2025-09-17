# 🚀 QUICK START GUIDE
## Sistema di Richiesta Assistenza

Ultimo aggiornamento: **6 Gennaio 2025**

---

## ⚡ AVVIO RAPIDO (5 minuti)

### 1️⃣ Prerequisiti
```bash
# Verifica installazioni
node --version      # Richiesto: v18+
npm --version       # Richiesto: v8+
psql --version      # Richiesto: PostgreSQL 14+
redis-cli --version # Richiesto per queue (opzionale in dev)
```

### 2️⃣ Setup Iniziale
```bash
# 1. Clona il repository
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd richiesta-assistenza

# 2. Installa dipendenze Frontend
npm install

# 3. Installa dipendenze Backend
cd backend
npm install
cd ..

# 4. Copia e configura ambiente
cp .env.example .env
# Modifica .env con i tuoi dati
```

### 3️⃣ Database Setup
```bash
# 1. Crea database PostgreSQL
createdb assistenza_db

# 2. Aggiorna DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/assistenza_db"

# 3. Esegui migrazioni
cd backend
npx prisma migrate dev
npx prisma db seed  # (opzionale) Dati di test
cd ..
```

### 4️⃣ Avvio Sviluppo
```bash
# Terminal 1 - Backend (porta 3200)
cd backend
npm run dev

# Terminal 2 - Frontend (porta 5173)
npm run dev

# Terminal 3 - Redis (se usi queue)
redis-server
```

### 5️⃣ Accesso
```
Frontend: http://localhost:5173
Backend API: http://localhost:3200/api
Swagger Docs: http://localhost:3200/api-docs (se configurato)
```

---

## 🔑 CREDENZIALI DI TEST

### Account Demo
```
CLIENTE:
Email: cliente@test.com
Password: password123

PROFESSIONISTA:
Email: professionista@test.com
Password: password123

ADMIN:
Email: admin@test.com
Password: password123
```

---

## 📁 STRUTTURA PROGETTO ESSENZIALE

```
richiesta-assistenza/
│
├── backend/              # 🔧 Backend API (Express + Prisma)
│   ├── src/             # Codice sorgente TypeScript
│   ├── prisma/          # Schema database e migrazioni
│   └── package.json     # Dipendenze backend
│
├── src/                 # 🎨 Frontend React
│   ├── components/      # Componenti UI
│   ├── pages/          # Pagine applicazione
│   ├── services/       # API client services
│   └── App.tsx         # Component principale
│
├── .env                # ⚙️ Configurazione ambiente
├── package.json        # 📦 Dipendenze frontend
└── vite.config.ts      # ⚡ Config Vite
```

---

## 🛠️ COMANDI UTILI

### Development
```bash
# Frontend
npm run dev           # Start development server
npm run build        # Build production
npm run preview      # Preview production build

# Backend
cd backend
npm run dev          # Start dev con nodemon
npm run build        # Compila TypeScript
npm run start        # Start production

# Database
npm run db:migrate   # Esegui migrazioni
npm run db:seed      # Popola database test
npm run db:studio    # Prisma Studio GUI
```

### Testing
```bash
# Frontend tests
npm run test         # Run tests
npm run test:ui      # Test con UI

# Backend tests
cd backend
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

### Utility
```bash
# Check TypeScript
npm run type-check

# Lint e Format
npm run lint
npm run format

# Clean
npm run clean       # Pulisce node_modules e dist
```

---

## 🔄 WORKFLOW SVILUPPO

### 1. Creare una nuova funzionalità

#### Backend (API)
```typescript
// 1. Aggiungi route in backend/src/routes/feature.routes.ts
router.get('/feature', authenticate, featureController.getFeature);

// 2. Crea controller in backend/src/controllers/feature.controller.ts
export const getFeature = async (req, res) => {
  const data = await featureService.getFeature();
  res.json(ResponseFormatter.success(data));
};

// 3. Crea service in backend/src/services/feature.service.ts
export const getFeature = async () => {
  return await prisma.feature.findMany();
};
```

#### Frontend (React)
```typescript
// 1. Crea API service in src/services/feature.api.ts
export const featureApi = {
  getFeatures: () => apiClient.get('/features'),
  createFeature: (data) => apiClient.post('/features', data)
};

// 2. Crea componente in src/components/feature/Feature.tsx
export function Feature() {
  const { data, isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: featureApi.getFeatures
  });
  
  return <div>{/* UI */}</div>;
}

// 3. Aggiungi route in src/routes.tsx
<Route path="/features" element={<Feature />} />
```

### 2. Modificare il Database

```bash
# 1. Modifica schema in backend/prisma/schema.prisma
model NewTable {
  id    String @id @default(cuid())
  name  String
  // etc...
}

# 2. Crea e applica migrazione
cd backend
npx prisma migrate dev --name add_new_table

# 3. Genera client Prisma
npx prisma generate
```

---

## 🐛 TROUBLESHOOTING RAPIDO

### ❌ Porta già in uso
```bash
# Kill processo su porta 3200
lsof -i :3200 && kill -9 $(lsof -t -i :3200)

# Kill processo su porta 5173
lsof -i :5173 && kill -9 $(lsof -t -i :5173)
```

### ❌ Database connection error
```bash
# Verifica PostgreSQL attivo
sudo service postgresql status
sudo service postgresql start

# Test connessione
psql -U postgres -d assistenza_db
```

### ❌ CORS errors
```typescript
// Verifica CORS in backend/src/server.ts
app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true
}));
```

### ❌ 401 Unauthorized
```javascript
// Verifica token in localStorage
localStorage.getItem('accessToken')

// Clear e re-login
localStorage.clear()
window.location.href = '/login'
```

---

## 📊 ARCHITETTURA SEMPLIFICATA

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Frontend  │────▶│   Backend   │
│             │◀────│  (React)    │◀────│  (Express)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    ▼
                           │            ┌─────────────┐
                           └───────────▶│  PostgreSQL │
                                       └─────────────┘
```

### Flusso Richieste
1. **Browser** → Utente interagisce con UI
2. **Frontend** → React gestisce stato e UI
3. **API Call** → Axios chiama backend
4. **Backend** → Express processa richiesta
5. **Database** → Prisma query PostgreSQL
6. **Response** → Dati ritornano al frontend

---

## 🚀 DEPLOY VELOCE (Development)

### Con Docker (Opzionale)
```bash
# Build e avvia tutti i servizi
docker-compose up -d

# Stop tutti i servizi
docker-compose down
```

### Manuale
```bash
# 1. Build frontend
npm run build

# 2. Build backend
cd backend && npm run build

# 3. Serve frontend (porta 5173)
npx serve -s dist -l 5173 &

# 4. Start backend (porta 3200)
cd backend && npm start &
```

---

## 📱 FEATURES PRINCIPALI

### Per CLIENTI
- ✅ Crea richieste assistenza
- ✅ Ricevi preventivi
- ✅ Accetta professionisti
- ✅ Chat con professionisti
- ✅ Visualizza rapporti intervento

### Per PROFESSIONISTI
- ✅ Ricevi richieste assegnate
- ✅ Crea preventivi
- ✅ Gestisci calendario
- ✅ Crea rapporti intervento digitali
- ✅ Gestisci materiali e template

### Per ADMIN
- ✅ Gestisci utenti
- ✅ Assegna richieste
- ✅ Monitora sistema
- ✅ Configura categorie
- ✅ Visualizza analytics

---

## 🔗 LINK UTILI

### Documentazione
- [Documentazione Completa](./Docs/DOCUMENTAZIONE-TECNICA-COMPLETA.md)
- [API Reference](./Docs/API-REFERENCE.md)
- [Database Schema](./backend/prisma/schema.prisma)

### Tecnologie
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [TailwindCSS](https://tailwindcss.com)

---

## 💡 TIPS & TRICKS

### 🎯 Best Practices
```typescript
// ✅ Usa sempre apiClient per le chiamate API
import { apiClient } from '@/services/api';
const response = await apiClient.get('/endpoint');

// ✅ Usa React Query per server state
const { data, isLoading } = useQuery({
  queryKey: ['data-key'],
  queryFn: fetchFunction
});

// ✅ Usa ResponseFormatter nel backend
return res.json(ResponseFormatter.success(data, 'Message'));
```

### ⚡ Performance
- Usa `React.memo` per componenti pesanti
- Implementa pagination per liste lunghe
- Usa `select` in Prisma per limitare campi
- Abilita compression nel backend

### 🔒 Security
- Mai committare `.env`
- Valida sempre input utente
- Usa HTTPS in produzione
- Implementa rate limiting

---

## 🆘 SUPPORTO

### Problemi?
1. Controlla i logs: `backend/logs/`
2. Verifica `.env` configuration
3. Pulisci cache: `npm run clean`
4. Restart services

### Contatti
- **Email**: lucamambelli@lmtecnologie.it
- **GitHub**: [@241luca](https://github.com/241luca)

---

**Happy Coding! 🚀**

*Quick Start Guide v2.0 - Sistema Richiesta Assistenza*