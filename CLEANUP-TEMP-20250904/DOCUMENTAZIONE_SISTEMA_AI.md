# 🤖 Documentazione Completa Sistema AI - Richiesta Assistenza

## Indice
1. [Panoramica del Sistema](#panoramica-del-sistema)
2. [Architettura AI](#architettura-ai)
3. [Configurazione per Sottocategorie](#configurazione-per-sottocategorie)
4. [Personalizzazione per Professionisti](#personalizzazione-per-professionisti)
5. [Knowledge Base](#knowledge-base)
6. [Contesto e Informazioni](#contesto-e-informazioni)
7. [API e Endpoints](#api-e-endpoints)
8. [Interfaccia Utente](#interfaccia-utente)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 📋 Panoramica del Sistema

Il **Sistema AI di Richiesta Assistenza** è una piattaforma intelligente che fornisce assistenza personalizzata a clienti e professionisti attraverso un'architettura AI multi-livello basata su OpenAI.

### Caratteristiche Principali

- **🎯 AI Contestuale**: Ogni risposta è basata sul contesto completo della richiesta
- **🔧 Personalizzazione Multi-livello**: Configurazioni per sottocategorie e professionisti
- **📚 Knowledge Base Integrata**: Documenti tecnici consultabili dall'AI
- **💬 Memoria Conversazionale**: L'AI ricorda il contesto della conversazione
- **🌐 Multi-role**: Supporto per clienti, professionisti e staff

### Flusso del Sistema

```
Utente → Richiesta → AI Service → OpenAI API
                           ↓
                    Contesto Richiesta
                    + Knowledge Base  
                    + Personalizzazioni
                           ↓
                    Risposta Contestuale
```

---

## 🏗️ Architettura AI

### Stack Tecnologico

- **AI Provider**: OpenAI (GPT-3.5-turbo / GPT-4)
- **Backend**: Node.js + TypeScript
- **Database**: PostgreSQL con Prisma ORM
- **Frontend**: React + TypeScript
- **API**: RESTful con Express.js

### Struttura Database AI

```sql
-- Configurazioni AI per Sottocategorie
SubcategoryAiSettings
├── modelName (gpt-3.5-turbo, gpt-4)
├── temperature (0-2)
├── maxTokens (100-4096)
├── systemPrompt
├── responseStyle (formal/informal/technical/educational)
├── detailLevel (basic/intermediate/advanced)
└── useKnowledgeBase

-- Personalizzazioni Professionisti
ProfessionalAiCustomization
├── professionalId
├── subcategoryId
├── customSystemPrompt
├── customTone
├── customTemperature
├── customMaxTokens
├── preferredExamples[]
├── avoidTopics[]
└── specializations[]

-- Knowledge Base
KnowledgeBaseDocument
├── title
├── content
├── subcategoryIds[]
├── filePath
└── metadata
```

### Gerarchia delle Configurazioni

```
1. Configurazione Base (Default)
    ↓
2. Configurazione Sottocategoria (Override parziale)
    ↓
3. Personalizzazione Professionista (Override finale)
    ↓
4. Risposta AI Personalizzata
```

---

## ⚙️ Configurazione per Sottocategorie

### Accesso Admin
**Percorso**: Admin → Sottocategorie → [Seleziona Sottocategoria] → Configurazione AI

### Parametri Configurabili

#### 1. **Modello AI**
```javascript
modelName: 'gpt-3.5-turbo' | 'gpt-4'
// gpt-3.5-turbo: Veloce ed economico
// gpt-4: Più accurato e complesso
```

#### 2. **System Prompt**
```javascript
systemPrompt: `Sei un esperto ${categoria} specializzato in ${sottocategoria}.
Fornisci assistenza professionale e dettagliata.
Usa terminologia tecnica appropriata.
Prioritizza sempre la sicurezza.`
```

#### 3. **Temperature** (Creatività)
```javascript
temperature: 0.7 // Range: 0-2
// 0: Risposte deterministiche e precise
// 0.7: Bilanciato (default)
// 2: Massima creatività
```

#### 4. **Response Style**
- **formal**: Linguaggio professionale e formale
- **informal**: Approccio amichevole e colloquiale
- **technical**: Terminologia tecnica specialistica
- **educational**: Spiegazioni didattiche dettagliate

#### 5. **Detail Level**
- **basic**: Risposte concise e dirette
- **intermediate**: Spiegazioni bilanciate
- **advanced**: Analisi approfondite e dettagliate

### Esempio Configurazione Elettricista

```json
{
  "modelName": "gpt-3.5-turbo",
  "temperature": 0.6,
  "maxTokens": 2048,
  "systemPrompt": "Sei un elettricista esperto con 20 anni di esperienza. Conosci le normative CEI e la sicurezza elettrica. Fornisci consigli pratici e sicuri.",
  "responseStyle": "technical",
  "detailLevel": "intermediate",
  "useKnowledgeBase": true
}
```

---

## 👤 Personalizzazione per Professionisti

### Accesso
- **Professionista**: Competenze Professionisti → Tab "Personalizzazione AI"
- **Admin**: Competenze Professionisti → Seleziona Professionista → Personalizzazione AI

### Funzionalità Personalizzabili

#### 1. **System Prompt Personalizzato**
```javascript
customSystemPrompt: "Sono Mario, elettricista specializzato in domotica KNX con 15 anni di esperienza. Ho certificazioni Vimar e BTicino."
```

#### 2. **Tono Conversazione**
- professional
- friendly
- technical
- educational
- casual

#### 3. **Messaggio di Benvenuto**
```javascript
customInitialMessage: "Ciao! Sono Mario, il tuo elettricista di fiducia. Come posso aiutarti oggi con il tuo impianto?"
```

#### 4. **Specializzazioni**
```javascript
specializations: [
  "Impianti domotici KNX",
  "Pannelli fotovoltaici",
  "Colonnine ricarica auto elettriche",
  "Sistemi di videosorveglianza"
]
```

#### 5. **Esempi Preferiti**
```javascript
preferredExamples: [
  "Nel mio ultimo intervento ho risolto un problema simile installando...",
  "Dalla mia esperienza, consiglio sempre di..."
]
```

#### 6. **Argomenti da Evitare**
```javascript
avoidTopics: [
  "Prezzi specifici della concorrenza",
  "Lavori fai-da-te pericolosi",
  "Marche non certificate"
]
```

### Esempio Professionista Completo

```json
{
  "professionalId": "prof_123",
  "subcategoryId": "sub_elettricista_01",
  "customSystemPrompt": "Sono Giuseppe, elettricista certificato con specializzazione in impianti industriali.",
  "customTone": "friendly",
  "customInitialMessage": "Benvenuto! Sono Giuseppe, come posso aiutarti con il tuo problema elettrico?",
  "customTemperature": 0.6,
  "customMaxTokens": 2500,
  "specializations": ["Impianti industriali", "Quadri elettrici", "Automazione"],
  "preferredExamples": ["Uso sempre componenti Schneider Electric per l'affidabilità"],
  "avoidTopics": ["Lavori non a norma"],
  "useKnowledgeBase": true,
  "isActive": true
}
```

---

## 📚 Knowledge Base

### Struttura Gerarchica

```
Knowledge Base/
├── Generale (Sottocategorie)/
│   └── uploads/kb-documents/
│       └── {categoria}/
│           └── {sottocategoria}/
│               ├── normativa_cei.pdf
│               ├── manuale_sicurezza.pdf
│               └── procedure_standard.doc
│
└── Personalizzata (Professionisti)/
    └── uploads/professional-kb/
        └── {professional-id}/
            └── {sottocategoria}/
                ├── mie_procedure.pdf
                ├── catalogo_prodotti.pdf
                └── listino_prezzi.doc
```

### Upload Documenti

#### Per Sottocategorie (Admin)
1. Admin → Knowledge Base Documents
2. Seleziona categoria e sottocategoria
3. Upload file (PDF, DOC, DOCX, TXT, MD)
4. Max 10MB per file

#### Per Professionisti
1. Competenze Professionisti → Personalizzazione AI
2. Attiva "Usa Knowledge Base Personalizzata"
3. Click "Upload File"
4. Documenti specifici per professionista/sottocategoria

### Tipologie Documenti Supportati

- **📄 PDF**: Manuali tecnici, normative
- **📝 DOC/DOCX**: Procedure, guide operative
- **📋 TXT**: Note tecniche, checklist
- **📑 MD**: Documentazione markdown

### Processing Documenti

```javascript
// Il sistema processa automaticamente i documenti
1. Upload → 2. Text Extraction → 3. Chunking → 4. Indexing → 5. Ready for AI
```

---

## 📋 Contesto e Informazioni

### Informazioni Passate all'AI

L'AI riceve un contesto completo e strutturato per ogni richiesta:

#### 1. **Dettagli Richiesta**
```
=== 📋 DETTAGLI RICHIESTA ASSISTENZA ===
ID Richiesta: REQ-2025-001
📌 TITOLO: Perdita acqua sotto il lavello
📝 DESCRIZIONE COMPLETA:
"Perdita visibile solo con acqua calda..."
Priorità: 🔴 URGENTE
Stato: ASSIGNED
```

#### 2. **Classificazione**
```
=== 🏷️ CLASSIFICAZIONE ===
Categoria: Idraulico
Sottocategoria: Riparazione perdite
```

#### 3. **Informazioni Cliente**
```
=== 👤 INFORMAZIONI CLIENTE ===
Nome: Mario Rossi
Email: mario@example.com
Telefono: 333-1234567
Città: Milano (MI)
```

#### 4. **Luogo Intervento**
```
=== 📍 LUOGO INTERVENTO ===
Indirizzo: Via Roma 123
Città: Milano (MI)
CAP: 20100
Note accesso: Citofono 3, secondo piano
```

#### 5. **Cronologia Chat Completa**
```
=== 💬 CRONOLOGIA CONVERSAZIONE ===
[15/01 10:30] 👤 Cliente Mario Rossi:
"Ho provato a stringere ma perde ancora"

[15/01 11:00] 🔧 Professionista Giuseppe:
"Probabilmente è la guarnizione, mandi foto?"

[15/01 11:15] 👤 Cliente Mario Rossi:
"Ecco la foto della perdita"
[Allegati: foto_perdita.jpg]
```

#### 6. **File Allegati**
```
=== 📎 FILE ALLEGATI ===
1. foto_perdita.jpg (image/jpeg)
   Descrizione: Foto del tubo che perde
2. video_problema.mp4 (video/mp4)
   Descrizione: Video della perdita in azione
```

#### 7. **Knowledge Base**
```
=== 📚 KNOWLEDGE BASE ===
📖 Manuale riparazione perdite:
"Le perdite sotto il lavello sono spesso causate da..."

📖 Procedura sostituzione guarnizioni:
"Step 1: Chiudere l'acqua principale..."
```

### Gestione Memoria Conversazione

```javascript
// Cache conversazioni in memoria
conversationCache: Map<conversationId, messages[]>

// Struttura messaggio
{
  role: 'user' | 'assistant' | 'system',
  content: string,
  timestamp: Date
}

// Limiti
- Ultimi 20 messaggi mantenuti in memoria
- 50 messaggi caricati dal database per contesto
```

---

## 🔌 API e Endpoints

### Endpoint Principali

#### 1. **Chat AI**
```http
POST /api/ai/chat
{
  "message": "Come posso risolvere questa perdita?",
  "requestId": "REQ-2025-001",
  "subcategoryId": "sub_idraulico_01",
  "conversationType": "client_help"
}
```

#### 2. **Configurazione Sottocategoria**
```http
GET /api/ai/config/subcategory/:id
POST /api/ai/config/subcategory/:id
```

#### 3. **Personalizzazione Professionista**
```http
GET /api/professionals/:id/ai-settings
POST /api/professionals/:id/ai-settings/:subcategoryId
```

#### 4. **Knowledge Base Upload**
```http
POST /api/kb-documents/upload
POST /api/professionals/:id/kb-documents/upload
```

#### 5. **Health Check AI**
```http
GET /api/ai/health
Response: {
  "service": "AI Service Professional",
  "status": "operational",
  "hasApiKey": true,
  "connectionTest": true
}
```

### Response Format

```json
{
  "conversationId": "user123-req456",
  "message": "Risposta AI dettagliata...",
  "model": "gpt-3.5-turbo",
  "tokensUsed": 523,
  "tone": "friendly",
  "initialMessage": null
}
```

---

## 🖥️ Interfaccia Utente

### Per Amministratori

#### Dashboard AI
**Percorso**: Admin → Dashboard → Sezione AI

Visualizza:
- Stato servizio AI
- Statistiche utilizzo
- Costi stimati
- Modelli utilizzati

#### Configurazione Sottocategorie
**Percorso**: Admin → Sottocategorie → [Seleziona] → AI Settings

Features:
- Editor System Prompt
- Slider Temperature
- Selezione Modello
- Test configurazione

#### Knowledge Base Management
**Percorso**: Admin → Knowledge Base Documents

Features:
- Upload multipli
- Organizzazione per categoria
- Statistiche storage
- Anteprima documenti

### Per Professionisti

#### Personalizzazione AI
**Percorso**: Competenze Professionisti → Tab "Personalizzazione AI"

Features:
- Configurazione per sottocategoria
- Upload documenti personali
- Preview messaggio benvenuto
- Test assistente

### Per Clienti

#### Chat Assistente
**Posizione**: Icona chat in basso a destra

Features:
- Chat contestuale alla richiesta
- Suggerimenti automatici
- Upload immagini
- Storico conversazione

---

## 💡 Best Practices

### 1. **Configurazione System Prompt**

#### ✅ DO
```javascript
systemPrompt: `Sei un idraulico esperto con 20 anni di esperienza.
Conosci le normative vigenti e le migliori pratiche del settore.
Prioritizza sempre la sicurezza del cliente.
Suggerisci quando è necessario l'intervento di un professionista.`
```

#### ❌ DON'T
```javascript
systemPrompt: "Sei un AI" // Troppo generico
```

### 2. **Temperature Settings**

| Use Case | Temperature | Motivo |
|----------|------------|--------|
| Diagnosi tecnica | 0.3-0.5 | Precisione massima |
| Consigli generali | 0.6-0.8 | Bilanciato |
| Idee creative | 0.9-1.2 | Soluzioni innovative |

### 3. **Knowledge Base**

#### Documenti Efficaci
- ✅ Manuali tecnici specifici
- ✅ Procedure step-by-step
- ✅ Normative di riferimento
- ✅ FAQ comuni

#### Da Evitare
- ❌ Documenti obsoleti
- ❌ Informazioni contraddittorie
- ❌ File troppo grandi (>10MB)
- ❌ Contenuti non pertinenti

### 4. **Personalizzazioni Professionisti**

#### Esempio Efficace
```javascript
{
  customSystemPrompt: "Sono Marco, termoidraulico specializzato in caldaie a condensazione Vaillant e Baxi.",
  specializations: ["Caldaie condensazione", "Riscaldamento a pavimento", "Solare termico"],
  preferredExamples: ["Nella mia esperienza con Vaillant...", "Ho risolto 200+ problemi simili..."],
  avoidTopics: ["Marche economiche non certificate", "Modifiche non a norma"]
}
```

---

## 🔧 Troubleshooting

### Problemi Comuni e Soluzioni

#### 1. **AI non risponde**
```bash
# Verifica API Key
Admin → API Keys → Controlla OpenAI key attiva

# Test connessione
GET /api/ai/health
```

#### 2. **Risposte non pertinenti**
- Verifica il system prompt della sottocategoria
- Controlla che il requestId sia passato correttamente
- Aumenta il detailLevel nelle impostazioni

#### 3. **Knowledge Base non utilizzata**
- Verifica flag `useKnowledgeBase: true`
- Controlla che i documenti siano processati (status: 'completed')
- Verifica associazione documento-sottocategoria

#### 4. **Personalizzazioni non applicate**
- Verifica `isActive: true` nella personalizzazione
- Controlla corrispondenza professionalId e subcategoryId
- Verifica priorità: personalizzazione > sottocategoria > default

### Log e Monitoring

```javascript
// Locations dei log
backend/logs/ai-service.log     // Log servizio AI
backend/logs/openai-errors.log  // Errori OpenAI
backend/logs/kb-processing.log  // Processing Knowledge Base
```

### Comandi Utili

```bash
# Test configurazione AI
curl -X GET http://localhost:3000/api/ai/health

# Reset cache conversazioni
curl -X DELETE http://localhost:3000/api/ai/conversation/:id

# Statistiche utilizzo
curl -X GET http://localhost:3000/api/ai/stats
```

---

## 📊 Metriche e Analytics

### KPI Monitorati

1. **Utilizzo AI**
   - Numero conversazioni/giorno
   - Token utilizzati/mese
   - Costo stimato/mese

2. **Performance**
   - Tempo risposta medio
   - Tasso successo risposte
   - Soddisfazione utenti

3. **Knowledge Base**
   - Documenti totali
   - Utilizzo per categoria
   - Hit rate documenti

### Dashboard Analytics

```sql
-- Query conversazioni giornaliere
SELECT 
  DATE(created_at) as giorno,
  COUNT(*) as conversazioni,
  SUM(tokens_used) as token_totali,
  AVG(tokens_used) as token_medi
FROM ai_conversation_logs
GROUP BY DATE(created_at)
ORDER BY giorno DESC;
```

---

## 🚀 Roadmap Futura

### In Sviluppo
- [ ] Supporto GPT-4 Vision per analisi immagini
- [ ] Voice-to-text per input vocali
- [ ] Export conversazioni in PDF
- [ ] Analytics dashboard avanzata

### Pianificato
- [ ] Multi-language support
- [ ] Fine-tuning modelli personalizzati
- [ ] Integrazione con altri LLM (Claude, Gemini)
- [ ] Automated testing delle configurazioni

---

## 📝 Note Finali

Il sistema AI di Richiesta Assistenza rappresenta un'implementazione avanzata e completa di assistenza intelligente, con:

- ✅ **Contesto completo** per ogni richiesta
- ✅ **Personalizzazione multi-livello**
- ✅ **Knowledge Base integrata**
- ✅ **Interfaccia user-friendly**
- ✅ **Scalabilità e performance**

Per supporto tecnico o domande, contattare il team di sviluppo.

---

*Documentazione aggiornata al: Gennaio 2025*
*Versione: 2.0*
*Autore: Team Sviluppo Richiesta Assistenza*
