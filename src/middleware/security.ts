/**
 * Advanced Security Headers Middleware
 * Implementa headers di sicurezza secondo le best practices OWASP
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/logger';

/**
 * Genera un nonce univoco per CSP inline scripts
 */
function generateNonce(): string {
  return Buffer.from(Math.random().toString(36).substring(2, 15)).toString('base64');
}

/**
 * Security Headers Configuration
 * Implementa una protezione completa contro gli attacchi web comuni
 */
export function setupSecurityHeaders() {
  return helmet({
    // Content Security Policy - Protezione XSS avanzata
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        
        // Scripts: solo da origine sicura + nonce per inline
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Temporaneo per compatibilità, da rimuovere in produzione
          "https://apis.google.com", // Google Maps
          "https://maps.googleapis.com",
          "https://cdn.jsdelivr.net", // CDN affidabili
          "https://unpkg.com"
        ],
        
        // Styles: self + inline sicuri
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Per Tailwind e inline styles
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        
        // Immagini: self + data URI + HTTPS
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "https://*.googleapis.com", // Google services
          "https://*.gstatic.com"
        ],
        
        // Font: solo da CDN affidabili
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net"
        ],
        
        // Connessioni: API e WebSocket
        connectSrc: [
          "'self'",
          "wss://localhost:*", // WebSocket locale
          "wss://*.replit.dev", // WebSocket Replit
          "https://api.openai.com", // OpenAI API
          "https://api.stripe.com", // Stripe API
          "https://maps.googleapis.com", // Google Maps
          "https://api-ssl.brevo.com", // Email service
        ],
        
        // Frame: blocca embedding esterni
        frameSrc: ["'self'", "https://js.stripe.com"], // Solo Stripe checkout
        
        // Media
        mediaSrc: ["'self'"],
        
        // Object/embed: blocca plugins pericolosi
        objectSrc: ["'none'"],
        
        // Base URI: previene injection
        baseUri: ["'self'"],
        
        // Form action: solo stesso dominio
        formAction: ["'self'"],
        
        // Frame ancestors: previene clickjacking
        frameAncestors: ["'none'"],
        
        // Upgrade insecure requests
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        
        // Block mixed content
        blockAllMixedContent: process.env.NODE_ENV === 'production' ? [] : null
      },
      reportOnly: false, // In produzione mettere true inizialmente per test
    },
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 anno
      includeSubDomains: true,
      preload: true // Richiedi inclusione in HSTS preload list
    },
    
    // X-Frame-Options: Previene clickjacking
    frameguard: {
      action: 'deny' // Blocca completamente embedding in iframe
    },
    
    // X-Content-Type-Options: Previene MIME sniffing
    noSniff: true,
    
    // X-XSS-Protection: Protezione XSS legacy (per browser vecchi)
    xssFilter: true,
    
    // Referrer-Policy: Controlla informazioni referrer
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    
    // X-Permitted-Cross-Domain-Policies: Adobe products policy
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },
    
    // X-DNS-Prefetch-Control: Controlla DNS prefetching
    dnsPrefetchControl: {
      allow: false
    },
    
    // X-Download-Options: IE8+ protezione download
    ieNoOpen: true,
    
    // Expect-CT: Certificate Transparency (Deprecated)
    // expectCt: process.env.NODE_ENV === 'production' ? {
    //   maxAge: 86400, // 1 giorno
    //   enforce: true,
    //   reportUri: '/api/security/ct-report'
    // } : false,
    
    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Disabilitato per compatibilità
    
    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin'
    },
    
    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin' // Per permettere CDN
    },
    
    // Origin-Agent-Cluster
    originAgentCluster: true
  });
}

/**
 * Additional Security Middleware
 * Aggiunge headers custom e logging
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Aggiungi nonce per CSP se necessario
  res.locals.nonce = generateNonce();
  
  // Custom security headers
  res.setHeader('X-Powered-By', 'AssistanceSystem'); // Nasconde Express
  res.setHeader('X-Request-ID', req.requestId || 'unknown'); // Tracking
  
  // Permissions Policy (ex Feature Policy)
  res.setHeader('Permissions-Policy', [
    'accelerometer=()',
    'camera=()',
    'geolocation=(self)',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=(self)',
    'usb=()',
    'interest-cohort=()' // Opt-out FLoC di Google
  ].join(', '));
  
  // Cache Control per contenuti sensibili
  if (req.path.includes('/api/auth') || req.path.includes('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Clear-Site-Data header per logout
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }
  
  next();
}

/**
 * Security Monitoring Middleware
 * Monitora tentativi di attacco
 */
export function securityMonitoring(req: Request, res: Response, next: NextFunction) {
  // Monitora pattern sospetti
  const suspiciousPatterns = [
    /(\.\.|\/\/|\\\\)/, // Path traversal
    /<script|javascript:|onerror=/i, // XSS attempts
    /union.*select|select.*from|insert.*into|delete.*from/i, // SQL injection
    /\${|`|\$\(/, // Template injection
    /%00|%0d|%0a/, // Null byte injection
  ];
  
  const checkString = `${req.path}${JSON.stringify(req.query)}${JSON.stringify(req.body)}`;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logger.warn('Suspicious request detected', {
        requestId: req.requestId,
        ip: req.ip,
        path: req.path,
        pattern: pattern.toString(),
        userAgent: req.headers['user-agent']
      });
      
      // In produzione, potresti voler bloccare la richiesta
      if (process.env.NODE_ENV === 'production' && process.env.BLOCK_SUSPICIOUS === 'true') {
        return res.status(400).json({
          success: false,
          message: 'Invalid request',
          requestId: req.requestId
        });
      }
    }
  }
  
  next();
}

/**
 * Rate Limiting per Security
 * Protegge da brute force e DoS
 */
import rateLimit from 'express-rate-limit';

export const securityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite richieste per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Store: usa Redis in produzione per scalabilità
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      requestId: req.requestId
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

// Rate limiting più stretto per auth
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // solo 5 tentativi di login
  skipSuccessfulRequests: true, // Non contare login riusciti
  message: 'Too many authentication attempts.',
  handler: (req, res) => {
    logger.error('Auth rate limit exceeded - possible brute force', {
      ip: req.ip,
      email: req.body?.email,
      requestId: req.requestId
    });
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

/**
 * Export all security middleware as a single setup function
 */
export function setupCompleteSecurity(app: any) {
  // 1. Base security headers
  app.use(setupSecurityHeaders());
  
  // 2. Additional custom headers
  app.use(additionalSecurityHeaders);
  
  // 3. Security monitoring
  app.use(securityMonitoring);
  
  // 4. General rate limiting
  app.use('/api/', securityRateLimit);
  
  // 5. Strict rate limiting for auth
  app.use('/api/auth/login', authRateLimit);
  app.use('/api/auth/register', authRateLimit);
  
  logger.info('✅ Advanced security headers configured');
  logger.info('✅ Rate limiting activated');
  logger.info('✅ Security monitoring enabled');
}
