import { prisma } from '../config/database';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

type CrmStatus = 'INVITED' | 'REGISTERED' | 'CONVERTED' | 'ARCHIVED';
type CrmSource = 'REFERRAL' | 'WHATSAPP' | 'WEB';

interface UpsertLeadFromReferralInput {
  email: string;
  referrerId: string;
  referralId: string;
  message?: string;
  name?: string;
}

interface UpdateStatusInput {
  referralId?: string;
  email?: string;
  status: CrmStatus;
}

interface LinkUserInput {
  email?: string;
  referralId?: string;
  userId: string;
}

class CrmService {
  /**
   * Crea/aggiorna un lead CRM a partire da un invito referral
   */
  async upsertLeadFromReferral(input: UpsertLeadFromReferralInput) {
    const email = input.email.toLowerCase();
    const now = new Date();

    try {
      const existingByEmail = await prisma.crmContact.findUnique({ where: { email } });

      if (existingByEmail) {
        const updated = await prisma.crmContact.update({
          where: { email },
          data: {
            source: 'REFERRAL' as any,
            status: 'INVITED' as any,
            referrerId: input.referrerId,
            referralId: input.referralId,
            name: input.name || existingByEmail.name,
            notes: input.message ? input.message : existingByEmail.notes,
            metadata: {
              ...(existingByEmail.metadata as any),
              referralCodeLinked: true
            } as any,
            updatedAt: now
          }
        });
        logger.info('[CRM] Lead aggiornato da referral', { email, referralId: input.referralId });
        return updated;
      }

      const created = await prisma.crmContact.create({
        data: {
          id: uuidv4(),
          email,
          source: 'REFERRAL' as any,
          status: 'INVITED' as any,
          referrerId: input.referrerId,
          referralId: input.referralId,
          name: input.name || null,
          notes: input.message || null,
          metadata: { referralCodeLinked: true } as any,
          updatedAt: now
        }
      });
      logger.info('[CRM] Lead creato da referral', { email, referralId: input.referralId });
      return created;
    } catch (error) {
      logger.error('[CRM] Errore upsert lead da referral', error);
      throw error;
    }
  }

  /**
   * Aggiorna lo stato del contatto CRM tramite referralId o email
   */
  async updateStatus(input: UpdateStatusInput) {
    try {
      const where = input.referralId
        ? { referralId: input.referralId }
        : input.email
          ? { email: input.email.toLowerCase() }
          : null;

      if (!where) {
        throw new Error('Servono referralId o email per aggiornare lo stato CRM');
      }

      const existing = await prisma.crmContact.findFirst({ where });
      if (!existing) {
        logger.warn('[CRM] Nessun contatto trovato per updateStatus', where);
        return null;
      }

      const updated = await prisma.crmContact.update({
        where: { id: existing.id },
        data: {
          status: input.status as any,
          updatedAt: new Date()
        }
      });
      logger.info('[CRM] Stato aggiornato', { id: updated.id, status: input.status });
      return updated;
    } catch (error) {
      logger.error('[CRM] Errore updateStatus', error);
      throw error;
    }
  }

  /**
   * Collega un utente registrato al contatto CRM
   */
  async linkUser(input: LinkUserInput) {
    try {
      const where = input.referralId
        ? { referralId: input.referralId }
        : input.email
          ? { email: input.email.toLowerCase() }
          : null;

      if (!where) {
        throw new Error('Servono referralId o email per collegare userId');
      }

      const existing = await prisma.crmContact.findFirst({ where });
      if (!existing) {
        logger.warn('[CRM] Nessun contatto trovato per linkUser', where);
        return null;
      }

      const updated = await prisma.crmContact.update({
        where: { id: existing.id },
        data: {
          userId: input.userId,
          updatedAt: new Date()
        }
      });
      logger.info('[CRM] Contatto collegato a utente', { id: updated.id, userId: input.userId });
      return updated;
    } catch (error) {
      logger.error('[CRM] Errore linkUser', error);
      throw error;
    }
  }
}

export const crmService = new CrmService();