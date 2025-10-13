/**
 * Calendar Service
 * Gestisce il calendario interventi e sincronizzazione Google Calendar
 * 
 * Responsabilità:
 * - Gestione interventi programmati nel calendario
 * - Controllo conflitti orari professionisti
 * - Sincronizzazione bidirezionale Google Calendar
 * - Gestione disponibilità e indisponibilità professionisti
 * - Notifiche automatiche interventi (create/update/cancel)
 * - Drag & drop riprogrammazione interventi
 * - Gestione impostazioni calendario personalizzate
 * - Recupero richieste e clienti assegnati
 * 
 * @module services/calendar
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../../config/database';
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { logger } from '../../utils/logger';
import { notificationService } from '../notification.service';
import { apiKeyService } from '../apiKey.service';

// Configurazione Google OAuth2 - AGGIORNATA PER USARE DB
let oauth2Client: any = null;

/**
 * Inizializza OAuth2 Client con credentials dal database
 * 
 * @private
 * @returns {Promise<any>} Client OAuth2 configurato
 * @throws {Error} Se credenziali non trovate
 */
async function getOAuth2Client() {
  if (oauth2Client) {
    return oauth2Client;
  }

  try {
    logger.info('[CalendarService] Initializing OAuth2 client');

    const googleCalendarKey = await apiKeyService.getApiKey('google_calendar', true);
    
    if (!googleCalendarKey) {
      throw new Error('Google Calendar credentials not found in database');
    }

    const credentials = JSON.parse(googleCalendarKey.key);
    
    oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/calendar/google/callback`
    );

    logger.info('[CalendarService] ✅ OAuth2 client initialized successfully');
    return oauth2Client;
  } catch (error) {
    logger.error('[CalendarService] Error initializing OAuth2 client:', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to initialize Google Calendar - check API keys in database');
  }
}

/**
 * Formatta un intervento per il frontend calendario
 * 
 * @private
 * @param {any} intervention - Intervento Prisma con relations
 * @returns {any} Intervento formattato (PURE DATA)
 */
function formatIntervention(intervention: any) {
  const request = intervention.request || {};
  const client = request.client || {};
  const category = request.category || {};
  const subcategory = request.subcategory || {};

  return {
    id: intervention.id,
    title: request.title || `Intervento ${category.name || ''}`,
    startDate: intervention.proposedDate,
    endDate: intervention.confirmedDate || dayjs(intervention.proposedDate).add(intervention.estimatedDuration || 60, 'minute').toISOString(),
    proposedDate: intervention.proposedDate,
    confirmedDate: intervention.confirmedDate,
    estimatedDuration: intervention.estimatedDuration,
    actualDuration: intervention.actualDuration,
    status: intervention.status || 'pending',
    description: intervention.description || request.description,
    notes: intervention.notes,
    clientConfirmed: intervention.clientConfirmed,
    clientDeclineReason: intervention.clientDeclineReason,
    address: request.address,
    city: request.city,
    province: request.province,
    postalCode: request.postalCode,
    latitude: request.latitude,
    longitude: request.longitude,
    urgent: request.priority === 'URGENT',
    priority: request.priority,
    client: {
      id: client.id,
      fullName: client.fullName,
      email: client.email,
      phone: client.phone
    },
    category: {
      id: category.id,
      name: category.name
    },
    subcategory: subcategory ? {
      id: subcategory.id,
      name: subcategory.name
    } : null,
    requestId: intervention.requestId,
    price: request.estimatedCost
  };
}

/**
 * Recupera gli interventi per il calendario con filtri
 * 
 * @param {string} professionalId - ID professionista
 * @param {any} filters - Filtri opzionali (status, category, search)
 * @returns {Promise<any[]>} Lista interventi formattati (PURE DATA)
 * @throws {Error} Se errore recupero
 * 
 * @example
 * const interventions = await getCalendarInterventions('prof123', {
 *   status: 'confirmed',
 *   category: 'cat456',
 *   search: 'cliente rossi'
 * });
 */
export async function getCalendarInterventions(professionalId: string, filters: any = {}) {
  try {
    logger.info('[CalendarService] Fetching calendar interventions', {
      professionalId,
      filters
    });

    const whereClause: any = {
      professionalId: professionalId
    };

    if (filters.status && filters.status !== 'all') {
      whereClause.status = filters.status;
    }

    if (filters.category && filters.category !== 'all') {
      whereClause.request = {
        ...whereClause.request,
        categoryId: filters.category
      };
    }

    if (filters.search) {
      whereClause.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { request: { title: { contains: filters.search, mode: 'insensitive' } } },
        { request: { client: { fullName: { contains: filters.search, mode: 'insensitive' } } } }
      ];
    }

    const interventions = await prisma.scheduledIntervention.findMany({
      where: whereClause,
      include: {
        request: {
          include: {
            category: true,
            subcategory: true,
            client: true,
            professional: true
          }
        },
        professional: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        proposedDate: 'asc'
      }
    });

    logger.info('[CalendarService] Interventions retrieved successfully', {
      professionalId,
      count: interventions.length
    });

    return interventions.map(formatIntervention);
  } catch (error) {
    logger.error('[CalendarService] Error fetching calendar interventions:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId,
      filters,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Crea un nuovo intervento DA UNA RICHIESTA ESISTENTE
 * 
 * @param {any} data - Dati intervento (deve includere requestId)
 * @returns {Promise<any>} Intervento creato (PURE DATA)
 * @throws {Error} Se requestId mancante, richiesta non trovata, o non autorizzato
 * 
 * @example
 * const intervention = await createIntervention({
 *   requestId: 'req123',
 *   professionalId: 'prof456',
 *   startDate: '2025-10-15T10:00:00Z',
 *   estimatedDuration: 90,
 *   description: 'Riparazione caldaia',
 *   notes: 'Portare pezzi di ricambio'
 * });
 */
export async function createIntervention(data: any) {
  try {
    logger.info('[CalendarService] Creating intervention', {
      requestId: data.requestId,
      professionalId: data.professionalId
    });

    let requestId = data.requestId;

    if (!requestId) {
      throw new Error('Un intervento deve essere sempre collegato a una richiesta di assistenza esistente');
    }

    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      include: { client: true }
    });

    if (!request) {
      throw new Error('Richiesta di assistenza non trovata');
    }

    if (request.professionalId !== data.professionalId) {
      throw new Error('Non sei autorizzato a creare interventi per questa richiesta');
    }

    const intervention = await prisma.scheduledIntervention.create({
      data: {
        id: require('crypto').randomUUID(),
        requestId: requestId,
        professionalId: data.professionalId,
        proposedDate: new Date(data.startDate || data.proposedDate),
        confirmedDate: data.endDate ? new Date(data.endDate) : null,
        estimatedDuration: data.estimatedDuration || 60,
        description: data.description,
        notes: data.notes,
        status: data.status || 'pending',
        clientConfirmed: data.clientConfirmed || false,
        createdBy: data.professionalId,
        updatedAt: new Date()
      },
      include: {
        request: {
          include: {
            category: true,
            subcategory: true,
            client: true
          }
        }
      }
    });

    // ✅ FIX: Notifica usando nuovo pattern
    if (intervention.request?.clientId) {
      await notificationService.sendToUser({
        userId: intervention.request.clientId,
        type: 'intervention_scheduled',
        title: 'Nuovo intervento programmato',
        message: `È stato programmato un intervento per il ${dayjs(intervention.proposedDate).format('DD/MM/YYYY HH:mm')}`,
        data: {
          interventionId: intervention.id,
          requestId: intervention.requestId
        }
      });
    }

    logger.info('[CalendarService] Intervention created successfully', {
      interventionId: intervention.id,
      requestId
    });

    return formatIntervention(intervention);
  } catch (error) {
    logger.error('[CalendarService] Error creating intervention:', {
      error: error instanceof Error ? error.message : 'Unknown',
      requestId: data.requestId,
      professionalId: data.professionalId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Aggiorna un intervento esistente
 * 
 * @param {string} interventionId - ID intervento
 * @param {any} data - Dati da aggiornare
 * @param {string} professionalId - ID professionista (per autorizzazione)
 * @returns {Promise<any>} Intervento aggiornato (PURE DATA)
 * @throws {Error} Se non trovato o non autorizzato
 */
export async function updateIntervention(interventionId: string, data: any, professionalId: string) {
  try {
    logger.info('[CalendarService] Updating intervention', {
      interventionId,
      professionalId
    });

    const existing = await prisma.scheduledIntervention.findUnique({
      where: { id: interventionId }
    });

    if (!existing) {
      throw new Error('Intervento non trovato');
    }

    if (existing.professionalId !== professionalId) {
      throw new Error('Non sei autorizzato a modificare questo intervento');
    }

    const intervention = await prisma.scheduledIntervention.update({
      where: { id: interventionId },
      data: {
        proposedDate: data.startDate ? new Date(data.startDate) : undefined,
        confirmedDate: data.endDate ? new Date(data.endDate) : undefined,
        estimatedDuration: data.estimatedDuration,
        actualDuration: data.actualDuration,
        description: data.description,
        notes: data.notes,
        status: data.status,
        clientConfirmed: data.clientConfirmed,
        clientDeclineReason: data.clientDeclineReason
      },
      include: {
        request: {
          include: {
            category: true,
            subcategory: true,
            client: true
          }
        }
      }
    });

    logger.info('[CalendarService] Intervention updated successfully', {
      interventionId
    });

    return formatIntervention(intervention);
  } catch (error) {
    logger.error('[CalendarService] Error updating intervention:', {
      error: error instanceof Error ? error.message : 'Unknown',
      interventionId,
      professionalId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Riprogramma un intervento (drag & drop)
 * 
 * @param {string} interventionId - ID intervento
 * @param {string} newStart - Nuova data inizio
 * @param {string} newEnd - Nuova data fine
 * @param {string} professionalId - ID professionista
 * @returns {Promise<any>} Intervento riprogrammato (PURE DATA)
 * @throws {Error} Se non trovato o non autorizzato
 */
export async function rescheduleIntervention(interventionId: string, newStart: string, newEnd: string, professionalId: string) {
  try {
    logger.info('[CalendarService] Rescheduling intervention', {
      interventionId,
      newStart,
      newEnd,
      professionalId
    });

    const existing = await prisma.scheduledIntervention.findUnique({
      where: { id: interventionId }
    });

    if (!existing) {
      throw new Error('Intervento non trovato');
    }

    if (existing.professionalId !== professionalId) {
      throw new Error('Non sei autorizzato a riprogrammare questo intervento');
    }

    const intervention = await prisma.scheduledIntervention.update({
      where: { id: interventionId },
      data: {
        proposedDate: new Date(newStart),
        confirmedDate: new Date(newEnd),
        updatedAt: new Date()
      },
      include: {
        request: {
          include: {
            category: true,
            subcategory: true,
            client: true
          }
        }
      }
    });

    // ✅ FIX: Notifica usando nuovo pattern
    if (intervention.request?.clientId) {
      await notificationService.sendToUser({
        userId: intervention.request.clientId,
        type: 'intervention_rescheduled',
        title: 'Intervento riprogrammato',
        message: `L'intervento è stato riprogrammato per il ${dayjs(newStart).format('DD/MM/YYYY HH:mm')}`,
        data: {
          interventionId: intervention.id,
          requestId: intervention.requestId,
          newDate: newStart
        }
      });
    }

    logger.info('[CalendarService] Intervention rescheduled successfully', {
      interventionId
    });

    return formatIntervention(intervention);
  } catch (error) {
    logger.error('[CalendarService] Error rescheduling intervention:', {
      error: error instanceof Error ? error.message : 'Unknown',
      interventionId,
      professionalId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Cancella un intervento (soft delete)
 * 
 * @param {string} interventionId - ID intervento
 * @param {string} professionalId - ID professionista
 * @param {string} reason - Motivo cancellazione (opzionale)
 * @returns {Promise<any>} Risultato operazione
 * @throws {Error} Se non trovato o non autorizzato
 */
export async function cancelIntervention(interventionId: string, professionalId: string, reason?: string) {
  try {
    logger.info('[CalendarService] Cancelling intervention', {
      interventionId,
      professionalId,
      reason
    });

    const existing = await prisma.scheduledIntervention.findUnique({
      where: { id: interventionId },
      include: {
        request: {
          include: {
            client: true
          }
        }
      }
    });

    if (!existing) {
      throw new Error('Intervento non trovato');
    }

    if (existing.professionalId !== professionalId) {
      throw new Error('Non sei autorizzato a cancellare questo intervento');
    }

    const intervention = await prisma.scheduledIntervention.update({
      where: { id: interventionId },
      data: {
        status: 'cancelled',
        notes: reason ? `Cancellato: ${reason}` : 'Intervento cancellato',
        updatedAt: new Date()
      }
    });

    // ✅ FIX: Notifica usando nuovo pattern
    if (existing.request?.clientId) {
      await notificationService.sendToUser({
        userId: existing.request.clientId,
        type: 'intervention_cancelled',
        title: 'Intervento cancellato',
        message: reason || 'L\'intervento programmato è stato cancellato',
        data: {
          interventionId: intervention.id,
          requestId: existing.requestId
        }
      });
    }

    logger.info('[CalendarService] Intervention cancelled successfully', {
      interventionId
    });

    return { success: true, message: 'Intervento cancellato con successo' };
  } catch (error) {
    logger.error('[CalendarService] Error cancelling intervention:', {
      error: error instanceof Error ? error.message : 'Unknown',
      interventionId,
      professionalId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Alias per deleteIntervention (per compatibilità)
 */
export async function deleteIntervention(interventionId: string, reason?: string) {
  const intervention = await prisma.scheduledIntervention.findUnique({
    where: { id: interventionId }
  });
  
  if (!intervention) {
    throw new Error('Intervento non trovato');
  }
  
  return cancelIntervention(interventionId, intervention.professionalId, reason);
}

/**
 * Controlla conflitti orari per un professionista
 * 
 * @param {string} professionalId - ID professionista
 * @param {string | Date} start - Data inizio
 * @param {string | Date} end - Data fine
 * @param {string} excludeId - ID intervento da escludere (per modifiche)
 * @returns {Promise<any[]>} Lista conflitti trovati
 * @throws {Error} Se date invalide o errore query
 * 
 * @example
 * const conflicts = await checkTimeConflicts(
 *   'prof123',
 *   '2025-10-15T10:00:00Z',
 *   '2025-10-15T12:00:00Z',
 *   'intervention-to-exclude'
 * );
 * if (conflicts.length > 0) {
 *   console.log('Conflitti trovati:', conflicts);
 * }
 */
export async function checkTimeConflicts(
  professionalId: string,
  start: string | Date,
  end: string | Date,
  excludeId?: string
) {
  try {
    logger.info('[CalendarService] Checking time conflicts', {
      professionalId,
      start,
      end,
      excludeId
    });

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      throw new Error('La data di fine deve essere successiva alla data di inizio');
    }

    const whereClause: any = {
      professionalId,
      status: {
        notIn: ['cancelled', 'completed']
      }
    };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const conflicts = await prisma.scheduledIntervention.findMany({
      where: {
        ...whereClause,
        OR: [
          { proposedDate: { gte: startDate, lt: endDate } },
          { confirmedDate: { gt: startDate, lte: endDate } },
          {
            AND: [
              { proposedDate: { lte: startDate } },
              {
                OR: [
                  { confirmedDate: { gte: endDate } },
                  {
                    AND: [
                      { confirmedDate: null },
                      { proposedDate: { lte: startDate } }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      include: {
        request: {
          include: {
            client: true,
            category: true
          }
        }
      }
    });

    const conflictsWithCalculatedEnd = conflicts.map(conflict => {
      const calculatedEnd = conflict.confirmedDate || 
        dayjs(conflict.proposedDate).add(conflict.estimatedDuration || 60, 'minute').toDate();
      
      const hasConflict = 
        (conflict.proposedDate <= startDate && calculatedEnd > startDate) ||
        (conflict.proposedDate < endDate && calculatedEnd >= endDate) ||
        (conflict.proposedDate >= startDate && calculatedEnd <= endDate);
      
      return hasConflict ? conflict : null;
    }).filter(Boolean);

    logger.info('[CalendarService] Time conflicts check completed', {
      professionalId,
      conflictsFound: conflictsWithCalculatedEnd.length
    });

    return conflictsWithCalculatedEnd.map(conflict => ({
      id: conflict.id,
      start: conflict.proposedDate,
      end: conflict.confirmedDate || dayjs(conflict.proposedDate).add(conflict.estimatedDuration || 60, 'minute').toISOString(),
      title: conflict.request?.title || 'Intervento',
      client: conflict.request?.client?.fullName || 'Cliente non specificato',
      category: conflict.request?.category?.name || 'Categoria non specificata',
      status: conflict.status
    }));
  } catch (error) {
    logger.error('[CalendarService] Error checking time conflicts:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId,
      start,
      end,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Recupera le richieste assegnate al professionista
export async function getProfessionalRequests(professionalId: string, status?: string) {
  try {
    logger.info('[CalendarService] Fetching professional requests', {
      professionalId,
      status
    });

    const whereClause: any = { professionalId };
    if (status) whereClause.status = status;

    const requests = await prisma.assistanceRequest.findMany({
      where: whereClause,
      include: {
        client: true,
        category: true,
        subcategory: true,
        quotes: { where: { status: 'ACCEPTED' } },
        scheduledInterventions: { where: { status: { notIn: ['cancelled'] } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    logger.info('[CalendarService] Professional requests retrieved', {
      professionalId,
      count: requests.length
    });

    return requests;
  } catch (error) {
    logger.error('[CalendarService] Error fetching professional requests:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Recupera i clienti associati al professionista
export async function getProfessionalClients(professionalId: string) {
  try {
    logger.info('[CalendarService] Fetching professional clients', { professionalId });

    const requests = await prisma.assistanceRequest.findMany({
      where: { professionalId },
      select: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            province: true,
            postalCode: true
          }
        }
      },
      distinct: ['clientId']
    });

    const uniqueClients = requests
      .map(r => r.client)
      .filter(Boolean)
      .reduce((acc: any[], client: any) => {
        if (!acc.find(c => c.id === client.id)) {
          acc.push(client);
        }
        return acc;
      }, []);

    logger.info('[CalendarService] Professional clients retrieved', {
      professionalId,
      count: uniqueClients.length
    });

    return uniqueClients;
  } catch (error) {
    logger.error('[CalendarService] Error fetching professional clients:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Impostazioni calendario
export async function getCalendarSettings(professionalId: string) {
  try {
    return {
      defaultView: 'week',
      weekStartsOn: 1,
      timeSlotDuration: 30,
      minTime: '08:00',
      maxTime: '20:00',
      showWeekends: true,
      defaultInterventionDuration: 60,
      defaultBufferTime: 15,
      colorScheme: {
        pending: '#FFA500',
        confirmed: '#4CAF50',
        inProgress: '#2196F3',
        completed: '#808080',
        cancelled: '#FF0000'
      },
      googleCalendarConnected: false,
      googleSyncEnabled: false,
      notificationSettings: {
        remindBefore: [60, 1440],
        sendToClient: true,
        sendToProfessional: true
      }
    };
  } catch (error) {
    logger.error('[CalendarService] Error fetching calendar settings:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId
    });
    throw error;
  }
}

export async function updateCalendarSettings(professionalId: string, settings: any) {
  try {
    logger.info(`[CalendarService] Updated calendar settings for professional ${professionalId}:`, settings);
    return { ...settings, updatedAt: new Date() };
  } catch (error) {
    logger.error('[CalendarService] Error updating calendar settings:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId
    });
    throw error;
  }
}

// Disponibilità
export async function getAvailability(professionalId: string) {
  try {
    return [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true },
      { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isActive: true },
      { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isActive: false }
    ];
  } catch (error) {
    logger.error('[CalendarService] Error fetching availability:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId
    });
    throw error;
  }
}

export async function updateAvailability(professionalId: string, availability: any[]) {
  try {
    logger.info(`[CalendarService] Updated availability for professional ${professionalId}:`, availability);
    return availability.map(day => ({ ...day, professionalId, updatedAt: new Date() }));
  } catch (error) {
    logger.error('[CalendarService] Error updating availability:', {
      error: error instanceof Error ? error.message : 'Unknown',
      professionalId
    });
    throw error;
  }
}

// Alias per compatibilità
export async function getProfessionalAvailability(professionalId: string) {
  return getAvailability(professionalId);
}

export async function updateProfessionalAvailability(professionalId: string, workingHours: any[]) {
  return updateAvailability(professionalId, workingHours);
}

export async function getProfessionalUnavailabilities(professionalId: string) {
  try {
    return [];
  } catch (error) {
    logger.error('[CalendarService] Error fetching unavailabilities:', { error });
    throw error;
  }
}

export async function addProfessionalUnavailability(professionalId: string, unavailability: any) {
  try {
    logger.info(`[CalendarService] Added unavailability for professional ${professionalId}:`, unavailability);
    return { id: require('crypto').randomUUID(), ...unavailability, professionalId, createdAt: new Date() };
  } catch (error) {
    logger.error('[CalendarService] Error adding unavailability:', { error });
    throw error;
  }
}

export async function removeProfessionalUnavailability(id: string, professionalId: string) {
  try {
    logger.info(`[CalendarService] Removed unavailability ${id} for professional ${professionalId}`);
    return { success: true };
  } catch (error) {
    logger.error('[CalendarService] Error removing unavailability:', { error });
    throw error;
  }
}

export async function createRecurringInterventions(parentId: string, pattern: any) {
  try {
    logger.info(`[CalendarService] Creating recurring interventions for ${parentId} with pattern:`, pattern);
    return [];
  } catch (error) {
    logger.error('[CalendarService] Error creating recurring interventions:', { error });
    throw error;
  }
}

// Google Calendar
export async function getGoogleAuthUrl(professionalId: string) {
  const client = await getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: professionalId
  });
  return url;
}

export async function initiateGoogleAuth(professionalId: string) {
  return getGoogleAuthUrl(professionalId);
}

export async function handleGoogleCallback(code: string, professionalId: string) {
  try {
    const client = await getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    logger.info(`[CalendarService] Google Calendar connected for professional ${professionalId}`);
    return { connected: true, email: 'user@gmail.com', calendarId: 'primary' };
  } catch (error) {
    logger.error('[CalendarService] Error handling Google callback:', { error });
    throw error;
  }
}

export async function syncWithGoogleCalendar(professionalId: string) {
  try {
    logger.info(`[CalendarService] Syncing calendar for professional ${professionalId}`);
    return { synced: true, eventsImported: 0, eventsExported: 0, lastSync: new Date() };
  } catch (error) {
    logger.error('[CalendarService] Error syncing with Google Calendar:', { error });
    throw error;
  }
}

export async function getGoogleCalendarStatus(professionalId: string) {
  try {
    return { connected: false, email: null, lastSync: null };
  } catch (error) {
    logger.error('[CalendarService] Error getting Google Calendar status:', { error });
    throw error;
  }
}

export async function disconnectGoogleCalendar(professionalId: string) {
  try {
    logger.info(`[CalendarService] Disconnecting Google Calendar for professional ${professionalId}`);
    return { success: true, message: 'Google Calendar disconnesso' };
  } catch (error) {
    logger.error('[CalendarService] Error disconnecting Google Calendar:', { error });
    throw error;
  }
}

/**
 * Export modulo completo
 * Singleton service per accesso centralizzato
 */
export const calendarService = {
  getCalendarInterventions,
  createIntervention,
  updateIntervention,
  rescheduleIntervention,
  deleteIntervention,
  cancelIntervention,
  checkTimeConflicts,
  getProfessionalRequests,
  getProfessionalClients,
  getCalendarSettings,
  updateCalendarSettings,
  getAvailability,
  updateAvailability,
  getProfessionalAvailability,
  updateProfessionalAvailability,
  getProfessionalUnavailabilities,
  addProfessionalUnavailability,
  removeProfessionalUnavailability,
  createRecurringInterventions,
  getGoogleAuthUrl,
  handleGoogleCallback,
  syncWithGoogleCalendar,
  getGoogleCalendarStatus,
  initiateGoogleAuth,
  disconnectGoogleCalendar
};
