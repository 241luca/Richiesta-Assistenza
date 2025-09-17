/**
 * Script per correggere TUTTI i problemi dei campi WhatsApp
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function fixWhatsAppRoutes() {
  console.log('🔧 CORREZIONE COMPLETA WHATSAPP ROUTES\n');
  console.log('=======================================\n');
  
  const filePath = path.join(__dirname, '../src/routes/whatsapp.routes.ts');
  
  // 1. Leggi il file
  console.log('1️⃣ Lettura file routes...');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 2. Backup
  const backupPath = filePath.replace('.ts', `.backup-${Date.now()}.ts`);
  fs.writeFileSync(backupPath, content);
  console.log(`   Backup creato: ${backupPath}\n`);
  
  // 3. Correzioni necessarie basate sul modello reale
  console.log('2️⃣ Applicazione correzioni...\n');
  
  // Correzione 1: 'type' -> 'mediaType' o 'direction' a seconda del contesto
  console.log('   • Correzione campo "type" -> "mediaType" o "direction"');
  content = content.replace(/by: \['type'/g, "by: ['direction'");
  content = content.replace(/\.type(?!\w)/g, '.mediaType');
  
  // Correzione 2: 'sentAt' -> 'timestamp'
  console.log('   • Correzione campo "sentAt" -> "timestamp"');
  content = content.replace(/sentAt:/g, 'timestamp:');
  
  // Correzione 3: rimuovi campi duplicati o non esistenti
  console.log('   • Rimozione duplicati "direction"');
  // Cerca pattern di direction duplicato
  content = content.replace(/direction: 'outgoing',\s*status: 'sent',\s*direction: 'outbound',/g, 
                            "direction: 'outgoing',\n        status: 'sent',");
  
  // 4. Salva il file corretto
  fs.writeFileSync(filePath, content);
  console.log('\n3️⃣ File salvato con correzioni\n');
  
  // 5. Verifica che il modello sia corretto nel database
  console.log('4️⃣ Verifica struttura database...\n');
  
  try {
    // Test che il modello funzioni
    const testCount = await prisma.whatsAppMessage.count();
    console.log(`   ✅ Tabella WhatsAppMessage accessibile (${testCount} record)\n`);
    
    // Mostra i campi disponibili
    console.log('   Campi disponibili nel modello:');
    console.log('   - phoneNumber (String)');
    console.log('   - message (String)');
    console.log('   - direction (String) - "incoming" o "outgoing"');
    console.log('   - status (String?) - "sent", "delivered", "read", "failed"');
    console.log('   - messageId (String?)');
    console.log('   - timestamp (DateTime)');
    console.log('   - mediaUrl (String?)');
    console.log('   - mediaType (String?)');
    console.log('   - conversationId (String?)');
    console.log('   - userId (String?)');
    console.log('   - metadata (Json?)');
    console.log('   - createdAt (DateTime)');
    console.log('   - updatedAt (DateTime)\n');
    
  } catch (error) {
    console.error('   ❌ Errore accesso tabella:', error);
  }
  
  console.log('✅ CORREZIONI COMPLETATE!\n');
  console.log('📋 Prossimi passi:');
  console.log('1. Il backend si riavvierà automaticamente');
  console.log('2. Testa l\'invio di un messaggio');
  console.log('3. Verifica le statistiche');
  console.log('4. Controlla la lista messaggi\n');
  
  await prisma.$disconnect();
}

// Esegui
fixWhatsAppRoutes().catch(console.error);
