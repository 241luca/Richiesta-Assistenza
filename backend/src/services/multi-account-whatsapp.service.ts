import logger from '../utils/logger';
import { whatsappService } from './whatsapp-adapter.service';

type AddAccountInput = {
  sessionName: string;
  phoneNumber: string;
  description?: string;
  department?: string;
};

type MultiAccountStatus = {
  sessionName: string;
  phoneNumber: string;
  description?: string;
  department?: string;
  isConnected: boolean;
  hasQRCode: boolean;
  lastUpdated: string;
};

class MultiAccountService {
  private accounts: Map<string, Omit<MultiAccountStatus, 'isConnected' | 'hasQRCode' | 'lastUpdated'>> = new Map();

  /**
   * Aggiunge un nuovo account o aggiorna i metadati se già presente
   */
  async addAccount(input: AddAccountInput): Promise<MultiAccountStatus> {
    const { sessionName, phoneNumber, description, department } = input;

    // Memorizza metadati
    this.accounts.set(sessionName, { sessionName, phoneNumber, description, department });

    // Prova a creare/recuperare l'istanza provider per questa sessione
    let isConnected = false;
    let hasQRCode = false;
    try {
      await whatsappService.createInstance(sessionName);
      const status: any = await whatsappService.checkConnectionStatus(sessionName);
      isConnected = !!status?.connected;
      if (!isConnected) {
        const qr: any = await whatsappService.getQRCode(sessionName);
        hasQRCode = !!qr && !!(qr.qrCode || qr.base64 || qr.imageUrl);
      }
    } catch (err: any) {
      logger.warn(`MultiAccount: impossibile inizializzare la sessione '${sessionName}': ${err?.message || err}`);
    }

    return {
      sessionName,
      phoneNumber,
      description,
      department,
      isConnected,
      hasQRCode,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Restituisce lo stato di un singolo account
   */
  async getAccountStatus(sessionName: string): Promise<MultiAccountStatus | null> {
    const meta = this.accounts.get(sessionName);
    if (!meta) return null;

    let isConnected = false;
    let hasQRCode = false;
    try {
      const status: any = await whatsappService.checkConnectionStatus(sessionName);
      isConnected = !!status?.connected;
      if (!isConnected) {
        const qr: any = await whatsappService.getQRCode(sessionName);
        hasQRCode = !!qr && !!(qr.qrCode || qr.base64 || qr.imageUrl);
      }
    } catch (err: any) {
      logger.debug(`MultiAccount: errore status per '${sessionName}': ${err?.message || err}`);
    }

    return {
      ...meta,
      isConnected,
      hasQRCode,
      lastUpdated: new Date().toISOString(),
    } as MultiAccountStatus;
  }

  /**
   * Restituisce lo stato di tutti gli account presenti
   */
  async getAllAccountsStatus(): Promise<MultiAccountStatus[]> {
    const names = Array.from(this.accounts.keys());
    const results = await Promise.all(names.map((name) => this.getAccountStatus(name)));
    return results.filter((r): r is MultiAccountStatus => !!r);
  }

  /**
   * Invia un messaggio da una specifica sessione
   * Nota: l'adapter non espone instanceName su sendMessage; usiamo broadcast con singolo numero
   */
  async sendMessage(sessionName: string, to: string, message: string): Promise<any> {
    try {
      return await whatsappService.sendBroadcast([to], message, sessionName);
    } catch (err: any) {
      logger.error(`MultiAccount: errore invio da '${sessionName}' a '${to}': ${err?.message || err}`);
      throw err;
    }
  }
}

export const multiAccountService = new MultiAccountService();