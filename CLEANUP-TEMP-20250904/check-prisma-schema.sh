#!/bin/bash

echo "📝 AGGIORNA SCHEMA PRISMA CON @relation"
echo "======================================="

cd backend

# Backup schema originale
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

echo "Schema attuale - relazioni AssistanceRequest:"
echo "---------------------------------------------"
grep -A 20 "model AssistanceRequest" prisma/schema.prisma | head -25

echo ""
echo "======================================="
echo "Per sistemare definitivamente, devi:"
echo ""
echo "1. Apri prisma/schema.prisma"
echo "2. Trova il model AssistanceRequest"
echo "3. Aggiungi @relation con nomi personalizzati:"
echo ""
echo '   client       User?  @relation("ClientRequests", fields: [clientId], references: [id])'
echo '   professional User?  @relation("ProfessionalRequests", fields: [professionalId], references: [id])'
echo ""
echo "4. Nel model User aggiungi:"
echo '   clientRequests       AssistanceRequest[] @relation("ClientRequests")'
echo '   professionalRequests AssistanceRequest[] @relation("ProfessionalRequests")'
echo ""
echo "5. Esegui: npx prisma generate"
echo "6. Ripristina i nomi semplici nel codice"
echo ""
echo "======================================="
echo "Vuoi che crei automaticamente lo schema corretto? (più sicuro farlo manualmente)"
