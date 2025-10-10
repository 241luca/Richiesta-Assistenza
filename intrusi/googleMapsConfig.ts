/**
 * Google Maps Configuration Service
 * Carica dinamicamente la API key dal database invece che da .env
 * 
 * 🆕 v5.1.1: Sistema centralizzato per gestione Google Maps API
 */

import api from './api';

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

  private loadPromise: Promise<string> | null = null;

  /**
   * Carica la API key dal database
   * Usa cache per non ricaricare ogni volta
   */
  async getApiKey(): Promise<string> {
    // Se già caricata, ritorna subito
    if (this.config.loaded && this.config.apiKey) {
      return this.config.apiKey;
    }

    // Se sta già caricando, aspetta quella promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Avvia nuovo caricamento
    this.config.loading = true;
    this.config.error = null;

    this.loadPromise = this.fetchApiKey();

    try {
      const apiKey = await this.loadPromise;
      this.config.apiKey = apiKey;
      this.config.loaded = true;
      this.config.loading = false;
      return apiKey;
    } catch (error: any) {
      this.config.loading = false;
      this.config.error = error.message || 'Failed to load Google Maps API key';
      throw error;
    } finally {
      this.loadPromise = null;
    }
  }

  /**
   * Fetch API key dal backend
   */
  private async fetchApiKey(): Promise<string> {
    try {
      // Usa axios direttamente invece di api per evitare interceptor
      const response = await fetch('http://localhost:3200/api/public/config/google-maps-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data?.apiKey) {
        throw new Error('Invalid API response format');
      }

      console.log('✅ Google Maps API Key loaded from database');
      return data.data.apiKey;
    } catch (error: any) {
      console.error('❌ Failed to load Google Maps API Key:', error);
      throw new Error('Could not load Google Maps API key from server');
    }
  }

  /**
   * Carica lo script Google Maps con la API key
   * Ritorna una Promise che si risolve quando lo script è caricato
   */
  async loadGoogleMapsScript(): Promise<void> {
    // Se lo script è già caricato, non fare nulla
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps already loaded');
      return;
    }

    // Se lo script è già nel DOM, aspetta che si carichi
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      return new Promise((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Script failed to load')));
      });
    }

    // Carica API key
    const apiKey = await this.getApiKey();

    // Crea e carica lo script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=it&region=IT`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully');
        resolve();
      };

      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script');
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Resetta la configurazione (utile per testing)
   */
  reset() {
    this.config = {
      apiKey: '',
      loaded: false,
      loading: false,
      error: null
    };
    this.loadPromise = null;
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
