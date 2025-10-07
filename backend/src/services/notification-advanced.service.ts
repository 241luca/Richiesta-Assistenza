// backend/src/services/notification-advanced.service.ts (continuazione)

          failedCount++;
        }
      }
      
      // Aggiorna statistiche batch
      await prisma.notificationBatch.update({
        where: { id: batchId },
        data: {
          status: failedCount === recipients.length ? 'FAILED' : 'SENT',
          sentCount,
          failedCount,
          totalRecipients: recipients.length
        }
      });
      
      // Audit log
      await auditService.log({
        action: 'NOTIFICATION_BATCH_SENT',
        entityType: 'NotificationBatch',
        entityId: batchId,
        userId: batch.createdBy,
        details: {
          templateKey: batch.template.key,
          recipients: recipients.length,
          sent: sentCount,
          failed: failedCount
        },
        severity: 'INFO',
        category: 'COMMUNICATION'
      });
      
    } catch (error) {
      logger.error('Errore invio batch:', error);
      
      await prisma.notificationBatch.update({
        where: { id: batchId },
        data: { status: 'FAILED' }
      });
      
      throw error;
    }
  }
  
  /**
   * Ottieni destinatari batch
   */
  private async getBatchRecipients(batch: any): Promise<any[]> {
    switch (batch.targetType) {
      case 'ALL_USERS':
        return await prisma.user.findMany({
          where: { isActive: true }
        });
      
      case 'ROLE':
        return await prisma.user.findMany({
          where: {
            role: batch.targetRole,
            isActive: true
          }
        });
      
      case 'CUSTOM':
        return await prisma.user.findMany({
          where: {
            id: { in: batch.targetIds },
            isActive: true
          }
        });
      
      default:
        return [];
    }
  }
  
  /**
   * Formatta messaggio per WhatsApp
   */
  private formatForWhatsApp(message: string, priority?: string): string {
    let prefix = '';
    
    switch (priority) {
      case 'CRITICAL':
        prefix = '🚨 **URGENTE** 🚨\n\n';
        break;
      case 'URGENT':
        prefix = '⚠️ **IMPORTANTE** ⚠️\n\n';
        break;
      case 'HIGH':
        prefix = '📢 ';
        break;
      default:
        prefix = '💬 ';
    }
    
    // Converti HTML base in formato WhatsApp
    let formatted = message
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '') // Rimuovi altri tag HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    return prefix + formatted;
  }
  
  /**
   * Ottieni destinatario per canale
   */
  private getRecipient(userId: string, channel: string): string {
    // Questa funzione andrebbe implementata per recuperare
    // il destinatario corretto in base al canale
    return userId;
  }
  
  /**
   * Verifica stato consegna notifiche
   */
  async checkDeliveryStatus(): Promise<void> {
    // Controlla notifiche pending da più di 5 minuti
    const pendingNotifications = await prisma.notificationLog.findMany({
      where: {
        status: 'SENT',
        deliveredAt: null,
        sentAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    });
    
    for (const notification of pendingNotifications) {
      try {
        // Qui andrebbero implementati i check specifici per canale
        // Es: webhook delivery per WhatsApp, SMTP status per email, etc.
        
        // Per ora simuliamo
        const delivered = Math.random() > 0.1; // 90% success rate
        
        if (delivered) {
          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date()
            }
          });
        }
      } catch (error) {
        logger.error('Errore check delivery:', error);
      }
    }
  }
  
  /**
   * Gestisci notifiche fallite con retry
   */
  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await prisma.notificationLog.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ultime 24h
        }
      },
      include: {
        user: true,
        template: true
      },
      take: 50 // Processa 50 alla volta
    });
    
    for (const notification of failedNotifications) {
      try {
        // Riprova invio
        await this.send({
          userId: notification.userId,
          templateKey: notification.template?.key,
          channel: notification.channel as any,
          customContent: notification.template ? undefined : {
            subject: notification.subject || undefined,
            body: notification.body
          },
          metadata: {
            ...notification.metadata as any,
            retryAttempt: ((notification.metadata as any)?.retryAttempt || 0) + 1
          }
        });
        
        // Marca originale come retry effettuato
        await prisma.notificationLog.update({
          where: { id: notification.id },
          data: {
            metadata: {
              ...notification.metadata as any,
              retriedAt: new Date()
            }
          }
        });
        
      } catch (error) {
        logger.error('Errore retry notifica:', error);
      }
    }
  }
  
  /**
   * Statistiche notifiche
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<any> {
    const stats = await prisma.notificationLog.groupBy({
      by: ['channel', 'status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    });
    
    const byTemplate = await prisma.notificationLog.groupBy({
      by: ['templateId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        templateId: { not: null }
      },
      _count: true
    });
    
    const avgDeliveryTime = await prisma.$queryRaw`
      SELECT channel, 
             AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_seconds
      FROM notification_log
      WHERE sent_at BETWEEN ${startDate} AND ${endDate}
        AND delivered_at IS NOT NULL
      GROUP BY channel
    `;
    
    return {
      byChannelAndStatus: stats,
      byTemplate,
      avgDeliveryTime,
      period: { start: startDate, end: endDate }
    };
  }
}

// Export singleton
export const notificationService = new AdvancedNotificationService();

// ========= TEMPLATE PREDEFINITI =========

export const DEFAULT_TEMPLATES = {
  // Template per reclami PEC
  COMPLAINT_SUBMITTED: {
    key: 'complaint_submitted',
    name: 'Reclamo Inviato',
    category: 'LEGAL',
    emailSubject: 'Conferma Invio Reclamo - {{COMPANY}}',
    emailBody: `
      <h2>Reclamo Inviato con Successo</h2>
      <p>Gentile {{USER_NAME}},</p>
      <p>Confermiamo l'invio del suo reclamo formale a <strong>{{COMPANY}}</strong>.</p>
      
      <h3>Dettagli Reclamo:</h3>
      <ul>
        <li>ID Reclamo: {{COMPLAINT_ID}}</li>
        <li>Data Invio: {{SENT_DATE}}</li>
        <li>Metodo: PEC (Posta Elettronica Certificata)</li>
        <li>Destinatario: {{RECIPIENT_PEC}}</li>
      </ul>
      
      <p>Riceverà risposta entro 30 giorni lavorativi come previsto dalla normativa.</p>
      <p>La terremo aggiornato/a su ogni sviluppo.</p>
      
      <p>Cordiali saluti,<br>
      Il Team Assistenza</p>
    `,
    whatsappBody: `✅ *Reclamo Inviato*

Il suo reclamo a {{COMPANY}} è stato inviato con successo via PEC.

📋 ID: {{COMPLAINT_ID}}
📅 Data: {{SENT_DATE}}
⏰ Risposta attesa: entro 30 giorni

La aggiorneremo su ogni sviluppo.`,
    channels: ['EMAIL', 'WHATSAPP'],
    priority: 'HIGH',
    requiresConfirm: false,
    variables: {
      USER_NAME: 'string',
      COMPANY: 'string',
      COMPLAINT_ID: 'string',
      SENT_DATE: 'string',
      RECIPIENT_PEC: 'string'
    }
  },
  
  // Template per richieste di assistenza
  REQUEST_CREATED: {
    key: 'request_created',
    name: 'Richiesta Assistenza Creata',
    category: 'BUSINESS',
    emailSubject: 'Richiesta Assistenza #{{REQUEST_ID}} Creata',
    emailBody: `
      <h2>Richiesta di Assistenza Ricevuta</h2>
      <p>Gentile {{USER_NAME}},</p>
      <p>Abbiamo ricevuto la sua richiesta di assistenza.</p>
      
      <h3>Dettagli:</h3>
      <ul>
        <li>ID Richiesta: {{REQUEST_ID}}</li>
        <li>Categoria: {{CATEGORY}}</li>
        <li>Problema: {{DESCRIPTION}}</li>
        <li>Urgenza: {{URGENCY}}</li>
      </ul>
      
      <p>{{PROFESSIONALS_COUNT}} professionisti sono stati notificati.</p>
      <p>Riceverà i preventivi entro {{EXPECTED_TIME}}.</p>
    `,
    whatsappBody: `📋 *Richiesta #{{REQUEST_ID}} Creata*

✅ La sua richiesta è stata inoltrata a {{PROFESSIONALS_COUNT}} professionisti.

🔧 Categoria: {{CATEGORY}}
⏰ Preventivi attesi: {{EXPECTED_TIME}}

Per verificare lo stato:
Scrivi STATO {{REQUEST_ID}}`,
    smsBody: 'Richiesta {{REQUEST_ID}} creata. {{PROFESSIONALS_COUNT}} professionisti notificati. Preventivi in arrivo.',
    channels: ['EMAIL', 'WHATSAPP', 'SMS'],
    priority: 'MEDIUM',
    requiresConfirm: false,
    variables: {
      USER_NAME: 'string',
      REQUEST_ID: 'string',
      CATEGORY: 'string',
      DESCRIPTION: 'string',
      URGENCY: 'string',
      PROFESSIONALS_COUNT: 'number',
      EXPECTED_TIME: 'string'
    }
  },
  
  // Template per preventivi
  QUOTE_RECEIVED: {
    key: 'quote_received',
    name: 'Nuovo Preventivo Ricevuto',
    category: 'BUSINESS',
    emailSubject: 'Nuovo Preventivo per Richiesta #{{REQUEST_ID}}',
    emailBody: `
      <h2>Nuovo Preventivo Ricevuto</h2>
      <p>Hai ricevuto un nuovo preventivo per la tua richiesta.</p>
      
      <h3>Dettagli Preventivo:</h3>
      <ul>
        <li>Professionista: {{PROFESSIONAL_NAME}}</li>
        <li>Valutazione: ⭐ {{RATING}}/5</li>
        <li>Importo: €{{AMOUNT}}</li>
        <li>Tempo stimato: {{ESTIMATED_TIME}}</li>
      </ul>
      
      <p><a href="{{QUOTE_LINK}}">Visualizza e Accetta Preventivo</a></p>
    `,
    whatsappBody: `💰 *Nuovo Preventivo!*

👷 {{PROFESSIONAL_NAME}} (⭐ {{RATING}})
💶 Importo: €{{AMOUNT}}
⏱️ Arrivo: {{ESTIMATED_TIME}}

Per accettare:
ACCETTA {{QUOTE_ID}}

Per dettagli:
PREVENTIVO {{QUOTE_ID}}`,
    channels: ['EMAIL', 'WHATSAPP'],
    priority: 'HIGH',
    requiresConfirm: false,
    variables: {
      REQUEST_ID: 'string',
      PROFESSIONAL_NAME: 'string',
      RATING: 'number',
      AMOUNT: 'number',
      ESTIMATED_TIME: 'string',
      QUOTE_ID: 'string',
      QUOTE_LINK: 'string'
    }
  },
  
  // Template per emergenze
  EMERGENCY_ALERT: {
    key: 'emergency_alert',
    name: 'Alert Emergenza',
    category: 'SYSTEM',
    emailSubject: '🚨 URGENTE: {{ALERT_TITLE}}',
    emailBody: `
      <div style="border: 2px solid red; padding: 20px; background: #fff5f5;">
        <h1 style="color: red;">⚠️ ATTENZIONE URGENTE</h1>
        <h2>{{ALERT_TITLE}}</h2>
        <p>{{ALERT_MESSAGE}}</p>
        
        <h3>Azioni Richieste:</h3>
        <p>{{REQUIRED_ACTIONS}}</p>
        
        <p><strong>Questo messaggio richiede la sua attenzione immediata.</strong></p>
      </div>
    `,
    whatsappBody: `🚨 *URGENTE* 🚨

{{ALERT_TITLE}}

{{ALERT_MESSAGE}}

⚠️ Azione richiesta:
{{REQUIRED_ACTIONS}}

Risponda IMMEDIATAMENTE.`,
    smsBody: 'URGENTE: {{ALERT_TITLE}}. {{REQUIRED_ACTIONS}}',
    pecSubject: 'COMUNICAZIONE URGENTE: {{ALERT_TITLE}}',
    pecBody: `
      OGGETTO: COMUNICAZIONE URGENTE
      
      {{ALERT_TITLE}}
      
      {{ALERT_MESSAGE}}
      
      Azioni richieste:
      {{REQUIRED_ACTIONS}}
      
      Si richiede riscontro immediato.
    `,
    channels: ['EMAIL', 'WHATSAPP', 'SMS', 'PEC'],
    priority: 'CRITICAL',
    requiresConfirm: true
  }
};

// ========= SCHEDULER ==========

import * as cron from 'node-cron';

// Check delivery status ogni 5 minuti
cron.schedule('*/5 * * * *', async () => {
  try {
    await notificationService.checkDeliveryStatus();
  } catch (error) {
    logger.error('Errore check delivery status:', error);
  }
});

// Retry notifiche fallite ogni ora
cron.schedule('0 * * * *', async () => {
  try {
    await notificationService.retryFailedNotifications();
  } catch (error) {
    logger.error('Errore retry notifiche:', error);
  }
});

// Processa batch schedulati ogni minuto
cron.schedule('* * * * *', async () => {
  try {
    const scheduledBatches = await prisma.notificationBatch.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: new Date()
        }
      }
    });
    
    for (const batch of scheduledBatches) {
      await notificationService.sendBatch(batch.id);
    }
  } catch (error) {
    logger.error('Errore processamento batch:', error);
  }
});
