import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificaDatabase() {
  console.log('\n🔍 VERIFICA COMPLETA DATABASE\n')
  
  try {
    // Verifica cosa esiste
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count(),
      channels: await prisma.notificationChannel.count(),
      aiSettings: await prisma.subcategoryAiSettings.count()
    }
    
    console.log('📊 CONTENUTO DATABASE:')
    console.log('='.repeat(50))
    
    for (const [key, value] of Object.entries(counts)) {
      const status = value > 0 ? '✅' : '❌'
      console.log(`${status} ${key}: ${value}`)
    }
    
    console.log('='.repeat(50))
    
    // Dettagli se mancano dati critici
    if (counts.subcategories === 0) {
      console.log('\n❌ MANCANO LE SOTTOCATEGORIE!')
      console.log('   Esegui: npx prisma db seed')
    }
    
    if (counts.requests === 0) {
      console.log('\n❌ MANCANO LE RICHIESTE!')
      console.log('   Esegui: npx tsx popolamento-finale-professionale.ts')
    }
    
    if (counts.quotes === 0) {
      console.log('\n❌ MANCANO I PREVENTIVI!')
    }
    
    // Verifica modelli notifiche (potrebbero non esistere)
    try {
      // @ts-ignore
      if (prisma.notificationType) {
        // @ts-ignore
        const notifTypes = await prisma.notificationType.count()
        console.log(`\n📧 Tipi notifiche: ${notifTypes}`)
      } else {
        console.log('\n⚠️ Modello NotificationType non trovato')
      }
    } catch (e) {
      console.log('\n⚠️ Sistema notifiche non configurato')
    }
    
    // Mostra alcuni dati di esempio
    if (counts.users > 0) {
      const users = await prisma.user.findMany({ take: 3 })
      console.log('\n👥 Primi 3 utenti:')
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    }
    
    if (counts.categories > 0) {
      const cats = await prisma.category.findMany({ take: 5 })
      console.log('\n📂 Categorie:')
      cats.forEach(c => console.log(`   - ${c.name}`))
    }
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificaDatabase()
