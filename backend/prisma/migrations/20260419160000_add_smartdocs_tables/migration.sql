
-- CreateEnum
CREATE TYPE "public"."ContainerOwnerType" AS ENUM ('CLIENT', 'PROFESSIONAL', 'COMPANY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."StorageProvider" AS ENUM ('LOCAL', 'S3', 'S3_COMPATIBLE', 'AZURE', 'GCS', 'DROPBOX', 'GDRIVE', 'ONEDRIVE', 'BACKBLAZE', 'WASABI');

-- CreateTable
CREATE TABLE "public"."DocumentContainer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "ownerId" TEXT NOT NULL,
    "ownerType" "public"."ContainerOwnerType" NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT DEFAULT 'gpt-4',
    "aiPrompt" TEXT,
    "aiObjective" TEXT,
    "ragEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ragChunkSize" INTEGER DEFAULT 1000,
    "ragOverlap" INTEGER DEFAULT 200,
    "ragModel" TEXT DEFAULT 'text-embedding-ada-002',
    "autoProcess" BOOLEAN NOT NULL DEFAULT true,
    "autoClassify" BOOLEAN NOT NULL DEFAULT true,
    "autoExtract" BOOLEAN NOT NULL DEFAULT true,
    "autoNotify" BOOLEAN NOT NULL DEFAULT false,
    "processedDocs" INTEGER NOT NULL DEFAULT 0,
    "lastProcessed" TIMESTAMP(3),
    "storageProvider" "public"."StorageProvider" NOT NULL DEFAULT 'LOCAL',
    "storageConfigId" TEXT,
    "storagePath" TEXT,
    "storageRegion" TEXT,
    "storageClass" TEXT DEFAULT 'STANDARD',
    "enableVersioning" BOOLEAN NOT NULL DEFAULT false,
    "enableEncryption" BOOLEAN NOT NULL DEFAULT true,
    "encryptionKey" TEXT,
    "lifecycleRules" JSONB,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupProvider" "public"."StorageProvider",
    "backupConfigId" TEXT,
    "maxStorageGB" INTEGER,
    "currentStorageGB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "containerId" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "number" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentContainerLink" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "customTitle" TEXT,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,

    CONSTRAINT "DocumentContainerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentSectionLink" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSectionLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentContainerShare" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "notifyOnUpdate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentContainerShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentShare" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canDownload" BOOLEAN NOT NULL DEFAULT true,
    "canPrint" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StorageConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "public"."StorageProvider" NOT NULL,
    "ownerId" TEXT,
    "ownerType" TEXT,
    "credentials" JSONB NOT NULL,
    "bucket" TEXT,
    "container" TEXT,
    "region" TEXT,
    "endpoint" TEXT,
    "basePath" TEXT DEFAULT '/documents',
    "enableVersioning" BOOLEAN NOT NULL DEFAULT false,
    "enableEncryption" BOOLEAN NOT NULL DEFAULT true,
    "encryptionType" TEXT DEFAULT 'AES256',
    "kmsKeyId" TEXT,
    "defaultStorageClass" TEXT DEFAULT 'STANDARD',
    "lifecycleRules" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "corsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "corsOrigins" TEXT[],
    "maxStorageGB" INTEGER,
    "currentUsageGB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTested" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentEmbedding" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentExtraction" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "extractionType" TEXT NOT NULL,
    "extractedData" JSONB NOT NULL,
    "model" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "verified" BOOLEAN DEFAULT false,
    "correctedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentClassification" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "suggestedSection" TEXT,
    "suggestedCategory" TEXT,
    "suggestedTags" TEXT[],
    "suggestedTitle" TEXT,
    "model" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "accepted" BOOLEAN DEFAULT false,
    "correctedSection" TEXT,
    "correctedTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentContainer_ownerId_idx" ON "public"."DocumentContainer"("ownerId");

-- CreateIndex
CREATE INDEX "DocumentContainer_ownerType_idx" ON "public"."DocumentContainer"("ownerType");

-- CreateIndex
CREATE INDEX "DocumentContainer_isTemplate_idx" ON "public"."DocumentContainer"("isTemplate");

-- CreateIndex
CREATE INDEX "DocumentContainer_createdAt_idx" ON "public"."DocumentContainer"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentContainer_storageProvider_idx" ON "public"."DocumentContainer"("storageProvider");

-- CreateIndex
CREATE INDEX "DocumentContainer_storageConfigId_idx" ON "public"."DocumentContainer"("storageConfigId");

-- CreateIndex
CREATE INDEX "DocumentSection_containerId_idx" ON "public"."DocumentSection"("containerId");

-- CreateIndex
CREATE INDEX "DocumentSection_parentId_idx" ON "public"."DocumentSection"("parentId");

-- CreateIndex
CREATE INDEX "DocumentSection_level_idx" ON "public"."DocumentSection"("level");

-- CreateIndex
CREATE INDEX "DocumentSection_order_idx" ON "public"."DocumentSection"("order");

-- CreateIndex
CREATE INDEX "DocumentContainerLink_containerId_idx" ON "public"."DocumentContainerLink"("containerId");

-- CreateIndex
CREATE INDEX "DocumentContainerLink_documentType_documentId_idx" ON "public"."DocumentContainerLink"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "DocumentContainerLink_addedBy_idx" ON "public"."DocumentContainerLink"("addedBy");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentContainerLink_containerId_documentType_documentId_key" ON "public"."DocumentContainerLink"("containerId", "documentType", "documentId");

-- CreateIndex
CREATE INDEX "DocumentSectionLink_sectionId_idx" ON "public"."DocumentSectionLink"("sectionId");

-- CreateIndex
CREATE INDEX "DocumentSectionLink_documentType_documentId_idx" ON "public"."DocumentSectionLink"("documentType", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSectionLink_sectionId_documentType_documentId_key" ON "public"."DocumentSectionLink"("sectionId", "documentType", "documentId");

-- CreateIndex
CREATE INDEX "DocumentContainerShare_containerId_idx" ON "public"."DocumentContainerShare"("containerId");

-- CreateIndex
CREATE INDEX "DocumentContainerShare_sharedWithId_idx" ON "public"."DocumentContainerShare"("sharedWithId");

-- CreateIndex
CREATE INDEX "DocumentContainerShare_sharedById_idx" ON "public"."DocumentContainerShare"("sharedById");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentContainerShare_containerId_sharedWithId_key" ON "public"."DocumentContainerShare"("containerId", "sharedWithId");

-- CreateIndex
CREATE INDEX "DocumentShare_sharedWithId_idx" ON "public"."DocumentShare"("sharedWithId");

-- CreateIndex
CREATE INDEX "DocumentShare_sharedById_idx" ON "public"."DocumentShare"("sharedById");

-- CreateIndex
CREATE INDEX "DocumentShare_documentType_documentId_idx" ON "public"."DocumentShare"("documentType", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentShare_documentType_documentId_sharedWithId_key" ON "public"."DocumentShare"("documentType", "documentId", "sharedWithId");

-- CreateIndex
CREATE INDEX "StorageConfig_ownerId_idx" ON "public"."StorageConfig"("ownerId");

-- CreateIndex
CREATE INDEX "StorageConfig_provider_idx" ON "public"."StorageConfig"("provider");

-- CreateIndex
CREATE INDEX "StorageConfig_isActive_idx" ON "public"."StorageConfig"("isActive");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_containerId_idx" ON "public"."DocumentEmbedding"("containerId");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_documentType_documentId_idx" ON "public"."DocumentEmbedding"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_containerId_chunkIndex_idx" ON "public"."DocumentEmbedding"("containerId", "chunkIndex");

-- CreateIndex
CREATE INDEX "DocumentExtraction_containerId_idx" ON "public"."DocumentExtraction"("containerId");

-- CreateIndex
CREATE INDEX "DocumentExtraction_extractionType_idx" ON "public"."DocumentExtraction"("extractionType");

-- CreateIndex
CREATE INDEX "DocumentExtraction_documentType_documentId_idx" ON "public"."DocumentExtraction"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "DocumentClassification_containerId_idx" ON "public"."DocumentClassification"("containerId");

-- CreateIndex
CREATE INDEX "DocumentClassification_documentType_documentId_idx" ON "public"."DocumentClassification"("documentType", "documentId");

-- AddForeignKey
ALTER TABLE "public"."DocumentContainer" ADD CONSTRAINT "DocumentContainer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentContainer" ADD CONSTRAINT "DocumentContainer_storageConfigId_fkey" FOREIGN KEY ("storageConfigId") REFERENCES "public"."StorageConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentContainer" ADD CONSTRAINT "DocumentContainer_backupConfigId_fkey" FOREIGN KEY ("backupConfigId") REFERENCES "public"."StorageConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentSection" ADD CONSTRAINT "DocumentSection_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."DocumentContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentSection" ADD CONSTRAINT "DocumentSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."DocumentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentContainerLink" ADD CONSTRAINT "DocumentContainerLink_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."DocumentContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentContainerLink" ADD CONSTRAINT "DocumentContainerLink_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentSectionLink" ADD CONSTRAINT "DocumentSectionLink_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."DocumentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentContainerShare" ADD CONSTRAINT "DocumentContainerShare_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."DocumentContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentContainerShare" ADD CONSTRAINT "DocumentContainerShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentContainerShare" ADD CONSTRAINT "DocumentContainerShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentShare" ADD CONSTRAINT "DocumentShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentShare" ADD CONSTRAINT "DocumentShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StorageConfig" ADD CONSTRAINT "StorageConfig_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentEmbedding" ADD CONSTRAINT "DocumentEmbedding_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."DocumentContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentExtraction" ADD CONSTRAINT "DocumentExtraction_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."DocumentContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentClassification" ADD CONSTRAINT "DocumentClassification_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."DocumentContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

