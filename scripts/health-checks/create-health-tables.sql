-- Health Check Database Tables
-- Crea le tabelle necessarie per il sistema di Health Check Automation

-- Health Check Results Table
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
);

-- Performance Metrics Table
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
);

-- Auto-Remediation Log Table
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
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS "HealthCheckResult_module_idx" ON "HealthCheckResult"("module");
CREATE INDEX IF NOT EXISTS "HealthCheckResult_timestamp_idx" ON "HealthCheckResult"("timestamp");
CREATE INDEX IF NOT EXISTS "HealthCheckResult_status_idx" ON "HealthCheckResult"("status");
CREATE INDEX IF NOT EXISTS "PerformanceMetrics_timestamp_idx" ON "PerformanceMetrics"("timestamp");
CREATE INDEX IF NOT EXISTS "AutoRemediationLog_module_idx" ON "AutoRemediationLog"("module");
CREATE INDEX IF NOT EXISTS "AutoRemediationLog_timestamp_idx" ON "AutoRemediationLog"("timestamp");

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
DROP TRIGGER IF EXISTS update_health_check_result_updated_at ON "HealthCheckResult";
CREATE TRIGGER update_health_check_result_updated_at 
    BEFORE UPDATE ON "HealthCheckResult" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_metrics_updated_at ON "PerformanceMetrics";
CREATE TRIGGER update_performance_metrics_updated_at 
    BEFORE UPDATE ON "PerformanceMetrics" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auto_remediation_log_updated_at ON "AutoRemediationLog";
CREATE TRIGGER update_auto_remediation_log_updated_at 
    BEFORE UPDATE ON "AutoRemediationLog" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();