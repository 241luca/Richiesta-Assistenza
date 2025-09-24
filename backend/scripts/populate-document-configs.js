/**
 * Script per popolare le tabelle di configurazione documenti
 * Data: 16/01/2025
 * 
 * IMPORTANTE: Questo script popola le tabelle vuote mantenendo
 * la compatibilità con il sistema esistente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateDocumentConfigs() {
  console.log('🚀 POPOLAMENTO TABELLE CONFIGURAZIONE DOCUMENTI');
  console.log('===============================================\n');

  try {
    // 1. Trova un utente admin per le operazioni
    console.log('🔍 Cerco utente admin...');
    let adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });

    if (!adminUser) {
      console.log('❌ Nessun admin trovato. Impossibile continuare.');
      return;
    }
    console.log(`✅ Admin trovato: ${adminUser.email}\n`);

    // ====================================================
    // STEP 1: POPOLA DOCUMENT CATEGORIES
    // ====================================================
    console.log('📂 STEP 1: Popolamento Categorie Documenti...');
    console.log('-----------------------------------------');

    const categories = [
      {
        code: 'LEGAL',
        name: 'Documenti Legali',
        description: 'Documenti legali e normativi (Privacy, Terms, etc.)',
        icon: 'ScaleIcon',
        color: 'blue',
        sortOrder: 1,
        isActive: true
      },
      {
        code: 'TECHNICAL',
        name: 'Documenti Tecnici',
        description: 'Manuali, guide tecniche e documentazione',
        icon: 'WrenchScrewdriverIcon',
        color: 'green',
        sortOrder: 2,
        isActive: true
      },
      {
        code: 'ADMINISTRATIVE',
        name: 'Documenti Amministrativi',
        description: 'Contratti, accordi e documenti amministrativi',
        icon: 'DocumentTextIcon',
        color: 'yellow',
        sortOrder: 3,
        isActive: true
      },
      {
        code: 'SAFETY',
        name: 'Sicurezza',
        description: 'Documenti relativi alla sicurezza sul lavoro',
        icon: 'ShieldCheckIcon',
        color: 'red',
        sortOrder: 4,
        isActive: true
      }
    ];

    for (const cat of categories) {
      const existing = await prisma.documentCategory.findUnique({
        where: { code: cat.code }
      });

      if (!existing) {
        await prisma.documentCategory.create({
          data: cat
        });
        console.log(`  ✅ Categoria creata: ${cat.name}`);
      } else {
        console.log(`  ⏭️  Categoria già esistente: ${cat.name}`);
      }
    }

    // ====================================================
    // STEP 2: POPOLA DOCUMENT TYPES
    // ====================================================
    console.log('\n📋 STEP 2: Popolamento Tipi Documento...');
    console.log('-----------------------------------------');

    const documentTypes = [
      {
        code: 'PRIVACY_POLICY',
        name: 'Privacy Policy',
        displayName: 'Informativa sulla Privacy',
        description: 'Informativa sul trattamento dei dati personali (GDPR)',
        icon: 'ShieldCheckIcon',
        color: 'blue',
        category: 'LEGAL',
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        isRequired: true,
        requiresApproval: true,
        requiresSignature: false,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 365,
        approverRoles: ['SUPER_ADMIN', 'ADMIN'],
        publisherRoles: ['SUPER_ADMIN'],
        metadata: {
          gdprCompliant: true,
          legalReference: 'Reg. UE 2016/679'
        }
      },
      {
        code: 'TERMS_SERVICE',
        name: 'Terms of Service',
        displayName: 'Termini e Condizioni',
        description: 'Termini e condizioni di utilizzo del servizio',
        icon: 'DocumentTextIcon',
        color: 'green',
        category: 'LEGAL',
        sortOrder: 2,
        isSystem: true,
        isActive: true,
        isRequired: true,
        requiresApproval: true,
        requiresSignature: false,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: false,
        expiryDays: null,
        approverRoles: ['SUPER_ADMIN', 'ADMIN'],
        publisherRoles: ['SUPER_ADMIN'],
        metadata: {
          version: '1.0',
          lastReview: new Date().toISOString()
        }
      },
      {
        code: 'COOKIE_POLICY',
        name: 'Cookie Policy',
        displayName: 'Cookie Policy',
        description: 'Informativa sui cookie e tecnologie simili',
        icon: 'CakeIcon',
        color: 'yellow',
        category: 'LEGAL',
        sortOrder: 3,
        isSystem: true,
        isActive: true,
        isRequired: false,
        requiresApproval: true,
        requiresSignature: false,
        notifyOnCreate: false,
        notifyOnUpdate: true,
        notifyOnExpiry: false,
        expiryDays: null,
        approverRoles: ['SUPER_ADMIN', 'ADMIN'],
        publisherRoles: ['SUPER_ADMIN', 'ADMIN'],
        metadata: {
          cookieTypes: ['necessary', 'analytics', 'functional']
        }
      },
      {
        code: 'SERVICE_CONTRACT',
        name: 'Contratto di Servizio',
        displayName: 'Contratto di Servizio',
        description: 'Contratto standard per prestazione di servizi',
        icon: 'DocumentCheckIcon',
        color: 'purple',
        category: 'ADMINISTRATIVE',
        sortOrder: 4,
        isSystem: false,
        isActive: true,
        isRequired: false,
        requiresApproval: true,
        requiresSignature: true,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 30,
        approverRoles: ['SUPER_ADMIN', 'ADMIN'],
        publisherRoles: ['SUPER_ADMIN', 'ADMIN', 'PROFESSIONAL'],
        metadata: {
          template: 'standard',
          requiresClientSignature: true,
          requiresProfessionalSignature: true
        }
      },
      {
        code: 'SAFETY_PROTOCOL',
        name: 'Protocollo Sicurezza',
        displayName: 'Protocollo di Sicurezza',
        description: 'Protocollo sicurezza sul lavoro D.Lgs 81/08',
        icon: 'ExclamationTriangleIcon',
        color: 'red',
        category: 'SAFETY',
        sortOrder: 5,
        isSystem: false,
        isActive: true,
        isRequired: false,
        requiresApproval: true,
        requiresSignature: true,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 180,
        approverRoles: ['SUPER_ADMIN'],
        publisherRoles: ['SUPER_ADMIN', 'ADMIN'],
        metadata: {
          legalReference: 'D.Lgs 81/08',
          riskLevel: 'high'
        }
      }
    ];

    for (const docType of documentTypes) {
      const existing = await prisma.documentTypeConfig.findUnique({
        where: { code: docType.code }
      });

      if (!existing) {
        await prisma.documentTypeConfig.create({
          data: {
            ...docType,
            createdBy: adminUser.id,
            variables: [
              { key: 'companyName', label: 'Nome Azienda' },
              { key: 'date', label: 'Data' },
              { key: 'version', label: 'Versione' }
            ],
            workflowSteps: [
              { step: 1, name: 'Bozza', role: 'ADMIN' },
              { step: 2, name: 'Revisione', role: 'ADMIN' },
              { step: 3, name: 'Approvazione', role: 'SUPER_ADMIN' },
              { step: 4, name: 'Pubblicazione', role: 'SUPER_ADMIN' }
            ]
          }
        });
        console.log(`  ✅ Tipo documento creato: ${docType.displayName}`);
      } else {
        console.log(`  ⏭️  Tipo già esistente: ${docType.displayName}`);
      }
    }

    // ====================================================
    // STEP 3: POPOLA SYSTEM CONFIG
    // ====================================================
    console.log('\n⚙️  STEP 3: Configurazioni di Sistema...');
    console.log('-----------------------------------------');

    const systemConfigs = [
      {
        key: 'enable_auto_approval',
        value: false,
        category: 'workflow',
        description: 'Abilita approvazione automatica documenti',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'auto_approval_days',
        value: 7,
        category: 'workflow',
        description: 'Giorni per approvazione automatica',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'enable_versioning',
        value: true,
        category: 'general',
        description: 'Abilita versionamento documenti',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'max_versions_per_document',
        value: 10,
        category: 'general',
        description: 'Numero massimo versioni per documento',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'require_approval_comment',
        value: true,
        category: 'workflow',
        description: 'Richiedi commento per approvazione',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'notification_days_before_expiry',
        value: 30,
        category: 'notifications',
        description: 'Giorni prima della scadenza per notifica',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'enable_digital_signature',
        value: false,
        category: 'general',
        description: 'Abilita firma digitale',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'default_document_language',
        value: 'it',
        category: 'general',
        description: 'Lingua di default documenti',
        dataType: 'string',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'show_version_comparison',
        value: true,
        category: 'ui',
        description: 'Mostra confronto versioni',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'allow_bulk_operations',
        value: true,
        category: 'ui',
        description: 'Permetti operazioni bulk',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      }
    ];

    for (const config of systemConfigs) {
      const existing = await prisma.documentSystemConfig.findUnique({
        where: { key: config.key }
      });

      if (!existing) {
        await prisma.documentSystemConfig.create({
          data: { ...config, updatedBy: adminUser.id }
        });
        console.log(`  ✅ Config creata: ${config.key}`);
      } else {
        console.log(`  ⏭️  Config già esistente: ${config.key}`);
      }
    }

    // ====================================================
    // STEP 4: POPOLA PERMESSI DEFAULT
    // ====================================================
    console.log('\n🔐 STEP 4: Permessi Default...');
    console.log('-----------------------------------------');

    const permissions = [
      {
        role: 'SUPER_ADMIN',
        documentType: null, // Tutti i documenti
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
        documentType: null,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
        canSubmitReview: true,
        canApprove: true,
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
        documentType: null,
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
        documentType: null,
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
        canExport: false,
        canImport: false,
        canManageTemplates: false
      }
    ];

    for (const perm of permissions) {
      const existing = await prisma.documentPermission.findFirst({
        where: {
          role: perm.role,
          documentType: perm.documentType
        }
      });

      if (!existing) {
        await prisma.documentPermission.create({ data: perm });
        console.log(`  ✅ Permessi creati per: ${perm.role}`);
      } else {
        console.log(`  ⏭️  Permessi già esistenti per: ${perm.role}`);
      }
    }

    // ====================================================
    // STEP 5: COLLEGA DOCUMENTI ESISTENTI AI NUOVI TIPI
    // ====================================================
    console.log('\n🔗 STEP 5: Collegamento documenti esistenti...');
    console.log('-----------------------------------------');

    // Trova i documenti esistenti che non hanno typeConfigId
    const existingDocs = await prisma.legalDocument.findMany({
      where: { typeConfigId: null }
    });

    console.log(`  Documenti da collegare: ${existingDocs.length}`);

    for (const doc of existingDocs) {
      // Trova il tipo corrispondente
      const typeConfig = await prisma.documentTypeConfig.findUnique({
        where: { code: doc.type }
      });

      if (typeConfig) {
        await prisma.legalDocument.update({
          where: { id: doc.id },
          data: { typeConfigId: typeConfig.id }
        });
        console.log(`  ✅ Collegato: ${doc.displayName} → ${typeConfig.displayName}`);
      } else {
        console.log(`  ⚠️  Tipo non trovato per: ${doc.type}`);
      }
    }

    // ====================================================
    // STEP 6: CREA WORKFLOW DEFAULT
    // ====================================================
    console.log('\n📊 STEP 6: Workflow Default...');
    console.log('-----------------------------------------');

    const defaultWorkflow = {
      name: 'Workflow Standard',
      description: 'Workflow di default per tutti i documenti',
      documentType: null, // Applicabile a tutti
      steps: [
        { order: 1, name: 'Creazione', status: 'DRAFT', requiredRole: 'ADMIN' },
        { order: 2, name: 'Revisione', status: 'REVIEW', requiredRole: 'ADMIN' },
        { order: 3, name: 'Approvazione', status: 'APPROVED', requiredRole: 'SUPER_ADMIN' },
        { order: 4, name: 'Pubblicazione', status: 'PUBLISHED', requiredRole: 'SUPER_ADMIN' }
      ],
      notificationConfig: {
        onStepChange: true,
        onCompletion: true,
        onRejection: true
      },
      autoApproveAfterDays: null,
      autoPublishAfterApproval: false,
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id
    };

    const existingWorkflow = await prisma.approvalWorkflowConfig.findUnique({
      where: { name: defaultWorkflow.name }
    });

    if (!existingWorkflow) {
      await prisma.approvalWorkflowConfig.create({ data: defaultWorkflow });
      console.log('  ✅ Workflow default creato');
    } else {
      console.log('  ⏭️  Workflow default già esistente');
    }

    // ====================================================
    // RIEPILOGO FINALE
    // ====================================================
    console.log('\n📊 RIEPILOGO FINALE');
    console.log('===================');

    const [
      categoriesCount,
      typesCount,
      configsCount,
      permissionsCount,
      workflowsCount,
      linkedDocsCount
    ] = await Promise.all([
      prisma.documentCategory.count(),
      prisma.documentTypeConfig.count(),
      prisma.documentSystemConfig.count(),
      prisma.documentPermission.count(),
      prisma.approvalWorkflowConfig.count(),
      prisma.legalDocument.count({ where: { typeConfigId: { not: null } } })
    ]);

    console.log(`  📂 Categorie: ${categoriesCount}`);
    console.log(`  📋 Tipi documento: ${typesCount}`);
    console.log(`  ⚙️  Configurazioni: ${configsCount}`);
    console.log(`  🔐 Permessi: ${permissionsCount}`);
    console.log(`  📊 Workflow: ${workflowsCount}`);
    console.log(`  🔗 Documenti collegati: ${linkedDocsCount}`);

    console.log('\n✅ POPOLAMENTO COMPLETATO CON SUCCESSO!');
    console.log('=======================================\n');

    console.log('📌 PROSSIMI PASSI:');
    console.log('  1. Verifica nel pannello admin che i tipi siano visibili');
    console.log('  2. Testa che i documenti esistenti funzionino ancora');
    console.log('  3. Prova a creare un nuovo documento dal pannello');
    console.log('  4. Verifica che i permessi funzionino correttamente');

  } catch (error) {
    console.error('❌ ERRORE:', error);
    console.error('\n⚠️  Alcune operazioni potrebbero non essere completate.');
    console.error('Controlla i log per maggiori dettagli.');
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
console.log('');
populateDocumentConfigs()
  .catch((e) => {
    console.error('❌ Errore fatale:', e);
    process.exit(1);
  });
