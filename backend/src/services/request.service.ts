/**
 * Request Service
 * Gestione completa delle richieste di assistenza
 * 
 * Responsabilità:
 * - CRUD operazioni su richieste assistenza
 * - Gestione stato e workflow richieste
 * - Assegnazione professionisti
 * - Calcolo distanze per professionisti
 * - Notifiche eventi richiesta
 * - Gestione allegati e preventivi
 * 
 * @module services/request
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { GoogleMapsService } from './googleMaps.service';

/**
 * Request Service Class
 * 
 * Gestisce il ciclo di vita completo delle richieste di assistenza:
 * creazione, aggiornamento, assegnazione, notifiche e cancellazione.
 */
export class RequestService {
  
  /**
   * Recupera tutte le richieste con filtri opzionali
   * 
   * @param {Object} filters - Filtri di ricerca
   * @param {string} filters.status - Stato richiesta (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
   * @param {string} filters.priority - Priorità (LOW, MEDIUM, HIGH, URGENT)
   * @param {string} filters.category - ID categoria
   * @param {string} filters.clientId - ID cliente
   * @param {string} filters.professionalId - ID professionista
   * @param {string} filters.search - Testo ricerca in title/description
   * @param {string} filters.userId - ID utente corrente
   * @param {string} filters.userRole - Ruolo utente (per calcolo distanze)
   * @returns {Promise<Array>} Lista richieste con dati correlati
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const requests = await requestService.findAll({ status: 'PENDING' });
   */
  async findAll(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    clientId?: string;
    professionalId?: string;
    search?: string;
    userId?: string;
    userRole?: string;
  }) {
    try {
      logger.info('[RequestService] Fetching requests with filters:', filters);
      
      const where: Prisma.AssistanceRequestWhereInput = {};

      // Costruzione filtri WHERE
      if (filters?.status) {
        where.status = filters.status as any;
      }
      if (filters?.priority) {
        where.priority = filters.priority as any;
      }
      if (filters?.category) {
        where.categoryId = filters.category;
      }
      if (filters?.clientId) {
        where.clientId = filters.clientId;
      }
      if (filters?.professionalId) {
        where.professionalId = filters.professionalId;
      }
      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Query principale con include ottimizzato
      const requests = await prisma.assistanceRequest.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
              profession: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          subcategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          RequestAttachment: true,
          quotes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calcolo distanze per professionisti
      let requestsWithDistance = requests;
      if (filters?.userRole === 'PROFESSIONAL' && filters?.userId) {
        requestsWithDistance = await this.addDistancesToRequests(requests, filters.userId);
      }

      logger.info(`[RequestService] Found ${requestsWithDistance.length} requests`);
      return requestsWithDistance;
      
    } catch (error) {
      logger.error('[RequestService] Error fetching requests:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiunge informazioni di distanza alle richieste per un professionista
   * 
   * @private
   * @param {Array} requests - Lista richieste
   * @param {string} professionalId - ID professionista
   * @returns {Promise<Array>} Richieste con distanza calcolata
   */
  private async addDistancesToRequests(requests: any[], professionalId: string) {
    try {
      logger.info(`[RequestService] Calculating distances for professional: ${professionalId}`);
      
      const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          address: true,
          city: true,
          province: true,
          postalCode: true,
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true,
          useResidenceAsWorkAddress: true,
        }
      });

      if (!professional) {
        logger.warn(`[RequestService] Professional not found: ${professionalId}`);
        return requests;
      }

      // Determina indirizzo da usare (lavoro o residenza)
      const professionalAddress = (!professional.useResidenceAsWorkAddress && professional.workAddress)
        ? `${professional.workAddress}, ${professional.workCity} ${professional.workProvince} ${professional.workPostalCode}`
        : `${professional.address}, ${professional.city} ${professional.province} ${professional.postalCode}`;

      // Calcolo distanze in parallelo
      const requestsWithDistance = await Promise.all(
        requests.map(async (request) => {
          try {
            const requestAddress = `${request.address}, ${request.city} ${request.province} ${request.postalCode}`;
            
            const distanceData = await GoogleMapsService.calculateDistance(
              professionalAddress,
              requestAddress
            );

            if (distanceData) {
              return {
                ...request,
                distance: distanceData.distance,
                distanceText: `${distanceData.distance.toFixed(1)} km`,
                duration: distanceData.duration,
                durationText: distanceData.duration 
                  ? `${Math.round(distanceData.duration / 60)} min`
                  : undefined,
              };
            }
          } catch (error) {
            logger.warn(`[RequestService] Could not calculate distance for request ${request.id}:`, error);
          }
          
          return request;
        })
      );

      // Ordinamento per distanza
      const sorted = requestsWithDistance.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        if (a.distance) return -1;
        if (b.distance) return 1;
        return 0;
      });

      logger.info(`[RequestService] Distances calculated for ${sorted.filter(r => r.distance).length} requests`);
      return sorted;
      
    } catch (error) {
      logger.error('[RequestService] Error adding distances:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        professionalId
      });
      return requests;
    }
  }

  /**
   * Recupera una singola richiesta per ID
   * 
   * @param {string} id - ID richiesta
   * @returns {Promise<Object|null>} Richiesta con tutti i dettagli o null
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const request = await requestService.findById('uuid-123');
   */
  async findById(id: string) {
    try {
      logger.info(`[RequestService] Fetching request by ID: ${id}`);
      
      const request = await prisma.assistanceRequest.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
              profession: true,
            },
          },
          category: true,
          subcategory: true,
          quotes: {
            include: {
              professional: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true,
                  profession: true,
                },
              },
              items: true,
            },
          },
          RequestAttachment: true,
        },
      });

      if (!request) {
        logger.warn(`[RequestService] Request not found: ${id}`);
        return null;
      }

      logger.info(`[RequestService] Request found: ${id}`);
      return request;
      
    } catch (error) {
      logger.error('[RequestService] Error fetching request by ID:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Crea una nuova richiesta di assistenza
   * 
   * @param {Object} data - Dati richiesta
   * @param {string} data.title - Titolo richiesta
   * @param {string} data.description - Descrizione dettagliata
   * @param {string} data.categoryId - ID categoria
   * @param {string} data.subcategoryId - ID sottocategoria (opzionale)
   * @param {string} data.priority - Priorità (LOW, MEDIUM, HIGH, URGENT)
   * @param {string} data.address - Indirizzo intervento
   * @param {string} data.city - Città
   * @param {string} data.province - Provincia
   * @param {string} data.postalCode - CAP
   * @param {string} data.clientId - ID cliente
   * @param {string} data.requestedDate - Data richiesta (opzionale)
   * @param {string} data.notes - Note pubbliche (opzionale)
   * @returns {Promise<Object>} Richiesta creata
   * @throws {Error} Se creazione fallisce
   * 
   * @example
   * const request = await requestService.create({
   *   title: 'Riparazione impianto',
   *   description: 'Dettagli...',
   *   categoryId: 'cat-123',
   *   priority: 'HIGH',
   *   clientId: 'user-456'
   * });
   */
  async create(data: {
    title: string;
    description: string;
    categoryId: string;
    subcategoryId?: string;
    priority: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    requestedDate?: string;
    notes?: string;
    clientId: string;
  }) {
    try {
      logger.info('[RequestService] Creating new request:', { 
        title: data.title, 
        clientId: data.clientId 
      });
      
      // Prepara dati per creazione
      const createData: any = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        clientId: data.clientId,
        address: data.address,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        status: 'PENDING',
        priority: data.priority as any,
        requestedDate: data.requestedDate ? new Date(data.requestedDate) : undefined,
        publicNotes: data.notes,
      };

      // Rimuovi campi undefined
      Object.keys(createData).forEach(key => {
        if (createData[key] === undefined) {
          delete createData[key];
        }
      });

      // Creazione richiesta
      const request = await prisma.assistanceRequest.create({
        data: createData,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          category: true,
          subcategory: true,
        },
      });

      logger.info(`[RequestService] Request created successfully: ${request.id}`);

      // Invio notifiche (non-blocking)
      try {
        await this._sendNewRequestNotifications(request, data);
      } catch (notificationError) {
        logger.error('[RequestService] Error sending notifications for new request:', notificationError);
        // Non blocca il flusso se notifiche falliscono
      }

      return request;
      
    } catch (error) {
      logger.error('[RequestService] Error creating request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        title: data.title,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Invia notifiche per nuova richiesta creata
   * 
   * @private
   * @param {Object} request - Richiesta creata
   * @param {Object} data - Dati originali
   */
  private async _sendNewRequestNotifications(request: any, data: any) {
    // Notifica amministratori
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });

    for (const admin of admins) {
      await notificationService.sendToUser({
        userId: admin.id,
        type: 'NEW_REQUEST',
        title: 'Nuova richiesta di assistenza',
        message: `Una nuova richiesta "${request.title}" è stata creata da ${request.client.fullName || request.client.email}`,
        priority: data.priority === 'URGENT' ? 'high' : 'normal',
        data: {
          requestId: request.id,
          clientName: request.client.fullName || request.client.email,
          category: request.category?.name,
          priority: request.priority
        },
        channels: ['websocket', 'email']
      });
    }

    // Notifica cliente
    await notificationService.sendToUser({
      userId: data.clientId,
      type: 'REQUEST_CREATED',
      title: 'Richiesta creata con successo',
      message: `La tua richiesta "${request.title}" è stata creata ed è in attesa di assegnazione`,
      data: {
        requestId: request.id,
        status: request.status
      },
      channels: ['websocket']
    });

    // Broadcast real-time event
    notificationService.broadcast('request:created', {
      request: request,
      timestamp: new Date()
    });
  }

  /**
   * Aggiorna una richiesta esistente
   * 
   * @param {string} id - ID richiesta
   * @param {Object} data - Dati da aggiornare (parziale)
   * @returns {Promise<Object>} Richiesta aggiornata
   * @throws {Error} Se richiesta non trovata o aggiornamento fallisce
   * 
   * @example
   * const updated = await requestService.update('uuid-123', {
   *   status: 'IN_PROGRESS',
   *   notes: 'Lavori iniziati'
   * });
   */
  async update(id: string, data: Partial<{
    title: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    priority: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    requestedDate: string;
    notes: string;
    status: string;
    professionalId: string;
  }>) {
    try {
      logger.info(`[RequestService] Updating request: ${id}`, Object.keys(data));
      
      // Verifica esistenza
      const existing = await prisma.assistanceRequest.findUnique({
        where: { id },
        include: {
          client: true,
          professional: true,
        }
      });

      if (!existing) {
        throw new Error('Request not found');
      }

      // Prepara dati aggiornamento
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.subcategoryId !== undefined) updateData.subcategoryId = data.subcategoryId;
      if (data.priority !== undefined) updateData.priority = data.priority as any;
      if (data.status !== undefined) updateData.status = data.status as any;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.province !== undefined) updateData.province = data.province;
      if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
      if (data.professionalId !== undefined) updateData.professionalId = data.professionalId;
      if (data.requestedDate !== undefined) {
        updateData.requestedDate = new Date(data.requestedDate);
      }
      if (data.notes !== undefined) {
        updateData.publicNotes = data.notes;
      }
      if (data.professionalId && !existing.professionalId) {
        updateData.assignedAt = new Date();
      }

      // Aggiornamento
      const request = await prisma.assistanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
              profession: true,
            },
          },
          category: true,
          subcategory: true,
        },
      });

      logger.info(`[RequestService] Request updated successfully: ${id}`);

      // Notifiche (non-blocking)
      try {
        if (data.status && data.status !== existing.status) {
          await this.sendStatusChangeNotification(request, existing.status, data.status);
        }

        if (data.professionalId && !existing.professionalId) {
          await this.sendAssignmentNotification(request);
        }

        // Broadcast real-time
        notificationService.broadcast('request:updated', {
          requestId: id,
          changes: data,
          timestamp: new Date()
        });
      } catch (notificationError) {
        logger.error('[RequestService] Error sending update notifications:', notificationError);
      }

      return request;
      
    } catch (error) {
      logger.error('[RequestService] Error updating request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiorna solo lo stato di una richiesta
   * 
   * @param {string} id - ID richiesta
   * @param {string} status - Nuovo stato
   * @param {string} notes - Note opzionali
   * @returns {Promise<Object>} Richiesta aggiornata
   * @throws {Error} Se richiesta non trovata
   * 
   * @example
   * const request = await requestService.updateStatus(
   *   'uuid-123', 
   *   'COMPLETED', 
   *   'Lavori completati con successo'
   * );
   */
  async updateStatus(id: string, status: string, notes?: string) {
    try {
      logger.info(`[RequestService] Updating status for request ${id} to ${status}`);
      
      const existing = await prisma.assistanceRequest.findUnique({
        where: { id },
        include: {
          client: true,
          professional: true,
        }
      });

      if (!existing) {
        throw new Error('Request not found');
      }

      const updateData: any = {
        status: status as any,
      };
      
      if (status === 'COMPLETED') {
        updateData.completedDate = new Date();
      }
      
      if (notes) {
        updateData.publicNotes = notes;
      }

      const request = await prisma.assistanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
              profession: true,
            },
          },
          category: true,
        },
      });

      logger.info(`[RequestService] Status updated successfully: ${id} -> ${status}`);

      // Notifiche
      try {
        await this.sendStatusChangeNotification(request, existing.status, status);
        
        notificationService.broadcast('request:statusChanged', {
          requestId: id,
          oldStatus: existing.status,
          newStatus: status,
          timestamp: new Date()
        });
      } catch (notificationError) {
        logger.error('[RequestService] Error sending status change notification:', notificationError);
      }

      return request;
      
    } catch (error) {
      logger.error('[RequestService] Error updating request status:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: id,
        newStatus: status,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Assegna un professionista a una richiesta
   * 
   * @param {string} id - ID richiesta
   * @param {string} professionalId - ID professionista
   * @returns {Promise<Object>} Richiesta aggiornata
   * @throws {Error} Se assegnazione fallisce
   * 
   * @example
   * const request = await requestService.assignProfessional(
   *   'req-123', 
   *   'prof-456'
   * );
   */
  async assignProfessional(id: string, professionalId: string) {
    try {
      logger.info(`[RequestService] Assigning professional ${professionalId} to request ${id}`);
      
      const request = await prisma.assistanceRequest.update({
        where: { id },
        data: {
          professionalId,
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
              profession: true,
            },
          },
          category: true,
        },
      });

      logger.info(`[RequestService] Professional assigned successfully: ${id} -> ${professionalId}`);

      await this.sendAssignmentNotification(request);

      return request;
      
    } catch (error) {
      logger.error('[RequestService] Error assigning professional:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: id,
        professionalId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera tutti i preventivi di una richiesta
   * 
   * @param {string} requestId - ID richiesta
   * @returns {Promise<Array>} Lista preventivi
   * @throws {Error} Se query fallisce
   */
  async getQuotes(requestId: string) {
    try {
      logger.info(`[RequestService] Fetching quotes for request: ${requestId}`);
      
      const quotes = await prisma.quote.findMany({
        where: { requestId },
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              profession: true,
            },
          },
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.info(`[RequestService] Found ${quotes.length} quotes for request ${requestId}`);
      return quotes;
      
    } catch (error) {
      logger.error('[RequestService] Error fetching quotes for request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera tutti gli allegati di una richiesta
   * 
   * @param {string} requestId - ID richiesta
   * @returns {Promise<Array>} Lista allegati
   * @throws {Error} Se query fallisce
   */
  async getAttachments(requestId: string) {
    try {
      logger.info(`[RequestService] Fetching attachments for request: ${requestId}`);
      
      const attachments = await prisma.requestAttachment.findMany({
        where: { requestId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.info(`[RequestService] Found ${attachments.length} attachments for request ${requestId}`);
      return attachments;
      
    } catch (error) {
      logger.error('[RequestService] Error fetching attachments for request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Invia notifica cambio stato richiesta
   * 
   * @private
   * @param {Object} request - Richiesta aggiornata
   * @param {string} oldStatus - Stato precedente
   * @param {string} newStatus - Nuovo stato
   */
  private async sendStatusChangeNotification(request: any, oldStatus: string, newStatus: string) {
    const statusMessages: { [key: string]: string } = {
      'PENDING': 'in attesa di assegnazione',
      'ASSIGNED': 'assegnata a un professionista',
      'IN_PROGRESS': 'in corso di lavorazione',
      'COMPLETED': 'completata',
      'CANCELLED': 'annullata'
    };

    await notificationService.sendToUser({
      userId: request.clientId,
      type: 'STATUS_CHANGED',
      title: 'Stato richiesta aggiornato',
      message: `La tua richiesta "${request.title}" è ora ${statusMessages[newStatus]}`,
      priority: newStatus === 'COMPLETED' || newStatus === 'CANCELLED' ? 'high' : 'normal',
      data: {
        requestId: request.id,
        oldStatus,
        newStatus,
        requestTitle: request.title
      },
      channels: ['websocket', 'email']
    });

    if (request.professionalId) {
      await notificationService.sendToUser({
        userId: request.professionalId,
        type: 'STATUS_CHANGED',
        title: 'Stato richiesta aggiornato',
        message: `La richiesta "${request.title}" è ora ${statusMessages[newStatus]}`,
        data: {
          requestId: request.id,
          oldStatus,
          newStatus,
          requestTitle: request.title
        },
        channels: ['websocket']
      });
    }
  }

  /**
   * Invia notifiche assegnazione professionista
   * 
   * @private
   * @param {Object} request - Richiesta con professionista assegnato
   */
  private async sendAssignmentNotification(request: any) {
    const professionalName = request.professional?.fullName || 
                            `${request.professional?.firstName || ''} ${request.professional?.lastName || ''}`.trim() ||
                            'Professionista';
    
    const clientName = request.client?.fullName || 
                      `${request.client?.firstName || ''} ${request.client?.lastName || ''}`.trim() ||
                      request.client?.email || 'Cliente';

    if (request.professionalId) {
      await notificationService.sendToUser({
        userId: request.professionalId,
        type: 'REQUEST_ASSIGNED',
        title: 'Nuova richiesta assegnata',
        message: `Ti è stata assegnata la richiesta "${request.title}"`,
        priority: request.priority === 'URGENT' ? 'high' : 'normal',
        data: {
          requestId: request.id,
          requestTitle: request.title,
          clientName: clientName,
          category: request.category?.name,
          priority: request.priority
        },
        channels: ['websocket', 'email']
      });
    }

    await notificationService.sendToUser({
      userId: request.clientId,
      type: 'PROFESSIONAL_ASSIGNED',
      title: 'Professionista assegnato',
      message: `Un professionista è stato assegnato alla tua richiesta "${request.title}"`,
      data: {
        requestId: request.id,
        professionalName: professionalName
      },
      channels: ['websocket', 'email']
    });
  }

  /**
   * Elimina una richiesta
   * 
   * @param {string} id - ID richiesta
   * @returns {Promise<Object>} { success: true }
   * @throws {Error} Se richiesta non trovata o in stato non cancellabile
   * 
   * @example
   * await requestService.delete('uuid-123');
   */
  async delete(id: string) {
    try {
      logger.info(`[RequestService] Deleting request: ${id}`);
      
      const existing = await prisma.assistanceRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Request not found');
      }

      if (existing.status === 'IN_PROGRESS' || existing.status === 'COMPLETED') {
        throw new Error('Cannot delete request in progress or completed');
      }

      // Eliminazione cascade
      await prisma.requestAttachment.deleteMany({
        where: { requestId: id },
      });

      await prisma.quote.deleteMany({
        where: { requestId: id },
      });

      await prisma.assistanceRequest.delete({
        where: { id },
      });

      logger.info(`[RequestService] Request deleted successfully: ${id}`);

      // Broadcast evento
      notificationService.broadcast('request:deleted', {
        requestId: id,
        timestamp: new Date()
      });

      return { success: true };
      
    } catch (error) {
      logger.error('[RequestService] Error deleting request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera statistiche richieste
   * 
   * @returns {Promise<Object>} Conteggi per stato
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const stats = await requestService.getStats();
   * // { total: 150, pending: 20, assigned: 35, ... }
   */
  async getStats() {
    try {
      logger.info('[RequestService] Fetching request statistics');
      
      const [
        total,
        pending,
        assigned,
        inProgress,
        completed,
        cancelled,
      ] = await Promise.all([
        prisma.assistanceRequest.count(),
        prisma.assistanceRequest.count({ where: { status: 'PENDING' } }),
        prisma.assistanceRequest.count({ where: { status: 'ASSIGNED' } }),
        prisma.assistanceRequest.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.assistanceRequest.count({ where: { status: 'COMPLETED' } }),
        prisma.assistanceRequest.count({ where: { status: 'CANCELLED' } }),
      ]);

      const stats = {
        total,
        pending,
        assigned,
        inProgress,
        completed,
        cancelled,
      };

      logger.info('[RequestService] Statistics fetched successfully', stats);
      return stats;
      
    } catch (error) {
      logger.error('[RequestService] Error getting request stats:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const requestService = new RequestService();
