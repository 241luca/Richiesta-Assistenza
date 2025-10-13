/**
 * Geocoding Routes
 * Endpoints per le operazioni di geocoding
 */

import { Router } from 'express';
import { z } from 'zod';
import { geocodingService } from '../services/geocoding.service';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';

const router = Router();

// Validation schemas
const geocodeAddressSchema = z.object({
  body: z.object({
    address: z.string().min(5).max(500),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
  }),
});

const reverseGeocodeSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

const calculateDistanceSchema = z.object({
  body: z.object({
    origin: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    destination: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
});

const findNearbyProfessionalsSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    maxDistanceKm: z.number().min(1).max(500).default(50),
    categoryId: z.string().uuid().optional(),
    subcategoryId: z.string().uuid().optional(),
  }),
});

const optimizeRouteSchema = z.object({
  body: z.object({
    origin: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    waypoints: z.array(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })),
    destination: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),
});

/**
 * POST /api/geocode/address
 * Converte un indirizzo in coordinate geografiche
 */
router.post(
  '/address',
  authenticate,
  rateLimiter({ points: 100, duration: 60 * 60 }), // 100 richieste all'ora
  validateRequest(geocodeAddressSchema),
  async (req, res, next) => {
    try {
      const { address, city, province, postalCode } = req.body;
      
      // Costruisci l'indirizzo completo se forniti tutti i campi
      let fullAddress = address;
      if (city && province && postalCode) {
        fullAddress = `${address}, ${postalCode} ${city} ${province}, Italia`;
      }

      const coordinates = await geocodingService.geocodeAddress(fullAddress);

      if (coordinates) {
        res.json({
          success: true,
          data: coordinates,
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Indirizzo non trovato',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/geocode/reverse
 * Converte coordinate geografiche in un indirizzo
 */
router.post(
  '/reverse',
  authenticate,
  rateLimiter({ points: 100, duration: 60 * 60 }),
  validateRequest(reverseGeocodeSchema),
  async (req, res, next) => {
    try {
      const { lat, lng } = req.body;

      const address = await geocodingService.reverseGeocode(lat, lng);

      if (address) {
        res.json({
          success: true,
          data: { address },
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Indirizzo non trovato per le coordinate fornite',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/geocode/distance
 * Calcola la distanza tra due punti
 */
router.post(
  '/distance',
  authenticate,
  rateLimiter({ points: 100, duration: 60 * 60 }),
  validateRequest(calculateDistanceSchema),
  async (req, res, next) => {
    try {
      const { origin, destination } = req.body;

      const result = await geocodingService.calculateDistance(origin, destination);

      if (result) {
        res.json({
          success: true,
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Impossibile calcolare la distanza',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/geocode/nearby-professionals
 * Trova professionisti vicini a una posizione
 */
router.post(
  '/nearby-professionals',
  authenticate,
  rateLimiter({ points: 50, duration: 60 * 60 }),
  validateRequest(findNearbyProfessionalsSchema),
  async (req, res, next) => {
    try {
      const { lat, lng, maxDistanceKm, categoryId, subcategoryId } = req.body;
      

      // Query per trovare professionisti con le loro posizioni
      const professionals = await prisma.user.findMany({
        where: {
          
          role: 'PROFESSIONAL',
          address: { not: null },
          city: { not: null },
          ...(categoryId && {
            ProfessionalUserSubcategory: {
              some: {
                Subcategory: {
                  categoryId,
                },
              },
            },
          }),
          ...(subcategoryId && {
            ProfessionalUserSubcategory: {
              some: {
                subcategoryId,
              },
            },
          }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
        },
      });

      // Geocode gli indirizzi dei professionisti se necessario
      const professionalsWithCoords = await Promise.all(
        professionals.map(async (prof) => {
          if (prof.address && prof.city) {
            const coords = await geocodingService.geocodeRequest(
              prof.address,
              prof.city,
              prof.province || '',
              prof.postalCode || ''
            );
            
            if (coords) {
              return {
                id: prof.id,
                lat: coords.lat,
                lng: coords.lng,
              };
            }
          }
          return null;
        })
      );

      // Filtra i null
      const validProfessionals = professionalsWithCoords.filter((p) => p !== null) as Array<{
        id: string;
        lat: number;
        lng: number;
      }>;

      // Trova i professionisti vicini
      const nearbyProfessionals = await geocodingService.findNearbyProfessionals(
        { lat, lng },
        maxDistanceKm,
        validProfessionals
      );

      // Arricchisci con i dati completi dei professionisti
      const results = await Promise.all(
        nearbyProfessionals.map(async (nearby) => {
          const professional = professionals.find((p) => p.id === nearby.id);
          return {
            ...professional,
            distance: nearby.distance,
            duration: nearby.duration,
          };
        })
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/geocode/optimize-route
 * Ottimizza il percorso per visitare più punti
 */
router.post(
  '/optimize-route',
  authenticate,
  rateLimiter({ points: 20, duration: 60 * 60 }),
  validateRequest(optimizeRouteSchema),
  async (req, res, next) => {
    try {
      const { origin, waypoints, destination } = req.body;

      const result = await geocodingService.optimizeRoute(origin, waypoints, destination);

      if (result) {
        res.json({
          success: true,
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Impossibile ottimizzare il percorso',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/geocode/validate-italian-address
 * Valida un indirizzo italiano
 */
router.post(
  '/validate-italian-address',
  authenticate,
  async (req, res) => {
    const { postalCode, province } = req.body;

    const isValidPostalCode = postalCode ? geocodingService.validateItalianPostalCode(postalCode) : true;
    const isValidProvince = province ? geocodingService.validateItalianProvince(province) : true;

    res.json({
      success: true,
      data: {
        isValid: isValidPostalCode && isValidProvince,
        postalCode: isValidPostalCode,
        province: isValidProvince,
      },
    });
  }
);

/**
 * DELETE /api/geocode/cache
 * Pulisce la cache del geocoding (solo admin)
 */
router.delete(
  '/cache',
  authenticate,
  async (req, res, next) => {
    try {
      // Verifica che l'utente sia admin
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Accesso negato',
        });
      }

      await geocodingService.clearCache();

      res.json({
        success: true,
        message: 'Cache geocoding pulita con successo',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
