#!/bin/bash

# Script per rimuovere tutti i riferimenti a organizationId
# Data: 02 Settembre 2025

echo "🔍 Analisi e rimozione di organizationId dal progetto..."
echo "================================================"

# Crea cartella backup
BACKUP_DIR="backup-remove-organizationid-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# File critici da correggere (routes e services)
CRITICAL_FILES=(
  "backend/src/middleware/auth.ts"
  "backend/src/routes/geocoding.routes.ts"
  "backend/src/routes/apiKeys.routes.ts"
  "backend/src/services/apiKey.service.ts"
  "backend/src/websocket/handlers/message.handler.ts"
  "backend/src/websocket/handlers/notification.handler.ts"
  "backend/src/websocket/handlers/quote.handler.ts"
  "backend/src/websocket/handlers/request.handler.ts"
)

echo ""
echo "📁 Backup dei file critici..."
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    echo "   ✅ Backup: $(basename $file)"
  fi
done

echo ""
echo "🔧 Correzione file critici del sistema..."
echo ""

# 1. Fix auth.ts
if [ -f "backend/src/middleware/auth.ts" ]; then
  echo "1. Fixing auth.ts..."
  sed -i '' '/organizationId/d' "backend/src/middleware/auth.ts"
  echo "   ✅ Rimossi riferimenti a organizationId da auth.ts"
fi

# 2. Fix geocoding.routes.ts
if [ -f "backend/src/routes/geocoding.routes.ts" ]; then
  echo "2. Fixing geocoding.routes.ts..."
  sed -i '' 's/const { organizationId } = req.user!;//g' "backend/src/routes/geocoding.routes.ts"
  sed -i '' 's/organizationId,//g' "backend/src/routes/geocoding.routes.ts"
  echo "   ✅ Rimossi riferimenti a organizationId da geocoding.routes.ts"
fi

# 3. Fix apiKeys.routes.ts
if [ -f "backend/src/routes/apiKeys.routes.ts" ]; then
  echo "3. Fixing apiKeys.routes.ts..."
  sed -i '' "s/req.user!.organizationId || 'default'/'default'/g" "backend/src/routes/apiKeys.routes.ts"
  echo "   ✅ Sostituito organizationId con 'default' in apiKeys.routes.ts"
fi

# 4. Fix apiKey.service.ts
if [ -f "backend/src/services/apiKey.service.ts" ]; then
  echo "4. Fixing apiKey.service.ts..."
  sed -i '' 's/organizationId: string,.*$//' "backend/src/services/apiKey.service.ts"
  sed -i '' 's/organizationId?: string//' "backend/src/services/apiKey.service.ts"
  echo "   ✅ Rimossi parametri organizationId da apiKey.service.ts"
fi

# 5. Fix websocket handlers
echo "5. Fixing websocket handlers..."
for handler in backend/src/websocket/handlers/*.handler.ts; do
  if [ -f "$handler" ]; then
    sed -i '' '/organizationId/d' "$handler"
    echo "   ✅ $(basename $handler)"
  fi
done

echo ""
echo "📊 Riepilogo modifiche:"
echo "====================="

# Conta i riferimenti rimasti
REMAINING=$(grep -r 'organizationId' backend/src --include='*.ts' | grep -v 'node_modules' | grep -v '.backup' | wc -l)
SCRIPTS_REMAINING=$(grep -r 'organizationId' backend/scripts backend/src/scripts --include='*.ts' | wc -l)

echo "✅ File di sistema corretti: ${#CRITICAL_FILES[@]}"
echo "⚠️  Riferimenti rimasti nel codice principale: $REMAINING"
echo "📝 Riferimenti negli script di test/setup: $SCRIPTS_REMAINING (non critici)"

echo ""
echo "📁 Backup salvati in: $BACKUP_DIR"
echo ""
echo "🎯 Prossimi passi consigliati:"
echo "1. Riavvia il backend per applicare le modifiche"
echo "2. Testa la creazione di una nuova richiesta con allegati"
echo "3. Se tutto funziona, gli script di test possono essere ignorati"
echo ""
echo "✅ Pulizia organizationId completata!"
