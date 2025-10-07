// Verifica completa allineamento Prisma-Database
import { prisma } from './src/config/database';

async function verificaAllineamento() {
  try {
    console.log('🔍 VERIFICA ALLINEAMENTO PRISMA-DATABASE\n');
    
    // 1. Verifica campi CleanupConfig
    console.log('📋 VERIFICA TABELLA CleanupConfig:');
    try {
      // Prova a leggere tutti i campi
      const config = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'CleanupConfig' 
        ORDER BY ordinal_position;
      `;
      
      console.log('Colonne nel database:');
      (config as any[]).forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Verifica se projectPath esiste
      const hasProjectPath = (config as any[]).some((col: any) => col.column_name === 'projectPath');
      if (hasProjectPath) {
        console.log('✅ Campo projectPath PRESENTE');
      } else {
        console.log('⚠️ Campo projectPath MANCANTE');
      }
      
    } catch (err) {
      console.error('❌ Errore verificando tabella:', err);
    }
    
    // 2. Test lettura configurazione
    console.log('\n📊 TEST LETTURA CONFIGURAZIONE:');
    try {
      const config = await prisma.cleanupConfig.findFirst();
      if (config) {
        console.log('✅ Configurazione letta con successo');
        console.log('  - name:', config.name);
        console.log('  - targetDirectory:', config.targetDirectory);
        console.log('  - isActive:', config.isActive);
        
        // Prova a leggere projectPath con cast
        const configWithPath = config as any;
        if (configWithPath.projectPath !== undefined) {
          console.log('  - projectPath:', configWithPath.projectPath || '(vuoto)');
        }
      } else {
        console.log('⚠️ Nessuna configurazione trovata');
      }
    } catch (err) {
      console.error('❌ Errore leggendo configurazione:', err);
    }
    
    // 3. Verifica altre tabelle cleanup
    console.log('\n📁 VERIFICA TABELLE CLEANUP:');
    const tables = [
      'CleanupPattern',
      'CleanupExcludeFile', 
      'CleanupExcludeDirectory',
      'CleanupLog',
      'CleanupStats'
    ];
    
    for (const table of tables) {
      try {
        const count = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
        console.log(`✅ ${table}: ${count} record`);
      } catch (err) {
        console.log(`❌ ${table}: ERRORE o non esiste`);
      }
    }
    
    // 4. Conclusione
    console.log('\n📌 CONCLUSIONE:');
    console.log('Se vedi errori sopra, Prisma e DB non sono allineati.');
    console.log('In tal caso esegui:');
    console.log('  npx prisma db pull   (per allineare lo schema)');
    console.log('  npx prisma generate  (per rigenerare il client)');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificaAllineamento();
