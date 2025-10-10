import { prisma } from '../lib/prisma';
import { BadRequestError } from '../utils/errors';

export class RegistrationValidationService {
  
  /**
   * Verifica l'unicità di CF e P.IVA nel sistema
   */
  static async validateUniqueness(data: {
    personalFiscalCode?: string;
    vatNumber?: string;
    companyFiscalCode?: string;
    businessName?: string;
    email?: string;
  }) {
    const errors: string[] = [];

    // Verifica Email unica
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email }
      });
      if (existingEmail) {
        errors.push('Email già registrata nel sistema');
      }
    }

    // Verifica Codice Fiscale personale unico
    if (data.personalFiscalCode) {
      const existingCF = await prisma.user.findUnique({
        where: { personalFiscalCode: data.personalFiscalCode }
      });
      if (existingCF) {
        errors.push('Codice Fiscale già registrato nel sistema');
      }

      // Verifica che il CF personale non sia usato come CF aziendale
      const companyWithCF = await prisma.company.findUnique({
        where: { companyFiscalCode: data.personalFiscalCode }
      });
      if (companyWithCF) {
        errors.push('Questo Codice Fiscale è già registrato come CF aziendale');
      }
    }

    // Verifica Partita IVA unica
    if (data.vatNumber) {
      const existingVAT = await prisma.company.findUnique({
        where: { vatNumber: data.vatNumber }
      });
      if (existingVAT) {
        errors.push('Partita IVA già registrata nel sistema');
      }
    }

    // Verifica Ragione Sociale unica
    if (data.businessName) {
      const existingBusiness = await prisma.company.findUnique({
        where: { businessName: data.businessName }
      });
      if (existingBusiness) {
        errors.push('Ragione Sociale già registrata nel sistema');
      }
    }

    // Verifica CF aziendale unico
    if (data.companyFiscalCode) {
      const existingCompanyCF = await prisma.company.findUnique({
        where: { companyFiscalCode: data.companyFiscalCode }
      });
      if (existingCompanyCF) {
        errors.push('Codice Fiscale aziendale già registrato');
      }

      // Verifica che il CF aziendale non sia usato come CF personale
      const userWithCF = await prisma.user.findUnique({
        where: { personalFiscalCode: data.companyFiscalCode }
      });
      if (userWithCF) {
        errors.push('Questo Codice Fiscale aziendale è già registrato come CF personale');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError('Validazione fallita', errors);
    }

    return true;
  }

  /**
   * Registra un professionista con tutti i controlli
   */
  static async registerProfessional(data: any) {
    // 1. Validazione unicità
    await this.validateUniqueness({
      email: data.email,
      personalFiscalCode: data.personalFiscalCode,
      vatNumber: data.vatNumber,
      companyFiscalCode: data.companyFiscalCode,
      businessName: data.businessName
    });

    // 2. Transazione per creare utente e azienda (se necessario)
    return await prisma.$transaction(async (tx) => {
      let companyId = null;

      // Se è ditta individuale o società, crea prima l'azienda
      if (data.activityType === 'INDIVIDUAL' || data.activityType === 'COMPANY') {
        const company = await tx.company.create({
          data: {
            businessName: data.businessName || `${data.firstName} ${data.lastName}`,
            vatNumber: data.vatNumber,
            companyFiscalCode: data.companyFiscalCode,
            usePersonalCF: data.activityType === 'INDIVIDUAL' && !data.companyFiscalCode,
            companyPhone: data.companyPhone,
            companyEmail: data.companyEmail,
            pec: data.pec,
            sdiCode: data.sdiCode,
            legalAddress: data.legalAddress,
            legalCity: data.legalCity,
            legalProvince: data.legalProvince,
            legalPostalCode: data.legalPostalCode,
            hasOperativeAddress: data.hasOperativeAddress,
            operativeAddress: data.operativeAddress,
            operativeCity: data.operativeCity,
            operativeProvince: data.operativeProvince,
            operativePostalCode: data.operativePostalCode,
          }
        });
        companyId = company.id;
      }

      // Crea l'utente
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          personalFiscalCode: data.personalFiscalCode,
          personalPhone: data.personalPhone,
          personalAddress: data.personalAddress,
          personalCity: data.personalCity,
          personalProvince: data.personalProvince,
          personalPostalCode: data.personalPostalCode,
          password: data.hashedPassword, // Già hashata
          professionId: data.professionId,
          yearsExperience: data.yearsExperience,
          activityType: data.activityType,
          companyId: companyId,
          companyRole: data.companyRole || (companyId ? 'OWNER' : null),
          role: 'PROFESSIONAL',
          approvalStatus: 'PENDING'
        }
      });

      // Se ha creato un'azienda, aggiorna il proprietario
      if (companyId && data.companyRole === 'OWNER') {
        await tx.company.update({
          where: { id: companyId },
          data: { ownerId: user.id }
        });
      }

      // Crea le impostazioni di visibilità di default
      await tx.contactVisibility.create({
        data: {
          userId: user.id,
          showPersonalPhone: false,
          showCompanyPhone: true,
          showPersonalEmail: false,
          showCompanyEmail: true,
          showPec: false,
          showPersonalAddress: false,
          showBusinessAddress: true
        }
      });

      // Crea notifica per admin
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Nuova registrazione professionista',
          message: `${user.firstName} ${user.lastName} si è registrato come professionista`,
          type: 'REGISTRATION',
          severity: 'INFO'
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'PROFESSIONAL_REGISTRATION',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          newValues: { 
            activityType: data.activityType,
            profession: data.professionId 
          },
          success: true,
          severity: 'INFO',
          category: 'AUTH'
        }
      });

      return user;
    });
  }

  /**
   * Verifica disponibilità in tempo reale (per form)
   */
  static async checkAvailability(field: string, value: string) {
    switch (field) {
      case 'email':
        const emailExists = await prisma.user.findUnique({
          where: { email: value }
        });
        return !emailExists;

      case 'personalFiscalCode':
        const cfExists = await prisma.user.findUnique({
          where: { personalFiscalCode: value }
        });
        const cfAsCompany = await prisma.company.findUnique({
          where: { companyFiscalCode: value }
        });
        return !cfExists && !cfAsCompany;

      case 'vatNumber':
        const vatExists = await prisma.company.findUnique({
          where: { vatNumber: value }
        });
        return !vatExists;

      case 'businessName':
        const businessExists = await prisma.company.findUnique({
          where: { businessName: value }
        });
        return !businessExists;

      default:
        return true;
    }
  }
}
