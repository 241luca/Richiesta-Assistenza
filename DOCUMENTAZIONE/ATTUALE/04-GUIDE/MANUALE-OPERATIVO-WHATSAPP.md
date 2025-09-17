# 📘 MANUALE OPERATIVO - SISTEMA WHATSAPP AI
## Guida Pratica per Operatori e Amministratori

---

## 🎯 INDICE OPERATIVO

1. [OPERAZIONI QUOTIDIANE](#1-operazioni-quotidiane)
2. [GESTIONE CONVERSAZIONI](#2-gestione-conversazioni)
3. [CONFIGURAZIONE AI E KB](#3-configurazione-ai-e-kb)
4. [MONITORAGGIO SISTEMA](#4-monitoraggio-sistema)
5. [RISOLUZIONE PROBLEMI](#5-risoluzione-problemi)
6. [OTTIMIZZAZIONE PERFORMANCE](#6-ottimizzazione-performance)

---

## 1. OPERAZIONI QUOTIDIANE

### 1.1 Check Mattutino (5 minuti)

```bash
# OGNI MATTINA ALLE 8:00
# Script automatico: daily-check.sh

#!/bin/bash
echo "🌅 DAILY CHECK - $(date)"

# 1. Verifica connessione WhatsApp
curl -s http://localhost:3200/api/whatsapp/status | jq '.data.connected'
if [ $? -ne 0 ]; then
  echo "❌ WhatsApp disconnesso - RICONNETTERE!"
  # Invia alert
  curl -X POST http://localhost:3200/api/alerts/send \
    -d '{"type":"whatsapp_down","priority":"high"}'
fi

# 2. Check code messaggi non processati
PENDING=$(psql -d assistenza -c "
  SELECT COUNT(*) FROM WhatsAppMessage 
  WHERE status = 'PENDING' 
  AND timestamp > NOW() - INTERVAL '1 hour'
" -t)

if [ $PENDING -gt 10 ]; then
  echo "⚠️ $PENDING messaggi in coda"
fi

# 3. Verifica crediti AI
CREDITS=$(curl -s https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.remaining_credits')
  
if [ $CREDITS -lt 1000 ]; then
  echo "⚠️ Crediti AI bassi: $CREDITS"
fi

# 4. Spazio disco
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "⚠️ Spazio disco: ${DISK_USAGE}%"
fi

echo "✅ Check completato"
```

### 1.2 Dashboard Operativo

#### Vista Principale (http://localhost:5193/admin/whatsapp/dashboard)

```typescript
// Metriche Real-Time da Monitorare
const DASHBOARD_METRICS = {
  // Status Box (sempre visibile)
  status: {
    whatsappConnected: boolean,    // 🟢 Connected / 🔴 Disconnected
    activeConversations: number,    // Conversazioni attive ora
    pendingMessages: number,        // Messaggi da processare
    avgResponseTime: string,        // "1.2s" - tempo medio risposta
  },
  
  // Live Feed (ultimi 10 messaggi)
  liveFeed: [
    {
      time: "08:45",
      phone: "+39XXX...123",
      message: "Ho un problema con...",
      intent: "REQUEST_HELP",
      status: "PROCESSED"
    }
  ],
  
  // Alert Box
  alerts: [
    {
      level: "WARNING",
      message: "Response time degradato (>3s)",
      action: "Verificare carico AI"
    }
  ],
  
  // Quick Stats (oggi)
  todayStats: {
    totalMessages: 245,
    requestsCreated: 18,
    conversionRate: "35%",
    satisfactionScore: 4.5
  }
};
```

### 1.3 Task Giornaliere

#### Mattina (8:00-9:00)
- [ ] Verificare report notturno
- [ ] Controllare messaggi non risposti
- [ ] Verificare richieste urgenti create di notte
- [ ] Controllare alert sicurezza

#### Pomeriggio (14:00-15:00)
- [ ] Review conversazioni problematiche
- [ ] Aggiornare KB con nuove FAQ
- [ ] Verificare performance AI
- [ ] Controllare costi giornalieri

#### Sera (18:00-19:00)
- [ ] Report giornaliero
- [ ] Backup configurazioni modificate
- [ ] Pianificare manutenzioni
- [ ] Review metriche del giorno

---

## 2. GESTIONE CONVERSAZIONI

### 2.1 Monitoraggio Live

```typescript
// Interface Admin per Monitoraggio
interface ConversationMonitor {
  // Filtri disponibili
  filters: {
    status: 'ACTIVE' | 'WAITING' | 'CLOSED',
    intent: 'HELP' | 'INFO' | 'COMPLAINT' | 'OTHER',
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    timeRange: 'LAST_HOUR' | 'TODAY' | 'WEEK'
  },
  
  // Azioni rapide
  quickActions: {
    takeOver: (conversationId: string) => void,      // Prendi controllo
    escalate: (conversationId: string) => void,      // Escala a senior
    resolve: (conversationId: string) => void,       // Marca come risolta
    flag: (conversationId: string, reason) => void,  // Segnala problema
  },
  
  // Template risposte rapide
  quickResponses: [
    {
      key: 'TECH_ARRIVING',
      text: 'Il tecnico sta arrivando, sarà da lei tra {TIME} minuti'
    },
    {
      key: 'NEED_MORE_INFO',
      text: 'Per aiutarla meglio, può inviarmi una foto del problema?'
    }
  ]
}
```

### 2.2 Intervento Manuale

#### Quando Intervenire
```yaml
INTERVIENI SEMPRE:
  - Minacce o emergenze sicurezza
  - Richieste di rimborso >€500
  - Lamentele ripetute (>3 messaggi negativi)
  - Errori AI ricorrenti
  - Richieste dati sensibili

INTERVIENI SE:
  - Conversazione >10 turni senza risoluzione
  - Utente chiede esplicitamente operatore
  - Sentiment molto negativo (<-0.8)
  - Problema tecnico complesso non in KB

NON INTERVENIRE:
  - Conversazioni che procedono bene
  - Richieste standard gestite da AI
  - Semplici domande FAQ
  - Utenti soddisfatti
```

#### Come Prendere Controllo

```typescript
// Processo di Take-Over
async function takeOverConversation(conversationId: string, adminId: string) {
  // 1. Notifica utente
  await sendMessage(phoneNumber, 
    "🧑‍💼 Un operatore sta prendendo in carico la sua richiesta..."
  );
  
  // 2. Disabilita AI per questa conversazione
  await prisma.whatsAppSession.update({
    where: { id: conversationId },
    data: { 
      aiEnabled: false,
      operatorId: adminId,
      operatorTakeoverAt: new Date()
    }
  });
  
  // 3. Carica contesto per operatore
  const context = await loadConversationContext(conversationId);
  
  // 4. Apri chat interface per admin
  return {
    conversationId,
    context,
    suggestedActions: generateSuggestions(context)
  };
}
```

### 2.3 Template e Risposte Standard

```typescript
// templates/operator-responses.ts
export const OPERATOR_TEMPLATES = {
  // Saluti e Apertura
  greeting: {
    morning: "Buongiorno {name}, sono {operator}, come posso aiutarla?",
    afternoon: "Buon pomeriggio {name}, sono {operator}, in cosa posso esserle utile?",
    evening: "Buonasera {name}, sono {operator}, come posso assisterla?"
  },
  
  // Gestione Attese
  wait: {
    short: "Un attimo, verifico subito...",
    medium: "Mi dia qualche minuto per verificare con il tecnico...",
    long: "Devo fare alcune verifiche, la ricontatto tra 10 minuti. Va bene?"
  },
  
  // Risoluzione Problemi
  troubleshooting: {
    moreInfo: "Per capire meglio, può dirmi quando è iniziato il problema?",
    tryThis: "Proviamo questa soluzione: {solution}. Mi faccia sapere se funziona.",
    needPhoto: "Può inviarmi una foto così vedo meglio la situazione?",
    solved: "Ottimo! Sono contento che abbiamo risolto. Serve altro?"
  },
  
  // Gestione Lamentele
  complaints: {
    acknowledge: "Capisco la sua frustrazione e mi dispiace per l'inconveniente.",
    investigate: "Verifico subito cosa è successo e troviamo una soluzione.",
    escalate: "Vista la situazione, faccio intervenire il responsabile.",
    resolution: "Ecco cosa possiamo fare per risolvere: {solution}"
  },
  
  // Chiusura
  closing: {
    satisfied: "Perfetto! Se serve altro sono qui. Buona giornata!",
    followup: "La ricontatteremo per verificare che tutto sia a posto.",
    feedback: "Le sarei grato se potesse valutare il servizio. Grazie!"
  }
};
```

---

## 3. CONFIGURAZIONE AI E KB

### 3.1 Ottimizzazione Prompt AI

#### Dashboard Configurazione AI

```typescript
// Interfaccia Web: /admin/whatsapp/ai-config

interface AIConfiguration {
  // Selezione Modello per Scenario
  modelSelection: {
    emergency: {
      model: 'gpt-4',           // Più accurato
      temperature: 0.3,          // Risposte consistenti
      reasoning: 'Emergenze richiedono massima accuratezza'
    },
    
    standard: {
      model: 'gpt-3.5-turbo',   // Bilanciato
      temperature: 0.7,          // Più creativo
      reasoning: 'Buon rapporto costo/qualità'
    },
    
    simple: {
      model: 'gpt-3.5-turbo',   // Economico
      temperature: 0.5,
      maxTokens: 200,            // Risposte brevi
      reasoning: 'Domande semplici non richiedono modelli complessi'
    }
  },
  
  // Prompt Templates Editabili
  prompts: {
    system: `
      [EDITABILE DA INTERFACCIA]
      Sei l'assistente WhatsApp di {COMPANY_NAME}.
      Tono: {TONE_SETTING}
      Stile: {STYLE_SETTING}
      Priorità: {PRIORITIES}
    `,
    
    categorySpecific: {
      idraulica: "[PROMPT SPECIFICO IDRAULICA]",
      elettricista: "[PROMPT SPECIFICO ELETTRICISTA]",
      // ... altri
    }
  },
  
  // Test Prompt
  testingInterface: {
    testMessage: string,        // Messaggio di test
    testResponse: string,       // Risposta AI
    tokens: number,            // Token usati
    cost: number,              // Costo stimato
    time: number               // Tempo risposta
  }
}
```

#### Best Practice Prompt Engineering

```yaml
STRUTTURA PROMPT EFFICACE:
  1. Ruolo e Contesto:
     "Sei un esperto idraulico con 20 anni di esperienza"
     
  2. Obiettivo Chiaro:
     "Aiuta l'utente a risolvere problemi idraulici urgenti"
     
  3. Constraints:
     - "Massimo 3 frasi per risposta"
     - "Usa linguaggio semplice"
     - "Includi sempre stima costi"
     
  4. Formato Output:
     "Rispondi sempre con:
      1. Diagnosi probabile
      2. Soluzione immediata
      3. Quando chiamare tecnico"
      
  5. Esempi (Few-shot):
     "Esempio:
      User: Perdita dal tubo
      Assistant: Probabile guarnizione usurata. 
                 Chiudi subito l'acqua e metti un secchio.
                 Chiama un idraulico se la perdita è grave."
```

### 3.2 Gestione Knowledge Base

#### Upload e Categorizzazione Documenti

```bash
# Script per upload massivo documenti
#!/bin/bash
# kb-upload.sh

SUBCATEGORY_ID="id-caldaie"
API_URL="http://localhost:3200/api/kb/documents"
TOKEN="your-jwt-token"

# Upload tutti i PDF in una cartella
for file in ./documenti/caldaie/*.pdf; do
  echo "Uploading: $file"
  
  curl -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$file" \
    -F "subcategoryId=$SUBCATEGORY_ID" \
    -F "title=$(basename $file .pdf)" \
    -F "targetAudience=BOTH" \
    -F "autoProcess=true"
    
  sleep 2  # Evita rate limiting
done

echo "✅ Upload completato"
```

#### Manutenzione KB

```typescript
// Operazioni periodiche KB
class KBMaintenance {
  // Rimuovi documenti obsoleti
  async cleanupOldDocuments() {
    const oldDocs = await prisma.kbDocument.findMany({
      where: {
        lastAccessedAt: {
          lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 6 mesi
        },
        viewCount: { lt: 10 }
      }
    });
    
    console.log(`Found ${oldDocs.length} obsolete documents`);
    // Review manuale prima di eliminare
  }
  
  // Identifica gap nella documentazione
  async findDocumentationGaps() {
    // Query: domande senza risposta
    const unansweredQueries = await prisma.whatsAppAnalytics.findMany({
      where: {
        kbHit: false,
        intent: 'REQUEST_HELP'
      },
      select: {
        message: true,
        category: true
      },
      distinct: ['message'],
      take: 50
    });
    
    // Raggruppa per categoria
    const gaps = {};
    unansweredQueries.forEach(q => {
      if (!gaps[q.category]) gaps[q.category] = [];
      gaps[q.category].push(q.message);
    });
    
    return gaps;
  }
  
  // Aggiorna embeddings
  async refreshEmbeddings() {
    const docs = await prisma.kbDocument.findMany({
      where: { embedding: null }
    });
    
    for (const doc of docs) {
      const embedding = await generateEmbedding(doc.content);
      await prisma.kbDocument.update({
        where: { id: doc.id },
        data: { embedding }
      });
    }
  }
}
```

---

## 4. MONITORAGGIO SISTEMA

### 4.1 Dashboard Monitoring

```typescript
// Real-time Monitoring Interface
interface SystemMonitor {
  // Metriche Critiche (refresh ogni 5s)
  critical: {
    systemHealth: 'HEALTHY' | 'DEGRADED' | 'DOWN',
    activeUsers: number,
    messageQueue: number,
    errorRate: number,  // percentuale
    avgResponseTime: number  // millisecondi
  },
  
  // Grafici Live (refresh ogni 30s)
  charts: {
    messageVolume: TimeSeriesData,      // Ultimi 60 minuti
    responseTime: TimeSeriesData,       // Ultimi 60 minuti
    errorRate: TimeSeriesData,          // Ultimi 60 minuti
    aiTokenUsage: TimeSeriesData        // Oggi
  },
  
  // Alert Attivi
  activeAlerts: Alert[],
  
  // System Resources
  resources: {
    cpu: number,          // percentuale
    memory: number,       // percentuale
    disk: number,         // percentuale
    network: {
      in: number,         // KB/s
      out: number         // KB/s
    }
  }
}
```

### 4.2 Alert e Notifiche

```yaml
CONFIGURAZIONE ALERT:
  
  CRITICI (SMS + Call):
    - WhatsApp disconnesso > 5 minuti
    - Error rate > 10%
    - Database down
    - Response time > 10s
    - Security breach attempt
    
  ALTA PRIORITÀ (Email + Slack):
    - AI credits < €10
    - Disk space < 10%
    - Queue length > 500
    - Conversion rate < 10%
    
  MEDIA PRIORITÀ (Email):
    - Response time > 5s
    - Error rate > 5%
    - KB hit rate < 50%
    - Daily cost > budget
    
  BASSA PRIORITÀ (Dashboard):
    - New version available
    - Scheduled maintenance reminder
    - Weekly report ready
```

### 4.3 Performance Analysis

```sql
-- Query utili per analisi performance

-- 1. Tempi risposta per ora
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(response_time) as avg_response_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95,
  COUNT(*) as message_count
FROM whatsapp_analytics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- 2. Categorie più problematiche
SELECT 
  category,
  COUNT(*) as total,
  AVG(CASE WHEN kb_hit THEN 1 ELSE 0 END) * 100 as kb_hit_rate,
  AVG(response_time) as avg_response_time,
  COUNT(CASE WHEN request_created THEN 1 END) as requests_created
FROM whatsapp_analytics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY total DESC;

-- 3. Utenti più attivi
SELECT 
  u.full_name,
  u.phone,
  COUNT(m.id) as message_count,
  MAX(m.timestamp) as last_message,
  COUNT(DISTINCT DATE(m.timestamp)) as active_days
FROM whatsapp_message m
JOIN users u ON u.whatsapp_number = m.phone_number
WHERE m.timestamp > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name, u.phone
ORDER BY message_count DESC
LIMIT 20;

-- 4. Pattern di utilizzo
SELECT 
  EXTRACT(HOUR FROM timestamp) as hour_of_day,
  EXTRACT(DOW FROM timestamp) as day_of_week,
  COUNT(*) as message_count,
  AVG(response_time) as avg_response_time
FROM whatsapp_analytics
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY hour_of_day, day_of_week
ORDER BY day_of_week, hour_of_day;
```

---

## 5. RISOLUZIONE PROBLEMI

### 5.1 Troubleshooting Guide

#### Problema: Bot Non Risponde

```bash
# CHECKLIST DIAGNOSTICA
# 1. Verifica connessione WhatsApp
curl http://localhost:3200/api/whatsapp/status

# Se disconnesso:
# - Vai a /admin/whatsapp/setup
# - Genera nuovo QR code
# - Scansiona con telefono

# 2. Verifica webhook
curl -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "from": "+39123456789"}'

# 3. Controlla logs
tail -f logs/whatsapp.log | grep ERROR

# 4. Verifica processamento messaggi
psql -d assistenza -c "
  SELECT status, COUNT(*) 
  FROM whatsapp_message 
  WHERE timestamp > NOW() - INTERVAL '1 hour'
  GROUP BY status
"

# 5. Restart servizi
pm2 restart whatsapp-worker
pm2 restart backend
```

#### Problema: Risposte AI Lente

```typescript
// Diagnostica e Ottimizzazione
async function diagnoseAIPerformance() {
  // 1. Check modello in uso
  const currentModel = await getActiveAIModel();
  console.log(`Model: ${currentModel}`);
  
  // 2. Analizza token usage
  const stats = await prisma.whatsAppAnalytics.aggregate({
    where: {
      timestamp: { gte: new Date(Date.now() - 3600000) }
    },
    _avg: {
      aiTokensUsed: true,
      responseTime: true
    }
  });
  
  if (stats._avg.aiTokensUsed > 1500) {
    console.log('⚠️ Token usage elevato - ottimizzare prompt');
  }
  
  if (stats._avg.responseTime > 5000) {
    console.log('⚠️ Response time alto - considerare cache');
  }
  
  // 3. Suggerimenti
  const suggestions = [];
  
  if (currentModel === 'gpt-4') {
    suggestions.push('Considera gpt-3.5-turbo per query non critiche');
  }
  
  if (stats._avg.aiTokensUsed > 1000) {
    suggestions.push('Riduci lunghezza prompt sistema');
    suggestions.push('Limita contesto conversazione a 10 messaggi');
  }
  
  return suggestions;
}
```

#### Problema: KB Non Trova Documenti

```bash
# Diagnostica Knowledge Base

# 1. Verifica documenti indicizzati
psql -d assistenza -c "
  SELECT 
    subcategory_id,
    COUNT(*) as doc_count,
    COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embedding,
    COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as processed
  FROM kb_document
  GROUP BY subcategory_id
"

# 2. Test ricerca diretta
curl http://localhost:3200/api/kb/search \
  -H "Content-Type: application/json" \
  -d '{"query": "caldaia non parte", "subcategoryId": "xxx"}'

# 3. Riprocessa documenti
curl -X POST http://localhost:3200/api/kb/reprocess \
  -H "Authorization: Bearer TOKEN"

# 4. Verifica embeddings
node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.kbDocument.count({
    where: { embedding: null }
  }).then(count => {
    console.log(\`Documents without embeddings: \${count}\`);
    process.exit();
  });
"
```

### 5.2 Recovery Procedures

#### Procedura: Riconnessione WhatsApp

```typescript
// Procedura automatica di riconnessione
async function autoReconnectWhatsApp() {
  const maxAttempts = 5;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`Tentativo riconnessione ${attempt}/${maxAttempts}`);
    
    try {
      // 1. Check stato attuale
      const status = await whatsappService.getConnectionStatus();
      
      if (status.connected) {
        console.log('✅ Già connesso');
        return true;
      }
      
      // 2. Tenta riconnessione
      await whatsappService.reconnect();
      
      // 3. Attendi
      await sleep(5000);
      
      // 4. Verifica
      const newStatus = await whatsappService.getConnectionStatus();
      
      if (newStatus.connected) {
        console.log('✅ Riconnesso con successo');
        
        // 5. Processa messaggi in coda
        await processQueuedMessages();
        
        return true;
      }
    } catch (error) {
      console.error(`Errore tentativo ${attempt}:`, error);
    }
    
    // Backoff esponenziale
    await sleep(Math.pow(2, attempt) * 1000);
  }
  
  // Se fallisce, alert manuale
  await sendCriticalAlert('WhatsApp reconnection failed - manual intervention required');
  return false;
}
```

#### Procedura: Failover AI

```typescript
// Failover su modello backup
async function aiFailover() {
  const models = [
    { name: 'gpt-3.5-turbo', priority: 1 },
    { name: 'gpt-3.5-turbo-16k', priority: 2 },
    { name: 'claude-instant', priority: 3 },  // Se configurato
    { name: 'local-llm', priority: 4 }        // Fallback locale
  ];
  
  for (const model of models) {
    try {
      console.log(`Testing ${model.name}...`);
      
      const test = await testModel(model.name);
      
      if (test.success) {
        console.log(`✅ Switching to ${model.name}`);
        
        await updateConfig({
          activeAIModel: model.name,
          failoverActive: true
        });
        
        return model;
      }
    } catch (error) {
      console.error(`${model.name} failed:`, error);
    }
  }
  
  // Ultimo fallback: risposte template
  console.log('⚠️ All AI models failed - using templates');
  await enableTemplateMode();
}
```

---

## 6. OTTIMIZZAZIONE PERFORMANCE

### 6.1 Cache Strategy

```typescript
// Configurazione Cache Multi-livello
class CacheManager {
  private memoryCache: Map<string, CacheEntry>;
  private redisClient: Redis;
  
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = new Redis(process.env.REDIS_URL);
    
    // Pulizia periodica memory cache
    setInterval(() => this.cleanMemoryCache(), 60000);
  }
  
  // Cache gerarchica
  async get(key: string): Promise<any> {
    // Level 1: Memory (più veloce)
    const memoryHit = this.memoryCache.get(key);
    if (memoryHit && !this.isExpired(memoryHit)) {
      return memoryHit.value;
    }
    
    // Level 2: Redis
    const redisHit = await this.redisClient.get(key);
    if (redisHit) {
      const value = JSON.parse(redisHit);
      // Promuovi a memory cache
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + 300000  // 5 minuti
      });
      return value;
    }
    
    return null;
  }
  
  // Cache con TTL variabile
  async set(key: string, value: any, context: CacheContext) {
    const ttl = this.calculateTTL(context);
    
    // Memory cache (breve)
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + Math.min(ttl * 1000, 300000)
    });
    
    // Redis (lungo)
    await this.redisClient.setex(
      key,
      ttl,
      JSON.stringify(value)
    );
  }
  
  private calculateTTL(context: CacheContext): number {
    // TTL dinamico basato sul contesto
    switch (context.type) {
      case 'AI_RESPONSE':
        return context.isGeneric ? 3600 : 300;  // 1h vs 5min
      
      case 'KB_SEARCH':
        return 1800;  // 30 minuti
      
      case 'USER_PROFILE':
        return 3600;  // 1 ora
      
      case 'CATEGORY_DATA':
        return 86400;  // 24 ore
      
      default:
        return 600;  // 10 minuti default
    }
  }
}
```

### 6.2 Query Optimization

```sql
-- Indici essenziali per performance

-- 1. Ricerca messaggi
CREATE INDEX idx_whatsapp_message_phone_timestamp 
ON whatsapp_message(phone_number, timestamp DESC);

CREATE INDEX idx_whatsapp_message_status_timestamp
ON whatsapp_message(status, timestamp DESC)
WHERE status IN ('PENDING', 'PROCESSING');

-- 2. Analytics
CREATE INDEX idx_whatsapp_analytics_timestamp_category
ON whatsapp_analytics(timestamp DESC, category);

CREATE INDEX idx_whatsapp_analytics_kb_hit
ON whatsapp_analytics(kb_hit, timestamp DESC);

-- 3. Knowledge Base
CREATE INDEX idx_kb_document_subcategory_status
ON kb_document(subcategory_id, processing_status);

-- Full text search
CREATE INDEX idx_kb_document_content_gin
ON kb_document USING gin(to_tsvector('italian', content));

-- 4. Sessions
CREATE INDEX idx_whatsapp_session_phone_active
ON whatsapp_session(phone_number, is_active);

-- Partial index per sessioni attive
CREATE INDEX idx_whatsapp_session_active_only
ON whatsapp_session(phone_number, last_activity DESC)
WHERE is_active = true;
```

### 6.3 Load Balancing

```nginx
# nginx.conf per load balancing

upstream whatsapp_backend {
    least_conn;  # Distribuisce al server con meno connessioni
    
    server localhost:3200 weight=3;  # Primary
    server localhost:3201 weight=2;  # Secondary
    server localhost:3202 weight=1;  # Backup
    
    # Health check
    keepalive 32;
    keepalive_timeout 60s;
}

server {
    listen 80;
    server_name api.assistenza.it;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=whatsapp:10m rate=10r/s;
    limit_req zone=whatsapp burst=20 nodelay;
    
    location /api/whatsapp/ {
        proxy_pass http://whatsapp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout lunghi per webhook
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
        proxy_read_timeout 90;
    }
    
    # Cache per risposte statiche
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 📊 APPENDICE: METRICHE E KPI

### KPI Operativi Giornalieri

```yaml
METRICHE DA MONITORARE:
  
  Volume:
    - Messaggi totali: Target >500/giorno
    - Conversazioni uniche: Target >100/giorno
    - Messaggi per conversazione: Target <5
    
  Performance:
    - Response time medio: Target <2s
    - Response time P95: Target <5s
    - Error rate: Target <1%
    
  Business:
    - Conversion rate: Target >30%
    - Richieste create: Target >30/giorno
    - Preventivi accettati: Target >50%
    
  Qualità:
    - AI accuracy: Target >90%
    - KB hit rate: Target >70%
    - Escalation rate: Target <10%
    
  Costi:
    - AI tokens/giorno: Budget €50
    - Cost per conversation: Target <€0.10
    - ROI: Target >300%
```

### Report Settimanale Template

```markdown
# REPORT SETTIMANALE WHATSAPP AI
## Settimana: [DATA]

### 📈 EXECUTIVE SUMMARY
- Messaggi processati: X (+Y% vs settimana precedente)
- Richieste create: X
- Conversion rate: X%
- Tempo risposta medio: Xs
- Costo totale: €X

### ✅ SUCCESSI
- [Elenco successi principali]

### ⚠️ PROBLEMI RILEVATI
- [Elenco problemi e soluzioni applicate]

### 🎯 AZIONI PER PROSSIMA SETTIMANA
- [ ] Azione 1
- [ ] Azione 2

### 📊 GRAFICI
[Includere grafici volume, performance, conversion]

### 💰 ANALISI COSTI
- OpenAI API: €X
- Infrastructure: €X
- Totale: €X
- Revenue generated: €X
- ROI: X%
```

---

**FINE MANUALE OPERATIVO**

Documento: 800+ righe
Versione: 1.0.0
Ultimo aggiornamento: Settembre 2025
