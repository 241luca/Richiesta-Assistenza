#!/bin/bash

echo "🧹 Cleaning up backup directory..."

BACKUP_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend/system-backups"

echo ""
echo "📁 Current backup directory content:"
ls -la "$BACKUP_DIR"

echo ""
echo "🗑️ Removing temporary directories..."

# Rimuovi tutte le directory temp-*
find "$BACKUP_DIR" -type d -name "temp-*" -exec rm -rf {} + 2>/dev/null

# Rimuovi file vuoti
find "$BACKUP_DIR" -type f -size 0 -delete 2>/dev/null

echo ""
echo "✅ Cleanup completed!"

echo ""
echo "📁 Clean backup directory:"
ls -la "$BACKUP_DIR"

echo ""
echo "📊 Summary:"
echo "- Backup files: $(find "$BACKUP_DIR" -type f -name "*.zip" -o -name "*.tar.gz" | wc -l)"
echo "- Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""
echo "✅ Your backups are stored in:"
echo "   $BACKUP_DIR"
