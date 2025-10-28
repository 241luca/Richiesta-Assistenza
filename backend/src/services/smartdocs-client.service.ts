import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

interface SmartDocsConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

interface IngestDocumentParams {
  type: string;
  title: string;
  content: string;
  containerId?: string;
  metadata?: Record<string, any>;
}

interface QueryParams {
  question: string;
  containerId?: string;
  limit?: number;
  threshold?: number;
}

interface ClassifyParams {
  content: string;
  types?: string[];
}

interface ExtractParams {
  content: string;
  schema?: Record<string, any>;
}

interface Container {
  id: string;
  type: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Client per comunicare con SmartDocs API
 * Gestisce l'integrazione tra Richiesta Assistenza e SmartDocs
 */
export class SmartDocsClientService {
  private client: AxiosInstance;
  private enabled: boolean = false;
  private initPromise: Promise<void>;

  constructor(config?: SmartDocsConfig) {
    const baseURL = config?.baseURL || process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
    const timeout = config?.timeout || 30000;

    // Inizializza controllo abilitazione da database
    this.initPromise = this.checkEnabled();

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // Request interceptor per logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('[SmartDocs] Request', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('[SmartDocs] Request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor per logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info('[SmartDocs] Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('[SmartDocs] Response error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Ricarica lo stato del modulo dal database
   * Utile dopo abilitazione/disabilitazione
   */
  async reloadStatus(): Promise<void> {
    await this.checkEnabled();
  }

  /**
   * Controlla se SmartDocs è abilitato nel database
   */
  private async checkEnabled(): Promise<void> {
    try {
      const module = await prisma.systemModule.findUnique({
        where: { code: 'smartdocs' }
      });
      this.enabled = module?.isEnabled ?? false;
      logger.info('[SmartDocs] Module status checked', { enabled: this.enabled });
    } catch (error) {
      logger.error('[SmartDocs] Error checking module status:', error);
      this.enabled = false;
    }
  }

  /**
   * Verifica se SmartDocs è abilitato
   */
  async isEnabled(): Promise<boolean> {
    await this.initPromise;
    return this.enabled;
  }

  /**
   * Health check di SmartDocs
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('[SmartDocs] Health check failed', error);
      throw error;
    }
  }

  // ============================================================================
  // CONTAINERS
  // ============================================================================

  /**
   * Crea un nuovo container
   */
  async createContainer(data: {
    type: string;
    name: string;
    description?: string;
    ai_prompt?: string;
    metadata?: Record<string, any>;
  }): Promise<Container> {
    await this.initPromise;
    
    if (!this.enabled) {
      throw new Error('SmartDocs is not enabled');
    }

    const response = await this.client.post('/api/containers', data);
    return response.data.data;
  }

  /**
   * Lista containers
   */
  async listContainers(params?: {
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Container[]> {
    await this.initPromise;
    
    if (!this.enabled) {
      return [];
    }

    const response = await this.client.get('/api/containers', { params });
    return response.data.data;
  }

  /**
   * Ottieni container per ID
   */
  async getContainer(id: string): Promise<Container> {
    const response = await this.client.get(`/api/containers/${id}`);
    return response.data.data;
  }

  /**
   * Statistiche container
   */
  async getContainerStats(id: string): Promise<any> {
    const response = await this.client.get(`/api/containers/${id}/stats`);
    return response.data.data;
  }

  /**
   * Aggiorna container
   */
  async updateContainer(id: string, updates: {
    name?: string;
    description?: string;
    ai_prompt?: string;
  }): Promise<Container> {
    const response = await this.client.put(`/api/containers/${id}`, updates);
    return response.data.data;
  }

  /**
   * Elimina container
   */
  async deleteContainer(id: string): Promise<void> {
    await this.client.delete(`/api/containers/${id}`);
  }

  // ============================================================================
  // DOCUMENTS
  // ============================================================================

  /**
   * Ingest documento nel sistema SmartDocs
   * Genera embeddings e lo rende ricercabile
   */
  async ingestDocument(params: IngestDocumentParams): Promise<any> {
    await this.initPromise;
    
    if (!this.enabled) {
      logger.warn('[SmartDocs] Skipping ingest - service disabled');
      return null;
    }

    try {
      const response = await this.client.post('/api/ingest', params);
      logger.info('[SmartDocs] Document ingested successfully', {
        documentId: response.data.data.documentId,
        chunks: response.data.data.chunksProcessed
      });
      return response.data.data;
    } catch (error: any) {
      logger.error('[SmartDocs] Failed to ingest document', {
        error: error.message,
        type: params.type,
        title: params.title
      });
      throw error;
    }
  }

  /**
   * Query documenti usando RAG (Retrieval-Augmented Generation)
   */
  async query(params: QueryParams): Promise<any> {
    await this.initPromise;
    
    if (!this.enabled) {
      throw new Error('SmartDocs is not enabled');
    }

    try {
      const response = await this.client.post('/api/query', params);
      return response.data.data;
    } catch (error: any) {
      logger.error('[SmartDocs] Query failed', {
        error: error.message,
        question: params.question
      });
      throw error;
    }
  }

  /**
   * Classifica documento
   */
  async classify(params: ClassifyParams): Promise<any> {
    await this.initPromise;
    
    if (!this.enabled) {
      throw new Error('SmartDocs is not enabled');
    }

    const response = await this.client.post('/api/classify', params);
    return response.data.data;
  }

  /**
   * Estrai dati strutturati da documento
   */
  async extract(params: ExtractParams): Promise<any> {
    await this.initPromise;
    
    if (!this.enabled) {
      throw new Error('SmartDocs is not enabled');
    }

    const response = await this.client.post('/api/extract', params);
    return response.data.data;
  }

  // ============================================================================
  // HELPERS - Funzioni specifiche per Richiesta Assistenza
  // ============================================================================

  /**
   * Ingest rapportino intervento
   */
  async ingestInterventionReport(report: {
    id: string;
    title: string;
    description: string;
    notes?: string;
    professionalId: string;
    clientId: string;
    categoryId?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const content = `
RAPPORTINO INTERVENTO #${report.id}

Titolo: ${report.title}
Descrizione: ${report.description}
${report.notes ? `Note: ${report.notes}` : ''}

ID Professionista: ${report.professionalId}
ID Cliente: ${report.clientId}
${report.categoryId ? `ID Categoria: ${report.categoryId}` : ''}
    `.trim();

    return this.ingestDocument({
      type: 'intervention-report',
      title: `Rapportino #${report.id} - ${report.title}`,
      content,
      metadata: {
        ...report.metadata,
        reportId: report.id,
        professionalId: report.professionalId,
        clientId: report.clientId,
        ...(report.categoryId ? { categoryId: report.categoryId } : {})
      }
    });
  }

  /**
   * Ingest manuale o documento legale
   */
  async ingestManual(manual: {
    id: number;
    title: string;
    content: string;
    type: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.ingestDocument({
      type: 'manual',
      title: manual.title,
      content: manual.content,
      metadata: {
        ...manual.metadata,
        manualId: manual.id,
        manualType: manual.type
      }
    });
  }

  /**
   * Query rapida su knowledge base
   */
  async askQuestion(question: string, containerId?: string): Promise<string> {
    const result = await this.query({
      question,
      containerId,
      limit: 5,
      threshold: 0.7
    });

    return result.answer;
  }

  /**
   * Cerca documenti simili
   */
  async findSimilarDocuments(
    content: string,
    containerId?: string,
    limit: number = 5
  ): Promise<any[]> {
    const result = await this.query({
      question: content,
      containerId,
      limit
    });

    return result.sources || [];
  }
}

// Singleton instance
let smartDocsClientInstance: SmartDocsClientService | null = null;

/**
 * Ottieni istanza singleton del client SmartDocs
 */
export function getSmartDocsClient(): SmartDocsClientService {
  if (!smartDocsClientInstance) {
    smartDocsClientInstance = new SmartDocsClientService({
      baseURL: process.env.SMARTDOCS_API_URL || 'http://localhost:3500',
      apiKey: process.env.SMARTDOCS_API_KEY,
      timeout: 30000
    });
  }
  return smartDocsClientInstance;
}

export default SmartDocsClientService;
