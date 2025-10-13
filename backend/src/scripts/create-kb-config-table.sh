#!/bin/bash

echo "🔧 Aggiunta tabella KnowledgeBaseConfig allo schema Prisma..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Backup dello schema
echo "1️⃣ Backup dello schema..."
cp prisma/schema.prisma "prisma/schema.backup-KB-CONFIG-$(date +%Y%m%d-%H%M%S).prisma"

# Aggiungi il modello KnowledgeBaseConfig allo schema
cat << 'EOF' >> prisma/schema.prisma

// Configurazione Knowledge Base per professionista + sottocategoria + target audience
model KnowledgeBaseConfig {
  id                    String   @id @default(cuid())
  professionalId        String
  subcategoryId         String
  targetAudience        String   @default("professional") // 'professional' o 'client'
  
  // Limiti caratteri
  maxPerDocument        Int      @default(4000)     
  maxTotalCharacters    Int      @default(8000)     
  
  // Configurazione ricerca
  searchKeywordMinLength Int      @default(3)       
  contextBeforeKeyword  Int      @default(500)     
  contextAfterKeyword   Int      @default(500)     
  
  // Configurazione chunking
  defaultChunkSize      Int      @default(1000)    
  chunkOverlap          Int      @default(100)     
  
  // Features
  enableSmartSearch     Boolean  @default(true)    
  enableAutoProcess     Boolean  @default(false)   
  includeFullDocument   Boolean  @default(false)   
  includeMetadata       Boolean  @default(true)    
  includeFileName       Boolean  @default(true)    
  
  // Personalizzazioni prompt
  customPromptPrefix    String?  @db.Text
  customPromptSuffix    String?  @db.Text
  
  // Cache
  cacheEnabled          Boolean  @default(true)    
  cacheTTL              Int      @default(3600)    
  
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relazioni
  professional          User     @relation("ProfessionalKBConfigs", fields: [professionalId], references: [id])
  subcategory           Subcategory @relation("SubcategoryKBConfigs", fields: [subcategoryId], references: [id])
  
  @@unique([professionalId, subcategoryId, targetAudience])
  @@index([professionalId])
  @@index([subcategoryId])
  @@index([targetAudience])
}
EOF

echo ""
echo "2️⃣ Aggiunta relazioni ai modelli User e Subcategory..."

# Python script per aggiungere le relazioni
cat << 'EOF' > /tmp/add_kb_config_relations.py
import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Aggiungi relazione al modello User se non esiste
if 'knowledgeBaseConfigs' not in content:
    # Trova il modello User e aggiungi la relazione
    pattern = r'(uploadedKnowledgeBase\s+KnowledgeBase\[\]\s+@relation\("UploadedKnowledgeBase"\))'
    replacement = r'\1\n  knowledgeBaseConfigs          KnowledgeBaseConfig[]         @relation("ProfessionalKBConfigs")'
    content = re.sub(pattern, replacement, content)
    print("✅ Aggiunta relazione knowledgeBaseConfigs al modello User")

# Aggiungi relazione al modello Subcategory se non esiste
if 'SubcategoryKBConfigs' not in content:
    pattern = r'(knowledgeBase\s+KnowledgeBase\[\])'
    replacement = r'\1\n  knowledgeBaseConfigs          KnowledgeBaseConfig[]         @relation("SubcategoryKBConfigs")'
    content = re.sub(pattern, replacement, content)
    print("✅ Aggiunta relazione knowledgeBaseConfigs al modello Subcategory")

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)
EOF

python3 /tmp/add_kb_config_relations.py

echo ""
echo "3️⃣ Formattando lo schema..."
npx prisma format

echo ""
echo "4️⃣ Generando Prisma Client..."
npx prisma generate

echo ""
echo "5️⃣ Creando tabella nel database..."
npx prisma db push --skip-generate --accept-data-loss

echo ""
echo "✅ Tabella KnowledgeBaseConfig creata con successo!"
