/**
 * Response Formatter Utility
 * Centralizza la formattazione delle risposte per garantire consistenza tra backend e frontend
 * IMPORTANTE: SEMPRE usare questi formatter per TUTTE le query con relazioni!
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Formatta una data in modo sicuro per ISO string
 * Gestisce Date, string, null e undefined
 */
function safeToISOString(date: any): string | null {
  if (!date) return null;
  
  // Se è già una stringa che sembra una data ISO, restituiscila
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return date;
  }
  
  // Se è una stringa, prova a convertirla in Date
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;
  }
  
  // Se è un oggetto Date valido
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  // Se ha il metodo toISOString (potrebbe essere un oggetto Date-like)
  if (typeof date.toISOString === 'function') {
    try {
      return date.toISOString();
    } catch (e) {
      console.warn('Error calling toISOString on date:', date, e);
      return null;
    }
  }
  
  // Se non riusciamo a convertire, restituiamo null
  console.warn('Unable to format date:', date, typeof date);
  return null;
}

/**
 * Formatta una richiesta di assistenza per il frontend
 * Converte enum da UPPERCASE a lowercase e gestisce i tipi Decimal
 */
export function formatAssistanceRequest(request: any): any {
  if (!request) return null;
  
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    // Converti status da UPPERCASE a lowercase
    status: request.status?.toLowerCase() || 'pending',
    // Converti priority da UPPERCASE a lowercase
    priority: request.priority?.toLowerCase() || 'medium',
    clientId: request.clientId,
    professionalId: request.professionalId,
    categoryId: request.categoryId,
    subcategoryId: request.subcategoryId,
    address: request.address,
    city: request.city,
    province: request.province,
    postalCode: request.postalCode,
    latitude: request.latitude,
    longitude: request.longitude,
    requestedDate: safeToISOString(request.requestedDate),
    scheduledDate: safeToISOString(request.scheduledDate),
    completedDate: safeToISOString(request.completedDate),
    assignedDate: safeToISOString(request.assignedDate),
    // Nuovi campi per tracciamento assegnazione
    assignmentType: request.assignmentType?.toLowerCase() || null,
    assignedBy: request.assignedBy,
    assignedAt: safeToISOString(request.assignedAt),
    estimatedHours: request.estimatedHours,
    actualHours: request.actualHours,
    publicNotes: request.publicNotes,
    internalNotes: request.internalNotes,
    tags: request.tags,
    customFields: request.customFields,
    // AGGIUNGIAMO I CAMPI DISTANZA!
    distance: request.distance,
    distanceText: request.distanceText,
    duration: request.duration,
    durationText: request.durationText,
    createdAt: safeToISOString(request.createdAt),
    updatedAt: safeToISOString(request.updatedAt),
    
    // Formatta relazioni se presenti - CORRETTE secondo lo schema Prisma
    client: request.client ? formatUser(request.client) : null,
    professional: request.professional ? formatUser(request.professional) : null,
    category: request.category || request.category ? formatCategory(request.category || request.category) : null,
    subcategory: request.subcategory || request.subcategory ? formatSubcategory(request.subcategory || request.subcategory) : null,
    quotes: request.quotes || request.quotes ? (request.quotes || request.quotes).map(formatQuote) : [],
    attachments: request.attachments || request.attachments ? (request.attachments || request.attachments).map(formatAttachment) : [],
    updates: request.RequestUpdate || request.updates ? (request.RequestUpdate || request.updates).map(formatRequestUpdate) : [],
    messages: request.Message || request.messages ? (request.Message || request.messages).map(formatMessage) : []
  };
}

/**
 * Formatta un utente per il frontend
 */
export function formatUser(user: any): any {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName || `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    // Mantieni role in UPPERCASE
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    status: user.status,
    address: user.address,
    city: user.city,
    province: user.province,
    postalCode: user.postalCode,
    country: user.country,
    profession: user.profession,
    professionId: user.professionId,  // AGGIUNTO per supportare professioni tabellate
    professionData: user.professionData || user.Profession,  // FIX: Cerca sia professionData che Profession
    professionalUserSubcategories: user.professionalUserSubcategories || [],  // AGGIUNTO: Include le sottocategorie!
    specializations: user.specializations,
    hourlyRate: user.hourlyRate ? Number(user.hourlyRate) : null,
    currency: user.currency,
    serviceAreas: user.serviceAreas,
    emailVerified: user.emailVerified,
    // IMPORTANTE: Aggiungi il campo canSelfAssign per i professionisti
    canSelfAssign: user.canSelfAssign,
    lastLoginAt: safeToISOString(user.lastLoginAt),
    createdAt: safeToISOString(user.createdAt),
    updatedAt: safeToISOString(user.updatedAt)
  };
}

/**
 * Formatta una categoria per il frontend
 * Gestisce tutti i possibili nomi delle relazioni Prisma
 */
export function formatCategory(category: any): any {
  if (!category) return null;
  
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    color: category.color,
    textColor: category.textColor,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
    createdAt: safeToISOString(category.createdAt),
    updatedAt: safeToISOString(category.updatedAt),
    // Gestisci i conteggi se presenti
    _count: category._count ? {
      subcategories: category._count.subcategory || category._count.subcategories || 0,
      assistanceRequests: category._count.assistanceRequest || category._count.assistanceRequests || 0
    } : null,
    // Gestisci relazioni se presenti
    subcategories: category.subcategory || category.subcategories ? 
      (category.subcategory || category.subcategories).map(formatSubcategory) : []
  };
}

/**
 * Formatta una sottocategoria per il frontend
 * NUOVO: Gestisce tutti i possibili nomi delle relazioni Prisma
 */
export function formatSubcategory(subcategory: any): any {
  if (!subcategory) return null;
  
  return {
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    description: subcategory.description,
    requirements: subcategory.requirements,
    color: subcategory.color,
    textColor: subcategory.textColor,
    isActive: subcategory.isActive,
    displayOrder: subcategory.displayOrder,
    categoryId: subcategory.categoryId,
    metadata: subcategory.metadata,
    createdAt: safeToISOString(subcategory.createdAt),
    updatedAt: safeToISOString(subcategory.updatedAt),
    // Gestisci relazioni - TUTTI I POSSIBILI NOMI
    category: subcategory.Category || subcategory.category ? 
      formatCategory(subcategory.Category || subcategory.category) : null,
    aiSettings: subcategory.SubcategoryAiSettings || subcategory.aiSettings ? 
      formatAiSettings(subcategory.SubcategoryAiSettings || subcategory.aiSettings) : null,
    // Gestisci conteggi - IMPORTANTE: Usiamo il nome esatto dal database
    _count: subcategory._count ? {
      ProfessionalUserSubcategory: subcategory._count.ProfessionalUserSubcategory || 0,
      assistanceRequest: subcategory._count.assistanceRequest || 0,
      // Alias per compatibilità
      professionals: subcategory._count.ProfessionalUserSubcategory || 0,
      assistanceRequests: subcategory._count.assistanceRequest || 0
    } : null,
    // Aggiungi anche la lista dei professionisti se presente
    professionals: subcategory.ProfessionalUserSubcategory || []
  };
}

/**
 * Formatta le impostazioni AI di una sottocategoria
 * NUOVO: Per gestire SubcategoryAiSettings
 */
export function formatAiSettings(settings: any): any {
  if (!settings) return null;
  
  return {
    id: settings.id,
    subcategoryId: settings.subcategoryId,
    modelName: settings.modelName,
    temperature: Number(settings.temperature),
    maxTokens: settings.maxTokens,
    topP: Number(settings.topP),
    frequencyPenalty: Number(settings.frequencyPenalty),
    presencePenalty: Number(settings.presencePenalty),
    systemPrompt: settings.systemPrompt,
    knowledgeBasePrompt: settings.knowledgeBasePrompt,
    responseStyle: settings.responseStyle,
    detailLevel: settings.detailLevel,
    includeDiagrams: settings.includeDiagrams,
    includeReferences: settings.includeReferences,
    useKnowledgeBase: settings.useKnowledgeBase,
    knowledgeBaseIds: settings.knowledgeBaseIds,
    isActive: settings.isActive,
    metadata: settings.metadata,
    createdAt: safeToISOString(settings.createdAt),
    updatedAt: safeToISOString(settings.updatedAt)
  };
}

/**
 * Formatta un'associazione professionista-sottocategoria
 * NUOVO: Per gestire ProfessionalUserSubcategory
 */
export function formatProfessionalSubcategory(profSubcat: any): any {
  if (!profSubcat) return null;
  
  return {
    id: profSubcat.id,
    recipientId: profSubcat.userId,
    subcategoryId: profSubcat.subcategoryId,
    experienceYears: profSubcat.experienceYears,
    skillLevel: profSubcat.skillLevel,
    certifications: profSubcat.certifications,
    portfolio: profSubcat.portfolio,
    isActive: profSubcat.isActive,
    createdAt: profSubcat.createdAt?.toISOString(),
    updatedAt: profSubcat.updatedAt?.toISOString(),
    // Gestisci relazioni - IMPORTANTE: User con la U maiuscola!
    user: profSubcat.User ? formatUser(profSubcat.User) : null,
    subcategory: profSubcat.subcategory || profSubcat.Subcategory ? 
      formatSubcategory(profSubcat.subcategory || profSubcat.Subcategory) : null
  };
}

/**
 * Formatta un preventivo per il frontend
 * IMPORTANTE: Lo status dei Quote rimane in UPPERCASE per compatibilità con il frontend
 */
export function formatQuote(quote: any): any {
  if (!quote) return null;
  
  // Calcola il totalAmount dai items se presenti
  let totalAmount = 0;
  if (quote.items && quote.items.length > 0) {
    totalAmount = quote.items.reduce((sum: number, item: any) => {
      return sum + Number(item.totalPrice);
    }, 0);
  } else if (quote.amount) {
    totalAmount = Number(quote.amount);
  }
  
  return {
    id: quote.id,
    requestId: quote.requestId,
    professionalId: quote.professionalId,
    title: quote.title,
    description: quote.description,
    amount: quote.amount ? Number(quote.amount) : 0,
    totalAmount: totalAmount,
    currency: quote.currency,
    // IMPORTANTE: Mantieni lo status in UPPERCASE per il frontend
    status: quote.status || 'DRAFT',
    version: quote.version,
    validUntil: quote.validUntil?.toISOString() || null,
    expiresAt: quote.expiresAt?.toISOString() || null,
    acceptedAt: quote.acceptedAt?.toISOString() || null,
    rejectedAt: quote.rejectedAt?.toISOString() || null,
    rejectionReason: quote.rejectionReason,
    terms: quote.terms,
    notes: quote.notes,
    internalNotes: quote.internalNotes,
    attachments: quote.attachments,
    customFields: quote.customFields,
    depositRequired: quote.depositRequired,
    depositAmount: quote.depositAmount ? Number(quote.depositAmount) : null,
    depositPaid: quote.depositPaid,
    depositPaidAt: quote.depositPaidAt?.toISOString() || null,
    createdAt: quote.createdAt?.toISOString(),
    updatedAt: quote.updatedAt?.toISOString(),
    
    // Formatta relazioni se presenti - USANDO I NOMI CORRETTI DI PRISMA
    professional: quote.User || quote.professional ? formatUser(quote.User || quote.professional) : null,
    request: quote.assistanceRequest || quote.request ? formatAssistanceRequest(quote.assistanceRequest || quote.request) : null,
    items: quote.items || quote.items ? (quote.items || quote.items).map(formatitems) : [],
    payments: quote.Payment || quote.payments ? (quote.Payment || quote.payments).map(formatPayment) : []
  };
}

/**
 * Formatta un item di preventivo
 * I prezzi sono già in centesimi nel database
 */
export function formatitems(item: any): any {
  if (!item) return null;
  
  return {
    id: item.id,
    quoteId: item.quoteId,
    description: item.description,
    quantity: Number(item.quantity),
    // I prezzi sono già in centesimi, li convertiamo solo in numero
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
    taxRate: Number(item.taxRate),
    taxAmount: Number(item.taxAmount),
    discount: Number(item.discount),
    order: item.order,
    notes: item.notes,
    metadata: item.metadata,
    createdAt: item.createdAt?.toISOString()
  };
}

/**
 * Formatta un allegato
 */
export function formatAttachment(attachment: any): any {
  if (!attachment) return null;
  
  return {
    id: attachment.id,
    requestId: attachment.requestId,
    recipientId: attachment.userId,
    fileName: attachment.fileName,
    originalName: attachment.originalName,
    filePath: attachment.filePath,
    fileType: attachment.fileType,
    fileSize: attachment.fileSize,
    thumbnailPath: attachment.thumbnailPath,
    isPublic: attachment.isPublic,
    description: attachment.description,
    metadata: attachment.metadata,
    createdAt: attachment.createdAt?.toISOString(),
    // Gestisci relazioni se presenti
    user: attachment.User || attachment.user ? formatUser(attachment.User || attachment.user) : null,
    request: attachment.assistanceRequest || attachment.request ? 
      formatAssistanceRequest(attachment.assistanceRequest || attachment.request) : null
  };
}

/**
 * Formatta un aggiornamento richiesta
 */
export function formatRequestUpdate(update: any): any {
  if (!update) return null;
  
  return {
    id: update.id,
    requestId: update.requestId,
    recipientId: update.userId,
    updateType: update.updateType,
    description: update.description,
    metadata: update.metadata,
    createdAt: update.createdAt?.toISOString(),
    user: update.User || update.user ? formatUser(update.User || update.user) : null
  };
}

/**
 * Formatta un messaggio
 */
export function formatMessage(message: any): any {
  if (!message) return null;
  
  return {
    id: message.id,
    requestId: message.requestId,
    senderId: message.senderId,
    recipientId: message.recipientId,
    content: message.content,
    attachments: message.attachments,
    isRead: message.isRead,
    readAt: message.readAt?.toISOString() || null,
    editedAt: message.editedAt?.toISOString() || null,
    deletedAt: message.deletedAt?.toISOString() || null,
    createdAt: message.createdAt?.toISOString(),
    // Gestisci tutti i possibili nomi per sender e recipient
    sender: message.sender || message.sender ? 
      formatUser(message.sender || message.sender) : null,
    recipient: message.recipient || message.recipient ? 
      formatUser(message.recipient || message.recipient) : null
  };
}

/**
 * Formatta un pagamento
 * Gli importi sono già in centesimi nel database
 */
export function formatPayment(payment: any): any {
  if (!payment) return null;
  
  return {
    id: payment.id,
    quoteId: payment.quoteId,
    recipientId: payment.userId,
    // L'amount è già in centesimi
    amount: Number(payment.amount),
    currency: payment.currency,
    // Converti status da UPPERCASE a lowercase
    status: payment.status?.toLowerCase() || 'pending',
    // Converti type da UPPERCASE a lowercase  
    type: payment.type?.toLowerCase() || 'full_payment',
    method: payment.method,
    transactionId: payment.transactionId,
    stripePaymentId: payment.stripePaymentId,
    receiptUrl: payment.receiptUrl,
    description: payment.description,
    notes: payment.notes,
    metadata: payment.metadata,
    processedAt: payment.processedAt?.toISOString() || null,
    failedAt: payment.failedAt?.toISOString() || null,
    failureReason: payment.failureReason,
    refundedAt: payment.refundedAt?.toISOString() || null,
    // refundAmount è già in centesimi
    refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
    createdAt: payment.createdAt?.toISOString(),
    updatedAt: payment.updatedAt?.toISOString()
  };
}

/**
 * Formatta una notifica
 * NUOVO: Per gestire le notifiche
 */
export function formatNotification(notification: any): any {
  if (!notification) return null;
  
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    priority: notification.priority || 'NORMAL',
    recipientId: notification.recipientId,
    senderId: notification.senderId,
    entityType: notification.entityType,
    entityId: notification.entityId,
    isRead: notification.isRead,
    readAt: notification.readAt?.toISOString() || null,
    metadata: notification.metadata,
    createdAt: notification.createdAt?.toISOString(),
    updatedAt: notification.updatedAt?.toISOString(),
    // Gestisci relazioni
    recipient: notification.recipient || notification.recipient ? 
      formatUser(notification.recipient || notification.recipient) : null,
    sender: notification.sender || notification.sender ? 
      formatUser(notification.sender || notification.sender) : null
  };
}

// ==========================================
// FUNZIONI PER LISTE
// ==========================================

/**
 * Formatta una lista di richieste
 */
export function formatAssistanceRequestList(requests: any[]): any[] {
  if (!requests) return [];
  return requests.map(formatAssistanceRequest);
}

/**
 * Formatta una lista di quote
 */
export function formatQuoteList(quotes: any[]): any[] {
  if (!quotes) return [];
  return quotes.map(formatQuote);
}

/**
 * Formatta una lista di utenti
 */
export function formatUserList(users: any[]): any[] {
  if (!users) return [];
  return users.map(formatUser);
}

/**
 * Formatta una lista di categorie
 */
export function formatCategoryList(categories: any[]): any[] {
  if (!categories) return [];
  return categories.map(formatCategory);
}

/**
 * Formatta una lista di sottocategorie
 */
export function formatSubcategoryList(subcategories: any[]): any[] {
  if (!subcategories) return [];
  return subcategories.map(formatSubcategory);
}

/**
 * Formatta una lista di notifiche
 */
export function formatNotificationList(notifications: any[]): any[] {
  if (!notifications) return [];
  return notifications.map(formatNotification);
}

/**
 * Formatta una lista di allegati
 */
export function formatAttachmentList(attachments: any[]): any[] {
  if (!attachments) return [];
  return attachments.map(formatAttachment);
}

/**
 * Formatta una lista di associazioni professionista-sottocategoria
 */
export function formatProfessionalSubcategoryList(items: any[]): any[] {
  if (!items) return [];
  return items.map(formatProfessionalSubcategory);
}

/**
 * Formatta i dati delle impostazioni AI
 */
// export function formatAiSettings(settings: any): any { // DUPLICATE REMOVED
//   if (!settings) return null;
//   
//   return {
//     id: settings.id,
//     subcategoryId: settings.subcategoryId,
//     modelName: settings.modelName,
//     temperature: settings.temperature,
//     maxTokens: settings.maxTokens,
//     topP: settings.topP,
//     frequencyPenalty: settings.frequencyPenalty,
//     presencePenalty: settings.presencePenalty,
//     systemPrompt: settings.systemPrompt,
//     knowledgeBasePrompt: settings.knowledgeBasePrompt,
//     responseStyle: settings.responseStyle,
//     detailLevel: settings.detailLevel,
//     includeDiagrams: settings.includeDiagrams,
//     includeReferences: settings.includeReferences,
//     useKnowledgeBase: settings.useKnowledgeBase,
//     isActive: settings.isActive,
//     metadata: settings.metadata,
//     createdAt: settings.createdAt,
//     updatedAt: settings.updatedAt
//   };
// }

// ==========================================
// RESPONSE FORMATTER CLASS
// ==========================================

/**
 * Classe per standardizzare le risposte API
 */
export class ResponseFormatter {
  /**
   * Formatta una risposta di successo
   * @param data - I dati da restituire
   * @param message - Il messaggio di successo
   * @param metadata - Metadata aggiuntivi (incluso requestId)
   */
  static success(data: any, message: string = 'Success', metadata?: any) {
    return {
      success: true,
      message,
      data,
      metadata: metadata || null,
      timestamp: new Date().toISOString(),
      // Il requestId verrà aggiunto automaticamente dal middleware
    };
  }

  /**
   * Formatta una risposta di errore
   * @param message - Il messaggio di errore
   * @param code - Il codice errore
   * @param details - Dettagli aggiuntivi dell'errore
   */
  static error(message: string, code?: string, details?: any) {
    return {
      success: false,
      message,
      error: {
        code: code || 'INTERNAL_ERROR',
        details: details || null
      },
      timestamp: new Date().toISOString(),
      // Il requestId verrà aggiunto automaticamente dal middleware
    };
  }

  /**
   * Formatta una risposta con paginazione
   * @param data - I dati da restituire
   * @param pagination - Info di paginazione
   * @param message - Il messaggio di successo
   */
  static paginated(data: any[], pagination: any, message: string = 'Success') {
    return {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
      // Il requestId verrà aggiunto automaticamente dal middleware
    };
  }
}