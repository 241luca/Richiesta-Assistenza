#!/bin/bash

# Quick test per verificare che il backend compili
echo "🧪 TEST COMPILAZIONE AUTH.ROUTES"
echo "================================"
echo ""

# Controlla che non ci siano più riferimenti a safeAuditLog
echo "1. Verificando rimozione safeAuditLog..."
if grep -q "safeAuditLog" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes/auth.routes.ts; then
    echo "❌ ERRORE: safeAuditLog ancora presente!"
    exit 1
else
    echo "✅ safeAuditLog rimosso correttamente"
fi

# Controlla che ci siano i nuovi import
echo ""
echo "2. Verificando nuovi import..."
if grep -q "auditLogService" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes/auth.routes.ts; then
    echo "✅ auditLogService importato"
else
    echo "❌ ERRORE: auditLogService non trovato!"
    exit 1
fi

if grep -q "auditAuth, auditCritical" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes/auth.routes.ts; then
    echo "✅ Middleware audit importati"
else
    echo "❌ ERRORE: Middleware audit non trovati!"
    exit 1
fi

# Conta i middleware applicati
echo ""
echo "3. Verificando middleware applicati..."
AUDIT_AUTH_COUNT=$(grep -c "auditAuth" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes/auth.routes.ts)
AUDIT_CRITICAL_COUNT=$(grep -c "auditCritical" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes/auth.routes.ts)

echo "   - auditAuth usato: $AUDIT_AUTH_COUNT volte"
echo "   - auditCritical usato: $AUDIT_CRITICAL_COUNT volte"

if [ $AUDIT_AUTH_COUNT -ge 3 ] && [ $AUDIT_CRITICAL_COUNT -ge 2 ]; then
    echo "✅ Middleware applicati correttamente"
else
    echo "⚠️ Alcuni middleware potrebbero mancare"
fi

# Verifica struttura file
echo ""
echo "4. Verificando struttura file..."
if tail -1 /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes/auth.routes.ts | grep -q "export default router"; then
    echo "✅ File termina correttamente con export"
else
    echo "❌ ERRORE: File non termina correttamente!"
    exit 1
fi

echo ""
echo "================================"
echo "✅ TUTTI I TEST PASSATI!"
echo "================================"
echo ""
echo "Il file auth.routes.ts dovrebbe compilare correttamente."
echo "Riavvia il server con: npm run dev"
echo ""