-- CreateEnum
CREATE TYPE "public"."CrmSource" AS ENUM ('REFERRAL', 'WHATSAPP', 'WEB');

-- CreateEnum
CREATE TYPE "public"."CrmContactStatus" AS ENUM ('INVITED', 'REGISTERED', 'CONVERTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."AcceptanceMethod" AS ENUM ('EXPLICIT_CLICK', 'IMPLICIT_SCROLL', 'API', 'IMPORT', 'REGISTRATION', 'LOGIN', 'PURCHASE', 'EMAIL_CONFIRMATION', 'SMS_CONFIRMATION', 'SIGNATURE');

-- CreateEnum
CREATE TYPE "public"."AssignmentType" AS ENUM ('STAFF', 'SELF', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'TWO_FA_ENABLED', 'TWO_FA_DISABLED', 'TWO_FA_FAILED', 'SESSION_EXPIRED', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE', 'REQUEST_CREATED', 'REQUEST_ASSIGNED', 'REQUEST_UPDATED', 'REQUEST_CANCELLED', 'REQUEST_COMPLETED', 'QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED', 'PAYMENT_INITIATED', 'PAYMENT_PROCESSED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'ROLE_CHANGED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'UNAUTHORIZED_ACCESS', 'API_KEY_CREATED', 'API_KEY_REVOKED', 'BACKUP_CREATED', 'BACKUP_RESTORED', 'SYSTEM_ERROR', 'INTEGRATION_FAILED', 'EMAIL_SENT', 'EMAIL_FAILED', 'EXPORT_DATA', 'IMPORT_DATA', 'DATA_ANONYMIZED', 'DATA_DELETED', 'CLEANUP_STARTED', 'CLEANUP_COMPLETED', 'CLEANUP_FAILED', 'CLEANUP_FOLDER_DELETED', 'CLEANUP_CONFIG_UPDATED');

-- CreateEnum
CREATE TYPE "public"."BackupFrequency" AS ENUM ('MANUAL', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."BackupType" AS ENUM ('FULL', 'DATABASE', 'FILES', 'CODE', 'INCREMENTAL', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "public"."ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ComplaintStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."ContactType" AS ENUM ('CLIENT', 'PROFESSIONAL', 'TRUSTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."DetailLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."DetectionMode" AS ENUM ('PROFESSIONAL', 'CLIENT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('INVOICE', 'PROFORMA', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECEIPT', 'ELECTRONIC');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."LegalDocumentType" AS ENUM ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY', 'DPA', 'SLA', 'NDA', 'EULA', 'DISCLAIMER', 'COPYRIGHT', 'ACCEPTABLE_USE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."LogCategory" AS ENUM ('SECURITY', 'BUSINESS', 'SYSTEM', 'COMPLIANCE', 'PERFORMANCE', 'USER_ACTIVITY', 'API', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "public"."LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."LogSeverity" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ModuleAction" AS ENUM ('ENABLED', 'DISABLED', 'INSTALLED', 'UNINSTALLED', 'UPDATED', 'CONFIGURED');

-- CreateEnum
CREATE TYPE "public"."ModuleCategory" AS ENUM ('CORE', 'BUSINESS', 'COMMUNICATION', 'ADVANCED', 'REPORTING', 'AUTOMATION', 'INTEGRATIONS', 'ADMIN', 'SECURITY');

-- CreateEnum
CREATE TYPE "public"."ModuleName" AS ENUM ('AUTHENTICATION', 'NOTIFICATIONS', 'PAYMENTS', 'WHATSAPP', 'AI_ASSISTANT', 'CALENDAR', 'REPORTS', 'BACKUP', 'ANALYTICS', 'SECURITY', 'COMPLAINTS', 'COMMUNICATION', 'ADVANCED', 'REPORTING', 'AUTOMATION', 'INTEGRATIONS', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."OldPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."OldPaymentType" AS ENUM ('DEPOSIT', 'FULL_PAYMENT', 'PARTIAL_PAYMENT');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'CASH', 'CARD', 'WISE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentMode" AS ENUM ('MANAGED', 'AUTONOMOUS', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('BOOKING', 'ACCESSORY', 'DEPOSIT', 'FINAL_PAYMENT', 'HOLD', 'SUBSCRIPTION', 'COMMISSION');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RefundReason" AS ENUM ('DUPLICATE', 'FRAUDULENT', 'REQUESTED_BY_CUSTOMER', 'SERVICE_NOT_PROVIDED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PayoutFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "public"."PointTransactionType" AS ENUM ('REFERRAL_SIGNUP', 'REFERRAL_CONVERSION', 'WELCOME_BONUS', 'MANUAL_ADJUSTMENT', 'REWARD_REDEMPTION', 'SYSTEM_CREDIT');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."QuoteStatus" AS ENUM ('DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'REGISTERED', 'CONVERTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ResponseStyle" AS ENUM ('FORMAL', 'INFORMAL', 'TECHNICAL', 'EDUCATIONAL');

-- CreateEnum
CREATE TYPE "public"."RestoreStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROFESSIONAL', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."ScriptCategory" AS ENUM ('DATABASE', 'MAINTENANCE', 'REPORT', 'SECURITY', 'UTILITY', 'ANALYSIS', 'TESTING');

-- CreateEnum
CREATE TYPE "public"."ScriptRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'PASSWORD', 'JSON', 'SELECT', 'MULTI_SELECT', 'TEXT', 'EMAIL', 'URL');

-- CreateEnum
CREATE TYPE "public"."VersionStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "public"."WhatsAppStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."OnboardingEnvironment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "public"."OnboardingTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ReviewBadgeType" AS ENUM ('TOP_RATED', 'VERIFIED_PRO', 'QUICK_RESPONDER', 'EXPERT', 'CUSTOMER_FAVORITE', 'RISING_STAR');

-- CreateEnum
CREATE TYPE "public"."ReviewExclusionType" AS ENUM ('CLIENT', 'PROFESSIONAL', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."ReviewResponseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'EDITED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."ReviewVoteType" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'INAPPROPRIATE');

-- CreateEnum
CREATE TYPE "public"."CustomFormFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'CHECKBOX', 'RADIO', 'SELECT', 'MULTISELECT', 'FILE', 'FILE_IMAGE', 'SIGNATURE', 'SLIDER', 'RATING', 'TAGS', 'AUTOCOMPLETE', 'LOCATION', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."CustomFormCommissionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."CustomFormCommissionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."CustomFormDisplayType" AS ENUM ('SIMPLE', 'STANDARD', 'ADVANCED', 'MODAL', 'PAGE', 'INLINE');

-- CreateTable
CREATE TABLE "public"."AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "subcategoryId" TEXT,
    "conversationType" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "feedback" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiSystemSettings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'system',
    "systemHelpModel" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "systemHelpPrompt" TEXT NOT NULL,
    "systemHelpKnowledge" JSONB,
    "fallbackModel" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "fallbackPrompt" TEXT NOT NULL,
    "maxTokensPerRequest" INTEGER NOT NULL DEFAULT 2048,
    "maxRequestsPerUser" INTEGER NOT NULL DEFAULT 100,
    "maxRequestsPerMinute" INTEGER NOT NULL DEFAULT 10,
    "enableClientAi" BOOLEAN NOT NULL DEFAULT true,
    "enableProfessionalAi" BOOLEAN NOT NULL DEFAULT true,
    "enableSystemHelp" BOOLEAN NOT NULL DEFAULT true,
    "logConversations" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "userId" TEXT,
    "permissions" JSONB,
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalWorkflowConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT,
    "steps" JSONB NOT NULL,
    "notificationConfig" JSONB,
    "autoApproveAfterDays" INTEGER,
    "autoPublishAfterApproval" BOOLEAN NOT NULL DEFAULT false,
    "autoArchiveAfterDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ApprovalWorkflowConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssistanceRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "requestedDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "internalNotes" TEXT,
    "publicNotes" TEXT,
    "tags" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "assignmentType" "public"."AssignmentType",
    "travelCalculatedAt" TIMESTAMP(3),
    "travelCost" DOUBLE PRECISION,
    "travelDistance" DOUBLE PRECISION,
    "travelDistanceText" TEXT,
    "travelDuration" INTEGER,
    "travelDurationText" TEXT,
    "requestNumber" SERIAL NOT NULL,
    "selectedCustomFormId" TEXT,

    CONSTRAINT "AssistanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "sessionId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT,
    "method" TEXT,
    "requestId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "changes" JSONB,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "severity" "public"."LogSeverity" NOT NULL,
    "category" "public"."LogCategory" NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLogAlert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" JSONB NOT NULL,
    "severity" "public"."LogSeverity" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "notifyEmails" JSONB,
    "notifyWebhook" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLogAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLogRetention" (
    "id" TEXT NOT NULL,
    "category" "public"."LogCategory" NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLogRetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutoRemediationLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "ruleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "actionsExecuted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "error" TEXT,
    "healthScoreBefore" INTEGER NOT NULL,
    "healthScoreAfter" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoRemediationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BackupExecution" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "backupId" TEXT,
    "status" "public"."BackupStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BackupLog" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "level" "public"."LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BackupRestore" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "status" "public"."RestoreStatus" NOT NULL DEFAULT 'PENDING',
    "restorePoint" TIMESTAMP(3) NOT NULL,
    "targetEnvironment" TEXT,
    "includeDatabase" BOOLEAN NOT NULL DEFAULT true,
    "includeUploads" BOOLEAN NOT NULL DEFAULT true,
    "includeCode" BOOLEAN NOT NULL DEFAULT false,
    "preRestoreBackup" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "restoredTables" JSONB,
    "restoredFiles" JSONB,
    "rollbackAvailable" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "restoredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupRestore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BackupSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."BackupType" NOT NULL,
    "frequency" "public"."BackupFrequency" NOT NULL,
    "cronExpression" TEXT,
    "timeOfDay" TEXT,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Rome',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "includeUploads" BOOLEAN NOT NULL DEFAULT true,
    "includeDatabase" BOOLEAN NOT NULL DEFAULT true,
    "includeCode" BOOLEAN NOT NULL DEFAULT false,
    "compression" BOOLEAN NOT NULL DEFAULT true,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "maxBackups" INTEGER NOT NULL DEFAULT 10,
    "notifyOnSuccess" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmails" JSONB,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarAvailability" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarBlock" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarException" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarSettings" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'week',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
    "timeSlotDuration" INTEGER NOT NULL DEFAULT 30,
    "minTime" TEXT NOT NULL DEFAULT '08:00',
    "maxTime" TEXT NOT NULL DEFAULT '20:00',
    "showWeekends" BOOLEAN NOT NULL DEFAULT true,
    "defaultInterventionDuration" INTEGER NOT NULL DEFAULT 60,
    "defaultBufferTime" INTEGER NOT NULL DEFAULT 15,
    "colorScheme" JSONB,
    "googleCalendarId" TEXT,
    "googleCalendarConnected" BOOLEAN NOT NULL DEFAULT false,
    "googleSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastGoogleSync" TIMESTAMP(3),
    "notificationSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectPath" TEXT NOT NULL DEFAULT '',
    "targetDirectory" TEXT NOT NULL,
    "basePath" TEXT,
    "directoryFormat" TEXT NOT NULL DEFAULT 'CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}',
    "maxDepth" INTEGER NOT NULL DEFAULT 3,
    "bufferSize" INTEGER NOT NULL DEFAULT 104857600,
    "timeout" INTEGER NOT NULL DEFAULT 60000,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "autoCleanup" BOOLEAN NOT NULL DEFAULT false,
    "autoCleanupDays" INTEGER NOT NULL DEFAULT 30,
    "createReadme" BOOLEAN NOT NULL DEFAULT true,
    "preserveStructure" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCleanup" BOOLEAN NOT NULL DEFAULT true,
    "enablePreview" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmails" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanupConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupExcludeDirectory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "directory" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "recursive" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "CleanupExcludeDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupExcludeFile" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fileName" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "criticality" TEXT NOT NULL DEFAULT 'normal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "CleanupExcludeFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "executionId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "targetPath" TEXT,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "filesSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalSize" BIGINT NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "executedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupPattern" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "pattern" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'glob',
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "action" TEXT NOT NULL DEFAULT 'move',
    "metadata" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "CleanupPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupPreview" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "files" JSONB NOT NULL,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalSize" BIGINT NOT NULL DEFAULT 0,
    "matchedPatterns" JSONB,
    "configUsed" JSONB,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanupPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Rome',
    "configName" TEXT NOT NULL DEFAULT 'default',
    "runOnStartup" BOOLEAN NOT NULL DEFAULT false,
    "catchUp" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanupStats" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "totalFilesCleanup" INTEGER NOT NULL DEFAULT 0,
    "totalSizeCleanup" BIGINT NOT NULL DEFAULT 0,
    "averageDuration" INTEGER NOT NULL DEFAULT 0,
    "mostUsedPattern" TEXT,
    "lastExecutionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanupStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientAiSettings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "professionalId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1500,
    "responseStyle" TEXT NOT NULL DEFAULT 'friendly',
    "detailLevel" TEXT NOT NULL DEFAULT 'basic',
    "useKnowledgeBase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemPrompt" TEXT,

    CONSTRAINT "ClientAiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommissionRule" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT,
    "conditions" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "description" TEXT,
    "fixedAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "maxAmount" DOUBLE PRECISION,
    "minAmount" DOUBLE PRECISION,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION,
    "tiers" JSONB,
    "validTo" TIMESTAMP(3),

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Complaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "priority" "public"."ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "response" TEXT,
    "internalNotes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "subject" TEXT,
    "description" TEXT,
    "category" TEXT,
    "priority" "public"."ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "attachments" JSONB,
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ComplaintDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditNote" (
    "id" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "originalInvoiceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerCity" TEXT NOT NULL,
    "customerCountry" TEXT NOT NULL,
    "customerFiscalCode" TEXT,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerProvince" TEXT NOT NULL,
    "customerVatNumber" TEXT,
    "customerZipCode" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DepositRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "depositType" TEXT NOT NULL,
    "fixedAmount" DECIMAL(10,2),
    "percentageAmount" DOUBLE PRECISION,
    "rangeRules" JSONB,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentConfigAudit" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentConfigAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentCustomField" (
    "id" TEXT NOT NULL,
    "documentType" TEXT,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "helpText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentNotificationTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT,
    "eventType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "variables" JSONB,
    "channels" TEXT[],
    "recipientRoles" TEXT[],
    "includeAdmins" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentNotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentPermission" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "documentType" TEXT,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canSubmitReview" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,
    "canArchive" BOOLEAN NOT NULL DEFAULT false,
    "canViewDrafts" BOOLEAN NOT NULL DEFAULT false,
    "canViewAll" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "canImport" BOOLEAN NOT NULL DEFAULT false,
    "canManageTemplates" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentSystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "dataType" TEXT NOT NULL,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "DocumentSystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentTypeConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnCreate" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnUpdate" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnExpiry" BOOLEAN NOT NULL DEFAULT true,
    "expiryDays" INTEGER,
    "defaultTemplate" TEXT,
    "variables" JSONB,
    "workflowSteps" JSONB,
    "approverRoles" TEXT[],
    "publisherRoles" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "formTemplateId" TEXT,
    "allowCustomForms" BOOLEAN NOT NULL DEFAULT true,
    "enableVersioning" BOOLEAN NOT NULL DEFAULT true,
    "maxVersions" INTEGER,
    "customFields" JSONB,

    CONSTRAINT "DocumentTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentUIConfig" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "role" TEXT,
    "layout" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "fields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentUIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "messageId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoogleCalendarToken" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "tokenType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthCheckResult" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "module" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metrics" JSONB DEFAULT '{}',
    "executionTime" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthCheckSummary" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "overallStatus" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheckSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionFieldType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "component" TEXT NOT NULL,
    "validationRules" JSONB,
    "defaultConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionFieldType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionMaterial" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pz',
    "defaultPrice" DECIMAL(10,2),
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "barcode" TEXT,
    "qrcode" TEXT,
    "imageUrl" TEXT,
    "technicalSheet" TEXT,
    "stockQuantity" DOUBLE PRECISION,
    "stockMin" DOUBLE PRECISION,
    "stockMax" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "templateId" TEXT,
    "statusId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "interventionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "totalHours" DOUBLE PRECISION,
    "travelTime" DOUBLE PRECISION,
    "formData" JSONB NOT NULL,
    "materials" JSONB,
    "materialsTotal" DECIMAL(10,2),
    "photos" JSONB,
    "signatures" JSONB,
    "professionalSignedAt" TIMESTAMP(3),
    "clientSignedAt" TIMESTAMP(3),
    "gpsData" JSONB,
    "weatherData" JSONB,
    "internalNotes" TEXT,
    "clientNotes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "sentToClientAt" TIMESTAMP(3),
    "viewedByClientAt" TIMESTAMP(3),
    "clientIp" TEXT,
    "clientUserAgent" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionReportConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Configurazione Rapporti',
    "numberingPrefix" TEXT NOT NULL DEFAULT 'RI',
    "numberingFormat" TEXT NOT NULL DEFAULT 'RI-{YEAR}-{NUMBER:5}',
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "resetYearly" BOOLEAN NOT NULL DEFAULT true,
    "lastResetYear" INTEGER,
    "requireSignatures" BOOLEAN NOT NULL DEFAULT false,
    "allowDraftSave" BOOLEAN NOT NULL DEFAULT true,
    "autoSendToClient" BOOLEAN NOT NULL DEFAULT false,
    "enableGPS" BOOLEAN NOT NULL DEFAULT false,
    "enableTimer" BOOLEAN NOT NULL DEFAULT true,
    "enableMaterials" BOOLEAN NOT NULL DEFAULT true,
    "enablePhotos" BOOLEAN NOT NULL DEFAULT false,
    "maxPhotosPerType" INTEGER NOT NULL DEFAULT 5,
    "photoTypes" JSONB DEFAULT '["prima", "durante", "dopo"]',
    "photoCompressionQuality" INTEGER NOT NULL DEFAULT 80,
    "pdfLogo" TEXT,
    "pdfHeader" TEXT,
    "pdfFooter" TEXT,
    "pdfWatermark" TEXT,
    "pdfOrientation" TEXT NOT NULL DEFAULT 'portrait',
    "pdfFormat" TEXT NOT NULL DEFAULT 'A4',
    "notifyProfessionalOnSign" BOOLEAN NOT NULL DEFAULT true,
    "notifyClientOnCreate" BOOLEAN NOT NULL DEFAULT true,
    "notifyAdminOnIssue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionReportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionReportStatus" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#808080',
    "bgColor" TEXT NOT NULL DEFAULT '#F3F4F6',
    "icon" TEXT,
    "allowEdit" BOOLEAN NOT NULL DEFAULT true,
    "allowDelete" BOOLEAN NOT NULL DEFAULT true,
    "requireSignature" BOOLEAN NOT NULL DEFAULT false,
    "notifyClient" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "nextStatuses" JSONB,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionReportStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "subcategoryId" TEXT,
    "categoryId" TEXT,
    "isGeneric" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB,
    "requiredSections" JSONB,
    "layout" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionTemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "tooltip" TEXT,
    "fieldTypeId" TEXT NOT NULL,
    "sectionCode" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 100,
    "columnSpan" INTEGER NOT NULL DEFAULT 12,
    "rowNumber" INTEGER NOT NULL DEFAULT 1,
    "groupName" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isReadonly" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "showOnPDF" BOOLEAN NOT NULL DEFAULT true,
    "showOnClient" BOOLEAN NOT NULL DEFAULT true,
    "showOnMobile" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "dependencies" JSONB,
    "calculations" JSONB,
    "validationRules" JSONB,
    "defaultValue" TEXT,
    "possibleValues" JSONB,
    "showIf" JSONB,
    "requiredIf" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionTemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionTemplateSection" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCollapsible" BOOLEAN NOT NULL DEFAULT true,
    "defaultExpanded" BOOLEAN NOT NULL DEFAULT true,
    "defaultOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionTemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InterventionType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "requiresQuote" BOOLEAN NOT NULL DEFAULT false,
    "requiresPhotos" BOOLEAN NOT NULL DEFAULT false,
    "requiresMaterials" BOOLEAN NOT NULL DEFAULT false,
    "averageDuration" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL DEFAULT 'INVOICE',
    "paymentId" TEXT,
    "requestId" TEXT,
    "quoteId" TEXT,
    "professionalId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerData" JSONB,
    "subtotal" DOUBLE PRECISION DEFAULT 0,
    "taxRate" DOUBLE PRECISION DEFAULT 22,
    "taxAmount" DOUBLE PRECISION DEFAULT 0,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "isElectronic" BOOLEAN NOT NULL DEFAULT false,
    "xmlFile" TEXT,
    "sdiStatus" TEXT,
    "pdfUrl" TEXT,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "electronicProvider" TEXT,
    "footerNotes" TEXT,
    "generatedAt" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "items" JSONB,
    "metadata" JSONB,
    "pdfPath" TEXT,
    "terms" TEXT,
    "total" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KbDocument" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KbDocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbDocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeBase" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL DEFAULT 'professional',
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "embeddings" JSONB,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeBaseConfig" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL DEFAULT 'professional',
    "maxPerDocument" INTEGER NOT NULL DEFAULT 4000,
    "maxTotalCharacters" INTEGER NOT NULL DEFAULT 8000,
    "searchKeywordMinLength" INTEGER NOT NULL DEFAULT 3,
    "contextBeforeKeyword" INTEGER NOT NULL DEFAULT 500,
    "contextAfterKeyword" INTEGER NOT NULL DEFAULT 500,
    "defaultChunkSize" INTEGER NOT NULL DEFAULT 1000,
    "chunkOverlap" INTEGER NOT NULL DEFAULT 100,
    "enableSmartSearch" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoProcess" BOOLEAN NOT NULL DEFAULT false,
    "includeFullDocument" BOOLEAN NOT NULL DEFAULT false,
    "includeMetadata" BOOLEAN NOT NULL DEFAULT true,
    "includeFileName" BOOLEAN NOT NULL DEFAULT true,
    "customPromptPrefix" TEXT,
    "customPromptSuffix" TEXT,
    "cacheEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cacheTTL" INTEGER NOT NULL DEFAULT 3600,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeBaseDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "category" TEXT,
    "subcategoryIds" JSONB,
    "filePath" TEXT,
    "content" TEXT,
    "embeddings" JSONB,
    "language" TEXT NOT NULL DEFAULT 'it',
    "tags" JSONB,
    "version" TEXT,
    "author" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadedById" TEXT,

    CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegalDocument" (
    "id" TEXT NOT NULL,
    "type" "public"."LegalDocumentType" NOT NULL,
    "typeConfigId" TEXT,
    "internalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "formTemplateId" TEXT,
    "enableCustomContent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegalDocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."LegalDocumentType" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'it',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "category" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegalDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "versionNotes" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentPlain" TEXT,
    "contentChecksum" TEXT,
    "summary" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'it',
    "status" "public"."VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "requiresAccept" BOOLEAN NOT NULL DEFAULT true,
    "notifyUsers" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModuleHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModuleSetting" (
    "id" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "type" "public"."SettingType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "placeholder" TEXT,
    "validation" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "recipientId" TEXT NOT NULL,
    "senderId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationChannel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT,
    "configuration" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "rateLimit" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationEvent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT,
    "conditions" JSONB,
    "templateId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "delay" INTEGER NOT NULL DEFAULT 0,
    "retryPolicy" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "templateId" TEXT,
    "eventId" TEXT,
    "recipientId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "notificationTypes" JSONB,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationQueue" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "eventId" TEXT,
    "recipientId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "data" JSONB NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "smsContent" TEXT,
    "whatsappContent" TEXT,
    "variables" JSONB NOT NULL,
    "channels" JSONB NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OldPayment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "public"."OldPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "public"."OldPaymentType" NOT NULL DEFAULT 'FULL_PAYMENT',
    "method" TEXT,
    "transactionId" TEXT,
    "stripePaymentId" TEXT,
    "receiptUrl" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OldPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "public"."PaymentType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "platformFee" DOUBLE PRECISION,
    "professionalAmount" DOUBLE PRECISION,
    "professionalId" TEXT,
    "requestId" TEXT,
    "stripePaymentIntentId" TEXT,
    "failureReason" TEXT,
    "method" "public"."PaymentMethod",
    "netAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "stripeChargeId" TEXT,
    "stripeCustomerId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentSplit" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION DEFAULT 0,
    "description" TEXT,
    "metadata" JSONB,
    "percentage" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payout" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "notes" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedBy" TEXT,
    "amount" DOUBLE PRECISION DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "errorDetails" JSONB,
    "includesPayments" JSONB,
    "metadata" JSONB,
    "method" "public"."PaymentMethod",
    "scheduledFor" TIMESTAMP(3),
    "stripeTransferId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerformanceMetrics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuUsage" INTEGER NOT NULL,
    "memoryUsage" INTEGER NOT NULL,
    "databaseConnections" INTEGER NOT NULL,
    "apiResponseTime" INTEGER NOT NULL,
    "requestsPerMinute" INTEGER NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PointTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "public"."PointTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "referralId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userPointsId" TEXT,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Portfolio" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "beforeImage" TEXT NOT NULL,
    "afterImage" TEXT NOT NULL,
    "additionalImages" JSONB,
    "professionalId" TEXT NOT NULL,
    "requestId" TEXT,
    "categoryId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "technicalDetails" TEXT,
    "materialsUsed" TEXT,
    "duration" TEXT,
    "cost" DOUBLE PRECISION,
    "tags" TEXT[],
    "location" TEXT,
    "workCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Profession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionCategory" (
    "id" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProfessionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalAiCustomization" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "customSystemPrompt" TEXT,
    "customKnowledgeBase" JSONB,
    "customTone" TEXT,
    "customInitialMessage" TEXT,
    "customTemperature" DOUBLE PRECISION,
    "customMaxTokens" INTEGER,
    "preferredExamples" JSONB,
    "avoidTopics" JSONB,
    "specializations" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalAiCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalAiSettings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "professionalId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "responseStyle" TEXT NOT NULL DEFAULT 'formal',
    "detailLevel" TEXT NOT NULL DEFAULT 'intermediate',
    "useKnowledgeBase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemPrompt" TEXT,

    CONSTRAINT "ProfessionalAiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalCertification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalMaterial" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "baseMaterialId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pz',
    "defaultQuantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "supplierName" TEXT,
    "supplierCode" TEXT,
    "notes" TEXT,
    "category" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalPaymentSettings" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "paymentMode" "public"."PaymentMode" NOT NULL DEFAULT 'MANAGED',
    "payoutFrequency" "public"."PayoutFrequency" DEFAULT 'WEEKLY',
    "payoutDay" INTEGER,
    "minimumPayout" DOUBLE PRECISION NOT NULL DEFAULT 50.00,
    "holdingDays" INTEGER NOT NULL DEFAULT 7,
    "autoPayout" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethods" JSONB,
    "primaryMethod" "public"."PaymentMethod",
    "useStandardFees" BOOLEAN NOT NULL DEFAULT true,
    "customFees" JSONB,
    "volumeTiers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPayoutAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProfessionalPaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalPricing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 50.00,
    "minimumRate" DOUBLE PRECISION NOT NULL DEFAULT 30.00,
    "costPerKm" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "freeKm" INTEGER NOT NULL DEFAULT 10,
    "supplements" JSONB NOT NULL DEFAULT '{"festivo": 50, "urgente": 30, "weekend": 20, "notturno": 30}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalReportFolder" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#808080',
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isArchive" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalReportFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalReportPhrase" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalReportPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalReportSettings" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "businessName" TEXT,
    "businessLogo" TEXT,
    "businessAddress" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "businessWebsite" TEXT,
    "vatNumber" TEXT,
    "fiscalCode" TEXT,
    "reaNumber" TEXT,
    "defaultTemplateId" TEXT,
    "autoStartTimer" BOOLEAN NOT NULL DEFAULT false,
    "autoGpsLocation" BOOLEAN NOT NULL DEFAULT false,
    "autoWeather" BOOLEAN NOT NULL DEFAULT false,
    "quickPhrases" BOOLEAN NOT NULL DEFAULT true,
    "quickMaterials" BOOLEAN NOT NULL DEFAULT true,
    "showLastReports" BOOLEAN NOT NULL DEFAULT true,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'it',
    "signatureImage" TEXT,
    "signatureName" TEXT,
    "signatureTitle" TEXT,
    "notifyOnSign" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnView" BOOLEAN NOT NULL DEFAULT false,
    "dailySummary" BOOLEAN NOT NULL DEFAULT false,
    "weeklyReport" BOOLEAN NOT NULL DEFAULT false,
    "pdfTemplate" TEXT NOT NULL DEFAULT 'professional',
    "includeTerms" BOOLEAN NOT NULL DEFAULT false,
    "termsText" TEXT,
    "includePrivacy" BOOLEAN NOT NULL DEFAULT false,
    "privacyText" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'FT',
    "invoiceStartNumber" INTEGER NOT NULL DEFAULT 1,
    "currentInvoiceNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalReportSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalReportTemplate" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "baseTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "customSettings" JSONB,
    "customFields" JSONB,
    "customLayout" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalUserSubcategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "experienceYears" INTEGER,
    "certifications" JSONB,
    "portfolio" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "experienceLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',

    CONSTRAINT "ProfessionalUserSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalWhatsApp" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "sendappApiKey" TEXT,
    "status" "public"."WhatsAppStatus" NOT NULL DEFAULT 'PENDING',
    "activationDate" TIMESTAMP(3),
    "suspensionDate" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "professionalPhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trustedNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blacklistedNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiConfigProfessional" JSONB,
    "aiConfigClient" JSONB,
    "kbProfessionalIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kbClientIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "systemPromptProfessional" TEXT,
    "systemPromptClient" TEXT,
    "autoDetectMode" BOOLEAN NOT NULL DEFAULT true,
    "defaultMode" "public"."DetectionMode" NOT NULL DEFAULT 'CLIENT',
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "planId" TEXT,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "nextBillingDate" TIMESTAMP(3),
    "messagesLimit" INTEGER NOT NULL DEFAULT 1000,
    "messagesUsed" INTEGER NOT NULL DEFAULT 0,
    "aiResponsesLimit" INTEGER NOT NULL DEFAULT 500,
    "aiResponsesUsed" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "businessHours" JSONB,
    "autoReplySettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ProfessionalWhatsApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalWhatsAppAnalytics" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "messagesSentTech" INTEGER NOT NULL DEFAULT 0,
    "messagesSentClient" INTEGER NOT NULL DEFAULT 0,
    "messagesReceived" INTEGER NOT NULL DEFAULT 0,
    "correctDetections" INTEGER NOT NULL DEFAULT 0,
    "incorrectDetections" INTEGER NOT NULL DEFAULT 0,
    "manualOverrides" INTEGER NOT NULL DEFAULT 0,
    "detectionAccuracy" DOUBLE PRECISION,
    "uniqueContacts" INTEGER NOT NULL DEFAULT 0,
    "professionalContacts" INTEGER NOT NULL DEFAULT 0,
    "clientContacts" INTEGER NOT NULL DEFAULT 0,
    "aiResponsesTech" INTEGER NOT NULL DEFAULT 0,
    "aiResponsesClient" INTEGER NOT NULL DEFAULT 0,
    "aiSuccessRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalWhatsAppAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalWhatsAppContact" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "contactType" "public"."ContactType" NOT NULL DEFAULT 'CLIENT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "whatsappName" TEXT,
    "whatsappAvatar" TEXT,
    "lastSeen" TIMESTAMP(3),
    "customerSince" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiInteractionsTech" INTEGER NOT NULL DEFAULT 0,
    "aiInteractionsClient" INTEGER NOT NULL DEFAULT 0,
    "lastAiMode" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "internalNotes" TEXT,
    "status" "public"."ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalWhatsAppContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalWhatsAppDetectionOverride" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "originalDetection" "public"."DetectionMode" NOT NULL,
    "overriddenTo" "public"."DetectionMode" NOT NULL,
    "overriddenBy" TEXT NOT NULL,
    "reason" TEXT,
    "shouldLearnFrom" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalWhatsAppDetectionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "public"."QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "validUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "terms" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "attachments" JSONB,
    "customFields" JSONB,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "depositPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuoteRevision" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changes" JSONB NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuoteTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "clickedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "firstRequestAt" TIMESTAMP(3),
    "referrerRewardGiven" BOOLEAN NOT NULL DEFAULT false,
    "refereeRewardGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" "public"."RefundReason",
    "stripeRefundId" TEXT,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "failureReason" TEXT,
    "metadata" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequestAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequestChatMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readBy" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequestUpdate" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "requestId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "reportedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledIntervention" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "confirmedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "description" TEXT,
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "notes" TEXT,
    "clientConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "clientDeclineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ScheduledIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScriptConfiguration" (
    "id" TEXT NOT NULL,
    "scriptName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."ScriptCategory" NOT NULL,
    "risk" "public"."ScriptRisk" NOT NULL,
    "filePath" TEXT NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 60000,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" "public"."Role"[],
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "purpose" TEXT,
    "whenToUse" TEXT,
    "whatItChecks" JSONB,
    "interpreteOutput" JSONB,
    "commonIssues" JSONB,
    "sections" JSONB,
    "parameters" JSONB,
    "defaultParams" JSONB,
    "hasQuickMode" BOOLEAN NOT NULL DEFAULT false,
    "isComplexScript" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "lastModifiedBy" TEXT,

    CONSTRAINT "ScriptConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScriptExecution" (
    "id" TEXT NOT NULL,
    "scriptName" TEXT NOT NULL,
    "scriptId" TEXT,
    "executedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "output" TEXT,
    "error" TEXT,
    "exitCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeConnect" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "connectedAt" TIMESTAMP(3),
    "requirementsCurrently" JSONB,
    "requirementsEventually" JSONB,
    "stripeAccountId" TEXT NOT NULL,
    "stripeAccountType" TEXT,

    CONSTRAINT "StripeConnect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "color" TEXT,
    "textColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubcategoryAiSettings" (
    "id" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "topP" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "frequencyPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "presencePenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "systemPrompt" TEXT NOT NULL,
    "knowledgeBasePrompt" TEXT,
    "responseStyle" "public"."ResponseStyle" NOT NULL DEFAULT 'FORMAL',
    "detailLevel" "public"."DetailLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "includeDiagrams" BOOLEAN NOT NULL DEFAULT false,
    "includeReferences" BOOLEAN NOT NULL DEFAULT false,
    "useKnowledgeBase" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcategoryAiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemBackup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."BackupType" NOT NULL,
    "status" "public"."BackupStatus" NOT NULL DEFAULT 'PENDING',
    "fileSize" BIGINT,
    "filePath" TEXT,
    "downloadUrl" TEXT,
    "compression" BOOLEAN NOT NULL DEFAULT true,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKey" TEXT,
    "checksum" TEXT,
    "includeUploads" BOOLEAN NOT NULL DEFAULT true,
    "includeDatabase" BOOLEAN NOT NULL DEFAULT true,
    "includeCode" BOOLEAN NOT NULL DEFAULT false,
    "databaseTables" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduleId" TEXT,

    CONSTRAINT "SystemBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemModule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."ModuleCategory" NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "dependsOn" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TestHistory" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "successRate" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TEXT NOT NULL,
    "reportData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'CLIENT',
    "avatar" TEXT,
    "bio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lastSeenAt" TIMESTAMP(3),
    "codiceFiscale" TEXT,
    "partitaIva" TEXT,
    "ragioneSociale" TEXT,
    "pec" TEXT,
    "sdi" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IT',
    "profession" TEXT,
    "specializations" JSONB,
    "hourlyRate" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "serviceAreas" JSONB,
    "workAddress" TEXT,
    "workCity" TEXT,
    "workProvince" TEXT,
    "workPostalCode" TEXT,
    "workLatitude" DOUBLE PRECISION,
    "workLongitude" DOUBLE PRECISION,
    "useResidenceAsWorkAddress" BOOLEAN NOT NULL DEFAULT false,
    "travelRatePerKm" DECIMAL(10,2),
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "canSelfAssign" BOOLEAN NOT NULL DEFAULT true,
    "pricingData" JSONB,
    "professionId" TEXT,
    "approvalStatus" TEXT DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "created_by" VARCHAR(100),
    "profileImage" TEXT,
    "backgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "certificatesVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "referralCode" TEXT,
    "avatarSize" TEXT DEFAULT 'md',
    "recognitionImage" TEXT,
    "isRecognitionImageRequired" BOOLEAN DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLegalAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "ipAddress" TEXT NOT NULL,
    "ipCountry" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "method" "public"."AcceptanceMethod" NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "UserLegalAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppContact" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsappId" TEXT,
    "name" TEXT,
    "pushname" TEXT,
    "shortName" TEXT,
    "businessName" TEXT,
    "isMyContact" BOOLEAN NOT NULL DEFAULT false,
    "isUser" BOOLEAN NOT NULL DEFAULT true,
    "isBusiness" BOOLEAN NOT NULL DEFAULT false,
    "isEnterprise" BOOLEAN NOT NULL DEFAULT false,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "profilePicUrl" TEXT,
    "statusMessage" TEXT,
    "about" TEXT,
    "businessCatalog" JSONB,
    "businessHours" JSONB,
    "businessAddress" TEXT,
    "businessEmail" TEXT,
    "businessCategory" TEXT,
    "firstMessageAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "professionalId" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "customRingtone" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppGroup" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "groupCreatedAt" TIMESTAMP(3),
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "admins" TEXT[],
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "isAnnouncement" BOOLEAN NOT NULL DEFAULT false,
    "groupPicUrl" TEXT,
    "inviteLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "senderName" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "from" TEXT,
    "to" TEXT,
    "author" TEXT,
    "type" TEXT,
    "mimetype" TEXT,
    "isGroupMsg" BOOLEAN NOT NULL DEFAULT false,
    "chatId" TEXT,
    "quotedMsgId" TEXT,
    "mentionedIds" JSONB,
    "isMedia" BOOLEAN NOT NULL DEFAULT false,
    "isNotification" BOOLEAN NOT NULL DEFAULT false,
    "isPSA" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isForwarded" BOOLEAN NOT NULL DEFAULT false,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "hasReaction" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrl" TEXT,
    "mediaPath" TEXT,
    "caption" TEXT,
    "filename" TEXT,
    "mediaSize" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "ack" INTEGER,
    "invis" BOOLEAN NOT NULL DEFAULT false,
    "star" BOOLEAN NOT NULL DEFAULT false,
    "broadcast" BOOLEAN NOT NULL DEFAULT false,
    "multicast" BOOLEAN NOT NULL DEFAULT false,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "requestId" TEXT,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppSession" (
    "id" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "sessionData" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastConnected" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrmContact" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "name" TEXT,
    "source" "public"."CrmSource" NOT NULL,
    "status" "public"."CrmContactStatus" NOT NULL DEFAULT 'INVITED',
    "referrerId" TEXT,
    "referralId" TEXT,
    "userId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingStep" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "templateId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "target" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "placement" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingTask" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "templateId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingTemplate" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "environment" "public"."OnboardingEnvironment" NOT NULL DEFAULT 'DEVELOPMENT',
    "status" "public"."OnboardingTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalBadge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalBadgeAssignment" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "ProfessionalBadgeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewAnalytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewsPerProfessional" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stars1Count" INTEGER NOT NULL DEFAULT 0,
    "stars2Count" INTEGER NOT NULL DEFAULT 0,
    "stars3Count" INTEGER NOT NULL DEFAULT 0,
    "stars4Count" INTEGER NOT NULL DEFAULT 0,
    "stars5Count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewExclusion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ReviewExclusionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "excludedBy" TEXT NOT NULL,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewResponseTemplate" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewResponseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewSystemConfig" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "anonymousReviews" BOOLEAN NOT NULL DEFAULT false,
    "showLastNameInitial" BOOLEAN NOT NULL DEFAULT true,
    "requireComment" BOOLEAN NOT NULL DEFAULT false,
    "minCommentLength" INTEGER NOT NULL DEFAULT 10,
    "maxCommentLength" INTEGER NOT NULL DEFAULT 1000,
    "maxDaysToReview" INTEGER NOT NULL DEFAULT 30,
    "autoModeration" BOOLEAN NOT NULL DEFAULT true,
    "publicReviews" BOOLEAN NOT NULL DEFAULT true,
    "bannedWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentFilter" BOOLEAN NOT NULL DEFAULT true,
    "requireManualApproval" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveThreshold" INTEGER NOT NULL DEFAULT 3,
    "notifyAdminForLowRatings" BOOLEAN NOT NULL DEFAULT true,
    "lowRatingThreshold" INTEGER NOT NULL DEFAULT 2,
    "showStarsInName" BOOLEAN NOT NULL DEFAULT true,
    "minReviewsToShowAverage" INTEGER NOT NULL DEFAULT 3,
    "defaultSortOrder" TEXT NOT NULL DEFAULT 'recent',
    "reviewsPerPage" INTEGER NOT NULL DEFAULT 10,
    "enableBadges" BOOLEAN NOT NULL DEFAULT true,
    "topRatedThreshold" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "enableLoyaltyPoints" BOOLEAN NOT NULL DEFAULT false,
    "pointsPerReview" INTEGER NOT NULL DEFAULT 10,
    "notifyProfessionalOnReview" BOOLEAN NOT NULL DEFAULT true,
    "remindClientAfterDays" INTEGER NOT NULL DEFAULT 3,
    "notifyAdminOnProblematic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentFormTemplate" (
    "id" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentFormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "deviceType" TEXT,
    "deviceName" TEXT,
    "browser" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomForm" (
    "id" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "professionalId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayType" "public"."CustomFormDisplayType" DEFAULT 'STANDARD',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "layout" JSONB,
    "settings" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDocumentTemplate" BOOLEAN NOT NULL DEFAULT false,
    "documentTypeId" TEXT,
    "documentSettings" JSONB,
    "enableVersioning" BOOLEAN NOT NULL DEFAULT true,
    "approvalWorkflow" JSONB,
    "signatureRequired" BOOLEAN NOT NULL DEFAULT false,
    "retentionPolicy" JSONB,

    CONSTRAINT "CustomForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomFormField" (
    "id" TEXT NOT NULL,
    "customFormId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "fieldType" "public"."CustomFormFieldType" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 100,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isReadonly" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "columnSpan" INTEGER NOT NULL DEFAULT 12,
    "rowNumber" INTEGER NOT NULL DEFAULT 1,
    "groupName" TEXT,
    "sectionCode" TEXT,
    "config" JSONB,
    "validationRules" JSONB,
    "defaultValue" TEXT,
    "possibleValues" JSONB,
    "dependencies" JSONB,
    "showIf" JSONB,
    "requiredIf" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomFormCommission" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB,
    "exampleForm" TEXT,
    "status" "public"."CustomFormCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."CustomFormCommissionPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "resultFormId" TEXT,
    "notes" TEXT,
    "deadline" TIMESTAMP(3),
    "estimatedHours" INTEGER,
    "actualHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFormCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomFormValidationRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "pattern" TEXT,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "errorMessage" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFormValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomFormUsageLog" (
    "id" TEXT NOT NULL,
    "customFormId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "formDataSubmitted" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomFormUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequestCustomForm" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "customFormId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isVerifiedByProfessional" BOOLEAN NOT NULL DEFAULT false,
    "submittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestCustomForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequestCustomFormResponse" (
    "id" TEXT NOT NULL,
    "requestCustomFormId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" "public"."CustomFormFieldType" NOT NULL,
    "value" TEXT,
    "valueJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestCustomFormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_GroupMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiSystemSettings_name_key" ON "public"."AiSystemSettings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "public"."ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_service_key" ON "public"."ApiKey"("service");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "public"."ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "public"."ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_service_idx" ON "public"."ApiKey"("service");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "public"."ApiKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflowConfig_name_key" ON "public"."ApprovalWorkflowConfig"("name");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowConfig_documentType_idx" ON "public"."ApprovalWorkflowConfig"("documentType");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowConfig_isActive_idx" ON "public"."ApprovalWorkflowConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AssistanceRequest_requestNumber_key" ON "public"."AssistanceRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "AssistanceRequest_categoryId_idx" ON "public"."AssistanceRequest"("categoryId");

-- CreateIndex
CREATE INDEX "AssistanceRequest_clientId_idx" ON "public"."AssistanceRequest"("clientId");

-- CreateIndex
CREATE INDEX "AssistanceRequest_priority_idx" ON "public"."AssistanceRequest"("priority");

-- CreateIndex
CREATE INDEX "AssistanceRequest_professionalId_idx" ON "public"."AssistanceRequest"("professionalId");

-- CreateIndex
CREATE INDEX "AssistanceRequest_status_idx" ON "public"."AssistanceRequest"("status");

-- CreateIndex
CREATE INDEX "AssistanceRequest_subcategoryId_idx" ON "public"."AssistanceRequest"("subcategoryId");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "public"."AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_category_severity_idx" ON "public"."AuditLog"("category", "severity");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_sessionId_idx" ON "public"."AuditLog"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "public"."AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "public"."AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLogAlert_isActive_idx" ON "public"."AuditLogAlert"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogRetention_category_key" ON "public"."AuditLogRetention"("category");

-- CreateIndex
CREATE INDEX "AutoRemediationLog_module_idx" ON "public"."AutoRemediationLog"("module");

-- CreateIndex
CREATE INDEX "AutoRemediationLog_timestamp_idx" ON "public"."AutoRemediationLog"("timestamp");

-- CreateIndex
CREATE INDEX "BackupExecution_scheduleId_idx" ON "public"."BackupExecution"("scheduleId");

-- CreateIndex
CREATE INDEX "BackupExecution_startedAt_idx" ON "public"."BackupExecution"("startedAt");

-- CreateIndex
CREATE INDEX "BackupExecution_status_idx" ON "public"."BackupExecution"("status");

-- CreateIndex
CREATE INDEX "BackupLog_backupId_idx" ON "public"."BackupLog"("backupId");

-- CreateIndex
CREATE INDEX "BackupLog_createdAt_idx" ON "public"."BackupLog"("createdAt");

-- CreateIndex
CREATE INDEX "BackupLog_level_idx" ON "public"."BackupLog"("level");

-- CreateIndex
CREATE INDEX "BackupRestore_createdAt_idx" ON "public"."BackupRestore"("createdAt");

-- CreateIndex
CREATE INDEX "BackupRestore_status_idx" ON "public"."BackupRestore"("status");

-- CreateIndex
CREATE INDEX "BackupSchedule_frequency_idx" ON "public"."BackupSchedule"("frequency");

-- CreateIndex
CREATE INDEX "BackupSchedule_isActive_idx" ON "public"."BackupSchedule"("isActive");

-- CreateIndex
CREATE INDEX "BackupSchedule_nextRunAt_idx" ON "public"."BackupSchedule"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarAvailability_professionalId_dayOfWeek_key" ON "public"."CalendarAvailability"("professionalId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "CalendarBlock_professionalId_startDateTime_endDateTime_idx" ON "public"."CalendarBlock"("professionalId", "startDateTime", "endDateTime");

-- CreateIndex
CREATE INDEX "CalendarException_date_idx" ON "public"."CalendarException"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarException_professionalId_date_key" ON "public"."CalendarException"("professionalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSettings_professionalId_key" ON "public"."CalendarSettings"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "public"."Category"("isActive");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "public"."Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CleanupConfig_name_key" ON "public"."CleanupConfig"("name");

-- CreateIndex
CREATE INDEX "CleanupConfig_isActive_idx" ON "public"."CleanupConfig"("isActive");

-- CreateIndex
CREATE INDEX "CleanupConfig_name_idx" ON "public"."CleanupConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CleanupExcludeDirectory_directory_key" ON "public"."CleanupExcludeDirectory"("directory");

-- CreateIndex
CREATE INDEX "CleanupExcludeDirectory_isActive_idx" ON "public"."CleanupExcludeDirectory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CleanupExcludeFile_fileName_key" ON "public"."CleanupExcludeFile"("fileName");

-- CreateIndex
CREATE INDEX "CleanupExcludeFile_criticality_idx" ON "public"."CleanupExcludeFile"("criticality");

-- CreateIndex
CREATE INDEX "CleanupExcludeFile_isActive_idx" ON "public"."CleanupExcludeFile"("isActive");

-- CreateIndex
CREATE INDEX "CleanupLog_executedBy_idx" ON "public"."CleanupLog"("executedBy");

-- CreateIndex
CREATE INDEX "CleanupLog_executionId_idx" ON "public"."CleanupLog"("executionId");

-- CreateIndex
CREATE INDEX "CleanupLog_operation_idx" ON "public"."CleanupLog"("operation");

-- CreateIndex
CREATE INDEX "CleanupLog_startedAt_idx" ON "public"."CleanupLog"("startedAt");

-- CreateIndex
CREATE INDEX "CleanupLog_status_idx" ON "public"."CleanupLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CleanupPattern_pattern_key" ON "public"."CleanupPattern"("pattern");

-- CreateIndex
CREATE INDEX "CleanupPattern_category_idx" ON "public"."CleanupPattern"("category");

-- CreateIndex
CREATE INDEX "CleanupPattern_isActive_idx" ON "public"."CleanupPattern"("isActive");

-- CreateIndex
CREATE INDEX "CleanupPattern_priority_idx" ON "public"."CleanupPattern"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "CleanupPreview_sessionId_key" ON "public"."CleanupPreview"("sessionId");

-- CreateIndex
CREATE INDEX "CleanupPreview_sessionId_idx" ON "public"."CleanupPreview"("sessionId");

-- CreateIndex
CREATE INDEX "CleanupPreview_validUntil_idx" ON "public"."CleanupPreview"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "CleanupSchedule_name_key" ON "public"."CleanupSchedule"("name");

-- CreateIndex
CREATE INDEX "CleanupSchedule_isActive_idx" ON "public"."CleanupSchedule"("isActive");

-- CreateIndex
CREATE INDEX "CleanupSchedule_nextRun_idx" ON "public"."CleanupSchedule"("nextRun");

-- CreateIndex
CREATE UNIQUE INDEX "CleanupStats_date_key" ON "public"."CleanupStats"("date");

-- CreateIndex
CREATE INDEX "CleanupStats_date_idx" ON "public"."CleanupStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAiSettings_professionalId_subcategoryId_key" ON "public"."ClientAiSettings"("professionalId", "subcategoryId");

-- CreateIndex
CREATE INDEX "CommissionRule_categoryId_idx" ON "public"."CommissionRule"("categoryId");

-- CreateIndex
CREATE INDEX "CommissionRule_isActive_idx" ON "public"."CommissionRule"("isActive");

-- CreateIndex
CREATE INDEX "CommissionRule_priority_idx" ON "public"."CommissionRule"("priority");

-- CreateIndex
CREATE INDEX "CommissionRule_professionalId_idx" ON "public"."CommissionRule"("professionalId");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "public"."Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_requestId_idx" ON "public"."Complaint"("requestId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "public"."Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_submittedAt_idx" ON "public"."Complaint"("submittedAt");

-- CreateIndex
CREATE INDEX "Complaint_userId_idx" ON "public"."Complaint"("userId");

-- CreateIndex
CREATE INDEX "ComplaintDraft_expiresAt_idx" ON "public"."ComplaintDraft"("expiresAt");

-- CreateIndex
CREATE INDEX "ComplaintDraft_userId_idx" ON "public"."ComplaintDraft"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_creditNoteNumber_key" ON "public"."CreditNote"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "CreditNote_creditNoteNumber_idx" ON "public"."CreditNote"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "CreditNote_customerId_idx" ON "public"."CreditNote"("customerId");

-- CreateIndex
CREATE INDEX "CreditNote_originalInvoiceId_idx" ON "public"."CreditNote"("originalInvoiceId");

-- CreateIndex
CREATE INDEX "DepositRule_categoryId_idx" ON "public"."DepositRule"("categoryId");

-- CreateIndex
CREATE INDEX "DepositRule_isActive_idx" ON "public"."DepositRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategory_code_key" ON "public"."DocumentCategory"("code");

-- CreateIndex
CREATE INDEX "DocumentCategory_isActive_idx" ON "public"."DocumentCategory"("isActive");

-- CreateIndex
CREATE INDEX "DocumentCategory_parentId_idx" ON "public"."DocumentCategory"("parentId");

-- CreateIndex
CREATE INDEX "DocumentConfigAudit_entityType_entityId_idx" ON "public"."DocumentConfigAudit"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DocumentConfigAudit_timestamp_idx" ON "public"."DocumentConfigAudit"("timestamp");

-- CreateIndex
CREATE INDEX "DocumentConfigAudit_userId_idx" ON "public"."DocumentConfigAudit"("userId");

-- CreateIndex
CREATE INDEX "DocumentCustomField_documentType_idx" ON "public"."DocumentCustomField"("documentType");

-- CreateIndex
CREATE INDEX "DocumentCustomField_isActive_idx" ON "public"."DocumentCustomField"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCustomField_documentType_fieldName_key" ON "public"."DocumentCustomField"("documentType", "fieldName");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentNotificationTemplate_code_key" ON "public"."DocumentNotificationTemplate"("code");

-- CreateIndex
CREATE INDEX "DocumentNotificationTemplate_documentType_eventType_idx" ON "public"."DocumentNotificationTemplate"("documentType", "eventType");

-- CreateIndex
CREATE INDEX "DocumentNotificationTemplate_isActive_idx" ON "public"."DocumentNotificationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "DocumentPermission_role_idx" ON "public"."DocumentPermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPermission_role_documentType_key" ON "public"."DocumentPermission"("role", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSystemConfig_key_key" ON "public"."DocumentSystemConfig"("key");

-- CreateIndex
CREATE INDEX "DocumentSystemConfig_category_idx" ON "public"."DocumentSystemConfig"("category");

-- CreateIndex
CREATE INDEX "DocumentSystemConfig_key_idx" ON "public"."DocumentSystemConfig"("key");

-- CreateIndex
CREATE INDEX "DocumentTemplate_createdById_idx" ON "public"."DocumentTemplate"("createdById");

-- CreateIndex
CREATE INDEX "DocumentTemplate_deletedAt_idx" ON "public"."DocumentTemplate"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeConfig_code_key" ON "public"."DocumentTypeConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeConfig_formTemplateId_key" ON "public"."DocumentTypeConfig"("formTemplateId");

-- CreateIndex
CREATE INDEX "DocumentTypeConfig_category_idx" ON "public"."DocumentTypeConfig"("category");

-- CreateIndex
CREATE INDEX "DocumentTypeConfig_isActive_idx" ON "public"."DocumentTypeConfig"("isActive");

-- CreateIndex
CREATE INDEX "DocumentTypeConfig_sortOrder_idx" ON "public"."DocumentTypeConfig"("sortOrder");

-- CreateIndex
CREATE INDEX "DocumentUIConfig_page_idx" ON "public"."DocumentUIConfig"("page");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentUIConfig_page_role_key" ON "public"."DocumentUIConfig"("page", "role");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "public"."EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "public"."EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_to_idx" ON "public"."EmailLog"("to");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarToken_professionalId_key" ON "public"."GoogleCalendarToken"("professionalId");

-- CreateIndex
CREATE INDEX "HealthCheckResult_module_idx" ON "public"."HealthCheckResult"("module");

-- CreateIndex
CREATE INDEX "HealthCheckResult_status_idx" ON "public"."HealthCheckResult"("status");

-- CreateIndex
CREATE INDEX "HealthCheckResult_timestamp_idx" ON "public"."HealthCheckResult"("timestamp");

-- CreateIndex
CREATE INDEX "HealthCheckSummary_createdAt_idx" ON "public"."HealthCheckSummary"("createdAt");

-- CreateIndex
CREATE INDEX "HealthCheckSummary_overallStatus_idx" ON "public"."HealthCheckSummary"("overallStatus");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionFieldType_code_key" ON "public"."InterventionFieldType"("code");

-- CreateIndex
CREATE INDEX "InterventionFieldType_code_idx" ON "public"."InterventionFieldType"("code");

-- CreateIndex
CREATE INDEX "InterventionFieldType_isActive_idx" ON "public"."InterventionFieldType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionMaterial_code_key" ON "public"."InterventionMaterial"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionMaterial_barcode_key" ON "public"."InterventionMaterial"("barcode");

-- CreateIndex
CREATE INDEX "InterventionMaterial_barcode_idx" ON "public"."InterventionMaterial"("barcode");

-- CreateIndex
CREATE INDEX "InterventionMaterial_category_idx" ON "public"."InterventionMaterial"("category");

-- CreateIndex
CREATE INDEX "InterventionMaterial_code_idx" ON "public"."InterventionMaterial"("code");

-- CreateIndex
CREATE INDEX "InterventionMaterial_name_idx" ON "public"."InterventionMaterial"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionReport_reportNumber_key" ON "public"."InterventionReport"("reportNumber");

-- CreateIndex
CREATE INDEX "InterventionReport_clientId_idx" ON "public"."InterventionReport"("clientId");

-- CreateIndex
CREATE INDEX "InterventionReport_interventionDate_idx" ON "public"."InterventionReport"("interventionDate");

-- CreateIndex
CREATE INDEX "InterventionReport_isDraft_idx" ON "public"."InterventionReport"("isDraft");

-- CreateIndex
CREATE INDEX "InterventionReport_professionalId_idx" ON "public"."InterventionReport"("professionalId");

-- CreateIndex
CREATE INDEX "InterventionReport_reportNumber_idx" ON "public"."InterventionReport"("reportNumber");

-- CreateIndex
CREATE INDEX "InterventionReport_requestId_idx" ON "public"."InterventionReport"("requestId");

-- CreateIndex
CREATE INDEX "InterventionReport_statusId_idx" ON "public"."InterventionReport"("statusId");

-- CreateIndex
CREATE INDEX "InterventionReportConfig_name_idx" ON "public"."InterventionReportConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionReportStatus_code_key" ON "public"."InterventionReportStatus"("code");

-- CreateIndex
CREATE INDEX "InterventionReportStatus_code_idx" ON "public"."InterventionReportStatus"("code");

-- CreateIndex
CREATE INDEX "InterventionReportStatus_isActive_idx" ON "public"."InterventionReportStatus"("isActive");

-- CreateIndex
CREATE INDEX "InterventionReportStatus_isDefault_idx" ON "public"."InterventionReportStatus"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionReportTemplate_code_key" ON "public"."InterventionReportTemplate"("code");

-- CreateIndex
CREATE INDEX "InterventionReportTemplate_categoryId_idx" ON "public"."InterventionReportTemplate"("categoryId");

-- CreateIndex
CREATE INDEX "InterventionReportTemplate_code_idx" ON "public"."InterventionReportTemplate"("code");

-- CreateIndex
CREATE INDEX "InterventionReportTemplate_isActive_idx" ON "public"."InterventionReportTemplate"("isActive");

-- CreateIndex
CREATE INDEX "InterventionReportTemplate_isDefault_idx" ON "public"."InterventionReportTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "InterventionReportTemplate_subcategoryId_idx" ON "public"."InterventionReportTemplate"("subcategoryId");

-- CreateIndex
CREATE INDEX "InterventionTemplateField_displayOrder_idx" ON "public"."InterventionTemplateField"("displayOrder");

-- CreateIndex
CREATE INDEX "InterventionTemplateField_sectionCode_idx" ON "public"."InterventionTemplateField"("sectionCode");

-- CreateIndex
CREATE INDEX "InterventionTemplateField_templateId_idx" ON "public"."InterventionTemplateField"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionTemplateField_templateId_code_key" ON "public"."InterventionTemplateField"("templateId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionTemplateSection_code_key" ON "public"."InterventionTemplateSection"("code");

-- CreateIndex
CREATE INDEX "InterventionTemplateSection_code_idx" ON "public"."InterventionTemplateSection"("code");

-- CreateIndex
CREATE INDEX "InterventionTemplateSection_isActive_idx" ON "public"."InterventionTemplateSection"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionType_code_key" ON "public"."InterventionType"("code");

-- CreateIndex
CREATE INDEX "InterventionType_code_idx" ON "public"."InterventionType"("code");

-- CreateIndex
CREATE INDEX "InterventionType_isActive_idx" ON "public"."InterventionType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "public"."Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_issueDate_idx" ON "public"."Invoice"("issueDate");

-- CreateIndex
CREATE INDEX "Invoice_paymentId_idx" ON "public"."Invoice"("paymentId");

-- CreateIndex
CREATE INDEX "Invoice_professionalId_idx" ON "public"."Invoice"("professionalId");

-- CreateIndex
CREATE INDEX "Invoice_quoteId_idx" ON "public"."Invoice"("quoteId");

-- CreateIndex
CREATE INDEX "Invoice_requestId_idx" ON "public"."Invoice"("requestId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- CreateIndex
CREATE INDEX "KbDocument_processingStatus_idx" ON "public"."KbDocument"("processingStatus");

-- CreateIndex
CREATE INDEX "KbDocument_subcategoryId_idx" ON "public"."KbDocument"("subcategoryId");

-- CreateIndex
CREATE INDEX "KbDocumentChunk_chunkIndex_idx" ON "public"."KbDocumentChunk"("chunkIndex");

-- CreateIndex
CREATE INDEX "KbDocumentChunk_documentId_idx" ON "public"."KbDocumentChunk"("documentId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_isActive_idx" ON "public"."KnowledgeBase"("isActive");

-- CreateIndex
CREATE INDEX "KnowledgeBase_professionalId_idx" ON "public"."KnowledgeBase"("professionalId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_subcategoryId_idx" ON "public"."KnowledgeBase"("subcategoryId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_targetAudience_idx" ON "public"."KnowledgeBase"("targetAudience");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_professionalId_subcategoryId_fileName_key" ON "public"."KnowledgeBase"("professionalId", "subcategoryId", "fileName");

-- CreateIndex
CREATE INDEX "KnowledgeBaseConfig_professionalId_idx" ON "public"."KnowledgeBaseConfig"("professionalId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseConfig_subcategoryId_idx" ON "public"."KnowledgeBaseConfig"("subcategoryId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseConfig_targetAudience_idx" ON "public"."KnowledgeBaseConfig"("targetAudience");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseConfig_professionalId_subcategoryId_targetAudi_key" ON "public"."KnowledgeBaseConfig"("professionalId", "subcategoryId", "targetAudience");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_formTemplateId_key" ON "public"."LegalDocument"("formTemplateId");

-- CreateIndex
CREATE INDEX "LegalDocument_isRequired_idx" ON "public"."LegalDocument"("isRequired");

-- CreateIndex
CREATE INDEX "LegalDocument_typeConfigId_idx" ON "public"."LegalDocument"("typeConfigId");

-- CreateIndex
CREATE INDEX "LegalDocument_type_isActive_idx" ON "public"."LegalDocument"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_type_internalName_key" ON "public"."LegalDocument"("type", "internalName");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentTemplate_name_key" ON "public"."LegalDocumentTemplate"("name");

-- CreateIndex
CREATE INDEX "LegalDocumentTemplate_category_idx" ON "public"."LegalDocumentTemplate"("category");

-- CreateIndex
CREATE INDEX "LegalDocumentTemplate_type_language_idx" ON "public"."LegalDocumentTemplate"("type", "language");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_documentId_status_idx" ON "public"."LegalDocumentVersion"("documentId", "status");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_status_effectiveDate_idx" ON "public"."LegalDocumentVersion"("status", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentVersion_documentId_version_key" ON "public"."LegalDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "LoginHistory_createdAt_idx" ON "public"."LoginHistory"("createdAt");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_idx" ON "public"."LoginHistory"("userId");

-- CreateIndex
CREATE INDEX "Message_isRead_idx" ON "public"."Message"("isRead");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "public"."Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_requestId_idx" ON "public"."Message"("requestId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "ModuleHistory_action_idx" ON "public"."ModuleHistory"("action");

-- CreateIndex
CREATE INDEX "ModuleHistory_createdAt_idx" ON "public"."ModuleHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ModuleHistory_moduleType_idx" ON "public"."ModuleHistory"("moduleType");

-- CreateIndex
CREATE INDEX "ModuleHistory_userId_idx" ON "public"."ModuleHistory"("userId");

-- CreateIndex
CREATE INDEX "ModuleSetting_moduleCode_idx" ON "public"."ModuleSetting"("moduleCode");

-- CreateIndex
CREATE INDEX "ModuleSetting_type_idx" ON "public"."ModuleSetting"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSetting_moduleCode_key_key" ON "public"."ModuleSetting"("moduleCode", "key");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "public"."Notification"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_senderId_idx" ON "public"."Notification"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationChannel_code_key" ON "public"."NotificationChannel"("code");

-- CreateIndex
CREATE INDEX "NotificationChannel_code_idx" ON "public"."NotificationChannel"("code");

-- CreateIndex
CREATE INDEX "NotificationChannel_isActive_idx" ON "public"."NotificationChannel"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEvent_code_key" ON "public"."NotificationEvent"("code");

-- CreateIndex
CREATE INDEX "NotificationEvent_code_idx" ON "public"."NotificationEvent"("code");

-- CreateIndex
CREATE INDEX "NotificationEvent_eventType_idx" ON "public"."NotificationEvent"("eventType");

-- CreateIndex
CREATE INDEX "NotificationEvent_isActive_idx" ON "public"."NotificationEvent"("isActive");

-- CreateIndex
CREATE INDEX "NotificationEvent_templateId_idx" ON "public"."NotificationEvent"("templateId");

-- CreateIndex
CREATE INDEX "NotificationLog_channel_idx" ON "public"."NotificationLog"("channel");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "public"."NotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_recipientId_idx" ON "public"."NotificationLog"("recipientId");

-- CreateIndex
CREATE INDEX "NotificationLog_sentAt_idx" ON "public"."NotificationLog"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "public"."NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_templateId_idx" ON "public"."NotificationLog"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "public"."NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationQueue_channel_idx" ON "public"."NotificationQueue"("channel");

-- CreateIndex
CREATE INDEX "NotificationQueue_priority_idx" ON "public"."NotificationQueue"("priority");

-- CreateIndex
CREATE INDEX "NotificationQueue_recipientId_idx" ON "public"."NotificationQueue"("recipientId");

-- CreateIndex
CREATE INDEX "NotificationQueue_scheduledFor_idx" ON "public"."NotificationQueue"("scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationQueue_status_idx" ON "public"."NotificationQueue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_code_key" ON "public"."NotificationTemplate"("code");

-- CreateIndex
CREATE INDEX "NotificationTemplate_category_idx" ON "public"."NotificationTemplate"("category");

-- CreateIndex
CREATE INDEX "NotificationTemplate_code_idx" ON "public"."NotificationTemplate"("code");

-- CreateIndex
CREATE INDEX "NotificationTemplate_isActive_idx" ON "public"."NotificationTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "OldPayment_transactionId_key" ON "public"."OldPayment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "OldPayment_stripePaymentId_key" ON "public"."OldPayment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "OldPayment_quoteId_idx" ON "public"."OldPayment"("quoteId");

-- CreateIndex
CREATE INDEX "OldPayment_status_idx" ON "public"."OldPayment"("status");

-- CreateIndex
CREATE INDEX "OldPayment_stripePaymentId_idx" ON "public"."OldPayment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "OldPayment_transactionId_idx" ON "public"."OldPayment"("transactionId");

-- CreateIndex
CREATE INDEX "OldPayment_userId_idx" ON "public"."OldPayment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "public"."Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "public"."Payment"("clientId");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "public"."Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_professionalId_idx" ON "public"."Payment"("professionalId");

-- CreateIndex
CREATE INDEX "Payment_quoteId_idx" ON "public"."Payment"("quoteId");

-- CreateIndex
CREATE INDEX "Payment_requestId_idx" ON "public"."Payment"("requestId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "public"."Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "PaymentSplit_paymentId_idx" ON "public"."PaymentSplit"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentSplit_professionalId_idx" ON "public"."PaymentSplit"("professionalId");

-- CreateIndex
CREATE INDEX "PaymentSplit_status_idx" ON "public"."PaymentSplit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stripeTransferId_key" ON "public"."Payout"("stripeTransferId");

-- CreateIndex
CREATE INDEX "Payout_professionalId_idx" ON "public"."Payout"("professionalId");

-- CreateIndex
CREATE INDEX "Payout_scheduledFor_idx" ON "public"."Payout"("scheduledFor");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "public"."Payout"("status");

-- CreateIndex
CREATE INDEX "Payout_stripeTransferId_idx" ON "public"."Payout"("stripeTransferId");

-- CreateIndex
CREATE INDEX "PerformanceMetrics_timestamp_idx" ON "public"."PerformanceMetrics"("timestamp");

-- CreateIndex
CREATE INDEX "PointTransaction_createdAt_idx" ON "public"."PointTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "PointTransaction_type_idx" ON "public"."PointTransaction"("type");

-- CreateIndex
CREATE INDEX "PointTransaction_userId_idx" ON "public"."PointTransaction"("userId");

-- CreateIndex
CREATE INDEX "PointTransaction_userPointsId_idx" ON "public"."PointTransaction"("userPointsId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_requestId_key" ON "public"."Portfolio"("requestId");

-- CreateIndex
CREATE INDEX "Portfolio_categoryId_idx" ON "public"."Portfolio"("categoryId");

-- CreateIndex
CREATE INDEX "Portfolio_isPublic_idx" ON "public"."Portfolio"("isPublic");

-- CreateIndex
CREATE INDEX "Portfolio_professionalId_idx" ON "public"."Portfolio"("professionalId");

-- CreateIndex
CREATE INDEX "Portfolio_viewCount_idx" ON "public"."Portfolio"("viewCount");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_name_key" ON "public"."Profession"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_slug_key" ON "public"."Profession"("slug");

-- CreateIndex
CREATE INDEX "Profession_isActive_idx" ON "public"."Profession"("isActive");

-- CreateIndex
CREATE INDEX "Profession_slug_idx" ON "public"."Profession"("slug");

-- CreateIndex
CREATE INDEX "ProfessionCategory_categoryId_idx" ON "public"."ProfessionCategory"("categoryId");

-- CreateIndex
CREATE INDEX "ProfessionCategory_professionId_idx" ON "public"."ProfessionCategory"("professionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionCategory_professionId_categoryId_key" ON "public"."ProfessionCategory"("professionId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalAiCustomization_professionalId_subcategoryId_key" ON "public"."ProfessionalAiCustomization"("professionalId", "subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalAiSettings_userId_subcategoryId_key" ON "public"."ProfessionalAiSettings"("professionalId", "subcategoryId");

-- CreateIndex
CREATE INDEX "ProfessionalMaterial_professionalId_category_idx" ON "public"."ProfessionalMaterial"("professionalId", "category");

-- CreateIndex
CREATE INDEX "ProfessionalMaterial_professionalId_isFavorite_idx" ON "public"."ProfessionalMaterial"("professionalId", "isFavorite");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalMaterial_professionalId_code_key" ON "public"."ProfessionalMaterial"("professionalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalPaymentSettings_professionalId_key" ON "public"."ProfessionalPaymentSettings"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalPricing_userId_key" ON "public"."ProfessionalPricing"("userId");

-- CreateIndex
CREATE INDEX "ProfessionalReportFolder_displayOrder_idx" ON "public"."ProfessionalReportFolder"("displayOrder");

-- CreateIndex
CREATE INDEX "ProfessionalReportFolder_professionalId_idx" ON "public"."ProfessionalReportFolder"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalReportFolder_professionalId_name_key" ON "public"."ProfessionalReportFolder"("professionalId", "name");

-- CreateIndex
CREATE INDEX "ProfessionalReportPhrase_isFavorite_idx" ON "public"."ProfessionalReportPhrase"("isFavorite");

-- CreateIndex
CREATE INDEX "ProfessionalReportPhrase_professionalId_category_idx" ON "public"."ProfessionalReportPhrase"("professionalId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalReportPhrase_professionalId_code_key" ON "public"."ProfessionalReportPhrase"("professionalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalReportSettings_professionalId_key" ON "public"."ProfessionalReportSettings"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalReportTemplate_isActive_idx" ON "public"."ProfessionalReportTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ProfessionalReportTemplate_isDefault_idx" ON "public"."ProfessionalReportTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "ProfessionalReportTemplate_professionalId_idx" ON "public"."ProfessionalReportTemplate"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalUserSubcategory_subcategoryId_idx" ON "public"."ProfessionalUserSubcategory"("subcategoryId");

-- CreateIndex
CREATE INDEX "ProfessionalUserSubcategory_userId_idx" ON "public"."ProfessionalUserSubcategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalUserSubcategory_userId_subcategoryId_key" ON "public"."ProfessionalUserSubcategory"("userId", "subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalWhatsApp_instanceId_key" ON "public"."ProfessionalWhatsApp"("instanceId");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsApp_instanceId_idx" ON "public"."ProfessionalWhatsApp"("instanceId");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsApp_professionalId_idx" ON "public"."ProfessionalWhatsApp"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsApp_status_idx" ON "public"."ProfessionalWhatsApp"("status");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppAnalytics_date_idx" ON "public"."ProfessionalWhatsAppAnalytics"("date");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppAnalytics_whatsappId_idx" ON "public"."ProfessionalWhatsAppAnalytics"("whatsappId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalWhatsAppAnalytics_whatsappId_date_hour_key" ON "public"."ProfessionalWhatsAppAnalytics"("whatsappId", "date", "hour");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppContact_contactType_idx" ON "public"."ProfessionalWhatsAppContact"("contactType");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppContact_phoneNumber_idx" ON "public"."ProfessionalWhatsAppContact"("phoneNumber");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppContact_status_idx" ON "public"."ProfessionalWhatsAppContact"("status");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppContact_whatsappId_idx" ON "public"."ProfessionalWhatsAppContact"("whatsappId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalWhatsAppContact_whatsappId_phoneNumber_key" ON "public"."ProfessionalWhatsAppContact"("whatsappId", "phoneNumber");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppDetectionOverride_createdAt_idx" ON "public"."ProfessionalWhatsAppDetectionOverride"("createdAt");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppDetectionOverride_phoneNumber_idx" ON "public"."ProfessionalWhatsAppDetectionOverride"("phoneNumber");

-- CreateIndex
CREATE INDEX "ProfessionalWhatsAppDetectionOverride_whatsappId_idx" ON "public"."ProfessionalWhatsAppDetectionOverride"("whatsappId");

-- CreateIndex
CREATE INDEX "Quote_professionalId_idx" ON "public"."Quote"("professionalId");

-- CreateIndex
CREATE INDEX "Quote_requestId_idx" ON "public"."Quote"("requestId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "public"."Quote"("status");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "public"."QuoteItem"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteRevision_quoteId_idx" ON "public"."QuoteRevision"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteRevision_userId_idx" ON "public"."QuoteRevision"("userId");

-- CreateIndex
CREATE INDEX "QuoteTemplate_userId_idx" ON "public"."QuoteTemplate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_refereeId_key" ON "public"."Referral"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "public"."Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "public"."Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "public"."Referral"("createdAt");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "public"."Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "public"."Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "public"."Refund"("stripeRefundId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "public"."Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "public"."Refund"("status");

-- CreateIndex
CREATE INDEX "Refund_stripeRefundId_idx" ON "public"."Refund"("stripeRefundId");

-- CreateIndex
CREATE INDEX "RequestAttachment_requestId_idx" ON "public"."RequestAttachment"("requestId");

-- CreateIndex
CREATE INDEX "RequestAttachment_userId_idx" ON "public"."RequestAttachment"("userId");

-- CreateIndex
CREATE INDEX "RequestChatMessage_createdAt_idx" ON "public"."RequestChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "RequestChatMessage_isDeleted_idx" ON "public"."RequestChatMessage"("isDeleted");

-- CreateIndex
CREATE INDEX "RequestChatMessage_requestId_idx" ON "public"."RequestChatMessage"("requestId");

-- CreateIndex
CREATE INDEX "RequestChatMessage_userId_idx" ON "public"."RequestChatMessage"("userId");

-- CreateIndex
CREATE INDEX "RequestUpdate_requestId_idx" ON "public"."RequestUpdate"("requestId");

-- CreateIndex
CREATE INDEX "RequestUpdate_userId_idx" ON "public"."RequestUpdate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_requestId_key" ON "public"."Review"("requestId");

-- CreateIndex
CREATE INDEX "Review_clientId_idx" ON "public"."Review"("clientId");

-- CreateIndex
CREATE INDEX "Review_professionalId_idx" ON "public"."Review"("professionalId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "public"."Review"("rating");

-- CreateIndex
CREATE INDEX "ScheduledIntervention_professionalId_idx" ON "public"."ScheduledIntervention"("professionalId");

-- CreateIndex
CREATE INDEX "ScheduledIntervention_professionalId_proposedDate_status_idx" ON "public"."ScheduledIntervention"("professionalId", "proposedDate", "status");

-- CreateIndex
CREATE INDEX "ScheduledIntervention_professionalId_status_idx" ON "public"."ScheduledIntervention"("professionalId", "status");

-- CreateIndex
CREATE INDEX "ScheduledIntervention_proposedDate_idx" ON "public"."ScheduledIntervention"("proposedDate");

-- CreateIndex
CREATE INDEX "ScheduledIntervention_proposedDate_status_idx" ON "public"."ScheduledIntervention"("proposedDate", "status");

-- CreateIndex
CREATE INDEX "ScheduledIntervention_requestId_idx" ON "public"."ScheduledIntervention"("requestId");

-- CreateIndex
CREATE INDEX "ScheduledIntervention_status_idx" ON "public"."ScheduledIntervention"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptConfiguration_scriptName_key" ON "public"."ScriptConfiguration"("scriptName");

-- CreateIndex
CREATE INDEX "ScriptConfiguration_category_idx" ON "public"."ScriptConfiguration"("category");

-- CreateIndex
CREATE INDEX "ScriptConfiguration_isEnabled_isVisible_idx" ON "public"."ScriptConfiguration"("isEnabled", "isVisible");

-- CreateIndex
CREATE INDEX "ScriptConfiguration_scriptName_idx" ON "public"."ScriptConfiguration"("scriptName");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnect_professionalId_key" ON "public"."StripeConnect"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnect_stripeAccountId_key" ON "public"."StripeConnect"("stripeAccountId");

-- CreateIndex
CREATE INDEX "StripeConnect_stripeAccountId_idx" ON "public"."StripeConnect"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Subcategory_categoryId_idx" ON "public"."Subcategory"("categoryId");

-- CreateIndex
CREATE INDEX "Subcategory_isActive_idx" ON "public"."Subcategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_slug_key" ON "public"."Subcategory"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubcategoryAiSettings_subcategoryId_key" ON "public"."SubcategoryAiSettings"("subcategoryId");

-- CreateIndex
CREATE INDEX "SubcategoryAiSettings_subcategoryId_idx" ON "public"."SubcategoryAiSettings"("subcategoryId");

-- CreateIndex
CREATE INDEX "SystemBackup_createdAt_idx" ON "public"."SystemBackup"("createdAt");

-- CreateIndex
CREATE INDEX "SystemBackup_deletedAt_idx" ON "public"."SystemBackup"("deletedAt");

-- CreateIndex
CREATE INDEX "SystemBackup_expiresAt_idx" ON "public"."SystemBackup"("expiresAt");

-- CreateIndex
CREATE INDEX "SystemBackup_status_idx" ON "public"."SystemBackup"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SystemModule_code_key" ON "public"."SystemModule"("code");

-- CreateIndex
CREATE INDEX "SystemModule_category_idx" ON "public"."SystemModule"("category");

-- CreateIndex
CREATE INDEX "SystemModule_code_idx" ON "public"."SystemModule"("code");

-- CreateIndex
CREATE INDEX "SystemModule_isActive_idx" ON "public"."SystemModule"("isActive");

-- CreateIndex
CREATE INDEX "SystemModule_isEnabled_idx" ON "public"."SystemModule"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "public"."SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "public"."SystemSetting"("category");

-- CreateIndex
CREATE INDEX "SystemSetting_isPublic_idx" ON "public"."SystemSetting"("isPublic");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "public"."SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "public"."SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_category_idx" ON "public"."SystemSettings"("category");

-- CreateIndex
CREATE INDEX "SystemSettings_isActive_idx" ON "public"."SystemSettings"("isActive");

-- CreateIndex
CREATE INDEX "TestHistory_category_idx" ON "public"."TestHistory"("category");

-- CreateIndex
CREATE INDEX "TestHistory_createdAt_idx" ON "public"."TestHistory"("createdAt");

-- CreateIndex
CREATE INDEX "TestHistory_successRate_idx" ON "public"."TestHistory"("successRate");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "public"."User"("referralCode");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_latitude_longitude_idx" ON "public"."User"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_workLatitude_workLongitude_idx" ON "public"."User"("workLatitude", "workLongitude");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_acceptedAt_idx" ON "public"."UserLegalAcceptance"("acceptedAt");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_documentId_versionId_idx" ON "public"."UserLegalAcceptance"("documentId", "versionId");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_userId_acceptedAt_idx" ON "public"."UserLegalAcceptance"("userId", "acceptedAt");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_userId_isActive_idx" ON "public"."UserLegalAcceptance"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserLegalAcceptance_userId_documentId_versionId_key" ON "public"."UserLegalAcceptance"("userId", "documentId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPoints_userId_key" ON "public"."UserPoints"("userId");

-- CreateIndex
CREATE INDEX "UserPoints_userId_idx" ON "public"."UserPoints"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_phoneNumber_key" ON "public"."WhatsAppContact"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_whatsappId_key" ON "public"."WhatsAppContact"("whatsappId");

-- CreateIndex
CREATE INDEX "WhatsAppContact_isBusiness_idx" ON "public"."WhatsAppContact"("isBusiness");

-- CreateIndex
CREATE INDEX "WhatsAppContact_isMyContact_idx" ON "public"."WhatsAppContact"("isMyContact");

-- CreateIndex
CREATE INDEX "WhatsAppContact_professionalId_idx" ON "public"."WhatsAppContact"("professionalId");

-- CreateIndex
CREATE INDEX "WhatsAppContact_userId_idx" ON "public"."WhatsAppContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppGroup_groupId_key" ON "public"."WhatsAppGroup"("groupId");

-- CreateIndex
CREATE INDEX "WhatsAppGroup_groupId_idx" ON "public"."WhatsAppGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_messageId_key" ON "public"."WhatsAppMessage"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_chatId_idx" ON "public"."WhatsAppMessage"("chatId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_direction_idx" ON "public"."WhatsAppMessage"("direction");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_phoneNumber_idx" ON "public"."WhatsAppMessage"("phoneNumber");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_requestId_idx" ON "public"."WhatsAppMessage"("requestId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_status_idx" ON "public"."WhatsAppMessage"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_timestamp_idx" ON "public"."WhatsAppMessage"("timestamp");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_userId_idx" ON "public"."WhatsAppMessage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_sessionName_key" ON "public"."WhatsAppSession"("sessionName");

-- CreateIndex
CREATE INDEX "WhatsAppSession_isActive_idx" ON "public"."WhatsAppSession"("isActive");

-- CreateIndex
CREATE INDEX "WhatsAppSession_sessionName_idx" ON "public"."WhatsAppSession"("sessionName");

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_email_key" ON "public"."CrmContact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_phoneNumber_key" ON "public"."CrmContact"("phoneNumber");

-- CreateIndex
CREATE INDEX "CrmContact_source_status_idx" ON "public"."CrmContact"("source", "status");

-- CreateIndex
CREATE INDEX "CrmContact_email_idx" ON "public"."CrmContact"("email");

-- CreateIndex
CREATE INDEX "CrmContact_phoneNumber_idx" ON "public"."CrmContact"("phoneNumber");

-- CreateIndex
CREATE INDEX "CrmContact_referralId_idx" ON "public"."CrmContact"("referralId");

-- CreateIndex
CREATE INDEX "OnboardingStep_templateId_role_order_idx" ON "public"."OnboardingStep"("templateId", "role", "order");

-- CreateIndex
CREATE INDEX "OnboardingTask_templateId_role_order_idx" ON "public"."OnboardingTask"("templateId", "role", "order");

-- CreateIndex
CREATE INDEX "OnboardingTemplate_environment_isDefault_idx" ON "public"."OnboardingTemplate"("environment", "isDefault");

-- CreateIndex
CREATE INDEX "OnboardingTemplate_status_idx" ON "public"."OnboardingTemplate"("status");

-- CreateIndex
CREATE INDEX "ProfessionalBadgeAssignment_professionalId_idx" ON "public"."ProfessionalBadgeAssignment"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalBadgeAssignment_professionalId_badgeId_key" ON "public"."ProfessionalBadgeAssignment"("professionalId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewAnalytics_date_key" ON "public"."ReviewAnalytics"("date");

-- CreateIndex
CREATE INDEX "ReviewAnalytics_date_idx" ON "public"."ReviewAnalytics"("date");

-- CreateIndex
CREATE INDEX "ReviewExclusion_isActive_idx" ON "public"."ReviewExclusion"("isActive");

-- CreateIndex
CREATE INDEX "ReviewExclusion_type_idx" ON "public"."ReviewExclusion"("type");

-- CreateIndex
CREATE INDEX "ReviewExclusion_userId_idx" ON "public"."ReviewExclusion"("userId");

-- CreateIndex
CREATE INDEX "ReviewResponseTemplate_category_idx" ON "public"."ReviewResponseTemplate"("category");

-- CreateIndex
CREATE INDEX "ReviewResponseTemplate_professionalId_idx" ON "public"."ReviewResponseTemplate"("professionalId");

-- CreateIndex
CREATE INDEX "DocumentFormTemplate_documentTypeId_idx" ON "public"."DocumentFormTemplate"("documentTypeId");

-- CreateIndex
CREATE INDEX "DocumentFormTemplate_formId_idx" ON "public"."DocumentFormTemplate"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFormTemplate_documentTypeId_formId_key" ON "public"."DocumentFormTemplate"("documentTypeId", "formId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "public"."NotificationDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_idx" ON "public"."NotificationDelivery"("channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "public"."NotificationDelivery"("status");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "public"."PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_isActive_idx" ON "public"."PushSubscription"("isActive");

-- CreateIndex
CREATE INDEX "PushSubscription_endpoint_idx" ON "public"."PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "ScheduledNotification_userId_idx" ON "public"."ScheduledNotification"("userId");

-- CreateIndex
CREATE INDEX "ScheduledNotification_scheduledAt_idx" ON "public"."ScheduledNotification"("scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledNotification_status_idx" ON "public"."ScheduledNotification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomForm_documentTypeId_key" ON "public"."CustomForm"("documentTypeId");

-- CreateIndex
CREATE INDEX "CustomForm_isDefault_isPublished_idx" ON "public"."CustomForm"("isDefault", "isPublished");

-- CreateIndex
CREATE INDEX "CustomForm_isTemplate_isDefaultTemplate_idx" ON "public"."CustomForm"("isTemplate", "isDefaultTemplate");

-- CreateIndex
CREATE INDEX "CustomForm_subcategoryId_isTemplate_idx" ON "public"."CustomForm"("subcategoryId", "isTemplate");

-- CreateIndex
CREATE INDEX "CustomForm_subcategoryId_isDefaultTemplate_idx" ON "public"."CustomForm"("subcategoryId", "isDefaultTemplate");

-- CreateIndex
CREATE INDEX "CustomForm_subcategoryId_idx" ON "public"."CustomForm"("subcategoryId");

-- CreateIndex
CREATE INDEX "CustomForm_professionalId_idx" ON "public"."CustomForm"("professionalId");

-- CreateIndex
CREATE INDEX "CustomForm_createdBy_idx" ON "public"."CustomForm"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "CustomForm_subcategoryId_professionalId_version_key" ON "public"."CustomForm"("subcategoryId", "professionalId", "version");

-- CreateIndex
CREATE INDEX "CustomFormField_customFormId_displayOrder_idx" ON "public"."CustomFormField"("customFormId", "displayOrder");

-- CreateIndex
CREATE INDEX "CustomFormField_fieldType_idx" ON "public"."CustomFormField"("fieldType");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFormField_customFormId_code_key" ON "public"."CustomFormField"("customFormId", "code");

-- CreateIndex
CREATE INDEX "CustomFormCommission_professionalId_status_idx" ON "public"."CustomFormCommission"("professionalId", "status");

-- CreateIndex
CREATE INDEX "CustomFormCommission_status_priority_idx" ON "public"."CustomFormCommission"("status", "priority");

-- CreateIndex
CREATE INDEX "CustomFormCommission_subcategoryId_idx" ON "public"."CustomFormCommission"("subcategoryId");

-- CreateIndex
CREATE INDEX "CustomFormCommission_assignedTo_idx" ON "public"."CustomFormCommission"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFormValidationRule_code_key" ON "public"."CustomFormValidationRule"("code");

-- CreateIndex
CREATE INDEX "CustomFormValidationRule_isActive_idx" ON "public"."CustomFormValidationRule"("isActive");

-- CreateIndex
CREATE INDEX "CustomFormUsageLog_customFormId_idx" ON "public"."CustomFormUsageLog"("customFormId");

-- CreateIndex
CREATE INDEX "CustomFormUsageLog_requestId_idx" ON "public"."CustomFormUsageLog"("requestId");

-- CreateIndex
CREATE INDEX "CustomFormUsageLog_submittedAt_idx" ON "public"."CustomFormUsageLog"("submittedAt");

-- CreateIndex
CREATE INDEX "RequestCustomForm_requestId_idx" ON "public"."RequestCustomForm"("requestId");

-- CreateIndex
CREATE INDEX "RequestCustomForm_customFormId_idx" ON "public"."RequestCustomForm"("customFormId");

-- CreateIndex
CREATE INDEX "RequestCustomForm_submittedBy_idx" ON "public"."RequestCustomForm"("submittedBy");

-- CreateIndex
CREATE INDEX "RequestCustomFormResponse_requestCustomFormId_idx" ON "public"."RequestCustomFormResponse"("requestCustomFormId");

-- CreateIndex
CREATE INDEX "RequestCustomFormResponse_fieldId_idx" ON "public"."RequestCustomFormResponse"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestCustomFormResponse_requestCustomFormId_fieldId_key" ON "public"."RequestCustomFormResponse"("requestCustomFormId", "fieldId");

-- CreateIndex
CREATE INDEX "_GroupMembers_B_index" ON "public"."_GroupMembers"("B");

-- AddForeignKey
ALTER TABLE "public"."AiConversation" ADD CONSTRAINT "AiConversation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiConversation" ADD CONSTRAINT "AiConversation_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."SubcategoryAiSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_selectedCustomFormId_fkey" FOREIGN KEY ("selectedCustomFormId") REFERENCES "public"."CustomForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackupExecution" ADD CONSTRAINT "BackupExecution_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."BackupSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackupLog" ADD CONSTRAINT "BackupLog_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "public"."SystemBackup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackupRestore" ADD CONSTRAINT "BackupRestore_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackupSchedule" ADD CONSTRAINT "BackupSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarAvailability" ADD CONSTRAINT "CalendarAvailability_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarBlock" ADD CONSTRAINT "CalendarBlock_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarException" ADD CONSTRAINT "CalendarException_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarSettings" ADD CONSTRAINT "CalendarSettings_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientAiSettings" ADD CONSTRAINT "ClientAiSettings_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientAiSettings" ADD CONSTRAINT "ClientAiSettings_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionRule" ADD CONSTRAINT "CommissionRule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintDraft" ADD CONSTRAINT "ComplaintDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepositRule" ADD CONSTRAINT "DepositRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCategory" ADD CONSTRAINT "DocumentCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."DocumentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoogleCalendarToken" ADD CONSTRAINT "GoogleCalendarToken_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReport" ADD CONSTRAINT "InterventionReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReport" ADD CONSTRAINT "InterventionReport_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReport" ADD CONSTRAINT "InterventionReport_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReport" ADD CONSTRAINT "InterventionReport_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."InterventionReportStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReport" ADD CONSTRAINT "InterventionReport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."InterventionReportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReport" ADD CONSTRAINT "InterventionReport_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."InterventionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReportTemplate" ADD CONSTRAINT "InterventionReportTemplate_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReportTemplate" ADD CONSTRAINT "InterventionReportTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReportTemplate" ADD CONSTRAINT "InterventionReportTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionReportTemplate" ADD CONSTRAINT "InterventionReportTemplate_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionTemplateField" ADD CONSTRAINT "InterventionTemplateField_fieldTypeId_fkey" FOREIGN KEY ("fieldTypeId") REFERENCES "public"."InterventionFieldType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InterventionTemplateField" ADD CONSTRAINT "InterventionTemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."InterventionReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KbDocument" ADD CONSTRAINT "KbDocument_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KbDocumentChunk" ADD CONSTRAINT "KbDocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."KbDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBaseConfig" ADD CONSTRAINT "KnowledgeBaseConfig_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBaseConfig" ADD CONSTRAINT "KnowledgeBaseConfig_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBaseDocument" ADD CONSTRAINT "KnowledgeBaseDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocument" ADD CONSTRAINT "LegalDocument_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocument" ADD CONSTRAINT "LegalDocument_typeConfigId_fkey" FOREIGN KEY ("typeConfigId") REFERENCES "public"."DocumentTypeConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocument" ADD CONSTRAINT "LegalDocument_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "public"."CustomForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_archivedBy_fkey" FOREIGN KEY ("archivedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."LegalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModuleHistory" ADD CONSTRAINT "ModuleHistory_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "public"."Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModuleHistory" ADD CONSTRAINT "ModuleHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModuleSetting" ADD CONSTRAINT "ModuleSetting_moduleCode_fkey" FOREIGN KEY ("moduleCode") REFERENCES "public"."SystemModule"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationEvent" ADD CONSTRAINT "NotificationEvent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."NotificationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OldPayment" ADD CONSTRAINT "OldPayment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OldPayment" ADD CONSTRAINT "OldPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentSplit" ADD CONSTRAINT "PaymentSplit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentSplit" ADD CONSTRAINT "PaymentSplit_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointTransaction" ADD CONSTRAINT "PointTransaction_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointTransaction" ADD CONSTRAINT "PointTransaction_userPointsId_fkey" FOREIGN KEY ("userPointsId") REFERENCES "public"."UserPoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Portfolio" ADD CONSTRAINT "Portfolio_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Portfolio" ADD CONSTRAINT "Portfolio_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Portfolio" ADD CONSTRAINT "Portfolio_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionCategory" ADD CONSTRAINT "ProfessionCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionCategory" ADD CONSTRAINT "ProfessionCategory_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "public"."Profession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalAiCustomization" ADD CONSTRAINT "ProfessionalAiCustomization_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalAiCustomization" ADD CONSTRAINT "ProfessionalAiCustomization_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "public"."SubcategoryAiSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalAiSettings" ADD CONSTRAINT "ProfessionalAiSettings_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalAiSettings" ADD CONSTRAINT "ProfessionalAiSettings_userId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalCertification" ADD CONSTRAINT "ProfessionalCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalMaterial" ADD CONSTRAINT "ProfessionalMaterial_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalPaymentSettings" ADD CONSTRAINT "ProfessionalPaymentSettings_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalPaymentSettings" ADD CONSTRAINT "ProfessionalPaymentSettings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalPricing" ADD CONSTRAINT "ProfessionalPricing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalReportFolder" ADD CONSTRAINT "ProfessionalReportFolder_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalReportPhrase" ADD CONSTRAINT "ProfessionalReportPhrase_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalReportSettings" ADD CONSTRAINT "ProfessionalReportSettings_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalReportTemplate" ADD CONSTRAINT "ProfessionalReportTemplate_baseTemplateId_fkey" FOREIGN KEY ("baseTemplateId") REFERENCES "public"."InterventionReportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalReportTemplate" ADD CONSTRAINT "ProfessionalReportTemplate_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalSkill" ADD CONSTRAINT "ProfessionalSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalUserSubcategory" ADD CONSTRAINT "ProfessionalUserSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalUserSubcategory" ADD CONSTRAINT "ProfessionalUserSubcategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalWhatsApp" ADD CONSTRAINT "ProfessionalWhatsApp_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalWhatsAppAnalytics" ADD CONSTRAINT "ProfessionalWhatsAppAnalytics_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES "public"."ProfessionalWhatsApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalWhatsAppContact" ADD CONSTRAINT "ProfessionalWhatsAppContact_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES "public"."ProfessionalWhatsApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteRevision" ADD CONSTRAINT "QuoteRevision_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteRevision" ADD CONSTRAINT "QuoteRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteTemplate" ADD CONSTRAINT "QuoteTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestAttachment" ADD CONSTRAINT "RequestAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestAttachment" ADD CONSTRAINT "RequestAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestChatMessage" ADD CONSTRAINT "RequestChatMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestChatMessage" ADD CONSTRAINT "RequestChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestUpdate" ADD CONSTRAINT "RequestUpdate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestUpdate" ADD CONSTRAINT "RequestUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledIntervention" ADD CONSTRAINT "ScheduledIntervention_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledIntervention" ADD CONSTRAINT "ScheduledIntervention_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledIntervention" ADD CONSTRAINT "ScheduledIntervention_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScriptExecution" ADD CONSTRAINT "ScriptExecution_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScriptExecution" ADD CONSTRAINT "ScriptExecution_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "public"."ScriptConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripeConnect" ADD CONSTRAINT "StripeConnect_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubcategoryAiSettings" ADD CONSTRAINT "SubcategoryAiSettings_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemBackup" ADD CONSTRAINT "SystemBackup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemBackup" ADD CONSTRAINT "SystemBackup_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."BackupSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "public"."Profession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLegalAcceptance" ADD CONSTRAINT "UserLegalAcceptance_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLegalAcceptance" ADD CONSTRAINT "UserLegalAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLegalAcceptance" ADD CONSTRAINT "UserLegalAcceptance_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "public"."LegalDocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPoints" ADD CONSTRAINT "UserPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppContact" ADD CONSTRAINT "WhatsAppContact_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppContact" ADD CONSTRAINT "WhatsAppContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingStep" ADD CONSTRAINT "OnboardingStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."OnboardingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingTask" ADD CONSTRAINT "OnboardingTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."OnboardingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalBadgeAssignment" ADD CONSTRAINT "ProfessionalBadgeAssignment_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."ProfessionalBadge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalBadgeAssignment" ADD CONSTRAINT "ProfessionalBadgeAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewExclusion" ADD CONSTRAINT "ReviewExclusion_excludedBy_fkey" FOREIGN KEY ("excludedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewExclusion" ADD CONSTRAINT "ReviewExclusion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewResponseTemplate" ADD CONSTRAINT "ReviewResponseTemplate_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFormTemplate" ADD CONSTRAINT "DocumentFormTemplate_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."DocumentTypeConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFormTemplate" ADD CONSTRAINT "DocumentFormTemplate_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomForm" ADD CONSTRAINT "CustomForm_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomForm" ADD CONSTRAINT "CustomForm_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomForm" ADD CONSTRAINT "CustomForm_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomForm" ADD CONSTRAINT "CustomForm_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomForm" ADD CONSTRAINT "CustomForm_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."DocumentTypeConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormField" ADD CONSTRAINT "CustomFormField_customFormId_fkey" FOREIGN KEY ("customFormId") REFERENCES "public"."CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormCommission" ADD CONSTRAINT "CustomFormCommission_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormCommission" ADD CONSTRAINT "CustomFormCommission_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormCommission" ADD CONSTRAINT "CustomFormCommission_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormCommission" ADD CONSTRAINT "CustomFormCommission_resultFormId_fkey" FOREIGN KEY ("resultFormId") REFERENCES "public"."CustomForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormUsageLog" ADD CONSTRAINT "CustomFormUsageLog_customFormId_fkey" FOREIGN KEY ("customFormId") REFERENCES "public"."CustomForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormUsageLog" ADD CONSTRAINT "CustomFormUsageLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormUsageLog" ADD CONSTRAINT "CustomFormUsageLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomFormUsageLog" ADD CONSTRAINT "CustomFormUsageLog_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestCustomForm" ADD CONSTRAINT "RequestCustomForm_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestCustomForm" ADD CONSTRAINT "RequestCustomForm_customFormId_fkey" FOREIGN KEY ("customFormId") REFERENCES "public"."CustomForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestCustomForm" ADD CONSTRAINT "RequestCustomForm_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestCustomFormResponse" ADD CONSTRAINT "RequestCustomFormResponse_requestCustomFormId_fkey" FOREIGN KEY ("requestCustomFormId") REFERENCES "public"."RequestCustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequestCustomFormResponse" ADD CONSTRAINT "RequestCustomFormResponse_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."CustomFormField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GroupMembers" ADD CONSTRAINT "_GroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."WhatsAppContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GroupMembers" ADD CONSTRAINT "_GroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."WhatsAppGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
