#!/bin/bash

echo "🔧 Fix DEFINITIVO relazioni KnowledgeBaseConfig..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Script Python per sistemare definitivamente
cat << 'EOF' > /tmp/fix_kb_final.py
import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# 1. Rimuovi TUTTE le relazioni errate esistenti
# Rimuovi KnowledgeBaseConfig come campo (senza s)
content = re.sub(r'\n\s+KnowledgeBaseConfig\s+KnowledgeBaseConfig\[\].*', '', content)

# 2. Trova il modello Subcategory e sistema la relazione
# Cerca il pattern del modello Subcategory
subcategory_match = re.search(
    r'(model Subcategory \{[^}]+)(knowledgeBase\s+KnowledgeBase\[\])',
    content,
    re.DOTALL
)

if subcategory_match:
    # Controlla se knowledgeBaseConfigs esiste già
    if 'knowledgeBaseConfigs' not in subcategory_match.group(1):
        # Aggiungi la relazione corretta dopo knowledgeBase
        before = subcategory_match.group(1)
        kb_line = subcategory_match.group(2)
        
        # Aggiungi la relazione con il nome CORRETTO (con la 's' finale)
        new_content = before + kb_line + '\n  knowledgeBaseConfigs          KnowledgeBaseConfig[]         @relation("SubcategoryKBConfigs")'
        
        # Sostituisci nel contenuto
        content = content.replace(
            subcategory_match.group(0),
            new_content
        )
        print("✅ Aggiunta relazione knowledgeBaseConfigs (con S) al modello Subcategory")
    else:
        print("ℹ️ Relazione knowledgeBaseConfigs già presente")
else:
    print("⚠️ Modello Subcategory non trovato nel formato atteso")

# 3. Verifica che il modello User abbia la relazione corretta
if 'knowledgeBaseConfigs' not in content:
    # Trova uploadedKnowledgeBase nel modello User e aggiungi dopo
    pattern = r'(uploadedKnowledgeBase\s+KnowledgeBase\[\]\s+@relation\("UploadedKnowledgeBase"\))'
    if re.search(pattern, content):
        replacement = r'\1\n  knowledgeBaseConfigs          KnowledgeBaseConfig[]         @relation("ProfessionalKBConfigs")'
        content = re.sub(pattern, replacement, content)
        print("✅ Aggiunta relazione knowledgeBaseConfigs al modello User")

# Salva il file
with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("✅ Schema sistemato!")
EOF

echo "1️⃣ Eseguendo fix Python..."
python3 /tmp/fix_kb_final.py

echo ""
echo "2️⃣ Formattando lo schema..."
npx prisma format || true

echo ""
echo "3️⃣ Generando Prisma Client..."
npx prisma generate

echo ""
echo "4️⃣ Pushing al database..."
npx prisma db push --skip-generate

echo ""
echo "✅ COMPLETATO!"
echo ""
echo "Riavvia il backend con:"
echo "  cd backend"
echo "  npm run dev"
