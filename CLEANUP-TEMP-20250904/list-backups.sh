#!/bin/bash

echo "📁 RICERCA BACKUP DISPONIBILI"
echo "============================="

cd backend

echo "1. Backup in backups/:"
echo "----------------------"
ls -la backups/ 2>/dev/null | head -10

echo ""
echo "2. Backup di file specifici:"
echo "----------------------------"
echo "Schema Prisma:"
ls -la prisma/schema.prisma.backup* 2>/dev/null | tail -5

echo ""
echo "Request routes:"
ls -la src/routes/request.routes.ts.backup* 2>/dev/null | tail -5

echo ""
echo "Dashboard routes:"
ls -la src/routes/dashboard/*.backup* 2>/dev/null | tail -5

echo ""
echo "3. Backup generali nella root:"
echo "------------------------------"
ls -la *.backup* 2>/dev/null | head -5

echo ""
echo "============================="
echo "Dimmi quale backup vuoi ripristinare"
echo "o se preferisci vedere l'errore attuale"
