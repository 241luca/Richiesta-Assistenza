import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';

const prisma = new PrismaClient();

async function checkSchemaVsDatabase() {
  console.log('\n' + '='.repeat(70));
  console.log('   VERIFICA COERENZA SCHEMA.PRISMA vs DATABASE REALE');
  console.log('='.repeat(70) + '\n');
  
  try {
    // 1. Prima verifica se lo schema è sincronizzato con Prisma
    console.log('📋 FASE 1: Verifica sincronizzazione Prisma...\n');
    
    try {
      // Genera Prisma Client per vedere se ci sono warning
      console.log('   Generando Prisma Client...');
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('   ✅ Prisma Client generato correttamente\n');
    } catch (error) {
      console.log('   ⚠️  Problemi nella generazione del Prisma Client\n');
    }
    
    // 2. Confronta lo schema con il database usando prisma db pull
    console.log('📋 FASE 2: Controllo differenze tra schema.prisma e database...\n');
    
    // Crea un backup dello schema attuale
    const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
    fs.writeFileSync('./prisma/schema.backup.prisma', schemaContent);
    console.log('   📁 Backup creato: schema.backup.prisma');
    
    try {
      // Pull dello schema dal database
      console.log('   🔄 Pulling schema dal database...');
      execSync('npx prisma db pull --force', { stdio: 'pipe' });
      console.log('   ✅ Schema pulled dal database\n');
      
      // Confronta i due file
      const newSchemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
      
      if (schemaContent === newSchemaContent) {
        console.log('   ✅ SCHEMA.PRISMA È PERFETTAMENTE SINCRONIZZATO CON IL DATABASE!\n');
      } else {
        console.log('   ⚠️  TROVATE DIFFERENZE TRA SCHEMA.PRISMA E DATABASE!\n');
        console.log('   Il database reale potrebbe avere struttura diversa.');
        console.log('   Controlla schema.prisma per vedere le differenze.\n');
      }
    } catch (error) {
      console.log('   ❌ Errore durante il pull:', error.message);
    }
    
    // 3. Verifica tabelle nel database
    console.log('📋 FASE 3: Verifica tabelle esistenti nel database...\n');
    
    // Query per ottenere tutte le tabelle (PostgreSQL)
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('   📊 Tabelle trovate nel database:');
    console.log('   ' + '-'.repeat(40));
    tables.forEach((table, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${table.table_name}`);
    });
    console.log('   ' + '-'.repeat(40));
    console.log(`   Totale: ${tables.length} tabelle\n`);
    
    // 4. Verifica modelli in schema.prisma
    console.log('📋 FASE 4: Verifica modelli definiti in schema.prisma...\n');
    
    const schemaFile = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
    const modelMatches = schemaFile.match(/model\s+(\w+)\s*{/g);
    const models = modelMatches ? modelMatches.map(m => m.match(/model\s+(\w+)/)[1]) : [];
    
    console.log('   📝 Modelli trovati in schema.prisma:');
    console.log('   ' + '-'.repeat(40));
    models.forEach((model, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${model}`);
    });
    console.log('   ' + '-'.repeat(40));
    console.log(`   Totale: ${models.length} modelli\n`);
    
    // 5. Confronta tabelle vs modelli
    console.log('📋 FASE 5: Confronto tabelle database vs modelli schema...\n');
    
    // Converti nomi modelli in nomi tabelle (PascalCase -> snake_case)
    const expectedTables = models.map(model => {
      // Converti PascalCase in snake_case
      return model.replace(/[A-Z]/g, (letter, index) => {
        return index === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase();
      });
    });
    
    const dbTableNames = tables.map(t => t.table_name);
    
    // Trova differenze
    const tablesNotInSchema = dbTableNames.filter(t => 
      !expectedTables.includes(t) && 
      t !== '_prisma_migrations' && 
      t !== 'session' // Tabella sessioni Express
    );
    
    const modelsNotInDb = expectedTables.filter(t => !dbTableNames.includes(t));
    
    if (tablesNotInSchema.length > 0) {
      console.log('   ⚠️  Tabelle nel DATABASE ma NON in schema.prisma:');
      tablesNotInSchema.forEach(t => console.log(`      - ${t}`));
      console.log();
    }
    
    if (modelsNotInDb.length > 0) {
      console.log('   ⚠️  Modelli in schema.prisma ma NON nel DATABASE:');
      modelsNotInDb.forEach(t => console.log(`      - ${t}`));
      console.log();
    }
    
    if (tablesNotInSchema.length === 0 && modelsNotInDb.length === 0) {
      console.log('   ✅ Perfetta corrispondenza tra modelli e tabelle!\n');
    }
    
    // 6. Verifica presenza del modello Organization
    console.log('📋 FASE 6: Verifica specifica modello Organization...\n');
    
    const hasOrganizationModel = models.includes('Organization');
    const hasOrganizationTable = dbTableNames.includes('organization');
    
    console.log(`   Schema.prisma ha modello Organization: ${hasOrganizationModel ? '✅ SÌ' : '❌ NO'}`);
    console.log(`   Database ha tabella organization: ${hasOrganizationTable ? '✅ SÌ' : '❌ NO'}\n`);
    
    // 7. Verifica campi nella tabella User
    console.log('📋 FASE 7: Verifica struttura tabella User...\n');
    
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `;
    
    console.log('   📊 Colonne nella tabella User:');
    console.log('   ' + '-'.repeat(50));
    
    const hasOrganizationId = userColumns.some(col => col.column_name === 'organizationId');
    
    userColumns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      const flag = col.column_name === 'organizationId' ? ' ⚠️' : '';
      console.log(`   - ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${flag}`);
    });
    console.log('   ' + '-'.repeat(50));
    console.log(`   Totale colonne: ${userColumns.length}`);
    console.log(`   Campo organizationId presente: ${hasOrganizationId ? '✅ SÌ' : '❌ NO'}\n`);
    
    // 8. Report finale
    console.log('='.repeat(70));
    console.log('                         REPORT FINALE');
    console.log('='.repeat(70) + '\n');
    
    const isCoherent = !tablesNotInSchema.length && !modelsNotInDb.length && !hasOrganizationId;
    
    if (isCoherent) {
      console.log('✅ SCHEMA.PRISMA È COERENTE CON IL DATABASE!');
      console.log('   - Tutti i modelli corrispondono alle tabelle');
      console.log('   - Non ci sono campi Organization/organizationId');
      console.log('   - Il sistema è pronto per l\'uso\n');
    } else {
      console.log('⚠️  CI SONO DISCREPANZE DA RISOLVERE:');
      if (tablesNotInSchema.length > 0) {
        console.log(`   - ${tablesNotInSchema.length} tabelle non mappate in schema.prisma`);
      }
      if (modelsNotInDb.length > 0) {
        console.log(`   - ${modelsNotInDb.length} modelli non hanno tabelle corrispondenti`);
      }
      if (hasOrganizationId) {
        console.log('   - Campo organizationId trovato ma Organization non esiste');
      }
      console.log('\n   💡 Suggerimento: Esegui "npx prisma db push" per allineare il database\n');
    }
    
  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
    console.log('\n💡 Assicurati che il database sia raggiungibile e configurato correttamente.');
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la verifica
checkSchemaVsDatabase();
