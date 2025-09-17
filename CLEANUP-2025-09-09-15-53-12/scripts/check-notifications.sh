#!/bin/bash

echo "🔍 VERIFICA SISTEMA NOTIFICHE"
echo "=============================="
echo ""

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

echo "📊 Apro Prisma Studio per verificare:"
echo "   1. Tabella User → Controlla se ci sono ADMIN"
echo "   2. Tabella Notification → Controlla se ci sono notifiche"
echo "   3. Tabella AssistanceRequest → Verifica le richieste create"
echo ""
echo "Se non ci sono ADMIN:"
echo "   - Cambia il role di un utente in ADMIN"
echo "   - Poi ricrea una richiesta per testare"
echo ""

npx prisma studio
