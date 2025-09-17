const { PrismaClient } = require('@prisma/client');
const path = require('path');
const os = require('os');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixPaths() {
  // Ottieni tutti i backup
  const backups = await prisma.systemBackup.findMany();
  
  console.log(`Trovati ${backups.length} backup nel database`);
  
  for (const backup of backups) {
    const oldPath = backup.filePath;
    
    // Estrai solo il nome del file
    const filename = path.basename(oldPath);
    
    // Costruisci il nuovo percorso
    const homeDir = os.homedir();
    let newPath;
    
    if (backup.type === 'DATABASE') {
      newPath = path.join(homeDir, 'BACKUP-SICURI-RICHIESTA-ASSISTENZA', 'database', filename);
    } else if (backup.type === 'CODE') {
      newPath = path.join(homeDir, 'BACKUP-SICURI-RICHIESTA-ASSISTENZA', 'code', filename);
    } else if (backup.type === 'FILES' || backup.type === 'UPLOADS') {
      newPath = path.join(homeDir, 'BACKUP-SICURI-RICHIESTA-ASSISTENZA', 'uploads', filename);
    }
    
    // Verifica se il file esiste nel nuovo percorso
    if (newPath && fs.existsSync(newPath)) {
      // Aggiorna il percorso nel database
      await prisma.systemBackup.update({
        where: { id: backup.id },
        data: { filePath: newPath }
      });
      console.log(`Aggiornato: ${filename} -> ${newPath}`);
    } else {
      console.log(`File non trovato: ${filename} - rimuovo dal database`);
      // Rimuovi dal database se il file non esiste
      await prisma.systemBackup.delete({
        where: { id: backup.id }
      });
    }
  }
  
  console.log('Fatto!');
  process.exit(0);
}

fixPaths().catch(console.error);
