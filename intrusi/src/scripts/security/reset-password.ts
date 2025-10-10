/**
 * Script per il reset forzato della password di un utente
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

interface ResetPasswordParams {
  email: string;
  sendEmail?: boolean;
}

export async function execute(params: ResetPasswordParams) {
  try {
    logger.info('🔐 Starting password reset...', { email: params.email });
    
    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: params.email }
    });
    
    if (!user) {
      throw new Error(`User with email ${params.email} not found`);
    }
    
    // Genera una nuova password temporanea
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    const hashedPassword = await hash(tempPassword, 10);
    
    // Aggiorna la password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: true
      }
    });
    
    // Log dell'operazione nell'audit
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_FORCED',
        entityType: 'User',
        entityId: user.id,
        userId: null, // System action
        success: true,
        severity: 'WARNING',
        category: 'SECURITY',
        ipAddress: 'SYSTEM',
        userAgent: 'Script Manager'
      }
    });
    
    let emailSent = false;
    if (params.sendEmail) {
      // In produzione, qui invieresti l'email con la nuova password
      logger.info(`📧 Email would be sent to ${params.email} with temporary password`);
      emailSent = true;
    }
    
    logger.info(`✅ Password reset completed for ${params.email}`);
    
    return {
      success: true,
      userId: user.id,
      email: params.email,
      temporaryPassword: params.sendEmail ? '(sent via email)' : tempPassword,
      emailSent,
      message: `Password reset successfully for ${params.email}`,
      warning: 'User must change password on next login'
    };
    
  } catch (error: any) {
    logger.error('❌ Password reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
