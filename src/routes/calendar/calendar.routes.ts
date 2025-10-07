import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { ResponseFormatter } from '../../utils/responseFormatter';
import * as calendarService from '../../services/calendar.service';
import { z } from 'zod';
import logger from '../../utils/logger';

const router = Router();

// Schema validazione per interventi
const interventionSchema = z.object({
  title: z.string().min(1),
  requestId: z.string().optional(),
  clientId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  allDay: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  estimatedDuration: z.number().optional(),
  travelTime: z.number().optional(),
  preparationTime: z.number().optional(),
  reminderMinutes: z.number().optional(),
  color: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.string(),
    interval: z.number(),
    daysOfWeek: z.array(z.number()).optional(),
    endDate: z.string().optional()
  }).optional(),
  metadata: z.any().optional()
});

// Schema per impostazioni disponibilità
const availabilitySchema = z.object({
  workingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    isActive: z.boolean()
  }))
});

// Schema per giorni di chiusura
const unavailabilitySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
  description: z.string().optional(),
  allDay: z.boolean().optional(),
  recurring: z.boolean().optional()
});

// GET /api/interventions/calendar - Ottieni interventi per calendario
router.get('/interventions/calendar', authenticate, async (req: any, res) => {
  try {
    const interventions = await calendarService.getCalendarInterventions(req.user.id, {
      status: req.query.status,
      category: req.query.category,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    
    return res.json(ResponseFormatter.success(
      interventions,
      'Interventi recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching calendar interventions:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recuperare gli interventi',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/interventions - Crea nuovo intervento
router.post('/interventions', authenticate, validateRequest(interventionSchema), async (req: any, res) => {
  try {
    const interventionData = {
      ...req.body,
      professionalId: req.user.id,
      createdBy: req.user.id
    };

    const intervention = await calendarService.createIntervention(interventionData);

    // Se è ricorrente, crea tutti gli eventi
    if (req.body.recurring && req.body.recurringPattern) {
      await calendarService.createRecurringInterventions(intervention.id, req.body.recurringPattern);
    }

    return res.status(201).json(ResponseFormatter.success(
      intervention,
      'Intervento creato con successo'
    ));
  } catch (error) {
    logger.error('Error creating intervention:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione dell\'intervento',
      'CREATE_ERROR'
    ));
  }
});

// PUT /api/interventions/:id - Aggiorna intervento
router.put('/interventions/:id', authenticate, validateRequest(interventionSchema), async (req: any, res) => {
  try {
    const { id } = req.params;
    const intervention = await calendarService.updateIntervention(id, req.body, req.user.id);

    return res.json(ResponseFormatter.success(
      intervention,
      'Intervento aggiornato con successo'
    ));
  } catch (error) {
    logger.error('Error updating intervention:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento dell\'intervento',
      'UPDATE_ERROR'
    ));
  }
});

// PATCH /api/interventions/:id/reschedule - Riprogramma intervento (drag & drop)
router.patch('/interventions/:id/reschedule', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.body;

    const intervention = await calendarService.rescheduleIntervention(id, start, end, req.user.id);

    return res.json(ResponseFormatter.success(
      intervention,
      'Intervento riprogrammato con successo'
    ));
  } catch (error) {
    logger.error('Error rescheduling intervention:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella riprogrammazione',
      'RESCHEDULE_ERROR'
    ));
  }
});

// DELETE /api/interventions/:id - Cancella intervento
router.delete('/interventions/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    await calendarService.cancelIntervention(id, req.user.id, req.body.reason);

    return res.json(ResponseFormatter.success(
      null,
      'Intervento cancellato con successo'
    ));
  } catch (error) {
    logger.error('Error cancelling intervention:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella cancellazione dell\'intervento',
      'DELETE_ERROR'
    ));
  }
});

// POST /api/calendar/check-conflicts - Verifica conflitti orari
router.post('/calendar/check-conflicts', authenticate, async (req: any, res) => {
  try {
    const { start, end, excludeId } = req.body;
    const conflicts = await calendarService.checkTimeConflicts(
      req.user.id,
      start,
      end,
      excludeId
    );

    return res.json(ResponseFormatter.success(
      {
        hasConflicts: conflicts.length > 0,
        conflicts
      },
      'Verifica conflitti completata'
    ));
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella verifica conflitti',
      'CHECK_ERROR'
    ));
  }
});

// GET /api/calendar/availability - Ottieni orari di lavoro
router.get('/calendar/availability', authenticate, async (req: any, res) => {
  try {
    const availability = await calendarService.getProfessionalAvailability(req.user.id);

    return res.json(ResponseFormatter.success(
      availability,
      'Disponibilità recuperata con successo'
    ));
  } catch (error) {
    logger.error('Error fetching availability:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recuperare la disponibilità',
      'FETCH_ERROR'
    ));
  }
});

// PUT /api/calendar/availability - Aggiorna orari di lavoro
router.put('/calendar/availability', authenticate, validateRequest(availabilitySchema), async (req: any, res) => {
  try {
    const availability = await calendarService.updateProfessionalAvailability(
      req.user.id,
      req.body.workingHours
    );

    return res.json(ResponseFormatter.success(
      availability,
      'Orari di lavoro aggiornati con successo'
    ));
  } catch (error) {
    logger.error('Error updating availability:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento degli orari',
      'UPDATE_ERROR'
    ));
  }
});

// GET /api/calendar/unavailability - Ottieni giorni di chiusura
router.get('/calendar/unavailability', authenticate, async (req: any, res) => {
  try {
    const unavailabilities = await calendarService.getProfessionalUnavailabilities(req.user.id);

    return res.json(ResponseFormatter.success(
      unavailabilities,
      'Giorni di chiusura recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching unavailabilities:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recuperare i giorni di chiusura',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/calendar/unavailability - Aggiungi giorni di chiusura
router.post('/calendar/unavailability', authenticate, validateRequest(unavailabilitySchema), async (req: any, res) => {
  try {
    const unavailability = await calendarService.addProfessionalUnavailability(
      req.user.id,
      req.body
    );

    return res.status(201).json(ResponseFormatter.success(
      unavailability,
      'Periodo di chiusura aggiunto con successo'
    ));
  } catch (error) {
    logger.error('Error adding unavailability:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiungere il periodo di chiusura',
      'CREATE_ERROR'
    ));
  }
});

// DELETE /api/calendar/unavailability/:id - Rimuovi giorni di chiusura
router.delete('/calendar/unavailability/:id', authenticate, async (req: any, res) => {
  try {
    await calendarService.removeProfessionalUnavailability(req.params.id, req.user.id);

    return res.json(ResponseFormatter.success(
      null,
      'Periodo di chiusura rimosso con successo'
    ));
  } catch (error) {
    logger.error('Error removing unavailability:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella rimozione del periodo di chiusura',
      'DELETE_ERROR'
    ));
  }
});

// GET /api/calendar/settings - Ottieni impostazioni calendario
router.get('/calendar/settings', authenticate, async (req: any, res) => {
  try {
    const settings = await calendarService.getCalendarSettings(req.user.id);

    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni calendario recuperate con successo'
    ));
  } catch (error) {
    logger.error('Error fetching calendar settings:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recuperare le impostazioni',
      'FETCH_ERROR'
    ));
  }
});

// PUT /api/calendar/settings - Aggiorna impostazioni calendario
router.put('/calendar/settings', authenticate, async (req: any, res) => {
  try {
    const settings = await calendarService.updateCalendarSettings(req.user.id, req.body);

    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni aggiornate con successo'
    ));
  } catch (error) {
    logger.error('Error updating calendar settings:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento delle impostazioni',
      'UPDATE_ERROR'
    ));
  }
});

// Google Calendar Integration Routes
// GET /api/calendar/google/status - Stato connessione Google
router.get('/calendar/google/status', authenticate, async (req: any, res) => {
  try {
    const status = await calendarService.getGoogleCalendarStatus(req.user.id);

    return res.json(ResponseFormatter.success(
      status,
      'Stato connessione Google recuperato'
    ));
  } catch (error) {
    logger.error('Error fetching Google calendar status:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recuperare lo stato di connessione',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/calendar/google/connect - Inizia connessione Google
router.post('/calendar/google/connect', authenticate, async (req: any, res) => {
  try {
    const authUrl = await calendarService.initiateGoogleAuth(req.user.id);

    return res.json(ResponseFormatter.success(
      { authUrl },
      'URL di autorizzazione generato'
    ));
  } catch (error) {
    logger.error('Error initiating Google auth:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'inizializzazione della connessione',
      'AUTH_ERROR'
    ));
  }
});

// GET /api/calendar/google/callback - Callback OAuth2 Google
router.get('/calendar/google/callback', async (req: any, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect('/professional/calendar?error=auth_failed');
    }

    await calendarService.handleGoogleCallback(code as string, state as string);
    
    return res.redirect('/professional/calendar?success=google_connected');
  } catch (error) {
    logger.error('Error handling Google callback:', error);
    return res.redirect('/professional/calendar?error=connection_failed');
  }
});

// POST /api/calendar/google/disconnect - Disconnetti Google Calendar
router.post('/calendar/google/disconnect', authenticate, async (req: any, res) => {
  try {
    await calendarService.disconnectGoogleCalendar(req.user.id);

    return res.json(ResponseFormatter.success(
      null,
      'Google Calendar disconnesso con successo'
    ));
  } catch (error) {
    logger.error('Error disconnecting Google calendar:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella disconnessione',
      'DISCONNECT_ERROR'
    ));
  }
});

// POST /api/calendar/google/sync - Sincronizza con Google Calendar
router.post('/calendar/google/sync', authenticate, async (req: any, res) => {
  try {
    const syncResult = await calendarService.syncWithGoogleCalendar(req.user.id);

    return res.json(ResponseFormatter.success(
      syncResult,
      'Sincronizzazione completata con successo'
    ));
  } catch (error) {
    logger.error('Error syncing with Google calendar:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella sincronizzazione',
      'SYNC_ERROR'
    ));
  }
});

export default router;
