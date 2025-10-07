// ==========================================
// TYPESCRIPT TYPES - Sistema AI Duale
// ==========================================

// Enum per detection mode
export enum DetectionMode {
  PROFESSIONAL = 'PROFESSIONAL',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Enum per contact type
export enum ContactType {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL', 
  TRUSTED = 'TRUSTED',
  BLOCKED = 'BLOCKED'
}

// Enum per applicable mode
export enum ApplicableMode {
  PROFESSIONAL = 'PROFESSIONAL',
  CLIENT = 'CLIENT',
  BOTH = 'BOTH'
}

// Main WhatsApp configuration
export interface ProfessionalWhatsApp {
  id: string;
  professionalId: string;
  phoneNumber: string;
  instanceId: string;
  sendappApiKey?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  activationDate?: Date;
  suspensionDate?: Date;
  suspensionReason?: string;
  
  // Phone Recognition
  professionalPhones: string[];
  trustedNumbers: string[];
  blacklistedNumbers: string[];
  
  // AI Configurations
  aiConfigProfessional: AIConfiguration;
  aiConfigClient: AIConfiguration;
  
  // Knowledge Bases
  kbProfessionalIds: string[];
  kbClientIds: string[];
  
  // System Prompts
  systemPromptProfessional?: string;
  systemPromptClient?: string;
  
  // Detection Settings
  autoDetectMode: boolean;
  defaultMode: DetectionMode;
  confidenceThreshold: number;
  
  // Billing
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  nextBillingDate?: Date;
  messagesLimit: number;
  messagesUsed: number;
  aiResponsesLimit: number;
  aiResponsesUsed: number;
  
  // Settings
  settings: Record<string, any>;
  businessHours?: BusinessHours;
  autoReplySettings?: AutoReplySettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// AI Configuration for each mode
export interface AIConfiguration {
  enabled: boolean;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  includeInternalData: boolean;
  showMargins: boolean;
  showSupplierInfo: boolean;
  technicalDepth: 'basic' | 'intermediate' | 'expert';
  language: 'technical' | 'friendly' | 'formal';
  personality?: {
    tone: string;
    useEmoji: boolean;
    responseStyle: string;
  };
}

// Dual AI Configuration
export interface ProfessionalAiDualConfig {
  id: string;
  whatsappId: string;
  techConfig: AIConfiguration;
  clientConfig: AIConfiguration;
  responseRules?: ResponseRules;
  neverMentionPatterns: string[];
  alwaysIncludeTopics: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Response Rules
export interface ResponseRules {
  maxResponseLength: number;
  includeCalculations: boolean;
  showAlternatives: boolean;
  detailLevel: 'simple' | 'detailed' | 'expert';
  neverMention: string[];
  alwaysInclude: string[];
  sanitizationRules: {
    removeInternalPricing: boolean;
    removeMargins: boolean;
    removeSupplierInfo: boolean;
    convertToPublicPricing: boolean;
  };
}

// Subcategory Dual Configuration
export interface ProfessionalSubcategoryDualConfig {
  id: string;
  whatsappId: string;
  subcategoryId: string;
  
  // Dual KB
  kbProfessional?: KnowledgeBase;
  kbClient?: KnowledgeBase;
  
  // Dual Prompts
  promptProfessional?: string;
  promptClient?: string;
  
  // Visibility
  visibleToProfessional: boolean;
  visibleToClients: boolean;
  
  // Dual Pricing
  pricingProfessional?: PricingInfo;
  pricingClient?: PricingInfo;
  
  // Settings
  techSettings?: Record<string, any>;
  clientSettings?: Record<string, any>;
  
  // Usage
  usageCountTech: number;
  usageCountClient: number;
  lastUsedTech?: Date;
  lastUsedClient?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Knowledge Base structure
export interface KnowledgeBase {
  procedures?: Record<string, any>;
  pricing?: Record<string, number>;
  suppliers?: Record<string, any>;
  faq?: FAQ[];
  tips?: string[];
  emergency?: EmergencyProcedure[];
  metadata?: Record<string, any>;
}

// Pricing Information
export interface PricingInfo {
  basePrices: Record<string, number>;
  discounts?: Record<string, number>;
  margins?: Record<string, number>;
  vatRate: number;
  currency: string;
}

// WhatsApp Message with Detection
export interface ProfessionalWhatsAppMessage {
  id: string;
  whatsappId: string;
  
  // Message data
  externalId?: string;
  phoneNumber: string;
  contactName?: string;
  message: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  mediaType?: string;
  
  // Detection Result - CRITICAL!
  detectedMode?: DetectionMode;
  detectionConfidence?: number;
  detectionReason?: string;
  modeOverride?: DetectionMode;
  
  // Status
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  
  // AI Processing
  aiProcessed: boolean;
  aiMode?: 'TECH' | 'CLIENT';
  aiResponse?: string;
  aiConfidence?: number;
  aiIntent?: string;
  aiEntities?: Record<string, any>;
  kbUsed: string[];
  
  metadata?: Record<string, any>;
  createdAt: Date;
}

// WhatsApp Contact with Classification
export interface ProfessionalWhatsAppContact {
  id: string;
  whatsappId: string;
  
  // Contact info
  phoneNumber: string;
  name?: string;
  email?: string;
  
  // Classification - CRITICAL!
  contactType: ContactType;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // WhatsApp info
  whatsappName?: string;
  whatsappAvatar?: string;
  lastSeen?: Date;
  
  // Business data
  customerSince?: Date;
  totalMessages: number;
  totalOrders: number;
  totalRevenue: number;
  
  // AI Interaction stats
  aiInteractionsTech: number;
  aiInteractionsClient: number;
  lastAiMode?: string;
  
  // Notes
  tags: string[];
  notes?: string;
  internalNotes?: string;
  
  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  blocked: boolean;
  blockedReason?: string;
  
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Detection Result
export interface DetectionResult {
  mode: DetectionMode;
  confidence: number;
  reason: string;
  factors: {
    isRegisteredProfessional: boolean;
    isTrustedNumber: boolean;
    isBlacklistedNumber: boolean;
    languagePatternMatch: boolean;
    contextClues: string[];
    historicalPattern?: string;
  };
  suggestedAction?: 'USE_DETECTED' | 'ASK_CONFIRMATION' | 'MANUAL_REVIEW';
}

// Detection Override
export interface DetectionOverride {
  id: string;
  whatsappId: string;
  phoneNumber: string;
  originalDetection: DetectionMode;
  overriddenTo: DetectionMode;
  overriddenBy: string;
  reason?: string;
  shouldLearnFrom: boolean;
  createdAt: Date;
}

// Analytics with Detection Metrics
export interface WhatsAppAnalytics {
  id: string;
  whatsappId: string;
  date: Date;
  hour?: number;
  
  // Messages by mode
  messagesSentTech: number;
  messagesSentClient: number;
  messagesReceived: number;
  
  // Detection metrics
  correctDetections: number;
  incorrectDetections: number;
  manualOverrides: number;
  detectionAccuracy?: number;
  
  // Contacts
  uniqueContacts: number;
  professionalContacts: number;
  clientContacts: number;
  
  // AI metrics
  aiResponsesTech: number;
  aiResponsesClient: number;
  aiSuccessRate?: number;
  
  createdAt: Date;
}

// Template with Dual Messages
export interface WhatsAppTemplate {
  id: string;
  whatsappId: string;
  name: string;
  category?: string;
  
  // Dual templates
  messageTech?: string;    // Version for professional
  messageClient?: string;  // Version for client
  message: string;         // Generic version
  
  mediaUrl?: string;
  availableForMode: ApplicableMode;
  shortcut?: string;
  usageCount: number;
  lastUsed?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Automation with Mode Applicability
export interface WhatsAppAutomation {
  id: string;
  whatsappId: string;
  name: string;
  description?: string;
  triggerType: 'message_received' | 'keyword' | 'time_based' | 'event';
  triggerConfig: Record<string, any>;
  applicableMode: ApplicableMode;
  actions: AutomationAction[];
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Automation Action
export interface AutomationAction {
  type: 'send_message' | 'add_tag' | 'create_task' | 'notify' | 'webhook';
  config: Record<string, any>;
  delaySeconds?: number;
}

// Business Hours
export interface BusinessHours {
  timezone: string;
  schedule: {
    [day: string]: {
      enabled: boolean;
      openTime: string;
      closeTime: string;
      breaks?: Array<{
        startTime: string;
        endTime: string;
      }>;
    };
  };
}

// Auto Reply Settings
export interface AutoReplySettings {
  enabled: boolean;
  message?: string;
  delay: number;
  outsideHours: boolean;
  outsideHoursMessage?: string;
  keywords?: Array<{
    keyword: string;
    response: string;
  }>;
}

// FAQ Item
export interface FAQ {
  question: string;
  answer: string;
  category?: string;
  keywords?: string[];
}

// Emergency Procedure
export interface EmergencyProcedure {
  type: string;
  steps: string[];
  warningMessage?: string;
  contactInfo?: string;
}

// Service Response Types
export interface DualModeDetectionResponse {
  success: boolean;
  detection: DetectionResult;
  suggestedKnowledgeBases: string[];
  suggestedPrompt: string;
  aiConfig: AIConfiguration;
}

export interface DualModeResponseGenerationRequest {
  message: string;
  detectedMode: DetectionMode;
  phoneNumber: string;
  whatsappId: string;
  context?: Record<string, any>;
}

export interface DualModeResponseGenerationResponse {
  success: boolean;
  response: string;
  mode: 'TECH' | 'CLIENT';
  kbUsed: string[];
  confidence: number;
  sanitized: boolean;
  metadata?: Record<string, any>;
}
