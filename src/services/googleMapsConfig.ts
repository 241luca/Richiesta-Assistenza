/**
 * Google Maps Configuration Service - Versione Frontend
 * Configurazione semplificata per il frontend senza dipendenze backend
 */

interface GoogleMapsConfig {
  apiKey: string;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

class GoogleMapsConfigService {
  private config: GoogleMapsConfig = {
    apiKey: '',
    loaded: false,
    loading: false,
    error: null
  };

  /**
   * Imposta la API key (da chiamare quando si ottiene dal backend)
   */
  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
    this.config.loaded = true;
    this.config.loading = false;
    this.config.error = null;
  }

  /**
   * Ottieni la API key corrente
   */
  getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Verifica se la configurazione è caricata
   */
  isLoaded(): boolean {
    return this.config.loaded;
  }

  /**
   * Imposta errore
   */
  setError(error: string) {
    this.config.error = error;
    this.config.loading = false;
  }

  /**
   * Resetta la configurazione
   */
  reset() {
    this.config = {
      apiKey: '',
      loaded: false,
      loading: false,
      error: null
    };
  }

  /**
   * Ottieni lo stato corrente
   */
  getStatus() {
    return { ...this.config };
  }
}

// Export singleton instance
export const googleMapsConfig = new GoogleMapsConfigService();

// Export anche come default
export default googleMapsConfig;