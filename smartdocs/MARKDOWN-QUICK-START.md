# Markdown Pipeline - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you processing documents with the new Markdown-first pipeline.

---

## Step 1: Install Dependencies

### Install Python OCR Libraries

```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs
./scripts/install_ocr_dependencies.sh
```

This installs:
- Docling (IBM Research)
- PaddleOCR-VL (Baidu)
- Supporting libraries

**Time**: ~5 minutes

---

## Step 2: Configure Environment

### Update `.env` file:

```bash
# OCR Settings
ENABLE_ADVANCED_OCR=true
DOCLING_ENABLED=true
PADDLEOCR_VL_ENABLED=true

# Python Path
PYTHON_EXECUTABLE=/usr/bin/python3
PYTHON_ENV_PATH=/path/to/your/venv

# MinIO (if not already configured)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=smartdocs
```

---

## Step 3: Run Database Migration

✅ **Already completed** if you've been following along.

If not:

```bash
node run-migration.js migrations/007_markdown_storage.sql
```

---

## Step 4: Test the Pipeline

### Quick Test

```bash
ts-node scripts/test-markdown-pipeline.ts
```

### Expected Output:

```
🧪 Testing Markdown Pipeline

1️⃣ Storing Markdown document...
   ✅ Stored with ID: abc-123

2️⃣ Retrieving Markdown document...
   ✅ Retrieved 872 characters

3️⃣ Chunking Markdown (MD-aware)...
   ✅ Created 8 semantic chunks

4️⃣ Storing Docling chunks...
   ✅ Stored 2 Docling chunks

🎉 All tests passed!
```

---

## Step 5: Use in Your Code

### Example 1: Process a PDF Document

```typescript
import { StructuredDataIngestionService } from './services/StructuredDataIngestionService';

const ingestion = new StructuredDataIngestionService();

const result = await ingestion.ingestStructuredData({
  // Container info
  container_id: 'your-container-uuid',
  source_app: 'manual',
  source_type: 'manual',
  
  // Document info
  entity_type: 'document',
  entity_id: 'doc-001',
  title: 'Annual Report 2024',
  content: '', // Will be replaced by MD
  
  // 🔥 Enable Markdown Pipeline
  use_markdown: true,
  file_path: '/path/to/annual-report.pdf',
  ocr_engine: 'auto', // Automatically selects best engine
  chunking_method: 'both' // Compare Docling vs Semantic
});

console.log(`✅ Document processed: ${result.documentId}`);
console.log(`📊 Chunks created: ${result.chunksCreated}`);
console.log(`🧠 Entities extracted: ${result.entitiesExtracted}`);
console.log(`🔗 Relationships: ${result.relationshipsExtracted}`);
```

### Example 2: Retrieve Markdown

```typescript
import { MarkdownStorageService } from './services/MarkdownStorageService';

const storage = new MarkdownStorageService();

// Get MD document
const mdDoc = await storage.getMarkdownByDocumentId('doc-uuid');

console.log(mdDoc.markdown); // Full Markdown content
console.log(mdDoc.metadata); // Tables, formulas, images
console.log(mdDoc.minioPath); // Archive location
```

### Example 3: Get Docling Chunks

```typescript
// Get Docling hybrid chunks for comparison
const doclingChunks = await storage.getDoclingChunks('doc-uuid');

console.log(`Docling created ${doclingChunks.length} chunks`);

doclingChunks.forEach(chunk => {
  console.log(`Section: ${chunk.section}`);
  console.log(`Type: ${chunk.type}`);
  console.log(`Text: ${chunk.text.substring(0, 100)}...`);
});
```

### Example 4: Chunk Markdown Content

```typescript
import { SemanticChunkingService } from './services/SemanticChunkingService';

const chunking = new SemanticChunkingService();

const chunks = await chunking.chunkDocument(
  markdownContent,
  'doc-uuid',
  'Document Title',
  'markdown' // 🔥 Use MD mode
);

console.log(`Created ${chunks.length} semantic chunks`);

chunks.forEach((chunk, i) => {
  const section = (chunk.metadata as any).section || 'No section';
  console.log(`Chunk ${i + 1}: ${section}`);
});
```

---

## Step 6: Compare Chunking Methods

### Docling Hybrid Chunking
- **Pros**: Fast, built-in, token-optimized
- **Cons**: Less customizable, fixed tokenizer
- **Best for**: Quick testing, BERT-compatible workflows

### Semantic Custom Chunking (MD-aware)
- **Pros**: Highly customizable, context windows, structure-aware
- **Cons**: Slightly slower
- **Best for**: Production, complex documents, custom requirements

### How to Compare:

```typescript
// Enable both methods
const result = await ingestion.ingestStructuredData({
  // ... other params
  use_markdown: true,
  chunking_method: 'both' // 🔥 Compare both
});

// Get Docling chunks
const doclingChunks = await storage.getDoclingChunks(documentId);

// Get Semantic chunks (from embeddings table)
const semanticChunks = await db.query(
  'SELECT * FROM smartdocs.embeddings WHERE document_id = $1',
  [documentId]
);

console.log(`Docling: ${doclingChunks.length} chunks`);
console.log(`Semantic: ${semanticChunks.rows.length} chunks`);
```

---

## 🎯 Common Use Cases

### 1. Technical Documentation (PDF)

```typescript
await ingestion.ingestStructuredData({
  container_id: containerId,
  source_app: 'manual',
  source_type: 'manual',
  entity_type: 'technical_doc',
  entity_id: 'tech-doc-001',
  title: 'API Reference Guide',
  content: '',
  use_markdown: true,
  file_path: '/docs/api-reference.pdf',
  ocr_engine: 'paddleocr-vl', // Better for code/formulas
  chunking_method: 'semantic'
});
```

### 2. Office Documents (DOCX)

```typescript
await ingestion.ingestStructuredData({
  container_id: containerId,
  source_app: 'manual',
  source_type: 'manual',
  entity_type: 'office_doc',
  entity_id: 'report-q4',
  title: 'Q4 Financial Report',
  content: '',
  use_markdown: true,
  file_path: '/reports/q4-2024.docx',
  ocr_engine: 'docling', // Better for Office docs
  chunking_method: 'both'
});
```

### 3. Scientific Papers (PDF with Formulas)

```typescript
await ingestion.ingestStructuredData({
  container_id: containerId,
  source_app: 'manual',
  source_type: 'manual',
  entity_type: 'research_paper',
  entity_id: 'paper-2024-001',
  title: 'Machine Learning Research',
  content: '',
  use_markdown: true,
  file_path: '/papers/ml-research.pdf',
  ocr_engine: 'paddleocr-vl', // LaTeX formula support
  chunking_method: 'semantic'
});
```

---

## 🔧 Troubleshooting

### Issue: Python Import Errors

```
ModuleNotFoundError: No module named 'docling'
```

**Fix**:
```bash
./scripts/install_ocr_dependencies.sh
```

---

### Issue: MinIO Connection Failed

```
Error: connect ECONNREFUSED localhost:9000
```

**Fix**:
```bash
# Start MinIO
docker-compose up -d minio

# OR configure existing MinIO in .env
MINIO_ENDPOINT=your-minio-server.com
```

---

### Issue: OCR Timeout

```
Error: Processing timeout after 60s
```

**Fix**: Increase timeout in `AdvancedOCRService.ts`:

```typescript
const timeout = 180000; // 3 minutes
```

---

### Issue: Chunks Too Large

```
Warning: Chunk exceeds max size (2048 chars)
```

**Fix**: Adjust chunking config:

```typescript
const chunking = new SemanticChunkingService({
  maxChunkSize: 1000, // Reduce from default
  minChunkSize: 200
});
```

---

## 📊 Monitoring & Metrics

### Check Storage Statistics

```typescript
const stats = await storage.getStatistics(containerId);

console.log(`Total documents: ${stats.total_documents}`);
console.log(`Total characters: ${stats.total_characters}`);
console.log(`Average size: ${stats.avg_characters}`);
```

### Check Conversion Performance

```typescript
const mdDoc = await storage.getMarkdownByDocumentId(documentId);

console.log(`Conversion engine: ${mdDoc.metadata.conversionEngine}`);
console.log(`Processing time: ${mdDoc.metadata.conversionTime}ms`);
console.log(`Page count: ${mdDoc.metadata.pageCount}`);
console.log(`Tables found: ${mdDoc.metadata.tables?.length || 0}`);
console.log(`Formulas found: ${mdDoc.metadata.formulas?.length || 0}`);
```

---

## 🎨 Next: Build the UI

The backend is ready! Next steps:

1. **SmartDocsTestLab UI**
   - Upload document with MD option
   - Select OCR engine
   - Choose chunking method
   - View results side-by-side

2. **Comparison Dashboard**
   - Docling chunks (left panel)
   - Semantic chunks (right panel)
   - Metrics comparison

3. **MD Preview**
   - Live Markdown rendering
   - Table visualization
   - Formula display (MathJax)

4. **Pattern Inspector**
   - View MD patterns learned
   - Pattern reuse statistics
   - Cost savings dashboard

---

## ✅ Checklist

Before going to production:

- [ ] Install Python dependencies
- [ ] Configure `.env` file
- [ ] Run database migration
- [ ] Test with sample documents
- [ ] Compare chunking methods
- [ ] Monitor conversion times
- [ ] Check storage usage
- [ ] Verify pattern learning
- [ ] Test retrieval performance
- [ ] Build UI components

---

## 📚 Additional Resources

- **Architecture Guide**: [MARKDOWN-PIPELINE-ARCHITECTURE.md](./MARKDOWN-PIPELINE-ARCHITECTURE.md)
- **Implementation Summary**: [MARKDOWN-IMPLEMENTATION-COMPLETE.md](./MARKDOWN-IMPLEMENTATION-COMPLETE.md)
- **Docling Docs**: https://github.com/DS4SD/docling
- **PaddleOCR Docs**: https://github.com/PaddlePaddle/PaddleOCR

---

## 🆘 Need Help?

Check the logs:

```bash
# Backend logs
tail -f logs/smartdocs.log

# Python OCR logs
tail -f logs/ocr.log
```

---

**Status**: ✅ Ready to use!
**Version**: 1.0.0
**Last Updated**: 2025-10-30

🎉 **Happy document processing!**
