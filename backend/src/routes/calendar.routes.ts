import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { requireModule } from '../middleware/module.middleware';

const router = Router();

// 🔒 Protegge tutte le routes del calendario
// Se il modulo 'calendar' è disabilitato, blocca l'accesso con 403
router.use(requireModule('calendar'));

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

// Schema validazione per le impostazioni calendario
const calendarSettingsSchema = z.object({
  defaultView: z.enum(['day', 'week', 'month', 'list']).optional(),
  weekStartsOn: z.number().min(0).max(6).optional(),
  timeSlotDuration: z.number().min(15).max(120).optional(),
  minTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  maxTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  showWeekends: z.boolean().optional(),
  defaultInterventionDuration: z.number().min(15).max(480).optional(),
  defaultBufferTime: z.number().min(0).max(120).optional(),
  maxConcurrentInterventions: z.number().min(1).max(10).optional(),
  autoConfirmInterventions: z.boolean().optional(),
  sendReminders: z.boolean().optional(),
  reminderTiming: z.array(z.number()).optional(),
  timeZone: z.string().optional(),
  colorScheme: z.record(z.string()).optional()
});

// Schema per disponibilità oraria
const availabilitySchema = z.object({
  workingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isActive: z.boolean()
  }))
});

// Schema per giorni di chiusura
const unavailabilitySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
  description: z.string().optional(),
  allDay: z.boolean().default(true)
});

// GET /api/calendar/settings - Ottieni impostazioni calendario del professionista
router.get('/settings', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;

    // Cerca le impostazioni esistenti o crea quelle di default
    let settings = await prisma.calendarSettings.findUnique({
      where: { professionalId }
    });

    if (!settings) {
      // Crea impostazioni di default
      settings = await prisma.calendarSettings.create({
        data: {
          id: uuidv4(),
          professionalId,
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
            completed: '#808080',
            cancelled: '#FF0000'
          }
        }
      });
    }

    logger.info('Calendar settings retrieved', { professionalId });
    return res.json(ResponseFormatter.success(settings, 'Settings retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching calendar settings:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch settings', 'FETCH_ERROR'));
  }
});

// PUT /api/calendar/settings - Aggiorna impostazioni calendario
router.put('/settings', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const validatedData = calendarSettingsSchema.parse(req.body);

    const settings = await prisma.calendarSettings.upsert({
      where: { professionalId },
      update: {
        ...validatedData,
        updatedAt: new Date()
      },
      create: {
        id: uuidv4(),
        professionalId,
        ...validatedData
      }
    });

    logger.info('Calendar settings updated', { professionalId });
    return res.json(ResponseFormatter.success(settings, 'Settings updated successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error('Invalid data', 'VALIDATION_ERROR', error.errors));
    }
    logger.error('Error updating calendar settings:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to update settings', 'UPDATE_ERROR'));
  }
});

// GET /api/calendar/availability - Ottieni disponibilità oraria
router.get('/availability', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;

    const availability = await prisma.calendarAvailability.findMany({
      where: { professionalId },
      orderBy: { dayOfWeek: 'asc' }
    });

    // Se non ci sono orari, crea quelli di default
    if (availability.length === 0) {
      const defaultHours = [];
      for (let day = 0; day <= 6; day++) {
        const hour = await prisma.calendarAvailability.create({
          data: {
            id: uuidv4(),
            professionalId,
            dayOfWeek: day,
            startTime: day === 0 ? '' : '09:00',
            endTime: day === 0 ? '' : '18:00',
            isActive: day !== 0 // Attivo tutti i giorni tranne domenica
          }
        });
        defaultHours.push(hour);
      }
      return res.json(ResponseFormatter.success(defaultHours, 'Default availability created'));
    }

    logger.info('Availability retrieved', { professionalId });
    return res.json(ResponseFormatter.success(availability, 'Availability retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching availability:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch availability', 'FETCH_ERROR'));
  }
});

// PUT /api/calendar/availability - Aggiorna disponibilità oraria
router.put('/availability', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const validatedData = availabilitySchema.parse(req.body);

    // Aggiorna ogni giorno della settimana
    const updates = await Promise.all(
      validatedData.workingHours.map(async (hour) => {
        return await prisma.calendarAvailability.upsert({
          where: {
            professionalId_dayOfWeek: {
              professionalId,
              dayOfWeek: hour.dayOfWeek
            }
          },
          update: {
            startTime: hour.startTime,
            endTime: hour.endTime,
            isActive: hour.isActive,
            updatedAt: new Date()
          },
          create: {
            id: uuidv4(),
            professionalId,
            ...hour
          }
        });
      })
    );

    logger.info('Availability updated', { professionalId });
    return res.json(ResponseFormatter.success(updates, 'Availability updated successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error('Invalid data', 'VALIDATION_ERROR', error.errors));
    }
    logger.error('Error updating availability:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to update availability', 'UPDATE_ERROR'));
  }
});

// GET /api/calendar/unavailability - Ottieni giorni di chiusura
router.get('/unavailability', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;

    const exceptions = await prisma.calendarException.findMany({
      where: {
        professionalId,
        date: {
          gte: new Date()
        }
      },
      orderBy: { date: 'asc' }
    });

    logger.info('Unavailability retrieved', { professionalId });
    return res.json(ResponseFormatter.success(exceptions, 'Unavailability retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching unavailability:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch unavailability', 'FETCH_ERROR'));
  }
});

// POST /api/calendar/unavailability - Aggiungi giorno di chiusura
router.post('/unavailability', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const validatedData = unavailabilitySchema.parse(req.body);

    // Crea eccezioni per ogni giorno nel range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const exceptions = [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const exception = await prisma.calendarException.upsert({
        where: {
          professionalId_date: {
            professionalId,
            date: new Date(date)
          }
        },
        update: {
          isWorkingDay: false,
          reason: validatedData.reason,
          updatedAt: new Date()
        },
        create: {
          id: uuidv4(),
          professionalId,
          date: new Date(date),
          isWorkingDay: false,
          reason: validatedData.reason
        }
      });
      exceptions.push(exception);
    }

    logger.info('Unavailability added', { professionalId, days: exceptions.length });
    return res.json(ResponseFormatter.success(exceptions, 'Unavailability added successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error('Invalid data', 'VALIDATION_ERROR', error.errors));
    }
    logger.error('Error adding unavailability:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to add unavailability', 'CREATE_ERROR'));
  }
});

// DELETE /api/calendar/unavailability/:id - Rimuovi giorno di chiusura
router.delete('/unavailability/:id', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { id } = req.params;

    // Verifica che l'eccezione appartenga al professionista
    const exception = await prisma.calendarException.findFirst({
      where: {
        id,
        professionalId
      }
    });

    if (!exception) {
      return res.status(404).json(ResponseFormatter.error('Exception not found', 'NOT_FOUND'));
    }

    await prisma.calendarException.delete({
      where: { id }
    });

    logger.info('Unavailability removed', { professionalId, id });
    return res.json(ResponseFormatter.success(null, 'Unavailability removed successfully'));
  } catch (error) {
    logger.error('Error removing unavailability:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to remove unavailability', 'DELETE_ERROR'));
  }
});

// POST /api/calendar/check-conflicts - Verifica conflitti orari
router.post('/check-conflicts', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { start, end, excludeId } = req.body;

    if (!start || !end) {
      return res.status(400).json(ResponseFormatter.error('Start and end dates are required', 'VALIDATION_ERROR'));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      return res.status(400).json(ResponseFormatter.error('End date must be after start date', 'VALIDATION_ERROR'));
    }

    // ✅ FIX PROBLEMA 1: Recupera TUTTI gli interventi attivi e calcola conflitti considerando la durata
    const interventions = await prisma.scheduledIntervention.findMany({
      where: {
        professionalId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { notIn: ['CANCELLED', 'COMPLETED', 'REJECTED'] }
      },
      select: {
        id: true,
        proposedDate: true,
        estimatedDuration: true,
        description: true,
        status: true,
        request: {
          select: {
            title: true,
            client: {
              select: {
                fullName: true
              }
            },
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Calcola conflitti considerando durata interventi
    // Due interventi si sovrappongono se: (Start1 < End2) AND (End1 > Start2)
    const conflicts = interventions.filter(intervention => {
      const intStart = new Date(intervention.proposedDate);
      const intEnd = new Date(intStart.getTime() + (intervention.estimatedDuration || 60) * 60000);
      
      // Verifica sovrapposizione temporale
      return (startDate < intEnd && endDate > intStart);
    });

    const formattedConflicts = conflicts.map(conflict => ({
      id: conflict.id,
      start: conflict.proposedDate,
      end: new Date(conflict.proposedDate.getTime() + (conflict.estimatedDuration || 60) * 60000),
      title: conflict.description || conflict.request?.title || 'Intervento',
      client: conflict.request?.client?.fullName || 'Cliente',
      category: conflict.request?.category?.name || 'Categoria',
      status: conflict.status
    }));

    logger.info('Conflicts check completed', { 
      professionalId, 
      conflictsFound: formattedConflicts.length,
      checkRange: { start: startDate, end: endDate }
    });
    
    return res.json(ResponseFormatter.success({ conflicts: formattedConflicts }));
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to check conflicts', 'SERVER_ERROR'));
  }
});

// GET /api/calendar/blocks - Ottieni blocchi orari
router.get('/blocks', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { from, to } = req.query;

    const where: any = { professionalId };
    
    if (from) {
      where.startDateTime = { gte: new Date(from as string) };
    }
    if (to) {
      where.endDateTime = { lte: new Date(to as string) };
    }

    const blocks = await prisma.calendarBlock.findMany({
      where,
      orderBy: { startDateTime: 'asc' }
    });

    logger.info('Calendar blocks retrieved', { professionalId, count: blocks.length });
    return res.json(ResponseFormatter.success(blocks, 'Blocks retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching blocks:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch blocks', 'FETCH_ERROR'));
  }
});

// POST /api/calendar/blocks - Crea blocco orario
router.post('/blocks', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { startDateTime, endDateTime, reason, isRecurring, recurringPattern } = req.body;

    const block = await prisma.calendarBlock.create({
      data: {
        id: uuidv4(),
        professionalId,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        reason,
        isRecurring: isRecurring || false,
        recurringPattern: recurringPattern || null
      }
    });

    logger.info('Calendar block created', { professionalId, blockId: block.id });
    return res.json(ResponseFormatter.success(block, 'Block created successfully'));
  } catch (error) {
    logger.error('Error creating block:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to create block', 'CREATE_ERROR'));
  }
});

// GET /api/calendar/interventions - Ottieni interventi per il calendario
router.get('/interventions', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { from, to, status } = req.query;

    const where: any = { professionalId };
    
    if (from || to) {
      where.proposedDate = {};
      if (from) where.proposedDate.gte = new Date(from as string);
      if (to) where.proposedDate.lte = new Date(to as string);
    }
    
    // ✅ FIX: Non filtrare se status = 'all'
    if (status && status !== 'all') {
      where.status = status;
    }

    // ✅ FIX PROBLEMA 2: Usa select invece di include per evitare N+1 queries
    // Query ottimizzata che fa 1 sola chiamata al DB invece di 301+
    const interventions = await prisma.scheduledIntervention.findMany({
      where,
      select: {
        id: true,
        proposedDate: true,
        estimatedDuration: true,
        description: true,
        status: true,
        requestId: true,
        request: {
          select: {
            id: true,
            title: true,
            address: true,
            client: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: { proposedDate: 'asc' }
    });

    // Formatta per il calendario
    const calendarEvents = interventions.map(intervention => ({
      id: intervention.id,
      title: intervention.description || `Intervento ${intervention.request.title}`,
      start: intervention.proposedDate,
      end: new Date(new Date(intervention.proposedDate).getTime() + (intervention.estimatedDuration || 60) * 60000),
      status: intervention.status,
      estimatedDuration: intervention.estimatedDuration,
      client: intervention.request.client,
      category: intervention.request.category,
      address: intervention.request.address,
      requestId: intervention.requestId
    }));

    logger.info('Calendar interventions retrieved', { 
      professionalId, 
      count: calendarEvents.length,
      filters: { from, to, status }
    });
    
    return res.json(ResponseFormatter.success(calendarEvents, 'Interventions retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching interventions:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch interventions', 'FETCH_ERROR'));
  }
});

// Alias per compatibilità con il frontend esistente
router.get('/interventions/calendar', requireRole(['PROFESSIONAL', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { from, to, status } = req.query;

    const where: any = { professionalId };
    
    if (from || to) {
      where.proposedDate = {};
      if (from) where.proposedDate.gte = new Date(from as string);
      if (to) where.proposedDate.lte = new Date(to as string);
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    // ✅ FIX PROBLEMA 2: Query ottimizzata anche per alias
    const interventions = await prisma.scheduledIntervention.findMany({
      where,
      select: {
        id: true,
        proposedDate: true,
        estimatedDuration: true,
        description: true,
        status: true,
        requestId: true,
        request: {
          select: {
            id: true,
            title: true,
            address: true,
            client: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: { proposedDate: 'asc' }
    });

    // Formatta per il calendario
    const calendarEvents = interventions.map(intervention => ({
      id: intervention.id,
      title: intervention.description || `Intervento ${intervention.request.title}`,
      start: intervention.proposedDate,
      end: new Date(new Date(intervention.proposedDate).getTime() + (intervention.estimatedDuration || 60) * 60000),
      status: intervention.status,
      estimatedDuration: intervention.estimatedDuration,
      client: intervention.request.client,
      category: intervention.request.category,
      address: intervention.request.address,
      requestId: intervention.requestId
    }));

    logger.info('Calendar interventions retrieved via alias', { 
      professionalId, 
      count: calendarEvents.length,
      filters: { from, to, status }
    });
    
    return res.json(ResponseFormatter.success(calendarEvents, 'Interventions retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching interventions via alias:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch interventions', 'FETCH_ERROR'));
  }
});

export default router;
