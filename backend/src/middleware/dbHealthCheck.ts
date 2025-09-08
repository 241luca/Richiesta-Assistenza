// backend/src/middleware/dbHealthCheck.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';

let dbHealthy = true;
let lastCheck = Date.now();
const CHECK_INTERVAL = 5000; // Check ogni 5 secondi

async function checkDbHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
    return true;
  } catch (error) {
    dbHealthy = false;
    console.error('Database health check failed:', error);
    return false;
  }
}

// Check periodico in background
setInterval(async () => {
  lastCheck = Date.now();
  await checkDbHealth();
}, CHECK_INTERVAL);

// Middleware per verificare DB prima di ogni richiesta
export async function dbHealthCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip per health check endpoints
  if (req.path.includes('/health')) {
    return next();
  }

  // Se l'ultimo check è vecchio, ricontrolla
  if (Date.now() - lastCheck > CHECK_INTERVAL) {
    await checkDbHealth();
    lastCheck = Date.now();
  }

  if (!dbHealthy) {
    return res.status(503).json(
      ResponseFormatter.error(
        'Database temporarily unavailable. Please try again in a few moments.',
        'DB_UNAVAILABLE'
      )
    );
  }

  next();
}
