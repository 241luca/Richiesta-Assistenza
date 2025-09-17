#!/bin/bash
# Backup dei file prima delle modifiche
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔄 Creazione backup dei file Health Check..."

# Backup HealthCheckCard.tsx
cp src/components/admin/health-check/HealthCheckCard.tsx \
   src/components/admin/health-check/HealthCheckCard.backup-${TIMESTAMP}.tsx

# Backup HealthCheckDashboard.tsx  
cp src/pages/admin/HealthCheckDashboard.tsx \
   src/pages/admin/HealthCheckDashboard.backup-${TIMESTAMP}.tsx

# Backup healthCheck.service.ts
cp backend/src/services/healthCheck.service.ts \
   backend/src/services/healthCheck.backup-${TIMESTAMP}.service.ts

# Backup ModuleDescriptions.tsx
cp src/components/admin/health-check/ModuleDescriptions.tsx \
   src/components/admin/health-check/ModuleDescriptions.backup-${TIMESTAMP}.tsx

echo "✅ Backup completati con timestamp: ${TIMESTAMP}"
echo ""
echo "File salvati:"
echo "- HealthCheckCard.backup-${TIMESTAMP}.tsx"
echo "- HealthCheckDashboard.backup-${TIMESTAMP}.tsx"
echo "- healthCheck.backup-${TIMESTAMP}.service.ts"
echo "- ModuleDescriptions.backup-${TIMESTAMP}.tsx"
