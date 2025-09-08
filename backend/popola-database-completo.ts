import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function popolaDatabase() {
  console.log('\n🚀 POPOLAMENTO COMPLETO DATABASE\n')
  console.log('='.repeat(60))
  
  try {
    // ==================== 1. UTENTI ====================
    console.log('\n1️⃣ CREAZIONE UTENTI...')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const users = [
      // Staff
      {
        id: uuidv4(),
        email: 'admin@sistema.it',
        password: hashedPassword,
        fullName: 'Admin Sistema',
        username: 'admin',
        role: 'STAFF',
        isActive: true,
        emailVerified: true
      },
      
      // Clienti
      {
        id: uuidv4(),
        email: 'mario.rossi@email.it',
        password: hashedPassword,
        fullName: 'Mario Rossi',
        username: 'mario.rossi',
        role: 'CLIENT',
        phone: '3331234567',
        address: 'Via Roma 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        isActive: true,
        emailVerified: true
      },
      {
        id: uuidv4(),
        email: 'laura.bianchi@email.it',
        password: hashedPassword,
        fullName: 'Laura Bianchi',
        username: 'laura.bianchi',
        role: 'CLIENT',
        phone: '3337654321',
        address: 'Via Garibaldi 15',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        isActive: true,
        emailVerified: true
      },
      
      // Professionisti
      {
        id: uuidv4(),
        email: 'giuseppe.verdi@pro.it',
        password: hashedPassword,
        fullName: 'Giuseppe Verdi',
        username: 'giuseppe.verdi',
        role: 'PROFESSIONAL',
        phone: '3351112223',
        address: 'Via Milano 25',
        city: 'Torino',
        province: 'TO',
        postalCode: '10100',
        profession: 'Idraulico',
        isActive: true,
        emailVerified: true,
        professionalInfo: {
          yearsExperience: 10,
          description: 'Idraulico professionista con 10 anni di esperienza',
          serviceAreas: ['TO', 'MI'],
          hourlyRate: 35
        }
      },
      {
        id: uuidv4(),
        email: 'anna.ferrari@pro.it',
        password: hashedPassword,
        fullName: 'Anna Ferrari',
        username: 'anna.ferrari',
        role: 'PROFESSIONAL',
        phone: '3359998887',
        address: 'Via Dante 10',
        city: 'Bologna',
        province: 'BO',
        postalCode: '40100',
        profession: 'Elettricista',
        isActive: true,
        emailVerified: true,
        professionalInfo: {
          yearsExperience: 8,
          description: 'Elettricista certificata, specializzata in impianti civili',
          serviceAreas: ['BO', 'MO', 'FE'],
          hourlyRate: 40
        }
      }
    ]
    
    for (const user of users) {
      try {
        await prisma.user.create({ data: user as any })
        console.log(`  ✅ Utente creato: ${user.fullName} (${user.role})`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  Utente già esistente: ${user.email}`)
        }
      }
    }
    
    // ==================== 2. CATEGORIE ====================
    console.log('\n2️⃣ CREAZIONE CATEGORIE...')
    
    const categories = [
      { 
        id: uuidv4(),
        code: 'idraulica',
        name: 'Idraulica',
        description: 'Servizi idraulici: riparazioni, installazioni, manutenzione',
        color: '#3B82F6',
        textColor: '#FFFFFF',
        icon: 'wrench',
        isActive: true,
        displayOrder: 1
      },
      { 
        id: uuidv4(),
        code: 'elettricista',
        name: 'Elettricista',
        description: 'Impianti elettrici, riparazioni, certificazioni',
        color: '#F59E0B',
        textColor: '#FFFFFF',
        icon: 'zap',
        isActive: true,
        displayOrder: 2
      },
      { 
        id: uuidv4(),
        code: 'climatizzazione',
        name: 'Climatizzazione',
        description: 'Installazione e manutenzione condizionatori',
        color: '#10B981',
        textColor: '#FFFFFF',
        icon: 'thermometer',
        isActive: true,
        displayOrder: 3
      },
      { 
        id: uuidv4(),
        code: 'pulizie',
        name: 'Pulizie',
        description: 'Servizi di pulizia professionale',
        color: '#8B5CF6',
        textColor: '#FFFFFF',
        icon: 'sparkles',
        isActive: true,
        displayOrder: 4
      },
      { 
        id: uuidv4(),
        code: 'traslochi',
        name: 'Traslochi',
        description: 'Servizi di trasloco e trasporto',
        color: '#EF4444',
        textColor: '#FFFFFF',
        icon: 'truck',
        isActive: true,
        displayOrder: 5
      }
    ]
    
    for (const cat of categories) {
      try {
        await prisma.category.create({ data: cat })
        console.log(`  ✅ Categoria creata: ${cat.name}`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  Categoria già esistente: ${cat.code}`)
        }
      }
    }
    
    // ==================== 3. SOTTOCATEGORIE ====================
    console.log('\n3️⃣ CREAZIONE SOTTOCATEGORIE...')
    
    const categoryIds = await prisma.category.findMany({ select: { id: true, code: true } })
    const catMap = Object.fromEntries(categoryIds.map(c => [c.code, c.id]))
    
    const subcategories = [
      // Idraulica
      { 
        name: 'Riparazione perdite',
        categoryId: catMap['idraulica'],
        description: 'Riparazione perdite tubature',
        estimatedHours: 2,
        basePrice: 80
      },
      { 
        name: 'Sostituzione rubinetti',
        categoryId: catMap['idraulica'],
        description: 'Sostituzione e installazione rubinetti',
        estimatedHours: 1,
        basePrice: 50
      },
      { 
        name: 'Sturatura scarichi',
        categoryId: catMap['idraulica'],
        description: 'Sturatura lavandini e scarichi',
        estimatedHours: 1,
        basePrice: 60
      },
      
      // Elettricista
      { 
        name: 'Sostituzione interruttori',
        categoryId: catMap['elettricista'],
        description: 'Sostituzione interruttori e prese',
        estimatedHours: 1,
        basePrice: 40
      },
      { 
        name: 'Installazione luci',
        categoryId: catMap['elettricista'],
        description: 'Installazione punti luce',
        estimatedHours: 2,
        basePrice: 100
      },
      { 
        name: 'Verifica impianto',
        categoryId: catMap['elettricista'],
        description: 'Verifica e certificazione impianto',
        estimatedHours: 3,
        basePrice: 150
      },
      
      // Climatizzazione
      { 
        name: 'Installazione condizionatore',
        categoryId: catMap['climatizzazione'],
        description: 'Installazione split condizionatore',
        estimatedHours: 4,
        basePrice: 300
      },
      { 
        name: 'Manutenzione climatizzatore',
        categoryId: catMap['climatizzazione'],
        description: 'Pulizia e manutenzione',
        estimatedHours: 1,
        basePrice: 80
      },
      
      // Pulizie
      { 
        name: 'Pulizia appartamento',
        categoryId: catMap['pulizie'],
        description: 'Pulizia completa appartamento',
        estimatedHours: 3,
        basePrice: 90
      },
      { 
        name: 'Pulizia ufficio',
        categoryId: catMap['pulizie'],
        description: 'Pulizia uffici e locali commerciali',
        estimatedHours: 2,
        basePrice: 80
      },
      
      // Traslochi
      { 
        name: 'Trasloco locale',
        categoryId: catMap['traslochi'],
        description: 'Trasloco nella stessa città',
        estimatedHours: 4,
        basePrice: 200
      },
      { 
        name: 'Trasloco nazionale',
        categoryId: catMap['traslochi'],
        description: 'Trasloco tra città diverse',
        estimatedHours: 8,
        basePrice: 500
      }
    ]
    
    for (const sub of subcategories) {
      if (sub.categoryId) {
        try {
          await prisma.subcategory.create({ 
            data: {
              id: uuidv4(),
              ...sub,
              code: sub.name.toLowerCase().replace(/ /g, '_'),
              isActive: true,
              displayOrder: 1
            } 
          })
          console.log(`  ✅ Sottocategoria creata: ${sub.name}`)
        } catch (error) {
          console.log(`  ⚠️  Errore sottocategoria: ${sub.name}`)
        }
      }
    }
    
    // ==================== 4. CANALI NOTIFICHE ====================
    console.log('\n4️⃣ CREAZIONE CANALI NOTIFICHE...')
    
    const channels = [
      { code: 'email', name: 'Email', type: 'email', provider: 'smtp', isActive: true },
      { code: 'websocket', name: 'WebSocket', type: 'websocket', provider: 'internal', isActive: true },
      { code: 'sms', name: 'SMS', type: 'sms', provider: 'twilio', isActive: true },
      { code: 'push', name: 'Push', type: 'push', provider: 'firebase', isActive: false }
    ]
    
    for (const channel of channels) {
      try {
        await prisma.notificationChannel.create({
          data: {
            id: uuidv4(),
            ...channel,
            configuration: {},
            isDefault: channel.code === 'email',
            priority: channel.code === 'email' ? 0 : 1
          }
        })
        console.log(`  ✅ Canale creato: ${channel.name}`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  Canale già esistente: ${channel.code}`)
        }
      }
    }
    
    // ==================== 5. TEMPLATE NOTIFICHE ====================
    console.log('\n5️⃣ CREAZIONE TEMPLATE NOTIFICHE...')
    
    const templates = [
      // Lista completa template come prima
      { code: 'welcome_user', name: 'Benvenuto nuovo utente', category: 'AUTH' },
      { code: 'password_reset', name: 'Reset password', category: 'AUTH' },
      { code: 'email_verification', name: 'Verifica email', category: 'AUTH' },
      { code: 'request_created_client', name: 'Nuova richiesta (cliente)', category: 'REQUEST' },
      { code: 'request_assigned_client', name: 'Professionista assegnato', category: 'REQUEST' },
      { code: 'request_assigned_professional', name: 'Nuova richiesta assegnata', category: 'REQUEST' },
      { code: 'quote_received', name: 'Nuovo preventivo ricevuto', category: 'QUOTE' },
      { code: 'quote_accepted_professional', name: 'Preventivo accettato', category: 'QUOTE' },
      { code: 'payment_success', name: 'Pagamento completato', category: 'PAYMENT' },
      { code: 'deposit_required', name: 'Richiesta deposito', category: 'PAYMENT' }
    ]
    
    for (const tmpl of templates) {
      try {
        await prisma.notificationTemplate.create({
          data: {
            id: uuidv4(),
            code: tmpl.code,
            name: tmpl.name,
            category: tmpl.category,
            description: tmpl.name,
            htmlContent: `<p>${tmpl.name}</p>`,
            textContent: tmpl.name,
            subject: tmpl.name,
            variables: [],
            channels: ['email', 'websocket'],
            priority: 'NORMAL',
            isActive: true,
            isSystem: true
          }
        })
        console.log(`  ✅ Template creato: ${tmpl.code}`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  Template già esistente: ${tmpl.code}`)
        }
      }
    }
    
    // ==================== 6. RICHIESTE ESEMPIO ====================
    console.log('\n6️⃣ CREAZIONE RICHIESTE ESEMPIO...')
    
    const clienti = await prisma.user.findMany({ where: { role: 'CLIENT' } })
    const professionisti = await prisma.user.findMany({ where: { role: 'PROFESSIONAL' } })
    const categorieDB = await prisma.category.findMany()
    
    if (clienti.length > 0 && categorieDB.length > 0) {
      const requests = [
        {
          id: uuidv4(),
          clientId: clienti[0].id,
          categoryId: categorieDB[0].id,
          title: 'Perdita rubinetto cucina',
          description: 'Il rubinetto della cucina perde acqua continuamente',
          status: 'PENDING',
          priority: 'HIGH',
          address: clienti[0].address || 'Via Roma 1',
          city: clienti[0].city || 'Milano',
          province: clienti[0].province || 'MI',
          postalCode: clienti[0].postalCode || '20100',
          preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Domani
        },
        {
          id: uuidv4(),
          clientId: clienti.length > 1 ? clienti[1].id : clienti[0].id,
          categoryId: categorieDB.length > 1 ? categorieDB[1].id : categorieDB[0].id,
          title: 'Sostituzione interruttore',
          description: 'Interruttore camera da letto non funziona',
          status: 'PENDING',
          priority: 'MEDIUM',
          address: clienti.length > 1 ? clienti[1].address : 'Via Garibaldi 15',
          city: clienti.length > 1 ? clienti[1].city : 'Roma',
          province: clienti.length > 1 ? clienti[1].province : 'RM',
          postalCode: clienti.length > 1 ? clienti[1].postalCode : '00100',
          preferredDate: new Date(Date.now() + 48 * 60 * 60 * 1000) // Dopodomani
        }
      ]
      
      for (const req of requests) {
        try {
          await prisma.assistanceRequest.create({ data: req })
          console.log(`  ✅ Richiesta creata: ${req.title}`)
        } catch (error) {
          console.log(`  ⚠️  Errore richiesta: ${req.title}`)
        }
      }
    }
    
    // ==================== REPORT FINALE ====================
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT POPOLAMENTO DATABASE')
    console.log('='.repeat(60))
    
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      channels: await prisma.notificationChannel.count(),
      templates: await prisma.notificationTemplate.count()
    }
    
    console.log(`
✅ Utenti: ${counts.users}
   - Admin/Staff
   - Clienti  
   - Professionisti

✅ Categorie: ${counts.categories}
   - Idraulica, Elettricista, Climatizzazione, Pulizie, Traslochi

✅ Sottocategorie: ${counts.subcategories}
   - Dettagli specifici per ogni categoria

✅ Richieste esempio: ${counts.requests}

✅ Canali notifiche: ${counts.channels}
   - Email, WebSocket, SMS, Push

✅ Template notifiche: ${counts.templates}
   - AUTH, REQUEST, QUOTE, PAYMENT

🎉 DATABASE POPOLATO CON SUCCESSO!

Credenziali di accesso:
- Email: mario.rossi@email.it / Password: password123 (Cliente)
- Email: giuseppe.verdi@pro.it / Password: password123 (Professionista)
- Email: admin@sistema.it / Password: password123 (Staff)
`)
    
  } catch (error) {
    console.error('❌ Errore generale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
popolaDatabase()
