import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function popolamentoRealistico() {
  console.log('\n🚀 POPOLAMENTO DATABASE REALISTICO COMPLETO\n')
  console.log('='.repeat(70))
  
  try {
    // ==================== 1. UTENTI (dalla login page) ====================
    console.log('\n1️⃣ CREAZIONE UTENTI')
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Mappa per salvare gli ID degli utenti creati
    const userIds: Record<string, string> = {}
    
    const utenti = [
      { email: 'admin@assistenza.it', fullName: 'Super Admin', role: 'SUPER_ADMIN' },
      { email: 'staff@assistenza.it', fullName: 'Staff Assistenza', role: 'ADMIN' },
      { email: 'luigi.bianchi@gmail.com', fullName: 'Luigi Bianchi', role: 'CLIENT', city: 'Napoli', province: 'NA' },
      { email: 'maria.rossi@hotmail.it', fullName: 'Maria Rossi', role: 'CLIENT', city: 'Roma', province: 'RM' },
      { email: 'giuseppe.verdi@libero.it', fullName: 'Giuseppe Verdi', role: 'CLIENT', city: 'Torino', province: 'TO' },
      { email: 'anna.ferrari@outlook.it', fullName: 'Anna Ferrari', role: 'CLIENT', city: 'Bologna', province: 'BO' },
      { email: 'mario.rossi@assistenza.it', fullName: 'Mario Rossi', role: 'PROFESSIONAL', profession: 'Idraulico', city: 'Roma' },
      { email: 'francesco.russo@assistenza.it', fullName: 'Francesco Russo', role: 'PROFESSIONAL', profession: 'Elettricista', city: 'Milano' },
      { email: 'paolo.costa@assistenza.it', fullName: 'Paolo Costa', role: 'PROFESSIONAL', profession: 'Climatizzazione', city: 'Napoli' },
      { email: 'luca.moretti@assistenza.it', fullName: 'Luca Moretti', role: 'PROFESSIONAL', profession: 'Pulizie', city: 'Torino' }
    ]
    
    for (const user of utenti) {
      const created = await prisma.user.upsert({
        where: { email: user.email },
        update: { password: hashedPassword },
        create: {
          id: uuidv4(),
          email: user.email,
          password: hashedPassword,
          fullName: user.fullName,
          username: user.email.split('@')[0],
          role: user.role as any,
          phone: '333' + Math.floor(Math.random() * 10000000),
          address: 'Via ' + (user.city || 'Roma') + ' ' + Math.floor(Math.random() * 100),
          city: user.city || 'Roma',
          province: user.province || 'RM',
          postalCode: Math.floor(10000 + Math.random() * 90000).toString(),
          profession: user.profession,
          isActive: true,
          emailVerified: true
        }
      })
      userIds[user.email] = created.id
      console.log(`✅ ${user.role}: ${user.email}`)
    }
    
    // ==================== 2. CATEGORIE ====================
    console.log('\n2️⃣ CATEGORIE SERVIZI')
    const catIds: Record<string, string> = {}
    
    const categorie = [
      { name: 'Idraulica', slug: 'idraulica', color: '#3B82F6', icon: 'wrench' },
      { name: 'Elettricista', slug: 'elettricista', color: '#F59E0B', icon: 'zap' },
      { name: 'Climatizzazione', slug: 'climatizzazione', color: '#06B6D4', icon: 'thermometer' },
      { name: 'Pulizie', slug: 'pulizie', color: '#10B981', icon: 'sparkles' },
      { name: 'Traslochi', slug: 'traslochi', color: '#8B5CF6', icon: 'truck' },
      { name: 'Giardinaggio', slug: 'giardinaggio', color: '#84CC16', icon: 'leaf' }
    ]
    
    for (const cat of categorie) {
      const created = await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: {
          id: uuidv4(),
          ...cat,
          description: `Servizi professionali di ${cat.name.toLowerCase()}`,
          textColor: '#FFFFFF',
          isActive: true,
          displayOrder: 1
        }
      })
      catIds[cat.slug] = created.id
      console.log(`✅ ${cat.name}`)
    }
    
    // ==================== 3. SOTTOCATEGORIE ====================
    console.log('\n3️⃣ SOTTOCATEGORIE')
    const sottocategorie = [
      // Idraulica
      { name: 'Riparazione perdite acqua', categoryId: catIds.idraulica, basePrice: 80, estimatedHours: 2 },
      { name: 'Sostituzione rubinetto', categoryId: catIds.idraulica, basePrice: 120, estimatedHours: 1.5 },
      { name: 'Sturatura scarico', categoryId: catIds.idraulica, basePrice: 60, estimatedHours: 1 },
      { name: 'Installazione scaldabagno', categoryId: catIds.idraulica, basePrice: 250, estimatedHours: 3 },
      // Elettricista
      { name: 'Sostituzione interruttore', categoryId: catIds.elettricista, basePrice: 50, estimatedHours: 0.5 },
      { name: 'Installazione lampadario', categoryId: catIds.elettricista, basePrice: 80, estimatedHours: 1 },
      { name: 'Riparazione corto circuito', categoryId: catIds.elettricista, basePrice: 150, estimatedHours: 2 },
      { name: 'Certificazione impianto', categoryId: catIds.elettricista, basePrice: 200, estimatedHours: 3 },
      // Climatizzazione
      { name: 'Installazione condizionatore', categoryId: catIds.climatizzazione, basePrice: 400, estimatedHours: 4 },
      { name: 'Manutenzione caldaia', categoryId: catIds.climatizzazione, basePrice: 100, estimatedHours: 1.5 },
      { name: 'Riparazione climatizzatore', categoryId: catIds.climatizzazione, basePrice: 150, estimatedHours: 2 },
      // Pulizie
      { name: 'Pulizia appartamento', categoryId: catIds.pulizie, basePrice: 80, estimatedHours: 3 },
      { name: 'Pulizia ufficio', categoryId: catIds.pulizie, basePrice: 100, estimatedHours: 2 },
      { name: 'Pulizia post cantiere', categoryId: catIds.pulizie, basePrice: 200, estimatedHours: 5 }
    ]
    
    const subcatIds: Record<string, string> = {}
    for (const sub of sottocategorie) {
      try {
        const created = await prisma.subcategory.create({
          data: {
            id: uuidv4(),
            name: sub.name,
            code: sub.name.toLowerCase().replace(/ /g, '_'),
            description: `Servizio di ${sub.name.toLowerCase()}`,
            categoryId: sub.categoryId,
            basePrice: sub.basePrice,
            estimatedHours: sub.estimatedHours,
            isActive: true,
            displayOrder: 1
          }
        })
        subcatIds[sub.name] = created.id
        console.log(`✅ ${sub.name}`)
      } catch (e) {
        // Ignora se esiste già
      }
    }
    
    // ==================== 4. RICHIESTE REALISTICHE ====================
    console.log('\n4️⃣ RICHIESTE ASSISTENZA')
    const richieste = [
      {
        clientId: userIds['luigi.bianchi@gmail.com'],
        professionalId: userIds['mario.rossi@assistenza.it'],
        categoryId: catIds.idraulica,
        subcategoryId: subcatIds['Riparazione perdite acqua'],
        title: 'Perdita urgente bagno',
        description: 'Ho una perdita sotto il lavandino del bagno, gocciola continuamente e ho dovuto mettere un secchio. Serve intervento urgente.',
        status: 'PENDING',
        priority: 'HIGH',
        address: 'Via Napoli 45',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80100'
      },
      {
        clientId: userIds['maria.rossi@hotmail.it'],
        professionalId: userIds['francesco.russo@assistenza.it'],
        categoryId: catIds.elettricista,
        subcategoryId: subcatIds['Sostituzione interruttore'],
        title: 'Interruttore camera difettoso',
        description: 'L\'interruttore della camera da letto fa scintille quando lo accendo. Per sicurezza non lo uso più.',
        status: 'ASSIGNED',
        priority: 'MEDIUM',
        address: 'Via Roma 123',
        city: 'Roma',
        province: 'RM',
        postalCode: '00185'
      },
      {
        clientId: userIds['giuseppe.verdi@libero.it'],
        professionalId: userIds['paolo.costa@assistenza.it'],
        categoryId: catIds.climatizzazione,
        subcategoryId: subcatIds['Manutenzione caldaia'],
        title: 'Caldaia in blocco E03',
        description: 'La caldaia non parte, display mostra errore E03. Non esce acqua calda da 2 giorni.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        address: 'Corso Torino 78',
        city: 'Torino',
        province: 'TO',
        postalCode: '10100'
      },
      {
        clientId: userIds['anna.ferrari@outlook.it'],
        professionalId: userIds['luca.moretti@assistenza.it'],
        categoryId: catIds.pulizie,
        subcategoryId: subcatIds['Pulizia appartamento'],
        title: 'Pulizia profonda bilocale',
        description: 'Necessito pulizia profonda appartamento 80mq dopo ristrutturazione. Molta polvere e residui.',
        status: 'PENDING',
        priority: 'LOW',
        address: 'Via Bologna 56',
        city: 'Bologna',
        province: 'BO',
        postalCode: '40100'
      }
    ]
    
    const richiesteIds: string[] = []
    for (const req of richieste) {
      try {
        const created = await prisma.assistanceRequest.create({
          data: {
            id: uuidv4(),
            ...req,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Ultima settimana
          }
        })
        richiesteIds.push(created.id)
        console.log(`✅ ${req.title}`)
      } catch (e) {
        console.log(`⚠️  Errore richiesta: ${req.title}`)
      }
    }
    
    // ==================== 5. PREVENTIVI REALISTICI ====================
    console.log('\n5️⃣ PREVENTIVI')
    const preventivi = [
      {
        requestId: richiesteIds[0],
        professionalId: userIds['mario.rossi@assistenza.it'],
        title: 'Preventivo riparazione perdita',
        description: 'Riparazione perdita sotto lavandino con sostituzione guarnizioni',
        amount: 12000, // €120 in centesimi
        items: [
          { description: 'Manodopera (2 ore)', quantity: 2, unitPrice: 4000, totalPrice: 8000 },
          { description: 'Guarnizioni e materiale', quantity: 1, unitPrice: 2000, totalPrice: 2000 },
          { description: 'Diritto di chiamata', quantity: 1, unitPrice: 2000, totalPrice: 2000 }
        ]
      },
      {
        requestId: richiesteIds[1],
        professionalId: userIds['francesco.russo@assistenza.it'],
        title: 'Preventivo sostituzione interruttore',
        description: 'Sostituzione interruttore camera con modello certificato',
        amount: 7500, // €75
        items: [
          { description: 'Interruttore Bticino', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
          { description: 'Manodopera (1 ora)', quantity: 1, unitPrice: 4500, totalPrice: 4500 },
          { description: 'Trasporto', quantity: 1, unitPrice: 500, totalPrice: 500 }
        ]
      },
      {
        requestId: richiesteIds[2],
        professionalId: userIds['paolo.costa@assistenza.it'],
        title: 'Preventivo riparazione caldaia',
        description: 'Diagnostica e riparazione errore E03 caldaia',
        amount: 18000, // €180
        items: [
          { description: 'Diagnostica guasto', quantity: 1, unitPrice: 5000, totalPrice: 5000 },
          { description: 'Scheda elettronica', quantity: 1, unitPrice: 8000, totalPrice: 8000 },
          { description: 'Manodopera (2 ore)', quantity: 2, unitPrice: 2500, totalPrice: 5000 }
        ]
      }
    ]
    
    for (const prev of preventivi) {
      if (prev.requestId) {
        try {
          await prisma.quote.create({
            data: {
              id: uuidv4(),
              requestId: prev.requestId,
              professionalId: prev.professionalId,
              title: prev.title,
              description: prev.description,
              amount: prev.amount,
              status: 'PENDING',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              items: prev.items,
              createdAt: new Date()
            }
          })
          console.log(`✅ ${prev.title}: €${prev.amount/100}`)
        } catch (e) {
          console.log(`⚠️  Errore preventivo`)
        }
      }
    }
    
    // ==================== REPORT FINALE ====================
    console.log('\n' + '='.repeat(70))
    console.log('📊 DATABASE POPOLATO CON DATI REALISTICI')
    console.log('='.repeat(70))
    
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count()
    }
    
    console.log(`
✅ Utenti: ${counts.users} (dalla login page)
✅ Categorie: ${counts.categories}
✅ Sottocategorie: ${counts.subcategories}
✅ Richieste: ${counts.requests} (con dati realistici)
✅ Preventivi: ${counts.quotes} (con prezzi reali)

📋 ESEMPI RICHIESTE:
• Perdita urgente bagno (Napoli)
• Interruttore difettoso (Roma)
• Caldaia in blocco (Torino)
• Pulizia post cantiere (Bologna)

💰 ESEMPI PREVENTIVI:
• Riparazione perdita: €120
• Sostituzione interruttore: €75
• Riparazione caldaia: €180

✅ TUTTO PRONTO CON DATI REALISTICI!
`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
popolamentoRealistico()
