# 🎯 PIANO IMPLEMENTAZIONE STEP-BY-STEP
## Sistema Richiesta Assistenza - Roadmap Operativa Dettagliata

**Data Creazione**: 04 Ottobre 2025  
**Versione**: 1.0.0  
**Basato su**: Report Analisi Sistema Cliente v1.0  
**Stato**: 🟢 In Corso - Fase 1 (Quick Wins)

---

## 📊 DASHBOARD AVANZAMENTO GENERALE

```
┌────────────────────────────────────────────────────────────┐
│ 🎯 PROGRESSO TOTALE: 0/20 Step Completati (0%)            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                            │
│ FASE 1 - QUICK WINS:           0/8  ⬜⬜⬜⬜⬜⬜⬜⬜         │
│ FASE 2 - UX SEMPLIFICATA:      0/7  ⬜⬜⬜⬜⬜⬜⬜           │
│ FASE 3 - MOBILE & RETENTION:   0/5  ⬜⬜⬜⬜⬜               │
│                                                            │
│ 🚀 Prossimo Step: #1 - Sistema Recensioni Base            │
│ ⏱️  Tempo Stimato Totale: ~60 ore                          │
│ 📅 Completamento Previsto: 25 Ottobre 2025                │
└────────────────────────────────────────────────────────────┘
```

### 🎨 Legenda Stato
- ⬜ **Da Fare** - Non iniziato
- 🟦 **In Corso** - Lavoro iniziato
- ✅ **Completato** - Testato e documentato
- ⚠️ **Bloccato** - Richiede attenzione
- 🔄 **In Review** - Da verificare

---

## 🎯 INDICE RAPIDO

### 🔴 FASE 1: QUICK WINS (Priorità MASSIMA)
*Obiettivo: +30% conversioni in 4 settimane*

- [Step 1](#step-1-sistema-recensioni-base-⭐) - Sistema Recensioni Base ⭐
- [Step 2](#step-2-foto-professionisti-obbligatorie-📸) - Foto Professionisti Obbligatorie 📸
- [Step 3](#step-3-portfolio-lavori-primadopo-🖼️) - Portfolio Lavori Prima/Dopo 🖼️
- [Step 4](#step-4-badge-verificato-✅) - Badge "Verificato" ✅
- [Step 5](#step-5-range-prezzi-indicativi-💰) - Range Prezzi Indicativi 💰
- [Step 6](#step-6-garanzie-visibili-🛡️) - Garanzie Visibili 🛡️
- [Step 7](#step-7-certificazioni-in-evidenza-📜) - Certificazioni in Evidenza 📜
- [Step 8](#step-8-statistiche-professionista-📊) - Statistiche Professionista 📊

### 🟡 FASE 2: UX SEMPLIFICATA
*Obiettivo: -40% abbandono form*

- [Step 9](#step-9-quick-request-mode-⚡) - Quick Request Mode ⚡
- [Step 10](#step-10-quick-actions-ui-🎯) - Quick Actions UI 🎯
- [Step 11](#step-11-ai-categoria-suggester-🤖) - AI Categoria Suggester 🤖
- [Step 12](#step-12-geo-auto-detect-📍) - Geo Auto-Detect 📍
- [Step 13](#step-13-onboarding-tutorial-🎓) - Onboarding Tutorial 🎓
- [Step 14](#step-14-salvataggio-bozze-💾) - Salvataggio Bozze 💾
- [Step 15](#step-15-comunicazione-friendly-💬) - Comunicazione Friendly 💬

### 🟢 FASE 3: MOBILE & RETENTION
*Obiettivo: App 4.5⭐, Churn -50%*

- [Step 16](#step-16-gamification-club-fedeltà-🎮) - Gamification - Club Fedeltà 🎮
- [Step 17](#step-17-referral-program-🎁) - Referral Program 🎁
- [Step 18](#step-18-celebrazioni-animate-🎉) - Celebrazioni Animate 🎉
- [Step 19](#step-19-tracking-professionista-live-🚗) - Tracking Professionista Live 🚗
- [Step 20](#step-20-mobile-app-planning-📱) - Mobile App Planning 📱

---

## 📋 TEMPLATE REPORT SESSIONE

**Da creare SEMPRE dopo ogni step in**: `DOCUMENTAZIONE/REPORT-SESSIONI/`

```markdown
# 📝 REPORT SESSIONE - [Titolo Step]

**Data**: [GG/MM/AAAA]  
**Step**: #[Numero] - [Nome Step]  
**Durata Effettiva**: [ore]  
**Developer**: Claude AI / [Nome]  
**Stato Finale**: ✅ Completato / 🟡 Parziale / 🔴 Fallito

## 🎯 Obiettivo
[Descrizione breve]

## ✅ Cosa È Stato Fatto
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## 💾 Backup Creati
```bash
[Lista file backup]
```

## 🧪 Test Eseguiti
- [ ] Test 1: [Risultato]
- [ ] Test 2: [Risultato]

## 📝 File Modificati
- `path/file1.ts` - [Descrizione modifica]
- `path/file2.tsx` - [Descrizione modifica]

## 📚 Documentazione Aggiornata
- [ ] File doc 1
- [ ] File doc 2

## ⚠️ Problemi Riscontrati
[Eventuali issue]

## 🔄 Prossimi Passi
[Link a step successivo]

## 📸 Screenshot
[Se applicabile]
```

---

# 🔴 FASE 1: QUICK WINS

---

## STEP 1: Sistema Recensioni Base ⭐

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 3-4 ore  
**Impatto**: +30% conversioni  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Implementare sistema completo di recensioni con stelle (1-5) e commenti testuali. I clienti potranno valutare i professionisti dopo ogni intervento completato.

### 💡 Perché È Importante
- Trust #1 problema nel settore assistenza
- 87% utenti legge recensioni prima di scegliere
- Aumenta conversioni del 30-40%
- Riduce ansia da scelta

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Oggi implementiamo il **Sistema Recensioni Base**.

📚 DOCUMENTI DA LEGGERE PRIMA:
1. ISTRUZIONI-PROGETTO.md (regole tecniche vincolanti)
2. DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/CHECKLIST-FUNZIONALITA-SISTEMA.md
3. DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/REQUEST-SYSTEM.md

🎯 TASK PRINCIPALE:
Creare sistema recensioni completo per professionisti.

📝 IMPLEMENTAZIONE DETTAGLIATA:

**1. DATABASE (Prisma Schema)**
Aggiungi al file `backend/prisma/schema.prisma`:

```prisma
model Review {
  id            String   @id @default(cuid())
  rating        Int      // 1-5 stelle
  comment       String?  @db.Text
  
  // Relazioni
  requestId     String   @unique
  request       Request  @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  clientId      String
  client        User     @relation("ClientReviews", fields: [clientId], references: [id])
  
  professionalId String
  professional   User     @relation("ProfessionalReviews", fields: [professionalId], references: [id])
  
  // Metadata
  isVerified    Boolean  @default(false) // Solo review da interventi reali
  helpfulCount  Int      @default(0)
  reportedCount Int      @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([professionalId])
  @@index([clientId])
  @@index([rating])
}
```

Aggiorna il model User per le relazioni:
```prisma
model User {
  // ... campi esistenti ...
  
  reviewsGiven     Review[] @relation("ClientReviews")
  reviewsReceived  Review[] @relation("ProfessionalReviews")
}
```

Aggiorna il model Request:
```prisma
model Request {
  // ... campi esistenti ...
  
  review Review?
}
```

**2. BACKEND API**

Crea `backend/src/routes/reviews.routes.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { reviewService } from '../services/review.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { z } from 'zod';

const router = Router();

// Schema validazione
const createReviewSchema = z.object({
  requestId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000).optional()
});

// CREATE - Lascia recensione
router.post(
  '/',
  authenticate,
  validateRequest(createReviewSchema),
  async (req, res) => {
    try {
      const review = await reviewService.createReview({
        ...req.body,
        clientId: req.user.id
      });
      return res.json(ResponseFormatter.success(review, 'Recensione creata'));
    } catch (error) {
      return res.status(400).json(ResponseFormatter.error(error.message));
    }
  }
);

// READ - Recensioni professionista
router.get(
  '/professional/:professionalId',
  async (req, res) => {
    try {
      const reviews = await reviewService.getProfessionalReviews(
        req.params.professionalId
      );
      return res.json(ResponseFormatter.success(reviews));
    } catch (error) {
      return res.status(400).json(ResponseFormatter.error(error.message));
    }
  }
);

// READ - Statistiche recensioni professionista
router.get(
  '/professional/:professionalId/stats',
  async (req, res) => {
    try {
      const stats = await reviewService.getProfessionalStats(
        req.params.professionalId
      );
      return res.json(ResponseFormatter.success(stats));
    } catch (error) {
      return res.status(400).json(ResponseFormatter.error(error.message));
    }
  }
);

export default router;
```

Crea `backend/src/services/review.service.ts`:

```typescript
import { prisma } from '../config/database';

class ReviewService {
  async createReview(data: {
    requestId: string;
    rating: number;
    comment?: string;
    clientId: string;
  }) {
    // 1. Verifica che la richiesta esista ed sia completata
    const request = await prisma.request.findUnique({
      where: { id: data.requestId },
      include: { professional: true }
    });

    if (!request) {
      throw new Error('Richiesta non trovata');
    }

    if (request.status !== 'COMPLETED') {
      throw new Error('Puoi recensire solo interventi completati');
    }

    if (request.clientId !== data.clientId) {
      throw new Error('Non puoi recensire questa richiesta');
    }

    // 2. Verifica che non esista già una recensione
    const existing = await prisma.review.findUnique({
      where: { requestId: data.requestId }
    });

    if (existing) {
      throw new Error('Hai già recensito questo intervento');
    }

    // 3. Crea recensione
    const review = await prisma.review.create({
      data: {
        requestId: data.requestId,
        rating: data.rating,
        comment: data.comment,
        clientId: data.clientId,
        professionalId: request.professionalId!,
        isVerified: true // Verificata perché da intervento reale
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // 4. Aggiorna rating medio professionista
    await this.updateProfessionalRating(request.professionalId!);

    return review;
  }

  async getProfessionalReviews(professionalId: string) {
    return await prisma.review.findMany({
      where: { professionalId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        request: {
          select: {
            id: true,
            categoryId: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProfessionalStats(professionalId: string) {
    const reviews = await prisma.review.findMany({
      where: { professionalId },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    const distribution = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      distribution
    };
  }

  private async updateProfessionalRating(professionalId: string) {
    const stats = await this.getProfessionalStats(professionalId);
    
    // Aggiorna il campo rating nel profilo professionista se esiste
    await prisma.user.update({
      where: { id: professionalId },
      data: {
        // Assumendo che esista un campo 'rating' in User
        // Altrimenti salvare in ProfessionalProfile
      }
    });
  }
}

export const reviewService = new ReviewService();
```

Registra le routes in `backend/src/app.ts`:
```typescript
import reviewRoutes from './routes/reviews.routes';

// ... altre routes ...
app.use('/api/reviews', reviewRoutes);
```

**3. FRONTEND - Componenti React**

Crea `src/components/reviews/StarRating.tsx`:

```typescript
import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          {star <= rating ? (
            <StarIcon className={`${sizeClasses[size]} text-yellow-400`} />
          ) : (
            <StarOutline className={`${sizeClasses[size]} text-gray-300`} />
          )}
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};
```

Crea `src/components/reviews/ReviewForm.tsx`:

```typescript
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StarRating } from './StarRating';
import api from '../../services/api';

interface ReviewFormProps {
  requestId: string;
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ requestId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (data: { requestId: string; rating: number; comment?: string }) => {
      const response = await api.post('/reviews', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReviewMutation.mutate({
      requestId,
      rating,
      comment: comment.trim() || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Lascia una recensione
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valutazione
        </label>
        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commento (opzionale)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          rows={4}
          maxLength={1000}
          placeholder="Raccontaci la tua esperienza..."
        />
        <p className="text-sm text-gray-500 mt-1">
          {comment.length}/1000 caratteri
        </p>
      </div>

      <button
        type="submit"
        disabled={createReviewMutation.isPending}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {createReviewMutation.isPending ? 'Invio...' : 'Invia Recensione'}
      </button>
    </form>
  );
};
```

Crea `src/components/reviews/ReviewList.tsx`:

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StarRating } from './StarRating';
import api from '../../services/api';

interface ReviewListProps {
  professionalId: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ professionalId }) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', professionalId],
    queryFn: async () => {
      const response = await api.get(`/reviews/professional/${professionalId}`);
      return response.data.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['reviews-stats', professionalId],
    queryFn: async () => {
      const response = await api.get(`/reviews/professional/${professionalId}/stats`);
      return response.data.data;
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Caricamento recensioni...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <StarRating rating={stats.averageRating} readonly size="lg" />
              <p className="text-sm text-gray-600 mt-1">
                Basato su {stats.totalReviews} recensioni
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageRating}
              </p>
              <p className="text-sm text-gray-600">su 5.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista recensioni */}
      <div className="space-y-4">
        {reviews?.map((review: any) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {review.client.firstName} {review.client.lastName.charAt(0)}.
                </p>
                <StarRating rating={review.rating} readonly size="sm" />
              </div>
              <p className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('it-IT')}
              </p>
            </div>
            {review.comment && (
              <p className="text-gray-700 mt-2">{review.comment}</p>
            )}
          </div>
        ))}

        {reviews?.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Nessuna recensione ancora
          </p>
        )}
      </div>
    </div>
  );
};
```

**4. INTEGRAZIONE**

Aggiungi componente recensioni nella pagina profilo professionista.
Ad esempio in `src/pages/ProfessionalProfile.tsx`:

```typescript
import { ReviewList } from '../components/reviews/ReviewList';

// ... nel componente ...
<div className="mt-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">
    Recensioni Clienti
  </h2>
  <ReviewList professionalId={professionalId} />
</div>
```

⚠️ REGOLE IMPORTANTI:
1. ✅ Fare BACKUP schema Prisma prima di modificare
2. ✅ Usare React Query per tutte le chiamate API
3. ✅ Validazione Zod su tutti gli input
4. ✅ ResponseFormatter nelle routes
5. ✅ Tailwind CSS per tutto lo styling
6. ✅ Heroicons per le icone
7. ✅ Salvare tutta la documentazione in DOCUMENTAZIONE/

🧪 TESTING:
1. Testare creazione recensione
2. Testare visualizzazione recensioni
3. Testare calcolo rating medio
4. Verificare che non si possa recensire 2 volte
5. Verificare che solo interventi completati siano recensibili

📚 DOCUMENTAZIONE DA CREARE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/REVIEW-SYSTEM.md
- DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-04-step-1-recensioni.md

Al termine, dimmi i risultati dei test e i file modificati!
```

### 💾 Backup Pre-Implementazione

```bash
# ESEGUIRE PRIMA DI INIZIARE

# 1. Backup schema Prisma
cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

# 2. Backup configurazione app
cp backend/src/app.ts backend/src/app.ts.backup-$(date +%Y%m%d-%H%M%S)

# 3. Backup database (opzionale ma consigliato)
cd backend
npm run db:backup
```

### ✅ Checklist Completamento

**Database & Backend**
- [ ] Tabella `Review` creata in schema Prisma
- [ ] Relazioni aggiunte a `User` e `Request`
- [ ] Migration eseguita con successo: `npx prisma migrate dev --name add-reviews`
- [ ] Service `review.service.ts` creato
- [ ] Routes `reviews.routes.ts` create
- [ ] Routes registrate in `app.ts`
- [ ] Validazione Zod presente su tutte le routes

**Frontend**
- [ ] Componente `StarRating.tsx` creato
- [ ] Componente `ReviewForm.tsx` creato
- [ ] Componente `ReviewList.tsx` creato
- [ ] Componenti integrati in pagina profilo
- [ ] React Query configurato correttamente
- [ ] Tailwind styling applicato

**Testing**
- [ ] ✅ Test: Creare recensione 5 stelle con commento
- [ ] ✅ Test: Creare recensione senza commento
- [ ] ✅ Test: Tentare recensione duplicata (deve fallire)
- [ ] ✅ Test: Recensire richiesta non completata (deve fallire)
- [ ] ✅ Test: Visualizzare recensioni professionista
- [ ] ✅ Test: Calcolo rating medio corretto
- [ ] ✅ Test: Distribuzione stelle corretta

**Documentazione**
- [ ] File `REVIEW-SYSTEM.md` creato in DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/
- [ ] `CHECKLIST-FUNZIONALITA-SISTEMA.md` aggiornato
- [ ] Report sessione creato in REPORT-SESSIONI/
- [ ] Screenshot recensioni aggiunti al report

### 🎯 Risultato Atteso

Al termine dello step, il sistema dovrà:
1. ✅ Permettere ai clienti di lasciare recensioni dopo interventi completati
2. ✅ Mostrare stelle e commenti nel profilo professionista
3. ✅ Calcolare e mostrare rating medio
4. ✅ Prevenire recensioni duplicate o non valide
5. ✅ Essere completamente testato e documentato

### 📸 Esempio Visivo

```
┌─────────────────────────────────────────────┐
│ Profilo Mario Rossi                         │
│                                             │
│ ⭐⭐⭐⭐⭐ 4.8 / 5.0                         │
│ Basato su 47 recensioni                    │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Luigi B.        ⭐⭐⭐⭐⭐  15/09/2025  │ │
│ │ "Ottimo lavoro, veloce e professionale" │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Maria R.        ⭐⭐⭐⭐    12/09/2025  │ │
│ │ "Buon servizio, prezzi onesti"          │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 🔄 Prossimo Step
➡️ [Step 2: Foto Professionisti Obbligatorie](#step-2-foto-professionisti-obbligatorie-📸)

---

## STEP 2: Foto Professionisti Obbligatorie 📸

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 2-3 ore  
**Impatto**: +25% trust  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Rendere obbligatorio il caricamento della foto profilo per i professionisti. La foto deve essere visibile ovunque (profilo, preventivi, chat).

### 💡 Perché È Importante
- Aumenta fiducia del 300% (studio Stanford)
- Umanizza l'interazione
- Riduce no-show del 40%
- Professionalizza il servizio

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Implementiamo **Foto Professionisti Obbligatorie**.

📚 RIFERIMENTI:
- ISTRUZIONI-PROGETTO.md
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/AUTH-SYSTEM.md

🎯 TASK:
1. Modificare schema User per campo profileImage obbligatorio (per PROFESSIONAL)
2. Aggiungere upload foto in registrazione/profilo
3. Validazione: JPG/PNG, max 5MB, minimo 200x200px
4. Mostrare foto in tutti i punti di contatto con professionista
5. Placeholder per foto mancanti temporanee

📝 IMPLEMENTAZIONE:

**1. Schema Prisma**
```prisma
model User {
  // ... campi esistenti ...
  
  profileImage String? // URL immagine profilo
  
  // Validazione custom nel service per PROFESSIONAL
}
```

**2. Backend Upload Service**

Usa il servizio upload esistente in `backend/src/services/upload.service.ts`
Aggiungi validazione immagine:

```typescript
async validateProfileImage(file: Express.Multer.File) {
  // Check tipo
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.mimetype)) {
    throw new Error('Formato non valido. Usa JPG, PNG o WebP');
  }
  
  // Check dimensione max
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File troppo grande. Massimo 5MB');
  }
  
  // Check dimensioni minime con sharp
  const metadata = await sharp(file.buffer).metadata();
  if (metadata.width < 200 || metadata.height < 200) {
    throw new Error('Immagine troppo piccola. Minimo 200x200px');
  }
  
  return true;
}
```

**3. Frontend - Componente Upload**

Crea `src/components/profile/ProfileImageUpload.tsx`:

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CameraIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface ProfileImageUploadProps {
  currentImage?: string;
  onUploadSuccess: (imageUrl: string) => void;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  onUploadSuccess
}) => {
  const [preview, setPreview] = useState(currentImage);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/upload/profile-image', formData);
      return response.data.data.url;
    },
    onSuccess: (url) => {
      setPreview(url);
      onUploadSuccess(url);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione client-side
    if (file.size > 5 * 1024 * 1024) {
      alert('File troppo grande. Massimo 5MB');
      return;
    }

    // Preview immediato
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    uploadMutation.mutate(file);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200">
          {preview ? (
            <img src={preview} alt="Profilo" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <CameraIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700">
          <CameraIcon className="h-5 w-5 text-white" />
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </label>
      </div>
      {uploadMutation.isPending && (
        <p className="text-sm text-gray-600 mt-2">Caricamento...</p>
      )}
      {uploadMutation.isError && (
        <p className="text-sm text-red-600 mt-2">Errore upload</p>
      )}
    </div>
  );
};
```

**4. Mostrare foto ovunque**

Crea componente riusabile `src/components/common/UserAvatar.tsx`:

```typescript
import React from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

interface UserAvatarProps {
  imageUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  imageUrl,
  name,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <span className="text-white font-semibold">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};
```

Usalo in lista professionisti, chat, preventivi, etc.

⚠️ IMPORTANTE:
- Ottimizzare immagini con sharp (resize, compress)
- CDN per delivery veloce
- Lazy loading per performance
- Fallback gradient con iniziali nome

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/PROFILE-IMAGE-SYSTEM.md
- Report sessione in REPORT-SESSIONI/
```

### 💾 Backup Pre-Implementazione

```bash
# Backup schema
cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

# Backup upload service
cp backend/src/services/upload.service.ts backend/src/services/upload.service.ts.backup-$(date +%Y%m%d-%H%M%S)
```

### ✅ Checklist Completamento

**Backend**
- [ ] Campo `profileImage` aggiunto a schema User
- [ ] Validazione immagine implementata
- [ ] Endpoint upload `/api/upload/profile-image` funzionante
- [ ] Ottimizzazione con sharp (resize 400x400, quality 85)
- [ ] Storage configurato (locale o cloud)

**Frontend**
- [ ] Componente `ProfileImageUpload` creato
- [ ] Componente `UserAvatar` creato
- [ ] Upload in registrazione professionista
- [ ] Upload in modifica profilo
- [ ] Avatar visibile in lista professionisti
- [ ] Avatar visibile in chat
- [ ] Avatar visibile in preventivi
- [ ] Fallback con iniziali nome

**Testing**
- [ ] Upload JPG funziona
- [ ] Upload PNG funziona
- [ ] File > 5MB rifiutato
- [ ] Immagine < 200x200 rifiutata
- [ ] Preview immediato funziona
- [ ] Avatar mostrato correttamente ovunque

**Documentazione**
- [ ] `PROFILE-IMAGE-SYSTEM.md` creato
- [ ] Report sessione completato

### 🔄 Prossimo Step
➡️ [Step 3: Portfolio Lavori Prima/Dopo](#step-3-portfolio-lavori-primadopo-🖼️)

---

## STEP 3: Portfolio Lavori Prima/Dopo 🖼️

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 4 ore  
**Impatto**: +40% conversioni  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Permettere ai professionisti di caricare foto "Prima/Dopo" dei lavori completati. I clienti vedranno la gallery nel profilo.

### 💡 Perché È Importante
- Proof sociale più forte delle recensioni
- Aumenta conversioni del 40-50%
- Mostra qualità lavoro reale
- Differenzia professionisti esperti

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Creiamo il **Portfolio Lavori Prima/Dopo**.

📚 RIFERIMENTI:
- ISTRUZIONI-PROGETTO.md
- Step 2 completato (upload immagini)

🎯 TASK:
Sistema completo portfolio con foto Prima/Dopo lavori.

📝 SCHEMA DATABASE:

```prisma
model Portfolio {
  id             String   @id @default(cuid())
  title          String   // es: "Ristrutturazione Bagno"
  description    String?  @db.Text
  
  beforeImage    String   // URL foto PRIMA
  afterImage     String   // URL foto DOPO
  
  professionalId String
  professional   User     @relation("ProfessionalPortfolio", fields: [professionalId], references: [id])
  
  requestId      String?  @unique
  request        Request? @relation(fields: [requestId], references: [id])
  
  categoryId     String
  category       Category @relation(fields: [categoryId], references: [id])
  
  isPublic       Boolean  @default(true)
  viewCount      Int      @default(0)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([professionalId])
  @@index([categoryId])
}
```

**BACKEND SERVICE** `portfolio.service.ts`:

```typescript
class PortfolioService {
  async createPortfolio(data: {
    title: string;
    description?: string;
    beforeImage: string;
    afterImage: string;
    professionalId: string;
    categoryId: string;
    requestId?: string;
  }) {
    return await prisma.portfolio.create({
      data,
      include: {
        category: true,
        professional: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async getProfessionalPortfolio(professionalId: string) {
    return await prisma.portfolio.findMany({
      where: {
        professionalId,
        isPublic: true
      },
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async incrementViewCount(portfolioId: string) {
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { viewCount: { increment: 1 } }
    });
  }
}
```

**FRONTEND COMPONENT** `PortfolioGallery.tsx`:

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface PortfolioGalleryProps {
  professionalId: string;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({ professionalId }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBefore, setShowBefore] = useState(true);

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', professionalId],
    queryFn: async () => {
      const response = await api.get(`/portfolio/professional/${professionalId}`);
      return response.data.data;
    }
  });

  if (!portfolio?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nessun lavoro in portfolio
      </div>
    );
  }

  const current = portfolio[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Immagine principale con slider Prima/Dopo */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
        <img
          src={showBefore ? current.beforeImage : current.afterImage}
          alt={current.title}
          className="w-full h-full object-cover"
        />
        
        {/* Toggle Prima/Dopo */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg overflow-hidden flex">
          <button
            onClick={() => setShowBefore(true)}
            className={`px-6 py-2 font-semibold ${showBefore ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
          >
            Prima
          </button>
          <button
            onClick={() => setShowBefore(false)}
            className={`px-6 py-2 font-semibold ${!showBefore ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
          >
            Dopo
          </button>
        </div>

        {/* Navigazione */}
        {portfolio.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex(i => i > 0 ? i - 1 : portfolio.length - 1)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setSelectedIndex(i => i < portfolio.length - 1 ? i + 1 : 0)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Info lavoro */}
      <div className="bg-white rounded-lg p-4">
        <h3 className="font-semibold text-gray-900">{current.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{current.description}</p>
        <p className="text-xs text-gray-500 mt-2">
          Categoria: {current.category.name}
        </p>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {portfolio.map((item: any, index: number) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className={`aspect-video rounded overflow-hidden ${
              index === selectedIndex ? 'ring-2 ring-blue-600' : ''
            }`}
          >
            <img
              src={item.afterImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
```

⚠️ FEATURES EXTRA:
- Lightbox per visualizzazione full-screen
- Slider con gesture touch
- Contatore visualizzazioni
- Filtro per categoria lavori
- Watermark opzionale su foto

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/PORTFOLIO-SYSTEM.md
```

### ✅ Checklist Completamento

**Database & Backend**
- [ ] Model `Portfolio` creato
- [ ] Service `portfolio.service.ts` implementato
- [ ] Routes CRUD portfolio
- [ ] Upload multiplo immagini
- [ ] Validazione immagini (min 800x600)
- [ ] Ottimizzazione con sharp

**Frontend**
- [ ] Componente `PortfolioGallery` creato
- [ ] Toggle Prima/Dopo funzionante
- [ ] Navigazione tra lavori
- [ ] Thumbnails grid
- [ ] Form upload per professionisti
- [ ] Lightbox full-screen
- [ ] Mobile responsive

**Testing**
- [ ] Upload 2 foto (prima/dopo)
- [ ] Visualizzazione gallery
- [ ] Toggle smooth prima/dopo
- [ ] Performance con 20+ portfolio items
- [ ] Mobile touch gestures

**Documentazione**
- [ ] `PORTFOLIO-SYSTEM.md` completo
- [ ] Screenshot gallery
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 4: Badge Verificato](#step-4-badge-verificato-✅)

---

## STEP 4: Badge "Verificato" ✅

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 2 ore  
**Impatto**: +15% trust  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Aggiungere badge "✅ Verificato" ai professionisti che hanno completato processo di verifica (documenti, certificazioni, background check).

### 💡 Perché È Importante
- Comunicazione visiva immediata di affidabilità
- Differenzia professionisti seri
- Aumenta click del 20-30%
- Premium positioning

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Implementiamo il **Badge Verificato**.

🎯 TASK: Sistema di verifica professionisti con badge visivo.

**1. SCHEMA DATABASE**

Aggiungi a User (o ProfessionalProfile):
```prisma
model User {
  // ... campi esistenti ...
  
  isVerified        Boolean  @default(false)
  verifiedAt        DateTime?
  verificationNotes String?  @db.Text
  
  // Opzionale: dettagli verifica
  documentsVerified Boolean  @default(false)
  backgroundCheck   Boolean  @default(false)
  certificatesVerified Boolean @default(false)
}
```

**2. BACKEND - Admin Verification**

Endpoint per admin che verifica professionista:

```typescript
// admin.routes.ts
router.post(
  '/verify-professional/:userId',
  authenticate,
  authorizeRoles(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    const { userId } = req.params;
    const { notes } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationNotes: notes
      }
    });
    
    // Invia notifica al professionista
    await notificationService.emitToUser(
      userId,
      'verification:approved',
      { message: 'Il tuo profilo è stato verificato!' }
    );
    
    return res.json(ResponseFormatter.success(user, 'Professionista verificato'));
  }
);
```

**3. FRONTEND - Badge Component**

```typescript
import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  size = 'md',
  showText = false
}) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="inline-flex items-center gap-1">
      <CheckBadgeIcon className={`${sizeClasses[size]} text-blue-600`} />
      {showText && (
        <span className="text-sm font-semibold text-blue-600">
          Verificato
        </span>
      )}
    </div>
  );
};
```

**4. USARE IL BADGE OVUNQUE**

Lista professionisti, profilo, preventivi, chat:

```typescript
<div className="flex items-center gap-2">
  <h3 className="font-semibold">{professional.firstName} {professional.lastName}</h3>
  <VerifiedBadge isVerified={professional.isVerified} />
</div>
```

**5. FILTRO "SOLO VERIFICATI"**

Aggiungi filtro in lista professionisti:

```typescript
const [showOnlyVerified, setShowOnlyVerified] = useState(false);

const { data: professionals } = useQuery({
  queryKey: ['professionals', showOnlyVerified],
  queryFn: async () => {
    const response = await api.get('/professionals', {
      params: { verified: showOnlyVerified || undefined }
    });
    return response.data.data;
  }
});
```

⚠️ IMPORTANTE:
- Badge NON modificabile da professionista
- Solo admin può verificare/rimuovere
- Audit log su ogni cambio stato
- Tooltip con "Verificato da [App Name]"

📚 DOC: VERIFICATION-SYSTEM.md
```

### ✅ Checklist Completamento

- [ ] Campo `isVerified` aggiunto
- [ ] Endpoint admin verifica/rimuovi
- [ ] Componente `VerifiedBadge`
- [ ] Badge in lista professionisti
- [ ] Badge in profilo dettaglio
- [ ] Badge in preventivi
- [ ] Badge in chat
- [ ] Filtro "Solo verificati"
- [ ] Tooltip informativo
- [ ] Audit log verifiche
- [ ] Notifica a professionista
- [ ] Testing completo
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 5: Range Prezzi Indicativi](#step-5-range-prezzi-indicativi-💰)

---

## STEP 5: Range Prezzi Indicativi 💰

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 3 ore  
**Impatto**: +20% conversioni  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mostrare range di prezzo indicativo (es: €80-€150) PRIMA che il cliente richieda un preventivo, basato su interventi simili passati.

### 💡 Perché È Importante
- Riduce ansia da prezzo
- Aumenta trasparenza
- Filtra clienti per budget
- Diminuisce preventivi inutili del 30%

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Creiamo i **Range Prezzi Indicativi**.

🎯 TASK: Calcolare e mostrare range prezzi basato su storico.

**1. SERVIZIO CALCOLO PREZZI**

```typescript
// pricing.service.ts
class PricingService {
  async getPriceRange(categoryId: string, subcategoryId?: string) {
    // Trova preventivi accettati ultimi 6 mesi
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const quotes = await prisma.quote.findMany({
      where: {
        request: {
          categoryId,
          subcategoryId: subcategoryId || undefined
        },
        status: 'ACCEPTED',
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        totalAmount: true
      }
    });

    if (quotes.length < 5) {
      // Non abbastanza dati
      return null;
    }

    const amounts = quotes.map(q => q.totalAmount).sort((a, b) => a - b);
    
    // Percentili 25° e 75°
    const p25Index = Math.floor(amounts.length * 0.25);
    const p75Index = Math.floor(amounts.length * 0.75);
    
    return {
      min: Math.floor(amounts[p25Index]),
      max: Math.ceil(amounts[p75Index]),
      sampleSize: amounts.length,
      median: amounts[Math.floor(amounts.length / 2)]
    };
  }

  async getCategoryPricing(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { subcategories: true }
    });

    const categoryRange = await this.getPriceRange(categoryId);
    
    const subcategoriesRanges = await Promise.all(
      category.subcategories.map(async (sub) => ({
        subcategory: sub,
        range: await this.getPriceRange(categoryId, sub.id)
      }))
    );

    return {
      category,
      overallRange: categoryRange,
      subcategoriesRanges: subcategoriesRanges.filter(s => s.range !== null)
    };
  }
}

export const pricingService = new PricingService();
```

**2. API ENDPOINT**

```typescript
// pricing.routes.ts
router.get('/range/category/:categoryId', async (req, res) => {
  try {
    const pricing = await pricingService.getCategoryPricing(req.params.categoryId);
    return res.json(ResponseFormatter.success(pricing));
  } catch (error) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

router.get('/range/estimate', async (req, res) => {
  const { categoryId, subcategoryId } = req.query;
  try {
    const range = await pricingService.getPriceRange(
      categoryId as string,
      subcategoryId as string | undefined
    );
    return res.json(ResponseFormatter.success(range));
  } catch (error) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});
```

**3. FRONTEND COMPONENT**

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyEuroIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface PriceRangeDisplayProps {
  categoryId: string;
  subcategoryId?: string;
}

export const PriceRangeDisplay: React.FC<PriceRangeDisplayProps> = ({
  categoryId,
  subcategoryId
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['price-range', categoryId, subcategoryId],
    queryFn: async () => {
      const response = await api.get('/pricing/range/estimate', {
        params: { categoryId, subcategoryId }
      });
      return response.data.data;
    },
    enabled: !!categoryId
  });

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />;
  }

  if (!data) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Range prezzi non disponibile
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
      <div className="flex items-start gap-3">
        <CurrencyEuroIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">
            Stima Indicativa
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">
              €{data.min}
            </span>
            <span className="text-gray-600">-</span>
            <span className="text-3xl font-bold text-blue-600">
              €{data.max}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Basato su {data.sampleSize} interventi simili negli ultimi 6 mesi
          </p>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>✓ Include sopralluogo gratuito</p>
            <p>✓ Garanzia 12 mesi</p>
            <p>✓ Nessun costo nascosto</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**4. INTEGRARE IN CREAZIONE RICHIESTA**

Nel form nuova richiesta, dopo selezione categoria/sottocategoria:

```typescript
<PriceRangeDisplay 
  categoryId={selectedCategory}
  subcategoryId={selectedSubcategory}
/>
```

⚠️ IMPORTANTE:
- Dati INDICATIVI, non garantiti
- Disclaimer chiaro visibile
- Min 5 preventivi per calcolo affidabile
- Aggiornamento settimanale automatico
- Considerare km da professionista

📚 DOC: PRICING-RANGE-SYSTEM.md
```

### ✅ Checklist Completamento

**Backend**
- [ ] Service `pricing.service.ts` creato
- [ ] Metodo `getPriceRange()` implementato
- [ ] Calcolo percentili 25° e 75°
- [ ] Routes API `/pricing/range/*`
- [ ] Cache Redis per performance
- [ ] Cron job aggiornamento settimanale

**Frontend**
- [ ] Componente `PriceRangeDisplay`
- [ ] Integrato in form richiesta
- [ ] Loading state
- [ ] Fallback se dati insufficienti
- [ ] Disclaimer chiaro
- [ ] Responsive mobile

**Testing**
- [ ] Calcolo con 10+ preventivi
- [ ] Calcolo con 5 preventivi (min)
- [ ] Calcolo con < 5 preventivi (null)
- [ ] Performance query < 100ms
- [ ] Cache funzionante
- [ ] Display corretto vari range

**Documentazione**
- [ ] `PRICING-RANGE-SYSTEM.md`
- [ ] Algoritmo documentato
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 6: Garanzie Visibili](#step-6-garanzie-visibili-🛡️)

---

## STEP 6: Garanzie Visibili 🛡️

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 2 ore  
**Impatto**: +10% conversioni  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Rendere visibili in modo prominente le garanzie offerte: soddisfatti o rimborsati, assicurazione danni, garanzia lavoro 24 mesi.

### 💡 Perché È Importante
- Rimuove rischio percepito
- Aumenta fiducia
- Differenzia da competitor
- Giustifica prezzi premium

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Rendiamo **Garanzie Visibili** ovunque.

🎯 TASK: Banner garanzie prominenti in punti chiave.

**COMPONENTE GARANZIE**

```typescript
// components/guarantees/GuaranteeBanner.tsx
import React from 'react';
import { ShieldCheckIcon, CurrencyEuroIcon, ClockIcon } from '@heroicons/react/24/outline';

export const GuaranteeBanner: React.FC = () => {
  const guarantees = [
    {
      icon: ShieldCheckIcon,
      title: '100% Garantito',
      description: 'Soddisfatti o rimborsati'
    },
    {
      icon: ClockIcon,
      title: 'Garanzia 24 mesi',
      description: 'Su tutti i lavori'
    },
    {
      icon: CurrencyEuroIcon,
      title: 'Assicurato €100.000',
      description: 'Copertura danni'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
      <h3 className="text-center font-bold text-gray-900 mb-4 text-lg">
        🛡️ Le Nostre Garanzie
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {guarantees.map((g, index) => (
          <div key={index} className="text-center">
            <g.icon className="h-10 w-10 text-green-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">{g.title}</h4>
            <p className="text-sm text-gray-600">{g.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**MOSTRARE IN:**
1. Homepage (above fold)
2. Form nuova richiesta
3. Pagina preventivo
4. Footer di ogni pagina
5. Email preventivi

**DETTAGLI GARANZIE** (Modal/Page):

```typescript
// pages/Guarantees.tsx
export const GuaranteesPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        Le Nostre Garanzie
      </h1>

      {/* Sezioni dettagliate */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          💯 Soddisfatti o Rimborsati
        </h2>
        <p className="text-gray-700 mb-4">
          Se non sei completamente soddisfatto del lavoro, hai 14 giorni
          per richiedere il rimborso totale. Nessuna domanda.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Valido su tutti i servizi</li>
          <li>14 giorni dalla fine lavoro</li>
          <li>Rimborso entro 5 giorni lavorativi</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          ⏰ Garanzia Lavoro 24 Mesi
        </h2>
        <p className="text-gray-700 mb-4">
          Tutti i lavori sono garantiti per 24 mesi dalla data di completamento.
          Se qualcosa non va, interveniamo gratis.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          🛡️ Assicurazione €100.000
        </h2>
        <p className="text-gray-700 mb-4">
          Ogni professionista è coperto da assicurazione fino a €100.000
          per eventuali danni durante il lavoro.
        </p>
      </section>
    </div>
  );
};
```

⚠️ TRUST SIGNALS:
- Link a termini e condizioni
- Numero certificato assicurazione
- Logo compagnia assicurativa
- Procedura reclami chiara

📚 DOC: GUARANTEES-SYSTEM.md
```

### ✅ Checklist

- [ ] Componente `GuaranteeBanner`
- [ ] Pagina `/garanzie` dettagliata
- [ ] Banner in homepage
- [ ] Banner in form richiesta
- [ ] Banner in preventivi
- [ ] Footer link garanzie
- [ ] Mobile responsive
- [ ] Testing UX
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 7: Certificazioni in Evidenza](#step-7-certificazioni-in-evidenza-📜)

---

## STEP 7: Certificazioni in Evidenza 📜

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: +8% trust professionisti  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mostrare certificazioni e qualifiche professionisti (es: Certificato Impianti Elettrici, Abilitazione Gas, etc) in modo visibile.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Mettiamo in evidenza le **Certificazioni**.

🎯 TASK: Badge certificazioni visibili nel profilo.

**SCHEMA DATABASE**

```prisma
model Certification {
  id              String   @id @default(cuid())
  name            String   // es: "Certificato F-Gas"
  issuer          String   // es: "Camera di Commercio"
  issueDate       DateTime
  expiryDate      DateTime?
  certificateNumber String?
  
  professionalId  String
  professional    User     @relation("ProfessionalCertifications", fields: [professionalId], references: [id])
  
  verified        Boolean  @default(false) // Verificato da admin
  documentUrl     String?  // Scan certificato
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([professionalId])
}
```

**COMPONENTE CERTIFICAZIONI**

```typescript
// components/certifications/CertificationBadges.tsx
import React from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/solid';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  verified: boolean;
}

interface CertificationBadgesProps {
  certifications: Certification[];
}

export const CertificationBadges: React.FC<CertificationBadgesProps> = ({
  certifications
}) => {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">
        📜 Certificazioni e Qualifiche
      </h3>
      <div className="flex flex-wrap gap-2">
        {certifications.map(cert => (
          <div
            key={cert.id}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              cert.verified 
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <AcademicCapIcon className="h-4 w-4" />
            <span className="font-medium">{cert.name}</span>
            {cert.verified && <span className="text-xs">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**MOSTRARE IN:**
- Profilo professionista (prominente)
- Lista professionisti (badge mini)
- Preventivi ricevuti

**FORM UPLOAD CERTIFICAZIONE** (per professionisti):

```typescript
// Permette a professionista di caricare nuove certificazioni
// Admin le verifica e approva
```

📚 DOC: CERTIFICATIONS-SYSTEM.md
```

### ✅ Checklist

- [ ] Model `Certification` creato
- [ ] CRUD API certificazioni
- [ ] Form upload per professionisti
- [ ] Admin approval workflow
- [ ] Componente `CertificationBadges`
- [ ] Display in profilo
- [ ] Display in lista (mini)
- [ ] Testing upload
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 8: Statistiche Professionista](#step-8-statistiche-professionista-📊)

---

## STEP 8: Statistiche Professionista 📊

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: +5% decisione cliente  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mostrare statistiche chiave professionista: 150 lavori completati, 4.8★ rating, 98% soddisfazione, Membro da 3 anni.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Creiamo **Statistiche Professionista**.

🎯 TASK: Dashboard stats prominente nel profilo.

**SERVIZIO CALCOLO STATS**

```typescript
// professional-stats.service.ts
class ProfessionalStatsService {
  async getStats(professionalId: string) {
    // Lavori completati
    const completedRequests = await prisma.request.count({
      where: {
        professionalId,
        status: 'COMPLETED'
      }
    });

    // Rating medio da recensioni
    const reviews = await prisma.review.findMany({
      where: { professionalId },
      select: { rating: true }
    });
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Anni di esperienza (dalla registrazione)
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: { createdAt: true }
    });
    
    const yearsActive = Math.floor(
      (new Date().getTime() - professional.createdAt.getTime()) / (365 * 24 * 60 * 60 * 1000)
    );

    // Tasso risposta (risposte / richieste assegnate)
    const assignedRequests = await prisma.request.count({
      where: { professionalId }
    });
    
    const responseRate = assignedRequests > 0
      ? Math.round((completedRequests / assignedRequests) * 100)
      : 0;

    return {
      completedJobs: completedRequests,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      yearsActive,
      responseRate
    };
  }
}
```

**COMPONENTE STATS**

```typescript
// components/professional/ProfessionalStats.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircleIcon, 
  StarIcon, 
  ClockIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

interface ProfessionalStatsProps {
  professionalId: string;
}

export const ProfessionalStats: React.FC<ProfessionalStatsProps> = ({
  professionalId
}) => {
  const { data: stats } = useQuery({
    queryKey: ['professional-stats', professionalId],
    queryFn: async () => {
      const response = await api.get(`/professionals/${professionalId}/stats`);
      return response.data.data;
    }
  });

  if (!stats) return null;

  const statItems = [
    {
      icon: CheckCircleIcon,
      value: stats.completedJobs,
      label: 'Lavori Completati',
      color: 'text-green-600'
    },
    {
      icon: StarIcon,
      value: stats.averageRating.toFixed(1),
      label: `Rating (${stats.totalReviews} recensioni)`,
      color: 'text-yellow-600'
    },
    {
      icon: ClockIcon,
      value: `${stats.yearsActive}+ anni`,
      label: 'Esperienza',
      color: 'text-blue-600'
    },
    {
      icon: ChartBarIcon,
      value: `${stats.responseRate}%`,
      label: 'Tasso Risposta',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-bold text-gray-900 mb-4">
        📊 Statistiche Professionista
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center">
            <item.icon className={`h-8 w-8 ${item.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-600 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**DISPLAY PROMINENTE** nel profilo professionista, SOPRA recensioni.

📚 DOC: PROFESSIONAL-STATS-SYSTEM.md
```

### ✅ Checklist

- [ ] Service `professional-stats.service.ts`
- [ ] API `/professionals/:id/stats`
- [ ] Componente `ProfessionalStats`
- [ ] Calcolo lavori completati
- [ ] Calcolo rating medio
- [ ] Calcolo anni esperienza
- [ ] Calcolo tasso risposta
- [ ] Cache Redis stats (1h)
- [ ] Display profilo
- [ ] Mobile responsive
- [ ] Testing calcoli
- [ ] Documentazione

---

# 🟡 FASE 2: UX SEMPLIFICATA

---

## STEP 9: Quick Request Mode ⚡

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 4 ore  
**Impatto**: -40% abbandono form  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Modalità veloce per creare richiesta in 2 step invece di 5: Descrizione problema + Indirizzo. L'AI suggerisce categoria/priorità.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Creiamo **Quick Request Mode**.

🎯 TASK: Form semplificato 2 step con AI.

**NUOVO FORM QUICK**

```typescript
// components/requests/QuickRequestForm.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export const QuickRequestForm = () => {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Invia a AI per categorizzazione
      const aiResponse = await api.post('/ai/categorize-request', {
        description: data.description
      });
      
      // 2. Crea richiesta con suggerimenti AI
      const response = await api.post('/requests/quick', {
        description: data.description,
        address: data.address,
        suggestedCategory: aiResponse.data.category,
        suggestedPriority: aiResponse.data.priority
      });
      
      return response.data;
    }
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header con toggle Standard/Quick */}
      <div className="mb-6 flex gap-4">
        <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg">
          ⚡ Modalità Veloce
        </button>
        <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg">
          📋 Modalità Standard
        </button>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Di cosa hai bisogno?
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es: Ho una perdita d'acqua sotto il lavandino della cucina..."
            className="w-full h-40 border-2 border-gray-300 rounded-lg p-4 text-lg"
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-2">
            {description.length}/500 - Descrivi il problema in modo semplice
          </p>
          <button
            onClick={() => setStep(2)}
            disabled={description.length < 20}
            className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold"
          >
            Avanti →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Dove ti serve l'intervento?
          </h2>
          {/* Google Maps Autocomplete */}
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Inserisci indirizzo..."
            className="w-full border-2 border-gray-300 rounded-lg p-4 text-lg"
          />
          
          <button
            onClick={() => createRequestMutation.mutate({ description, address })}
            disabled={!address || createRequestMutation.isPending}
            className="w-full mt-6 bg-green-600 text-white py-4 rounded-lg text-lg font-semibold"
          >
            {createRequestMutation.isPending ? 'Invio...' : 'Crea Richiesta ✓'}
          </button>

          <button
            onClick={() => setStep(1)}
            className="w-full mt-3 text-gray-600 underline"
          >
            ← Indietro
          </button>
        </div>
      )}
    </div>
  );
};
```

**BACKEND AI CATEGORIZATION**

```typescript
// ai.routes.ts
router.post('/categorize-request', async (req, res) => {
  const { description } = req.body;
  
  // Chiama OpenAI per categorizzazione
  const aiResult = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente che categorizza richieste di assistenza domestica. Rispondi SOLO con JSON.'
      },
      {
        role: 'user',
        content: `Categorizza questa richiesta: "${description}"
        
        Rispondi con JSON:
        {
          "category": "ID categoria (idraulica, elettricista, etc)",
          "priority": "LOW|MEDIUM|HIGH|URGENT",
          "estimatedDuration": "minuti stimati",
          "suggestedSkills": ["skill1", "skill2"]
        }`
      }
    ]
  });
  
  const result = JSON.parse(aiResult.choices[0].message.content);
  return res.json(ResponseFormatter.success(result));
});
```

**FEATURES:**
- AI suggerisce categoria automaticamente
- AI valuta priorità da keywords ("urgente", "subito", etc)
- Geo-detect automatico se permessi location
- Upload foto opzionale (drag & drop)
- Salvataggio bozza automatico

📚 DOC: QUICK-REQUEST-MODE.md
```

### ✅ Checklist

- [ ] Componente `QuickRequestForm`
- [ ] Toggle Standard/Quick mode
- [ ] AI categorization endpoint
- [ ] 2-step flow funzionante
- [ ] Google Maps autocomplete
- [ ] Upload foto opzionale
- [ ] Salvataggio bozze
- [ ] Preview categoria/priorità AI
- [ ] Conferma prima invio
- [ ] Testing UX flusso
- [ ] A/B test vs standard
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 10: Quick Actions UI](#step-10-quick-actions-ui-🎯)

---

## STEP 10: Quick Actions UI 🎯

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 3 ore  
**Impatto**: +50% velocità interazioni  
**Complessità**: 🟢 Bassa-Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Aggiungere pulsanti "quick action" ovunque: ✅ Accetta, ❌ Rifiuta, 💬 Chatta, 📞 Chiama - tutti 1-tap.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Implementiamo **Quick Actions UI**.

🎯 TASK: Pulsanti azione rapida in notifiche, preventivi, richieste.

**COMPONENTE QUICK ACTIONS**

```typescript
// components/actions/QuickActions.tsx
import React from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  ChatBubbleLeftIcon,
  PhoneIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';

interface QuickActionsProps {
  type: 'quote' | 'request' | 'appointment';
  itemId: string;
  onAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  type,
  itemId,
  onAction
}) => {
  const actions = {
    quote: [
      { 
        icon: CheckIcon, 
        label: 'Accetta', 
        action: 'accept',
        color: 'bg-green-600 hover:bg-green-700'
      },
      { 
        icon: XMarkIcon, 
        label: 'Rifiuta', 
        action: 'reject',
        color: 'bg-red-600 hover:bg-red-700'
      },
      { 
        icon: ChatBubbleLeftIcon, 
        label: 'Negozia', 
        action: 'negotiate',
        color: 'bg-blue-600 hover:bg-blue-700'
      }
    ],
    request: [
      { 
        icon: ChatBubbleLeftIcon, 
        label: 'Chat', 
        action: 'chat',
        color: 'bg-blue-600 hover:bg-blue-700'
      },
      { 
        icon: PhoneIcon, 
        label: 'Chiama', 
        action: 'call',
        color: 'bg-green-600 hover:bg-green-700'
      },
      { 
        icon: XMarkIcon, 
        label: 'Annulla', 
        action: 'cancel',
        color: 'bg-red-600 hover:bg-red-700'
      }
    ],
    appointment: [
      { 
        icon: CheckIcon, 
        label: 'Conferma', 
        action: 'confirm',
        color: 'bg-green-600 hover:bg-green-700'
      },
      { 
        icon: CalendarIcon, 
        label: 'Cambia', 
        action: 'reschedule',
        color: 'bg-yellow-600 hover:bg-yellow-700'
      },
      { 
        icon: XMarkIcon, 
        label: 'Cancella', 
        action: 'cancel',
        color: 'bg-red-600 hover:bg-red-700'
      }
    ]
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {actions[type].map((action) => (
        <button
          key={action.action}
          onClick={() => onAction(action.action)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold ${action.color} transition-all`}
        >
          <action.icon className="h-5 w-5" />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};
```

**USARE IN NOTIFICHE**

```typescript
// Esempio: notifica push preventivo ricevuto
<NotificationCard>
  <p>Hai ricevuto un preventivo da Mario Rossi</p>
  <p className="text-2xl font-bold">€120</p>
  
  <QuickActions 
    type="quote"
    itemId={quoteId}
    onAction={(action) => {
      if (action === 'accept') acceptQuoteMutation.mutate(quoteId);
      if (action === 'reject') rejectQuoteMutation.mutate(quoteId);
      if (action === 'negotiate') openNegotiationModal(quoteId);
    }}
  />
</NotificationCard>
```

**NOTIFICHE PUSH** con actions:

```typescript
// Backend notification service
await notificationService.emitToUser(clientId, 'quote:received', {
  title: 'Nuovo Preventivo',
  body: `Mario Rossi ti ha inviato un preventivo: €${quote.totalAmount}`,
  actions: [
    { action: 'accept', title: '✅ Accetta' },
    { action: 'reject', title: '❌ Rifiuta' },
    { action: 'view', title: '👁️ Visualizza' }
  ],
  data: { quoteId: quote.id }
});
```

⚠️ IMPORTANTE:
- Conferma su azioni critiche (annulla, rifiuta)
- Loading state durante azione
- Toast success/error immediato
- Ottimistic UI updates

📚 DOC: QUICK-ACTIONS-SYSTEM.md
```

### ✅ Checklist

- [ ] Componente `QuickActions`
- [ ] Actions per preventivi
- [ ] Actions per richieste
- [ ] Actions per appuntamenti
- [ ] Integrazione in notifiche in-app
- [ ] Push notifications con actions
- [ ] Email con CTA buttons
- [ ] WhatsApp quick replies
- [ ] Conferma azioni critiche
- [ ] Loading states
- [ ] Toast feedback
- [ ] Testing mobile tap
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 11: AI Categoria Suggester](#step-11-ai-categoria-suggester-🤖)

---

## STEP 11: AI Categoria Suggester 🤖

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: -30% errori categorizzazione  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mentre cliente scrive descrizione problema, AI suggerisce categoria in real-time.

**IMPLEMENTATO IN STEP 9 - Quick Request Mode**

### ✅ Checklist

- [ ] Già implementato in Quick Request
- [ ] Aggiungere anche a Standard Form
- [ ] Debounce 500ms typing
- [ ] Confidence score > 80%
- [ ] Fallback selezione manuale
- [ ] Testing accuratezza AI
- [ ] Fine-tuning prompts

---

## STEP 12: Geo Auto-Detect 📍

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: -50% friction indirizzo  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Detect automatico posizione utente con permesso browser, pre-compilazione indirizzo.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Implementiamo **Geo Auto-Detect**.

```typescript
// hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding con Google Maps
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_KEY}`
        );
        const data = await response.json();
        
        setLocation({
          lat: latitude,
          lng: longitude,
          address: data.results[0]?.formatted_address
        });
        setLoading(false);
      },
      (error) => {
        setError('Impossibile ottenere posizione');
        setLoading(false);
      }
    );
  };

  return { location, loading, error, requestLocation };
};
```

**USO IN FORM**

```typescript
const { location, requestLocation } = useGeolocation();

<button 
  onClick={requestLocation}
  className="flex items-center gap-2 text-blue-600"
>
  <MapPinIcon className="h-5 w-5" />
  Usa la mia posizione
</button>

{location && (
  <input 
    value={location.address}
    className="border rounded-lg p-2"
  />
)}
```

📚 DOC: GEO-DETECTION-SYSTEM.md
```

### ✅ Checklist

- [ ] Hook `useGeolocation`
- [ ] Richiesta permessi browser
- [ ] Reverse geocoding Google Maps
- [ ] Pulsante "Usa posizione"
- [ ] Icon location animata
- [ ] Fallback manuale
- [ ] Privacy policy update
- [ ] Testing mobile/desktop
- [ ] Documentazione

---

## STEP 13: Onboarding Tutorial 🎓

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 3 ore  
**Impatto**: +40% completamento prima richiesta  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Tutorial interattivo first-time user con tooltip step-by-step.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Creiamo **Onboarding Tutorial**.

Usa libreria: react-joyride

```bash
npm install react-joyride
```

```typescript
// components/onboarding/OnboardingTour.tsx
import React, { useState } from 'react';
import Joyride, { Step } from 'react-joyride';

export const OnboardingTour = () => {
  const [run, setRun] = useState(true);

  const steps: Step[] = [
    {
      target: '#create-request-btn',
      content: '👋 Benvenuto! Inizia creando la tua prima richiesta qui.',
      placement: 'bottom'
    },
    {
      target: '#request-form',
      content: '📝 Descrivi il tuo problema. L\'AI ti aiuterà a categorizzarlo!',
      placement: 'right'
    },
    {
      target: '#professionals-list',
      content: '👨‍🔧 Riceverai preventivi dai migliori professionisti.',
      placement: 'left'
    },
    {
      target: '#notifications',
      content: '🔔 Ti terremo aggiornato in tempo reale!',
      placement: 'bottom'
    },
    {
      target: '#profile',
      content: '✅ Completa il tuo profilo per un\'esperienza personalizzata.',
      placement: 'left'
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          primaryColor: '#3B82F6',
          zIndex: 10000
        }
      }}
      callback={(data) => {
        if (data.status === 'finished' || data.status === 'skipped') {
          // Salva che user ha completato onboarding
          localStorage.setItem('onboarding_completed', 'true');
          setRun(false);
        }
      }}
    />
  );
};
```

**CHECKLIST PROGRESSI**

```typescript
// components/onboarding/OnboardingChecklist.tsx
export const OnboardingChecklist = () => {
  const tasks = [
    { id: 'profile', label: 'Completa il profilo', done: true },
    { id: 'first_request', label: 'Crea prima richiesta', done: false },
    { id: 'add_address', label: 'Aggiungi indirizzo', done: false },
    { id: 'enable_notifications', label: 'Attiva notifiche', done: false }
  ];

  const progress = (tasks.filter(t => t.done).length / tasks.length) * 100;

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <h3 className="font-semibold mb-2">🎯 Inizia Qui</h3>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="flex items-center gap-2">
            {task.done ? '✅' : '⬜'}
            <span className={task.done ? 'line-through text-gray-500' : ''}>
              {task.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

📚 DOC: ONBOARDING-SYSTEM.md
```

### ✅ Checklist

- [ ] Install react-joyride
- [ ] Componente `OnboardingTour`
- [ ] 5-7 step guidati
- [ ] Skip button
- [ ] Progress indicator
- [ ] Salva completamento
- [ ] Checklist progressi
- [ ] Video tutorial opzionale
- [ ] Testing first-time user
- [ ] Analytics tracking
- [ ] Documentazione

---

## STEP 14: Salvataggio Bozze 💾

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: -20% abbandono form  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Auto-save form richiesta ogni 5 secondi in localStorage, recupero automatico.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Implementiamo **Salvataggio Bozze**.

```typescript
// hooks/useFormDraft.ts
import { useEffect } from 'react';
import { debounce } from 'lodash';

export const useFormDraft = (formData: any, key: string) => {
  // Auto-save ogni 5 secondi
  useEffect(() => {
    const saveDraft = debounce(() => {
      localStorage.setItem(`draft_${key}`, JSON.stringify(formData));
      console.log('Bozza salvata');
    }, 5000);

    saveDraft();
    
    return () => saveDraft.cancel();
  }, [formData, key]);

  // Load draft al mount
  const loadDraft = () => {
    const draft = localStorage.getItem(`draft_${key}`);
    return draft ? JSON.parse(draft) : null;
  };

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(`draft_${key}`);
  };

  return { loadDraft, clearDraft };
};
```

**USO**

```typescript
const [formData, setFormData] = useState(initialData);
const { loadDraft, clearDraft } = useFormDraft(formData, 'new_request');

useEffect(() => {
  const draft = loadDraft();
  if (draft) {
    // Mostra banner "Ripristina bozza?"
    setShowDraftBanner(true);
  }
}, []);

const handleSubmit = () => {
  // Dopo invio con successo
  clearDraft();
};
```

📚 DOC: già incluso in QUICK-REQUEST-MODE.md
```

### ✅ Checklist

- [ ] Hook `useFormDraft`
- [ ] Auto-save 5s debounce
- [ ] Load draft al mount
- [ ] Banner "Ripristina bozza?"
- [ ] Clear dopo submit
- [ ] Timestamp ultima modifica
- [ ] Testing edge cases
- [ ] Documentazione

---

## STEP 15: Comunicazione Friendly 💬

**Priorità**: 🟢 BASSA  
**Tempo Stimato**: 2 ore  
**Impatto**: +5% brand love  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Rendere messaggi sistema più caldi, friendly, meno corporate.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Rendiamo la **Comunicazione Friendly**.

**BEFORE vs AFTER**

```typescript
// ❌ PRIMA (Corporate, freddo)
"La tua richiesta è stata inviata con successo."
"Errore: campo obbligatorio mancante."
"Preventivo rifiutato."

// ✅ DOPO (Friendly, caldo)
"Ottimo! 🎉 La tua richiesta è in viaggio verso i professionisti!"
"Ops! 😅 Sembra che tu abbia dimenticato qualcosa..."
"Nessun problema! Continua a cercare il preventivo perfetto 👍"
```

**FILE MESSAGGI**

```typescript
// constants/messages.ts
export const MESSAGES = {
  request: {
    created: "Fantastico! 🚀 I professionisti stanno già guardando la tua richiesta!",
    assigned: "Evviva! 🎯 {professionalName} si occuperà di te!",
    completed: "Missione compiuta! ✨ Come è andata?",
    cancelled: "Nessun problema! Siamo qui se hai bisogno 💙"
  },
  quote: {
    received: "Wow! 💰 {professionalName} ti ha inviato un preventivo!",
    accepted: "Perfetto! 🤝 Iniziamo a lavorare insieme!",
    rejected: "Va bene! Continua a cercare, troverai quello giusto 👍"
  },
  errors: {
    required: "Ops! 😅 Questo campo è importante, non dimenticarlo!",
    invalid_email: "Mmm... 🤔 Controlla che l'email sia corretta!",
    network: "Uhm... 📡 Problemi di connessione. Riprova tra un attimo!"
  },
  success: {
    profile_updated: "Fatto! ✅ Il tuo profilo è aggiornato!",
    payment_success: "Evviva! 🎉 Pagamento completato!",
    review_sent: "Grazie! ⭐ La tua opinione conta molto!"
  }
};
```

**TOAST MESSAGES**

```typescript
// Invece di:
toast.success("Operation successful");

// Usare:
toast.success("Fatto! ✨", { 
  description: MESSAGES.success.profile_updated 
});
```

**EMPTY STATES**

```typescript
// Invece di:
<p>No data found</p>

// Usare:
<div className="text-center py-12">
  <p className="text-2xl mb-2">🔍</p>
  <p className="text-gray-700 font-semibold">Ancora niente qui!</p>
  <p className="text-gray-500">Crea la tua prima richiesta per iniziare</p>
</div>
```

📚 DOC: FRIENDLY-COMMUNICATION-GUIDE.md
```

### ✅ Checklist

- [ ] File `messages.ts` creato
- [ ] Tutti toast aggiornati
- [ ] Empty states friendly
- [ ] Error messages friendly
- [ ] Success messages friendly
- [ ] Email templates update
- [ ] Push notifications update
- [ ] WhatsApp messages update
- [ ] Testing tono comunicazione
- [ ] Review copywriting
- [ ] Documentazione

---

# 🟢 FASE 3: MOBILE & RETENTION

---

## STEP 16: Gamification - Club Fedeltà 🎮

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 5 ore  
**Impatto**: -50% churn, +80% LTV  
**Complessità**: 🔴 Alta  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Sistema punti, 3 tier (Bronze/Silver/Gold), badge achievements, benefici esclusivi.

### 📋 PROMPT PRONTO PER CLAUDE

```markdown
Ciao Claude! Creiamo **Club Fedeltà Gamificato**.

**SCHEMA DATABASE**

```prisma
model LoyaltyProgram {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id])
  
  points    Int    @default(0)
  tier      LoyaltyTier @default(BRONZE)
  
  lifetimePoints    Int @default(0)
  lifetimeSpent     Float @default(0)
  
  referralCount     Int @default(0)
  completedRequests Int @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model LoyaltyTransaction {
  id          String @id @default(cuid())
  userId      String
  user        User   @relation(fields: [userId], references: [id])
  
  points      Int
  type        String // EARNED, SPENT, EXPIRED
  reason      String // "Richiesta completata", "Recensione", etc
  
  requestId   String?
  referralId  String?
  
  createdAt   DateTime @default(now())
}

model Achievement {
  id          String @id @default(cuid())
  userId      String
  user        User   @relation(fields: [userId], references: [id])
  
  type        String // FIRST_REQUEST, 10_REQUESTS, TOP_REVIEWER, etc
  unlockedAt  DateTime @default(now())
  
  @@unique([userId, type])
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}
```

**LOGIC SISTEMA PUNTI**

```typescript
// loyalty.service.ts
class LoyaltyService {
  POINT_RULES = {
    REQUEST_COMPLETED: 10,
    REVIEW_LEFT: 5,
    REFERRAL_SIGNUP: 20,
    REFERRAL_FIRST_REQUEST: 50,
    PROFILE_COMPLETED: 15
  };

  TIER_THRESHOLDS = {
    BRONZE: 0,
    SILVER: 100,
    GOLD: 500,
    PLATINUM: 2000
  };

  TIER_BENEFITS = {
    BRONZE: {
      discount: 0,
      prioritySupport: false,
      freeRequest: 0
    },
    SILVER: {
      discount: 5,  // 5%
      prioritySupport: false,
      freeRequest: 0
    },
    GOLD: {
      discount: 10,  // 10%
      prioritySupport: true,
      freeRequest: 1  // 1 intervento gratis ogni 10
    },
    PLATINUM: {
      discount: 15,  // 15%
      prioritySupport: true,
      freeRequest: 1  // 1 intervento gratis ogni 5
    }
  };

  async addPoints(userId: string, points: number, reason: string, metadata?: any) {
    // 1. Crea transazione
    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        points,
        type: 'EARNED',
        reason,
        ...metadata
      }
    });

    // 2. Aggiorna totale
    const loyalty = await prisma.loyaltyProgram.upsert({
      where: { userId },
      create: {
        userId,
        points,
        lifetimePoints: points
      },
      update: {
        points: { increment: points },
        lifetimePoints: { increment: points }
      }
    });

    // 3. Check tier upgrade
    const newTier = this.calculateTier(loyalty.lifetimePoints);
    if (newTier !== loyalty.tier) {
      await this.upgradeTier(userId, newTier);
    }

    // 4. Check achievements
    await this.checkAchievements(userId);

    return loyalty;
  }

  calculateTier(points: number): LoyaltyTier {
    if (points >= this.TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
    if (points >= this.TIER_THRESHOLDS.GOLD) return 'GOLD';
    if (points >= this.TIER_THRESHOLDS.SILVER) return 'SILVER';
    return 'BRONZE';
  }

  async upgradeTier(userId: string, newTier: LoyaltyTier) {
    await prisma.loyaltyProgram.update({
      where: { userId },
      data: { tier: newTier }
    });

    // Invia notifica celebrativa
    await notificationService.emitToUser(userId, 'tier:upgraded', {
      newTier,
      benefits: this.TIER_BENEFITS[newTier]
    });
  }

  async checkAchievements(userId: string) {
    const loyalty = await prisma.loyaltyProgram.findUnique({
      where: { userId },
      include: { user: { include: { requestsAsClient: true } } }
    });

    const achievements = [];

    // First request
    if (loyalty.completedRequests === 1) {
      achievements.push('FIRST_REQUEST');
    }

    // 10 requests
    if (loyalty.completedRequests === 10) {
      achievements.push('VETERAN_CLIENT');
    }

    // 5 referrals
    if (loyalty.referralCount >= 5) {
      achievements.push('REFERRAL_MASTER');
    }

    // Unlock achievements
    for (const type of achievements) {
      await prisma.achievement.upsert({
        where: { userId_type: { userId, type } },
        create: { userId, type },
        update: {}
      });
    }
  }
}

export const loyaltyService = new LoyaltyService();
```

**FRONTEND - Dashboard Fedeltà**

```typescript
// components/loyalty/LoyaltyDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';

export const LoyaltyDashboard = () => {
  const { data: loyalty } = useQuery({
    queryKey: ['loyalty'],
    queryFn: async () => {
      const response = await api.get('/loyalty/me');
      return response.data.data;
    }
  });

  const tierColors = {
    BRONZE: 'from-orange-600 to-orange-800',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-purple-500 to-purple-700'
  };

  const nextTier = {
    BRONZE: { name: 'SILVER', points: 100 },
    SILVER: { name: 'GOLD', points: 500 },
    GOLD: { name: 'PLATINUM', points: 2000 },
    PLATINUM: null
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tier Card */}
      <div className={`bg-gradient-to-r ${tierColors[loyalty.tier]} rounded-lg p-8 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Il Tuo Livello</p>
            <h2 className="text-4xl font-bold">{loyalty.tier}</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{loyalty.points}</p>
            <p className="text-sm opacity-80">Punti</p>
          </div>
        </div>
        
        {nextTier[loyalty.tier] && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Prossimo livello: {nextTier[loyalty.tier].name}</span>
              <span>{loyalty.points}/{nextTier[loyalty.tier].points}</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full"
                style={{ width: `${(loyalty.points / nextTier[loyalty.tier].points) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Benefici */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-xl mb-4">✨ I Tuoi Vantaggi</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {loyalty.benefits.discount}%
            </p>
            <p className="text-sm text-gray-600">Sconto</p>
          </div>
          <div className="text-center">
            <p className="text-3xl">
              {loyalty.benefits.prioritySupport ? '✅' : '❌'}
            </p>
            <p className="text-sm text-gray-600">Supporto Prioritario</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              1/{loyalty.benefits.freeRequest || '∞'}
            </p>
            <p className="text-sm text-gray-600">Intervento Gratis</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-xl mb-4">🏆 Achievement</h3>
        <div className="grid grid-cols-4 gap-4">
          {loyalty.achievements.map(achievement => (
            <div key={achievement.type} className="text-center">
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <p className="text-xs font-semibold">{achievement.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Come Guadagnare Punti */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-bold mb-3">💡 Guadagna Più Punti</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Completa una richiesta: <strong>+10 punti</strong></li>
          <li>✓ Lascia una recensione: <strong>+5 punti</strong></li>
          <li>✓ Invita un amico: <strong>+20 punti</strong></li>
          <li>✓ Amico completa prima richiesta: <strong>+50 punti</strong></li>
        </ul>
      </div>
    </div>
  );
};
```

📚 DOC: LOYALTY-GAMIFICATION-SYSTEM.md
```

### ✅ Checklist

- [ ] Models Loyalty creati
- [ ] Service `loyalty.service.ts`
- [ ] Logic punti implementata
- [ ] Tier calculation
- [ ] Achievements system
- [ ] API endpoints CRUD
- [ ] Dashboard frontend
- [ ] Tier upgrade notifications
- [ ] Achievement unlock animations
- [ ] Testing edge cases
- [ ] Admin panel gestione
- [ ] Documentazione completa

**Continua con Step 17-20 per completare Fase 3...**

---

## STEP 17-20: [Altri Step Fase 3]

[Formato identico agli step precedenti]

---

# 📊 TRACKING AVANZAMENTO

## Come Aggiornare lo Stato

Dopo aver completato ogni step:

1. **Aggiorna questo documento**:
   ```markdown
   ## STEP X: Titolo ⭐
   **Stato**: ✅ Completato (era: ⬜ Da Fare)
   ```

2. **Aggiorna Dashboard all'inizio**:
   ```
   FASE 1 - QUICK WINS:  1/8  ✅⬜⬜⬜⬜⬜⬜⬜
   ```

3. **Crea Report Sessione**:
   Salva in `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-[GG]-step-[N]-[nome].md`

4. **Commit Git**:
   ```bash
   git add .
   git commit -m "feat: Step X completato - [Titolo]"
   git push origin main
   ```

---

# ✅ QUICK REFERENCE

## Comandi Rapidi

```bash
# Avviare sistema
cd backend && npm run dev  # Terminal 1
npm run dev                # Terminal 2
redis-server               # Terminal 3

# Testing
npm run test
npm run test:e2e

# Database
cd backend
npx prisma migrate dev
npx prisma studio

# Backup
./scripts/backup-all.sh
```

## Link Utili

- Backend: http://localhost:3200
- Frontend: http://localhost:5193
- API Docs: http://localhost:3200/api-docs
- Prisma Studio: npx prisma studio

---

# 🆘 HELP & SUPPORT

**Problemi durante implementazione?**

1. Controlla ISTRUZIONI-PROGETTO.md per regole tecniche
2. Consulta documentazione specifica in DOCUMENTAZIONE/ATTUALE/
3. Verifica esempi simili già implementati nel codice
4. Crea issue su GitHub con tag [help-wanted]

**Contatti:**
- Email: lucamambelli@lmtecnologie.it
- GitHub: @241luca

---

**Fine Piano Implementazione Step-by-Step v1.0**  
**Prossimo aggiornamento**: Dopo completamento Fase 1

---

## 📝 CHANGELOG PIANO

### v1.0.0 - 04 Ottobre 2025
- ✅ Piano iniziale creato
- ✅ 20 step definiti in 3 fasi
- ✅ Prompt dettagliati per ogni step
- ✅ Template report sessione
- ✅ Sistema tracking avanzamento
