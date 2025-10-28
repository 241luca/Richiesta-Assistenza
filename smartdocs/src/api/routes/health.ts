import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'healthy',
        database: 'healthy', // TODO: Check real DB connection
        redis: 'healthy', // TODO: Check real Redis connection
        vector: 'healthy' // TODO: Check vector DB
      }
    };

    res.status(200).json(healthcheck);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      uptime: process.uptime(),
      message: 'Service Unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
