import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const router = Router();

// Schema di validazione per i template email
const emailTemplateSchema = z.object({
  body: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string(),
    subject: z.string().optional(),
    htmlContent: z.string(),
    textContent: z.string().optional(),
    variables: z.array(z.string()),
    brevoTemplateId: z.string().optional(),
    isActive: z.boolean().default(true)
  })
});

/**
 * GET /api/admin/email-templates
 * Ottieni tutti i template email
 */
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      // Recupera i template salvati nel database
      // Per ora prendiamo tutti i template, potremmo filtrarli dopo
      const templates = await prisma.notificationTemplate.findMany({
        orderBy: { category: 'asc' }
      });

      res.json(ResponseFormatter.success(
        templates,
        'Email templates retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching email templates:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to fetch email templates'
      ));
    }
  }
);

/**
 * GET /api/admin/email-templates/:id
 * Ottieni un template specifico
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const template = await prisma.notificationTemplate.findUnique({
        where: { id }
      });

      if (!template) {
        return res.status(404).json(ResponseFormatter.error(
          'Template not found',
          404
        ));
      }

      res.json(ResponseFormatter.success(
        template,
        'Template retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching template:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to fetch template'
      ));
    }
  }
);

/**
 * POST /api/admin/email-templates
 * Crea o aggiorna un template email
 */
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(emailTemplateSchema),
  async (req, res) => {
    try {
      const templateData = req.body;
      
      // Verifica se esiste già un template con questo ID
      const existing = await prisma.notificationTemplate.findUnique({
        where: { 
          code: templateData.id 
        }
      });

      let template;
      
      if (existing) {
        // Aggiorna il template esistente
        template = await prisma.notificationTemplate.update({
          where: { id: existing.id },
          data: {
            name: templateData.name,
            description: templateData.description,
            category: templateData.category,
            subject: templateData.subject,
            htmlContent: templateData.htmlContent,
            textContent: templateData.textContent,
            variables: templateData.variables,
            channels: ['email'],
            metadata: {
              brevoTemplateId: templateData.brevoTemplateId
            },
            isActive: templateData.isActive,
            updatedAt: new Date()
          }
        });
      } else {
        // Crea un nuovo template
        template = await prisma.notificationTemplate.create({
          data: {
            code: templateData.id,
            name: templateData.name,
            description: templateData.description || '',
            category: templateData.category,
            subject: templateData.subject || '',
            htmlContent: templateData.htmlContent,
            textContent: templateData.textContent || '',
            variables: templateData.variables,
            channels: ['email'],
            priority: 'NORMAL',
            metadata: {
              brevoTemplateId: templateData.brevoTemplateId
            },
            isActive: templateData.isActive,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      logger.info(`Email template ${templateData.id} saved by user ${req.user!.id}`);

      res.json(ResponseFormatter.success(
        template,
        `Template ${existing ? 'updated' : 'created'} successfully`
      ));
    } catch (error) {
      logger.error('Error saving email template:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to save template'
      ));
    }
  }
);

/**
 * POST /api/admin/email-templates/:id/test
 * Invia email di test per un template
 */
router.post(
  '/:id/test',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Recupera il template
      const template = await prisma.notificationTemplate.findFirst({
        where: { 
          OR: [
            { id },
            { code: id }
          ]
        }
      });

      if (!template) {
        return res.status(404).json(ResponseFormatter.error(
          'Template not found',
          404
        ));
      }

      // Recupera la configurazione Brevo
      const apiKey = await prisma.apiKey.findFirst({
        where: { 
          service: 'BREVO',
          isActive: true
        }
      });

      if (!apiKey) {
        return res.status(400).json(ResponseFormatter.error(
          'Brevo API not configured',
          400
        ));
      }

      // Prepara le variabili di test
      const testVariables: any = {};
      template.variables.forEach((variable: string) => {
        // Valori di esempio per le variabili
        switch(variable) {
          case 'userName':
            testVariables.userName = 'Luca Mambelli';
            break;
          case 'email':
            testVariables.email = 'lucamambelli@lmtecnologie.it';
            break;
          case 'requestTitle':
            testVariables.requestTitle = 'Richiesta di Test';
            break;
          case 'professionalName':
            testVariables.professionalName = 'Mario Rossi';
            break;
          case 'quoteAmount':
            testVariables.quoteAmount = '€ 150,00';
            break;
          case 'date':
            testVariables.date = new Date().toLocaleDateString('it-IT');
            break;
          case 'time':
            testVariables.time = '10:00';
            break;
          default:
            testVariables[variable] = `[${variable}]`;
        }
      });

      // Sostituisci le variabili nel contenuto
      let htmlContent = template.htmlContent;
      let subject = template.subject || `Test: ${template.name}`;
      
      Object.keys(testVariables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, testVariables[key]);
        subject = subject.replace(regex, testVariables[key]);
      });

      // Configurazione email
      const config = apiKey.permissions as any || {};
      const senderEmail = config.senderEmail || 'noreply@assistenza.it';
      const senderName = config.senderName || 'Sistema Assistenza';

      // Invia l'email tramite Brevo API
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey.key,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            email: senderEmail,
            name: senderName
          },
          to: [{
            email: 'lucamambelli@lmtecnologie.it',
            name: 'Luca Mambelli'
          }],
          subject: subject,
          htmlContent: htmlContent || `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Test Template: ${template.name}</h2>
              <p>Questo è un test del template email.</p>
              <hr>
              <p><strong>Variabili disponibili:</strong></p>
              <ul>
                ${template.variables.map((v: string) => 
                  `<li>${v}: ${testVariables[v]}</li>`
                ).join('')}
              </ul>
            </div>
          `
        })
      });

      if (response.ok) {
        logger.info(`Test email sent for template ${id} to lucamambelli@lmtecnologie.it`);
        res.json(ResponseFormatter.success(
          { sent: true, to: 'lucamambelli@lmtecnologie.it' },
          'Test email sent successfully'
        ));
      } else {
        const error = await response.text();
        logger.error('Failed to send test email:', error);
        res.status(500).json(ResponseFormatter.error(
          'Failed to send test email'
        ));
      }
    } catch (error) {
      logger.error('Error sending test email:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to send test email'
      ));
    }
  }
);

/**
 * DELETE /api/admin/email-templates/:id
 * Elimina un template
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      await prisma.notificationTemplate.delete({
        where: { id }
      });

      logger.info(`Template ${id} deleted by user ${req.user!.id}`);

      res.json(ResponseFormatter.success(
        null,
        'Template deleted successfully'
      ));
    } catch (error) {
      logger.error('Error deleting template:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to delete template'
      ));
    }
  }
);

export default router;
