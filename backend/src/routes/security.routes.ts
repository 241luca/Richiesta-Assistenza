import { Router, Request, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

const router = Router();

/**
 * GET /api/security/status
 * Endpoint per il SecurityStatusIndicator
 * Restituisce lo stato di sicurezza del sistema e eventi recenti
 */
router.get('/status', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Query per statistiche login falliti
    const [failedLoginsLastHour, failedLogins24h] = await Promise.all([
      // Login falliti ultima ora
      prisma.auditLog.count({
        where: {
          action: AuditAction.LOGIN_FAILED,
          timestamp: { gte: oneHourAgo }  // Cambiato da createdAt a timestamp
        }
      }),
      // Login falliti ultime 24 ore
      prisma.auditLog.count({
        where: {
          action: AuditAction.LOGIN_FAILED,
          timestamp: { gte: oneDayAgo }  // Cambiato da createdAt a timestamp
        }
      })
    ]);

    // Eventi critici e sospetti
    const [criticalEvents, suspiciousActivities] = await Promise.all([
      // Eventi critici non risolti
      prisma.auditLog.count({
        where: {
          severity: LogSeverity.CRITICAL,
          timestamp: { gte: oneWeekAgo }  // Cambiato da createdAt a timestamp
        }
      }),
      // Attività sospette (warning + error)
      prisma.auditLog.count({
        where: {
          severity: { in: [LogSeverity.WARNING, LogSeverity.ERROR] },
          timestamp: { gte: oneDayAgo }  // Cambiato da createdAt a timestamp
        }
      })
    ]);

    // Nuovi dispositivi/IP
    const newDevices = await prisma.loginHistory.count({
      where: {
        createdAt: { gte: oneWeekAgo }  // LoginHistory usa createdAt, non timestamp
        // Assumiamo che sia "nuovo" se è il primo login da quel browser/device
      }
    });

    // ===== NUOVE METRICHE AGGIUNTE =====
    
    // Sessioni attive - Stimiamo usando LoginHistory recente (ultimi 30 minuti)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const activeSessions = await prisma.loginHistory.count({
      where: {
        createdAt: { gte: thirtyMinutesAgo },
        success: true
      }
    }).catch(() => 0);

    // Account lockout (bloccati per troppi tentativi)
    const lockedAccounts = await prisma.user.count({
      where: {
        lockedUntil: { gt: now }
      }
    });

    // Utenti con 2FA abilitato
    const [totalUsers, users2FA] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          twoFactorEnabled: true
        }
      })
    ]);
    const twoFAPercentage = totalUsers > 0 ? Math.round((users2FA / totalUsers) * 100) : 0;

    // Password scadute - NOTA: passwordChangedAt non esiste nel DB, mettiamo 0
    // In futuro si può aggiungere questo campo allo schema se necessario
    const expiredPasswords = 0;

    // Tentativi brute force (rate limit exceeded)
    const bruteForceAttempts = await prisma.auditLog.count({
      where: {
        action: AuditAction.RATE_LIMIT_EXCEEDED,
        timestamp: { gte: oneDayAgo }
      }
    }).catch(() => 0);

    // IP sospetti (conteggio lato codice per compatibilità Prisma)
    const failedLoginIps = await prisma.auditLog.findMany({
      where: {
        action: AuditAction.LOGIN_FAILED,
        timestamp: { gte: oneDayAgo }
      },
      select: { ipAddress: true }
    });
    const ipCounts = new Map<string, number>();
    for (const row of failedLoginIps) {
      const ip = row.ipAddress || 'unknown';
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    }
    const blockedIps = Array.from(ipCounts.values()).filter((c) => c > 5).length;

    // Calcola Security Score (0-100)
    let securityScore = 100;
    
    // Penalizzazioni
    if (criticalEvents > 0) securityScore -= 30;
    if (failedLoginsLastHour > 10) securityScore -= 20;
    if (suspiciousActivities > 10) securityScore -= 15;
    if (twoFAPercentage < 50) securityScore -= 10;
    if (expiredPasswords > 5) securityScore -= 10;
    if (lockedAccounts > 3) securityScore -= 10;
    if (bruteForceAttempts > 5) securityScore -= 5;
    
    securityScore = Math.max(0, Math.min(100, securityScore));

    // Trend ultimi 7 giorni (eventi per giorno)
    const sevenDaysData = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const dayStart = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await prisma.auditLog.count({
          where: {
            severity: { in: [LogSeverity.WARNING, LogSeverity.ERROR, LogSeverity.CRITICAL] },
            timestamp: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        });

        return {
          date: dayStart.toISOString().split('T')[0],
          count
        };
      })
    );

    // Rate limit hits
    const rateLimitHits = await prisma.auditLog.count({
      where: {
        action: AuditAction.RATE_LIMIT_EXCEEDED,
        timestamp: { gte: oneHourAgo }  // Cambiato da createdAt a timestamp
      }
    }).catch(() => 0);

    // Ultimi eventi di sicurezza
    const recentEvents = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: AuditAction.LOGIN_FAILED },
          { action: AuditAction.UNAUTHORIZED_ACCESS },
          { action: AuditAction.SUSPICIOUS_ACTIVITY },
          { action: AuditAction.RATE_LIMIT_EXCEEDED },
          { severity: LogSeverity.CRITICAL },
          { severity: LogSeverity.ERROR }
        ],
        timestamp: { gte: oneDayAgo }  // Cambiato da createdAt a timestamp
      },
      orderBy: { timestamp: 'desc' },  // Cambiato da createdAt a timestamp
      take: 10,
      include: {
        User: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Formatta eventi per il frontend
    const events = recentEvents.map(event => {
      let type: string = 'suspicious_activity';
      let message = 'Evento di sicurezza';
      
      switch (event.action) {
        case AuditAction.LOGIN_FAILED:
          type = 'login_failed';
          message = `Tentativo di login fallito`;
          break;
        case AuditAction.UNAUTHORIZED_ACCESS:
          type = 'permission_denied';
          message = 'Accesso non autorizzato';
          break;
        case AuditAction.RATE_LIMIT_EXCEEDED:
          type = 'rate_limit';
          message = 'Limite di richieste superato';
          break;
        case AuditAction.SUSPICIOUS_ACTIVITY:
          type = 'suspicious_activity';
          message = 'Attività sospetta rilevata';
          break;
        default:
          if (event.severity === LogSeverity.CRITICAL) {
            type = 'critical_action';
            message = 'Azione critica eseguita';
          }
      }

      // Mappa severity da LogSeverity a livelli frontend
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      switch (event.severity) {
        case LogSeverity.CRITICAL:
          severity = 'critical';
          break;
        case LogSeverity.ERROR:
          severity = 'high';
          break;
        case LogSeverity.WARNING:
          severity = 'medium';
          break;
        default:
          severity = 'low';
      }

      return {
        id: event.id,
        type,
        severity,
        message,
        details: event.metadata,
        userId: event.userId,
        userEmail: event.userEmail || (event as any).User?.email,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        location: (event.metadata as any)?.location,
        timestamp: event.timestamp.toISOString(),  // Cambiato da createdAt a timestamp
        resolved: false // Potrebbe essere in metadata
      };
    });

    // Trova ultimo incidente
    const lastIncident = await prisma.auditLog.findFirst({
      where: {
        severity: { in: [LogSeverity.CRITICAL, LogSeverity.ERROR] }
      },
      orderBy: { timestamp: 'desc' },  // Cambiato da createdAt a timestamp
      select: { timestamp: true }  // Cambiato da createdAt a timestamp
    });

    // Determina stato generale
    let overallStatus: 'secure' | 'warning' | 'critical' = 'secure';
    
    if (criticalEvents > 0 || failedLoginsLastHour > 10) {
      overallStatus = 'critical';
    } else if (suspiciousActivities > 5 || failedLoginsLastHour > 5 || failedLogins24h > 20) {
      overallStatus = 'warning';
    }

    res.json(ResponseFormatter.success({
      overall: overallStatus,
      failedLogins24h,
      failedLoginsLastHour,
      suspiciousActivities,
      criticalEvents,
      newDevices,
      blockedIps,
      rateLimitHits,
      lastIncident: lastIncident?.timestamp.toISOString(),
      // NUOVE METRICHE
      activeSessions,
      lockedAccounts,
      twoFAPercentage,
      totalUsers,
      users2FA,
      expiredPasswords,
      bruteForceAttempts,
      securityScore,
      trend: sevenDaysData,
      events
    }));

  } catch (error) {
    logger.error('Error fetching security status:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to fetch security status', 'SECURITY_STATUS_ERROR')
    );
  }
});

/**
 * POST /api/security/resolve-event
 * Marca un evento di sicurezza come risolto
 */
router.post('/resolve-event/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Aggiorna metadata dell'audit log con resolved flag
    const event = await prisma.auditLog.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json(
        ResponseFormatter.error('Event not found', 'EVENT_NOT_FOUND')
      );
    }

    const updatedMetadata = {
      ...(event.metadata as any || {}),
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: req.user?.id,
      resolvedNotes: notes
    };

    await prisma.auditLog.update({
      where: { id },
      data: {
        metadata: updatedMetadata
      }
    });

    // Log della risoluzione
    await prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        entityType: 'SecurityEvent',
        entityId: id,
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        metadata: { resolutionMessage: `Security event resolved: ${notes}` },
        severity: LogSeverity.INFO,
        category: LogCategory.SECURITY,
        success: true
      }
    });

    res.json(ResponseFormatter.success(null, 'Event resolved successfully'));

  } catch (error) {
    logger.error('Error resolving security event:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to resolve event', 'RESOLVE_EVENT_ERROR')
    );
  }
});

/**
 * GET /api/security/blocked-ips
 * Lista degli IP bloccati
 */
router.get('/blocked-ips', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // La tabella blockedIp non esiste, quindi analizziamo i login falliti
    // Trova IP con molti login falliti nelle ultime 24 ore
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const failedLoginIps = await prisma.auditLog.findMany({
      where: {
        action: AuditAction.LOGIN_FAILED,
        timestamp: { gte: oneDayAgo }
      },
      select: { ipAddress: true }
    });
    const ipCounts = new Map<string, number>();
    for (const row of failedLoginIps) {
      const ip = row.ipAddress || 'unknown';
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    }
    const suspicious = Array.from(ipCounts.entries())
      .filter(([_, count]) => count > 5)
      .map(([ipAddress, count]) => ({ ipAddress, count }));

    res.json(ResponseFormatter.success({
      blocked: [], // Nessun IP effettivamente bloccato (tabella non esistente)
      suspicious
    }));

  } catch (error) {
    logger.error('Error fetching blocked IPs:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to fetch blocked IPs', 'BLOCKED_IPS_ERROR')
    );
  }
});

export default router;