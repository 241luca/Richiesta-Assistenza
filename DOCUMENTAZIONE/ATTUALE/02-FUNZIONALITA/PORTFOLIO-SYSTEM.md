# 📸 SISTEMA PORTFOLIO LAVORI PRIMA/DOPO

**Data Creazione**: 04/01/2025  
**Versione**: 1.0.0  
**Autore**: Claude + Luca Mambelli  
**Stato**: ✅ IMPLEMENTATO

---

## 🎯 SCOPO

Il sistema Portfolio permette ai professionisti di mostrare i propri lavori attraverso foto "Prima" e "Dopo", creando una galleria visuale delle proprie competenze e realizzazioni.

---

## 📊 ARCHITETTURA

### Database (Prisma)

Il modello `Portfolio` è già presente nello schema con tutti i campi necessari:

```prisma
model Portfolio {
  id             String   @id @default(cuid())
  title          String
  description    String?  @db.Text
  
  // Immagini prima/dopo
  beforeImage    String   // URL foto PRIMA
  afterImage     String   // URL foto DOPO
  
  // Relazioni
  professionalId String
  professional   User     @relation("ProfessionalPortfolio", fields: [professionalId], references: [id])
  
  requestId      String?  @unique
  request        AssistanceRequest? @relation(fields: [requestId], references: [id])
  
  categoryId     String
  category       Category @relation(fields: [categoryId], references: [id])
  
  // Visibilità e statistiche
  isPublic       Boolean  @default(true)
  viewCount      Int      @default(0)
  
  // Dettagli aggiuntivi
  technicalDetails String? @db.Text
  materialsUsed    String? @db.Text
  duration         String?
  cost             Float?
  tags             String[]
  location         String?
  workCompletedAt  DateTime?
  
  // Timestamp
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 🔧 BACKEND

### Service (`portfolio.service.ts`)

**Percorso**: `/backend/src/services/portfolio.service.ts`

**Funzionalità principali**:
- `createPortfolio()` - Crea un nuovo portfolio
- `getProfessionalPortfolio()` - Ottiene tutti i portfolio di un professionista
- `getPortfolioById()` - Ottiene un singolo portfolio
- `updatePortfolio()` - Aggiorna un portfolio esistente
- `deletePortfolio()` - Elimina un portfolio
- `getPortfolioByCategory()` - Portfolio per categoria
- `searchPortfolio()` - Ricerca portfolio con filtri
- `getPopularPortfolios()` - Portfolio più visualizzati
- `getRecentPortfolios()` - Portfolio recenti
- `incrementViewCount()` - Incrementa visualizzazioni

### Routes (`portfolio.routes.ts`)

**Percorso**: `/backend/src/routes/portfolio.routes.ts`

**Endpoints disponibili**:

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/portfolio/professional/:professionalId` | Lista portfolio professionista | No |
| GET | `/api/portfolio/:id` | Singolo portfolio | No |
| GET | `/api/portfolio/category/:categoryId` | Portfolio per categoria | No |
| GET | `/api/portfolio/search` | Ricerca portfolio | No |
| GET | `/api/portfolio/popular` | Portfolio popolari | No |
| GET | `/api/portfolio/recent` | Portfolio recenti | No |
| POST | `/api/portfolio` | Crea nuovo portfolio | Sì (Professional) |
| PUT | `/api/portfolio/:id` | Aggiorna portfolio | Sì (Owner) |
| DELETE | `/api/portfolio/:id` | Elimina portfolio | Sì (Owner) |

---

## 🎨 FRONTEND

### Components

#### 1. **PortfolioGallery** (`PortfolioGallery.tsx`)

**Percorso**: `/src/components/portfolio/PortfolioGallery.tsx`

**Caratteristiche**:
- Visualizzazione foto Prima/Dopo con toggle
- Navigazione tra più portfolio con frecce
- Thumbnails per navigazione rapida
- Contatore visualizzazioni
- Dettagli espandibili
- Supporto per modifica/eliminazione (se owner)

**Props**:
```typescript
interface PortfolioGalleryProps {
  professionalId: string;
  editable?: boolean;
  onEdit?: (portfolio: Portfolio) => void;
  onDelete?: (portfolioId: string) => void;
}
```

#### 2. **AddPortfolioModal** (`AddPortfolioModal.tsx`)

**Percorso**: `/src/components/portfolio/AddPortfolioModal.tsx`

**Caratteristiche**:
- Form completo per aggiungere portfolio
- Preview immagini in tempo reale
- Validazione campi obbligatori
- Selezione categoria dinamica
- Gestione tags
- Upload tramite URL

**Props**:
```typescript
interface AddPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
}
```

---

## 🚀 UTILIZZO

### Integrazione nel Profilo Professionista

```tsx
import { PortfolioGallery, AddPortfolioModal } from '@/components/portfolio';

function ProfessionalProfile() {
  const [showAddModal, setShowAddModal] = useState(false);
  const professionalId = '...';
  const isOwner = user?.id === professionalId;

  return (
    <div>
      {/* Sezione Portfolio */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Portfolio Lavori</h2>
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Aggiungi Portfolio
            </button>
          )}
        </div>
        
        <PortfolioGallery 
          professionalId={professionalId}
          editable={isOwner}
          onEdit={(portfolio) => console.log('Edit', portfolio)}
          onDelete={(id) => console.log('Delete', id)}
        />
      </div>

      {/* Modal Aggiunta */}
      <AddPortfolioModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        professionalId={professionalId}
      />
    </div>
  );
}
```

---

## 📋 FEATURES IMPLEMENTATE

### ✅ Completate
- [x] Modello database Portfolio
- [x] CRUD completo backend
- [x] Visualizzazione galleria con Prima/Dopo
- [x] Navigazione tra portfolio
- [x] Contatore visualizzazioni
- [x] Form aggiunta portfolio
- [x] Ricerca e filtri
- [x] Portfolio popolari/recenti
- [x] Gestione categorie
- [x] Tags e location
- [x] Dettagli tecnici e materiali

### 🔄 Prossime Features (Opzionali)
- [ ] Upload diretto immagini (non solo URL)
- [ ] Lightbox fullscreen per immagini
- [ ] Watermark automatico su immagini
- [ ] Slider touch gestures per mobile
- [ ] Condivisione social
- [ ] Download PDF portfolio
- [ ] Statistiche avanzate
- [ ] Commenti e recensioni su portfolio

---

## 🧪 TESTING

### Test Backend
```bash
# Test creazione portfolio
curl -X POST http://localhost:3200/api/portfolio \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ristrutturazione Bagno Moderno",
    "description": "Completa ristrutturazione bagno",
    "beforeImage": "https://example.com/prima.jpg",
    "afterImage": "https://example.com/dopo.jpg",
    "categoryId": "ID_CATEGORIA"
  }'

# Test recupero portfolio
curl http://localhost:3200/api/portfolio/professional/PROFESSIONAL_ID
```

### Test Frontend
1. Accedi come professionista
2. Vai al tuo profilo
3. Clicca su "Aggiungi Portfolio"
4. Compila il form e salva
5. Verifica visualizzazione galleria
6. Testa toggle Prima/Dopo
7. Naviga tra portfolio multipli

---

## 🔧 TROUBLESHOOTING

### Problemi Comuni

#### 1. Immagini non visualizzate
- Verifica che gli URL siano validi e accessibili
- Controlla CORS se le immagini sono su domini esterni
- Verifica che le immagini siano pubbliche

#### 2. Portfolio non salvato
- Controlla i campi obbligatori (title, beforeImage, afterImage, categoryId)
- Verifica autenticazione utente
- Controlla console per errori di validazione

#### 3. Contatore visualizzazioni non funziona
- Verifica che l'utente non sia il proprietario (non conta le proprie)
- Controlla che il service incrementViewCount sia chiamato

---

## 📈 PERFORMANCE

### Ottimizzazioni Implementate
- Cache React Query 5 minuti
- Lazy loading immagini
- Thumbnails ottimizzate
- Pagination per liste lunghe
- Index database su professionalId e categoryId

### Metriche Target
- Caricamento galleria: < 1s
- Switch Prima/Dopo: istantaneo
- Upload nuovo portfolio: < 2s
- Ricerca: < 500ms

---

## 🔐 SICUREZZA

### Controlli Implementati
- Autenticazione per creazione/modifica/eliminazione
- Solo il proprietario può modificare il proprio portfolio
- Validazione Zod su tutti gli input
- Sanitizzazione URL immagini
- Rate limiting su upload
- XSS protection su descrizioni

---

## 📚 DIPENDENZE

### Backend
- `@prisma/client` - ORM database
- `zod` - Validazione schema
- `express` - Framework web

### Frontend
- `@tanstack/react-query` - State management
- `@heroicons/react` - Icone UI
- `react-hot-toast` - Notifiche
- `axios` - Client HTTP

---

## 🎯 BEST PRACTICES

1. **Sempre validare URL immagini** prima di salvare
2. **Ottimizzare immagini** (max 2MB, formato WebP preferito)
3. **Usare cache** per portfolio visualizzati frequentemente
4. **Implementare lazy loading** per gallerie lunghe
5. **Backup regolare** delle immagini portfolio
6. **Monitorare** visualizzazioni per analytics

---

## 📝 NOTE SVILUPPO

- Sistema completamente implementato e funzionante
- Database schema già presente e migrato
- Backend service e routes registrate
- Frontend components pronti all'uso
- Integrazione semplice in profili esistenti
- Estendibile con features aggiuntive

---

**Ultimo Aggiornamento**: 04/01/2025  
**Autore**: Claude + Luca Mambelli  
**Status**: ✅ PRODUZIONE READY
