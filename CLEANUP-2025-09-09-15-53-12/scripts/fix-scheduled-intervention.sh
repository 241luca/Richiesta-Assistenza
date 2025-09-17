#!/bin/bash

echo "🔧 Applicazione modifiche database per ScheduledIntervention..."

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

# 1. Genera il client Prisma
echo "📦 Generazione Prisma Client..."
npx prisma generate

# 2. Applica le modifiche al database
echo "🗄️ Applicazione modifiche al database..."
npx prisma db push --accept-data-loss

echo "✅ Database aggiornato con successo!"
echo ""
echo "📋 Tabella ScheduledIntervention creata con i seguenti campi:"
echo "  - id: ID univoco"
echo "  - requestId: Collegamento alla richiesta"
echo "  - professionalId: Professionista assegnato"
echo "  - proposedDate: Data proposta"
echo "  - confirmedDate: Data confermata"
echo "  - status: Stato (PROPOSED/CONFIRMED/etc)"
echo "  - description: Descrizione"
echo "  - estimatedDuration: Durata stimata"
echo "  - clientConfirmed: Conferma cliente"
echo ""
echo "🎉 Ora il sistema di interventi programmati dovrebbe funzionare!"
