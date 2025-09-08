#!/bin/bash

echo "🔍 Checking delete backup error..."

# Controlla i log del backend
echo ""
echo "📝 Ultimi errori nel backend:"
tail -n 50 backend/logs/error.log 2>/dev/null | grep -i "delete\|backup" || echo "No error logs found"

# Controlla la route di delete
echo ""
echo "🔍 Checking delete route in backup.routes.ts:"
grep -A 10 "delete.*backup" backend/src/routes/backup.routes.ts 2>/dev/null || echo "Route not found"

# Controlla il servizio delete
echo ""
echo "🔍 Checking deleteBackup in service:"
grep -A 20 "deleteBackup" backend/src/services/backup.service.ts | head -25

# Test manuale delete API
echo ""
echo "🧪 Testing delete API endpoint:"
echo "Prova manuale con curl..."

# Controlla permessi cartella backup
echo ""
echo "📁 Checking backup directory permissions:"
ls -la backend/system-backups/ 2>/dev/null || echo "Directory not found"

echo ""
echo "✅ Check completed!"
