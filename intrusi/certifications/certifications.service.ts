import api from '../api';

// 📝 Tipo certificazione dal database ProfessionalCertification
export interface ProfessionalCertification {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  validUntil: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// 📝 Tipo per creazione certificazione
export interface CreateCertificationData {
  name: string;
  issuer: string;
  validUntil?: string;
  isVerified?: boolean;
}

// 📝 Tipo per aggiornamento certificazione
export interface UpdateCertificationData {
  name?: string;
  issuer?: string;
  validUntil?: string;
  isVerified?: boolean;
}

class CertificationsService {
  
  /**
   * 🔍 Ottiene tutte le certificazioni di un professionista
   */
  async getCertifications(professionalId: string) {
    try {
      const response = await api.get(`/professionals/${professionalId}/certifications`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Errore nel caricamento certificazioni:', error);
      throw new Error(error.response?.data?.message || 'Errore nel caricamento delle certificazioni');
    }
  }

  /**
   * ➕ Crea una nuova certificazione
   */
  async createCertification(professionalId: string, data: CreateCertificationData) {
    try {
      const response = await api.post(`/professionals/${professionalId}/certifications`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Errore nella creazione certificazione:', error);
      throw new Error(error.response?.data?.message || 'Errore nella creazione della certificazione');
    }
  }

  /**
   * ✏️ Aggiorna una certificazione esistente  
   */
  async updateCertification(
    professionalId: string, 
    certificationId: string, 
    data: UpdateCertificationData
  ) {
    try {
      const response = await api.put(
        `/professionals/${professionalId}/certifications/${certificationId}`, 
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Errore nell\'aggiornamento certificazione:', error);
      throw new Error(error.response?.data?.message || 'Errore nell\'aggiornamento della certificazione');
    }
  }

  /**
   * 🗑️ Elimina una certificazione
   */
  async deleteCertification(professionalId: string, certificationId: string) {
    try {
      const response = await api.delete(`/professionals/${professionalId}/certifications/${certificationId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Errore nell\'eliminazione certificazione:', error);
      throw new Error(error.response?.data?.message || 'Errore nell\'eliminazione della certificazione');
    }
  }

  /**
   * ✅ Verifica una certificazione (solo admin)
   */
  async verifyCertification(professionalId: string, certificationId: string) {
    try {
      const response = await api.put(
        `/professionals/${professionalId}/certifications/${certificationId}`,
        { isVerified: true }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Errore nella verifica certificazione:', error);
      throw new Error(error.response?.data?.message || 'Errore nella verifica della certificazione');
    }
  }

  /**
   * 🚫 Rimuove verifica certificazione (solo admin)
   */
  async unverifyCertification(professionalId: string, certificationId: string) {
    try {
      const response = await api.put(
        `/professionals/${professionalId}/certifications/${certificationId}`,
        { isVerified: false }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Errore nella rimozione verifica:', error);
      throw new Error(error.response?.data?.message || 'Errore nella rimozione della verifica');
    }
  }
}

export const certificationsService = new CertificationsService();
export default certificationsService;