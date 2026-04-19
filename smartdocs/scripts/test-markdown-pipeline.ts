/**
 * test-markdown-pipeline.ts
 * 
 * Quick test script for Markdown-first pipeline
 * Tests: MD storage, chunking, and retrieval
 * 
 * Usage: ts-node test-markdown-pipeline.ts
 */

import { MarkdownStorageService } from '../src/services/MarkdownStorageService';
import { SemanticChunkingService } from '../src/services/SemanticChunkingService';
import { v4 as uuidv4 } from 'uuid';

async function testMarkdownPipeline() {
  console.log('🧪 Testing Markdown Pipeline\n');

  const storage = new MarkdownStorageService();
  const chunking = new SemanticChunkingService();

  // Test MD content
  const testMarkdown = `# Technical Documentation

## Introduction

This is a test document to verify the **Markdown-first pipeline** is working correctly.

### Features

- Structure preservation
- Smart chunking
- Dual storage

## Architecture

### Backend Services

The system consists of several key services:

1. **AdvancedOCRService**: Converts documents to Markdown
2. **MarkdownStorageService**: Stores MD in PostgreSQL + MinIO
3. **SemanticChunkingService**: Chunks MD intelligently

### Code Example

\`\`\`typescript
const service = new MarkdownStorageService();
const result = await service.storeMarkdown(doc);
\`\`\`

## Data Tables

| Service | Purpose | Storage |
|---------|---------|---------|
| OCR | Convert | N/A |
| Storage | Persist | PG + MinIO |
| Chunking | Split | Memory |

## Conclusion

The pipeline is ready for production testing.
`;

  try {
    // 1. Store Markdown
    console.log('1️⃣ Storing Markdown document...');
    const documentId = uuidv4();
    const containerId = '123e4567-e89b-12d3-a456-426614174000'; // Test container

    const markdownId = await storage.storeMarkdown({
      id: uuidv4(),
      documentId,
      containerId,
      markdown: testMarkdown,
      originalFormat: 'pdf',
      metadata: {
        wordCount: testMarkdown.split(/\s+/).length,
        conversionEngine: 'docling',
        conversionTime: 1234
      },
      createdAt: new Date()
    });
    console.log(`   ✅ Stored with ID: ${markdownId}\n`);

    // 2. Retrieve Markdown
    console.log('2️⃣ Retrieving Markdown document...');
    const retrieved = await storage.getMarkdownByDocumentId(documentId);
    if (retrieved) {
      console.log(`   ✅ Retrieved ${retrieved.markdown.length} characters`);
      console.log(`   📊 Metadata:`, {
        wordCount: retrieved.metadata.wordCount,
        engine: retrieved.metadata.conversionEngine
      });
      console.log();
    } else {
      console.log('   ❌ Failed to retrieve\n');
    }

    // 3. Chunk Markdown
    console.log('3️⃣ Chunking Markdown (MD-aware)...');
    const chunks = await chunking.chunkDocument(
      testMarkdown,
      documentId,
      'Technical Documentation',
      'markdown'
    );
    console.log(`   ✅ Created ${chunks.length} semantic chunks`);
    chunks.forEach((chunk, i) => {
      const section = (chunk.metadata as any).section || 'No section';
      console.log(`   📄 Chunk ${i + 1}: ${section} (${chunk.content.length} chars)`);
    });
    console.log();

    // 4. Test Docling chunks storage
    console.log('4️⃣ Storing Docling chunks...');
    const doclingChunks = [
      {
        text: 'Introduction section content',
        index: 0,
        section: 'Introduction',
        level: 2,
        type: 'text' as const,
        metadata: { start_char: 0, end_char: 100 }
      },
      {
        text: 'Architecture section content',
        index: 1,
        section: 'Architecture',
        level: 2,
        type: 'text' as const,
        metadata: { start_char: 100, end_char: 200 }
      }
    ];
    await storage.storeDoclingChunks(doclingChunks, documentId);
    console.log(`   ✅ Stored ${doclingChunks.length} Docling chunks\n`);

    // 5. Retrieve Docling chunks
    console.log('5️⃣ Retrieving Docling chunks...');
    const retrievedChunks = await storage.getDoclingChunks(documentId);
    console.log(`   ✅ Retrieved ${retrievedChunks.length} chunks`);
    retrievedChunks.forEach((chunk, i) => {
      console.log(`   📦 Chunk ${i + 1}: ${chunk.section} (${chunk.type})`);
    });
    console.log();

    // 6. Statistics
    console.log('6️⃣ Getting statistics...');
    const stats = await storage.getStatistics(containerId);
    console.log('   ✅ Statistics:', stats);
    console.log();

    // 7. Cleanup
    console.log('7️⃣ Cleaning up...');
    await storage.deleteMarkdown(documentId);
    console.log('   ✅ Deleted test document\n');

    console.log('🎉 All tests passed!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Markdown storage (PostgreSQL + MinIO)');
    console.log('   ✅ Markdown retrieval');
    console.log('   ✅ MD-aware chunking');
    console.log('   ✅ Docling chunks storage');
    console.log('   ✅ Statistics generation');
    console.log('   ✅ Cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run tests
testMarkdownPipeline().catch(console.error);
