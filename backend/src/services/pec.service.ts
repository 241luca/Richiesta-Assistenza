// backend/src/services/pec.service.ts
/**
 * Servizio gestione PEC (Posta Elettronica Certificata)
 * Per invio reclami formali e comunicazioni certificate
 */

import { logger } from '../utils/logger';
import * as nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import * as auditService from './auditLog.service';
import * as notificationService from './notification.service';

// Configurazione provider PEC
const PEC_PROVIDERS = {
  aruba: {
    host: 'smtps.pec.aruba.it',
    port: 465,
    secure: true
  },
  poste: {
    host: 'relay.poste.it',
    port: 465,
    secure: true
  },
  register: {
    host: 'smtps.pec.register.it',
    port: 465,
    secure: true
  }
};

// Template PEC per diversi fornitori
const PEC_TEMPLATES = {
  ENEL: {
    to: 'enelenergia@pec.enel.it',
    subject: 'RECLAMO FORMALE - Contratto N. {CONTRACT_NUMBER}',
    template: `
Spett.le Enel Energia S.p.A.
Casella Postale 8080
85100 Potenza (PZ)

OGGETTO: RECLAMO FORMALE AI SENSI DELLA DELIBERA ARERA 413/2016/R/COM
         Contratto N. {CONTRACT_NUMBER}
         POD: {POD_CODE}

Il/La sottoscritto/a {CUSTOMER_NAME}
Codice Fiscale: {FISCAL_CODE}
Residente in: {ADDRESS}
Telefono: {PHONE}
Email: {EMAIL}

PRESENTA FORMALE RECLAMO

per le seguenti motivazioni:

{COMPLAINT_DETAILS}

Documentazione allegata:
{ATTACHMENTS}

RICHIESTE:
{REQUESTS}

Ai sensi della normativa vigente, si richiede riscontro scritto entro 30 giorni dalla ricezione della presente.

In caso di mancata o insoddisfacente risposta, mi riservo di adire all'Autorità di Regolazione per Energia Reti e Ambiente (ARERA) e/o alle vie legali.

Distinti saluti

{SIGNATURE}
Data: {DATE}

---
Inviato tramite Sistema Automatico di Richiesta Assistenza
ID Reclamo: {COMPLAINT_ID}
    `
  },
  
  TIM: {
    to: 'telecomitalia@pec.telecomitalia.it',
    subject: 'RECLAMO FORMALE - Linea {PHONE_NUMBER}',
    template: `
Spett.le TIM S.p.A.
Via Gaetano Negri, 1
20123 Milano

OGGETTO: RECLAMO FORMALE - Servizio Telefonico/Internet
         Numero: {PHONE_NUMBER}
         Codice Cliente: {CUSTOMER_CODE}

{COMPLAINT_BODY}
    `
  },
  
  GENERIC: {
    subject: 'RECLAMO FORMALE - {SUBJECT}',
    template: `
Spett.le {COMPANY_NAME}
{COMPANY_ADDRESS}

OGGETTO: {SUBJECT}

Il/La sottoscritto/a {CUSTOMER_NAME}
presenta formale reclamo per quanto segue:

{COMPLAINT_DETAILS}

Si richiede cortese riscontro entro i termini di legge.

Distinti saluti
{SIGNATURE}
{DATE}
    `
  }
};

interface PecConfig {
  provider: keyof typeof PEC_PROVIDERS;
  email: string;
  password: string;
}

interface PecMessage {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  returnReceipt?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface ComplaintData {
  userId: string;
  requestId?: string;
  company: string;
  type: 'ENEL' | 'TIM' | 'GENERIC';
  details: string;
  contractNumber?: string;
  customerCode?: string;
  attachments?: string[];
  templateData: Record<string, string>;
}

class PecService {
  private transporter: nodemailer.Transporter | null = null;
  
  constructor() {
    this.initializeTransporter();
  }
  
  /**
   * Inizializza il transporter PEC
   */
  private initializeTransporter() {
    try {
      const provider = process.env.PEC_PROVIDER as keyof typeof PEC_PROVIDERS || 'aruba';
      const config = PEC_PROVIDERS[provider];
      
      if (!process.env.PEC_EMAIL || !process.env.PEC_PASSWORD) {
        logger.warn('PEC non configurata - servizio disabilitato');
        return;
      }
      
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: process.env.PEC_EMAIL,
          pass: process.env.PEC_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // Per certificati self-signed
        }
      });
      
      // Verifica connessione
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Errore verifica PEC:', error);
        } else {
          logger.info('✅ Servizio PEC pronto');
        }
      });
      
    } catch (error) {
      logger.error('Errore inizializzazione PEC:', error);
    }
  }
  
  /**
   * Invia PEC generica
   */
  async sendPec(message: PecMessage): Promise<any> {
    if (!this.transporter) {
      throw new Error('Servizio PEC non configurato');
    }
    
    try {
      // Prepara messaggio con headers PEC
      const mailOptions = {
        from: process.env.PEC_EMAIL,
        to: message.to,
        subject: message.subject,
        html: message.html,
        attachments: message.attachments || [],
        priority: message.priority || 'normal',
        headers: {
          'X-Priority': message.priority === 'high' ? '1' : '3',
          'X-MSMail-Priority': message.priority === 'high' ? 'High' : 'Normal',
          'Importance': message.priority === 'high' ? 'high' : 'normal',
          'Return-Receipt-To': message.returnReceipt ? process.env.PEC_EMAIL : undefined,
          'Disposition-Notification-To': message.returnReceipt ? process.env.PEC_EMAIL : undefined
        }
      };
      
      // Invia PEC
      const result = await this.transporter.sendMail(mailOptions);
      
      // Log audit
      await auditService.log({
        action: 'PEC_SENT',
        entityType: 'PEC',
        entityId: result.messageId,
        userId: 'SYSTEM',
        details: {
          to: message.to,
          subject: message.subject,
          attachments: message.attachments?.length || 0
        },
        severity: 'INFO',
        category: 'COMMUNICATION'
      });
      
      logger.info(`PEC inviata: ${result.messageId} a ${message.to}`);
      
      return result;
      
    } catch (error) {
      logger.error('Errore invio PEC:', error);
      
      // Log audit errore
      await auditService.log({
        action: 'PEC_FAILED',
        entityType: 'PEC',
        userId: 'SYSTEM',
        details: {
          to: message.to,
          error: error.message
        },
        severity: 'ERROR',
        category: 'COMMUNICATION'
      });
      
      throw error;
    }
  }
  
  /**
   * Invia reclamo formale via PEC
   */
  async sendComplaint(complaint: ComplaintData): Promise<any> {
    try {
      // Salva reclamo nel database
      const savedComplaint = await prisma.complaint.create({
        data: {
          userId: complaint.userId,
          requestId: complaint.requestId,
          company: complaint.company,
          type: complaint.type,
          details: complaint.details,
          status: 'SENDING',
          metadata: complaint.templateData
        }
      });
      
      // Prepara template
      const template = PEC_TEMPLATES[complaint.type] || PEC_TEMPLATES.GENERIC;
      let htmlContent = template.template;
      
      // Sostituisci variabili nel template
      Object.entries(complaint.templateData).forEach(([key, value]) => {
        htmlContent = htmlContent.replace(new RegExp(`{${key}}`, 'g'), value);
      });
      
      // Aggiungi data e ID
      htmlContent = htmlContent
        .replace('{DATE}', new Date().toLocaleDateString('it-IT'))
        .replace('{COMPLAINT_ID}', savedComplaint.id);
      
      // Prepara allegati
      const attachments = [];
      if (complaint.attachments) {
        for (const filepath of complaint.attachments) {
          attachments.push({
            filename: filepath.split('/').pop() || 'allegato',
            path: filepath
          });
        }
      }
      
      // Determina destinatario
      let recipient = template.to;
      if (complaint.type === 'GENERIC' && complaint.templateData.COMPANY_EMAIL) {
        recipient = complaint.templateData.COMPANY_EMAIL;
      }
      
      // Invia PEC
      const result = await this.sendPec({
        to: recipient,
        subject: template.subject.replace(/{([^}]+)}/g, (match, key) => 
          complaint.templateData[key] || match
        ),
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .header { background: #f0f0f0; padding: 20px; }
              .content { padding: 20px; }
              .footer { background: #f0f0f0; padding: 10px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="content">
              ${htmlContent.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
              Documento inviato tramite PEC - Posta Elettronica Certificata<br>
              Il messaggio e gli eventuali allegati hanno valore legale
            </div>
          </body>
          </html>
        `,
        attachments,
        returnReceipt: true,
        priority: 'high'
      });
      
      // Aggiorna stato reclamo
      await prisma.complaint.update({
        where: { id: savedComplaint.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          messageId: result.messageId,
          response: result
        }
      });
      
      // Notifica utente
      await notificationService.sendToUser(complaint.userId, {
        title: '✅ Reclamo PEC Inviato',
        message: `Il tuo reclamo formale è stato inviato con successo a ${complaint.company}`,
        type: 'complaint_sent',
        priority: 'HIGH',
        data: {
          complaintId: savedComplaint.id,
          messageId: result.messageId
        }
      });
      
      // Audit log
      await auditService.log({
        action: 'COMPLAINT_SENT',
        entityType: 'Complaint',
        entityId: savedComplaint.id,
        userId: complaint.userId,
        details: {
          company: complaint.company,
          type: complaint.type,
          pecMessageId: result.messageId
        },
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
      return savedComplaint;
      
    } catch (error) {
      logger.error('Errore invio reclamo PEC:', error);
      
      // Notifica errore
      await notificationService.sendToUser(complaint.userId, {
        title: '❌ Errore Invio Reclamo',
        message: `Si è verificato un errore nell'invio del reclamo. Il nostro team è stato notificato.`,
        type: 'complaint_error',
        priority: 'HIGH'
      });
      
      throw error;
    }
  }
  
  /**
   * Verifica stato ricevute PEC
   */
  async checkReceipts(): Promise<void> {
    if (!this.transporter) {
      logger.warn('PEC non configurata - skip controllo ricevute');
      return;
    }
    
    try {
      // Qui andrebbe implementata la logica per controllare
      // le ricevute PEC tramite IMAP o altro protocollo
      // Per ora logghiamo solo
      logger.info('Controllo ricevute PEC...');
      
      // Trova reclami in attesa di ricevuta
      const pendingComplaints = await prisma.complaint.findMany({
        where: {
          status: 'SENT',
          receivedAt: null,
          sentAt: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Ultimi 2 giorni
          }
        }
      });
      
      logger.info(`${pendingComplaints.length} reclami in attesa di ricevuta`);
      
    } catch (error) {
      logger.error('Errore controllo ricevute PEC:', error);
    }
  }
}

// Export singleton
export const pecService = new PecService();

/**
 * Funzioni helper per integrazione WhatsApp
 */

/**
 * Gestisce richiesta di reclamo via WhatsApp
 */
export async function handleComplaintRequest(
  phoneNumber: string,
  user: any,
  complaintText: string
): Promise<string> {
  try {
    // Analizza il testo per identificare il fornitore
    const company = detectCompany(complaintText);
    
    if (!company) {
      return `Per inviare un reclamo formale, specifica il fornitore:
      
📧 Fornitori supportati:
• ENEL (energia elettrica)
• TIM (telefonia/internet)
• VODAFONE
• FASTWEB
• ENI (gas)
• ACEA (acqua)

Esempio: "Voglio fare reclamo a ENEL per bolletta errata"`;
    }
    
    // Raccolta dati necessari
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        clientRequests: {
          where: {
            categoryId: { in: ['utility', 'telecom'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    // Prepara template data
    const templateData = {
      CUSTOMER_NAME: userData?.fullName || 'N/A',
      FISCAL_CODE: userData?.fiscalCode || 'DA INSERIRE',
      ADDRESS: userData?.address || 'DA INSERIRE',
      PHONE: phoneNumber,
      EMAIL: userData?.email || 'N/A',
      COMPLAINT_DETAILS: complaintText,
      REQUESTS: 'Risoluzione del problema e eventuale rimborso/indennizzo'
    };
    
    // Se è ENEL, richiedi dati specifici
    if (company === 'ENEL') {
      return `📋 Per procedere con il reclamo ENEL, fornisci:

1. Numero Contratto (es: IT001234567)
2. Codice POD (es: IT001E12345678)
3. Descrizione dettagliata del problema

Scrivi tutto in un unico messaggio o invia ANNULLA per annullare.`;
    }
    
    // Crea bozza reclamo
    const draft = await prisma.complaintDraft.create({
      data: {
        userId: user.id,
        company,
        type: company,
        details: complaintText,
        status: 'DRAFT',
        templateData
      }
    });
    
    return `📝 Bozza reclamo creata per ${company}

Il reclamo verrà inviato via PEC (valore legale).

Vuoi procedere? 
• Scrivi CONFERMA per inviare
• Scrivi MODIFICA per cambiare il testo
• Scrivi ANNULLA per annullare

ID Bozza: ${draft.id.slice(-6)}`;
    
  } catch (error) {
    logger.error('Errore gestione reclamo WhatsApp:', error);
    return 'Si è verificato un errore. Riprova più tardi o contatta il supporto.';
  }
}

/**
 * Conferma e invia reclamo
 */
export async function confirmAndSendComplaint(
  draftId: string,
  userId: string
): Promise<string> {
  try {
    const draft = await prisma.complaintDraft.findFirst({
      where: {
        id: { endsWith: draftId },
        userId,
        status: 'DRAFT'
      }
    });
    
    if (!draft) {
      return 'Bozza reclamo non trovata o già inviata.';
    }
    
    // Invia reclamo via PEC
    const complaint = await pecService.sendComplaint({
      userId: draft.userId,
      company: draft.company,
      type: draft.type as any,
      details: draft.details,
      templateData: draft.templateData as any
    });
    
    // Aggiorna bozza
    await prisma.complaintDraft.update({
      where: { id: draft.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        complaintId: complaint.id
      }
    });
    
    return `✅ RECLAMO INVIATO CON SUCCESSO!

📧 Destinatario: ${draft.company}
📨 Metodo: PEC (Posta Certificata)
🔖 ID Reclamo: ${complaint.id.slice(-6)}
⏰ Risposta attesa: entro 30 giorni

Riceverai notifica quando arriverà la risposta.

Per controllare lo stato: STATO RECLAMO ${complaint.id.slice(-6)}`;
    
  } catch (error) {
    logger.error('Errore conferma reclamo:', error);
    return '❌ Errore nell\'invio del reclamo. Il team tecnico è stato notificato.';
  }
}

/**
 * Rileva fornitore dal testo
 */
function detectCompany(text: string): string | null {
  const companies = {
    'ENEL': ['enel', 'energia elettrica', 'corrente', 'bolletta luce'],
    'TIM': ['tim', 'telecom', 'telefono fisso', 'fibra tim'],
    'VODAFONE': ['vodafone', 'vodafon'],
    'FASTWEB': ['fastweb', 'fast web'],
    'ENI': ['eni', 'gas', 'bolletta gas'],
    'ACEA': ['acea', 'acqua', 'bolletta acqua']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [company, keywords] of Object.entries(companies)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return company;
    }
  }
  
  return null;
}

// Scheduler per controllo ricevute (ogni ora)
if (process.env.PEC_ENABLED === 'true') {
  setInterval(() => {
    pecService.checkReceipts();
  }, 60 * 60 * 1000); // Ogni ora
}
