#!/bin/bash

# 🔄 RESTORE BACKUP TOOL
# Ripristina backup auto-fix

BACKUP_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.auto-fix-backups"
BACKEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend"

echo "🔄 RESTORE BACKUP TOOL"
echo "====================="
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Nessun backup trovato in $BACKUP_DIR"
    exit 1
fi

# Lista backup disponibili
echo "📦 Backup disponibili:"
echo ""
backups=($(ls -t "$BACKUP_DIR"))
count=1

for backup in "${backups[@]}"; do
    size=$(du -sh "$BACKUP_DIR/$backup" | cut -f1)
    echo "  [$count] $backup ($size)"
    count=$((count + 1))
done

echo ""
echo -n "Seleziona backup da ripristinare (1-${#backups[@]}): "
read selection

if [ "$selection" -lt 1 ] || [ "$selection" -gt "${#backups[@]}" ]; then
    echo "❌ Selezione non valida"
    exit 1
fi

selected_backup="${backups[$((selection - 1))]}"
backup_path="$BACKUP_DIR/$selected_backup"

echo ""
echo "⚠️  ATTENZIONE!"
echo "Stai per ripristinare: $selected_backup"
echo "Questo SOVRASCRIVERÀ il codice attuale in backend/src"
echo ""
echo -n "Sei sicuro? (yes/no): "
read confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Ripristino annullato"
    exit 0
fi

echo ""
echo "🔄 Ripristino in corso..."

# Backup del current (per sicurezza)
CURRENT_BACKUP="$BACKUP_DIR/pre-restore-$(date +%Y%m%d-%H%M%S)"
echo "   Salvo stato attuale in: $(basename $CURRENT_BACKUP)"
cp -r "$BACKEND_DIR/src" "$CURRENT_BACKUP"

# Ripristina
echo "   Ripristino da: $selected_backup"
rm -rf "$BACKEND_DIR/src"
cp -r "$backup_path" "$BACKEND_DIR/src"

echo ""
echo "✅ Backup ripristinato con successo!"
echo ""
echo "📝 Note:"
echo "   - Stato attuale salvato in: $(basename $CURRENT_BACKUP)"
echo "   - Verifica il codice: npm run build"
echo ""
