#!/bin/bash

# Script per aggiungere le relazioni AI mancanti

# Backup prima di modificare
cp prisma/schema.prisma prisma/schema.backup-before-ai-relations.prisma

# 1. Aggiungi relazioni al model User (prima di @@index)
sed -i '' '573i\
  // AI Relations\
  uploadedDocuments            KnowledgeBaseDocument[] @relation("UploadedDocuments")\
  aiConversations              AiConversation[] @relation("UserAiConversations")\
  professionalAiCustomizations ProfessionalAiCustomization[] @relation("ProfessionalAiCustomizations")\
' prisma/schema.prisma

echo 'Relazioni AI aggiunte al model User'

# 2. Trova e aggiungi relazione al model AssistanceRequest
ASSIST_LINE=\$(grep -n 'model AssistanceRequest {' prisma/schema.prisma | cut -d: -f1)
ASSIST_END=\$(awk "NR>\${ASSIST_LINE} && /^}/ {print NR; exit}" prisma/schema.prisma)
sed -i '' "\${ASSIST_END}i\\
  // AI Relations\\
  aiConversations AiConversation[]\\
" prisma/schema.prisma

echo 'Relazioni AI aggiunte al model AssistanceRequest'

# 3. Trova e aggiungi relazioni al model SubcategoryAiSettings
SUBCAT_LINE=\$(grep -n 'model SubcategoryAiSettings {' prisma/schema.prisma | cut -d: -f1)
SUBCAT_END=\$(awk "NR>\${SUBCAT_LINE} && /^}/ {print NR; exit}" prisma/schema.prisma)
sed -i '' "\${SUBCAT_END}i\\
  // AI Relations\\
  aiConversations AiConversation[]\\
  professionalCustomizations ProfessionalAiCustomization[]\\
" prisma/schema.prisma

echo 'Relazioni AI aggiunte al model SubcategoryAiSettings'

echo 'Tutte le relazioni AI sono state aggiunte!'
