import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Script per migrare i documenti dal file JSON al database PostgreSQL
 */
async function migrateKnowledgeBaseToDatabase() {
  try {
    console.log('🔄 Inizio migrazione documenti da JSON a Database...');
    
    // Percorso del file JSON
    const STORAGE_FILE = path.join(process.cwd(), 'uploads', 'knowledge-base', 'documents.json');
    
    if (!fs.existsSync(STORAGE_FILE)) {
      console.log('❌ File documents.json non trovato. Nessun documento da migrare.');
      return;
    }
    
    // Leggi il file JSON
    const jsonContent = fs.readFileSync(STORAGE_FILE, 'utf8');
    const documentsMap = JSON.parse(jsonContent);
    
    let totalDocuments = 0;
    let migratedDocuments = 0;
    
    // Per ogni chiave nel JSON
    for (const [key, documents] of Object.entries(documentsMap)) {
      // Estrai professionalId, subcategoryId e targetAudience dalla chiave
      const [professionalId, subcategoryId, targetAudience] = key.split('_');
      
      if (!professionalId || !subcategoryId || !targetAudience) {
        console.warn(`⚠️ Chiave malformata: ${key}`);
        continue;
      }
      
      console.log(`\n📂 Elaborazione documenti per chiave: ${key}`);
      console.log(`   Professional: ${professionalId}`);
      console.log(`   Subcategory: ${subcategoryId}`);
      console.log(`   Target: ${targetAudience}`);
      
      // Per ogni documento
      for (const doc of documents as any[]) {
        totalDocuments++;
        
        try {
          // Verifica se il documento esiste già nel database
          const existing = await prisma.knowledgeBase.findFirst({
            where: {
              professionalId,
              subcategoryId,
              fileName: doc.filename || doc.name
            }
          });
          
          if (existing) {
            console.log(`   ⏭️ Documento già esistente: ${doc.name}`);
            continue;
          }
          
          // Crea il documento nel database
          await prisma.knowledgeBase.create({
            data: {
              professionalId,
              subcategoryId,
              targetAudience,
              fileName: doc.filename || doc.name,
              originalName: doc.name || doc.originalName,
              filePath: doc.path,
              fileType: doc.type || 'application/octet-stream',
              fileSize: doc.size || 0,
              description: doc.description || null,
              uploadedBy: doc.uploadedBy || professionalId, // Usa professionalId come fallback
              isProcessed: doc.isProcessed || false,
              processedAt: doc.processedAt ? new Date(doc.processedAt) : null,
              metadata: doc.metadata || null,
              isActive: true
            }
          });
          
          migratedDocuments++;
          console.log(`   ✅ Migrato: ${doc.name}`);
          
        } catch (error) {
          console.error(`   ❌ Errore migrando ${doc.name}:`, error);
        }
      }
    }
    
    console.log('\n📊 Riepilogo migrazione:');
    console.log(`   Documenti totali: ${totalDocuments}`);
    console.log(`   Documenti migrati: ${migratedDocuments}`);
    console.log(`   Documenti saltati: ${totalDocuments - migratedDocuments}`);
    
    // Rinomina il file JSON come backup
    const backupFile = STORAGE_FILE + '.backup-' + Date.now();
    fs.renameSync(STORAGE_FILE, backupFile);
    console.log(`\n📦 File JSON rinominato come backup: ${backupFile}`);
    
    console.log('\n✅ Migrazione completata con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la migrazione
migrateKnowledgeBaseToDatabase();
