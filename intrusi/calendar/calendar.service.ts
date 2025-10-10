import { prisma } from '../../config/database';
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { logger } from '../../utils/logger';
import { notificationService } from '../notification.service';
import { apiKeyService } from '../apiKey.service';

// Configurazione Google OAuth2 - AGGIORNATA PER USARE DB
let oauth2Client: any = null;

// Inizializza OAuth2 Client con credentials dal database
async function getOAuth2Client() {
  if (oauth2Client) {
    return oauth2Client;
  }

  try {
    // Recupera le credenziali Google OAuth dal database
    const googleCalendarKey = await apiKeyService.getApiKey('google_calendar', true);
    
    if (!googleCalendarKey) {
      throw new Error('Google Calendar credentials not found in database');
    }

    // Le credenziali sono salvate come JSON nel campo key
    const credentials = JSON.parse(googleCalendarKey.key);
    
    oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/calendar/google/callback`
    );

    return oauth2Client;
  } catch (error) {
    logger.error('Error initializing OAuth2 client:', error);
    throw new Error('Failed to initialize Google Calendar - check API keys in database');
  }
}

// Funzione helper per formattare gli interventi per il calendario
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

// Recupera gli interventi per il calendario
export async function getCalendarInterventions(professionalId: string, filters: any = {}) {
  try {
    // Costruiamo i filtri per la query
    const whereClause: any = {
      professionalId: professionalId
    };

    // Filtro per stato se specificato
    if (filters.status && filters.status !== 'all') {
      whereClause.status = filters.status;
    }

    // Filtro per categoria se specificato
    if (filters.category && filters.category !== 'all') {
      whereClause.request = {
        ...whereClause.request,
        categoryId: filters.category
      };
    }

    // Filtro per ricerca testo
    if (filters.search) {
      whereClause.OR = [
        {
          description: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          notes: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          request: {
            title: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        },
        {
          request: {
            client: {
              fullName: {
                contains: filters.search,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    // Esegui la query
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

    // Formatta i risultati per il calendario
    return interventions.map(formatIntervention);
  } catch (error) {
    logger.error('Error fetching calendar interventions:', error);
    throw error;
  }
}

// Crea un nuovo intervento DA UNA RICHIESTA ESISTENTE (IMPORTANTE!)
export async function createIntervention(data: any) {
  try {
    // IMPORTANTE: Gli interventi devono SEMPRE essere collegati a una richiesta
    let requestId = data.requestId;

    if (!requestId) {
      throw new Error('Un intervento deve essere sempre collegato a una richiesta di assistenza esistente');
    }

    // Verifica che la richiesta esista e sia assegnata al professionista
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

    // Crea l'intervento programmato
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
        createdBy: data.professionalId
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

    // Invia notifica al cliente
    if (intervention.request?.clientId) {
      await notificationService.sendToUser(intervention.request.clientId, {
        title: 'Nuovo intervento programmato',
        message: `È stato programmato un intervento per il ${dayjs(intervention.proposedDate).format('DD/MM/YYYY HH:mm')}`,
        type: 'intervention_scheduled',
        data: {
          interventionId: intervention.id,
          requestId: intervention.requestId
        }
      });
    }

    return formatIntervention(intervention);
  } catch (error) {
    logger.error('Error creating intervention:', error);
    throw error;
  }
}

// Aggiorna un intervento
export async function updateIntervention(interventionId: string, data: any, professionalId: string) {
  try {
    // Verifica che l'intervento appartenga al professionista
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
      where: {
        id: interventionId
      },
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

    return formatIntervention(intervention);
  } catch (error) {
    logger.error('Error updating intervention:', error);
    throw error;
  }
}

// Riprogramma un intervento (drag & drop)
export async function rescheduleIntervention(interventionId: string, newStart: string, newEnd: string, professionalId: string) {
  try {
    // Verifica autorizzazione
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
      where: {
        id: interventionId
      },
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

    // Notifica il cliente del cambiamento
    if (intervention.request?.clientId) {
      await notificationService.sendToUser(intervention.request.clientId, {
        title: 'Intervento riprogrammato',
        message: `L'intervento è stato riprogrammato per il ${dayjs(newStart).format('DD/MM/YYYY HH:mm')}`,
        type: 'intervention_rescheduled',
        data: {
          interventionId: intervention.id,
          requestId: intervention.requestId,
          newDate: newStart
        }
      });
    }

    return formatIntervention(intervention);
  } catch (error) {
    logger.error('Error rescheduling intervention:', error);
    throw error;
  }
}

// Cancella un intervento
export async function cancelIntervention(interventionId: string, professionalId: string, reason?: string) {
  try {
    // Verifica autorizzazione
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

    // Aggiorna lo stato a cancelled invece di eliminare
    const intervention = await prisma.scheduledIntervention.update({
      where: {
        id: interventionId
      },
      data: {
        status: 'cancelled',
        notes: reason ? `Cancellato: ${reason}` : 'Intervento cancellato',
        updatedAt: new Date()
      }
    });

    // Notifica il cliente della cancellazione
    if (existing.request?.clientId) {
      await notificationService.sendToUser(existing.request.clientId, {
        title: 'Intervento cancellato',
        message: reason || 'L\'intervento programmato è stato cancellato',
        type: 'intervention_cancelled',
        data: {
          interventionId: intervention.id,
          requestId: existing.requestId
        }
      });
    }

    return { success: true, message: 'Intervento cancellato con successo' };
  } catch (error) {
    logger.error('Error cancelling intervention:', error);
    throw error;
  }
}

// Alias per deleteIntervention (per compatibilità)
export async function deleteIntervention(interventionId: string, reason?: string) {
  // Ottieni il professionista dall'intervento stesso
  const intervention = await prisma.scheduledIntervention.findUnique({
    where: { id: interventionId }
  });
  
  if (!intervention) {
    throw new Error('Intervento non trovato');
  }
  
  return cancelIntervention(interventionId, intervention.professionalId, reason);
}

// ===========================================
// CONTROLLO CONFLITTI ORARI (CRITICO!)
// ===========================================

export async function checkTimeConflicts(
  professionalId: string,
  start: string | Date,
  end: string | Date,
  excludeId?: string
) {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Validazione date
    if (startDate >= endDate) {
      throw new Error('La data di fine deve essere successiva alla data di inizio');
    }

    // Costruisci la query per trovare conflitti
    const whereClause: any = {
      professionalId,
      status: {
        notIn: ['cancelled', 'completed'] // Non considerare interventi cancellati o completati
      }
    };

    // Escludi l'intervento corrente se stiamo modificando
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    // Trova interventi che si sovrappongono con il periodo richiesto
    const conflicts = await prisma.scheduledIntervention.findMany({
      where: {
        ...whereClause,
        OR: [
          {
            // L'intervento esistente inizia durante il nuovo intervento
            proposedDate: {
              gte: startDate,
              lt: endDate
            }
          },
          {
            // L'intervento esistente finisce durante il nuovo intervento  
            confirmedDate: {
              gt: startDate,
              lte: endDate
            }
          },
          {
            // L'intervento esistente contiene il nuovo intervento
            AND: [
              {
                proposedDate: {
                  lte: startDate
                }
              },
              {
                OR: [
                  {
                    confirmedDate: {
                      gte: endDate
                    }
                  },
                  {
                    // Se confirmedDate è null, calcola in base alla durata stimata
                    AND: [
                      {
                        confirmedDate: null
                      },
                      {
                        proposedDate: {
                          lte: startDate
                        }
                      }
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

    // Per gli interventi senza confirmedDate, calcola la fine in base alla durata
    const conflictsWithCalculatedEnd = conflicts.map(conflict => {
      const calculatedEnd = conflict.confirmedDate || 
        dayjs(conflict.proposedDate).add(conflict.estimatedDuration || 60, 'minute').toDate();
      
      // Verifica se c'è effettivamente conflitto con le date calcolate
      const hasConflict = 
        (conflict.proposedDate <= startDate && calculatedEnd > startDate) ||
        (conflict.proposedDate < endDate && calculatedEnd >= endDate) ||
        (conflict.proposedDate >= startDate && calculatedEnd <= endDate);
      
      return hasConflict ? conflict : null;
    }).filter(Boolean);

    // Formatta i conflitti per la risposta
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
    logger.error('Error checking time conflicts:', error);
    throw error;
  }
}

// ===========================================
// GESTIONE RICHIESTE DEL PROFESSIONISTA
// ===========================================

// Recupera le richieste assegnate al professionista
export async function getProfessionalRequests(professionalId: string, status?: string) {
  try {
    const whereClause: any = {
      professionalId
    };

    if (status) {
      whereClause.status = status;
    }

    const requests = await prisma.assistanceRequest.findMany({
      where: whereClause,
      include: {
        client: true,
        category: true,
        subcategory: true,
        quotes: {
          where: {
            status: 'ACCEPTED'
          }
        },
        scheduledInterventions: {
          where: {
            status: {
              notIn: ['cancelled']
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return requests;
  } catch (error) {
    logger.error('Error fetching professional requests:', error);
    throw error;
  }
}

// Recupera i clienti associati al professionista
export async function getProfessionalClients(professionalId: string) {
  try {
    // Trova tutti i clienti unici dalle richieste assegnate al professionista
    const requests = await prisma.assistanceRequest.findMany({
      where: {
        professionalId
      },
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

    // Rimuovi duplicati e null
    const uniqueClients = requests
      .map(r => r.client)
      .filter(Boolean)
      .reduce((acc: any[], client: any) => {
        if (!acc.find(c => c.id === client.id)) {
          acc.push(client);
        }
        return acc;
      }, []);

    return uniqueClients;
  } catch (error) {
    logger.error('Error fetching professional clients:', error);
    throw error;
  }
}

// ===========================================
// GESTIONE IMPOSTAZIONI CALENDARIO
// ===========================================

// Recupera le impostazioni del calendario per un professionista
export async function getCalendarSettings(professionalId: string) {
  try {
    // Per ora ritorniamo delle impostazioni di default
    // In futuro queste verranno salvate nel database
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
        remindBefore: [60, 1440], // minuti prima (1 ora, 1 giorno)
        sendToClient: true,
        sendToProfessional: true
      }
    };
  } catch (error) {
    logger.error('Error fetching calendar settings:', error);
    throw error;
  }
}

// Aggiorna le impostazioni del calendario
export async function updateCalendarSettings(professionalId: string, settings: any) {
  try {
    // Per ora salviamo solo in memoria
    // In futuro queste verranno salvate nel database
    logger.info(`Updated calendar settings for professional ${professionalId}:`, settings);
    
    return {
      ...settings,
      updatedAt: new Date()
    };
  } catch (error) {
    logger.error('Error updating calendar settings:', error);
    throw error;
  }
}

// ===========================================
// GESTIONE DISPONIBILITÀ
// ===========================================

// Recupera la disponibilità settimanale
export async function getAvailability(professionalId: string) {
  try {
    // Per ora ritorniamo una disponibilità di default
    // In futuro verrà salvata nel database
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
    logger.error('Error fetching availability:', error);
    throw error;
  }
}

// Aggiorna la disponibilità
export async function updateAvailability(professionalId: string, availability: any[]) {
  try {
    // Per ora salviamo solo in memoria
    // In futuro verrà salvata nel database
    logger.info(`Updated availability for professional ${professionalId}:`, availability);
    
    return availability.map(day => ({
      ...day,
      professionalId,
      updatedAt: new Date()
    }));
  } catch (error) {
    logger.error('Error updating availability:', error);
    throw error;
  }
}

// Alias per compatibilità con routes
export async function getProfessionalAvailability(professionalId: string) {
  return getAvailability(professionalId);
}

export async function updateProfessionalAvailability(professionalId: string, workingHours: any[]) {
  return updateAvailability(professionalId, workingHours);
}

// Gestione periodi di indisponibilità
export async function getProfessionalUnavailabilities(professionalId: string) {
  try {
    // Per ora ritorna array vuoto, in futuro verrà implementato con database
    return [];
  } catch (error) {
    logger.error('Error fetching unavailabilities:', error);
    throw error;
  }
}

export async function addProfessionalUnavailability(professionalId: string, unavailability: any) {
  try {
    // Per ora salva solo in log, in futuro verrà implementato con database
    logger.info(`Added unavailability for professional ${professionalId}:`, unavailability);
    return {
      id: require('crypto').randomUUID(),
      ...unavailability,
      professionalId,
      createdAt: new Date()
    };
  } catch (error) {
    logger.error('Error adding unavailability:', error);
    throw error;
  }
}

export async function removeProfessionalUnavailability(id: string, professionalId: string) {
  try {
    // Per ora solo log, in futuro verrà implementato con database
    logger.info(`Removed unavailability ${id} for professional ${professionalId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error removing unavailability:', error);
    throw error;
  }
}

// ===========================================
// GESTIONE INTERVENTI RICORRENTI
// ===========================================

export async function createRecurringInterventions(parentId: string, pattern: any) {
  try {
    // Per ora solo log, in futuro verrà implementato completamente
    logger.info(`Creating recurring interventions for ${parentId} with pattern:`, pattern);
    return [];
  } catch (error) {
    logger.error('Error creating recurring interventions:', error);
    throw error;
  }
}

// ===========================================
// INTEGRAZIONE GOOGLE CALENDAR
// ===========================================

// Autorizza con Google Calendar
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

// Alias per compatibilità
export async function initiateGoogleAuth(professionalId: string) {
  return getGoogleAuthUrl(professionalId);
}

// Gestisci il callback di Google
export async function handleGoogleCallback(code: string, professionalId: string) {
  try {
    const client = await getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Per ora salviamo solo in memoria
    // In futuro salveremo nel database
    logger.info(`Google Calendar connected for professional ${professionalId}`);

    return {
      connected: true,
      email: 'user@gmail.com', // Questo verrà recuperato dall'API Google
      calendarId: 'primary'
    };
  } catch (error) {
    logger.error('Error handling Google callback:', error);
    throw error;
  }
}

// Sincronizza con Google Calendar
export async function syncWithGoogleCalendar(professionalId: string) {
  try {
    // Per ora simuliamo la sincronizzazione
    // In futuro implementeremo la sincronizzazione reale
    logger.info(`Syncing calendar for professional ${professionalId}`);

    return {
      synced: true,
      eventsImported: 0,
      eventsExported: 0,
      lastSync: new Date()
    };
  } catch (error) {
    logger.error('Error syncing with Google Calendar:', error);
    throw error;
  }
}

// Ottieni stato connessione Google Calendar
export async function getGoogleCalendarStatus(professionalId: string) {
  try {
    // Per ora ritorna non connesso, in futuro verrà implementato
    return {
      connected: false,
      email: null,
      lastSync: null
    };
  } catch (error) {
    logger.error('Error getting Google Calendar status:', error);
    throw error;
  }
}

// Disconnetti Google Calendar
export async function disconnectGoogleCalendar(professionalId: string) {
  try {
    logger.info(`Disconnecting Google Calendar for professional ${professionalId}`);
    return { success: true, message: 'Google Calendar disconnesso' };
  } catch (error) {
    logger.error('Error disconnecting Google Calendar:', error);
    throw error;
  }
}

// Export del modulo completo
export const calendarService = {
  // Interventi base
  getCalendarInterventions,
  createIntervention,
  updateIntervention,
  rescheduleIntervention,
  deleteIntervention,
  cancelIntervention,
  
  // Controllo conflitti
  checkTimeConflicts,
  
  // Gestione richieste e clienti
  getProfessionalRequests,
  getProfessionalClients,
  
  // Impostazioni calendario
  getCalendarSettings,
  updateCalendarSettings,
  
  // Disponibilità
  getAvailability,
  updateAvailability,
  getProfessionalAvailability,
  updateProfessionalAvailability,
  getProfessionalUnavailabilities,
  addProfessionalUnavailability,
  removeProfessionalUnavailability,
  
  // Interventi ricorrenti
  createRecurringInterventions,
  
  // Google Calendar
  getGoogleAuthUrl,
  handleGoogleCallback,
  syncWithGoogleCalendar,
  getGoogleCalendarStatus,
  initiateGoogleAuth,
  disconnectGoogleCalendar
};
