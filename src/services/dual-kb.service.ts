import api from './api';

export interface KnowledgeBase {
  kbProfessional?: any;
  kbClient?: any;
  kbEmergency?: any;
}

export interface SanitizationTestRequest {
  text: string;
  mode?: 'CLIENT' | 'PROFESSIONAL';
}

export const dualKbService = {
  /**
   * Recupera la Knowledge Base duale per una sottocategoria.
   */
  async getKnowledgeBase(subcategoryId: string): Promise<KnowledgeBase | null> {
    if (!subcategoryId) return null;
    const response = await api.get(`/professional/whatsapp/kb/${subcategoryId}`);
    return response.data?.data || response.data;
  },

  /**
   * Aggiorna la KB per i professionisti (modalità PROFESSIONAL).
   */
  async updateProfessionalKB(subcategoryId: string, kb: any) {
    const response = await api.put(`/professional/whatsapp/kb/${subcategoryId}/professional`, {
      kb,
    });
    return response.data;
  },

  /**
   * Aggiorna la KB per i clienti (modalità CLIENT).
   */
  async updateClientKB(subcategoryId: string, kb: any) {
    const response = await api.put(`/professional/whatsapp/kb/${subcategoryId}/client`, {
      kb,
    });
    return response.data;
  },

  /**
   * Esegue un test di sanitizzazione del testo per la modalità specificata.
   */
  async testSanitization({ text, mode = 'CLIENT' }: SanitizationTestRequest) {
    const response = await api.post('/professional/whatsapp/test-sanitization', {
      text,
      mode,
    });
    return response.data;
  },
};

export default dualKbService;