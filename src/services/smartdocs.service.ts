import api from './api';

export interface Container {
  id: string;
  type: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface QueryResult {
  answer: string;
  sources: Array<{
    chunk_text: string;
    title: string;
    type: string;
    document_id: string;
    similarity: number;
  }>;
  metadata: {
    sourcesCount: number;
    threshold: number;
    question: string;
  };
}

export interface IngestResult {
  documentId: string;
  chunksProcessed: number;
  document: any;
}

export interface SyncJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  container_id?: string;
  entity_type?: string;
  entity_id?: string;
  source_type?: string;
  source_document_id?: string;
  created_at: string;
  updated_at?: string;
  error_message?: string;
  chunks_processed?: number;
  embeddings_generated?: number;
}

/**
 * Service per comunicare con SmartDocs tramite backend
 */
class SmartDocsService {
  private basePath = '/smartdocs';

  /**
   * Health check di SmartDocs
   */
  async healthCheck(): Promise<any> {
    const response = await api.get(`${this.basePath}/health`);
    return response.data;
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
    const finalParams = {
      type: params?.type ?? 'CONTAINER',
      search: params?.search,
      limit: params?.limit,
      offset: params?.offset,
    };
    const response = await api.get(`${this.basePath}/containers`, { params: finalParams });
    return response.data.data;
  }

  /**
   * Crea nuovo container
   */
  async createContainer(data: {
    type: string;
    name: string;
    description?: string;
    ai_prompt?: string;
    metadata?: Record<string, any>;
  }): Promise<Container> {
    const response = await api.post(`${this.basePath}/containers`, data);
    return response.data.data;
  }

  /**
   * Ottieni statistiche container
   */
  async getContainerStats(id: string): Promise<any> {
    const response = await api.get(`${this.basePath}/containers/${id}/stats`);
    return response.data.data;
  }

  /**
   * Aggiorna container
   */
  async updateContainer(id: string, data: {
    name?: string;
    description?: string;
    ai_prompt?: string;
  }): Promise<Container> {
    const response = await api.put(`${this.basePath}/containers/${id}`, data);
    return response.data.data;
  }

  /**
   * Elimina container
   */
  async deleteContainer(id: string): Promise<void> {
    await api.delete(`${this.basePath}/containers/${id}`);
  }

  /**
   * Ingest manuale/documento
   */
  async ingestManual(data: {
    title: string;
    content: string;
    type?: string;
    metadata?: Record<string, any>;
  }): Promise<IngestResult> {
    const response = await api.post(`${this.basePath}/ingest/manual`, data);
    return response.data.data;
  }

  /**
   * Ingest rapportino intervento
   */
  async ingestInterventionReport(reportId: number): Promise<IngestResult> {
    const response = await api.post(
      `${this.basePath}/ingest/intervention-report/${reportId}`
    );
    return response.data.data;
  }

  /**
   * Query con RAG
   */
  async query(params: {
    question: string;
    containerId?: string;
    limit?: number;
    threshold?: number;
  }): Promise<QueryResult> {
    const response = await api.post(`${this.basePath}/query`, params);
    return response.data.data;
  }

  /**
   * Query rapida - solo risposta
   */
  async ask(question: string, containerId?: string): Promise<string> {
    const response = await api.post(`${this.basePath}/ask`, {
      question,
      containerId
    });
    return response.data.answer;
  }

  /**
   * Classifica documento
   */
  async classify(content: string, types?: string[]): Promise<any> {
    const response = await api.post(`${this.basePath}/classify`, {
      content,
      types
    });
    return response.data.data;
  }

  /**
   * Estrai dati strutturati
   */
  async extract(content: string, schema?: Record<string, any>): Promise<any> {
    const response = await api.post(`${this.basePath}/extract`, {
      content,
      schema
    });
    return response.data.data;
  }

  /**
   * Batch ingest rapportini
   */
  async batchIngestInterventionReports(params: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<any> {
    const response = await api.post(
      `${this.basePath}/batch-ingest/intervention-reports`,
      params
    );
    return response.data.data;
  }

  /**
   * Lista dei sync jobs (proxy a SmartDocs API)
   */
  async listSyncJobs(params?: {
    status?: string;
    container_id?: string;
    entity_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const response = await api.get(`${this.basePath}/sync/jobs`, { params });
    // Gestione flessibile della risposta (proxy vs wrapper)
    return response.data?.data ?? response.data?.jobs ?? response.data;
  }

  /**
   * Retry di un sync job esistente
   */
  async retrySyncJob(id: string): Promise<any> {
    const response = await api.post(`${this.basePath}/sync/jobs/${id}/retry`);
    return response.data;
  }

  /**
   * Lista documenti per container (proxy backend)
   */
  async listContainerDocuments(containerId: string): Promise<any[]> {
    const response = await api.get(`${this.basePath}/documents/container/${containerId}`);
    // Alcuni proxy restituiscono `{ success, data }`
    return response.data?.data ?? response.data;
  }

  /**
   * Process/Reprocess documento (genera embeddings)
   */
  async processDocument(id: string): Promise<any> {
    const response = await api.post(`${this.basePath}/documents/${id}/process`);
    return response.data;
  }

  /**
   * Statistiche storage/sync del container (proxy backend)
   */
  async getStorageStats(containerId: string): Promise<any> {
    const response = await api.get(`${this.basePath}/storage/${containerId}`);
    return response.data?.data ?? response.data;
  }
}

export const smartDocsService = new SmartDocsService();
export default smartDocsService;
