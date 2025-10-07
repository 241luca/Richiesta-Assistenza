/**
 * Response Compression Middleware
 * Riduce bandwidth del 70-80% usando Brotli e Gzip
 */

import compression from 'compression';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Configurazione Compression Avanzata
 * Usa Brotli quando disponibile (migliore di gzip)
 */
export function setupCompression() {
  return compression({
    // Abilita Brotli compression (se supportato dal client)
    brotli: {
      // enabled: true // Not a valid option,
      zlib: {
        // Livello compressione Brotli (1-11, default 11)
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: 6, // Bilanciato tra velocità e compressione
        }
      }
    },
    
    // Configurazione Gzip fallback
    level: 6, // Livello compressione gzip (1-9, default 6)
    
    // Soglia minima per compressione (1kb)
    threshold: 1024,
    
    // Filtra quali response comprimere
    filter: (req: Request, res: Response) => {
      // Non comprimere se già compresso
      if (res.getHeader('Content-Encoding')) {
        return false;
      }
      
      // Non comprimere WebSocket
      if (req.headers.upgrade === 'websocket') {
        return false;
      }
      
      // Non comprimere Server-Sent Events
      if (res.getHeader('Content-Type')?.includes('text/event-stream')) {
        return false;
      }
      
      // Comprimi JSON, testo, HTML, CSS, JS
      const contentType = res.getHeader('Content-Type') as string;
      const compressibleTypes = [
        'application/json',
        'text/html',
        'text/css',
        'text/plain',
        'text/xml',
        'application/xml',
        'application/javascript',
        'application/x-javascript',
        'text/javascript',
        'application/ld+json',
        'application/manifest+json',
        'application/rss+xml',
        'application/atom+xml',
        'application/xhtml+xml',
        'font/ttf',
        'font/otf',
        'font/woff',
        'image/svg+xml',
        'image/x-icon'
      ];
      
      // Verifica se il tipo è comprimibile
      if (contentType) {
        const shouldCompress = compressibleTypes.some(type => 
          contentType.toLowerCase().includes(type)
        );
        
        if (!shouldCompress) {
          return false;
        }
      }
      
      // Usa il default compression filter per altri casi
      return compression.filter(req, res);
    },
    
    // Memory level (1-9, trade-off tra memoria e velocità)
    memLevel: 8,
    
    // Strategia compressione
    strategy: 0, // Default strategy, buona per dati misti
    
    // Window bits per gzip (8-15)
    windowBits: 15,
    
    // Chunk size
    chunkSize: 16 * 1024, // 16KB chunks
  });
}

/**
 * Middleware per monitorare l'efficacia della compressione
 */
export function compressionMonitoring(req: Request, res: Response, next: Function) {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Helper per calcolare e loggare compression ratio
  const logCompression = (body: any) => {
    const duration = Date.now() - startTime;
    const encoding = res.getHeader('Content-Encoding');
    
    if (encoding && body) {
      const originalSize = Buffer.byteLength(JSON.stringify(body));
      const compressedSize = parseInt(res.getHeader('Content-Length') as string) || 0;
      
      if (originalSize > 0 && compressedSize > 0) {
        const ratio = ((1 - (compressedSize / originalSize)) * 100).toFixed(1);
        
        // Log solo per response significative (>10KB)
        if (originalSize > 10240) {
          logger.debug('Response compression', {
            requestId: req.requestId,
            path: req.path,
            encoding,
            originalSize: `${(originalSize / 1024).toFixed(1)}KB`,
            compressedSize: `${(compressedSize / 1024).toFixed(1)}KB`,
            compressionRatio: `${ratio}%`,
            duration: `${duration}ms`
          });
        }
      }
    }
  };
  
  // Override res.send
  res.send = function(body: any) {
    logCompression(body);
    return originalSend.call(this, body);
  };
  
  // Override res.json
  res.json = function(body: any) {
    logCompression(body);
    return originalJson.call(this, body);
  };
  
  next();
}

/**
 * Cache headers per static content
 * Migliora performance riducendo richieste
 */
export function staticCacheHeaders(req: Request, res: Response, next: Function) {
  // Solo per contenuti statici
  const staticExtensions = [
    '.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp'
  ];
  
  const isStatic = staticExtensions.some(ext => req.path.endsWith(ext));
  
  if (isStatic) {
    // Cache per 1 anno per assets con hash
    if (req.path.includes('.') && /\.[a-f0-9]{8,}\./.test(req.path)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Cache per 1 giorno per altri static files
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    
    // ETag per cache validation
    res.setHeader('ETag', `"${Buffer.from(req.path).toString('base64')}"`);
    
    // Vary header per cache key
    res.setHeader('Vary', 'Accept-Encoding');
  }
  
  next();
}

/**
 * Setup completo compression e caching
 */
export function setupResponseOptimization(app: any) {
  // 1. Compression
  app.use(setupCompression());
  
  // 2. Monitoring (solo in development)
  if (process.env.NODE_ENV !== 'production') {
    app.use(compressionMonitoring);
  }
  
  // 3. Static cache headers
  app.use(staticCacheHeaders);
  
  logger.info('✅ Response compression enabled (Brotli + Gzip)');
  logger.info('✅ Static content caching configured');
  
  // Log compression stats periodicamente in development
  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      logger.debug('Memory usage with compression', {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)}MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(1)}MB`
      });
    }, 60000); // Ogni minuto
  }
}
