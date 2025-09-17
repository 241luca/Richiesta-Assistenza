# 🚀 ISTRUZIONI SESSIONE 4 - COMPLETAMENTO SISTEMA AI DUALE

## 📌 CONTESTO PROGETTO
Sistema AI Duale per professionisti nel progetto Richiesta-Assistenza.
**Stato attuale: 80% completato** - Backend completo, manca frontend dashboard e integrazione finale.

## 🎯 OBIETTIVI SESSIONE 4 - FRONTEND & INTEGRAZIONE

### PRIORITÀ 1: Completare Integrazione WhatsApp [CRITICO]
**File da modificare**: `/backend/src/services/whatsapp.service.ts`

Nella funzione `processIncomingMessage` (riga ~493), dopo aver salvato il messaggio nel database, AGGIUNGERE:

```typescript
// DOPO IL SALVATAGGIO DEL MESSAGGIO NEL DB (circa riga 650)
// Aggiungi questo codice per l'AI Duale:

// 1. Verifica se il professionista ha configurazione AI Duale
const professionalConfig = await prisma.professionalWhatsApp.findFirst({
  where: {
    instanceId: currentConfig.instanceId,
    status: 'ACTIVE'
  }
});

if (professionalConfig && professionalConfig.aiEnabled) {
  try {
    // 2. Detect sender type
    const detection = await dualModeDetector.detectSenderType(
      senderNumber,
      currentConfig.instanceId
    );
    
    logger.info(`AI Duale Detection: ${senderNumber} → ${detection.mode} (confidence: ${detection.confidence})`);
    
    // 3. Get appropriate KB for subcategory
    // Nota: Devi determinare subcategoryId dal contesto del messaggio
    const subcategoryId = await determineSubcategoryFromMessage(messageText);
    
    const kb = await dualKBService.getKBForMode(
      detection.mode,
      professionalConfig.id,
      subcategoryId
    );
    
    // 4. Prepare AI config based on mode
    const aiConfig = detection.mode === DetectionMode.PROFESSIONAL
      ? professionalConfig.aiConfigProfessional
      : professionalConfig.aiConfigClient;
    
    // 5. Generate AI response
    const aiResponse = await generateAIResponse({
      message: messageText,
      kb: kb,
      config: aiConfig,
      context: {
        isGroup,
        senderName: msg.pushName || senderNumber,
        messageType
      }
    });
    
    // 6. Sanitize response if CLIENT mode
    const finalResponse = responseSanitizer.sanitizeResponse(
      aiResponse,
      detection.mode
    );
    
    // 7. Send response via WhatsApp
    await sendMessage(senderNumber, finalResponse);
    
    // 8. Log detection result for analytics
    await prisma.professionalWhatsAppMessage.create({
      data: {
        whatsappId: professionalConfig.id,
        phoneNumber: senderNumber,
        message: messageText,
        response: finalResponse,
        detectedMode: detection.mode,
        confidence: detection.confidence,
        detectionFactors: detection.factors
      }
    });
    
  } catch (aiError) {
    logger.error('Error in AI Duale processing:', aiError);
    // Fallback to standard response
    await sendMessage(senderNumber, 'Grazie per il tuo messaggio. Ti risponderemo al più presto.');
  }
}
```

### PRIORITÀ 2: Frontend Dashboard Components

#### 2.1 Dual Config Manager Component
**File da creare**: `/src/components/admin/ai-duale/DualConfigManager.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

export function DualConfigManager() {
  const [activeTab, setActiveTab] = useState('professional');
  
  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: () => api.get('/professional/whatsapp/config')
  });
  
  // Update config mutation
  const updateConfig = useMutation({
    mutationFn: (data) => api.put('/professional/whatsapp/config', data),
    onSuccess: () => {
      toast.success('Configurazione aggiornata');
      queryClient.invalidateQueries(['whatsapp-config']);
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 Configurazione AI Duale</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="professional">AI Professionista</TabsTrigger>
            <TabsTrigger value="client">AI Cliente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="professional">
            {/* Form per config AI Professional */}
            <AIConfigForm 
              config={config?.aiConfigProfessional}
              mode="professional"
              onSave={updateConfig.mutate}
            />
          </TabsContent>
          
          <TabsContent value="client">
            {/* Form per config AI Client */}
            <AIConfigForm 
              config={config?.aiConfigClient}
              mode="client"
              onSave={updateConfig.mutate}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

#### 2.2 Phone Number Manager Component
**File da creare**: `/src/components/admin/ai-duale/PhoneNumberManager.tsx`

```typescript
export function PhoneNumberManager() {
  // Component per gestire numeri professionali, fidati, bloccati
  // Con add/remove/test detection
}
```

#### 2.3 KB Editor Component
**File da creare**: `/src/components/admin/ai-duale/KBEditor.tsx`

```typescript
export function KBEditor({ subcategoryId }) {
  // Editor per modificare KB Professional e Client
  // Con preview sanitizzazione
}
```

#### 2.4 Test Playground Component
**File da creare**: `/src/components/admin/ai-duale/TestPlayground.tsx`

```typescript
export function TestPlayground() {
  // Test detection e sanitizzazione
  // Simula messaggi da diversi numeri
}
```

#### 2.5 Analytics Dashboard Component
**File da creare**: `/src/components/admin/ai-duale/AnalyticsDashboard.tsx`

```typescript
export function AnalyticsDashboard() {
  // Statistiche detection accuracy
  // Grafici modalità utilizzate
  // Override history
}
```

### PRIORITÀ 3: Main Dashboard Page
**File da creare**: `/src/pages/admin/AIDualeDashboard.tsx`

```typescript
import { DualConfigManager } from '@/components/admin/ai-duale/DualConfigManager';
import { PhoneNumberManager } from '@/components/admin/ai-duale/PhoneNumberManager';
import { KBEditor } from '@/components/admin/ai-duale/KBEditor';
import { TestPlayground } from '@/components/admin/ai-duale/TestPlayground';
import { AnalyticsDashboard } from '@/components/admin/ai-duale/AnalyticsDashboard';

export function AIDualeDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🤖 Sistema AI Duale</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DualConfigManager />
        <PhoneNumberManager />
      </div>
      
      <div className="mt-6">
        <KBEditor />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TestPlayground />
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
```

### PRIORITÀ 4: Aggiungere Route
**File da modificare**: `/src/App.tsx` o router principale

Aggiungere:
```typescript
<Route path="/admin/ai-duale" element={<AIDualeDashboard />} />
```

### PRIORITÀ 5: Helper Function per AI
**File da creare**: `/backend/src/services/ai-duale-helper.service.ts`

```typescript
import { OpenAI } from 'openai';

export async function generateAIResponse({ message, kb, config, context }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const systemPrompt = config.systemPrompt + '\n\nKnowledge Base:\n' + JSON.stringify(kb);
  
  const completion = await openai.chat.completions.create({
    model: config.model || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    temperature: config.temperature || 0.7,
    max_tokens: config.maxTokens || 300
  });
  
  return completion.choices[0].message.content;
}

export async function determineSubcategoryFromMessage(message: string): Promise<string> {
  // Logica per determinare subcategory dal messaggio
  // Potrebbe usare AI o keyword matching
  return 'default-subcategory-id';
}
```

## 🧪 TESTING CHECKLIST

Dopo aver completato, testare:

### Backend Tests:
- [ ] Messaggio da numero professional → risposta completa
- [ ] Messaggio da numero cliente → risposta sanitizzata
- [ ] Override detection funziona
- [ ] KB selection corretta per subcategory
- [ ] Sanitizzazione rimuove info sensibili
- [ ] Conversione prezzi funziona

### Frontend Tests:
- [ ] Dashboard si carica correttamente
- [ ] Config AI salvate correttamente
- [ ] Numeri aggiunti/rimossi dalle liste
- [ ] KB editor salva modifiche
- [ ] Test playground funziona
- [ ] Analytics mostra dati corretti

## ⚠️ PUNTI CRITICI DA VERIFICARE

1. **Import mancanti**: Assicurati che tutti gli import siano corretti
2. **Prisma generate**: Esegui `npx prisma generate` se necessario
3. **Environment variables**: Verifica che `OPENAI_API_KEY` sia configurata
4. **Tailwind classes**: Usa solo classi Tailwind, NO CSS custom
5. **React Query**: USA sempre per API calls, MAI fetch diretto
6. **ResponseFormatter**: SEMPRE nelle routes, MAI nei services

## 📋 FILE DA BACKUP PRIMA DI MODIFICARE

```bash
# Backup whatsapp.service.ts
cp backend/src/services/whatsapp.service.ts backend/src/services/whatsapp.service.backup-$(date +%Y%m%d-%H%M%S).ts

# Backup App.tsx se esiste
cp src/App.tsx src/App.backup-$(date +%Y%m%d-%H%M%S).tsx
```

## 🎯 EXPECTED OUTPUT SESSIONE 4

Al termine dovresti avere:
1. ✅ Integrazione WhatsApp completa con AI Duale
2. ✅ 5 componenti React per dashboard
3. ✅ Pagina dashboard principale
4. ✅ Helper service per AI
5. ✅ Route aggiunta per dashboard
6. ✅ Sistema completamente funzionante
7. ✅ Progress: 100%

## 📊 TEMPO STIMATO

- Integrazione WhatsApp: 20 minuti
- Componenti React: 40 minuti
- Testing: 20 minuti
- **Totale: ~80 minuti**

## 🚀 COMANDI PER INIZIARE

```bash
# 1. Vai al progetto
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# 2. Verifica stato
cat Docs/04-SISTEMI/AI-DUALE/AI-DUALE-PROGRESS.md | grep "Overall Progress"

# 3. Inizia con integrazione WhatsApp
code backend/src/services/whatsapp.service.ts

# 4. Poi crea componenti React
mkdir -p src/components/admin/ai-duale
```

## 💡 SUGGERIMENTI

1. **Inizia dal backend**: Completa prima l'integrazione WhatsApp
2. **Usa componenti esistenti**: Copia struttura da altri componenti admin
3. **Test incrementale**: Testa ogni componente mentre lo crei
4. **Commit frequenti**: Salva progress ogni componente completato
5. **Non over-ingegnerizzare**: Fai versione base funzionante prima

---

**BUONA FORTUNA! Il sistema è quasi completo!** 🎉
