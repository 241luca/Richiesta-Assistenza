// Seed data per Sistema Rapporti di Intervento
// File: backend/prisma/seeds/intervention-report-seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedInterventionReports() {
  console.log('🌱 Seeding Intervention Report System...');

  try {
    // ========== CONFIGURAZIONE GLOBALE ==========
    // Usa un ID fisso per la configurazione globale
    const configId = '00000000-0000-0000-0000-000000000001';
    const config = await prisma.interventionReportConfig.upsert({
      where: { id: configId },
      update: { updatedAt: new Date() },
      create: {
        id: configId,
        name: 'Configurazione Rapporti',
        numberingPrefix: 'RI',
        numberingFormat: 'RI-{YEAR}-{NUMBER:5}',
        currentNumber: 0,
        resetYearly: true,
        requireSignatures: true,
        allowDraftSave: true,
        autoSendToClient: false,
        enableGPS: true,
        enableTimer: true,
        enableMaterials: true,
        enablePhotos: true,
        maxPhotosPerType: 5,
        photoTypes: JSON.stringify(['prima', 'durante', 'dopo']),
        photoCompressionQuality: 80,
        pdfOrientation: 'portrait',
        pdfFormat: 'A4',
        notifyProfessionalOnSign: true,
        notifyClientOnCreate: true,
        notifyAdminOnIssue: false,
        updatedAt: new Date()
      }
    });
    console.log('✅ Configurazione globale creata');

    // ========== TIPI DI CAMPO ==========
    const fieldTypes = [
      {
        code: 'text',
        name: 'Testo Semplice',
        description: 'Campo di testo singola riga',
        icon: 'Type',
        component: 'TextField',
        isSystem: true,
        displayOrder: 10
      },
      {
        code: 'textarea',
        name: 'Testo Multiriga',
        description: 'Campo di testo su più righe',
        icon: 'AlignLeft',
        component: 'TextAreaField',
        isSystem: true,
        displayOrder: 20
      },
      {
        code: 'number',
        name: 'Numero',
        description: 'Campo numerico',
        icon: 'Hash',
        component: 'NumberField',
        isSystem: true,
        displayOrder: 30
      },
      {
        code: 'date',
        name: 'Data',
        description: 'Selezione data',
        icon: 'Calendar',
        component: 'DateField',
        isSystem: true,
        displayOrder: 40
      },
      {
        code: 'time',
        name: 'Ora',
        description: 'Selezione orario',
        icon: 'Clock',
        component: 'TimeField',
        isSystem: true,
        displayOrder: 50
      },
      {
        code: 'select',
        name: 'Selezione Singola',
        description: 'Menu a tendina',
        icon: 'ChevronDown',
        component: 'SelectField',
        isSystem: true,
        displayOrder: 60
      },
      {
        code: 'multiselect',
        name: 'Selezione Multipla',
        description: 'Selezione multipla',
        icon: 'CheckSquare',
        component: 'MultiSelectField',
        isSystem: true,
        displayOrder: 70
      },
      {
        code: 'radio',
        name: 'Scelta Singola',
        description: 'Radio buttons',
        icon: 'Circle',
        component: 'RadioField',
        isSystem: true,
        displayOrder: 80
      },
      {
        code: 'checkbox',
        name: 'Checkbox',
        description: 'Casella di spunta',
        icon: 'CheckSquare',
        component: 'CheckboxField',
        isSystem: true,
        displayOrder: 90
      },
      {
        code: 'signature',
        name: 'Firma',
        description: 'Campo firma digitale',
        icon: 'Edit',
        component: 'SignatureField',
        isSystem: true,
        displayOrder: 100
      },
      {
        code: 'photo',
        name: 'Foto',
        description: 'Upload foto',
        icon: 'Camera',
        component: 'PhotoField',
        isSystem: true,
        displayOrder: 110
      },
      {
        code: 'timer',
        name: 'Timer',
        description: 'Cronometro start/stop',
        icon: 'Timer',
        component: 'TimerField',
        isSystem: true,
        displayOrder: 120
      },
      {
        code: 'gps',
        name: 'Posizione GPS',
        description: 'Coordinate geografiche',
        icon: 'MapPin',
        component: 'GpsField',
        isSystem: true,
        displayOrder: 130
      },
      {
        code: 'materials',
        name: 'Materiali',
        description: 'Lista materiali utilizzati',
        icon: 'Package',
        component: 'MaterialsField',
        isSystem: true,
        displayOrder: 140
      },
      {
        code: 'heading',
        name: 'Intestazione',
        description: 'Titolo di sezione',
        icon: 'Heading',
        component: 'HeadingField',
        isSystem: true,
        displayOrder: 150
      },
      {
        code: 'separator',
        name: 'Separatore',
        description: 'Linea separatrice',
        icon: 'Minus',
        component: 'SeparatorField',
        isSystem: true,
        displayOrder: 160
      }
    ];

    for (const fieldType of fieldTypes) {
      await prisma.interventionFieldType.upsert({
        where: { code: fieldType.code },
        update: { ...fieldType, updatedAt: new Date() },
        create: { id: fieldType.code, ...fieldType, updatedAt: new Date() }
      });
    }
    console.log(`✅ ${fieldTypes.length} tipi di campo creati`);

    // ========== SEZIONI TEMPLATE ==========
    const sections = [
      {
        code: 'client_info',
        name: 'Informazioni Cliente',
        description: 'Dati anagrafici del cliente',
        icon: 'User',
        isSystem: true,
        defaultOrder: 100
      },
      {
        code: 'intervention_details',
        name: 'Dettagli Intervento',
        description: 'Informazioni sull\'intervento',
        icon: 'Wrench',
        isSystem: true,
        defaultOrder: 200
      },
      {
        code: 'problem_description',
        name: 'Descrizione Problema',
        description: 'Problema riscontrato',
        icon: 'AlertTriangle',
        isSystem: true,
        defaultOrder: 300
      },
      {
        code: 'work_performed',
        name: 'Lavoro Eseguito',
        description: 'Attività svolte',
        icon: 'CheckCircle',
        isSystem: true,
        defaultOrder: 400
      },
      {
        code: 'materials',
        name: 'Materiali Utilizzati',
        description: 'Lista materiali e ricambi',
        icon: 'Package',
        isSystem: true,
        defaultOrder: 500
      },
      {
        code: 'photos',
        name: 'Documentazione Fotografica',
        description: 'Foto prima, durante e dopo',
        icon: 'Camera',
        isSystem: true,
        defaultOrder: 600
      },
      {
        code: 'notes',
        name: 'Note e Raccomandazioni',
        description: 'Note aggiuntive',
        icon: 'FileText',
        isSystem: true,
        defaultOrder: 700
      },
      {
        code: 'signatures',
        name: 'Firme',
        description: 'Firme di conferma',
        icon: 'Edit',
        isSystem: true,
        defaultOrder: 800
      }
    ];

    for (const section of sections) {
      await prisma.interventionTemplateSection.upsert({
        where: { code: section.code },
        update: { ...section, updatedAt: new Date() },
        create: { id: section.code, ...section, updatedAt: new Date() }
      });
    }
    console.log(`✅ ${sections.length} sezioni template create`);

    // ========== STATI RAPPORTO ==========
    const statuses = [
      {
        code: 'draft',
        name: 'Bozza',
        description: 'Rapporto in fase di compilazione',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: 'Edit',
        allowEdit: true,
        allowDelete: true,
        requireSignature: false,
        notifyClient: false,
        isFinal: false,
        isDefault: true,
        nextStatuses: JSON.stringify(['completed', 'sent']),
        displayOrder: 10
      },
      {
        code: 'completed',
        name: 'Completato',
        description: 'Rapporto compilato in attesa di invio',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: 'CheckCircle',
        allowEdit: true,
        allowDelete: false,
        requireSignature: false,
        notifyClient: false,
        isFinal: false,
        isDefault: false,
        nextStatuses: JSON.stringify(['sent', 'signed']),
        displayOrder: 20
      },
      {
        code: 'sent',
        name: 'Inviato',
        description: 'Rapporto inviato al cliente',
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        icon: 'Send',
        allowEdit: false,
        allowDelete: false,
        requireSignature: false,
        notifyClient: true,
        isFinal: false,
        isDefault: false,
        nextStatuses: JSON.stringify(['signed', 'disputed']),
        displayOrder: 30
      },
      {
        code: 'signed',
        name: 'Firmato',
        description: 'Rapporto firmato da entrambe le parti',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        icon: 'Shield',
        allowEdit: false,
        allowDelete: false,
        requireSignature: true,
        notifyClient: false,
        isFinal: true,
        isDefault: false,
        nextStatuses: JSON.stringify([]),
        displayOrder: 40
      },
      {
        code: 'disputed',
        name: 'Contestato',
        description: 'Rapporto con contestazioni',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: 'AlertCircle',
        allowEdit: true,
        allowDelete: false,
        requireSignature: false,
        notifyClient: false,
        isFinal: false,
        isDefault: false,
        nextStatuses: JSON.stringify(['signed', 'cancelled']),
        displayOrder: 50
      },
      {
        code: 'cancelled',
        name: 'Annullato',
        description: 'Rapporto annullato',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: 'X',
        allowEdit: false,
        allowDelete: false,
        requireSignature: false,
        notifyClient: false,
        isFinal: true,
        isDefault: false,
        nextStatuses: JSON.stringify([]),
        displayOrder: 60
      }
    ];

    for (const status of statuses) {
      await prisma.interventionReportStatus.upsert({
        where: { code: status.code },
        update: { ...status, updatedAt: new Date() },
        create: { id: status.code, ...status, updatedAt: new Date() }
      });
    }
    console.log(`✅ ${statuses.length} stati rapporto creati`);

    // ========== TIPI INTERVENTO ==========
    const interventionTypes = [
      {
        code: 'installation',
        name: 'Installazione',
        description: 'Nuovo impianto o installazione',
        icon: 'Download',
        color: '#10B981',
        requiresQuote: true,
        requiresPhotos: true,
        requiresMaterials: true,
        averageDuration: 4,
        displayOrder: 10
      },
      {
        code: 'maintenance',
        name: 'Manutenzione',
        description: 'Manutenzione ordinaria programmata',
        icon: 'Tool',
        color: '#3B82F6',
        requiresQuote: false,
        requiresPhotos: false,
        requiresMaterials: false,
        averageDuration: 2,
        displayOrder: 20
      },
      {
        code: 'repair',
        name: 'Riparazione',
        description: 'Riparazione guasto',
        icon: 'Wrench',
        color: '#F59E0B',
        requiresQuote: true,
        requiresPhotos: true,
        requiresMaterials: true,
        averageDuration: 3,
        displayOrder: 30
      },
      {
        code: 'inspection',
        name: 'Sopralluogo',
        description: 'Verifica e preventivo',
        icon: 'Search',
        color: '#8B5CF6',
        requiresQuote: false,
        requiresPhotos: true,
        requiresMaterials: false,
        averageDuration: 1,
        displayOrder: 40
      },
      {
        code: 'emergency',
        name: 'Emergenza',
        description: 'Intervento urgente',
        icon: 'AlertTriangle',
        color: '#EF4444',
        requiresQuote: false,
        requiresPhotos: true,
        requiresMaterials: true,
        averageDuration: 2,
        displayOrder: 50
      },
      {
        code: 'consultation',
        name: 'Consulenza',
        description: 'Consulenza tecnica',
        icon: 'MessageCircle',
        color: '#6B7280',
        requiresQuote: false,
        requiresPhotos: false,
        requiresMaterials: false,
        averageDuration: 1,
        displayOrder: 60
      }
    ];

    for (const type of interventionTypes) {
      await prisma.interventionType.upsert({
        where: { code: type.code },
        update: { ...type, updatedAt: new Date() },
        create: { id: type.code, ...type, updatedAt: new Date() }
      });
    }
    console.log(`✅ ${interventionTypes.length} tipi intervento creati`);

    // ========== MATERIALI BASE ==========
    const materials = [
      // Materiali elettrici
      {
        code: 'CABLE_1.5',
        name: 'Cavo elettrico 1.5mm²',
        description: 'Cavo unipolare N07V-K',
        category: 'Elettrico',
        subcategory: 'Cavi',
        unit: 'm',
        defaultPrice: 0.80,
        vatRate: 22
      },
      {
        code: 'CABLE_2.5',
        name: 'Cavo elettrico 2.5mm²',
        description: 'Cavo unipolare N07V-K',
        category: 'Elettrico',
        subcategory: 'Cavi',
        unit: 'm',
        defaultPrice: 1.20,
        vatRate: 22
      },
      {
        code: 'SWITCH_BTI',
        name: 'Interruttore BTicino',
        description: 'Interruttore unipolare BTicino Living',
        category: 'Elettrico',
        subcategory: 'Interruttori',
        brand: 'BTicino',
        unit: 'pz',
        defaultPrice: 8.50,
        vatRate: 22
      },
      {
        code: 'PLUG_SCHUKO',
        name: 'Presa Schuko',
        description: 'Presa bipasso con terra',
        category: 'Elettrico',
        subcategory: 'Prese',
        unit: 'pz',
        defaultPrice: 12.00,
        vatRate: 22
      },
      // Materiali idraulici
      {
        code: 'PIPE_20',
        name: 'Tubo multistrato 20mm',
        description: 'Tubo multistrato per acqua',
        category: 'Idraulico',
        subcategory: 'Tubazioni',
        unit: 'm',
        defaultPrice: 3.50,
        vatRate: 22
      },
      {
        code: 'VALVE_BALL',
        name: 'Valvola a sfera 1/2"',
        description: 'Valvola a sfera in ottone',
        category: 'Idraulico',
        subcategory: 'Valvole',
        unit: 'pz',
        defaultPrice: 8.00,
        vatRate: 22
      },
      {
        code: 'SIPHON',
        name: 'Sifone lavabo',
        description: 'Sifone in PP per lavabo',
        category: 'Idraulico',
        subcategory: 'Scarichi',
        unit: 'pz',
        defaultPrice: 15.00,
        vatRate: 22
      },
      // Servizi
      {
        code: 'LABOR_HOUR',
        name: 'Manodopera oraria',
        description: 'Ora di manodopera specializzata',
        category: 'Servizi',
        unit: 'h',
        defaultPrice: 35.00,
        vatRate: 22,
        isService: true
      },
      {
        code: 'TRAVEL',
        name: 'Diritto di chiamata',
        description: 'Spese di trasferta',
        category: 'Servizi',
        unit: 'pz',
        defaultPrice: 25.00,
        vatRate: 22,
        isService: true
      }
    ];

    for (const material of materials) {
      await prisma.interventionMaterial.upsert({
        where: { code: material.code },
        update: { ...material, updatedAt: new Date() },
        create: { id: material.code, ...material, updatedAt: new Date() }
      });
    }
    console.log(`✅ ${materials.length} materiali base creati`);

    console.log('🎉 Seed Sistema Rapporti di Intervento completato!');
  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    throw error;
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  seedInterventionReports()
    .then(() => {
      console.log('✅ Seed completato con successo');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Errore nel seed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
