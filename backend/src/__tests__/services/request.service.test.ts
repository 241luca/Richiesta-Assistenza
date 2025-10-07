/**
 * Test Suite per Request Service
 * Verifica tutte le funzionalità del servizio richieste
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requestService } from '../../services/request.service';
import { prisma } from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { getIO } from '../../utils/socket';

// Mock delle dipendenze
vi.mock('../../config/database', () => ({
  prisma: {
    assistanceRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    requestAttachment: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    quote: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../services/notification.service', () => ({
  notificationService: {
    sendToUser: vi.fn(),
  },
}));

vi.mock('../../utils/socket', () => ({
  getIO: vi.fn(() => ({
    emit: vi.fn(),
  })),
}));

vi.mock('../../services/googleMaps.service', () => ({
  GoogleMapsService: {
    calculateDistance: vi.fn(),
  },
}));

describe('RequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('dovrebbe recuperare tutte le richieste senza filtri', async () => {
      const mockRequests = [
        {
          id: '1',
          title: 'Riparazione tubo',
          status: 'PENDING',
          client: { id: 'c1', fullName: 'Mario Rossi' },
          professional: null,
          category: { id: 'cat1', name: 'Idraulica' },
          subcategory: null,
          attachments: [],
          quotes: [],
        },
      ];

      prisma.assistanceRequest.findMany.mockResolvedValue(mockRequests);

      const result = await requestService.findAll();

      expect(prisma.assistanceRequest.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.objectContaining({
          client: expect.any(Object),
          professional: expect.any(Object),
          category: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockRequests);
    });

    it('dovrebbe applicare i filtri correttamente', async () => {
      await requestService.findAll({
        status: 'PENDING',
        priority: 'HIGH',
        clientId: 'client123',
      });

      expect(prisma.assistanceRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          priority: 'HIGH',
          clientId: 'client123',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('dovrebbe gestire la ricerca testuale', async () => {
      await requestService.findAll({
        search: 'tubo',
      });

      expect(prisma.assistanceRequest.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'tubo', mode: 'insensitive' } },
            { description: { contains: 'tubo', mode: 'insensitive' } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('dovrebbe trovare una richiesta per ID', async () => {
      const mockRequest = {
        id: '123',
        title: 'Test Request',
        client: { id: 'c1', fullName: 'Test User' },
      };

      prisma.assistanceRequest.findUnique.mockResolvedValue(mockRequest);

      const result = await requestService.findById('123');

      expect(prisma.assistanceRequest.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockRequest);
    });

    it('dovrebbe ritornare null se la richiesta non esiste', async () => {
      prisma.assistanceRequest.findUnique.mockResolvedValue(null);

      const result = await requestService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('dovrebbe creare una nuova richiesta', async () => {
      const newRequestData = {
        title: 'Nuova richiesta',
        description: 'Descrizione test',
        categoryId: 'cat1',
        priority: 'HIGH',
        address: 'Via Test 1',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        clientId: 'client123',
      };

      const createdRequest = {
        id: 'new123',
        ...newRequestData,
        status: 'PENDING',
        client: {
          id: 'client123',
          fullName: 'Test Client',
          email: 'test@example.com',
        },
        category: {
          id: 'cat1',
          name: 'Idraulica',
        },
      };

      prisma.assistanceRequest.create.mockResolvedValue(createdRequest);
      prisma.user.findMany.mockResolvedValue([
        { id: 'admin1', role: 'ADMIN' },
      ]);

      const result = await requestService.create(newRequestData);

      expect(prisma.assistanceRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: newRequestData.title,
          description: newRequestData.description,
          status: 'PENDING',
        }),
        include: expect.any(Object),
      });

      expect(result).toEqual(createdRequest);
    });

    it('dovrebbe inviare notifiche dopo la creazione', async () => {
      const newRequestData = {
        title: 'Test',
        description: 'Test',
        categoryId: 'cat1',
        priority: 'URGENT',
        address: 'Via Test',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        clientId: 'client123',
      };

      const createdRequest = {
        id: 'new123',
        ...newRequestData,
        status: 'PENDING',
        priority: 'URGENT',
        client: {
          id: 'client123',
          fullName: 'Test Client',
          email: 'test@example.com',
        },
        category: {
          name: 'Idraulica',
        },
      };

      prisma.assistanceRequest.create.mockResolvedValue(createdRequest);
      prisma.user.findMany.mockResolvedValue([
        { id: 'admin1', role: 'ADMIN' },
      ]);

      await requestService.create(newRequestData);

      // Verifica che le notifiche siano state inviate
      expect(notificationService.sendToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin1',
          type: 'NEW_REQUEST',
          priority: 'high', // URGENT diventa high
        })
      );

      expect(notificationService.sendToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client123',
          type: 'REQUEST_CREATED',
        })
      );
    });
  });

  describe('update', () => {
    it('dovrebbe aggiornare una richiesta esistente', async () => {
      const existingRequest = {
        id: '123',
        status: 'PENDING',
        professionalId: null,
      };

      const updateData = {
        title: 'Titolo aggiornato',
        status: 'ASSIGNED',
        professionalId: 'prof123',
      };

      const updatedRequest = {
        ...existingRequest,
        ...updateData,
        client: { id: 'c1', fullName: 'Client' },
        professional: { id: 'prof123', fullName: 'Professional' },
      };

      prisma.assistanceRequest.findUnique.mockResolvedValue(existingRequest);
      prisma.assistanceRequest.update.mockResolvedValue(updatedRequest);

      const result = await requestService.update('123', updateData);

      expect(prisma.assistanceRequest.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: expect.objectContaining({
          title: 'Titolo aggiornato',
          status: 'ASSIGNED',
          professionalId: 'prof123',
        }),
        include: expect.any(Object),
      });

      expect(result).toEqual(updatedRequest);
    });

    it('dovrebbe lanciare errore se la richiesta non esiste', async () => {
      prisma.assistanceRequest.findUnique.mockResolvedValue(null);

      await expect(
        requestService.update('nonexistent', { title: 'New' })
      ).rejects.toThrow('Request not found');
    });
  });

  describe('updateStatus', () => {
    it('dovrebbe aggiornare lo stato di una richiesta', async () => {
      const existingRequest = {
        id: '123',
        status: 'PENDING',
        clientId: 'c1',
        professionalId: 'p1',
      };

      const updatedRequest = {
        ...existingRequest,
        status: 'COMPLETED',
        completedDate: new Date(),
        client: { fullName: 'Client' },
        professional: { fullName: 'Professional' },
      };

      prisma.assistanceRequest.findUnique.mockResolvedValue(existingRequest);
      prisma.assistanceRequest.update.mockResolvedValue(updatedRequest);

      const result = await requestService.updateStatus('123', 'COMPLETED');

      expect(prisma.assistanceRequest.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedDate: expect.any(Date),
        }),
        include: expect.any(Object),
      });

      expect(result).toEqual(updatedRequest);
    });

    it('dovrebbe inviare notifiche quando lo stato cambia', async () => {
      const existingRequest = {
        id: '123',
        status: 'PENDING',
        clientId: 'c1',
        professionalId: 'p1',
      };

      const updatedRequest = {
        ...existingRequest,
        status: 'IN_PROGRESS',
        title: 'Test Request',
        client: { fullName: 'Client' },
        professional: { fullName: 'Professional' },
      };

      prisma.assistanceRequest.findUnique.mockResolvedValue(existingRequest);
      prisma.assistanceRequest.update.mockResolvedValue(updatedRequest);

      await requestService.updateStatus('123', 'IN_PROGRESS');

      expect(notificationService.sendToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'c1',
          type: 'STATUS_CHANGED',
        })
      );
    });
  });

  describe('assignProfessional', () => {
    it('dovrebbe assegnare un professionista a una richiesta', async () => {
      const updatedRequest = {
        id: '123',
        professionalId: 'prof123',
        status: 'ASSIGNED',
        client: { fullName: 'Client' },
        professional: { fullName: 'Professional' },
        category: { name: 'Idraulica' },
      };

      prisma.assistanceRequest.update.mockResolvedValue(updatedRequest);

      const result = await requestService.assignProfessional('123', 'prof123');

      expect(prisma.assistanceRequest.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          professionalId: 'prof123',
          status: 'ASSIGNED',
          assignedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });

      expect(result).toEqual(updatedRequest);
    });
  });

  describe('delete', () => {
    it('dovrebbe eliminare una richiesta in stato PENDING', async () => {
      const existingRequest = {
        id: '123',
        status: 'PENDING',
      };

      prisma.assistanceRequest.findUnique.mockResolvedValue(existingRequest);
      prisma.assistanceRequest.delete.mockResolvedValue(existingRequest);

      const result = await requestService.delete('123');

      expect(prisma.requestAttachment.deleteMany).toHaveBeenCalledWith({
        where: { requestId: '123' },
      });
      expect(prisma.quote.deleteMany).toHaveBeenCalledWith({
        where: { requestId: '123' },
      });
      expect(prisma.assistanceRequest.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(result).toEqual({ success: true });
    });

    it('non dovrebbe eliminare richieste IN_PROGRESS', async () => {
      const existingRequest = {
        id: '123',
        status: 'IN_PROGRESS',
      };

      prisma.assistanceRequest.findUnique.mockResolvedValue(existingRequest);

      await expect(requestService.delete('123')).rejects.toThrow(
        'Cannot delete request in progress or completed'
      );
    });

    it('non dovrebbe eliminare richieste COMPLETED', async () => {
      const existingRequest = {
        id: '123',
        status: 'COMPLETED',
      };

      prisma.assistanceRequest.findUnique.mockResolvedValue(existingRequest);

      await expect(requestService.delete('123')).rejects.toThrow(
        'Cannot delete request in progress or completed'
      );
    });
  });

  describe('getStats', () => {
    it('dovrebbe ritornare le statistiche delle richieste', async () => {
      prisma.assistanceRequest.count.mockImplementation((args) => {
        if (!args || !args.where) return Promise.resolve(100);
        switch (args.where.status) {
          case 'PENDING': return Promise.resolve(30);
          case 'ASSIGNED': return Promise.resolve(20);
          case 'IN_PROGRESS': return Promise.resolve(25);
          case 'COMPLETED': return Promise.resolve(20);
          case 'CANCELLED': return Promise.resolve(5);
          default: return Promise.resolve(0);
        }
      });

      const stats = await requestService.getStats();

      expect(stats).toEqual({
        total: 100,
        pending: 30,
        assigned: 20,
        inProgress: 25,
        completed: 20,
        cancelled: 5,
      });
    });
  });

  describe('getQuotes', () => {
    it('dovrebbe recuperare tutti i preventivi di una richiesta', async () => {
      const mockQuotes = [
        {
          id: 'q1',
          requestId: '123',
          professional: { fullName: 'Professional 1' },
          items: [],
        },
      ];

      prisma.quote.findMany.mockResolvedValue(mockQuotes);

      const result = await requestService.getQuotes('123');

      expect(prisma.quote.findMany).toHaveBeenCalledWith({
        where: { requestId: '123' },
        include: expect.objectContaining({
          professional: expect.any(Object),
          items: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockQuotes);
    });
  });

  describe('getAttachments', () => {
    it('dovrebbe recuperare tutti gli allegati di una richiesta', async () => {
      const mockAttachments = [
        {
          id: 'a1',
          requestId: '123',
          filename: 'documento.pdf',
        },
      ];

      prisma.requestAttachment.findMany.mockResolvedValue(mockAttachments);

      const result = await requestService.getAttachments('123');

      expect(prisma.requestAttachment.findMany).toHaveBeenCalledWith({
        where: { requestId: '123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAttachments);
    });
  });
});
