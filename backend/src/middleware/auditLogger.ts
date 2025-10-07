// backend/src/middleware/auditLogger.ts
import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/auditLog.service';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

interface AuditOptions {
  action?: AuditAction;
  category?: LogCategory;
  entityType?: string;
  captureBody?: boolean;
  captureResponse?: boolean;
}

/**
 * Middleware per il logging automatico delle operazioni
 */
export const auditLogger = (options: AuditOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Cattura il body della richiesta se richiesto
    const requestBody = options.captureBody ? req.body : undefined;
    
    // Info base dalla request
    const baseInfo = auditLogService.extractRequestInfo(req);
    
    // Intercetta la risposta
    const originalSend = res.send;
    let responseData: any;
    
    res.send = function(data: any) {
      responseData = data;
      res.send = originalSend;
      return originalSend.call(this, data);
    };
    
    // Gestisci la fine della risposta
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      
      // Determina l'azione basata sul metodo HTTP se non specificata
      let action = options.action;
      if (!action) {
        switch (req.method) {
          case 'GET':
            action = AuditAction.READ;
            break;
          case 'POST':
            action = AuditAction.CREATE;
            break;
          case 'PUT':
          case 'PATCH':
            action = AuditAction.UPDATE;
            break;
          case 'DELETE':
            action = AuditAction.DELETE;
            break;
          default:
            action = AuditAction.READ;
        }
      }
      
      // Determina la severity basata sullo status code
      let severity: LogSeverity;
      if (res.statusCode >= 500) {
        severity = LogSeverity.ERROR;
      } else if (res.statusCode >= 400) {
        severity = LogSeverity.WARNING;
      } else {
        severity = LogSeverity.INFO;
      }
      
      // Estrai entity ID dal path se presente
      const entityId = req.params.id || req.params.requestId || req.params.userId;
      
      // Log dell'operazione
      await auditLogService.log({
        ...baseInfo,
        action,
        entityType: options.entityType || extractEntityType(req.path),
        entityId,
        newValues: requestBody,
        metadata: {
          query: req.query,
          params: req.params,
          responseData: options.captureResponse ? responseData : undefined
        },
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? responseData : undefined,
        responseTime,
        statusCode: res.statusCode,
        severity,
        category: options.category || LogCategory.API,
        ipAddress: baseInfo.ipAddress || 'unknown',
        userAgent: baseInfo.userAgent || 'unknown'
      });
    });
    
    next();
  };
};

/**
 * Middleware specifico per operazioni di autenticazione
 */
export const auditAuth = (action: AuditAction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const baseInfo = auditLogService.extractRequestInfo(req);
    
    res.on('finish', async () => {
      await auditLogService.log({
        ...baseInfo,
        action,
        entityType: 'Authentication',
        entityId: req.body?.email || (req as any).user?.id,
        metadata: {
          email: req.body?.email,
          twoFactorUsed: req.body?.twoFactorCode ? true : false
        },
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? 'Authentication failed' : undefined,
        responseTime: Date.now() - startTime,
        statusCode: res.statusCode,
        severity: res.statusCode >= 400 ? LogSeverity.WARNING : LogSeverity.INFO,
        category: LogCategory.SECURITY,
        ipAddress: baseInfo.ipAddress || 'unknown',
        userAgent: baseInfo.userAgent || 'unknown'
      });
    });
    
    next();
  };
};

/**
 * Middleware per tracciare operazioni critiche
 */
export const auditCritical = (entityType: string, action: AuditAction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const baseInfo = auditLogService.extractRequestInfo(req);
    const oldData = (res as any).locals?.oldData; // Assumendo che sia stato salvato precedentemente
    
    res.on('finish', async () => {
      await auditLogService.log({
        ...baseInfo,
        action,
        entityType,
        entityId: req.params.id,
        oldValues: oldData,
        newValues: req.body,
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? 'Operation failed' : undefined,
        responseTime: Date.now() - startTime,
        statusCode: res.statusCode,
        severity: LogSeverity.WARNING,
        category: LogCategory.BUSINESS,
        ipAddress: baseInfo.ipAddress || 'unknown',
        userAgent: baseInfo.userAgent || 'unknown'
      });
    });
    
    next();
  };
};

/**
 * Helper per estrarre il tipo di entità dal path
 */
function extractEntityType(path: string): string {
  // Rimuovi /api/ dall'inizio se presente
  const cleanPath = path.replace(/^\/api\//, '');
  
  // Mappa dei path alle entità
  const entityMap: Record<string, string> = {
    'auth/login': 'Authentication',
    'auth/logout': 'Authentication',
    'auth/register': 'Authentication',
    'auth/refresh': 'Authentication',
    'auth': 'Authentication',
    
    'users': 'User',
    'user': 'User',
    
    'requests': 'AssistanceRequest',
    'request': 'AssistanceRequest',
    
    'quotes': 'Quote',
    'quote': 'Quote',
    
    'payments': 'Payment',
    'payment': 'Payment',
    
    'categories': 'Category',
    'subcategories': 'Subcategory',
    
    'notifications': 'Notification',
    'notification-templates': 'NotificationTemplate',
    
    'audit/logs': 'AuditLog',
    'audit/statistics': 'AuditStatistics',
    'audit/alerts': 'AuditAlert',
    'audit': 'AuditLog',
    
    'admin/dashboard': 'AdminDashboard',
    'admin/users': 'User',
    'admin/professionals': 'Professional',
    'admin/system-settings': 'SystemSetting',
    'admin/system-enums': 'SystemEnum',
    'admin/backup': 'Backup',
    'admin/scripts': 'Script',
    'admin/scripts/execute': 'Script',
    'scripts': 'Script',
    'admin/api-keys': 'ApiKey',
    'admin': 'Admin',
    
    'professional/reports': 'InterventionReport',
    'professional/skills': 'ProfessionalSkill',
    'professional/calendar': 'Calendar',
    'professional': 'Professional',
    
    'intervention-reports/reports': 'InterventionReport',
    'intervention-reports/templates': 'InterventionReportTemplate',
    'intervention-reports/materials': 'InterventionReportMaterial',
    'intervention-reports/config': 'InterventionReportConfig',
    'intervention-reports': 'InterventionReport',
    'chat': 'Chat',
    'travel': 'TravelCost',
    'scheduled-interventions': 'ScheduledIntervention',
    'dashboard': 'Dashboard',
    'profile': 'Profile',
    'health': 'Health',
    'maps': 'Maps',
    'geocode': 'Geocoding',
    'ai': 'AI',
    'kb-documents': 'KnowledgeBase'
  };
  
  // Prova a trovare una corrispondenza esatta
  for (const [key, value] of Object.entries(entityMap)) {
    if (cleanPath.startsWith(key)) {
      return value;
    }
  }
  
  // Se non trova corrispondenza, prova a estrarre dal primo segmento
  const segments = cleanPath.split('/').filter(s => s && !s.startsWith(':'));
  if (segments.length > 0) {
    const firstSegment = segments[0];
    
    // Capitalizza e rimuovi il plurale se presente
    let entityName = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
    
    // Rimuovi la 's' finale se è plurale (semplice euristica)
    if (entityName.endsWith('s') && entityName.length > 3) {
      // Ma mantieni parole come 'News', 'Status'
      if (!['News', 'Status', 'Settings'].includes(entityName)) {
        entityName = entityName.slice(0, -1);
      }
    }
    
    return entityName;
  }
  
  return 'System';
}

/**
 * Decorator per metodi che necessitano audit log
 */
export function AuditLog(action: AuditAction, category: LogCategory = LogCategory.BUSINESS) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let result;
      let error: any;
      
      try {
        result = await originalMethod.apply(this, args);
      } catch (e) {
        error = e;
        throw e;
      } finally {
        // Log dell'operazione
        await auditLogService.log({
          action,
          entityType: target.constructor.name,
          metadata: {
            method: propertyKey,
            args: args.length > 0 ? args[0] : undefined
          },
          success: !error,
          errorMessage: error?.message,
          responseTime: Date.now() - startTime,
          severity: error ? LogSeverity.ERROR : LogSeverity.INFO,
          category,
          ipAddress: 'system',
          userAgent: 'system'
        });
      }
      
      return result;
    };
    
    return descriptor;
  };
}
