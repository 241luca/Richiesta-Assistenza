import { PrismaClient, 
  LegalDocument, 
  LegalDocumentVersion, 
  UserLegalAcceptance,
  LegalDocumentType,
  VersionStatus,
  AcceptanceMethod,
  AuditAction,
  LogSeverity,
  LogCategory,
  NotificationPriority
} from '@prisma/client';
import { auditLogService as auditService } from './auditLog.service';
import { notificationService } from './notification.service';
import logger from '../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Service per la gestione dei documenti legali
 * Gestisce Privacy Policy, Terms of Service, Cookie Policy con versionamento completo
 */
export class LegalDocumentService {
  
  /**
   * Ottiene i documenti che l'utente deve ancora accettare
   * 
   * SICUREZZA IMPORTANTE:
   * - Mostra SOLO documenti con versioni PUBBLICATE (status = 'PUBLISHED')
   * - NON mostrare mai documenti in stato DRAFT o APPROVED ma non pubblicati
   * - Verifica che la data di efficacia sia nel passato
   * - Verifica che il documento non sia scaduto
   * 
   * @param userId - ID dell'utente
   * @returns Array di documenti pendenti DA ACCETTARE
   */
  async getPendingDocumentsForUser(userId: string) {
    try {
      // Ottieni tutti i documenti attivi con la loro versione pubblicata corrente
      const documents = await prisma.legalDocument.findMany({
        where: {
          isActive: true
        },
        include: {
          versions: {
            where: {
              status: 'PUBLISHED',
              effectiveDate: {
                lte: new Date()
              },
              OR: [
                { expiryDate: null },
                { expiryDate: { gte: new Date() } }
              ]
            },
            orderBy: {
              publishedAt: 'desc'
            },
            take: 1
          }
        }
      });

      // SICUREZZA: Log per tracciare quali documenti vengono trovati
      logger.info(`Legal Service: Found ${documents.length} active documents`);
      documents.forEach(doc => {
        logger.info(`Document: ${doc.displayName}, isRequired: ${doc.isRequired}, has PUBLISHED version: ${doc.versions.length > 0}`);
      });

      // IMPORTANTE: Filtra SOLO i documenti che hanno ALMENO UNA versione PUBBLICATA
      // Documenti senza versioni pubblicate NON devono essere visibili ai clienti
      const documentsWithVersion = documents.filter(doc => doc.versions.length > 0);
      
      logger.info(`Legal Service: ${documentsWithVersion.length} documents with PUBLISHED versions (safe to show)`);
      
      // Log dettagliato per debug
      documentsWithVersion.forEach(doc => {
        const version = doc.versions[0];
        if (version) {
          logger.info(`Service - Document ${doc.displayName}: Version ${version.version}, EffectiveDate: ${version.effectiveDate}`);
        }
      });

      // Per ogni documento, verifica se l'utente ha già accettato la versione corrente
      const pendingDocuments = [];
      
      for (const doc of documentsWithVersion) {
        const currentVersion = doc.versions[0];
        
        // Verifica se l'utente ha già accettato questa specifica versione
        const acceptance = await prisma.userLegalAcceptance.findFirst({
          where: {
            userId: userId,
            documentId: doc.id,
            versionId: currentVersion.id
          }
        });

        // Se non ha accettato questa versione, aggiungilo ai documenti pendenti
        if (!acceptance) {
          pendingDocuments.push({
            document: {
              id: doc.id,
              type: doc.type,
              displayName: doc.displayName,
              description: doc.description,
              isRequired: doc.isRequired,
              icon: doc.icon
            },
            version: {
              id: currentVersion.id,
              version: currentVersion.version,
              title: currentVersion.title,
              content: currentVersion.content,
              contentPlain: currentVersion.contentPlain,
              effectiveDate: currentVersion.effectiveDate,
              expiryDate: currentVersion.expiryDate
            },
            needsAcceptance: true
          });
        }
      }

      return pendingDocuments;
    } catch (error) {
      logger.error('Error getting pending documents for user:', error);
      throw error;
    }
  }

  /**
   * Crea un nuovo documento legale
   */
  async createDocument(data: {
    type: LegalDocumentType;
    typeConfigId?: string;
    internalName: string;
    displayName: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
    isRequired?: boolean;
    sortOrder?: number;
    createdBy: string;
  }) {
    try {
      // Verifica che non esista già un documento attivo dello stesso tipo
      const whereActive: any = { type: data.type, isActive: true };
      if (data.type === 'CUSTOM' && data.typeConfigId) {
        whereActive.typeConfigId = data.typeConfigId;
      }
      const existingActive = await prisma.legalDocument.findFirst({
        where: whereActive
      });

      if (existingActive) {
        // Disattiva quello esistente
        await prisma.legalDocument.update({
          where: { id: existingActive.id },
          data: { isActive: false }
        });
      }

      const document = await prisma.legalDocument.create({
        data: {
          id: crypto.randomUUID(),
          type: data.type,
          typeConfigId: data.typeConfigId,
          internalName: data.internalName,
          displayName: data.displayName,
          description: data.description,
          icon: data.icon,
          createdBy: data.createdBy,
          isActive: data.isActive ?? false, // Sarà attivato quando pubblichi una versione
          isRequired: data.isRequired ?? true,
          sortOrder: data.sortOrder ?? 0,
          updatedAt: new Date()
        }
      });

      // Audit log
      await auditService.log({
        action: AuditAction.CREATE,
        entityType: 'LegalDocument',
        entityId: document.id,
        userId: data.createdBy,
        newValues: document,
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.BUSINESS,
        ipAddress: 'system',
        userAgent: 'legal-document-service'
      });

      logger.info(`Legal document created: ${document.id} - ${document.displayName}`);
      
      return document;
    } catch (error) {
      logger.error('Error creating legal document:', error);
      throw error;
    }
  }

  /**
   * Crea una nuova versione di un documento
   */
  async createVersion(documentId: string, data: {
    version: string;
    title: string;
    content: string;
    contentPlain?: string;
    summary?: string;
    effectiveDate: Date;
    expiryDate?: Date;
    language?: string;
    createdBy: string;
    versionNotes?: string;
  }) {
    try {
      // Verifica che il documento esista
      const document = await prisma.legalDocument.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Verifica che la versione non esista già
      const existingVersion = await prisma.legalDocumentVersion.findUnique({
        where: {
          documentId_version: {
            documentId,
            version: data.version
          }
        }
      });

      if (existingVersion) {
        throw new Error('Version already exists');
      }

      // Crea la nuova versione
      const version = await prisma.legalDocumentVersion.create({
        data: {
          id: crypto.randomUUID(),
          documentId,
          version: data.version,
          title: data.title,
          content: data.content,
          contentPlain: data.contentPlain,
          summary: data.summary,
          effectiveDate: data.effectiveDate,
          expiryDate: data.expiryDate,
          language: data.language,
          createdBy: data.createdBy,
          versionNotes: data.versionNotes,
          status: VersionStatus.DRAFT,
          contentChecksum: this.generateChecksum(data.content),
          updatedAt: new Date()
        }
      });

      // Audit log
      await auditService.log({
        action: AuditAction.CREATE,
        entityType: 'LegalDocumentVersion',
        entityId: version.id,
        userId: data.createdBy,
        newValues: {
          documentId,
          version: data.version,
          status: 'DRAFT'
        },
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.BUSINESS,
        ipAddress: 'system',
        userAgent: 'legal-document-service'
      });

      logger.info(`Legal document version created: ${version.id} - v${version.version}`);
      
      return version;
    } catch (error) {
      logger.error('Error creating document version:', error);
      throw error;
    }
  }

  /**
   * Pubblica una versione di un documento
   */
  async publishVersion(versionId: string, publishedBy: string, options?: { notifyUsers?: boolean; publishDate?: string }) {
    try {
      const version = await prisma.legalDocumentVersion.findUnique({
        where: { id: versionId },
        include: {
          document: true
        }
      });

      if (!version) {
        throw new Error('Version not found');
      }

      if (version.status !== 'APPROVED') {
        throw new Error('Version must be approved before publishing');
      }

      // Inizia transaction
      const result = await prisma.$transaction(async (tx) => {
        // Archivia versioni precedenti dello stesso documento
        await tx.legalDocumentVersion.updateMany({
          where: {
            documentId: version.documentId,
            status: 'PUBLISHED',
            id: { not: versionId }
          },
          data: {
            status: 'SUPERSEDED',
            archivedAt: new Date(),
            archivedBy: publishedBy
          }
        });

        // Pubblica la nuova versione
        const publishedVersion = await tx.legalDocumentVersion.update({
          where: { id: versionId },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            publishedBy
          }
        });

        // Attiva il documento se non lo è già
        await tx.legalDocument.update({
          where: { id: version.documentId },
          data: { isActive: true }
        });

        return publishedVersion;
      });

      // Audit log
      await auditService.log({
        action: AuditAction.UPDATE,
        entityType: 'LegalDocumentVersion',
        entityId: versionId,
        userId: publishedBy,
        oldValues: { status: version.status },
        newValues: { status: 'PUBLISHED' },
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.BUSINESS,
        ipAddress: 'system',
        userAgent: 'legal-document-service'
      });

      // Notifica gli utenti se richiesto (default: true)
      const shouldNotify = options?.notifyUsers !== false;
      if (shouldNotify) {
        await this.notifyUsersNewVersion(version.document, result);
      }

      logger.info(`Legal document version published: ${versionId}`);
      
      return result;
    } catch (error) {
      logger.error('Error publishing document version:', error);
      throw error;
    }
  }

  /**
   * Registra l'accettazione di un documento da parte di un utente
   */
  async recordAcceptance(data: {
    userId: string;
    documentId: string;
    versionId: string;
    ipAddress: string;
    userAgent?: string;
    method: AcceptanceMethod;
    source?: string;
    metadata?: any;
  }) {
    try {
      // Verifica che la versione sia pubblicata
      const version = await prisma.legalDocumentVersion.findUnique({
        where: { id: data.versionId },
        include: {
          document: true
        }
      });

      if (!version || version.status !== 'PUBLISHED') {
        throw new Error('Invalid document version');
      }

      // Disattiva accettazioni precedenti dello stesso documento
      await prisma.userLegalAcceptance.updateMany({
        where: {
          userId: data.userId,
          documentId: data.documentId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      // Crea nuova accettazione
      const ipCountry = await this.getCountryFromIP(data.ipAddress);
      const acceptance = await prisma.userLegalAcceptance.create({
        data: {
          id: crypto.randomUUID(),
          userId: data.userId,
          documentId: data.documentId,
          versionId: data.versionId,
          ipAddress: data.ipAddress,
          ipCountry: ipCountry,
          userAgent: data.userAgent,
          method: data.method,
          source: data.source,
          metadata: data.metadata
        }
      });

      // Audit log
      await auditService.log({
        action: AuditAction.CREATE,
        entityType: 'UserLegalAcceptance',
        entityId: acceptance.id,
        userId: data.userId,
        newValues: {
          documentType: version.document.type,
          documentVersion: version.version,
          method: data.method
        },
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.BUSINESS,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent || 'unknown'
      });

      // Notifica conferma all'utente usando il sistema centralizzato
      await notificationService.sendToUser({
        userId: data.userId,
        type: 'LEGAL_ACCEPTANCE',
        title: 'Documento accettato',
        message: `Hai accettato ${version.document.displayName} (versione ${version.version})`,
        priority: 'normal',
        data: {
          documentId: data.documentId,
          versionId: data.versionId,
          acceptanceId: acceptance.id,
          documentType: version.document.type,
          documentName: version.document.displayName,
          version: version.version
        },
        channels: ['websocket'] // Solo notifica in-app per le conferme
      });

      logger.info(`Legal document accepted by user ${data.userId}: ${data.documentId} v${version.version}`);
      
      return acceptance;
    } catch (error) {
      logger.error('Error recording document acceptance:', error);
      throw error;
    }
  }

  /**
   * Ottiene lo storico delle accettazioni di un utente
   */
  async getUserAcceptanceHistory(userId: string) {
    try {
      const acceptances = await prisma.userLegalAcceptance.findMany({
        where: { userId },
        include: {
          document: true,
          version: {
            select: {
              id: true,
              version: true,
              title: true,
              effectiveDate: true
            }
          }
        },
        orderBy: {
          acceptedAt: 'desc'
        }
      });

      return acceptances;
    } catch (error) {
      logger.error('Error getting user acceptance history:', error);
      throw error;
    }
  }

  /**
   * Notifica gli utenti di una nuova versione
   */
  private async notifyUsersNewVersion(document: LegalDocument, version: LegalDocumentVersion) {
    try {
      // Ottieni tutti gli utenti attivi
      const users = await prisma.user.findMany({
        where: {
          emailVerified: true
        },
        select: {
          id: true,
          email: true,
          fullName: true
        }
      });

      // Prepara il link al documento
      const documentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5193'}/legal/${document.type.toLowerCase().replace('_', '-')}`;

      // Cerca il template di notifica per i documenti legali
      let template;
      try {
        const templateService = await import('./notificationTemplate.service');
        template = await templateService.notificationTemplateService.getTemplateByCode('LEGAL_DOCUMENT_UPDATE');
      } catch (error) {
        logger.warn('Template LEGAL_DOCUMENT_UPDATE not found, using default notification');
      }

      // Invia notifiche a tutti gli utenti utilizzando il sistema centralizzato
      const notificationPromises = [];
      
      for (const user of users) {
        // Se abbiamo un template, usiamo quello
        if (template) {
          try {
            const templateService = await import('./notificationTemplate.service');
            await templateService.notificationTemplateService.sendNotification({
              templateCode: 'LEGAL_DOCUMENT_UPDATE',
              recipientId: user.id,
              variables: {
                userName: user.fullName || user.email,
                documentName: document.displayName,
                documentVersion: version.version,
                documentUrl: documentUrl,
                summary: version.summary || 'È stata pubblicata una nuova versione che richiede la tua attenzione.',
                effectiveDate: new Date(version.effectiveDate).toLocaleDateString('it-IT'),
                actionUrl: documentUrl,
                actionText: 'Visualizza e Accetta'
              },
              channels: ['websocket', 'email'],
              priority: NotificationPriority.HIGH
            });
          } catch (error) {
            logger.warn(`Failed to send templated notification to user ${user.id}:`, error);
            // Fallback a notifica semplice
            await this.sendSimpleNotification(user.id, document, version, documentUrl);
          }
        } else {
          // Usa il sistema di notifiche base
          await this.sendSimpleNotification(user.id, document, version, documentUrl);
        }
      }

      logger.info(`Notified ${users.length} users about new version of ${document.displayName}`);
    } catch (error) {
      logger.error('Error notifying users about new version:', error);
      // Non rilanciare l'errore per non bloccare la pubblicazione
    }
  }

  /**
   * Invia una notifica semplice senza template
   */
  private async sendSimpleNotification(userId: string, document: LegalDocument, version: LegalDocumentVersion, documentUrl: string) {
    try {
      await notificationService.sendToUser({
        userId: userId,
        type: 'LEGAL_UPDATE',
        title: `Aggiornamento ${document.displayName}`,
        message: `È disponibile una nuova versione (v${version.version}) di ${document.displayName} che richiede la tua accettazione. Clicca per visualizzare e accettare il documento.`,
        priority: 'high',
        data: {
          documentId: document.id,
          versionId: version.id,
          documentType: document.type,
          version: version.version,
          url: documentUrl
        },
        channels: ['websocket', 'email']
      });
    } catch (error) {
      logger.error(`Error sending simple notification to user ${userId}:`, error);
    }
  }

  /**
   * Genera checksum per verificare l'integrità del contenuto
   */
  private generateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Ottiene il paese dall'IP address
   */
  private async getCountryFromIP(ip: string): Promise<string | null> {
    try {
      // Implementazione semplificata - in produzione usare un servizio come ipinfo.io
      if (ip === '127.0.0.1' || ip === '::1') {
        return 'IT'; // Default per localhost
      }
      
      // Qui potresti integrare un servizio di geolocalizzazione IP
      return null;
    } catch (error) {
      logger.error('Error getting country from IP:', error);
      return null;
    }
  }

  /**
   * Esporta dati per GDPR compliance
   */
  async exportUserLegalData(userId: string) {
    try {
      const acceptances = await prisma.userLegalAcceptance.findMany({
        where: { userId },
        include: {
          document: true,
          version: true
        }
      });

      const exportData = {
        userId,
        exportDate: new Date(),
        acceptances: acceptances.map(acc => ({
          documentType: acc.document.type,
          documentName: acc.document.displayName,
          version: acc.version.version,
          acceptedAt: acc.acceptedAt,
          method: acc.method,
          ipAddress: acc.ipAddress,
          ipCountry: acc.ipCountry,
          userAgent: acc.userAgent
        }))
      };

      return exportData;
    } catch (error) {
      logger.error('Error exporting user legal data:', error);
      throw error;
    }
  }
}

export const legalDocumentService = new LegalDocumentService();
