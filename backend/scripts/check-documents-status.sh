#!/bin/bash

echo "🔍 VERIFICA SISTEMA DOCUMENTI"
echo "============================"
echo ""

# Verifica che i documenti abbiano le versioni
echo "📄 Controllo documenti e versioni..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const docs = await prisma.legalDocument.findMany({
    include: {
      versions: true,
      typeConfig: true
    }
  });
  
  console.log('');
  console.log('Documenti nel sistema:');
  console.log('----------------------');
  
  docs.forEach(doc => {
    console.log('');
    console.log('📄 ' + doc.displayName);
    console.log('   Tipo: ' + (doc.typeConfig?.displayName || doc.type));
    console.log('   Versioni: ' + doc.versions.length);
    console.log('   Attivo: ' + (doc.isActive ? '✅' : '❌'));
    
    if (doc.versions.length > 0) {
      doc.versions.forEach(v => {
        console.log('     - v' + v.version + ' (' + v.status + ')');
      });
    } else {
      console.log('     ⚠️  Nessuna versione');
    }
  });
  
  await prisma.\$disconnect();
}

check().catch(console.error);
"

echo ""
echo "✅ Verifica completata!"
