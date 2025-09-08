#!/bin/bash

TIMESTAMP="20250829-060256"
echo "🔧 BACKUP FILES PER CORREZIONE RESPONSEFORMATTER"
echo "Timestamp: $TIMESTAMP"
echo ""

# ROUTES da correggere
echo "📁 Backup ROUTES..."
cp backend/src/routes/geocoding.routes.ts backend/src/routes/geocoding.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/payment.routes.ts backend/src/routes/payment.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/maps.routes.ts backend/src/routes/maps.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/user.routes.ts backend/src/routes/user.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/attachment.routes.ts backend/src/routes/attachment.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/apiKeys.routes.ts backend/src/routes/apiKeys.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/maps-simple.routes.ts backend/src/routes/maps-simple.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/subcategory.routes.ts backend/src/routes/subcategory.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/category.routes.ts backend/src/routes/category.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/notification.routes.ts backend/src/routes/notification.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/public.routes.ts backend/src/routes/public.routes.backup-$TIMESTAMP.ts
cp backend/src/routes/auth.routes.ts backend/src/routes/auth.routes.backup-$TIMESTAMP.ts

# SERVICES da correggere
echo "📁 Backup SERVICES..."
cp backend/src/services/pdf.service.ts backend/src/services/pdf.service.backup-$TIMESTAMP.ts
cp backend/src/services/file.service.ts backend/src/services/file.service.backup-$TIMESTAMP.ts
cp backend/src/services/notification.service.ts backend/src/services/notification.service.backup-$TIMESTAMP.ts
cp backend/src/services/quote.service.ts backend/src/services/quote.service.backup-$TIMESTAMP.ts
cp backend/src/services/request.service.ts backend/src/services/request.service.backup-$TIMESTAMP.ts

echo ""
echo "✅ Backup completato!"
echo ""
echo "🗂️  File di backup creati:"
find backend/src -name "*backup-$TIMESTAMP*" | sort
