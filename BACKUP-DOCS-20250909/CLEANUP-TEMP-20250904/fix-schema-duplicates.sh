#!/bin/bash

echo "🔧 RIMOZIONE DUPLICATI SCHEMA PRISMA"
echo "===================================="

cd backend

# Backup di sicurezza prima di modificare
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp prisma/schema.prisma "prisma/schema.prisma.backup-duplicati-$TIMESTAMP"
echo "✅ Backup creato: prisma/schema.prisma.backup-duplicati-$TIMESTAMP"

# Creo uno script Python per rimuovere i duplicati (più sicuro di sed)
cat << 'PYTHON_SCRIPT' > remove_duplicates.py
import sys

def remove_duplicate_models():
    with open('prisma/schema.prisma', 'r') as f:
        lines = f.readlines()
    
    # Modelli da rimuovere (le seconde occorrenze)
    ranges_to_remove = [
        (913, 953),   # NotificationChannel duplicato (righe 914-954 circa)
        (963, 1011),  # NotificationTemplate duplicato (righe 964-1012 circa)  
        (1012, 1041)  # NotificationLog duplicato (righe 1013 fino alla fine)
    ]
    
    # Creo nuovo contenuto saltando le righe duplicate
    new_lines = []
    for i, line in enumerate(lines, 1):
        skip = False
        for start, end in ranges_to_remove:
            if start <= i <= end:
                skip = True
                break
        if not skip:
            new_lines.append(line)
    
    # Scrivo il file pulito
    with open('prisma/schema.prisma', 'w') as f:
        f.writelines(new_lines)
    
    print(f"✅ Rimosse {len(lines) - len(new_lines)} righe duplicate")
    print(f"📄 Schema ora ha {len(new_lines)} righe (prima: {len(lines)})")

remove_duplicate_models()
PYTHON_SCRIPT

# Eseguo lo script Python
python3 remove_duplicates.py

# Rimuovo lo script temporaneo
rm remove_duplicates.py

echo ""
echo "🔍 Verifica modelli dopo la pulizia:"
echo "===================================="
grep -c "^model NotificationChannel" prisma/schema.prisma && echo "NotificationChannel: $(grep -c "^model NotificationChannel" prisma/schema.prisma) occorrenze"
grep -c "^model NotificationTemplate" prisma/schema.prisma && echo "NotificationTemplate: $(grep -c "^model NotificationTemplate" prisma/schema.prisma) occorrenze"
grep -c "^model NotificationLog" prisma/schema.prisma && echo "NotificationLog: $(grep -c "^model NotificationLog" prisma/schema.prisma) occorrenze"

echo ""
echo "📐 Validazione schema Prisma:"
npx prisma validate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema validato con successo!"
    echo ""
    echo "🔄 Generazione Prisma Client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Prisma Client generato con successo!"
    else
        echo "❌ Errore nella generazione del client"
    fi
else
    echo "❌ Schema non valido, controllare errori"
fi
