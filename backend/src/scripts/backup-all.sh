#!/bin/bash

# 💾 Script per backup rapido
# Uso: ./scripts/backup-all.sh [descrizione]

DESCRIPTION=$1
if [ -z "$DESCRIPTION" ]; then
    DESCRIPTION="manual"
fi

echo "💾 BACKUP COMPLETO SISTEMA"
echo "========================="
echo ""

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_ROOT="backups"
BACKUP_DIR="$BACKUP_ROOT/$DATE-$DESCRIPTION"

echo "📁 Creazione directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 1. Backup Database
echo ""
echo "🗄️ Backup database..."
if command -v pg_dump &> /dev/null; then
    DB_URL=${DATABASE_URL:-"postgresql://localhost/richiesta_assistenza"}
    pg_dump "$DB_URL" > "$BACKUP_DIR/database.sql" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database backed up"
    else
        echo "⚠️  Database backup failed"
    fi
else
    echo "⚠️  pg_dump not found, skipping database"
fi

# 2. Backup codice sorgente
echo ""
echo "📦 Backup codice..."

# Backend
echo -n "  Backend... "
tar -czf "$BACKUP_DIR/backend.tar.gz" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.env \
    backend/ 2>/dev/null
echo "✅"

# Frontend
echo -n "  Frontend... "
tar -czf "$BACKUP_DIR/frontend.tar.gz" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=build \
    src/ public/ index.html package.json vite.config.ts 2>/dev/null
echo "✅"

# 3. Backup configurazioni
echo ""
echo "⚙️ Backup configurazioni..."
mkdir -p "$BACKUP_DIR/configs"

# File di configurazione critici
cp .env.example "$BACKUP_DIR/configs/" 2>/dev/null
cp docker-compose.yml "$BACKUP_DIR/configs/" 2>/dev/null
cp backend/prisma/schema.prisma "$BACKUP_DIR/configs/" 2>/dev/null
cp tailwind.config.js "$BACKUP_DIR/configs/" 2>/dev/null
cp postcss.config.js "$BACKUP_DIR/configs/" 2>/dev/null
cp tsconfig.json "$BACKUP_DIR/configs/" 2>/dev/null

echo "✅ Configurazioni salvate"

# 4. Backup documentazione
echo ""
echo "📚 Backup documentazione..."
mkdir -p "$BACKUP_DIR/docs"

cp *.md "$BACKUP_DIR/docs/" 2>/dev/null
cp -r REPORT-SESSIONI-CLAUDE "$BACKUP_DIR/docs/" 2>/dev/null

echo "✅ Documentazione salvata"

# 5. Backup uploads (se presenti)
if [ -d "uploads" ] && [ "$(ls -A uploads)" ]; then
    echo ""
    echo "📎 Backup uploads..."
    tar -czf "$BACKUP_DIR/uploads.tar.gz" uploads/ 2>/dev/null
    echo "✅ Uploads salvati"
fi

# 6. Crea file info
echo ""
echo "ℹ️ Creazione file info..."

cat > "$BACKUP_DIR/backup-info.txt" << EOF
BACKUP INFORMATION
==================
Date: $(date)
Description: $DESCRIPTION
System: $(uname -a)
Node Version: $(node -v)
NPM Version: $(npm -v)

Git Information:
Branch: $(git branch --show-current)
Last Commit: $(git log -1 --oneline)
Status: $(git status --short | wc -l) uncommitted changes

Files Backed Up:
- Database: $([ -f "$BACKUP_DIR/database.sql" ] && echo "Yes" || echo "No")
- Backend: Yes
- Frontend: Yes
- Configs: Yes
- Documentation: Yes
- Uploads: $([ -f "$BACKUP_DIR/uploads.tar.gz" ] && echo "Yes" || echo "No")

Total Size: $(du -sh "$BACKUP_DIR" | cut -f1)
EOF

# 7. Comprimi tutto
echo ""
echo "📦 Compressione backup finale..."
cd "$BACKUP_ROOT"
tar -czf "$DATE-$DESCRIPTION.tar.gz" "$DATE-$DESCRIPTION/"
cd ..

# 8. Cleanup vecchi backup (mantieni ultimi 10)
echo ""
echo "🧹 Pulizia vecchi backup..."
BACKUP_COUNT=$(ls -1 $BACKUP_ROOT/*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
    ls -1t $BACKUP_ROOT/*.tar.gz | tail -n +11 | xargs rm -f
    echo "✅ Rimossi backup vecchi (mantenuti ultimi 10)"
fi

# 9. Summary
echo ""
echo "======================================="
echo "✅ BACKUP COMPLETATO!"
echo "======================================="
echo "Directory: $BACKUP_DIR"
echo "Archive: $BACKUP_ROOT/$DATE-$DESCRIPTION.tar.gz"
echo "Size: $(du -sh "$BACKUP_ROOT/$DATE-$DESCRIPTION.tar.gz" | cut -f1)"
echo "======================================="
echo ""
echo "Per ripristinare:"
echo "tar -xzf $BACKUP_ROOT/$DATE-$DESCRIPTION.tar.gz"
echo ""
