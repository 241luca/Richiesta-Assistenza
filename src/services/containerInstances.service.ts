import api from './api';

export interface ContainerInstance {
  id: string;
  template_code: string;
  owner_id: string; // Changed from number to string to support UUID
  owner_type: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
  name: string;
  description?: string;
  ai_prompt?: string;
  
  // AI Settings
  ai_model: string;
  ai_temperature: number;
  ai_max_tokens: number;
  ai_top_p: number;
  ai_frequency_penalty: number;
  ai_presence_penalty: number;
  
  // Knowledge Base and Memories
  knowledge_base_ids?: string[];
  memories_enabled?: boolean;
  memories_config?: Record<string, any>;
  
  // RAG Settings
  chunk_size: number;
  chunk_overlap: number;
  similarity_threshold: number;
  max_results: number;
  
  // Formati e Tipi
  allowed_formats: string[];
  document_types: string[];
  
  storage_path: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInstanceData {
  template_code: string;
  owner_id: string; // Changed from number to string to support UUID
  owner_type: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
  name: string;
  description?: string;
  ai_prompt?: string;
  ai_model?: string;
  ai_temperature?: number;
  ai_max_tokens?: number;
  allowed_formats?: string[];
  document_types?: string[];
  chunk_size?: number;
  chunk_overlap?: number;
}

export interface UpdateInstanceData {
  name?: string;
  description?: string;
  ai_prompt?: string;
  ai_model?: string;
  ai_temperature?: number;
  ai_max_tokens?: number;
  knowledge_base_ids?: string[];
  memories_enabled?: boolean;
  memories_config?: Record<string, any>;
  allowed_formats?: string[];
  document_types?: string[];
  chunk_size?: number;
  chunk_overlap?: number;
  is_active?: boolean;
}

class ContainerInstancesService {
  private basePath = '/smartdocs/instances';

  /**
   * Crea nuova istanza da template
   */
  async create(data: CreateInstanceData): Promise<ContainerInstance> {
    const response = await api.post(`${this.basePath}`, data);
    return response.data.data;
  }

  /**
   * Lista istanze con filtri
   */
  async list(params?: {
    owner_id?: string; // Changed from number to string to support UUID
    owner_type?: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
    template_code?: string;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ContainerInstance[]> {
    console.log('[containerInstancesService] list() called with params:', params);
    const response = await api.get(`${this.basePath}`, { params });
    console.log('[containerInstancesService] list() response:', response.data);
    return response.data.data;
  }

  /**
   * Ottieni istanza per ID
   */
  async getById(id: string): Promise<ContainerInstance> {
    const response = await api.get(`${this.basePath}/${id}`);
    return response.data.data;
  }

  /**
   * Aggiorna istanza
   */
  async update(id: string, data: UpdateInstanceData): Promise<ContainerInstance> {
    const response = await api.put(`${this.basePath}/${id}`, data);
    return response.data.data;
  }

  /**
   * Elimina istanza
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Statistiche istanza
   */
  async getStats(id: string): Promise<any> {
    const response = await api.get(`${this.basePath}/${id}/stats`);
    return response.data.data;
  }

  /**
   * Verifica ownership
   */
  async verifyOwnership(id: string, userId: string, userType: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN'): Promise<boolean> {
    const response = await api.post(`${this.basePath}/${id}/verify-ownership`, {
      user_id: userId,
      user_type: userType
    });
    return response.data.data.is_owner;
  }

  /**
   * Reset documenti, embeddings e chunks dell'istanza
   */
  async resetDocuments(id: string): Promise<any> {
    const response = await api.delete(`${this.basePath}/${id}/documents`);
    return response.data;
  }
}

export const containerInstancesService = new ContainerInstancesService();
export default containerInstancesService;
