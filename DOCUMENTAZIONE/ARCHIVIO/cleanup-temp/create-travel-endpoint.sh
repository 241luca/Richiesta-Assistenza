#!/bin/bash

echo "🔧 CREAZIONE ENDPOINT TRAVEL COSTS"
echo "=================================="

cd backend

echo "1. Creo il file per le route dei costi di viaggio:"

cat > src/routes/travel-costs.routes.ts << 'ROUTES'
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// GET /api/travel/professional/:professionalId/cost-settings
router.get(
  '/professional/:professionalId/cost-settings',
  authenticate,
  async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      
      // Per ora restituiamo dati di default
      // In futuro questi verranno dal database
      const costSettings = {
        professionalId,
        baseTariff: 50.00, // €/ora
        travelCostPerKm: 0.50, // €/km
        minimumCharge: 30.00, // € minimo
        freeKmRadius: 10, // km gratuiti
        zones: [
          { name: 'Zona 1 (0-10 km)', multiplier: 1.0 },
          { name: 'Zona 2 (10-30 km)', multiplier: 1.2 },
          { name: 'Zona 3 (30+ km)', multiplier: 1.5 }
        ],
        updatedAt: new Date()
      };
      
      res.json(ResponseFormatter.success(
        costSettings,
        'Cost settings retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching cost settings:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to fetch cost settings'
      ));
    }
  }
);

// PUT /api/travel/professional/:professionalId/cost-settings
router.put(
  '/professional/:professionalId/cost-settings',
  authenticate,
  requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const requestingUser = req.user as any;
      
      // Check authorization
      if (requestingUser.id !== professionalId && 
          requestingUser.role !== 'ADMIN' && 
          requestingUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error(
          'Not authorized to update these settings',
          403
        ));
      }
      
      const { baseTariff, travelCostPerKm, minimumCharge, freeKmRadius, zones } = req.body;
      
      // In futuro salveremo nel database
      // Per ora restituiamo i dati aggiornati
      const updatedSettings = {
        professionalId,
        baseTariff,
        travelCostPerKm,
        minimumCharge,
        freeKmRadius,
        zones,
        updatedAt: new Date()
      };
      
      res.json(ResponseFormatter.success(
        updatedSettings,
        'Cost settings updated successfully'
      ));
    } catch (error) {
      logger.error('Error updating cost settings:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to update cost settings'
      ));
    }
  }
);

export default router;
ROUTES

echo "✅ travel-costs.routes.ts creato"

echo ""
echo "2. Registro le route nel server:"

cat > /tmp/add-travel-routes.js << 'SCRIPT'
const fs = require('fs');

// Trova il file index.ts del server
const indexFile = 'src/index.ts';
if (!fs.existsSync(indexFile)) {
  console.log('Cerco in routes.ts...');
  // Prova in routes.ts
  const routesFile = 'src/routes.ts';
  if (fs.existsSync(routesFile)) {
    let content = fs.readFileSync(routesFile, 'utf8');
    
    // Aggiungi import
    if (!content.includes('travel-costs.routes')) {
      const importLine = "import travelCostsRoutes from './routes/travel-costs.routes';";
      content = content.replace(
        /(import.*routes.*from.*routes.*;)/g,
        '$1\n' + importLine
      );
      
      // Aggiungi route
      const routeLine = "  app.use('/api/travel', travelCostsRoutes);";
      content = content.replace(
        /(app\.use\('\/api\/.*routes\);)/g,
        '$1\n' + routeLine
      );
      
      fs.writeFileSync(routesFile, content);
      console.log('✅ Route aggiunte in routes.ts');
    }
  }
} else {
  let content = fs.readFileSync(indexFile, 'utf8');
  
  // Aggiungi import e route
  if (!content.includes('travel-costs.routes')) {
    const importLine = "import travelCostsRoutes from './routes/travel-costs.routes';";
    const routeLine = "app.use('/api/travel', travelCostsRoutes);";
    
    // Aggiungi dopo gli altri import di routes
    content = content.replace(
      /(import.*routes.*from.*routes.*;)/g,
      '$1\n' + importLine
    );
    
    // Aggiungi dopo gli altri app.use
    content = content.replace(
      /(app\.use\('\/api\/.*routes\);)/g,
      '$1\n' + routeLine
    );
    
    fs.writeFileSync(indexFile, content);
    console.log('✅ Route aggiunte in index.ts');
  }
}
SCRIPT

node /tmp/add-travel-routes.js

echo ""
echo "3. Se non funziona, aggiungo manualmente:"
echo "   Aggiungi in backend/src/routes.ts o index.ts:"
echo "   import travelCostsRoutes from './routes/travel-costs.routes';"
echo "   app.use('/api/travel', travelCostsRoutes);"

rm -f /tmp/add-travel-routes.js

echo ""
echo "=================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "L'endpoint /api/travel/professional/:id/cost-settings"
echo "ora dovrebbe funzionare!"
