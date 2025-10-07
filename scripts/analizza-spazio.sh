#!/bin/bash

# Script per analizzare lo spazio utilizzato dalle directory del progetto
# Creato per il progetto Richiesta-Assistenza

echo "🗂️  ANALISI SPAZIO DIRECTORY - Progetto Richiesta Assistenza"
echo "=================================================="
echo ""

# Controlla se siamo nella directory corretta del progetto
if [ ! -f "ISTRUZIONI-PROGETTO.md" ]; then
    echo "❌ ERRORE: Questo script deve essere eseguito dalla root del progetto"
    echo "💡 Vai nella cartella: /Users/lucamambelli/Desktop/Richiesta-Assistenza"
    exit 1
fi

echo "📍 Directory corrente: $(pwd)"
echo ""

# Mostra lo spazio totale del progetto
echo "📊 SPAZIO TOTALE PROGETTO:"
du -sh . | sed 's/\./Progetto Richiesta-Assistenza/'
echo ""

echo "📁 DIRECTORY PRINCIPALI (ordinate per dimensione):"
echo "=================================================="

# Analizza le directory principali (esclusi file nascosti e node_modules per chiarezza)
du -sh */ 2>/dev/null | sort -hr | while read size dir; do
    # Rimuove il / finale dal nome directory
    clean_dir=$(echo "$dir" | sed 's|/$||')
    
    # Aggiunge descrizioni per le directory principali
    case "$clean_dir" in
        "backend")
            echo "🖥️  $size    $clean_dir (Server Node.js + Database)"
            ;;
        "src")
            echo "🎨 $size    $clean_dir (Frontend React)"
            ;;
        "DOCUMENTAZIONE")
            echo "📚 $size    $clean_dir (Tutta la documentazione)"
            ;;
        "node_modules")
            echo "📦 $size    $clean_dir (Librerie installate)"
            ;;
        "database-backups")
            echo "💾 $size    $clean_dir (Backup del database)"
            ;;
        "scripts")
            echo "⚙️  $size    $clean_dir (Script di automazione)"
            ;;
        *)
            echo "📄 $size    $clean_dir"
            ;;
    esac
done

echo ""
echo "🔍 DETTAGLIO BACKEND (se presente):"
echo "=================================="
if [ -d "backend" ]; then
    cd backend
    du -sh */ 2>/dev/null | sort -hr | head -10 | while read size dir; do
        clean_dir=$(echo "$dir" | sed 's|/$||')
        echo "   📁 $size    backend/$clean_dir"
    done
    cd ..
else
    echo "   ⚠️  Directory backend non trovata"
fi

echo ""
echo "🔍 DETTAGLIO FRONTEND (cartella src):"
echo "=================================="
if [ -d "src" ]; then
    du -sh src/*/ 2>/dev/null | sort -hr | while read size dir; do
        clean_dir=$(echo "$dir" | sed 's|/$||')
        echo "   📁 $size    $clean_dir"
    done
else
    echo "   ⚠️  Directory src non trovata"
fi

echo ""
echo "🗑️  FILE E CARTELLE PIÙ GRANDI (Top 10):"
echo "========================================"
find . -type f -not -path "./node_modules/*" -not -path "./.git/*" -exec du -h {} + 2>/dev/null | sort -hr | head -10

echo ""
echo "💡 SUGGERIMENTI PER LIBERARE SPAZIO:"
echo "===================================="
echo "• node_modules: Puoi ricreare con 'npm install'"
echo "• database-backups: Rimuovi backup vecchi se troppi"
echo "• .git: Contiene tutta la cronologia del progetto"
echo "• File .backup-*: Rimuovi backup temporanei non più necessari"

echo ""
echo "✅ Analisi completata!"
echo "📅 $(date '+%d/%m/%Y alle %H:%M')"