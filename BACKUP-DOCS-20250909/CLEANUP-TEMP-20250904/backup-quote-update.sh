#!/bin/bash
# Backup script per implementazione modifica e cancellazione preventivi
# Data: $(date +%Y%m%d-%H%M%S)

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔧 Creazione backup per implementazione modifica/cancellazione preventivi..."

# Backend files
echo "📦 Backup file backend..."
cp backend/src/routes/quote.routes.ts backend/src/routes/quote.routes.backup-$TIMESTAMP.ts
cp backend/src/services/quote.service.ts backend/src/services/quote.service.backup-$TIMESTAMP.ts

# Frontend files  
echo "🎨 Backup file frontend..."
cp src/components/quotes/QuoteBuilder.tsx src/components/quotes/QuoteBuilder.backup-$TIMESTAMP.tsx

echo "✅ Backup completato con timestamp: $TIMESTAMP"
echo "📋 File salvati:"
echo "  - backend/src/routes/quote.routes.backup-$TIMESTAMP.ts"
echo "  - backend/src/services/quote.service.backup-$TIMESTAMP.ts"
echo "  - src/components/quotes/QuoteBuilder.backup-$TIMESTAMP.tsx"
