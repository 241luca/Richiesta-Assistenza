import { PrismaClient } from '@prisma/client'

export async function seedLegalConfig(prisma: PrismaClient) {
  console.log('📄 SEEDING SISTEMA DOCUMENTI LEGALI...\n')

  try {
    // 1. DOCUMENT TYPE CONFIGURATION
    console.log('📝 Creazione tipi documento...')
    
    const documentTypes = [
      {
        code: 'PRIVACY_POLICY',
        name: 'Privacy Policy',
        displayName: 'Informativa sulla Privacy',
        description: 'Informativa sul trattamento dei dati personali (GDPR)',
        icon: 'ShieldCheckIcon',
        color: 'blue',
        category: 'legal',
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        isRequired: true,
        requiresApproval: true,
        requiresSignature: false,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 30,
        approverRoles: ['ADMIN', 'SUPER_ADMIN'],
        publisherRoles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        code: 'TERMS_SERVICE',
        name: 'Terms of Service',
        displayName: 'Termini e Condizioni',
        description: 'Termini e condizioni di utilizzo del servizio',
        icon: 'DocumentTextIcon',
        color: 'green',
        category: 'legal',
        sortOrder: 2,
        isSystem: true,
        isActive: true,
        isRequired: true,
        requiresApproval: true,
        requiresSignature: false,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 30,
        approverRoles: ['ADMIN', 'SUPER_ADMIN'],
        publisherRoles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        code: 'COOKIE_POLICY',
        name: 'Cookie Policy',
        displayName: 'Politica sui Cookie',
        description: 'Informativa sull\'uso dei cookie',
        icon: 'CakeIcon',
        color: 'yellow',
        category: 'legal',
        sortOrder: 3,
        isSystem: true,
        isActive: true,
        isRequired: true,
        requiresApproval: true,
        requiresSignature: false,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: false,
        approverRoles: ['ADMIN', 'SUPER_ADMIN'],
        publisherRoles: ['ADMIN', 'SUPER_ADMIN']
      },
      {
        code: 'DPA',
        name: 'Data Processing Agreement',
        displayName: 'Accordo Trattamento Dati',
        description: 'Accordo per il trattamento dei dati (GDPR Art. 28)',
        icon: 'DocumentCheckIcon',
        color: 'purple',
        category: 'legal',
        sortOrder: 4,
        isSystem: false,
        isActive: true,
        isRequired: false,
        requiresApproval: true,
        requiresSignature: true,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 60,
        approverRoles: ['SUPER_ADMIN'],
        publisherRoles: ['SUPER_ADMIN']
      },
      {
        code: 'PROFESSIONAL_TERMS',
        name: 'Professional Terms',
        displayName: 'Contratto Professionista',
        description: 'Termini e condizioni per i professionisti',
        icon: 'UserGroupIcon',
        color: 'indigo',
        category: 'business',
        sortOrder: 5,
        isSystem: true,
        isActive: true,
        isRequired: true,
        requiresApproval: true,
        requiresSignature: true,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 90,
        approverRoles: ['SUPER_ADMIN'],
        publisherRoles: ['ADMIN', 'SUPER_ADMIN']
      }
    ]

    for (const docType of documentTypes) {
      await prisma.documentTypeConfig.upsert({
        where: { code: docType.code },
        update: docType,
        create: docType
      })
      console.log(`✅ ${docType.displayName}`)
    }

    // 2. DOCUMENT CATEGORIES
    console.log('\n📂 Creazione categorie documento...')
    
    const categories = [
      {
        code: 'legal',
        name: 'Documenti Legali',
        description: 'Documenti legali e normativi (GDPR, Privacy, etc.)',
        icon: 'ScaleIcon',
        color: 'blue',
        sortOrder: 1,
        isActive: true
      },
      {
        code: 'business',
        name: 'Documenti Business',
        description: 'Contratti e accordi commerciali',
        icon: 'BriefcaseIcon',
        color: 'green',
        sortOrder: 2,
        isActive: true
      },
      {
        code: 'technical',
        name: 'Documenti Tecnici',
        description: 'SLA, specifiche tecniche, etc.',
        icon: 'CogIcon',
        color: 'gray',
        sortOrder: 3,
        isActive: true
      }
    ]

    for (const category of categories) {
      await prisma.documentCategory.upsert({
        where: { code: category.code },
        update: category,
        create: category
      })
      console.log(`✅ ${category.name}`)
    }

    // 3. SYSTEM CONFIGURATION
    console.log('\n⚙️ Configurazione sistema...')
    
    const systemConfigs = [
      {
        key: 'enable_auto_approval',
        value: { value: false },
        category: 'workflow',
        description: 'Abilita approvazione automatica dopo X giorni',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'auto_approval_days',
        value: { value: 7 },
        category: 'workflow',
        description: 'Giorni per approvazione automatica',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'enable_versioning',
        value: { value: true },
        category: 'general',
        description: 'Abilita sistema di versionamento documenti',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'max_versions_per_document',
        value: { value: 10 },
        category: 'general',
        description: 'Numero massimo di versioni per documento',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'require_approval_comment',
        value: { value: true },
        category: 'workflow',
        description: 'Richiedi commento obbligatorio per approvazione',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'notification_days_before_expiry',
        value: { value: 30 },
        category: 'notifications',
        description: 'Giorni prima della scadenza per inviare notifica',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'enable_digital_signature',
        value: { value: false },
        category: 'general',
        description: 'Abilita firma digitale avanzata',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'default_document_language',
        value: { value: 'it' },
        category: 'general',
        description: 'Lingua di default per i documenti',
        dataType: 'string',
        isEditable: true,
        isVisible: true
      }
    ]

    for (const config of systemConfigs) {
      await prisma.documentSystemConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config
      })
      console.log(`✅ ${config.key}`)
    }

    // 4. DOCUMENT PERMISSIONS
    console.log('\n🔐 Configurazione permessi...')
    
    const permissions = [
      {
        role: 'SUPER_ADMIN',
        documentType: 'ALL',
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canSubmitReview: true,
        canApprove: true,
        canPublish: true,
        canArchive: true,
        canViewDrafts: true,
        canViewAll: true,
        canExport: true,
        canImport: true,
        canManageTemplates: true
      },
      {
        role: 'ADMIN',
        documentType: 'ALL',
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
        canSubmitReview: true,
        canApprove: false,
        canPublish: true,
        canArchive: true,
        canViewDrafts: true,
        canViewAll: true,
        canExport: true,
        canImport: false,
        canManageTemplates: false
      },
      {
        role: 'PROFESSIONAL',
        documentType: 'ALL',
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canSubmitReview: false,
        canApprove: false,
        canPublish: false,
        canArchive: false,
        canViewDrafts: false,
        canViewAll: false,
        canExport: true,
        canImport: false,
        canManageTemplates: false
      },
      {
        role: 'CLIENT',
        documentType: 'ALL',
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canSubmitReview: false,
        canApprove: false,
        canPublish: false,
        canArchive: false,
        canViewDrafts: false,
        canViewAll: false,
        canExport: true,
        canImport: false,
        canManageTemplates: false
      }
    ]

    for (const permission of permissions) {
      try {
        await prisma.documentPermission.upsert({
          where: { 
            role_documentType: {
              role: permission.role,
              documentType: permission.documentType
            }
          },
          update: permission,
          create: permission
        })
        console.log(`✅ Permessi ${permission.role}`)
      } catch (error) {
        await prisma.documentPermission.create({
          data: permission
        }).catch(() => {
          console.log(`✅ Permessi ${permission.role} (già esistenti)`)
        })
      }
    }

    // REPORT FINALE
    const totals = {
      documentTypes: await prisma.documentTypeConfig.count(),
      categories: await prisma.documentCategory.count(),
      systemConfigs: await prisma.documentSystemConfig.count(),
      permissions: await prisma.documentPermission.count()
    }

    console.log(`
===========================================
📊 SISTEMA DOCUMENTI LEGALI CREATO:
- Tipi documento: ${totals.documentTypes}
- Categorie: ${totals.categories}
- Configurazioni: ${totals.systemConfigs}
- Permessi: ${totals.permissions}
===========================================
`)

  } catch (error) {
    console.error('❌ Errore seeding documenti legali:', error)
  }
}
