#!/bin/bash
# Script di backup per Health Check Fix - 10 Settembre 2025

BACKUP_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backups/2025-09-10-health-check"
mkdir -p "$BACKUP_DIR"

echo "🔄 Creazione backup Health Check System..."

# Frontend files
cp -r src/pages/admin/HealthCheckDashboard.tsx "$BACKUP_DIR/"
cp -r src/components/admin/health-check "$BACKUP_DIR/"
cp src/services/health.service.ts "$BACKUP_DIR/"
cp src/services/api.ts "$BACKUP_DIR/"

# Backend files
cp -r backend/src/services/healthCheck.service.ts "$BACKUP_DIR/"
cp -r backend/src/services/healthCheckExtensions.service.ts "$BACKUP_DIR/"
cp -r backend/src/routes/health.routes.ts "$BACKUP_DIR/"
cp -r backend/src/routes/admin/health-check.routes.ts "$BACKUP_DIR/"
cp -r backend/src/services/health-check-automation "$BACKUP_DIR/"

echo "✅ Backup completato in: $BACKUP_DIR"
echo "📋 Files salvati:"
ls -la "$BACKUP_DIR/"
