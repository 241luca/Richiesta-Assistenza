import { Request, Response } from 'express';
import { ContainerService } from '../../services/ContainerService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

export class ContainerController {
  private service: ContainerService;

  constructor() {
    this.service = new ContainerService();
  }

  async list(req: Request, res: Response) {
    const { type, search, limit = 50, offset = 0 } = req.query;

    let containers = await this.service.listContainers({
      type: type as string,
      search: search as string,
      limit: Number(limit),
      offset: Number(offset)
    });

    // 📊 Arricchisci con conteggio documenti da SmartDocs API
    containers = await Promise.all(
      containers.map(async (container: any) => {
        try {
          // Carica TUTTI i documenti (senza filtro container_id perché l'API non lo supporta)
          const apiUrl = `http://localhost:3500/api/documents?limit=1000&offset=0`;
          const response = await fetch(apiUrl);
          
          if (response.ok) {
            const data = await response.json() as any;
            // Filtra i documenti per questo container nel nostro codice
            const docs = Array.isArray(data.data) ? data.data : [];
            const docCount = docs.filter((doc: any) => doc.container_id === container.id).length;
            
            return {
              ...container,
              processed_docs: docCount
            };
          }
          
          return container;
        } catch (err) {
          logger.warn(`Failed to count documents for container ${container.id}:`, err);
          return container;
        }
      })
    );

    res.json({
      success: true,
      data: containers,
      meta: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  }

  async create(req: Request, res: Response) {
    const { type, name, description, metadata } = req.body;

    if (!type || !name) {
      throw new AppError('Type and name are required', 400);
    }

    const container = await this.service.createContainer({
      type,
      name,
      description,
      metadata
    });

    logger.info('Container created', { containerId: container.id, type, name });

    res.status(201).json({
      success: true,
      data: container
    });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const container = await this.service.getContainerById(id);

    if (!container) {
      throw new AppError('Container not found', 404);
    }

    res.json({
      success: true,
      data: container
    });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;

    const container = await this.service.updateContainer(id, updates);

    if (!container) {
      throw new AppError('Container not found', 404);
    }

    logger.info('Container updated', { containerId: id });

    res.json({
      success: true,
      data: container
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await this.service.deleteContainer(id);

    logger.info('Container deleted', { containerId: id });

    res.json({
      success: true,
      message: 'Container deleted successfully'
    });
  }

  async getStats(req: Request, res: Response) {
    const { id } = req.params;

    const stats = await this.service.getContainerStats(id);

    res.json({
      success: true,
      data: stats
    });
  }

  async clearDocuments(req: Request, res: Response) {
    const { id } = req.params;

    const result = await this.service.clearContainerDocuments(id);

    logger.info('Container documents cleared', { containerId: id, deletedCount: result.deletedCount });

    res.json({
      success: true,
      message: 'All documents deleted successfully',
      data: result
    });
  }
}
