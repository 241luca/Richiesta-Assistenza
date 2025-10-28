// Script per creare container di test SmartDocs
// File: backend/create-test-containers.js

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createTestContainers() {
  console.log('🧪 Creazione container di test SmartDocs...\n');

  try {
    // Verifica se esistono già container
    const existingContainers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM smartdocs.containers
    `;
    
    const count = Number(existingContainers[0]?.count || 0);
    console.log(`Container esistenti: ${count}`);

    if (count > 0) {
      console.log('✅ Container già presenti, non creo duplicati');
      return;
    }

    // Crea container di test
    const testContainers = [
      {
        id: uuidv4(),
        name: 'Test Container - Documentazione',
        description: 'Container di test per documentazione tecnica',
        type: 'CONTAINER',
        status: 'ACTIVE',
        ai_prompt: 'Sei un assistente specializzato in documentazione tecnica. Rispondi in modo preciso e dettagliato.',
        chunk_size: 1000,
        chunk_overlap: 200,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Test Container - FAQ',
        description: 'Container di test per domande frequenti',
        type: 'CONTAINER',
        status: 'ACTIVE',
        ai_prompt: 'Sei un assistente per FAQ. Fornisci risposte chiare e concise.',
        chunk_size: 800,
        chunk_overlap: 150,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Test Container - Procedure',
        description: 'Container di test per procedure operative',
        type: 'CONTAINER',
        status: 'ACTIVE',
        ai_prompt: 'Sei un assistente per procedure operative. Fornisci istruzioni step-by-step.',
        chunk_size: 1200,
        chunk_overlap: 250,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Inserisci i container
    for (const container of testContainers) {
      await prisma.$executeRaw`
        INSERT INTO smartdocs.containers (
          id, name, description, type, status, ai_prompt, 
          chunk_size, chunk_overlap, created_at, updated_at
        ) VALUES (
          ${container.id}, ${container.name}, ${container.description}, 
          ${container.type}, ${container.status}, ${container.ai_prompt},
          ${container.chunk_size}, ${container.chunk_overlap}, 
          ${container.created_at}, ${container.updated_at}
        )
      `;
      console.log(`✅ Creato container: ${container.name}`);
    }

    // Crea alcuni documenti di test per ogni container
    console.log('\n📄 Creazione documenti di test...');
    
    for (const container of testContainers) {
      const testDocs = [
        {
          id: uuidv4(),
          container_id: container.id,
          type: 'TEXT',
          title: `Documento Test 1 - ${container.name}`,
          content: `Questo è un documento di test per il container ${container.name}. Contiene informazioni di esempio per testare le funzionalità di analisi avanzate come i chunk semantici e il knowledge graph.`,
          metadata: JSON.stringify({ source: 'test', category: 'documentation' }),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          container_id: container.id,
          type: 'TEXT',
          title: `Documento Test 2 - ${container.name}`,
          content: `Secondo documento di test che fornisce contenuto aggiuntivo per le analisi. Include concetti correlati e informazioni strutturate per migliorare la qualità del knowledge graph.`,
          metadata: JSON.stringify({ source: 'test', category: 'examples' }),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      for (const doc of testDocs) {
        await prisma.$executeRaw`
          INSERT INTO smartdocs.documents (
            id, container_id, type, title, content, metadata, created_at, updated_at
          ) VALUES (
            ${doc.id}, ${doc.container_id}, ${doc.type}, ${doc.title}, 
            ${doc.content}, ${doc.metadata}, ${doc.created_at}, ${doc.updated_at}
          )
        `;
      }
      console.log(`✅ Creati 2 documenti per: ${container.name}`);
    }

    console.log('\n🎉 Container e documenti di test creati con successo!');
    console.log(`📊 Totale container: ${testContainers.length}`);
    console.log(`📄 Totale documenti: ${testContainers.length * 2}`);
    
  } catch (error) {
    console.error('❌ Errore durante la creazione dei container di test:', error);
    throw error;
  }
}

// Esegui lo script
createTestContainers()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });