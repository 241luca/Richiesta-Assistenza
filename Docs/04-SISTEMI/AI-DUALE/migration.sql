-- ==========================================
-- MIGRATION: Sistema AI Duale per Professionisti
-- Data: 15 Settembre 2025
-- Versione: 1.0.0
-- ==========================================

-- 1. Tabella principale ProfessionalWhatsApp
CREATE TABLE "ProfessionalWhatsApp" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "professionalId" TEXT NOT NULL UNIQUE,
    "phoneNumber" TEXT NOT NULL UNIQUE,
    "instanceId" TEXT NOT NULL UNIQUE,
    "sendappApiKey" TEXT,
    status TEXT DEFAULT 'PENDING',
    "activationDate" TIMESTAMP,
    "suspensionDate" TIMESTAMP,
    "suspensionReason" TEXT,
    
    -- Phone Recognition Arrays
    "professionalPhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trustedNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blacklistedNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- AI Configuration JSONB
    "aiConfigProfessional" JSONB DEFAULT '{}',
    "aiConfigClient" JSONB DEFAULT '{}',
    
    -- Knowledge Base Arrays
    "kbProfessionalIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kbClientIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- System Prompts
    "systemPromptProfessional" TEXT,
    "systemPromptClient" TEXT,
    
    -- Detection Settings
    "autoDetectMode" BOOLEAN DEFAULT true,
    "defaultMode" TEXT DEFAULT 'CLIENT',
    "confidenceThreshold" FLOAT DEFAULT 0.7,
    
    -- Billing
    "planId" TEXT DEFAULT 'STARTER',
    "billingCycle" TEXT DEFAULT 'MONTHLY',
    "nextBillingDate" TIMESTAMP,
    "messagesLimit" INTEGER DEFAULT 500,
    "messagesUsed" INTEGER DEFAULT 0,
    "aiResponsesLimit" INTEGER DEFAULT 50,
    "aiResponsesUsed" INTEGER DEFAULT 0,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    "businessHours" JSONB,
    "autoReplySettings" JSONB,
    
    -- Metadata
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "createdBy" TEXT,
    
    CONSTRAINT fk_professional FOREIGN KEY ("professionalId") 
        REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for ProfessionalWhatsApp
CREATE INDEX idx_prof_whatsapp_professional ON "ProfessionalWhatsApp"("professionalId");
CREATE INDEX idx_prof_whatsapp_status ON "ProfessionalWhatsApp"(status);
CREATE INDEX idx_prof_whatsapp_phone ON "ProfessionalWhatsApp"("phoneNumber");
CREATE INDEX idx_prof_whatsapp_instance ON "ProfessionalWhatsApp"("instanceId");

-- 2. AI Dual Configuration
CREATE TABLE "ProfessionalAiDualConfig" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL UNIQUE,
    
    "techConfig" JSONB DEFAULT '{
        "enabled": true,
        "model": "gpt-4",
        "temperature": 0.3,
        "maxTokens": 500,
        "includeInternalData": true,
        "showMargins": true,
        "showSupplierInfo": true,
        "technicalDepth": "expert",
        "language": "technical"
    }',
    
    "clientConfig" JSONB DEFAULT '{
        "enabled": true,
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "maxTokens": 300,
        "includeInternalData": false,
        "showMargins": false,
        "showSupplierInfo": false,
        "technicalDepth": "simple",
        "language": "friendly"
    }',
    
    "responseRules" JSONB,
    "neverMentionPatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "alwaysIncludeTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_config FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE
);

-- 3. Subcategory Dual Configuration
CREATE TABLE "ProfessionalSubcategoryDualConfig" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    
    -- KB Duale
    "kbProfessional" JSONB,
    "kbClient" JSONB,
    
    -- Prompt Duali
    "promptProfessional" TEXT,
    "promptClient" TEXT,
    
    -- Visibilità
    "visibleToProfessional" BOOLEAN DEFAULT true,
    "visibleToClients" BOOLEAN DEFAULT true,
    
    -- Prezzi Differenziati
    "pricingProfessional" JSONB,
    "pricingClient" JSONB,
    
    -- Settings
    "techSettings" JSONB,
    "clientSettings" JSONB,
    
    -- Usage tracking
    "usageCountTech" INTEGER DEFAULT 0,
    "usageCountClient" INTEGER DEFAULT 0,
    "lastUsedTech" TIMESTAMP,
    "lastUsedClient" TIMESTAMP,
    
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_subcat FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE,
    CONSTRAINT fk_subcategory FOREIGN KEY ("subcategoryId") 
        REFERENCES "Subcategory"(id),
    CONSTRAINT unique_whatsapp_subcat UNIQUE ("whatsappId", "subcategoryId")
);

CREATE INDEX idx_subcat_dual_whatsapp ON "ProfessionalSubcategoryDualConfig"("whatsappId");
CREATE INDEX idx_subcat_dual_subcategory ON "ProfessionalSubcategoryDualConfig"("subcategoryId");

-- 4. WhatsApp Messages con Detection
CREATE TABLE "ProfessionalWhatsAppMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    
    -- Message data
    "externalId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "contactName" TEXT,
    message TEXT NOT NULL,
    "messageType" TEXT DEFAULT 'text',
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    
    -- DETECTION RESULT - CRITICO!
    "detectedMode" TEXT,
    "detectionConfidence" FLOAT,
    "detectionReason" TEXT,
    "modeOverride" TEXT,
    
    -- Status
    direction TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    "sentAt" TIMESTAMP,
    "deliveredAt" TIMESTAMP,
    "readAt" TIMESTAMP,
    "failedAt" TIMESTAMP,
    "errorMessage" TEXT,
    
    -- AI Processing
    "aiProcessed" BOOLEAN DEFAULT false,
    "aiMode" TEXT,
    "aiResponse" TEXT,
    "aiConfidence" FLOAT,
    "aiIntent" TEXT,
    "aiEntities" JSONB,
    "kbUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    metadata JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_msg FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE
);

CREATE INDEX idx_msg_whatsapp ON "ProfessionalWhatsAppMessage"("whatsappId", "createdAt" DESC);
CREATE INDEX idx_msg_phone ON "ProfessionalWhatsAppMessage"("phoneNumber");
CREATE INDEX idx_msg_status ON "ProfessionalWhatsAppMessage"(status);
CREATE INDEX idx_msg_mode ON "ProfessionalWhatsAppMessage"("detectedMode");

-- 5. WhatsApp Contacts con Classification
CREATE TABLE "ProfessionalWhatsAppContact" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    
    -- Contact info
    "phoneNumber" TEXT NOT NULL,
    name TEXT,
    email TEXT,
    
    -- CLASSIFICATION - CRITICO!
    "contactType" TEXT DEFAULT 'CLIENT',
    "isVerified" BOOLEAN DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP,
    
    -- WhatsApp info
    "whatsappName" TEXT,
    "whatsappAvatar" TEXT,
    "lastSeen" TIMESTAMP,
    
    -- Business data
    "customerSince" TIMESTAMP,
    "totalMessages" INTEGER DEFAULT 0,
    "totalOrders" INTEGER DEFAULT 0,
    "totalRevenue" DECIMAL(10,2) DEFAULT 0,
    
    -- AI Interaction stats
    "aiInteractionsTech" INTEGER DEFAULT 0,
    "aiInteractionsClient" INTEGER DEFAULT 0,
    "lastAiMode" TEXT,
    
    -- Notes
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    "internalNotes" TEXT,
    
    -- Status
    status TEXT DEFAULT 'ACTIVE',
    blocked BOOLEAN DEFAULT false,
    "blockedReason" TEXT,
    
    "customFields" JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_contact FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE,
    CONSTRAINT unique_whatsapp_phone UNIQUE ("whatsappId", "phoneNumber")
);

CREATE INDEX idx_contact_whatsapp ON "ProfessionalWhatsAppContact"("whatsappId");
CREATE INDEX idx_contact_phone ON "ProfessionalWhatsAppContact"("phoneNumber");
CREATE INDEX idx_contact_type ON "ProfessionalWhatsAppContact"("contactType");

-- 6. Altri tabelle di supporto (semplificate per brevità)
CREATE TABLE "ProfessionalWhatsAppAutomation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConfig" JSONB NOT NULL,
    "applicableMode" TEXT DEFAULT 'BOTH',
    actions JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    "lastTriggered" TIMESTAMP,
    "triggerCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_automation FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE
);

CREATE TABLE "ProfessionalWhatsAppTemplate" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    "messageTech" TEXT,
    "messageClient" TEXT,
    message TEXT,
    "mediaUrl" TEXT,
    "availableForMode" TEXT DEFAULT 'BOTH',
    shortcut TEXT,
    "usageCount" INTEGER DEFAULT 0,
    "lastUsed" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_template FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE,
    CONSTRAINT unique_whatsapp_shortcut UNIQUE ("whatsappId", shortcut)
);

-- 7. Detection Override History (per machine learning)
CREATE TABLE "ProfessionalWhatsAppDetectionOverride" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "originalDetection" TEXT NOT NULL,
    "overriddenTo" TEXT NOT NULL,
    "overriddenBy" TEXT NOT NULL,
    reason TEXT,
    "shouldLearnFrom" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_override_whatsapp ON "ProfessionalWhatsAppDetectionOverride"("whatsappId");
CREATE INDEX idx_override_phone ON "ProfessionalWhatsAppDetectionOverride"("phoneNumber");

-- 8. Analytics con Detection Metrics
CREATE TABLE "ProfessionalWhatsAppAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    date DATE NOT NULL,
    hour INTEGER,
    
    -- Metrics by mode
    "messagesSentTech" INTEGER DEFAULT 0,
    "messagesSentClient" INTEGER DEFAULT 0,
    "messagesReceived" INTEGER DEFAULT 0,
    
    -- Detection metrics
    "correctDetections" INTEGER DEFAULT 0,
    "incorrectDetections" INTEGER DEFAULT 0,
    "manualOverrides" INTEGER DEFAULT 0,
    "detectionAccuracy" FLOAT,
    
    -- Altri metrics
    "uniqueContacts" INTEGER DEFAULT 0,
    "professionalContacts" INTEGER DEFAULT 0,
    "clientContacts" INTEGER DEFAULT 0,
    
    "createdAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_analytics FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE,
    CONSTRAINT unique_analytics_date UNIQUE ("whatsappId", date, hour)
);

-- 9. Audit Log per tracciare mode switches
CREATE TABLE "ProfessionalWhatsAppAudit" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    action TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT,
    "previousMode" TEXT,
    "newMode" TEXT,
    reason TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    metadata JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_audit FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE
);

-- 10. Billing
CREATE TABLE "ProfessionalWhatsAppBilling" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "whatsappId" TEXT NOT NULL,
    "periodStart" TIMESTAMP NOT NULL,
    "periodEnd" TIMESTAMP NOT NULL,
    
    -- Usage by mode
    "messagesSentTech" INTEGER DEFAULT 0,
    "messagesSentClient" INTEGER DEFAULT 0,
    "messagesReceived" INTEGER DEFAULT 0,
    "aiResponsesTech" INTEGER DEFAULT 0,
    "aiResponsesClient" INTEGER DEFAULT 0,
    
    "mediaSent" INTEGER DEFAULT 0,
    "automationTriggers" INTEGER DEFAULT 0,
    
    "baseCost" DECIMAL(10,2),
    "overageCost" DECIMAL(10,2) DEFAULT 0,
    discounts DECIMAL(10,2) DEFAULT 0,
    "totalCost" DECIMAL(10,2),
    
    "paymentStatus" TEXT DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP,
    "paymentMethod" TEXT,
    "invoiceNumber" TEXT,
    "invoiceUrl" TEXT,
    
    "createdAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_whatsapp_billing FOREIGN KEY ("whatsappId") 
        REFERENCES "ProfessionalWhatsApp"(id) ON DELETE CASCADE
);

-- Aggiungi relazione a User table
ALTER TABLE "User" 
ADD CONSTRAINT fk_user_prof_whatsapp 
FOREIGN KEY (id) REFERENCES "ProfessionalWhatsApp"("professionalId") 
ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Create update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_professional_whatsapp_updated_at 
    BEFORE UPDATE ON "ProfessionalWhatsApp" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_dual_config_updated_at 
    BEFORE UPDATE ON "ProfessionalAiDualConfig" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Altri triggers omessi per brevità...

-- Commenti per documentazione
COMMENT ON TABLE "ProfessionalWhatsApp" IS 'Sistema AI Duale - ogni professionista ha configurazione doppia: tecnica per sé, pubblica per clienti';
COMMENT ON COLUMN "ProfessionalWhatsApp"."professionalPhones" IS 'Array numeri telefono del professionista - critico per detection';
COMMENT ON COLUMN "ProfessionalWhatsApp"."defaultMode" IS 'Modalità default quando detection incerta - CLIENT è più sicuro';
COMMENT ON COLUMN "ProfessionalWhatsAppMessage"."detectedMode" IS 'PROFESSIONAL o CLIENT - determina quale AI risponde';
COMMENT ON COLUMN "ProfessionalWhatsAppContact"."contactType" IS 'CLIENT, PROFESSIONAL, TRUSTED, BLOCKED - determina trattamento';
