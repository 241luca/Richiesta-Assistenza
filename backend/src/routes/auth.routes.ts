import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { prisma } from '../config/database';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ResponseFormatter, formatUser } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { auditLogService } from '../services/auditLog.service';
import { auditAuth, auditCritical } from '../middleware/auditLogger';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(10).max(20),
  role: z.enum(['CLIENT', 'PROFESSIONAL']).default('CLIENT'),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  province: z.string().length(2),
  postalCode: z.string().regex(/^\d{5}$/),
  codiceFiscale: z.string().length(16).optional().or(z.literal('')),
  partitaIva: z.string().length(11).optional(),
  
  // Campi aggiuntivi
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  username: z.string().optional(),
  fullName: z.string().optional(),
  
  // Campi professionisti
  professionId: z.string().optional(),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessCity: z.string().optional(),
  businessProvince: z.string().optional(),
  businessPostalCode: z.string().optional(),
  businessLatitude: z.number().optional(),
  businessLongitude: z.number().optional(),
  businessCF: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional(),
  businessPec: z.string().email().optional(),
  businessSdi: z.string().optional(),
  approvalStatus: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  twoFactorCode: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

// Helper functions
function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as any
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' } as any
  );

  return { accessToken, refreshToken };
}

// Routes

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  auditAuth(AuditAction.CREATE),
  asyncHandler(async (req: any, res: any) => {
    const data = req.body;
    
    // Validazione manuale per debug
    try {
      const validatedData = registerSchema.parse(data);
    } catch (error: any) {
      logger.error('Validation error:', error);
      return res.status(400).json(
        ResponseFormatter.error(
          'Dati non validi. Controlla tutti i campi obbligatori.',
          'VALIDATION_ERROR',
          error.errors
        )
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase() // Solo email, rimuovi OR con username
      }
    });

    if (existingUser) {
      logger.warn(`Registration attempt with existing email: ${data.email}`);
      return res.status(409).json(
        ResponseFormatter.error(
          'Esiste già un account registrato con questa email. Per favore accedi o usa un\'altra email.',
          'EMAIL_ALREADY_EXISTS'
        )
      );
    }

    // Check for duplicate Partita IVA (for professionals)
    if (data.partitaIva) {
      const existingPIVA = await prisma.user.findFirst({
        where: { partitaIva: data.partitaIva }
      });
      
      if (existingPIVA) {
        return res.status(409).json(
          ResponseFormatter.error(
            'Questa Partita IVA è già registrata nel sistema.',
            'PIVA_ALREADY_EXISTS'
          )
        );
      }
    }

    // Check for duplicate Codice Fiscale
    if (data.codiceFiscale) {
      const existingCF = await prisma.user.findFirst({
        where: { codiceFiscale: data.codiceFiscale.toUpperCase() }
      });
      
      if (existingCF) {
        return res.status(409).json(
          ResponseFormatter.error(
            'Questo Codice Fiscale è già registrato nel sistema.',
            'CF_ALREADY_EXISTS'
          )
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: randomUUID(), // Aggiungi ID univoco
        email: data.email.toLowerCase(),
        username: data.username || (data.email.split('@')[0] + '_' + Date.now()),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName || `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        role: data.role,
        address: data.address,
        city: data.city,
        province: data.province.toUpperCase(),
        postalCode: data.postalCode,
        codiceFiscale: data.codiceFiscale ? data.codiceFiscale.toUpperCase() : null,
        partitaIva: data.partitaIva || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        
        // Professional fields (if applicable)
        ...(data.role === 'PROFESSIONAL' && {
          professionId: data.professionId,
          businessName: data.businessName,
          businessAddress: data.businessAddress,
          businessCity: data.businessCity,
          businessProvince: data.businessProvince?.toUpperCase(),
          businessPostalCode: data.businessPostalCode,
          businessLatitude: data.businessLatitude,
          businessLongitude: data.businessLongitude,
          businessCF: data.businessCF,
          businessPhone: data.businessPhone,
          businessEmail: data.businessEmail,
          businessPec: data.businessPec,
          businessSdi: data.businessSdi,
          approvalStatus: data.approvalStatus || 'PENDING',
        }),
        
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Audit log for new registration
    await auditLogService.log({
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.USER_ACTIVITY,
      metadata: { registrationRole: data.role }
    });

    logger.info(`New user registered: ${user.email} (${user.role})`);

    res.status(201).json(
      ResponseFormatter.success(
        {
          User: formatUser(user),
          ...tokens
        },
        'Registration successful'
      )
    );
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
  validateBody(loginSchema),
  auditAuth(AuditAction.LOGIN_SUCCESS),
  asyncHandler(async (req: any, res: any) => {
    const { email, password, twoFactorCode } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Record failed login attempt
      logger.warn(`Login attempt for non-existent User: ${email}`);
      
      // Audit log for failed login
      await auditLogService.log({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        userEmail: email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: false,
        severity: LogSeverity.WARNING,
        category: LogCategory.SECURITY,
        metadata: { reason: 'User not found' }
      });
      
      return res.status(401).json(
        ResponseFormatter.error(
          'Email or password is incorrect',
          'INVALID_CREDENTIALS'
        )
      );
    }

    // Check if account is locked (using lockedUntil field)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json(
        ResponseFormatter.error(
          'Too many failed login attempts. Please try again later.',
          'ACCOUNT_LOCKED'
        )
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Increment login attempts
      const attempts = user.loginAttempts + 1;
      const updateData: any = { loginAttempts: attempts };

      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      // Record failed login
      await prisma.loginHistory.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
          failReason: 'Invalid password',
          createdAt: new Date()
        }
      });

      return res.status(401).json(
        ResponseFormatter.error(
          'Email or password is incorrect',
          'INVALID_CREDENTIALS'
        )
      );
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json(
          ResponseFormatter.success(
            { requiresTwoFactor: true },
            'Please enter your 2FA code'
          )
        );
      }

      const isValid2FA = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!isValid2FA) {
        return res.status(401).json(
          ResponseFormatter.error(
            'The 2FA code is incorrect or expired',
            'INVALID_2FA_CODE'
          )
        );
      }
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // Record successful login
    await prisma.loginHistory.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true,
        createdAt: new Date()
      }
    });

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Audit log for successful login
    await auditLogService.log({
      action: AuditAction.LOGIN_SUCCESS,
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.SECURITY
    });

    logger.info(`User logged in: ${user.email}`);

    res.json(
      ResponseFormatter.success(
        {
          User: formatUser(user),
          ...tokens
        },
        'Login successful'
      )
    );
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req: any, res: any) => {
    const { refreshToken } = req.body;

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
      ) as any;

      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.userId
        }
      });

      if (!user) {
        return res.status(401).json(
          ResponseFormatter.error(
            'User not found',
            'INVALID_REFRESH_TOKEN'
          )
        );
      }

      // Generate new tokens
      const tokens = generateTokens(user.id);

      res.json(
        ResponseFormatter.success(
          tokens,
          'Token refreshed successfully'
        )
      );
    } catch (error) {
      return res.status(401).json(
        ResponseFormatter.error(
          'Please login again',
          'INVALID_REFRESH_TOKEN'
        )
      );
    }
  })
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', 
  optionalAuth,
  auditAuth(AuditAction.LOGOUT),
  asyncHandler(async (req: AuthRequest, res: any) => {
    // In a stateless JWT system, logout is handled client-side
    // Here we can log the logout event
    if (req.user) {
      // Audit log for logout con tutti i dati utente
      await auditLogService.log({
        action: AuditAction.LOGOUT,
        entityType: 'Authentication',
        entityId: req.user.id,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.SECURITY,
        metadata: {
          logoutTime: new Date()
        }
      });
      
      logger.info(`User logged out: ${req.user.email}`);
    }

    // REMOVED: Clear-Site-Data header that was causing warnings
    // The frontend will handle clearing local storage
    
    res.json(
      ResponseFormatter.success(
        null,
        'Logout successful'
      )
    );
  })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password',
  validateBody(forgotPasswordSchema),
  auditCritical('PasswordReset', AuditAction.PASSWORD_RESET_REQUESTED),
  asyncHandler(async (req: any, res: any) => {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return res.json(
        ResponseFormatter.success(
          null,
          'If the email exists, a password reset link has been sent'
        )
      );
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // ADDED: Send password reset notification
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await notificationService.sendToUser({
        userId: user.id,
        type: 'PASSWORD_RESET',
        title: 'Reset della tua password',
        message: `Hai richiesto il reset della password. Clicca sul link per procedere. Il link scadrà tra 1 ora.`,
        priority: 'urgent',
        data: {
          resetUrl,
          expiresIn: '1 ora'
        },
        channels: ['email'] // Solo email per sicurezza
      });
    } catch (error) {
      logger.error('Error sending password reset notification:', error);
    }

    logger.info(`Password reset requested for: ${email}`);

    const responseData = process.env.NODE_ENV === 'development' ? { resetToken } : null;

    res.json(
      ResponseFormatter.success(
        responseData,
        'If the email exists, a password reset link has been sent'
      )
    );
  })
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password',
  validateBody(resetPasswordSchema),
  auditCritical('PasswordReset', AuditAction.PASSWORD_CHANGED),
  asyncHandler(async (req: any, res: any) => {
    const { token, password } = req.body;

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json(
          ResponseFormatter.error(
            'This token is not valid for password reset',
            'INVALID_TOKEN'
          )
        );
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId
        }
      });

      if (!user) {
        return res.status(400).json(
          ResponseFormatter.error(
            'User not found',
            'INVALID_TOKEN'
          )
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          loginAttempts: 0,
          lockedUntil: null
        }
      });

      // ADDED: Send password reset confirmation notification
      try {
        await notificationService.sendToUser({
          userId: user.id,
          type: 'PASSWORD_CHANGED',
          title: 'Password modificata con successo',
          message: `La tua password è stata modificata con successo. Se non sei stato tu, contatta immediatamente il supporto.`,
          priority: 'high',
          data: {
            changedAt: new Date()
          },
          channels: ['websocket', 'email']
        });
      } catch (error) {
        logger.error('Error sending password changed notification:', error);
      }

      logger.info(`Password reset for User: ${user.email}`);

      res.json(
        ResponseFormatter.success(
          null,
          'Password reset successful'
        )
      );
    } catch (error) {
      return res.status(400).json(
        ResponseFormatter.error(
          'The reset token is invalid or has expired',
          'INVALID_OR_EXPIRED_TOKEN'
        )
      );
    }
  })
);

/**
 * POST /api/auth/2fa/setup
 * Setup 2FA for authenticated user
 */
router.post('/2fa/setup',
  asyncHandler(async (req: AuthRequest, res: any) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseFormatter.error(
          'Authentication required',
          'AUTHENTICATION_REQUIRED'
        )
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${process.env.TWO_FACTOR_APP_NAME} (${req.user.email})`,
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Temporarily store secret (user must verify before enabling)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: secret.base32 }
    });

    res.json(
      ResponseFormatter.success(
        {
          secret: secret.base32,
          qrCode: qrCodeUrl
        },
        '2FA setup initiated'
      )
    );
  })
);

/**
 * POST /api/auth/2fa/verify
 * Verify and enable 2FA
 */
router.post('/2fa/verify',
  asyncHandler(async (req: AuthRequest, res: any) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseFormatter.error(
          'Authentication required',
          'AUTHENTICATION_REQUIRED'
        )
      );
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json(
        ResponseFormatter.error(
          'Verification code required',
          'CODE_REQUIRED'
        )
      );
    }

    // Get user with secret
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user?.twoFactorSecret) {
      return res.status(400).json(
        ResponseFormatter.error(
          'Please setup 2FA first',
          '2FA_NOT_CONFIGURED'
        )
      );
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isValid) {
      return res.status(400).json(
        ResponseFormatter.error(
          'The verification code is incorrect',
          'INVALID_CODE'
        )
      );
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });

    logger.info(`2FA enabled for User: ${user.email}`);

    res.json(
      ResponseFormatter.success(
        null,
        '2FA enabled successfully'
      )
    );
  })
);

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA
 */
router.post('/2fa/disable',
  asyncHandler(async (req: AuthRequest, res: any) => {
    if (!req.user) {
      return res.status(401).json(
        ResponseFormatter.error(
          'Authentication required',
          'AUTHENTICATION_REQUIRED'
        )
      );
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json(
        ResponseFormatter.error(
          'Password required',
          'PASSWORD_REQUIRED'
        )
      );
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isValidPassword = await bcrypt.compare(password, user!.password);

    if (!isValidPassword) {
      return res.status(401).json(
        ResponseFormatter.error(
          'Invalid password',
          'INVALID_PASSWORD'
        )
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });

    logger.info(`2FA disabled for User: ${user!.email}`);

    res.json(
      ResponseFormatter.success(
        null,
        '2FA disabled successfully'
      )
    );
  })
);

export default router;