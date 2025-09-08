#!/bin/bash

echo "🔍 VERIFICA RELAZIONI PRISMA"
echo "============================"

cd backend

echo "Mostra le relazioni nel modello AssistanceRequest:"
echo "---------------------------------------------------"

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRelations() {
  try {
    // Prova a fare una query con tutti i possibili include
    const testQuery = await prisma.assistanceRequest.findFirst({
      include: {
        User_AssistanceRequest_clientIdToUser: true,
        User_AssistanceRequest_professionalIdToUser: true,
        Category: true,
        Subcategory: true,
        Quote: true,
        RequestAttachment: true,
        RequestChatMessage: true,
      }
    })
    
    console.log('✅ Relazioni disponibili per AssistanceRequest:')
    console.log('- User_AssistanceRequest_clientIdToUser (client)')
    console.log('- User_AssistanceRequest_professionalIdToUser (professional)')
    console.log('- Category')
    console.log('- Subcategory')
    console.log('- Quote')
    console.log('- RequestAttachment')
    console.log('- RequestChatMessage')
    
  } catch (error) {
    console.error('Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRelations()
EOF
