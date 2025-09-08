/**
 * Script per creare le tabelle del sistema Health Check
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createHealthCheckTables() {
  console.log('🔧 Creazione tabelle Health Check...');

  try {
    // Crea la tabella HealthCheckResult
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "HealthCheckResult" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "module" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "score" INTEGER NOT NULL,
        "checks" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "metrics" JSONB DEFAULT '{}'::jsonb,
        "executionTime" INTEGER NOT NULL DEFAULT 0,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabella HealthCheckResult creata');

    // Crea la tabella PerformanceMetrics
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PerformanceMetrics" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "cpuUsage" INTEGER NOT NULL,
        "memoryUsage" INTEGER NOT NULL,
        "databaseConnections" INTEGER NOT NULL,
        "apiResponseTime" INTEGER NOT NULL,
        "requestsPerMinute" INTEGER NOT NULL,
        "errorRate" DOUBLE PRECISION NOT NULL,
        "metrics" JSONB DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabella PerformanceMetrics creata');

    // Crea la tabella AutoRemediationLog
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AutoRemediationLog" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "ruleId" TEXT NOT NULL,
        "module" TEXT NOT NULL,
        "success" BOOLEAN NOT NULL,
        "actionsExecuted" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "error" TEXT,
        "healthScoreBefore" INTEGER NOT NULL,
        "healthScoreAfter" INTEGER,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabella AutoRemediationLog creata');

    // Crea gli indici
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "HealthCheckResult_module_idx" ON "HealthCheckResult"("module")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "HealthCheckResult_timestamp_idx" ON "HealthCheckResult"("timestamp")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "HealthCheckResult_status_idx" ON "HealthCheckResult"("status")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "PerformanceMetrics_timestamp_idx" ON "PerformanceMetrics"("timestamp")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "AutoRemediationLog_module_idx" ON "AutoRemediationLog"("module")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "AutoRemediationLog_timestamp_idx" ON "AutoRemediationLog"("timestamp")
    `;
    console.log('✅ Indici creati');

    // Crea la funzione per aggiornare updatedAt
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    console.log('✅ Funzione trigger creata');

    // Crea i trigger per updatedAt
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_health_check_result_updated_at ON "HealthCheckResult"
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER update_health_check_result_updated_at 
      BEFORE UPDATE ON "HealthCheckResult" 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column()
    `;

    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_performance_metrics_updated_at ON "PerformanceMetrics"
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER update_performance_metrics_updated_at 
      BEFORE UPDATE ON "PerformanceMetrics" 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column()
    `;

    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_auto_remediation_log_updated_at ON "AutoRemediationLog"
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER update_auto_remediation_log_updated_at 
      BEFORE UPDATE ON "AutoRemediationLog" 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column()
    `;
    console.log('✅ Trigger creati');

    console.log('\n🎉 Tutte le tabelle Health Check sono state create con successo!');
    
  } catch (error) {
    console.error('❌ Errore nella creazione delle tabelle:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createHealthCheckTables()
  .then(() => {
    console.log('✅ Script completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script fallito:', error);
    process.exit(1);
  });