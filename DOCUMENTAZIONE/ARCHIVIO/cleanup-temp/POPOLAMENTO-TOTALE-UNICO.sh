#!/bin/bash

echo "🚨 POPOLAMENTO TOTALE DATABASE - SCRIPT UNICO 🚨"
echo "================================================"

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function popolaTutto() {
  console.log('\n🚀 POPOLAMENTO TOTALE DATABASE\n')
  
  try {
    // CATEGORIE
    console.log('📂 Creazione categorie...')
    
    const cats = [
      { name: 'Idraulica', slug: 'idraulica', color: '#3B82F6' },
      { name: 'Elettricità', slug: 'elettricita', color: '#EF4444' },
      { name: 'Climatizzazione', slug: 'climatizzazione', color: '#10B981' },
      { name: 'Edilizia', slug: 'edilizia', color: '#F59E0B' },
      { name: 'Falegnameria', slug: 'falegnameria', color: '#8B5CF6' }
    ]
    
    for (const cat of cats) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          id: uuidv4(),
          ...cat,
          isActive: true,
          displayOrder: 0,
          updatedAt: new Date()
        }
      })
    }
    
    const categorie = await prisma.category.findMany()
    console.log('✅ Categorie create:', categorie.length)
    
    // RICHIESTE
    console.log('\n📋 Creazione richieste...')
    
    const users = await prisma.user.findMany()
    const clients = users.filter(u => u.role === 'CLIENT')
    const profs = users.filter(u => u.role === 'PROFESSIONAL')
    
    if (clients.length > 0 && categorie.length > 0) {
      for (let i = 0; i < 20; i++) {
        const client = clients[Math.floor(Math.random() * clients.length)]
        const cat = categorie[Math.floor(Math.random() * categorie.length)]
        const prof = profs.length > 0 ? profs[Math.floor(Math.random() * profs.length)] : null
        
        const req = await prisma.assistanceRequest.create({
          data: {
            id: uuidv4(),
            title: `Richiesta ${i + 1}`,
            description: 'Descrizione problema',
            address: 'Via Roma ' + (i + 1),
            city: ['Roma', 'Milano', 'Napoli'][i % 3],
            province: ['RM', 'MI', 'NA'][i % 3],
            postalCode: ['00100', '20100', '80100'][i % 3],
            priority: 'MEDIUM',
            status: prof ? 'ASSIGNED' : 'PENDING',
            clientId: client.id,
            categoryId: cat.id,
            professionalId: prof?.id,
            updatedAt: new Date()
          }
        })
        
        // Preventivo
        if (prof) {
          await prisma.quote.create({
            data: {
              id: uuidv4(),
              requestId: req.id,
              professionalId: prof.id,
              title: 'Preventivo',
              amount: 20000 + (i * 1000),
              status: 'PENDING',
              updatedAt: new Date()
            }
          })
        }
      }
    }
    
    // API KEYS
    console.log('\n🔑 API Keys...')
    
    await prisma.apiKey.upsert({
      where: { service: 'google-maps' },
      update: {},
      create: {
        id: uuidv4(),
        service: 'google-maps',
        key: 'AIzaSyB7zix_8OrL9ks3d6XcjHShHIQDDhI1lCI',
        name: 'Google Maps',
        isActive: true,
        updatedAt: new Date()
      }
    })
    
    // REPORT
    const totals = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      apiKeys: await prisma.apiKey.count()
    }
    
    console.log('\n📊 TOTALI:')
    console.log('Utenti:', totals.users)
    console.log('Categorie:', totals.categories)
    console.log('Richieste:', totals.requests)
    console.log('Preventivi:', totals.quotes)
    console.log('API Keys:', totals.apiKeys)
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  }
  
  await prisma.$disconnect()
}

popolaTutto()
EOF

echo "✅ Completato!"
