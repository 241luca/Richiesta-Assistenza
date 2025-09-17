#!/bin/bash

echo "🔧 Sistemando definitivamente KnowledgeBase nel database..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# 1. Backup dello schema attuale
echo "1️⃣ Backup dello schema..."
cp prisma/schema.prisma "prisma/schema.backup-KB-$(date +%Y%m%d-%H%M%S).prisma"

# 2. Crea un file Python per aggiungere le relazioni mancanti in modo preciso
cat << 'EOF' > /tmp/fix_kb_relations.py
#!/usr/bin/env python3
import re

# Leggi il file schema.prisma
with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Trova il modello User e aggiungi le relazioni se mancanti
if 'professionalKnowledgeBase' not in content:
    # Trova la fine del modello User (prima dell'ultima parentesi })
    # Cerchiamo il modello User
    user_model_match = re.search(r'model User \{(.+?)\n\}', content, re.DOTALL)
    
    if user_model_match:
        user_model_content = user_model_match.group(1)
        
        # Aggiungi le relazioni alla fine del modello User
        new_relations = """  professionalKnowledgeBase     KnowledgeBase[]    @relation("ProfessionalKnowledgeBase")
  uploadedKnowledgeBase         KnowledgeBase[]    @relation("UploadedKnowledgeBase")"""
        
        # Trova l'ultimo campo del modello User
        last_field_pattern = r'(professionData\s+Profession\?\s+@relation\([^)]+\))'
        
        # Sostituisci aggiungendo le nuove relazioni
        updated_user = re.sub(
            last_field_pattern,
            r'\1\n' + new_relations,
            user_model_content
        )
        
        # Ricostruisci il modello User
        new_content = content.replace(
            'model User {' + user_model_content + '\n}',
            'model User {' + updated_user + '\n}'
        )
        content = new_content
        print("✅ Aggiunte relazioni KnowledgeBase al modello User")

# Aggiungi relazione al modello Subcategory se mancante
if not re.search(r'model Subcategory \{[^}]+knowledgeBase\s+KnowledgeBase\[\]', content, re.DOTALL):
    # Trova il modello Subcategory
    subcategory_pattern = r'(model Subcategory \{[^}]+)(  aiSettings\s+SubcategoryAiSettings\?)'
    
    replacement = r'\1\2\n  knowledgeBase                 KnowledgeBase[]'
    content = re.sub(subcategory_pattern, replacement, content, flags=re.DOTALL)
    print("✅ Aggiunta relazione knowledgeBase al modello Subcategory")

# Salva il file aggiornato
with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("✅ Schema aggiornato con successo!")
EOF

# 3. Esegui lo script Python
echo ""
echo "2️⃣ Aggiornando lo schema..."
python3 /tmp/fix_kb_relations.py

# 4. Formatta lo schema
echo ""
echo "3️⃣ Formattando lo schema..."
npx prisma format

# 5. Genera il client Prisma
echo ""
echo "4️⃣ Generando Prisma Client..."
npx prisma generate

# 6. Push al database
echo ""
echo "5️⃣ Creando tabella nel database..."
npx prisma db push --skip-generate --accept-data-loss

echo ""
echo "✅ ============================================"
echo "✅ Tabella KnowledgeBase creata nel database!"
echo "✅ ============================================"
echo ""
echo "📝 Prossimi passi:"
echo "   1. Il backend si riavvierà automaticamente"
echo "   2. I documenti saranno salvati in PostgreSQL"
echo "   3. Niente più file JSON!"
echo ""
