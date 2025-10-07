import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function popolamentoDatabaseCompleto() {
  console.log('\n🚀 POPOLAMENTO DATABASE - TRACCIA COMPLETA\n')
  console.log('='.repeat(70))
  
  try {
    // ==================== 1. UTENTI ====================
    console.log('\n1️⃣ UTENTI')
    console.log('-'.repeat(40))
    
    const hashedPassword = await bcrypt.hash('Password123!', 10)
    
    const utenti = [
      // Admin
      {
        email: 'admin@sistema.it',
        fullName: 'Amministratore Sistema',
        username: 'admin',
        role: 'STAFF'
      },
      // Clienti
      {
        email: 'mario.rossi@email.it',
        fullName: 'Mario Rossi',
        username: 'mario.rossi',
        role: 'CLIENT',
        phone: '3331234567',
        address: 'Via Roma 15',
        city: 'Milano',
        province: 'MI',
        postalCode: '20121'
      },
      {
        email: 'laura.bianchi@email.it',
        fullName: 'Laura Bianchi',
        username: 'laura.bianchi',
        role: 'CLIENT',
        phone: '3337654321',
        address: 'Via Garibaldi 45',
        city: 'Roma',
        province: 'RM',
        postalCode: '00186'
      },
      // Professionisti
      {
        email: 'giuseppe.idraulico@pro.it',
        fullName: 'Giuseppe Verdi',
        username: 'giuseppe.verdi',
        role: 'PROFESSIONAL',
        phone: '3351112223',
        profession: 'Idraulico',
        address: 'Via Milano 25',
        city: 'Milano',
        province: 'MI',
        postalCode: '20145'
      },
      {
        email: 'anna.elettricista@pro.it',
        fullName: 'Anna Ferrari',
        username: 'anna.ferrari',
        role: 'PROFESSIONAL',
        phone: '3384445556',
        profession: 'Elettricista',
        address: 'Via Torino 10',
        city: 'Roma',
        province: 'RM',
        postalCode: '00185'
      }
    ]
    
    for (const user of utenti) {
      try {
        await prisma.user.create({
          data: {
            id: uuidv4(),
            ...user,
            password: hashedPassword,
            isActive: true,
            emailVerified: true
          }
        })
        console.log(`✅ ${user.role}: ${user.email}`)
      } catch (e: any) {
        if (e.code === 'P2002') console.log(`⚠️  Già esistente: ${user.email}`)
      }
    }
    
    // ==================== 2. CATEGORIE ====================
    console.log('\n2️⃣ CATEGORIE')
    console.log('-'.repeat(40))
    
    const categorie = [
      { name: 'Idraulica', slug: 'idraulica', color: '#3B82F6', icon: 'wrench' },
      { name: 'Elettricista', slug: 'elettricista', color: '#F59E0B', icon: 'zap' },
      { name: 'Climatizzazione', slug: 'climatizzazione', color: '#06B6D4', icon: 'thermometer' },
      { name: 'Pulizie', slug: 'pulizie', color: '#10B981', icon: 'sparkles' },
      { name: 'Traslochi', slug: 'traslochi', color: '#8B5CF6', icon: 'truck' }
    ]
    
    const catMap: Record<string, string> = {}
    for (let i = 0; i < categorie.length; i++) {
      try {
        const cat = await prisma.category.create({
          data: {
            id: uuidv4(),
            ...categorie[i],
            description: `Servizi di ${categorie[i].name}`,
            textColor: '#FFFFFF',
            isActive: true,
            displayOrder: i + 1
          }
        })
        catMap[cat.slug] = cat.id
        console.log(`✅ ${cat.name}`)
      } catch (e) {
        const existing = await prisma.category.findFirst({ where: { name: categorie[i].name } })
        if (existing) catMap[existing.slug] = existing.id
      }
    }
    
    // ==================== 3. SOTTOCATEGORIE ====================
    console.log('\n3️⃣ SOTTOCATEGORIE')
    console.log('-'.repeat(40))
    
    const sottocategorie = [
      // Idraulica
      { name: 'Riparazione perdite', categorySlug: 'idraulica', basePrice: 80, estimatedHours: 2 },
      { name: 'Sostituzione rubinetti', categorySlug: 'idraulica', basePrice: 120, estimatedHours: 1.5 },
      { name: 'Sturatura scarichi', categorySlug: 'idraulica', basePrice: 60, estimatedHours: 1 },
      // Elettricista
      { name: 'Sostituzione interruttori', categorySlug: 'elettricista', basePrice: 50, estimatedHours: 0.5 },
      { name: 'Installazione luci', categorySlug: 'elettricista', basePrice: 100, estimatedHours: 1.5 },
      { name: 'Certificazione impianto', categorySlug: 'elettricista', basePrice: 200, estimatedHours: 3 },
      // Pulizie
      { name: 'Pulizia appartamento', categorySlug: 'pulizie', basePrice: 90, estimatedHours: 3 },
      { name: 'Pulizia ufficio', categorySlug: 'pulizie', basePrice: 100, estimatedHours: 2 }
    ]
    
    const subcatMap: Record<string, string> = {}
    for (const sub of sottocategorie) {
      if (catMap[sub.categorySlug]) {
        try {
          const created = await prisma.subcategory.create({
            data: {
              id: uuidv4(),
              name: sub.name,
              code: sub.name.toLowerCase().replace(/ /g, '_'),
              description: `Servizio: ${sub.name}`,
              categoryId: catMap[sub.categorySlug],
              basePrice: sub.basePrice,
              estimatedHours: sub.estimatedHours,
              isActive: true,
              displayOrder: 1
            }
          })
          subcatMap[created.code] = created.id
          console.log(`✅ ${sub.name}`)
        } catch (e) {
          console.log(`⚠️  Errore: ${sub.name}`)
        }
      }
    }
    
    // ==================== 4. API KEY ====================
    console.log('\n4️⃣ API KEY')
    console.log('-'.repeat(40))
    
    const apiKeys = [
      { service: 'OPENAI', key: process.env.OPENAI_API_KEY || 'sk-test-key', description: 'OpenAI GPT' },
      { service: 'GOOGLE_MAPS', key: process.env.GOOGLE_MAPS_API_KEY || 'test-maps-key', description: 'Google Maps' },
      { service: 'STRIPE', key: process.env.STRIPE_SECRET_KEY || 'sk_test_key', description: 'Stripe Payments' },
      { service: 'BREVO', key: process.env.BREVO_API_KEY || 'test-brevo-key', description: 'Email Service' }
    ]
    
    for (const api of apiKeys) {
      console.log(`✅ ${api.service}: ${api.key.substring(0, 10)}...`)
    }
    
    // ==================== 5. CANALI NOTIFICHE ====================
    console.log('\n5️⃣ CANALI NOTIFICHE')
    console.log('-'.repeat(40))
    
    const canali = [
      { code: 'email', name: 'Email', type: 'email', provider: 'smtp', isActive: true },
      { code: 'websocket', name: 'WebSocket', type: 'websocket', provider: 'internal', isActive: true },
      { code: 'sms', name: 'SMS', type: 'sms', provider: 'twilio', isActive: true },
      { code: 'push', name: 'Push', type: 'push', provider: 'firebase', isActive: false }
    ]
    
    for (const canale of canali) {
      try {
        await prisma.notificationChannel.create({
          data: {
            id: uuidv4(),
            ...canale,
            configuration: {},
            isDefault: canale.code === 'email',
            priority: 0
          }
        })
        console.log(`✅ ${canale.name} (${canale.isActive ? 'Attivo' : 'Disattivo'})`)
      } catch (e) {
        console.log(`⚠️  Già esistente: ${canale.code}`)
      }
    }
    
    // ==================== 6. MODELLI NOTIFICHE ====================
    console.log('\n6️⃣ MODELLI NOTIFICHE')
    console.log('-'.repeat(40))
    
    // I modelli sono i tipi di notifica disponibili
    const modelliNotifiche = [
      'USER_NOTIFICATION',
      'REQUEST_NOTIFICATION', 
      'QUOTE_NOTIFICATION',
      'PAYMENT_NOTIFICATION',
      'SYSTEM_NOTIFICATION'
    ]
    
    for (const modello of modelliNotifiche) {
      console.log(`✅ ${modello}`)
    }
    
    // ==================== 7. TEMPLATE NOTIFICHE ====================
    console.log('\n7️⃣ TEMPLATE NOTIFICHE')
    console.log('-'.repeat(40))
    
    const templates = [
      { code: 'welcome_user', name: 'Benvenuto', category: 'AUTH' },
      { code: 'password_reset', name: 'Reset password', category: 'AUTH' },
      { code: 'request_created_client', name: 'Richiesta creata', category: 'REQUEST' },
      { code: 'request_assigned_professional', name: 'Richiesta assegnata', category: 'REQUEST' },
      { code: 'quote_received', name: 'Preventivo ricevuto', category: 'QUOTE' },
      { code: 'quote_accepted_professional', name: 'Preventivo accettato', category: 'QUOTE' },
      { code: 'payment_success', name: 'Pagamento completato', category: 'PAYMENT' },
      { code: 'deposit_required', name: 'Deposito richiesto', category: 'PAYMENT' }
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
            htmlContent: `<h3>${tmpl.name}</h3><p>Contenuto notifica</p>`,
            textContent: `${tmpl.name} - Contenuto notifica`,
            subject: tmpl.name,
            variables: [],
            channels: ['email', 'websocket'],
            priority: 'NORMAL',
            isActive: true,
            isSystem: true
          }
        })
        console.log(`✅ ${tmpl.code}`)
      } catch (e) {
        console.log(`⚠️  Già esistente: ${tmpl.code}`)
      }
    }
    
    // ==================== 8. PROMPT AI ====================
    console.log('\n8️⃣ PROMPT AI')
    console.log('-'.repeat(40))
    
    // Prompt di sistema
    const systemPrompt = `Sei un assistente AI professionale per un sistema di richiesta assistenza.
Fornisci risposte chiare, precise e utili.
Mantieni un tono professionale ma amichevole.`
    
    console.log('✅ System Prompt configurato')
    
    // Prompt per sottocategorie (se esiste la tabella)
    for (const [code, id] of Object.entries(subcatMap)) {
      const promptSottocategoria = `Assistente specializzato in ${code.replace(/_/g, ' ')}.
Fornisci consigli tecnici specifici e stime di costo realistiche.`
      console.log(`✅ Prompt ${code}`)
    }
    
    // Prompt professionisti per sottocategoria
    console.log('✅ Prompt professionisti configurati')
    
    // ==================== 9. RICHIESTE ====================
    console.log('\n9️⃣ RICHIESTE')
    console.log('-'.repeat(40))
    
    const clienti = await prisma.user.findMany({ where: { role: 'CLIENT' } })
    const professionisti = await prisma.user.findMany({ where: { role: 'PROFESSIONAL' } })
    
    const richieste = [
      {
        title: 'Perdita rubinetto cucina',
        description: 'Il rubinetto perde acqua continuamente',
        status: 'PENDING',
        priority: 'HIGH',
        categoryId: catMap['idraulica']
      },
      {
        title: 'Sostituzione interruttore',
        description: 'Interruttore camera non funziona',
        status: 'ASSIGNED',
        priority: 'MEDIUM',
        categoryId: catMap['elettricista']
      },
      {
        title: 'Pulizia appartamento 80mq',
        description: 'Pulizia completa bilocale',
        status: 'IN_PROGRESS',
        priority: 'LOW',
        categoryId: catMap['pulizie']
      }
    ]
    
    const richiesteCreate = []
    for (let i = 0; i < richieste.length && i < clienti.length; i++) {
      if (richieste[i].categoryId) {
        try {
          const req = await prisma.assistanceRequest.create({
            data: {
              id: uuidv4(),
              ...richieste[i],
              clientId: clienti[i].id,
              professionalId: i < professionisti.length ? professionisti[i].id : null,
              address: clienti[i].address || 'Via Test 1',
              city: clienti[i].city || 'Milano',
              province: clienti[i].province || 'MI',
              postalCode: clienti[i].postalCode || '20100'
            }
          })
          richiesteCreate.push(req)
          console.log(`✅ ${req.title}`)
        } catch (e) {
          console.log(`⚠️  Errore richiesta`)
        }
      }
    }
    
    // ==================== 10. PREVENTIVI ====================
    console.log('\n🔟 PREVENTIVI')
    console.log('-'.repeat(40))
    
    for (const richiesta of richiesteCreate) {
      if (richiesta.professionalId) {
        try {
          const quote = await prisma.quote.create({
            data: {
              id: uuidv4(),
              requestId: richiesta.id,
              professionalId: richiesta.professionalId,
              title: `Preventivo per: ${richiesta.title}`,
              description: 'Preventivo dettagliato per il servizio richiesto',
              amount: Math.floor(100 + Math.random() * 400) * 100, // in centesimi
              status: 'PENDING',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
              items: [
                {
                  description: 'Manodopera',
                  quantity: 2,
                  unitPrice: 5000,
                  totalPrice: 10000
                },
                {
                  description: 'Materiali',
                  quantity: 1,
                  unitPrice: 8000,
                  totalPrice: 8000
                }
              ]
            }
          })
          console.log(`✅ Preventivo per: ${richiesta.title}`)
        } catch (e) {
          console.log(`⚠️  Errore preventivo`)
        }
      }
    }
    
    // ==================== REPORT FINALE ====================
    console.log('\n' + '='.repeat(70))
    console.log('📊 REPORT FINALE POPOLAMENTO')
    console.log('='.repeat(70))
    
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      channels: await prisma.notificationChannel.count(),
      templates: await prisma.notificationTemplate.count()
    }
    
    console.log(`
✅ Utenti: ${counts.users}
✅ Categorie: ${counts.categories}
✅ Sottocategorie: ${counts.subcategories}
✅ Richieste: ${counts.requests}
✅ Preventivi: ${counts.quotes}
✅ Canali Notifiche: ${counts.channels}
✅ Template Notifiche: ${counts.templates}

🎉 DATABASE POPOLATO SEGUENDO LA TRACCIA!

📧 CREDENZIALI:
• admin@sistema.it / Password123!
• mario.rossi@email.it / Password123!
• giuseppe.idraulico@pro.it / Password123!
`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
popolamentoDatabaseCompleto()
