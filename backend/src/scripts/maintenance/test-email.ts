/**
 * Script: Test Email System
 * Invia una email di test per verificare la configurazione
 */

import { emailService } from '../../services/email.service';
import { logger } from '../../utils/logger';

interface TestEmailParams {
  recipient: string;
  template?: string;
}

export async function execute(params: TestEmailParams) {
  const { recipient, template = 'test' } = params;
  
  try {
    logger.info('📧 Starting email test...');
    logger.info(`📬 Recipient: ${recipient}`);
    logger.info(`📝 Template: ${template}`);
    
    // Prepare test email content
    const subject = '🧪 Test Email - Sistema Richiesta Assistenza';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Test Email Sistema</h2>
        <p>Questa è una email di test inviata dal Sistema di Richiesta Assistenza.</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc;">Dettagli Test:</h3>
          <ul>
            <li><strong>Data/Ora:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>Template:</strong> ${template}</li>
            <li><strong>Destinatario:</strong> ${recipient}</li>
            <li><strong>Server:</strong> ${process.env.NODE_ENV || 'development'}</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Se hai ricevuto questa email, il sistema di invio email è configurato correttamente.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Questa è una email di test automatica. Non rispondere a questo messaggio.
        </p>
      </div>
    `;
    
    // Send test email
    const result = await emailService.sendEmail({
      to: recipient,
      subject,
      html: htmlContent
    });
    
    if (result.success) {
      logger.info('✅ Test email sent successfully!');
      logger.info(`📬 Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient,
        template,
        timestamp: new Date(),
        message: 'Email inviata con successo'
      };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
    
  } catch (error) {
    logger.error('❌ Email test failed:', error);
    throw error;
  }
}

// Metadata for Script Manager
export const metadata = {
  id: 'test-email-system',
  name: 'Test Sistema Email',
  description: 'Invia una email di test per verificare la configurazione',
  category: 'maintenance',
  risk: 'low',
  parameters: [
    {
      name: 'recipient',
      type: 'string',
      required: true,
      description: 'Email destinatario'
    },
    {
      name: 'template',
      type: 'select',
      options: ['test', 'welcome', 'notification'],
      default: 'test',
      description: 'Template da usare'
    }
  ],
  requireConfirmation: false,
  minRole: 'ADMIN'
};
