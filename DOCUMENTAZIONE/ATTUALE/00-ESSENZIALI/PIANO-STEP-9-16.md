# 🟡 FASE 2: UX SEMPLIFICATA - Step 9-16

**Completamento Fase 2**  
**Data**: 05 Ottobre 2025  
**Versione**: 1.0

---

## INDICE FASE 2

- [Step 9](#step-9) - Quick Request Mode ⚡
- [Step 10](#step-10) - Quick Actions UI 🎯
- [Step 11](#step-11) - AI Categoria Suggester 🤖
- [Step 12](#step-12) - Geo Auto-Detect 📍
- [Step 13](#step-13) - Onboarding Tutorial 🎓
- [Step 14](#step-14) - Salvataggio Bozze 💾
- [Step 15](#step-15) - Comunicazione Friendly 💬
- [Step 16](#step-16) - Gamification - Club Fedeltà 🎮

---

<a name="step-9"></a>
## STEP 9: Quick Request Mode ⚡

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 4 ore  
**Impatto**: -40% abbandono form  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Modalità veloce per creare richiesta in 2 step invece di 5: Descrizione problema + Indirizzo. L'AI suggerisce categoria/priorità automaticamente.

### 💡 Perché È Importante
- Riduce abbandono form del 40%
- 2 step vs 5 standard = -60% tempo
- AI automatizza categorizzazione
- UX tipo "conversazione naturale"

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Creiamo **Quick Request Mode**.

📚 LEGGI PRIMA:
- ISTRUZIONI-PROGETTO.md
- CHECKLIST-FUNZIONALITA-SISTEMA.md

🎯 TASK: Form semplificato 2 step con AI categorization.

**1. BACKEND - AI CATEGORIZATION**

```typescript
// ai.routes.ts
import { Router } from 'express';
import OpenAI from 'openai';
import { ResponseFormatter } from '../utils/responseFormatter';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const categorizeSchema = z.object({
  description: z.string().min(20).max(500)
});

router.post(
  '/categorize-request',
  validateRequest(categorizeSchema),
  async (req, res) => {
    try {
      const { description } = req.body;
      
      // Chiama OpenAI GPT-3.5 per categorizzazione
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Sei un assistente che categorizza richieste di assistenza domestica.
Rispondi SOLO con un oggetto JSON valido.
Categorie disponibili: idraulica, elettricista, fabbro, giardinaggio, pulizie, traslochi, imbianchino.
Priorità: LOW, MEDIUM, HIGH, URGENT.`
          },
          {
            role: 'user',
            content: `Categorizza questa richiesta: "${description}"

Rispondi con JSON:
{
  "category": "categoria suggerita",
  "priority": "priorità suggerita",
  "estimatedDuration": "durata stimata in minuti",
  "confidence": 0.95,
  "reason": "breve spiegazione"
}`
          }
        ],
        temperature: 0.3 // Più deterministico
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      
      return res.json(ResponseFormatter.success(result));
    } catch (error) {
      console.error('AI categorization error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore categorizzazione AI')
      );
    }
  }
);

export default router;
```

Registra in `app.ts`:
```typescript
import aiRoutes from './routes/ai.routes';
app.use('/api/ai', aiRoutes);
```

**2. FRONTEND - Quick Request Form**

```typescript
// components/requests/QuickRequestForm.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export const QuickRequestForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    description: '',
    address: '',
    aiSuggestion: null
  });

  // Mutation per categorizzazione AI
  const categorizeMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await api.post('/ai/categorize-request', { description });
      return response.data.data;
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, aiSuggestion: data }));
      setStep(2);
    },
    onError: () => {
      toast.error('Errore AI. Procedi manualmente.');
      setStep(2);
    }
  });

  // Mutation per creare richiesta
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/requests', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success('Richiesta creata! 🎉');
      // Redirect a dashboard
      window.location.href = `/requests/${data.id}`;
    }
  });

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    categorizeMutation.mutate(formData.description);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      description: formData.description,
      address: formData.address,
      categoryId: formData.aiSuggestion?.category,
      priority: formData.aiSuggestion?.priority || 'MEDIUM',
      estimatedDuration: formData.aiSuggestion?.estimatedDuration
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header con progress */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ⚡ Richiesta Veloce
        </h1>
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Step {step} di 2
        </p>
      </div>

      {/* STEP 1: Descrizione */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Di cosa hai bisogno?
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Es: Ho una perdita d'acqua sotto il lavandino della cucina. L'acqua gocciola costantemente anche con i rubinetti chiusi..."
              className="w-full h-40 border-2 border-gray-300 rounded-xl p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              maxLength={500}
              required
              minLength={20}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                {formData.description.length}/500 caratteri
              </p>
              <div className="flex items-center gap-2 text-blue-600">
                <SparklesIcon className="h-4 w-4" />
                <span className="text-sm font-medium">AI ti aiuterà</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={formData.description.length < 20 || categorizeMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2"
          >
            {categorizeMutation.isPending ? (
              <>Analizzo con AI...</>
            ) : (
              <>
                Avanti
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Indirizzo + Conferma */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          {/* AI Suggestion */}
          {formData.aiSuggestion && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <SparklesIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    L'AI suggerisce:
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Categoria:</span>{' '}
                      <span className="text-blue-600">{formData.aiSuggestion.category}</span>
                    </p>
                    <p>
                      <span className="font-medium">Priorità:</span>{' '}
                      <span className="text-blue-600">{formData.aiSuggestion.priority}</span>
                    </p>
                    <p>
                      <span className="font-medium">Durata stimata:</span>{' '}
                      {formData.aiSuggestion.estimatedDuration} min
                    </p>
                    <p className="text-gray-600 italic">
                      {formData.aiSuggestion.reason}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Confidenza AI: {Math.round(formData.aiSuggestion.confidence * 100)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Indirizzo */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Dove ti serve l'intervento?
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Via Roma 123, Milano"
              className="w-full border-2 border-gray-300 rounded-xl p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 Tip: Usa il bottone sotto per rilevare automaticamente
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 rounded-xl"
            >
              ← Indietro
            </button>
            <button
              type="submit"
              disabled={!formData.address || createMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl"
            >
              {createMutation.isPending ? 'Creazione...' : 'Crea Richiesta ✓'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
```

**3. INTEGRAZIONE ROUTING**

```typescript
// App.tsx o routes
import { QuickRequestForm } from './components/requests/QuickRequestForm';

<Route path="/quick-request" element={<QuickRequestForm />} />
```

**4. TOGGLE STANDARD/QUICK**

Nella pagina richieste, aggiungi toggle:

```typescript
// pages/NewRequest.tsx
const [mode, setMode] = useState<'quick' | 'standard'>('quick');

<div className="flex gap-4 mb-6">
  <button
    onClick={() => setMode('quick')}
    className={`flex-1 py-3 rounded-lg font-semibold ${
      mode === 'quick' 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    ⚡ Modalità Veloce
  </button>
  <button
    onClick={() => setMode('standard')}
    className={`flex-1 py-3 rounded-lg font-semibold ${
      mode === 'standard' 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    📋 Modalità Standard
  </button>
</div>

{mode === 'quick' ? <QuickRequestForm /> : <StandardRequestForm />}
```

⚠️ IMPORTANTE:
- OpenAI API key in .env
- Gestire rate limits (100 req/min)
- Fallback a selezione manuale se AI fallisce
- Cache suggerimenti comuni in Redis
- Analytics su accuracy AI

📚 DOCUMENTAZIONE:
- DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/QUICK-REQUEST-MODE.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### 💾 Backup Pre-Implementazione

```bash
# Nessun file critico da backuppare per questo step
# Solo aggiunta di nuove routes
```

### ✅ Checklist Completamento

**Backend**
- [ ] Route `/api/ai/categorize-request` creata
- [ ] OpenAI integration configurata
- [ ] Error handling robusto
- [ ] Validazione Zod input
- [ ] ResponseFormatter usato

**Frontend**
- [ ] Componente `QuickRequestForm`
- [ ] 2-step flow implementato
- [ ] AI suggestion display
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Toggle Quick/Standard

**Testing**
- [ ] AI categorizza correttamente 10+ esempi
- [ ] Fallback se AI fallisce
- [ ] Form validation funziona
- [ ] Mobile responsive
- [ ] Performance < 2s total

**Documentazione**
- [ ] `QUICK-REQUEST-MODE.md` creato
- [ ] Report sessione

### 🔄 Prossimo Step
➡️ [Step 10: Quick Actions UI](#step-10)

---

<a name="step-10"></a>
## STEP 10: Quick Actions UI 🎯

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 3 ore  
**Impatto**: +50% velocità interazioni  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Aggiungere pulsanti "quick action" ovunque: ✅ Accetta, ❌ Rifiuta, 💬 Chatta, 📞 Chiama - tutti 1-tap senza navigazione.

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

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
  CalendarIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Action {
  icon: React.ComponentType<any>;
  label: string;
  action: string;
  color: string;
  confirmMessage?: string;
}

interface QuickActionsProps {
  type: 'quote' | 'request' | 'appointment';
  itemId: string;
  onActionComplete?: (action: string) => void;
}

const ACTION_CONFIGS = {
  quote: [
    { 
      icon: CheckIcon, 
      label: 'Accetta', 
      action: 'accept',
      color: 'bg-green-600 hover:bg-green-700',
      confirmMessage: 'Confermi di accettare questo preventivo?'
    },
    { 
      icon: XMarkIcon, 
      label: 'Rifiuta', 
      action: 'reject',
      color: 'bg-red-600 hover:bg-red-700',
      confirmMessage: 'Sei sicuro di rifiutare?'
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
      icon: PencilIcon, 
      label: 'Modifica', 
      action: 'edit',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    { 
      icon: XMarkIcon, 
      label: 'Annulla', 
      action: 'cancel',
      color: 'bg-red-600 hover:bg-red-700',
      confirmMessage: 'Confermi annullamento richiesta?'
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
      label: 'Cambia Data', 
      action: 'reschedule',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    { 
      icon: XMarkIcon, 
      label: 'Cancella', 
      action: 'cancel',
      color: 'bg-red-600 hover:bg-red-700',
      confirmMessage: 'Confermi cancellazione appuntamento?'
    }
  ]
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  type,
  itemId,
  onActionComplete
}) => {
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async ({ action }: { action: string }) => {
      let endpoint = '';
      
      switch (type) {
        case 'quote':
          endpoint = `/quotes/${itemId}/${action}`;
          break;
        case 'request':
          if (action === 'chat') {
            window.location.href = `/chat/${itemId}`;
            return;
          }
          if (action === 'call') {
            // Ottieni numero telefono e apri dialer
            const response = await api.get(`/requests/${itemId}`);
            window.location.href = `tel:${response.data.data.professional.phone}`;
            return;
          }
          endpoint = `/requests/${itemId}/${action}`;
          break;
        case 'appointment':
          endpoint = `/appointments/${itemId}/${action}`;
          break;
      }
      
      const response = await api.post(endpoint);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Azione "${variables.action}" completata! ✓`);
      
      // Invalida cache per refresh dati
      queryClient.invalidateQueries({ queryKey: [type] });
      queryClient.invalidateQueries({ queryKey: [type, itemId] });
      
      onActionComplete?.(variables.action);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore azione');
    }
  });

  const handleAction = async (actionConfig: Action) => {
    // Conferma per azioni critiche
    if (actionConfig.confirmMessage) {
      if (!window.confirm(actionConfig.confirmMessage)) {
        return;
      }
    }

    actionMutation.mutate({ action: actionConfig.action });
  };

  const actions = ACTION_CONFIGS[type];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((actionConfig) => (
        <button
          key={actionConfig.action}
          onClick={() => handleAction(actionConfig)}
          disabled={actionMutation.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold ${actionConfig.color} transition-all disabled:opacity-50`}
        >
          <actionConfig.icon className="h-5 w-5" />
          <span>{actionConfig.label}</span>
        </button>
      ))}
    </div>
  );
};
```

**USARE IN NOTIFICHE IN-APP**

```typescript
// components/notifications/NotificationCard.tsx
import { QuickActions } from '../actions/QuickActions';

<div className="bg-white rounded-lg shadow p-4 mb-2">
  <div className="flex items-start gap-3 mb-3">
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900">
        Nuovo Preventivo Ricevuto
      </h4>
      <p className="text-sm text-gray-600">
        Mario Rossi ti ha inviato un preventivo di €120
      </p>
      <p className="text-xs text-gray-500 mt-1">
        2 minuti fa
      </p>
    </div>
  </div>
  
  <QuickActions 
    type="quote" 
    itemId={notification.quoteId}
    onActionComplete={() => {
      // Marca notifica come letta
      markAsRead(notification.id);
    }}
  />
</div>
```

**EMAIL TEMPLATE CON CTA BUTTONS**

```typescript
// services/email.service.ts
const quoteReceivedTemplate = (quote: any) => `
<!DOCTYPE html>
<html>
<body>
  <h2>Nuovo Preventivo Ricevuto!</h2>
  <p>Ciao ${quote.client.firstName},</p>
  <p>${quote.professional.firstName} ti ha inviato un preventivo:</p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0;">€${quote.totalAmount}</h3>
    <p style="margin: 5px 0;">${quote.description}</p>
  </div>
  
  <!-- Quick Actions -->
  <div style="margin: 30px 0;">
    <a href="${process.env.FRONTEND_URL}/quotes/${quote.id}/accept" 
       style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 10px;">
      ✓ Accetta
    </a>
    <a href="${process.env.FRONTEND_URL}/quotes/${quote.id}/negotiate"
       style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 10px;">
      💬 Negozia
    </a>
    <a href="${process.env.FRONTEND_URL}/quotes/${quote.id}"
       style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
      👁️ Visualizza
    </a>
  </div>
</body>
</html>
`;
```

⚠️ IMPORTANTE:
- Conferma SEMPRE per azioni distruttive
- Loading state durante azione
- Ottimistic UI updates dove possibile
- Toast feedback immediato
- Invalidare cache React Query

📚 DOC: QUICK-ACTIONS-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Componente `QuickActions` creato
- [ ] Actions per quote (accept/reject/negotiate)
- [ ] Actions per requests (chat/call/edit/cancel)
- [ ] Actions per appointments
- [ ] Integrato in notifiche in-app
- [ ] Email templates con CTA
- [ ] Conferma azioni critiche
- [ ] Loading states
- [ ] Toast feedback
- [ ] Cache invalidation
- [ ] Testing mobile
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 11: AI Categoria Suggester](#step-11)

---

<a name="step-11"></a>
## STEP 11: AI Categoria Suggester 🤖

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 1 ora  
**Impatto**: -30% errori categorizzazione  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Mentre cliente scrive, AI suggerisce categoria in real-time (già implementato in Step 9 - Quick Request Mode).

### 📋 NOTA

✅ **Già Implementato in Step 9!**

L'AI categorization è già parte del Quick Request Mode.

**Per aggiungere anche al form STANDARD**:

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Aggiungiamo AI suggestion anche al **Form Standard**.

🎯 TASK: Real-time suggestion mentre utente scrive descrizione.

```typescript
// hooks/useAISuggestion.ts
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import api from '../services/api';

export const useAISuggestion = (description: string, enabled: boolean = true) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || description.length < 20) {
      setSuggestion(null);
      return;
    }

    const fetchSuggestion = debounce(async () => {
      setLoading(true);
      try {
        const response = await api.post('/ai/categorize-request', { description });
        const data = response.data.data;
        
        // Mostra solo se confidence > 80%
        if (data.confidence > 0.8) {
          setSuggestion(data);
        }
      } catch (error) {
        console.error('AI suggestion error:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce 500ms

    fetchSuggestion();

    return () => {
      fetchSuggestion.cancel();
    };
  }, [description, enabled]);

  return { suggestion, loading };
};
```

**USO NEL FORM STANDARD**

```typescript
// components/requests/StandardRequestForm.tsx
import { useAISuggestion } from '../../hooks/useAISuggestion';

const StandardRequestForm = () => {
  const [description, setDescription] = useState('');
  const { suggestion, loading } = useAISuggestion(description);

  return (
    <div>
      <textarea 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrivi il problema..."
      />
      
      {/* AI Suggestion Badge */}
      {loading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span>AI sta analizzando...</span>
        </div>
      )}
      
      {suggestion && (
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-600" />
            <p className="text-sm">
              <strong>AI suggerisce:</strong> {suggestion.category}
            </p>
          </div>
          <button 
            onClick={() => setSelectedCategory(suggestion.category)}
            className="mt-2 text-sm text-blue-600 underline"
          >
            Usa suggerimento
          </button>
        </div>
      )}
    </div>
  );
};
```

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

### ✅ Checklist

- [ ] Hook `useAISuggestion` creato
- [ ] Debounce 500ms implementato
- [ ] Confidence threshold 80%
- [ ] Loading indicator
- [ ] Badge suggestion UI
- [ ] Pulsante "Usa suggerimento"
- [ ] Fallback selezione manuale
- [ ] Testing accuratezza
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 12: Geo Auto-Detect](#step-12)

---

<a name="step-12"></a>
## STEP 12: Geo Auto-Detect 📍

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: -50% friction indirizzo  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Auto-detect posizione browser con reverse geocoding per pre-compilare indirizzo.

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Implementiamo **Geo Auto-Detect**.

🎯 TASK: Geolocation + reverse geocoding automatico.

```typescript
// hooks/useGeolocation.ts
import { useState } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata dal browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding con Google Maps
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?` +
            `latlng=${latitude},${longitude}&` +
            `key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );

          const data = await response.json();

          if (data.results && data.results.length > 0) {
            setLocation({
              lat: latitude,
              lng: longitude,
              address: data.results[0].formatted_address
            });
          } else {
            setError('Impossibile determinare indirizzo');
          }
        } catch (err) {
          setError('Errore reverse geocoding');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Permesso posizione negato');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return { location, loading, error, requestLocation };
};
```

**COMPONENTE UI**

```typescript
// components/location/LocationDetector.tsx
import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useGeolocation } from '../../hooks/useGeolocation';

interface LocationDetectorProps {
  onLocationDetected: (address: string) => void;
}

export const LocationDetector: React.FC<LocationDetectorProps> = ({
  onLocationDetected
}) => {
  const { location, loading, error, requestLocation } = useGeolocation();

  React.useEffect(() => {
    if (location) {
      onLocationDetected(location.address);
    }
  }, [location, onLocationDetected]);

  return (
    <div className="space-y-2">
      <button
        onClick={requestLocation}
        disabled={loading}
        type="button"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
      >
        <MapPinIcon className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} />
        {loading ? 'Rilevamento...' : 'Usa la mia posizione'}
      </button>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
```

**USO NEL FORM**

```typescript
import { LocationDetector } from '../location/LocationDetector';

<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Indirizzo
  </label>
  
  <input
    type="text"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    placeholder="Via Roma 123, Milano"
    className="w-full border rounded-lg p-3"
  />
  
  <div className="mt-2">
    <LocationDetector 
      onLocationDetected={(detectedAddress) => setAddress(detectedAddress)} 
    />
  </div>
</div>
```

⚠️ PRIVACY:
- Chiedere permesso esplicito
- Spiegare perché serve
- Non salvare coordinate
- Privacy policy aggiornata

📚 DOC: GEO-DETECTION-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Hook `useGeolocation`
- [ ] Browser permissions handling
- [ ] Reverse geocoding Google Maps
- [ ] Componente `LocationDetector`
- [ ] Icon animata loading
- [ ] Error handling
- [ ] Fallback input manuale
- [ ] Privacy policy update
- [ ] Testing mobile/desktop
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 13: Onboarding Tutorial](#step-13)

---

<a name="step-13"></a>
## STEP 13: Onboarding Tutorial 🎓

**Priorità**: 🟡 ALTA  
**Tempo Stimato**: 3 ore  
**Impatto**: +40% completamento prima richiesta  
**Complessità**: 🟡 Media  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Tutorial interattivo per nuovi utenti con tooltip step-by-step usando react-joyride.

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Creiamo **Onboarding Tutorial**.

```bash
npm install react-joyride
```

```typescript
// components/onboarding/OnboardingTour.tsx
import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Controlla se è la prima visita
    const hasSeenTour = localStorage.getItem('onboarding_completed');
    if (!hasSeenTour) {
      // Delay di 1 secondo per far caricare la pagina
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '#create-request-btn',
      content: '👋 Benvenuto! Inizia creando la tua prima richiesta qui.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '#request-form',
      content: '📝 Descrivi il tuo problema. L\'AI ti aiuterà a categorizzarlo!',
      placement: 'right'
    },
    {
      target: '#professionals-section',
      content: '👨‍🔧 Riceverai preventivi dai migliori professionisti della tua zona.',
      placement: 'left'
    },
    {
      target: '#chat-icon',
      content: '💬 Puoi chattare direttamente con i professionisti.',
      placement: 'bottom'
    },
    {
      target: '#notifications-bell',
      content: '🔔 Ti terremo aggiornato in tempo reale su ogni novità!',
      placement: 'bottom'
    },
    {
      target: '#profile-menu',
      content: '✅ Completa il tuo profilo per un\'esperienza personalizzata.',
      placement: 'left'
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem('onboarding_completed', 'true');
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      styles={{
        options: {
          primaryColor: '#3B82F6',
          zIndex: 10000,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          textColor: '#1F2937',
          overlayColor: 'rgba(0, 0, 0, 0.5)'
        },
        tooltip: {
          borderRadius: 12,
          fontSize: 16
        },
        buttonNext: {
          backgroundColor: '#3B82F6',
          borderRadius: 8,
          padding: '8px 16px'
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 10
        },
        buttonSkip: {
          color: '#EF4444'
        }
      }}
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Fine',
        next: 'Avanti',
        skip: 'Salta tutorial'
      }}
      callback={handleJoyrideCallback}
    />
  );
};
```

**CHECKLIST PROGRESSI**

```typescript
// components/onboarding/OnboardingChecklist.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CircleIcon } from '@heroicons/react/24/outline';

interface Task {
  id: string;
  label: string;
  done: boolean;
  icon: string;
}

export const OnboardingChecklist = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'profile', label: 'Completa il profilo', done: false, icon: '👤' },
    { id: 'first_request', label: 'Crea prima richiesta', done: false, icon: '📝' },
    { id: 'add_address', label: 'Aggiungi indirizzo', done: false, icon: '📍' },
    { id: 'enable_notifications', label: 'Attiva notifiche', done: false, icon: '🔔' },
    { id: 'first_quote', label: 'Ricevi primo preventivo', done: false, icon: '💰' }
  ]);

  useEffect(() => {
    // Carica stato salvato
    const saved = localStorage.getItem('onboarding_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  const progress = (tasks.filter(t => t.done).length / tasks.length) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900">
          🎯 Inizia da Qui
        </h3>
        <span className="text-sm font-semibold text-blue-600">
          {Math.round(progress)}% Completato
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task List */}
      <ul className="space-y-3">
        {tasks.map(task => (
          <li 
            key={task.id} 
            className="flex items-center gap-3 text-gray-700"
          >
            {task.done ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
            ) : (
              <CircleIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
            )}
            <span className={task.done ? 'line-through text-gray-500' : 'font-medium'}>
              {task.icon} {task.label}
            </span>
          </li>
        ))}
      </ul>

      {progress === 100 && (
        <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 text-center">
          <p className="text-green-800 font-semibold">
            🎉 Complimenti! Hai completato l'onboarding!
          </p>
        </div>
      )}
    </div>
  );
};
```

**INTEGRAZIONE APP**

```typescript
// App.tsx o Layout.tsx
import { OnboardingTour } from './components/onboarding/OnboardingTour';
import { OnboardingChecklist } from './components/onboarding/OnboardingChecklist';

function App() {
  return (
    <>
      <OnboardingTour />
      
      {/* Mostra checklist in dashboard se non completata */}
      {!localStorage.getItem('onboarding_completed') && (
        <div className="mb-6">
          <OnboardingChecklist />
        </div>
      )}
      
      {/* Resto app */}
    </>
  );
}
```

⚠️ IMPORTANTE:
- Non essere invasivo
- Skip sempre disponibile
- Salvare progresso
- Riattivabile da settings

📚 DOC: ONBOARDING-SYSTEM.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Install react-joyride
- [ ] Componente `OnboardingTour`
- [ ] 5-7 step definiti
- [ ] Styling personalizzato
- [ ] Componente `OnboardingChecklist`
- [ ] Progress tracking
- [ ] LocalStorage persistence
- [ ] Skip functionality
- [ ] Restart da settings
- [ ] Analytics tracking
- [ ] Testing first-time user
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 14: Salvataggio Bozze](#step-14)

---

<a name="step-14"></a>
## STEP 14: Salvataggio Bozze 💾

**Priorità**: 🟢 MEDIA  
**Tempo Stimato**: 2 ore  
**Impatto**: -20% abbandono form  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Auto-save form ogni 5 secondi in localStorage, recupero automatico.

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Implementiamo **Salvataggio Bozze**.

```typescript
// hooks/useFormDraft.ts
import { useEffect } from 'react';
import { debounce } from 'lodash';

export const useFormDraft = <T extends Record<string, any>>(
  formData: T,
  key: string,
  enabled: boolean = true
) => {
  // Auto-save ogni 5 secondi
  useEffect(() => {
    if (!enabled) return;

    const saveDraft = debounce(() => {
      try {
        localStorage.setItem(
          `draft_${key}`,
          JSON.stringify({
            data: formData,
            timestamp: new Date().toISOString()
          })
        );
        console.log(`✓ Bozza salvata: ${key}`);
      } catch (error) {
        console.error('Errore salvataggio bozza:', error);
      }
    }, 5000);

    saveDraft();

    return () => {
      saveDraft.cancel();
    };
  }, [formData, key, enabled]);

  const loadDraft = (): { data: T; timestamp: string } | null => {
    try {
      const draft = localStorage.getItem(`draft_${key}`);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Errore caricamento bozza:', error);
      return null;
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(`draft_${key}`);
    console.log(`✓ Bozza eliminata: ${key}`);
  };

  return { loadDraft, clearDraft };
};
```

**BANNER RIPRISTINO**

```typescript
// components/drafts/DraftBanner.tsx
import React from 'react';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DraftBannerProps {
  timestamp: string;
  onRestore: () => void;
  onDismiss: () => void;
}

export const DraftBanner: React.FC<DraftBannerProps> = ({
  timestamp,
  onRestore,
  onDismiss
}) => {
  const timeAgo = new Date(timestamp).toLocaleString('it-IT');

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <ClockIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">
              Bozza trovata
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Hai una bozza salvata il {timeAgo}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onRestore}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium text-sm"
              >
                Ripristina Bozza
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 font-medium text-sm"
              >
                Inizia da Capo
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-yellow-600 hover:text-yellow-700"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
```

**USO NEL FORM**

```typescript
// pages/NewRequest.tsx
import { useState, useEffect } from 'react';
import { useFormDraft } from '../hooks/useFormDraft';
import { DraftBanner } from '../components/drafts/DraftBanner';

export const NewRequestPage = () => {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    address: ''
  });
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);

  const { loadDraft, clearDraft } = useFormDraft(formData, 'new_request');

  // Carica bozza al mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.data.description) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }
  }, []);

  const handleRestoreDraft = () => {
    if (savedDraft) {
      setFormData(savedDraft.data);
      setShowDraftBanner(false);
    }
  };

  const handleDismissDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
    setSavedDraft(null);
  };

  const handleSubmit = async () => {
    // Invia form
    await api.post('/requests', formData);
    
    // Dopo successo, elimina bozza
    clearDraft();
    
    // Redirect o success message
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Nuova Richiesta</h1>

      {/* Draft Banner */}
      {showDraftBanner && savedDraft && (
        <DraftBanner
          timestamp={savedDraft.timestamp}
          onRestore={handleRestoreDraft}
          onDismiss={handleDismissDraft}
        />
      )}

      {/* Form normale */}
      <form onSubmit={handleSubmit}>
        {/* ... campi form ... */}
      </form>

      {/* Indicatore auto-save */}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Salvataggio automatico attivo</span>
      </div>
    </div>
  );
};
```

⚠️ IMPORTANTE:
- Pulire vecchie bozze (> 7 giorni)
- Non salvare dati sensibili
- Indicatore visivo auto-save
- Clear dopo submit successo

📚 DOC: già in QUICK-REQUEST-MODE.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] Hook `useFormDraft`
- [ ] Auto-save 5s debounce
- [ ] Componente `DraftBanner`
- [ ] Load draft al mount
- [ ] Ripristina/Dismissi actions
- [ ] Clear dopo submit
- [ ] Timestamp display
- [ ] Indicatore auto-save
- [ ] Cleanup vecchie bozze
- [ ] Testing edge cases
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 15: Comunicazione Friendly](#step-15)

---

<a name="step-15"></a>
## STEP 15: Comunicazione Friendly 💬

**Priorità**: 🟢 BASSA  
**Tempo Stimato**: 2 ore  
**Impatto**: +5% brand love  
**Complessità**: 🟢 Bassa  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Rendere tutti i messaggi di sistema più caldi, friendly, meno corporate.

---

### 📋 PROMPT PRONTO PER CLAUDE

┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐

Ciao Claude! Rendiamo la **Comunicazione Friendly**.

```typescript
// constants/messages.ts
export const MESSAGES = {
  request: {
    created: "Fantastico! 🚀 I professionisti stanno già guardando la tua richiesta!",
    assigned: "Evviva! 🎯 {professionalName} si occuperà di te!",
    in_progress: "È iniziato! 🔨 {professionalName} sta lavorando per te.",
    completed: "Missione compiuta! ✨ Come è andata?",
    cancelled: "Nessun problema! Siamo qui se hai bisogno 💙"
  },
  
  quote: {
    received: "Wow! 💰 {professionalName} ti ha inviato un preventivo!",
    accepted: "Perfetto! 🤝 Iniziamo a lavorare insieme!",
    rejected: "Va bene! Continua a cercare, troverai quello giusto 👍",
    expired: "Ops! Il preventivo è scaduto. Vuoi richiederne uno nuovo?"
  },
  
  errors: {
    required: "Ops! 😅 Questo campo è importante, non dimenticarlo!",
    invalid_email: "Mmm... 🤔 Controlla che l'email sia corretta!",
    network: "Uhm... 📡 Problemi di connessione. Riprova tra un attimo!",
    server: "Oops! 😓 Qualcosa è andato storto. Ci stiamo lavorando!",
    not_found: "Hmm... 🔍 Non troviamo quello che cerchi!",
    unauthorized: "Alt! 🚫 Devi fare login per questa azione."
  },
  
  success: {
    profile_updated: "Fatto! ✅ Il tuo profilo è aggiornato!",
    payment_success: "Evviva! 🎉 Pagamento completato!",
    review_sent: "Grazie! ⭐ La tua opinione conta molto!",
    message_sent: "Inviato! 📨",
    saved: "Salvato! 💾"
  },
  
  empty_states: {
    no_requests: {
      title: "🔍 Ancora niente qui!",
      description: "Crea la tua prima richiesta per iniziare",
      action: "Crea Richiesta"
    },
    no_quotes: {
      title: "📭 Nessun preventivo ancora",
      description: "I professionisti stanno preparando le loro offerte!",
      action: null
    },
    no_messages: {
      title: "💬 Inizia la conversazione!",
      description: "Scrivi un messaggio per rompere il ghiaccio",
      action: null
    },
    no_notifications: {
      title: "🔕 Tutto tranquillo",
      description: "Ti avviseremo quando ci sarà qualcosa di nuovo!",
      action: null
    }
  },
  
  loading: {
    default: "Un attimo...",
    saving: "Salvataggio...",
    loading: "Caricamento...",
    processing: "Elaborazione...",
    sending: "Invio..."
  }
};

// Helper per messaggi con variabili
export const formatMessage = (message: string, vars: Record<string, any>) => {
  return message.replace(/{(\w+)}/g, (_, key) => vars[key] || '');
};
```

**TOAST HELPER**

```typescript
// utils/toast.ts
import { toast as hotToast } from 'react-hot-toast';
import { MESSAGES } from '../constants/messages';

export const toast = {
  success: (message: string, description?: string) => {
    hotToast.success(message, {
      description,
      duration: 3000,
      icon: '✅'
    });
  },
  
  error: (message: string) => {
    hotToast.error(message, {
      duration: 4000,
      icon: '😅'
    });
  },
  
  info: (message: string) => {
    hotToast(message, {
      duration: 3000,
      icon: '💡'
    });
  },
  
  loading: (message: string = MESSAGES.loading.default) => {
    return hotToast.loading(message);
  }
};

// Usage
toast.success(MESSAGES.success.profile_updated);
toast.error(MESSAGES.errors.network);
```

**EMPTY STATE COMPONENT**

```typescript
// components/common/EmptyState.tsx
import React from 'react';
import { MESSAGES } from '../../constants/messages';

interface EmptyStateProps {
  type: keyof typeof MESSAGES.empty_states;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const config = MESSAGES.empty_states[type];

  return (
    <div className="text-center py-16 px-4">
      <p className="text-6xl mb-4">{config.title.match(/^[^\s]+/)?.[0]}</p>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {config.title.replace(/^[^\s]+\s/, '')}
      </h3>
      <p className="text-gray-600 mb-6">
        {config.description}
      </p>
      {config.action && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          {config.action}
        </button>
      )}
    </div>
  );
};

// Usage
<EmptyState type="no_requests" onAction={() => navigate('/new-request')} />
```

**UPDATE EMAIL TEMPLATES**

Anche le email devono essere friendly! Esempio:

```typescript
// Prima (Corporate)
Subject: Richiesta Creata - ID #12345
Corpo: La sua richiesta è stata registrata nel sistema...

// Dopo (Friendly)
Subject: 🎉 Richiesta Creata con Successo!
Corpo: Ciao Mario! La tua richiesta è pronta e i professionisti stanno già guardando...
```

📚 DOC: FRIENDLY-COMMUNICATION-GUIDE.md

└──────────────── FINE PROMPT DA COPIARE ──────────────────┘

---

### ✅ Checklist

- [ ] File `messages.ts` creato
- [ ] Toast helper aggiornato
- [ ] Componente `EmptyState`
- [ ] Tutti error messages aggiornati
- [ ] Tutti success messages aggiornati
- [ ] Empty states friendly
- [ ] Email templates update
- [ ] Push notifications update
- [ ] WhatsApp messages update
- [ ] Testing tono
- [ ] Review copywriting
- [ ] Documentazione

### 🔄 Prossimo Step
➡️ [Step 16: Gamification](#step-16)

---

<a name="step-16"></a>
## STEP 16: Gamification - Club Fedeltà 🎮

**Priorità**: 🔴 CRITICA  
**Tempo Stimato**: 5 ore  
**Impatto**: -50% churn, +80% LTV  
**Complessità**: 🔴 Alta  
**Stato**: ⬜ Da Fare

### 🎯 Obiettivo
Sistema punti completo, tier (Bronze/Silver/Gold/Platinum), achievements, benefici esclusivi.

### 📋 NOTA

✅ **Step 16 completo disponibile in**: [PIANO-STEP-17-20.md](PIANO-STEP-17-20.md#step-16)

Per il prompt completo di gamification, consulta il file PIANO-STEP-17-20.md

---

**Fine Fase 2 - Tutti gli step 9-16 documentati! ✅**
