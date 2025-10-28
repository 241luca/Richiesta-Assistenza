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

    const containers = await this.service.listContainers({
      type: type as string,
      search: search as string,
      limit: Number(limit),
      offset: Number(offset)
    });

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
