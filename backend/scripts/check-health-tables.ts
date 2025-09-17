import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCreateTables() {
  console.log('🔍 Verifico e creo tabelle Health Check...\n');
  
  try {
    // Test HealthCheckResult
    try {
      const resultCount = await prisma.healthCheckResult.count();
      console.log(`✅ HealthCheckResult: ${resultCount} record esistenti`);
    } catch (error) {
      console.log('⚠️ HealthCheckResult non esiste, verrà creata con prisma db push');
    }
    
    // Test HealthCheckSummary
    try {
      const summaryCount = await prisma.healthCheckSummary.count();
      console.log(`✅ HealthCheckSummary: ${summaryCount} record esistenti`);
    } catch (error) {
      console.log('⚠️ HealthCheckSummary non esiste, verrà creata con prisma db push');
    }
    
    // Test PerformanceMetrics
    try {
      const metricsCount = await prisma.performanceMetrics.count();
      console.log(`✅ PerformanceMetrics: ${metricsCount} record esistenti`);
    } catch (error) {
      console.log('⚠️ PerformanceMetrics non esiste, verrà creata con prisma db push');
    }
    
    // Test AutoRemediationLog
    try {
      const remediationCount = await prisma.autoRemediationLog.count();
      console.log(`✅ AutoRemediationLog: ${remediationCount} record esistenti`);
    } catch (error) {
      console.log('⚠️ AutoRemediationLog non esiste, verrà creata con prisma db push');
    }
    
    console.log('\n📋 Stato tabelle verificato!');
    console.log('Esegui ora: npx prisma db push per creare le tabelle mancanti');
    
  } catch (error: any) {
    console.error('❌ Errore generale:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateTables();
