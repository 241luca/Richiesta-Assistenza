#!/bin/bash

echo "🔧 Fixing KnowledgeBase schema relations properly..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Backup del file schema
echo "1️⃣ Creating backup..."
cp prisma/schema.prisma "prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma"

echo "2️⃣ Adding missing relations to schema.prisma..."

# Aggiungiamo le relazioni al modello User se non esistono già
# Cerchiamo la fine del modello User (prima della chiusura })
# e aggiungiamo le relazioni per KnowledgeBase

cat << 'EOF' > /tmp/add_kb_relations.py
import re

# Leggi il file schema.prisma
with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Verifica se le relazioni esistono già
if 'professionalKnowledgeBase' not in content:
    # Trova il modello User e aggiungi le relazioni prima della chiusura
    # Trova l'ultima relazione nel modello User (professionData)
    pattern = r'(professionData\s+Profession\?\s+@relation\([^)]+\))'
    
    replacement = r'\1\n  professionalKnowledgeBase     KnowledgeBase[]               @relation("ProfessionalKnowledgeBase")\n  uploadedKnowledgeBase         KnowledgeBase[]               @relation("UploadedKnowledgeBase")'
    
    content = re.sub(pattern, replacement, content)
    print("Added KnowledgeBase relations to User model")
else:
    print("KnowledgeBase relations already exist in User model")

# Verifica e aggiungi relazione a Subcategory
if 'knowledgeBase' not in content or not re.search(r'Subcategory.*knowledgeBase\s+KnowledgeBase\[\]', content, re.DOTALL):
    # Trova il modello Subcategory e aggiungi la relazione
    pattern = r'(model Subcategory \{[^}]+aiSettings\s+SubcategoryAiSettings\?)'
    replacement = r'\1\n  knowledgeBase                 KnowledgeBase[]'
    
    content = re.sub(pattern, replacement, content)
    print("Added KnowledgeBase relation to Subcategory model")
else:
    print("KnowledgeBase relation already exists in Subcategory model")

# Scrivi il file aggiornato
with open('prisma/schema.prisma', 'w') as f:
    f.write(content)
    
print("Schema updated successfully!")
EOF

python3 /tmp/add_kb_relations.py

echo ""
echo "3️⃣ Running Prisma format..."
npx prisma format

echo ""
echo "4️⃣ Generating Prisma Client..."
npx prisma generate

echo ""
echo "5️⃣ Pushing to database..."
npx prisma db push --skip-generate

echo ""
echo "✅ Knowledge Base table created successfully!"
echo ""
echo "🚀 Now restart the backend:"
echo "   cd backend"
echo "   npm run dev"
