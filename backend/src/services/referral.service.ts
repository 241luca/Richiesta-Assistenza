import { prisma } from '../config/database';
import { customAlphabet } from 'nanoid';
import { emailService } from './email.service';
import { notificationService } from './notification.service';
import { crmService } from './crm.service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 📈 SERVIZIO REFERRAL SYSTEM
 * 
 * Gestisce il sistema di inviti e ricompense:
 * - Generazione codici referral
 * - Tracking click e registrazioni
 * - Sistema punti per referrer e referee
 * - Notifiche automatiche
 */
class ReferralService {
  // 💰 Sistema ricompense
  private readonly REWARDS = {
    REFERRER_SIGNUP: 20,      // Punti quando referee si registra
    REFERRER_CONVERSION: 50,   // Punti quando referee completa prima richiesta  
    REFEREE_BONUS: 10          // Punti bonus per nuovo utente
  };

  // ⏰ Scadenza inviti (90 giorni)
  private readonly EXPIRY_DAYS = 90;

  /**
   * 🔢 Genera codice referral univoco
   * Formato: MARIO2024ABC123 (nome + anno + random)
   */
  generateReferralCode(userId: string, name: string): string {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
    const namePrefix = name.substring(0, 4).toUpperCase().padEnd(4, 'X');
    const year = new Date().getFullYear();
    const random = nanoid();
    return `${namePrefix}${year}${random}`;
  }

  /**
   * 📨 Crea nuovo referral con invio email
   */
  async createReferral(referrerId: string, email: string, message?: string) {
    try {
      // Verifica che referrer esista
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      if (!referrer) {
        throw new Error('Utente referrer non trovato');
      }

      // Controlla se email già invitata
      const existingReferral = await prisma.referral.findFirst({
        where: { 
          referrerId,
          email: email.toLowerCase(),
          status: { not: 'EXPIRED' }
        }
      });

      if (existingReferral) {
        throw new Error('Questa email è già stata invitata');
      }

      // Genera codice univoco
      let code: string;
      let attempts = 0;
      do {
        code = this.generateReferralCode(referrerId, referrer.firstName);
        const existing = await prisma.referral.findUnique({ where: { code } });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('Impossibile generare codice univoco');
      }

      // Crea referral
      const referral = await prisma.referral.create({
        data: {
          id: uuidv4(),
          code,
          email: email.toLowerCase(),
          User_Referral_referrerIdToUser: { connect: { id: referrerId } },
          updatedAt: new Date()
        }
      });

      // CRM: inserisci/aggiorna lead per avere un posto unico di gestione
      try {
        await crmService.upsertLeadFromReferral({
          email,
          referrerId,
          referralId: referral.id,
          message
        });
      } catch (crmError) {
        logger.warn('[CRM] Impossibile upsert lead da referral', crmError);
      }

      // Invia email invito (invitee non è ancora utente, quindi via email service)
      try {
        await emailService.sendEmail({
          to: email,
          subject: 'Invito al sistema Richiesta Assistenza',
          html: `
            <h2>Invito da ${referrer.firstName} ${referrer.lastName}</h2>
            <p>${referrer.firstName} ti ha invitato a provare il nostro servizio!</p>
            ${message ? `<p style="margin-top:8px"><em>Messaggio personale:</em><br/>${message}</p>` : ''}
            <p><strong>Codice invito:</strong> ${code}</p>
            <p><a href="${(process.env.FRONTEND_URL || 'http://localhost:5196')}/signup?ref=${code}">Registrati con l'invito</a></p>
          `,
          text: `${referrer.firstName} ti ha invitato!${message ? `\n\nMessaggio: ${message}\n` : '\n'}Codice: ${code}. Link: ${(process.env.FRONTEND_URL || 'http://localhost:5196')}/signup?ref=${code}`
        });

        logger.info(`Referral invite sent`, { 
          referrerId, 
          email, 
          code,
          referralId: referral.id 
        });
      } catch (emailError) {
        logger.error('Failed to send referral email', emailError);
        // Non blocchiamo il processo se l'email fallisce
      }

      // Notifica al referrer tramite sistema notifiche (audit incluso nel servizio)
      try {
        await notificationService.sendToUser({
          userId: referrerId,
          type: 'REFERRAL_INVITE_SENT',
          title: '📧 Invito referral inviato',
          message: `Invito inviato a ${email}${message ? ` con messaggio: "${message}"` : ''}. Codice: ${code}.`,
          priority: 'normal',
          data: {
            referralId: referral.id,
            email,
            code,
            message: message || null
          },
          channels: ['websocket', 'email']
        });
      } catch (notifyError) {
        logger.warn('Failed to send referrer notification for invite', notifyError);
      }

      return referral;
    } catch (error) {
      logger.error('Error creating referral', error);
      throw error;
    }
  }

  /**
   * 👆 Traccia click su link referral
   */
  async trackClick(code: string) {
    try {
      const referral = await prisma.referral.findUnique({
        where: { code }
      });

      if (!referral) {
        logger.warn('Referral code not found for click tracking', { code });
        return null;
      }

      // Update solo se non già cliccato
      if (!referral.clickedAt) {
        await prisma.referral.update({
          where: { code },
          data: { clickedAt: new Date() }
        });

        logger.info('Referral click tracked', { code, referralId: referral.id });
      }

      return referral;
    } catch (error) {
      logger.error('Error tracking referral click', error);
      throw error;
    }
  }

  /**
   * 🎉 Traccia registrazione nuovo utente
   */
  async trackSignup(code: string, newUserId: string) {
    try {
      const referral = await prisma.referral.findUnique({
        where: { code }
      });

      if (!referral) {
        logger.warn('Referral code not found for signup tracking', { code, newUserId });
        return;
      }

      if (referral.status !== 'PENDING') {
        logger.warn('Referral already processed', { code, status: referral.status });
        return;
      }

      // Aggiorna referral
      const updatedReferral = await prisma.referral.update({
        where: { code },
        data: {
          User_Referral_refereeIdToUser: { connect: { id: newUserId } },
          registeredAt: new Date(),
          status: 'REGISTERED'
        }
      });

      // 💰 Assegna punti al referrer (signup)
      await this.addPointsToUser(
        referral.referrerId,
        this.REWARDS.REFERRER_SIGNUP,
        'REFERRAL_SIGNUP',
        'Amico registrato tramite il tuo invito',
        { referralId: referral.id, refereeId: newUserId }
      );

      // 💰 Assegna punti al referee (welcome bonus)
      await this.addPointsToUser(
        newUserId,
        this.REWARDS.REFEREE_BONUS,
        'WELCOME_BONUS',
        'Bonus benvenuto da invito',
        { referralId: referral.id, referrerId: referral.referrerId }
      );

      // CRM: collega utente e aggiorna stato a REGISTERED
      try {
        await crmService.linkUser({ referralId: referral.id, userId: newUserId });
        await crmService.updateStatus({ referralId: referral.id, status: 'REGISTERED' });
      } catch (crmError) {
        logger.warn('[CRM] Impossibile aggiornare CRM per signup', crmError);
      }

      // 📧 Notifica al referrer
      await notificationService.sendToUser({
        userId: referral.referrerId,
        title: '🎉 Amico registrato!',
        message: `Il tuo amico si è registrato! Hai guadagnato ${this.REWARDS.REFERRER_SIGNUP} punti.`,
        type: 'referral_signup',
        priority: 'normal',
        data: { 
          referralId: referral.id,
          points: this.REWARDS.REFERRER_SIGNUP,
          newUserId
        }
      });

      logger.info('Referral signup tracked and rewards assigned', {
        code,
        referrerId: referral.referrerId,
        newUserId,
        pointsAwarded: this.REWARDS.REFERRER_SIGNUP + this.REWARDS.REFEREE_BONUS
      });

      return updatedReferral;
    } catch (error) {
      logger.error('Error tracking referral signup', error);
      throw error;
    }
  }

  /**
   * 🏆 Traccia prima richiesta completata
   */
  async trackFirstRequest(userId: string) {
    try {
      const referral = await prisma.referral.findFirst({
        where: { 
          refereeId: userId,
          status: 'REGISTERED' // Solo se registrato ma non ancora convertito
        }
      });

      if (!referral) {
        logger.debug('No eligible referral found for first request tracking', { userId });
        return;
      }

      // Aggiorna a convertito
      const updatedReferral = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          firstRequestAt: new Date(),
          status: 'CONVERTED'
        }
      });

      // 💰 Bonus conversion per referrer
      await this.addPointsToUser(
        referral.referrerId,
        this.REWARDS.REFERRER_CONVERSION,
        'REFERRAL_CONVERSION',
        'Il tuo amico ha completato la prima richiesta!',
        { referralId: referral.id, refereeId: userId }
      );

      // 🎉 Notifica super entusiasta al referrer
      await notificationService.sendToUser({
        userId: referral.referrerId,
        title: '🚀 Conversione completata!',
        message: `Il tuo amico ha completato la prima richiesta! Hai guadagnato ${this.REWARDS.REFERRER_CONVERSION} punti bonus! 🎉`,
        type: 'referral_conversion',
        priority: 'high',
        data: { 
          referralId: referral.id,
          points: this.REWARDS.REFERRER_CONVERSION,
          totalPointsEarned: this.REWARDS.REFERRER_SIGNUP + this.REWARDS.REFERRER_CONVERSION
        }
      });

      // CRM: aggiorna stato a CONVERTED
      try {
        await crmService.updateStatus({ referralId: referral.id, status: 'CONVERTED' });
      } catch (crmError) {
        logger.warn('[CRM] Impossibile aggiornare CRM per conversione', crmError);
      }

      logger.info('Referral conversion tracked and bonus assigned', {
        referralId: referral.id,
        referrerId: referral.referrerId,
        userId,
        bonusPoints: this.REWARDS.REFERRER_CONVERSION
      });

      return updatedReferral;
    } catch (error) {
      logger.error('Error tracking referral first request', error);
      throw error;
    }
  }

  /**
   * 📊 Ottieni statistiche referral utente
   */
  async getReferralStats(userId: string) {
    try {
      const [referralsRaw, userPoints] = await Promise.all([
        prisma.referral.findMany({
          where: { referrerId: userId },
          include: {
            User_Referral_refereeIdToUser: {
              select: { firstName: true, lastName: true, email: true, createdAt: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.userPoints.findUnique({
          where: { userId }
        })
      ]);

      // Mappa la relazione al nome atteso dal frontend: referee
      const referrals = referralsRaw.map((r: any) => ({
        ...r,
        referee: r.User_Referral_refereeIdToUser
      }));

      // Calcola statistiche
      const stats = {
        total: referrals.length,
        pending: referrals.filter(r => r.status === 'PENDING').length,
        registered: referrals.filter(r => r.status === 'REGISTERED').length,
        converted: referrals.filter(r => r.status === 'CONVERTED').length,
        expired: referrals.filter(r => r.status === 'EXPIRED').length,
        totalPointsEarned: (
          referrals.filter(r => r.status === 'REGISTERED').length * this.REWARDS.REFERRER_SIGNUP +
          referrals.filter(r => r.status === 'CONVERTED').length * this.REWARDS.REFERRER_CONVERSION
        ),
        currentPoints: userPoints?.points || 0,
        recentReferrals: referrals.slice(0, 5) // Ultimi 5
      };

      return stats;
    } catch (error) {
      logger.error('Error getting referral stats', error);
      throw error;
    }
  }

  /**
   * 🔍 Ottieni codice referral personale utente
   */
  async getMyReferralCode(userId: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, referralCode: true, email: true }
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      // Genera codice se non esiste
      if (!user.referralCode) {
        const code = this.generateReferralCode(user.id, user.firstName);
        
        user = await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: code },
          select: { id: true, firstName: true, lastName: true, referralCode: true, email: true }
        });

        logger.info('Generated new referral code for user', { userId, code });
      }

      return {
        code: user.referralCode,
        link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?ref=${user.referralCode}`,
        shareText: `Prova il nostro servizio di assistenza! Usa il mio codice ${user.referralCode} e ricevi punti bonus alla registrazione! 🎁`,
        whatsappText: `🎯 Ciao! Ti consiglio questo fantastico servizio di assistenza!

🎁 Usa il mio codice invito: *${user.referralCode}*

✅ Ti registri gratis
✅ Ricevi punti bonus  
✅ Accesso a professionisti verificati

Link diretto: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?ref=${user.referralCode}

Che ne dici di provarlo? 😊`
      };
    } catch (error) {
      logger.error('Error getting referral code', error);
      throw error;
    }
  }

  /**
   * 💰 Gestisce punti utente (privato)
   */
  private async addPointsToUser(
    userId: string, 
    points: number, 
    type: 'REFERRAL_SIGNUP' | 'REFERRAL_CONVERSION' | 'WELCOME_BONUS',
    description: string,
    metadata?: any
  ) {
    try {
      // Crea/aggiorna UserPoints
      const userPoints = await prisma.userPoints.upsert({
        where: { userId },
        create: {
          id: uuidv4(),
          User: { connect: { id: userId } },
          points,
          totalEarned: points,
          totalSpent: 0,
          updatedAt: new Date()
        },
        update: {
          points: { increment: points },
          totalEarned: { increment: points }
        }
      });

      // Crea transazione
      await prisma.pointTransaction.create({
        data: {
          id: uuidv4(),
          User: { connect: { id: userId } },
          points,
          type,
          description,
          metadata,
          Referral: metadata?.referralId ? { connect: { id: metadata.referralId } } : undefined
        }
      });

      logger.info('Points added to user', { userId, points, type, newTotal: userPoints.points + points });

      return userPoints;
    } catch (error) {
      logger.error('Error adding points to user', error);
      throw error;
    }
  }

  /**
   * 🧹 Pulisci referral scaduti (chiamato da cron job)
   */
  async cleanupExpiredReferrals() {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - this.EXPIRY_DAYS);

      const expiredReferrals = await prisma.referral.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: expiryDate }
        },
        data: { status: 'EXPIRED' }
      });

      logger.info('Cleanup expired referrals completed', { 
        expiredCount: expiredReferrals.count 
      });

      return expiredReferrals.count;
    } catch (error) {
      logger.error('Error cleaning up expired referrals', error);
      throw error;
    }
  }

  /**
   * 📈 Ottieni analytics globali (solo admin)
   */
  async getGlobalAnalytics() {
    try {
      const [totalReferrals, totalUsers, recentSignups] = await Promise.all([
        prisma.referral.groupBy({
          by: ['status'],
          _count: { _all: true }
        }),
        prisma.user.count(),
        prisma.referral.findMany({
          where: {
            registeredAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // ultimi 30 giorni
            }
          },
          include: {
            User_Referral_referrerIdToUser: { select: { firstName: true, lastName: true } },
            User_Referral_refereeIdToUser: { select: { firstName: true, lastName: true } }
          },
          orderBy: { registeredAt: 'desc' },
          take: 20
        })
      ]);

      const statusCounts = totalReferrals.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalReferrals: totalReferrals.reduce((sum, item) => sum + item._count._all, 0),
        statusBreakdown: statusCounts,
        conversionRate: statusCounts.CONVERTED ? 
          ((statusCounts.CONVERTED / (statusCounts.REGISTERED + statusCounts.CONVERTED)) * 100).toFixed(2) + '%' 
          : '0%',
        totalUsers,
        recentSignups: recentSignups.length,
        recentActivity: recentSignups.map((r: any) => ({
          ...r,
          referrer: r.User_Referral_referrerIdToUser,
          referee: r.User_Referral_refereeIdToUser
        }))
      };
    } catch (error) {
      logger.error('Error getting global referral analytics', error);
      throw error;
    }
  }
}

export const referralService = new ReferralService();
