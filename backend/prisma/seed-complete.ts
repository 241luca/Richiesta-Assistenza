import { PrismaClient } from '@prisma/client'
import type { User, Category, Subcategory, AssistanceRequest, Quote, Notification } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function seed() {
  try {
    console.log('🌱 Starting complete database seed...\n')
    
    // 1. Pulisci il database nell'ordine corretto per rispettare le foreign key
    console.log('🧹 Cleaning existing data...')
    
    // Prima elimina le tabelle che dipendono da altre
    await prisma.requestUpdate.deleteMany()
    await prisma.requestAttachment.deleteMany()
    await prisma.quoteItem.deleteMany()
    await prisma.quoteRevision.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.quote.deleteMany()
    await prisma.message.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.notificationPreference.deleteMany()
    await prisma.loginHistory.deleteMany()
    await prisma.assistanceRequest.deleteMany()
    await prisma.professionalUserSubcategory.deleteMany()
    await prisma.subcategoryAiSettings.deleteMany()
    await prisma.subcategory.deleteMany()
    await prisma.category.deleteMany()
    await prisma.apiKey.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('✅ Database cleaned\n')
    
    // 2. CREA GLI UTENTI (4 admin/staff + 4 clienti + 4 professionisti = 12 utenti)
    console.log('👥 Creating users...')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    const now = new Date()
    
    // Array tipizzati per salvare gli utenti creati
    const users: { admins: User[]; clients: User[]; professionals: User[] } = {
      admins: [],
      clients: [],
      professionals: []
    }
    
    // ADMIN E STAFF
    const superAdmin = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: 'admin@assistenza.it',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        emailVerified: true,
        phone: '+39 333 1234567',
        address: 'Via Roma 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        country: 'IT',
        status: 'offline',
        currency: 'EUR',
        twoFactorEnabled: false,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      }
    })
    users.admins.push(superAdmin)
    
    const staff = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: 'staff@assistenza.it',
        username: 'staff',
        password: hashedPassword,
        firstName: 'Staff',
        lastName: 'Assistenza',
        fullName: 'Staff Assistenza',
        role: 'ADMIN',
        emailVerified: true,
        phone: '+39 333 4567890',
        address: 'Via Staff 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        country: 'IT',
        status: 'offline',
        currency: 'EUR',
        twoFactorEnabled: false,
        loginAttempts: 0,
        createdAt: now,
        updatedAt: now
      }
    })
    users.admins.push(staff)
    
    // CLIENTI (4 clienti)
    const clientsData = [
      {
        email: 'luigi.bianchi@gmail.com',
        username: 'luigi.bianchi',
        firstName: 'Luigi',
        lastName: 'Bianchi',
        fullName: 'Luigi Bianchi',
        phone: '+39 333 3456789',
        address: 'Via Napoli 5',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80100'
      },
      {
        email: 'maria.rossi@hotmail.it',
        username: 'maria.rossi',
        firstName: 'Maria',
        lastName: 'Rossi',
        fullName: 'Maria Rossi',
        phone: '+39 334 5678901',
        address: 'Corso Vittorio Emanuele 120',
        city: 'Roma',
        province: 'RM',
        postalCode: '00186'
      },
      {
        email: 'giuseppe.verdi@libero.it',
        username: 'giuseppe.verdi',
        firstName: 'Giuseppe',
        lastName: 'Verdi',
        fullName: 'Giuseppe Verdi',
        phone: '+39 335 6789012',
        address: 'Via Garibaldi 45',
        city: 'Torino',
        province: 'TO',
        postalCode: '10122'
      },
      {
        email: 'anna.ferrari@outlook.it',
        username: 'anna.ferrari',
        firstName: 'Anna',
        lastName: 'Ferrari',
        fullName: 'Anna Ferrari',
        phone: '+39 336 7890123',
        address: 'Via Mazzini 78',
        city: 'Bologna',
        province: 'BO',
        postalCode: '40121'
      }
    ]
    
    for (const clientData of clientsData) {
      const client = await prisma.user.create({
        data: {
          id: randomUUID(),
          ...clientData,
          password: hashedPassword,
          role: 'CLIENT',
          emailVerified: true,
          country: 'IT',
          status: 'offline',
          currency: 'EUR',
          twoFactorEnabled: false,
          loginAttempts: 0,
          createdAt: now,
          updatedAt: now
        }
      })
      users.clients.push(client)
    }
    
    // PROFESSIONISTI (4 professionisti)
    const professionalsData = [
      {
        email: 'mario.rossi@assistenza.it',
        username: 'mario.rossi',
        firstName: 'Mario',
        lastName: 'Rossi',
        fullName: 'Mario Rossi',
        phone: '+39 333 2345678',
        address: 'Via Milano 10',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        profession: 'Idraulico',
        hourlyRate: 35.00,
        specializations: ['Impianti idraulici', 'Riparazioni urgenti', 'Installazione sanitari', 'Caldaie']
      },
      {
        email: 'francesco.russo@assistenza.it',
        username: 'francesco.russo',
        firstName: 'Francesco',
        lastName: 'Russo',
        fullName: 'Francesco Russo',
        phone: '+39 337 8901234',
        address: 'Via Dante 25',
        city: 'Milano',
        province: 'MI',
        postalCode: '20121',
        profession: 'Elettricista',
        hourlyRate: 40.00,
        specializations: ['Impianti elettrici', 'Automazione', 'Domotica', 'Certificazioni']
      },
      {
        email: 'paolo.costa@assistenza.it',
        username: 'paolo.costa',
        firstName: 'Paolo',
        lastName: 'Costa',
        fullName: 'Paolo Costa',
        phone: '+39 338 9012345',
        address: 'Via Verdi 88',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80133',
        profession: 'Tecnico Climatizzazione',
        hourlyRate: 45.00,
        specializations: ['Climatizzatori', 'Pompe di calore', 'Impianti VRF', 'Manutenzione']
      },
      {
        email: 'luca.moretti@assistenza.it',
        username: 'luca.moretti',
        firstName: 'Luca',
        lastName: 'Moretti',
        fullName: 'Luca Moretti',
        phone: '+39 339 0123456',
        address: 'Viale Europa 156',
        city: 'Torino',
        province: 'TO',
        postalCode: '10126',
        profession: 'Falegname',
        hourlyRate: 38.00,
        specializations: ['Mobili su misura', 'Restauro', 'Porte e finestre', 'Parquet']
      }
    ]
    
    for (const profData of professionalsData) {
      const professional = await prisma.user.create({
        data: {
          id: randomUUID(),
          ...profData,
          password: hashedPassword,
          role: 'PROFESSIONAL',
          emailVerified: true,
          country: 'IT',
          status: 'offline',
          currency: 'EUR',
          twoFactorEnabled: false,
          loginAttempts: 0,
          createdAt: now,
          updatedAt: now
        }
      })
      users.professionals.push(professional)
    }
    
    console.log(`✅ Created ${users.admins.length + users.clients.length + users.professionals.length} users`)
    console.log(`  - ${users.admins.length} Admin/Staff`)
    console.log(`  - ${users.clients.length} Clients`)
    console.log(`  - ${users.professionals.length} Professionals`)
    
    // 3. CREA LE CATEGORIE
    console.log('\n📁 Creating categories...')
    
    const categoriesData = [
      { 
        id: randomUUID(),
        name: 'Idraulica', 
        slug: 'idraulica', 
        icon: '🔧', 
        color: '#3B82F6',
        textColor: '#FFFFFF',
        description: 'Servizi di idraulica per casa e ufficio',
        isActive: true,
        displayOrder: 0,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: randomUUID(),
        name: 'Elettricità', 
        slug: 'elettricita', 
        icon: '⚡', 
        color: '#F59E0B',
        textColor: '#FFFFFF',
        description: 'Impianti elettrici e riparazioni',
        isActive: true,
        displayOrder: 1,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: randomUUID(),
        name: 'Climatizzazione', 
        slug: 'climatizzazione', 
        icon: '❄️', 
        color: '#10B981',
        textColor: '#FFFFFF',
        description: 'Installazione e manutenzione climatizzatori',
        isActive: true,
        displayOrder: 2,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: randomUUID(),
        name: 'Edilizia', 
        slug: 'edilizia', 
        icon: '🏗️', 
        color: '#6B7280',
        textColor: '#FFFFFF',
        description: 'Lavori di muratura e ristrutturazione',
        isActive: true,
        displayOrder: 3,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: randomUUID(),
        name: 'Falegnameria', 
        slug: 'falegnameria', 
        icon: '🪵', 
        color: '#92400E',
        textColor: '#FFFFFF',
        description: 'Lavori in legno e restauro mobili',
        isActive: true,
        displayOrder: 4,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: randomUUID(),
        name: 'Pulizie', 
        slug: 'pulizie', 
        icon: '🧹', 
        color: '#EC4899',
        textColor: '#FFFFFF',
        description: 'Servizi di pulizia professionale',
        isActive: true,
        displayOrder: 5,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: randomUUID(),
        name: 'Giardinaggio', 
        slug: 'giardinaggio', 
        icon: '🌿', 
        color: '#84CC16',
        textColor: '#FFFFFF',
        description: 'Manutenzione giardini e spazi verdi',
        isActive: true,
        displayOrder: 6,
        createdAt: now,
        updatedAt: now
      },
      { 
        id: randomUUID(),
        name: 'Traslochi', 
        slug: 'traslochi', 
        icon: '📦', 
        color: '#7C3AED',
        textColor: '#FFFFFF',
        description: 'Servizi di trasloco e trasporto',
        isActive: true,
        displayOrder: 7,
        createdAt: now,
        updatedAt: now
      }
    ]
    
    const categories: Category[] = []
    for (const categoryData of categoriesData) {
      const category = await prisma.category.create({
        data: categoryData
      })
      categories.push(category)
    }
    
    console.log(`✅ Created ${categories.length} categories`)
    
    // 4. CREA LE SOTTOCATEGORIE DETTAGLIATE (5 per categoria)
    console.log('\n📂 Creating detailed subcategories...')
    
    const categorySubcategories = {
      'Idraulica': [
        { name: 'Riparazioni urgenti', slug: 'riparazioni-urgenti-idraulica', description: 'Perdite, rotture tubazioni, allagamenti' },
        { name: 'Installazione sanitari', slug: 'installazione-sanitari', description: 'Montaggio lavandini, WC, bidet, docce' },
        { name: 'Caldaie e scaldabagni', slug: 'caldaie-scaldabagni', description: 'Installazione e manutenzione caldaie' },
        { name: 'Tubazioni', slug: 'tubazioni', description: 'Sostituzione e riparazione tubi' },
        { name: 'Scarichi e fognature', slug: 'scarichi-fognature', description: 'Disostruzione e riparazione scarichi' }
      ],
      'Elettricità': [
        { name: 'Impianti elettrici civili', slug: 'impianti-elettrici-civili', description: 'Impianti per abitazioni e uffici' },
        { name: 'Quadri elettrici', slug: 'quadri-elettrici', description: 'Installazione e certificazione quadri' },
        { name: 'Illuminazione', slug: 'illuminazione', description: 'Punti luce, lampadari, LED' },
        { name: 'Prese e interruttori', slug: 'prese-interruttori', description: 'Installazione e sostituzione' },
        { name: 'Automazioni', slug: 'automazioni', description: 'Cancelli automatici, tapparelle elettriche' }
      ],
      'Climatizzazione': [
        { name: 'Condizionatori', slug: 'condizionatori', description: 'Installazione e manutenzione climatizzatori' },
        { name: 'Pompe di calore', slug: 'pompe-calore', description: 'Sistemi di riscaldamento/raffrescamento' },
        { name: 'Ventilazione', slug: 'ventilazione', description: 'Sistemi di ventilazione meccanica' },
        { name: 'Pulizia filtri', slug: 'pulizia-filtri-clima', description: 'Sanificazione e manutenzione filtri' },
        { name: 'Ricarica gas', slug: 'ricarica-gas', description: 'Ricarica gas refrigerante' }
      ],
      'Edilizia': [
        { name: 'Ristrutturazioni complete', slug: 'ristrutturazioni-complete', description: 'Ristrutturazione appartamenti e locali' },
        { name: 'Muratura', slug: 'muratura', description: 'Muri, tramezzi, aperture' },
        { name: 'Intonaci', slug: 'intonaci', description: 'Intonacatura e rasatura pareti' },
        { name: 'Pavimenti', slug: 'pavimenti', description: 'Posa piastrelle e pavimenti' },
        { name: 'Impermeabilizzazioni', slug: 'impermeabilizzazioni', description: 'Terrazzi, tetti, cantine' }
      ],
      'Falegnameria': [
        { name: 'Mobili su misura', slug: 'mobili-su-misura', description: 'Progettazione e realizzazione mobili' },
        { name: 'Riparazione mobili', slug: 'riparazione-mobili', description: 'Restauro e sistemazione mobili' },
        { name: 'Porte e finestre', slug: 'porte-finestre', description: 'Installazione e riparazione infissi' },
        { name: 'Parquet', slug: 'parquet', description: 'Posa e manutenzione pavimenti legno' },
        { name: 'Cucine', slug: 'cucine', description: 'Montaggio e modifica cucine' }
      ],
      'Pulizie': [
        { name: 'Pulizie domestiche', slug: 'pulizie-domestiche', description: 'Pulizie ordinarie abitazioni' },
        { name: 'Pulizie uffici', slug: 'pulizie-uffici', description: 'Pulizie locali commerciali' },
        { name: 'Pulizie post cantiere', slug: 'pulizie-post-cantiere', description: 'Pulizie dopo lavori edili' },
        { name: 'Sanificazione', slug: 'sanificazione', description: 'Sanificazione e disinfezione ambienti' },
        { name: 'Vetri e facciate', slug: 'vetri-facciate', description: 'Pulizia vetrate e facciate esterne' }
      ],
      'Giardinaggio': [
        { name: 'Manutenzione giardini', slug: 'manutenzione-giardini', description: 'Taglio erba, potature, pulizia' },
        { name: 'Progettazione giardini', slug: 'progettazione-giardini', description: 'Creazione nuovi spazi verdi' },
        { name: 'Irrigazione', slug: 'irrigazione', description: 'Impianti irrigazione automatica' },
        { name: 'Potature', slug: 'potature', description: 'Potatura alberi e siepi' },
        { name: 'Disinfestazione', slug: 'disinfestazione', description: 'Trattamenti antiparassitari' }
      ],
      'Traslochi': [
        { name: 'Traslochi completi', slug: 'traslochi-completi', description: 'Trasloco casa o ufficio completo' },
        { name: 'Piccoli trasporti', slug: 'piccoli-trasporti', description: 'Trasporto singoli mobili o oggetti' },
        { name: 'Montaggio mobili', slug: 'montaggio-mobili-trasloco', description: 'Smontaggio e rimontaggio arredi' },
        { name: 'Deposito temporaneo', slug: 'deposito-temporaneo', description: 'Stoccaggio mobili temporaneo' },
        { name: 'Imballaggio', slug: 'imballaggio', description: 'Servizio imballaggio professionale' }
      ]
    }
    
    const subcategories: Subcategory[] = []
    let displayOrder = 0
    
    for (const category of categories) {
      const subcatsData = categorySubcategories[category.name] || []
      
      for (const subcatData of subcatsData) {
        const subcategory = await prisma.subcategory.create({
          data: {
            id: randomUUID(),
            ...subcatData,
            categoryId: category.id,
            isActive: true,
            displayOrder: displayOrder++,
            createdAt: now,
            updatedAt: now
          }
        })
        subcategories.push(subcategory)
      }
    }
    
    console.log(`✅ Created ${subcategories.length} detailed subcategories`)
    
    // 5. CREA 20 RICHIESTE DI ASSISTENZA REALISTICHE
    console.log('\n📋 Creating realistic assistance requests...')
    
    const requestsData = [
      // Richieste per Idraulica
      {
        title: 'Perdita urgente rubinetto cucina',
        description: 'Il rubinetto della cucina perde costantemente. L\'acqua gocciola anche quando è chiuso. Necessito intervento urgente.',
        priority: 'HIGH',
        status: 'PENDING',
        clientId: users.clients[0].id,
        categoryId: categories[0].id, // Idraulica
        subcategoryId: subcategories.find(s => s.slug === 'riparazioni-urgenti-idraulica')?.id,
        requestedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Sostituzione caldaia vecchia',
        description: 'La caldaia ha oltre 15 anni e non funziona più correttamente. Vorrei sostituirla con un modello a condensazione.',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        clientId: users.clients[1].id,
        professionalId: users.professionals[0].id, // Mario l'idraulico
        categoryId: categories[0].id,
        subcategoryId: subcategories.find(s => s.slug === 'caldaie-scaldabagni')?.id,
        requestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Installazione nuovo bagno completo',
        description: 'Devo ristrutturare il bagno. Necessito installazione di: WC, bidet, lavandino, doccia. Tutto nuovo.',
        priority: 'LOW',
        status: 'ASSIGNED',
        clientId: users.clients[2].id,
        professionalId: users.professionals[0].id,
        categoryId: categories[0].id,
        subcategoryId: subcategories.find(s => s.slug === 'installazione-sanitari')?.id,
        requestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Scarico lavandino intasato',
        description: 'Lo scarico del lavandino del bagno è completamente bloccato. L\'acqua non defluisce per niente.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        clientId: users.clients[3].id,
        professionalId: users.professionals[0].id,
        categoryId: categories[0].id,
        subcategoryId: subcategories.find(s => s.slug === 'scarichi-fognature')?.id,
        requestedDate: new Date(Date.now()),
        scheduledDate: new Date(Date.now())
      },
      
      // Richieste per Elettricità
      {
        title: 'Cortocircuito in cucina',
        description: 'Quando accendo il forno salta la corrente. Credo ci sia un problema all\'impianto elettrico della cucina.',
        priority: 'HIGH',
        status: 'PENDING',
        clientId: users.clients[0].id,
        categoryId: categories[1].id, // Elettricità
        subcategoryId: subcategories.find(s => s.slug === 'impianti-elettrici-civili')?.id,
        requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Installazione luci giardino',
        description: 'Vorrei installare un sistema di illuminazione per il giardino con sensori di movimento.',
        priority: 'LOW',
        status: 'ASSIGNED',
        clientId: users.clients[1].id,
        professionalId: users.professionals[1].id, // Francesco l'elettricista
        categoryId: categories[1].id,
        subcategoryId: subcategories.find(s => s.slug === 'illuminazione')?.id,
        requestedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Certificazione impianto elettrico',
        description: 'Ho bisogno della certificazione dell\'impianto elettrico per vendere casa.',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        clientId: users.clients[2].id,
        professionalId: users.professionals[1].id,
        categoryId: categories[1].id,
        subcategoryId: subcategories.find(s => s.slug === 'quadri-elettrici')?.id,
        requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Installazione cancello automatico',
        description: 'Vorrei automatizzare il cancello del viale. Il cancello c\'è già, serve solo il motore e l\'impianto.',
        priority: 'MEDIUM',
        status: 'PENDING',
        clientId: users.clients[3].id,
        categoryId: categories[1].id,
        subcategoryId: subcategories.find(s => s.slug === 'automazioni')?.id,
        requestedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },
      
      // Richieste per Climatizzazione
      {
        title: 'Installazione condizionatore camera',
        description: 'Voglio installare un condizionatore in camera da letto. La stanza è di circa 20mq.',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        clientId: users.clients[0].id,
        professionalId: users.professionals[2].id, // Paolo tecnico clima
        categoryId: categories[2].id, // Climatizzazione
        subcategoryId: subcategories.find(s => s.slug === 'condizionatori')?.id,
        requestedDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Manutenzione climatizzatori ufficio',
        description: 'Ho 5 climatizzatori in ufficio che necessitano manutenzione annuale e pulizia filtri.',
        priority: 'LOW',
        status: 'ASSIGNED',
        clientId: users.clients[1].id,
        professionalId: users.professionals[2].id,
        categoryId: categories[2].id,
        subcategoryId: subcategories.find(s => s.slug === 'pulizia-filtri-clima')?.id,
        requestedDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Ricarica gas condizionatore',
        description: 'Il condizionatore non raffredda più come prima. Credo abbia bisogno di una ricarica del gas.',
        priority: 'MEDIUM',
        status: 'PENDING',
        clientId: users.clients[2].id,
        categoryId: categories[2].id,
        subcategoryId: subcategories.find(s => s.slug === 'ricarica-gas')?.id,
        requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      
      // Richieste per Edilizia
      {
        title: 'Creazione apertura porta',
        description: 'Vorrei creare un\'apertura nel muro per collegare due stanze. Il muro non è portante.',
        priority: 'LOW',
        status: 'PENDING',
        clientId: users.clients[3].id,
        categoryId: categories[3].id, // Edilizia
        subcategoryId: subcategories.find(s => s.slug === 'muratura')?.id,
        requestedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Rifacimento bagno completo',
        description: 'Ristrutturazione completa del bagno: demolizione, nuovi impianti, piastrelle, sanitari.',
        priority: 'MEDIUM',
        status: 'PENDING',
        clientId: users.clients[0].id,
        categoryId: categories[3].id,
        subcategoryId: subcategories.find(s => s.slug === 'ristrutturazioni-complete')?.id,
        requestedDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
      },
      
      // Richieste per Falegnameria
      {
        title: 'Armadio su misura camera',
        description: 'Vorrei un armadio su misura per la camera matrimoniale. Dimensioni: 3m x 2.5m h.',
        priority: 'LOW',
        status: 'ASSIGNED',
        clientId: users.clients[1].id,
        professionalId: users.professionals[3].id, // Luca falegname
        categoryId: categories[4].id, // Falegnameria
        subcategoryId: subcategories.find(s => s.slug === 'mobili-su-misura')?.id,
        requestedDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        scheduledDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Riparazione porta ingresso',
        description: 'La porta d\'ingresso non si chiude bene. Va sistemata la serratura e regolate le cerniere.',
        priority: 'HIGH',
        status: 'PENDING',
        clientId: users.clients[2].id,
        categoryId: categories[4].id,
        subcategoryId: subcategories.find(s => s.slug === 'porte-finestre')?.id,
        requestedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Montaggio cucina IKEA',
        description: 'Ho acquistato una cucina IKEA completa. Cerco professionista per il montaggio.',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        clientId: users.clients[3].id,
        professionalId: users.professionals[3].id,
        categoryId: categories[4].id,
        subcategoryId: subcategories.find(s => s.slug === 'cucine')?.id,
        requestedDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
      },
      
      // Richieste per Pulizie
      {
        title: 'Pulizia settimanale appartamento',
        description: 'Cerco servizio di pulizia settimanale per appartamento di 100mq. Ogni giovedì mattina.',
        priority: 'LOW',
        status: 'PENDING',
        clientId: users.clients[0].id,
        categoryId: categories[5].id, // Pulizie
        subcategoryId: subcategories.find(s => s.slug === 'pulizie-domestiche')?.id,
        requestedDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Pulizia post ristrutturazione',
        description: 'Ho appena finito di ristrutturare. Necessito pulizia completa per rimuovere polvere e residui.',
        priority: 'HIGH',
        status: 'PENDING',
        clientId: users.clients[1].id,
        categoryId: categories[5].id,
        subcategoryId: subcategories.find(s => s.slug === 'pulizie-post-cantiere')?.id,
        requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      
      // Richieste per Giardinaggio
      {
        title: 'Potatura siepe e alberi',
        description: 'Ho una siepe di 30 metri e 3 alberi da frutto che necessitano potatura urgente.',
        priority: 'MEDIUM',
        status: 'PENDING',
        clientId: users.clients[2].id,
        categoryId: categories[6].id, // Giardinaggio
        subcategoryId: subcategories.find(s => s.slug === 'potature')?.id,
        requestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      
      // Richieste per Traslochi
      {
        title: 'Trasloco bilocale completo',
        description: 'Devo traslocare da Milano a Roma. Bilocale con circa 50mq di mobili e oggetti.',
        priority: 'MEDIUM',
        status: 'PENDING',
        clientId: users.clients[3].id,
        categoryId: categories[7].id, // Traslochi
        subcategoryId: subcategories.find(s => s.slug === 'traslochi-completi')?.id,
        requestedDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
      }
    ]
    
    const requests: AssistanceRequest[] = []
    for (const reqData of requestsData) {
      const request = await prisma.assistanceRequest.create({
        data: {
          id: randomUUID(),
          ...reqData,
          address: users.clients.find(c => c.id === reqData.clientId)?.address ?? null,
          city: users.clients.find(c => c.id === reqData.clientId)?.city ?? null,
          province: users.clients.find(c => c.id === reqData.clientId)?.province ?? null,
          postalCode: users.clients.find(c => c.id === reqData.clientId)?.postalCode ?? null,
          createdAt: now,
          updatedAt: now
        }
      })
      requests.push(request)
    }
    
    console.log(`✅ Created ${requests.length} realistic assistance requests`)
    
    // 6. CREA PREVENTIVI REALISTICI PER LE RICHIESTE APPROPRIATE
    console.log('\n💰 Creating realistic quotes...')
    
    const quotes: Quote[] = []
    
    // Preventivo per sostituzione caldaia
    const quote1 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[1].id, // Sostituzione caldaia
        professionalId: users.professionals[0].id,
        title: 'Preventivo sostituzione caldaia a condensazione',
        description: 'Fornitura e installazione caldaia a condensazione 24kW con certificazione',
        amount: 2850.00,
        currency: 'EUR',
        status: 'PENDING',
        version: 1,
        depositRequired: true,
        depositAmount: 500.00,
        depositPaid: false,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: 'Include smontaggio vecchia caldaia, installazione nuova, certificazione impianto',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote1)
    
    await prisma.quoteItem.createMany({
      data: [
        {
          id: randomUUID(),
          quoteId: quote1.id,
          description: 'Caldaia a condensazione 24kW marca Vaillant',
          quantity: 1,
          unitPrice: 1800.00,
          totalPrice: 1800.00,
          taxRate: 0.10,
          taxAmount: 180.00,
          discount: 0,
          order: 1,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote1.id,
          description: 'Kit fumi e accessori installazione',
          quantity: 1,
          unitPrice: 350.00,
          totalPrice: 350.00,
          taxRate: 0.22,
          taxAmount: 77.00,
          discount: 0,
          order: 2,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote1.id,
          description: 'Manodopera installazione e collaudo',
          quantity: 8,
          unitPrice: 50.00,
          totalPrice: 400.00,
          taxRate: 0.22,
          taxAmount: 88.00,
          discount: 0,
          order: 3,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote1.id,
          description: 'Smaltimento caldaia vecchia',
          quantity: 1,
          unitPrice: 150.00,
          totalPrice: 150.00,
          taxRate: 0.22,
          taxAmount: 33.00,
          discount: 0,
          order: 4,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote1.id,
          description: 'Certificazione impianto e pratiche ENEA',
          quantity: 1,
          unitPrice: 150.00,
          totalPrice: 150.00,
          taxRate: 0.22,
          taxAmount: 33.00,
          discount: 0,
          order: 5,
          createdAt: now
        }
      ]
    })
    
    // Preventivo per installazione bagno
    const quote2 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[2].id, // Installazione bagno
        professionalId: users.professionals[0].id,
        title: 'Preventivo installazione bagno completo',
        description: 'Installazione completa sanitari e rubinetteria per bagno',
        amount: 1250.00,
        currency: 'EUR',
        status: 'ACCEPTED',
        version: 1,
        depositRequired: false,
        depositPaid: false,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Sanitari e rubinetteria esclusi dal preventivo',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote2)
    
    await prisma.quoteItem.createMany({
      data: [
        {
          id: randomUUID(),
          quoteId: quote2.id,
          description: 'Installazione WC e cassetta',
          quantity: 1,
          unitPrice: 250.00,
          totalPrice: 250.00,
          taxRate: 0.22,
          taxAmount: 55.00,
          discount: 0,
          order: 1,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote2.id,
          description: 'Installazione bidet',
          quantity: 1,
          unitPrice: 200.00,
          totalPrice: 200.00,
          taxRate: 0.22,
          taxAmount: 44.00,
          discount: 0,
          order: 2,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote2.id,
          description: 'Installazione lavabo e mobile',
          quantity: 1,
          unitPrice: 300.00,
          totalPrice: 300.00,
          taxRate: 0.22,
          taxAmount: 66.00,
          discount: 0,
          order: 3,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote2.id,
          description: 'Installazione piatto doccia e box',
          quantity: 1,
          unitPrice: 400.00,
          totalPrice: 400.00,
          taxRate: 0.22,
          taxAmount: 88.00,
          discount: 0,
          order: 4,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote2.id,
          description: 'Allacciamenti idraulici e test',
          quantity: 1,
          unitPrice: 100.00,
          totalPrice: 100.00,
          taxRate: 0.22,
          taxAmount: 22.00,
          discount: 0,
          order: 5,
          createdAt: now
        }
      ]
    })
    
    // Preventivo per certificazione impianto elettrico
    const quote3 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[6].id, // Certificazione elettrica
        professionalId: users.professionals[1].id,
        title: 'Preventivo certificazione impianto elettrico',
        description: 'Verifica e certificazione completa impianto elettrico abitazione',
        amount: 450.00,
        currency: 'EUR',
        status: 'PENDING',
        version: 1,
        depositRequired: false,
        depositPaid: false,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        notes: 'Include tutte le verifiche necessarie e rilascio certificazione',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote3)
    
    await prisma.quoteItem.createMany({
      data: [
        {
          id: randomUUID(),
          quoteId: quote3.id,
          description: 'Verifica impianto e quadro elettrico',
          quantity: 1,
          unitPrice: 200.00,
          totalPrice: 200.00,
          taxRate: 0.22,
          taxAmount: 44.00,
          discount: 0,
          order: 1,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote3.id,
          description: 'Test di isolamento e continuità',
          quantity: 1,
          unitPrice: 100.00,
          totalPrice: 100.00,
          taxRate: 0.22,
          taxAmount: 22.00,
          discount: 0,
          order: 2,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote3.id,
          description: 'Rilascio certificazione di conformità',
          quantity: 1,
          unitPrice: 150.00,
          totalPrice: 150.00,
          taxRate: 0.22,
          taxAmount: 33.00,
          discount: 0,
          order: 3,
          createdAt: now
        }
      ]
    })
    
    // Preventivo per installazione condizionatore
    const quote4 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[8].id, // Condizionatore camera
        professionalId: users.professionals[2].id,
        title: 'Preventivo installazione condizionatore 12000 BTU',
        description: 'Fornitura e installazione climatizzatore inverter per camera 20mq',
        amount: 950.00,
        currency: 'EUR',
        status: 'PENDING',
        version: 1,
        depositRequired: false,
        depositPaid: false,
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        notes: 'Garanzia 2 anni su apparecchio, 1 anno su installazione',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote4)
    
    await prisma.quoteItem.createMany({
      data: [
        {
          id: randomUUID(),
          quoteId: quote4.id,
          description: 'Climatizzatore 12000 BTU inverter A+++',
          quantity: 1,
          unitPrice: 550.00,
          totalPrice: 550.00,
          taxRate: 0.22,
          taxAmount: 121.00,
          discount: 0,
          order: 1,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote4.id,
          description: 'Kit installazione (staffe, tubi rame, cavi)',
          quantity: 1,
          unitPrice: 180.00,
          totalPrice: 180.00,
          taxRate: 0.22,
          taxAmount: 39.60,
          discount: 0,
          order: 2,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote4.id,
          description: 'Manodopera installazione',
          quantity: 3,
          unitPrice: 60.00,
          totalPrice: 180.00,
          taxRate: 0.22,
          taxAmount: 39.60,
          discount: 0,
          order: 3,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote4.id,
          description: 'Messa in funzione e collaudo',
          quantity: 1,
          unitPrice: 40.00,
          totalPrice: 40.00,
          taxRate: 0.22,
          taxAmount: 8.80,
          discount: 0,
          order: 4,
          createdAt: now
        }
      ]
    })
    
    // Preventivo per manutenzione climatizzatori
    const quote5 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[9].id, // Manutenzione clima ufficio
        professionalId: users.professionals[2].id,
        title: 'Preventivo manutenzione 5 climatizzatori',
        description: 'Manutenzione ordinaria annuale per 5 unità climatizzazione ufficio',
        amount: 350.00,
        currency: 'EUR',
        status: 'ACCEPTED',
        version: 1,
        depositRequired: false,
        depositPaid: false,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes: 'Include pulizia filtri, controllo gas, verifica funzionamento',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote5)
    
    await prisma.quoteItem.createMany({
      data: [
        {
          id: randomUUID(),
          quoteId: quote5.id,
          description: 'Pulizia filtri e sanificazione (per unità)',
          quantity: 5,
          unitPrice: 40.00,
          totalPrice: 200.00,
          taxRate: 0.22,
          taxAmount: 44.00,
          discount: 0,
          order: 1,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote5.id,
          description: 'Controllo pressione gas refrigerante',
          quantity: 5,
          unitPrice: 20.00,
          totalPrice: 100.00,
          taxRate: 0.22,
          taxAmount: 22.00,
          discount: 0,
          order: 2,
          createdAt: now
        },
        {
          id: randomUUID(),
          quoteId: quote5.id,
          description: 'Test funzionamento e report tecnico',
          quantity: 1,
          unitPrice: 50.00,
          totalPrice: 50.00,
          taxRate: 0.22,
          taxAmount: 11.00,
          discount: 0,
          order: 3,
          createdAt: now
        }
      ]
    })
    
    // Preventivo per ristrutturazione bagno
    const quote6 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[12].id, // Rifacimento bagno
        professionalId: users.professionals[0].id,
        title: 'Preventivo ristrutturazione completa bagno',
        description: 'Ristrutturazione chiavi in mano bagno 6mq',
        amount: 8500.00,
        currency: 'EUR',
        status: 'PENDING',
        version: 2, // Seconda versione dopo trattativa
        depositRequired: true,
        depositAmount: 2000.00,
        depositPaid: false,
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        notes: 'Lavoro completo in 15 giorni lavorativi. Sanitari di media gamma inclusi',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote6)
    
    // Preventivo per armadio su misura
    const quote7 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[13].id, // Armadio su misura
        professionalId: users.professionals[3].id,
        title: 'Preventivo armadio su misura 3x2.5m',
        description: 'Realizzazione armadio su misura in laminato con ante scorrevoli',
        amount: 3200.00,
        currency: 'EUR',
        status: 'PENDING',
        version: 1,
        depositRequired: true,
        depositAmount: 1000.00,
        depositPaid: false,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: 'Tempi di realizzazione: 20 giorni dalla conferma ordine',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote7)
    
    // Preventivo per montaggio cucina
    const quote8 = await prisma.quote.create({
      data: {
        id: randomUUID(),
        requestId: requests[15].id, // Montaggio cucina IKEA
        professionalId: users.professionals[3].id,
        title: 'Preventivo montaggio cucina IKEA',
        description: 'Montaggio completo cucina componibile IKEA',
        amount: 650.00,
        currency: 'EUR',
        status: 'ACCEPTED',
        version: 1,
        depositRequired: false,
        depositPaid: false,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Include montaggio mobili, top e installazione elettrodomestici. Allacciamenti idraulici esclusi',
        createdAt: now,
        updatedAt: now
      }
    })
    quotes.push(quote8)
    
    console.log(`✅ Created ${quotes.length} realistic quotes with items`)
    
    // 7. CREA NOTIFICHE DI ESEMPIO
    console.log('\n🔔 Creating sample notifications...')
    
    const notifications: Notification[] = []
    
    // Notifiche per richieste assegnate
    for (const request of requests.filter(r => r.status === 'ASSIGNED')) {
      const notification = await prisma.notification.create({
        data: {
          id: randomUUID(),
          type: 'request_assigned',
          title: 'Richiesta assegnata',
          content: `Ti è stata assegnata la richiesta: "${request.title}"`,
          priority: 'NORMAL',
          recipientId: request.professionalId!,
          isRead: false,
          metadata: {
            requestId: request.id,
            requestTitle: request.title
          },
          createdAt: now
        }
      })
      notifications.push(notification)
    }
    
    // Notifiche per preventivi ricevuti
    for (const quote of quotes.slice(0, 5)) {
      const request = requests.find(r => r.id === quote.requestId)
      if (request) {
        const notification = await prisma.notification.create({
          data: {
            id: randomUUID(),
            type: 'quote_received',
            title: 'Nuovo preventivo ricevuto',
            content: `Hai ricevuto un preventivo per: "${request.title}"`,
            priority: 'NORMAL',
            recipientId: request.clientId,
            senderId: quote.professionalId,
            isRead: Math.random() > 0.5,
            metadata: {
              quoteId: quote.id,
              requestId: request.id,
              amount: quote.amount
            },
            createdAt: now
          }
        })
        notifications.push(notification)
      }
    }
    
    // Notifiche di benvenuto per i nuovi utenti
    for (const client of users.clients.slice(0, 2)) {
      const notification = await prisma.notification.create({
        data: {
          id: randomUUID(),
          type: 'welcome',
          title: 'Benvenuto su Richiesta Assistenza!',
          content: 'Il tuo account è stato creato con successo. Inizia creando la tua prima richiesta di assistenza.',
          priority: 'LOW',
          recipientId: client.id,
          isRead: true,
          metadata: {},
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      })
      notifications.push(notification)
    }
    
    console.log(`✅ Created ${notifications.length} notifications`)
    
    // 8. CREA API KEYS
    console.log('\n🔐 Creating API keys...')
    
    const apiKey = await prisma.apiKey.create({
      data: {
        id: randomUUID(),
        name: 'Default System API Key',
        key: `sk_live_${randomUUID().replace(/-/g, '')}`,
        service: 'SYSTEM_DEFAULT',
        userId: superAdmin.id,
        permissions: { scopes: ['read', 'write', 'admin'] },
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 anno
        lastUsedAt: null,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    })
    
    console.log('✅ Created system API key')
    
    // RIEPILOGO FINALE
    console.log('\n' + '='.repeat(60))
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!')
    console.log('='.repeat(60))
    
    console.log('\n📊 DATABASE SUMMARY:')
    console.log(`  ✓ ${users.admins.length + users.clients.length + users.professionals.length} Users`)
    console.log(`    - ${users.admins.length} Admin/Staff`)
    console.log(`    - ${users.clients.length} Clients`)
    console.log(`    - ${users.professionals.length} Professionals`)
    console.log(`  ✓ ${categories.length} Categories`)
    console.log(`  ✓ ${subcategories.length} Subcategories (5 per category)`)
    console.log(`  ✓ ${requests.length} Assistance Requests`)
    console.log(`    - ${requests.filter(r => r.status === 'PENDING').length} Pending`)
    console.log(`    - ${requests.filter(r => r.status === 'ASSIGNED').length} Assigned`)
    console.log(`    - ${requests.filter(r => r.status === 'QUOTED').length} Quoted`)
    console.log(`    - ${requests.filter(r => r.status === 'IN_PROGRESS').length} In Progress`)
    console.log(`  ✓ ${quotes.length} Quotes with detailed items`)
    console.log(`    - ${quotes.filter(q => q.status === 'PENDING').length} Pending`)
    console.log(`    - ${quotes.filter(q => q.status === 'ACCEPTED').length} Accepted`)
    console.log(`  ✓ ${notifications.length} Notifications`)
    console.log(`  ✓ 1 System API Key`)
    
    console.log('\n📝 LOGIN CREDENTIALS (password: password123):')
    console.log('\n  ADMIN:')
    console.log('  🔴 admin@assistenza.it (Super Admin)')
    console.log('  🟡 staff@assistenza.it (Staff)')
    
    console.log('\n  CLIENTS:')
    for (const client of users.clients) {
      console.log(`  🔵 ${client.email}`)
    }
    
    console.log('\n  PROFESSIONALS:')
    for (const prof of users.professionals) {
      console.log(`  🟢 ${prof.email} (${prof.profession})`)
    }
    
    console.log('\n✨ Database is now fully populated with realistic test data!')
    
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui il seed
seed()
