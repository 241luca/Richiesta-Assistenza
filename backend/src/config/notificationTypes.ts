/**
 * Notification Types Configuration
 * Configurazione centralizzata di tutti i tipi di notifiche del sistema
 */

export enum NotificationType {
  // === RICHIESTE ===
  NEW_REQUEST = 'NEW_REQUEST',
  REQUEST_CREATED = 'REQUEST_CREATED',
  REQUEST_ASSIGNED = 'REQUEST_ASSIGNED',
  REQUEST_STATUS_CHANGED = 'REQUEST_STATUS_CHANGED',
  PROFESSIONAL_ASSIGNED = 'PROFESSIONAL_ASSIGNED',
  
  // === INTERVENTI ===
  INTERVENTIONS_PROPOSED = 'INTERVENTIONS_PROPOSED',
  INTERVENTION_ACCEPTED = 'INTERVENTION_ACCEPTED',
  INTERVENTION_REJECTED = 'INTERVENTION_REJECTED',
  INTERVENTION_REMINDER = 'INTERVENTION_REMINDER',
  
  // === PREVENTIVI ===
  NEW_QUOTE = 'NEW_QUOTE',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  QUOTE_UPDATED = 'QUOTE_UPDATED',
  
  // === PAGAMENTI ===
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DEPOSIT_REQUIRED = 'DEPOSIT_REQUIRED',
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  
  // === UTENTI ===
  WELCOME = 'WELCOME',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  
  // === CHAT/MESSAGGI ===
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_READ = 'MESSAGE_READ',
  USER_TYPING = 'USER_TYPING',
  
  // === SISTEMA ===
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  DATA_EXPORT_READY = 'DATA_EXPORT_READY',
  
  // === PROFESSIONISTI ===
  NEW_SKILL_ADDED = 'NEW_SKILL_ADDED',
  SKILL_APPROVED = 'SKILL_APPROVED',
  CERTIFICATION_EXPIRING = 'CERTIFICATION_EXPIRING',
  RATING_RECEIVED = 'RATING_RECEIVED',
}

export interface NotificationTemplate {
  type: NotificationType;
  defaultTitle: string;
  defaultMessage: string;
  defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
  defaultChannels: ('websocket' | 'email' | 'sms' | 'push')[];
  variables: string[];
}

/**
 * Template predefiniti per ogni tipo di notifica
 */
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // === RICHIESTE ===
  [NotificationType.NEW_REQUEST]: {
    type: NotificationType.NEW_REQUEST,
    defaultTitle: 'Nuova richiesta di assistenza',
    defaultMessage: 'Una nuova richiesta "{{requestTitle}}" è stata creata da {{clientName}}',
    defaultPriority: 'normal',
    defaultChannels: ['websocket', 'email'],
    variables: ['requestTitle', 'clientName', 'category', 'priority']
  },
  
  [NotificationType.REQUEST_ASSIGNED]: {
    type: NotificationType.REQUEST_ASSIGNED,
    defaultTitle: 'Richiesta assegnata',
    defaultMessage: 'Ti è stata assegnata la richiesta "{{requestTitle}}"',
    defaultPriority: 'high',
    defaultChannels: ['websocket', 'email'],
    variables: ['requestTitle', 'clientName', 'category']
  },
  
  // === INTERVENTI ===
  [NotificationType.INTERVENTIONS_PROPOSED]: {
    type: NotificationType.INTERVENTIONS_PROPOSED,
    defaultTitle: 'Nuovi interventi proposti',
    defaultMessage: 'Sono stati proposti {{count}} interventi per la tua richiesta',
    defaultPriority: 'high',
    defaultChannels: ['websocket', 'email'],
    variables: ['count', 'requestTitle', 'dates']
  },
  
  [NotificationType.INTERVENTION_ACCEPTED]: {
    type: NotificationType.INTERVENTION_ACCEPTED,
    defaultTitle: 'Intervento accettato',
    defaultMessage: 'Il cliente ha accettato l\'intervento per "{{requestTitle}}"',
    defaultPriority: 'high',
    defaultChannels: ['websocket', 'email'],
    variables: ['requestTitle', 'date', 'time']
  },
  
  // === PREVENTIVI ===
  [NotificationType.NEW_QUOTE]: {
    type: NotificationType.NEW_QUOTE,
    defaultTitle: 'Nuovo preventivo ricevuto',
    defaultMessage: 'Hai ricevuto un preventivo di €{{amount}} per "{{requestTitle}}"',
    defaultPriority: 'high',
    defaultChannels: ['websocket', 'email'],
    variables: ['amount', 'requestTitle', 'professionalName']
  },
  
  [NotificationType.QUOTE_ACCEPTED]: {
    type: NotificationType.QUOTE_ACCEPTED,
    defaultTitle: 'Preventivo accettato',
    defaultMessage: 'Il tuo preventivo per "{{requestTitle}}" è stato accettato!',
    defaultPriority: 'high',
    defaultChannels: ['websocket', 'email', 'sms'],
    variables: ['requestTitle', 'amount', 'clientName']
  },
  
  // === PAGAMENTI ===
  [NotificationType.PAYMENT_SUCCESS]: {
    type: NotificationType.PAYMENT_SUCCESS,
    defaultTitle: 'Pagamento ricevuto',
    defaultMessage: 'Pagamento di €{{amount}} ricevuto per "{{requestTitle}}"',
    defaultPriority: 'high',
    defaultChannels: ['websocket', 'email'],
    variables: ['amount', 'requestTitle', 'paymentMethod']
  },
  
  [NotificationType.PAYMENT_FAILED]: {
    type: NotificationType.PAYMENT_FAILED,
    defaultTitle: 'Pagamento fallito',
    defaultMessage: 'Il pagamento per "{{requestTitle}}" non è andato a buon fine',
    defaultPriority: 'urgent',
    defaultChannels: ['websocket', 'email', 'sms'],
    variables: ['requestTitle', 'reason', 'amount']
  },
  
  // === UTENTI ===
  [NotificationType.WELCOME]: {
    type: NotificationType.WELCOME,
    defaultTitle: 'Benvenuto in Richiesta Assistenza!',
    defaultMessage: 'Ciao {{firstName}}, benvenuto nella nostra piattaforma!',
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    variables: ['firstName', 'role']
  },
  
  [NotificationType.EMAIL_VERIFIED]: {
    type: NotificationType.EMAIL_VERIFIED,
    defaultTitle: 'Email verificata con successo',
    defaultMessage: 'La tua email è stata verificata. Ora puoi accedere a tutte le funzionalità.',
    defaultPriority: 'normal',
    defaultChannels: ['websocket', 'email'],
    variables: ['email']
  },
  
  [NotificationType.PASSWORD_RESET]: {
    type: NotificationType.PASSWORD_RESET,
    defaultTitle: 'Reset della tua password',
    defaultMessage: 'Hai richiesto il reset della password. Usa il link per procedere.',
    defaultPriority: 'urgent',
    defaultChannels: ['email'],
    variables: ['resetUrl', 'expiresIn']
  },
  
  [NotificationType.PASSWORD_CHANGED]: {
    type: NotificationType.PASSWORD_CHANGED,
    defaultTitle: 'Password modificata',
    defaultMessage: 'La tua password è stata modificata con successo.',
    defaultPriority: 'high',
    defaultChannels: ['websocket', 'email'],
    variables: ['changedAt', 'ipAddress']
  },
  
  // === MESSAGGI ===
  [NotificationType.NEW_MESSAGE]: {
    type: NotificationType.NEW_MESSAGE,
    defaultTitle: 'Nuovo messaggio',
    defaultMessage: '{{senderName}}: {{messagePreview}}',
    defaultPriority: 'normal',
    defaultChannels: ['websocket'],
    variables: ['senderName', 'messagePreview', 'requestTitle']
  },
};

/**
 * Helper per ottenere il template di una notifica
 */
export function getNotificationTemplate(type: NotificationType | string): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES[type];
}

/**
 * Helper per validare le variabili richieste
 */
export function validateNotificationVariables(
  type: NotificationType | string, 
  variables: Record<string, any>
): { valid: boolean; missing: string[] } {
  const template = getNotificationTemplate(type);
  if (!template) {
    return { valid: false, missing: [] };
  }
  
  const missing = template.variables.filter(v => !(v in variables));
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Helper per formattare un messaggio con le variabili
 */
export function formatNotificationMessage(
  template: string, 
  variables: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Priorità notifiche per ordinamento
 */
export const PRIORITY_ORDER = {
  'urgent': 4,
  'high': 3,
  'normal': 2,
  'low': 1
};

/**
 * Configurazione canali di notifica
 */
export const NOTIFICATION_CHANNELS = {
  websocket: {
    name: 'WebSocket',
    description: 'Notifiche in tempo reale nell\'app',
    enabled: true,
    requiresAuth: true
  },
  email: {
    name: 'Email',
    description: 'Notifiche via email',
    enabled: true,
    requiresAuth: false,
    rateLimit: {
      maxPerHour: 20,
      maxPerDay: 100
    }
  },
  sms: {
    name: 'SMS',
    description: 'Notifiche via SMS',
    enabled: false, // Da abilitare con provider SMS
    requiresAuth: false,
    rateLimit: {
      maxPerHour: 5,
      maxPerDay: 20
    }
  },
  push: {
    name: 'Push Notification',
    description: 'Notifiche push su dispositivi',
    enabled: false, // Da abilitare con FCM/OneSignal
    requiresAuth: true
  }
};
