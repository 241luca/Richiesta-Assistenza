import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { GoogleMapsService } from './googleMaps.service';

export class RequestService {
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
      const where: Prisma.AssistanceRequestWhereInput = {};

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
          attachments: true,
          quotes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Se è un professionista, calcola le distanze
      let requestsWithDistance = requests;
      if (filters?.userRole === 'PROFESSIONAL' && filters?.userId) {
        requestsWithDistance = await this.addDistancesToRequests(requests, filters.userId);
      }

      return requestsWithDistance;
    } catch (error) {
      logger.error('Error fetching requests:', error);
      throw error;
    }
  }

  private async addDistancesToRequests(requests: any[], professionalId: string) {
    try {
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
        return requests;
      }

      // Usa l'indirizzo di lavoro se disponibile e non usa la residenza, altrimenti usa quello principale
      const professionalAddress = (!professional.useResidenceAsWorkAddress && professional.workAddress)
        ? `${professional.workAddress}, ${professional.workCity} ${professional.workProvince} ${professional.workPostalCode}`
        : `${professional.address}, ${professional.city} ${professional.province} ${professional.postalCode}`;

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
            logger.warn(`Could not calculate distance for request ${request.id}:`, error);
          }
          
          return request;
        })
      );

      return requestsWithDistance.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        if (a.distance) return -1;
        if (b.distance) return 1;
        return 0;
      });
    } catch (error) {
      logger.error('Error adding distances to requests:', error);
      return requests;
    }
  }

  async findById(id: string) {
    try {
      const request = await prisma.assistanceRequest.findUnique({
        where: {
          id,
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
          attachments: true,
        },
      });

      if (!request) {
        return null;
      }

      return request;
    } catch (error) {
      logger.error('Error fetching request by id:', error);
      throw error;
    }
  }

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
      // Prepara i dati per la creazione
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

      // Send notification to admins about new request
      try {
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

        // Emit real-time event usando notificationService
        notificationService.broadcast('request:created', {
          request: request,
          timestamp: new Date()
        });
      } catch (notificationError) {
        logger.error('Error sending notifications for new request:', notificationError);
      }

      return request;
    } catch (error) {
      logger.error('Error creating request:', error);
      throw error;
    }
  }

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
      const existing = await prisma.assistanceRequest.findUnique({
        where: {
          id,
        },
        include: {
          client: true,
          professional: true,
        }
      });

      if (!existing) {
        throw new Error('Request not found');
      }

      const updateData: any = {};
      
      // Aggiungi solo i campi che sono stati passati
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

      try {
        if (data.status && data.status !== existing.status) {
          await this.sendStatusChangeNotification(request, existing.status, data.status);
        }

        if (data.professionalId && !existing.professionalId) {
          await this.sendAssignmentNotification(request);
        }

        // Emit real-time event usando notificationService
        notificationService.broadcast('request:updated', {
          requestId: id,
          changes: data,
          timestamp: new Date()
        });
      } catch (notificationError) {
        logger.error('Error sending update notifications:', notificationError);
      }

      return request;
    } catch (error) {
      logger.error('Error updating request:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: string, notes?: string) {
    try {
      const existing = await prisma.assistanceRequest.findUnique({
        where: {
          id,
        },
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

      try {
        await this.sendStatusChangeNotification(request, existing.status, status);
        
        // Emit real-time event usando notificationService
        notificationService.broadcast('request:statusChanged', {
          requestId: id,
          oldStatus: existing.status,
          newStatus: status,
          timestamp: new Date()
        });
      } catch (notificationError) {
        logger.error('Error sending status change notification:', notificationError);
      }

      return request;
    } catch (error) {
      logger.error('Error updating request status:', error);
      throw error;
    }
  }

  async assignProfessional(id: string, professionalId: string) {
    try {
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

      await this.sendAssignmentNotification(request);

      return request;
    } catch (error) {
      logger.error('Error assigning professional:', error);
      throw error;
    }
  }

  async getQuotes(requestId: string) {
    try {
      const quotes = await prisma.quote.findMany({
        where: {
          requestId,
        },
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

      return quotes;
    } catch (error) {
      logger.error('Error fetching quotes for request:', error);
      throw error;
    }
  }

  async getAttachments(requestId: string) {
    try {
      const attachments = await prisma.requestAttachment.findMany({
        where: {
          requestId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return attachments;
    } catch (error) {
      logger.error('Error fetching attachments for request:', error);
      throw error;
    }
  }

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

  async delete(id: string) {
    try {
      const existing = await prisma.assistanceRequest.findUnique({
        where: {
          id,
        },
      });

      if (!existing) {
        throw new Error('Request not found');
      }

      if (existing.status === 'IN_PROGRESS' || existing.status === 'COMPLETED') {
        throw new Error('Cannot delete request in progress or completed');
      }

      await prisma.requestAttachment.deleteMany({
        where: { requestId: id },
      });

      await prisma.quote.deleteMany({
        where: { requestId: id },
      });

      await prisma.assistanceRequest.delete({
        where: { id },
      });

      // Emit real-time event usando notificationService
      notificationService.broadcast('request:deleted', {
        requestId: id,
        timestamp: new Date()
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting request:', error);
      throw error;
    }
  }

  async getStats() {
    try {
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

      return {
        total,
        pending,
        assigned,
        inProgress,
        completed,
        cancelled,
      };
    } catch (error) {
      logger.error('Error getting request stats:', error);
      throw error;
    }
  }
}

export const requestService = new RequestService();
