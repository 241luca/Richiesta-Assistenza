import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function compareTableFields() {
  console.log('\n' + '='.repeat(70));
  console.log('   VERIFICA DETTAGLIATA CAMPI TABELLE vs SCHEMA.PRISMA');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Lista delle tabelle principali da verificare
    const tablesToCheck = [
      'User',
      'AssistanceRequest', 
      'Category',
      'Notification',
      'Quote',
      'Payment'
    ];
    
    for (const tableName of tablesToCheck) {
      console.log('\n' + '='.repeat(70));
      console.log(`📊 TABELLA: ${tableName}`);
      console.log('='.repeat(70));
      
      // 1. Ottieni i campi dal database
      const dbColumns: any[] = await prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      console.log('\n📋 CAMPI NEL DATABASE:');
      console.log('   ' + '-'.repeat(50));
      
      const dbFieldNames: string[] = [];
      dbColumns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '?' : ' ';
        const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
        console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
        dbFieldNames.push(col.column_name);
      });
      
      console.log(`   Totale: ${dbColumns.length} campi\n`);
      
      // 2. Leggi i campi dallo schema.prisma
      const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
      
      // Trova il modello
      const modelRegex = new RegExp(`model ${tableName} \\{([^}]+)\\}`, 's');
      const modelMatch = schemaContent.match(modelRegex);
      
      if (modelMatch) {
        const modelContent = modelMatch[1];
        const lines = modelContent.split('\n').filter(line => line.trim());
        
        console.log('📝 CAMPI IN SCHEMA.PRISMA:');
        console.log('   ' + '-'.repeat(50));
        
        const schemaFieldNames: string[] = [];
        lines.forEach(line => {
          // Salta le relazioni (iniziano con maiuscola o sono array)
          if (!line.includes('@@') && !line.match(/^\s*[A-Z]/) && !line.includes('[]')) {
            const fieldMatch = line.match(/^\s*(\w+)\s+(\w+)/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              const fieldType = fieldMatch[2];
              const isOptional = line.includes('?');
              const defaultMatch = line.match(/@default\(([^)]+)\)/);
              const defaultVal = defaultMatch ? ` (default: ${defaultMatch[1]})` : '';
              
              console.log(`   ${fieldName.padEnd(25)} ${fieldType.padEnd(20)} ${isOptional ? '?' : ' '}${defaultVal}`);
              schemaFieldNames.push(fieldName);
            }
          }
        });
        
        console.log(`   Totale: ${schemaFieldNames.length} campi\n`);
        
        // 3. Confronta i campi
        console.log('🔍 CONFRONTO:');
        console.log('   ' + '-'.repeat(50));
        
        // Campi nel DB ma non nello schema
        const onlyInDb = dbFieldNames.filter(field => !schemaFieldNames.includes(field));
        if (onlyInDb.length > 0) {
          console.log('   ⚠️  Campi nel DATABASE ma NON in schema.prisma:');
          onlyInDb.forEach(field => console.log(`      - ${field}`));
        }
        
        // Campi nello schema ma non nel DB
        const onlyInSchema = schemaFieldNames.filter(field => !dbFieldNames.includes(field));
        if (onlyInSchema.length > 0) {
          console.log('   ⚠️  Campi in schema.prisma ma NON nel DATABASE:');
          onlyInSchema.forEach(field => console.log(`      - ${field}`));
        }
        
        if (onlyInDb.length === 0 && onlyInSchema.length === 0) {
          console.log('   ✅ Tutti i campi corrispondono perfettamente!');
        }
        
      } else {
        console.log('   ❌ Modello non trovato in schema.prisma');
      }
    }
    
    // 4. Verifica specifica per organizationId nella tabella User
    console.log('\n' + '='.repeat(70));
    console.log('🔍 VERIFICA SPECIFICA: organizationId');
    console.log('='.repeat(70));
    
    const userOrgIdCheck: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'User'
      AND column_name = 'organizationId';
    `;
    
    const hasOrgIdInDb = Number(userOrgIdCheck[0].count) > 0;
    
    // Controlla nello schema
    const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
    const hasOrgIdInSchema = schemaContent.includes('organizationId');
    
    console.log(`\n   Database ha organizationId: ${hasOrgIdInDb ? '✅ SÌ' : '❌ NO'}`);
    console.log(`   Schema ha organizationId: ${hasOrgIdInSchema ? '✅ SÌ' : '❌ NO'}`);
    
    if (!hasOrgIdInDb && !hasOrgIdInSchema) {
      console.log('\n   ✅ PERFETTO: Nessuna traccia di organizationId!');
    }
    
    // 5. Controlla relazioni foreign key
    console.log('\n' + '='.repeat(70));
    console.log('🔗 VERIFICA FOREIGN KEYS');
    console.log('='.repeat(70));
    
    const foreignKeys: any[] = await prisma.$queryRaw`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('User', 'AssistanceRequest', 'Quote', 'Notification')
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    if (foreignKeys.length > 0) {
      console.log('\n📋 Foreign Keys trovate:');
      let currentTable = '';
      foreignKeys.forEach(fk => {
        if (fk.table_name !== currentTable) {
          currentTable = fk.table_name;
          console.log(`\n   ${currentTable}:`);
        }
        console.log(`     - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('\n   ℹ️  Nessuna foreign key trovata (potrebbero essere gestite solo a livello Prisma)');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('                    REPORT FINALE');
    console.log('='.repeat(70));
    
    console.log('\n✅ VERIFICA COMPLETATA');
    console.log('\n💡 Suggerimenti:');
    console.log('   1. Se ci sono differenze minori, Prisma le gestisce automaticamente');
    console.log('   2. I tipi potrebbero essere leggermente diversi ma compatibili');
    console.log('   3. Le relazioni in Prisma non sempre creano foreign key nel DB\n');
    
  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la verifica
compareTableFields();
