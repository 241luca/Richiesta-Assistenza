-- Add document integration fields to DocumentTypeConfig table
ALTER TABLE "DocumentTypeConfig" ADD COLUMN "formTemplateId" TEXT UNIQUE;
ALTER TABLE "DocumentTypeConfig" ADD COLUMN "allowCustomForms" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DocumentTypeConfig" ADD COLUMN "enableVersioning" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DocumentTypeConfig" ADD COLUMN "maxVersions" INTEGER;
ALTER TABLE "DocumentTypeConfig" ADD COLUMN "customFields" JSONB;

-- Add document integration fields to LegalDocument table
ALTER TABLE "LegalDocument" ADD COLUMN "formTemplateId" TEXT UNIQUE;
ALTER TABLE "LegalDocument" ADD COLUMN "enableCustomContent" BOOLEAN NOT NULL DEFAULT false;

-- Create DocumentFormTemplate table
CREATE TABLE "DocumentFormTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "documentTypeId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "DocumentFormTemplate_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentTypeConfig"("id") ON DELETE CASCADE,
    CONSTRAINT "DocumentFormTemplate_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE CASCADE,
    CONSTRAINT "DocumentFormTemplate_documentTypeId_formId_key" UNIQUE ("documentTypeId", "formId")
);

-- Create indexes for DocumentFormTemplate table
CREATE INDEX "DocumentFormTemplate_documentTypeId_idx" ON "DocumentFormTemplate"("documentTypeId");
CREATE INDEX "DocumentFormTemplate_formId_idx" ON "DocumentFormTemplate"("formId");