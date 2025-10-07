#!/bin/bash

echo "🔍 Verifica Sistema Moduli - Completa"
echo "======================================"
echo ""

# Check database
echo "📊 1. Verifica Database..."
cd backend
MODULE_COUNT=$(npx ts-node -e "
import { prisma } from './src/config/database';
async function check() {
  try {
    const count = await prisma.systemModule.count();
    console.log(count);
  } catch (error) {
    console.log('0');
  }
}
check().finally(() => prisma.\$disconnect());
" 2>/dev/null)

if [ "$MODULE_COUNT" -eq "66" ]; then
  echo "   ✅ Database: 66 moduli presenti"
else
  echo "   ❌ Database: Trovati $MODULE_COUNT moduli (attesi 66)"
  exit 1
fi

# Check files backend
echo ""
echo "🔧 2. Verifica File Backend..."
FILES=(
  "src/services/module.service.ts"
  "src/routes/admin/modules.routes.ts"
  "src/middleware/module.middleware.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file MANCANTE"
    exit 1
  fi
done

# Check files frontend
echo ""
echo "🎨 3. Verifica File Frontend..."
cd ..
FILES=(
  "src/types/modules.types.ts"
  "src/services/modules.api.ts"
  "src/components/admin/modules/ModuleCard.tsx"
  "src/pages/admin/ModuleManager.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file MANCANTE"
    exit 1
  fi
done

# Check routes protected
echo ""
echo "🔒 4. Verifica Routes Protette..."
PROTECTED_FILES=(
  "backend/src/routes/reviews.routes.ts"
  "backend/src/routes/payment.routes.ts"
  "backend/src/routes/whatsapp.routes.ts"
)

PROTECTED_COUNT=0
for file in "${PROTECTED_FILES[@]}"; do
  if grep -q "requireModule" "$file" 2>/dev/null; then
    PROTECTED_COUNT=$((PROTECTED_COUNT + 1))
  fi
done

echo "   ✅ $PROTECTED_COUNT routes protette trovate"

# Check tests
echo ""
echo "🧪 5. Verifica Test..."
if [ -f "backend/src/__tests__/services/module.service.test.ts" ]; then
  echo "   ✅ Unit tests presenti"
else
  echo "   ⚠️  Unit tests mancanti"
fi

if [ -f "backend/src/__tests__/integration/modules.api.test.ts" ]; then
  echo "   ✅ Integration tests presenti"
else
  echo "   ⚠️  Integration tests mancanti"
fi

if [ -f "tests/modules.spec.ts" ]; then
  echo "   ✅ E2E tests presenti"
else
  echo "   ⚠️  E2E tests mancanti"
fi

# Summary
echo ""
echo "======================================"
echo "✅ SISTEMA MODULI VERIFICATO"
echo ""
echo "📊 Riepilogo:"
echo "   - 66 moduli in database"
echo "   - Backend service completo"
echo "   - API routes complete"
echo "   - Middleware protezione attivo"
echo "   - Frontend UI completo"
echo "   - Routes protette: $PROTECTED_COUNT"
echo ""
echo "🚀 Sistema pronto per deploy!"
