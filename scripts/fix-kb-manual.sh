#!/bin/bash

echo "🔧 Fixing KnowledgeBase relations manually..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Prima facciamo un backup dello schema
echo "1️⃣ Creating backup of schema.prisma..."
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

# Rimuoviamo il modello KnowledgeBase se esiste e lo ricreiamo pulito
echo "2️⃣ Cleaning and recreating KnowledgeBase model..."

# Usa sed per rimuovere eventuali duplicati nel modello User
sed -i '' '/^[[:space:]]*KnowledgeBase[[:space:]]*KnowledgeBase\[\]/d' prisma/schema.prisma

# Aggiungiamo le relazioni corrette al modello User se non esistono
cat >> prisma/schema_temp.txt << 'EOF'

# KNOWLEDGE BASE RELATIONS TO ADD TO USER MODEL:
# professionalKnowledgeBase     KnowledgeBase[]    @relation("ProfessionalKnowledgeBase")
# uploadedKnowledgeBase         KnowledgeBase[]    @relation("UploadedKnowledgeBase")

# KNOWLEDGE BASE RELATION TO ADD TO SUBCATEGORY MODEL:
# knowledgeBase                 KnowledgeBase[]
EOF

echo ""
echo "3️⃣ Please manually add these relations:"
echo ""
echo "📝 In the User model, add these two lines (if not already present):"
echo "   professionalKnowledgeBase     KnowledgeBase[]    @relation(\"ProfessionalKnowledgeBase\")"
echo "   uploadedKnowledgeBase         KnowledgeBase[]    @relation(\"UploadedKnowledgeBase\")"
echo ""
echo "📝 In the Subcategory model, add this line (if not already present):"
echo "   knowledgeBase                 KnowledgeBase[]"
echo ""
echo "4️⃣ After adding the relations manually, run:"
echo "   npx prisma format"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo ""
echo "💡 Or use the simpler solution below..."
