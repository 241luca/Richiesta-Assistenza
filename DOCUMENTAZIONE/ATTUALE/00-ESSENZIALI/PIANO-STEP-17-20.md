# 🟢 FASE 3: MOBILE & RETENTION - Step 17-20

**Completamento Fase 3**  
**Data**: 05 Ottobre 2025

---

## STEP 17: Referral Program 🎁

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 4 ore  
**Impatto**: +50% nuovi utenti organici  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Sistema referral completo: codice univoco per utente, tracking conversioni, bonus per referrer e referee.

### 💡 Perché È Importante
- Crescita organica più economica di ads
- Clienti referral hanno +37% retention
- Viral loop naturale
- Riduce CAC del 60%

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Creiamo il **Referral Program**.

📚 RIFERIMENTI:
- ISTRUZIONI-PROGETTO.md
- Step 16 completato (Loyalty Program)

🎯 TASK: Sistema referral con tracking e rewards.

**1. SCHEMA DATABASE**

```prisma
model Referral {
  id          String @id @default(cuid())
  
  // Referrer (chi invita)
  referrerId  String
  referrer    User   @relation("ReferralsSent", fields: [referrerId], references: [id])
  
  // Referee (chi è invitato)
  refereeId   String? @unique
  referee     User?   @relation("ReferralsReceived", fields: [refereeId], references: [id])
  
  code        String  @unique // Codice univoco: MARIO2024ABC
  email       String? // Email invitato (prima registrazione)
  
  status      ReferralStatus @default(PENDING)
  
  // Tracking
  clickedAt      DateTime?
  registeredAt   DateTime?
  firstRequestAt DateTime?
  
  // Rewards
  referrerRewardGiven Boolean @default(false)
  refereeRewardGiven  Boolean @default(false)
  
  createdAt   DateTime @default(now())
  
  @@index([referrerId])
  @@index([code])
}

enum ReferralStatus {
  PENDING      // Invito inviato, non ancora registrato
  REGISTERED   // Referee registrato
  CONVERTED    // Referee ha completato prima richiesta
  EXPIRED      // Scaduto (90 giorni)
}

model User {
  // ... campi esistenti ...
  
  referralCode      String?   @unique // Codice personale utente
  referralsSent     Referral[] @relation("ReferralsSent")
  referralsReceived Referral[] @relation("ReferralsReceived")
}
```

**2. SERVIZIO REFERRAL**

```typescript
// referral.service.ts
import { customAlphabet } from 'nanoid';

class ReferralService {
  REWARDS = {
    REFERRER_SIGNUP: 20,      // Punti quando referee si registra
    REFERRER_CONVERSION: 50,   // Punti quando referee completa prima richiesta
    REFEREE_BONUS: 10          // Punti bonus per nuovo utente
  };

  generateReferralCode(userId: string, name: string): string {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
    const namePrefix = name.substring(0, 4).toUpperCase();
    const year = new Date().getFullYear();
    const random = nanoid();
    return `${namePrefix}${year}${random}`;
  }

  async createReferral(referrerId: string, email: string) {
    const referrer = await prisma.user.findUnique({
      where: { id: referrerId }
    });

    const code = this.generateReferralCode(
      referrerId,
      referrer.firstName
    );

    const referral = await prisma.referral.create({
      data: {
        referrerId,
        code,
        email: email.toLowerCase()
      }
    });

    // Invia email invito
    await emailService.sendReferralInvite(email, {
      referrerName: `${referrer.firstName} ${referrer.lastName}`,
      code,
      link: `${process.env.FRONTEND_URL}/signup?ref=${code}`
    });

    return referral;
  }

  async trackClick(code: string) {
    await prisma.referral.updateMany({
      where: { code, clickedAt: null },
      data: { clickedAt: new Date() }
    });
  }

  async trackSignup(code: string, newUserId: string) {
    const referral = await prisma.referral.findUnique({
      where: { code }
    });

    if (!referral) return;

    await prisma.referral.update({
      where: { code },
      data: {
        refereeId: newUserId,
        registeredAt: new Date(),
        status: 'REGISTERED'
      }
    });

    // Reward referrer - signup bonus
    await loyaltyService.addPoints(
      referral.referrerId,
      this.REWARDS.REFERRER_SIGNUP,
      'Referral: Amico registrato',
      { referralId: referral.id }
    );

    // Reward referee - welcome bonus
    await loyaltyService.addPoints(
      newUserId,
      this.REWARDS.REFEREE_BONUS,
      'Bonus benvenuto da referral',
      { referralId: referral.id }
    );

    // Notifica referrer
    await notificationService.emitToUser(
      referral.referrerId,
      'referral:signup',
      { message: 'Il tuo amico si è registrato! +20 punti' }
    );
  }

  async trackFirstRequest(userId: string) {
    const referral = await prisma.referral.findUnique({
      where: { refereeId: userId }
    });

    if (!referral || referral.status === 'CONVERTED') return;

    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        firstRequestAt: new Date(),
        status: 'CONVERTED'
      }
    });

    // Big reward per conversione
    await loyaltyService.addPoints(
      referral.referrerId,
      this.REWARDS.REFERRER_CONVERSION,
      'Referral: Amico ha completato prima richiesta!',
      { referralId: referral.id }
    );

    // Notifica referrer
    await notificationService.emitToUser(
      referral.referrerId,
      'referral:converted',
      { message: 'Il tuo amico ha completato la prima richiesta! +50 punti 🎉' }
    );
  }

  async getReferralStats(userId: string) {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId }
    });

    return {
      total: referrals.length,
      pending: referrals.filter(r => r.status === 'PENDING').length,
      registered: referrals.filter(r => r.status === 'REGISTERED').length,
      converted: referrals.filter(r => r.status === 'CONVERTED').length,
      totalEarned: (
        referrals.filter(r => r.status === 'REGISTERED').length * this.REWARDS.REFERRER_SIGNUP +
        referrals.filter(r => r.status === 'CONVERTED').length * this.REWARDS.REFERRER_CONVERSION
      )
    };
  }
}

export const referralService = new ReferralService();
```

**3. API ENDPOINTS**

```typescript
// referral.routes.ts
router.get('/my-code', authenticate, async (req, res) => {
  let user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  // Genera codice se non esiste
  if (!user.referralCode) {
    const code = referralService.generateReferralCode(
      user.id,
      user.firstName
    );
    user = await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code }
    });
  }

  return res.json(ResponseFormatter.success({
    code: user.referralCode,
    link: `${process.env.FRONTEND_URL}/signup?ref=${user.referralCode}`,
    shareText: `Prova ${process.env.APP_NAME}! Usa il mio codice ${user.referralCode} e ottieni bonus!`
  }));
});

router.post('/invite', authenticate, validateRequest(z.object({
  email: z.string().email()
})), async (req, res) => {
  const referral = await referralService.createReferral(
    req.user.id,
    req.body.email
  );
  return res.json(ResponseFormatter.success(referral, 'Invito inviato!'));
});

router.get('/stats', authenticate, async (req, res) => {
  const stats = await referralService.getReferralStats(req.user.id);
  return res.json(ResponseFormatter.success(stats));
});

router.get('/track/:code', async (req, res) => {
  await referralService.trackClick(req.params.code);
  return res.redirect(`${process.env.FRONTEND_URL}/signup?ref=${req.params.code}`);
});
```

**4. FRONTEND - Pagina Referral**

```typescript
// pages/ReferralPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShareIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export const ReferralPage = () => {
  const [email, setEmail] = useState('');

  const { data: referralData } = useQuery({
    queryKey: ['my-referral-code'],
    queryFn: async () => {
      const response = await api.get('/referrals/my-code');
      return response.data.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const response = await api.get('/referrals/stats');
      return response.data.data;
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/referrals/invite', { email });
      return response.data;
    },
    onSuccess: () => {
      setEmail('');
      toast.success('Invito inviato! 🎉');
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato! 📋');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(referralData.shareText);
    const link = encodeURIComponent(referralData.link);
    window.open(`https://wa.me/?text=${text}%20${link}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">
          🎁 Invita Amici, Guadagna Punti!
        </h1>
        <p className="text-lg opacity-90">
          Per ogni amico che si registra guadagni 20 punti.
          Se completa una richiesta: 50 punti bonus!
        </p>
      </div>

      {/* Il Tuo Codice */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="font-bold text-xl mb-4">Il Tuo Codice Referral</h2>
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Codice</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-blue-600">
              {referralData?.code}
            </p>
            <button
              onClick={() => copyToClipboard(referralData?.code)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              📋 Copia
            </button>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Link Diretto</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 truncate mr-4">
              {referralData?.link}
            </p>
            <button
              onClick={() => copyToClipboard(referralData?.link)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex-shrink-0"
            >
              📋 Copia
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={shareViaWhatsApp}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <ShareIcon className="h-5 w-5" />
            Condividi su WhatsApp
          </button>
          <button
            onClick={() => copyToClipboard(referralData?.shareText)}
            className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold"
          >
            Copia Messaggio
          </button>
        </div>
      </div>

      {/* Invita via Email */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="font-bold text-xl mb-4">Invita via Email</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@amico.com"
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <button
            onClick={() => inviteMutation.mutate(email)}
            disabled={!email || inviteMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            <UserPlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="font-bold text-xl mb-4">📊 Le Tue Statistiche</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{stats?.total || 0}</p>
            <p className="text-sm text-gray-600">Inviti Totali</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
            <p className="text-sm text-gray-600">In Attesa</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.converted || 0}</p>
            <p className="text-sm text-gray-600">Convertiti</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{stats?.totalEarned || 0}</p>
            <p className="text-sm text-gray-600">Punti Guadagnati</p>
          </div>
        </div>
      </div>

      {/* Come Funziona */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6">
        <h3 className="font-bold mb-3">💡 Come Funziona</h3>
        <ol className="space-y-2 text-sm">
          <li>1️⃣ Condividi il tuo codice o link con gli amici</li>
          <li>2️⃣ Il tuo amico si registra usando il tuo codice</li>
          <li>3️⃣ Tu ricevi <strong>20 punti</strong> subito! 🎉</li>
          <li>4️⃣ Quando completa la prima richiesta: <strong>50 punti bonus</strong>! 🚀</li>
          <li>5️⃣ Il tuo amico riceve <strong>10 punti</strong> di benvenuto!</li>
        </ol>
      </div>
    </div>
  );
};
```

⚠️ IMPORTANTE:
- Tracking pixel per analytics
- Prevenzione frodi (stesso IP, device fingerprint)
- Scadenza inviti dopo 90 giorni
- Limite 10 inviti/giorno per utente
- Email template professionale

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/REFERRAL-SYSTEM.md
- Report sessione in REPORT-SESSIONI/

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### 💾 Backup Pre-Implementazione

```bash
cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)
```

### ✅ Checklist Completamento

**Database & Backend**
- [ ] Model `Referral` creato
- [ ] Relazioni User ↔ Referral
- [ ] Service `referral.service.ts`
- [ ] Generazione codici univoci
- [ ] Tracking click/signup/conversion
- [ ] API endpoints CRUD
- [ ] Email invito template
- [ ] Integrazione loyalty rewards

**Frontend**
- [ ] Pagina `/referral`
- [ ] Display codice personale
- [ ] Copia codice/link
- [ ] Share WhatsApp/Email/Social
- [ ] Form invito email
- [ ] Dashboard statistiche
- [ ] Mobile sharing native

**Testing**
- [ ] Generazione codice univoco
- [ ] Tracking completo flusso
- [ ] Rewards corretti
- [ ] Email invio
- [ ] Prevenzione frodi base
- [ ] Analytics tracking

**Documentazione**
- [ ] `REFERRAL-SYSTEM.md` completo
- [ ] Email templates documentati
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 18: Celebrazioni Animate](#step-18-celebrazioni-animate-🎉)

---

## STEP 18: Celebrazioni Animate 🎉

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 3 ore  
**Impatto**: +20% emotional engagement  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Animazioni lottie per eventi importanti: prima richiesta, tier upgrade, achievement unlock, intervento completato.

### 💡 Perché È Importante
- Gamification emotiva
- Memorabile user experience
- Incentiva comportamenti positivi
- Viral su social (screenshot)

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Creiamo **Celebrazioni Animate**.

📚 INSTALLAZIONE:

```bash
npm install lottie-react
```

🎯 TASK: Animazioni celebrative per eventi chiave.

**1. COMPONENTE CELEBRAZIONE**

```typescript
// components/celebrations/CelebrationModal.tsx
import React, { useEffect } from 'react';
import Lottie from 'lottie-react';
import confettiAnimation from '../../assets/animations/confetti.json';
import trophyAnimation from '../../assets/animations/trophy.json';
import starAnimation from '../../assets/animations/star.json';

interface CelebrationModalProps {
  isOpen: boolean;
  type: 'first_request' | 'tier_upgrade' | 'achievement' | 'request_completed';
  title: string;
  message: string;
  reward?: {
    points?: number;
    badge?: string;
  };
  onClose: () => void;
}

const animations = {
  first_request: confettiAnimation,
  tier_upgrade: trophyAnimation,
  achievement: starAnimation,
  request_completed: confettiAnimation
};

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  type,
  title,
  message,
  reward,
  onClose
}) => {
  useEffect(() => {
    if (isOpen) {
      // Suono celebrazione (opzionale)
      const audio = new Audio('/sounds/celebration.mp3');
      audio.play().catch(() => {});

      // Auto-close dopo 5 secondi
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Animazione di sfondo */}
        <div className="absolute inset-0 pointer-events-none">
          <Lottie
            animationData={animations[type]}
            loop={true}
            className="w-full h-full"
          />
        </div>

        {/* Contenuto */}
        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            {message}
          </p>

          {reward && (
            <div className="bg-yellow-100 rounded-lg p-4 mb-4">
              {reward.points && (
                <p className="text-2xl font-bold text-yellow-700">
                  +{reward.points} Punti! 🎉
                </p>
              )}
              {reward.badge && (
                <p className="text-4xl mt-2">{reward.badge}</p>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Fantastico! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
```

**2. HOOK CELEBRAZIONI**

```typescript
// hooks/useCelebration.ts
import { create } from 'zustand';

interface CelebrationState {
  isOpen: boolean;
  type: string;
  title: string;
  message: string;
  reward?: any;
  celebrate: (data: any) => void;
  close: () => void;
}

export const useCelebration = create<CelebrationState>((set) => ({
  isOpen: false,
  type: '',
  title: '',
  message: '',
  reward: undefined,
  celebrate: (data) => set({ isOpen: true, ...data }),
  close: () => set({ isOpen: false })
}));
```

**3. USARE LE CELEBRAZIONI**

```typescript
// Esempio: Prima richiesta completata
import { useCelebration } from '../hooks/useCelebration';

const createRequestMutation = useMutation({
  mutationFn: async (data) => {
    const response = await api.post('/requests', data);
    return response.data;
  },
  onSuccess: (data) => {
    // Check se è la prima richiesta
    if (data.isFirstRequest) {
      celebrate({
        type: 'first_request',
        title: '🎉 Prima Richiesta Creata!',
        message: 'Ottimo inizio! I professionisti la stanno già guardando.',
        reward: { points: 10, badge: '🥇' }
      });
    }
  }
});

// Esempio: Tier upgrade
useEffect(() => {
  if (loyalty.tier !== previousTier) {
    celebrate({
      type: 'tier_upgrade',
      title: `🏆 Nuovo Livello: ${loyalty.tier}!`,
      message: `Complimenti! Ora hai sconti fino al ${loyalty.benefits.discount}%`,
      reward: { badge: getTierEmoji(loyalty.tier) }
    });
  }
}, [loyalty.tier]);

// Esempio: Achievement unlock
const unlockAchievement = (achievement) => {
  celebrate({
    type: 'achievement',
    title: '⭐ Achievement Sbloccato!',
    message: achievement.name,
    reward: { points: achievement.points, badge: achievement.icon }
  });
};
```

**4. ANIMAZIONI LOTTIE**

Scarica animazioni gratuite da:
- https://lottiefiles.com/
- Cerca: "confetti", "trophy", "celebration", "fireworks"

Salva in: `src/assets/animations/`

**5. EVENTI DA CELEBRARE**

```typescript
const CELEBRATION_EVENTS = {
  // Cliente
  FIRST_REQUEST: {
    title: '🎉 Prima Richiesta!',
    message: 'Fantastico! I professionisti la stanno già guardando!',
    points: 10
  },
  REQUEST_COMPLETED: {
    title: '✅ Intervento Completato!',
    message: 'Come è andata? Lascia una recensione!',
    points: 10
  },
  FIRST_REVIEW: {
    title: '⭐ Prima Recensione!',
    message: 'Grazie! La tua opinione aiuta altri utenti!',
    points: 5
  },
  
  // Loyalty
  TIER_SILVER: {
    title: '🥈 Livello Silver!',
    message: 'Ora hai 5% di sconto su tutti i servizi!',
    badge: '🥈'
  },
  TIER_GOLD: {
    title: '🥇 Livello Gold!',
    message: 'Complimenti! Supporto prioritario sbloccato!',
    badge: '🥇'
  },
  TIER_PLATINUM: {
    title: '💎 Livello Platinum!',
    message: 'Sei nella top 1%! Benefici esclusivi!',
    badge: '💎'
  },
  
  // Achievements
  VETERAN_CLIENT: {
    title: '🏆 Cliente Veterano!',
    message: '10 richieste completate! Sei un pro!',
    points: 50
  },
  TOP_REVIEWER: {
    title: '📝 Top Reviewer!',
    message: '5 recensioni lasciate! Sei prezioso!',
    points: 25
  },
  REFERRAL_MASTER: {
    title: '🎁 Referral Master!',
    message: '5 amici invitati! Ambassador ufficiale!',
    points: 100
  }
};
```

⚠️ BEST PRACTICES:
- Max 5 secondi durata
- Skip button sempre visibile
- Non bloccare navigazione
- Sound opzionale con mute
- Analytics tracking eventi

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/CELEBRATIONS-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist Completamento

- [ ] Install lottie-react
- [ ] Componente `CelebrationModal`
- [ ] Hook `useCelebration`
- [ ] Animazioni scaricate (3-5)
- [ ] Eventi celebrazione definiti
- [ ] Integrato in request flow
- [ ] Integrato in loyalty flow
- [ ] Sound effects opzionali
- [ ] Analytics tracking
- [ ] Mobile testing
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 19: Tracking Professionista Live](#step-19-tracking-professionista-live-🚗)

---

## STEP 19: Tracking Professionista Live 🚗

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 4 ore  
**Impatto**: -30% ansia cliente, +20% soddisfazione  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Live tracking professionista in arrivo: mappa real-time, ETA aggiornato, notifiche posizione.

### 💡 Perché È Importante
- Riduce ansia attesa cliente
- Trasparenza totale
- Esperienza premium tipo Uber
- Riduce chiamate "dove sei?"

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Implementiamo **Tracking Live Professionista**.

📚 RIFERIMENTI:
- Google Maps API già configurata
- Socket.io attivo

🎯 TASK: Mappa real-time con posizione professionista e ETA.

**1. BACKEND - Location Service**

```typescript
// location.service.ts
import { prisma } from '../config/database';
import { notificationService } from './notification.service';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

class LocationService {
  // Cache Redis per location real-time
  private locationCache = new Map<string, Location>();

  async updateProfessionalLocation(
    professionalId: string,
    location: Location
  ) {
    // Salva in cache (Redis in produzione)
    this.locationCache.set(professionalId, location);

    // Trova richieste in corso per questo professionista
    const activeRequests = await prisma.request.findMany({
      where: {
        professionalId,
        status: 'IN_PROGRESS',
        scheduledFor: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Prossime 24h
        }
      },
      include: {
        client: true
      }
    });

    // Emetti location a tutti i clienti interessati
    for (const request of activeRequests) {
      // Calcola ETA
      const eta = await this.calculateETA(
        location,
        {
          latitude: request.latitude,
          longitude: request.longitude
        }
      );

      // Invia update al cliente
      notificationService.emitToUser(request.clientId, 'professional:location', {
        professionalId,
        location,
        eta,
        requestId: request.id
      });

      // Notifica se professionista vicino (< 5 min)
      if (eta.duration < 5 * 60) {
        notificationService.emitToUser(request.clientId, 'professional:arriving', {
          professionalName: `${request.professional.firstName}`,
          eta: `${Math.ceil(eta.duration / 60)} minuti`
        });
      }
    }

    return location;
  }

  async calculateETA(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ) {
    // Google Maps Distance Matrix API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${from.latitude},${from.longitude}&` +
      `destinations=${to.latitude},${to.longitude}&` +
      `mode=driving&` +
      `departure_time=now&` +
      `traffic_model=best_guess&` +
      `key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();
    const element = data.rows[0]?.elements[0];

    if (element?.status === 'OK') {
      return {
        distance: element.distance.value, // metri
        duration: element.duration_in_traffic?.value || element.duration.value, // secondi
        text: element.duration_in_traffic?.text || element.duration.text
      };
    }

    return null;
  }

  getCurrentLocation(professionalId: string): Location | null {
    return this.locationCache.get(professionalId) || null;
  }
}

export const locationService = new LocationService();
```

**2. API ENDPOINTS**

```typescript
// location.routes.ts
router.post(
  '/update',
  authenticate,
  authorizeRoles(['PROFESSIONAL']),
  validateRequest(z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional()
  })),
  async (req, res) => {
    const location = await locationService.updateProfessionalLocation(
      req.user.id,
      {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        accuracy: req.body.accuracy,
        timestamp: new Date()
      }
    );
    
    return res.json(ResponseFormatter.success(location, 'Posizione aggiornata'));
  }
);

router.get(
  '/professional/:professionalId',
  authenticate,
  async (req, res) => {
    const location = locationService.getCurrentLocation(req.params.professionalId);
    
    if (!location) {
      return res.status(404).json(
        ResponseFormatter.error('Posizione non disponibile')
      );
    }
    
    return res.json(ResponseFormatter.success(location));
  }
);
```

**3. FRONTEND - Tracking Map**

```typescript
// components/tracking/LiveTrackingMap.tsx
import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useSocket } from '../../hooks/useSocket';

interface LiveTrackingMapProps {
  requestId: string;
  professionalId: string;
  destinationLat: number;
  destinationLng: number;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  requestId,
  professionalId,
  destinationLat,
  destinationLng
}) => {
  const [professionalLocation, setProfessionalLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [directions, setDirections] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    // Ascolta aggiornamenti location
    socket.on('professional:location', (data) => {
      if (data.professionalId === professionalId) {
        setProfessionalLocation(data.location);
        setEta(data.eta);
        
        // Calcola percorso
        if (window.google) {
          const directionsService = new google.maps.DirectionsService();
          directionsService.route(
            {
              origin: { 
                lat: data.location.latitude, 
                lng: data.location.longitude 
              },
              destination: { 
                lat: destinationLat, 
                lng: destinationLng 
              },
              travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
              if (status === 'OK') {
                setDirections(result);
              }
            }
          );
        }
      }
    });

    return () => {
      socket.off('professional:location');
    };
  }, [professionalId, socket]);

  return (
    <div className="space-y-4">
      {/* ETA Card */}
      {eta && (
        <div className="bg-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Arrivo stimato</p>
              <p className="text-3xl font-bold">{eta.text}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Distanza</p>
              <p className="text-lg font-semibold">
                {(eta.distance / 1000).toFixed(1)} km
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mappa */}
      <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{
            lat: professionalLocation?.latitude || destinationLat,
            lng: professionalLocation?.longitude || destinationLng
          }}
          zoom={14}
        >
          {/* Marker professionista */}
          {professionalLocation && (
            <Marker
              position={{
                lat: professionalLocation.latitude,
                lng: professionalLocation.longitude
              }}
              icon={{
                url: '/images/car-marker.png',
                scaledSize: new google.maps.Size(40, 40)
              }}
              animation={google.maps.Animation.DROP}
            />
          )}

          {/* Marker destinazione */}
          <Marker
            position={{
              lat: destinationLat,
              lng: destinationLng
            }}
            icon={{
              url: '/images/home-marker.png',
              scaledSize: new google.maps.Size(40, 40)
            }}
          />

          {/* Percorso */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#3B82F6',
                  strokeWeight: 5
                }
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Info Live */}
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Posizione aggiornata in tempo reale</span>
        </div>
        {professionalLocation && (
          <p className="text-xs text-gray-500 mt-1">
            Ultimo aggiornamento: {new Date(professionalLocation.timestamp).toLocaleTimeString('it-IT')}
          </p>
        )}
      </div>

      {/* Azioni Rapide */}
      <div className="flex gap-2">
        <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">
          💬 Chatta
        </button>
        <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold">
          📞 Chiama
        </button>
      </div>
    </div>
  );
};
```

**4. APP PROFESSIONISTA - Location Sharing**

```typescript
// hooks/useLocationSharing.ts (per app mobile professionista)
import { useEffect, useState } from 'react';

export const useLocationSharing = (enabled: boolean) => {
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      return;
    }

    // Watch position ogni 10 secondi
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Invia al backend
        await api.post('/locations/update', {
          latitude,
          longitude,
          accuracy
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    setWatchId(id);

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [enabled]);

  return { watchId };
};
```

⚠️ PRIVACY:
- Tracking SOLO durante interventi attivi
- Consenso esplicito professionista
- Location sharing disattivabile
- Policy privacy aggiornata
- GDPR compliant

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/LIVE-TRACKING-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist Completamento

**Backend**
- [ ] Service `location.service.ts`
- [ ] Update location endpoint
- [ ] Get location endpoint
- [ ] ETA calculation Google Maps
- [ ] Socket.io events
- [ ] Redis cache locations
- [ ] Privacy controls

**Frontend Cliente**
- [ ] Componente `LiveTrackingMap`
- [ ] Google Maps integration
- [ ] DirectionsRenderer percorso
- [ ] ETA display real-time
- [ ] Socket.io listener
- [ ] Notifiche "sta arrivando"

**App Professionista**
- [ ] Hook `useLocationSharing`
- [ ] Geolocation watchPosition
- [ ] Toggle condivisione ON/OFF
- [ ] Background location (mobile)
- [ ] Battery optimization

**Testing**
- [ ] Update location ogni 10s
- [ ] ETA accuracy
- [ ] Percorso rendering
- [ ] Performance con molti update
- [ ] Privacy consent flow

**Documentazione**
- [ ] `LIVE-TRACKING-SYSTEM.md`
- [ ] Privacy policy update
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 20: Mobile App Planning](#step-20-mobile-app-planning-📱)

---

## STEP 20: Mobile App Planning 📱

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 3 ore (solo planning)  
**Impatto**: +100% engagement mobile  
**Complessità**: 🟢 Bassa (solo analisi)  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Analisi e pianificazione app mobile nativa: requisiti, tech stack, roadmap MVP.

### 💡 Perché È Importante
- 70% traffico da mobile
- Push notifications native
- UX superiore a web mobile
- App store presence
- Offline capabilities

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Pianifichiamo la **Mobile App**.

🎯 TASK: Documento strategia e roadmap app mobile.

**ANALISI REQUISITI**

```markdown
# Mobile App - Analisi Requisiti

## 1. TECH STACK DECISION

### Opzione A: React Native (CONSIGLIATA)
**PRO:**
- Condivisione codice con web (React)
- Team già esperto React
- Expo per sviluppo rapido
- OTA updates senza app store review
- Community enorme

**CONTRO:**
- Performance non nativa al 100%
- Alcune librerie iOS/Android separate

**VERDICT:** ✅ React Native + Expo per MVP

### Opzione B: Flutter
**PRO:**
- Performance eccellente
- UI bellissima out-of-box
- Hot reload

**CONTRO:**
- Team deve imparare Dart
- Meno condivisione codice con web

**VERDICT:** ⚠️ Considerare per v2.0

### Opzione C: Native (Swift + Kotlin)
**PRO:**
- Performance massima
- Accesso completo API

**CONTRO:**
- 2x lavoro (iOS + Android)
- Team separati
- No condivisione codice

**VERDICT:** ❌ Non per MVP

## 2. FUNZIONALITÀ MVP (Fase 1)

### Cliente App
- [ ] Login / Registrazione (biometrico)
- [ ] Crea richiesta veloce (2 step)
- [ ] Chat real-time
- [ ] Ricevi/accetta preventivi
- [ ] Tracking live professionista
- [ ] Push notifications
- [ ] Pagamenti in-app
- [ ] Recensioni

### Professionista App
- [ ] Login / Dashboard
- [ ] Ricevi richieste push
- [ ] Crea preventivi veloce
- [ ] Chat real-time
- [ ] Location sharing background
- [ ] Calendario interventi
- [ ] Portfolio foto
- [ ] Earnings dashboard

## 3. FEATURES NATIVE ESSENZIALI

### Push Notifications
- Nuova richiesta match
- Preventivo ricevuto
- Messaggi chat
- Professionista in arrivo (5 min)
- Payment reminder

### Geolocation
- Auto-detect indirizzo
- Background tracking (professionista)
- Mappa live tracking
- Proximity alerts

### Camera
- Scatta foto problema
- Foto portfolio lavori
- Scan documenti

### Payments
- Apple Pay
- Google Pay
- In-app purchase (crediti)

### Biometrics
- Face ID / Touch ID login
- Conferma pagamenti

## 4. ARCHITETTURA

```
┌─────────────────────────────────────────┐
│         React Native App                │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐     │
│  │   Cliente   │  │ Professionista│     │
│  │     App     │  │      App      │     │
│  └─────────────┘  └─────────────┘     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Shared Components             │   │
│  │  - Navigation                   │   │
│  │  - Auth                         │   │
│  │  - API Client                   │   │
│  │  - Chat                         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│      Backend API (già esistente)        │
│      - REST endpoints                   │
│      - Socket.io                        │
│      - Push (FCM + APNs)                │
└─────────────────────────────────────────┘
```

## 5. ROADMAP MVP (12 settimane)

### Settimane 1-2: Setup
- [ ] Inizializzare Expo project
- [ ] Configurare navigazione (React Navigation)
- [ ] Setup Redux/Zustand state
- [ ] Configurare API client
- [ ] Setup push notifications (Expo Notifications)

### Settimane 3-4: Auth & Onboarding
- [ ] Login/Registrazione
- [ ] Biometric login
- [ ] Onboarding tutorial
- [ ] Profilo utente

### Settimane 5-6: Core Features Cliente
- [ ] Quick request form
- [ ] Lista richieste
- [ ] Chat real-time
- [ ] Ricevi preventivi
- [ ] Accetta/rifiuta preventivo

### Settimane 7-8: Core Features Professionista
- [ ] Dashboard richieste
- [ ] Crea preventivo
- [ ] Chat
- [ ] Calendario interventi
- [ ] Location sharing

### Settimane 9-10: Advanced Features
- [ ] Live tracking map
- [ ] Pagamenti in-app
- [ ] Portfolio foto
- [ ] Recensioni

### Settimane 11-12: Polish & Launch
- [ ] Testing completo iOS/Android
- [ ] Performance optimization
- [ ] App store screenshots/metadata
- [ ] Beta testing (TestFlight + Google Play Beta)
- [ ] Launch! 🚀

## 6. DIPENDENZE CHIAVE

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.x",
    "react-navigation": "^6.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "socket.io-client": "^4.x",
    "expo-notifications": "~0.27.0",
    "expo-location": "~16.5.0",
    "expo-camera": "~14.0.0",
    "expo-local-authentication": "~13.8.0",
    "react-native-maps": "1.10.x",
    "@stripe/stripe-react-native": "^0.37.0"
  }
}
```

## 7. METRICHE SUCCESSO MVP

### Settimana 1
- 100 download
- 50 DAU (Daily Active Users)
- 5 richieste create

### Mese 1
- 1000 download
- 300 DAU
- 100 richieste create
- 4.0+ rating

### Mese 3
- 5000 download
- 1500 DAU
- 500 richieste/mese
- 4.5+ rating

## 8. BUDGET STIMATO

### Sviluppo (12 settimane)
- 1 Senior React Native Dev: €8k/mese × 3 = €24k
- 1 UI/UX Designer: €4k/mese × 2 = €8k
- **Totale Sviluppo: €32k**

### Servizi Annuali
- Apple Developer: €99/anno
- Google Play: $25 one-time
- Expo EAS: $29/mese = €348/anno
- Push Notifications: Gratis fino 1M/mese
- **Totale Servizi: €500/anno**

### TOTALE MVP: ~€33k

## 9. RISCHI & MITIGAZIONI

### Rischio 1: App Store Rejection
**Mitigazione:** 
- Review guidelines early
- Privacy policy completa
- Test compliance pre-submit

### Rischio 2: Performance Issues
**Mitigazione:**
- Profiling React Native
- Lista virtualizzata
- Image optimization
- Lazy loading

### Rischio 3: Push Notification Problems
**Mitigazione:**
- Test su device reali
- Fallback email/SMS
- Debug FCM/APNs logs

## 10. NEXT STEPS

1. ✅ Approvare tech stack (React Native + Expo)
2. ✅ Allocare budget €33k
3. ✅ Assumere/assegnare React Native developer
4. ⏳ Kickoff week 1 - Setup project
5. ⏳ Design mockups app (2 settimane)
6. ⏳ Sviluppo sprint 1-6
7. ⏳ Beta testing
8. ⏳ App store launch

## 11. DOCUMENTAZIONE DA CREARE

- [ ] Mobile App Architecture.md
- [ ] React Native Setup Guide.md
- [ ] Push Notifications Setup.md
- [ ] App Store Submission Guide.md
- [ ] Mobile API Endpoints.md
```

📚 SALVA IN:
- DOCUMENTAZIONE/ATTUALE/01-ARCHITETTURA/MOBILE-APP-STRATEGY.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist Completamento

**Analisi**
- [ ] Tech stack decision (React Native)
- [ ] Feature list MVP definita
- [ ] Architettura documentata
- [ ] Roadmap 12 settimane creata
- [ ] Budget calcolato (€33k)
- [ ] Rischi identificati
- [ ] KPI definiti

**Documentazione**
- [ ] `MOBILE-APP-STRATEGY.md` completo
- [ ] Mockups UI/UX (opzionale)
- [ ] Presentazione stakeholder
- [ ] Report sessione

**Decision**
- [ ] Approvazione budget
- [ ] Timeline approvata
- [ ] Team assegnato
- [ ] Go/No-Go decision

---

# 🎉 CONGRATULAZIONI!

## Hai Completato il Piano Step-by-Step!

Se hai seguito tutti i 20 step:

✅ **Fase 1 - Quick Wins**: Sistema recensioni, foto, portfolio, badge, prezzi, garanzie, certificazioni, stats  
✅ **Fase 2 - UX Semplificata**: Quick request, quick actions, AI suggester, geo-detect, onboarding, bozze, comunicazione friendly  
✅ **Fase 3 - Mobile & Retention**: Gamification, referral, celebrazioni, tracking live, mobile app planning

### 📊 Risultati Attesi

Dopo implementazione completa:
- 📈 **+50% conversioni**
- 📉 **-40% abbandono**
- ⭐ **4.5+ rating app**
- 👥 **+80% retention**
- 🚀 **+100% crescita organica**

### 🔄 Prossimi Passi

1. **Monitoring** - Setup analytics per tracciare metriche
2. **A/B Testing** - Ottimizzare conversioni
3. **Iteration** - Migliorare basato su feedback
4. **Scale** - Espandere geograficamente
5. **Enterprise** - Features B2B

---

**Fine Step 17-20 - Piano Completato! 🚀**
