import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateRequest, validateBody } from '../middleware/validation';
import { auditLogger } from '../middleware/auditLogger';
import { AuditAction } from '@prisma/client';
import { referralService } from '../services/referral.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';
import { requireModule } from '../middleware/module.middleware';
import { prisma } from '../config/database';
import { Parser as Json2CsvParser } from 'json2csv';

const router = Router();

// 🔒 Protegge tutte le routes del sistema referral
// Se il modulo 'referral' è disabilitato, blocca l'accesso con 403
router.use(requireModule('referral'));

// 📋 Validation Schemas
const inviteSchema = z.object({
  email: z.string().email('Email non valida').min(1, 'Email richiesta'),
  message: z.string().max(500, 'Messaggio troppo lungo').optional()
});

/**
 * 🔍 GET /api/referrals/my-code
 * Ottieni il codice referral personale
 */
router.get('/my-code', 
  authenticate, 
  auditLogger({ action: AuditAction.READ }),
  async (req: any, res) => {
    try {
      const result = await referralService.getMyReferralCode(req.user.id);
      
      return res.json(ResponseFormatter.success(
        result,
        'Codice referral recuperato con successo'
      ));
    } catch (error) {
      logger.error('Error getting referral code:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero del codice referral',
        'REFERRAL_CODE_ERROR'
      ));
    }
  }
);

/**
 * 📨 POST /api/referrals/invite
 * Invia invito referral via email
 */
router.post('/invite', 
  authenticate, 
  validateBody(inviteSchema),
  auditLogger({ action: AuditAction.CREATE, entityType: 'ReferralInvite', captureBody: true }),
  async (req: any, res) => {
    try {
      const { email, message } = req.body;
      
      // Verifica che non stia invitando se stesso
      if (email.toLowerCase() === req.user.email.toLowerCase()) {
        return res.status(400).json(ResponseFormatter.error(
          'Non puoi invitare te stesso',
          'SELF_REFERRAL_ERROR'
        ));
      }

      // Verifica che l'email non sia già registrata
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json(ResponseFormatter.error(
          'Questa email è già registrata nel sistema',
          'EMAIL_ALREADY_REGISTERED'
        ));
      }

      const referral = await referralService.createReferral(req.user.id, email, message);
      
      return res.status(201).json(ResponseFormatter.success(
        {
          id: referral.id,
          code: referral.code,
          email: referral.email,
          status: referral.status,
          createdAt: referral.createdAt
        },
        'Invito inviato con successo! 🎉'
      ));
    } catch (error: any) {
      logger.error('Error sending referral invite:', error);
      
      if (error.message.includes('già stata invitata')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'ALREADY_INVITED'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Errore nell\'invio dell\'invito',
        'INVITE_SEND_ERROR'
      ));
    }
  }
);

/**
 * 📊 GET /api/referrals/stats
 * Ottieni statistiche referral personali
 */
router.get('/stats', 
  authenticate, 
  auditLogger({ action: AuditAction.READ }),
  async (req: any, res) => {
    try {
      const stats = await referralService.getReferralStats(req.user.id);
      
      return res.json(ResponseFormatter.success(
        stats,
        'Statistiche referral recuperate con successo'
      ));
    } catch (error) {
      logger.error('Error getting referral stats:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero delle statistiche',
        'STATS_ERROR'
      ));
    }
  }
);

/**
 * 👆 GET /api/referrals/track/:code
 * Traccia click su link referral (pubblico)
 */
router.get('/track/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || code.length < 6) {
      return res.status(400).json(ResponseFormatter.error(
        'Codice referral non valido',
        'INVALID_CODE'
      ));
    }

    await referralService.trackClick(code);
    
    // Redirect alla pagina di registrazione con il codice
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?ref=${code}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Error tracking referral click:', error);
    
    // Anche in caso di errore, redirigi alla registrazione
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup`;
    return res.redirect(redirectUrl);
  }
});

/**
 * 🎯 POST /api/referrals/track-signup
 * Traccia registrazione utente (chiamato durante signup)
 */
router.post('/track-signup',
  authenticate,
  validateBody(z.object({
    referralCode: z.string().min(6, 'Codice referral non valido')
  })),
  auditLogger({ action: AuditAction.UPDATE }),
  async (req: any, res) => {
    try {
      const { referralCode } = req.body;
      
      await referralService.trackSignup(referralCode, req.user.id);
      
      return res.json(ResponseFormatter.success(
        { tracked: true },
        'Registrazione tracciata con successo'
      ));
    } catch (error) {
      logger.error('Error tracking signup:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nel tracking della registrazione',
        'SIGNUP_TRACK_ERROR'
      ));
    }
  }
);

/**
 * 🏆 POST /api/referrals/track-conversion
 * Traccia prima richiesta completata (chiamato quando user completa prima richiesta)
 */
router.post('/track-conversion',
  authenticate,
  auditLogger({ action: AuditAction.UPDATE }),
  async (req: any, res) => {
    try {
      await referralService.trackFirstRequest(req.user.id);
      
      return res.json(ResponseFormatter.success(
        { tracked: true },
        'Conversione tracciata con successo'
      ));
    } catch (error) {
      logger.error('Error tracking conversion:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nel tracking della conversione',
        'CONVERSION_TRACK_ERROR'
      ));
    }
  }
);

/**
 * 📄 GET /api/referrals/export
 * Esporta report referral personale (CSV o JSON)
 * Query: format=csv|json (default: csv)
 */
router.get('/export',
  authenticate,
  auditLogger({ action: AuditAction.READ }),
  async (req: any, res) => {
    try {
      const format = (req.query.format || 'csv').toString().toLowerCase();
      const stats = await referralService.getReferralStats(req.user.id);

      // Flatten referrals for CSV
      const rows = (stats.recentReferrals || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        email: r.email,
        status: r.status,
        clickedAt: r.clickedAt || null,
        registeredAt: r.registeredAt || null,
        firstRequestAt: r.firstRequestAt || null,
        referrerId: r.referrerId,
        refereeId: r.refereeId || null,
        refereeFirstName: r.referee?.firstName || r.User_Referral_refereeIdToUser?.firstName || null,
        refereeLastName: r.referee?.lastName || r.User_Referral_refereeIdToUser?.lastName || null,
        refereeEmail: r.referee?.email || r.User_Referral_refereeIdToUser?.email || null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));

      if (format === 'json') {
        return res.json(ResponseFormatter.success(
          {
            summary: {
              total: stats.total,
              pending: stats.pending,
              registered: stats.registered,
              converted: stats.converted,
              expired: stats.expired,
              totalPointsEarned: stats.totalPointsEarned,
              currentPoints: stats.currentPoints
            },
            referrals: rows
          },
          'Report referral generato (JSON)'
        ));
      }

      const parser = new Json2CsvParser({
        fields: [
          'id','code','email','status','clickedAt','registeredAt','firstRequestAt',
          'referrerId','refereeId','refereeFirstName','refereeLastName','refereeEmail',
          'createdAt','updatedAt'
        ]
      });
      const csv = parser.parse(rows);

      const filename = `referrals_report_${new Date().toISOString().slice(0,10)}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } catch (error) {
      logger.error('Error exporting referral report:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nell\'esportazione del report',
        'EXPORT_ERROR'
      ));
    }
  }
);

/**
 * 📈 GET /api/referrals/analytics
 * Analytics globali (solo ADMIN/SUPER_ADMIN)
 */
router.get('/analytics',
  authenticate,
  async (req: any, res) => {
    try {
      // Verifica ruolo admin
      if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json(ResponseFormatter.error(
          'Accesso negato',
          'ADMIN_REQUIRED'
        ));
      }

      const analytics = await referralService.getGlobalAnalytics();
      
      return res.json(ResponseFormatter.success(
        analytics,
        'Analytics referral recuperate con successo'
      ));
    } catch (error) {
      logger.error('Error getting referral analytics:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero delle analytics',
        'ANALYTICS_ERROR'
      ));
    }
  }
);

/**
 * 🧹 POST /api/referrals/cleanup-expired
 * Pulisci referral scaduti (solo ADMIN/SUPER_ADMIN)
 */
router.post('/cleanup-expired',
  authenticate,
  auditLogger({ action: AuditAction.DELETE }),
  async (req: any, res) => {
    try {
      // Verifica ruolo admin
      if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json(ResponseFormatter.error(
          'Accesso negato',
          'ADMIN_REQUIRED'
        ));
      }

      const cleanedCount = await referralService.cleanupExpiredReferrals();
      
      return res.json(ResponseFormatter.success(
        { cleanedCount },
        `Pulizia completata: ${cleanedCount} referral scaduti`
      ));
    } catch (error) {
      logger.error('Error cleaning up expired referrals:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nella pulizia dei referral scaduti',
        'CLEANUP_ERROR'
      ));
    }
  }
);

export default router;
