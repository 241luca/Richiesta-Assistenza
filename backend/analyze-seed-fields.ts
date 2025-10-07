import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function analyzeSeedFieldsVsSchema() {
  console.log('\n' + '='.repeat(70));
  console.log('   VERIFICA DETTAGLIATA CAMPI SEED.TS vs SCHEMA.PRISMA');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Leggi i file
    const seedContent = fs.readFileSync('./prisma/seed.ts', 'utf-8');
    const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
    
    // Lista dei modelli principali da verificare
    const modelsToCheck = [
      'User',
      'Category', 
      'Subcategory',
      'AssistanceRequest',
      'Quote',
      'QuoteItem',
      'Notification'
    ];
    
    let hasErrors = false;
    const errors: string[] = [];
    
    for (const modelName of modelsToCheck) {
      console.log('\n' + '='.repeat(70));
      console.log(`📊 ANALISI MODELLO: ${modelName}`);
      console.log('='.repeat(70));
      
      // 1. Trova tutti gli usi del modello nel seed (con PascalCase)
      const modelUsageRegex = new RegExp(`prisma\\.${modelName}\\.(create|createMany|update)\\s*\\([^\\)]*\\{[\\s\\S]*?data:\\s*(?:\\[)?([\\s\\S]*?)(?:\\])?\\s*\\}`, 'g');
      const matches = [...seedContent.matchAll(modelUsageRegex)];
      
      if (matches.length === 0) {
        console.log(`   ℹ️  Modello ${modelName} non utilizzato nel seed\n`);
        continue;
      }
      
      // 2. Estrai lo schema del modello
      const modelSchemaRegex = new RegExp(`model ${modelName} \\{([^}]+)\\}`, 's');
      const schemaMatch = schemaContent.match(modelSchemaRegex);
      
      if (!schemaMatch) {
        console.log(`   ❌ Modello ${modelName} non trovato nello schema!\n`);
        errors.push(`Modello ${modelName} non trovato nello schema`);
        hasErrors = true;
        continue;
      }
      
      // 3. Estrai i campi dallo schema
      const schemaFields = new Map<string, { type: string, required: boolean, hasDefault: boolean }>();
      const schemaLines = schemaMatch[1].split('\n');
      
      for (const line of schemaLines) {
        // Salta relazioni e indici
        if (line.includes('@@') || line.match(/^\s*[A-Z].*\[\]/)) continue;
        
        const fieldMatch = line.match(/^\s*(\w+)\s+(\w+)(\??)?.*?(@default\([^)]+\))?/);
        if (fieldMatch && !fieldMatch[1].match(/^[A-Z]/)) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2];
          const isOptional = !!fieldMatch[3];
          const hasDefault = !!fieldMatch[4];
          
          schemaFields.set(fieldName, {
            type: fieldType,
            required: !isOptional && !hasDefault && fieldName !== 'id' && fieldName !== 'createdAt' && fieldName !== 'updatedAt',
            hasDefault: hasDefault
          });
        }
      }
      
      console.log(`\n📋 CAMPI NELLO SCHEMA (${schemaFields.size} totali):`);
      console.log('   ' + '-'.repeat(50));
      
      const requiredFields: string[] = [];
      const optionalFields: string[] = [];
      
      schemaFields.forEach((info, field) => {
        if (info.required) {
          requiredFields.push(field);
          console.log(`   ✓ ${field.padEnd(20)} ${info.type.padEnd(12)} REQUIRED`);
        } else {
          optionalFields.push(field);
          console.log(`   - ${field.padEnd(20)} ${info.type.padEnd(12)} (optional/default)`);
        }
      });
      
      // 4. Verifica ogni uso del modello nel seed
      console.log(`\n🔍 VERIFICA USI NEL SEED (${matches.length} occorrenze):`);
      console.log('   ' + '-'.repeat(50));
      
      matches.forEach((match, index) => {
        const dataContent = match[2];
        
        // Estrai i campi usati
        const usedFields = new Set<string>();
        const fieldRegex = /(\w+):/g;
        let fieldMatch;
        
        while ((fieldMatch = fieldRegex.exec(dataContent)) !== null) {
          usedFields.add(fieldMatch[1]);
        }
        
        console.log(`\n   Occorrenza #${index + 1}:`);
        
        // Verifica campi required mancanti
        const missingRequired = requiredFields.filter(f => !usedFields.has(f));
        if (missingRequired.length > 0) {
          console.log(`   ❌ Campi REQUIRED mancanti:`);
          missingRequired.forEach(field => {
            console.log(`      - ${field}`);
            errors.push(`${modelName}: campo required '${field}' mancante`);
          });
          hasErrors = true;
        }
        
        // Verifica campi usati che non esistono nello schema
        const invalidFields: string[] = [];
        usedFields.forEach(field => {
          if (!schemaFields.has(field)) {
            invalidFields.push(field);
          }
        });
        
        if (invalidFields.length > 0) {
          console.log(`   ❌ Campi INESISTENTI nello schema:`);
          invalidFields.forEach(field => {
            console.log(`      - ${field}`);
            errors.push(`${modelName}: campo '${field}' non esiste nello schema`);
          });
          hasErrors = true;
        }
        
        if (missingRequired.length === 0 && invalidFields.length === 0) {
          console.log(`   ✅ Tutti i campi sono corretti`);
        }
        
        // Mostra i campi usati
        console.log(`   📝 Campi utilizzati (${usedFields.size}):`);
        const usedFieldsList = Array.from(usedFields);
        for (let i = 0; i < usedFieldsList.length; i += 3) {
          const fieldsRow = usedFieldsList.slice(i, i + 3).map(f => f.padEnd(20)).join('');
          console.log(`      ${fieldsRow}`);
        }
      });
    }
    
    // 5. Verifica speciale per relazioni
    console.log('\n' + '='.repeat(70));
    console.log('🔗 VERIFICA RELAZIONI (Foreign Keys)');
    console.log('='.repeat(70));
    
    const relationsToCheck = [
      { field: 'clientId', referencedModel: 'User' },
      { field: 'professionalId', referencedModel: 'User' },
      { field: 'categoryId', referencedModel: 'Category' },
      { field: 'subcategoryId', referencedModel: 'Subcategory' },
      { field: 'requestId', referencedModel: 'AssistanceRequest' },
      { field: 'quoteId', referencedModel: 'Quote' },
      { field: 'recipientId', referencedModel: 'User' },
      { field: 'senderId', referencedModel: 'User' }
    ];
    
    console.log('\n   Relazioni utilizzate nel seed:');
    console.log('   ' + '-'.repeat(50));
    
    relationsToCheck.forEach(rel => {
      const isUsed = seedContent.includes(`${rel.field}:`);
      if (isUsed) {
        // Verifica se il modello riferito esiste
        const modelExists = schemaContent.includes(`model ${rel.referencedModel}`);
        const status = modelExists ? '✅' : '❌';
        console.log(`   ${rel.field.padEnd(20)} → ${rel.referencedModel.padEnd(20)} ${status}`);
        
        if (!modelExists) {
          errors.push(`Relazione ${rel.field} riferisce a ${rel.referencedModel} che non esiste`);
          hasErrors = true;
        }
      }
    });
    
    // 6. Report finale
    console.log('\n' + '='.repeat(70));
    console.log('                    REPORT FINALE');
    console.log('='.repeat(70) + '\n');
    
    if (!hasErrors) {
      console.log('✅ SEED.TS È COMPLETAMENTE COMPATIBILE CON SCHEMA.PRISMA!');
      console.log('   - Tutti i modelli esistono');
      console.log('   - Tutti i campi required sono presenti');
      console.log('   - Non ci sono campi inesistenti');
      console.log('   - Tutte le relazioni sono corrette');
      console.log('\n   Il seed dovrebbe funzionare perfettamente!');
    } else {
      console.log('❌ CI SONO ERRORI DI COMPATIBILITÀ:\n');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('\n   Il seed NON funzionerà fino a quando non correggi questi errori!');
    }
    
    // 7. Test di compilazione TypeScript
    console.log('\n' + '='.repeat(70));
    console.log('🔧 TEST COMPILAZIONE TYPESCRIPT');
    console.log('='.repeat(70) + '\n');
    
    try {
      console.log('   Compilando seed.ts...');
      const { stdout, stderr } = await execAsync('npx tsc prisma/seed.ts --noEmit');
      
      if (stderr) {
        console.log('   ❌ Errori di compilazione TypeScript:');
        console.log(stderr);
      } else {
        console.log('   ✅ Nessun errore di compilazione TypeScript!');
      }
    } catch (error: any) {
      console.log('   ❌ Errori di compilazione TypeScript:');
      console.log(error.stdout || error.message);
    }
    
    console.log('\n💡 PROSSIMI PASSI:');
    console.log('   1. Correggi eventuali errori segnalati sopra');
    console.log('   2. Esegui: npx prisma generate');
    console.log('   3. Esegui: npx prisma db seed');
    console.log('   4. Verifica che il seed sia completato con successo\n');
    
  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error);
  }
}

// Esegui l'analisi
analyzeSeedFieldsVsSchema();
