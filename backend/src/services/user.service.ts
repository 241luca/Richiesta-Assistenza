import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service'; // FIXED: import singleton instance
import { sendEmail } from './email.service';

export interface UserCreateData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  profession?: string;
  hourlyRate?: number;
  canSelfAssign?: boolean;
  emailVerified?: boolean;
}

export interface UserUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role?: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  profession?: string;
  hourlyRate?: number;
  canSelfAssign?: boolean;
  emailVerified?: boolean;
  status?: string;
  lockedUntil?: Date | null;
}

class UserService {
  /**
   * Crea un nuovo utente
   */
  async createUser(data: UserCreateData) {
    // Verifica email duplicata
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('Email già registrata');
    }

    // Genera username se non fornito
    const username = data.username || 
      `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}.${Date.now()}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crea utente
    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email.toLowerCase(),
        username: username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        role: data.role,
        phone: data.phone,
        address: data.address,
        city: data.city,
        province: data.province?.toUpperCase(),
        postalCode: data.postalCode,
        codiceFiscale: data.codiceFiscale,
        partitaIva: data.partitaIva,
        profession: data.profession,
        hourlyRate: data.hourlyRate,
        canSelfAssign: data.canSelfAssign || false,
        emailVerified: data.emailVerified || false,
        status: 'offline', // Default status nel database
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info(`New user created: ${newUser.id} (${newUser.email})`);
    
    // ADDED: Invia notifica di benvenuto
    try {
      await notificationService.sendToUser({
        userId: newUser.id,
        type: 'WELCOME',
        title: 'Benvenuto in Richiesta Assistenza!',
        message: `Ciao ${newUser.firstName}, benvenuto nella nostra piattaforma! Esplora i servizi disponibili e richiedi assistenza quando ne hai bisogno.`,
        priority: 'normal',
        data: {
          userName: newUser.firstName,
          userRole: newUser.role
        },
        channels: ['websocket', 'email']
      });
    } catch (error) {
      logger.error('Error sending welcome notification:', error);
      // Non bloccare la creazione utente se la notifica fallisce
    }
    
    return newUser;
  }

  /**
   * Ottieni un utente per ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        professionData: true,
        professionalUserSubcategories: {
          include: {
            subcategory: {
              include: {
                category: true
              }
            }
          }
        },
        _count: {
          select: {
            clientRequests: true,
            professionalRequests: true,
            quotes: true,
            payments: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    return user;
  }

  /**
   * Ottieni lista utenti con filtri
   */
  async getUsers(filters: any = {}) {
    const where: any = {};

    // Costruisci filtri
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.role) where.role = filters.role;
    if (filters.emailVerified !== undefined) where.emailVerified = filters.emailVerified;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.province) where.province = filters.province.toUpperCase();

    // Gestione status "attivo" - consideriamo attivi gli utenti NON offline e NON deleted
    if (filters.isActive === true) {
      where.status = { notIn: ['offline', 'deleted'] };
      where.OR = [
        { lockedUntil: null },
        { lockedUntil: { lte: new Date() } }
      ];
    } else if (filters.isActive === false) {
      where.OR = [
        { status: { in: ['offline', 'deleted'] } },
        { lockedUntil: { gt: new Date() } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            clientRequests: true,
            professionalRequests: true,
            quotes: true
          }
        }
      },
      orderBy: filters.sortBy ? { [filters.sortBy]: filters.sortOrder || 'desc' } : { createdAt: 'desc' },
      skip: filters.skip,
      take: filters.take
    });

    const total = await prisma.user.count({ where });

    return { users, total };
  }

  /**
   * Aggiorna un utente
   */
  async updateUser(userId: string, data: UserUpdateData) {
    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('Utente non trovato');
    }

    // Se cambia email, verifica che non sia già in uso
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (emailExists) {
        throw new Error('Email già in uso');
      }
    }

    // Prepara dati aggiornamento
    const updateData: any = { ...data };
    
    // Aggiorna fullName se cambiano nome o cognome
    if (data.firstName || data.lastName) {
      updateData.fullName = `${data.firstName || existingUser.firstName} ${data.lastName || existingUser.lastName}`;
    }

    // Normalizza province
    if (updateData.province) {
      updateData.province = updateData.province.toUpperCase();
    }

    updateData.updatedAt = new Date();

    // Aggiorna utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    logger.info(`User updated: ${userId}`);
    return updatedUser;
  }

  /**
   * Elimina un utente (soft delete)
   */
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new Error('Non è possibile eliminare un Super Admin');
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'deleted',
        lockedUntil: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 anni
        updatedAt: new Date()
      }
    });

    logger.info(`User deleted: ${userId}`);
  }

  /**
   * Cambia password utente
   */
  async changePassword(userId: string, newPassword: string, sendEmailNotification: boolean = false) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    // Hash nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Invia email se richiesto
    if (sendEmailNotification) {
      // Usa il sistema di notifiche esistente
      const notificationService = new NotificationService();
      
      await notificationService.sendToUser({
        userId: user.id,
        type: 'password_changed',
        title: 'Password modificata',
        message: 'La tua password è stata modificata con successo. Se non hai richiesto tu questa modifica, contatta immediatamente l\'amministratore.',
        priority: 'high',
        channels: ['email', 'websocket']
      });
    }

    logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Invia email di benvenuto usando il sistema esistente
   */
  async sendWelcomeEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    // Usa il sistema di notifiche esistente
    const notificationService = new NotificationService();
    
    // Invia notifica di benvenuto (include email se configurata)
    await notificationService.sendToUser({
      userId: user.id,
      type: 'user_welcome',
      title: 'Benvenuto nel nostro sistema!',
      message: `Ciao ${user.firstName}, il tuo account è stato creato con successo. Puoi ora accedere al sistema con le tue credenziali.`,
      priority: 'normal',
      channels: ['email', 'websocket']
    });

    // In alternativa, usa direttamente il servizio email
    await sendEmail({
      to: user.email,
      subject: 'Benvenuto nel nostro sistema!',
      html: `
        <h2>Benvenuto ${user.firstName} ${user.lastName}!</h2>
        <p>Il tuo account è stato creato con successo.</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Ruolo:</strong> ${user.role}</p>
        <p>Puoi accedere al sistema dal seguente link:</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5193'}">Accedi al sistema</a></p>
        <br>
        <p>Cordiali saluti,<br>Il Team di Supporto</p>
      `,
      text: `Benvenuto ${user.firstName}! Il tuo account è stato creato con successo.`
    });

    logger.info(`Welcome email sent to user: ${userId}`);
  }

  /**
   * Blocca utente
   */
  async blockUser(userId: string, days: number = 30, reason?: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    });

    logger.info(`User blocked for ${days} days: ${userId} - Reason: ${reason || 'N/A'}`);
  }

  /**
   * Sblocca utente
   */
  async unblockUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        updatedAt: new Date()
      }
    });

    logger.info(`User unblocked: ${userId}`);
  }

  /**
   * Attiva utente
   */
  async activateUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'offline', // Nel tuo DB non c'è 'active', uso 'offline' come attivo
        lockedUntil: null,
        updatedAt: new Date()
      }
    });

    logger.info(`User activated: ${userId}`);
  }

  /**
   * Disattiva utente
   */
  async deactivateUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'inactive',
        updatedAt: new Date()
      }
    });

    logger.info(`User deactivated: ${userId}`);
  }

  /**
   * Verifica email
   */
  async verifyEmail(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info(`Email verified for user: ${userId}`);
    
    // ADDED: Invia notifica di conferma
    try {
      await notificationService.sendToUser({
        userId: userId,
        type: 'EMAIL_VERIFIED',
        title: 'Email verificata con successo',
        message: `Ottimo ${user.firstName}! La tua email è stata verificata. Ora puoi accedere a tutte le funzionalità della piattaforma.`,
        priority: 'normal',
        data: {
          verifiedAt: new Date()
        },
        channels: ['websocket', 'email']
      });
    } catch (error) {
      logger.error('Error sending email verified notification:', error);
    }
  }

  /**
   * Statistiche utenti
   */
  async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      byRole,
      newToday,
      newWeek,
      newMonth
    ] = await Promise.all([
      // Totale utenti
      prisma.user.count(),
      
      // Utenti attivi (non offline e non deleted e non bloccati)
      prisma.user.count({ 
        where: { 
          status: { notIn: ['offline', 'deleted', 'inactive'] },
          OR: [
            { lockedUntil: null },
            { lockedUntil: { lte: new Date() } }
          ]
        } 
      }),

      // Utenti bloccati
      prisma.user.count({
        where: {
          lockedUntil: { gt: new Date() }
        }
      }),

      // Utenti verificati
      prisma.user.count({
        where: { emailVerified: true }
      }),

      // Per ruolo
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),

      // Nuovi oggi
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // Nuovi settimana
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Nuovi mese
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
      verified: verifiedUsers,
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<string, number>),
      growth: {
        today: newToday,
        week: newWeek,
        month: newMonth
      }
    };
  }

  /**
   * Conta richieste per utente
   */
  async getUserRequestsCount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    if (user.role === 'CLIENT') {
      // Conta richieste come cliente
      return await prisma.assistanceRequest.count({
        where: { clientId: userId }
      });
    } else if (user.role === 'PROFESSIONAL') {
      // Conta richieste come professionista
      return await prisma.assistanceRequest.count({
        where: { professionalId: userId }
      });
    }

    return 0;
  }
}

export const userService = new UserService();