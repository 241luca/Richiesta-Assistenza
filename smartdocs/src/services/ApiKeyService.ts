import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface ApiKeyData {
  id?: string;
  service: string;
  name: string;
  key_value: string;
  description?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export class ApiKeyService {
  private db: DatabaseClient;
  private encryptionKey: string;
  private algorithm = 'aes-256-cbc';

  constructor() {
    this.db = DatabaseClient.getInstance();
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'change-this-in-production-32ch';
    
    // Assicurati che la chiave sia lunga 32 caratteri
    this.encryptionKey = this.encryptionKey.padEnd(32).slice(0, 32);
  }

  /**
   * Cripta una API key per storage sicuro
   */
  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, Buffer.from(this.encryptionKey), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decripta una API key
   */
  private decrypt(encryptedText: string): string {
    try {
      if (!encryptedText || !encryptedText.includes(':')) {
        return encryptedText;
      }

      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = createDecipheriv(this.algorithm, Buffer.from(this.encryptionKey), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      return encryptedText;
    }
  }

  /**
   * Maschera una chiave per visualizzazione
   */
  private maskKey(key: string): string {
    if (!key || key.trim() === '') {
      return '***';
    }
    
    const decrypted = this.decrypt(key);
    if (!decrypted || decrypted.length <= 8) return '***';
    
    if (decrypted.startsWith('sk-')) {
      return 'sk-...' + decrypted.slice(-4);
    }
    
    return decrypted.substring(0, 8) + '...' + decrypted.slice(-4);
  }

  /**
   * Lista tutte le API keys
   */
  async listAll(includeInactive = true): Promise<ApiKeyData[]> {
    try {
      let query = 'SELECT * FROM smartdocs.api_keys';
      const params: any[] = [];

      if (!includeInactive) {
        query += ' WHERE is_active = true';
      }

      query += ' ORDER BY service ASC';

      const result = await this.db.query(query, params);
      
      return result.rows.map(row => ({
        ...row,
        key_value: this.maskKey(row.key_value)
      }));
    } catch (error) {
      logger.error('Error listing API keys:', error);
      throw error;
    }
  }

  /**
   * Ottieni una specifica API key
   */
  async getByService(service: string, unmask = false): Promise<ApiKeyData | null> {
    try {
      const query = 'SELECT * FROM smartdocs.api_keys WHERE service = $1';
      const result = await this.db.query(query, [service]);

      if (result.rows.length === 0) return null;

      const apiKey = result.rows[0];
      
      return {
        ...apiKey,
        key_value: unmask ? this.decrypt(apiKey.key_value) : this.maskKey(apiKey.key_value)
      };
    } catch (error) {
      logger.error(`Error getting API key for ${service}:`, error);
      return null;
    }
  }

  /**
   * Crea o aggiorna una API key
   */
  async upsert(data: ApiKeyData): Promise<ApiKeyData> {
    try {
      const encrypted = this.encrypt(data.key_value);

      // Controlla se esiste
      const existing = await this.getByService(data.service, false);

      if (existing) {
        // Update
        const query = `
          UPDATE smartdocs.api_keys
          SET name = $1, key_value = $2, description = $3, 
              is_active = $4, metadata = $5, updated_at = NOW()
          WHERE service = $6
          RETURNING *
        `;

        const result = await this.db.query(query, [
          data.name,
          encrypted,
          data.description || null,
          data.is_active !== undefined ? data.is_active : true,
          JSON.stringify(data.metadata || {}),
          data.service
        ]);

        logger.info(`API key updated: ${data.service}`);
        
        return {
          ...result.rows[0],
          key_value: this.maskKey(result.rows[0].key_value)
        };
      } else {
        // Create
        const query = `
          INSERT INTO smartdocs.api_keys 
          (service, name, key_value, description, is_active, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const result = await this.db.query(query, [
          data.service,
          data.name,
          encrypted,
          data.description || null,
          data.is_active !== undefined ? data.is_active : true,
          JSON.stringify(data.metadata || {})
        ]);

        logger.info(`API key created: ${data.service}`);
        
        return {
          ...result.rows[0],
          key_value: this.maskKey(result.rows[0].key_value)
        };
      }
    } catch (error) {
      logger.error('Error upserting API key:', error);
      throw error;
    }
  }

  /**
   * Elimina una API key
   */
  async delete(service: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM smartdocs.api_keys WHERE service = $1';
      await this.db.query(query, [service]);
      
      logger.info(`API key deleted: ${service}`);
      return true;
    } catch (error) {
      logger.error('Error deleting API key:', error);
      return false;
    }
  }

  /**
   * Testa una API key
   */
  async test(service: string): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = await this.getByService(service, true);
      
      if (!apiKey || !apiKey.key_value) {
        return { success: false, message: 'API key not configured' };
      }

      switch (service.toLowerCase()) {
        case 'openai':
          return await this.testOpenAI(apiKey.key_value);
        case 'anthropic':
          return await this.testAnthropic(apiKey.key_value);
        case 'qdrant':
          return await this.testQdrant(apiKey.key_value, apiKey.metadata);
        default:
          return { success: false, message: 'Test not implemented for this service' };
      }
    } catch (error: any) {
      logger.error(`Error testing ${service}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Test OpenAI
   */
  private async testOpenAI(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        // Aggiorna last_validated_at
        await this.updateLastValidated('openai');
        return { success: true, message: 'OpenAI API key is valid' };
      } else {
        const error: any = await response.json();
        return { success: false, message: error.error?.message || 'Invalid API key' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test Anthropic
   */
  private async testAnthropic(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (response.ok) {
        await this.updateLastValidated('anthropic');
        return { success: true, message: 'Anthropic API key is valid' };
      } else {
        const error: any = await response.json();
        return { success: false, message: error.error?.message || 'Invalid API key' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test Qdrant
   */
  private async testQdrant(apiKey: string, metadata: any): Promise<{ success: boolean; message: string }> {
    try {
      const endpoint = metadata?.endpoint || process.env.QDRANT_URL || 'http://localhost:6333';
      const response = await fetch(`${endpoint}/collections`, {
        headers: apiKey ? { 'api-key': apiKey } : {}
      });

      if (response.ok) {
        await this.updateLastValidated('qdrant');
        return { success: true, message: 'Qdrant connection successful' };
      } else {
        return { success: false, message: 'Failed to connect to Qdrant' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Aggiorna timestamp ultima validazione
   */
  private async updateLastValidated(service: string): Promise<void> {
    try {
      const query = `
        UPDATE smartdocs.api_keys 
        SET last_validated_at = NOW(), last_used_at = NOW()
        WHERE service = $1
      `;
      await this.db.query(query, [service]);
    } catch (error) {
      logger.error('Error updating last validated:', error);
    }
  }

  /**
   * Aggiorna timestamp ultimo utilizzo
   */
  async updateLastUsed(service: string): Promise<void> {
    try {
      const query = 'UPDATE smartdocs.api_keys SET last_used_at = NOW() WHERE service = $1';
      await this.db.query(query, [service]);
    } catch (error) {
      logger.error('Error updating last used:', error);
    }
  }
}
