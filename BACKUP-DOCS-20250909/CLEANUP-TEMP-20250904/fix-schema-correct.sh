#!/bin/bash

echo "🔄 RIPRISTINO E FIX CORRETTO SCHEMA"
echo "===================================="

cd backend

# Ripristino dal backup più recente
echo "1️⃣ Ripristino dal backup..."
cp prisma/schema.prisma.backup-duplicati-20250901-164055 prisma/schema.prisma
echo "✅ Schema ripristinato"

# Nuovo script Python più preciso
cat << 'PYTHON_SCRIPT' > fix_schema_correctly.py
def fix_schema():
    with open('prisma/schema.prisma', 'r') as f:
        content = f.read()
    
    # Trova le posizioni esatte dei modelli duplicati
    import re
    
    # Pattern per trovare modelli completi (dal "model" fino alla "}")
    model_pattern = r'model\s+(NotificationChannel|NotificationTemplate|NotificationLog)\s*\{[^}]*\}'
    
    matches = list(re.finditer(model_pattern, content, re.DOTALL))
    
    # Tieni solo la prima occorrenza di ogni modello
    seen = set()
    to_remove = []
    
    for match in matches:
        model_name = match.group(1)
        if model_name in seen:
            # È un duplicato, marca per rimozione
            to_remove.append((match.start(), match.end()))
        else:
            seen.add(model_name)
    
    # Rimuovi i duplicati (dal fondo per non alterare gli indici)
    for start, end in reversed(to_remove):
        content = content[:start] + content[end:]
    
    # Pulisci righe vuote multiple
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    with open('prisma/schema.prisma', 'w') as f:
        f.write(content)
    
    print(f"✅ Rimossi {len(to_remove)} modelli duplicati")
    return len(to_remove)

result = fix_schema()
PYTHON_SCRIPT

echo "2️⃣ Rimozione duplicati..."
python3 fix_schema_correctly.py
rm fix_schema_correctly.py

echo ""
echo "3️⃣ Verifica modelli:"
echo "===================="
echo "NotificationChannel: $(grep -c "^model NotificationChannel" prisma/schema.prisma) occorrenze"
echo "NotificationTemplate: $(grep -c "^model NotificationTemplate" prisma/schema.prisma) occorrenze"
echo "NotificationLog: $(grep -c "^model NotificationLog" prisma/schema.prisma) occorrenze"

echo ""
echo "4️⃣ Validazione schema:"
npx prisma validate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema valido!"
    echo ""
    echo "5️⃣ Generazione Prisma Client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ TUTTO SISTEMATO! Prisma Client generato con successo!"
    fi
else
    echo "❌ Ancora errori nello schema"
fi
