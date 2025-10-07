import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSystemEnumsAndSettings() {
  console.log('🌱 Seeding System Enums and Settings...');

  try {
    // 1. PRIORITY ENUM
    const priorityEnum = await prisma.systemEnum.create({
      data: {
        name: 'PRIORITY',
        description: 'Priorità delle richieste di assistenza',
        category: 'system',
        isEditable: true
      }
    });

    await prisma.enumValue.createMany({
      data: [
        {
          enumId: priorityEnum.id,
          value: 'LOW',
          label: 'Bassa',
          description: 'Priorità bassa - non urgente',
          color: '#10B981', // green-500
          textColor: '#FFFFFF',
          bgColor: '#D1FAE5', // green-100
          icon: 'ArrowDownIcon',
          order: 1,
          isDefault: false
        },
        {
          enumId: priorityEnum.id,
          value: 'MEDIUM',
          label: 'Media',
          description: 'Priorità media - standard',
          color: '#F59E0B', // amber-500
          textColor: '#FFFFFF',
          bgColor: '#FEF3C7', // amber-100
          icon: 'MinusIcon',
          order: 2,
          isDefault: true
        },
        {
          enumId: priorityEnum.id,
          value: 'HIGH',
          label: 'Alta',
          description: 'Priorità alta - importante',
          color: '#EF4444', // red-500
          textColor: '#FFFFFF',
          bgColor: '#FEE2E2', // red-100
          icon: 'ArrowUpIcon',
          order: 3,
          isDefault: false
        },
        {
          enumId: priorityEnum.id,
          value: 'URGENT',
          label: 'Urgente',
          description: 'Priorità urgente - critica',
          color: '#DC2626', // red-600
          textColor: '#FFFFFF',
          bgColor: '#FECACA', // red-200
          icon: 'ExclamationTriangleIcon',
          order: 4,
          isDefault: false
        }
      ]
    });

    // 2. REQUEST STATUS ENUM
    const requestStatusEnum = await prisma.systemEnum.create({
      data: {
        name: 'REQUEST_STATUS',
        description: 'Stati delle richieste di assistenza',
        category: 'system',
        isEditable: true
      }
    });

    await prisma.enumValue.createMany({
      data: [
        {
          enumId: requestStatusEnum.id,
          value: 'PENDING',
          label: 'In Attesa',
          description: 'Richiesta in attesa di assegnazione',
          color: '#F59E0B', // amber-500
          textColor: '#92400E',
          bgColor: '#FEF3C7', // amber-100
          icon: 'ClockIcon',
          order: 1,
          isDefault: true
        },
        {
          enumId: requestStatusEnum.id,
          value: 'ASSIGNED',
          label: 'Assegnata',
          description: 'Richiesta assegnata a un professionista',
          color: '#3B82F6', // blue-500
          textColor: '#1E40AF',
          bgColor: '#DBEAFE', // blue-100
          icon: 'UserIcon',
          order: 2,
          isDefault: false
        },
        {
          enumId: requestStatusEnum.id,
          value: 'IN_PROGRESS',
          label: 'In Corso',
          description: 'Lavoro in corso di svolgimento',
          color: '#8B5CF6', // violet-500
          textColor: '#5B21B6',
          bgColor: '#E9D5FF', // violet-100
          icon: 'WrenchScrewdriverIcon',
          order: 3,
          isDefault: false
        },
        {
          enumId: requestStatusEnum.id,
          value: 'COMPLETED',
          label: 'Completata',
          description: 'Richiesta completata con successo',
          color: '#10B981', // emerald-500
          textColor: '#047857',
          bgColor: '#D1FAE5', // emerald-100
          icon: 'CheckCircleIcon',
          order: 4,
          isDefault: false
        },
        {
          enumId: requestStatusEnum.id,
          value: 'CANCELLED',
          label: 'Annullata',
          description: 'Richiesta annullata',
          color: '#6B7280', // gray-500
          textColor: '#374151',
          bgColor: '#F3F4F6', // gray-100
          icon: 'XCircleIcon',
          order: 5,
          isDefault: false
        }
      ]
    });

    // 3. QUOTE STATUS ENUM
    const quoteStatusEnum = await prisma.systemEnum.create({
      data: {
        name: 'QUOTE_STATUS',
        description: 'Stati dei preventivi',
        category: 'system',
        isEditable: true
      }
    });

    await prisma.enumValue.createMany({
      data: [
        {
          enumId: quoteStatusEnum.id,
          value: 'DRAFT',
          label: 'Bozza',
          description: 'Preventivo in bozza - non ancora inviato',
          color: '#6B7280', // gray-500
          textColor: '#374151',
          bgColor: '#F3F4F6', // gray-100
          icon: 'DocumentIcon',
          order: 1,
          isDefault: true
        },
        {
          enumId: quoteStatusEnum.id,
          value: 'PENDING',
          label: 'In Attesa',
          description: 'Preventivo inviato, in attesa di risposta',
          color: '#F59E0B', // amber-500
          textColor: '#92400E',
          bgColor: '#FEF3C7', // amber-100
          icon: 'ClockIcon',
          order: 2,
          isDefault: false
        },
        {
          enumId: quoteStatusEnum.id,
          value: 'ACCEPTED',
          label: 'Accettato',
          description: 'Preventivo accettato dal cliente',
          color: '#10B981', // emerald-500
          textColor: '#047857',
          bgColor: '#D1FAE5', // emerald-100
          icon: 'CheckCircleIcon',
          order: 3,
          isDefault: false
        },
        {
          enumId: quoteStatusEnum.id,
          value: 'REJECTED',
          label: 'Rifiutato',
          description: 'Preventivo rifiutato dal cliente',
          color: '#EF4444', // red-500
          textColor: '#DC2626',
          bgColor: '#FEE2E2', // red-100
          icon: 'XCircleIcon',
          order: 4,
          isDefault: false
        },
        {
          enumId: quoteStatusEnum.id,
          value: 'EXPIRED',
          label: 'Scaduto',
          description: 'Preventivo scaduto senza risposta',
          color: '#F97316', // orange-500
          textColor: '#EA580C',
          bgColor: '#FED7AA', // orange-100
          icon: 'ExclamationTriangleIcon',
          order: 5,
          isDefault: false
        }
      ]
    });

    // 4. USER ROLES ENUM
    const userRoleEnum = await prisma.systemEnum.create({
      data: {
        name: 'USER_ROLE',
        description: 'Ruoli degli utenti del sistema',
        category: 'system',
        isEditable: false // Critical system enum
      }
    });

    await prisma.enumValue.createMany({
      data: [
        {
          enumId: userRoleEnum.id,
          value: 'CLIENT',
          label: 'Cliente',
          description: 'Utente cliente che richiede assistenza',
          color: '#3B82F6', // blue-500
          textColor: '#FFFFFF',
          bgColor: '#DBEAFE', // blue-100
          icon: 'UserIcon',
          order: 1,
          isDefault: true,
          metadata: {
            permissions: ['create_request', 'view_own_requests', 'accept_quotes']
          }
        },
        {
          enumId: userRoleEnum.id,
          value: 'PROFESSIONAL',
          label: 'Professionista',
          description: 'Professionista che fornisce servizi',
          color: '#10B981', // emerald-500
          textColor: '#FFFFFF',
          bgColor: '#D1FAE5', // emerald-100
          icon: 'WrenchScrewdriverIcon',
          order: 2,
          isDefault: false,
          metadata: {
            permissions: ['view_assigned_requests', 'create_quotes', 'update_request_status']
          }
        },
        {
          enumId: userRoleEnum.id,
          value: 'ADMIN',
          label: 'Amministratore',
          description: 'Amministratore del sistema',
          color: '#8B5CF6', // violet-500
          textColor: '#FFFFFF',
          bgColor: '#E9D5FF', // violet-100
          icon: 'Cog6ToothIcon',
          order: 3,
          isDefault: false,
          metadata: {
            permissions: ['view_all', 'manage_users', 'manage_categories', 'assign_requests']
          }
        },
        {
          enumId: userRoleEnum.id,
          value: 'SUPER_ADMIN',
          label: 'Super Amministratore',
          description: 'Super amministratore con accesso completo',
          color: '#DC2626', // red-600
          textColor: '#FFFFFF',
          bgColor: '#FEE2E2', // red-100
          icon: 'ShieldCheckIcon',
          order: 4,
          isDefault: false,
          metadata: {
            permissions: ['*'] // All permissions
          }
        }
      ]
    });

    // 5. SYSTEM SETTINGS
    await prisma.systemSetting.createMany({
      data: [
        // Footer Settings
        {
          key: 'FOOTER_TEXT',
          value: '© 2025 Sistema Richiesta Assistenza',
          type: 'string',
          label: 'Testo Footer',
          description: 'Testo principale mostrato nel footer',
          category: 'footer',
          isEditable: true,
          isPublic: true
        },
        {
          key: 'FOOTER_VERSION',
          value: 'v2.0',
          type: 'string',
          label: 'Versione App',
          description: 'Versione dell\'applicazione mostrata nel footer',
          category: 'footer',
          isEditable: true,
          isPublic: true
        },
        {
          key: 'FOOTER_EDITION',
          value: 'Enterprise Edition',
          type: 'string',
          label: 'Edizione',
          description: 'Edizione del software mostrata nel footer',
          category: 'footer',
          isEditable: true,
          isPublic: true
        },
        {
          key: 'APP_NAME',
          value: 'Richiesta Assistenza',
          type: 'string',
          label: 'Nome Applicazione',
          description: 'Nome principale dell\'applicazione',
          category: 'branding',
          isEditable: true,
          isPublic: true
        }
      ]
    });

    console.log('✅ System Enums and Settings seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding system enums and settings:', error);
    throw error;
  }
}

async function main() {
  await seedSystemEnumsAndSettings();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default seedSystemEnumsAndSettings;
