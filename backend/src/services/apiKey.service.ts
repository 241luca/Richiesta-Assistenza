import { prisma } from '../config/database';
import { ApiKey } from '@prisma/client';
import { logger } from '../utils/logger';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export interface ApiKeyInput {
  service: 'GOOGLE_MAPS' | 'BREVO' | 'OPENAI' | 'TINYMCE' | 'whatsapp' | 'STRIPE' | 'STRIPE_PUBLIC' | 'STRIPE_WEBHOOK';
  key: string;
  configuration?: any;
  isActive?: boolean;
}

export class ApiKeyService {
  /**
   * Cripta una API key per storage sicuro
   */
  private encryptKey(key: string): string {
    // In produzione usare una chiave di crittografia sicura da env
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    const iv = randomBytes(16);
    
    const cipher = createCipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decripta una API key per utilizzo
   */
  private decryptKey(encryptedKey: string): string {
    try {
      // Se non contiene ':', probabilmente non è criptata
      if (!encryptedKey.includes(':')) {
        return encryptedKey; // Fallback per chiavi non criptate
      }

      const algorithm = 'aes-256-cbc';
      const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      
      const [ivHex, encrypted] = encryptedKey.split(':');
      
      // Verifica che l'IV sia valido (32 caratteri hex = 16 bytes)
      if (!ivHex || ivHex.length !== 32) {
        logger.error('Invalid IV format, returning key as-is');
        return encryptedKey; // Fallback
      }

      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Error decrypting API key:', error);
      return encryptedKey; // Fallback per chiavi non criptate (development)
    }
  }

  /**
   * Ottieni tutte le API keys (solo per SUPER_ADMIN)
   */
  async getAllApiKeys(): Promise<ApiKey[]> {
    try {
      logger.info(`Getting all API keys`);
      
      if (!prisma.apiKey) {
        logger.error('prisma.apiKey is undefined!');
        throw new Error('ApiKey model not available in Prisma Client');
      }
      
      const apiKeys = await prisma.apiKey.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { service: 'asc' }
      });

      // Maschera le chiavi per sicurezza
      return apiKeys.map(key => ({
        ...key,
        key: this.maskKey(key.key, key.service as any)
      }));
    } catch (error) {
      logger.error('Error fetching API keys:', error);
      throw new Error('Failed to fetch API keys');
    }
  }

  /**
   * Ottieni una specifica API key
   */
  async getApiKey(service: ApiKeyInput['service'], unmask: boolean = false): Promise<ApiKey | null> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: { 
          service,
          isActive: true
        }
      });

      if (!apiKey) return null;

      // Decripta la chiave per uso interno
      const decryptedKey = this.decryptKey(apiKey.key);
      
      return {
        ...apiKey,
        key: unmask ? decryptedKey : this.maskKey(apiKey.key, apiKey.service as any)
      };
    } catch (error) {
      logger.error(`Error fetching API key for ${service}:`, error);
      return null;
    }
  }

  /**
   * Maschera una API key per visualizzazione
   */
  private maskKey(key: string, service: ApiKeyInput['service']): string {
    const decryptedKey = this.decryptKey(key);
    
    switch (service) {
      case 'GOOGLE_MAPS':
        // Mostra solo i primi 8 caratteri
        return decryptedKey.substring(0, 8) + '...' + decryptedKey.slice(-4);
      case 'BREVO':
        // Mostra solo i primi 10 caratteri
        return decryptedKey.substring(0, 10) + '...' + decryptedKey.slice(-4);
      case 'OPENAI':
        // Mostra solo sk- e gli ultimi 4 caratteri
        return 'sk-...' + decryptedKey.slice(-4);
      case 'TINYMCE':
        // Mostra solo i primi 10 caratteri per TinyMCE
        if (decryptedKey && decryptedKey.length > 10) {
          return decryptedKey.substring(0, 10) + '...' + decryptedKey.slice(-4);
        }
        return '***MASKED***';
      case 'whatsapp':
        // Mostra solo i primi 10 caratteri per WhatsApp
        if (decryptedKey && decryptedKey.length > 10) {
          return decryptedKey.substring(0, 10) + '...';
        }
        return decryptedKey || '***MASKED***';
      default:
        return '***MASKED***';
    }
  }

  /**
   * Crea o aggiorna una API key
   */
  async upsertApiKey(
    data: ApiKeyInput,
    userId: string
  ): Promise<ApiKey> {
    try {
      // Cripta la chiave prima di salvarla
      const encryptedKey = this.encryptKey(data.key);

      // Valida la chiave prima di salvarla
      const isValid = await this.validateApiKey(data.service, data.key);
      logger.info(`API key validation for ${data.service}: ${isValid}`);
      logger.info(`API key length for ${data.service}: ${data.key.length}`);
      
      // Per TinyMCE, logga la chiave per debug (rimuovere in produzione!)
      if (data.service === 'TINYMCE') {
        logger.info(`TinyMCE key being saved: ${data.key.substring(0, 10)}...${data.key.slice(-10)}`);
      }
      
      // Prima cerca se esiste già una chiave per questo servizio
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          service: data.service
        }
      });

      let apiKey;
      const now = new Date();

      if (existingKey) {
        // Aggiorna la chiave esistente
        apiKey = await prisma.apiKey.update({
          where: { id: existingKey.id },
          data: {
            key: encryptedKey,
            permissions: data.configuration || {},
            isActive: data.isActive ?? true,
            userId: userId,
            lastUsedAt: isValid ? now : null,
            updatedAt: now
          }
        });
      } else {
        // Crea una nuova chiave
        apiKey = await prisma.apiKey.create({
          data: {
            id: `${data.service.toLowerCase()}_key_${Date.now()}`,
            name: `${data.service} API Key`,
            service: data.service,
            key: encryptedKey,
            permissions: data.configuration || {},
            isActive: data.isActive ?? true,
            userId: userId,
            lastUsedAt: isValid ? now : null,
            createdAt: now,
            updatedAt: now
          }
        });
      }

      logger.info(`API key ${data.service} updated by user ${userId}`);
      
      // Ritorna con chiave mascherata
      return {
        ...apiKey,
        key: this.maskKey(apiKey.key, apiKey.service as any)
      };
    } catch (error) {
      logger.error('Error upserting API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  /**
   * Valida una API key
   */
  async validateApiKey(service: ApiKeyInput['service'], key: string): Promise<boolean> {
    try {
      switch (service) {
        case 'GOOGLE_MAPS':
          return await this.validateGoogleMapsKey(key);
        case 'BREVO':
          return await this.validateBrevoKey(key);
        case 'OPENAI':
          return await this.validateOpenAIKey(key);
        case 'TINYMCE':
          // Per TinyMCE, verifichiamo solo che la key abbia il formato corretto
          // Le chiavi TinyMCE sono solitamente alfanumeriche di almeno 20 caratteri
          return !!(key && key.length >= 20);
        case 'whatsapp':
          // Per WhatsApp, verifichiamo solo che la key esista
          // La validazione completa avviene quando si inizializza
          return !!(key && key.length > 10);
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Error validating ${service} key:`, error);
      return false;
    }
  }

  /**
   * Valida Google Maps API key
   */
  private async validateGoogleMapsKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Rome,Italy&key=${key}`
      );
      const data = await response.json() as any;
      return data.status !== 'REQUEST_DENIED';
    } catch {
      return false;
    }
  }

  /**
   * Valida Brevo API key
   */
  private async validateBrevoKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': key,
          'accept': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Invia email di test per Brevo
   */
  private async sendBrevoTestEmail(apiKey: any): Promise<boolean> {
    try {
      // Email di destinazione fissa per il test
      const testEmail = 'lucamambelli@lmtecnologie.it';
      const testName = 'Luca Mambelli';

      // Configurazione email dal database API key
      const config = apiKey.permissions || {};
      const senderEmail = config.senderEmail || 'noreply@assistenza.it';
      const senderName = config.senderName || 'Sistema Assistenza';

      logger.info(`Sending test email to: ${testEmail}`);

      // Usa l'API di Brevo per inviare l'email
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
            email: testEmail,
            name: testName
          }],
          subject: '🎉 Test Email Brevo - Sistema Richiesta Assistenza',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px;">
                <h1>✅ Test Email Riuscito!</h1>
              </div>
              <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 8px;">
                <h2>Ciao Luca! 🎉</h2>
                <p>Se stai leggendo questa email, significa che la configurazione di Brevo è corretta!</p>
                <p><strong>Dettagli tecnici:</strong></p>
                <ul>
                  <li>Mittente: ${senderEmail}</li>
                  <li>Destinatario: ${testEmail}</li>
                  <li>Data invio: ${new Date().toLocaleString('it-IT')}</li>
                  <li>API Key: Configurata correttamente</li>
                </ul>
                <p style="margin-top: 30px; padding: 15px; background-color: #D1FAE5; border-radius: 5px;">
                  <strong>✅ Il sistema è pronto per inviare email!</strong><br>
                  Ora puoi utilizzare tutte le funzionalità di invio email del sistema.
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
                <p>Sistema Richiesta Assistenza - Email di Test</p>
                <p>Powered by Brevo</p>
              </div>
            </div>
          `
        })
      });

      if (response.ok) {
        const result = await response.json();
        logger.info(`Test email sent successfully to ${testEmail}`, result);
        return true;
      } else {
        const error = await response.text();
        logger.error('Failed to send test email:', error);
        return false;
      }
    } catch (error) {
      logger.error('Error sending Brevo test email:', error);
      return false;
    }
  }

  /**
   * Valida OpenAI API key
   */
  private async validateOpenAIKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Elimina una API key
   */
  async deleteApiKey(service: ApiKeyInput['service'], ): Promise<boolean> {
    try {
      await prisma.apiKey.deleteMany({
        where: { 
          service
          // organizationId rimosso perché non esiste nello schema
        }
      });
      
      logger.info(`API key ${service} deleted`);
      return true;
    } catch (error) {
      logger.error('Error deleting API key:', error);
      return false;
    }
  }

  /**
   * Testa una API key
   */
  async testApiKey(service: ApiKeyInput['service'], ): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const apiKey = await this.getApiKey(service);
      
      if (!apiKey) {
        return {
          success: false,
          message: 'API key not found'
        };
      }

      const isValid = await this.validateApiKey(service, apiKey.key);
      
      if (isValid) {
        // Aggiorna lastUsedAt
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() }
        });

        // Per Brevo, invia anche un'email di test
        if (service === 'BREVO') {
          const emailSent = await this.sendBrevoTestEmail(apiKey);
          if (emailSent) {
            return {
              success: true,
              message: `API key valida e email di test inviata a lucamambelli@lmtecnologie.it!`,
              details: {
                service,
                emailSentTo: 'lucamambelli@lmtecnologie.it',
                lastValidated: new Date().toISOString()
              }
            };
          } else {
            return {
              success: false,
              message: 'API key valida ma invio email di test fallito',
              details: {
                service,
                lastValidated: new Date().toISOString()
              }
            };
          }
        }
        
        // Per TinyMCE, test specifico
        if (service === 'TINYMCE') {
          return {
            success: true,
            message: 'TinyMCE API key configurata correttamente',
            details: {
              service,
              lastValidated: new Date().toISOString()
            }
          };
        }
        
        // Per WhatsApp, test specifico
        if (service === 'whatsapp') {
          return {
            success: true,
            message: 'WhatsApp API key configurata correttamente',
            details: {
              service,
              lastValidated: new Date().toISOString()
            }
          };
        }
      }

      return {
        success: isValid,
        message: isValid ? 'API key is valid and working' : 'API key validation failed',
        details: {
          service,
          lastValidated: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Error testing ${service} key:`, error);
      return {
        success: false,
        message: 'Error testing API key',
        details: error
      };
    }
  }
}

export const apiKeyService = new ApiKeyService();
