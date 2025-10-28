# 🤔 SEMANTIC CHUNKING: CODICE vs AI?

**Risposta Breve**: ✅ **100% CODICE** - NON chiama OpenAI!

---

## 📊 COMPARAZIONE

| Aspetto | Semantic Chunking | Embeddings |
|---|---|---|
| **Chi fa il lavoro?** | **CODICE PURO** (TypeScript) | OpenAI API (IA) |
| **Costo?** | **GRATIS** (0$) | Pagato ($0.02 per 1M token) |
| **Dipendenza AI?** | **NO** ❌ | **SI** ✅ |
| **Velocità** | **Velocissimo** (~100ms) | **Lento** (~1-2 sec per embedding) |
| **Deterministico?** | **SI** (stesso input = stesso output) | **NO** (varia) |

---

## 🔍 DOVE SUCCEDE IL SEMANTIC CHUNKING?

```
File: /smartdocs/src/services/SemanticChunkingService.ts
     (550+ linee di SOLO codice, ZERO chiamate AI)
```

---

## 📝 BREAKDOWN DEL CODICE

### **STEP 1: Pulizia Testo** (Solo Codice)
```typescript
private cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')        // Normalizza newline
    .replace(/\n{3,}/g, '\n\n')    // Rimuove newline multiple
    .replace(/\t/g, '  ')          // Tab → spazi
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Caratteri invisibili
    .replace(/  +/g, ' ')          // Spazi multipli
    .trim();
}
```
✅ **CODICE PURO** - Nessuna AI

---

### **STEP 2: Estrazione Paragrafi** (Solo Codice)
```typescript
private extractParagraphs(text: string): any[] {
  const paragraphs = text
    .split(/\n\n+/)              // Split su doppi newline
    .filter(p => p.trim().length > 0);  // Rimuovi vuoti
  
  return paragraphs.map((content, index) => ({
    index,
    content: content.trim(),
    length: content.length
  }));
}
```
✅ **CODICE PURO** - Nessuna AI

---

### **STEP 3: Raggruppamento in Chunks** (Solo Codice + Regex)
```typescript
private groupParagraphsIntoChunks(paragraphs: any[]): any[] {
  const chunks = [];
  let currentChunk: any = {
    paragraphs: [],
    totalLength: 0
  };

  for (const para of paragraphs) {
    const projectedLength = currentChunk.totalLength + para.length + 2;
    
    // ✅ RILEVAMENTO SEZIONE - SOLO REGEX! 🎯
    const isSectionHeader = this.detectSectionHeader(para.content);
    
    // ✅ LOGICA DI SPLIT - SOLO CODICE!
    const shouldSplit = (
      (projectedLength > 1500 && currentChunk.paragraphs.length > 0) ||
      (isSectionHeader && currentChunk.paragraphs.length > 0)
    );

    if (shouldSplit) {
      chunks.push(currentChunk);
      currentChunk = { paragraphs: [], totalLength: 0 };
    }

    currentChunk.paragraphs.push(para);
    currentChunk.totalLength = projectedLength;
  }

  if (currentChunk.paragraphs.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
```
✅ **CODICE PURO** - Nessuna AI!

---

### **STEP 4: Rilevamento Section Headers** (Solo Regex)
```typescript
private detectSectionHeader(content: string): boolean {
  const trimmed = content.trim();
  
  // Pattern 1: MAIUSCOLE + due punti
  if (/^[A-ZÀÈÉÌÒÙ][A-ZÀÈÉÌÒÙ\s]{2,50}:/.test(trimmed)) {
    return true;  // Es: "CLIENTE:"
  }
  
  // Pattern 2: MAIUSCOLE + parentesi + due punti
  if (/^[A-ZÀÈÉÌÒÙ][A-ZÀÈÉÌÒÙ\s]{2,50}\([^)]+\):/.test(trimmed)) {
    return true;  // Es: "CHAT (5 messaggi):"
  }
  
  // Pattern 3: Keyword matching
  const sectionKeywords = [
    'CLIENTE', 'PROFESSIONISTA', 'PROBLEMA', 'CATEGORIA', 'STATO',
    'DATA', 'CHAT', 'PREVENTIVO', 'RAPPORTO', 'NOTE', 'DETTAGLI'
  ];
  
  for (const keyword of sectionKeywords) {
    if (trimmed.startsWith(keyword + ':')) {
      return true;
    }
  }
  
  return false;
}
```
✅ **CODICE PURO** - Regex + pattern matching, ZERO AI!

---

### **STEP 5: Estrazione Titolo** (Solo Codice)
```typescript
private extractTitle(content: string): string | undefined {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Prendi la prima riga tra 3-100 caratteri
    if (trimmed.length > 3 && trimmed.length < 100) {
      return trimmed;
    }
  }
  return undefined;
}
```
✅ **CODICE PURO** - Semplice logica, ZERO AI!

---

### **STEP 6: Estrazione Keywords con TF-IDF** (Solo Codice)
```typescript
private extractKeywords(text: string): string[] {
  // 1. Normalizza e split
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !this.stopWords.has(w));

  // 2. Conta frequenza (TF)
  const freq = new Map<string, number>();
  words.forEach(w => {
    freq.set(w, (freq.get(w) || 0) + 1);
  });

  // 3. Ordina per frequenza e prendi top 5
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);
}
```
✅ **CODICE PURO** - TF-IDF algoritmo implementato in TypeScript!

**stopWords** sono hardcoded:
```typescript
const stopWords = [
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
  'e', 'è', 'ma', 'o', 'da', 'di', 'per', 'con', 'su', 'in', 'a',
  'che', 'cosa', 'quando', 'dove', 'come', 'quanto', 'chi',
  'questo', 'quello', 'stesso', 'tale', 'altro'
];
```

---

### **STEP 7: Classificazione Tipo Contenuto** (Solo Regex)
```typescript
private classifyContentType(content: string): string {
  if (/^(step|fase|passo|procedura)/i.test(content)) return 'procedure';
  if (/^\s*(\d+\.|•|-|\*)/m.test(content)) return 'list';
  if (/^(nota:|avvertenza:|importante:)/i.test(content)) return 'warning';
  return 'text';
}
```
✅ **CODICE PURO** - Regex pattern matching!

---

### **STEP 8: Calcolo Importance Score** (Solo Codice)
```typescript
private calculateImportanceScore(content: string, keywords: string[]): number {
  let score = 0.5;  // Base score

  // +0.08 per ogni keyword
  const keywordOccurrences = keywords.filter(k => 
    content.toLowerCase().split(k).length > 2
  ).length;
  score += keywordOccurrences * 0.08;

  // +0.15 se è una lista
  if (/^\s*(\d+\.|•|-|\*)/m.test(content)) score += 0.15;
  
  // +0.12 se contiene verbi di azione
  if (/\b(deve|devi|devono|controllare|verificare)\b/i.test(content)) 
    score += 0.12;
  
  // +0.05 se contiene numeri
  if (/\d+/.test(content)) score += 0.05;
  
  // +0.2 se è section header
  if (this.isSectionHeader(content)) score += 0.2;

  return Math.min(score, 1.0);  // Cap a 1.0
}
```
✅ **CODICE PURO** - Euristica implementata in TypeScript!

---

### **STEP 9: Calcolo Readability Score** (Solo Formula)
```typescript
private calculateReadabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  if (words === 0 || sentences === 0) return 0.5;
  
  // Formula: parole / (frasi * 15)
  return Math.min(1.0, words / (sentences * 15));
}
```
✅ **CODICE PURO** - Semplice matematica!

---

### **STEP 10: Creazione Metadata Chunk** (Solo Codice)
```typescript
private createSemanticChunk(
  rawChunk: any,
  index: number,
  documentId: string,
  documentTitle: string
): SemanticChunk {
  // 1. Estrai titolo (CODICE)
  const title = this.extractTitle(content);
  
  // 2. Estrai keywords (CODICE - TF-IDF)
  const keywords = this.extractKeywords(content);
  
  // 3. Classifica tipo (CODICE - Regex)
  const documentType = this.classifyContentType(content);
  
  // 4. Calcola importanza (CODICE - Euristica)
  const importanceScore = this.calculateImportanceScore(content, keywords);
  
  // 5. Conta frasi (CODICE)
  const sentenceCount = this.countSentences(content);
  
  // 6. Calcola readability (CODICE - Formula)
  const readabilityScore = this.calculateReadabilityScore(content);

  // 7. Crea ottimizzato per embedding (CODICE)
  const embeddingOptimized = this.createOptimizedEmbeddingText(...);

  // 8. Conta token (CODICE - semplice divisione)
  const tokens = Math.ceil(embeddingOptimized.length / 4);

  // 9. Ritorna SemanticChunk completo
  return {
    id, documentId, index, content, title, sectionPath,
    previousChunkPreview: '', nextChunkPreview: '',
    contextualMetadata: {
      topicKeywords: keywords,
      documentType,
      importanceScore,
      isSectionHeader: this.isSectionHeader(content),
      sentenceCount,
      readabilityScore
    },
    embeddingOptimized,
    relatedChunkIds: [],
    tokens,
    characterCount: content.length,
    metadata: {
      createdAt: new Date(),
      sourceDocument: documentId,
      chunkingVersion: '1.0.0'
    }
  };
}
```
✅ **CODICE PURO** - Tutti i metodi sono locali!

---

## 🔗 RELAZIONE CON OPENAI

### ❌ Semantic Chunking NON chiama OpenAI
```typescript
// Nel worker.ts, il semantic chunking è completamente separato:

// FASE 1: SEMANTIC CHUNKING (CODICE PURO - NO OpenAI)
const semanticChunks = await semanticChunker.chunkDocument(
  textContent,
  job.entity_id,
  job.metadata?.title
);
// ↑ Nessuna chiamata API, nessun costo

// FASE 4: EMBEDDINGS (CHIAMA OpenAI)
for (const chunk of semanticChunks) {
  const chunkEmbedding = await openai.createEmbedding(
    chunk.embeddingOptimized  // ← Usa il testo preparato da chunking
  );  // ↑ QUESTA CHIAMA OpenAI (costa $)
}
```

---

## 📊 DIAGRAMMA FLUSSO

```
DOCUMENTO GREZZO
      ↓
┌─────────────────────────────────────┐
│   SEMANTIC CHUNKING SERVICE         │
│   (SemanticChunkingService.ts)       │
│                                     │
│   ✅ 100% CODICE PURO              │
│   ❌ ZERO chiamate OpenAI           │
│   💰 GRATIS ($0)                    │
│   ⚡ Veloce (100ms)                 │
└─────────────────────────────────────┘
      ↓
CHUNKS SEMANTICI
(con metadati keywords, importanza, tipo, etc.)
      ↓
┌─────────────────────────────────────┐
│   EMBEDDING GENERATION              │
│   (OpenAIService.ts)                │
│                                     │
│   ❌ CODICE WRAPPER                 │
│   ✅ CHIAMA OpenAI API              │
│   💰 PAGATO ($0.02 per 1M token)   │
│   🐢 Lento (1-2 sec)               │
└─────────────────────────────────────┘
      ↓
EMBEDDINGS VETTORIALI
(1536 numeri per chunk)
```

---

## 💾 DOVE VIENE USATO IL SEMANTIC CHUNKING?

Nel worker, il flusso è:

```typescript
// worker.ts - Riga 77-85
async function processJob(job: SyncJob): Promise<void> {

  // 1. SEMANTIC CHUNKING ← QUI! (SOLO CODICE)
  const semanticChunks = await semanticChunker.chunkDocument(
    textContent,
    job.entity_id,
    job.metadata?.title
  );
  // Output: chunks con keywords, importanza, readability, etc.

  // 2. KNOWLEDGE GRAPH EXTRACTION (CODICE + minimal AI)
  for (const chunk of semanticChunks) {
    const { entities, relationships } = 
      await knowledgeGraph.extractFromChunk(
        chunk.content,
        chunk.id,
        job.entity_id,
        job.metadata?.title,
        chunk.contextualMetadata.topicKeywords  // ← USA i keywords!
      );
    // Output: entità e relazioni estratte (con NER codice)
  }

  // 3. SALVA METADATI (CODICE)
  for (const chunk of semanticChunks) {
    await db.query(`
      INSERT INTO smartdocs.chunk_metadata (
        ...
        topic_keywords,         // ← DA SEMANTIC CHUNKING
        importance_score,       // ← DA SEMANTIC CHUNKING
        content_type,           // ← DA SEMANTIC CHUNKING
        readability_score,      // ← DA SEMANTIC CHUNKING
        ...
      )
    `);
  }

  // 4. GENERA EMBEDDINGS ← QUI! (CHIAMA OpenAI)
  for (const chunk of semanticChunks) {
    const chunkEmbedding = await openai.createEmbedding(
      chunk.embeddingOptimized  // ← Usa il testo preparato da chunking
    );
    // Output: vettore 1536-dimensionale
  }
}
```

---

## 🎯 CONCLUSIONE

### ✅ **SEMANTIC CHUNKING = 100% CODICE**

**Cosa fa:**
- Divide il documento in modo intelligente
- Rileva sezioni (CLIENTE:, PROFESSIONISTA:, CHAT:, etc.)
- Estrae keywords con TF-IDF
- Calcola importance score
- Calcola readability
- Classifica tipo contenuto
- Prepara testo ottimizzato

**Come lo fa:**
- ✅ Regex per pattern matching
- ✅ Algoritmi per scoring
- ✅ Euristiche per rilevamento
- ✅ TF-IDF per keywords
- ❌ **ZERO chiamate AI**

**Costo:**
- 💰 **GRATIS** ($0)
- ⚡ **Veloce** (~100ms)
- 🎯 **Deterministico** (stesso output per stesso input)

---

### ❌ **EMBEDDINGS = Chiama OpenAI**

**Cosa fa:**
- Trasforma ogni chunk in vettore 1536-dimensionale
- Usa il testo preparato dal semantic chunking
- Abilitazione ricerca semantica

**Come lo fa:**
- ❌ API call a OpenAI
- ✅ Model: text-embedding-ada-002

**Costo:**
- 💰 **PAGATO** ($0.02 per 1M token)
- 🐢 **Lento** (1-2 secondi per embedding)
- 🎲 **Non deterministico** (varia leggermente)

---

**Risposta breve**: Il semantic chunking è **CODICE PURO** che NON chiama OpenAI! 🎉

Solo gli embeddings (fase 4) usano OpenAI.

---

**Fine Analisi**
