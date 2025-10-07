// Script per aggiungere il campo projectPath alla tabella CleanupConfig
import { prisma } from './src/config/database';

async function addProjectPathField() {
  try {
    console.log('Aggiungendo campo projectPath...');
    
    // Aggiungi il campo tramite query SQL diretta
    await prisma.$executeRaw`
      ALTER TABLE "CleanupConfig" 
      ADD COLUMN IF NOT EXISTS "projectPath" VARCHAR(500) DEFAULT '';
    `;
    
    console.log('Campo projectPath aggiunto');
    
    // Aggiorna la configurazione esistente con il path del progetto
    await prisma.cleanupConfig.updateMany({
      data: {
        projectPath: '/Users/lucamambelli/Desktop/Richiesta-Assistenza'
      }
    });
    
    console.log('Configurazione aggiornata con project path');
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addProjectPathField();
