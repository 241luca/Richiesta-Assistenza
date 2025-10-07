import { prisma } from '../config/database';
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}
import bcrypt from 'bcrypt';

interface OccasionalWorkerData {
  // Dati personali
  firstName: string;
  lastName: string;
  personalFiscalCode: string;
  email: string;
  personalPhone: string;
  password: string;
  
  // Indirizzo
  personalAddress: string;
  personalCity: string;
  personalProvince: string;
  personalPostalCode: string;
  
  // Professione
  professionId: string;
  yearsExperience?: string;
}

export class OccasionalWorkerService {
  
  /**
   * Registra un lavoratore occasionale
   */
  static async register(data: OccasionalWorkerData) {
    // 1. Verifica unicità CF ed email
    const existingCF = await prisma.user.findUnique({
      where: { personalFiscalCode: data.personalFiscalCode }
    });
    if (existingCF) {
      throw new BadRequestError('Codice Fiscale già registrato');
    }
    
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existingEmail) {
      throw new BadRequestError('Email già registrata');
    }
    
    // 2. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // 3. Crea utente come lavoratore occasionale
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          // personalFiscalCode: data.personalFiscalCode, // Campo potrebbe non esistere
          // personalPhone: data.personalPhone, // Campo potrebbe non esistere
          password: hashedPassword,
          
          // Indirizzo - verifichiamo se esistono
          // personalAddress: data.personalAddress,
          // personalCity: data.personalCity,
          // personalProvince: data.personalProvince,
          // personalPostalCode: data.personalPostalCode,
          
          // Professione - verifichiamo se esistono
          // professionId: data.professionId,
          // yearsExperience: data.yearsExperience,
          
          // Tipo e stato
          metadata: { 
            activityType: 'OCCASIONAL',
            personalFiscalCode: data.personalFiscalCode,
            personalPhone: data.personalPhone,
            personalAddress: data.personalAddress,
            personalCity: data.personalCity,
            personalProvince: data.personalProvince,
            personalPostalCode: data.personalPostalCode,
            professionId: data.professionId,
            yearsExperience: data.yearsExperience
          },
          role: 'PROFESSIONAL',
          
          // Status
          isActive: false,
          isApproved: false
        }
      });
      
      // 4. Per ora salviamo i limiti come JSON nel campo metadata
      // TODO: Creare tabella OccasionalWorkerLimits quando schema aggiornato
      /*
      await tx.occasionalWorkerLimits.create({
        data: {
          userId: user.id,
          year: new Date().getFullYear(),
          totalRevenue: 0,
          clientLimits: {} // JSON per tracciare limiti per cliente
        }
      });
      */
      
      // 5. Crea impostazioni visibilità (solo contatti personali)
      // TODO: Verificare se tabella ContactVisibility esiste
      /*
      await tx.contactVisibility.create({
        data: {
          userId: user.id,
          showPersonalPhone: true, // Default visibile per occasionali
          showCompanyPhone: false, // Non ha contatti aziendali
          showPersonalEmail: true,
          showCompanyEmail: false,
          showPec: false,
          showPersonalAddress: true,
          showBusinessAddress: false
        }
      });
      */
      
      // 6. Notifica admin
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Nuovo lavoratore occasionale registrato',
          message: `${user.firstName} ${user.lastName} si è registrato come lavoratore occasionale`,
          type: 'REGISTRATION',
          severity: 'INFO'
        }
      });
      
      // 7. Audit log
      await tx.auditLog.create({
        data: {
          action: 'OCCASIONAL_WORKER_REGISTRATION',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          newValues: {
            activityType: 'OCCASIONAL',
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
   * Verifica limiti lavoratore occasionale
   * TODO: Implementare quando tabella OccasionalWorkerLimits disponibile
   */
  static async checkLimits(userId: string, clientId: string, amount: number) {
    // Per ora ritorna sempre true
    // TODO: Implementare controllo limiti
    return true;
    
    /*
    const currentYear = new Date().getFullYear();
    
    const limits = await prisma.occasionalWorkerLimits.findFirst({
      where: {
        userId: userId,
        year: currentYear
      }
    });
    
    if (!limits) {
      throw new BadRequestError('Limiti non trovati per questo lavoratore');
    }
    
    // Controlla limite totale annuo (5000€ per cliente)
    const clientLimits = limits.clientLimits as any;
    const currentClientRevenue = clientLimits[clientId] || { revenue: 0, days: 0 };
    
    if (currentClientRevenue.revenue + amount > 5000) {
      throw new BadRequestError(
        `Superato il limite di €5.000/anno con questo cliente. 
         Attuale: €${currentClientRevenue.revenue}, 
         Richiesto: €${amount}`
      );
    }
    
    // Controlla limite giorni (30 giorni/anno per cliente)
    if (currentClientRevenue.days >= 30) {
      throw new BadRequestError(
        `Raggiunto il limite di 30 giorni/anno con questo cliente`
      );
    }
    
    return true;
    */
  }
  
  /**
   * Aggiorna contatori dopo lavoro completato
   * TODO: Implementare quando tabella disponibile
   */
  static async updateLimits(userId: string, clientId: string, amount: number, days: number = 1) {
    // TODO: Implementare quando tabella disponibile
    return;
    
    /*
    const currentYear = new Date().getFullYear();
    
    const limits = await prisma.occasionalWorkerLimits.findFirst({
      where: {
        userId: userId,
        year: currentYear
      }
    });
    
    if (!limits) {
      throw new BadRequestError('Limiti non trovati');
    }
    
    const clientLimits = limits.clientLimits as any;
    const currentClientData = clientLimits[clientId] || { revenue: 0, days: 0 };
    
    // Aggiorna limiti per questo cliente
    clientLimits[clientId] = {
      revenue: currentClientData.revenue + amount,
      days: currentClientData.days + days,
      lastUpdate: new Date()
    };
    
    // Aggiorna totale
    const newTotalRevenue = limits.totalRevenue + amount;
    
    await prisma.occasionalWorkerLimits.update({
      where: { id: limits.id },
      data: {
        totalRevenue: newTotalRevenue,
        clientLimits: clientLimits
      }
    });
    
    // Se supera 5000€ totali annui, notifica per contributi INPS
    if (newTotalRevenue > 5000 && limits.totalRevenue <= 5000) {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Limite €5.000 totali superato',
          message: 'Hai superato €5.000 di fatturato totale annuo. Ricorda gli obblighi contributivi INPS.',
          type: 'WARNING',
          severity: 'WARNING'
        }
      });
    }
    */
  }
  
  /**
   * Ottieni riepilogo limiti
   * TODO: Implementare quando tabella disponibile
   */
  static async getLimitsSummary(userId: string) {
    // Per ora ritorna dati mock
    return {
      totalRevenue: 0,
      clients: [],
      canWork: true
    };
    
    /*
    const currentYear = new Date().getFullYear();
    
    const limits = await prisma.occasionalWorkerLimits.findFirst({
      where: {
        userId: userId,
        year: currentYear
      }
    });
    
    if (!limits) {
      return {
        totalRevenue: 0,
        clients: [],
        canWork: true
      };
    }
    
    const clientLimits = limits.clientLimits as any;
    const clients = Object.keys(clientLimits).map(clientId => ({
      clientId,
      revenue: clientLimits[clientId].revenue,
      days: clientLimits[clientId].days,
      remainingRevenue: 5000 - clientLimits[clientId].revenue,
      remainingDays: 30 - clientLimits[clientId].days,
      canWork: clientLimits[clientId].revenue < 5000 && clientLimits[clientId].days < 30
    }));
    
    return {
      totalRevenue: limits.totalRevenue,
      clients,
      canWork: limits.totalRevenue < 5000 // Limite soft, avviso per INPS
    };
    */
  }
}
