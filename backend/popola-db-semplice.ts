import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function popolaDatabaseSemplificato() {
  console.log('\n🚀 POPOLAMENTO DATABASE SEMPLIFICATO\n')
  console.log('='.repeat(60))
  
  try {
    // ==================== 1. UTENTI ====================
    console.log('\n1️⃣ CREAZIONE UTENTI DEMO...')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const users = [
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
      {
        id: uuidv4(),
        email: 'cliente@test.it',
        password: hashedPassword,
        fullName: 'Cliente Test',
        username: 'cliente.test',
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
        email: 'professionista@test.it',
        password: hashedPassword,
        fullName: 'Professionista Test',
        username: 'prof.test',
        role: 'PROFESSIONAL',
        phone: '3339876543',
        address: 'Via Milano 10',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        profession: 'Tecnico',
        isActive: true,
        emailVerified: true
      }
    ]
    
    for (const user of users) {
      try {
        await prisma.user.create({ data: user as any })
        console.log(`  ✅ ${user.role}: ${user.email}`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  Già esistente: ${user.email}`)
        }
      }
    }
    
    // ==================== 2. CATEGORIE ====================
    console.log('\n2️⃣ CREAZIONE CATEGORIE BASE...')
    
    const categories = [
      { 
        id: uuidv4(),
        name: 'Idraulica',
        slug: 'idraulica', // Uso slug invece di code
        description: 'Servizi idraulici',
        color: '#3B82F6',
        textColor: '#FFFFFF',
        icon: 'wrench',
        isActive: true,
        displayOrder: 1
      },
      { 
        id: uuidv4(),
        name: 'Elettricista',
        slug: 'elettricista',
        description: 'Servizi elettrici',
        color: '#F59E0B',
        textColor: '#FFFFFF',
        icon: 'zap',
        isActive: true,
        displayOrder: 2
      },
      { 
        id: uuidv4(),
        name: 'Pulizie',
        slug: 'pulizie',
        description: 'Servizi di pulizia',
        color: '#10B981',
        textColor: '#FFFFFF',
        icon: 'sparkles',
        isActive: true,
        displayOrder: 3
      }
    ]
    
    let createdCategories = []
    for (const cat of categories) {
      try {
        const created = await prisma.category.create({ data: cat })
        createdCategories.push(created)
        console.log(`  ✅ ${cat.name}`)
      } catch (error: any) {
        // Se già esiste, recuperalo
        const existing = await prisma.category.findFirst({ 
          where: { name: cat.name } 
        })
        if (existing) {
          createdCategories.push(existing)
          console.log(`  ⚠️  Già esistente: ${cat.name}`)
        }
      }
    }
    
    // ==================== 3. SOTTOCATEGORIE ====================
    if (createdCategories.length > 0) {
      console.log('\n3️⃣ CREAZIONE SOTTOCATEGORIE...')
      
      const subcategories = [
        { 
          name: 'Riparazione perdite',
          categoryId: createdCategories[0].id, // Idraulica
          description: 'Riparazione perdite acqua',
          estimatedHours: 2,
          basePrice: 80
        },
        { 
          name: 'Sostituzione rubinetti',
          categoryId: createdCategories[0].id, // Idraulica
          description: 'Sostituzione rubinetti',
          estimatedHours: 1,
          basePrice: 50
        },
        { 
          name: 'Sostituzione interruttori',
          categoryId: createdCategories[1]?.id || createdCategories[0].id, // Elettricista
          description: 'Sostituzione interruttori e prese',
          estimatedHours: 1,
          basePrice: 40
        },
        { 
          name: 'Pulizia appartamento',
          categoryId: createdCategories[2]?.id || createdCategories[0].id, // Pulizie
          description: 'Pulizia completa appartamento',
          estimatedHours: 3,
          basePrice: 90
        }
      ]
      
      for (const sub of subcategories) {
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
          console.log(`  ✅ ${sub.name}`)
        } catch (error) {
          console.log(`  ⚠️  Errore: ${sub.name}`)
        }
      }
    }
    
    // ==================== 4. CANALI NOTIFICHE ====================
    console.log('\n4️⃣ SETUP CANALI NOTIFICHE...')
    
    const existingChannels = await prisma.notificationChannel.count()
    if (existingChannels === 0) {
      const channels = [
        { code: 'email', name: 'Email', type: 'email', provider: 'smtp', isActive: true },
        { code: 'websocket', name: 'WebSocket', type: 'websocket', provider: 'internal', isActive: true },
        { code: 'sms', name: 'SMS', type: 'sms', provider: 'twilio', isActive: true }
      ]
      
      for (const channel of channels) {
        try {
          await prisma.notificationChannel.create({
            data: {
              id: uuidv4(),
              ...channel,
              configuration: {},
              isDefault: channel.code === 'email',
              priority: 0
            }
          })
          console.log(`  ✅ ${channel.name}`)
        } catch (error) {
          console.log(`  ⚠️  Già esistente: ${channel.code}`)
        }
      }
    } else {
      console.log(`  ℹ️  Canali già configurati: ${existingChannels}`)
    }
    
    // ==================== 5. TEMPLATE BASE ====================
    console.log('\n5️⃣ VERIFICA TEMPLATE...')
    
    const existingTemplates = await prisma.notificationTemplate.count()
    if (existingTemplates > 0) {
      console.log(`  ✅ Template già presenti: ${existingTemplates}`)
    } else {
      // Crea solo template base se non esistono
      const basicTemplates = [
        { code: 'welcome_user', name: 'Benvenuto', category: 'AUTH' },
        { code: 'request_created_client', name: 'Richiesta creata', category: 'REQUEST' },
        { code: 'quote_received', name: 'Preventivo ricevuto', category: 'QUOTE' }
      ]
      
      for (const tmpl of basicTemplates) {
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
              channels: ['email'],
              priority: 'NORMAL',
              isActive: true,
              isSystem: true
            }
          })
          console.log(`  ✅ ${tmpl.code}`)
        } catch (error) {
          console.log(`  ⚠️  Errore template`)
        }
      }
    }
    
    // ==================== 6. RICHIESTA DEMO ====================
    console.log('\n6️⃣ CREAZIONE RICHIESTA DEMO...')
    
    const cliente = await prisma.user.findFirst({ where: { role: 'CLIENT' } })
    const categoria = await prisma.category.findFirst()
    
    if (cliente && categoria) {
      try {
        await prisma.assistanceRequest.create({
          data: {
            id: uuidv4(),
            clientId: cliente.id,
            categoryId: categoria.id,
            title: 'Richiesta Demo',
            description: 'Questa è una richiesta di esempio per test',
            status: 'PENDING',
            priority: 'MEDIUM',
            address: cliente.address || 'Via Test 1',
            city: cliente.city || 'Milano',
            province: cliente.province || 'MI',
            postalCode: cliente.postalCode || '20100'
          }
        })
        console.log(`  ✅ Richiesta demo creata`)
      } catch (error) {
        console.log(`  ⚠️  Richiesta già esistente o errore`)
      }
    }
    
    // ==================== REPORT FINALE ====================
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT FINALE')
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
✅ Categorie: ${counts.categories}
✅ Sottocategorie: ${counts.subcategories}
✅ Richieste: ${counts.requests}
✅ Canali: ${counts.channels}
✅ Template: ${counts.templates}

🎉 DATABASE PRONTO!

📧 CREDENZIALI DI TEST:
• admin@sistema.it / password123 (Admin)
• cliente@test.it / password123 (Cliente)
• professionista@test.it / password123 (Professionista)
`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
popolaDatabaseSemplificato()
