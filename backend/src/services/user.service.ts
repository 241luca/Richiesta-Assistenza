/**
 * User Service
 * Gestione completa degli utenti del sistema
 * 
 * Responsabilità:
 * - CRUD operazioni utenti
 * - Gestione autenticazione (password, email verification)
 * - Gestione ruoli e permessi
 * - Blocco/Sblocco utenti
 * - Attivazione/Disattivazione account
 * - Statistiche utenti
 * - Notifiche benvenuto e modifiche
 * - Soft delete utenti
 * 
 * @module services/user
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { sendEmail } from './email.service';

/**
 * Interface per creazione utente
 */
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

/**
 * Interface per aggiornamento utente
 */
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

/**
 * User Service Class
 * 
 * Gestisce il ciclo di vita completo degli utenti:
 * registrazione, autenticazione, modifica, blocco/sblocco, statistiche.
 */
class UserService {
  
  /**
   * Crea un nuovo utente nel sistema
   * 
   * @param {UserCreateData} data - Dati utente da creare
   * @returns {Promise<Object>} Utente creato (senza password)
   * @throws {Error} Se email già registrata
   * 
   * @example
   * const user = await userService.createUser({
   *   email: 'user@example.com',
   *   password: 'securePass123',
   *   firstName: 'Mario',
   *   lastName: 'Rossi',
   *   role: 'CLIENT'
   * });
   */
  async createUser(data: UserCreateData) {
    try {
      logger.info('[UserService] Creating new user', { 
        email: data.email,
        role: data.role 
      });

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
          status: 'offline',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] User created successfully: ${newUser.id} (${newUser.email})`);
      
      // Invia notifica benvenuto (non-blocking)
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
      } catch (notificationError) {
        logger.error('[UserService] Error sending welcome notification:', notificationError);
      }
      
      return newUser;
      
    } catch (error) {
      logger.error('[UserService] Error creating user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni un utente per ID con dati completi
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<Object>} Utente con dati correlati
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * const user = await userService.getUserById('user-123');
   */
  async getUserById(userId: string) {
    try {
      logger.info(`[UserService] Fetching user by ID: ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          Profession: true,
          ProfessionalUserSubcategory: {
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
              quotes: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      logger.info(`[UserService] User found: ${userId}`);
      return user;
      
    } catch (error) {
      logger.error('[UserService] Error fetching user by ID:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni lista utenti con filtri e paginazione
   * 
   * @param {Object} filters - Filtri di ricerca
   * @param {string} filters.search - Testo ricerca (email, nome, username)
   * @param {string} filters.role - Filtro per ruolo
   * @param {boolean} filters.emailVerified - Filtro email verificate
   * @param {boolean} filters.isActive - Filtro utenti attivi
   * @param {string} filters.city - Filtro per città
   * @param {string} filters.province - Filtro per provincia
   * @param {string} filters.sortBy - Campo ordinamento
   * @param {string} filters.sortOrder - Direzione ordinamento (asc/desc)
   * @param {number} filters.skip - Offset paginazione
   * @param {number} filters.take - Limite risultati
   * @returns {Promise<Object>} { users: Array, total: number }
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const result = await userService.getUsers({
   *   search: 'mario',
   *   role: 'CLIENT',
   *   isActive: true,
   *   take: 20,
   *   skip: 0
   * });
   */
  async getUsers(filters: any = {}) {
    try {
      logger.info('[UserService] Fetching users with filters', filters);

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

      // Gestione utenti attivi
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

      // Query utenti
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
        orderBy: filters.sortBy 
          ? { [filters.sortBy]: filters.sortOrder || 'desc' } 
          : { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take
      });

      const total = await prisma.user.count({ where });

      logger.info(`[UserService] Found ${users.length} users (total: ${total})`);
      return { users, total };
      
    } catch (error) {
      logger.error('[UserService] Error fetching users:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiorna dati di un utente
   * 
   * @param {string} userId - ID utente
   * @param {UserUpdateData} data - Dati da aggiornare (parziale)
   * @returns {Promise<Object>} Utente aggiornato
   * @throws {Error} Se utente non trovato o email già in uso
   * 
   * @example
   * const updated = await userService.updateUser('user-123', {
   *   firstName: 'Mario',
   *   phone: '+39 123456789'
   * });
   */
  async updateUser(userId: string, data: UserUpdateData) {
    try {
      logger.info(`[UserService] Updating user: ${userId}`, Object.keys(data));

      // Verifica esistenza
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('Utente non trovato');
      }

      // Se cambia email, verifica unicità
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
      
      // Aggiorna fullName se cambiano nome/cognome
      if (data.firstName || data.lastName) {
        updateData.fullName = `${data.firstName || existingUser.firstName} ${data.lastName || existingUser.lastName}`;
      }

      // Normalizza provincia
      if (updateData.province) {
        updateData.province = updateData.province.toUpperCase();
      }

      updateData.updatedAt = new Date();

      // Aggiorna
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      logger.info(`[UserService] User updated successfully: ${userId}`);
      return updatedUser;
      
    } catch (error) {
      logger.error('[UserService] Error updating user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Elimina un utente (soft delete)
   * 
   * @param {string} userId - ID utente da eliminare
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato o è SUPER_ADMIN
   * 
   * @example
   * await userService.deleteUser('user-123');
   */
  async deleteUser(userId: string) {
    try {
      logger.info(`[UserService] Deleting user: ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      if (user.role === 'SUPER_ADMIN') {
        throw new Error('Non è possibile eliminare un Super Admin');
      }

      // Soft delete (blocco per 100 anni)
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'deleted',
          lockedUntil: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] User deleted (soft): ${userId}`);
      
    } catch (error) {
      logger.error('[UserService] Error deleting user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Cambia password di un utente
   * 
   * @param {string} userId - ID utente
   * @param {string} newPassword - Nuova password (plain text, verrà hashata)
   * @param {boolean} sendEmailNotification - Se inviare notifica email
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * await userService.changePassword('user-123', 'newSecurePass123', true);
   */
  async changePassword(userId: string, newPassword: string, sendEmailNotification: boolean = false) {
    try {
      logger.info(`[UserService] Changing password for user: ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      // Hash nuova password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Aggiorna
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] Password changed successfully: ${userId}`);

      // Invia notifica se richiesto (non-blocking)
      if (sendEmailNotification) {
        try {
          await notificationService.sendToUser({
            userId: user.id,
            type: 'PASSWORD_CHANGED',
            title: 'Password modificata',
            message: 'La tua password è stata modificata con successo. Se non hai richiesto tu questa modifica, contatta immediatamente l\'amministratore.',
            priority: 'high',
            channels: ['email', 'websocket']
          });
        } catch (notificationError) {
          logger.error('[UserService] Error sending password change notification:', notificationError);
        }
      }
      
    } catch (error) {
      logger.error('[UserService] Error changing password:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Invia email di benvenuto a un utente
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * await userService.sendWelcomeEmail('user-123');
   */
  async sendWelcomeEmail(userId: string) {
    try {
      logger.info(`[UserService] Sending welcome email to user: ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      // Notifica via notification service
      await notificationService.sendToUser({
        userId: user.id,
        type: 'USER_WELCOME',
        title: 'Benvenuto nel nostro sistema!',
        message: `Ciao ${user.firstName}, il tuo account è stato creato con successo. Puoi ora accedere al sistema con le tue credenziali.`,
        priority: 'normal',
        channels: ['email', 'websocket']
      });

      // Email diretta con template
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

      logger.info(`[UserService] Welcome email sent successfully: ${userId}`);
      
    } catch (error) {
      logger.error('[UserService] Error sending welcome email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Blocca un utente per un periodo specificato
   * 
   * @param {string} userId - ID utente
   * @param {number} days - Giorni di blocco (default: 30)
   * @param {string} reason - Motivo blocco (opzionale)
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * await userService.blockUser('user-123', 7, 'Violazione termini servizio');
   */
  async blockUser(userId: string, days: number = 30, reason?: string) {
    try {
      logger.info(`[UserService] Blocking user: ${userId} for ${days} days`, { reason });

      await prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] User blocked successfully: ${userId} for ${days} days`);
      
    } catch (error) {
      logger.error('[UserService] Error blocking user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        days,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Sblocca un utente precedentemente bloccato
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * await userService.unblockUser('user-123');
   */
  async unblockUser(userId: string) {
    try {
      logger.info(`[UserService] Unblocking user: ${userId}`);

      await prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: null,
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] User unblocked successfully: ${userId}`);
      
    } catch (error) {
      logger.error('[UserService] Error unblocking user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Attiva un account utente
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * await userService.activateUser('user-123');
   */
  async activateUser(userId: string) {
    try {
      logger.info(`[UserService] Activating user: ${userId}`);

      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'offline',
          lockedUntil: null,
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] User activated successfully: ${userId}`);
      
    } catch (error) {
      logger.error('[UserService] Error activating user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Disattiva un account utente
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * await userService.deactivateUser('user-123');
   */
  async deactivateUser(userId: string) {
    try {
      logger.info(`[UserService] Deactivating user: ${userId}`);

      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'inactive',
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] User deactivated successfully: ${userId}`);
      
    } catch (error) {
      logger.error('[UserService] Error deactivating user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Verifica l'email di un utente
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * await userService.verifyEmail('user-123');
   */
  async verifyEmail(userId: string) {
    try {
      logger.info(`[UserService] Verifying email for user: ${userId}`);

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info(`[UserService] Email verified successfully: ${userId}`);
      
      // Notifica conferma (non-blocking)
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
      } catch (notificationError) {
        logger.error('[UserService] Error sending email verified notification:', notificationError);
      }
      
    } catch (error) {
      logger.error('[UserService] Error verifying email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni statistiche complete sugli utenti
   * 
   * @returns {Promise<Object>} Statistiche dettagliate
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const stats = await userService.getUserStats();
   * // {
   * //   total: 1500,
   * //   active: 1200,
   * //   blocked: 50,
   * //   verified: 1400,
   * //   byRole: { CLIENT: 1000, PROFESSIONAL: 400, ADMIN: 100 },
   * //   growth: { today: 5, week: 35, month: 150 }
   * // }
   */
  async getUserStats() {
    try {
      logger.info('[UserService] Fetching user statistics');

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
        prisma.user.count(),
        
        prisma.user.count({ 
          where: { 
            status: { notIn: ['offline', 'deleted', 'inactive'] },
            OR: [
              { lockedUntil: null },
              { lockedUntil: { lte: new Date() } }
            ]
          } 
        }),

        prisma.user.count({
          where: {
            lockedUntil: { gt: new Date() }
          }
        }),

        prisma.user.count({
          where: { emailVerified: true }
        }),

        prisma.user.groupBy({
          by: ['role'],
          _count: true
        }),

        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),

        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),

        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      const stats = {
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

      logger.info('[UserService] Statistics fetched successfully', { 
        total: stats.total,
        active: stats.active 
      });

      return stats;
      
    } catch (error) {
      logger.error('[UserService] Error fetching user stats:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Conta le richieste di un utente (come cliente o professionista)
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<number>} Numero richieste
   * @throws {Error} Se utente non trovato
   * 
   * @example
   * const count = await userService.getUserRequestsCount('user-123');
   */
  async getUserRequestsCount(userId: string) {
    try {
      logger.info(`[UserService] Counting requests for user: ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      let count = 0;

      if (user.role === 'CLIENT') {
        count = await prisma.assistanceRequest.count({
          where: { clientId: userId }
        });
      } else if (user.role === 'PROFESSIONAL') {
        count = await prisma.assistanceRequest.count({
          where: { professionalId: userId }
        });
      }

      logger.info(`[UserService] User ${userId} has ${count} requests`);
      return count;
      
    } catch (error) {
      logger.error('[UserService] Error counting user requests:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const userService = new UserService();
