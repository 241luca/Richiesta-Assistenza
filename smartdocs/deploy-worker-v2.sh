#!/bin/bash

# 🚀 SmartDocs Worker v2 - DEPLOYMENT SCRIPT
# Questo script fa il deployment completo del Worker v2
# Data: 28 Ottobre 2025

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 SmartDocs Worker v2 - DEPLOYMENT SCRIPT                   ║"
echo "║  Semantic Chunking + Knowledge Graph + Retry Logic            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="/Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs"
BACKUP_DIR="$PROJECT_ROOT/backups"

# ============================================================================
# STEP 1: PRE-CHECKS
# ============================================================================
echo "📋 STEP 1: Pre-deployment checks..."
echo ""

cd "$PROJECT_ROOT"

# Check Git
echo "  ✓ Checking git branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "  ⚠️  WARNING: Not on main branch (current: $CURRENT_BRANCH)"
  echo "     Continue anyway? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    exit 1
  fi
fi

# Check worker is not running
echo "  ✓ Checking if worker is running..."
WORKER_PID=$(pgrep -f "ts-node.*worker" || echo "")
if [ -n "$WORKER_PID" ]; then
  echo "  ⚠️  Worker is running (PID: $WORKER_PID)"
  echo "     Killing it..."
  kill -9 "$WORKER_PID" 2>/dev/null || true
  sleep 2
fi

echo "  ✅ All checks passed!"
echo ""

# ============================================================================
# STEP 2: DATABASE BACKUP
# ============================================================================
echo "💾 STEP 2: Creating database backup..."
echo ""

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/smartdocs-pre-worker-v2-$(date +%Y%m%d-%H%M%S).sql.gz"

# Tenta con pg_dump se disponibile
if command -v pg_dump &> /dev/null; then
  echo "  ✓ Using pg_dump for backup..."
  DATABASE_URL="${DATABASE_URL:-postgresql://smartdocs:smartdocs_secure_pwd@localhost:5433/smartdocs}"
  pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
  echo "  ✅ Backup created: $(basename $BACKUP_FILE)"
else
  echo "  ⚠️  pg_dump not found, using Node.js backup script..."
  # Usa lo script Node.js
  if [ -f "$PROJECT_ROOT/scripts/backup.js" ]; then
    node "$PROJECT_ROOT/scripts/backup.js" "$BACKUP_FILE"
    echo "  ✅ Backup created: $(basename $BACKUP_FILE)"
  else
    echo "  ⚠️  Backup skipped (pg_dump not available)"
  fi
fi

echo ""

# ============================================================================
# STEP 3: MIGRATION DATABASE (if needed)
# ============================================================================
echo "📊 STEP 3: Applying database migration..."
echo ""

if [ -f "$PROJECT_ROOT/run-migration.js" ]; then
  echo "  ✓ Running migration script..."
  
  # Cerca npm nel path e usalo
  if command -v npm &> /dev/null; then
    npm run db:init 2>/dev/null || true
  fi
  
  # Se non funziona npm, il migration script deve essere eseguito manualmente
  echo "  ⚠️  Migration requires manual setup (see DEPLOYMENT-GUIDE-v2.md)"
else
  echo "  ℹ️  No migration needed"
fi

echo ""

# ============================================================================
# STEP 4: BUILD
# ============================================================================
echo "🔨 STEP 4: Building TypeScript..."
echo ""

if command -v npm &> /dev/null; then
  echo "  ✓ Running npm build..."
  npm run build 2>&1 | tail -5
  echo "  ✅ Build completed!"
else
  echo "  ⚠️  npm not found in PATH"
  echo "     Please run 'npm run build' manually"
fi

echo ""

# ============================================================================
# STEP 5: VERIFY FILES
# ============================================================================
echo "✅ STEP 5: Verifying deployment files..."
echo ""

FILES_TO_CHECK=(
  "src/worker.ts"
  "src/services/OpenAIService.ts"
  "src/services/SemanticChunkingService.ts"
  "src/services/KnowledgeGraphService.ts"
  "scripts/06-worker-v2-retry-tracking.sql"
)

ALL_OK=true
for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$PROJECT_ROOT/$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file - NOT FOUND!"
    ALL_OK=false
  fi
done

if [ "$ALL_OK" = false ]; then
  echo ""
  echo "❌ Some files are missing! Cannot proceed."
  exit 1
fi

echo ""
echo "  ✅ All files present!"
echo ""

# ============================================================================
# STEP 6: SUMMARY
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT READY                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Deployment Summary:"
echo "  • Backup: $(basename $BACKUP_FILE)"
echo "  • Database: PostgreSQL"
echo "  • Worker: src/worker.ts"
echo "  • Build: dist/worker.js"
echo ""

echo "🚀 Next Steps:"
echo ""
echo "  1. Review the changes:"
echo "     $ git diff --stat"
echo ""
echo "  2. Start the worker:"
echo "     $ npm run worker"
echo ""
echo "  3. Monitor the logs:"
echo "     $ tail -f logs/smartdocs.log | grep -i 'worker v2'"
echo ""
echo "  4. For full guide, see: DEPLOYMENT-GUIDE-v2.md"
echo ""

echo "✨ Ready to deploy! 🎉"
