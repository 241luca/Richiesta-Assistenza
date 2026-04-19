import { smartdocsSyncService } from './smartdocs-sync.service';
import { smartDocsConfigService } from './smartdocs-config.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import type { Prisma } from '@prisma/client';

// Type alias for raw database access (documentContainer not in current schema)
type PrismaAny = typeof prisma & { [key: string]: any };
const prismaRaw = prisma as PrismaAny;

/**
 * SmartDocs Auto-Sync Hooks
 * Automatically sync data changes to SmartDocs
 * 
 * NOTE: This service requires SmartDocs models (containerInstance, containerCategory)
 * that are not currently in the Prisma schema. Functionality is disabled until
 * the schema is updated.
 */
export class SmartDocsHooksService {

  /**
   * Hook: After Request created/updated
   */
  async onRequestChanged(requestId: string): Promise<void> {
    try {
      // Fetch complete request data
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: {
          client: true,
          Category: true,
          professional: true
        }
      });

      if (!request || !request.professionalId) {
        logger.warn(`[SmartDocsHooks] Request ${requestId} not found or has no professional`);
        return;
      }

      // Get professional data
      const professional = await prisma.user.findUnique({
        where: { id: request.professionalId }
      });

      if (!professional) {
        logger.warn(`[SmartDocsHooks] Professional not found for request ${requestId}`);
        return;
      }

      // ✅ CHECK SYNC RULES BEFORE SYNCING
      const syncEnabled = await smartDocsConfigService.isSyncEnabledForRequest({
        request_id: requestId as unknown as number,
        category_id: (request.categoryId || undefined) as unknown as number | undefined,
        subcategory_id: (request.subcategoryId || undefined) as unknown as number | undefined,
        user_id: request.professionalId as unknown as number,
        user_type: 'professional'
      });

      if (!syncEnabled) {
        logger.info(`[SmartDocsHooks] Sync disabled for request ${requestId} - skipping`);
        return;
      }

      // NOTE: containerInstance model not available in current schema
      // Get professional's SmartDocs container using documentContainer
      const containerInstance = await prismaRaw.documentContainer?.findFirst?.({
        where: {
          ownerId: request.professionalId,
          ownerType: 'PROFESSIONAL'
        }
      }) as { id: string } | null;

      if (!containerInstance) {
        logger.warn(`[SmartDocsHooks] No SmartDocs container found for professional ${request.professionalId}`);
        return;
      }

      // Serialize request data
      const content = smartdocsSyncService.serializeRequest(request);

      // Get client name - access the included relation
      const clientData = request.client as { firstName?: string; lastName?: string } | null;
      const clientName = clientData 
        ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim()
        : 'N/D';

      // Get category name - access the included relation
      const categoryData = request.Category as { name?: string } | null;

      // Sync to SmartDocs
      await smartdocsSyncService.syncEntity({
        containerId: containerInstance.id,
        entityType: 'request',
        entityId: requestId,
        title: `Richiesta #${request.id} - ${request.title || 'N/D'}`,
        content,
        metadata: {
          status: request.status,
          client_name: clientName,
          category: categoryData?.name || 'N/D',
          created_at: request.createdAt,
          updated_at: request.updatedAt
        }
      });

      logger.info(`[SmartDocsHooks] Successfully synced request ${requestId}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error);
      logger.error(`[SmartDocsHooks] Error syncing request ${requestId}:`, errorMessage);
    }
  }

  /**
   * Hook: After Request deleted
   */
  async onRequestDeleted(requestId: string, professionalUserId: string): Promise<void> {
    try {
      // Get professional's container using documentContainer
      const containerInstance = await prismaRaw.documentContainer?.findFirst?.({
        where: {
          ownerId: professionalUserId,
          ownerType: 'PROFESSIONAL'
        }
      }) as { id: string } | null;

      if (!containerInstance) {
        return;
      }

      // Delete from SmartDocs
      await smartdocsSyncService.deleteEntity(
        containerInstance.id,
        'request',
        requestId
      );

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error);
      logger.error(`[SmartDocsHooks] Error deleting request ${requestId}:`, errorMessage);
    }
  }

  /**
   * Hook: After chat message created
   * Re-sync entire request to update chat history
   */
  async onChatMessageCreated(messageId: string): Promise<void> {
    try {
      const chatMessage = await prisma.requestChatMessage.findUnique({
        where: { id: messageId }
      });

      if (!chatMessage) {
        return;
      }

      // Fetch the related request separately
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: chatMessage.requestId }
      });

      if (!request || !request.professionalId) {
        return;
      }

      // ✅ CHECK IF CHAT SYNC IS ENABLED
      const userConfig = await smartDocsConfigService.getUserSyncConfig(
        request.professionalId,
        'professional'
      );

      if (!userConfig || !(userConfig as Record<string, unknown>).sync_chats) {
        logger.info(`[SmartDocsHooks] Chat sync disabled for user ${request.professionalId} - skipping`);
        return;
      }

      // Re-sync the entire request
      await this.onRequestChanged(request.id);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error);
      logger.error(`[SmartDocsHooks] Error syncing chat message ${messageId}:`, errorMessage);
    }
  }

  /**
   * Hook: After professional profile updated
   */
  async onProfessionalProfileUpdated(userId: string): Promise<void> {
    try {
      // ✅ CHECK IF PROFILE SYNC IS ENABLED
      const userConfig = await smartDocsConfigService.getUserSyncConfig(userId, 'professional');
      
      if (!userConfig || !(userConfig as Record<string, unknown>).sync_profiles) {
        logger.info(`[SmartDocsHooks] Profile sync disabled for user ${userId} - skipping`);
        return;
      }

      const professional = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!professional) {
        return;
      }

      // Get container using documentContainer
      const containerInstance = await prismaRaw.documentContainer?.findFirst?.({
        where: {
          ownerId: userId,
          ownerType: 'PROFESSIONAL'
        }
      }) as { id: string } | null;

      if (!containerInstance) {
        return;
      }

      // Serialize profile
      const content = this.serializeProfessionalProfile(professional);

      // Sync to SmartDocs
      await smartdocsSyncService.syncEntity({
        containerId: containerInstance.id,
        entityType: 'profile',
        entityId: userId,
        title: `Profilo Professionista - ${professional.firstName} ${professional.lastName}`,
        content,
        metadata: {
          professional_id: professional.id,
          categories: []
        }
      });

      logger.info(`[SmartDocsHooks] Successfully synced profile for user ${userId}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error);
      logger.error(`[SmartDocsHooks] Error syncing professional profile ${userId}:`, errorMessage);
    }
  }

  /**
   * Serialize professional profile
   */
  private serializeProfessionalProfile(professional: { firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null }): string {
    const sections: string[] = [];

    sections.push(`PROFILO PROFESSIONISTA`);
    sections.push(`Nome: ${professional.firstName || ''} ${professional.lastName || ''}`);
    
    if (professional.email) {
      sections.push(`Email: ${professional.email}`);
    }
    
    if (professional.phone) {
      sections.push(`Telefono: ${professional.phone}`);
    }

    sections.push('');

    return sections.join('\n');
  }

  /**
   * Initialize SmartDocs container for a professional
   * Creates container if it doesn't exist
   */
  async initializeProfessionalContainer(userId: string): Promise<string | null> {
    try {
      // Check if container already exists using documentContainer
      let containerInstance = await prismaRaw.documentContainer?.findFirst?.({
        where: {
          ownerId: userId,
          ownerType: 'PROFESSIONAL'
        }
      }) as { id: string } | null;

      if (containerInstance) {
        return containerInstance.id;
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return null;
      }

      // Create container instance using documentContainer
      containerInstance = await prismaRaw.documentContainer?.create?.({
        data: {
          ownerId: userId,
          ownerType: 'PROFESSIONAL',
          name: `Richieste - ${user.firstName} ${user.lastName}`,
          description: 'Knowledge base automatica delle richieste assistenza',
          aiEnabled: true,
          aiModel: 'gpt-4',
          aiPrompt: `Sei un assistente AI per la gestione delle richieste di assistenza.
Rispondi in modo professionale e preciso basandoti SOLO sulle informazioni nel contesto.

CONTESTO:
{context}

DOMANDA: {question}

Fornisci una risposta dettagliata e utile.`,
          ragEnabled: true,
          ragChunkSize: 1000,
          ragOverlap: 200
        }
      }) as { id: string } | null;

      if (!containerInstance) {
        throw new Error('Failed to create container');
      }

      logger.info(`[SmartDocsHooks] Created container ${containerInstance.id} for user ${userId}`);

      return containerInstance.id;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error);
      logger.error(`[SmartDocsHooks] Error initializing container for user ${userId}:`, errorMessage);
      return null;
    }
  }
}

export const smartdocsHooksService = new SmartDocsHooksService();
