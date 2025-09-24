import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed per il sistema di documenti legali configurabile
 * Inserisce tutti i dati iniziali necessari per il funzionamento
 */
async function seedLegalConfig() {
  console.log('🌱 Seeding Legal Document Configuration System...');

  try {
    // 1. DOCUMENT TYPE CONFIGURATION
    console.log('📝 Creating Document Types...');
    
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
        code: 'NDA',
        name: 'Non-Disclosure Agreement',
        displayName: 'Accordo di Riservatezza',
        description: 'Accordo di non divulgazione',
        icon: 'LockClosedIcon',
        color: 'red',
        category: 'business',
        sortOrder: 5,
        isSystem: false,
        isActive: true,
        isRequired: false,
        requiresApproval: true,
        requiresSignature: true,
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnExpiry: true,
        expiryDays: 90,
        approverRoles: ['SUPER_ADMIN'],
        publisherRoles: ['SUPER_ADMIN']
      }
    ];

    for (const docType of documentTypes) {
      await prisma.documentTypeConfig.upsert({
        where: { code: docType.code },
        update: docType,
        create: docType
      });
    }
    console.log('✅ Document types created');

    // 2. DOCUMENT CATEGORIES
    console.log('📂 Creating Document Categories...');
    
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
    ];

    for (const category of categories) {
      await prisma.documentCategory.upsert({
        where: { code: category.code },
        update: category,
        create: category
      });
    }
    console.log('✅ Document categories created');

    // 3. APPROVAL WORKFLOWS
    console.log('🔄 Creating Approval Workflows...');
    
    const defaultWorkflow = {
      name: 'Standard Approval Workflow',
      description: 'Workflow standard per documenti legali',
      documentType: null, // Applica a tutti i tipi
      steps: [
        {
          order: 1,
          name: 'Draft',
          status: 'DRAFT',
          actions: ['edit', 'delete', 'submit_review'],
          nextStatus: 'REVIEW',
          allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
          requiresComment: false,
          notifyOnEntry: false,
          notifyOnExit: true
        },
        {
          order: 2,
          name: 'Review',
          status: 'REVIEW',
          actions: ['approve', 'reject', 'request_changes'],
          nextStatus: 'APPROVED',
          previousStatus: 'DRAFT',
          allowedRoles: ['SUPER_ADMIN'],
          requiresComment: true,
          notifyOnEntry: true,
          notifyOnExit: true
        },
        {
          order: 3,
          name: 'Approved',
          status: 'APPROVED',
          actions: ['publish', 'reject'],
          nextStatus: 'PUBLISHED',
          previousStatus: 'REVIEW',
          allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
          requiresComment: false,
          notifyOnEntry: true,
          notifyOnExit: true
        },
        {
          order: 4,
          name: 'Published',
          status: 'PUBLISHED',
          actions: ['archive', 'create_new_version'],
          nextStatus: 'ARCHIVED',
          previousStatus: 'APPROVED',
          allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
          requiresComment: false,
          notifyOnEntry: true,
          notifyOnExit: false
        }
      ],
      autoApproveAfterDays: null,
      autoPublishAfterApproval: false,
      autoArchiveAfterDays: 365,
      isActive: true,
      isDefault: true
    };

    await prisma.approvalWorkflowConfig.upsert({
      where: { name: defaultWorkflow.name },
      update: defaultWorkflow,
      create: defaultWorkflow
    });
    console.log('✅ Approval workflows created');

    // 4. SYSTEM CONFIGURATION
    console.log('⚙️ Creating System Configuration...');
    
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
      },
      {
        key: 'show_version_comparison',
        value: { value: true },
        category: 'ui',
        description: 'Mostra confronto tra versioni',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'allow_bulk_operations',
        value: { value: true },
        category: 'ui',
        description: 'Permetti operazioni bulk sui documenti',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      }
    ];

    for (const config of systemConfigs) {
      await prisma.documentSystemConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config
      });
    }
    console.log('✅ System configuration created');

    // 5. DOCUMENT PERMISSIONS
    console.log('🔐 Creating Document Permissions...');
    
    const permissions = [
      {
        role: 'SUPER_ADMIN',
        documentType: null, // Tutti i tipi
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
        canExport: true,
        canImport: false,
        canManageTemplates: false
      }
    ];

    for (const permission of permissions) {
      // Per permessi globali (documentType null), usiamo 'ALL' come valore
      const effectiveDocType = permission.documentType || 'ALL';
      
      // Crea oggetto permesso con documentType sempre valorizzato
      const permissionData = {
        ...permission,
        documentType: effectiveDocType
      };
      
      try {
        await prisma.documentPermission.upsert({
          where: { 
            role_documentType: {
              role: permission.role,
              documentType: effectiveDocType
            }
          },
          update: permissionData,
          create: permissionData
        });
      } catch (error) {
        console.log(`Creating permission for ${permission.role} - ${effectiveDocType}`);
        // Se l'upsert fallisce, prova solo create
        await prisma.documentPermission.create({
          data: permissionData
        }).catch(() => {
          console.log(`Permission already exists for ${permission.role} - ${effectiveDocType}`);
        });
      }
    }
    console.log('✅ Document permissions created');

    // 6. NOTIFICATION TEMPLATES
    console.log('📧 Creating Notification Templates...');
    
    const notificationTemplates = [
      {
        code: 'legal_doc_published',
        name: 'Documento Legale Pubblicato',
        description: 'Notifica quando un nuovo documento legale viene pubblicato',
        documentType: null,
        eventType: 'published',
        subject: 'Nuovo documento legale disponibile: {{documentName}}',
        bodyHtml: `
          <h2>Nuovo documento legale pubblicato</h2>
          <p>È stato pubblicato un nuovo documento che richiede la tua attenzione:</p>
          <p><strong>{{documentName}}</strong></p>
          <p>{{documentDescription}}</p>
          <p>Data di efficacia: {{effectiveDate}}</p>
          <p><a href="{{documentUrl}}">Visualizza il documento</a></p>
        `,
        bodyText: 'Nuovo documento {{documentName}} pubblicato. Visualizzalo su {{documentUrl}}',
        variables: {
          documentName: 'Nome del documento',
          documentDescription: 'Descrizione',
          effectiveDate: 'Data efficacia',
          documentUrl: 'Link al documento'
        },
        channels: ['email', 'in-app'],
        recipientRoles: ['CLIENT', 'PROFESSIONAL'],
        includeAdmins: false,
        isActive: true
      },
      {
        code: 'legal_doc_requires_acceptance',
        name: 'Documento Richiede Accettazione',
        description: 'Notifica quando un documento richiede accettazione',
        documentType: null,
        eventType: 'requires_acceptance',
        subject: 'Azione richiesta: Accetta {{documentName}}',
        bodyHtml: `
          <h2>Documento in attesa di accettazione</h2>
          <p>Il seguente documento richiede la tua accettazione:</p>
          <p><strong>{{documentName}}</strong></p>
          <p>{{documentDescription}}</p>
          <p>Questo documento è obbligatorio per continuare ad utilizzare i nostri servizi.</p>
          <p><a href="{{acceptUrl}}">Accetta ora</a></p>
        `,
        bodyText: 'Il documento {{documentName}} richiede la tua accettazione. Accetta su {{acceptUrl}}',
        variables: {
          documentName: 'Nome del documento',
          documentDescription: 'Descrizione',
          acceptUrl: 'Link per accettazione'
        },
        channels: ['email', 'in-app'],
        recipientRoles: ['CLIENT', 'PROFESSIONAL'],
        includeAdmins: false,
        isActive: true
      },
      {
        code: 'legal_doc_reminder',
        name: 'Reminder Documento Non Accettato',
        description: 'Reminder per documenti non ancora accettati',
        documentType: null,
        eventType: 'reminder',
        subject: 'Reminder: {{documentName}} in attesa di accettazione',
        bodyHtml: `
          <h2>Promemoria importante</h2>
          <p>Ti ricordiamo che il seguente documento è ancora in attesa della tua accettazione:</p>
          <p><strong>{{documentName}}</strong></p>
          <p>Giorni rimanenti: {{daysRemaining}}</p>
          <p><a href="{{acceptUrl}}">Accetta ora</a></p>
        `,
        bodyText: 'Reminder: {{documentName}} in attesa. {{daysRemaining}} giorni rimanenti.',
        variables: {
          documentName: 'Nome del documento',
          daysRemaining: 'Giorni rimanenti',
          acceptUrl: 'Link per accettazione'
        },
        channels: ['email', 'in-app'],
        recipientRoles: ['CLIENT', 'PROFESSIONAL'],
        includeAdmins: false,
        isActive: true
      }
    ];

    for (const template of notificationTemplates) {
      await prisma.documentNotificationTemplate.upsert({
        where: { code: template.code },
        update: template,
        create: template
      });
    }
    console.log('✅ Notification templates created');

    // 7. UI CONFIGURATION
    console.log('🎨 Creating UI Configuration...');
    
    const uiConfigs = [
      {
        page: 'admin-list',
        role: 'ADMIN',
        layout: {
          showFilters: true,
          showSearch: true,
          columns: ['displayName', 'type', 'status', 'lastModified', 'actions'],
          defaultSort: 'lastModified_desc',
          itemsPerPage: 20,
          cardView: false
        },
        actions: {
          showCreate: true,
          showExport: true,
          showImport: false,
          bulkActions: ['archive', 'export'],
          rowActions: ['view', 'edit', 'versions', 'delete']
        },
        fields: {},
        isActive: true
      },
      {
        page: 'admin-list',
        role: 'SUPER_ADMIN',
        layout: {
          showFilters: true,
          showSearch: true,
          columns: ['displayName', 'type', 'status', 'lastModified', 'actions'],
          defaultSort: 'lastModified_desc',
          itemsPerPage: 20,
          cardView: false
        },
        actions: {
          showCreate: true,
          showExport: true,
          showImport: true,
          bulkActions: ['delete', 'archive', 'export'],
          rowActions: ['view', 'edit', 'versions', 'delete', 'duplicate']
        },
        fields: {},
        isActive: true
      }
    ];

    for (const uiConfig of uiConfigs) {
      // Assicurati che role sia sempre valorizzato
      const effectiveRole = uiConfig.role || 'ALL';
      const configData = {
        ...uiConfig,
        role: effectiveRole
      };
      
      try {
        await prisma.documentUIConfig.upsert({
          where: { 
            page_role: {
              page: uiConfig.page,
              role: effectiveRole
            }
          },
          update: configData,
          create: configData
        });
      } catch (error) {
        console.log(`Creating UI config for ${uiConfig.page} - ${effectiveRole}`);
        await prisma.documentUIConfig.create({
          data: configData
        }).catch(() => {
          console.log(`UI config already exists for ${uiConfig.page} - ${effectiveRole}`);
        });
      }
    }
    console.log('✅ UI configuration created');

    console.log('');
    console.log('🎉 Legal Document Configuration System seeding completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('- Document Types: 5');
    console.log('- Categories: 3');
    console.log('- Workflows: 1');
    console.log('- System Configs: 10');
    console.log('- Permissions: 4 roles');
    console.log('- Notification Templates: 3');
    console.log('- UI Configs: 2');
    
  } catch (error) {
    console.error('❌ Error seeding legal configuration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il seed
seedLegalConfig()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
