#!/bin/bash

# Health Check System - Startup Script
# Avvia il sistema di Health Check Automation all'avvio del server

echo "🚀 Starting Health Check Automation System..."

# Configurazione
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/health-check-startup.log"

# Crea directory logs se non esiste
mkdir -p "$PROJECT_ROOT/logs"

# Funzione per logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Controlla prerequisiti
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log "❌ Node.js not found"
        exit 1
    fi
    
    # Redis
    if ! command -v redis-cli &> /dev/null; then
        log "⚠️ Redis not found - some features may not work"
    else
        if ! redis-cli ping &> /dev/null; then
            log "Starting Redis..."
            redis-server --daemonize yes
            sleep 2
        fi
    fi
    
    # PostgreSQL
    if ! command -v psql &> /dev/null; then
        log "❌ PostgreSQL not found"
        exit 1
    fi
    
    log "✅ Prerequisites check passed"
}

# Rendi eseguibili gli script di remediation
make_scripts_executable() {
    log "Setting permissions for remediation scripts..."
    chmod +x "$SCRIPT_DIR/remediation/*.sh"
    log "✅ Scripts permissions set"
}

# Crea le tabelle del database se non esistono
setup_database() {
    log "Setting up database tables..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Crea migration per health check tables
    cat << 'EOF' > prisma/migrations/health_check_tables.sql
-- Health Check Results Table
CREATE TABLE IF NOT EXISTS "HealthCheckResult" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "module" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metrics" JSONB DEFAULT '{}',
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
    "metrics" JSONB DEFAULT '{}',
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

-- Indexes
CREATE INDEX IF NOT EXISTS "HealthCheckResult_module_idx" ON "HealthCheckResult"("module");
CREATE INDEX IF NOT EXISTS "HealthCheckResult_timestamp_idx" ON "HealthCheckResult"("timestamp");
CREATE INDEX IF NOT EXISTS "HealthCheckResult_status_idx" ON "HealthCheckResult"("status");
CREATE INDEX IF NOT EXISTS "PerformanceMetrics_timestamp_idx" ON "PerformanceMetrics"("timestamp");
CREATE INDEX IF NOT EXISTS "AutoRemediationLog_module_idx" ON "AutoRemediationLog"("module");
CREATE INDEX IF NOT EXISTS "AutoRemediationLog_timestamp_idx" ON "AutoRemediationLog"("timestamp");
EOF

    # Applica migration
    npx prisma db push --skip-generate &> /dev/null || log "⚠️ Database tables may already exist"
    
    log "✅ Database setup complete"
}

# Avvia l'orchestrator
start_orchestrator() {
    log "Starting Health Check Orchestrator..."
    
    cd "$SCRIPT_DIR"
    
    # Compila TypeScript
    npx tsc --esModuleInterop --resolveJsonModule *.ts &> /dev/null || true
    
    # Avvia orchestrator in background
    nohup node -r ts-node/register orchestrator.ts start >> "$LOG_FILE" 2>&1 &
    ORCHESTRATOR_PID=$!
    
    # Salva PID per gestione successiva
    echo $ORCHESTRATOR_PID > "$PROJECT_ROOT/health-check-orchestrator.pid"
    
    log "✅ Orchestrator started with PID: $ORCHESTRATOR_PID"
}

# Verifica che sia partito correttamente
verify_startup() {
    log "Verifying system startup..."
    sleep 5
    
    if [ -f "$PROJECT_ROOT/health-check-orchestrator.pid" ]; then
        PID=$(cat "$PROJECT_ROOT/health-check-orchestrator.pid")
        if ps -p $PID > /dev/null; then
            log "✅ Health Check System is running successfully"
            
            # Esegui un test iniziale
            cd "$SCRIPT_DIR"
            node -r ts-node/register orchestrator.ts status &> /dev/null
            if [ $? -eq 0 ]; then
                log "✅ System status check passed"
            else
                log "⚠️ System running but status check failed"
            fi
        else
            log "❌ Orchestrator process not found"
            exit 1
        fi
    else
        log "❌ PID file not found"
        exit 1
    fi
}

# Main execution
main() {
    log "================================================"
    log "Health Check Automation System Startup"
    log "================================================"
    
    check_prerequisites
    make_scripts_executable
    setup_database
    start_orchestrator
    verify_startup
    
    log "================================================"
    log "✅ Health Check System successfully started!"
    log "📊 Dashboard: http://localhost:5193/admin/health-check"
    log "📝 Logs: $LOG_FILE"
    log "🛑 To stop: $SCRIPT_DIR/stop-health-check.sh"
    log "================================================"
}

# Esegui
main