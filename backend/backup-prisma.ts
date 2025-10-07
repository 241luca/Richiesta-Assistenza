// Script per fare backup usando Prisma
// Salva tutti i dati in formato JSON

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('🔄 Backup database usando Prisma...\n');
  
  try {
    const backup: any = {};
    
    // Lista delle tabelle da backuppare
    const tables = [
      'user',
      'category', 
      'subcategory',
      'professionalSubcategory',
      'assistanceRequest',
      'quote',
      'whatsAppMessage',
      'whatsAppContact',
      'whatsAppTemplate',
      'notification',
      'systemSetting'
    ];
    
    for (const table of tables) {
      console.log(`📦 Backup tabella: ${table}`);
      try {
        // @ts-ignore
        backup[table] = await prisma[table].findMany();
        console.log(`   ✅ ${backup[table].length} record`);
      } catch (e) {
        console.log(`   ⚠️ Tabella ${table} non trovata o vuota`);
      }
    }
    
    // Salva in file JSON
    const filename = `backup-prisma-${new Date().toISOString()}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Backup completato: ${filename}`);
    console.log(`📏 Dimensione: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
    
  } catch (error: any) {
    console.error('❌ Errore backup:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
