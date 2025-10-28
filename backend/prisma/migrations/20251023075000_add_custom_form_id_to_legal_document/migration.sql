-- Add customFormId column to LegalDocument table
ALTER TABLE "LegalDocument" ADD COLUMN "customFormId" TEXT;

-- Add foreign key constraint for customFormId
ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_customFormId_fkey" 
    FOREIGN KEY ("customFormId") REFERENCES "CustomForm"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;