import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/maps/config
 * Ottieni la configurazione Google Maps per il frontend
 */
router.get('/config', authenticate, async (req, res) => {
  try {
    // Usa direttamente la chiave dal file .env
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      return res.status(404).json({
        success: false,
        error: 'Google Maps API key not configured in .env file'
      });
    }
    
    res.json({
      success: true,
      apiKey: apiKey,
      configuration: {
        enabled: true,
        apis: ['maps', 'geocoding', 'places']
      }
    });
  } catch (error) {
    logger.error('Error fetching Google Maps config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google Maps configuration'
    });
  }
});

/**
 * POST /api/maps/geocode
 * Converti un indirizzo in coordinate GPS
 */
router.post('/geocode', authenticate, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      return res.status(404).json({
        success: false,
        error: 'Google Maps API key not configured in .env file'
      });
    }
    
    logger.info('Geocoding address:', { address });
    
    // Chiamata all'API di Google
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=IT&language=it`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    logger.info('Google Maps API response status:', data.status);
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      
      res.json({
        success: true,
        location: {
          lat: location.lat,
          lng: location.lng
        },
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: formattedAddress,
        formattedAddress: formattedAddress // Alias per compatibilità
      });
    } else if (data.status === 'REQUEST_DENIED') {
      logger.error('Google Maps API key error:', data.error_message);
      res.status(403).json({
        success: false,
        error: 'Google Maps API key is invalid or restricted',
        details: data.error_message
      });
    } else if (data.status === 'ZERO_RESULTS') {
      res.status(404).json({
        success: false,
        error: 'No results found for this address'
      });
    } else {
      logger.error('Google Maps API error:', data);
      res.status(500).json({
        success: false,
        error: `Google Maps API error: ${data.status}`,
        details: data.error_message
      });
    }
  } catch (error) {
    logger.error('Error geocoding address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to geocode address',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/maps/geocode
 * Versione GET per compatibilità
 */
router.get('/geocode', authenticate, async (req, res) => {
  try {
    const address = req.query.address as string;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    // Riutilizza la logica del POST
    req.body = { address };
    return router.handle(req, res);
  } catch (error) {
    logger.error('Error in GET geocode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to geocode address'
    });
  }
});

/**
 * POST /api/maps/distance
 * Calcola la distanza tra due punti
 */
router.post('/distance', authenticate, async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Both origin and destination are required'
      });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      return res.status(404).json({
        success: false,
        error: 'Google Maps API key not configured'
      });
    }
    
    // Chiamata all'API Distance Matrix di Google
    const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&units=metric&language=it`;
    
    const response = await fetch(distanceUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      
      res.json({
        success: true,
        distance: {
          text: element.distance.text,
          value: element.distance.value // in metri
        },
        duration: {
          text: element.duration.text,
          value: element.duration.value // in secondi
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Could not calculate distance'
      });
    }
  } catch (error) {
    logger.error('Error calculating distance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate distance'
    });
  }
});

export default router;
