# 🔐 Security Guidelines - Sistema Richiesta Assistenza v2.0.0

**Last Updated**: 6 Settembre 2025  
**Classification**: CONFIDENTIAL  
**Compliance**: OWASP Top 10 2023, GDPR, ISO 27001

## 📋 Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Security Headers](#security-headers)
5. [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
6. [Input Validation & Sanitization](#input-validation--sanitization)
7. [SQL Injection Prevention](#sql-injection-prevention)
8. [XSS Prevention](#xss-prevention)
9. [CSRF Protection](#csrf-protection)
10. [Security Monitoring](#security-monitoring)
11. [Incident Response](#incident-response)
12. [Security Checklist](#security-checklist)

---

## 🏗️ Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────┐
│            Layer 1: CDN/WAF                 │
│         (Cloudflare/AWS CloudFront)         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Layer 2: Load Balancer              │
│           (SSL Termination)                 │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│      Layer 3: Application Firewall          │
│    (Rate Limiting, Security Headers)        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        Layer 4: Application                 │
│   (Auth, Validation, Business Logic)        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Layer 5: Data Layer                 │
│    (Encryption, Access Control)             │
└─────────────────────────────────────────────┘
```

---

## 🔑 Authentication & Authorization

### JWT Token Security

```typescript
// Secure JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET, // Min 256 bits
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: 'assistenza-system',
  audience: 'assistenza-api',
  notBefore: '0',
  jwtid: uuid() // Unique token ID
};

// Token Rotation
- Access Token: 15 minutes
- Refresh Token: 7 days (stored in httpOnly cookie)
- Rotation on each refresh
```

### Two-Factor Authentication (2FA)

```typescript
// TOTP Configuration
const totpConfig = {
  algorithm: 'SHA256',
  digits: 6,
  period: 30,
  window: 2, // Accept ±2 time windows
  issuer: 'LM Tecnologie',
  qrCodeErrorCorrectionLevel: 'M'
};

// Backup Codes
- Generate 10 backup codes on 2FA setup
- Single use only
- Stored as bcrypt hashes
- Alert on low remaining codes
```

### Password Policy

```typescript
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true,
  maxAge: 90, // days
  historyCount: 5 // prevent reuse of last 5 passwords
};

// Bcrypt Configuration
const bcryptRounds = 12; // Adaptive to stay >250ms
```

### Session Management

```typescript
// Session Security
const sessionConfig = {
  name: 'assistenza.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on activity
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JS access
    sameSite: 'lax', // CSRF protection
    maxAge: 30 * 60 * 1000, // 30 minutes
    path: '/',
    domain: '.lmtecnologie.it'
  }
};
```

---

## 🛡️ Data Protection

### Encryption at Rest

```sql
-- PostgreSQL Transparent Data Encryption (TDE)
ALTER SYSTEM SET data_encryption_key_path = '/secure/keys/master.key';

-- Column-level encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt PII
UPDATE users SET 
  ssn = pgp_sym_encrypt(ssn, :encryption_key),
  credit_card = pgp_sym_encrypt(credit_card, :encryption_key);
```

### Encryption in Transit

```nginx
# Nginx SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
```

### Data Masking

```typescript
// PII Masking in Logs
function maskSensitiveData(data: any): any {
  const masked = { ...data };
  
  // Mask email
  if (masked.email) {
    masked.email = masked.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  }
  
  // Mask phone
  if (masked.phone) {
    masked.phone = masked.phone.replace(/(\d{3})(\d+)(\d{2})/, '$1****$3');
  }
  
  // Remove passwords entirely
  delete masked.password;
  delete masked.creditCard;
  delete masked.ssn;
  
  return masked;
}
```

---

## 📋 Security Headers

### Content Security Policy (CSP)

```typescript
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'nonce-{NONCE}'", // Dynamic nonce for inline scripts
    "https://apis.google.com",
    "https://www.googletagmanager.com"
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind
    "https://fonts.googleapis.com"
  ],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: [
    "'self'",
    "https://api.openai.com",
    "https://api.stripe.com",
    "wss://*.lmtecnologie.it"
  ],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'self'", "https://js.stripe.com"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: [],
  blockAllMixedContent: []
};
```

### Security Headers Implementation

```typescript
app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
}));
```

---

## 🚦 Rate Limiting & DDoS Protection

### Rate Limiting Configuration

```typescript
// Tiered Rate Limiting
const rateLimits = {
  // Public endpoints
  public: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests'
  },
  
  // Authentication
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true
  },
  
  // API endpoints
  api: {
    windowMs: 1 * 60 * 1000,
    max: 100
  },
  
  // AI endpoints (expensive)
  ai: {
    windowMs: 1 * 60 * 1000,
    max: 10
  }
};
```

### DDoS Mitigation

```typescript
// Connection limits
app.use((req, res, next) => {
  // Limit request size
  if (req.headers['content-length'] > 10 * 1024 * 1024) { // 10MB
    return res.status(413).json({ error: 'Payload too large' });
  }
  
  // Limit number of parameters
  const paramCount = Object.keys(req.query).length + Object.keys(req.body || {}).length;
  if (paramCount > 100) {
    return res.status(400).json({ error: 'Too many parameters' });
  }
  
  next();
});
```

---

## ✅ Input Validation & Sanitization

### Schema Validation with Zod

```typescript
import { z } from 'zod';

// User registration schema
const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(12)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  postalCode: z.string().regex(/^\d{5}$/),
  // Prevent NoSQL injection
  $where: z.never(),
  $regex: z.never()
});

// Sanitization middleware
function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Remove any MongoDB operators
  const sanitize = (obj: any) => {
    for (const key in obj) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };
  
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
}
```

---

## 💉 SQL Injection Prevention

### Parameterized Queries with Prisma

```typescript
// ✅ SAFE - Parameterized query
const user = await prisma.user.findFirst({
  where: {
    email: userInput, // Automatically parameterized
    isActive: true
  }
});

// ✅ SAFE - Even with raw SQL
const results = await prisma.$queryRaw`
  SELECT * FROM users 
  WHERE email = ${userInput} 
  AND role = ${roleInput}
`;

// ❌ NEVER DO THIS
// const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

### Input Validation for SQL

```typescript
// Whitelist allowed fields for sorting
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'priority'];

function validateSortField(field: string): string {
  if (!ALLOWED_SORT_FIELDS.includes(field)) {
    throw new Error('Invalid sort field');
  }
  return field;
}
```

---

## 🛡️ XSS Prevention

### Output Encoding

```typescript
// HTML encoding
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// JSON encoding for script tags
function safeJsonStringify(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}
```

### React XSS Protection

```tsx
// ✅ SAFE - React escapes by default
<div>{userInput}</div>

// ❌ DANGEROUS - Only use with trusted content
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE - Sanitize first if needed
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 🔒 CSRF Protection

### Token-Based CSRF Protection

```typescript
import csrf from 'csurf';

// CSRF middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
});

// Apply to state-changing operations
app.post('/api/*', csrfProtection);
app.put('/api/*', csrfProtection);
app.delete('/api/*', csrfProtection);

// Provide token to frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

## 📊 Security Monitoring

### Suspicious Activity Detection

```typescript
const securityPatterns = {
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b|--|\/\*|\*\/|xp_|sp_|0x)/i,
  xss: /(<script|javascript:|onerror=|onclick=|<iframe|<object|<embed|<svg)/i,
  pathTraversal: /(\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f)/i,
  commandInjection: /(\||;|&|\$\(|`|>|<|\{|\}|\[|\])/,
  xxe: /(<!DOCTYPE|<!ENTITY|SYSTEM|PUBLIC)/i,
  ldapInjection: /(\*|\(|\)|\||&|=)/
};

function detectSuspiciousActivity(req: Request): string[] {
  const threats: string[] = [];
  const checkString = JSON.stringify({
    path: req.path,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  
  for (const [threat, pattern] of Object.entries(securityPatterns)) {
    if (pattern.test(checkString)) {
      threats.push(threat);
    }
  }
  
  return threats;
}
```

### Security Event Logging

```typescript
interface SecurityEvent {
  timestamp: Date;
  eventType: 'AUTH_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT' | 'CSRF_ATTEMPT';
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  threat?: string;
  requestId: string;
}

async function logSecurityEvent(event: SecurityEvent) {
  // Log to database
  await prisma.securityLog.create({ data: event });
  
  // Alert on critical events
  if (event.eventType === 'SUSPICIOUS_ACTIVITY') {
    await sendSecurityAlert(event);
  }
  
  // Log to SIEM
  logger.security(event);
}
```

---

## 🚨 Incident Response

### Incident Response Plan

1. **Detection & Analysis**
   - Monitor security alerts
   - Analyze threat severity
   - Document initial findings

2. **Containment**
   - Isolate affected systems
   - Block malicious IPs
   - Disable compromised accounts

3. **Eradication**
   - Remove malware/backdoors
   - Patch vulnerabilities
   - Reset credentials

4. **Recovery**
   - Restore from clean backups
   - Monitor for reinfection
   - Verify system integrity

5. **Post-Incident**
   - Document lessons learned
   - Update security controls
   - Security awareness training

### Emergency Contacts

```typescript
const SECURITY_CONTACTS = {
  securityTeam: 'security@lmtecnologie.it',
  ciso: 'ciso@lmtecnologie.it',
  legal: 'legal@lmtecnologie.it',
  gdprOfficer: 'dpo@lmtecnologie.it',
  externalSoc: '+39 02 1234 5678'
};
```

---

## ✅ Security Checklist

### Development Phase
- [ ] Input validation on all endpoints
- [ ] Output encoding for all user content
- [ ] Parameterized database queries
- [ ] Secure session configuration
- [ ] HTTPS enforcement
- [ ] Security headers implementation
- [ ] Rate limiting configuration
- [ ] Error messages don't leak info
- [ ] Logging without sensitive data
- [ ] Dependency vulnerability scan

### Deployment Phase
- [ ] SSL/TLS certificate valid
- [ ] Database encryption enabled
- [ ] Secrets in environment variables
- [ ] File upload restrictions
- [ ] CORS properly configured
- [ ] Admin endpoints protected
- [ ] Backup encryption
- [ ] Monitoring configured
- [ ] WAF rules active
- [ ] DDoS protection enabled

### Maintenance Phase
- [ ] Regular security updates
- [ ] Dependency updates
- [ ] Security log review
- [ ] Access control audit
- [ ] Penetration testing
- [ ] Security training
- [ ] Incident response drills
- [ ] Compliance audits
- [ ] Vulnerability scanning
- [ ] Password rotation

---

## 📚 References

- [OWASP Top 10 2023](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001:2022](https://www.iso.org/standard/27001)
- [GDPR Compliance](https://gdpr.eu/)

---

**Security Guidelines v2.0.0**  
Classification: CONFIDENTIAL  
Last Updated: 6 Settembre 2025  
© 2025 LM Tecnologie - All Rights Reserved
