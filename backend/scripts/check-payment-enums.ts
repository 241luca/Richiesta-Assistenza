/**
 * Script per verificare gli enum disponibili per Payment
 */

import { PrismaClient, PaymentType, PaymentStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEnums() {
  console.log('📋 Valori enum disponibili:\n');
  
  console.log('PaymentType:');
  console.log(Object.values(PaymentType || {}));
  
  console.log('\nPaymentStatus:');
  console.log(Object.values(PaymentStatus || {}));
  
  console.log('\nPaymentMethod:');
  console.log(Object.values(PaymentMethod || {}));
  
  // Verifica struttura Payment
  const samplePayment = await prisma.payment.findFirst();
  if (samplePayment) {
    console.log('\n📊 Struttura Payment esistente:');
    console.log(Object.keys(samplePayment));
  }
  
  await prisma.$disconnect();
}

checkEnums().catch(console.error);
