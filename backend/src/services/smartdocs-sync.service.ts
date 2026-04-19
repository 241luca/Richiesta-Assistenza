import { logger } from '../utils/logger';

const SMARTDOCS_API_URL = process.env.SMARTDOCS_API_URL || 'http://localhost:3500';
const SOURCE_APP = 'richiesta_assistenza';

interface SyncEntityParams {
  containerId: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * SmartDocs Sync Service
 * Enterprise-grade service for syncing Richiesta Assistenza data to SmartDocs
 */
export class SmartDocsSyncService {
  
  /**
   * Sync an entity to SmartDocs
   */
  async syncEntity(params: SyncEntityParams): Promise<{
    success: boolean;
    documentId?: string;
    chunksCreated?: number;
  }> {
    const { containerId, entityType, entityId, title, content, metadata } = params;

    try {
      logger.info(`[SmartDocsSync] Syncing ${entityType} #${entityId} to container ${containerId}`);

      const response = await fetch(`${SMARTDOCS_API_URL}/api/sync/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          container_id: containerId,
          source_app: SOURCE_APP,
          source_type: 'auto_sync',
          entity_type: entityType,
          entity_id: entityId,
          title,
          content,
          metadata,
          auto_update: true
        })
      });

      const data: any = await response.json();

      if (data.success) {
        logger.info(`[SmartDocsSync] Successfully synced ${entityType} #${entityId} (${data.data.chunksCreated} chunks)`);
        return {
          success: true,
          documentId: data.data.documentId,
          chunksCreated: data.data.chunksCreated
        };
      } else {
        logger.error(`[SmartDocsSync] Sync failed:`, data.error);
        return { success: false };
      }

    } catch (error: any) {
      logger.error(`[SmartDocsSync] Error syncing ${entityType} #${entityId}:`, error instanceof Error ? error.message : String(error));
      return { success: false };
    }
  }

  /**
   * Delete entity from SmartDocs
   */
  async deleteEntity(containerId: string, entityType: string, entityId: string): Promise<boolean> {
    try {
      logger.info(`[SmartDocsSync] Deleting ${entityType} #${entityId} from container ${containerId}`);

      const response = await fetch(
        `${SMARTDOCS_API_URL}/api/sync/entity/${containerId}/${entityType}/${entityId}?source_app=${SOURCE_APP}`,
        { method: 'DELETE' }
      );

      const data: any = await response.json();

      if (data.success) {
        logger.info(`[SmartDocsSync] Successfully deleted ${entityType} #${entityId}`);
        return true;
      } else {
        logger.error(`[SmartDocsSync] Delete failed:`, data.error);
        return false;
      }

    } catch (error: any) {
      logger.error(`[SmartDocsSync] Error deleting ${entityType} #${entityId}:`, error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Get storage stats for a container
   */
  async getStorageStats(containerId: string): Promise<any> {
    try {
      const response = await fetch(`${SMARTDOCS_API_URL}/api/sync/stats/${containerId}`);
      const data: any = await response.json();

      if (data.success) {
        return data.data;
      }

      return null;

    } catch (error: any) {
      logger.error(`[SmartDocsSync] Error fetching stats:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Serialize a Request entity for SmartDocs ingestion
   */
  serializeRequest(request: any): string {
    const sections: string[] = [];

    // Header
    sections.push(`RICHIESTA ASSISTENZA #${request.id}`);
    sections.push(`Titolo: ${request.title || 'N/D'}`);
    sections.push(`Stato: ${request.status}`);
    sections.push(`Data Richiesta: ${request.requestedDate || request.createdAt}`);
    
    if (request.scheduledDate) {
      sections.push(`Data Programmata: ${request.scheduledDate}`);
    }

    sections.push('');

    // Client info
    if (request.client) {
      sections.push(`CLIENTE:`);
      sections.push(`Nome: ${request.client.firstName} ${request.client.lastName}`);
      if (request.client.email) sections.push(`Email: ${request.client.email}`);
      if (request.client.phone) sections.push(`Telefono: ${request.client.phone}`);
      sections.push('');
    }

    // Category
    if (request.category) {
      sections.push(`CATEGORIA: ${request.category.name}`);
      sections.push('');
    }

    // Description
    if (request.description) {
      sections.push(`DESCRIZIONE:`);
      sections.push(request.description);
      sections.push('');
    }

    // Internal notes (only if present)
    if (request.internalNotes) {
      sections.push(`NOTE INTERNE:`);
      sections.push(request.internalNotes);
      sections.push('');
    }

    // Chat messages
    if (request.chatMessages && request.chatMessages.length > 0) {
      sections.push(`CONVERSAZIONE (${request.chatMessages.length} messaggi):`);
      request.chatMessages.forEach((msg: any) => {
        const sender = msg.senderType === 'CLIENT' ? 'Cliente' : 'Professionista';
        const timestamp = new Date(msg.createdAt).toLocaleString('it-IT');
        sections.push(`[${timestamp}] ${sender}: ${msg.message}`);
      });
      sections.push('');
    }

    // Forms
    if (request.forms && request.forms.length > 0) {
      sections.push(`MODULI COMPILATI (${request.forms.length}):`);
      request.forms.forEach((form: any) => {
        sections.push(`- ${form.formTemplate?.name || 'Modulo'}`);
        if (form.formData) {
          const data = typeof form.formData === 'string' ? JSON.parse(form.formData) : form.formData;
          Object.entries(data).forEach(([key, value]) => {
            sections.push(`  ${key}: ${value}`);
          });
        }
      });
      sections.push('');
    }

    // Quote
    if (request.quote) {
      sections.push(`PREVENTIVO:`);
      sections.push(`Numero: ${request.quote.quoteNumber || 'N/D'}`);
      sections.push(`Totale: €${request.quote.total || 0}`);
      sections.push(`Stato: ${request.quote.status}`);
      if (request.quote.notes) {
        sections.push(`Note: ${request.quote.notes}`);
      }
      sections.push('');
    }

    // Intervention Report
    if (request.interventionReport) {
      sections.push(`RAPPORTO INTERVENTO:`);
      sections.push(`Stato: ${request.interventionReport.status}`);
      if (request.interventionReport.startTime) {
        sections.push(`Inizio: ${request.interventionReport.startTime}`);
      }
      if (request.interventionReport.endTime) {
        sections.push(`Fine: ${request.interventionReport.endTime}`);
      }
      if (request.interventionReport.description) {
        sections.push(`Descrizione: ${request.interventionReport.description}`);
      }
      if (request.interventionReport.notes) {
        sections.push(`Note: ${request.interventionReport.notes}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }
}

export const smartdocsSyncService = new SmartDocsSyncService();
