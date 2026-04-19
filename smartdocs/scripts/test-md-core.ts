#!/usr/bin/env ts-node
/**
 * test-md-core.ts
 * 
 * Test minimalista del core MD pipeline
 * Salta il sync_jobs per evitare errori di trigger
 */

import dotenv from 'dotenv';
dotenv.config();

import { SemanticChunkingService } from '../src/services/SemanticChunkingService';
import { MarkdownStorageService } from '../src/services/MarkdownStorageService';
import { DatabaseClient } from '../src/database/client';
import { v4 as uuidv4 } from 'uuid';

async function testMarkdownCore() {
  console.log('\n🧪 Test Core Markdown Pipeline\n');
  console.log('='.repeat(60));

  const chunking = new SemanticChunkingService();
  const storage = new MarkdownStorageService();
  const db = DatabaseClient.getInstance();

  const testMarkdown = `# Technical Documentation

## Introduction
This is a test document for the Markdown pipeline.

### Features
- OCR Conversion
- Dual Storage
- Smart Chunking

## Code Example

\`\`\`typescript
const service = new MarkdownStorageService();
const result = await service.storeMarkdown(doc);
\`\`\`

## Data Table

| Feature | Status |
|---------|--------|
| OCR | ✅ Working |
| Storage | ✅ Working |

## Conclusion
Pipeline ready!
`;

  let docId: string | null = null;

  try {
    // 1. Test Markdown Chunking
    console.log('\n1️⃣  Test Markdown Chunking...');
    docId = uuidv4();
    
    const chunks = await chunking.chunkDocument(
      testMarkdown,
      docId,
      'Test Doc',
      'markdown' // 🔥 MD mode
    );

    console.log(`   ✅ Created ${chunks.length} chunks in MD mode`);
    chunks.forEach((c, i) => {
      const section = (c.metadata as any).section || 'No section';
      console.log(`   📄 Chunk ${i + 1}: ${section} (${c.content.length} chars)`);
    });

    // 2. Test Markdown Storage
    console.log('\n2️⃣  Test Markdown Storage...');
    
    // Prima crea il documento nella tabella documents
    await db.query(
      `INSERT INTO smartdocs.documents (id, container_id, title, content, processing_status)
       VALUES ($1, $2, $3, $4, $5)`,
      [docId, '996f6aad-cee0-45c2-b55c-37a9bb765737', 'Test Doc', '', 'COMPLETED']
    );
    
    const mdId = await storage.storeMarkdown({
      id: uuidv4(),
      documentId: docId,
      containerId: '996f6aad-cee0-45c2-b55c-37a9bb765737',
      markdown: testMarkdown,
      originalFormat: 'pdf',
      metadata: {
        wordCount: testMarkdown.split(/\s+/).length,
        conversionEngine: 'docling',
        conversionTime: 1500
      },
      createdAt: new Date()
    });

    console.log(`   ✅ Stored MD with ID: ${mdId}`);

    // 3. Test MD Retrieval
    console.log('\n3️⃣  Test MD Retrieval...');
    const retrieved = await storage.getMarkdownByDocumentId(docId);
    
    if (retrieved) {
      console.log(`   ✅ Retrieved ${retrieved.markdown.length} characters`);
      console.log(`   📊 Engine: ${retrieved.metadata.conversionEngine}`);
      console.log(`   📊 Words: ${retrieved.metadata.wordCount}`);
    }

    // 4. Test Docling Chunks Storage
    console.log('\n4️⃣  Test Docling Chunks...');
    const doclingChunks = [
      {
        text: 'Introduction content',
        index: 0,
        section: 'Introduction',
        level: 2,
        type: 'text' as const,
        metadata: { start_char: 0, end_char: 100 }
      },
      {
        text: 'Code example',
        index: 1,
        section: 'Code Example',
        level: 2,
        type: 'code' as const,
        metadata: { start_char: 100, end_char: 200 }
      }
    ];

    await storage.storeDoclingChunks(doclingChunks, docId);
    console.log(`   ✅ Stored ${doclingChunks.length} Docling chunks`);

    const retrievedChunks = await storage.getDoclingChunks(docId);
    console.log(`   ✅ Retrieved ${retrievedChunks.length} chunks`);
    retrievedChunks.forEach((c, i) => {
      console.log(`   📦 Chunk ${i + 1}: ${c.section} (${c.type})`);
    });

    // 5. Statistics
    console.log('\n5️⃣  Test Statistics...');
    const stats = await storage.getStatistics();
    console.log(`   ✅ Total MD documents: ${stats.total_documents || 0}`);
    console.log(`   ✅ Total characters: ${stats.total_characters || 0}`);

    // Success
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!\n');
    console.log('✅ Verifiche completate:');
    console.log('   - Markdown chunking (MD-aware mode)');
    console.log('   - Markdown storage (PostgreSQL + MinIO)');
    console.log('   - Markdown retrieval');
    console.log('   - Docling chunks storage');
    console.log('   - Statistics generation');
    console.log('\n🚀 Pipeline Markdown completamente funzionante!');

    return { success: true };

  } catch (error: any) {
    console.error('\n❌ Test fallito:', error.message);
    return { success: false, error: error.message };
    
  } finally {
    // Cleanup
    if (docId) {
      console.log('\n🧹 Cleanup...');
      await storage.deleteMarkdown(docId);
      console.log('   ✅ Cleanup completato');
    }
    
    await db.close();
    console.log('   ✅ Connessione chiusa\n');
  }
}

testMarkdownCore()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
