import { smartdocsSyncService } from './smartdocs-sync.service';
import { smartDocsConfigService } from './smartdocs-config.service';
import prisma from '../config/database';
import { logger } from '../utils/logger';

/**
 * SmartDocs Auto-Sync Hooks
 * Automatically sync data changes to SmartDocs
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
          category: true,
          chatMessages: {
            orderBy: { createdAt: 'asc' },
            take: 50 // Last 50 messages
          },
          forms: {
            include: {
              formTemplate: true
            }
          },
          quote: true,
          interventionReport: true,
          professional: {
            include: {
              user: true
            }
          }
        }
      });

      if (!request || !request.professional) {
        logger.warn(`[SmartDocsHooks] Request ${requestId} not found or has no professional`);
        return;
      }

      // ✅ CHECK SYNC RULES BEFORE SYNCING
      const syncEnabled = await smartDocsConfigService.isSyncEnabledForRequest({
        request_id: parseInt(requestId),
        category_id: request.categoryId || undefined,
        subcategory_id: request.subcategoryId || undefined,
        user_id: request.professional.userId,
        user_type: 'professional'
      });

      if (!syncEnabled) {
        logger.info(`[SmartDocsHooks] Sync disabled for request ${requestId} - skipping`);
        return;
      }

      // Get professional's SmartDocs container
      const containerInstance = await prisma.containerInstance.findFirst({
        where: {
          userId: request.professional.userId,
          containerCategory: {
            slug: 'richieste-assistenza'
          }
        }
      });

      if (!containerInstance) {
        logger.warn(`[SmartDocsHooks] No SmartDocs container found for professional ${request.professional.userId}`);
        return;
      }

      // Serialize request data
      const content = smartdocsSyncService.serializeRequest(request);

      // Sync to SmartDocs
      await smartdocsSyncService.syncEntity({
        containerId: containerInstance.id,
        entityType: 'request',
        entityId: requestId,
        title: `Richiesta #${request.id} - ${request.title || 'N/D'}`,
        content,
        metadata: {
          status: request.status,
          client_name: `${request.client.firstName} ${request.client.lastName}`,
          category: request.category?.name,
          created_at: request.createdAt,
          updated_at: request.updatedAt
        }
      });

      logger.info(`[SmartDocsHooks] Successfully synced request ${requestId}`);

    } catch (error: any) {
      logger.error(`[SmartDocsHooks] Error syncing request ${requestId}:`, error.message);
    }
  }

  /**
   * Hook: After Request deleted
   */
  async onRequestDeleted(requestId: string, professionalUserId: string): Promise<void> {
    try {
      // Get professional's container
      const containerInstance = await prisma.containerInstance.findFirst({
        where: {
          userId: professionalUserId,
          containerCategory: {
            slug: 'richieste-assistenza'
          }
        }
      });

      if (!containerInstance) {
        return;
      }

      // Delete from SmartDocs
      await smartdocsSyncService.deleteEntity(
        containerInstance.id,
        'request',
        requestId
      );

    } catch (error: any) {
      logger.error(`[SmartDocsHooks] Error deleting request ${requestId}:`, error.message);
    }
  }

  /**
   * Hook: After chat message created
   * Re-sync entire request to update chat history
   */
  async onChatMessageCreated(messageId: string): Promise<void> {
    try {
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: {
          assistanceRequest: {
            include: {
              professional: true
            }
          }
        }
      });

      if (!message || !message.assistanceRequest || !message.assistanceRequest.professional) {
        return;
      }

      // ✅ CHECK IF CHAT SYNC IS ENABLED
      const userConfig = await smartDocsConfigService.getUserSyncConfig(
        message.assistanceRequest.professional.userId,
        'professional'
      );

      if (!userConfig || !userConfig.sync_chats) {
        logger.info(`[SmartDocsHooks] Chat sync disabled for user ${message.assistanceRequest.professional.userId} - skipping`);
        return;
      }

      // Re-sync the entire request
      await this.onRequestChanged(message.assistanceRequest.id);

    } catch (error: any) {
      logger.error(`[SmartDocsHooks] Error syncing chat message ${messageId}:`, error.message);
    }
  }

  /**
   * Hook: After professional profile updated
   */
  async onProfessionalProfileUpdated(userId: string): Promise<void> {
    try {
      // ✅ CHECK IF PROFILE SYNC IS ENABLED
      const userConfig = await smartDocsConfigService.getUserSyncConfig(userId, 'professional');
      
      if (!userConfig || !userConfig.sync_profiles) {
        logger.info(`[SmartDocsHooks] Profile sync disabled for user ${userId} - skipping`);
        return;
      }

      const professional = await prisma.professional.findUnique({
        where: { userId },
        include: {
          user: true,
          categories: {
            include: {
              category: true
            }
          },
          skills: true
        }
      });

      if (!professional) {
        return;
      }

      // Get container
      const containerInstance = await prisma.containerInstance.findFirst({
        where: {
          userId,
          containerCategory: {
            slug: 'richieste-assistenza'
          }
        }
      });

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
        title: `Profilo Professionista - ${professional.user.firstName} ${professional.user.lastName}`,
        content,
        metadata: {
          professional_id: professional.id,
          categories: professional.categories.map((c: any) => c.category.name)
        }
      });

      logger.info(`[SmartDocsHooks] Successfully synced profile for user ${userId}`);

    } catch (error: any) {
      logger.error(`[SmartDocsHooks] Error syncing professional profile ${userId}:`, error.message);
    }
  }

  /**
   * Serialize professional profile
   */
  private serializeProfessionalProfile(professional: any): string {
    const sections: string[] = [];

    sections.push(`PROFILO PROFESSIONISTA`);
    sections.push(`Nome: ${professional.user.firstName} ${professional.user.lastName}`);
    
    if (professional.user.email) {
      sections.push(`Email: ${professional.user.email}`);
    }
    
    if (professional.user.phone) {
      sections.push(`Telefono: ${professional.user.phone}`);
    }

    sections.push('');

    // Categories
    if (professional.categories && professional.categories.length > 0) {
      sections.push(`CATEGORIE DI COMPETENZA:`);
      professional.categories.forEach((pc: any) => {
        sections.push(`- ${pc.category.name}`);
      });
      sections.push('');
    }

    // Skills
    if (professional.skills && professional.skills.length > 0) {
      sections.push(`COMPETENZE:`);
      professional.skills.forEach((skill: any) => {
        sections.push(`- ${skill.name}: ${skill.description || 'N/D'}`);
      });
      sections.push('');
    }

    // Bio
    if (professional.bio) {
      sections.push(`BIOGRAFIA:`);
      sections.push(professional.bio);
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Initialize SmartDocs container for a professional
   * Creates container if it doesn't exist
   */
  async initializeProfessionalContainer(userId: string): Promise<string | null> {
    try {
      // Check if container already exists
      let containerInstance = await prisma.containerInstance.findFirst({
        where: {
          userId,
          containerCategory: {
            slug: 'richieste-assistenza'
          }
        }
      });

      if (containerInstance) {
        return containerInstance.id;
      }

      // Get or create category
      let category = await prisma.containerCategory.findFirst({
        where: { slug: 'richieste-assistenza' }
      });

      if (!category) {
        category = await prisma.containerCategory.create({
          data: {
            name: 'Richieste Assistenza',
            slug: 'richieste-assistenza',
            description: 'Container per gestione richieste assistenza con AI',
            isActive: true,
            allowedDocTypes: ['request', 'chat', 'quote', 'report', 'profile', 'form']
          }
        });
      }

      // Create container instance
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return null;
      }

      containerInstance = await prisma.containerInstance.create({
        data: {
          userId,
          categoryId: category.id,
          name: `Richieste - ${user.firstName} ${user.lastName}`,
          description: 'Knowledge base automatica delle richieste assistenza',
          isActive: true,
          settings: {
            auto_sync: true,
            sync_entities: ['request', 'chat', 'quote', 'report', 'profile']
          },
          aiModel: 'gpt-4',
          aiTemperature: 0.3,
          aiMaxTokens: 1000,
          aiPrompt: `Sei un assistente AI per la gestione delle richieste di assistenza.
Rispondi in modo professionale e preciso basandoti SOLO sulle informazioni nel contesto.

CONTESTO:
{context}

DOMANDA: {question}

Fornisci una risposta dettagliata e utile.`,
          chunkSize: 1000,
          chunkOverlap: 200
        }
      });

      logger.info(`[SmartDocsHooks] Created container ${containerInstance.id} for user ${userId}`);

      return containerInstance.id;

    } catch (error: any) {
      logger.error(`[SmartDocsHooks] Error initializing container for user ${userId}:`, error.message);
      return null;
    }
  }
}

export const smartdocsHooksService = new SmartDocsHooksService();
