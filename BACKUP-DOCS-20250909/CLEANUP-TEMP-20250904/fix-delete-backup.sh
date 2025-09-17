#!/bin/bash

echo "🔧 Fixing Backup Delete Error..."

# Backup del file originale
cp backend/src/services/backup.service.ts backend/src/services/backup.service.ts.backup-delete-$(date +%Y%m%d-%H%M%S)

# Correggi la funzione deleteBackup
cat > /tmp/fix-delete.js << 'EOF'
const fs = require('fs');

// Leggi il file
let content = fs.readFileSync('backend/src/services/backup.service.ts', 'utf8');

// Trova e sostituisci la funzione deleteBackup
const oldFunction = `async deleteBackup(backupId: string, userId: string, permanent: boolean = false): Promise<any> {
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    if (permanent) {
      if (backup.filePath) {
        try {
          await fs.unlink(backup.filePath);
        } catch (error) {
          logger.warn(\`Failed to delete backup file: \${backup.filePath}\`, error);
        }
      }

      await prisma.systemBackup.delete({
        where: { id: backupId },
      });

      return { success: true, message: 'Backup permanently deleted' };
    } else {
      await prisma.systemBackup.update({
        where: { id: backupId },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      return { success: true, message: 'Backup marked as deleted' };
    }
  }`;

const newFunction = `async deleteBackup(backupId: string, userId: string, permanent: boolean = false): Promise<any> {
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Elimina fisicamente il file se richiesto
    if (backup.filePath) {
      try {
        // Verifica se il file esiste prima di eliminarlo
        if (fsSync.existsSync(backup.filePath)) {
          await fs.unlink(backup.filePath);
          logger.info(\`Deleted backup file: \${backup.filePath}\`);
        } else {
          logger.warn(\`Backup file not found: \${backup.filePath}\`);
        }
      } catch (error) {
        logger.warn(\`Failed to delete backup file: \${backup.filePath}\`, error);
      }
    }

    // Elimina dal database
    // NOTA: Non abbiamo soft delete, quindi eliminiamo sempre permanentemente
    await prisma.systemBackup.delete({
      where: { id: backupId },
    });

    logger.info(\`Backup \${backupId} deleted by user \${userId}\`);
    return { success: true, message: 'Backup deleted successfully' };
  }`;

// Cerca la funzione esistente e sostituiscila
const functionRegex = /async deleteBackup\([\s\S]*?\n  \}/;
if (content.match(functionRegex)) {
  content = content.replace(functionRegex, newFunction);
  console.log('✅ Function deleteBackup fixed');
} else {
  console.log('⚠️ Could not find deleteBackup function to replace');
}

// Scrivi il file aggiornato
fs.writeFileSync('backend/src/services/backup.service.ts', content);
console.log('✅ File saved');
EOF

# Esegui il fix
node /tmp/fix-delete.js

# Verifica che il fix sia stato applicato
echo ""
echo "📝 Verifying fix applied:"
grep -A 15 "async deleteBackup" backend/src/services/backup.service.ts | head -20

echo ""
echo "✅ Fix completed!"
echo ""
echo "📌 Note: Il sistema ora eliminerà SEMPRE permanentemente i backup"
echo "   perché non abbiamo i campi deletedAt/deletedById nel database."
echo ""
echo "🔄 Il backend dovrebbe riavviarsi automaticamente con nodemon"
