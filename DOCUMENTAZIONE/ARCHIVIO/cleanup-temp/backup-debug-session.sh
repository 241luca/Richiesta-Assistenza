#!/bin/bash
# Backup script per sessione debug - 03/09/2025

echo "📁 Creazione backup per sessione debug..."

# Backup del service di backup
cp backend/src/services/simple-backup.service.ts backend/src/services/simple-backup.service.backup-$(date +%Y%m%d-%H%M%S).ts

# Backup delle routes di backup  
cp backend/src/routes/simple-backup.routes.ts backend/src/routes/simple-backup.routes.backup-$(date +%Y%m%d-%H%M%S).ts

# Backup del middleware auth
cp backend/src/middleware/auth.ts backend/src/middleware/auth.backup-$(date +%Y%m%d-%H%M%S).ts

# Backup delle routes pricing
cp backend/src/routes/professionalPricing.routes.ts backend/src/routes/professionalPricing.routes.backup-$(date +%Y%m%d-%H%M%S).ts

echo "✅ Backup completato!"
echo "📝 File salvati con timestamp: $(date +%Y%m%d-%H%M%S)"
