import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificaSistemaNotifiche() {
  console.log('\n🔍 VERIFICA COMPLETA SISTEMA NOTIFICHE\n')
  console.log('='.repeat(50))
  
  try {
    // 1. CANALI
    const channels = await prisma.notificationChannel.findMany()
    console.log(`\n📡 CANALI NOTIFICA: ${channels.length}`)
    
    if (channels.length > 0) {
      channels.forEach(ch => {
        const status = ch.isActive ? '✅ ATTIVO' : '❌ DISATTIVO'
        console.log(`   - ${ch.code} (${ch.type}) - ${status}`)
      })
    } else {
      console.log('   ❌ NESSUN CANALE TROVATO!')
    }
    
    // 2. NOTIFICATION QUEUE
    const queue = await prisma.notificationQueue.findMany()
    console.log(`\n📬 NOTIFICATION QUEUE: ${queue.length} entries`)
    
    if (queue.length > 0) {
      // Raggruppa per tipo
      const byType = queue.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`)
      })
    } else {
      console.log('   ❌ NESSUNA ENTRY NELLA QUEUE!')
    }
    
    // 3. VERIFICA MODELLI TEMPLATE (potrebbero non esistere)
    console.log('\n📝 VERIFICA MODELLI TEMPLATE:')
    
    // Lista tutti i modelli disponibili in Prisma
    const modelliDisponibili = Object.keys(prisma).filter(k => 
      !k.startsWith('_') && !k.startsWith('$') && typeof prisma[k] === 'object'
    )
    
    const modelliNotifiche = modelliDisponibili.filter(m => 
      m.toLowerCase().includes('notif') || m.toLowerCase().includes('template')
    )
    
    console.log('   Modelli notifiche trovati:')
    modelliNotifiche.forEach(m => console.log(`   - ${m}`))
    
    // 4. VERIFICA SE SERVONO TEMPLATE
    if (!modelliNotifiche.includes('notificationTemplate')) {
      console.log('\n⚠️  IL MODELLO NotificationTemplate NON ESISTE!')
      console.log('   Il sistema usa NotificationQueue per i template')
    }
    
    // 5. ATTIVAZIONE CANALI
    console.log('\n🔧 ATTIVAZIONE CANALI:')
    
    for (const channel of channels) {
      if (!channel.isActive) {
        await prisma.notificationChannel.update({
          where: { id: channel.id },
          data: { isActive: true }
        })
        console.log(`   ✅ Attivato: ${channel.code}`)
      }
    }
    
    // REPORT FINALE
    console.log('\n' + '='.repeat(50))
    console.log('📊 RIEPILOGO:')
    console.log('='.repeat(50))
    
    const attivi = channels.filter(c => c.isActive).length
    const totaleCanali = channels.length
    
    console.log(`
Canali totali: ${totaleCanali}
Canali attivi: ${attivi}
Template in queue: ${queue.length}
    
${queue.length > 0 ? '✅ SISTEMA NOTIFICHE CONFIGURATO' : '❌ MANCANO I TEMPLATE'}
`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificaSistemaNotifiche()
