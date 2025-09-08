#!/bin/bash

echo "🔧 FIX DEFINITIVO SCHEMA PRISMA"
echo "==============================="

cd backend

# Ripristino di nuovo dal backup originale
echo "1️⃣ Ripristino backup originale..."
cp prisma/schema.prisma.backup-duplicati-20250901-164055 prisma/schema.prisma

# Script Python più intelligente che identifica esattamente i blocchi
cat << 'PYTHON_SCRIPT' > fix_schema_final.py
def fix_schema():
    with open('prisma/schema.prisma', 'r') as f:
        lines = f.readlines()
    
    # Trova linee esatte dove iniziano i modelli
    model_starts = {}
    for i, line in enumerate(lines):
        if line.strip().startswith('model NotificationChannel'):
            if 'NotificationChannel' not in model_starts:
                model_starts['NotificationChannel'] = []
            model_starts['NotificationChannel'].append(i)
        elif line.strip().startswith('model NotificationTemplate'):
            if 'NotificationTemplate' not in model_starts:
                model_starts['NotificationTemplate'] = []
            model_starts['NotificationTemplate'].append(i)
        elif line.strip().startswith('model NotificationLog'):
            if 'NotificationLog' not in model_starts:
                model_starts['NotificationLog'] = []
            model_starts['NotificationLog'].append(i)
    
    # Per ogni modello duplicato, trova dove finisce (cerca la } di chiusura)
    lines_to_remove = set()
    
    for model_name, occurrences in model_starts.items():
        if len(occurrences) > 1:
            # Rimuovi tutte le occorrenze tranne la prima
            for start_line in occurrences[1:]:
                brace_count = 0
                for i in range(start_line, len(lines)):
                    if '{' in lines[i]:
                        brace_count += lines[i].count('{')
                    if '}' in lines[i]:
                        brace_count -= lines[i].count('}')
                    lines_to_remove.add(i)
                    if brace_count == 0 and i > start_line:
                        break
    
    # Crea nuovo contenuto senza le righe duplicate
    new_lines = [lines[i] for i in range(len(lines)) if i not in lines_to_remove]
    
    # Scrivi il file pulito
    with open('prisma/schema.prisma', 'w') as f:
        f.writelines(new_lines)
    
    print(f"✅ Rimosse {len(lines_to_remove)} righe")
    print(f"📄 Schema: {len(new_lines)} righe (prima: {len(lines)})")
    
    # Mostra i modelli trovati
    for model, occurrences in model_starts.items():
        print(f"   {model}: trovato alle righe {occurrences}")

fix_schema()
PYTHON_SCRIPT

echo "2️⃣ Esecuzione fix..."
python3 fix_schema_final.py
rm fix_schema_final.py

echo ""
echo "3️⃣ Controllo risultato:"
echo "======================="
for model in NotificationChannel NotificationTemplate NotificationLog; do
    count=$(grep -c "^model $model" prisma/schema.prisma)
    echo "$model: $count occorrenze"
done

echo ""
echo "4️⃣ Validazione Prisma:"
npx prisma validate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema valido!"
    echo ""
    echo "5️⃣ Generazione Client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SUCCESSO COMPLETO!"
    fi
else
    echo ""
    echo "❌ Ancora problemi. Provo approccio alternativo..."
    
    # Se ancora non funziona, prova a rigenerare lo schema dal database
    echo ""
    echo "6️⃣ Tentativo di pull dal database:"
    npx prisma db pull --force
fi
