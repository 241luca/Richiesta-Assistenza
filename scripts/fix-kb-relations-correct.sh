#!/bin/bash

echo "🔧 Fixing relazioni Prisma per KnowledgeBaseConfig..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Python script per sistemare le relazioni
cat << 'EOF' > /tmp/fix_kb_relations_correct.py
import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Rimuovi le relazioni errate se esistono
content = re.sub(r'\s+KnowledgeBaseConfig\s+KnowledgeBaseConfig\[\]', '', content)
content = re.sub(r'\s+knowledgeBaseConfigs\s+KnowledgeBaseConfig\[\]\s+@relation\("SubcategoryKBConfigs"\)', '', content)

# Trova il modello Subcategory e aggiungi la relazione corretta
if 'knowledgeBaseConfigs' not in content:
    # Trova la linea con knowledgeBase e aggiungi dopo
    pattern = r'(knowledgeBase\s+KnowledgeBase\[\])'
    replacement = r'\1\n  knowledgeBaseConfigs          KnowledgeBaseConfig[]         @relation("SubcategoryKBConfigs")'
    content = re.sub(pattern, replacement, content)
    print("✅ Aggiunta relazione knowledgeBaseConfigs al modello Subcategory")

# Salva il file
with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("✅ Relazioni sistemate!")
EOF

echo "1️⃣ Sistemando le relazioni..."
python3 /tmp/fix_kb_relations_correct.py

echo ""
echo "2️⃣ Formattando lo schema..."
npx prisma format

echo ""
echo "3️⃣ Generando Prisma Client..."
npx prisma generate

echo ""
echo "4️⃣ Pushing al database..."
npx prisma db push --skip-generate

echo ""
echo "✅ Schema sistemato e tabella creata!"
