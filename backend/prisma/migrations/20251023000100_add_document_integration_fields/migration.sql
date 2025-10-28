-- Add document integration fields to CustomForm table

-- Add isDocumentTemplate column
ALTER TABLE "CustomForm" ADD COLUMN "isDocumentTemplate" BOOLEAN NOT NULL DEFAULT false;

-- Add documentTypeId column
ALTER TABLE "CustomForm" ADD COLUMN "documentTypeId" TEXT;

-- Add documentSettings column
ALTER TABLE "CustomForm" ADD COLUMN "documentSettings" JSONB;

-- Add enableVersioning column
ALTER TABLE "CustomForm" ADD COLUMN "enableVersioning" BOOLEAN NOT NULL DEFAULT true;

-- Add approvalWorkflow column
ALTER TABLE "CustomForm" ADD COLUMN "approvalWorkflow" JSONB;

-- Add signatureRequired column
ALTER TABLE "CustomForm" ADD COLUMN "signatureRequired" BOOLEAN NOT NULL DEFAULT false;

-- Add retentionPolicy column
ALTER TABLE "CustomForm" ADD COLUMN "retentionPolicy" JSONB;

-- Add unique constraint for documentTypeId
CREATE UNIQUE INDEX "CustomForm_documentTypeId_key" ON "CustomForm"("documentTypeId");

-- Add foreign key constraint for documentTypeId
ALTER TABLE "CustomForm" ADD CONSTRAINT "CustomForm_documentTypeId_fkey" 
    FOREIGN KEY ("documentTypeId") REFERENCES "DocumentTypeConfig"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;