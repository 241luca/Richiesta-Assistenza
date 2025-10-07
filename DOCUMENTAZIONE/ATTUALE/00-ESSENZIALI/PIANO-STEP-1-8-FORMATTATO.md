# 🔴 FASE 1: QUICK WINS - Step 1-8 Formattati

**Data**: 05 Ottobre 2025  
**Versione**: 1.1 - Con Delimitatori Pronti

> 🆕 **AGGIORNAMENTO**: Tutti gli step ora hanno i delimitatori ASCII chiari per copiare facilmente i prompt!

---

## 📋 INDICE STEP 1-8

- [Step 1](#step-1) - Sistema Recensioni Base ⭐ (3-4h)
- [Step 2](#step-2) - Foto Professionisti Obbligatorie 📸 (2-3h)
- [Step 3](#step-3) - Portfolio Lavori Prima/Dopo 🖼️ (4h)
- [Step 4](#step-4) - Badge "Verificato" ✅ (2h)
- [Step 5](#step-5) - Range Prezzi Indicativi 💰 (3h)
- [Step 6](#step-6) - Garanzie Visibili 🛡️ (2h)
- [Step 7](#step-7) - Certificazioni in Evidenza 📜 (2h)
- [Step 8](#step-8) - Statistiche Professionista 📊 (2h)

**Totale Fase 1**: ~20 ore

---

<a name="step-1"></a>
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

**2. BACKEND SERVICE**

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
    // 1. Verifica richiesta completata
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

    // 2. Verifica non esista già recensione
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

    // 4. Aggiorna rating professionista
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
    // Aggiorna campo rating se esiste in User
  }
}

export const reviewService = new ReviewService();
```

**3. BACKEND ROUTES**

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

// CREATE
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

// READ - Stats
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

Registra in `backend/src/app.ts`:
```typescript
import reviewRoutes from './routes/reviews.routes';
app.use('/api/reviews', reviewRoutes);
```

**4. FRONTEND - StarRating Component**

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

**5. FRONTEND - ReviewForm Component**

Crea `src/components/reviews/ReviewForm.tsx`:

```typescript
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StarRating } from './StarRating';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

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
      toast.success('Recensione inviata!');
      onSuccess?.();
    },
    onError: () => {
      toast.error('Errore invio recensione');
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

**6. FRONTEND - ReviewList Component**

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

**7. INTEGRAZIONE**

Nel profilo professionista (`src/pages/ProfessionalProfile.tsx`):

```typescript
import { ReviewList } from '../components/reviews/ReviewList';

// Nel componente
<div className="mt-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">
    Recensioni Clienti
  </h2>
  <ReviewList professionalId={professionalId} />
</div>
```

⚠️ REGOLE IMPORTANTI:
1. ✅ Backup schema Prisma prima
2. ✅ React Query per API
3. ✅ Validazione Zod
4. ✅ ResponseFormatter nelle routes
5. ✅ Tailwind CSS styling
6. ✅ Heroicons per icone

🧪 TESTING:
- Crea recensione 5 stelle con commento
- Crea recensione senza commento
- Tenta recensione duplicata (deve fallire)
- Recensione intervento non completato (deve fallire)
- Visualizza recensioni professionista
- Calcolo rating medio corretto

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/REVIEW-SYSTEM.md
- DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-step-1-recensioni.md

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
- [ ] Tabella `Review` creata
- [ ] Relazioni aggiunte a `User` e `Request`
- [ ] Migration eseguita: `npx prisma migrate dev --name add-reviews`
- [ ] Service `review.service.ts` creato
- [ ] Routes `reviews.routes.ts` create
- [ ] Routes registrate in `app.ts`
- [ ] Validazione Zod presente

**Frontend**
- [ ] Componente `StarRating.tsx` creato
- [ ] Componente `ReviewForm.tsx` creato
- [ ] Componente `ReviewList.tsx` creato
- [ ] Componenti integrati in profilo
- [ ] React Query configurato
- [ ] Tailwind styling applicato

**Testing**
- [ ] Test: Creare recensione 5 stelle
- [ ] Test: Creare recensione senza commento
- [ ] Test: Tentare recensione duplicata
- [ ] Test: Recensire non completato (fail)
- [ ] Test: Visualizzare recensioni
- [ ] Test: Calcolo rating medio
- [ ] Test: Distribuzione stelle

**Documentazione**
- [ ] `REVIEW-SYSTEM.md` creato
- [ ] `CHECKLIST-FUNZIONALITA-SISTEMA.md` aggiornato
- [ ] Report sessione creato
- [ ] Screenshot aggiunti

### 🔄 Prossimo Step
➡️ [Step 2: Foto Professionisti](#step-2)

---

<a name="step-2"></a>
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

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Implementiamo **Foto Professionisti Obbligatorie**.

📚 RIFERIMENTI:
- ISTRUZIONI-PROGETTO.md
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/AUTH-SYSTEM.md

🎯 TASK:
1. Modificare schema User per campo profileImage
2. Upload foto in registrazione/profilo
3. Validazione: JPG/PNG, max 5MB, min 200x200px
4. Mostrare foto ovunque
5. Placeholder per foto mancanti

**1. SCHEMA PRISMA**

```prisma
model User {
  // ... campi esistenti ...
  
  profileImage String?
}
```

**2. BACKEND - Upload Service**

Usa servizio esistente `backend/src/services/upload.service.ts`

Aggiungi validazione:

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

**3. FRONTEND - ProfileImageUpload Component**

Crea `src/components/profile/ProfileImageUpload.tsx`:

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CameraIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

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
      toast.success('Foto caricata!');
    },
    onError: () => {
      toast.error('Errore upload foto');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione client-side
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File troppo grande. Massimo 5MB');
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
        <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
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
    </div>
  );
};
```

**4. FRONTEND - UserAvatar Component**

Crea `src/components/common/UserAvatar.tsx`:

```typescript
import React from 'react';

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
          <span className="text-white font-semibold text-sm">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};
```

**5. USARE OVUNQUE**

Lista professionisti, chat, preventivi:

```typescript
import { UserAvatar } from '../common/UserAvatar';

<div className="flex items-center gap-3">
  <UserAvatar 
    imageUrl={professional.profileImage}
    name={`${professional.firstName} ${professional.lastName}`}
    size="md"
  />
  <div>
    <h3 className="font-semibold">{professional.firstName} {professional.lastName}</h3>
    <p className="text-sm text-gray-600">{professional.profession}</p>
  </div>
</div>
```

⚠️ IMPORTANTE:
- Ottimizzare con sharp (resize 400x400, quality 85)
- CDN per delivery
- Lazy loading
- Fallback gradient con iniziali

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/PROFILE-IMAGE-SYSTEM.md
- Report sessione

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### 💾 Backup Pre-Implementazione

```bash
cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)
cp backend/src/services/upload.service.ts backend/src/services/upload.service.ts.backup-$(date +%Y%m%d-%H%M%S)
```

### ✅ Checklist Completamento

**Backend**
- [ ] Campo `profileImage` aggiunto
- [ ] Validazione immagine implementata
- [ ] Endpoint `/api/upload/profile-image`
- [ ] Ottimizzazione sharp (resize, quality)
- [ ] Storage configurato

**Frontend**
- [ ] Componente `ProfileImageUpload`
- [ ] Componente `UserAvatar`
- [ ] Upload in registrazione
- [ ] Upload in modifica profilo
- [ ] Avatar in lista professionisti
- [ ] Avatar in chat
- [ ] Avatar in preventivi
- [ ] Fallback con iniziali

**Testing**
- [ ] Upload JPG
- [ ] Upload PNG
- [ ] File > 5MB rifiutato
- [ ] Immagine < 200x200 rifiutata
- [ ] Preview funziona
- [ ] Avatar mostrato ovunque

**Documentazione**
- [ ] `PROFILE-IMAGE-SYSTEM.md`
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 3: Portfolio Prima/Dopo](#step-3)

---

<a name="step-3"></a>
## STEP 3: Portfolio Lavori Prima/Dopo 🖼️

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 4 ore  
**Impatto**: +40% conversioni  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Permettere ai professionisti di caricare foto "Prima/Dopo" dei lavori completati. Gallery visibile nel profilo.

### 💡 Perché È Importante
- Proof sociale più forte delle recensioni
- Aumenta conversioni del 40-50%
- Mostra qualità lavoro reale
- Differenzia professionisti esperti

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Creiamo il **Portfolio Lavori Prima/Dopo**.

📚 RIFERIMENTI:
- ISTRUZIONI-PROGETTO.md
- Step 2 completato (upload immagini)

🎯 TASK: Sistema completo portfolio con foto Prima/Dopo.

**1. SCHEMA DATABASE**

```prisma
model Portfolio {
  id             String   @id @default(cuid())
  title          String
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

**2. BACKEND SERVICE**

Crea `backend/src/services/portfolio.service.ts`:

```typescript
import { prisma } from '../config/database';

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

export const portfolioService = new PortfolioService();
```

**3. BACKEND ROUTES**

Crea `backend/src/routes/portfolio.routes.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { portfolioService } from '../services/portfolio.service';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

// CREATE
router.post(
  '/',
  authenticate,
  async (req, res) => {
    try {
      const portfolio = await portfolioService.createPortfolio({
        ...req.body,
        professionalId: req.user.id
      });
      return res.json(ResponseFormatter.success(portfolio));
    } catch (error) {
      return res.status(400).json(ResponseFormatter.error(error.message));
    }
  }
);

// READ - Portfolio professionista
router.get(
  '/professional/:professionalId',
  async (req, res) => {
    try {
      const portfolio = await portfolioService.getProfessionalPortfolio(
        req.params.professionalId
      );
      return res.json(ResponseFormatter.success(portfolio));
    } catch (error) {
      return res.status(400).json(ResponseFormatter.error(error.message));
    }
  }
);

export default router;
```

Registra in `app.ts`:
```typescript
import portfolioRoutes from './routes/portfolio.routes';
app.use('/api/portfolio', portfolioRoutes);
```

**4. FRONTEND - PortfolioGallery Component**

Crea `src/components/portfolio/PortfolioGallery.tsx`:

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface PortfolioGalleryProps {
  professionalId: string;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({ 
  professionalId 
}) => {
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
      {/* Immagine principale */}
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
            className={`px-6 py-2 font-semibold transition-colors ${
              showBefore ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Prima
          </button>
          <button
            onClick={() => setShowBefore(false)}
            className={`px-6 py-2 font-semibold transition-colors ${
              !showBefore ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dopo
          </button>
        </div>

        {/* Navigazione */}
        {portfolio.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex(i => i > 0 ? i - 1 : portfolio.length - 1)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setSelectedIndex(i => i < portfolio.length - 1 ? i + 1 : 0)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Info lavoro */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="font-semibold text-gray-900">{current.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{current.description}</p>
        <p className="text-xs text-gray-500 mt-2">
          Categoria: {current.category.name}
        </p>
      </div>

      {/* Thumbnails */}
      {portfolio.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {portfolio.map((item: any, index: number) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-video rounded overflow-hidden transition-all ${
                index === selectedIndex 
                  ? 'ring-2 ring-blue-600' 
                  : 'opacity-70 hover:opacity-100'
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
      )}
    </div>
  );
};
```

**5. INTEGRAZIONE**

Nel profilo professionista:

```typescript
import { PortfolioGallery } from '../components/portfolio/PortfolioGallery';

<div className="mt-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">
    Portfolio Lavori
  </h2>
  <PortfolioGallery professionalId={professionalId} />
</div>
```

⚠️ FEATURES:
- Lightbox full-screen
- Slider touch gestures
- Contatore visualizzazioni
- Filtro per categoria
- Watermark opzionale

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/PORTFOLIO-SYSTEM.md
- Report sessione

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist Completamento

**Database & Backend**
- [ ] Model `Portfolio` creato
- [ ] Service `portfolio.service.ts`
- [ ] Routes CRUD portfolio
- [ ] Upload multiplo immagini
- [ ] Validazione (min 800x600)
- [ ] Ottimizzazione sharp

**Frontend**
- [ ] Componente `PortfolioGallery`
- [ ] Toggle Prima/Dopo funzionante
- [ ] Navigazione tra lavori
- [ ] Thumbnails grid
- [ ] Form upload per professionisti
- [ ] Mobile responsive

**Testing**
- [ ] Upload 2 foto (prima/dopo)
- [ ] Visualizzazione gallery
- [ ] Toggle smooth
- [ ] Performance con 20+ items
- [ ] Mobile touch gestures

**Documentazione**
- [ ] `PORTFOLIO-SYSTEM.md`
- [ ] Screenshots
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 4: Badge Verificato](#step-4)

---

<a name="step-4"></a>
## STEP 4: Badge "Verificato" ✅

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 2 ore  
**Impatto**: +15% trust  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Aggiungere badge "✅ Verificato" ai professionisti che hanno completato processo di verifica.

### 💡 Perché È Importante
- Comunicazione immediata di affidabilità
- Differenzia professionisti seri
- Aumenta click del 20-30%
- Premium positioning

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Implementiamo il **Badge Verificato**.

🎯 TASK: Sistema verifica professionisti con badge.

**1. SCHEMA DATABASE**

```prisma
model User {
  // ... campi esistenti ...
  
  isVerified        Boolean  @default(false)
  verifiedAt        DateTime?
  verificationNotes String?  @db.Text
  
  documentsVerified Boolean  @default(false)
  backgroundCheck   Boolean  @default(false)
  certificatesVerified Boolean @default(false)
}
```

**2. BACKEND - Admin Endpoint**

In `backend/src/routes/admin.routes.ts`:

```typescript
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
    
    // Notifica professionista
    await notificationService.emitToUser(
      userId,
      'verification:approved',
      { message: 'Il tuo profilo è stato verificato!' }
    );
    
    return res.json(ResponseFormatter.success(user, 'Professionista verificato'));
  }
);
```

**3. FRONTEND - VerifiedBadge Component**

Crea `src/components/badges/VerifiedBadge.tsx`:

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
    <div className="inline-flex items-center gap-1" title="Profilo Verificato">
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

**4. USARE OVUNQUE**

```typescript
import { VerifiedBadge } from '../badges/VerifiedBadge';

<div className="flex items-center gap-2">
  <h3>{professional.firstName} {professional.lastName}</h3>
  <VerifiedBadge isVerified={professional.isVerified} />
</div>
```

**5. FILTRO "SOLO VERIFICATI"**

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

// UI
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={showOnlyVerified}
    onChange={(e) => setShowOnlyVerified(e.target.checked)}
    className="rounded border-gray-300"
  />
  <span>Solo Verificati</span>
</label>
```

⚠️ IMPORTANTE:
- Badge NON modificabile da professionista
- Solo admin può verificare
- Audit log ogni cambio
- Tooltip informativo

📚 DOC: VERIFICATION-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Campo `isVerified` aggiunto
- [ ] Endpoint admin verifica
- [ ] Componente `VerifiedBadge`
- [ ] Badge in lista professionisti
- [ ] Badge in profilo
- [ ] Badge in preventivi
- [ ] Badge in chat
- [ ] Filtro "Solo verificati"
- [ ] Tooltip
- [ ] Audit log
- [ ] Notifica professionista
- [ ] Testing
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 5: Range Prezzi](#step-5)

---

<a name="step-5"></a>
## STEP 5: Range Prezzi Indicativi 💰

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 3 ore  
**Impatto**: +20% conversioni  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mostrare range di prezzo (es: €80-€150) PRIMA che il cliente richieda preventivo, basato su interventi passati.

### 💡 Perché È Importante
- Riduce ansia da prezzo
- Aumenta trasparenza
- Filtra clienti per budget
- Diminuisce preventivi inutili del 30%

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Creiamo i **Range Prezzi Indicativi**.

🎯 TASK: Calcolare e mostrare range prezzi basato su storico.

**1. SERVIZIO CALCOLO PREZZI**

Crea `backend/src/services/pricing.service.ts`:

```typescript
import { prisma } from '../config/database';

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
      return null; // Non abbastanza dati
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

**2. API ROUTES**

Crea `backend/src/routes/pricing.routes.ts`:

```typescript
import { Router } from 'express';
import { pricingService } from '../services/pricing.service';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

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

export default router;
```

Registra in `app.ts`:
```typescript
import pricingRoutes from './routes/pricing.routes';
app.use('/api/pricing', pricingRoutes);
```

**3. FRONTEND COMPONENT**

Crea `src/components/pricing/PriceRangeDisplay.tsx`:

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
    return <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />;
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
      <div className="mt-4 text-xs text-gray-500 border-t border-blue-200 pt-3">
        ⚠️ Prezzo indicativo. Il preventivo finale può variare in base a complessità e materiali.
      </div>
    </div>
  );
};
```

**4. INTEGRAZIONE**

Nel form nuova richiesta:

```typescript
import { PriceRangeDisplay } from '../components/pricing/PriceRangeDisplay';

// Dopo selezione categoria
{selectedCategory && (
  <PriceRangeDisplay 
    categoryId={selectedCategory}
    subcategoryId={selectedSubcategory}
  />
)}
```

⚠️ IMPORTANTE:
- Dati INDICATIVI
- Disclaimer chiaro
- Min 5 preventivi per calcolo
- Aggiornamento settimanale
- Cache Redis

📚 DOC: PRICING-RANGE-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

**Backend**
- [ ] Service `pricing.service.ts`
- [ ] Metodo `getPriceRange()`
- [ ] Calcolo percentili
- [ ] Routes API `/pricing/range/*`
- [ ] Cache Redis
- [ ] Cron job aggiornamento

**Frontend**
- [ ] Componente `PriceRangeDisplay`
- [ ] Integrato in form
- [ ] Loading state
- [ ] Fallback dati insufficienti
- [ ] Disclaimer
- [ ] Responsive

**Testing**
- [ ] Calcolo con 10+ preventivi
- [ ] Calcolo con 5 preventivi (min)
- [ ] Calcolo con < 5 (null)
- [ ] Performance < 100ms
- [ ] Cache funzionante

**Documentazione**
- [ ] `PRICING-RANGE-SYSTEM.md`
- [ ] Algoritmo documentato
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 6: Garanzie Visibili](#step-6)

---

<a name="step-6"></a>
## STEP 6: Garanzie Visibili 🛡️

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 2 ore  
**Impatto**: +10% conversioni  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Rendere prominenti le garanzie: soddisfatti o rimborsati, assicurazione danni, garanzia lavoro 24 mesi.

### 💡 Perché È Importante
- Rimuove rischio percepito
- Aumenta fiducia
- Differenzia da competitor
- Giustifica prezzi premium

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Rendiamo **Garanzie Visibili** ovunque.

🎯 TASK: Banner garanzie prominenti.

**1. COMPONENTE GARANZIE**

Crea `src/components/guarantees/GuaranteeBanner.tsx`:

```typescript
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

**2. PAGINA DETTAGLI**

Crea `src/pages/Guarantees.tsx`:

```typescript
export const GuaranteesPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        Le Nostre Garanzie
      </h1>

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

**3. MOSTRARE IN:**

- Homepage (above fold)
- Form nuova richiesta
- Pagina preventivo
- Footer ogni pagina
- Email preventivi

Esempio in homepage:

```typescript
import { GuaranteeBanner } from '../components/guarantees/GuaranteeBanner';

// Nella homepage
<div className="container mx-auto px-4 py-8">
  <GuaranteeBanner />
</div>
```

⚠️ TRUST SIGNALS:
- Link termini condizioni
- Numero certificato assicurazione
- Logo compagnia
- Procedura reclami

📚 DOC: GUARANTEES-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Componente `GuaranteeBanner`
- [ ] Pagina `/garanzie`
- [ ] Banner in homepage
- [ ] Banner in form richiesta
- [ ] Banner in preventivi
- [ ] Footer link
- [ ] Mobile responsive
- [ ] Testing UX
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 7: Certificazioni](#step-7)

---

<a name="step-7"></a>
## STEP 7: Certificazioni in Evidenza 📜

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: +8% trust  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mostrare certificazioni e qualifiche professionisti (Certificato Elettricista, Abilitazione Gas, etc).

### 💡 Perché È Importante
- Aumenta trust professionista
- Mostra competenze verificate
- Differenzia esperti
- Conformità normativa

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Mettiamo in evidenza le **Certificazioni**.

🎯 TASK: Badge certificazioni visibili.

**SCHEMA DATABASE**

```prisma
model Certification {
  id              String   @id @default(cuid())
  name            String
  issuer          String
  issueDate       DateTime
  expiryDate      DateTime?
  certificateNumber String?
  
  professionalId  String
  professional    User     @relation("ProfessionalCertifications", fields: [professionalId], references: [id])
  
  verified        Boolean  @default(false)
  documentUrl     String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([professionalId])
}
```

**COMPONENTE**

Crea `src/components/certifications/CertificationBadges.tsx`:

```typescript
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
            title={`${cert.name} - ${cert.issuer}`}
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

**USARE IN PROFILO**

```typescript
import { CertificationBadges } from '../certifications/CertificationBadges';

<div className="mt-6">
  <CertificationBadges certifications={professional.certifications} />
</div>
```

📚 DOC: CERTIFICATIONS-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Model `Certification`
- [ ] CRUD API
- [ ] Form upload professionisti
- [ ] Admin approval workflow
- [ ] Componente `CertificationBadges`
- [ ] Display in profilo
- [ ] Display in lista (mini)
- [ ] Testing upload
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 8: Statistiche](#step-8)

---

<a name="step-8"></a>
## STEP 8: Statistiche Professionista 📊

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: +5% decisione cliente  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mostrare statistiche chiave: 150 lavori, 4.8★ rating, 98% soddisfazione, Membro da 3 anni.

### 💡 Perché È Importante
- Proof sociale numerico
- Rassicura su esperienza
- Aumenta credibilità
- Facilita decisione

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Creiamo **Statistiche Professionista**.

🎯 TASK: Dashboard stats prominente.

**SERVIZIO CALCOLO**

Crea `backend/src/services/professional-stats.service.ts`:

```typescript
import { prisma } from '../config/database';

class ProfessionalStatsService {
  async getStats(professionalId: string) {
    // Lavori completati
    const completedRequests = await prisma.request.count({
      where: {
        professionalId,
        status: 'COMPLETED'
      }
    });

    // Rating medio
    const reviews = await prisma.review.findMany({
      where: { professionalId },
      select: { rating: true }
    });
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Anni esperienza
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: { createdAt: true }
    });
    
    const yearsActive = Math.floor(
      (new Date().getTime() - professional.createdAt.getTime()) / (365 * 24 * 60 * 60 * 1000)
    );

    // Tasso risposta
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

export const professionalStatsService = new ProfessionalStatsService();
```

**API ENDPOINT**

In `backend/src/routes/professionals.routes.ts`:

```typescript
router.get(
  '/:id/stats',
  async (req, res) => {
    try {
      const stats = await professionalStatsService.getStats(req.params.id);
      return res.json(ResponseFormatter.success(stats));
    } catch (error) {
      return res.status(400).json(ResponseFormatter.error(error.message));
    }
  }
);
```

**FRONTEND COMPONENT**

Crea `src/components/professional/ProfessionalStats.tsx`:

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircleIcon, 
  StarIcon, 
  ClockIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import api from '../../services/api';

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

**USARE NEL PROFILO**

```typescript
import { ProfessionalStats } from '../components/professional/ProfessionalStats';

<div className="mb-8">
  <ProfessionalStats professionalId={professionalId} />
</div>
```

⚠️ CACHE:
- Redis cache 1h
- Aggiorna dopo ogni richiesta completata

📚 DOC: PROFESSIONAL-STATS-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Service `professional-stats.service.ts`
- [ ] API `/professionals/:id/stats`
- [ ] Componente `ProfessionalStats`
- [ ] Calcolo lavori completati
- [ ] Calcolo rating medio
- [ ] Calcolo anni esperienza
- [ ] Calcolo tasso risposta
- [ ] Cache Redis (1h)
- [ ] Display profilo
- [ ] Mobile responsive
- [ ] Testing calcoli
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ **Fase 2 - Step 9**: [Quick Request Mode](PIANO-STEP-9-16.md#step-9) (vedi file separato)

---

**Fine Fase 1 - Step 1-8 Formattati! ✅**

**Totale tempo stimato Fase 1**: ~20 ore  
**Impatto atteso**: +30-50% conversioni

**Prossimi step**: Vedi file `PIANO-STEP-9-16.md` per la Fase 2!
