import { prisma } from '../config/database';
import { randomUUID } from 'crypto';
import { ValidationError } from '../utils/errors';

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

    // Verifica Codice Fiscale personale unico (mappato su `codiceFiscale`)
    if (data.personalFiscalCode) {
      const existingCF = await prisma.user.findFirst({
        where: { codiceFiscale: data.personalFiscalCode }
      });
      if (existingCF) {
        errors.push('Codice Fiscale già registrato nel sistema');
      }
    }

    // Verifica Partita IVA unica (mappata su `partitaIva`)
    if (data.vatNumber) {
      const existingVAT = await prisma.user.findFirst({
        where: { partitaIva: data.vatNumber }
      });
      if (existingVAT) {
        errors.push('Partita IVA già registrata nel sistema');
      }
    }

    // Verifica Ragione Sociale unica (mappata su `ragioneSociale`)
    if (data.businessName) {
      const existingBusiness = await prisma.user.findFirst({
        where: { ragioneSociale: data.businessName }
      });
      if (existingBusiness) {
        errors.push('Ragione Sociale già registrata nel sistema');
      }
    }

    // Verifica CF aziendale unico (usa stesso campo `codiceFiscale` se fornito)
    if (data.companyFiscalCode) {
      const existingCompanyCF = await prisma.user.findFirst({
        where: { codiceFiscale: data.companyFiscalCode }
      });
      if (existingCompanyCF) {
        errors.push('Codice Fiscale aziendale già registrato');
      }
    }

    if (errors.length > 0) {
      // Usa ValidationError disponibile nel modulo errors
      throw new ValidationError(`Validazione fallita: ${errors.join(' | ')}`);
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
      // Crea l'utente usando i campi presenti nel model `User`
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          email: data.email,
          username: data.email, // usa l'email come username univoco
          password: data.hashedPassword, // già hashata
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName} ${data.lastName}`,
          phone: data.personalPhone,
          // Dati personali
          codiceFiscale: data.personalFiscalCode,
          address: data.personalAddress,
          city: data.personalCity,
          province: data.personalProvince,
          postalCode: data.personalPostalCode,
          // Dati aziendali/fiscali (se presenti)
          partitaIva: data.vatNumber,
          ragioneSociale: data.businessName,
          pec: data.pec,
          sdi: data.sdiCode,
          workAddress: data.legalAddress,
          workCity: data.legalCity,
          workProvince: data.legalProvince,
          workPostalCode: data.legalPostalCode,
          // Meta professionale (gestita successivamente)
          role: 'PROFESSIONAL',
          approvalStatus: 'PENDING',
          updatedAt: new Date()
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
        const cfExists = await prisma.user.findFirst({
          where: { codiceFiscale: value }
        });
        return !cfExists;

      case 'vatNumber':
        const vatExists = await prisma.user.findFirst({
          where: { partitaIva: value }
        });
        return !vatExists;

      case 'businessName':
        const businessExists = await prisma.user.findFirst({
          where: { ragioneSociale: value }
        });
        return !businessExists;

      default:
        return true;
    }
  }
}
