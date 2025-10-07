import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { prisma } from '../config/database';

const router = Router();

// Middleware per verificare se l'utente è admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json(ResponseFormatter.error(
      'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.',
      'FORBIDDEN'
    ));
  }
  next();
};

// Schema validazione creazione utente
const createUserSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Password deve essere almeno 8 caratteri'),
  firstName: z.string().min(2, 'Nome troppo corto'),
  lastName: z.string().min(2, 'Cognome troppo corto'),
  username: z.string().min(3, 'Username troppo corto').optional(),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().max(2).optional(),
  postalCode: z.string().max(5).optional(),
  codiceFiscale: z.string().optional(),
  partitaIva: z.string().optional(),
  profession: z.string().optional(),
  hourlyRate: z.number().optional(),
  workRadius: z.number().optional(),
  canSelfAssign: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  sendWelcomeEmail: z.boolean().optional()
});

// Schema validazione aggiornamento utente
const updateUserSchema = z.object({
  email: z.string().email('Email non valida').optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().max(2).optional(),
  postalCode: z.string().max(5).optional(),
  codiceFiscale: z.string().optional(),
  partitaIva: z.string().optional(),
  profession: z.string().optional(),
  hourlyRate: z.number().optional(),
  workRadius: z.number().optional(),
  canSelfAssign: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  status: z.string().optional(),
  lockedUntil: z.date().optional()
});

// Schema per reset password
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password deve essere almeno 8 caratteri'),
  sendEmail: z.boolean().optional()
});

// Schema per azioni di massa
const bulkActionSchema = z.object({
  userIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete', 'block', 'unblock', 'verify_email', 'send_welcome_email']),
  reason: z.string().optional(),
  days: z.number().optional()
});

// GET /api/admin/users - Lista completa utenti con filtri avanzati
router.get('/', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      emailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      city,
      province
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Prepara filtri
    const filters = {
      search,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      emailVerified: emailVerified === 'true' ? true : emailVerified === 'false' ? false : undefined,
      city,
      province,
      sortBy,
      sortOrder,
      skip,
      take: parseInt(limit)
    };

    const { users, total } = await userService.getUsers(filters);

    // Trasforma i dati per il frontend
    const transformedUsers = users.map(user => ({
      ...user,
      isActive: user.status !== 'offline' && user.status !== 'deleted' && 
                (!user.lockedUntil || new Date(user.lockedUntil) <= new Date()),
      blocked: user.lockedUntil ? new Date(user.lockedUntil) > new Date() : false,
      requestsCount: user._count.clientRequests + 
                     user._count.professionalRequests,
      quotesCount: user._count.quotes
    }));

    // Ottieni statistiche
    const stats = await userService.getUserStats();

    logger.info(`Admin ${req.user.id} fetched ${users.length} users (page ${page})`);

    return res.json(ResponseFormatter.success({
      users: transformedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    }, 'Lista utenti recuperata con successo'));

  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero della lista utenti',
      'FETCH_USERS_ERROR'
    ));
  }
});

// GET /api/admin/users/:id - Dettagli completi utente (READ)
router.get('/:id', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const userId = req.params.id;
    
    const user = await userService.getUserById(userId);
    const requestsCount = await userService.getUserRequestsCount(userId);

    // Ottieni dettagli aggiuntivi
    const [loginHistory, notifications, quotes] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.quote.findMany({
        where: { professionalId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          request: {
            select: { id: true, title: true }
          }
        }
      })
    ]);

    // Calcola statistiche utente
    const stats = {
      totalRequests: requestsCount,
      totalQuotes: user._count.quotes || 0,
      totalPayments: user._count.payments || 0,
      lastActivity: loginHistory[0]?.createdAt || user.updatedAt,
      accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)), // giorni
      unreadNotifications: notifications.filter(n => !n.isRead).length
    };

    logger.info(`Admin ${req.user.id} viewed user details for ${userId}`);

    return res.json(ResponseFormatter.success({
      user,
      stats,
      loginHistory,
      recentNotifications: notifications,
      recentQuotes: quotes
    }, 'Dettagli utente recuperati con successo'));

  } catch (error) {
    logger.error('Error fetching user details:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nel recupero dei dettagli utente',
      'FETCH_USER_DETAILS_ERROR'
    ));
  }
});

// POST /api/admin/users - Crea nuovo utente (CREATE)
router.post('/', authenticate, requireAdmin, async (req: any, res) => {
  try {
    // Valida input
    const validatedData = createUserSchema.parse(req.body);

    // Crea utente
    const newUser = await userService.createUser(validatedData);

    // Invia email di benvenuto se richiesto
    if (validatedData.sendWelcomeEmail) {
      await userService.sendWelcomeEmail(newUser.id);
    }

    logger.info(`Admin ${req.user.id} created new user ${newUser.id} (${newUser.email})`);

    return res.status(201).json(ResponseFormatter.success(
      newUser,
      'Utente creato con successo'
    ));

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    logger.error('Error creating user:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nella creazione utente',
      'CREATE_USER_ERROR'
    ));
  }
});

// PUT /api/admin/users/:id - Aggiorna utente (UPDATE)
router.put('/:id', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const userId = req.params.id;
    
    // Valida input
    const validatedData = updateUserSchema.parse(req.body);

    // Aggiorna utente
    const updatedUser = await userService.updateUser(userId, validatedData);

    logger.info(`Admin ${req.user.id} updated user ${userId}`);

    return res.json(ResponseFormatter.success(
      updatedUser,
      'Utente aggiornato con successo'
    ));

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    logger.error('Error updating user:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nell\'aggiornamento utente',
      'UPDATE_USER_ERROR'
    ));
  }
});

// DELETE /api/admin/users/:id - Elimina utente (DELETE)
router.delete('/:id', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const userId = req.params.id;

    await userService.deleteUser(userId);

    logger.info(`Admin ${req.user.id} deleted user ${userId}`);

    return res.json(ResponseFormatter.success(
      null,
      'Utente eliminato con successo'
    ));

  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nell\'eliminazione utente',
      'DELETE_USER_ERROR'
    ));
  }
});

// POST /api/admin/users/:id/reset-password - Reset password utente
router.post('/:id/reset-password', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const validatedData = resetPasswordSchema.parse(req.body);

    await userService.changePassword(userId, validatedData.newPassword, validatedData.sendEmail || false);

    logger.info(`Admin ${req.user.id} reset password for user ${userId}`);

    return res.json(ResponseFormatter.success(
      null,
      'Password reimpostata con successo'
    ));

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    logger.error('Error resetting password:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nel reset della password',
      'RESET_PASSWORD_ERROR'
    ));
  }
});

// POST /api/admin/users/:id/send-welcome-email - Invia email di benvenuto
router.post('/:id/send-welcome-email', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const userId = req.params.id;

    await userService.sendWelcomeEmail(userId);

    logger.info(`Admin ${req.user.id} sent welcome email to user ${userId}`);

    return res.json(ResponseFormatter.success(
      null,
      'Email di benvenuto inviata con successo'
    ));

  } catch (error) {
    logger.error('Error sending welcome email:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nell\'invio email di benvenuto',
      'SEND_EMAIL_ERROR'
    ));
  }
});

// POST /api/admin/users/:id/block - Blocca utente
router.post('/:id/block', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const { days = 30, reason } = req.body;

    await userService.blockUser(userId, days, reason);

    logger.info(`Admin ${req.user.id} blocked user ${userId} for ${days} days`);

    return res.json(ResponseFormatter.success(
      null,
      `Utente bloccato per ${days} giorni`
    ));

  } catch (error) {
    logger.error('Error blocking user:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nel blocco utente',
      'BLOCK_USER_ERROR'
    ));
  }
});

// POST /api/admin/users/:id/unblock - Sblocca utente
router.post('/:id/unblock', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const userId = req.params.id;

    await userService.unblockUser(userId);

    logger.info(`Admin ${req.user.id} unblocked user ${userId}`);

    return res.json(ResponseFormatter.success(
      null,
      'Utente sbloccato con successo'
    ));

  } catch (error) {
    logger.error('Error unblocking user:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nello sblocco utente',
      'UNBLOCK_USER_ERROR'
    ));
  }
});

// POST /api/admin/users/bulk - Azioni di massa
router.post('/bulk', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const validatedData = bulkActionSchema.parse(req.body);
    const { userIds, action, reason, days = 30 } = validatedData;

    let actionMessage = '';
    let processedCount = 0;

    // Esegui azione per ogni utente
    for (const userId of userIds) {
      try {
        switch (action) {
          case 'activate':
            await userService.activateUser(userId);
            actionMessage = 'Utenti attivati';
            break;
          case 'deactivate':
            await userService.deactivateUser(userId);
            actionMessage = 'Utenti disattivati';
            break;
          case 'block':
            await userService.blockUser(userId, days, reason);
            actionMessage = `Utenti bloccati per ${days} giorni`;
            break;
          case 'unblock':
            await userService.unblockUser(userId);
            actionMessage = 'Utenti sbloccati';
            break;
          case 'verify_email':
            await userService.verifyEmail(userId);
            actionMessage = 'Email verificate';
            break;
          case 'delete':
            await userService.deleteUser(userId);
            actionMessage = 'Utenti eliminati';
            break;
          case 'send_welcome_email':
            await userService.sendWelcomeEmail(userId);
            actionMessage = 'Email di benvenuto inviate';
            break;
        }
        processedCount++;
      } catch (error) {
        logger.error(`Failed to ${action} user ${userId}:`, error);
      }
    }

    logger.info(`Admin ${req.user.id} performed bulk action '${action}' on ${processedCount} users`);

    return res.json(ResponseFormatter.success({
      affected: processedCount,
      action,
      userIds
    }, `${actionMessage} con successo (${processedCount} utenti)`));

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    logger.error('Error in bulk action:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'azione di massa',
      'BULK_ACTION_ERROR'
    ));
  }
});

// GET /api/admin/users/stats/overview - Statistiche utenti
router.get('/stats/overview', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const stats = await userService.getUserStats();
    
    // Aggiungi trend registrazioni
    const registrationTrend = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*)::int as count
      FROM "User"
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const fullStats = {
      overview: {
        total: stats.total,
        active: stats.active,
        inactive: stats.total - stats.active,
        percentageActive: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0',
        blocked: stats.blocked,
        verified: stats.verified
      },
      growth: {
        today: stats.growth.today,
        week: stats.growth.week,
        month: stats.growth.month,
        trend: registrationTrend
      },
      distribution: {
        byRole: stats.byRole
      }
    };

    logger.info(`Admin ${req.user.id} viewed user statistics`);

    return res.json(ResponseFormatter.success(
      fullStats,
      'Statistiche utenti recuperate con successo'
    ));

  } catch (error) {
    logger.error('Error fetching user stats:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle statistiche',
      'FETCH_STATS_ERROR'
    ));
  }
});

// GET /api/admin/users/export - Export utenti in CSV
router.get('/export', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { format = 'csv', ...filters } = req.query;

    // Prepara filtri come in GET /
    const queryFilters = {
      role: filters.role,
      isActive: filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined,
      emailVerified: filters.emailVerified === 'true',
      city: filters.city,
      province: filters.province
    };

    const { users } = await userService.getUsers(queryFilters);

    if (format === 'csv') {
      // Genera CSV
      const csv = [
        // Header
        'ID,Email,Username,Nome,Cognome,Ruolo,Telefono,Città,Provincia,Professione,Verificato,Stato,Bloccato,Registrato,Ultimo Accesso',
        // Data
        ...users.map(u => [
          u.id,
          u.email,
          u.username,
          u.firstName,
          u.lastName,
          u.role,
          u.phone || '',
          u.city || '',
          u.province || '',
          u.profession || '',
          u.emailVerified ? 'Si' : 'No',
          u.status,
          u.lockedUntil && new Date(u.lockedUntil) > new Date() ? 'Si' : 'No',
          u.createdAt.toISOString(),
          u.lastLoginAt?.toISOString() || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
      return res.send(csv);
    } else {
      // Export JSON
      return res.json(ResponseFormatter.success(
        users,
        `Export di ${users.length} utenti completato`
      ));
    }

  } catch (error) {
    logger.error('Error exporting users:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'export degli utenti',
      'EXPORT_ERROR'
    ));
  }
});

// GET /api/admin/users/professionals-by-subcategory/:subcategoryId
// Ottiene i professionisti abilitati per una sottocategoria
router.get('/professionals-by-subcategory/:subcategoryId', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { subcategoryId } = req.params;
    
    logger.info(`Admin searching professionals for subcategory: ${subcategoryId}`);
    
    // Approccio semplificato: trova TUTTE le associazioni senza filtri
    const associations = await prisma.professionalUserSubcategory.findMany({
      where: { 
        subcategoryId: subcategoryId 
      },
      include: {
        user: true
      }
    });
    
    logger.info(`Raw associations found: ${associations.length}`);
    
    if (associations.length > 0) {
      // Mappa tutti i professionisti trovati
      const professionals = associations.map(assoc => {
        logger.info(`Professional: ${assoc.user.firstName} ${assoc.user.lastName}, Status: ${assoc.user.status}, Role: ${assoc.user.role}`);
        
        return {
          id: assoc.user.id,
          firstName: assoc.user.firstName,
          lastName: assoc.user.lastName,
          email: assoc.user.email,
          phone: assoc.user.phone,
          city: assoc.user.city,
          province: assoc.user.province,
          hourlyRate: assoc.user.hourlyRate ? Number(assoc.user.hourlyRate) : null,
          profession: assoc.user.profession,
          experienceYears: assoc.experienceYears || 0,
          hasCertifications: !!assoc.certifications,
          isGeneric: false,
          status: assoc.user.status,  // Includiamo lo status per debug
          role: assoc.user.role        // Includiamo il role per debug
        };
      });
      
      logger.info(`Returning ${professionals.length} professionals for subcategory`);
      
      return res.json(ResponseFormatter.success(
        professionals,
        `Trovati ${professionals.length} professionisti per questa sottocategoria`
      ));
    }
    
    // Se non ci sono professionisti specifici, NON mostrare nulla o mostrare un messaggio
    logger.info(`No professionals found for subcategory ${subcategoryId}`);
    
    return res.json(ResponseFormatter.success(
      [],  // Array vuoto invece di mostrare tutti
      `Nessun professionista abilitato per questa sottocategoria`
    ));
    
  } catch (error) {
    logger.error('Error fetching professionals by subcategory:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei professionisti',
      'FETCH_ERROR'
    ));
  }
});

// TEMPORANEO: Debug endpoint per verificare associazioni
router.get('/debug-subcategory/:subcategoryId', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { subcategoryId } = req.params;
    
    // 1. Verifica sottocategoria
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      include: {
        category: true
      }
    });
    
    // 2. Conta associazioni
    const associations = await prisma.professionalUserSubcategory.findMany({
      where: { subcategoryId },
      include: {
        user: true,
        subcategory: true
      }
    });
    
    // 3. Trova tutti i professionisti
    const allProfessionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true
      }
    });
    
    return res.json(ResponseFormatter.success({
      subcategory: subcategory || 'NOT FOUND',
      associationsCount: associations.length,
      associations: associations.map(a => ({
        userId: a.userId,
        userName: `${a.user.firstName} ${a.user.lastName}`,
        userStatus: a.user.status,
        userRole: a.user.role,
        experienceYears: a.experienceYears
      })),
      allProfessionalsCount: allProfessionals.length,
      allProfessionals: allProfessionals.map(p => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        status: p.status,
        role: p.role
      }))
    }, 'Debug info'));
    
  } catch (error) {
    logger.error('Debug error:', error);
    return res.status(500).json(ResponseFormatter.error('Debug error', 'ERROR'));
  }
});

export default router;