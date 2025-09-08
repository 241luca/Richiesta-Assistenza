# Quick Reference - Sistema Richiesta Assistenza

## 🚀 Comandi Rapidi

### Sviluppo
```bash
npm run dev          # Avvia tutto (frontend + backend)
npm run dev:backend  # Solo backend (:3200)
npm run dev:frontend # Solo frontend (:5193)
redis-server        # Redis (necessario per sessioni)
```

### Database
```bash
npx prisma db push   # Applica schema al database
npx prisma generate  # Genera Prisma Client
npx prisma studio    # GUI database
```

### Testing
```bash
npm test            # Tutti i test
npm run test:unit   # Unit tests
npm run test:e2e    # E2E tests
```

## 🔑 Accessi Default

### Super Admin
- Email: `admin@assistenza.it`
- Password: `Admin123!@#`

### Test Users
- Cliente: `mario.rossi@email.com` / `Cliente123!`
- Professionista: `giuseppe.verdi@email.com` / `Professional123!`

## 📍 URL Principali

### Development
- Frontend: http://localhost:5193
- Backend: http://localhost:3200
- Prisma Studio: http://localhost:5555
- Bull Dashboard: http://localhost:3200/admin/queues

### API Endpoints Principali
```
POST   /api/auth/login           # Login
POST   /api/auth/register        # Registrazione
GET    /api/user                 # Profilo utente corrente
GET    /api/requests             # Lista richieste
POST   /api/requests             # Nuova richiesta
GET    /api/categories           # Categorie servizi
GET    /api/subcategories        # Sottocategorie
POST   /api/quotes               # Nuovo preventivo
GET    /api/notifications        # Notifiche utente
```

## 🎨 Componenti Frontend Principali

### CategorySelector (NUOVO v2.5)
```tsx
import CategorySelector from '@/components/categories/CategorySelector';

<CategorySelector
  value={{ category: selectedCategory, subcategory: selectedSubcategory }}
  onChange={handleCategoryChange}
  required
  onlyWithProfessionals={true}  // Filtra solo con professionisti
/>
```

### Form con React Hook Form
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

### Query con TanStack Query
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['requests'],
  queryFn: () => apiClient.get('/requests')
});
```

## 🔧 Pattern Importanti

### ResponseFormatter (OBBLIGATORIO!)
```typescript
// Backend - SEMPRE così
return res.json(ResponseFormatter.success(data, 'Success'));
return res.status(400).json(ResponseFormatter.error('Error', 'CODE'));
```

### Autenticazione Frontend
```tsx
import { useAuth } from '@/hooks/use-auth';

const { user, isAuthenticated, isLoading } = useAuth();
```

### Upload Files
```tsx
// Usa useRef per compatibilità Chrome Mac
const fileInputRef = useRef<HTMLInputElement>(null);

<button onClick={() => fileInputRef.current?.click()}>
  Upload File
</button>
<input ref={fileInputRef} type="file" hidden />
```

## 🗂 Struttura Database

### Tabelle Principali
- `User` - Utenti (clienti, professionisti, admin)
- `Category` - Categorie servizi
- `Subcategory` - Sottocategorie (NON ProfessionalSubcategory!)
- `AssistanceRequest` - Richieste assistenza
- `Quote` - Preventivi
- `Notification` - Notifiche
- `ProfessionalUserSubcategory` - Link professionista-sottocategoria

### Relazioni Chiave
```
User (1) -> (N) AssistanceRequest
AssistanceRequest (1) -> (N) Quote
Category (1) -> (N) Subcategory
Subcategory (N) <- -> (N) User (tramite ProfessionalUserSubcategory)
```

## 🐛 Troubleshooting Comune

### Errore: "Cannot find module"
```bash
npm install
npx prisma generate
```

### Database non connesso
```bash
# Verifica DATABASE_URL in .env
# Assicurati che PostgreSQL sia avviato
psql -U postgres -c "CREATE DATABASE assistenza;"
```

### Redis non connesso
```bash
redis-server  # Avvia Redis
```

### Categorie non visibili
```typescript
// Controlla parametro in CategorySelector
onlyWithProfessionals={false}  // Mostra tutte
onlyWithProfessionals={true}   // Solo con professionisti
```

## 📝 Note Versione 2.5

### Modifiche Sistema Categorie
- Dropdown al posto di griglia
- Filtro categorie con professionisti
- Ordine campi: categoria -> titolo -> descrizione
- Fix tabella `Subcategory` (non `ProfessionalSubcategory`)

### Debug Endpoints (solo development)
```
GET /api/debug/table-check        # Verifica tabelle DB
GET /api/debug/find-professionals # Categorie con professionisti
GET /api/debug/simple-check       # Dati base sistema
```

## 💡 Tips & Tricks

1. **Sempre fare backup prima di modifiche DB**
2. **Usare ResponseFormatter in TUTTI gli endpoint**
3. **Test su Chrome Mac per upload files**
4. **Verificare filtro categorie se vuote**
5. **Redis necessario per sessioni e code**

---

*Ultimo aggiornamento: 02 Settembre 2025 - v2.5.0*
