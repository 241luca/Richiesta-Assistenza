"use strict";
/**
 * Response Formatter Utility
 * Centralizza la formattazione delle risposte per garantire consistenza tra backend e frontend
 * IMPORTANTE: SEMPRE usare questi formatter per TUTTE le query con relazioni!
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseFormatter = void 0;
exports.formatAssistanceRequest = formatAssistanceRequest;
exports.formatUser = formatUser;
exports.formatCategory = formatCategory;
exports.formatSubcategory = formatSubcategory;
exports.formatAiSettings = formatAiSettings;
exports.formatProfessionalSubcategory = formatProfessionalSubcategory;
exports.formatQuote = formatQuote;
exports.formatQuoteItem = formatQuoteItem;
exports.formatAttachment = formatAttachment;
exports.formatRequestUpdate = formatRequestUpdate;
exports.formatMessage = formatMessage;
exports.formatPayment = formatPayment;
exports.formatNotification = formatNotification;
exports.formatAssistanceRequestList = formatAssistanceRequestList;
exports.formatQuoteList = formatQuoteList;
exports.formatUserList = formatUserList;
exports.formatCategoryList = formatCategoryList;
exports.formatSubcategoryList = formatSubcategoryList;
exports.formatNotificationList = formatNotificationList;
exports.formatAttachmentList = formatAttachmentList;
exports.formatProfessionalSubcategoryList = formatProfessionalSubcategoryList;
/**
 * Formatta una data in modo sicuro per ISO string
 * Gestisce Date, string, null e undefined
 */
function safeToISOString(date) {
    if (!date)
        return null;
    // Se è già una stringa che sembra una data ISO, restituiscila
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return date;
    }
    // Se è una stringa, prova a convertirla in Date
    if (typeof date === 'string') {
        var parsedDate = new Date(date);
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
        }
        catch (e) {
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
function formatAssistanceRequest(request) {
    var _a, _b, _c;
    if (!request)
        return null;
    return {
        id: request.id,
        title: request.title,
        description: request.description,
        // Converti status da UPPERCASE a lowercase
        status: ((_a = request.status) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'pending',
        // Converti priority da UPPERCASE a lowercase
        priority: ((_b = request.priority) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || 'medium',
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
        assignmentType: ((_c = request.assignmentType) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || null,
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
function formatUser(user) {
    if (!user)
        return null;
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName || "".concat(user.firstName, " ").concat(user.lastName),
        phone: user.phone,
        // Mantieni role in UPPERCASE
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        // Campi di approvazione/verifica professionista
        approvalStatus: user.approvalStatus,
        approvedAt: safeToISOString(user.approvedAt),
        approvedBy: user.approvedBy,
        rejectionReason: user.rejectionReason,
        isVerified: user.isVerified,
        address: user.address,
        city: user.city,
        province: user.province,
        postalCode: user.postalCode,
        country: user.country,
        profession: user.profession,
        professionId: user.professionId, // AGGIUNTO per supportare professioni tabellate
        Profession: user.Profession, // AGGIUNTO per includere i dati della professione
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
function formatCategory(category) {
    if (!category)
        return null;
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
function formatSubcategory(subcategory) {
    if (!subcategory)
        return null;
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
function formatAiSettings(settings) {
    if (!settings)
        return null;
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
function formatProfessionalSubcategory(profSubcat) {
    var _a, _b;
    if (!profSubcat)
        return null;
    return {
        id: profSubcat.id,
        recipientId: profSubcat.userId,
        subcategoryId: profSubcat.subcategoryId,
        experienceYears: profSubcat.experienceYears,
        skillLevel: profSubcat.skillLevel,
        certifications: profSubcat.certifications,
        portfolio: profSubcat.portfolio,
        isActive: profSubcat.isActive,
        createdAt: (_a = profSubcat.createdAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
        updatedAt: (_b = profSubcat.updatedAt) === null || _b === void 0 ? void 0 : _b.toISOString(),
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
function formatQuote(quote) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!quote)
        return null;
    // Calcola il totalAmount dai QuoteItem se presenti
    var totalAmount = 0;
    if (quote.QuoteItem && quote.QuoteItem.length > 0) {
        totalAmount = quote.QuoteItem.reduce(function (sum, item) {
            return sum + Number(item.totalPrice);
        }, 0);
    }
    else if (quote.amount) {
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
        validUntil: ((_a = quote.validUntil) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
        expiresAt: ((_b = quote.expiresAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || null,
        acceptedAt: ((_c = quote.acceptedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
        rejectedAt: ((_d = quote.rejectedAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || null,
        rejectionReason: quote.rejectionReason,
        terms: quote.terms,
        notes: quote.notes,
        internalNotes: quote.internalNotes,
        attachments: quote.attachments,
        customFields: quote.customFields,
        depositRequired: quote.depositRequired,
        depositAmount: quote.depositAmount ? Number(quote.depositAmount) : null,
        depositPaid: quote.depositPaid,
        depositPaidAt: ((_e = quote.depositPaidAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || null,
        createdAt: (_f = quote.createdAt) === null || _f === void 0 ? void 0 : _f.toISOString(),
        updatedAt: (_g = quote.updatedAt) === null || _g === void 0 ? void 0 : _g.toISOString(),
        // Formatta relazioni se presenti - USANDO I NOMI CORRETTI DI PRISMA
        professional: quote.User || quote.professional ? formatUser(quote.User || quote.professional) : null,
        request: quote.assistanceRequest || quote.request ? formatAssistanceRequest(quote.assistanceRequest || quote.request) : null,
        items: quote.QuoteItem || quote.items ? (quote.QuoteItem || quote.items).map(formatQuoteItem) : [],
        payments: quote.Payment || quote.payments ? (quote.Payment || quote.payments).map(formatPayment) : []
    };
}
/**
 * Formatta un item di preventivo
 * I prezzi sono già in centesimi nel database
 */
function formatQuoteItem(item) {
    var _a;
    if (!item)
        return null;
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
        createdAt: (_a = item.createdAt) === null || _a === void 0 ? void 0 : _a.toISOString()
    };
}
/**
 * Formatta un allegato
 */
function formatAttachment(attachment) {
    var _a;
    if (!attachment)
        return null;
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
        createdAt: (_a = attachment.createdAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
        // Gestisci relazioni se presenti
        user: attachment.User || attachment.user ? formatUser(attachment.User || attachment.user) : null,
        request: attachment.assistanceRequest || attachment.request ?
            formatAssistanceRequest(attachment.assistanceRequest || attachment.request) : null
    };
}
/**
 * Formatta un aggiornamento richiesta
 */
function formatRequestUpdate(update) {
    var _a;
    if (!update)
        return null;
    return {
        id: update.id,
        requestId: update.requestId,
        recipientId: update.userId,
        updateType: update.updateType,
        description: update.description,
        metadata: update.metadata,
        createdAt: (_a = update.createdAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
        user: update.User || update.user ? formatUser(update.User || update.user) : null
    };
}
/**
 * Formatta un messaggio
 */
function formatMessage(message) {
    var _a, _b, _c, _d;
    if (!message)
        return null;
    return {
        id: message.id,
        requestId: message.requestId,
        senderId: message.senderId,
        recipientId: message.recipientId,
        content: message.content,
        attachments: message.attachments,
        isRead: message.isRead,
        readAt: ((_a = message.readAt) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
        editedAt: ((_b = message.editedAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || null,
        deletedAt: ((_c = message.deletedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
        createdAt: (_d = message.createdAt) === null || _d === void 0 ? void 0 : _d.toISOString(),
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
function formatPayment(payment) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!payment)
        return null;
    return {
        id: payment.id,
        quoteId: payment.quoteId,
        recipientId: payment.userId,
        // L'amount è già in centesimi
        amount: Number(payment.amount),
        currency: payment.currency,
        // Converti status da UPPERCASE a lowercase
        status: ((_a = payment.status) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'pending',
        // Converti type da UPPERCASE a lowercase  
        type: ((_b = payment.type) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || 'full_payment',
        method: payment.method,
        transactionId: payment.transactionId,
        stripePaymentId: payment.stripePaymentId,
        receiptUrl: payment.receiptUrl,
        description: payment.description,
        notes: payment.notes,
        metadata: payment.metadata,
        processedAt: ((_c = payment.processedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
        failedAt: ((_d = payment.failedAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || null,
        failureReason: payment.failureReason,
        refundedAt: ((_e = payment.refundedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || null,
        // refundAmount è già in centesimi
        refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
        createdAt: (_f = payment.createdAt) === null || _f === void 0 ? void 0 : _f.toISOString(),
        updatedAt: (_g = payment.updatedAt) === null || _g === void 0 ? void 0 : _g.toISOString()
    };
}
/**
 * Formatta una notifica
 * NUOVO: Per gestire le notifiche
 */
function formatNotification(notification) {
    var _a, _b, _c;
    if (!notification)
        return null;
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
        readAt: ((_a = notification.readAt) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
        metadata: notification.metadata,
        createdAt: (_b = notification.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString(),
        updatedAt: (_c = notification.updatedAt) === null || _c === void 0 ? void 0 : _c.toISOString(),
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
function formatAssistanceRequestList(requests) {
    if (!requests)
        return [];
    return requests.map(formatAssistanceRequest);
}
/**
 * Formatta una lista di quote
 */
function formatQuoteList(quotes) {
    if (!quotes)
        return [];
    return quotes.map(formatQuote);
}
/**
 * Formatta una lista di utenti
 */
function formatUserList(users) {
    if (!users)
        return [];
    return users.map(formatUser);
}
/**
 * Formatta una lista di categorie
 */
function formatCategoryList(categories) {
    if (!categories)
        return [];
    return categories.map(formatCategory);
}
/**
 * Formatta una lista di sottocategorie
 */
function formatSubcategoryList(subcategories) {
    if (!subcategories)
        return [];
    return subcategories.map(formatSubcategory);
}
/**
 * Formatta una lista di notifiche
 */
function formatNotificationList(notifications) {
    if (!notifications)
        return [];
    return notifications.map(formatNotification);
}
/**
 * Formatta una lista di allegati
 */
function formatAttachmentList(attachments) {
    if (!attachments)
        return [];
    return attachments.map(formatAttachment);
}
/**
 * Formatta una lista di associazioni professionista-sottocategoria
 */
function formatProfessionalSubcategoryList(items) {
    if (!items)
        return [];
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
var ResponseFormatter = /** @class */ (function () {
    function ResponseFormatter() {
    }
    /**
     * Formatta una risposta di successo
     * @param data - I dati da restituire
     * @param message - Il messaggio di successo
     * @param metadata - Metadata aggiuntivi (incluso requestId)
     */
    ResponseFormatter.success = function (data, message, metadata) {
        if (message === void 0) { message = 'Success'; }
        return {
            success: true,
            message: message,
            data: data,
            metadata: metadata || null,
            timestamp: new Date().toISOString(),
            // Il requestId verrà aggiunto automaticamente dal middleware
        };
    };
    /**
     * Formatta una risposta di errore
     * @param message - Il messaggio di errore
     * @param code - Il codice errore
     * @param details - Dettagli aggiuntivi dell'errore
     */
    ResponseFormatter.error = function (message, code, details) {
        return {
            success: false,
            message: message,
            error: {
                code: code || 'INTERNAL_ERROR',
                details: details || null
            },
            timestamp: new Date().toISOString(),
            // Il requestId verrà aggiunto automaticamente dal middleware
        };
    };
    /**
     * Formatta una risposta con paginazione
     * @param data - I dati da restituire
     * @param pagination - Info di paginazione
     * @param message - Il messaggio di successo
     */
    ResponseFormatter.paginated = function (data, pagination, message) {
        if (message === void 0) { message = 'Success'; }
        return {
            success: true,
            message: message,
            data: data,
            pagination: pagination,
            timestamp: new Date().toISOString(),
            // Il requestId verrà aggiunto automaticamente dal middleware
        };
    };
    return ResponseFormatter;
}());
exports.ResponseFormatter = ResponseFormatter;
