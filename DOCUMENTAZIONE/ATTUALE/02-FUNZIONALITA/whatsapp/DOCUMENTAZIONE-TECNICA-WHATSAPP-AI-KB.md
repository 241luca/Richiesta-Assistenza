# DOCUMENTAZIONE TECNICA - PARTE 2

## 9. ESEMPI PRATICI (continuazione)

### 9.1 Esempio: Cliente con Emergenza

```typescript
// SCENARIO: Perdita d'acqua grave con allagamento
const emergencyScenario = {
  message: "AIUTO! Si è rotto un tubo e si sta allagando tutto il bagno!",
  
  processing: {
    // Step 1: Intent Recognition
    intent: {
      primary: 'REQUEST_HELP',
      confidence: 0.95,
      urgency: 'URGENT'
    },
    
    // Step 2: Category Detection
    category: {
      detected: 'idraulica',
      confidence: 0.9,
      keywords: ['tubo', 'allagando', 'bagno']
    },
    
    // Step 3: Urgency Assessment
    urgency: {
      level: 'URGENT',
      factors: [
        'keyword: AIUTO (emergency indicator)',
        'keyword: allagando (water damage risk)',
        'exclamation marks (emotional state)'
      ]
    },
    
    // Step 4: AI Response Generation
    aiResponse: {
      immediate: `🚨 EMERGENZA IDRAULICA - AZIONI IMMEDIATE:

1️⃣ CHIUDI SUBITO il rubinetto generale dell'acqua
   📍 Di solito si trova vicino al contatore

2️⃣ Stacca la corrente elettrica nella zona allagata
   ⚡ Per sicurezza!

3️⃣ Metti asciugamani/stracci per contenere l'acqua

Sto chiamando un idraulico d'emergenza. 
Confermi l'indirizzo registrato?`,
      
      followUp: `✅ Idraulico d'emergenza notificato!

👷 Mario Rossi (⭐ 4.8)
📱 Ti chiamerà entro 5 minuti
⏱️ Arrivo stimato: 30-45 minuti
💰 Tariffa emergenza: €120/ora

Richiesta #EMG-2024-0923 creata.
Il professionista ha accesso al tuo numero.`
    },
    
    // Step 5: System Actions
    systemActions: [
      'createUrgentRequest()',
      'notifyEmergencyProfessionals()',
      'sendSMS(user.phone)',
      'escalateToAdmin()',
      'logEmergencyEvent()'
    ]
  }
};
```

### 9.2 Esempio: Professionista che Cerca Documentazione

```typescript
// SCENARIO: Elettricista cerca info su normativa
const professionalScenario = {
  message: "Normativa CEI 64-8 per impianti civili",
  user: { role: 'PROFESSIONAL', specialization: 'elettricista' },
  
  processing: {
    // Step 1: Role Recognition
    userContext: {
      role: 'PROFESSIONAL',
      accessLevel: 'ADVANCED',
      kbAccess: 'FULL'
    },
    
    // Step 2: Query Analysis
    queryType: {
      type: 'DOCUMENTATION_REQUEST',
      topic: 'normativa',
      specific: 'CEI 64-8'
    },
    
    // Step 3: KB Search
    kbSearch: {
      strategy: 'MULTI_LEVEL',
      searches: [
        {
          level: 'EXACT_MATCH',
          query: 'CEI 64-8',
          results: 3
        },
        {
          level: 'SEMANTIC',
          query: 'normativa impianti civili elettrici',
          results: 5
        },
        {
          level: 'RELATED',
          query: 'certificazione impianti',
          results: 2
        }
      ]
    },
    
    // Step 4: Response
    response: `📚 NORMATIVA CEI 64-8 - Documenti trovati:

📄 **CEI 64-8/7 Ed. 2022** (PRINCIPALE)
   Impianti elettrici utilizzatori a tensione nominale non superiore a 1000V
   • Parte 7: Ambienti ed applicazioni particolari
   📥 [Download PDF] | 📖 [Leggi Online]

📋 **Guida Pratica CEI 64-8**
   Interpretazione e applicazione per installatori
   • Con esempi pratici e schemi
   📥 [Download] | 🎥 [Video Tutorial]

📝 **Checklist Conformità CEI 64-8**
   Lista controlli per certificazione
   • Modello compilabile
   📥 [Download DOCX]

🔍 Documenti correlati:
• CEI 64-14 - Verifiche impianti
• CEI 0-21 - Regola tecnica connessione BT
• DM 37/08 - Decreto impianti

Serve altro? Specifica la sezione che ti interessa.`
    }
  }
};
```

### 9.3 Esempio: Cliente Nuovo con Domande Generiche

```typescript
// SCENARIO: Primo contatto, esplorazione servizio
const newUserScenario = {
  message: "Ciao, come funziona?",
  user: null, // Nuovo utente
  
  processing: {
    // Step 1: New User Detection
    userManagement: {
      action: 'CREATE_TEMP_USER',
      data: {
        phone: '+39XXX',
        role: 'CLIENT',
        status: 'WHATSAPP_TEMP'
      }
    },
    
    // Step 2: Intent = Information Request
    intent: 'INFO_REQUEST',
    
    // Step 3: Welcome Flow
    response: `Ciao! 👋 Benvenuto in ${APP_NAME}!

Sono l'assistente virtuale, ti aiuto a:
🔧 Trovare professionisti qualificati
💰 Ricevere preventivi gratuiti
⭐ Risolvere problemi di casa/ufficio

**Come funziona:**
1️⃣ Descrivi il tuo problema
2️⃣ Ricevi preventivi in 30 min
3️⃣ Scegli il professionista
4️⃣ Problema risolto!

**I nostri servizi:**
• 🚰 Idraulica
• ⚡ Elettricista
• ❄️ Condizionamento
• 🔥 Riscaldamento
• 🏠 Altri servizi casa

Hai un problema da risolvere? Descrivimelo!

Oppure scrivi:
MENU - Per tutte le opzioni
PREZZI - Info su costi`,
    
    // Step 4: Session Creation
    sessionData: {
      state: 'WELCOME_SENT',
      expectingResponse: true,
      suggestedActions: ['describe_problem', 'view_menu', 'ask_prices']
    }
  }
};
```

### 9.4 Esempio: Gestione Multi-turno Complessa

```typescript
// SCENARIO: Conversazione con context switching
const multiTurnScenario = {
  conversation: [
    {
      turn: 1,
      user: "Ho un problema con la caldaia",
      bot: "Che tipo di problema hai con la caldaia? Non si accende, non scalda, o fa rumori strani?",
      context: { category: 'riscaldamento', gathering: 'details' }
    },
    {
      turn: 2,
      user: "Non parte proprio, è spenta",
      bot: `Proviamo alcune verifiche:
1. Il display mostra codici errore?
2. L'alimentazione elettrica è attiva?
3. Il gas è aperto?

Fammi sapere cosa vedi.`,
      context: { 
        category: 'riscaldamento',
        subcategory: 'caldaie',
        problem: 'non_accensione',
        gathering: 'troubleshooting'
      }
    },
    {
      turn: 3,
      user: "Aspetta, quanto mi costa la chiamata?",
      bot: `💰 Per l'uscita del tecnico:
• Diritto di chiamata: €40-60
• Manodopera: €35-50/ora
• Preventivo sempre GRATUITO

Vuoi che chiami un tecnico per la caldaia?
Il preventivo è gratis e senza impegno.`,
      context: {
        // Context switch detected
        previousContext: 'troubleshooting',
        currentContext: 'pricing_info',
        willReturn: true
      }
    },
    {
      turn: 4,
      user: "Ok si, chiama il tecnico",
      bot: `✅ Perfetto! Creo la richiesta per la caldaia.

Conferma questi dati:
📍 Indirizzo: [dal profilo]
🏠 Problema: Caldaia non si accende
🔧 Già verificato: Display spento

Confermi? (SI/NO)`,
      context: {
        // Return to original context
        category: 'riscaldamento',
        action: 'creating_request',
        awaitingConfirmation: true
      }
    },
    {
      turn: 5,
      user: "SI",
      bot: `✅ Richiesta #REQ-2024-0924 creata!

🔔 Ho notificato 4 tecnici specializzati in caldaie
⏰ Riceverai preventivi entro 30 minuti
📱 Ti avviserò appena arrivano

Nel frattempo, tieni spenta la caldaia per sicurezza.`,
      context: {
        requestCreated: true,
        requestId: 'REQ-2024-0924',
        followUpScheduled: true
      }
    }
  ]
};
```

---

## 10. CONFIGURAZIONE AVANZATA

### 10.1 Personalizzazione Risposte

```typescript
// config/whatsapp-templates.ts
export const RESPONSE_TEMPLATES = {
  // Stile di comunicazione
  communicationStyle: {
    formal: {
      greeting: "Buongiorno {name}, come posso assisterLa?",
      thanks: "La ringrazio per averci contattato.",
      closing: "Cordiali saluti"
    },
    informal: {
      greeting: "Ciao {name}! Come posso aiutarti?",
      thanks: "Grazie per averci scritto!",
      closing: "A presto!"
    },
    professional: {
      greeting: "Salve {name}, sono a sua disposizione.",
      thanks: "Grazie per la sua richiesta.",
      closing: "Restiamo a disposizione"
    }
  },
  
  // Template per categoria
  categoryTemplates: {
    idraulica: {
      emergency: "🚨 EMERGENZA IDRAULICA:\n{instructions}\n\nTecnico in arrivo!",
      troubleshooting: "💧 Proviamo queste verifiche:\n{steps}",
      quote: "🚰 Preventivo Idraulico:\n{details}"
    },
    elettricista: {
      emergency: "⚡ ATTENZIONE SICUREZZA:\n{safety}\n\nElettricista urgente in arrivo!",
      troubleshooting: "🔌 Controlli sicuri da fare:\n{steps}",
      quote: "⚡ Preventivo Elettrico:\n{details}"
    }
  },
  
  // Emoji set per mood
  emojiSets: {
    professional: {
      success: "✓",
      error: "✗",
      info: "ℹ",
      warning: "⚠"
    },
    friendly: {
      success: "✅",
      error: "❌",
      info: "💡",
      warning: "⚠️"
    },
    playful: {
      success: "🎉",
      error: "😓",
      info: "💭",
      warning: "🚨"
    }
  }
};

// Personalizzazione per tipo utente
export const USER_PREFERENCES = {
  elderly: {
    fontSize: 'large',
    complexity: 'simple',
    techLevel: 'basic',
    responseLength: 'short',
    includeVoiceNote: true
  },
  professional: {
    fontSize: 'normal',
    complexity: 'technical',
    techLevel: 'advanced',
    responseLength: 'detailed',
    includeDocuments: true
  },
  regular: {
    fontSize: 'normal',
    complexity: 'moderate',
    techLevel: 'intermediate',
    responseLength: 'balanced',
    includeMedia: true
  }
};
```

### 10.2 Configurazione AI Avanzata

```typescript
// config/ai-settings.ts
export const AI_CONFIGURATION = {
  // Modelli per use case
  models: {
    emergency: {
      model: 'gpt-4', // Più accurato per emergenze
      temperature: 0.3,
      maxTokens: 500,
      topP: 0.9,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5
    },
    technical: {
      model: 'gpt-3.5-turbo-16k', // Contesto lungo per documenti
      temperature: 0.5,
      maxTokens: 2000,
      topP: 0.95
    },
    conversation: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 800,
      topP: 1.0
    },
    classification: {
      model: 'gpt-3.5-turbo',
      temperature: 0.1, // Molto bassa per consistenza
      maxTokens: 100,
      topP: 0.9
    }
  },
  
  // Prompt Engineering
  prompts: {
    categoryDetection: `
      Analizza il seguente messaggio e identifica:
      1. Categoria principale (idraulica/elettricista/etc)
      2. Sottocategoria specifica se presente
      3. Livello di urgenza (1-5)
      4. Keywords rilevanti
      
      Messaggio: {message}
      
      Rispondi SOLO in JSON:
      {
        "category": "string",
        "subcategory": "string|null",
        "urgency": number,
        "keywords": ["string"]
      }
    `,
    
    solutionGeneration: `
      Contesto:
      - Categoria: {category}
      - Problema: {problem}
      - Urgenza: {urgency}
      - Documenti KB: {kbDocuments}
      
      Genera una soluzione pratica:
      1. Azioni immediate (se urgente)
      2. Troubleshooting steps
      3. Quando chiamare un professionista
      4. Costi stimati
      
      Usa un tono {tone} e includi emoji appropriate.
      Massimo 5 frasi.
    `,
    
    conversationContinuation: `
      Storico conversazione:
      {history}
      
      Ultimo messaggio utente: {message}
      
      Continua la conversazione in modo naturale:
      - Mantieni il contesto
      - Sii coerente con le risposte precedenti
      - Se cambia argomento, acknowledgealo
      - Massimo 3 frasi
    `
  },
  
  // Context Window Management
  contextManagement: {
    maxHistoryMessages: 20,
    summaryAfterMessages: 10,
    contextWindowSize: 4000,
    includeUserProfile: true,
    includeSessionData: true,
    includePreviousRequests: true
  },
  
  // Rate Limiting
  rateLimits: {
    perUser: {
      requests: 100,
      window: '1h'
    },
    perPhone: {
      requests: 50,
      window: '1h'
    },
    emergency: {
      requests: 999, // Praticamente illimitato
      window: '1h'
    }
  }
};
```

### 10.3 Knowledge Base Configuration

```typescript
// config/kb-settings.ts
export const KB_CONFIGURATION = {
  // Indexing settings
  indexing: {
    enableEmbeddings: true,
    embeddingModel: 'text-embedding-ada-002',
    chunkSize: 500,
    chunkOverlap: 50,
    minChunkSize: 100
  },
  
  // Search configuration
  search: {
    strategies: [
      {
        name: 'exact_match',
        weight: 1.0,
        enabled: true
      },
      {
        name: 'semantic',
        weight: 0.8,
        enabled: true,
        threshold: 0.7
      },
      {
        name: 'fuzzy',
        weight: 0.6,
        enabled: true,
        maxDistance: 2
      },
      {
        name: 'synonym',
        weight: 0.5,
        enabled: true
      }
    ],
    
    maxResults: 10,
    minScore: 0.5,
    boostRecent: true,
    boostPopular: true
  },
  
  // Document processing
  processing: {
    supportedFormats: ['pdf', 'docx', 'txt', 'md', 'html'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    extractImages: true,
    extractTables: true,
    generateSummary: true,
    detectLanguage: true
  },
  
  // Categorization rules
  categorization: {
    autoDetect: true,
    requireApproval: false,
    confidenceThreshold: 0.7,
    multiCategory: true,
    maxCategories: 3
  },
  
  // Caching
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 1000,
    strategy: 'LRU'
  }
};
```

---

## 11. MONITORING E ANALYTICS

### 11.1 Metriche di Sistema

```typescript
// monitoring/metrics.ts
export class WhatsAppMetrics {
  private metrics: Map<string, Metric>;
  
  constructor() {
    this.initializeMetrics();
    this.startCollectors();
  }
  
  private initializeMetrics() {
    this.metrics = new Map([
      // Performance Metrics
      ['response_time', new Histogram({
        name: 'whatsapp_response_time',
        help: 'Response time for WhatsApp messages',
        buckets: [0.1, 0.5, 1, 2, 5, 10]
      })],
      
      ['message_count', new Counter({
        name: 'whatsapp_messages_total',
        help: 'Total WhatsApp messages',
        labelNames: ['direction', 'type', 'status']
      })],
      
      ['active_sessions', new Gauge({
        name: 'whatsapp_active_sessions',
        help: 'Currently active WhatsApp sessions'
      })],
      
      // Business Metrics
      ['requests_created', new Counter({
        name: 'whatsapp_requests_created',
        help: 'Requests created via WhatsApp',
        labelNames: ['category', 'urgency']
      })],
      
      ['conversion_rate', new Gauge({
        name: 'whatsapp_conversion_rate',
        help: 'Conversation to request conversion rate'
      })],
      
      ['ai_usage', new Counter({
        name: 'whatsapp_ai_tokens_used',
        help: 'AI tokens consumed',
        labelNames: ['model', 'purpose']
      })],
      
      // Quality Metrics
      ['intent_accuracy', new Gauge({
        name: 'whatsapp_intent_accuracy',
        help: 'Intent recognition accuracy'
      })],
      
      ['kb_hit_rate', new Gauge({
        name: 'whatsapp_kb_hit_rate',
        help: 'Knowledge base hit rate'
      })],
      
      ['user_satisfaction', new Gauge({
        name: 'whatsapp_user_satisfaction',
        help: 'User satisfaction score',
        labelNames: ['category']
      })]
    ]);
  }
  
  // Track message processing
  async trackMessage(message: WhatsAppMessage, processing: ProcessingResult) {
    // Record response time
    this.metrics.get('response_time')!.observe(processing.duration);
    
    // Count message
    this.metrics.get('message_count')!.inc({
      direction: message.type,
      type: processing.intent,
      status: processing.success ? 'success' : 'failure'
    });
    
    // Track AI usage
    if (processing.aiTokensUsed) {
      this.metrics.get('ai_usage')!.inc({
        model: processing.aiModel,
        purpose: processing.intent
      }, processing.aiTokensUsed);
    }
    
    // Log to database
    await prisma.whatsAppAnalytics.create({
      data: {
        messageId: message.id,
        phoneNumber: message.phoneNumber,
        intent: processing.intent,
        category: processing.category,
        responseTime: processing.duration,
        aiTokensUsed: processing.aiTokensUsed,
        kbHit: processing.kbDocumentsFound > 0,
        requestCreated: processing.requestCreated,
        timestamp: new Date()
      }
    });
  }
}
```

### 11.2 Dashboard Analytics

```typescript
// analytics/dashboard.ts
export class AnalyticsDashboard {
  async getMetrics(timeRange: TimeRange): Promise<DashboardMetrics> {
    const start = timeRange.start;
    const end = timeRange.end;
    
    // Message Volume
    const messageVolume = await prisma.whatsAppMessage.groupBy({
      by: ['type', 'timestamp'],
      where: {
        timestamp: { gte: start, lte: end }
      },
      _count: true
    });
    
    // Category Distribution
    const categoryDistribution = await prisma.whatsAppAnalytics.groupBy({
      by: ['category'],
      where: {
        timestamp: { gte: start, lte: end }
      },
      _count: true,
      orderBy: { _count: { category: 'desc' } }
    });
    
    // Conversion Funnel
    const conversions = await this.calculateConversions(start, end);
    
    // Average Response Time
    const avgResponseTime = await prisma.whatsAppAnalytics.aggregate({
      where: {
        timestamp: { gte: start, lte: end }
      },
      _avg: {
        responseTime: true
      }
    });
    
    // User Satisfaction
    const satisfaction = await this.calculateSatisfaction(start, end);
    
    // Top Issues
    const topIssues = await prisma.whatsAppAnalytics.groupBy({
      by: ['intent'],
      where: {
        timestamp: { gte: start, lte: end }
      },
      _count: true,
      orderBy: { _count: { intent: 'desc' } },
      take: 10
    });
    
    // Cost Analysis
    const costs = await this.calculateCosts(start, end);
    
    return {
      summary: {
        totalMessages: messageVolume.reduce((sum, m) => sum + m._count, 0),
        uniqueUsers: await this.getUniqueUsers(start, end),
        requestsCreated: conversions.requestsCreated,
        conversionRate: conversions.rate,
        avgResponseTime: avgResponseTime._avg.responseTime,
        satisfaction: satisfaction.score,
        totalCost: costs.total
      },
      
      charts: {
        messageVolume: this.formatTimeSeriesData(messageVolume),
        categoryDistribution: this.formatPieData(categoryDistribution),
        conversionFunnel: this.formatFunnelData(conversions),
        topIssues: this.formatBarData(topIssues),
        satisfactionTrend: await this.getSatisfactionTrend(start, end)
      },
      
      insights: await this.generateInsights(start, end)
    };
  }
  
  private async generateInsights(start: Date, end: Date): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Peak hours analysis
    const peakHours = await this.findPeakHours(start, end);
    if (peakHours.concentration > 0.5) {
      insights.push({
        type: 'optimization',
        title: 'Orari di picco identificati',
        description: `Il ${peakHours.percentage}% dei messaggi arriva tra le ${peakHours.start} e le ${peakHours.end}`,
        action: 'Considera di aumentare le risorse in questi orari'
      });
    }
    
    // Category trends
    const categoryTrends = await this.analyzeCategoryTrends(start, end);
    for (const trend of categoryTrends) {
      if (trend.growth > 50) {
        insights.push({
          type: 'trend',
          title: `Aumento richieste ${trend.category}`,
          description: `+${trend.growth}% rispetto al periodo precedente`,
          action: 'Verifica disponibilità professionisti in questa categoria'
        });
      }
    }
    
    // AI Optimization opportunities
    const aiStats = await this.analyzeAIUsage(start, end);
    if (aiStats.avgTokensPerMessage > 1000) {
      insights.push({
        type: 'cost',
        title: 'Ottimizzazione AI possibile',
        description: 'L\'uso medio di token è elevato',
        action: 'Rivedi i prompt per ridurre i costi'
      });
    }
    
    return insights;
  }
}
```

### 11.3 Report Automatici

```typescript
// reports/whatsapp-reports.ts
export class WhatsAppReportGenerator {
  async generateDailyReport(date: Date): Promise<Report> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const report: Report = {
      type: 'DAILY',
      date,
      sections: []
    };
    
    // Executive Summary
    report.sections.push({
      title: 'Executive Summary',
      content: await this.generateExecutiveSummary(dayStart, dayEnd)
    });
    
    // Message Statistics
    report.sections.push({
      title: 'Statistiche Messaggi',
      content: await this.generateMessageStats(dayStart, dayEnd),
      charts: [
        await this.generateHourlyChart(dayStart, dayEnd),
        await this.generateCategoryPie(dayStart, dayEnd)
      ]
    });
    
    // Conversion Analysis
    report.sections.push({
      title: 'Analisi Conversioni',
      content: await this.generateConversionAnalysis(dayStart, dayEnd),
      charts: [
        await this.generateConversionFunnel(dayStart, dayEnd)
      ]
    });
    
    // AI Performance
    report.sections.push({
      title: 'Performance AI',
      content: await this.generateAIPerformance(dayStart, dayEnd),
      metrics: {
        accuracy: await this.calculateIntentAccuracy(dayStart, dayEnd),
        avgResponseTime: await this.calculateAvgAITime(dayStart, dayEnd),
        tokensUsed: await this.calculateTokenUsage(dayStart, dayEnd),
        cost: await this.calculateAICost(dayStart, dayEnd)
      }
    });
    
    // Issues and Alerts
    const issues = await this.identifyIssues(dayStart, dayEnd);
    if (issues.length > 0) {
      report.sections.push({
        title: 'Problemi Rilevati',
        content: this.formatIssues(issues),
        severity: this.getMaxSeverity(issues)
      });
    }
    
    // Recommendations
    report.sections.push({
      title: 'Raccomandazioni',
      content: await this.generateRecommendations(dayStart, dayEnd)
    });
    
    // Send report
    await this.sendReport(report);
    
    return report;
  }
  
  async generateWeeklyReport(weekStart: Date): Promise<Report> {
    // Similar structure but with weekly aggregations
    // Include trends and comparisons with previous week
  }
  
  async generateMonthlyReport(month: Date): Promise<Report> {
    // Monthly comprehensive report
    // Include cost analysis, ROI calculations, growth metrics
  }
}
```

---

## 12. TROUBLESHOOTING

### 12.1 Problemi Comuni e Soluzioni

```yaml
PROBLEMA: WhatsApp non si connette
SINTOMI:
  - QR Code non appare
  - Connessione timeout
  - Stato sempre "disconnesso"
  
DIAGNOSI:
  1. Verificare access token SendApp:
     curl -X GET "https://app.sendapp.cloud/api/status" \
          -H "Authorization: Bearer YOUR_TOKEN"
  
  2. Controllare logs:
     tail -f logs/whatsapp.log | grep ERROR
  
  3. Verificare Redis (se usato):
     redis-cli ping
  
SOLUZIONI:
  - Rigenerare access token su SendApp
  - Verificare che il numero non sia già connesso altrove
  - Pulire cache browser e riprovare
  - Reset istanza: POST /api/whatsapp/reset

---

PROBLEMA: Messaggi non arrivano
SINTOMI:
  - Webhook non riceve POST
  - Messaggi in uscita OK ma non in entrata
  
DIAGNOSI:
  1. Test webhook:
     curl -X POST https://tuodominio.com/api/whatsapp/webhook \
          -H "Content-Type: application/json" \
          -d '{"test": true}'
  
  2. Verificare configurazione SendApp:
     Dashboard → Webhook Settings
  
  3. Check ngrok (se locale):
     Verificare che l'URL sia aggiornato
  
SOLUZIONI:
  - Aggiornare webhook URL su SendApp
  - Verificare SSL certificato (per produzione)
  - Controllare firewall/proxy
  - Abilitare webhook logs su SendApp

---

PROBLEMA: AI non risponde o errori
SINTOMI:
  - Timeout su risposte AI
  - Errori 429 (rate limit)
  - Risposte generiche sempre
  
DIAGNOSI:
  1. Check OpenAI status:
     https://status.openai.com
  
  2. Verificare crediti API:
     Dashboard OpenAI → Usage
  
  3. Test diretto API:
     curl https://api.openai.com/v1/models \
          -H "Authorization: Bearer YOUR_KEY"
  
SOLUZIONI:
  - Verificare API key nel .env
  - Controllare limiti di rate
  - Implementare retry con backoff
  - Cache risposte comuni
  - Fallback su risposte template

---

PROBLEMA: Knowledge Base non trova documenti
SINTOMI:
  - Ricerche sempre vuote
  - Documenti non indicizzati
  - Embeddings non generati
  
DIAGNOSI:
  1. Check documenti:
     SELECT COUNT(*) FROM "KbDocument" 
     WHERE processingStatus = 'completed';
  
  2. Verificare embeddings:
     SELECT COUNT(*) FROM "KbDocument" 
     WHERE embedding IS NOT NULL;
  
  3. Test ricerca diretta:
     SELECT * FROM "KbDocument" 
     WHERE title ILIKE '%termine%';
  
SOLUZIONI:
  - Ri-processare documenti
  - Verificare OpenAI embeddings API
  - Ricostruire indici DB
  - Aumentare threshold similarità
```

### 12.2 Debug Avanzato

```typescript
// debug/whatsapp-debugger.ts
export class WhatsAppDebugger {
  private debugMode: boolean;
  private verboseLevel: number;
  
  constructor(config: DebugConfig) {
    this.debugMode = config.enabled;
    this.verboseLevel = config.level;
  }
  
  // Trace message flow
  async traceMessage(phoneNumber: string, message: string) {
    const trace: MessageTrace = {
      id: generateTraceId(),
      timestamp: new Date(),
      steps: []
    };
    
    // Step 1: Input validation
    trace.steps.push({
      name: 'INPUT_VALIDATION',
      input: { phoneNumber, message },
      output: await this.validateInput(phoneNumber, message),
      duration: 0,
      success: true
    });
    
    // Step 2: User identification
    const userStep = await this.traceUserIdentification(phoneNumber);
    trace.steps.push(userStep);
    
    // Step 3: Session management
    const sessionStep = await this.traceSessionManagement(phoneNumber);
    trace.steps.push(sessionStep);
    
    // Step 4: Intent recognition
    const intentStep = await this.traceIntentRecognition(message);
    trace.steps.push(intentStep);
    
    // Step 5: Category detection
    const categoryStep = await this.traceCategoryDetection(message);
    trace.steps.push(categoryStep);
    
    // Step 6: AI processing
    const aiStep = await this.traceAIProcessing(message, categoryStep.output);
    trace.steps.push(aiStep);
    
    // Step 7: KB search
    const kbStep = await this.traceKBSearch(message, categoryStep.output);
    trace.steps.push(kbStep);
    
    // Step 8: Response generation
    const responseStep = await this.traceResponseGeneration(
      message,
      aiStep.output,
      kbStep.output
    );
    trace.steps.push(responseStep);
    
    // Save trace
    await this.saveTrace(trace);
    
    return trace;
  }
  
  // Simulate conversation
  async simulateConversation(scenario: ConversationScenario) {
    console.log('🎭 Starting conversation simulation...');
    
    const results: SimulationResult[] = [];
    
    for (const turn of scenario.turns) {
      console.log(`\n👤 User: ${turn.message}`);
      
      const result = await this.processMessage(
        scenario.phoneNumber,
        turn.message,
        scenario.user
      );
      
      console.log(`🤖 Bot: ${result.response}`);
      
      results.push({
        turn: turn.number,
        input: turn.message,
        expectedIntent: turn.expectedIntent,
        actualIntent: result.intent,
        expectedResponse: turn.expectedResponse,
        actualResponse: result.response,
        match: this.compareResponses(turn.expectedResponse, result.response)
      });
      
      // Wait between turns
      await sleep(1000);
    }
    
    // Generate report
    const report = this.generateSimulationReport(results);
    console.log('\n📊 Simulation Report:', report);
    
    return report;
  }
  
  // Performance profiling
  async profilePerformance(count: number = 100) {
    const profiles: PerformanceProfile[] = [];
    
    for (let i = 0; i < count; i++) {
      const message = this.generateTestMessage();
      const start = performance.now();
      
      const profile: PerformanceProfile = {
        messageLength: message.length,
        steps: {}
      };
      
      // Profile each step
      let stepStart = performance.now();
      const user = await this.identifyUser('+39' + i);
      profile.steps.userIdentification = performance.now() - stepStart;
      
      stepStart = performance.now();
      const intent = await this.detectIntent(message);
      profile.steps.intentDetection = performance.now() - stepStart;
      
      stepStart = performance.now();
      const category = await this.detectCategory(message);
      profile.steps.categoryDetection = performance.now() - stepStart;
      
      stepStart = performance.now();
      const ai = await this.processWithAI(message);
      profile.steps.aiProcessing = performance.now() - stepStart;
      
      stepStart = performance.now();
      const kb = await this.searchKB(message);
      profile.steps.kbSearch = performance.now() - stepStart;
      
      profile.totalTime = performance.now() - start;
      profiles.push(profile);
    }
    
    // Calculate statistics
    return {
      avgTotalTime: avg(profiles.map(p => p.totalTime)),
      p95TotalTime: percentile(profiles.map(p => p.totalTime), 95),
      stepBreakdown: {
        userIdentification: avg(profiles.map(p => p.steps.userIdentification)),
        intentDetection: avg(profiles.map(p => p.steps.intentDetection)),
        categoryDetection: avg(profiles.map(p => p.steps.categoryDetection)),
        aiProcessing: avg(profiles.map(p => p.steps.aiProcessing)),
        kbSearch: avg(profiles.map(p => p.steps.kbSearch))
      }
    };
  }
}
```

---

## 13. BEST PRACTICES

### 13.1 Conversational Design

```typescript
// best-practices/conversation-design.ts
export const CONVERSATION_BEST_PRACTICES = {
  // Opening
  opening: {
    DO: [
      'Salutare in modo appropriato all\'ora',
      'Identificarsi come assistente',
      'Mostrare disponibilità ad aiutare',
      'Essere concisi ma cordiali'
    ],
    DONT: [
      'Messaggi troppo lunghi all\'inizio',
      'Troppe opzioni subito',
      'Linguaggio troppo tecnico',
      'Assumere il problema'
    ],
    EXAMPLES: {
      good: 'Ciao! Sono l\'assistente di Richiesta Assistenza. Come posso aiutarti?',
      bad: 'Benvenuto nel sistema automatizzato di gestione richieste assistenza tecnica domiciliare. Seleziona una delle seguenti 15 opzioni...'
    }
  },
  
  // Information Gathering
  informationGathering: {
    DO: [
      'Una domanda alla volta',
      'Confermare la comprensione',
      'Offrire esempi se necessario',
      'Permettere correzioni'
    ],
    DONT: [
      'Troppe domande insieme',
      'Domande ambigue',
      'Saltare a conclusioni',
      'Ignorare risposte parziali'
    ],
    EXAMPLES: {
      good: 'Capisco che hai un problema con la caldaia. Non si accende proprio o fa rumori strani?',
      bad: 'Dimmi marca modello anno problema sintomi hai già provato qualcosa quando è successo'
    }
  },
  
  // Error Handling
  errorHandling: {
    DO: [
      'Ammettere quando non si capisce',
      'Chiedere chiarimenti educatamente',
      'Offrire alternative',
      'Escalation a umano quando necessario'
    ],
    DONT: [
      'Fingere di aver capito',
      'Rispondere a caso',
      'Loop infiniti',
      'Frustare l\'utente'
    ],
    EXAMPLES: {
      good: 'Non ho capito bene. Puoi spiegarmi meglio il problema? O preferisci parlare con un operatore?',
      bad: 'Errore. Riprova.'
    }
  },
  
  // Closing
  closing: {
    DO: [
      'Riassumere azioni intraprese',
      'Fornire riferimenti (ID richiesta)',
      'Spiegare prossimi passi',
      'Lasciare porta aperta per follow-up'
    ],
    DONT: [
      'Chiudere bruscamente',
      'Lasciare questioni aperte',
      'Dimenticare riferimenti',
      'Promettere cose non mantenibili'
    ],
    EXAMPLES: {
      good: 'Ho creato la richiesta #123. Un idraulico ti contatterà entro 30 minuti. Per aggiornamenti scrivi STATO 123.',
      bad: 'Ok fatto ciao'
    }
  }
};
```

### 13.2 Security Best Practices

```typescript
// security/whatsapp-security.ts
export const SECURITY_PRACTICES = {
  // Data Protection
  dataProtection: {
    // Never store sensitive data in plain text
    sensitiveFields: ['password', 'creditCard', 'ssn', 'documentId'],
    
    // Encryption for PII
    encryptPII: true,
    encryptionAlgorithm: 'AES-256-GCM',
    
    // Data retention
    messageRetention: '90 days',
    sessionRetention: '30 days',
    analyticsRetention: '1 year',
    
    // GDPR compliance
    allowDataExport: true,
    allowDataDeletion: true,
    requireConsent: true
  },
  
  // Authentication & Authorization
  authentication: {
    // Phone number verification
    verifyPhoneNumber: true,
    otpLength: 6,
    otpExpiry: '5 minutes',
    maxOtpAttempts: 3,
    
    // Session security
    sessionTimeout: '24 hours',
    sessionRotation: true,
    
    // Rate limiting
    maxMessagesPerMinute: 10,
    maxMessagesPerHour: 100,
    maxMessagesPerDay: 500
  },
  
  // Input Validation
  validation: {
    // Message validation
    maxMessageLength: 4096,
    allowedMediaTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxMediaSize: 10 * 1024 * 1024, // 10MB
    
    // Command validation
    commandWhitelist: true,
    sanitizeInput: true,
    preventInjection: true,
    
    // Phone number validation
    phoneNumberRegex: /^\+[1-9]\d{1,14}$/,
    blockedCountries: [],
    allowedCountries: ['IT', 'SM', 'VA'] // Italy, San Marino, Vatican
  },
  
  // Audit & Monitoring
  monitoring: {
    // Log all actions
    logLevel: 'INFO',
    logSensitiveData: false,
    
    // Audit trail
    auditAllCommands: true,
    auditDataAccess: true,
    auditConfigChanges: true,
    
    // Alerts
    alertOnSuspiciousActivity: true,
    alertOnMultipleFailedAttempts: true,
    alertOnUnusualPatterns: true,
    
    // Suspicious patterns
    suspiciousPatterns: [
      'multiple requests in short time',
      'attempting blocked commands',
      'unusual hours activity',
      'location changes'
    ]
  }
};
```

### 13.3 Performance Optimization

```typescript
// optimization/performance.ts
export const PERFORMANCE_OPTIMIZATIONS = {
  // Caching Strategy
  caching: {
    // Redis caching
    redis: {
      enabled: true,
      ttl: {
        userProfile: 3600,      // 1 hour
        categories: 86400,      // 24 hours
        kbDocuments: 3600,      // 1 hour
        aiResponses: 300,       // 5 minutes
        sessionData: 1800       // 30 minutes
      }
    },
    
    // Local memory cache
    memory: {
      enabled: true,
      maxSize: 100,
      strategy: 'LRU'
    },
    
    // Cache warming
    warmupOnStart: true,
    warmupCategories: true,
    warmupCommonQueries: true
  },
  
  // Database Optimization
  database: {
    // Connection pooling
    connectionPool: {
      min: 2,
      max: 10,
      idleTimeout: 30000
    },
    
    // Query optimization
    usePreparedStatements: true,
    batchInserts: true,
    batchSize: 100,
    
    // Indexes (ensure these exist)
    requiredIndexes: [
      'whatsapp_message_phone_timestamp',
      'whatsapp_session_phone',
      'kb_document_subcategory_status',
      'assistance_request_client_status'
    ]
  },
  
  // AI Optimization
  ai: {
    // Model selection
    useModelByUrgency: {
      URGENT: 'gpt-4',
      HIGH: 'gpt-3.5-turbo',
      MEDIUM: 'gpt-3.5-turbo',
      LOW: 'gpt-3.5-turbo'
    },
    
    // Token optimization
    maxTokensByType: {
      emergency: 500,
      troubleshooting: 800,
      information: 300,
      greeting: 100
    },
    
    // Response caching
    cacheCommonQuestions: true,
    cacheTimeout: 300,
    
    // Batch processing
    batchEmbeddings: true,
    batchSize: 100
  },
  
  // Message Processing
  processing: {
    // Async processing
    useQueues: true,
    queueConcurrency: 5,
    
    // Parallel processing where possible
    parallelizeKBSearch: true,
    parallelizeAICall: false, // Usually sequential is better
    
    // Timeout management
    timeouts: {
      ai: 30000,        // 30 seconds
      kb: 5000,         // 5 seconds
      database: 10000,  // 10 seconds
      total: 45000      // 45 seconds
    }
  }
};
```

---

## 14. SICUREZZA

### 14.1 Security Architecture

```yaml
Security Layers:
  1. Network Level:
     - HTTPS only for webhooks
     - IP whitelisting (optional)
     - Rate limiting at nginx/cloudflare
     
  2. Application Level:
     - JWT validation
     - Session management
     - Input sanitization
     - Output encoding
     
  3. Data Level:
     - Encryption at rest
     - Encryption in transit
     - PII tokenization
     - Secure key management
     
  4. Audit Level:
     - Complete audit trail
     - Anomaly detection
     - Real-time alerts
     - Compliance reporting
```

### 14.2 Threat Mitigation

```typescript
// security/threat-mitigation.ts
export class ThreatMitigation {
  // SQL Injection Prevention
  preventSQLInjection(input: string): string {
    // Using Prisma parameterized queries
    // Never concatenate user input
    return prisma.$queryRaw`
      SELECT * FROM users 
      WHERE phone = ${input}
    `;
  }
  
  // XSS Prevention
  preventXSS(message: string): string {
    // Sanitize for WhatsApp (limited HTML)
    return message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Command Injection Prevention
  preventCommandInjection(command: string): boolean {
    const whitelist = Object.keys(COMMAND_REGISTRY);
    const sanitized = command.toUpperCase().split(' ')[0];
    return whitelist.includes(sanitized);
  }
  
  // Rate Limiting
  async checkRateLimit(phoneNumber: string): Promise<boolean> {
    const key = `rate_limit:${phoneNumber}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, 60); // 1 minute window
    }
    
    return current <= 10; // Max 10 messages per minute
  }
  
  // Anomaly Detection
  async detectAnomaly(phoneNumber: string, message: string): Promise<AnomalyResult> {
    const patterns = [
      {
        name: 'rapid_fire',
        check: async () => {
          const recentCount = await this.getRecentMessageCount(phoneNumber, 60);
          return recentCount > 20;
        }
      },
      {
        name: 'suspicious_content',
        check: () => {
          const suspicious = ['script', 'DROP TABLE', 'DELETE FROM', '<script'];
          return suspicious.some(s => message.includes(s));
        }
      },
      {
        name: 'unusual_hours',
        check: () => {
          const hour = new Date().getHours();
          return hour >= 2 && hour <= 5; // 2 AM - 5 AM
        }
      }
    ];
    
    const triggered = [];
    for (const pattern of patterns) {
      if (await pattern.check()) {
        triggered.push(pattern.name);
      }
    }
    
    if (triggered.length > 0) {
      await this.logSecurityEvent(phoneNumber, triggered);
    }
    
    return {
      isAnomaly: triggered.length > 0,
      patterns: triggered,
      action: triggered.length > 2 ? 'BLOCK' : 'MONITOR'
    };
  }
}
```

### 14.3 Compliance

```typescript
// compliance/gdpr.ts
export class GDPRCompliance {
  // Data Export (GDPR Article 20)
  async exportUserData(userId: string): Promise<UserDataExport> {
    const data = {
      profile: await prisma.user.findUnique({ where: { id: userId } }),
      messages: await prisma.whatsAppMessage.findMany({ where: { userId } }),
      requests: await prisma.assistanceRequest.findMany({ where: { clientId: userId } }),
      sessions: await prisma.whatsAppSession.findMany({ where: { userId } })
    };
    
    // Remove internal fields
    delete data.profile.password;
    delete data.profile.twoFactorSecret;
    
    return {
      exportDate: new Date(),
      format: 'JSON',
      data
    };
  }
  
  // Right to be Forgotten (GDPR Article 17)
  async deleteUserData(userId: string): Promise<DeletionResult> {
    const result = await prisma.$transaction(async (tx) => {
      // Anonymize instead of delete for audit trail
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.com`,
          phone: `DELETED_${userId}`,
          fullName: 'DELETED USER',
          whatsappNumber: null,
          isActive: false
        }
      });
      
      // Delete messages after 30 days
      await tx.whatsAppMessage.updateMany({
        where: { userId },
        data: {
          scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      
      // Delete sessions immediately
      await tx.whatsAppSession.deleteMany({
        where: { userId }
      });
      
      return { success: true };
    });
    
    return result;
  }
  
  // Consent Management
  async updateConsent(userId: string, consents: ConsentUpdate): Promise<void> {
    await prisma.userConsent.upsert({
      where: { userId },
      create: {
        userId,
        ...consents,
        timestamp: new Date()
      },
      update: {
        ...consents,
        timestamp: new Date()
      }
    });
  }
}
```

---

## 15. MANUTENZIONE

### 15.1 Routine di Manutenzione

```typescript
// maintenance/routine-tasks.ts
export class MaintenanceTasks {
  // Daily Tasks
  @Cron('0 2 * * *') // 2 AM every day
  async dailyMaintenance() {
    console.log('Starting daily maintenance...');
    
    // 1. Clean old sessions
    await this.cleanOldSessions(30); // 30 days
    
    // 2. Archive old messages
    await this.archiveOldMessages(90); // 90 days
    
    // 3. Update statistics
    await this.updateDailyStatistics();
    
    // 4. Optimize database
    await this.optimizeDatabase();
    
    // 5. Clean temporary files
    await this.cleanTempFiles();
    
    // 6. Generate daily report
    await this.generateDailyReport();
    
    console.log('Daily maintenance completed');
  }
  
  // Weekly Tasks
  @Cron('0 3 * * 0') // 3 AM every Sunday
  async weeklyMaintenance() {
    console.log('Starting weekly maintenance...');
    
    // 1. Full backup
    await this.performFullBackup();
    
    // 2. Update AI models cache
    await this.updateAIModelsCache();
    
    // 3. Reindex knowledge base
    await this.reindexKnowledgeBase();
    
    // 4. Security audit
    await this.performSecurityAudit();
    
    // 5. Performance analysis
    await this.analyzePerformance();
    
    console.log('Weekly maintenance completed');
  }
  
  // Monthly Tasks
  @Cron('0 4 1 * *') // 4 AM first day of month
  async monthlyMaintenance() {
    console.log('Starting monthly maintenance...');
    
    // 1. Data retention policy
    await this.enforceDataRetention();
    
    // 2. Cost analysis
    await this.analyzeCosts();
    
    // 3. User satisfaction survey
    await this.sendSatisfactionSurveys();
    
    // 4. Update documentation
    await this.checkDocumentationUpdates();
    
    // 5. License audit
    await this.auditLicenses();
    
    console.log('Monthly maintenance completed');
  }
}
```

### 15.2 Monitoring e Alerting

```yaml
Monitoring Setup:
  Infrastructure:
    - CPU Usage: Alert > 80%
    - Memory Usage: Alert > 85%
    - Disk Space: Alert < 20% free
    - Network Latency: Alert > 1000ms
    
  Application:
    - Response Time: Alert > 5s
    - Error Rate: Alert > 5%
    - Queue Length: Alert > 1000
    - Active Sessions: Alert > 10000
    
  Business:
    - Message Volume: Alert on unusual spike/drop
    - Conversion Rate: Alert < 10%
    - AI Costs: Alert > daily budget
    - User Complaints: Alert > 10/hour
    
  Security:
    - Failed Auth: Alert > 10/minute
    - Suspicious Patterns: Immediate alert
    - Data Breach Attempt: Critical alert
    - System Intrusion: Critical alert

Alert Channels:
  - Email: For all non-critical
  - SMS: For critical alerts
  - Slack: For team notifications
  - PagerDuty: For on-call rotation
```

### 15.3 Disaster Recovery

```typescript
// disaster-recovery/recovery-plan.ts
export class DisasterRecoveryPlan {
  // Backup Strategy
  backupStrategy = {
    frequency: {
      database: 'every 6 hours',
      files: 'daily',
      configurations: 'on change'
    },
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12
    },
    locations: [
      'local',
      's3',
      'offsite'
    ]
  };
  
  // Recovery Procedures
  async executeRecovery(scenario: DisasterScenario) {
    switch (scenario) {
      case 'DATABASE_CORRUPTION':
        return this.recoverDatabase();
        
      case 'WHATSAPP_BANNED':
        return this.switchWhatsAppAccount();
        
      case 'AI_SERVICE_DOWN':
        return this.switchToBackupAI();
        
      case 'COMPLETE_FAILURE':
        return this.fullSystemRecovery();
        
      default:
        return this.manualIntervention(scenario);
    }
  }
  
  // RTO and RPO Targets
  targets = {
    RTO: '4 hours',  // Recovery Time Objective
    RPO: '1 hour',   // Recovery Point Objective
    availability: '99.9%'
  };
  
  // Testing Schedule
  testingSchedule = {
    backupRestore: 'monthly',
    failover: 'quarterly',
    fullDR: 'annually'
  };
}
```

---

## 16. CONCLUSIONI E ROADMAP

### 16.1 Metriche di Successo

```yaml
KPI Target:
  Operational:
    - Uptime: >99.9%
    - Response Time: <2s average
    - Error Rate: <1%
    - Message Processing: >1000/minute
    
  Business:
    - Automation Rate: >80%
    - Conversion Rate: >30%
    - User Satisfaction: >4.5/5
    - Cost per Interaction: <€0.10
    
  Quality:
    - Intent Accuracy: >90%
    - KB Hit Rate: >70%
    - First Resolution Rate: >60%
    - Escalation Rate: <20%
```

### 16.2 Roadmap Sviluppo

```yaml
Q4 2025 (Current):
  ✅ WhatsApp Integration
  ✅ AI Multi-level
  ✅ Knowledge Base
  ✅ Basic Analytics
  
Q1 2026:
  - Voice Messages Support
  - Multi-language (EN, ES, FR)
  - Advanced Analytics Dashboard
  - A/B Testing Framework
  
Q2 2026:
  - Video Call Integration
  - Proactive Messaging
  - Predictive Maintenance
  - Mobile App Companion
  
Q3 2026:
  - WhatsApp Business Platform
  - Multi-channel (Telegram, FB)
  - AI Model Fine-tuning
  - Enterprise Features
  
Q4 2026:
  - International Expansion
  - Blockchain Contracts
  - IoT Integration
  - Full Automation Suite
```

### 16.3 Conclusioni

Il Sistema WhatsApp AI + Knowledge Base rappresenta una soluzione enterprise completa per l'automazione del supporto clienti. Con un'architettura modulare, scalabile e sicura, il sistema è in grado di gestire migliaia di conversazioni simultanee, fornendo risposte accurate e contestualizzate.

**Punti di Forza:**
- Integrazione seamless con sistemi esistenti
- AI multi-livello con personalizzazione per categoria
- Knowledge Base dinamica e intelligente
- Sistema di comandi completo
- Analytics e monitoring avanzati
- Sicurezza e compliance GDPR

**Best Practice Implementate:**
- Conversation design ottimizzato
- Error handling robusto
- Performance optimization
- Security by design
- Continuous monitoring
- Disaster recovery plan

**Risultati Attesi:**
- Riduzione 80% carico supporto
- Disponibilità 24/7
- Tempo risposta <2 secondi
- Soddisfazione utenti >90%
- ROI positivo in 3 mesi

---

## APPENDICE A: QUICK REFERENCE

### Comandi Principali
```
AIUTO/MENU - Menu principale
STATO [ID] - Stato richiesta
ANNULLA ID - Annulla richiesta
ACCETTA ID - Accetta preventivo
OPERATORE - Supporto umano
PAGAMENTI - Info pagamenti
```

### API Endpoints
```
POST /api/whatsapp/webhook - Webhook messaggi
GET /api/whatsapp/status - Stato connessione
GET /api/whatsapp/qrcode - QR Code
POST /api/whatsapp/send - Invia messaggio
GET /api/whatsapp/stats - Statistiche
```

### Variabili Environment
```env
SENDAPP_BASE_URL=https://app.sendapp.cloud/api
SENDAPP_ACCESS_TOKEN=your_token
OPENAI_API_KEY=sk-xxx
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

### Troubleshooting Rapido
```bash
# Check status
curl localhost:3200/api/whatsapp/status

# View logs
tail -f logs/whatsapp.log

# Reset connection
curl -X POST localhost:3200/api/whatsapp/reset

# Test webhook
curl -X POST localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

**FINE DOCUMENTAZIONE TECNICA**

Documento completo di 1500+ righe
Versione: 1.0.0
Data: Settembre 2025
Autore: LM Tecnologie

Per supporto: support@lmtecnologie.it
Repository: https://github.com/241luca/Richiesta-Assistenza
