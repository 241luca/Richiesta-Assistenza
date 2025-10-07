#!/bin/bash

# Script per riordinare i file sparsi nel progetto
# Creato per Richiesta-Assistenza
# Data: $(date +%Y-%m-%d)

echo "🧹 SCRIPT RIORDINO PROGETTO - Iniziando..."
echo "================================================"

# Cartella di lavoro
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Contatori per statistiche
count_md_spostati=0
count_backup_spostati=0

echo "📁 Creazione cartelle necessarie..."

# Crea cartella sparsi in DOCUMENTAZIONE se non esiste
if [ ! -d "DOCUMENTAZIONE/sparsi" ]; then
    mkdir -p "DOCUMENTAZIONE/sparsi"
    echo "✅ Creata cartella: DOCUMENTAZIONE/sparsi/"
else
    echo "ℹ️  Cartella DOCUMENTAZIONE/sparsi/ già esistente"
fi

# Crea cartella backup_fix nella root se non esiste
if [ ! -d "backup_fix" ]; then
    mkdir -p "backup_fix"
    echo "✅ Creata cartella: backup_fix/"
else
    echo "ℹ️  Cartella backup_fix/ già esistente"
fi

echo ""
echo "📋 FASE 1: Spostamento file .md non autorizzati nella root"
echo "============================================================"

# File .md autorizzati nella root (NON spostare questi)
authorized_md=(
    "README.md"
    "CHANGELOG.md" 
    "ISTRUZIONI-PROGETTO.md"
    "LEGGIMI-DOCUMENTAZIONE.md"
)

# Funzione per verificare se un file è autorizzato
is_authorized() {
    local file=$1
    for auth_file in "${authorized_md[@]}"; do
        if [ "$file" = "$auth_file" ]; then
            return 0  # autorizzato
        fi
    done
    return 1  # non autorizzato
}

# Sposta tutti i file .md non autorizzati
for file in *.md; do
    if [ -f "$file" ]; then
        if ! is_authorized "$file"; then
            echo "📄 Spostando: $file → DOCUMENTAZIONE/sparsi/"
            mv "$file" "DOCUMENTAZIONE/sparsi/"
            ((count_md_spostati++))
        else
            echo "✅ Mantenuto nella root: $file (autorizzato)"
        fi
    fi
done

echo ""
echo "🔧 FASE 2: Spostamento file backup, script e utility"
echo "===================================================="

# Files/pattern specifici da NON spostare (eccezioni)
exceptions=(
    "ordina_progetto.sh"
    ".env.example"
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "tailwind.config.js"
    "vite.config.ts"
    "vitest.config.ts"
    "postcss.config.js"
    "playwright.config.ts"
    "nodemon.json"
    "index.html"
    "Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
)

# Funzione per verificare se un file è un'eccezione
is_exception() {
    local file=$1
    for exception in "${exceptions[@]}"; do
        if [ "$file" = "$exception" ]; then
            return 0  # è un'eccezione, non spostare
        fi
    done
    return 1  # non è un'eccezione, può essere spostato
}

# Lista specifica di file da spostare (più sicuro dei pattern)
files_to_move=(
    $(ls *.backup-* 2>/dev/null)
    $(ls *.sql 2>/dev/null)
    $(ls *.pid 2>/dev/null)
    $(ls *.tar.gz 2>/dev/null)
    $(ls test-* 2>/dev/null)
    $(ls check-* 2>/dev/null)
    $(ls fix-* 2>/dev/null)
    $(ls debug-* 2>/dev/null)
    $(ls backup* 2>/dev/null)
    $(ls analyze-* 2>/dev/null)
    $(ls verify-* 2>/dev/null)
    $(ls update-* 2>/dev/null)
    $(ls install-* 2>/dev/null)
    $(ls setup-* 2>/dev/null)
    $(ls populate-* 2>/dev/null)
    $(ls create-* 2>/dev/null)
    $(ls add-* 2>/dev/null)
    $(ls remove-* 2>/dev/null)
    $(ls clean* 2>/dev/null)
    $(ls diagnose* 2>/dev/null)
    $(ls monitor-* 2>/dev/null)
    $(ls crea-* 2>/dev/null)
    $(ls modifica-* 2>/dev/null)
    $(ls count-* 2>/dev/null)
    $(ls compare-* 2>/dev/null)
    $(ls configure-* 2>/dev/null)
    $(ls connect-* 2>/dev/null)
    $(ls download-* 2>/dev/null)
    $(ls emergency-* 2>/dev/null)
    $(ls final-* 2>/dev/null)
    $(ls find-* 2>/dev/null)
    $(ls generate-* 2>/dev/null)
    $(ls get-* 2>/dev/null)
    $(ls init-* 2>/dev/null)
    $(ls initialize-* 2>/dev/null)
    $(ls manual-* 2>/dev/null)
    $(ls migrate-* 2>/dev/null)
    $(ls patch-* 2>/dev/null)
    $(ls refresh-* 2>/dev/null)
    $(ls register-* 2>/dev/null)
    $(ls reset-* 2>/dev/null)
    $(ls restart-* 2>/dev/null)
    $(ls restore-* 2>/dev/null)
    $(ls show-* 2>/dev/null)
    $(ls start-* 2>/dev/null)
    $(ls sync-* 2>/dev/null)
    $(ls temp_* 2>/dev/null)
    $(ls *.txt 2>/dev/null)
    $(ls *.patch 2>/dev/null)
    $(ls *.mjs 2>/dev/null)
    $(ls *.cjs 2>/dev/null)
    $(ls *.py 2>/dev/null)
    $(ls whatsapp-* 2>/dev/null)
)

# Sposta i file specifici
for file in "${files_to_move[@]}"; do
    if [ -f "$file" ] && ! is_exception "$file"; then
        echo "🔧 Spostando: $file → backup_fix/"
        mv "$file" "backup_fix/"
        ((count_backup_spostati++))
    fi
done

# Script .sh specifici da spostare (escluso questo script)
for file in *.sh; do
    if [ -f "$file" ] && [ "$file" != "ordina_progetto.sh" ]; then
        echo "🔧 Spostando script: $file → backup_fix/"
        mv "$file" "backup_fix/"
        ((count_backup_spostati++))
    fi
done

# File .ts utility (non di configurazione)
for file in *.ts; do
    if [ -f "$file" ] && ! is_exception "$file"; then
        echo "🔧 Spostando: $file → backup_fix/"
        mv "$file" "backup_fix/"
        ((count_backup_spostati++))
    fi
done

# File .js di test
for file in *.js; do
    if [ -f "$file" ] && ! is_exception "$file"; then
        echo "🔧 Spostando: $file → backup_fix/"
        mv "$file" "backup_fix/"
        ((count_backup_spostati++))
    fi
done

echo ""
echo "📁 FASE 3: Spostamento cartelle backup e temporanee"
echo "=================================================="

# Cartelle da spostare
backup_dirs=(
    "backups"
    "backup-portfolio-20250104"
    "temp"
    "logs"
    "reports"
    "test-results"
    "tokens"
    "migrations" 
    "calendario"
    "shared"
    "templates"
    "vps-scripts"
    "tests-backup"
    "database-population"
    "documenti-legali-completi"
    "documenti-legali-finali"
)

for dir in "${backup_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "📁 Spostando cartella: $dir → backup_fix/"
        mv "$dir" "backup_fix/"
        ((count_backup_spostati++))
    fi
done

# Cartelle con pattern backup
for dir in src.backup-* backend.ori backup-*; do
    if [ -d "$dir" ]; then
        echo "📁 Spostando cartella: $dir → backup_fix/"
        mv "$dir" "backup_fix/"
        ((count_backup_spostati++))
    fi
done

echo ""
echo "✅ OPERAZIONE COMPLETATA!"
echo "========================"
echo "📊 STATISTICHE:"
echo "   📄 File .md spostati in DOCUMENTAZIONE/sparsi/: $count_md_spostati"
echo "   🔧 File/cartelle spostati in backup_fix/: $count_backup_spostati"
echo ""
echo "📁 STRUTTURA FINALE:"
echo "   ✅ Root: Solo file essenziali autorizzati"
echo "   ✅ DOCUMENTAZIONE/sparsi/: File .md non autorizzati"
echo "   ✅ backup_fix/: File backup, script e temporanei"
echo ""
echo "🎉 Progetto riordinato con successo!"
echo ""
echo "💡 SUGGERIMENTO: Controlla le cartelle create per verificare che tutto sia OK"
echo "   👉 DOCUMENTAZIONE/sparsi/"
echo "   👉 backup_fix/"
