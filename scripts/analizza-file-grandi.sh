#!/bin/bash

# Script per trovare tutti i file grandi (superiori a 100KB) nel progetto
# Creato per il progetto Richiesta-Assistenza

echo "📄 ANALISI FILE GRANDI - Progetto Richiesta Assistenza"
echo "======================================================"
echo "🔍 Cercando file superiori a 100KB..."
echo ""

# Controlla se siamo nella directory corretta del progetto
if [ ! -f "ISTRUZIONI-PROGETTO.md" ]; then
    echo "❌ ERRORE: Questo script deve essere eseguito dalla root del progetto"
    echo "💡 Vai nella cartella: /Users/lucamambelli/Desktop/Richiesta-Assistenza"
    exit 1
fi

echo "📍 Directory di ricerca: $(pwd)"
echo ""

# Funzione per identificare il tipo di file e aggiungere emoji
get_file_icon() {
    local file="$1"
    local extension="${file##*.}"
    local filename=$(basename "$file")
    
    case "$extension" in
        "js"|"jsx"|"ts"|"tsx")
            echo "💻"
            ;;
        "json")
            echo "📋"
            ;;
        "md")
            echo "📝"
            ;;
        "sql")
            echo "🗄️"
            ;;
        "png"|"jpg"|"jpeg"|"gif"|"svg"|"webp")
            echo "🖼️"
            ;;
        "pdf")
            echo "📄"
            ;;
        "zip"|"tar"|"gz")
            echo "📦"
            ;;
        "log")
            echo "📊"
            ;;
        "backup"|"bak")
            echo "💾"
            ;;
        "env")
            echo "⚙️"
            ;;
        *)
            # Controlla il nome del file per casi speciali
            case "$filename" in
                "package-lock.json"|"yarn.lock")
                    echo "🔒"
                    ;;
                ".DS_Store")
                    echo "🍎"
                    ;;
                *)
                    echo "📄"
                    ;;
            esac
            ;;
    esac
}

# Funzione per dare una descrizione del file
get_file_description() {
    local file="$1"
    local extension="${file##*.}"
    local filename=$(basename "$file")
    local dirname=$(dirname "$file")
    
    case "$extension" in
        "js"|"jsx")
            echo "(Codice JavaScript)"
            ;;
        "ts"|"tsx")
            echo "(Codice TypeScript)"
            ;;
        "json")
            if [[ "$filename" == "package-lock.json" ]]; then
                echo "(Lista dipendenze installate)"
            elif [[ "$filename" == "package.json" ]]; then
                echo "(Configurazione progetto)"
            else
                echo "(File dati JSON)"
            fi
            ;;
        "md")
            echo "(Documentazione Markdown)"
            ;;
        "sql")
            echo "(Database/Query SQL)"
            ;;
        "png"|"jpg"|"jpeg"|"gif"|"svg"|"webp")
            echo "(Immagine)"
            ;;
        "pdf")
            echo "(Documento PDF)"
            ;;
        "zip"|"tar"|"gz")
            echo "(Archivio compresso)"
            ;;
        "log")
            echo "(File di log)"
            ;;
        "backup"|"bak")
            echo "(File di backup)"
            ;;
        "env")
            echo "(Configurazione ambiente)"
            ;;
        *)
            case "$filename" in
                ".DS_Store")
                    echo "(File sistema macOS)"
                    ;;
                "yarn.lock")
                    echo "(Lock file Yarn)"
                    ;;
                *)
                    echo ""
                    ;;
            esac
            ;;
    esac
}

echo "📊 TUTTI I FILE GRANDI (superiori a 100KB):"
echo "=========================================="

# Conta i file trovati
total_files=$(find . -type f -size +100k \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./backend/node_modules/*" \
    2>/dev/null | wc -l | tr -d ' ')

echo "📈 Trovati $total_files file superiori a 100KB"
echo ""

# Trova tutti i file superiori a 100KB, escludendo node_modules e .git
find . -type f -size +100k \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./backend/node_modules/*" \
    -exec du -h {} + 2>/dev/null | \
    sort -hr | \
    head -30 | \
    while read size filepath; do
        icon=$(get_file_icon "$filepath")
        description=$(get_file_description "$filepath")
        
        # Pulisce il path per renderlo più leggibile
        clean_path=$(echo "$filepath" | sed 's|^\./||')
        
        echo "$icon $size    $clean_path $description"
    done

echo ""
echo "🎯 RIASSUNTO PER CATEGORIA:"
echo "=========================="

# Conta file per categoria
echo "🔢 Conteggio per tipo:"

# JavaScript/TypeScript
js_count=$(find . -type f -size +100k \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
    -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./backend/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
echo "   💻 $js_count file JavaScript/TypeScript"

# JSON
json_count=$(find . -type f -size +100k -name "*.json" \
    -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./backend/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
echo "   📋 $json_count file JSON"

# Markdown
md_count=$(find . -type f -size +100k -name "*.md" \
    -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./backend/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
echo "   📝 $md_count file Markdown"

# Immagini
img_count=$(find . -type f -size +100k \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" \) \
    -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./backend/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
echo "   🖼️  $img_count file immagine"

# Backup
backup_count=$(find . -type f -size +100k \( -name "*.backup" -o -name "*.bak" -o -name "*backup*" \) \
    -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./backend/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
echo "   💾 $backup_count file di backup"

echo ""
echo "🗑️  POSSIBILI FILE DA PULIRE:"
echo "============================="

# Cerca file di backup vecchi
echo "🔍 File di backup temporanei (.backup-*, *.bak):"
find . -type f -size +100k \( -name "*.backup-*" -o -name "*.bak" \) \
    -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | \
    while read file; do
        size=$(du -h "$file" 2>/dev/null | cut -f1)
        clean_path=$(echo "$file" | sed 's|^\./||')
        echo "   💾 $size    $clean_path (puoi eliminare se non serve)"
    done

# Cerca file .DS_Store
echo ""
echo "🔍 File di sistema macOS (.DS_Store):"
find . -name ".DS_Store" -size +100k 2>/dev/null | \
    while read file; do
        size=$(du -h "$file" 2>/dev/null | cut -f1)
        clean_path=$(echo "$file" | sed 's|^\./||')
        echo "   🍎 $size    $clean_path (puoi eliminare tranquillamente)"
    done

echo ""
echo "💡 CONSIGLI:"
echo "============"
echo "• File JavaScript/TypeScript grandi: Normale per il codice principale"
echo "• package-lock.json grandi: Normale, contiene tutte le dipendenze"
echo "• File .backup-*: Puoi eliminarli se sono vecchi"
echo "• File .DS_Store: Puoi eliminarli, sono creati automaticamente da macOS"
echo "• Documentazione .md: Importante, tieni sempre aggiornata"

echo ""
echo "✅ Analisi completata!"
echo "📅 $(date '+%d/%m/%Y alle %H:%M')"
echo "🎯 Trovati $total_files file superiori a 100KB"