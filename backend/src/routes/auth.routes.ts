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
  codiceFiscale: z.string().length(16).optional(),
  partitaIva: z.string().length(11).optional(),
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
function generateTokens(recipientId: string) {
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
  validateBody(registerSchema),
  asyncHandler(async (req: any, res: any) => {
    const data = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.email.split('@')[0] }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json(
        ResponseFormatter.error(
          'An account with this email already exists',
          'USER_ALREADY_EXISTS'
        )
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.email.split('@')[0] + '_' + Date.now(), // Ensure unique username
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        role: data.role,
        address: data.address,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        codiceFiscale: data.codiceFiscale,
        partitaIva: data.partitaIva,
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
  asyncHandler(async (req: any, res: any) => {
    const { email, password, twoFactorCode } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Record failed login attempt
      logger.warn(`Login attempt for non-existent User: ${email}`);
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
          recipientId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
          failReason: 'Invalid password'
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
        recipientId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true
      }
    });

    // Generate tokens
    const tokens = generateTokens(user.id);

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
  asyncHandler(async (req: AuthRequest, res: any) => {
    // In a stateless JWT system, logout is handled client-side
    // Here we can log the logout event
    if (req.user) {
      logger.info(`User logged out: ${req.user.email}`);
    }

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
      { recipientId: user.id, purpose: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Note: In SQLite schema, we don't have resetToken fields
    // For now, we'll return the token in development mode
    // In production, this would be sent via email

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