# 🎯 PIANO IMPLEMENTAZIONE STEP-BY-STEP
## Sistema Richiesta Assistenza - Roadmap Operativa Dettagliata

**Data Creazione**: 04 Ottobre 2025  
**Versione**: 1.0.1 (FIXED - Prompt delimitati)  
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

## 🎯 COME USARE I PROMPT

Ogni step ha un **PROMPT COMPLETO** delimitato così:

```
┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐
│                                                           │
│  Tutto il testo qui dentro va copiato e incollato        │
│  a Claude per implementare lo step                       │
│                                                           │
└──────────────── FINE PROMPT DA COPIARE ──────────────────┘
```

**Dopo il prompt** trovi:
- 💾 Backup Pre-Implementazione
- ✅ Checklist Completamento  
- 🎯 Risultato Atteso
- 🔄 Prossimo Step

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

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

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
  isVerified    Boolean  @default(false)
  helpfulCount  Int      @default(0)
  reportedCount Int      @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([professionalId])
  @@index([clientId])
  @@index([rating])
}
```

Aggiorna il model User:
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

const createReviewSchema = z.object({
  requestId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000).optional()
});

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
    const request = await prisma.request.findUnique({
      where: { id: data.requestId },
      include: { professional: true }
    });

    if (!request) throw new Error('Richiesta non trovata');
    if (request.status !== 'COMPLETED') throw new Error('Puoi recensire solo interventi completati');
    if (request.clientId !== data.clientId) throw new Error('Non puoi recensire questa richiesta');

    const existing = await prisma.review.findUnique({
      where: { requestId: data.requestId }
    });
    if (existing) throw new Error('Hai già recensito questo intervento');

    const review = await prisma.review.create({
      data: {
        requestId: data.requestId,
        rating: data.rating,
        comment: data.comment,
        clientId: data.clientId,
        professionalId: request.professionalId!,
        isVerified: true
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
    // Aggiorna rating nel profilo professionista
  }
}

export const reviewService = new ReviewService();
```

Registra le routes in `backend/src/app.ts`:
```typescript
import reviewRoutes from './routes/reviews.routes';
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

Crea `src/components/reviews/ReviewForm.tsx` e `ReviewList.tsx` seguendo lo stesso pattern.

**4. INTEGRAZIONE**

Aggiungi componente recensioni nella pagina profilo professionista.

⚠️ REGOLE IMPORTANTI:
1. ✅ Fare BACKUP schema Prisma prima di modificare
2. ✅ Usare React Query per tutte le chiamate API
3. ✅ Validazione Zod su tutti gli input
4. ✅ ResponseFormatter nelle routes
5. ✅ Tailwind CSS per tutto lo styling
6. ✅ Heroicons per le icone

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

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### 💾 Backup Pre-Implementazione

```bash
# ESEGUIRE PRIMA DI INIZIARE
cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)
cp backend/src/app.ts backend/src/app.ts.backup-$(date +%Y%m%d-%H%M%S)
cd backend && npm run db:backup
```

### ✅ Checklist Completamento

**Database & Backend**
- [ ] Tabella `Review` creata in schema Prisma
- [ ] Relazioni aggiunte a `User` e `Request`
- [ ] Migration eseguita con successo
- [ ] Service `review.service.ts` creato
- [ ] Routes `reviews.routes.ts` create
- [ ] Routes registrate in `app.ts`

**Frontend**
- [ ] Componente `StarRating.tsx` creato
- [ ] Componente `ReviewForm.tsx` creato
- [ ] Componente `ReviewList.tsx` creato
- [ ] Componenti integrati in pagina profilo

**Testing**
- [ ] Test: Creare recensione 5 stelle
- [ ] Test: Tentare recensione duplicata (deve fallire)
- [ ] Test: Calcolo rating medio corretto

**Documentazione**
- [ ] `REVIEW-SYSTEM.md` creato
- [ ] Report sessione creato

### 🎯 Risultato Atteso

Al termine dello step, il sistema dovrà:
1. ✅ Permettere ai clienti di lasciare recensioni
2. ✅ Mostrare stelle e commenti nel profilo
3. ✅ Calcolare rating medio
4. ✅ Essere completamente testato

### 🔄 Prossimo Step
➡️ [Step 2: Foto Professionisti Obbligatorie](#step-2-foto-professionisti-obbligatorie-📸)

---

[Il documento continua con gli altri 19 step usando lo stesso formato...]
