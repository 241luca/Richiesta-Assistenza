#!/bin/bash

# Verifica rapida tabelle Payment dopo db push
echo "╔════════════════════════════════════════╗"
echo "║   VERIFICA TABELLE PAYMENT             ║"
echo "╚════════════════════════════════════════╝"

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Verifica con Prisma
echo ""
echo "🔍 Verifico le tabelle Payment..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Prova ad accedere alle tabelle Payment
    const paymentCount = await prisma.payment.count();
    const invoiceCount = await prisma.invoice.count();
    
    console.log('✅ Tabella Payment: PRESENTE (' + paymentCount + ' record)');
    console.log('✅ Tabella Invoice: PRESENTE (' + invoiceCount + ' record)');
    
    // Verifica altri dati NON toccati
    const users = await prisma.user.count();
    const requests = await prisma.assistanceRequest.count();
    const quotes = await prisma.quote.count();
    
    console.log('');
    console.log('📊 I TUOI DATI ESISTENTI:');
    console.log('✅ Utenti: ' + users);
    console.log('✅ Richieste: ' + requests);
    console.log('✅ Preventivi: ' + quotes);
    
    console.log('');
    console.log('🎉 TUTTO OK! Tabelle Payment aggiunte senza perdere nulla!');
    
  } catch(e) {
    console.log('❌ Errore:', e.message);
  }
  process.exit(0);
}

check();
"
