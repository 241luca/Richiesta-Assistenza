import fs from 'fs';

function analyzeSeedVsSchema() {
  console.log('\n' + '='.repeat(70));
  console.log('   VERIFICA COERENZA SEED.TS vs SCHEMA.PRISMA');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Leggi i file
    const seedContent = fs.readFileSync('./prisma/seed.ts', 'utf-8');
    const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
    
    // 1. Verifica i modelli utilizzati nel seed
    console.log('📋 MODELLI UTILIZZATI NEL SEED.TS:');
    console.log('   ' + '-'.repeat(50));
    
    // Estrai tutti i prisma.modelName dal seed
    const prismaModels = seedContent.match(/prisma\.(\w+)\.(create|update|delete|findMany|findFirst|findUnique|createMany)/g);
    const uniqueModels = new Set();
    
    if (prismaModels) {
      prismaModels.forEach(match => {
        const modelName = match.split('.')[1];
        uniqueModels.add(modelName);
      });
    }
    
    const seedModels = Array.from(uniqueModels).sort();
    seedModels.forEach((model, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${model}`);
    });
    console.log(`   Totale: ${seedModels.length} modelli\n`);
    
    // 2. Verifica i modelli disponibili nello schema
    console.log('📝 MODELLI DISPONIBILI IN SCHEMA.PRISMA:');
    console.log('   ' + '-'.repeat(50));
    
    const schemaModels = [];
    const modelMatches = schemaContent.match(/model\s+(\w+)\s*{/g);
    if (modelMatches) {
      modelMatches.forEach(match => {
        const modelName = match.match(/model\s+(\w+)/)[1];
        schemaModels.push(modelName);
      });
    }
    
    schemaModels.sort().forEach((model, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${model}`);
    });
    console.log(`   Totale: ${schemaModels.length} modelli\n`);
    
    // 3. Confronta
    console.log('🔍 CONFRONTO MODELLI:');
    console.log('   ' + '-'.repeat(50));
    
    const notInSchema = seedModels.filter(m => !schemaModels.includes(m));
    const notUsedInSeed = schemaModels.filter(m => !seedModels.includes(m));
    
    if (notInSchema.length > 0) {
      console.log('   ⚠️  Modelli usati nel SEED ma NON esistono nello SCHEMA:');
      notInSchema.forEach(m => console.log(`      - ${m} ❌`));
      console.log();
    }
    
    if (notUsedInSeed.length > 0) {
      console.log('   ℹ️  Modelli nello SCHEMA ma NON usati nel SEED:');
      notUsedInSeed.forEach(m => console.log(`      - ${m} (non necessariamente un problema)`));
      console.log();
    }
    
    if (notInSchema.length === 0) {
      console.log('   ✅ Tutti i modelli usati nel seed esistono nello schema!');
    }
    
    // 4. Verifica campi specifici utilizzati nel seed
    console.log('\n' + '='.repeat(70));
    console.log('📊 VERIFICA CAMPI UTILIZZATI NEL SEED');
    console.log('='.repeat(70) + '\n');
    
    // Controlla campi per User
    console.log('👤 MODELLO USER:');
    console.log('   ' + '-'.repeat(50));
    
    const userCreateMatch = seedContent.match(/prisma\.user\.create\([^)]*\{[\s\S]*?data:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
    if (userCreateMatch) {
      const userFields = userCreateMatch[1];
      const fieldNames = userFields.match(/(\w+):/g);
      if (fieldNames) {
        const uniqueFields = new Set(fieldNames.map(f => f.replace(':', '')));
        console.log('   Campi usati nel seed:');
        Array.from(uniqueFields).forEach(field => {
          // Verifica se il campo esiste nello schema
          const fieldRegex = new RegExp(`\\s+${field}\\s+\\w+`, 'm');
          const existsInSchema = schemaContent.match(fieldRegex);
          const status = existsInSchema ? '✅' : '❌';
          console.log(`     - ${field} ${status}`);
        });
      }
    }
    
    // 5. Verifica specifiche problematiche
    console.log('\n' + '='.repeat(70));
    console.log('🚨 VERIFICHE SPECIFICHE');
    console.log('='.repeat(70) + '\n');
    
    // Verifica organizationId
    const hasOrgInSeed = seedContent.includes('organizationId');
    const hasOrgModelInSeed = seedContent.includes('prisma.organization');
    
    console.log(`   Seed usa organizationId: ${hasOrgInSeed ? '⚠️ SÌ' : '✅ NO'}`);
    console.log(`   Seed crea Organization: ${hasOrgModelInSeed ? '⚠️ SÌ' : '✅ NO'}`);
    
    if (hasOrgInSeed || hasOrgModelInSeed) {
      console.log('\n   ⚠️ ATTENZIONE: Il seed fa riferimento a Organization che non esiste!');
      console.log('   Questo causerà errori durante l\'esecuzione del seed.');
    }
    
    // Verifica relazioni
    console.log('\n📋 RELAZIONI NEL SEED:');
    console.log('   ' + '-'.repeat(50));
    
    const relations = [
      { field: 'clientId', model: 'User', used: seedContent.includes('clientId:') },
      { field: 'professionalId', model: 'User', used: seedContent.includes('professionalId:') },
      { field: 'categoryId', model: 'Category', used: seedContent.includes('categoryId:') },
      { field: 'subcategoryId', model: 'Subcategory', used: seedContent.includes('subcategoryId:') },
      { field: 'requestId', model: 'AssistanceRequest', used: seedContent.includes('requestId:') },
      { field: 'quoteId', model: 'Quote', used: seedContent.includes('quoteId:') }
    ];
    
    relations.forEach(rel => {
      if (rel.used) {
        const status = schemaModels.includes(rel.model) ? '✅' : '❌';
        console.log(`   ${rel.field} → ${rel.model} ${status}`);
      }
    });
    
    // 6. Report finale
    console.log('\n' + '='.repeat(70));
    console.log('                    REPORT FINALE');
    console.log('='.repeat(70) + '\n');
    
    if (notInSchema.length === 0 && !hasOrgInSeed && !hasOrgModelInSeed) {
      console.log('✅ SEED.TS È COMPATIBILE CON SCHEMA.PRISMA!');
      console.log('   Il seed dovrebbe funzionare correttamente.');
    } else {
      console.log('⚠️ CI SONO PROBLEMI DI COMPATIBILITÀ:');
      if (notInSchema.length > 0) {
        console.log(`   - ${notInSchema.length} modelli non esistenti utilizzati`);
      }
      if (hasOrgInSeed || hasOrgModelInSeed) {
        console.log('   - Riferimenti a Organization che non esiste');
      }
      console.log('\n   Il seed NON funzionerà senza correzioni!');
    }
    
    console.log('\n💡 Suggerimenti:');
    console.log('   1. Assicurati che tutti i modelli usati nel seed esistano');
    console.log('   2. Rimuovi riferimenti a organizationId se non esiste');
    console.log('   3. Verifica che i nomi dei campi siano corretti');
    console.log('   4. Testa il seed con: npx prisma db seed\n');
    
  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error);
  }
}

// Esegui l'analisi
analyzeSeedVsSchema();
