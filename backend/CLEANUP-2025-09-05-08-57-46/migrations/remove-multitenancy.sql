-- =====================================================
-- SCRIPT RIMOZIONE MULTI-TENANCY
-- Sistema Richiesta Assistenza
-- Data: 25 Gennaio 2025
-- =====================================================

-- IMPORTANTE: Eseguire SEMPRE un backup completo prima di questo script!
-- pg_dump assistenza_db > backup_prima_rimozione.sql

BEGIN;

-- =====================================================
-- STEP 1: BACKUP DELLE TABELLE PRINCIPALI
-- =====================================================

-- Crea tabelle di backup (solo se non esistono già)
CREATE TABLE IF NOT EXISTS "User_backup_20250125" AS SELECT * FROM "User";
CREATE TABLE IF NOT EXISTS "Category_backup_20250125" AS SELECT * FROM "Category";
CREATE TABLE IF NOT EXISTS "AssistanceRequest_backup_20250125" AS SELECT * FROM "AssistanceRequest";
CREATE TABLE IF NOT EXISTS "Quote_backup_20250125" AS SELECT * FROM "Quote";
CREATE TABLE IF NOT EXISTS "ApiKey_backup_20250125" AS SELECT * FROM "ApiKey";

-- =====================================================
-- STEP 2: RIMUOVI FOREIGN KEY CONSTRAINTS
-- =====================================================

-- User
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";

-- Category
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_organizationId_fkey";

-- AssistanceRequest
ALTER TABLE "AssistanceRequest" DROP CONSTRAINT IF EXISTS "AssistanceRequest_organizationId_fkey";

-- Quote
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_organizationId_fkey";

-- Payment
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_organizationId_fkey";

-- Notification
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_organizationId_fkey";

-- Message
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_organizationId_fkey";

-- ApiKey
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_organizationId_fkey";
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_service_organizationId_key";

-- =====================================================
-- STEP 3: RIMUOVI INDICI RELATIVI A organizationId
-- =====================================================

DROP INDEX IF EXISTS "User_organizationId_idx";
DROP INDEX IF EXISTS "Category_organizationId_idx";
DROP INDEX IF EXISTS "Category_organizationId_slug_key";
DROP INDEX IF EXISTS "AssistanceRequest_organizationId_idx";
DROP INDEX IF EXISTS "Quote_organizationId_idx";
DROP INDEX IF EXISTS "Payment_organizationId_idx";
DROP INDEX IF EXISTS "Notification_organizationId_idx";
DROP INDEX IF EXISTS "Message_organizationId_idx";
DROP INDEX IF EXISTS "ApiKey_organizationId_idx";

-- =====================================================
-- STEP 4: RIMUOVI COLONNE organizationId
-- =====================================================

-- User
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId";

-- Category
ALTER TABLE "Category" DROP COLUMN IF EXISTS "organizationId";

-- Subcategory (non ha organizationId, ma verifichiamo)
-- Non necessario

-- AssistanceRequest
ALTER TABLE "AssistanceRequest" DROP COLUMN IF EXISTS "organizationId";

-- Quote
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "organizationId";

-- Payment
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "organizationId";

-- Notification
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "organizationId";

-- Message
ALTER TABLE "Message" DROP COLUMN IF EXISTS "organizationId";

-- ApiKey - Importante: modificare anche il constraint unique
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "organizationId";

-- =====================================================
-- STEP 5: MODIFICA CONSTRAINTS PER ApiKey
-- =====================================================

-- ApiKey ora deve avere service come unique (non più service + organizationId)
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_service_key" UNIQUE ("service");

-- =====================================================
-- STEP 6: AGGIUNGI CAMPI MANCANTI (dalla documentazione)
-- =====================================================

-- Category: aggiungi textColor se non esiste
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "textColor" TEXT DEFAULT '#FFFFFF';

-- =====================================================
-- STEP 7: CREA TABELLE KNOWLEDGE BASE (se non esistono)
-- =====================================================

-- KbDocument
CREATE TABLE IF NOT EXISTS "KbDocument" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "textLength" INTEGER,
    "chunkCount" INTEGER,
    "errorMessage" TEXT,
    "subcategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbDocument_pkey" PRIMARY KEY ("id")
);

-- KbDocumentChunk
CREATE TABLE IF NOT EXISTS "KbDocumentChunk" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbDocumentChunk_pkey" PRIMARY KEY ("id")
);

-- Aggiungi foreign keys per Knowledge Base
ALTER TABLE "KbDocument" 
    ADD CONSTRAINT "KbDocument_subcategoryId_fkey" 
    FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KbDocumentChunk" 
    ADD CONSTRAINT "KbDocumentChunk_documentId_fkey" 
    FOREIGN KEY ("documentId") REFERENCES "KbDocument"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Aggiungi indici per Knowledge Base
CREATE INDEX IF NOT EXISTS "KbDocument_subcategoryId_idx" ON "KbDocument"("subcategoryId");
CREATE INDEX IF NOT EXISTS "KbDocument_processingStatus_idx" ON "KbDocument"("processingStatus");
CREATE INDEX IF NOT EXISTS "KbDocumentChunk_documentId_idx" ON "KbDocumentChunk"("documentId");
CREATE INDEX IF NOT EXISTS "KbDocumentChunk_chunkIndex_idx" ON "KbDocumentChunk"("chunkIndex");

-- =====================================================
-- STEP 8: ELIMINA TABELLA Organization
-- =====================================================

DROP TABLE IF EXISTS "Organization" CASCADE;

-- =====================================================
-- STEP 9: RICREA INDICI NECESSARI
-- =====================================================

-- Category
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE INDEX IF NOT EXISTS "Category_isActive_idx" ON "Category"("isActive");

-- ApiKey
CREATE INDEX IF NOT EXISTS "ApiKey_service_idx" ON "ApiKey"("service");

-- =====================================================
-- VERIFICA FINALE
-- =====================================================

-- Conta record per verificare che i dati siano ancora presenti
DO $$
DECLARE
    user_count INTEGER;
    category_count INTEGER;
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "User";
    SELECT COUNT(*) INTO category_count FROM "Category";
    SELECT COUNT(*) INTO request_count FROM "AssistanceRequest";
    
    RAISE NOTICE 'Utenti totali: %', user_count;
    RAISE NOTICE 'Categorie totali: %', category_count;
    RAISE NOTICE 'Richieste totali: %', request_count;
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- Dopo aver eseguito questo script:
-- 1. Eseguire: npx prisma db pull (per sincronizzare lo schema)
-- 2. Eseguire: npx prisma generate (per rigenerare il client)
-- 3. Riavviare il backend
-- 4. Testare tutte le funzionalità
