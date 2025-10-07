import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { GoogleApiKeyService } from '../services/google-api-key.service';

const router = Router();

// Cache per l'OAuth2Client
let oauth2Client: any = null;

// Funzione per ottenere o creare OAuth2Client
async function getOAuth2Client() {
  if (oauth2Client) return oauth2Client;

  const credentials = await GoogleApiKeyService.getGoogleCredentials();
  
  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error('Google Calendar OAuth credentials not configured. Please set them in Admin > API Keys');
  }

  oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    `${process.env.BACKEND_URL || 'http://localhost:3200'}/api/calendar/google/callback`
  );

  return oauth2Client;
}

// Scopes necessari per Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

// GET /api/calendar/google/check-config - Verifica se le API Keys sono configurate
router.get('/check-config', requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const hasCredentials = await GoogleApiKeyService.hasValidCredentials();
    
    if (!hasCredentials) {
      return res.json(ResponseFormatter.success(
        { 
          configured: false,
          message: 'Google Calendar non configurato. Un amministratore deve configurare le API Keys.'
        },
        'Configuration check'
      ));
    }

    return res.json(ResponseFormatter.success(
      { 
        configured: true,
        message: 'Google Calendar è configurato correttamente.'
      },
      'Configuration check'
    ));
  } catch (error) {
    logger.error('Error checking Google Calendar config:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to check configuration', 'CONFIG_ERROR'));
  }
});

// GET /api/calendar/google/status - Verifica stato connessione Google
router.get('/status', requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;

    // Prima verifica se le API Keys sono configurate
    const hasCredentials = await GoogleApiKeyService.hasValidCredentials();
    
    if (!hasCredentials) {
      return res.json(ResponseFormatter.success(
        { 
          connected: false,
          configured: false,
          message: 'Google Calendar non configurato nel sistema'
        },
        'Not configured'
      ));
    }

    const token = await prisma.googleCalendarToken.findUnique({
      where: { professionalId }
    });

    if (!token) {
      return res.json(ResponseFormatter.success(
        { 
          connected: false,
          configured: true
        },
        'Not connected to Google Calendar'
      ));
    }

    // Verifica se il token è ancora valido
    const now = new Date();
    const isExpired = token.expiryDate < now;

    if (isExpired) {
      // Prova a rinnovare il token
      try {
        const client = await getOAuth2Client();
        client.setCredentials({
          refresh_token: token.refreshToken
        });

        const { credentials } = await client.refreshAccessToken();
        
        // Aggiorna il token nel database
        await prisma.googleCalendarToken.update({
          where: { professionalId },
          data: {
            accessToken: credentials.access_token!,
            expiryDate: new Date(credentials.expiry_date!),
            updatedAt: new Date()
          }
        });

        // Ottieni info email
        client.setCredentials(credentials);
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data: userInfo } = await oauth2.userinfo.get();

        return res.json(ResponseFormatter.success(
          { 
            connected: true,
            configured: true,
            email: userInfo.email
          },
          'Connected to Google Calendar'
        ));
      } catch (error) {
        // Token non più valido, richiede nuova autorizzazione
        await prisma.googleCalendarToken.delete({
          where: { professionalId }
        });
        
        return res.json(ResponseFormatter.success(
          { 
            connected: false,
            configured: true
          },
          'Token expired, reconnection required'
        ));
      }
    }

    // Token valido, ottieni info utente
    try {
      const client = await getOAuth2Client();
      client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken
      });

      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data: userInfo } = await oauth2.userinfo.get();

      return res.json(ResponseFormatter.success(
        { 
          connected: true,
          configured: true,
          email: userInfo.email
        },
        'Connected to Google Calendar'
      ));
    } catch (error) {
      return res.json(ResponseFormatter.success(
        { 
          connected: false,
          configured: true
        },
        'Connection check failed'
      ));
    }
  } catch (error) {
    logger.error('Error checking Google Calendar status:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to check status', 'STATUS_ERROR'));
  }
});

// POST /api/calendar/google/connect - Inizia processo di connessione OAuth
router.post('/connect', requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;

    // Verifica che le API Keys siano configurate
    const hasCredentials = await GoogleApiKeyService.hasValidCredentials();
    
    if (!hasCredentials) {
      return res.status(400).json(ResponseFormatter.error(
        'Google Calendar non è configurato. Contatta un amministratore.',
        'NOT_CONFIGURED'
      ));
    }

    // Ottieni OAuth2Client
    const client = await getOAuth2Client();

    // Genera URL di autorizzazione OAuth
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: JSON.stringify({ professionalId }),
      prompt: 'consent' // Forza il consent per ottenere refresh token
    });

    logger.info('Google Calendar connection initiated', { professionalId });
    return res.json(ResponseFormatter.success(
      { authUrl },
      'Authorization URL generated'
    ));
  } catch (error: any) {
    logger.error('Error initiating Google Calendar connection:', error);
    
    if (error.message.includes('not configured')) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'NOT_CONFIGURED'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error('Failed to initiate connection', 'CONNECT_ERROR'));
  }
});

// GET /api/calendar/google/callback - Callback OAuth (chiamato da Google)
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    const { professionalId } = JSON.parse(state as string);

    // Ottieni OAuth2Client
    const client = await getOAuth2Client();

    // Scambia il codice per i token
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    // Salva i token nel database
    await prisma.googleCalendarToken.upsert({
      where: { professionalId },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: new Date(tokens.expiry_date!),
        scope: tokens.scope,
        tokenType: tokens.token_type,
        updatedAt: new Date()
      },
      create: {
        id: uuidv4(),
        professionalId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: new Date(tokens.expiry_date!),
        scope: tokens.scope,
        tokenType: tokens.token_type
      }
    });

    // Aggiorna le impostazioni del calendario per indicare la connessione
    await prisma.calendarSettings.upsert({
      where: { professionalId },
      create: {
        id: uuidv4(),
        professionalId,
        googleCalendarConnected: true,
        lastGoogleSync: new Date()
      },
      update: {
        googleCalendarConnected: true,
        lastGoogleSync: new Date()
      }
    });

    logger.info('Google Calendar connected successfully', { professionalId });
    
    // Reindirizza l'utente all'app con successo
    return res.redirect(`${process.env.FRONTEND_URL}/professional/calendar?google_connected=true`);
  } catch (error) {
    logger.error('Error in Google Calendar callback:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/professional/calendar?google_error=true`);
  }
});

// POST /api/calendar/google/disconnect - Disconnetti Google Calendar
router.post('/disconnect', requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;

    // Rimuovi il token dal database
    await prisma.googleCalendarToken.deleteMany({
      where: { professionalId }
    });

    // Aggiorna le impostazioni
    await prisma.calendarSettings.update({
      where: { professionalId },
      data: {
        googleCalendarConnected: false,
        googleSyncEnabled: false
      }
    });

    logger.info('Google Calendar disconnected', { professionalId });
    return res.json(ResponseFormatter.success(null, 'Disconnected successfully'));
  } catch (error) {
    logger.error('Error disconnecting Google Calendar:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to disconnect', 'DISCONNECT_ERROR'));
  }
});

// GET /api/calendar/google/calendars - Ottieni lista calendari Google
router.get('/calendars', requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;

    const token = await prisma.googleCalendarToken.findUnique({
      where: { professionalId }
    });

    if (!token) {
      return res.status(401).json(ResponseFormatter.error('Not connected to Google Calendar', 'NOT_CONNECTED'));
    }

    // Configura il client OAuth
    const client = await getOAuth2Client();
    client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken
    });

    // Ottieni la lista dei calendari
    const calendar = google.calendar({ version: 'v3', auth: client });
    const { data } = await calendar.calendarList.list();

    const calendars = data.items?.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary,
      backgroundColor: cal.backgroundColor
    })) || [];

    logger.info('Google calendars retrieved', { professionalId, count: calendars.length });
    return res.json(ResponseFormatter.success(calendars, 'Calendars retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching Google calendars:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch calendars', 'FETCH_ERROR'));
  }
});

// POST /api/calendar/google/sync - Sincronizza con Google Calendar
router.post('/sync', requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { direction, calendarId, dateRange } = req.body;

    const token = await prisma.googleCalendarToken.findUnique({
      where: { professionalId }
    });

    if (!token) {
      return res.status(401).json(ResponseFormatter.error('Not connected to Google Calendar', 'NOT_CONNECTED'));
    }

    // Configura il client OAuth
    const client = await getOAuth2Client();
    client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: client });
    const targetCalendarId = calendarId || 'primary';
    
    let syncedCount = 0;

    // Importa da Google Calendar
    if (direction === 'import' || direction === 'both') {
      const { data } = await calendar.events.list({
        calendarId: targetCalendarId,
        timeMin: new Date(dateRange.from).toISOString(),
        timeMax: new Date(dateRange.to).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      // Importa gli eventi come blocchi nel calendario del professionista
      for (const event of data.items || []) {
        if (event.start?.dateTime && event.end?.dateTime) {
          await prisma.calendarBlock.create({
            data: {
              id: uuidv4(),
              professionalId,
              startDateTime: new Date(event.start.dateTime),
              endDateTime: new Date(event.end.dateTime),
              reason: event.summary || 'Importato da Google Calendar'
            }
          });
          syncedCount++;
        }
      }
    }

    // Esporta verso Google Calendar
    if (direction === 'export' || direction === 'both') {
      const interventions = await prisma.scheduledIntervention.findMany({
        where: {
          professionalId,
          proposedDate: {
            gte: new Date(dateRange.from),
            lte: new Date(dateRange.to)
          }
        },
        include: {
          request: {
            include: {
              client: true
            }
          }
        }
      });

      for (const intervention of interventions) {
        const event = {
          summary: intervention.description || `Intervento - ${intervention.request.title}`,
          description: `Cliente: ${intervention.request.client.fullName}\n${intervention.request.description || ''}`,
          start: {
            dateTime: intervention.proposedDate.toISOString(),
            timeZone: 'Europe/Rome'
          },
          end: {
            dateTime: new Date(
              intervention.proposedDate.getTime() + (intervention.estimatedDuration || 60) * 60000
            ).toISOString(),
            timeZone: 'Europe/Rome'
          },
          location: intervention.request.address || ''
        };

        await calendar.events.insert({
          calendarId: targetCalendarId,
          requestBody: event
        });
        syncedCount++;
      }
    }

    // Aggiorna l'ultima sincronizzazione
    await prisma.calendarSettings.update({
      where: { professionalId },
      data: {
        lastGoogleSync: new Date()
      }
    });

    logger.info('Google Calendar sync completed', { professionalId, syncedCount, direction });
    return res.json(ResponseFormatter.success(
      { synced: syncedCount },
      `Sincronizzati ${syncedCount} eventi`
    ));
  } catch (error) {
    logger.error('Error syncing with Google Calendar:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to sync', 'SYNC_ERROR'));
  }
});

// POST /api/calendar/google/configure - Configura le API Keys (solo ADMIN)
router.post('/configure', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { clientId, clientSecret, apiKey } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json(ResponseFormatter.error(
        'Client ID e Client Secret sono obbligatori',
        'INVALID_DATA'
      ));
    }

    // Salva le credenziali nel database
    await GoogleApiKeyService.saveGoogleCalendarCredentials({
      clientId,
      clientSecret,
      apiKey
    });

    // Resetta la cache dell'OAuth2Client
    oauth2Client = null;

    logger.info('Google Calendar credentials configured by admin', { adminId: req.user!.id });
    return res.json(ResponseFormatter.success(null, 'Credenziali Google Calendar configurate con successo'));
  } catch (error) {
    logger.error('Error configuring Google Calendar:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to configure credentials', 'CONFIG_ERROR'));
  }
});

// DELETE /api/calendar/google/configure - Elimina la configurazione (solo ADMIN)
router.delete('/configure', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    // Elimina la configurazione dal database
    await prisma.apiKey.deleteMany({
      where: { service: 'google_calendar' }
    });

    // Resetta la cache dell'OAuth2Client
    oauth2Client = null;

    logger.info('Google Calendar configuration deleted by admin', { adminId: req.user!.id });
    return res.json(ResponseFormatter.success(null, 'Configurazione Google Calendar eliminata con successo'));
  } catch (error) {
    logger.error('Error deleting Google Calendar configuration:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to delete configuration', 'DELETE_ERROR'));
  }
});

export default router;
