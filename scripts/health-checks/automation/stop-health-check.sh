#!/bin/bash

# Health Check System - Stop Script
# Ferma il sistema di Health Check Automation

echo "⏹️ Stopping Health Check Automation System..."

# Configurazione
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PID_FILE="$PROJECT_ROOT/health-check-orchestrator.pid"

# Funzione per logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ferma orchestrator
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    
    if ps -p $PID > /dev/null; then
        log "Stopping orchestrator (PID: $PID)..."
        kill -TERM $PID
        sleep 2
        
        # Force kill se ancora attivo
        if ps -p $PID > /dev/null; then
            log "Force stopping..."
            kill -9 $PID
        fi
        
        rm -f "$PID_FILE"
        log "✅ Orchestrator stopped"
    else
        log "⚠️ Orchestrator not running (stale PID file)"
        rm -f "$PID_FILE"
    fi
else
    log "⚠️ PID file not found - orchestrator may not be running"
fi

log "✅ Health Check System stopped"