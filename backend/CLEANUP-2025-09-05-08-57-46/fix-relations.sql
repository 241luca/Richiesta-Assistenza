-- Script per sistemare manualmente le relazioni nel file schema.prisma
-- ISTRUZIONI: Aggiungi queste righe nei punti indicati del file schema.prisma

-- 1. Nel model User (cerca 'model User' e aggiungi prima di @@index):
-- uploadedDocuments KnowledgeBaseDocument[] @relation("UploadedDocuments")
-- aiConversations AiConversation[] @relation("UserAiConversations")  
-- professionalAiCustomizations ProfessionalAiCustomization[] @relation("ProfessionalAiCustomizations")

-- 2. Nel model AssistanceRequest (aggiungi prima della chiusura }):
-- aiConversations AiConversation[]

-- 3. Nel model SubcategoryAiSettings (aggiungi prima della chiusura }):
-- aiConversations AiConversation[]
-- professionalCustomizations ProfessionalAiCustomization[]

-- Dopo aver aggiunto queste relazioni, esegui:
-- npx prisma format
-- npx prisma generate
-- npx prisma migrate dev --name add-ai-relations
