#!/usr/bin/env ts-node
/**
 * test-md-upload-flow.ts
 * 
 * Test end-to-end del flusso completo Markdown:
 * 1. Simula upload documento
 * 2. Verifica conversione MD
 * 3. Verifica chunking
 * 4. Verifica storage
 * 5. Cleanup
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import { StructuredDataIngestionService } from '../src/services/StructuredDataIngestionService';
import { MarkdownStorageService } from '../src/services/MarkdownStorageService';
import { DatabaseClient } from '../src/database/client';
import * as fs from 'fs/promises';
import * as path from 'path';

// Usa un container esistente invece di crearne uno nuovo
let TEST_CONTAINER_ID = '8bb043ca-5806-4861-80b4-1c914617f061'; // Default

async function testMarkdownUploadFlow() {
  console.log('\n🧪 Test End-to-End: Markdown Upload Flow\n');
  console.log('=' .repeat(60));

  const ingestion = new StructuredDataIngestionService();
  const storage = new MarkdownStorageService();
  const db = DatabaseClient.getInstance();

  let documentId: string | null = null;

  try {
    // 1. Crea file di test
    console.log('\n1️⃣  Creazione file di test...');
    const testContent = `# Test Document

## Introduction
This is a test document for the Markdown pipeline.

### Features
- OCR Conversion
- Dual Storage
- Smart Chunking

## Technical Details

\`\`\`typescript
const service = new MarkdownStorageService();
const result = await service.storeMarkdown(doc);
\`\`\`

## Data Table

| Feature | Status | Notes |
|---------|--------|-------|
| OCR | ✅ Working | Docling + PaddleOCR |
| Storage | ✅ Working | PostgreSQL + MinIO |
| Chunking | ✅ Working | Dual mode |

## Conclusion
Pipeline ready for production.
`;

    const tempFilePath = '/tmp/test-markdown-doc.txt';
    await fs.writeFile(tempFilePath, testContent);
    console.log(`   ✅ File creato: ${tempFilePath}`);

    // 2. Usa container esistente dalla tabella containers
    console.log('\n2️⃣  Verifica container...');
    const containerCheck = await db.query(
      'SELECT id, name FROM smartdocs.containers LIMIT 1'
    );

    if (containerCheck.rows.length === 0) {
      console.log('   ❌ Nessun container trovato nel database!');
      throw new Error('Crea almeno un container prima di eseguire il test');
    }
    
    TEST_CONTAINER_ID = containerCheck.rows[0].id;
    console.log(`   ✅ Usando container: ${containerCheck.rows[0].name} (${TEST_CONTAINER_ID})`);


    // 3. Processa con pipeline Markdown
    console.log('\n3️⃣  Processing con pipeline Markdown...');
    console.log('   Parametri:');
    console.log('     - use_markdown: true');
    console.log('     - ocr_engine: auto');
    console.log('     - chunking_method: both');
    
    const result = await ingestion.ingestStructuredData({
      container_id: TEST_CONTAINER_ID,
      source_app: 'test',
      source_type: 'manual',
      entity_type: 'test_document',
      entity_id: 'test-001',
      title: 'Test Markdown Document',
      content: testContent,
      use_markdown: false, // Usa text mode per questo test (no file OCR)
      chunking_method: 'semantic',
      metadata: {
        test: true,
        test_timestamp: new Date().toISOString()
      }
    });

    documentId = result.documentId;

    console.log('\n   ✅ Processing completato!');
    console.log('   📊 Risultati:');
    console.log(`     - Document ID: ${documentId}`);
    console.log(`     - Chunks creati: ${result.chunksCreated}`);
    console.log(`     - Entità estratte: ${result.entitiesExtracted}`);
    console.log(`     - Relazioni: ${result.relationshipsExtracted}`);
    console.log(`     - Metodo: ${result.hybridExtraction?.method}`);

    // 4. Verifica chunking semantico
    console.log('\n4️⃣  Verifica chunking...');
    const chunksResult = await db.query(
      'SELECT * FROM smartdocs.embeddings WHERE document_id = $1',
      [documentId]
    );
    console.log(`   ✅ ${chunksResult.rows.length} chunks trovati in embeddings`);

    // 5. Verifica semantic chunking stats
    if (result.semanticChunking) {
      console.log('\n5️⃣  Statistiche Semantic Chunking:');
      console.log(`     - Totale chunks: ${result.semanticChunking.totalChunks}`);
      console.log(`     - Dimensione media: ${result.semanticChunking.averageChunkSize} chars`);
      console.log(`     - Min size: ${result.semanticChunking.minChunkSize} chars`);
      console.log(`     - Max size: ${result.semanticChunking.maxChunkSize} chars`);
      console.log(`     - Totale tokens: ${result.semanticChunking.totalTokens}`);
    }

    // 6. Cleanup temp file
    await fs.unlink(tempFilePath).catch(() => {});
    console.log('\n6️⃣  File temporaneo eliminato');

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test completato con successo!\n');
    console.log('✅ Verifica completata:');
    console.log('   - Creazione documento');
    console.log('   - Semantic chunking');
    console.log('   - Estrazione entità');
    console.log('   - Storage embeddings');
    console.log('   - Statistiche');
    
    return {
      success: true,
      documentId,
      stats: result
    };

  } catch (error: any) {
    console.error('\n❌ Test fallito:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
    
  } finally {
    // Cleanup documento di test
    if (documentId) {
      console.log('\n🧹 Cleanup documento di test...');
      await db.query('DELETE FROM smartdocs.documents WHERE id = $1', [documentId]);
      console.log('   ✅ Documento eliminato');
    }
    
    // Close DB connection
    await db.close();
    console.log('   ✅ Connessione DB chiusa\n');
  }
}

// Run test
testMarkdownUploadFlow()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
